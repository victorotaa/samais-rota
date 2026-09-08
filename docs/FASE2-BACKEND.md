# ROTA — Fase 2 · backend

| | |
|---|---|
| **Base** | `docs/ROTA-SPEC.md` §7 e §9 · `docs/REVISAO-ROTA-APP.md` |
| **Estado** | Fundação, camada de dados e testes entregues · API, autenticação e PDF pendentes de infraestrutura |
| **Uso** | Interno Samais |

---

## 0 · O que já está pronto

Três arquivos, aplicados e testados contra um PostgreSQL 16 real — não só escritos:

| Arquivo | O que é |
|---|---|
| `supabase/schema.sql` | 14 tabelas, 6 tipos enumerados, 2 views de derivação, RLS em todas as tabelas |
| `supabase/migrations/0001_auditoria_hash_chain.sql` | Auditoria append-only com cadeia de hash e função de verificação |
| `supabase/testes/rls_e_auditoria.sql` | A prova das duas garantias, reproduzível em um banco limpo |
| `supabase/testes/assercoes.sql` | As mesmas garantias em forma de `assert` — é o que o CI roda |

### O que a prova demonstra

**Isolamento por contrato.** Duas bases, dois gestores. O gestor de Floriano enxerga os 2 pacientes da sua base e **zero** da outra, mesmo consultando pelo id. Tentar gravar um paciente na base alheia devolve `new row violates row-level security policy`. O gestor de Caicó enxerga 1.

Isso atende o critério de aceite nº 1 da spec — *"verificado por RLS, não por filtro"*. Um erro de filtro na tela deixa de poder vazar paciente de outro município, porque o banco recusa antes.

**Auditoria à prova de adulteração.** Cada registro carrega o hash do anterior. `UPDATE` e `DELETE` são recusados com `auditoria é append-only`. E quando a adulteração é **forçada**, desligando o gatilho com privilégio de dono, a verificação da cadeia devolve o id da primeira linha alterada. Quem tem poder para editar não tem como esconder que editou.

---

## 1 · Decisões de arquitetura

### O isolamento vive no banco

`base_id` em toda tabela, RLS ligada em todas as 14, política por base. Tabelas de ligação (`viagem_pacientes`, `embarques`) não têm `base_id` — herdam o isolamento da viagem por `exists`.

### A identidade é portável

A spec deixa o provedor em aberto (Supabase, Neon, RDS-SP). Amarrar `gestores.id` a `auth.users` prenderia o schema ao Supabase, então o vínculo com o provedor fica em `gestores.auth_uid`, e quem é o gestor da requisição sai de `gestor_atual()`:

```sql
create or replace function gestor_atual() returns uuid
language sql stable as $$
  select nullif(current_setting('rota.gestor_id', true), '')::uuid
$$;
```

A API abre a transação com `select set_config('rota.gestor_id', '<uuid>', true)`. No Supabase, troca-se o corpo por `select id from gestores where auth_uid = auth.uid() and ativo`. **Uma função, uma linha, e o schema roda nos três provedores.**

### A unidade de comprovação é o paciente-deslocamento

A view `deslocamentos` emite **uma linha por paciente por viagem**, com `elegivel` (hemodiálise ou radioterapia, > 50 km e ≤ 500 km) e `comprovado` (embarque e reembarque conferidos). É dela que sai o relatório mensal.

A prova usa uma viagem mista — um paciente em radioterapia e um em quimioterapia, mesmo veículo, mesmos 252 km: **1 deslocamento elegível programado, 1 comprovado**. Pelo método antigo, a viagem inteira contaria. Era esse erro que inflava a comprovação e é o que suspende repasse em auditoria.

### Regra de negócio não decide por texto livre

`tratamento_tipo` e `necessidade_tipo` são enums. `elegivel_federal()` é função do banco, não regex na tela.

### Ocupação programada e realizada são coisas diferentes

A view `ocupacao_viagem` devolve as duas. Só a realizada vai ao relatório — a portaria pede o mecanismo de gestão de frota sobre quem de fato embarcou.

### Parâmetros de contrato são dados, não constantes

`bases.custo_km` e `bases.custo_km_fonte`: o custo por quilômetro é do contrato daquela base e fica visível ao gestor. `bases.janela_suspensao_dias` idem.

---

## 2 · Como aplicar

```bash
createdb rota
psql -d rota -v ON_ERROR_STOP=1 -f supabase/schema.sql
psql -d rota -v ON_ERROR_STOP=1 -f supabase/migrations/0001_auditoria_hash_chain.sql
psql -d rota -f supabase/testes/rls_e_auditoria.sql   # a prova
```

