# Histórico da skill `samais-brand-guidelines`

## 20/10/2026 — unificação (decisão do Ota)

O Ota autorizou unificar as skills com similaridade demais (*"para termos poucas mas boas skills bem fundamentadas"*) e
decidiu que a fonte canônica da identidade visual é o repositório `samais-os`.

### Medição

| Versão | Linhas | Bytes |
|---|---:|---:|
| `samais-os` (vigente até 20/10) | 112 | 6.107 |
| `jarvis-os` e `samais-rota` (cópias idênticas) | 97 | 4.910 |
| `samais-rota/.claude/skills/samais-html-presentation` | 121 | 8.778 |
| **Antes, soma das fontes distintas** | **330** | **19.795** |
| Depois: `SKILL.md` (núcleo, carregado sempre que a skill dispara) | 92 | 7.646 |
| Depois: `references/` sem este histórico (lidas sob demanda) | 438 | 27.062 |

### O que veio de cada fonte

| Fonte | O que entrou | Onde |
|---|---|---|
| `samais-os` (112 linhas) | visão geral, "não copie hex", tokens canônicos, Inter 300, marca `.marca`, regras de aplicação 1–7, PDF de 15/10, palavra órfã, "nunca fazer" | `SKILL.md`; `tokens-e-tipografia.md`; `pdf-e-impresso.md` |
| Cópias de 97 linhas (`jarvis-os`, `samais-rota`) | a regra 8 (gráfico por biblioteca: grade, série em ouro, rótulo mono), reescrita com `var(--gold)`; "Docs Word frio"; fallbacks de fonte | `dados-e-graficos.md`; `pdf-e-impresso.md` |
| `samais-html-presentation` | quando usar; layout (nav no topo, seções numeradas, cabeçalho de seção, footer com tagline); armadilha do `section.wrap`; dobras full-bleed; contraste da dobra light; voz e copy; imagens; data viz; disciplina de fontes; verificação em Playwright; atestados; sem contato | `pecas-html.md`; `dados-e-graficos.md`; `checklist-contraste-mobile.md` |
| `samais-rota/CLAUDE.md` | o mesmo sistema da `html-presentation`, mais: reflow de tabela por `data-l`, exceção do A4 absoluto, tokens extras da dobra light (`#6E675B`, `#6F5A2C`), print de fonte oficial como evidência, classe `.js-anim` | `pecas-html.md`; `tokens-e-tipografia.md`; `pdf-e-impresso.md`; `checklist-contraste-mobile.md` |
| `doutrina/samais.css` | tokens, material, componentes, refração de fundo, `.rolavel`, alvos de toque | `tokens-e-tipografia.md` |
| `doutrina/design-system.md` | precedência, espelho no Claude Design, tokens abaixo do contraste, refração só em apresentação | `SKILL.md`; `tokens-e-tipografia.md` |
| `doutrina/padrao-dobras.md` | anatomia, âncoras, ritmo, virada, cinco movimentos, refração só em imagem, autossuficiência, CSP, impressão, imagem e realidade, checagem | `pecas-html.md`; `pdf-e-impresso.md`; `dados-e-graficos.md`; `checklist-contraste-mobile.md` |
| `regras-completas.md` | "Efeito e componente de UI de fora" (21st.dev) e "PDF e impresso" | `pecas-html.md`; `pdf-e-impresso.md` |
| `doutrina/imagens/README.md` | vetos de imagem, regras de uso de foto | `pecas-html.md` |
| `CLAUDE.md` (não-negociáveis) | procedência ✓ ≈ ○ e convergência, preço, Ourinhos só em SP, identidade | `SKILL.md`; `dados-e-graficos.md`; `pecas-html.md` |

### Descartado ou corrigido

- **Paleta antiga** das cópias de 97 linhas (`#04060C`, ouro `#D4A857`, texto `#EDEAE2`, âmbar `#DD8D0C`, crítico
  `#C20D2F`, verde `#5F8C6A`) e o fundo de slide `#04060C`: aposentados pelo `design-system.md`. O slide passa a usar
  `--bg`.
