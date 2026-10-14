#!/usr/bin/env bash
# rebuild-hero.sh [src=film-src/originals/hero2-4k.mp4] — hero из 4K-апскейла (48 fps) → film/desktop 1920x1080 q${DESK_Q:-74} + film/mobile 720x1280 24fps q${MOB_Q:-68},
# с фильтром локального контраста hero-clarity.py (глава 01 мягкая — .55, дальше .25).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${1:-$HERE/originals/hero2-4k.mp4}"
export FRAME_FILTER="$HERE/hero-clarity.py"
export CLARITY_PROFILE="${CLARITY_PROFILE:-0:.35,480:.35}"   # hero2 (перегенерация 08.10) резкий сам по себе — ровные .35; для старого клипа было 0:.55,170:.55,215:.3,240:.45,330:.45,370:.25,480:.25
"$HERE/video2film.sh" "$SRC" "$HERE/../film/desktop" 48 1920x1080 "${DESK_Q:-74}"
"$HERE/video2film.sh" "$SRC" "$HERE/../film/mobile" 24 720x1280 "${MOB_Q:-68}"
for d in desktop mobile; do python3 -c "import json;m=json.load(open('$HERE/../film/$d/film.json'));print('$d',m['frames'],'кадров',round(m['totalBytes']/1048576,1),'MiB')"; done
