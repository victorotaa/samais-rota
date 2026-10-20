# Histórico da skill samais-municipal-study

**Unificação de 20/10/2026** (Ota: *"unificar as que têm similaridade demais para termos poucas mas boas skills bem
fundamentadas"*; *"atualize e divida as skills de estudo e raio-x"*). A versão canônica fica no `samais-os`, com o mesmo
nome. A `samais-transporte-study` passa a ser o **modo transporte sanitário** desta skill.

## 1. As cinco entradas reconciliadas

| Versão | Onde | Tamanho do SKILL.md | Estado |
|---|---|---|---|
| **samais-os** (vigente) | `samais-os/.claude/skills/samais-municipal-study/` | 541 linhas, 33.860 bytes | base da unificação; references revistas em 25/09 e 12/10/2026 |
| **samais-estudos** (cópia não listada no pedido) | `samais-estudos/.claude/skills/samais-municipal-study/` | 547 linhas | = samais-os + bloco de 16/10/2026; tirou a linha de `atestados/ARGUMENTOS.md`; `benchmarks-samu.md` com a nota de Manaus (21/08) e o aviso "desatualizado em custos" |
| **jarvis-os** | `jarvis-os/.claude/skills/samais-municipal-study/` | 426 linhas | geração anterior à correção de 19/08/2026 (OUTPUT A/B, Netlify) |
| **samais-rota** | `samais-rota/.claude/skills/samais-municipal-study/` | 433 linhas | = jarvis + imagem de marca gerada no Higgsfield, "Por que a Samais" pelos atestados reais e fecho sem contato; references idênticas às do jarvis |
| **samais-transporte-study** | `samais-rota/.claude/skills/samais-transporte-study/` | 307 linhas + `repasses-observados.md` (52) | skill irmã de transporte (até 10/07/2026, com nota de 16/10) |

## 2. De onde veio cada parte da versão nova

| Arquivo novo | Origem |
|---|---|
| `SKILL.md` | núcleo da samais-os (fases, três artefatos, publicação, entrega) + não-negociáveis de 16 a 20/10/2026 do `CLAUDE.md` e de `regras-completas.md` + resumo do modo transporte |
| `fontes-e-coleta.md` | samais-os FASE 0, 2.0–2.7 e "Saúde pública"; samais-estudos (bloco de 16/10: decisores e vínculo); doutrina de 16, 19 e 20/10 (partido, "sem contrato publicado no PNCP", convergência, fundação estadual = gestão própria); coletor Núcleo GOV conferido no samais-estudos |
| `calculo-custo-construido.md` | samais-os 3.2 (testes de escala, piso por paridade, carga secundária e passivo); `benchmarks-samu.md` da samais-os (norma de frota, KPIs, demanda, marco normativo revisado em 25/09 e 12/10); doutrina de 19 e 20/10 (frota do ente é o teto, equipe pela norma, custo construído, operação complementar, aluguel do ente, faixa de 1,5 mi) |
| `cenarios-e-comparativo.md` | samais-os 3.1, 3.2 (trio), 3.4b, 3.5 e "Camada de mercado"; doutrina de 19/10 (comparativo de gasto, economia com qualidade) e de 12/10 (FNS em uma linha) |
| `composicao-e-anexo.md` | samais-os 3.3 (remuneração residual, co-gestão) + `composicao-preco.md` da samais-os (texto revisto do CoPilot) + doutrina de 20/08 (sustentação, roteirização) e de 16/10 (Custo Operacional) |
| `peca-cliente.md` | samais-os FASE 4 (Ourinhos, resumido, lição Itapevi, Artefato 1) e 2.8 (imagens de 06/10); samais-rota (atestados só no que o documento sustenta, fecho sem contato); `design-system.md` da samais-os (regra de linguagem do CoPilot e cartão "Apoio ao Despacho" de 24/09) |
| `modo-transporte-sanitario.md` | samais-transporte-study inteira, corrigida pelo texto lido da norma (`samais-os/produtos/rota/portaria-11165.md`, 16/10/2026) e por `samais-estudos/referencias/benchmark-transporte-sanitario.md` (motor de 85%, FC 2,57, duas frentes, distância); `repasses-observados.md` absorvido no §9; doutrina de 20/08 (contrato único, ROTA-OS, sustentação) |
| `portao-publicacao-entrega.md` | samais-os FASES 5 e 6 + regras de frente (`regras-completas.md`, "Frentes": `estudo_url`, `estudo_titulo_conferido`) + Git do `CLAUDE.md` (Actions desligadas até 01/11/2026) |
| `checklist-licitacao.md` | o da samais-os (CRM e RQE revistos em 25/09), com o "markup de 35%" trocado pela remuneração residual e um bloco de transporte |

## 3. Títulos antigos: para onde foram

Lista gerada dos cabeçalhos das cinco versões antes da mudança (472 linhas). Todo título está numa das linhas abaixo.

| Títulos antigos | Destino |
|---|---|
| Propósito · Protocolo de Execução · Referências Internas · Notas Operacionais | `SKILL.md` (abertura, fases, roteamento); notas espalhadas pelas references (dado ausente → `peca-cliente.md` §3; datação → `fontes-e-coleta.md` §4; consórcio → `cenarios-e-comparativo.md` §2; imagens → `peca-cliente.md` §7) |
| FASE 0 Briefing | `SKILL.md` FASE 0 + `fontes-e-coleta.md` §1–2 |
| FASE 1 Qualificação do Alvo (SAMU e transporte) | `SKILL.md` "Entradas" + `modo-transporte-sanitario.md` §3.1 |
| FASE 2 Varredura (2.0 a 2.7, as duas versões) | `fontes-e-coleta.md` §3–8; o "2.7 Análise competitiva" do jarvis/rota virou §6–7 (TCE, PNCP pelo item) |
| 2.3b Carga secundária | `fontes-e-coleta.md` §5 + `calculo-custo-construido.md` §5 |
| 2.8 Curadoria visual · 2.6 Curadoria visual (transporte) | `peca-cliente.md` §7 e `modo-transporte-sanitario.md` §8 (parte descartada: §4 abaixo) |
| Transporte 2.1 Demanda · 2.2 Malha · 2.3 Frota federal · 2.4 Contratação · 2.5 Contexto | `modo-transporte-sanitario.md` §3 |
| 3.1 Score de Atratividade · 3.6 Score (transporte) | `cenarios-e-comparativo.md` §5 · `modo-transporte-sanitario.md` §6 |
| 3.2 Dimensionamento em 3 Cenários · 3.3 Cenários (transporte) | `cenarios-e-comparativo.md` §2 · `modo-transporte-sanitario.md` §6 |
| Transporte 3.1 Dimensionamento por rota · 3.2 CDO | `modo-transporte-sanitario.md` §4–5 |
| 3.3 / 3.4 Composição do Valor Contratual | `composicao-e-anexo.md` |
| 3.4 Argumento de Fechamento (padrão Sorriso) | per capita → `peca-cliente.md` §2; parte descartada: §4 abaixo |
| 3.4-bis Simulador de repasse · 3.5 Pilha de financiamento | `modo-transporte-sanitario.md` §7 (no Artefato 1) |
| 3.4b Custo de hoje × editais × proposta | `cenarios-e-comparativo.md` §3 |
| 3.5 Diagnóstico Narrativo | `cenarios-e-comparativo.md` §6 |
| Arcabouço regulatório (transporte) | `modo-transporte-sanitario.md` §2, refeito pelo texto lido |
| FASE 4 Os TRÊS artefatos | `SKILL.md` + `peca-cliente.md` + `composicao-e-anexo.md` §8 |
| FASE 4 Geração dos dois HTMLs · OUTPUT A · OUTPUT B · Instruções de geração · FASE 4 Outputs (transporte) | descartados (§4); as regras vivas do OUTPUT A estão em `samais-os/doutrina/padrao-frio.md` e em `peca-cliente.md` §3 |
| FASE 5 Publicação · FASE 5/6 Entrega | `portao-publicacao-entrega.md` §3–4 |
| FASE 6 Deploy Netlify e Mensagem para Diretoria (6.1 a 6.5 e o código Python) | descartados (§4) |
| `benchmarks-samu.md`: Escala por população (as duas versões) · Cobertura por área · KPIs · Perfil de Demanda · Referências Normativas | `calculo-custo-construido.md` §7 |
| `benchmarks-samu.md`: Custos Operacionais de Referência · Unidades Móveis · Central de Regulação · Gestão e Overhead · Markup Samais · Alertas Comerciais · Regra de ouro para consórcios | descartados (§4); os alertas de CAUC e de consórcio instável foram ao `checklist-licitacao.md` §7; o de R$ 300 mil, à triagem, como ≈ |
| `composicao-preco.md`: Princípio regente · Tabela Canônica · Detalhamento por linha (1 a 7) · Como apresentar (A, B, C) · Alertas de redação · Referências normativas | `composicao-e-anexo.md` §1–7 |
| `composicao-preco.md`: Exemplo de apresentação no HTML | descartado (§4) |
| `checklist-licitacao.md`: todas as seções | mantidas no mesmo arquivo, revistas |
| `design-system.md` (Tokens, Google Fonts, CSS Base, Layout, Nav lateral, Componentes 1 a 15, Scroll Spy, Checklist final) | descartado (§4); a regra de linguagem do CoPilot foi a `peca-cliente.md` §6 |
| `repasses-observados.md`: O que rastrear · Distribuição de veículos · Custeio observado · Leitura comercial | `modo-transporte-sanitario.md` §9 (o custeio, conferido contra o texto, em §2 e §7) |

## 4. O que foi descartado e por quê

| Descartado | Motivo |
|---|---|
| OUTPUT A/B (dois HTMLs), `present_files`, deploy Netlify, mensagem ao André, `message_compose_v1` (jarvis, rota e transporte) | já corrigido em 19/08/2026: nenhum arquivo real seguia isso; a casa produz três artefatos e publica na Vercel por merge |
| `design-system.md` (1.230 linhas) | paleta legado (`#060709`, `#C9A84C`, Plus Jakarta Sans, ciano `#16a085`), marcada "substituída" no próprio arquivo; a identidade é `doutrina/samais.css` e a skill `samais-brand-guidelines` lista essas paletas como aposentadas |
| Custos unitários de abr/2025 (USB R$ 55 mil, USA R$ 105 mil, central por porte, overhead de 13%, "markup 35%") e o alerta "nunca apresentar estimativa sem o markup" | superados pelo custo construído (19/10/2026) e por `parametros-base.md`; o próprio arquivo do samais-estudos os declarava desatualizados |
| "Regra geral: 1 USB para 50–80 mil hab." e a tabela antiga atribuída à PNAU | corrigidas em 25/09/2026 (norma de 100–150 mil por USB) |
| "Regra de ouro para consórcios" (1 USA para cada 3–4 municípios) | conflita com a frota do ente como teto (19/10/2026): a casa não acrescenta viatura |
| Exemplo HTML do bloco de composição | expunha o BDI numa página e usava tokens legados; a composição não vai a terceiro |
| Imagem de marca **gerada no Higgsfield** com elements treinados (rota e transporte) | conflita com `doutrina/higgsfield-canon.md`: imagem se resolve grátis (GPT/Gemini), sem crédito do Higgsfield |
| Regras de frame A/B, aprovação em 4K, claridade de overlay e scroll-scrub (transporte 2.6) | são de vídeo e de site, não de estudo; ficam para `samais-video` e `samais-brand-guidelines` (ver relatório) |
| "Unsplash/Pexels prioritários" | substituído pela regra do cartão-postal em alta resolução (Ota, 06/10/2026) |
| Discriminação de **preço por viatura** na página cliente (samais-os FASE 4) | conflita com o não-negociável do `CLAUDE.md` (preço por viatura é composição e nunca vai a terceiro) e com "sem R$ por veículo" no transporte; a tabela de preço por unidade fica no anexo. **Decisão a confirmar pelo Ota** (o `apresentacao-html.md` do samais-estudos ainda manda exibi-la) |
| "Valor local líquido após cofinanciamento" e per capita pós-cofinanciamento (padrão Sorriso); comparativos com café e pão | conflitam com "FNS: uma linha de fato, sem 'quem paga', sem tripartite" (12/10/2026) e com o padrão frio; o per capita do Custo Operacional fica. **A confirmar pelo Ota** |
| "Valor Contratual = CDO × 1,35" como fórmula de preço | a lição Canoas mostrou que não fecha; vale o gross-up e a remuneração residual |
| CDO de "benchmarks internos" do transporte (motorista R$ 4.500–6.000, locação R$ 4.500–14.000 etc.) | sem fonte; superado pelo custo construído e pelas réguas medidas do `benchmark-transporte-sanitario.md` |
| Ocupação-alvo de 60–75% (transporte) | substituída pelo aproveitamento de 85% da regra do Ota de 20/08/2026 |
| "Repasse projetado = km elegível × valor-referência" | errado contra o texto lido: a faixa é valor por pessoa, ida e volta, parâmetro federal que não entra em peça; a estimativa do ente está nos anexos da 11.165 |
| "O custeio cobre custo fixo e variável, inclusive RH" | o texto lido põe esses itens como encargo do ente (art. 11 II); fica registrado como ≈ da imprensa |
| "Sinergia: o transporte é porta de entrada de menor atrito para o contrato maior" | conflita com "sem porta de entrada" (20/08/2026); a regra que fica é "dois serviços, dois estudos" |
| "Prova de capacidade = a demo, sem atestados" (transporte), em sentido amplo | mantido para transporte; para SAMU valem os atestados de Ourinhos e CISNORPI |
| Remoção da linha de `atestados/ARGUMENTOS.md` (cópia do samais-estudos) | não seguida: o arquivo existe no samais-os e é a fonte do que cada atestado sustenta |

## 5. Medição

| | Antes (samais-os) | Depois |
|---|---|---|
| `SKILL.md` | 541 linhas · 33.860 bytes · ≈ 8.465 tokens (bytes ÷ 4) | 185 linhas · 14.503 bytes · ≈ 3.625 tokens |
| `references/` | 4 arquivos · 1.782 linhas (1.230 de design-system legado) | 9 arquivos · 1.143 linhas |
| Títulos (cabeçalhos `#`) | 472 nas cinco versões | 93; o mapa está no §3 |

O `SKILL.md` ficou abaixo do alvo de 250–350 linhas porque o limite que manda é o de ~5.000 tokens (o que volta depois
da compactação); as linhas são longas e o detalhe está nas references, um nível abaixo.

## 6. Segunda rodada (20/10/2026): a `samais-rota-study` do `samais-copilot`

Fonte: `samais-copilot/.claude/skills/samais-rota-study/` (`SKILL.md` 233 linhas, 9.970 bytes; `references/benchmarks-rota.md`
394 linhas, 18.661 bytes; criada em 05/10/2026 com o "Memorando e Projeto de Investimento ROTA", commit `5ced612`).
Conferida contra o modo transporte, `samais-os/produtos/rota/portaria-11165.md` (texto lido em 16/10),
`samais-estudos/referencias/benchmark-transporte-sanitario.md` e os não-negociáveis do `CLAUDE.md`. O que entrou foi para
o arquivo novo `transporte-demanda-e-viabilidade.md` (162 linhas), com ponteiros no modo e no `SKILL.md`; a descrição
ganhou "TSE", "ROTA", "transporte eletivo" e "PAC Saúde" (999 caracteres). Depois da rodada: `SKILL.md` com 190 linhas e
14.982 bytes (≈ 3.745 tokens); `references/` sem este histórico, 10 arquivos com 1.220 linhas.

### O que entrou

| Da antiga skill | Onde |
|---|---|
| Porte não ordena carteira; a distância dos 50 km é fonte de custeio, não medida de oportunidade (§1-B); o polo entra pelo eletivo intramunicipal e pelo TFD de saída | `transporte-demanda-e-viabilidade.md` §1, corrigido pelo art. 25 (operador regional) |
| "Nunca `benchmarks-samu.md` aqui": o SAMU dimensiona pela norma, a eletiva pela geometria da demanda | §1 |
| Atestado de cadastro (UF, população, grafia) bloqueante, divergência reportada | §2; `modo-transporte-sanitario.md` §3.1 |
| Rede efetivamente habilitada no CNES; distância lida, nunca estimada; "a confirmar" → ○ | §2; `modo-transporte-sanitario.md` §3.3 |
| Parâmetros de demanda (SBN, INCA), fórmulas, banda Norte/Nordeste, conferência de 0,09–0,15 viagem/hab/ano, eletivo geral sem parâmetro | §3, como ≈ (fonte única, não relida) |
| PT 1.631/2015 como campo, não demanda; absenteísmo ~25%; compromisso de processo, nunca garantia | §3 |
| Bloco fixo + variável, per capita como resultado; km por ciclo pelo tempo (lição de Belém, 10,6%); depreciação por tipo; os dois cenários de frota em tabela; operador de central por 75 atendimentos | §4, como ≈ e só nos artefatos 1 e 3 |
| Ambulância de apoio na eletiva (maca, intercorrência pós-hemodiálise), tipo B por padrão, ≈ 1 por 13 veículos, linha fixa | §4, com o FC 2,57 da eletiva no lugar do 1,2 FTE |
| Piso operacional: três testes; blocos contíguos; rateio no bloco; consórcio de transporte raro | §5, interno |
| Link em peça: citação no texto antes; o ato (DOU, Saúde Legis), nunca a notícia do gov.br | §6; `modo-transporte-sanitario.md` §8 |
| Checklist de encerramento (itens compatíveis) | §7 |

### O que não entrou, e por quê

| Da antiga skill | Motivo |
|---|---|
| Portaria **11.179** listada como a terceira norma "de radioterapia e TRS" | trata de CNES e nefrologia; o par é 11.164 + 11.165 (texto lido em 16/10/2026) |
| Cofinanciamento como "reembolso por procedimento na tabela SUS" | o texto lido: incentivo mensal mantido pelo BPA-I; no SIGTAP o procedimento vale R$ 0,00 |
| "Preço = CDO × 1,35"; "BDI 35% sobre CDO"; `composicao-preco.md` | superados pelo gross-up com remuneração residual (lição Canoas) e pelo custo construído (19/10/2026); o `composicao-preco.md` citado foi absorvido por `composicao-e-anexo.md` |
| Blocos fixo e variável em R$ (R$ 51.970 / R$ 28.930; R$ 15.996 e R$ 12.496 por veículo; ambulância R$ 19.681 e R$ 12.898); pisos de R$ 127.563 e R$ 89.805 por mês e per capita no piso | régua fixa, superada pelo custo construído; e valor por veículo não vai a peça |
| Encargos de 70%; motorista "com cobertura" de 1,2 FTE | os encargos saem de `parametros-custo.json`; o FC da eletiva é 2,57 (janela de 16 h × 6 dias) e o 24/7 é 4,5 |
| Ocupação de 80% | o aproveitamento é 85% (regra do Ota, 20/08/2026) |
| Modelo de raio com preço unitário por faixa A–D (R$ 12,84 a R$ 92,87 por atendimento) e **escada de aditivos** | o contrato é único, sem faseamento e sem "ampliação futura" (20/08/2026); o preço por faixa embutia o × 1,35. Ficou a regra do km por ciclo |
| USA 24 h inter-hospitalar "como aditivo nomeado, fora do eletivo" | o contrato único leva eletiva e inter-hospitalar num instrumento, desde o dia 1 |
| Dois outputs (proposta externa A e dossiê interno B) | a casa produz três artefatos e publica por merge (19/08/2026) |
| Cross-sell com o SAMU ("mesmo decisor, mesmo orçamento") | "dois serviços, dois estudos" e "sem porta de entrada" (20/08/2026) |
| Payback de 6–14 meses (frota cedida) contra 25–36 (própria) | sem fonte, e contradiz a própria skill ("a cessão não muda o payback, muda o preço") |
| "Quem captura o cofinanciamento são só os vizinhos que enviam paciente" | o art. 25 da 11.165 põe o custeio com o operador regional pactuado na CIB |
| "Receita" e "per capita" como métrica de carteira | o valor final se declara Custo Operacional (16/10/2026); receita é palavra interna |
| Template "50% federal + 50% local não se aplica" | correto, mas a peça não fala de percentual nem de "quem paga" (FNS em uma linha) |
| Deploy na Vercel; resumo em 6 tópicos; curadoria visual de van e estrada | já cobertos por `portao-publicacao-entrega.md` e pelo modo §8 |

### Decisões que ficam com o Ota

1. **Forma de pagamento do transporte.** A antiga skill recomendava, no primeiro contrato, parte fixa de disponibilidade
   mais parte variável por viagem (ou preço fixo com revisão por volume apurado), porque a banda de demanda é de quase
   2×. A doutrina fixa o contrato único sem faseamento, mas não diz se o valor é global mensal ou em duas partes.
   **Pesquisa de 20/10/2026** (30 instrumentos, 18 UFs): o km rodado é o modelo mais escrito (≈ 33%); a recomendação é
   Custo Operacional mensal global com franquia de km aferida pelo ROTA-OS. Decisão segue com o Ota.
2. **A regra do link** ("citação no texto antes; o ato, nunca a notícia do gov.br") nasceu na proposta ROTA e entrou no
   modo transporte. Vale para os estudos de SAMU? Hoje `peca-cliente.md` não a tem.
3. **Ambulância de apoio na eletiva** (tipo B, ≈ 1 por 13 veículos): premissa da antiga skill, ancorada só em Osasco.
   **Conferida em 20/10/2026 e caiu:** não há norma do SUS nem prática de mercado (0 de 29 instrumentos eletivos); a
   âncora vinha da própria proposta da Samais para Osasco (`samais-copilot`, `rota-proposta/osasco.html`). O Ota decidiu:
   *"se não for padrão, não deixaremos como padrão"*. Tipo A só com demanda medida; intercorrência pelo SAMU 192.
   Pesquisa: `samais-os/inteligencia/transporte-sanitario/remuneracao-e-apoio.md`.

## 7. Imagem gerada de operação (Ota, 20/10/2026)

- `peca-cliente.md` §7 deixa de admitir a imagem de marca gerada sem condição: *"pode admitir, mas de forma que ela pode
  ser gerada somente quando não encontrarmos candidatos viáveis. Portanto, o fluxo seria uma pesquisa para entender a
  localidade, quais os pontos de interesse do município ou da região, e utilizar ela como base para gerar uma nova,
  dentro das resoluções e proporções que estabelecemos."* A ordem (banco curado e foto real → pesquisa da localidade →
  gerada sobre a pesquisa, nos tamanhos mínimos, via grátis, selo na legenda) é a mesma de
  `samais-os/doutrina/padrao-dobras.md` e da `samais-brand-guidelines`, e resolve a divergência registrada no histórico
  dela.

## 20/10/2026 — o modelo de pagamento do transporte decidido

Ota, sobre a recomendação da pesquisa `samais-os/inteligencia/transporte-sanitario/remuneracao-e-apoio.md`: *"siga sua
recomendação"*. O modo transporte passa a propor Custo Operacional mensal global com franquia de km aferida pelo ROTA-OS
e preço do km excedente (`transporte-demanda-e-viabilidade.md` §5); edital em km se precifica pelo ciclo, com o risco
registrado.

