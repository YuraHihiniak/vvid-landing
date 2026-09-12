#!/usr/bin/env bash
# video2film.sh <input.mp4> <out-dir (film/desktop | film/mobile)> [fps=24] [WxH=1600x900] [q=80]
# Клип → детерминированная кадровая последовательность → WebP → бандлы + манифест для VFilm.
set -euo pipefail
IN="$1"; OUT="$2"; FPS="${3:-24}"; SIZE="${4:-1600x900}"; Q="${5:-80}"
W="${SIZE%x*}"; H="${SIZE#*x}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
HERE="$(cd "$(dirname "$0")" && pwd)"
echo "→ кадры ${FPS}fps ${W}x${H} из $IN"
# cover-кроп до нужного соотношения, lanczos, без интерполяции кадров
ffmpeg -v error -i "$IN" -vf "fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}" -start_number 0 "$TMP/f_%04d.png"
N=$(ls "$TMP"/f_*.png | wc -l | tr -d ' '); echo "  кадров: $N"
mkdir -p "$TMP/webp"
for f in "$TMP"/f_*.png; do b=$(basename "${f%.png}"); cwebp -quiet -q "$Q" -m 6 -sharp_yuv -mt "$f" -o "$TMP/webp/$b.webp"; done
mkdir -p "$OUT"; rm -f "$OUT"/film-*.bin "$OUT"/film.json
node "$HERE/bundle-frames.mjs" "$TMP/webp" "$OUT" 30
# прокси-слой (¼ размера, q60): мгновенный декод при быстром скрабе, чёткий кадр подъезжает следом
PW=$(( W / 4 )); PH=$(( H / 4 )); mkdir -p "$TMP/proxy"
for f in "$TMP"/f_*.png; do b=$(basename "${f%.png}"); cwebp -quiet -q 60 -m 4 -resize $PW $PH "$f" -o "$TMP/proxy/$b.webp"; done
mkdir -p "$OUT/proxy"; rm -f "$OUT/proxy"/film-*.bin "$OUT/proxy"/film.json
node "$HERE/bundle-frames.mjs" "$TMP/proxy" "$OUT/proxy" 60
# контрольные кадры для QA
mkdir -p "$OUT/../qa-$(basename "$OUT")"; cp "$TMP/f_0000.png" "$TMP/f_$(printf %04d $((N/3))).png" "$TMP/f_$(printf %04d $((2*N/3))).png" "$TMP/f_$(printf %04d $((N-1))).png" "$OUT/../qa-$(basename "$OUT")/" 2>/dev/null || true
echo "✓ $OUT готов"
