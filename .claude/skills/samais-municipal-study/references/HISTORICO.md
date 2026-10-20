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
