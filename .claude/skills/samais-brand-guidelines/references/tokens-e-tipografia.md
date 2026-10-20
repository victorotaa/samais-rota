# Tokens, tipografia, marca e material

> Os valores abaixo existem para **reconhecer** a paleta. A fonte de verdade é `doutrina/samais.css`; se este arquivo
> divergir do CSS, o CSS ganha e este arquivo é corrigido. Em página, use `var(--token)`, nunca o hex.

## Sumário

1. Tokens de cor
2. Tokens abaixo do contraste para texto pequeno
3. Tipografia e medidas
4. Marca
5. Material liquid glass e refração
6. Dobras invertidas (light e dourada)
7. Componentes prontos do `samais.css`

## 1. Tokens de cor

| Grupo | Token | Valor | Uso |
|---|---|---|---|
| Base | `--bg` | `#0A0A0A` | fundo |
| | `--s1` · `--s2` | `#131313` · `#1A1A1A` | superfícies |
| | `--divider` | `#262626` | divisórias |
| Ouro (≤10%) | `--gold` · `--gold-soft` · `--gold-deep` | `#B8954E` · `#D4B373` · `#8E7238` | número-chave, divisória, ícone |
| Semânticas | `--green` · `--green-deep` | `#1E7A4B` · `#003611` | selo funcional (validado) |
| | `--amber` | `#B8804E` | atenção |
| | `--red` | `#A33044` | crítico |
| Texto | `--text` · `--text-2` · `--muted` · `--dim` | `#F4F1EA` · `#D9D2C5` · `#9C9489` · `#615C53` | primário a apagado |

Os aliases de compatibilidade (`--card`, `--line`, `--gold-dim`, `--fd`, `--fb`, `--fm` e outros) existem para páginas
anteriores à unificação. Ao reescrever, prefira os nomes canônicos.

### Tema claro (Ota, 20/10/2026)

O escuro acima é o padrão. O claro vale com `data-theme="light"` no `<html>` (produto com alternância) ou numa seção
(`<section class="fold-light" data-theme="light">`, a dobra clara). Derivado da dobra light e da impressão; regra de uso,
justificativa do fundo e contraste medido em `doutrina/design-system.md`, "Tema claro". Os dois blocos ficam entre
`/* @tokens-inicio */` e `/* @tokens-fim */` no `samais.css`, e é essa região que vai para o CoPilot e o PEP.

| Grupo | Token | Claro | Sobre `--bg` | Uso |
|---|---|---|---:|---|
| Base | `--bg` | `#F4F1EA` (creme da casa) | | fundo |
| | `--s1` · `--s2` | `#FAF8F3` · `#FFFFFF` | | superfícies: clareiam com a elevação |
| | `--divider` | `#DDD6C9` | 1,28 | divisórias |
| Ouro | `--gold` | `#7A6230` | 5,15 | texto em ouro, número-chave |
| | `--gold-soft` | `#6F5A2C` | 5,86 | ouro de leitura, hover, foco (o de maior contraste, como no escuro) |
| | `--gold-deep` | `#8E7238` | 4,03 | apoio: texto grande, ícone, filete (restrito) |
| Semânticas | `--green` · `--green-deep` | `#186B42` · `#DDEAE0` | 5,78 · — | selo; `--green-deep` é chão de selo, nunca texto |
| | `--amber` | `#8A5A2B` | 5,20 | atenção |
| | `--red` | `#A33044` | 6,08 | crítico |
| Texto | `--text` · `--text-2` · `--muted` | `#0A0A0A` · `#3A352D` · `#6E675B` | 17,55 · 10,78 · 4,96 | texto corrido |
| | `--dim` | `#8A8174` | 3,40 | restrito: texto grande, ícone, borda |

- **O token guarda o papel, não o tom.** No claro, `--gold-soft` é o mais escuro dos ouros e `--gold-deep` o mais claro,
  porque o papel de cada um (leitura e apoio) é definido pelo contraste.
- Mudam também, por token: vidro (`--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-sutil-bg`,
  `--glass-sutil-border`), barra fixa (`--barra-bg`, `--barra-border`, `--barra-shadow`), trilho (`--trilha-bg`),
  brilho ambiente (`--ambiente-1..3`) e os apelidos que carregam cor (`--line`, `--line-soft`, `--gold-dim`).
- A marca troca de arquivo sozinha (`.marca` usa a variante `primary` no claro; §4).
- Papel e PDF: os valores do claro sobre **branco** (miolo branco, Ota, 15/10/2026), nunca sobre o creme.

### Extensão clínica (Ota, 20/10/2026)

Só para tela de operação (CoPilot, PEP, ROTA): status, alerta, risco e IA. Peça e estudo não usam. Fica na região de
tokens do `samais.css`, desce aos produtos com os demais tokens e muda com o tema; tabela completa e contraste em
`doutrina/design-system.md`, "Extensão clínica".

