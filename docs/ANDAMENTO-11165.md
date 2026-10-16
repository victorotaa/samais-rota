# Andamento · adequação do ROTA-OS à Portaria GM/MS 11.165/2026 (etapa 1: desenho, banco e API)

Arquivo de retomada. Se o contexto acabar, quem continua lê daqui. Branch `claude/charming-cannon-hvmlc8`.
Commit e push ficam com o coordenador. O console (`rota-app.html`) é a etapa 2 e não se toca aqui.

## Fase 0 · base verde antes de mudar (16/10/2026)

PostgreSQL 16 local (`pg_ctlcluster 16 main start`, senha do `postgres` = `rota`, só nesta máquina). Sequência
do job "banco" reproduzida num script de rascunho (schema → 0001…0003 → `assercoes.sql` → `login.e2e` → `api.e2e`).

| Conjunto | Resultado |
|---|---|
| `supabase/testes/assercoes.sql` | 9 grupos ok |
| `testes/login.e2e.mjs` | 38 ok |
| `testes/api.e2e.mjs` | 50 ok |
| `npm run verificar` (CSP + regras 30 + portaria 113 + auth 71 + fonte-api 28) | verde |

## Decisões dadas (não reabrir)

1. CPF em lugar nenhum; a exportação sai com a coluna vazia, "a completar pelo faturamento do ente"; API recusa
   chave `cpf` (400); banco com asserção de nenhuma coluna `*cpf*`.
2. Fonte única das regras: `regras/portaria-11165.mjs`; o banco espelha só a elegibilidade federal; teste de paridade.
3. Farol por competência sobre as remessas BPA-I informadas pelo faturamento; dias sem baixa vira informação operacional.
4. Exportação pré-BPA-I em CSV (`;`, UTF-8), sem leiaute oficial (lacuna, TODO).
5. Migração 0004 idempotente, RLS por contrato, auditoria encadeada.
6. API: endpoints novos + `/api/carregar` com os campos novos.
7. Contrato do console: atualizar teste e contrato, sem tocar no `rota-app.html`.

## Fases

- [x] Fase 0 · base verde
- [x] Fase 1 · desenho (`docs/PORTARIA-11165-INTEGRACAO.md`)
- [x] Fase 2 · banco: asserções RED → 0004 → GREEN
- [x] Fase 3 · paridade módulo × SQL
- [x] Fase 4 · funções puras da integração (testes sem banco)
- [x] Fase 5 · API e e2e
- [x] Fase 6 · CI, ROTA-SPEC, contrato do console, verificação final

## Fase 2 · banco (feito)

- RED 1: `assercoes.sql` grupo 1 reescrito para a assinatura nova → `function elegivel_federal(unknown, …) does not exist`.
- RED 2: `assercoes_11165.sql` (novo) → `function verificar_sem_cpf() does not exist`.
- `0004_portaria_11165.sql` escrita. GREEN: `assercoes.sql` 9 grupos, `assercoes_11165.sql` 7 grupos.
- Falha minha no meio: fixture do paciente de Caicó com agendamento `true` em vez de nulo; corrigida a fixture, não a regra.
- Achado: rodar a 0003 de novo depois da 0004 quebrava (o GRANT da 0003 nomeia `elegivel_federal(tratamento_tipo, numeric)`).
  Decisão: a assinatura antiga vira **lápide** que levanta exceção ("aposentada na 0004"), em vez de `drop`. A cadeia
  0001…0004 roda duas vezes seguidas sem erro (conferido). Asserção nova cobra que a lápide recusa.
- `schema.sql`: cabeçalho com a ordem das migrações; aviso no `elegivel_federal` antigo e na `janela_suspensao_dias`.
- `supabase/testes/rls_e_auditoria.sql` (demonstração, fora do CI): cabeçalho aplica todas as migrações; fixtures da
  norma; a view mostra `distancia_km`, `elegibilidade`, `pendencias`. Conferido num banco limpo: elegíveis 1 / 1.

## Fase 3 · paridade (feito)

- `testes/paridade-elegibilidade.e2e.mjs`: 19 casos do JSON + grade de 5.184 combinações de fronteira, módulo × SQL,
  numa consulta só (`jsonb_to_recordset`).
