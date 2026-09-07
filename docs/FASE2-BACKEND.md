# ROTA — Fase 2 · backend

| | |
|---|---|
| **Base** | `docs/ROTA-SPEC.md` §7 e §9 · `docs/REVISAO-ROTA-APP.md` |
| **Estado** | Fundação entregue e verificada em PostgreSQL 16 · API e migração do front pendentes |
| **Uso** | Interno Samais |

---

## 0 · O que já está pronto

Três arquivos, aplicados e testados contra um PostgreSQL 16 real — não só escritos:

| Arquivo | O que é |
|---|---|
| `supabase/schema.sql` | 14 tabelas, 6 tipos enumerados, 2 views de derivação, RLS em todas as tabelas |
| `supabase/migrations/0001_auditoria_hash_chain.sql` | Auditoria append-only com cadeia de hash e função de verificação |
| `supabase/testes/rls_e_auditoria.sql` | A prova das duas garantias, reproduzível em um banco limpo |

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

### 3.1 · Camada de dados no front — o pré-requisito de tudo

Hoje o console lê `pacientes`, `veiculos`, `viagens` como variáveis globais. Antes de qualquer API, essas leituras precisam passar por um módulo único, com a mesma assinatura que a API terá. Com isso, trocar seed por rede vira mudança de uma implementação, não reescrita das telas.

É o item 17 do backlog da revisão — *separar derivação de render* — e continua sendo o maior débito estrutural do protótipo.

### 3.2 · API fina

Um endpoint por agregado, sempre abrindo a transação com o `set_config` do gestor. A API **não filtra por base**: quem filtra é o banco. Se um endpoint esquecer o `where`, o RLS segura.

Escrita mínima: pacientes, autorizações, veículos, abastecimentos, programação, baixa, emissão de documento. Toda escrita grava em `auditoria` na mesma transação.

### 3.3 · Autenticação com 2FA

E-mail e senha forte, segundo fator, sessão por base, log de acesso. O `gestores.auth_uid` já existe para o vínculo.

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
