# ROTA-OS × Portaria GM/MS 11.165/2026 · desenho da integração (etapa 1: banco e API)

| | |
|---|---|
| **Data** | 16/10/2026 (relógio de Brasília) |
| **Base** | Especificação `samais-os/produtos/rota/portaria-11165.md` (matriz M01…M25, regras RE/RC, lacunas L1…L14) · módulo `regras/portaria-11165.mjs` · casos `testes/casos/portaria-11165-casos.json` |
| **Escopo** | Etapa 1: modelo de dados, banco e API. A etapa 2 (console `rota-app.html`) liga a tela ao que está aqui (§8) |
| **Autorização** | Ota: "desenhar a mudança e fazer ela, todos os ajustes" |
| **Uso** | Interno Samais. Especificação de produto, não peça |

Procedência: **✓** lido no texto oficial · **≈** derivado, com a regra declarada · **○** a levantar.

---

## 1 · O que muda, em uma tela

```
Regulação / serviço           ROTA-OS (gestor local)                        Faturamento do ente
───────────────────           ──────────────────────                        ───────────────────
agenda e confirma  ─────────▶ agendamento confirmado (art. 13 §3º)
                              elegibilidade em 3 estados (módulo = banco)
                              programação · prancheta · baixa
                              pré-BPA-I da competência (CSV, SEM CPF) ────▶ completa o CPF (CADSUS)
                                                                            envia ao SIA (BPA Magnético)
                              remessa informada (linhas, data, setor) ◀──── informa o que enviou
                              farol por competência (art. 21 §2º)
```

Antes desta etapa, o banco e a tela decidiam a elegibilidade pela distância **da base ao destino** e mediam o risco
de suspensão em **dias sem baixa interna**. A norma mede **do município de residência ao município sede do serviço**,
exige ente diverso, hemodiálise na mesma UF e agendamento confirmado ✓, e conta **competências sem registro BPA-I
enviado ao SIA** ✓ (11.165 art. 21 §2º). A etapa 1 troca as duas réguas no banco e na API.

---

## 2 · Decisões

| # | Decisão | Por quê |
|---|---|---|
| D1 | **O ROTA-OS não guarda CPF** (Ota, 16/10/2026, opção 1 da especificação §5). Nenhuma coluna, campo de API, log ou exportação com CPF. A pré-remessa sai com a coluna do CPF **vazia**, rotulada "a completar pelo faturamento do ente" | O BPA-I exige CPF ✓ (SIGTAP, "Obrigatório CPF"), mas quem envia ao SIA é o faturamento do ente, que tem o CADSUS. A Samais não precisa do dado para operar |
| D2 | **Fonte única das regras: `regras/portaria-11165.mjs`.** A API importa o módulo. O banco espelha só a elegibilidade federal (`elegibilidade_federal`), com **teste de paridade** | Regra duplicada sem teste diverge em silêncio. A elegibilidade fica também no banco porque a view de deslocamentos e o relatório dependem dela |
| D3 | **Farol de produção por competência**, calculado por `farolProducao` sobre as **remessas informadas pelo faturamento** | Quem envia é o faturamento; o ROTA registra o que foi enviado. Dias sem baixa interna passam a informação operacional |
| D4 | **Pré-BPA-I em CSV** (UTF-8, `;`), uma linha por paciente-deslocamento elegível e financiável. **O leiaute oficial do BPA Magnético é lacuna (L1)**: não se inventa largura fixa | Sem o `Layout_Exportacao_BPA.pdf` não há arquivo oficial. O CSV é o insumo de conferência do faturamento |
| D5 | **Pactuação da base em tabela própria** (`base_pactuacao`, 1:1 com `bases`), não em colunas de `bases` | `bases` só tem política de leitura; abrir `UPDATE` nela deixaria o gestor mexer em custo/km, retenção e contratante. A tabela nova tem RLS forçada e política própria |
| D6 | **Distância em tabela por base** (`distancias_municipais`, com fonte e data de leitura). `km` nulo = a levantar | A matriz oficial é lacuna (L5); cada base registra o que leu e de onde. A busca é **na direção residência → serviço**, sem inverter o par |
| D7 | **Competência sem informação não vira zero.** A remessa só conta como "sem registro" quando o faturamento informou **zero linhas**. Mês sem remessa informada entra como `null` e o farol fica `a_conferir` | Princípio da Realidade; é a convenção do módulo (RC-05) |
| D8 | **Paridade também em execução**: na exportação, a API calcula pelo módulo e compara com a coluna `elegibilidade` da view. Divergência tira a linha do arquivo e entra no relatório como `divergencia_modulo_banco` | O teste de paridade cobre a função; a guarda cobre a fiação (dados de entrada iguais nos dois lados) |
| D9 | **Datas do banco chegam à API como texto `AAAA-MM-DD`** (parser do tipo `date` no `pg`), e "hoje" vem do relógio de Brasília (`api/relogio.mjs`) ou do parâmetro `?hoje=` | Nunca `toISOString().slice(0,10)`: das 21h à meia-noite de Brasília o UTC já é amanhã |
| D10 | **A assinatura antiga `elegivel_federal(tratamento, km)` vira lápide** que levanta exceção, em vez de ser apagada | A 0003 a nomeia no `GRANT`; apagar quebraria a cadeia 0001…0004 rodada de novo. A lápide recusa uso e o CI cobra a recusa |

