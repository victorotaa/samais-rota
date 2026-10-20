# Transporte sanitário: demanda, custo por ciclo e viabilidade

> Complemento do [modo transporte sanitário](modo-transporte-sanitario.md). Absorve a antiga `samais-rota-study`
> (`samais-copilot`, 05/10/2026, criada com o "Memorando e Projeto de Investimento ROTA") e o `benchmarks-rota.md` dela,
> no que é único e compatível com a doutrina de 20/10/2026. O que contradiz ficou fora (`HISTORICO.md` §6). Os números
> da antiga skill **não foram relidos na fonte** nesta unificação: entram como ≈, com a fonte que ela citava, e se
> reconferem antes de ir a peça.

**Sumário:** 1. O que decide a oportunidade · 2. Cadastro, polo e distância · 3. Demanda · 4. Custo · 5. Viabilidade
(interna) · 6. A norma citada na peça · 7. Checagem de encerramento

---

## 1. O que decide a oportunidade

- O SAMU dimensiona contra a norma (PT 1.010/2012). A eletiva dimensiona contra a **geometria da demanda**: quantos
  pacientes, para onde, a que distância. Régua, KPI e benchmark do SAMU não se aplicam aqui.
- **Porte populacional não ordena carteira.** O volume vem da posição do ente no fluxo (envia ou recebe paciente) e do
  raio entre a casa do paciente e a unidade de destino. Município pequeno longe do polo pode deslocar mais que um grande
  que já é polo.
- **A distância dos 50 km é fonte de custeio, não medida de oportunidade.** Ordenar a prospecção pelo gatilho da
  portaria descarta capital e polo, onde o serviço existe, o volume é grande e o deslocamento é curto. O que decide se
  vale entrar é o volume de atendimento agendado no território do ente.
- **Polo** não gera deslocamento elegível para si. A proposta se ancora no eletivo intramunicipal, no TFD de saída e,
  se a CIB pactuar, no papel de **operador regional** (11.165, art. 25: o custeio dos municípios envolvidos fica com quem
  opera; `modo-transporte-sanitario.md` §2). A antiga skill dizia que o polo "não captura o cofinanciamento"; o art. 25,
  lido em 16/10/2026, abre essa porta.

## 2. Cadastro, polo e distância (bloqueantes, ente a ente)

- **Conferência de cadastro antes de modelar**, em toda carteira com mais de um ente: UF (decide se o fluxo é intra ou
  interestadual; a hemodiálise só cobre o próprio estado), população (o denominador de tudo) e grafia oficial (nome
  errado trava a busca no CNES, no PNCP e no IBGE). **Divergência se reporta; nunca se corrige em silêncio.**
- **Polo de referência:** onde o paciente é atendido, por especialidade. Ler no CNES a rede **efetivamente habilitada**
  (terapia renal substitutiva, radioterapia), não a anunciada. Serviço interditado ou em implantação muda o polo, logo a
  distância, logo a elegibilidade e o custo.
- **Distância lida, nunca estimada**, de município a município, com a fonte guardada (print). Sem leitura, ○: o fluxo
  não se classifica e o repasse não se cita. Um erro de faixa nos 50 km derruba a premissa inteira; confirmar antes de
  qualquer manifestação formal. A matriz oficial de distâncias da norma segue ○ (`modo-transporte-sanitario.md` §2).

## 3. Demanda

A medida vem primeiro: SIA e SIH por residência e por atendimento (`modo-transporte-sanitario.md` §3). Os parâmetros
abaixo **só conferem** a ordem de grandeza; nunca substituem a medida nem viram censo.