Em produção: **região Brasil**, sem exceção. Dado sensível de saúde, LGPD art. 11.

---

## 3 · O que vem a seguir, em ordem

### 3.1 · Camada de dados no front — ✅ **entregue**

O console não lê mais coleções soltas no carregamento. Existe um repositório, `Dados`, que delega a uma **fonte**:

```
carregar()                   -> {destinos, pacientes, veiculos, abastecimentos, lancamentos, config}
salvarPaciente(p)            -> paciente com id
salvarAbastecimento(a)       -> abastecimento com id
salvarBaixa(viagemId, dados) -> lançamento gravado
salvarProgramacao(viagens)   -> void
```

Hoje a fonte é `FonteSeed`, que serve de um objeto `SEED` — **dado, não código**. Amanhã é `FonteAPI`, com a mesma assinatura. Trocar a fonte é trocar uma implementação; as telas não mudam.

Duas consequências que importam:

- **O seed virou dado imutável.** `FonteSeed.carregar()` devolve cópia profunda; a sessão nunca escreve no seed. Verificado em teste.
- **O script carrega fora do navegador.** Toda a fiação de DOM foi para `iniciarUI()`, chamada só quando existe `document`. É o que torna as regras testáveis sem browser.

### 3.1-bis · Testes das regras — ✅ **entregue**

`testes/regras.test.mjs`, **30 asserções**, sem navegador e sem dependência: `node testes/regras.test.mjs`.

Cobre o que carrega risco regulatório — elegibilidade nos quatro cantos (8 km, 252 km, 600 km, tratamento não elegível), alocação por perfil e capacidade, quebra por lotação, estabilidade dos IDs sob inserção, os três estados do farol mais o caso sem registro nenhum, custo do período, ocupação programada × realizada, e o escape.

É a metade que faltava do item 17: as funções que decidem dinheiro público deixaram de depender de um browser para serem verificadas.

### 3.1-ter · Verificação automática — ✅ **entregue**

`.github/workflows/verificar.yml` roda em todo push e todo PR, em dois trabalhos:

**Front.** `node scripts/csp-hash.mjs` confere o hash de cada script inline contra o `vercel.json`; `node testes/regras.test.mjs` roda as 30 asserções; um `grep` recusa `onclick` inline reintroduzido.

**Banco.** Sobe um `postgres:16`, aplica schema e migração e roda `supabase/testes/assercoes.sql` — 8 grupos de asserção que **decidem**, ao contrário de `rls_e_auditoria.sql`, que demonstra e imprime. A suite foi validada por sabotagem: desligar a RLS de `pacientes`, afrouxar o teto de 500 km, remover o gatilho de imutabilidade e remover o encadeamento fazem o CI ficar vermelho, cada um com a mensagem certa.

#### O bug que essa conferência encontrou

O header de CSP vale para `/(.*)` — **todas** as páginas — mas carregava só o hash do `rota-app.html`. As outras quatro (`index`, `municipios`, `transporte`, `monitoramento`) têm script inline próprio e estavam com o **JavaScript recusado em produção**: menu, âncoras de navegação e o botão de play do vídeo da hero da página de pitch não funcionavam. Confirmado no Chromium com o header real, corrigido, e reconferido — zero recusas nas cinco páginas.

O `transporte.html` também tinha as três mídias do CloudFront bloqueadas por `img-src 'self' data:`. O host entrou em `img-src` e `media-src` como paliativo; o certo continua sendo trazer os arquivos para `assets/`, que daqui não dá (o egresso para o CloudFront é bloqueado).

**Quando a API entrar, `connect-src 'none'` precisa passar a apontar a origem dela** — hoje o valor é deliberado, porque o console não fala com ninguém.

### 3.2 · API fina

Um endpoint por agregado, sempre abrindo a transação com o `set_config` do gestor. A API **não filtra por base**: quem filtra é o banco. Se um endpoint esquecer o `where`, o RLS segura.

Escrita mínima: pacientes, autorizações, veículos, abastecimentos, programação, baixa, emissão de documento. Toda escrita grava em `auditoria` na mesma transação.

### 3.3 · Autenticação com 2FA — ✅ **entregue**

Nada aqui depende de provedor: `api/auth.mjs` é `node:crypto` puro — sem dependência, sem I/O, sem HTTP. Recebe dados, devolve decisão.

