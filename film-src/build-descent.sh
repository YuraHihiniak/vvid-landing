#!/usr/bin/env bash
# build-descent.sh <out-dir> <clip1.mp4> [clip2.mp4 ...]
# Склеивает клипы спуска кроссфейдом (0.33 с) в один ряд кадров → десктоп 1920x1080 24fps q74 (DESK_SIZE/DESK_Q) + мобайл (центр-кроп 9:16) 540x960 12fps q66 + still + прокси.
set -euo pipefail
OUT="$1"; shift
DESK_SIZE="${DESK_SIZE:-1920x1080}"; DESK_Q="${DESK_Q:-74}"   # десктопный ряд: размер и качество webp (переопределяются окружением)
HERE="$(cd "$(dirname "$0")" && pwd)"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
export FRAME_FILTER="${FRAME_FILTER:-$HERE/hero-clarity.py}"; export CLARITY_PROFILE="${CLARITY_PROFILE:-0:.35,480:.35}"   # тот же фильтр и профиль, что у hero (rebuild-hero.sh): иначе кадр стыка hero→спуск заметно отличается
N=$#; FADE=0.33
if [ "$N" -eq 1 ]; then cp "$1" "$TMP/descent.mp4"; else
  INPUTS=(); for f in "$@"; do INPUTS+=(-i "$f"); done
  FC=""; PREV="[0:v]"; OFF=0
  i=1; for f in "$@"; do
    [ "$i" -eq 1 ] && { i=2; continue; }
    D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "${@:$((i-1)):1}")
    OFF=$(python3 -c "print(round($OFF + $D - $FADE, 3))")
    LABEL="[v$i]"; [ "$i" -eq "$N" ] && LABEL="[vout]"
    FC="${FC}${PREV}[$((i-1)):v]xfade=transition=fade:duration=$FADE:offset=$OFF$LABEL;"
    PREV="$LABEL"; i=$((i+1))
  done
  ffmpeg -v error -y "${INPUTS[@]}" -filter_complex "${FC%;}" -map "[vout]" -r 24 -c:v libx264 -crf 14 -pix_fmt yuv420p "$TMP/descent.mp4"
fi
echo "→ склейка: $(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames,duration -of csv=p=0 "$TMP/descent.mp4")"
"$HERE/video2film.sh" "$TMP/descent.mp4" "$OUT" 24 "$DESK_SIZE" "$DESK_Q"   # десктоп: 1080p q74 (источники — 4K-апскейлы Kling-клипов, см. originals/clips)
"$HERE/video2film.sh" "$TMP/descent.mp4" "$OUT/mobile" 12 540x960 66   # мобайл: 12 fps = каждый второй кадр (вдвое меньше байт)
ffmpeg -v error -y -i "$TMP/descent.mp4" -frames:v 1 -vf "scale=${DESK_SIZE%x*}:${DESK_SIZE#*x}:flags=lanczos" -q:v 4 "$OUT/still.jpg"
ffmpeg -v error -y -i "$TMP/descent.mp4" -frames:v 1 -vf "scale=540:960:force_original_aspect_ratio=increase,crop=540:960" -q:v 5 "$OUT/mobile/still.jpg"
cp "$TMP/descent.mp4" "${DESCENT_SRC_COPY:-/private/tmp/claude-501/-Users-roy/174dced4-c26b-436a-96c4-d43b9c875482/scratchpad/descent-src.mp4}" 2>/dev/null || true
python3 - "$OUT" "$N" <<'PY'
import json,sys,os
out,n=sys.argv[1],int(sys.argv[2])
for d in (out, os.path.join(out,'mobile')):
    p=os.path.join(d,'film.json'); m=json.load(open(p)); m['clips']=n; json.dump(m,open(p,'w')); print(d, m['frames'],'кадров', round(m['totalBytes']/1048576,2),'MiB', 'clips', n)
PY
echo "✓ $OUT готов"
