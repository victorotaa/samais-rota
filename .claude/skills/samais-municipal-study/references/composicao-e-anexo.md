# Composição do Valor Contratual e anexo de memória financeira (FASE 3c)

**Uso interno.** Tudo deste arquivo vive no Artefato 1 (markdown interno) e no Artefato 3 (anexo, nunca publicado). Na
página cliente vai só o valor final, rotulado **Custo Operacional**; BDI, CDO, margem, remuneração, fator de cobertura,
preço por viatura, bridge custo→preço, ranking interno e "Métrica de Ouro" **nunca vão a terceiro**. Estruturação
jurídico-tributária e veículos de remuneração não se registram em arquivo: só em conversa.

**Sumário:** 1. Vocabulário · 2. Do custo ao preço · 3. Remuneração residual · 4. BDI decomposto · 5. Textos por linha ·
6. Como apresentar · 7. Base normativa · 8. O anexo

---

## 1. Vocabulário

- ❌ Nunca, em superfície alguma: lucro, lucratividade, margem, rentabilidade, ROI, markup, comissão, fee.
- ✅ "Composição do Valor Contratual" · "Encargos e Provisões Contratuais" · "Remuneração Empresarial" ·
  "sustentabilidade econômico-financeira da operação".
- O **valor final** de estudo, oportunidade ou perspectiva de contrato se rotula **Custo Operacional** (Ota, 16/10/2026);
  "oportunidade de mercado" continua para o conceito. Teste: se a palavra rotula um número, é Custo Operacional.

## 2. Do custo ao preço

- O Custo Operacional (`calculo-custo-construido.md`) é custo: sem margem, BDI nem tributo.
- O preço sai do custo com o **gross-up** (tributos e remuneração "por dentro"): `samais-estudos/FORMULA-MESTRE.md` §8.
  O preço segue ancorado no teto de mercado; a margem sai do **Lean Sizing do escopo** (o que contratamos), nunca de
  cortar qualidade.
- **Ganho de roteirização é nosso** (transporte): eficiência da operação fica na remuneração, nunca vira desconto.
- **Sustentação de tecnologia é custo, não margem**: reserva técnica cobre o previsível-variável, contingências o
  imprevisto, remuneração é a margem. Pagar custo certo com a margem gasta o colchão antes da oscilação.

## 3. Remuneração residual: calcular sempre (lição Canoas)

A tabela do §4 lista tudo como "% sobre CDO", mas **tributo incide sobre faturamento**. Com BDI de 35%, tributos de 13,5%
× preço = 18,2% do CDO, e as demais linhas somam 20,5%: 38,7% > 35%. A remuneração real fica negativa. Por isso:

```
remuneração = preço − CDO − (tributos × preço) − (demais × CDO)
```

- Abaixo de ~5% do preço, o BDI está errado para aquela operação.
- Piso prático: **BDI ≈ 46% para 4% de remuneração · ≈ 52% para 7% · ≈ 57% para 10%.** O BDI maior não infla o preço:
  revela o custo verdadeiro.
- A exposição trabalhista da transferência se confere contra o residual; vira linha de custo só abaixo de ~5%.

## 4. BDI decomposto (ponto de partida, nunca resultado)

| # | Componente | % sobre CDO | Natureza |
|---|---|---:|---|
| 1 | Tributos sobre faturamento (PIS/COFINS + ISS + IR/CSLL) | 13,5% | obrigatório |
| 2 | Despesas administrativas e de gestão corporativa | 8,0% | estrutural |
| 3 | Tecnologia, sistemas e inovação operacional (CoPilot OS / ROTA-OS) | 5,0% | diferencial |
| 4 | Reserva técnica operacional | 3,0% | prudencial |
| 5 | Capacitação continuada e desenvolvimento técnico | 2,0% | diferencial |
| 6 | Contingências, seguros e garantias contratuais | 2,5% | prudencial |
| 7 | Remuneração empresarial | 4,0% | resultado |
| | **Total apresentado** | **38,0%** | |
| | *Piso de negociação (remuneração em 3,5%)* | *37,5%* | |

Tributos (referência Lucro Real): PIS 1,65% · COFINS 7,6% · ISS do município (2–5%, ~3%) · IR/CSLL ~1,25%. Lucro
Presumido ≈ 9,5%. O **ISS do município** muda o preço: perguntar no briefing.