- RED por sabotagem: 0004 com `< 50` no lugar de `<= 50` → EL-02 e a grade acusaram (2 falhas). Restaurada → 21 ok.

## Fase 4 · núcleo puro da integração (feito)

- `api/relogio.mjs` (`hojeBrasilia`, Intl em America/Sao_Paulo) e `api/integracao-11165.mjs` (CPF, competências, farol
  da base, pré-remessa, CSV, conformidade), sem banco.
- RED: `testes/integracao-11165.test.mjs` → `ERR_MODULE_NOT_FOUND`. GREEN: 44 ok.
- Mutação: tirar a guarda de divergência módulo × banco → 4 falhas. Restaurado.
- Decisões tomadas aqui (ver desenho §4 e §9): ordem do funil (elegível → comprovado → território → financiável → CNES
  executante → linha válida); RE-14 (CPF) e RC-08 (itinerário, M20) viram aviso; RC-12 "a conferir" não derruba linha;
  radioterapia conta planejamento/tratamento por paciente **na competência** (≈ L4); quantidade 1 por ida e volta (≈ L2).

## Fase 5 · API (feito)

- RED: seções novas em `testes/api.e2e.mjs` (CPF, dados da norma, pré-remessa, remessas e farol, conformidade,
  isolamento das rotas novas, trilha) → rotas 404 e campos ausentes; `TypeError` em `P1.elegibilidade`.
- GREEN: `api/servidor.mjs` com as rotas novas; `api/db.mjs` com `date` como texto, guarda de CPF na subida (exige a
  0004) e `resumir` que descarta chave com "cpf". API e2e: 50 → 122 ok.
- Mutação: desligar a recusa de CPF no servidor → 7 falhas (inclusive "nada foi gravado" e "nem auditado"). Restaurado.
- Duas asserções dependiam da ordem do uuid sorteado (ordem dos motivos, primeira linha do CSV): reescritas sem ordem.

## Fase 6 · fechamento (feito)

- CI (`.github/workflows/verificar.yml`): job front + `integracao-11165.test.mjs`; job banco + migração 0004,
  `assercoes_11165.sql` e `paridade-elegibilidade.e2e.mjs`. `package.json`: `test` e `test:banco` com os novos.
- `testes/fonte-api.test.mjs`: seção do contrato da Portaria (campos novos dentro das mesmas seis chaves; a FonteAPI
  passa tudo intacto). 28 → 35 ok.
- `docs/ROTA-SPEC.md`: decisão do CPF; RN-05 e RN-08 reescritas; §7 e aceite nº 4 apontam para o desenho.
  `docs/FASE2-BACKEND.md`: ponteiro na lista da API.

### Verificação final (16/10/2026)

| Conjunto | Resultado |
|---|---|
| `npm run verificar` | CSP 5/5 · regras 30 · portaria 113 · integração 45 · auth 71 · fonte-api 35 |
| banco limpo, sequência do CI | `assercoes.sql` 9 grupos · `assercoes_11165.sql` 7 grupos |
| `npm run test:banco` | login 38 · paridade 21 (19 casos + grade de 5.184) · API 122 |
| cadeia 0001…0004 rodada duas vezes | sem erro |

## Decisões tomadas além das dadas

1. Pactuação em tabela própria (`base_pactuacao`), não em `bases` (que não tem política de escrita).
2. Distância por base, só na direção residência → serviço; km exige fonte e data de leitura.
3. Lápide da assinatura antiga de `elegivel_federal` (D10 no desenho).
4. Competência não informada = nula ("a conferir"); zero só quando o faturamento informa zero.
5. Funil da pré-remessa e seus motivos; RE-14 e RC-08 como aviso; RC-12 "a conferir" não derruba linha.
6. Radioterapia: 1 planejamento + 1 tratamento por paciente **na competência** (≈ L4); quantidade 1 por ida e volta (≈ L2).
7. CNES executante = `cnes_estabelecimento` do veículo (L10); sem ele, a linha sai com motivo.
8. A conferência em JSON só conta (sem dado pessoal); o CSV é o único canal nominal e é auditado.
9. Elegibilidade do paciente na carga usa o próximo agendamento a partir de "hoje"; sem agendamento, pendente.
10. `?hoje=AAAA-MM-DD` nas leituras (simulação de datas); sem ele, relógio de Brasília.
11. `date` do Postgres como texto na API (fim do `toISOString` sobre datas).
12. A API não sobe sem a 0004 (precisa de `verificar_sem_cpf`).
13. `primeira_viagem_concluida` vazia = primeira baixa a partir do recebimento.

