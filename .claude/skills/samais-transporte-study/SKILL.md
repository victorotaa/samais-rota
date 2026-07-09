---
name: samais-transporte-study
description: >
  Executa varredura e produz estudo de viabilidade/precificação de OPERAÇÃO DE TRANSPORTE SANITÁRIO
  (transporte eletivo de pacientes: hemodiálise, radioterapia, TFD, consultas reguladas) para prospecção
  comercial da Samais Gestão em Saúde. Use SEMPRE que Victor (ou equipe Samais) sinalizar um município,
  consórcio ou região para avaliação de contrato de transporte de pacientes — irmã da samais-municipal-study
  (que cobre SAMU/UPA/Hospital). Triggers: "transporte sanitário [cidade]", "TFD [cidade]", "frota de
  pacientes", "Caminhos da Saúde [cidade/UF]", "rota alvo", "estudo de transporte", "viabilidade de
  transporte [cidade]", menção a veículos doados pelo Ministério da Saúde, ou licitação/pregão de
  transporte de pacientes. O output segue o padrão da casa: HTML single-file dark Samais, Partes numeradas,
  cenários Mínimo/Base/Amplo, BDI decomposto (nunca "lucro") — MAIS a camada exclusiva desta skill:
  a pilha de financiamento com repasse federal mensal (Portarias 11.164/11.179/2026) e o farol de
  conformidade que protege esse repasse. Referência viva: demo ROTA (samais-rota.vercel.app/rota-app.html)
  e spec em docs/ROTA-SPEC.md.
---

# Samais — Skill: Estudo de Transporte Sanitário / Precificação

## Propósito

Quando um município, consórcio ou secretaria estadual entra no radar para **transporte
eletivo de pacientes**, produzir o dossiê de viabilidade e precificação antes de qualquer
reunião. Esta skill é a irmã da `samais-municipal-study`: herda protocolo, identidade e
disciplina de fontes, mas troca a matemática — aqui a unidade econômica é a **rota**
(km × frequência × assentos), e o argumento decisivo é o **repasse federal mensal** que
a gestão Samais destrava e protege.

**Tese comercial da skill:** a Samais não é despesa nova — é quem habilita o ente a
receber o custeio federal e o mantém fluindo (comprovação mensal). Sem gestão, o
dinheiro não vem ou é suspenso.

---

## Arcabouço regulatório (memorizar — está validado)

| Norma | O que importa para o cálculo |
|---|---|
| Portaria SAS/MS **55/1999** (TFD) | Transporte + diárias p/ paciente e acompanhante; custeio municipal/estadual próprio; médico solicita, comissão autoriza |
| Portaria GM/MS **4.279/2010** | Transporte eletivo = sistema logístico das Redes de Atenção |
| Portarias GM/MS **8.516/2025 → 11.164 e 11.179/2026** | Cofinanciamento federal p/ radioterapia e hemodiálise **>50 km e ≤500 km** (paciente + acompanhante) |

**Mecânica do dinheiro federal (verificada):**
- **Capital:** União **doa** o veículo (Caminhos da Saúde/Novo PAC — 3.300 veículos).
- **Custeio:** repasse **mensal, fundo a fundo**, cobrindo custo **fixo e variável**
  (combustível, manutenção, emplacamento, seguro e **recursos humanos**). Custeio
  vinculado a van/micro-ônibus doados pelo MS.
- **Termo de Doação:** uso exclusivo em transporte sanitário (prioridade hemodiálise/
  radioterapia); veículo em plena operação em **até 60 dias (+30 prorrogáveis)** do
  recebimento, senão **revogação da doação + suspensão do custeio**.
- **Manutenção do repasse:** condicionada ao **registro mensal de produção**
  (comprovação dos deslocamentos nos sistemas do SUS). **3 meses sem registro →
  suspensão.**
- **Impacto nacional publicado:** ~R$ 26,0 mi/ano (radioterapia) + ~R$ 165,5 mi/ano
  (hemodiálise) ≈ **R$ 191,5 mi/ano** de custeio novo no sistema.
- ⚠️ **Valores unitários por veículo/rota:** constam de anexo da portaria — **sempre
  validar no texto integral vigente antes de citar número em proposta**. Nunca inventar.

---

## Protocolo de Execução

### FASE 1 — Qualificação do Alvo

Confirmar ou extrair do contexto (perguntar se faltar 1, 2 ou 3):

1. **Alvo** — município, lista, consórcio ou GRS/CRS estadual (nome + UF)
2. **Contratante provável** — prefeitura direta, consórcio, secretaria estadual
3. **Gatilho** — licitação/pregão publicado, veículo federal recebido/anunciado,
   cobrança do MP, contrato vencendo, crise (ex.: interdição de clínica de diálise)
4. **Frota** — o ente recebeu veículos do Caminhos da Saúde? Quantos/quais? Já tem
   frota própria/locada? (define se o cálculo inclui capital ou só operação)
5. **Destinos de referência** — para onde os pacientes viajam hoje (diálise, onco,
   especialidades) e a quantos km

