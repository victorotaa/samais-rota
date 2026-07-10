# Sistema visual — Estudos e templates HTML da Samais

Padrão-regra para qualquer estudo/apresentação HTML da **Samais Gestão em Saúde**
(institucional, diretoria, investidor). Derivado da identidade do vault Obsidian
(no Google Drive) e validado com a diretoria. Reaproveitar este sistema em novos
documentos.

## Tokens (dark é o padrão)
- Fundo `#0A0A0A` · superfícies `#131313` / `#1A1A1A` · divisórias `#262626`
- Texto `#F4F1EA` · secundário `#D9D2C5` · muted `#9C9489` · dim `#615C53`
- Destaque ouro `#B8954E` (soft `#D4B373`, deep `#8E7238`)
- Selo funcional verde `#003611` (vivo `#1E7A4B`) — **só** para status/“validado”, nunca decoração
- Versão light (impressão): fundo `#F4F1EA`, texto `#0A0A0A`, mesmo ouro

## Tipografia
- **Syne** (display/títulos) · **Inter** (corpo) · **JetBrains Mono** (labels, dados, paginação)

## Logo
- **Wordmark SVG dourado completo** no header desktop (nunca “Samais” em fonte genérica)
- **Monograma SA+** no mobile (colapsado) e em capas/contracapas
- SVGs oficiais no vault (Drive): `samais-logo-*.svg`, `samais-monograma-*.svg`, `samais-wordmark-*.svg`

## Layout
- **Menu fixo no topo** com logo + âncoras por seção; no mobile colapsa para SA+ + hambúrguer
- Seções numeradas `01…N`; **respiro vertical real** (`section.wrap{padding-top/bottom}` —
  a classe `.wrap` zera padding, então use seletor específico `section.wrap`, ~116/88/72px)
- `scroll-margin-top` nas âncoras para a barra fixa não cobrir o topo
- Faixas de foto **full-bleed** entre seções para ritmo
- Cabeçalho de seção: eyebrow mono + título Syne à esquerda, label mono à direita (alinhado ao topo)
- Footer-master: tagline *“Onde gestão se mede em vidas.”* (itálico) + paginação mono
- Movimento sóbrio (fade ~200ms). Proibido: dissolve/swirl/push e transições “de PowerPoint”
- **Material liquid glass** (contemporâneo, referência Apple iOS 26 — não o flat da Meta/WhatsApp):
  superfícies translúcidas com `backdrop-filter:blur(~22px)`, borda `rgba(255,255,255,.12)`,
  brilho especular interno no topo, cantos ~18px e sombra profunda; brilho ambiente radial
  (ouro/verde) fixo no fundo para o vidro refratar. Header = só liquid glass (sem imagem).
  Foto de parceria/aperto de mãos reservada ao CTA de fechamento, sob vidro escuro.
- **Parallax sutil** nas camadas de foto (hero, faixas full-bleed, fundo do CTA): translate no
  scroll com `requestAnimationFrame`, headroom de ~20% e clamp; respeitar `prefers-reduced-motion`

## Voz / copy
- Primeira pessoa do singular **ou** impessoal técnico (evitar plural “nós”)
- Cases sempre em **pretérito** (“operou”, “entregou”) + “atestado disponível para verificação formal”
- Público investidor: **sem jargão/siglas** (moat, TAM, SKU, BDI, SPE, ATC, CDO, PMO, TMS…) — escrever em português claro
- Vetado: “humanizado”, “excelência”, “acolhimento”
- Tagline sempre como fecho

## Imagens (banco Samais no Drive)
- Fotos operacionais sóbrias: frota/viaturas, central de regulação, equipe
- **Vetado**: dramaticidade (sirene, sangue, reanimação, paciente identificável)
- Parceria/aperto de mãos: ok, **sutil** (baixa opacidade, sob overlay escuro)
- Embutir hospedando no repo (servido pelo Vercel), não hotlink do Drive

## Data viz / infográficos
- SVG/CSS **puro**, sem bibliotecas; gold-on-black, sem chart-junk
- Recorrentes: curva de receita acumulada, barras de composição/proporção, split de participação, selos de contagem
- Reforçar números-chave visualmente; honestidade nos rótulos (base/escala explícita)

## Disciplina de fontes
- Separar **fato verificado** (fonte pública, citável) de **estimativa/premissa** (modelagem própria)
- Seção “Premissas e fontes” com selos verde (verificado) / âmbar (estimativa)

## Infra
- Vault/identidade/banco de imagens: **Google Drive** (vault Obsidian)
- Deploy: **Vercel**, team `samais` → `npx vercel --prod --scope samais`
- Repos no padrão `samais-*`

