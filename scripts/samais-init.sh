#!/usr/bin/env bash
# Samais — instala a identidade visual (skill samais-brand-guidelines) num repo novo,
# a partir da fonte canônica, o samais-os (Ota, 20/10/2026). Requer 'gh' autenticado
# (funciona em repo privado).
#
# Uso (dentro do repo novo):
#   bash scripts/samais-init.sh
# Overrides opcionais:
#   SAMAIS_SRC=victorotaa/samais-os SAMAIS_REF=main bash scripts/samais-init.sh
#
# Puxa a pasta inteira da skill (SKILL.md, references/, LICENSE.txt, NOTICE). A skill se
# edita só no samais-os; para repos da casa já existentes, o caminho é
# samais-os/scripts/sincronizar-skills.mjs, que carimba o commit de origem.
set -euo pipefail

SRC="${SAMAIS_SRC:-victorotaa/samais-os}"
REF="${SAMAIS_REF:-main}"
SKILL=".claude/skills/samais-brand-guidelines"

echo "→ Puxando ${SKILL} de ${SRC}@${REF} ..."

baixar_pasta() {
  local pasta="$1"
  gh api "repos/${SRC}/contents/${pasta}?ref=${REF}" --jq '.[] | [.type, .path] | @tsv' |
  while IFS=$'\t' read -r tipo caminho; do
    if [ "$tipo" = "dir" ]; then
      baixar_pasta "$caminho"
    else
      mkdir -p "$(dirname "$caminho")"
      gh api "repos/${SRC}/contents/${caminho}?ref=${REF}" -H "Accept: application/vnd.github.raw" > "$caminho"
      echo "  ✓ $caminho"
    fi
  done
}
baixar_pasta "$SKILL"

if [ ! -f CLAUDE.md ]; then
  cat > CLAUDE.md <<EOF
# CLAUDE.md

Repositório da Samais Gestão em Saúde. A identidade visual vem da skill \`samais-brand-guidelines\`
(\`${SKILL}/\`), cópia de ${SRC}@${REF}: a fonte canônica é o samais-os, e em conflito vale ele.
EOF
  echo "  ✓ CLAUDE.md (ponteiro para a fonte canônica)"
fi

echo "✓ Identidade instalada. Agora é só pedir ao Claude um estudo HTML da Samais — ele aplica o padrão automaticamente."
