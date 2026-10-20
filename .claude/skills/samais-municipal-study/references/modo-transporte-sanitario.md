# Modo transporte sanitário (eletivo, TFD e inter-hospitalar)

Absorve a antiga skill `samais-transporte-study` (samais-rota). As fases, os três artefatos, o portão e a publicação são
os mesmos do estudo; aqui está só o que é próprio do transporte. **O objeto e o contrato são próprios, nunca rubrica do
SAMU**: se o alvo tem os dois, são dois estudos.

**Sumário:** 1. As regras da casa · 2. A norma (11.164 + 11.165) · 3. Varredura · 4. Dimensionamento · 5. Custo ·
6. Cenários e score · 7. Repasse federal e farol de conformidade · 8. A peça · 9. Repasses observados · 10. Fontes

---

## 1. As regras da casa

- **Contrato único, sem faseamento** (Ota, 20/08/2026): as duas frentes, **eletiva** (hemodiálise, oncologia, consultas,
  TFD) e **inter-hospitalar**, num instrumento só, em operação plena desde o dia 1. Sem porta de entrada, sem tabela de
  etapas, sem "ampliação futura". A tese do ROTA recomenda entrada gradual como estratégia de mercado; a casa decidiu o
  contrário (`samais-estudos/estudos-internos/belem-pa-transporte-sanitario.md` §5). A regra é **escopada ao
  transporte**: o SAMU mantém o gatilho de fase 2.
- **O sistema é o ROTA-OS** (ROTA é a frente e a tese; ROTA-OS é o sistema, console em
  `samais-rota.vercel.app/rota-app.html`). O PEP-OS não entra em peça de transporte.
- **Sem R$ por veículo em peça.** Nem preço, nem custo, nem a faixa federal por pessoa.
- **Perguntar qual frente antes de escolher o veículo:** eletiva usa van, micro-ônibus e veículo acessível com
  motorista; inter-hospitalar usa ambulância tipo B e D tripulada 24/7. Hemodiálise dimensionada com ambulância tipo B
  põe 9 CLT onde bastava motorista (erro do primeiro estudo de Belém).
- **Nunca comparar locação (só a viatura) com operação (viatura + tripulação):** R$ 13,8 mil × R$ 182,7 mil por mês.
  Declarar sempre o degrau de escopo e o km de referência.

## 2. A norma: Portarias GM/MS 11.164 e 11.165/2026

**O par certo é 11.164 + 11.165, nunca 11.179** (a 11.179/2026 trata de CNES e nefrologia; o título de uma matéria do
CONASS errou o número). A 11.165 regula a **operação**; a 11.164 altera a 8.516/2025 e regula o **financiamento**. Texto
lido no DOU de 12/05/2026; fatos, artigos e lacunas em `samais-os/produtos/rota/portaria-11165.md` (casos de teste em
`portaria-11165-casos.json`). Procedência abaixo: ✓ lido no texto oficial; ≈ derivado.

**Quem tem direito**
- Pacientes em **radioterapia** (serviço habilitado) e **hemodiálise**, e acompanhantes, com serviço a **mais de 50 km**
  do município de residência (11.165 art. 1º §1º) ✓.
- Distância **de município a município** (residência → sede do serviço regulado), não do endereço à clínica ✓; serviço
  em **ente federativo diverso** (Lei 12.732, arts. 2º-A §3º e 2º-B §3º) ✓; **teto de 500 km** (11.164) ✓, aplicado às
  duas modalidades ≈; **hemodiálise só dentro do estado** ✓.
- Só com **tratamento agendado e confirmado**, integrado à regulação (art. 13 §§2º e 3º) ✓.
- Financiado: radioterapia, uma ida e volta de planejamento e uma de tratamento por paciente e acompanhante (art. 15) ✓;
  hemodiálise, **até 3 idas e 3 voltas por semana**, acompanhantes **até 10% dos pacientes por viagem** (art. 16) ✓.
- TFD (Portaria SAS/MS 55/1999, art. 1º §5º): vedado em deslocamentos menores que 50 km **e em regiões metropolitanas**.

**O veículo**
- Van acessível de 15 lugares, micro-ônibus acessível de 29, ambulância tipo A (prioritariamente radioterapia) e
  embarcação (art. 3º) ✓; o CNES usa outras capacidades (SAES/MS 4.904/2026): guardar a **lotação real** ✓.
- Doação com encargos (Caminhos da Saúde / Novo PAC). O Termo obriga o ente (art. 11) ✓: uso exclusivo em transporte
  sanitário; custear combustível, manutenção, emplacamento, seguro e pessoal; **CNES em até 60 dias** do recebimento;
  mecanismo de gestão da frota (km, custo operacional, taxa de ocupação); prestação de contas no RAG; manutenção
  preventiva e seguro vigente.
