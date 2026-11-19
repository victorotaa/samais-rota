# Dados, gráficos e procedência

> Fontes: `doutrina/padrao-dobras.md` (âncora gráfica, mobile, checagem), `doutrina/design-system.md`, o
> `samais-rota/CLAUDE.md` e a antiga `samais-html-presentation` (data viz), os não-negociáveis do `CLAUDE.md`
> (Princípio da Realidade) e a regra 8 das versões anteriores desta skill (gráfico por biblioteca).

## Número

- Todo dado em JetBrains Mono com `tabular-nums` (`.dado`); nunca em Syne. Número não quebra linha.
- **Procedência em todo número:** ✓ lido · ≈ derivado (regra declarada) · ○ a levantar. Lacuna nunca vira zero;
  premissa nunca como fato. ✓ só quando fontes independentes convergem; fonte única ou fontes divergentes ficam ≈, com
  a divergência descrita (`CLAUDE.md`, Princípio da Realidade).
- "Contratado, não pago": valor de contrato nunca se apresenta como pago.
- Seção "Premissas e fontes" com selo verde (verificado) e âmbar (estimativa). Em peça externa, o padrão frio governa
  o que aparece: dado ausente se omite ou vira "a detalhar em visita técnica" (`doutrina/padrao-frio.md`).
- Validar o número contra o documento oficial da casa; não inflar.
- **Métrica de demonstração sempre rotulada como demonstração** (CoPilot): número de demo nunca passa por resultado
  operado. Claim sem lastro não entra, mesmo o que "todo mundo cita".

## Gráfico

- **Em peça, SVG ou CSS puro, sem biblioteca** (a peça é autossuficiente e não carrega script externo). Ouro sobre
  preto, sem chart-junk.
- Se uma superfície já usa biblioteca de gráfico: fundo transparente, grade `rgba(255,255,255,.05)`, série principal em
  `var(--gold)`, secundárias em cinza-quente, rótulos em JetBrains Mono.
- Formas recorrentes: curva acumulada (área ou linha), barras de composição ou proporção, **donut só para razão de
  duas partes**, selo de contagem ("1 de ~6"), ícone de traço único. Pizza com muitas fatias é chart-junk: usar barras.
- Gráfico só quando o número tem forma; nunca gráfico de um número só.
- **Nunca eixo duplo** (CoPilot): duas escalas no mesmo gráfico sugerem relação que o dado não afirma. Duas grandezas
  são dois gráficos.
- **Tons de ouro não formam paleta categórica** (CoPilot): reprovam na simulação de daltonismo e gastam o ouro escasso.
  Uma série por gráfico; categoria se distingue por **rótulo direto** no traço ou na barra, não por legenda de cor. Se o
  gráfico precisar de mais de uma cor, as semânticas da casa (verde, âmbar, vermelho) só com o sentido delas, e a
  paleta conferida por script de simulação de daltonismo antes de publicar.
- **Honestidade:** base e escala explícitas no rótulo; **escala declarada no próprio SVG**, em comentário (onde é o
  zero, quantos pixels por unidade); **faixa desenhada como faixa** (do mínimo ao máximo), nunca como barra desde zero;
  **geometria conferida contra o número escrito ao lado** (a v1 da apresentação ao MS desenhou "R$ 230–410" com largura
  de ~R$ 181).
- **No mobile o gráfico muda de forma, não de tamanho.** Duas variantes trocadas por media query (`.viz-wide` e
  `.viz-tall`), nunca `overflow-x:auto`:

| Gráfico | Desktop | Mobile |
|---|---|---|
| linha do tempo | horizontal, marcos lado a lado | vertical, trilho à esquerda e rótulo à direita |
| barras e faixas | rótulo em coluna à esquerda, barra à direita | rótulo e valor acima da barra, barra em largura total |

- Animação ao entrar na viewport, uma vez: traço por `stroke-dashoffset`, barra por `scaleX` com
  `transform-box:fill-box`, donut que varre, contagem de 1,6s (`pecas-html.md`, "Movimento").
- Gráfico e tabela **nunca refratam** (`glassDistort`).
- Barra de progresso: a primitiva `.trilha` do `samais.css` (a trilha e o preenchimento são `display:block`; `<span>`
  inline como barra não renderiza).

## Tabela

- Tabela quando a comparação é o conteúdo; dado denso ganha a dobra light.
- Em peça, a tabela que não cabe no mobile **reflui**: empilha em blocos com rótulo (`data-l` lido por `td::before`) ou
  quebra a linha; nunca `overflow-x:auto` (`samais-rota/CLAUDE.md`; `padrao-dobras.md`).
- **No bloco empilhado, o valor tem de saltar** (lição da proposta ROTA, CoPilot): o rótulo recua (`td::before` pequeno,
  mono, ~38% da linha) e o valor sobe de corpo e de peso (`.dado`; o número-chave em `var(--gold-soft)`). O dado que o
  gestor procura não pode ser mais fraco que a etiqueta que o nomeia.
- Em painel e ferramenta do OS, o `samais.css` oferece `.rolavel` para conteúdo largo rolar dentro do vidro
  (`design-system.md`); ver a divergência registrada em `HISTORICO.md`.
- Cenários Mínimo / Base / Amplo, nesta ordem, em colunas comparáveis; Base com "★ RECOMENDADO".
- Composição de preço só em peça interna, em tabela mono (`doutrina/precificacao.md`); nunca a terceiro.
