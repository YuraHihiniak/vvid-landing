# VVID — landing

Иммерсивный лендинг инженерной/диджитал-студии **VVID**. Текущая рабочая версия — самодостаточный **Design Composition** (один HTML с кастомным рантаймом).

## Запуск локально

Это **не обычная статика**: `support.js` — рантайм (подгружает React/ReactDOM/Babel с CDN — нужен интернет — и интерпретирует `<x-dc>`, биндинги `{{ }}`, `style-hover`). Открывать **по HTTP**, не через `file://`.

```bash
python3 -m http.server 8123
# открыть в браузере: http://127.0.0.1:8123/VVID.dc.html
```

(на корне `http://127.0.0.1:8123/` будет листинг каталога — нужен путь к файлу)

## Структура

- **`VVID.dc.html`** — весь лендинг: разметка + инлайн-стили + вся логика в `<script type="text/x-dc">` внизу файла (класс `Component extends DCLogic`).
- `support.js` — DC-рантайм (не править: генерируется). `image-slot.js` — drag-fill заглушки изображений.
- `intro.mp4`, `team-cat.jpg`, `scraps/`, `uploads/` — медиа и ассеты.
- `agency-handoff/` — пакет ТЗ для агентства: `00-FINAL-TZ.md` (мастер), `01-market-positioning-2026.md` (рынок), `02-design-motion-spec.md` (дизайн/моушн).
- `VVID.dc.backup.html` — снапшот до части правок (можно удалить — история в git).

## Дизайн / стек (заметки)

- Тёплый техно-брутализм: ink `#1b1812` · cream `#e4ded2` · акцент-терракота `#b9543f`. Шрифты: **Golos Text** (дисплей/проза) + **IBM Plex Mono** (метки/цифры/код).
- React 18 (UMD) + Babel с unpkg; **three.js r149 (UMD)** для 3D-героя (жидкий металл).
- Анимации: 3D-капля в герое, видео-заставка (прелоадер), переходы-шторки между секциями (CSS-кейфрейм по триггеру при пересечении границы — НЕ scroll-scrub), reveal/kinetic-заголовки, ASCII-портрет команды, magnetic-CTA. Всё уважает тумблер `motion` и `prefers-reduced-motion`.

## Логика моушна (хуки в `VVID.dc.html`)

`initPreloader` (видео-заставка) · `initThree` (3D-герой) · `initScroll`/`applyScroll` (параллакс/кейсы) · `initScenes`/`updateScenes`+`playScene` (шторки-переходы) · `initReveal` · `initKinetic` · `initAsciiTeam` · `initMagnetic` · `setCalm` (общий выключатель анимаций).
