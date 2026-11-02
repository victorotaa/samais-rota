---
name: samais-municipal-study
description: >
  Use quando a Samais Gestão em Saúde avalia um município, consórcio intermunicipal ou região como alvo comercial e
  precisa do estudo de caso e de precificação: "cidade alvo", "município alvo", "estudo de caso", "estudo de
  precificação", "varredura", "prospecção [cidade]", "oportunidade comercial [cidade/região]", ou uma cidade citada em
  contexto de negociação, para SAMU 192, UPA, hospital ou mão de obra. Vale também, como modo próprio, para TRANSPORTE
  SANITÁRIO eletivo e inter-hospitalar: "transporte sanitário [cidade]", "TSE", "TFD [cidade]", "ROTA", "rota alvo",
  "estudo de transporte", "transporte eletivo", "viabilidade de transporte", "frota de pacientes", "Caminhos da Saúde",
  "PAC Saúde", hemodiálise ou radioterapia fora do domicílio, veículo doado pelo Ministério da Saúde, pregão de
  transporte de pacientes. Também quando um estudo
  precisa de revisão de preço, de portão ou de registro da frente. Não use para um estado inteiro
  (samais-raio-x-estadual) nem para vídeo (samais-video).
license: Proprietária (Samais Gestão em Saúde, uso interno)
---
<!-- Espelho gerado de victorotaa/samais-os@66a6c61 em 2026-11-02 por scripts/sincronizar-skills.mjs. Não edite aqui: edite .claude/skills/samais-municipal-study/ no samais-os e sincronize. Os caminhos citados são do samais-os. -->

# Samais — Estudo de município, consórcio e transporte sanitário

Protocolo do estudo que antecede toda reunião ou manifestação formal: varredura, Custo Operacional construído, cenários,
comparativo com o gasto de hoje e três artefatos publicados por merge. **A doutrina decide; esta skill roteia.** Em
conflito, valem os não-negociáveis de `samais-os/CLAUDE.md`, `samais-os/doutrina/regras-completas.md`,
`samais-estudos/CLAUDE.md` e `samais-estudos/FORMULA-MESTRE.md`. A forma visual é da skill `samais-brand-guidelines`.
Unificada em 20/10/2026 (origem de cada parte: `references/HISTORICO.md`).

## Roteamento: leia só o arquivo da fase

| Para | Leia |
|---|---|
| Raio-x da UF, briefing, coletores, varredura, gasto pago (TCE ou portal do ente) e contratado (PNCP), editais pelo item, carga secundária, vínculo, decisores, rede | `references/fontes-e-coleta.md` |
| Frota disponível, equipe pela norma, custo construído, viatura-hora, faixa de 1,5 mi, normas e KPIs do SAMU | `references/calculo-custo-construido.md` |
| Cenário A × B, trio Mínimo/Base/Ampliada, comparativo de gasto, economia, custeio federal, score, diagnóstico | `references/cenarios-e-comparativo.md` |
| BDI decomposto, remuneração residual, gross-up, textos por linha, negociação, anexo de memória financeira | `references/composicao-e-anexo.md` |
| Markdown interno, estrutura e conteúdo da página cliente, atestados, CoPilot/ROTA-OS, imagens, conferências | `references/peca-cliente.md` |
| Transporte sanitário (eletivo, TFD, inter-hospitalar): norma 11.164 + 11.165, motor, repasse, farol, peça | `references/modo-transporte-sanitario.md` |
| Transporte: demanda por parâmetro, km por ciclo, tipo A só com demanda medida (sem apoio por padrão), modelo de pagamento, viabilidade interna, citação da norma | `references/transporte-demanda-e-viabilidade.md` |
| Checklist do portão, portão, publicação, conferência no ar, entrega, registro da frente | `references/portao-publicacao-entrega.md` |
| Análise de edital (habilitação, cláusulas, red flags) | `references/checklist-licitacao.md` |
| De onde veio cada regra e o que foi descartado | `references/HISTORICO.md` |

## Entradas (FASE 1: qualificação)

Confirme ou extraia do contexto; **se faltar 1, 2 ou 3, pergunte antes de pesquisar** (nada de pesquisa cega):

