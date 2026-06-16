#!/usr/bin/env bash
# Samais — instala a identidade visual (CLAUDE.md + skill) num repo novo,
# a partir da fonte canônica. Requer 'gh' autenticado (funciona em repo privado).
#
# Uso (dentro do repo novo):
#   bash scripts/samais-init.sh
# Overrides opcionais:
#   SAMAIS_SRC=victorotaa/samais-rota SAMAIS_REF=main bash scripts/samais-init.sh
set -euo pipefail

SRC="${SAMAIS_SRC:-victorotaa/samais-rota}"
REF="${SAMAIS_REF:-main}"

echo "→ Puxando identidade Samais de ${SRC}@${REF} ..."
mkdir -p .claude/skills/samais-html-presentation

gh api "repos/${SRC}/contents/CLAUDE.md?ref=${REF}" \
  -H "Accept: application/vnd.github.raw" > CLAUDE.md

gh api "repos/${SRC}/contents/.claude/skills/samais-html-presentation/SKILL.md?ref=${REF}" \
  -H "Accept: application/vnd.github.raw" > .claude/skills/samais-html-presentation/SKILL.md

echo "✓ Identidade instalada: CLAUDE.md + .claude/skills/samais-html-presentation/SKILL.md"
echo "  Agora é só pedir ao Claude um estudo HTML da Samais — ele aplica o padrão automaticamente."
