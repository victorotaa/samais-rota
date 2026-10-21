---
name: samais-brand-guidelines
description: Aplica a identidade visual da Samais Gestão em Saúde (dark liquid-glass, ouro sobre preto, Syne/Inter 300/JetBrains Mono, tokens importados de doutrina/samais.css) a qualquer peça visual — deck, apresentação HTML, estudo HTML, landing, template Samais, dossiê, proposta, painel, PDF, slide, documento, gráfico, teaser e peça de marketing — e revisa peças fora do padrão. Use sempre que o entregável for da Samais ou mencionar Samais, SAMU, dossiê, estudo municipal, raio-x, proposta comercial, apresentação institucional ou de investidor, ou quando o Ota pedir "padrão Samais", "identidade Samais", "dark-luxury" ou "template Samais". Vídeo segue samais-video, que importa esta identidade.
license: Apache-2.0
---
<!-- Espelho gerado de victorotaa/samais-os@010bc04 em 2026-10-20 por scripts/sincronizar-skills.mjs. Não edite aqui: edite .claude/skills/samais-brand-guidelines/ no samais-os e sincronize. Os caminhos citados são do samais-os. -->

# Samais — identidade visual

A identidade da Samais é **código, não prosa**: os tokens vivem em `doutrina/samais.css` e toda superfície os importa.
Esta skill diz como aplicar; quem decide é o CSS. Decisão do Ota (20/10/2026): **a fonte canônica da identidade
visual é o repositório `samais-os`**.

## Precedência

1. `doutrina/samais.css` (tokens, material, marca, componentes). Fonte de verdade.
2. A produção (`samais-estudos/css/samais.css`, no repositório `samais-estudos`): se divergir do item 1, a produção
   está certa e o item 1 é corrigido.
3. `doutrina/design-system.md`, `doutrina/padrao-dobras.md`, `doutrina/padrao-frio.md` e as seções "Efeito e componente
   de UI de fora" e "PDF e impresso" de `doutrina/regras-completas.md`.