- `--clinico-sucesso`, `--clinico-atencao`, `--clinico-critico`, `--clinico-info`, `--clinico-ia`, cada um com o seu
  `-chao` (fundo do selo). O info é azul-acinzentado, nunca o azul do Manchester.
- Manchester é norma, não tema: `--manchester-vermelho|laranja|amarelo|verde|azul` é o selo, igual nos dois temas, com o
  dígito em `--manchester-tinta`; `--manchester-*-texto` é a letra e o filete sobre a superfície; no claro, o selo leva
  `--manchester-aro`.
- Nenhum produto redeclara essas cores: se faltar um papel, ele entra aqui, no `samais.css`.

## 2. Tokens abaixo do contraste para texto pequeno

Medidos sobre `--bg` (`doutrina/design-system.md`): `--dim` 2,98:1, `--red` 2,89:1, `--green` 3,72:1 e
`--gold-deep` 4,35:1. Ficam abaixo do AA (4,5:1) para texto pequeno; use em texto grande, ícone, borda ou fundo de selo,
nunca em parágrafo. No claro, só `--gold-deep` (4,03:1) e `--dim` (3,40:1) ficam abaixo do AA, com o mesmo uso restrito;
`--green` e `--red` passam (5,78:1 e 6,08:1).

## 3. Tipografia e medidas

| Papel | Família | Peso | Observação |
|---|---|---|---|
| Display e título | Syne (`--display`) | 600–800; `h1` 700, `h2`–`h4` 600 | fallback Arial Black, nunca serifa; `letter-spacing:-.02em` |
| Corpo | Inter (`--body`) | **300** na peça · **400** no produto | entrelinha 1,6; no produto, a tela de operação lê rápido e por horas, e o 300 some |
| Dado, rótulo, paginação | JetBrains Mono (`--mono`) | 400–500 | `.dado` com `tabular-nums`; número não quebra linha (`white-space:nowrap`) |

Importação em página do OS (que tem rede):
`https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap`

**Peça institucional não faz requisição externa** (`padrao-dobras.md`, "Autossuficiência"): baixar os `woff2` do subset
`latin` (Syne 700, Inter 300/500, JetBrains Mono 400/500/700, cerca de 200 KB) e embutir em base64.

Anatomia de uma dobra (`padrao-dobras.md`):

| Peça | Medida |
|---|---|
| eyebrow | mono 10,5px, maiúscula, trilha 0,16em, ouro, precedida de traço de 26px (`.eyebrow` do CSS: 11px, 0,22em) |
| `h2` | Syne 700, `clamp(29px, 4.1vw, 45px)`, teto de 19ch |
| lead | Inter 300, 17px, teto de 62ch (74ch no modo largo) |

Composição: `text-wrap:balance` em título e citação, `text-wrap:pretty` no corpo (já no CSS) **mais** `orfas.js`, que
costura as três últimas palavras medindo a fonte real. O `<br>` escrito à mão no `<h1>` do hero e na citação da dobra
dourada é decisão de composição e o script respeita.

## 4. Marca

- SVGs oficiais em `doutrina/marca/` (desenho de Victor Ota; origem: pasta canônica do Drive): `samais-logo-gold.svg`,
  `samais-logo-primary.svg`, `samais-logo-white.svg`, `samais-monograma-gold.svg`, `samais-monograma-primary.svg`,
  `samais-monograma-white.svg`, `samais-favicon.svg`. O build os distribui ao lado do `samais.css`.
- Componente `.marca` (`--marca-tam` = altura do wordmark; 26px é o mínimo com presença numa barra escura): wordmark no
  desktop; abaixo de 600px, monograma `SA+`. O texto fica para leitor de tela (`text-indent`).
- Monograma `SA+` também em capa e contracapa.
- Nunca a marca em fonte genérica, nem desenhada em tipografia.
- **Contraste da marca ≥ 3:1 sobre o fundo onde ela pousa** (WCAG 1.4.11, elemento não textual; regra do CoPilot,
  absorvida em 20/10/2026). Medido pela fórmula do WCAG sobre o `fill` dos SVGs (≈ derivado): dourada sobre `--bg`
  7,0:1; **dourada sobre creme `#F4F1EA` 2,5:1 e sobre branco 2,8:1, reprova**. Em fundo claro (dobra light, miolo de
  PDF, impressão), usar `samais-logo-primary.svg` ou `samais-monograma-primary.svg` (`#0A0A0A`, 17,6:1 sobre o creme).
  No tema claro do `samais.css`, o `.marca` já faz a troca (`[data-theme="light"] .marca .nome`), e o build distribui os
  dois SVGs `primary` ao lado do CSS.
- O SVG em `<img>` ou em `background` não herda cor (`currentColor` não chega lá): a variante se troca pelo arquivo
  (`gold`, `primary`, `white`), nunca por filtro de cor.

## 5. Material liquid glass e refração

- Tokens: `--glass-bg`, `--glass-border`, `--glass-blur` (`blur(22px) saturate(150%)`), `--glass-shadow` (brilho
  especular interno no topo + sombra profunda), `--glass-radius` (18px). No mobile (≤720px) o raio cai para 12px e o
  blur para 16px.