| Parâmetro | Valor | Fonte citada pela antiga skill | Procedência |
|---|---|---|---|
| Prevalência de diálise, média nacional | 812 por milhão | Censo Brasileiro de Diálise 2024 (SBN) | ≈ fonte única, reconferir |
| Dispersão entre estados conhecidos | 431 (MA) a 806 (PE) por milhão | idem | ≈ |
| Diálise de centro (hemodiálise + hemodiafiltração) | 94,4% | idem | ≈ |
| Casos novos de câncer, exceto pele não melanoma | 518 mil/ano (≈ 2.427 por milhão sobre 213,4 mi hab.) | INCA, estimativa 2026–2028; IBGE 2025 | ≈ |
| Oncológicos que fazem radioterapia | 50% (piso da faixa de 50–60% da literatura) | arbítrio declarado | ≈ premissa |
| Sessões por tratamento radioterápico | 25 (fracionamento convencional) | arbítrio declarado | ≈ premissa |
| Sessões de hemodiálise por paciente | 156/ano (3 por semana × 52; ~13/mês) | arbítrio declarado | ≈ |

```
pacientes em diálise de centro = população × prevalência por milhão × 0,944 ÷ 1.000.000
viagens de hemodiálise/ano     = pacientes × 156                  (ida e volta)
viagens de radioterapia/ano    = população × 2.427 ÷ 1.000.000 × 0,50 × 25
```

- **Banda, nunca ponto**, quando faltar a taxa estadual: teto pela média nacional, piso pelo estado de menor
  prevalência conhecido na carteira. A média nacional aplicada ao Norte e ao Nordeste superestima a demanda
  transportável (até 88%, ≈ pela antiga skill). A prevalência menor reflete menos acesso, não menos doença, e é a medida
  certa para transporte: só se transporta paciente inscrito em programa.
- **Conferência rápida (≈):** as duas linhas com custeio somam ~0,09 a 0,15 viagem por habitante por ano. Longe dessa
  faixa, há erro de conta.
- **Eletivo geral (consultas, exames, cirurgias, TFD) não tem parâmetro confiável.** Levanta-se na central de regulação
  do ente, caso a caso; nunca se estima. A antiga skill registra que ele costuma superar a soma de diálise e oncologia
  (≈, sem medida).
- **Universo intramunicipal:** os parâmetros assistenciais do SUS (Portaria GM/MS 1.631/2015, ≈ pela antiga skill) dão
  2 a 3 consultas médicas por habitante ao ano. É o campo, não a demanda contratável: o escopo se define por critério de
  elegibilidade escrito no contrato (idoso com limitação de mobilidade, pessoa com deficiência, tratamento continuado,
  gestante de alto risco).
- **Absenteísmo é o indicador que sustenta o valor.** A antiga skill citava ~25% de não comparecimento em consulta
  agendada na rede pública (Cuiabá 23,06%, Campo Largo 26,85%; medições locais, ≈). Os motivos mais relatados (esquecer
  a data, não saber do agendamento) são de comunicação e de deslocamento: o que a confirmação e o transporte atacam.
  **O compromisso contratável é de processo** (confirmação feita, viagem realizada, registro entregue); a queda do
  absenteísmo é consequência esperada, medida e publicada, nunca garantia de desempenho (`peca-cliente.md` §6).

## 4. Custo

Tudo isto entra no custo construído (`samais-os/doutrina/parametros-custo.json`, `scripts/raiox/lib/custo-construido.mjs`;
`modo-transporte-sanitario.md` §5) e fica nos artefatos 1 e 3. **Na peça, nada por veículo.**

- **O per capita é resultado, nunca entrada.** O custo tem um bloco fixo que não escala (coordenação, central,
  administrativo, sede e sistemas) e um variável que acompanha frota e quilometragem. Régua por habitante (inclusive os
  R$ 5,20/hab do SAMU) só confere; nunca precifica.
- **Km por ciclo sai do tempo, nunca do raio.** A corrida coleta pacientes espalhados antes de entregar; o percurso real
  é múltiplo do raio.