| Peça | Como é |
|---|---|
| Senha | scrypt N=2¹⁵, sal por hash, parâmetros gravados junto. `precisaRehash` permite subir o custo sem invalidar senha antiga |
| Força mínima | 12 caracteres, três classes, e recusa o previsível — repetição, sequência de teclado, e o que o contexto entrega (nome, e-mail, município) |
| Segundo fator | TOTP RFC 6238, janela de ±1 passo porque relógio de celular atrasa |
| Reuso | `gestores.totp_ultimo_passo` grava o passo do sucesso na mesma transação. Código visto por cima do ombro não entra nos 30 segundos seguintes |
| Recuperação | 8 códigos, só o `sha256` no banco, queimados na primeira uso |
| Sessão | 12 horas — uma jornada, não se herda o turno alheio. Token de 32 bytes vai ao cliente; **o banco guarda só o hash** |
| Tentativa | Atraso progressivo a partir da terceira falha, teto de 15 min. Cinco erros de digitação não podem tirar a gestora do sistema no dia do embarque |

#### Por que o login mora em funções `security definer`

Na hora de autenticar ainda **não existe sessão** — e portanto não existe base — para a RLS filtrar. Sem `auth_iniciar`, `auth_falhou`, `auth_entrou`, `auth_sessao`, `auth_sair` e `auth_trocar_senha`, ou se abre `gestores` inteira ao papel da aplicação, ou se inventa uma exceção na política. As duas saídas furam o isolamento.

Com elas, o papel `rota_app` **não lê hash de senha** — verificado em teste, com `permission denied`.

#### Retenção: o mecanismo é do código, o prazo é do contrato

`bases.retencao_meses` (padrão de partida 60) e `expurgar_acesso(base)`, que remove sessão morta e log de acesso vencido e **nunca toca em viagem, paciente ou auditoria** — descarte de prontuário é decisão de política, não rotina de limpeza. O item de go/no-go deixa de ser "construir o descarte" e passa a ser só o número.

#### O que prova isso

- `testes/auth.test.mjs` — **71 asserções**, incluindo os vetores oficiais da RFC 4226 (HOTP), RFC 6238 apêndice B (TOTP em SHA-1 e SHA-256) e RFC 4648 (base32). Não é auto-consistência: implementação errada de jeito coerente cairia nesses vetores.
- `testes/login.e2e.mjs` — **38 asserções** costurando os dois lados num Postgres real: reuso de código, bloqueio progressivo, sucesso zerando o contador, troca de senha derrubando sessão viva e poupando a atual, sessão de gestor desativado morrendo junto, log de e-mail inexistente sem base, expurgo. Validado por sabotagem — tirar a conferência de expiração ou deixar as sessões vivas na troca de senha deixa o teste vermelho.

### 3.4 · PDF no servidor

Manifesto, folha de embarque e relatório mensal, com numeração sequencial vinda de `proximo_documento(base, tipo)` e registro em `documentos`. Hoje a numeração não existe — o protótipo imprime pelo navegador.

### 3.5 · Migração do front

Trocar a implementação do módulo de dados. As telas não mudam.

---

## 4 · Go / no-go — o que ainda é decisão sua

| Item | Estado |
|---|---|
| Bloqueantes B1–B4 | ✅ corrigidos |
| Altos A1–A5 | ✅ corrigidos |
| M1 escape e M2 delegação | ✅ corrigidos |
| CSP ativa | ✅ |
| Modelo de dados revisto com a unidade paciente-deslocamento | ✅ neste schema |
| Trilha imutável | ✅ verificada |
| **Provedor e região Brasil confirmados** | ⬜ sua decisão |
| **Encarregado de dados nomeado** | ⬜ antes do primeiro dado real |
| **RIPD elaborado** | ⬜ na implantação |
| **Política de retenção e descarte** | ⬜ espelhando o descarte das pranchetas |

Os quatro em aberto não são técnicos, e nenhum deles pode ser resolvido por código.

---

## 5 · O que este schema deliberadamente não faz

- **Não guarda rastreio em tempo real.** Decisão de produto da spec; a conferência é no papel.
- **Não integra CADSUS.** Fase 3, e por credencial do ente público, nunca da Samais isolada.
- **Não tem perfil de coordenador central.** Um perfil, uma base por sessão.
- **Não criptografa campo a campo.** A criptografia em repouso é do provedor; se a diligência exigir cifra por coluna para CNS e nome, é decisão a tomar antes do primeiro dado real, porque muda as consultas.

---

*Onde gestão se mede em vidas.*
