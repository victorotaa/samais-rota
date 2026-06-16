---
name: samais-html-presentation
description: Build or edit an HTML presentation/study in the Samais Gestão em Saúde visual system — dark liquid-glass, gold-on-black, investor/institutional. Use whenever creating or revising any Samais HTML deck, study, landing or template.
---

# Skill — Apresentação HTML Samais

Sistema-base para qualquer estudo/apresentação HTML da **Samais Gestão em Saúde**
(institucional, diretoria, investidor). Derivado do vault Obsidian (Google Drive),
validado com a diretoria e refinado em produção. Reaproveitar sempre.

## Quando usar
Qualquer pedido de "estudo", "apresentação", "deck", "one-pager", "landing" ou
"template HTML" da Samais — ou revisão de um existente.

## Tokens (dark é o padrão)
- Fundo `#0A0A0A` · superfícies `#131313`/`#1A1A1A` · divisórias `#262626`
- Texto `#F4F1EA` · secundário `#D9D2C5` · muted `#9C9489` · dim `#615C53`
- Ouro `#B8954E` (soft `#D4B373`, deep `#8E7238`)
- Selo funcional verde `#003611` (vivo `#1E7A4B`) — **só** status/"validado", nunca decoração
- Light fold (impressão/ledger): fundo `#F4F1EA`, texto `#0A0A0A`, ouro `#8E7238`

## Tipografia
- **Syne** (display/títulos) · **Inter** (corpo) · **JetBrains Mono** (labels, dados, paginação)

## Logo
- **Wordmark SVG dourado completo** no header desktop (nunca "Samais" em fonte genérica)
- **Monograma SA+** no mobile (colapsado) e em capas/contracapas
- SVGs oficiais no vault: `samais-logo-*.svg`, `samais-monograma-*.svg`, `samais-wordmark-*.svg`

## Layout
- **Menu fixo no topo** (liquid glass) com logo + âncoras por seção; mobile colapsa para SA+ + hambúrguer
- Seções numeradas `01…N`. **Respiro vertical real**: a classe `.wrap` zera padding,
  então o padding vertical das seções precisa de seletor específico `section.wrap{padding-top/bottom}`
  (~116/88/72px em desktop/tablet/mobile). Bug clássico: usar só `section{padding}` não pega.
- `scroll-margin-top` nas âncoras p/ a barra fixa não cobrir o topo
- Cabeçalho de seção: eyebrow mono + título Syne à esquerda (alinhado ao topo), label mono à direita
- Faixas de foto **full-bleed** entre seções para ritmo
- **Alternância de paleta por dobra**: dark (padrão) → dobra **dourada** (statement) →
  dobra **light/ledger** (tabelas/números) → dobra com **imagem**. Dá dinamismo sem perder sobriedade.
- Footer-master: tagline *"Onde gestão se mede em vidas."* (itálico) + paginação mono

## Material & movimento (contemporâneo)
- **Liquid glass** (referência Apple iOS 26, não o flat da Meta): superfícies translúcidas
  `background:linear-gradient(135deg,rgba(255,255,255,.085),rgba(255,255,255,.025))`,
  `backdrop-filter:blur(22px) saturate(150%)`, borda `rgba(255,255,255,.12)`, cantos ~18px,
  brilho especular interno no topo (`inset 0 1px 0 rgba(255,255,255,.16)`) e sombra profunda.
- **Brilho ambiente radial** fixo (`body::before`, ouro/verde, baixa opacidade) p/ o vidro refratar.
- Header = só liquid glass (sem imagem). Foto de **aperto de mãos** reservada ao **CTA de fechamento**, sob vidro escuro.
- **Parallax sutil** nas camadas de foto (hero, faixas, fundo do CTA): translate no scroll com
  `requestAnimationFrame`, headroom ~20% e clamp. **Respeitar `prefers-reduced-motion`**.
- **Motion**: entrada do hero (fade-up escalonado ~0.8s), **reveal no scroll** (IntersectionObserver,
  fade+translate), **hover** nos cards (lift -5px + glow de borda dourada). Nada bouncy.
- Proibido: dissolve/swirl/push, transições "de PowerPoint", efeito lupa/magnify.

## Voz / copy
- Primeira pessoa do singular **ou** impessoal técnico (evitar plural "nós")
- Cases sempre em **pretérito** ("operou", "entregou") + "atestado disponível para verificação formal"
- Público investidor: **sem jargão/siglas** (moat, TAM, SKU, BDI, SPE, ATC, CDO, PMO, TMS…) — português claro
- Vetado: "humanizado", "excelência", "acolhimento"
- Tagline sempre como fecho

## Imagens (banco Samais no Drive)
- Fotos operacionais sóbrias: frota/viaturas, central de regulação, equipe, aperto de mãos (parceria)
- **Vetado**: dramaticidade (sirene, sangue, reanimação, paciente identificável)
- Embutir hospedando no repo (servido pelo Vercel), não hotlink do Drive
- Download grande do Drive sai como base64 salvo em disco (fora do contexto): extrair com `jq -r '.content' | base64 -d`

## Data viz / infográficos
- SVG/CSS **puro**, sem bibliotecas; gold-on-black, sem chart-junk
- Recorrentes: curva de receita acumulada (área/linha), barras de composição/proporção,
  **donut** para razão de 2 partes (participação), selos de contagem ("1 de ~6"), ícones mono-linha
- Pizza com muitas fatias = chart-junk → usar barras. Honestidade nos rótulos (base/escala explícita)

## Disciplina de fontes
- Separar **fato verificado** (fonte pública, citável) de **estimativa/premissa** (modelagem própria)
- Seção "Premissas e fontes" com selos verde (verificado) / âmbar (estimativa)
- Validar números contra os documentos oficiais da casa (Pitch/decks no Drive) — não inflar TAM

## Infra
- Vault/identidade/banco de imagens: **Google Drive** (vault Obsidian)
- Deploy: **Vercel**, team `samais` → `npx vercel --prod --scope samais` (servir `index.html` na raiz)
- Repos no padrão `samais-*`
- Verificação visual: renderizar com Playwright headless em 1440/768/390px antes de publicar;
  medir DOM quando houver dúvida de espaçamento (não confiar só no olho). Cuidado: `scroll-behavior:smooth`
  atrapalha screenshots de teste — usar screenshot de elemento ou medir o DOM.

## Dobras de cor, animação & glass interativo (regras)
- **Dobras de cor full-bleed**: a cor (dourada/light) ocupa 100vw via `::before`
  (`left:50%;margin-left:-50vw;width:100vw;z-index:-1`); conteúdo na coluna central.
  ⚠️ O `body` não pode ter `background` (canvas no `html`) e a dobra precisa de `z-index:0` —
  senão o fundo do body cobre o `::before` negativo e voltam as margens pretas.
- **Gráficos animam ao entrar na viewport** (IntersectionObserver): linha desenha (stroke-dashoffset),
  donut varre, barras crescem (scaleX), count-up nos números. Count-up do hero ~1,5s (perceptível).
- Tudo sob `.js-anim` (só com JS e sem prefers-reduced-motion) para nunca esconder conteúdo.
- **Liquid glass interativo**: brilho especular que segue o ponteiro (`--mx/--my` via `pointermove`);
  refração via `feDisplacementMap` em `backdrop-filter:blur() url(#glassDistort)` (Chromium; fallback blur;
  off no mobile). Mobile: **tabelas roláveis** (override do `overflow:hidden` do glass).
- **Cases Samais**: usar **apenas Ourinhos e CISNORPI** como exemplos (não usar Hospital Dr. Anísio
  Figueiredo nem Santa Casa de Goioerê).