- **Série de gráfico em `#D4A857`** (regra 8): passa a `var(--gold)`.
- **Miolo de PDF em `#FAF9F5`**: substituído pelo miolo branco (Ota, 15/10/2026).
- **"Navegação lateral fixa em desktop"** (versão de 112 linhas): o `samais.css` traz a barra fixa no topo (`.topbar`),
  o padrão de dobras e o `samais-rota` também; ficou a barra no topo.
- **"Responsivo até 380px"**: substituído por zero rolagem em 390, 360 e 320px.
- **Licença** "MIT (fork de anthropics/skills brand-guidelines)": errada. A origem é Apache-2.0 (Copyright 2026
  Anthropic, PBC). Rotulada `Apache-2.0`, com `LICENSE.txt` e `NOTICE`.
- **Governança do `samais-rota`** ("fonte canônica: `victorotaa/samais-rota`", `scripts/samais-init.sh`, template
  repository): substituída pela decisão de 20/10 (canônico = `samais-os`). Não entrou na skill; a atualização do
  `samais-rota` fica com o coordenador.
- **Infra do vault** (Drive como fonte da identidade): os SVGs canônicos agora vivem em `doutrina/marca/`; o Drive segue
  como banco de imagens.

### Divergências entre o `samais-rota` e a doutrina do `samais-os` (vale o `samais-os`)

| Tema | `samais-rota` / `html-presentation` | Doutrina do `samais-os` | Na skill |
|---|---|---|---|
| Refração | `backdrop-filter: blur() url(#glassDistort)` no vidro em geral | `padrao-dobras.md`: refração só em `<img>`; dado não refrata; `design-system.md`: refração de fundo só em peça de apresentação | doutrina |
| Movimento | typing na headline e no subtítulo do hero (~2s); count-up ~2s; parallax com headroom ~20%; hover com lift de 5px e brilho dourado; fade ~200ms | cinco comportamentos e nenhum a mais; contagem 1,6s; parallax limitado a 16%; revelação 800ms | doutrina; typing e lift ficaram fora |
| Respiro entre seções | 116 / 88 / 72px | 104px desktop, 60px mobile | doutrina (a armadilha do `section.wrap` ficou como técnica) |
| Faixa de foto | "faixas full-bleed entre seções para ritmo" | banda de imagem na abertura e no fechamento; no meio é erro comum | doutrina |
| Foto de operação | fotos operacionais do banco (frota, central, equipe) | Princípio da Realidade para foto; banco curado em `doutrina/imagens/` | doutrina, com o banco curado |
| Imagem e fonte | hospedar no repositório (Vercel) | peça institucional autossuficiente (base64, sem requisição externa) | as duas, por tipo: peça embute; site hospeda |
| Cases | Ourinhos e CISNORPI em material de SAMU e de investidor | recortes e precedente de Ourinhos só em contexto paulista; PDF do atestado de Ourinhos não se publica | as duas, com a restrição do `samais-os` |
| Texto da dobra light | `#3A362E` | `#3A352D` | doutrina |
| Fonte canônica | `samais-rota` | `samais-os` (Ota, 20/10/2026) | `samais-os` |

### Divergência interna do `samais-os` (para o Ota)

- **Rolagem horizontal dentro de contêiner.** `padrao-dobras.md` (peça longa) proíbe `overflow-x:auto` e exige zero
  rolagem inclusive dentro de contêiner; `design-system.md` e o `samais.css` (`.rolavel`) mandam o conteúdo largo rolar no
  próprio contêiner. A skill aplica a primeira à peça longa e a segunda a painel e ferramenta do OS, e registra a
  divergência aqui.
- **Refração de fundo em superfície de dado.** O `samais.css` aplica `backdrop-filter: … url(#glassDistort)` a todo
  `.glass`, inclusive cartão com número; o `CLAUDE.md` diz "superfície de dado não refrata". O `padrao-dobras.md` só
  proíbe `filter` (o que ondula o texto); a refração de fundo não ondula a letra, mas o alcance de "não refrata" pede
  decisão.

## 20/10/2026 — segunda rodada: a cópia do `samais-copilot`