### FASE 2 — Varredura (web_search obrigatório; registrar fonte + data)

#### 2.1 Demanda (o coração do cálculo)
- `[município] pacientes hemodiálise clínica diálise quantos`
- `[município] TFD tratamento fora domicílio pacientes viagens`
- `[município] radioterapia oncologia referência onde`
- Extrair/estimar: nº de pacientes dialíticos (regra de bolso: **~0,1% da população**
  em TRS — marcar como estimativa), frequência (diálise = 3×/semana, fixo),
  oncológicos em radioterapia (ciclos diários por 4–7 semanas), volume TFD geral
- **Cada paciente dialítico = ~13 viagens/mês por ~4 anos.** É a demanda mais
  previsível da saúde pública — vender essa previsibilidade.

#### 2.2 Malha de destinos e distâncias
- Mapear destino por especialidade (diálise, radio, quimio, consultas) com km real
  rodoviário (Google/DNIT). Classificar cada fluxo: **≤50 km (municipal)** ou
  **>50 km e ≤500 km (elegível federal)** — essa classificação define a pilha de
  financiamento.

#### 2.3 Frota federal e habilitação
- `[município/UF] Caminhos da Saúde veículos transporte sanitário recebeu`
- `[município] CNES veículo transporte`
- Extrair: veículos doados (tipo, quando), status de operação, prazo dos 60 dias,
  CNES. **Veículo doado parado = risco de revogação = urgência do cliente = porta
  de entrada Samais.**

#### 2.4 Contratação atual e histórico
- `[município] licitação pregão transporte pacientes TFD locação veículos motorista`
- Extrair: contratos vigentes (valor, vencimento, fornecedor), pregões desertos/
  anulados, cobranças de MP/TCE. Registro de preços de locação é sinal verde.

#### 2.5 Contexto político-institucional e fiscal
- Herda 2.5 e 2.6 da `samais-municipal-study` (prefeito, secretário, consórcio,
  SIOPS, CAUC).

#### 2.6 Curadoria visual
- Herda 2.8 da `samais-municipal-study`. Linguagem específica desta skill: van/
  micro-ônibus em rodovia, paciente idoso embarcando (sem rosto identificável),
  estrada do sertão, clínica de diálise (fachada). **Vetado:** maca, sirene, drama.

### FASE 3 — Cálculo e Composição Comercial

#### 3.1 Dimensionamento por rota (a matemática desta skill)

Para cada fluxo origem→destino:

```
assentos/dia   = pacientes do fluxo × (1 + %acompanhante) ÷ dias de tratamento/semana
veículo        = van (7) | micro-ônibus (24) | ambulância A (1-2, só maca)
viagens/mês    = frequência semanal × 4,33
km/mês (fluxo) = km ida-volta × viagens/mês
```

Regras: acompanhante **ocupa assento** (TFD autoriza; diálise/onco quase sempre tem);
paciente de maca **nunca** em veículo comum; ocupação-alvo do cenário Base = **60–75%**
(folga para intercorrência sem assento ocioso crônico).

#### 3.2 CDO — Custo Direto Operacional mensal (benchmarks internos)

| Linha | Referência (marcar como estimativa da casa) |
|---|---|
| Motorista (CLT + encargos ~70%) | R$ 4.500–6.000/mês por posto |
| Assistente de embarque (ônibus/micro) | R$ 2.800–3.500/mês por posto |
| Gestor local Samais (rateado por base) | R$ 7.000–10.000/mês |
| Combustível | km/mês ÷ consumo × preço diesel/gasolina local |
| Consumo de referência | van 8–10 km/l · micro-ônibus 4,5–6 km/l · ambulância 7–9 km/l |
| Manutenção + pneus | R$ 0,45–0,70/km |
| Seguro + licenciamento | R$ 350–700/veículo/mês |
| Locação (se frota não doada) | van R$ 4.500–7.000 · micro R$ 9.000–14.000/mês |
| Sistema de gestão (ROTA) + telecom | R$ 800–1.500/base/mês |
| Casa de apoio/diárias (quando no escopo) | por pernoite, tabela local |

`CDO = pessoal + combustível + manutenção + seguro + locação (se houver) + gestão + sistema`

#### 3.3 Cenários (sempre o trio)

| Cenário | Lógica |
|---|---|
| **Mínimo Regulatório** | Só os fluxos elegíveis federais (>50 km) com frota doada — o "de graça que precisa de gestão" |
| **Base Operacional ★** | Elegíveis federais + TFD municipal consolidado — recomendação Samais |
| **Cobertura Ampliada** | Base + eletivo intramunicipal (≤50 km) + casa de apoio — teto de serviço |

#### 3.4 Composição do Valor Contratual

Herda **integralmente** a regra da `samais-municipal-study`: BDI decomposto **35%
sobre CDO** (apresentado 38%, floor 37,5%), **nunca** "lucro/margem". Tabela pronta em
`samais-municipal-study/references/composicao-preco.md`.

