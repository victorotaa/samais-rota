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