- **Operação em até 60 dias do recebimento, mais 30 de prorrogação**, sob pena de revogação da doação e suspensão do
  custeio ✓. Renovação: 5 anos, 300.000 km ou disponibilidade abaixo de 70% em 12 meses ✓.

**O incentivo de custeio**
- **Só vans e micro-ônibus cedidos pelo Ministério** (art. 14) ✓; ambulância tipo A opera, mas não entra; a cota "outros
  tratamentos" não tem custeio ✓ (NT 153/2026).
- Três condições: CNES do veículo, estrutura de gestão articulada às agendas clínicas, deliberação CIB com os entes, os
  fluxos e quem recebe ✓.
- **Repasse mensal mantido enquanto houver registro de produção no BPA-I do SIA/SUS** (art. 21) ✓, nos procedimentos
  **08.03.01.015-0** (radioterapia) e **08.03.01.016-8** (hemodiálise) ✓. No SIGTAP o procedimento vale **R$ 0,00**: o
  BPA-I não fatura viagem, mantém o incentivo vivo ✓. CPF obrigatório no BPA-I (o ROTA-OS não guarda CPF; o faturamento
  do ente completa, decisão do Ota de 16/10/2026).
- **Três meses seguidos sem registro: suspenso até a retomada; seis: excluído** (art. 21 §2º) ✓.
- **Operador regional** (art. 25): a CIB pode pactuar município ou consórcio de referência que opere para os vizinhos, e
  **o custeio dos municípios envolvidos fica com quem opera** ✓. Para consórcio ou município de referência, esse custeio
  a habilitar é oportunidade.
- Uso secundário (outros usuários do SUS) só planejado, autorizado e registrado, sem prejudicar o prioritário (art. 4º) ✓.
- Efeito desde a competência maio/2026; parâmetros revistos até 180 dias após a implementação (art. 33) ✓: vigiar o DOU.
- **Faixas de distância** (11.164, Anexo IV: valor por pessoa, ida e volta) são **parâmetro do cálculo federal**: servem
  para classificar e conferir; **não são preço, não são valor por veículo e não entram em peça**.
- ≈ A imprensa descreveu o incentivo como cobrindo custo fixo e variável, inclusive RH; o texto lido põe esses itens como
  encargo do ente (art. 11 II) e o incentivo como repasse mensal (art. 21). Na peça, vale o texto.
- Lacunas (○): layout do BPA-I, unidade da "quantidade" (máximo 12), linha do acompanhante, matriz oficial de distâncias,
  atos de habilitação por ente (nenhum achado no DOU até 16/10/2026), cota dos Termos de Doação de outubro.

## 3. Varredura (além de `fontes-e-coleta.md`)

1. **Qualificação:** alvo (município, consórcio, GRS/CRS estadual); contratante provável; gatilho (pregão, veículo federal
   recebido ou anunciado, cobrança do MP, contrato vencendo, crise); frota (recebeu veículos do Caminhos da Saúde? quais,
   quando? frota própria ou locada?); destinos de referência e distância.
2. **Demanda:** SIA eletivo (hemodiálise e oncologia por residência e por atendimento; o fluxo de saída é proxy:
   residência − atendimento) e SIH (residência × internação, medido), por `samais-os/scripts/raiox/sia-eletivo.mjs` e
   `sih-fluxo.mjs`; a projeção estadual sai de `scripts/raiox/transporte-sanitario.mjs`. Cada paciente em hemodiálise faz
   ~13 sessões/mês, indefinidamente: a demanda mais previsível da saúde pública. Prevalência (~0,1% da população em
   terapia renal substitutiva) só como estimativa ≈, validada na visita; nunca como censo.
3. **Malha de destinos:** destino por especialidade e distância **de município a município** com fonte (guardar o print);
   classificar cada fluxo: ≤ 50 km ou > 50 e ≤ 500 km.
4. **Frota federal e habilitação:** veículos doados (tipo, data de recebimento), CNES, prazo dos 60 dias, Termo de Doação
   e a cota (o extrato não diz: ler o termo no processo SEI). Veículo doado parado é urgência real do ente.
5. **Contratação atual:** PNCP e portal pelo objeto (transporte de pacientes, TFD, locação de veículos com motorista),
   pregões desertos ou anulados, cobranças do MP e do TCE; contratado, não pago.

## 4. Dimensionamento

- **Dimensionar pelo aproveitamento real, nunca pela capacidade nominal** (Ota, 20/08/2026): rodar a 100% vende a nossa
  eficiência futura a preço de custo e entrega frota que não cobre o serviço.
- **Motor da eletiva** (`samais-estudos/referencias/benchmark-transporte-sanitario.md` §3b-ter):

