#!/usr/bin/env bash
# make-dist.sh — собирает dist/ по allow-list: только то, что нужно проду.
# Запуск из любого места: film-src/make-dist.sh   (корень репо = ../ от скрипта). dist/ в .gitignore.
set -euo pipefail
shopt -s nullglob
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; DIST="$ROOT/dist"
cd "$ROOT"

# всё, что обязано существовать — иначе падаем до очистки dist/
for f in VVID.dc.html support.js robots.txt vendor fonts film/desktop film/mobile film/descent \
         intro.mp4 intro-mobile.mp4 favicon.svg favicon-48.png apple-touch-icon.png og-image.png; do
  [ -e "$f" ] || { echo "make-dist: нет $f" >&2; exit 1; }
done

rm -rf "$DIST"; mkdir -p "$DIST/fonts" "$DIST/film"

# страница — как index.html и под оригинальным именем; рантайм; robots
cp VVID.dc.html "$DIST/index.html"
cp VVID.dc.html "$DIST/VVID.dc.html"
cp support.js robots.txt "$DIST/"

# self-hosted вендоры (react, react-dom, lenis, three) и шрифты + их лицензии
cp -R vendor "$DIST/vendor"
cp fonts/*.woff2 "$DIST/fonts/"
for lic in fonts/*OFL* fonts/LICENSE* fonts/*license*; do cp "$lic" "$DIST/fonts/"; done

# фильмы: hero (desktop/mobile) и спуск (desktop + mobile + proxy + still); QA-кадры не берём
cp -R film/desktop "$DIST/film/desktop"
cp -R film/mobile  "$DIST/film/mobile"
cp -R film/descent "$DIST/film/descent"
rm -rf "$DIST"/film/descent/qa-*

# интро прелоадера, иконки, og-image
cp intro.mp4 intro-mobile.mp4 "$DIST/"
cp favicon.svg favicon-48.png apple-touch-icon.png og-image.png "$DIST/"

find "$DIST" -name .DS_Store -delete
echo "✓ dist/: $(du -sh "$DIST" | cut -f1), файлов: $(find "$DIST" -type f | wc -l | tr -d ' ')"