---

## 3 · Modelo de dados novo (migração `0004_portaria_11165.sql`)

Idempotente como 0001–0003: `if not exists`, `create or replace`, `drop policy if exists`. Aplicar depois da 0003.
Toda tabela nova tem `base_id`, RLS **ligada e forçada**, política `base_id = minha_base()` e entra na conferência
`verificar_isolamento()`. Toda escrita da API grava em `auditoria` na mesma transação (cadeia de hash da 0001).

### 3.1 · Paciente — `pacientes` (colunas novas)

| Coluna | Tipo | Regra | Proc. |
|---|---|---|---|
| `municipio_residencia_ibge` | `char(7)`, 7 dígitos | RE-02, RE-03 (origem da distância), RC-12 | ✓ 11.165 arts. 1º §1º, 15, 16 |
| `uf_residencia` | `char(2)` | RE-05 (hemodiálise na mesma UF) | ✓ 11.164 art. 23 caput |

Nulo = a levantar → elegibilidade **pendente**. **Sem CPF** (D1). `municipio` (texto livre) continua só como rótulo.

### 3.2 · Serviço de referência — `destinos` (colunas novas)

| Coluna | Tipo | Regra | Proc. |
|---|---|---|---|
| `municipio_ibge` | `char(7)` | município sede do serviço: destino da distância, RE-02 | ✓ |
| `uf` (já existia) | `char(2)` | RE-05 | ✓ |
| `cnes` | `char(7)` | identificação do serviço | ✓ |
| `habilitacao_conferida` | `boolean`, nulo = não conferida | RE-06 (nulo → pendente; falso → inelegível) | ✓ / ≈ |
| `habilitacao_codigo` | `text` | ex.: 15.04 na hemodiálise | ✓ art. 16 I |
| `modalidades` | `tratamento_tipo[]` | informativo (o que o serviço atende); não decide regra | ≈ |

`destinos.km` (base → destino) **deixa de decidir elegibilidade**. Fica como quilometragem operacional da rota.

### 3.3 · Distâncias — `distancias_municipais` (nova)

`(base_id, origem_ibge, destino_ibge)` chave · `km numeric` (**nulo = a levantar**) · `fonte` · `lido_em`.
Restrição: km preenchido exige fonte e data de leitura. Nunca se estima; nunca se usa o par invertido. Lacuna L5.

### 3.4 · Agendamento confirmado — `agendamentos` (nova)

`(paciente_id, destino_id, data)` único · `confirmado boolean` (**nulo = sem resposta do serviço → pendente**;
falso → inelegível ao transporte da portaria) · `etapa ∈ {planejamento, tratamento}` (radioterapia, art. 15
parágrafo único) · `protocolo`. RE-07, 11.165 art. 13 §3º ✓.

### 3.5 · Veículo — `veiculos` (colunas novas)

| Coluna | Usada em | Proc. |
|---|---|---|
| `doado_ms` (nulo = a conferir), `termo_doacao_ref`, `finalidade_doacao ∈ {radioterapia, hemodialise, outros}` | `veiculoElegivelIncentivo` (RC-01) | ✓ art. 14 p.ú.; NT 153 |
| `data_recebimento`, `cnes_estabelecimento`, `cnes_inscrito_em` | `prazoCNES` (RC-02) | ✓ art. 11 III; SAES 4.904 |
| `prorrogacao`, `primeira_viagem_concluida` | `prazoOperacao` (RC-03) | ✓ art. 10 §3º |
| `emplacado_em`, `disponibilidade_12m` (0 a 1), `laudo` (+ `hodometro`, que já existia) | `renovacao` (RC-09) | ✓ art. 12 |

`primeira_viagem_concluida` vazia é lida da primeira baixa do veículo a partir do recebimento (≈); a API diz de onde
veio (`primeiraViagemFonte`). `cnes_prazo`
(digitado) fica só por compatibilidade: o prazo passa a ser **calculado** do recebimento.

