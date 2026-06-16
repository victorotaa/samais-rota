# Como iniciar um novo estudo/documento HTML da Samais

Objetivo: **todo repo Samais nasce com a mesma identidade** (tokens, liquid glass,
parallax, folds, animações, voz, cases). Fonte canônica: `victorotaa/samais-rota` (branch `main`).

## Caminho 1 — Template repository (recomendado)
1. Marque `samais-rota` (ou um `samais-template`) como **Template repository**
   no GitHub: *Settings → General → ☑ Template repository*.
2. Em cada estudo novo: **Use this template** → o repo já vem com `CLAUDE.md`,
   `.claude/skills/` e (quando existir) `template.html`.
3. Renomeie no padrão `samais-<municipio>` e siga.

## Caminho 2 — Bootstrap num repo já criado
Dentro do repo novo, rode:
```bash
bash scripts/samais-init.sh        # puxa CLAUDE.md + a skill da fonte canônica
```
(É preciso `gh` autenticado. A skill passa a valer automaticamente naquele repo.)

## Depois (qualquer caminho)
1. Diga ao Claude: *"estudo de transporte sanitário do município X — use o sistema visual Samais"*.
   Ele aplica a skill `samais-html-presentation`.
2. Puxe identidade/fotos do **vault no Google Drive** (logos, banco de imagens).
3. Adapte conteúdo e números; **cases só Ourinhos e CISNORPI**.
4. Deploy: `npx vercel --prod --scope samais`.

> Mantenha a cópia da skill no vault (Drive) em sincronia com `SKILL.md`.
