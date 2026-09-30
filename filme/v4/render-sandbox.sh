#!/usr/bin/env bash
# Render completo do comercial numa máquina limpa, numa chamada só:
# Node 22 → dependências → mídia (B-roll e locução) → console gravado → trilha →
# render HyperFrames → loudness final (−16 LUFS, duas passadas) → upload.
#
#   UPLOAD_URL='<URL pré-assinada, PUT>' bash render-sandbox.sh
#
# Precisa de internet (nodejs.org, npm, github.com, o CDN do Higgsfield e o
# download do Chrome da HyperFrames), de ffmpeg no PATH e do Playwright global
# (para gravar o console).
set -euo pipefail
RAIZ=${RAIZ:-/home/user/rota-v4}
RAMO=${RAMO:-claude/filme-rota}
t0=$(date +%s); marca() { echo "[$(( $(date +%s) - t0 ))s] $*"; }

PW_GLOBAL="$(npm root -g 2>/dev/null)/playwright"   # antes de trocar o Node
rm -rf "$RAIZ"; mkdir -p "$RAIZ"; cd "$RAIZ"
NODE_TGZ=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | awk '/linux-x64.tar.xz$/{print $2}')
curl -fsSL "https://nodejs.org/dist/latest-v22.x/$NODE_TGZ" | tar -xJ
export PATH="$RAIZ/${NODE_TGZ%.tar.xz}/bin:$PATH"
marca "node $(node -v)"

git clone -q --depth 1 -b "$RAMO" https://github.com/victorotaa/samais-rota src
cd src/filme/v4
npm ci --no-audit --no-fund >/dev/null
./preparar.sh >/dev/null
marca "dependências"

node baixar.mjs
marca "mídia"

PLAYWRIGHT_MODULE="$PW_GLOBAL" node capturar-app.mjs
marca "console gravado"

node trilha/compor.mjs >/dev/null
marca "trilha"

npx hyperframes lint . >/dev/null 2>&1 || true
npx hyperframes browser ensure >/dev/null 2>&1 || true
npx hyperframes render . -o renders/bruto.mp4 -f 30 --workers auto --video-frame-format png --quiet
marca "render"

# loudness em duas passadas: a peça tem muita dinâmica (silêncio e impacto no vão)
MED=$(ffmpeg -hide_banner -i renders/bruto.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$MED" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -y -v error -i renders/bruto.mp4 -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
  renders/rota-comercial.mp4
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact renders/rota-comercial.mp4
marca "mixagem"

if [ -n "${UPLOAD_URL:-}" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H 'Content-Type: video/mp4' --data-binary @renders/rota-comercial.mp4 "$UPLOAD_URL")
  marca "upload HTTP $code"; [ "$code" = 200 ]
fi
echo FIM_OK