1. **Alvo:** município, lista de municípios, consórcio (nome exato, CNPJ, UFs) ou região.
2. **Serviço:** SAMU 192 · transporte sanitário (eletivo e inter-hospitalar) · UPA · hospital · mão de obra.
   **Transporte sanitário é objeto e contrato próprios**, nunca rubrica do SAMU: com os dois, são **dois estudos**.
3. **Gatilho:** edital publicado ou iminente, contato espontâneo, indicação, formação de consórcio, renovação, veículo
   federal recebido, cobrança do MP ou do TCE.
4. **Operador atual:** Samais, concorrente, gestão própria do ente, OS, fundação, ninguém.
5. **Sede da central** (consórcio) e, no transporte, **qual frente** e se há **frota doada** pelo Ministério.
6. **Modelo pretendido:** regra do CEO, nunca assumir; com OS/OSC, perguntar o caminho antes de precificar.

## Os três artefatos (repositório `samais-estudos`)

| # | Artefato | Caminho | Quem vê |
|---|---|---|---|
| 1 | **Markdown interno**: o cálculo completo | `estudos-internos/<slug>.md` | casa |
| 2 | **Página cliente** + cartão na home | `estudos/<slug>.html` + `index.html` | ente (só entre interessados) |
| 3 | **Anexo de memória financeira** | `anexos/<slug>-memoria-financeira.html` | diretoria; **nunca publicado** |

`<slug>` = `<municipio>-<uf>` (transporte: `<municipio>-<uf>-transporte-sanitario`). Referências vivas:
`estudos-internos/osasco-sp.md` (estrutura), `itapevi-sp.md` §7.2 (comparativo), `estudos/assis-civap-sp.html` (página, padrão ouro de 23/10/2026), `estudos/sao-roque-sp.html` (gasto atual no corpo, 29/10/2026; Assis é anterior a essa regra),
`anexos/canoas-rs-memoria-financeira.html` (anexo), `estudos-internos/belem-pa-transporte-sanitario.md` (transporte).

## As fases

### FASE 0 — Olhar antes de pesquisar

- UF com raio-x (`samais-os/inteligencia/raio-x.json`)? Comece por `samais-os/inteligencia/<pasta>/`; releia no CNES as
  unidades do alvo (o raio-x é foto datada). O ≈ do raio-x continua ≈.
- Briefing respondido? `node scripts/briefing-dossie.mjs <slug> --stdout` (samais-os). Sem briefing, siga e **mande o
  levantamento** em paralelo; as 15 perguntas `essencial` travam o cálculo.
- Detalhe: `references/fontes-e-coleta.md` §1–2.

### FASE 2 — Varredura (fonte e data em cada bloco)

- **API antes da busca web:** `coletar-dados.mjs`, `coletar-cenario-a-tce.mjs` (SP), `coletar-cenario-a-nucleogov.mjs`
  (GO), `conferir-dados.mjs` (samais-estudos).
- **Gasto de hoje pelo TCE estadual (pago, nunca empenhado)** e contratos lidos **pelo objeto**: gestão própria, mista ou
  terceirizada; pagamento recente é o que diz se o contrato está vivo.
  - **Pago por rubrica:** hora extra, temporários, sentenças trabalhistas.
  - **Consórcio:** o rateio se mede do lado de quem paga.
- **Gestão lida, cadastro não é gestão** (Ota, 20/10/2026):
  - leia o instrumento, o pago, os sinais (greve, inadimplência, TAC, MP) e os decisores;
  - onde o CNES diverge, vale o lido;
  - na UF com raio-x, comece por `gestao-lida.json` e `sinais-lidos.json`.
- **Editais publicados pelo item** do PNCP: unidade com unidade, escopo com escopo.
- **Carga secundária** (transferência inter-hospitalar) em todo estudo de SAMU; sem dado, lacuna, nunca zero.
- **Vínculo** (quem administra, quem opera, link ao documento) e **decisores** com fonte, data e partido.
- Detalhe: `references/fontes-e-coleta.md` §3–10; transporte: `references/modo-transporte-sanitario.md` §3.

### FASE 3 — Cálculo e composição

- **Frota disponível do ente é o teto:** ativas no CNES (com ou sem equipe) + desativadas há até 18 meses por motivo que
  conta; opera até o máximo da norma; parada acima dele é reserva técnica; abaixo do mínimo é lacuna; nenhuma viatura nova.