```
km por ciclo = duração do ciclo × velocidade média declarada        (corrida urbana com coleta)
km por ciclo = percurso conhecido de ida e volta + coleta           (destino fixo e distante)
```

  Tomar o raio como distância subestima combustível e manutenção (~30%, ≈ pela antiga skill); a primeira modelagem de
  Belém saiu 10,6% abaixo do modelo de frota por isso. As velocidades que ela usava (22, 26 e 32 km/h, do raio curto ao
  longo) são premissa ≈ e se declaram.
- **Depreciação por tipo de veículo, nunca média ponderada**, quando a frota é própria: em frota desbalanceada a média
  subestima, e o erro só aparece na reposição. Referência da antiga skill, sem a fonte (≈, reconferir no PNCP ou no
  Ministério antes de usar): micro-ônibus R$ 584,6 mil e van R$ 304,6 mil nas aquisições federais, em 60 meses. Frota
  doada pelo Ministério não deprecia na nossa conta.
- **Os dois cenários de frota lado a lado, em tabela, no Artefato 1:** doada pelo Ministério × locada ou própria. A
  cessão reduz o Custo Operacional (~13%, ≈ pela antiga skill) sem comprimir a composição: é vantagem competitiva no
  edital, e não nota de rodapé.
- **Central:** a antiga skill usava um operador para cada 75 atendimentos por dia útil (≈ premissa sem fonte; calibrar
  quando o ROTA-OS operar).
- **Sem ambulância de apoio por padrão (Ota, 20/10/2026: *"se não for padrão, não deixaremos como padrão"*).** Nenhuma
  norma do SUS exige nem recomenda ambulância de apoio no transporte eletivo, e nenhum dos 29 instrumentos eletivos lidos
  em 20/10/2026 a contrata (`samais-os/inteligencia/transporte-sanitario/remuneracao-e-apoio.md` §7). O eletivo serve, por
  definição, a quem não tem risco de vida nem precisa de suporte assistencial ou de viajar deitado, em veículo tipo
  lotação (Resolução CIT 13/2017, art. 2º §§ 1º e 2º ✓; 11.165, art. 3º I ✓).
  - **Tipo A só com demanda medida** de pacientes que só viajam deitados (cadastro e regulação do ente), como modalidade
    do próprio eletivo, um paciente por vez (11.165, art. 3º I c ✓; NT 153 §7.3 ✓), tripulada por condutor e técnico ou
    auxiliar de enfermagem (Portaria 2.214/2017, art. 2º ✓; 2.048/2002 ≈ pela transcrição do Ministério) e **sem
    incentivo federal de custeio** (11.165, art. 14 ✓).
  - **Intercorrência no trajeto:** o protocolo do ROTA-OS aciona o SAMU 192 e registra a ocorrência; não há viatura de
    prontidão. A tipo B é para risco de vida conhecido (2.048) e fica fora do eletivo.
  - A antiga âncora "1 ambulância para cada ~13 veículos (Osasco)" saiu: era desenho da própria proposta da Samais para
    Osasco, não norma nem prática medida (`HISTORICO.md` §6).
  A ambulância 24/7 da transferência inter-hospitalar é a outra frente, no mesmo instrumento, em viatura-hora e FC 4,5.

## 5. Viabilidade (interna, Artefato 1; nunca na peça)

- **Três testes cumulativos** antes de propor. Sem histórico próprio, o piso sai do que quebra a operação (≈ premissas
  da antiga skill):
  1. **Participação do fixo** ≤ ~55% do custo direto: acima disso, não sobra variável para cortar quando o volume frustra.
  2. **Frota mínima:** 2 veículos + reserva técnica; com um só, uma quebra para a operação inteira.
  3. **Cobertura no piso da banda de demanda:** o custo se sustenta com a demanda mínima, não com a máxima.
- **Blocos contíguos.** Em carteira de vários entes, reagrupar em blocos vizinhos com central compartilhada. Ente sem
  vizinho na carteira tende a não fechar sozinho (o fixo inteiro sobre população pequena). O descarte é interno; a peça
  nunca cita ente que não fecha conta.