- O vidro precisa do **brilho ambiente radial** (`body::before`, tokens `--ambiente-1..3`: ouro e verde em baixa opacidade no escuro, quase sem verde no claro) para ter o que
  refratar. Sem ele, o efeito não aparece.
- `.glass` tem `overflow:hidden`: o material recorta o que passa por baixo.
- `prefers-reduced-transparency: reduce` troca o vidro por superfície opaca (`--s1`); já está no CSS.
- O header é só vidro (`.topbar` + `.barra-vidro`), sem imagem.
- **Refração (`url(#glassDistort)`)**, o filtro de `doutrina/glass-filter.html` (colar logo após `<body>`):
  - `filter:url(#glassDistort)` **só em `<img>`**, pela classe `.refrata`, desligada abaixo de 680px. A refração ondula
    letra e entorta linha reta: nunca em cartão, bloco de princípio, tabela, caixa de destaque, gráfico ou painel
    (correção do Ota de 11/08/2026).
  - A refração de fundo (`backdrop-filter: … url(#glassDistort)`, Chromium; o Firefox fica no blur) é opcional e
    reservada a peça de apresentação. Ferramenta de uso diário fica no blur. No mobile ela sai.
  - Sem brilho especular que segue o mouse (removido por preferência da diretoria, `samais-rota/CLAUDE.md`).
  - **Na imagem, a refração vive na borda, nunca no miolo** (lição do CoPilot, absorvida em 20/10/2026). Aplicada à foto
    inteira, ela ondula o assunto (rosto, veículo, letreiro) e lê como defeito de arquivo. Repor o centro limpo com uma
    segunda camada do mesmo arquivo, mascarada (o navegador reusa o cache; a camada limpa é `aria-hidden`, sem `alt`):

```html
<div class="band">
  <img class="refrata" src="foto.jpg" alt="...">
  <img class="nucleo" src="foto.jpg" alt="" aria-hidden="true">
</div>
```

```css
/* refração só na borda: o miolo volta limpo pela camada mascarada */
.band .nucleo{position:absolute;inset:-12% 0;width:100%;height:124%;object-fit:cover;opacity:.94;pointer-events:none;
  -webkit-mask-image:radial-gradient(ellipse 74% 74% at 50% 50%,#000 56%,rgba(0,0,0,0) 100%);
  mask-image:radial-gradient(ellipse 74% 74% at 50% 50%,#000 56%,rgba(0,0,0,0) 100%)}
```

Deixar o comentário ao lado do CSS: a regra some na próxima edição se não estiver escrita ali. A técnica vale só para
peça de apresentação; as imagens do painel do OS não refratam (`doutrina/imagens/README.md`).

## 6. Dobras invertidas (light e dourada)

Valores de `padrao-dobras.md`; não inventar uma terceira cor.

| Dobra | Fundo | Texto | Onde |
|---|---|---|---|
| `.fold-light` | creme `#F4F1EA` | `#0A0A0A` / `#3A352D`; ouro de texto `#7A6230` (`#8E7238` só grande ou filete) | dobra de tabela, dado denso |
| `.fold-gold` | `linear-gradient(135deg,#C9A85A,#9B7937)` | `#3A2D12`, ênfase `#120C02` | a virada, e só ela |

- Dentro de `.fold-light`, todo texto usa os valores light; nunca os do escuro. Desde 20/10/2026, o caminho é o tema
  claro na seção (`<section class="fold-light" data-theme="light">`, fundo `var(--bg)`): `--text`, `--text-2`,
  `--muted` e `--gold` já saem claros lá dentro, e o seletor do escuro deixa de vencer o override.
  **Ouro como texto pequeno na dobra light é `--gold` (`#7A6230`, 5,15:1); o `#8E7238` dá 4,03:1 no creme e fica para
  texto grande e filete.** O `samais-rota` usa ainda `#6E675B` (apagado) e `#6F5A2C` (ouro mais escuro), que são o
  `--muted` e o `--gold-soft` do claro.
- No ouro, a palavra enfatizada é a **mais escura**, nunca a mais clara.
- Na impressão, o ouro vira filete (`border-block:2px solid #8E7238` sobre branco), não fundo chapado.

## 7. Componentes prontos do `samais.css`

`.glass`, `.glass-sutil`, `.barra-vidro`, `.marca`, `.topbar` + `.topnav-links` (barra fixa; o item corrente em ouro
por `aria-current`), `.eyebrow`, `.dado`, `.mono`, `.trilha` (barra de progresso: `<span class="trilha"><i
style="width:NN%"></i></span>`), `.rodape` (marca, tagline, três colunas, base com carimbo), `.rolavel`.
O CSS também força `[hidden]{display:none!important}`, `select{max-width:100%}`, alvos de toque de 44px no mobile,
foco visível em ouro e o corte de animação sob `prefers-reduced-motion`.