- **Equipe pela norma** (PT 1.010/2012, FC 24/7 ≈ 4,5), nunca o quadro de hoje.
- **Custo Operacional construído** (`samais-os/doutrina/parametros-custo.json`, `scripts/raiox/lib/custo-construido.mjs`);
  também acima de ~1,5 mi hab. (a norma só confere, Ota 21/10/2026); R$ 5,20/hab só confere.
- **Cenário A × B** e o trio **Mínimo / Base ★ / Ampliada**; comparativo de **gasto** de hoje × Custo Operacional.
- **Gasto atual no corpo da página** (Ota, 29/10/2026): pago com selo, fonte e data; o que não se separa em ○ com o caminho de leitura; sem economia declarada enquanto não fecha. O PNCP só dá o contratado; o pago vem do TCE ou do portal do ente.
- **Preço e composição** (BDI, remuneração residual ≥ ~5%) só nos artefatos 1 e 3.
- Detalhe: `references/calculo-custo-construido.md`, `cenarios-e-comparativo.md`, `composicao-e-anexo.md`.

### FASE 4 — Escrever os artefatos

Antes de qualquer código: `samais-estudos/CLAUDE.md`, `FORMULA-MESTRE.md`, `referencias/apresentacao-html.md`,
`referencias/anexo-composicao-preco.md`, a skill `samais-brand-guidelines` e `samais-os/atestados/ARGUMENTOS.md`.

- Página **resumida**: título = conclusão com o número; um dado por bloco; sem teto de palavras, teste do decisor (Ota, 28/10/2026).
- **Padrão ouro: `estudos/assis-civap-sp.html`** (Ota, 23/10/2026: *"vamos estabelecer um bom padrão, pra ser o novo
  padrão ouro de estudos municipais/consórcio"*): hero cartão-postal → sumário → **diagnóstico só com números** (central,
  bases, unidades, efetivo, chamados, transferências; sem "no CNES / fora dele", sem onde está cada viatura) → **régua do SUS
  e pontos críticos numa tabela só** (regra · norma · hoje · crítico · proposta), com o campo **"Oportunidades lidas"** junto
  (mídia, déficit operacional, má prestação, contas com valores; fonte, data, link e selo; Ota, 23/10/2026) → proposta → precedentes documentais →
  viabilidade (Custo Operacional, per capita e o **rateio por município em dropdown**, pela chave do consórcio ou pela
  população, ≈, nunca por viatura nem por item) → decisores → diferenciais → fechamento sem contato. Estudo publicado fica
  como está.