- **O rateio dentro do bloco é do consórcio** (contrato de rateio, Lei 11.107/2005): lido no instrumento, nunca
  presumido. Per capita diferente entre membros é efeito do fixo diluído em populações distintas. Consórcio ≠ quem paga.
- **Consórcio próprio de transporte é raro.** Formar um exige ratificação por lei em cada câmara (Lei 11.107/2005) e
  tempo (12 a 18 meses, ≈ estimativa sem fonte da antiga skill). Preferir consórcio de saúde já constituído na região.
- **Risco de volume.** Preço por atendimento passa à operadora o risco de ociosidade (veículo parado não fatura). O
  aproveitamento de 85% é premissa (`modo-transporte-sanitario.md` §4); recalibrar com a ocupação medida viagem a viagem
  nos primeiros meses.
- **Como o mercado paga (✓ 30 instrumentos de 18 UFs, 2024 a 2026; `samais-os/inteligencia/transporte-sanitario/`).** Por
  km rodado 10 (≈ 33%), mensal por veículo ou global 7 (≈ 23%), por viagem ou rota 6 (≈ 20%), por paciente 3, misto 2,
  diária 1, posto de motorista sobre a frota do ente 1. Na unidade registrada no PNCP, o km também lidera (≈ 58% das
  unidades legíveis). Com veículo do ente, o contrato paga a mão de obra e o ente arca com combustível, manutenção,
  emplacamento e seguro (11.165, art. 11 II ✓).
- **Recomendação da pesquisa, a decidir pelo Ota:** Custo Operacional mensal global da operação inteira (contrato único,
  sem faseamento), com franquia mensal de km aferida pelo ROTA-OS e preço do km excedente. Km puro paga a ineficiência e
  anula o ganho de roteirização; por paciente, passa ao operador o risco de falta e de ocupação. Os riscos de medição e a
  cláusula que fecha cada um estão no §6 da pesquisa. Na peça, o valor aparece só como Custo Operacional mensal, nunca por
  veículo.

## 6. A norma citada na peça

- **A citação no texto vem antes do link:** número da portaria, data e o que ela determina. É o que o técnico da
  secretaria confere sozinho, e não quebra.
- **O link vai ao ato, nunca à notícia:** DOU (`in.gov.br`) ou Saúde Legis (`bvsms.saude.gov.br`). Página de notícia do
  gov.br muda de endereço, sai do ar ou vai para trás de login ("Conteúdo Restrito"); na semana da decisão, o link quebrado
  lê como descuido da Samais. Recorte de imprensa como precedente segue `peca-cliente.md`.
- A norma do transporte é o par **11.164 + 11.165/2026, nunca 11.179** (a antiga skill listava as três).

## 7. Checagem de encerramento (transporte)

- [ ] UF, população e grafia conferidas ente a ente; divergências reportadas.
- [ ] Polo de referência pela rede habilitada no CNES; origem ou destino declarado.
- [ ] Distâncias lidas com fonte, ou ○; filtros de 50 km, 500 km e hemodiálise no próprio estado aplicados.
- [ ] Demanda medida (SIA, SIH) e conferida pela banda (~0,09–0,15 viagem/hab/ano); eletivo geral levantado, nunca
      estimado.
- [ ] Km por ciclo pelo tempo; depreciação por tipo; os dois cenários de frota em tabela.
- [ ] Tipo A só com demanda medida de pacientes em decúbito; nenhuma ambulância de apoio por padrão.
- [ ] Três testes de viabilidade e blocos contíguos (interno).
- [ ] Premissas (≈) em tabela própria, separadas do que foi lido (✓).
- [ ] Contrato único, sem faseamento; ROTA-OS; sem R$ por veículo na peça; valor final como Custo Operacional; nenhuma
      "margem" nem "lucro".
- [ ] Norma citada no texto e linkada ao ato, nunca à notícia; nunca a 11.179.