### 3.6 · Pactuação da base — `base_pactuacao` (nova, 1:1 com `bases`, D5)

`deliberacao_cib` (referência; nula = a levantar), `deliberacao_cib_data`, `estrutura_gestao_registrada`,
`municipios_abrangidos char(7)[]`, `inicio_incentivo` (primeiro dia da competência). Usada em `baseAptaIncentivo`
(RC-04), `municipioAbrangido` (RC-12) e `farolProducao` (RC-06). ✓ art. 14 p.ú. I a III; art. 25, 4º item, b.

### 3.7 · Remessas BPA-I — `remessas_bpa` (nova, D3)

`(base_id, competencia)` único · `linhas_enviadas int` (**nulo = sem informação**, nunca zero) · `enviada_em` (exigida
quando há linha) · `informado_por` (setor ou instituição, ex.: "faturamento da SMS"; nunca CPF) · `gestor_id` ·
`registrado_em`. RC-05 e RC-06, art. 21 §§1º e 2º ✓.

### 3.8 · Elegibilidade no banco e a view `deslocamentos`

- `elegibilidade_federal(modalidade, residencia_ibge, residencia_uf, servico_ibge, servico_uf, habilitacao_conferida,
  distancia_km, agendamento_confirmado) → (status, regras_violadas[], pendencias[])` — espelho de `elegibilidade11165`,
  mesma ordem de regras, mesmos três estados.
- `elegivel_federal(...)` (mesmos argumentos) `→ boolean` = `status = 'elegivel'`. A assinatura antiga
  `elegivel_federal(tratamento, km)` sai: decidia pela distância errada.
- `deslocamentos` (recriada, `security_invoker`): uma linha por paciente por viagem, agora com as **entradas** da regra
  (residência, serviço, distância municipal, agendamento do dia, etapa) e a **saída** (`elegibilidade`,
  `regras_violadas`, `pendencias`, `elegivel`), além de `comprovado`, presenças, assentos e lotação.
- `verificar_sem_cpf()` lista qualquer coluna do esquema `public` com "cpf" no nome. O CI exige lista vazia e a API
  não sobe se ela vier preenchida.

---

## 4 · Fluxo do faturamento

1. **ROTA gera a pré-remessa** da competência: `GET /api/bpa-i/AAAA-MM.csv`. Entra uma linha por paciente-deslocamento
   **elegível** (módulo = banco), **comprovado** (ida e volta conferidas na baixa), **financiável** (RE-09: até 3 por
   semana na hemodiálise; RE-11: 1 planejamento e 1 tratamento por paciente na radioterapia, contados na competência ≈),
   **do território da base** (RC-12 "fora" sai; "a conferir" fica com aviso) e com **linha válida** (RE-12, RE-13,
   RE-15 do `validarLinhaBPAI`).
2. **Ficam de fora**, contados por motivo no relatório (`GET /api/bpa-i/AAAA-MM`): inelegíveis e pendentes (com a regra),
   não comprovados, excedentes, etapa da radioterapia não informada, sem CNES do estabelecimento executante, fora dos
   municípios abrangidos, linha inválida e divergência módulo × banco.
3. **O faturamento do ente completa o CPF** no próprio sistema (CADSUS) e envia ao SIA no BPA Magnético.
4. **O gestor informa a remessa** no ROTA: `POST /api/remessas-bpa` (competência, linhas enviadas, data, setor que
   informou). Zero linhas se informa como 0; competência não informada fica nula.
5. **Farol por competência**: `GET /api/farol-producao` aplica `farolProducao` sobre as competências fechadas desde o
   início do incentivo, preenchendo com nulo o que não foi informado. Aparece como aplicável só quando a base está apta
   (RC-04).

**Colunas do CSV** (cabeçalho fixo, nesta ordem): `competencia` · `cnes_estabelecimento_executante` (CNES onde o veículo
está inscrito; L10) · `procedimento_sigtap` (08.03.01.015-0 ou 08.03.01.016-8) · `cns_paciente` (só dígitos) ·
`cpf (a completar pelo faturamento do ente)` (sempre vazia) · `municipio_residencia_ibge` · `data_deslocamento` ·
`quantidade` (1 por ida e volta, ≈ L2) · `modalidade` · `viagem`. Sem nome do paciente (minimização). Cada geração entra
na auditoria com a competência e as contagens, sem dado pessoal.

