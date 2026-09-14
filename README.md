# VVID — лендинг студии

Одностраничный лендинг студии VVID (vvid.solutions): веб- и мобильные приложения для действующих бизнесов, интернет-магазины и сайты, телеграм-боты, UI/UX.
Технически это один DC-шаблон `VVID.dc.html` + рантайм `support.js`, без сборщика и зависимостей из сети.

## Из чего состоит

- `VVID.dc.html` — вся страница: разметка, стили и логика (`<script type="text/x-dc">` внизу, класс `Component extends DCLogic`). RU/EN-переключатель, hero-фильм и фильм «спуска» на canvas (скраб по скроллу), кастомный курсор, Lenis на десктопе.
- `support.js` — DC-рантайм: грузит React 18.3.1 UMD (копии в `vendor/`, SRI sha384 прописаны в самом рантайме) и интерпретирует `<x-dc>`. Генерируется — руками не править.
- `vendor/` — `react.production.min.js`, `react-dom.production.min.js` (18.3.1), `lenis.min.js` (1.3.26).
- `fonts/` — Literata, Wix Madefor Display/Text, PT Mono (переменные woff2) + OFL-лицензии.
- `film/desktop`, `film/mobile` — hero-фильм: WebP-кадры, склеенные в `film-NN.bin` + `film.json` (оффсеты кадров); `proxy/` — ¼-размер для мгновенного скраба.
- `film/descent` — фильм спуска из 4 клипов: десктоп 1440×810 @ 24 fps, `mobile/` 540×960 @ 12 fps (каждый второй кадр); у обоих `proxy/` и `still.jpg` (первый кадр); в `film.json` поле `clips: 4`.
- `film-src/` — пайплайн кадров: `build-descent.sh` (склейка клипов кроссфейдом → оба слоя + still), `video2film.sh` (клип → кадры → WebP → бандлы + прокси), `bundle-frames.mjs` (кадры → `.bin` + манифест), `make-dist.sh` (сборка `dist/`), `originals/` (исходники видео до пережатия), `TREATMENT.md` (сценарий фильма).
- `intro.mp4` (7 с, 1280×720, без звука) и `intro-mobile.mp4` — заставка прелоадера.
- `favicon.svg`, `favicon-48.png`, `apple-touch-icon.png`, `og-image.png`, `robots.txt`.

## Запуск локально

Только по HTTP (не `file://`), из корня репо:

```bash
python3 -m http.server 8123
# http://127.0.0.1:8123/VVID.dc.html
```

Нужен только python3: React, Lenis и шрифты лежат в репо.

## Пересобрать фильм

Требуются `ffmpeg`, `cwebp` (libwebp) и `node`.

```bash
# спуск целиком: склейка 4 клипов → desktop + mobile + proxy + still + clips:4 в манифестах
film-src/build-descent.sh film/descent clipA.mp4 clipB.mp4 clipC.mp4 clipD.mp4

# один слой вручную: <вход> <папка> [fps] [WxH] [q]
film-src/video2film.sh src.mp4 film/descent/mobile 12 540x960 66
```

После ручной сборки слоя спуска допишите `"clips": 4` в его `film.json` (`build-descent.sh` делает это сам).
`video2film.sh` кладёт 4 контрольных кадра в `qa-<слой>/` рядом с папкой слоя — только для проверки глазами, в git и в деплой не брать.

## Собрать dist/

```bash
film-src/make-dist.sh   # чистит dist/ и копирует только allow-list
```

В `dist/` попадают: `index.html` (= `VVID.dc.html`, плюс копия под своим именем), `support.js`, `vendor/`, `fonts/`, `film/{desktop,mobile,descent}` без QA-кадров, интро-видео, иконки, `og-image.png`, `robots.txt`. Ничего из `film-src/`, `*.md`, черновиков и исходников. `dist/` в `.gitignore`.

## Git

Репо: github.com/YuraHihiniak/vvid-landing. Работа идёт в ветке `clay-cursor-real-content`, в `main` попадает через PR (последние влитые — #3 и #4).