4. Esta skill e as `references/`: explicam e roteiam; não decidem.
5. O espelho no Claude Design ([Design System "Samais"](https://claude.ai/artifact/3UCn8HRxj9au5wQgSzSvAn)): copia,
   nunca decide. Mudou token, marca, `orfas.js` ou regra visual? Re-sincronizar o espelho no mesmo dia.

O conteúdo (o que pode ser dito, vocabulário de preço, procedência, LGPD) é decidido pelos não-negociáveis do
`CLAUDE.md`, por `doutrina/precificacao.md` e por `doutrina/padrao-frio.md`. Esta skill cuida da forma.

## Roteamento

| A tarefa é | Leia |
|---|---|
| Cor, fonte, marca, material, componente pronto, dobra light ou dourada | [references/tokens-e-tipografia.md](references/tokens-e-tipografia.md) |
| Deck, apresentação, estudo, dossiê, landing ou template HTML (peça longa de rolagem) | [references/pecas-html.md](references/pecas-html.md) |
| PDF, impressão, slide/PPTX, documento Word | [references/pdf-e-impresso.md](references/pdf-e-impresso.md) |
| Gráfico, tabela, número, infografia, selo de procedência | [references/dados-e-graficos.md](references/dados-e-graficos.md) |
| Conferir antes de entregar (contraste, mobile, refração, órfãs, impressão) | [references/checklist-contraste-mobile.md](references/checklist-contraste-mobile.md) |
| De onde veio cada regra desta skill e o que foi descartado | [references/HISTORICO.md](references/HISTORICO.md) |
| Vídeo, teaser animado, reel | skill `samais-video` |

## O núcleo (vale para toda peça)

1. **Importar, nunca redeclarar cor.** `<link rel="stylesheet" href="./samais.css">` (o build distribui o arquivo) e
   usar os tokens (`var(--gold)`, `var(--text-2)`…). Nenhuma página tem `:root` com cores; quem digita hex
   provavelmente está errado. Os hex em `references/` servem para reconhecer a paleta, não para copiar.
2. **Ouro é escasso: no máximo ~10% da superfície.** Número-chave, uma divisória, ícone de seção. Se tudo é dourado,
   nada é.
3. **Verde é selo funcional** (validado, verificado), nunca decoração. Âmbar é atenção; vermelho é crítico; os três
   com parcimônia.
4. **Tipografia:** Syne no display (600–800, fallback Arial Black, nunca serifa); Inter **300** no corpo da peça e
   **400** no corpo do produto (tela de operação); JetBrains Mono em rótulo, paginação e **todo dado** (classe `.dado`,
   com `tabular-nums`). Dado nunca em Syne. Cor de status, alerta, risco e IA só na tela de operação, pela extensão
   clínica (`--clinico-*`, `--manchester-*`; `tokens-e-tipografia.md` §1).
5. **Hierarquia:** eyebrow mono em caixa alta dourada → título Syne → lead em Inter com entrelinha de 1,6 ou mais.
6. **Marca só pelos SVGs oficiais** de `doutrina/marca/`, pelo componente `.marca`: wordmark dourado no desktop,
   monograma `SA+` no mobile (colapsa, não some). Nunca "Samais" escrito em fonte genérica.
7. **Liquid glass** é o material (`.glass`, `.glass-sutil`, `.barra-vidro`): blur 22px, saturate 150%, borda
   `rgba(255,255,255,.12)`, brilho especular interno, cantos 18px, sobre o brilho ambiente radial do `body::before`.
   **Superfície de dado não refrata:** `filter:url(#glassDistort)` só em `<img>` (classe `.refrata`); a refração de fundo
   fica para peça de apresentação, sai no mobile, e ferramenta de uso diário fica no blur.
8. **Nenhuma palavra órfã** (Ota, 17/09/2026): importar `samais.css` **e** `doutrina/orfas.js`, e conferir com
   `node scripts/conferir-orfas.mjs <url>`. Em peça que não é HTML, a correção é manual (reescrever ou espaço
   inquebrável).
9. **Audiência externa = padrão frio** (`doutrina/padrao-frio.md`): a identidade fica, a linguagem persuasiva sai.
   Camada **factual** visualmente distinta da **interpretação** (ex.: bloco com borda âmbar); nunca fundir.
   `interpretacao.md`, `bastidor.md` e `doutrina/` nunca entram na peça.
10. **Preço:** nunca "lucro" nem "margem"; a composição do preço não vai a terceiro (`CLAUDE.md`). Em peça interna, a
    composição vai em tabela mono, decomposta (`doutrina/precificacao.md`). Cenários sempre **Mínimo / Base / Amplo**,
    nesta ordem, em colunas comparáveis, Base com o selo "★ RECOMENDADO".
11. **Sem campo de contato** em nenhum material: sem e-mail, telefone, WhatsApp, formulário, `mailto` ou "fale conosco".
    A peça fecha com a tese ou com link para produto ou demo; a tagline *"Onde gestão se mede em vidas."* é o fecho.
12. **Imagem obedece ao Princípio da Realidade, numa ordem só** (Ota, 20/10/2026): banco curado e foto documental real;
    depois a pesquisa da localidade (marcos e pontos de interesse do município ou da região); só sem candidato viável,
    imagem gerada a partir dessa pesquisa, nas resoluções da casa (hero ≥ 2400×1600), pela via grátis, com o selo
    "imagem ilustrativa" na legenda e um `README.md` de procedência. Sempre fora: cena clínica ou dramática (sirene,
    sangue, reanimação, vítima, paciente identificável), brasão municipal, logo de terceiro. Detalhe em
    `references/pecas-html.md` §9.

## Por tipo de peça (resumo; o detalhe está nas references)

- **Peça longa HTML** (deck, estudo, dossiê, landing): padrão de dobras, uma dobra uma ideia, nav fixa no topo com a
  seção corrente em ouro, autossuficiente (fonte e imagem embutidas), zero rolagem horizontal em 390, 360 e 320 px.
- **Painel e ferramenta do OS:** os componentes de `samais.css` (`.topbar`, `.rodape`, `.trilha`), alvo de toque de
  44 px, vidro sem refração.
- **PDF:** miolo branco, capa e divisórias escuras sangradas em A4, respiro mínimo de 4 mm em toda caixa, scripts de
  `samais-estudos/scripts/pdf/`.
- **Slide/PPTX:** fundo `--bg`, um conceito por slide, número de destaque em Syne e ouro, corpo mínimo.
- **Documento Word ou relatório frio:** sóbrio, Inter, ouro só em elemento estrutural (linha, numeração).
- **Efeito de UI de fora** (21st.dev e bibliotecas abertas): licença conferida por componente, portado para CSS e JS
  puros com os tokens da casa; ver `references/pecas-html.md`.

## O que nunca fazer

- Redeclarar cor, ou usar as paletas aposentadas (`#04060C` com ouro `#D4A857`; `#060709` com `#C9A84C`) ou o sistema
  do CoPilot e do PEP (`#070708` com `#BF9A3D` e Plus Jakarta Sans), aposentado também nos produtos (Ota, 20/10/2026:
  os produtos migram para os dois temas do `samais.css`).
- Misturar a paleta institucional com a operacional do SAMU (vermelho vivo, navy e branco de uniforme e viatura).
- Gradiente colorido, neon, glassmorphism genérico de template, efeito lupa, transição "de PowerPoint".
- Refração (`glassDistort`) em texto, número, tabela, gráfico ou painel; na foto, refração no miolo.
- Gráfico de eixo duplo; tons de ouro usados como paleta categórica.
- Emoji em documento institucional (usar glifo tipográfico).
- Brasão municipal em peça institucional ou de vídeo.