> **TODO (L1):** quando o `Layout_Exportacao_BPA.pdf` vigente for obtido e versionado em `docs/`, escrever o gerador do
> arquivo de largura fixa a partir destas mesmas linhas, com teste contra o leiaute. Até lá, o CSV é insumo de
> conferência, não arquivo de importação.

---

## 5 · API nova (`api/servidor.mjs`)

Mesmo padrão: sessão obrigatória, transação com `set_config` do gestor, RLS decide a base, auditoria na mesma
transação, erro do banco não vai ao cliente. Validação de formato devolve 422. **Qualquer chave com "cpf" no corpo ou
na consulta, em qualquer caixa e em qualquer profundidade, devolve 400** antes de tudo, inclusive no login.

| Método e caminho | O que faz |
|---|---|
| `GET /api/carregar[?hoje=]` | como antes, mais: paciente `munIbge`, `ufRes`, `elegibilidade` (módulo, com o próximo agendamento a partir de hoje); destino `ibge`, `uf`, `cnes`, `habilitacaoConferida`, `habilitacaoCodigo`, `modalidades`; veículo os campos da doação e `portaria` (incentivo, CNES, operação, renovação); `config.pactuacao`, `config.baseApta`, `config.hoje` |
| `POST /api/pacientes` | aceita `munIbge` e `ufRes` |
| `PUT /api/destinos/:id/servico` | município sede, UF, CNES, habilitação, modalidades (parcial) |
| `GET` / `PUT /api/distancias` | lista; grava um par origem → destino (km nulo = a levantar) |
| `GET /api/agendamentos?de=&ate=` · `POST /api/agendamentos` | lista do período; grava ou corrige (paciente, destino, data) |
| `PUT /api/veiculos/:ident/portaria` | campos da doação e da renovação, e o hodômetro (parcial); devolve o veículo com `portaria` e `primeiraViagemFonte` (`registrada` ou `primeira_baixa`) |
| `PUT /api/base/pactuacao` | CIB, estrutura de gestão, municípios abrangidos, início do incentivo |
| `GET` / `POST /api/remessas-bpa` | lista; informa a remessa de uma competência |
| `GET /api/farol-producao[?hoje=]` | farol por competência + base apta + dias sem baixa (operacional) |
| `GET /api/conformidade[?hoje=]` | painel da base: `baseAptaIncentivo` e, por veículo, incentivo, prazos CNES e operação, renovação |
| `GET /api/bpa-i/AAAA-MM` | relatório de conferência da pré-remessa (linhas, fora por motivo, avisos) |
| `GET /api/bpa-i/AAAA-MM.csv` | a pré-remessa em CSV, com `Content-Disposition` nomeado por base e competência |

O núcleo que não depende de banco (montar competências, farol da base, seleção e CSV da pré-remessa, painel de
conformidade, recusa de CPF) é a **costura**: funções puras testadas sem banco (`testes/integracao-11165.test.mjs`).
Desde a etapa 2 mora em `regras/integracao-11165.mjs` (o console carrega o mesmo código no navegador; `api/` não é
estático no Vercel) e `api/integracao-11165.mjs` só a reexporta — o teste cobra que é a mesma função.

---

## 6 · Paridade módulo × SQL

`testes/paridade-elegibilidade.e2e.mjs` roda, contra o banco migrado:

1. os 19 casos do grupo de elegibilidade do JSON na função SQL e no módulo: mesmo `status`, mesmas `regras_violadas`,
   mesmas `pendencias`, e o status igual ao `esperado` do caso;
2. a grade completa das combinações de fronteira (km nulo, 49,9, 50, 50,1, 500, 500,1; três modalidades; mesmo
   município, município diverso e município ausente; mesma UF, UF diversa e UF ausente; habilitação e agendamento em
   verdadeiro, falso e nulo), comparando os dois lados.

Em execução vale a guarda D8.

---

## 7 · RN-05 e RN-08, como ficam

- **RN-05 (elegibilidade).** No banco e na API: regra da norma, em três estados, do município de residência ao município
  sede do serviço. No console (etapa 2), a tela passa a mostrar o `elegibilidade` que vem da API.
- **RN-08 (farol).** No banco e na API: competências sem remessa BPA-I (3 suspendem, 6 excluem; alerta no 2º mês ≈).
  `bases.janela_suspensao_dias` e os dias sem baixa ficam só como informação operacional.

---

## 8 · O que a etapa 2 (console) liga — **ligado em 16/10/2026**

Registro de execução e RED/GREEN: `docs/ANDAMENTO-11165.md`, "Etapa 2".

