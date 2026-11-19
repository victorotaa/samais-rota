# Os artefatos 1 e 2: markdown interno e página cliente (FASE 4)

O **conteúdo** de cada artefato. A **forma** (tokens, componentes, dobras, contraste, mobile, PDF) é da skill
`samais-brand-guidelines`; o padrão de página da casa está em `samais-estudos/referencias/apresentacao-html.md`. O
Artefato 3 (anexo) está em `composicao-e-anexo.md` §8.

**Sumário:** 1. Artefato 1 · 2. Estrutura da página · 3. O que a página nunca leva · 4. Frases que reprovam no portão ·
5. Atestados e cases · 6. Tecnologia (CoPilot OS, ROTA-OS) · 7. Imagens · 8. Composição e conferência

---

## 1. Artefato 1: markdown interno (`samais-estudos/estudos-internos/<slug>.md`)

Referência de estrutura: `estudos-internos/osasco-sp.md` (o mais completo); comparativo: `itapevi-sp.md` §7.2. Contém:
drivers; Cenário A nas cinco camadas; frota disponível e dimensionamento; Custo Operacional rubrica a rubrica; ponte
custo→preço até a remuneração residual; benchmark; per capita e densidade; o comparativo de quatro linhas; decisores com
fonte; score e diagnóstico; a tabela **fato ✓ × premissa ≈ × lacuna ○**; pendências do briefing.

## 2. Estrutura da página cliente (`samais-estudos/estudos/<slug>.html` + cartão no `index.html`)