Fonte: `samais-copilot/.claude/skills/samais-brand-guidelines/SKILL.md` (325 linhas, 16.408 bytes, rótulo "MIT", última
mudança em 05/10/2026, commit `5ced612`). Era a única cópia com o sistema "navy-black" do CoPilot e do PEP. Conferida
contra `doutrina/samais.css`, `design-system.md`, `padrao-dobras.md`, `doutrina/imagens/README.md`,
`doutrina/higgsfield-canon.md` e o `CLAUDE.md` ("Identidade": o samais-os é a fonte canônica; em conflito, vale ele).

Depois da rodada: `SKILL.md` com 94 linhas e 7.845 bytes (≈ 1.960 tokens); `references/` sem este histórico com 499
linhas e 32.310 bytes.

### O que entrou

| Regra do CoPilot | Onde |
|---|---|
| Contraste da marca ≥ 3:1 (WCAG 1.4.11); SVG em `<img>` não herda `currentColor` | `tokens-e-tipografia.md` §4, medido sobre os SVGs oficiais (a dourada reprova no creme e no branco); checklist |
| Refração na borda, nunca no miolo (camada `.nucleo` mascarada) | `tokens-e-tipografia.md` §5, só em peça de apresentação |
| Overlay de foto só o suficiente para a legenda ler | `pecas-html.md` §9 |
| Banco documental vence imagem gerada; zero stock; referência real antes de gerar; selo na `figcaption`, discreto pela construção | `pecas-html.md` §9 |
| `aria-expanded` no menu do mobile | `pecas-html.md` §3 |
| Nunca eixo duplo; ouro em tons não é paleta categórica; rótulo direto; paleta validada por script | `dados-e-graficos.md`; `SKILL.md` ("nunca fazer") |
| Métrica de demo sempre rotulada; claim sem lastro não entra | `dados-e-graficos.md` |
| "Preço tem que saltar": no bloco empilhado, o valor mais forte que o rótulo | `dados-e-graficos.md`; checklist |
| Rolar a página inteira antes de medir; `getBoundingClientRect().right`; doze larguras | checklist |
| "Sutileza demais é o mesmo que nada" (passo ≥ ~8 RGB no escuro) | checklist, como conferência de que a `.fold-alt` se vê |

### O que não entrou, e por quê