## 5. Textos por linha (para planilha aberta)

1. **Tributos:** "Encargos tributários incidentes sobre o faturamento bruto do contrato, incluindo PIS, COFINS, ISS
   municipal e provisão de IR/CSLL. A alíquota de ISS varia conforme a legislação do município contratante."
2. **Administração (8%):** estrutura corporativa ~3,5%, coordenação técnica e supervisão regional ~2,5%, sistemas internos
   ~1%, despesas gerais ~1%. "Rateio proporcional da estrutura administrativa corporativa Samais: direção executiva,
   jurídico e contratual, gestão financeira, recursos humanos, coordenação técnica regional, sistemas internos e despesas
   gerais (auditoria externa, contabilidade, certificações)."
3. **Tecnologia (5%):** CoPilot OS ~2%, software de regulação e despacho ~1%, telemedicina embarcada ~0,7%, equipamentos
   embarcados ~0,8%, integrações ~0,5%. "Investimento em infraestrutura tecnológica própria, incluindo a plataforma Samais
   CoPilot OS, sistema de apoio à decisão do regulador médico, desenvolvido internamente pela Samais. A plataforma
   estrutura o registro clínico da chamada, apoia a classificação de risco e mede na origem os tempos do atendimento,
   instrumentando os indicadores do contrato." Regra de linguagem: `peca-cliente.md` §6.
4. **Reserva técnica (3%):** reposição de frota ~1,5%, equipamentos médicos ~0,8%, contingências operacionais ~0,7%.
   "Provisão técnica para reposição e manutenção preventiva da frota, substituição emergencial de equipamentos médicos
   críticos e reserva para contingências operacionais, garantindo continuidade sem ônus adicional ao contratante."
5. **Capacitação (2%):** BLS, ACLS, ATLS ~1%; PHTLS, PALS, AMLS ~0,5%; formação em tecnologia ~0,5%. A formação no uso
   do CoPilot está nesta linha: não é custo extra ao contratante.
6. **Contingências, seguros e garantias (2,5%):** garantia contratual (5% do valor anual) ~0,5%, seguros ~0,6%, reserva
   para passivos ~0,4%.
7. **Remuneração empresarial (4%):** "Retorno sobre o capital investido e o risco operacional assumido pela contratada,
   que viabiliza a sustentabilidade econômica da operação e o investimento contínuo em inovação e capacitação."

## 6. Como apresentar

- **Valor global (o mais comum):** só o valor final, com memória descritiva; a decomposição não aparece.
- **Edital que exige planilha aberta:** a tabela do §4 com o título "Composição do Valor Contratual — Encargos e
  Provisões"; a linha 7 é "Remuneração Empresarial", nunca "lucro".
- **Negociação:** linhas travadas (tributos, contingências e reserva = 19%); ajustáveis só administração e remuneração.
  Concessão limitada em troca de prazo maior, pagamento antecipado ou escopo maior. **A remuneração nunca abaixo de
  2,5%** (piso de diretoria).

## 7. Base normativa do BDI

Lei 14.133/2021 (formação de preço) · Súmula 253/TCU · Acórdão 2.622/2013-TCU-Plenário ("o BDI deve explicitar os
componentes: Administração Central, Seguros e Garantias, Despesas Financeiras, Risco, Tributos e Lucro") · IN 05/2017
(subsidiária, terceirização).

## 8. O anexo de memória financeira (Artefato 3)

- Caminho: `samais-estudos/anexos/<slug>-memoria-financeira.html`. **Nunca publicado**: protegido por
  `/anexos/*-memoria-financeira.html` no `.vercelignore`. Depois do deploy, a URL tem que dar **404**.
- Padrão: `samais-estudos/referencias/anexo-composicao-preco.md`; implementação de referência:
  `anexos/canoas-rs-memoria-financeira.html`.
- Conteúdo: CDO rubrica a rubrica, ponte custo→preço até a remuneração residual, BDI decomposto, tabela de preço por
  unidade (`samais-estudos/referencias/tabela-precos-unitarios.md`) e benchmark.
- **Mudou o preço, mudam cinco lugares no mesmo PR:** página, cartão da home, markdown interno, anexo e `status.json`.
  `grep` pelo valor antigo nos cinco antes do portão.