## O que falta (etapa 2, console) — ver desenho §8

Seed com os campos novos; elegibilidade em três estados na tela; farol por competência no lugar de
`farolRepasse()`/`diasSemRegistro()`; telas de agendamento, remessa, pactuação, doação do veículo e conformidade;
botão de pré-BPA-I; métodos novos nas duas fontes; textos citando 11.164 + 11.165.

---

# Etapa 2 · console (`rota-app.html`) ligado às regras e à API

Branch `claude/charming-cannon-hvmlc8`, a partir de `7f98931`. Commit e push com o coordenador.

## Fase 2.0 · base verde (16/10/2026)

`npm run verificar`: CSP 5/5 · regras 30 · portaria 113 · integração 45 · auth 71 · fonte-api 35.

## Plano (fatias TDD)

- [x] 2.1 · costura pura acessível ao navegador (`regras/integracao-11165.mjs`; `api/` reexporta)
- [x] 2.2 · norma injetada no console (navegador: `import()` dinâmico; testes: contexto da VM)
- [x] 2.3 · seed com os campos novos + elegibilidade em três estados (testes antigos reescritos)
- [x] 2.4 · farol por competência + dias sem baixa como informação operacional
- [x] 2.5 · conformidade da base, prazos do veículo, pactuação
- [x] 2.6 · FonteSeed e FonteAPI com os métodos novos (`fonte-api.test.mjs`)
- [x] 2.7 · pré-BPA-I na demonstração pelo mesmo código da costura
- [x] 2.8 · telas novas (padrão da casa, sem onclick inline) e textos 11.164 + 11.165
- [x] 2.9 · CSP, verificação visual (1440/390), banco limpo, docs

## Fase 2.1 · costura no navegador (feito)

- RED: `integracao-11165.test.mjs` cobra `regras/integracao-11165.mjs` sem `node:` e a identidade da função
  reexportada → `ERR_MODULE_NOT_FOUND`.
- `git mv api/integracao-11165.mjs regras/integracao-11165.mjs`; `api/integracao-11165.mjs` vira `export * from`.
  Motivo: o console precisa do MESMO código da pré-remessa na demonstração, e `api/` não é estático no Vercel
  (vira função). Mudança pequena na API, sem efeito de comportamento (o servidor importa igual). GREEN: 47 ok.

## Fases 2.2 a 2.7 · RED (16/10/2026)

- `testes/regras.test.mjs` reescrito (módulos entram pelo contexto da VM em `NORMA_11165`) → `TypeError: ROTA.norma
  is not a function`.
- `testes/fonte-api.test.mjs` com os métodos novos → "a FonteSeed tem todos os métodos do contrato" e "a FonteAPI
  também" falham listando os 13 métodos; `TypeError: f.agendamentos is not a function`.

## Fases 2.2 a 2.8 · GREEN (16/10/2026)

- `rota-app.html`: bloco NORMA (`ligarNorma`/`quandoNorma`; `import()` dinâmico de `./regras/portaria-11165.mjs` e
  `./regras/integracao-11165.mjs` em `iniciarUI`; o login espera as regras e, se não carregarem, diz por quê).
  `elegivelFederal` saiu; `p.elegibilidade` (três estados) vem da fonte. `farolRepasse`/`diasSemRegistro` saíram;
  farol por competência pela fonte, `diasSemBaixa` como linha operacional.
- Seed: semana-demo movida para 12–16/out/2026 (o farol precisa de competências fechadas desde o início do incentivo,
  jul/2026). Campos novos com códigos sintéticos (IBGE 99220xx, CNES 99900xx, CIB/termo/protocolo DEMO), distâncias
  rotuladas "demonstração", setembro sem remessa informada (farol "a conferir").