```
slots/semana por veículo = turnos/dia × dias/semana            (hemodiálise: 3 turnos × 6 dias; 3 sessões/paciente/semana)
pacientes por veículo    = slots × capacidade efetiva ÷ sessões por paciente × aproveitamento
capacidade efetiva       = assentos ÷ ~2                       (o acompanhante ocupa assento)
veículos                 = pacientes ÷ pacientes por veículo, por classe de embarque
```

  Aproveitamento **85%, premissa a calibrar** (vira medida quando o ROTA-OS operar). O ÷2 é assento por viagem; o
  aproveitamento é ocupação entre viagens: não há contagem dupla. Van de 15: 38,2 pacientes; micro de 26: 66,3; van
  acessível 11+1: 30,6. O acompanhante financiável na hemodiálise é até 10% por viagem; o operacional, o real.
- **Paciente de maca nunca em veículo comum** (vai em ambulância).
- **FC da eletiva = 2,57** (janela 16 h × 6 dias: 96 ÷ 44 × 1,18), a mesma curva do 4,5 de 24/7. Não é o 2,2 proibido
  (que é FC de um turno usado para 24/7). **Inter-hospitalar: viatura-hora e FC 4,5** (`calculo-custo-construido.md` §5).
- **Lean Sizing do escopo** (micro-ônibus onde a rota é densa, posto de 12 h no pico, frota mista) muda o que se contrata
  e entra no preço; ganho de roteirização na operação é nosso e fica na remuneração.
- Sensibilidade ancorada em **pacientes com restrição**, nunca em % de frota.

## 5. Custo

- **Custo construído também aqui** (19/10/2026): força de trabalho × piso da UF × encargos + frota (locação medida, ou
  frota doada) + combustível por km + manutenção + seguro + sistema + gestão + indiretos. Réguas medidas: locação pura e
  homologado (§3b-sexies do benchmark), o motorista conferido (§3b-quater), o **monitor é um segundo posto CLT por
  veículo** (§3b-quinquies). CNH D para toda a frota leve. Passivo trabalhista como no SAMU.
- **Sustentação do ROTA-OS é rubrica** (equipe de tecnologia pelo contrato inteiro; `parametros-base.md` §5b): o pacote
  antigo de R$ 30.800/veículo não a decompunha.
- R$/veículo de mercado não se compara ao nosso (janelas diferentes); dispensa emergencial paga ~2× e não é régua.
- Tudo isso é Artefato 1 e 3. **Na peça, nada por veículo.**

## 6. Cenários e score

- **Cenários de cobertura** (20/30/50%, doutrina de 20/08/2026), escolhidos antes de assinar; sempre o trio. Recorte de
  escopo disponível (antiga skill de transporte): **Mínimo** = fluxos elegíveis ao incentivo com frota doada; **Base ★** =
  + TFD municipal consolidado; **Ampliada** = + eletivo intramunicipal (≤ 50 km) e casa de apoio. O inter-hospitalar vai
  no mesmo instrumento.
- **Score de atratividade** (interno):

| Critério | Peso | Nota |
|---|---|---|
| Demanda estruturada (hemodiálise e oncologia > 50 km) | 25% | > 40 pacientes elegíveis = 10 |
| Veículo federal recebido ou anunciado | 20% | recebido e parado = 10 (prazo dos 60 dias) |
| Contratação pública existente | 20% | contrato vencendo ou pregão anulado = 10 |
| Capacidade fiscal do contratante | 15% | SIOPS + CAUC |
| Janela política | 10% | como no SAMU |
| Cobrança do MP ou do TCE | 10% | cobrança formal = 10 |

## 7. Repasse federal e farol de conformidade

**Tese:** a gestão é o que **habilita** o ente ao custeio federal e o **mantém vivo** mês a mês. Sem comprovação, o
repasse é suspenso em três meses.

- **Antes de citar repasse, medir a distância.** Município com o serviço no próprio território ou na região metropolitana
  não gera deslocamento elegível (Osasco: TRS em casa e 18,7 km da capital: inelegível pelo dispositivo). Capital com a
  rede dentro dela está no mesmo caso; quem pode pleitear é o município de origem. Frase segura: *"não há repasse federal
  de custeio de transporte sanitário aplicável a este município; a via federal existente é veículo, por emenda
  parlamentar ou por pactuação na CIB."*
- **Na peça:** o repasse é fato (mecânica mensal, condicionada ao registro) e oportunidade (custeio a habilitar, operador
  regional do art. 25); sem percentual, sem "quem paga", sem a faixa por pessoa. O **farol de conformidade** (prazos de
  CNES e operação, remessa BPA-I por competência, alerta no 2º mês sem registro) é o que o ROTA-OS entrega; mostrar o
  mecanismo, nunca a tela cheia do demo.