#### 3.5 Pilha de financiamento (exclusiva desta skill — o slide que fecha)

Apresentar SEMPRE o valor contratual contra as fontes que o pagam:

```
Valor contratual mensal ........................ R$ X
(−) Custeio federal mensal (fluxos >50 km,
    veículos doados habilitados) ............... R$ Y   ← a Samais destrava e protege
(−) Economia vs. contrato/locação atual ........ R$ Z
(=) Desembolso líquido do tesouro municipal .... R$ X−Y−Z
```

Argumentos de fechamento (nesta ordem):
1. **R$ líquido/paciente/mês** do tesouro municipal (o número do prefeito)
2. **Custo/km** vs. contrato atual ou diária de locação
3. **Farol de conformidade**: sem comprovação mensal o repasse é suspenso em 3 meses
   — a gestão Samais é o que mantém Y na conta. *"Não somos custo: somos quem paga
   a própria fatura."*

#### 3.6 Score de Atratividade (0–10, ponderado)

| Critério | Peso | Notas |
|---|---|---|
| Demanda estruturada (dialíticos + onco >50 km) | 25% | >40 pacientes elegíveis = 10 |
| Veículo federal recebido/anunciado | 20% | Recebido e parado = 10 (urgência dos 60 dias) |
| Contratação pública já existente | 20% | Contrato vencendo/pregão anulado = 10 |
| Capacidade fiscal do contratante | 15% | SIOPS + CAUC |
| Janela política | 10% | herda municipal-study |
| Cobrança MP/TCE ativa | 10% | Cobrança formal = 10 (dor pública documentada) |

### FASE 4 — Outputs

Herda o padrão de dois arquivos da `samais-municipal-study` (mesmas regras absolutas
de tom, design system dark Samais, Partes numeradas):

- **OUTPUT A** `samais-transporte-proposta-[alvo]-[YYYY-MM].html` — externo.
  Estrutura: Capa → Apresentação Samais → PARTE I O território e seus pacientes →
  PARTE II A operação desenhada (rotas, frota, equipe, cenários ★) → **PARTE III O
  repasse federal que a operação destrava** (pilha de financiamento + farol de
  conformidade) → PARTE IV Composição do Valor Contratual → **PARTE V O sistema ROTA**
  (demo viva: samais-rota.vercel.app/rota-app.html — manifesto, folha de embarque,
  relatório mensal de comprovação) → PARTE VI Por que a Samais (cases: **apenas
  Ourinhos e CISNORPI**, em pretérito, "atestado disponível para verificação formal")
  → Próximos passos.
- **OUTPUT B** `samais-transporte-dossie-[alvo]-[YYYY-MM].html` — interno/confidencial.
  Acrescenta: memória de cálculo por rota, premissas com selo verde/âmbar, análise
  competitiva, contexto político, riscos (inadimplência municipal, pregão direcionado,
  frota doada a consórcio rival), verdict Go/Atenção/No-Go.

**Regra desta skill:** toda proposta externa referencia a **demo ROTA** e o
**relatório mensal de comprovação** como prova de capacidade — temos o sistema
pronto, não a promessa de um.

### FASE 5 — Entrega

Herda FASE 5–6 da `samais-municipal-study` (deploy + mensagem à diretoria), com o
resumo em chat incluindo: score + verdict · cenário ★ (rotas, veículos, CDO) · valor
contratual · **desembolso líquido municipal pós-repasse** · janela dos 60 dias (se
houver veículo doado) · próximo passo.

---

## Notas Operacionais

- **Disciplina de fontes:** demanda dialítica/oncológica quase nunca é pública por
  município — estimar por prevalência **e marcar como estimativa** (selo âmbar);
  validar na visita técnica. Nunca apresentar estimativa como censo.
- **Valores do anexo federal:** citar em proposta **somente** após leitura do texto
  integral vigente da portaria (DOU). Até lá, usar "custeio federal mensal conforme
  portaria" sem cifra.
- **Distância é lei:** o corte 50 km é rodoviário entre municípios — medir com fonte
  e guardar o print (evidência glass no estudo, padrão da casa).
- **Voz:** impessoal técnico; cases em pretérito; sem "humanizado/excelência/
  acolhimento"; tagline como fecho. Público prefeito/secretário: zero sigla sem
  explicação (TRS = hemodiálise; TFD = tratamento fora do domicílio).
- **Sinergia:** se o alvo também tiver oportunidade SAMU/UPA/hospital, rodar as duas
  skills e cruzar (o transporte é porta de entrada de menor atrito para o contrato
  maior).

## Referências Internas

- `docs/ROTA-SPEC.md` — spec do sistema ROTA (RF/RN, modelo de dados, fases)
- `rota-app.html` — demo viva (produção: samais-rota.vercel.app/rota-app.html)
- `municipios.html` — due diligence das 12 praças RN/PI/CE (demanda mapeada)
- `monitoramento.html` — radar semanal de sinais por praça
- `samais-municipal-study/references/*` — design system, composição de preço, checklist licitação
