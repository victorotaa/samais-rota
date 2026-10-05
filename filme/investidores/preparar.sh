#!/usr/bin/env bash
# Prepara o projeto para preview/render. Nada aqui é fonte de verdade: marca e
# tokens vêm da doutrina (samais-os/doutrina), fontes e scripts vêm do npm.
# Tudo o que este script copia está no .gitignore desta pasta.
set -euo pipefail
cd "$(dirname "$0")"
DOUT="${SAMAIS_DOUTRINA:-doutrina}"   # padrão: a cópia fixada (doutrina/LEIA.md)
[ -f "$DOUT/samais.css" ] || { echo "doutrina não encontrada — defina SAMAIS_DOUTRINA=/caminho/samais-os/doutrina" >&2; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund >/dev/null
mkdir -p vendor assets/fonts assets/marca assets/img assets/sfx assets/audio
for p in gsap SplitText DrawSVGPlugin CustomEase; do cp node_modules/gsap/dist/$p.min.js vendor/; done
cp node_modules/@hyperframes/core/dist/hyperframe.runtime.iife.js vendor/
cp "$DOUT/samais.css" assets/samais.css
cp "$DOUT/marca/samais-logo-gold.svg" "$DOUT/marca/samais-monograma-gold.svg" assets/marca/
cp node_modules/@svg-maps/brazil/brazil.svg assets/img/brasil.svg
# Syne VARIÁVEL (400–800 num arquivo só: o peso também se anima)
cp node_modules/@fontsource-variable/syne/files/syne-latin-wght-normal.woff2 node_modules/@fontsource-variable/syne/files/syne-latin-ext-wght-normal.woff2 assets/fonts/
F=node_modules/@fontsource
for f in plus-jakarta-sans/files/plus-jakarta-sans-latin-300-normal plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-300-normal \
         plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-400-normal \
         plus-jakarta-sans/files/plus-jakarta-sans-latin-400-italic plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-400-italic \
         jetbrains-mono/files/jetbrains-mono-latin-400-normal jetbrains-mono/files/jetbrains-mono-latin-ext-400-normal \
         jetbrains-mono/files/jetbrains-mono-latin-500-normal jetbrains-mono/files/jetbrains-mono-latin-ext-500-normal; do
  cp "$F/$f.woff2" assets/fonts/
done
# fotos reais do programa (repo samais-rota)
cp ../assets/frota-frente.jpg ../assets/noticia-3300.jpg assets/img/ 2>/dev/null || true
echo "pronto. B-roll em assets/broll/, console em assets/app/, locução em assets/voz/ (ver README)."