- **No Artefato 1 (interno):** a pilha de financiamento (Custo Operacional − custeio federal projetado − economia contra o
  contrato atual = desembolso do tesouro) e o simulador. A estimativa do ente se lê no anexo da 11.165 (Anexos I a LII,
  por UF) ✓; sem ela, ○. Levar a pilha à página é decisão do Ota. Em material público, **sem calculadora interativa**.
- Risco declarado pela tese: a portaria é da gestão atual e pode mudar depois das eleições; a mitigação é contrato longo
  (48–60 meses) assinado dentro da janela (interno).

## 8. A peça (mesma estrutura do estudo, com estas trocas)

- Hero e território com **os pacientes** (demanda, destinos, distâncias); a operação desenhada (rotas, frota, equipe,
  cenário ★); o repasse que a operação habilita e protege, com o farol; o ROTA-OS (captura de tela, manifesto, folha de
  embarque, relatório mensal de comprovação); por que a Samais; fechamento pela tese ou pelo link da demo.
- **Sem case:** a Samais tem atestados reais de SAMU, inter-hospitalar e regulação, mas **não de transporte de
  pacientes**. A prova é o sistema e a norma; proibido apresentar credencial de SAMU como experiência de transporte.
- Sem R$ por veículo; sem campo de contato; mobile sem rolagem horizontal; sigla explicada (TRS = hemodiálise).
- **Resumo da entrega** (FASE 6) acrescenta: a janela dos 60 dias, se houver veículo doado, e a condição do repasse
  (elegível, inelegível pela distância, ou pendente).
- Imagem: van ou micro-ônibus na estrada, embarque digno, fachada de clínica de diálise; equipe de jaleco neutro com o
  monograma SA+, nunca uniforme SAMU; vetado maca, sirene, drama, paciente identificável.

## 9. Repasses observados (base de rastreamento; atualizar a cada varredura)

Método: anexos das 11.164 e 11.165 (estimativa por UF e faixas) · pagamentos do FNS (portalfns.saude.gov.br, fundo a
fundo, é onde o mensal aparece) · Portal da Transparência (transferências por favorecido) · notícias oficiais por estado
(a entrega do veículo precede o custeio).

| UF | Veículos (capital, doação) | Observação | Fonte (data) |
|---|---|---|---|
| Brasil | 3.300 (1ª compra: 2.100); R$ 1,4 bi; ≈ 1.476 para radioterapia e hemodiálise | van 15, micro 29, ambulâncias, embarcações | gov.br/saude (fev e abr/2026) |
| PI | 154 | 42 ambulâncias, 65 micro-ônibus, 47 vans; 79 para 75 municípios | Portal O Dia / Parlamento PI (mai/2026) |
| PB | 168 | lista municipal publicada | A União PB; ClickPicuí (abr/2026) |
| RJ | 77 | — | gov.br/saude (mai/2026) |
| MG | 47 (primeiros) + R$ 63 mi anunciados | programa estadual Transporta SUS coexiste | gov.br/saude (abr/2026) |
| CE | primeiros lotes + R$ 400 mi anunciados | 1º estado a receber | Secom (abr/2026) |
| MA | 15 | recebidos pela SES-MA | saude.ma.gov.br |

- Impacto nacional publicado ≈: ~R$ 26,0 mi/ano (radioterapia) + ~R$ 165,5 mi/ano (hemodiálise); outra fonte dá
  R$ 165,4 mi para a 11.164 (CONASS/CONASEMS, 11/05/2026). Fontes divergem na casa decimal: ≈.
- Caso Marília/SP (radioterapia, PT 8.516/2025 + 6.867/2025): incorporação anual de R$ 2,46 mi + 30% inicial
  (~R$ 649,4 mil em nov–dez/2025). Ordem de grandeza do serviço a que o transporte se acopla, **não** valor do transporte.
- Leitura comercial (interna): estado que recebeu veículo e não estruturou operação tem a janela dos 60 dias correndo;
  a lista municipal da PB permite cruzar com a demanda dialítica; sem doação, a tese é TFD municipal + pleito de adesão.

## 10. Fontes

- `samais-os/produtos/rota/portaria-11165.md` (a norma lida, matriz artigo → obrigação → ROTA-OS, painel de aderência,
  LGPD, lacunas) e `portaria-11165-casos.json`.
- `samais-estudos/referencias/benchmark-transporte-sanitario.md` (frentes, régua de veículo, motor, locação medida).
- Estudos vivos: `samais-estudos/estudos-internos/belem-pa-transporte-sanitario.md`, `osasco-sp-transporte-sanitario.md`,
  `manaus-am-transporte-sanitario.md` (e os anexos de mesmo nome).
- `samais-rota`: `docs/ROTA-SPEC.md`, `docs/PORTARIA-11165-INTEGRACAO.md`, `regras/portaria-11165.mjs`, `rota-app.html`
  (demo), `municipios.html` (due diligence de 12 praças RN/PI/CE), `monitoramento.html` (radar semanal).