| Regra do CoPilot | Motivo |
|---|---|
| Tokens `#070708`, `#0E0E10`, `#161618`, ouro `#BF9A3D`/`#EAC97A`/`#A18230`, texto `#F4F4F5`/`#A8A8B0`/`#6E6E78`, semânticas `#43A047`/`#FDD835`/`#E53935`/`#1E88E5` | contradiz `samais.css` (`--bg #0A0A0A`, `--gold #B8954E`, texto creme). Listado como "não entra em peça da casa" no `SKILL.md` e no checklist |
| Plus Jakarta Sans no corpo ("não usar Inter") | contradiz `samais.css` e `design-system.md` (Inter 300; Plus Jakarta é legado dos estudos) |
| Acento de IA `--ai:#00D4A8` | não existe no `samais.css`; peça não redeclara cor. Fica com o app do CoPilot (ver decisão abaixo) |
| Tema claro alternável (`data-theme="light"`, `localStorage`) | o `samais.css` não tem tema claro; a versão light da casa é a dobra light e a impressão |
| `::selection` em ouro; foco de 3px em `--gold-500` | o `samais.css` decide o foco (2px, `--gold-soft`); `::selection` não está nele. Se o Ota quiser, entra no CSS, não na skill |
| Easing editorial `cubic-bezier(0.22,1,0.36,1)` em 240ms | `padrao-dobras.md`: cinco comportamentos, revelação de 800ms em `cubic-bezier(.16,1,.3,1)` |
| Navegação de 68px, wordmark de 24px, monograma abaixo de 860px, blur de 18px | `samais.css`: `.topbar` + `.barra-vidro` (blur 28px), wordmark mínimo de 26px, monograma abaixo de 600px |
| Monograma "sempre `gold-500`"; wordmark branca no escuro e preta no claro | contradiz o wordmark dourado no desktop (`samais.css`, `.marca`). Ficou só a medição de 3:1 |
| Dobras semânticas `.fold-deep` (o que a Samais entrega), `.fold-gold` como lavagem de ouro para "dinheiro", `.part-divider`; "alternar a cada duas vira tabuleiro" | `padrao-dobras.md`: `.fold-gold` é a virada (gradiente `#C9A85A`→`#9B7937`), uma por peça; não inventar terceira cor; o ritmo de referência alterna `.fold` e `.fold-alt` |
| "Top border ouro 2px em cards de dados" | não está na doutrina e espalha ouro por todo cartão (ouro ≤ 10%) |
| Cores de status e de Manchester em gráfico | mistura a paleta operacional com a institucional (proibido); fica no app do CoPilot |
| "Pizza com até 3 fatias" | a casa é mais estrita: donut só para razão de duas partes |
| Linha-mestra "cada segundo conta"; "postura do CoPilot 100% passiva" | conteúdo de produto, não de forma. A linguagem do CoPilot em peça é de `samais-municipal-study/references/peca-cliente.md` §6; a tagline da casa é *"Onde gestão se mede em vidas."* |
| "Taxa de trote real nacional 5,8–9,7% (nunca 29%)" | número sem fonte citada; pelo Princípio da Realidade, não entra até ter procedência. Ficou a regra (claim sem lastro não entra) |
| Imagem gerada **no Higgsfield** | `higgsfield-canon.md`: imagem se gera grátis (GPT ou Gemini), sem crédito |
| Subsets `latin` + `latin-ext`; aviso de CSP do Artifact | `padrao-dobras.md`: só `latin`; a autossuficiência (fonte em base64) já cobre o Artifact |
| Precedência "JSON de tokens do PEP > LP do CoPilot > skill"; "a skill vive só na conta (`~/.claude/skills/`), nunca por repositório" | superadas pela decisão do Ota de 20/10/2026: canônico no `samais-os`, cópia gerada por `scripts/sincronizar-skills.mjs` |
| Miolo de PDF `#FAF9F5`; navegação lateral; "responsivo até 380px"; Docs Word em Plus Jakarta Sans | já descartados na primeira rodada (acima) |

### Decisões que ficam com o Ota

1. **O sistema do CoPilot e do PEP está vivo.** `samais-pep/design/samais-pep-os-design-tokens.json` (v1.0, mai/2026) e
   a LP do CoPilot (`samais-copilot/lp/index.html`, com `#070708`, `#BF9A3D` e Plus Jakarta Sans) usam outra paleta e
   outra fonte; a apresentação ao MS, referência viva do `padrao-dobras.md`, usa a da casa (`#0A0A0A`, `#B8954E`). Pela regra de 20/10, peça da casa segue o `samais.css`. Falta decidir se a
   **interface dos produtos** (app do CoPilot, PEP OS) migra para o `samais.css` ou fica como sistema de produto
   declarado, com o acento de IA.
2. **Imagem gerada de operação.** O CoPilot proíbe gerar instalação, equipe, frota ou paciente da Samais ("o selo
   resolve enquadramento, não conteúdo") e marca no objeto gerado. O `padrao-dobras.md` vai no mesmo sentido (grafismo
   abstrato, sem pessoa nem veículo). Mas `samais-municipal-study/references/peca-cliente.md` §7 (06/10/2026) admite imagem de marca gerada (frota, central,
   equipe, jaleco com o monograma) com selo, e o banco curado de 05/10 tem imagens geradas de TARM e de socorrista
   aprovadas como base. A skill registra a divergência e não escolhe.
3. **As cópias da conta claude.ai estão velhas.** Em 20/10/2026, `anthropic-skills:samais-brand-guidelines` (97 linhas,
   "navy-black") e `anthropic-skills:samais-municipal-study` (426 linhas, com Plus Jakarta Sans) são as versões
   anteriores à unificação, e é a cópia da conta que o carregador entrega quando a sessão não tem o repositório. Atualizar
   na configuração da conta, pelo Ota (o script não alcança a conta).