- FonteSeed/FonteAPI: 13 métodos novos; guarda de CPF nas duas (cliente recusa antes de sair).
- Telas: Conformidade (pactuação, farol, veículos, serviços, distâncias) e Faturamento BPA-I (pré-BPA-I com o que ficou
  de fora por motivo + download do CSV; remessas informadas); ficha do paciente com elegibilidade legível e
  agendamentos; ficha do veículo com doação e prazos; formulários de edição em modal (delegação `data-act`).
- `regras.test.mjs` 78 ok · `fonte-api.test.mjs` 70 ok · CSP reescrito (`npm run csp:write`) · nenhum `onclick=`.
- Um tropeço meu no meio: um recorte por cabeçalho ("PROGRAMAÇÃO" aparece duas vezes) duplicou um trecho do arquivo;
  removido o trecho duplicado e conferida a estrutura.
- Mutação (cada uma restaurada depois): distância da base no lugar da de município a município → 6 falhas;
  guarda de CPF desligada → 3 falhas; competência sem informação tratada como zero → 3 falhas.

## Fase 2.9 · verificação e fechamento (feito)

- Visual (Playwright, Chromium de /opt/pw-browsers, servidor estático com os cabeçalhos reais do `vercel.json`):
  1440 e 390 px, escuro e claro, painel, pacientes, conformidade, faturamento, frota, fichas de paciente e de veículo,
  relatório A4. Zero erro de JS, zero violação de CSP, `scrollWidth === clientWidth` em todas. Download do pré-BPA-I
  conferido (1 linha, CPF vazio); informar a remessa de set/2026 leva o farol de "A conferir" a "Em dia".
  Prints em `/tmp/claude-0/-home-user/43c922f0-59b5-55ea-8a71-d1c17e834063/scratchpad/rota-prints/` (fora do repo).
- Contraste: no tema claro os selos, o botão sólido, `--muted`/`--dim`, o mono dourado e o total do gráfico ficavam
  entre 2,5 e 4,3:1; tokens do tema claro do console ajustados. Medido depois: nada abaixo de 4,5:1 nos dois temas.
- Achado na verificação: o servidor de teste guardava o `vercel.json` velho e o script inline foi bloqueado — prova de
  que o CSP está valendo; `npm run csp:write` tem de rodar a cada mudança do script (já rodado).
- Comentário de cabeçalho de `regras/portaria-11165.mjs` atualizado (dizia que o console não estava ligado).

### Verificação final da etapa 2 (16/10/2026)

| Conjunto | Resultado |
|---|---|
| `npm run verificar` | CSP 5/5 em dia · regras 78 · portaria 113 · integração 47 · auth 71 · fonte-api 70 |
| `grep -n 'onclick=' -- *.html` | nada |
| banco limpo (schema + 0001…0004) | `assercoes.sql` 9 grupos · `assercoes_11165.sql` ok |
| `test:banco` | login 38 · paridade 21 · API 122 |

### Testes antigos reescritos (motivo no comentário de cada um em `testes/regras.test.mjs`)

1. "hemodiálise a 8 km NÃO é elegível" → inelegível por ente diverso (RE-02); os 8 km eram da base.
2. "radioterapia a 252 km é elegível" → elegível de município a município, com habilitação, agendamento, procedimento
   e faixa.
3. "quimioterapia a 252 km" e "consulta a 148 km" → inelegíveis pela modalidade (RE-01), não pela distância.
4. "acima de 500 km" (600 km em DESTINOS, base → destino) → 600 km de município a município (RE-04), mais: mudar o km
   da base não muda a elegibilidade; sem distância = pendente (RE-03).
5. "farol de suspensão (RN-08)" com `diasSemRegistro` (e data por `toISOString().slice`) → "dias sem baixa
   (informação operacional)" com `diasSemBaixa` e aritmética de calendário; farol por competência em seção nova.
6. Custo do período: datas da semana-demo nova (`datasDaSemana()`), com asserção de que há abastecimento na semana.

### Para o coordenador

- `git add api/integracao-11165.mjs` (o arquivo novo de reexportação; o `git mv` já está no índice).