Modelo: `estudos/assis-civap-sp.html`, o **padrão ouro de estudo municipal e de consórcio** (Ota, 23/10/2026: *"vamos
estabelecer um bom padrão, pra ser o novo padrão ouro de estudos municipais/consórcio"*); o `ourinhos-sp.html` (06/10/2026)
fica como precedente. **Resumida** (*"o gestor político e público só quer os dados principais; tem que ser objetivo e
claro"*): o título de cada seção é a conclusão com o número dentro; um dado principal por bloco; **sem teto de palavras: teste do decisor**
(Ota, 28/10/2026: revisão subjetiva; cada trecho só fica se importa ao decisor para decidir; o que não é tão relevante sai, sem se prolongar). A memória de cálculo fica no 1 e no 3. Estudo já publicado fica como está.

1. **Hero** com cartão-postal + subtítulo de uma ou duas frases + 3 a 4 números-chave (sem parágrafo-síntese da proposta).
2. **Sumário** (contexto · problema · proposta).
3. **Diagnóstico só com números** (Ota, 23/10/2026: *"pode ser apenas números de bases, unidades, efetivo,
   transferências.. Discriminar que estão no CNES ou não, onde estão ou quanto tempo ficaram paradas não faz sentido"*):
   central, bases, unidades (USA e USB), efetivo, chamados e transferências, em blocos de número (`.strip`), com a fonte
   numa nota. Sai o "no CNES / fora dele", sai onde está cada viatura, sai o tempo parada; a tabela das viaturas uma a uma
   fica no markdown interno. A história de uma viatura, se precisar, vai ao ponto crítico.
4. **A régua do SUS e os pontos críticos numa tabela só** (Ota, 23/10/2026: *"podem ser juntados em uma tabela lado a
   lado, ganhamos espaço"*), obrigatória em toda proposta de SAMU: uma linha por regra (PT GM/MS 1.010/2012) e as colunas
   **Regra · A norma pede · Hoje · Ponto crítico · A proposta**, com "Crítico 01, 02, 03" na célula do crítico e a linha
   mais grave no alto. No celular, cartão por linha (o `data-label` do `samais.js`), com o rótulo sobre o texto. Os
   recortes da imprensa do caso crítico e o anexo dos sinais ficam logo abaixo. Sem tabela de quadro de hoje × quadro
   proposto (19/10/2026).
   - **Oportunidades lidas, junto da régua × críticos** (Ota, 23/10/2026: *"no radar do civap temos alguma oportunidade, revelada por algum problema (vide mídia) ou déficit operacional, relatos de má prestação, contas incongruentes. Em todos estudos vale colocarmos sempre esse campo de oportunidades, às vezes junto dos déficits, mas como oportunidades."*): campo obrigatório em
     todo estudo municipal ou de consórcio (os publicados o ganham quando forem revistos), com a mídia, o déficit
     operacional, os relatos de má prestação e as contas incongruentes. Cada item traz o fato, a fonte com link e data, o
     selo e a oportunidade numa frase, em padrão frio; título, selo e oportunidade à vista, e o fato num `<details>` por
     item quando o texto se alongar além do que importa ao decisor. A conta entra **com os valores** e é sempre deduzida com ≈ e o cálculo
     declarado (ex.: Valor Liquidado − Valor Pago no TCE, "não prova atraso" quando o arquivo não traz restos a pagar); o
     comparativo gasto de hoje × Custo Operacional segue a regra dele (`cenarios-e-comparativo.md` §3). O que não se achou
     entra como ○ ("ausência lida não prova ausência"). Sem comparar equipe. Modelo: Assis.
5. **Proposta**: escopo, blocos, o que fica com o poder público; frota = **recuperação das viaturas paradas do ente**.
6. **Precedentes em abordagem documental**: recortes da imprensa (título como publicado, destaque em síntese, link). Os de
   Ourinhos só em contexto paulista. As matérias do SAMU do território entram como contexto e, se apontam má gestão, como
   oportunidade (Ota, 21/10/2026), com convergência: um veículo só é ≈.
7. **Viabilidade**: o **Custo Operacional** mensal com o selo de procedência, o **per capita sempre** (pedido do CEO), o
   custeio federal pago como uma linha de fato e o custeio a habilitar ou qualificar como oportunidade; o comparativo de
   gasto só com a ressalva de escopo (`cenarios-e-comparativo.md` §3).
   - **Rateio por município em dropdown** (Ota, 23/10/2026: *"compor o valor total com dropdown da composição de custo por
     município"*): um `<details>` sob o valor, com cada município, a população e a parcela do Custo Operacional, a soma
     igual ao total (maior resto no arredondamento) e o selo ≈ com a chave declarada: a do contrato de rateio lido, quando
     houver; sem ele, a população (IBGE, a mesma base da página, dita por linha: estimativa de 2025 ou Censo 2022), com a chave do consórcio ○. **Nunca por viatura, por item de custo
     nem por rubrica**: preço por viatura e composição do preço não vão a terceiro. Em estudo de um município só, não há
     rateio.
   - Os anexos de contratos e editais e de gestão lida entram aqui (item 12).
8. **Decisores** com fonte e data e o partido ao lado do nome; vínculo ativo com quem administra, quem opera e o link ao
   documento oficial (`fontes-e-coleta.md` §8); o anexo de quem decide logo abaixo.
9. **Diferenciais Samais.**
10. **Fechamento** pela tese; tagline *"Onde gestão se mede em vidas."*; **sem campo de contato**.
11. Sem seção de anexos ao fim: no padrão ouro, cada anexo está na seção do assunto (item 12).
12. **Anexos de dado, no padrão do raio-x, dentro das seções** (Ota, 21/10/2026: *"Assim teremos os decisores e seus
    partidos políticos anexos, bem contratos ativos, com links para editais e valores do PNCP"*; e 23/10/2026: *"Os anexos,
    de alguma forma podem ser incorporados ao estudo do município, separados lá ficam esquecidos"*). Recolhidos em
    `<details>`, fora do teto de palavras do corpo, **no lugar do assunto**:
    - **Quem decide**, na dobra de decisores: Nome (SIGLA), cargo, instituição, selo, data e link da fonte;
    - **Contratos ativos e editais**, junto da gestão ou da viabilidade: instrumento, contratada (sem nome de pessoa),
      objeto, vigência, valor ("contratado, não pago", "estimado, não contratado", ata, orçado), link "ver no PNCP ↗" ou do
      portal, e "não está no PNCP" quando é o caso;
    - **Gestão lida e gasto de hoje**, na viabilidade: o modelo lido no instrumento e o pago no Tribunal de Contas ao lado
      do Custo Operacional, com a leitura (não conclui · o que falta para a norma · economia para o município);
    - **Sinais lidos**, junto dos pontos críticos ou do diagnóstico: matérias e atos oficiais (classe, data, veículo, título
      como publicado, link). O sinal de má gestão (greve, ambulância parada, falta de equipe, saída de OS, contas
      rejeitadas, índice do TCE baixo) é **oportunidade**, dito como fato e sem adjetivo.

    Gerador: `node scripts/estudo-anexos-raiox.mjs <UF> <central> --aplicar estudos/<slug>.html` (samais-estudos), com as
    mesmas guardas do raio-x (`VETO_DADO`, nome de pessoa, rótulo do valor). Na página nova, um marcador por seção:
    `<!--ANEXO:decisores-->`, `<!--ANEXO:contratos-->`, `<!--ANEXO:gestao-->` e `<!--ANEXO:sinais-->`; o gerador troca cada
    um por `<!-- ANEXO:<nome>:INICIO -->` … `<!-- ANEXO:<nome>:FIM -->` e põe o CSS escopado antes do `</head>`. O anexo sem
    marcador cai no fim, entre `<!-- ANEXOS-RAIOX:INICIO -->` e `<!-- ANEXOS-RAIOX:FIM -->`, como nos estudos antigos.
13. **Rodapé** com identidade e créditos (fotos, recortes, norma lida).

Fora da página: "Próximos passos", "o desenho da proposta, em síntese" no começo e a seção "Premissas e fontes" (decisão
do CEO). Toda oportunidade mostrada é **do território da peça**; referência de fora vai só na Fonte, como método.

## 3. O que a página nunca leva

BDI, CDO, margem, remuneração, fator de cobertura, **preço por viatura**, bridge custo→preço, benchmark desfavorável,
estratégia jurídico-tributária, score, índice ou ranking interno, "Métrica de Ouro", a viatura-hora em reais, CPF, dado
sensível, contato pessoal, conteúdo de `interpretacao.md` ou `bastidor.md`, valor contratado apresentado como pago.
Padrão frio: sem advocacy, sem nota metodológica à vista; dado ausente se omite ou vira "a detalhar em visita técnica"
(`samais-os/doutrina/padrao-frio.md`).

## 4. Frases que reprovam no portão (lição Itapevi, 09/10/2026)

- Cite **só contrato vigente**, isto é, com pagamento recente no TCE.
- **Atribua o número ao registro** ("o CNES registra 206 dos 255 profissionais como estatutários"); cadastro velho vai
  como cadastro.
- **Não escreva "em levantamento"**: diz ao ente que o modelo dele não foi lido. Troque pelo fato registrado ou tire.
- "Sem contrato" só como "sem contrato publicado no PNCP", confirmado no portal do ente antes de ir à peça.
- Voz: impessoal técnica ou primeira pessoa do singular; vetado "humanizado", "excelência", "acolhimento"; sigla
  explicada ao gestor (TFD = tratamento fora do domicílio).

## 5. Atestados e cases

- **SAMU 192, inter-hospitalar e regulação:** Ourinhos/SP e CISNORPI/PR, em pretérito, com *"atestado disponível para
  verificação formal"*, dizendo **só o que o documento sustenta**, com a página do PDF (`samais-os/atestados/
  ARGUMENTOS.md`, que também diz o porte que cada um habilita e onde não habilita). Proposta que promete além do atestado
  morre na habilitação. Hospital Dr. Anísio Figueiredo e Santa Casa de Goioerê são vetados.
- **Transporte sanitário não tem case:** a prova é o ROTA-OS e a norma; nunca a credencial de SAMU como experiência de
  transporte (`modo-transporte-sanitario.md` §7).
- Nunca fabricar operação, frota ou escala além do atestado.

## 6. Tecnologia (CoPilot OS, ROTA-OS)

- Nunca "comprovado", "maior dataset", volume de ocorrências ou tempo do sistema sem arquivo que lastreie; nada sobre
  concorrente. Número entra como **compromisso instrumentado com referencial declarado** (≥ 90% de despacho em menos de
  4 min; ≤ 8 min urbano; referenciais do Ministério da Saúde e da PT 1.010/2012), nunca como resultado obtido.
- Enquanto `samais-os/produtos/samu-copilot-os/produto.json` registrar `prototipo`, a peça fala do desenho e do
  compromisso, não de desempenho verificado.
- **Apoio ao despacho:** o CoPilot ordena a frota disponível pela proximidade e mostra o trecho da ligação que sustenta
  cada sinal; a escolha do recurso é do médico regulador (prescrever USA × USB está no "não fazer" do produto). Os cartões
  dependem do demo: mudou o demo, conferir os cartões.
- Sustentação do valor: indicador contratual medido na origem, rastreabilidade da ocorrência e relatório de indicadores
  emitido do sistema (subsídio ao relatório da PT 1.010/2012).
- No transporte, o sistema é o **ROTA-OS**, nomeado como o CoPilot nas peças de SAMU, com captura de tela; nunca a tela
  cheia do demo (bases fictícias). O PEP-OS não entra em peça de transporte.

## 7. Imagens (Ota, 06/10/2026; ordem de 20/10/2026)

- **A ordem é uma só** (Ota, 20/10/2026: imagem gerada de operação *"somente quando não encontrarmos candidatos
  viáveis"*, a partir de *"uma pesquisa para entender a localidade"*; regra inteira em
  `samais-os/doutrina/padrao-dobras.md`, "Imagem"): (1) banco curado (`samais-os/doutrina/imagens/`) e foto documental
  real, o cartão-postal abaixo; (2) pesquisa da localidade, os marcos e pontos de interesse do município ou da região;
  (3) só sem candidato viável (foto real do assunto no tamanho mínimo), gerar a partir dessa pesquisa.
- **Cartão-postal da cidade ou região, em alta resolução**, desktop e celular. Pesquisar primeiro os marcos (portal de
  entrada, igreja-matriz, orla, ponte, represa, estação, teatro); depois as fotos. Google Imagens permitido (uso interno e
  comercial restrito); nesta rede `www.google.com` é recusado e o Wikimedia Commons funciona (`thumb.php?f=<arquivo>&w=3200`,
  autor e licença na página `File:`). Creditar no rodapé quando a autoria for conhecida.
- Tamanho mínimo: hero ≥ 2400×1600; faixa larga ≥ 2400 de largura; CTA ≥ 1600×1000. Salvar em `assets/cidades/`, nunca
  hotlink. Panorama estreito não serve de hero. Medir: `node scripts/conferir-imagens.mjs <página>` (samais-estudos).
- Papéis: o cartão-postal mais forte é o hero; o segundo, a faixa de território; o terceiro, o fechamento; paisagem da
  região entre partes (consórcio: o município-sede da CRU primeiro). Três a cinco imagens, com fonte e crédito. Toda zona
  de imagem tem fallback em gradiente.
- Imagem de marca (frota, central, equipe) é pontuação, não decoração. **Gerada só no degrau 3**, sobre a pesquisa da
  localidade (o marco, a paisagem e a luz da região como base), nos mesmos tamanhos mínimos (medidos por
  `conferir-imagens`; gerada que não alcança o mínimo não vai ao hero), grátis (GPT/Gemini), sem crédito do Higgsfield,
  com o selo "imagem ilustrativa" na legenda e o `README.md` de procedência (modelo, data, referência usada). Vestimenta
  por contexto: uniforme SAMU só em peça de SAMU; no transporte, jaleco neutro com o monograma SA+.
- Vetado: sirene, sangue, reanimação, paciente identificável, cena clínica ou dramática, brasão municipal, logo de
  terceiro, texto ou letreiro legível na imagem gerada.

## 8. Composição e conferência

- Identidade: `css/samais.css` do samais-estudos (gêmeo de `samais-os/doutrina/samais.css`), nunca redeclarar cor.
- Nenhuma palavra órfã, nenhuma palavra curta no fim de linha e **nenhuma palavra partida, em largura nenhuma** (Ota,
  23/10/2026: *"isso jamais pode acontecer em todos nossos materiais"*): `node scripts/conferir-orfas.mjs <arquivo>`, que
  mede de 360 a 2560 px nos dois modos de movimento, com a fonte real. A regra vai no primeiro `<style>` da peça, escopada:
  `h1,h2,h3,h4,.lede,.hero-sub{overflow-wrap:normal}` e `p,li,td,th,figcaption{overflow-wrap:break-word}` (no
  `css/samais.css` geral, a troca escondia texto nas tabelas do raio-x: de 270 para 35.782 trechos cortados). A célula de
  texto da régua leva as três últimas palavras em `&nbsp;`: a costura do `samais.js` e o conferidor pulam `.tbl`. Confira
  também com os `<details>` abertos.
- Mobile sem rolagem horizontal: `node scripts/conferir-scroll-horizontal.mjs`; tabela reflui, nunca `overflow-x`.
- Data e hora pelo relógio de Brasília (`scripts/lib/relogio.mjs`), nunca `toISOString().slice(0, 10)`.
- PDF: miolo branco, capa sangrada em A4, nenhum texto encostado em borda (`samais-estudos/scripts/pdf/`).
- Padrão de estudo v2 (hero com partículas, UMMES, 15/10/2026) só vira regra com a aprovação do Ota.
