#!/usr/bin/env bash
# build-hi.sh <src.mp4> <film-dir> <frame> [frame ...] — 2K-версии ключевых (статичных) кадров из 4K-исходника → <film-dir>/hi/<i>.webp + hi.json
# Тот же фильтр, что у основных кадров (hero-clarity.py: clarity .35 + тонкая резкость; радиусы масштабируются по ширине).
# Плеер (VFilm, hiBase) показывает их только на целой позиции — холд hero или ключевой кадр главы спуска, где скролл остановился.
# HI_SIZE (2560x1440), HI_Q (86). Индексы кадров = индексы основного ряда (hero 48 fps 1:1, спуск 24 fps 1:1 со склейкой).
set -euo pipefail
SRC="$1"; OUT="$2/hi"; shift 2; FRAMES=("$@")
HERE="$(cd "$(dirname "$0")" && pwd)"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
SIZE="${HI_SIZE:-2560x1440}"; Q="${HI_Q:-86}"; W="${SIZE%x*}"; H="${SIZE#*x}"
export FRAME_FILTER="${FRAME_FILTER:-$HERE/hero-clarity.py}"; export CLARITY_PROFILE="${CLARITY_PROFILE:-0:.35,480:.35}"
SORTED=($(printf '%s\n' "${FRAMES[@]}" | sort -n -u))
SEL=""; for i in "${SORTED[@]}"; do SEL="${SEL}+eq(n\\,$i)"; done; SEL="${SEL#+}"
ffmpeg -v error -y -i "$SRC" -vf "select='$SEL',scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H}" -vsync 0 -start_number 0 "$TMP/f_%04d.png"
GOT=$(ls "$TMP"/f_*.png | wc -l | tr -d ' '); [ "$GOT" -eq "${#SORTED[@]}" ] || { echo "ожидалось ${#SORTED[@]} кадров, извлечено $GOT" >&2; exit 1; }
python3 "$FRAME_FILTER" "$TMP"
mkdir -p "$OUT"; rm -f "$OUT"/*.webp
k=0; for i in "${SORTED[@]}"; do cwebp -quiet -q "$Q" -m 6 -sharp_yuv -mt "$TMP/f_$(printf %04d $k).png" -o "$OUT/$i.webp"; k=$((k+1)); done
python3 - "$OUT" "$W" "$H" "$Q" "${SORTED[@]}" <<'PY'
import json,os,sys
out,w,h,q=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]; fr=[int(x) for x in sys.argv[5:]]
frames=[{"i":i,"url":f"{i}.webp","bytes":os.path.getsize(f"{out}/{i}.webp")} for i in fr]
json.dump({"type":"image/webp","w":w,"h":h,"frames":frames},open(f"{out}/hi.json","w"),separators=(',',':'))
print(f"{out}: {len(frames)} кадров {w}x{h} q{q} {sum(f['bytes'] for f in frames)/2**20:.2f} MiB — " + ", ".join(f"{f['i']}:{f['bytes']//1024}K" for f in frames))
PY
