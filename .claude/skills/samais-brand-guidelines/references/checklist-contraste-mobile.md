# Checagem antes de aprovar

> O que já falhou de verdade em peça nossa (`doutrina/padrao-dobras.md`, "Checagem antes de aprovar"), mais as regras de
> contraste e mobile do `samais-rota/CLAUDE.md` e de `doutrina/design-system.md`. Conferir no navegador, não no código.

## Identidade

- [ ] `samais.css` importado; nenhum `:root` com cor na página; nenhum hex de paleta aposentada (`#04060C`, `#D4A857`,
      `#060709`, `#C9A84C`).
- [ ] Marca pelos SVGs oficiais (`.marca`); wordmark no desktop, `SA+` no mobile.
- [ ] Ouro em no máximo ~10% da superfície; verde só como selo.
- [ ] Dado em JetBrains Mono (`.dado`).

## Contraste

- [ ] Texto pequeno com AA ≥ 4,5:1. `--dim`, `--red`, `--green` e `--gold-deep` ficam abaixo disso sobre `--bg`: só em
      texto grande, ícone, borda ou selo.
- [ ] Dobra light: todo texto com tokens light, inclusive os seletores específicos do tema escuro (override explícito
      por classe, ex.: `.fold-light .lede`); screenshot da dobra conferido.
- [ ] Dobra dourada: a ênfase é a palavra mais escura.

## Mobile

- [ ] **Zero rolagem horizontal em 390, 360 e 320px, inclusive dentro de qualquer contêiner** (peça longa). A página
      limpa não basta:
      `[...document.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1)` tem de vir vazio.
      Única exceção: documento A4 absoluto, que rola dentro do próprio contêiner.
- [ ] Tabela reflui (blocos com rótulo `data-l`); gráfico troca de forma (`.viz-wide` / `.viz-tall`).
- [ ] Alvo de toque ≥ 44px; número não quebra linha; `[hidden]` vence (`samais.css` já força).
- [ ] Refração desligada no mobile.

## Material e movimento

- [ ] **Nenhum texto refratando:**
      `[...document.querySelectorAll('.glass,.card,.tbl,.viz')].filter(e => getComputedStyle(e).filter.includes('glassDistort')).length`
      dá 0.
- [ ] Animação sob `IntersectionObserver` com `unobserve`, sob classe de ativação, desligada com
      `prefers-reduced-motion`; conteúdo visível sem JS.
- [ ] Âncora do menu não esconde o eyebrow atrás da nav fixa (`scroll-margin-top`).

## Composição e conteúdo

- [ ] Nenhuma palavra órfã: `node scripts/conferir-orfas.mjs <url>` (mede largura, não conta palavra).
- [ ] Citação e referência batem nos dois sentidos: nenhuma órfã, nenhuma não citada.
- [ ] Termos vetados de precificação: zero (`doutrina/precificacao.md`); nada de "lucro" ou "margem".
- [ ] Nada de `interpretacao.md`, `bastidor.md` ou `doutrina/` na peça.
- [ ] Nenhum campo de contato.
- [ ] Imagem gerada com selo "imagem ilustrativa" e `README.md` de procedência; nenhuma imagem vetada
      (`doutrina/imagens/README.md`).

## Técnica

- [ ] Zero erro de console; zero requisição externa na peça institucional (nenhum `src=`/`href=` com `http`).
- [ ] CSP conferido com os headers reais, se hospedada.
- [ ] Geometria de cada gráfico conferida contra o número escrito ao lado; escala declarada no SVG.
- [ ] Imprimir em PDF e olhar: fundo branco, sem retângulo preto, texto legível, sem dobra chapada.
- [ ] `scroll-behavior:smooth` desligado no teste antes de concluir que há defeito de revelação.