- **Padrão raio-x (Ota, 21/10/2026):** o estudo traz, como o cartão do raio-x, a gestão lida, o gasto de hoje × Custo
  Operacional e os sinais lidos (matérias do SAMU com fonte, data e link; sinal de má gestão é oportunidade). Os **anexos de
  dado** vão recolhidos e fora do teto de palavras, **dentro da seção do assunto** (Ota, 23/10/2026: *"separados lá ficam
  esquecidos"*; marcadores `<!--ANEXO:decisores|contratos|gestao|sinais-->`, `references/peca-cliente.md` §2, item 12):
  - os **decisores**, com o partido ao lado do nome;
  - os **contratos ativos e editais**, com link e valor do PNCP, ou do portal quando o contrato não está no PNCP.

  Os anexos saem do mesmo dado do raio-x: `node scripts/estudo-anexos-raiox.mjs <UF> <central> --aplicar estudos/<slug>.html`
  (samais-estudos). O que o estudo lê a mais volta à camada do raio-x da UF, num dado só.
- Detalhe: `references/peca-cliente.md`; anexo: `references/composicao-e-anexo.md` §8.

### FASE 5 — Portão e publicação

- Checklist do autor, depois o **portão (opus, esforço `max`, por lote)**; correção volta ao portão em reenvio estreito.
- **Publicar é mergear na `main` do samais-estudos** (commit e PR não publicam). Antes: `git fetch origin && node
  scripts/guarda-merge.mjs`.
- No ar, conferir **por conteúdo**: home com o valor certo, página sem `.html`, anexo dando 404, `?v=N`.
- Detalhe: `references/portao-publicacao-entrega.md`.

### FASE 6 — Entrega

- **A URL na conversa, sempre** (`https://samais-estudos.vercel.app/estudos/<slug>` e a home), mais resumo de até 6
  linhas: Custo Operacional mensal · per capita · escopo · o achado que decide · a maior pendência · o próximo passo.
- Registrar a frente: `samais-os/frentes/<slug>/status.json` com o valor **saído do estudo**, `gatilho`, `estudo_url` e
  `estudo_titulo_conferido`; nomes de contato e porta de entrada só em `bastidor.md`.
- **Mudou o preço, mudam cinco lugares no mesmo PR:** página, cartão da home, markdown interno, anexo, `status.json`.

## Modo transporte sanitário (resumo)

- **Contrato único, sem faseamento:** eletiva e inter-hospitalar num instrumento, operação plena desde o dia 1.
- **Sistema: ROTA-OS** (não PEP-OS); **sem R$ por veículo em peça**; perguntar a frente antes de escolher o veículo.
- **Norma: Portarias GM/MS 11.164 + 11.165/2026, nunca 11.179.** Elegível: radioterapia e hemodiálise, > 50 km de
  município a município, ente diverso, ≤ 500 km, hemodiálise no mesmo estado, tratamento confirmado. Incentivo só para van
  e micro-ônibus doados pelo MS, mensal, mantido pelo BPA-I; **3 meses sem registro suspende, 6 exclui**.
- **Medir a distância antes de citar repasse.** Repasse é fato e oportunidade (custeio a habilitar, operador regional do
  art. 25); o **farol de conformidade** é o que o ROTA-OS entrega. A pilha de financiamento fica no Artefato 1.
- Dimensionar pelo aproveitamento real (85% ≈), capacidade efetiva = assentos ÷ ~2, FC da eletiva 2,57; inter-hospitalar
  em viatura-hora e FC 4,5. **Sem case de transporte:** a prova é o sistema e a norma.
- **A distância dos 50 km é fonte de custeio, não medida de oportunidade;** distância e rede habilitada se leem, nunca
  se estimam; o eletivo geral se levanta na central do ente, nunca por parâmetro.
- Detalhe: `references/modo-transporte-sanitario.md` (fatos da norma: `samais-os/produtos/rota/portaria-11165.md`) e
  `references/transporte-demanda-e-viabilidade.md`.

## Não-negociáveis que mais falham

1. **Princípio da Realidade:** ✓ lido · ≈ derivado (regra declarada) · ○ a levantar. Lacuna nunca vira zero; premissa
   nunca vira fato; ✓ só quando fontes independentes convergem (20/10/2026); nenhuma conclusão do silêncio da fonte.
2. **Valor final = "Custo Operacional"** (16/10/2026); "oportunidade de mercado" fica para o conceito. R$ 5,20/hab só como
   "Custo Operacional · ≈ estimativa Samais (cálculo sobre os contratos da Samais)".
3. **Composição do preço nunca vai a terceiro:** BDI, CDO, margem, remuneração, fator de cobertura, **preço por viatura**,
   "Métrica de Ouro", score, ranking. Em superfície, nunca "lucro" nem "margem": "Composição do Valor Contratual".
4. **Custo construído, nunca régua fixa** (19/10/2026), em SAMU, transporte, hospital e estudo.
5. **A peça não compara equipe;** compara gasto de hoje × Custo Operacional; onde hoje é maior, **economia para o
   município, com a qualidade inteira**. Nunca "somos X% mais baratos".
6. **Nada de suposição:** acima de ~1,5 mi hab., o construído (nunca a régua nem o teto; a norma só confere); **"sem contrato publicado no PNCP" ≠ sem contrato**
   (confirmar no portal do ente); o não lido é ○.
7. **Contratado nunca como pago.** Custeio federal pago é uma linha de fato, sem percentual, sem "quem paga", sem
   tripartite, sem custeio ÷ 0,5; custeio a habilitar ou qualificar é oportunidade.
8. **FC 24/7 ≈ 4,5, nunca 2,2.** Transferência inter-hospitalar em viatura-hora; a exposição dela vai ao Cenário A, não
   ao nosso custo. Passivo trabalhista em todo cálculo CLT, sem contar a rescisão duas vezes.
9. **Consórcio ≠ região de saúde ≠ área da central ≠ quem paga ≠ mantenedora no CNES.** Na UF com raio-x, rodar
   `scripts/raiox/vinculo-oculto.mjs <UF>`; vínculo ativo, total ou parcial, com link ao documento oficial.
   **Cadastro não é gestão** (Ota, 20/10/2026): o vínculo e a lotação do CNES desatualizam. A gestão de hoje se lê no
   instrumento (estatuto, contrato, acordo coletivo, edital de concurso ou processo seletivo) e no gasto pago no TCE (hora
   extra, temporário, sentenças), com os sinais (greve, inadimplência, TAC, MP) e os decisores; onde divergem, vale o lido
   (prova: CIRUSPAR, `samais-os/inteligencia/parana/fatos.md` §13.1).
10. **Decisores com fonte, data e partido ao lado do nome** (19/10/2026: *"é impreterível"*). CPF, dado sensível, boato e
    contato pessoal nunca na peça; contato e porta de entrada só em `bastidor.md`. No estudo, decisores e contratos ativos
    (links e valores do PNCP) também vão em anexo, no padrão do raio-x (Ota, 21/10/2026).
11. **Saúde pública:** hospital, leito e UTI só pela rede do SUS (públicos com leito SUS inteiros; filantrópicos e
    privados contratados pela parte SUS).
12. **Oportunidade só do território da peça;** referência de fora vai só na Fonte, como método. **Ourinhos** (recortes e
    precedente) só em contexto paulista.
13. **Atestados:** Ourinhos e CISNORPI, em pretérito, só o que o documento sustenta; transporte sem case.
14. **Padrão frio, sem campo de contato,** tagline no fecho; `fatos.md` cita; `interpretacao.md` e `bastidor.md` nunca
    entram na peça.
15. **Nenhuma palavra órfã** nem palavra curta no fim de linha; mobile sem rolagem horizontal; hero cartão-postal em alta
    resolução; relógio de Brasília (`scripts/lib/relogio.mjs`).
16. **Rede:** sem `r.jina.ai` e `api.firecrawl.dev`; nunca desligar TLS; CNES e PNCP com User-Agent + Referer; bloqueio
    medido em `$HTTPS_PROXY/__agentproxy/status` (skill `leitura-resiliente`).
17. **Portão antes de terceiro;** portão vermelho, quem se corrige é a peça (nunca a guarda); estudo publicado fica como
    está; publicar é mergear e conferir no ar.

## Lições que viraram regra (o detalhe está nas references)

| Caso | O erro | A regra |
|---|---|---|
| Canoas | BDI de 35% tido como fechado; o NEP quase ficou fora do custo | remuneração residual sempre calculada; obrigação que consome dinheiro é rubrica |
| Taboão | FC 2,2 para 24/7 (80 contra 148 pessoas) | FC 24/7 ≈ 4,5 |
| Itapevi | contrato parado citado como vigente; credor de OS tido como SAMU | pagamento diz se está vivo; o objeto diz o que é |
| Manaus | cadastro do CNES lido como operação | teste de cadastro × frota tripulada; a folha é diagnóstico |
| Belém | 3,5 mi hab. × R$ 5,20 = R$ 18,4 mi/mês; hemodiálise em ambulância tripulada | acima de ~1,5 mi, nunca a régua: o custo construído; perguntar a frente antes do veículo |
| Osasco | estudo fora do ar por parar no push | publicar é mergear e conferir no ar |
| Ponta Grossa | mantenedora no CNES lida como operador | consórcio, área, quem paga e mantenedora conferidos no instrumento |
| CISNOP × CISNORPI | sítio dado como "403" (recusava só quem chegava sem navegador); gestão lida de parte da área; a 18ª RS deduzida do cadastro | reabrir com identificação de navegador antes do ○; parte não lida fica ○; quem paga o rateio cruza com a lista de consorciados; sigla se separa pelo CNPJ; `auditoria-consorcios.mjs` antes de regerar |
| CIRUSPAR | quadro próprio lido como "estável, sem janela" pelo CNES; custeio tido como bom | cadastro não é gestão: pago no TCE por rubrica, instrumento, sinais (greve) e decisores; o gasto de hoje passava o Custo Operacional |
| DF, SP, MG, BA | "remuneração" (salário) num arquivo citável escrito à mão; o motor recusou gravar a UF | arquivo citável não leva palavra vetada, nem em outro sentido |

## Orquestração e tokens

Coleta, leitura mecânica e regeração vão a modelo leve; julgamento ao opus `high`; o portão ao opus `max`, por lote.
Script vai ao shell. Todo agente salva o andamento em disco, commita pequeno e entrega relatório curto
(`samais-os/doutrina/orquestracao-multiagente.md`).
