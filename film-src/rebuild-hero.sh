#!/usr/bin/env bash
# rebuild-hero.sh [src=film-src/originals/hero-4k-v2.mp4] — hero из 4K-апскейла (48 fps) → film/desktop 1920x1080 q78 + film/mobile 720x1280 24fps q72,
# с фильтром локального контраста hero-clarity.py (глава 01 мягкая — .55, дальше .25).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; SRC="${1:-$HERE/originals/hero-4k-v2.mp4}"
export FRAME_FILTER="$HERE/hero-clarity.py"
"$HERE/video2film.sh" "$SRC" "$HERE/../film/desktop" 48 1920x1080 78
"$HERE/video2film.sh" "$SRC" "$HERE/../film/mobile" 24 720x1280 72
for d in desktop mobile; do python3 -c "import json;m=json.load(open('$HERE/../film/$d/film.json'));print('$d',m['frames'],'кадров',round(m['totalBytes']/1048576,1),'MiB')"; done
