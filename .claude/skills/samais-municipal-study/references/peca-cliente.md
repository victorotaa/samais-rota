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

Modelo: `estudos/ourinhos-sp.html` (Ota, 06/10/2026). **Resumida** (*"o gestor político e público só quer os dados
principais; tem que ser objetivo e claro"*): o título de cada seção é a conclusão com o número dentro; um dado principal
por bloco; **~1.200 palavras visíveis, limite duro ~1.875**. A memória de cálculo fica no 1 e no 3.

1. **Hero** com cartão-postal + subtítulo de uma ou duas frases + 3 a 4 números-chave (sem parágrafo-síntese da proposta).
2. **Sumário** (contexto · problema · proposta).
3. **Diagnóstico**: o que o cadastro registra, atribuído ao registro.
4. **A régua do SUS** (PT GM/MS 1.010/2012): a norma e o que o registro mostra hoje, como lacuna; obrigatória em toda
   proposta de SAMU. Sem tabela de quadro de hoje × quadro proposto (19/10/2026).
5. **Pontos críticos.**
6. **Proposta**: escopo, blocos, o que fica com o poder público; frota = **recuperação das viaturas paradas do ente**.
7. **Precedentes em abordagem documental**: recortes da imprensa (título como publicado, destaque em síntese, link). Os de
   Ourinhos só em contexto paulista.
8. **Viabilidade**: o **Custo Operacional** mensal com o selo de procedência, o **per capita sempre** (pedido do CEO), o
   custeio federal pago como uma linha de fato e o custeio a habilitar ou qualificar como oportunidade; o comparativo de
   gasto só com a ressalva de escopo (`cenarios-e-comparativo.md` §3).
9. **Decisores** com fonte e data e o partido ao lado do nome; vínculo ativo com quem administra, quem opera e o link ao
   documento oficial (`fontes-e-coleta.md` §8).
10. **Diferenciais Samais.**
11. **Fechamento** pela tese; tagline *"Onde gestão se mede em vidas."*; **sem campo de contato**.
12. **Rodapé** com identidade e créditos (fotos, recortes, norma lida).

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
- Nenhuma palavra órfã nem palavra curta no fim de linha: `node scripts/conferir-orfas.mjs <arquivo>`, medido na fonte real.
- Mobile sem rolagem horizontal: `node scripts/conferir-scroll-horizontal.mjs`; tabela reflui, nunca `overflow-x`.
- Data e hora pelo relógio de Brasília (`scripts/lib/relogio.mjs`), nunca `toISOString().slice(0, 10)`.
- PDF: miolo branco, capa sangrada em A4, nenhum texto encostado em borda (`samais-estudos/scripts/pdf/`).
- Padrão de estudo v2 (hero com partículas, UMMES, 15/10/2026) só vira regra com a aprovação do Ota.
