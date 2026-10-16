# VVID — лендинг студии

Одностраничный лендинг студии VVID (vvid.solutions): веб- и мобильные приложения для действующих бизнесов, интернет-магазины и сайты, телеграм-боты, UI/UX.
Технически это один DC-шаблон `VVID.dc.html` + рантайм `support.js`, без сборщика и зависимостей из сети.

## Из чего состоит

- `VVID.dc.html` — вся страница: разметка, стили и логика (`<script type="text/x-dc">` внизу, класс `Component extends DCLogic`). RU/EN-переключатель, hero-фильм и фильм «спуска» на canvas (скраб по скроллу), кастомный курсор, Lenis на десктопе.
- `support.js` — DC-рантайм: грузит React 18.3.1 UMD (копии в `vendor/`, SRI sha384 прописаны в самом рантайме) и интерпретирует `<x-dc>`. Генерируется — руками не править.
- `vendor/` — `react.production.min.js`, `react-dom.production.min.js` (18.3.1), `lenis.min.js` (1.3.26), `three.module.min.js` (r170, MIT) — ES-модуль, подключён в `<head>` и выставляет `window.THREE` для 3D-логотипа прелоадера.
- `fonts/` — Literata, Wix Madefor Display/Text, PT Mono (переменные woff2) + OFL-лицензии.
- `film/desktop`, `film/mobile` — hero-фильм: WebP-кадры, склеенные в `film-NN.bin` + `film.json` (оффсеты кадров); `proxy/` — ¼-размер для мгновенного скраба.
- `film/descent` — фильм спуска из 4 клипов: десктоп 1440×810 @ 24 fps, `mobile/` 540×960 @ 12 fps (каждый второй кадр); у обоих `proxy/` и `still.jpg` (первый кадр); в `film.json` поле `clips: 4`.
- `film-src/` — пайплайн кадров: `build-descent.sh` (склейка клипов кроссфейдом → оба слоя + still), `video2film.sh` (клип → кадры → WebP → бандлы + прокси), `bundle-frames.mjs` (кадры → `.bin` + манифест), `make-dist.sh` (сборка `dist/`), `originals/` (исходники видео до пережатия), `TREATMENT.md` (сценарий фильма).
- Прелоадер — 3D-монограмма VV+D (класс `VLogo3D` в `VVID.dc.html`): контур векторизован potrace'ом из PNG заказчика и вшит в разметку (`VVID_LOGO_MARK`), экструзия three.js с мягкими краями: знак терракотовый (#b9543f), освещён двумя тёплыми лампами цвета фонаря (#ffbe6e) справа — сверху и снизу, на наведении знак становится прозрачным стеклом; наклон вправо, вращение вокруг своей оси, за курсором не следует; фон-шейдер отдаёт linear-цвет (`colorspace_fragment`), иначе за стеклом «муть»; подложка — свой шейдер `VVID_LOADER_FRAG`: та же «жидкая терракота», что и hero на главной (тот же fbm-поток, фон живёт/течёт), но «жар» больше не следует за курсором — вместо него два статичных фонаря справа (сверху и снизу): тот же тёплый подмес `cHot` с exp-спадом, что был у курсора, только статичный и шире, с заголовком «solutions / vvid» (Cabinet Grotesk 500, как имя на hero guillaumezhu.com). Снизу — лоадер (полоса + процент, `[data-pre-bar]`/`[data-pre-pct]`): ползёт к ~85 % во время загрузки и добивается до 100 % по готовности. Выход прелоадера (без свайпа вверх): 3D-знак и текст растворяются (гаснет холст `[data-pre-logo]`), сверху свайпом заезжает белый скелет-заглушка hero `[data-pre-skel]` (силуэт заголовка «МЫ VVID», бегущая строка, кнопка telegram + scroll снизу — локализуются из `this._t`), затем весь прелоадер растворяется и под ним проявляется настоящая страница (её вёрстка совпадает со скелетом — выглядит как «скелет заполнился контентом»). Отладка: `?hold` в адресе — прелоадер не уезжает и лоадер не ползёт. `intro.mp4` / `intro-mobile.mp4` больше не используются и в `dist/` не копируются.
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

В `dist/` попадают: `index.html` (= `VVID.dc.html`, плюс копия под своим именем), `support.js`, `vendor/`, `fonts/`, `film/{desktop,mobile,descent}` без QA-кадров, иконки, `og-image.png`, `robots.txt`. Ничего из `film-src/`, `*.md`, черновиков и исходников. `dist/` в `.gitignore`.

## Git

Репо: github.com/YuraHihiniak/vvid-landing. Работа идёт в ветке `clay-cursor-real-content`, в `main` попадает через PR (последние влитые — #3 и #4).