## Dobras de cor, animação & glass interativo (regras)
- **Dobras de cor full-bleed**: a cor (dourada/light) ocupa **100vw** (via `::before`
  `left:50%;margin-left:-50vw;width:100vw;z-index:-1`); conteúdo na coluna central.
  ⚠️ O `body` **não** pode ter `background` (canvas fica no `html`) e a dobra precisa de
  `z-index:0` — senão o fundo do body cobre o `::before` negativo e voltam as margens pretas.
- **Contraste em dobra light é obrigatório e auditado.** Dentro de `.fold-light`, TODO texto usa
  tokens light (texto `#0A0A0A`/`#3A362E`/`#6E675B`, ouro **escuro** `#8E7238`/`#6F5A2C`) — nunca
  tokens do tema dark (`--text`, `--text-2`, `--muted`, ouro claro). ⚠️ Bug clássico: seletor mais
  específico do tema dark (ex. `.sec-head .lede{color:var(--text-2)}`) vence o override genérico
  `.fold-light p` — sempre criar override explícito por classe (`.fold-light .lede`) e conferir a
  dobra em screenshot antes de publicar (AA ≥ 4.5:1).
- **Gráficos animam ao entrar na viewport** (IntersectionObserver): linha desenha (`stroke-dashoffset`),
  donut varre, barras crescem (`scaleX`), **count-up** nos números (~2s) — em todos os boxes de stat e gráficos.
- **Typing** na headline e no subtítulo do hero (~2s, sequencial, com caret). Dobra light com
  **linhas da tabela escalonadas** ao entrar (~2s).
- **Embutir print de fonte pública oficial** (ex.: gov.br) como evidência junto à afirmação que embasa
  (moldura glass + cabeçalho "Fonte oficial" + link). Reforça veracidade da tese.
- Tudo sob `.js-anim` (só com JS e sem `prefers-reduced-motion`) para nunca esconder conteúdo.
- **Liquid glass**: refração do fundo via `feDisplacementMap` em `backdrop-filter:blur() url(#glassDistort)`
  (Chromium; fallback = blur; desligada no mobile por performance).
  Sem brilho especular seguindo o mouse (removido por preferência da diretoria).
- **Mobile nunca tem scroll horizontal.** Em templates/materiais, tabela que não cabe **reflowa**
  (empilha em blocos com rótulo `data-l` via `td::before`, ou quebra de linha) — **nunca** `overflow-x:auto`.
  Regra: `document.documentElement.scrollWidth === clientWidth` em 390px. **Única exceção:** documento
  A4 absoluto (impresso), que fica fixo em 210mm e rola dentro do próprio contêiner (é papel, não template).
- **Cases e atestados — reais, mas usados por contexto.** A Samais operou contratos reais e possui
  **atestados de capacidade técnica raros** (poucas empresas os têm) em **SAMU 192, transferência
  inter-hospitalar e regulação** — cases **Ourinhos** e **CISNORPI**. São ativos legítimos: usar em
  materiais de **SAMU/urgência/regulação e na tese de investidor**. **NÃO** existe ainda case de
  **transporte sanitário/transporte de pacientes** — em material desse serviço, a prova é o **sistema
  ROTA (demo) + a lei pública** (portarias, IBGE), **não** os atestados de SAMU (não transportar a
  credencial de um serviço para outro como se fosse experiência de transporte). **Nunca fabricar
  narrativa operacional** além do que o atestado documenta — foi erro inventar "operou X com frota/
  regulação/escala"; descrever case só com o que o documento sustenta. Vetado citar Hospital Dr. Anísio
  Figueiredo e Santa Casa de Goioerê.
- **Sem campos de contato em nenhum material.** Sem e-mail, telefone, WhatsApp, formulário, mailto ou CTA
  "fale conosco". A Samais é rastreável **apenas por contato de saída dela** — o material fecha com a tese
  ou com link para produto/demo (nunca pedindo que o leitor procure a Samais).

## Governança & reuso (consistência entre repos Samais)
- **Regra:** todo repositório Samais (`samais-*`) deve carregar a identidade — este `CLAUDE.md` +
  `.claude/skills/samais-html-presentation/SKILL.md` — **antes** de qualquer estudo/HTML. Sem isso, não começar.
- **Fonte canônica:** `victorotaa/samais-rota` (branch `main`). É a referência única; ao evoluir o
  sistema, atualizar aqui e propagar (e sincronizar a cópia do vault no Drive).
- **Novo repo — dois caminhos:**
  1. **Template repository (recomendado):** criar o repo a partir de um GitHub *Template repository*
     (marcar em Settings → ☑ Template repository) que já contém `CLAUDE.md`, `.claude/skills/` e o `template.html`.
     "Use this template" → o repo nasce com a identidade.
  2. **Bootstrap:** num repo novo, rodar `bash scripts/samais-init.sh` (usa `gh` autenticado) para
     puxar `CLAUDE.md` + a skill da fonte canônica. Ver `template/COMO-USAR.md`.
- Repos no padrão de nome `samais-<contexto>` (ex.: `samais-<municipio>`).
