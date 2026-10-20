# PDF, impressão, slide e documento

> Fontes: `doutrina/regras-completas.md`, "PDF e impresso" (Ota, 15/10/2026), que substitui o "miolo em fundo claro
> `#FAF9F5`" das versões anteriores desta skill; `doutrina/padrao-dobras.md`, "Impressão".

## PDF da casa (dossiê, estudo, raio-x, relatório)

1. **Miolo branco** (`#FFFFFF`), texto `#141413`, acentos dourados. Sem fundo bege nem colorido no `body`.
2. **A margem é só a da `@page`.** Na chamada do `page.pdf()`: `preferCSSPageSize: true` e margem zero. O Chromium não
   aplica direito `@page :first{margin:0}`, e a capa encolhe.
3. **Capa e divisórias escuras sangram em A4 exato** (210 × 297 mm, sem filete branco). Saem num PDF próprio, com
   `@page{margin:0}`, e se juntam ao miolo depois (pymupdf). Antes de entregar, conferir que os quatro cantos da capa
   são da cor do fundo.
4. **Nenhum texto encosta no limite de uma caixa:** toda caixa com borda ou fundo (aviso, citação, cartão, célula) tem
   respiro mínimo de 4 mm. Citação sem fundo, só com o filete dourado. Código em linha sem fundo.
5. **Rodapé e numeração carimbados depois da renderização**, a partir da página 2, nunca sobre a capa. Não usar o
   cabeçalho e rodapé do Chromium.
6. **Conferir pela imagem**, em baixa resolução: a capa, uma página de miolo e uma página com caixa ou tabela.

Scripts da casa (repositório `samais-estudos`, `scripts/pdf/`):

- `pdf-casa.css`: base de estilo (miolo branco, `@page` com margem, caixas com respiro, classe `.capa`);
- `renderizar.mjs`: HTML → PDF, com `preferCSSPageSize` e margem zero;
- `juntar-carimbar.py`: junta capa e miolo, carimba o rodapé e avisa se os cantos da capa não sangraram.

Primeiro uso: o dossiê UMMES v3 (15/10/2026).

## Impressão de peça HTML (`@media print`)

Toda peça longa imprime, em versão light. **Sobrescrever os tokens na raiz**, não cor por seletor: seletor esquecido
com token sobrescrito sai legível; com cor fixa, sai invisível no branco.

```css
@media print{
  :root{ --text:#0A0A0A; --text-2:#3A3A3A; --muted:#565656; --dim:#8A8A8A;
         --divider:#DCDCDC; --gold:#8E7238; --gold-soft:#8E7238; }
  html{background:#fff}          /* o canvas escuro mora no html */
  body::before{display:none}     /* o brilho ambiente; sem isso sai retângulo preto no PDF */
  .glass{background:#FAFAFA;border:1px solid #E4E4E4;box-shadow:none;filter:none}
  .band{display:none}            /* banda escura não imprime */
}
```

- A dobra dourada vira **filete**, não fundo: `background:#fff` com `border-block:2px solid #8E7238`.
- Conferir: fundo branco, sem retângulo preto, texto legível, nenhuma dobra colorida virando bloco chapado de tinta.
- **Documento A4 absoluto** (papel, não template) fica fixo em 210 mm e rola dentro do próprio contêiner na tela; é a
  única exceção à regra de zero rolagem horizontal (`samais-rota/CLAUDE.md`).

## Slide e PPTX

Fundo `--bg`, um conceito por slide, número de destaque em Syne e ouro, corpo mínimo. Dado em JetBrains Mono. Nenhuma
palavra órfã: em slide a correção é manual (reescrever a linha ou prender as últimas palavras com espaço inquebrável).

## Documento Word e relatório frio

Sóbrio, tipografia Inter, ouro só em elemento estrutural (linha, numeração). Padrão frio (`doutrina/padrao-frio.md`)
quando a audiência é externa.