0. **Regras no console sem cópia.** ✓ `rota-app.html` carrega `regras/portaria-11165.mjs` e
   `regras/integracao-11165.mjs` por `import()` dinâmico (CSP `script-src 'self'`); o login espera os módulos e, se
   não carregarem, diz por quê (não presume elegibilidade). Nos testes, os módulos entram pelo contexto da VM.
1. **Seed.** ✓ Campos novos com identificadores sintéticos (IBGE 99220xx, CNES 99900xx, CIB/termo/protocolo DEMO),
   distâncias rotuladas "demonstração" (não são a matriz oficial, L5), agendamentos da semana e remessas jul–ago/2026
   (setembro sem informação: farol "a conferir"). A semana-demo passou a 12–16/out/2026 para haver competências
   fechadas desde o início do incentivo (jul/2026). Nenhum CPF.
2. **Elegibilidade.** ✓ `elegivelFederal(p)` saiu; a tela usa `p.elegibilidade` (três estados) com regras violadas e
   pendências legíveis na lista e na ficha. Na demonstração a FonteSeed calcula pelo módulo, com o próximo agendamento
   a partir de hoje (como a API). Distância de município a município; sem par = pendente.
3. **Farol.** ✓ `farolRepasse()`/`diasSemRegistro()` saíram; farol por competência da fonte (`/api/farol-producao`;
   na demonstração, `farolDaBase` da costura sobre as remessas do seed), "não aplicável a este contrato" quando a base
   não está apta. Dias sem baixa viraram linha "Operacional · … baixa interna não comprova produção".
4. **Telas.** ✓ Ficha do paciente (elegibilidade + agendamentos confirmados + registrar agendamento); ficha e edição
   da doação do veículo com os prazos do módulo; Conformidade (pactuação editável, farol, veículos, serviços de
   referência, distâncias); Faturamento BPA-I (pré-BPA-I da competência com o que ficou de fora por motivo e avisos,
   botão que baixa o CSV; remessas informadas e "informar remessa"). Tudo por delegação `data-act`.
   **Pré-BPA-I na demonstração:** gerado no navegador a partir das baixas da sessão pelo **mesmo** `preRemessaBPAI` e
   `csvPreBPAI` da API; nome `pre-bpa-i_<municipio>-<uf>_demonstracao_<AAAA-MM>.csv`.
5. **FonteSeed/FonteAPI.** ✓ `agendamentos`, `salvarAgendamento`, `distancias`, `salvarDistancia`, `salvarServico`,
   `salvarVeiculoPortaria`, `salvarPactuacao`, `remessas`, `salvarRemessa`, `farolProducao`, `conformidade`, `preBpaI`,
   `preBpaICsv` nas duas, cobertos em `testes/fonte-api.test.mjs` (endpoint, corpo e formato de retorno). As duas recusam
   corpo com chave de CPF antes de sair. Escritas da norma recarregam só os campos da norma nos mesmos objetos da sessão.
6. **Textos.** ✓ Alertas, painéis e relatório citam 11.164 + 11.165 (teste cobra a ausência de 11.179); relatório
   mensal segue sem dado nominal.

**Fica para depois:** ligar o login à FonteAPI (Fase 2, item 3.5: hoje o console abre só em demonstração); cadastro
de paciente gravando de verdade (continua "demo"); escolher a competência fechada anterior como padrão do pré-BPA-I
quando a API estiver ligada (hoje o padrão é a competência corrente, parcial).

## 9 · Lacunas (○) que esta etapa não fecha

| # | Lacuna | Como fica no sistema |
|---|---|---|
| L1 | Leiaute oficial do BPA Magnético | CSV nomeado + TODO (§4); nenhum arquivo de largura fixa inventado |
| L2 | Unidade da "quantidade" no BPA-I | quantidade 1 por ida e volta (≈); RE-13 continua bloqueando > 12 |
| L3 | Acompanhante gera linha no BPA-I? | a pré-remessa não gera linha de acompanhante |
| L4 | Linhas por paciente na radioterapia | 1 planejamento e 1 tratamento por paciente **na competência** (≈) |
| L5 | Matriz oficial de distâncias | `distancias_municipais` com fonte e data; nulo = pendente |
| L10 | Qual CNES é o "estabelecimento" da remessa | `cnes_estabelecimento` do veículo; sem ele, a linha sai do arquivo com motivo |
| M20 | Itinerário pactuado (art. 26) | não modelado; o registro do art. 27 (RC-08) não bloqueia a pré-remessa e aparece como aviso |
| — | Portaria de suspensão do custeio (art. 12 §2º) | não modelada; `renovacao` recebe `base_suspensa` indefinido |

---

*Onde gestão se mede em vidas.*
