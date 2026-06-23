# VVID — ТЗ. Раздел 02. Дизайн и иммерсивный моушн

**Статус:** канон для агентства · **Версия дизайна:** warm techno-brutalist / Y2K (текущая, актуальная — НЕ старая sci-fi-blue)
**Эталон вёрстки и моушна:** `/Users/roy/Downloads/immersive-site/VVID.dc.html` (рантайм `<x-dc>` + `support.js`, `image-slot.js`)
**Целевой уровень:** Awwwards-grade (регистр Linear / Vercel / Stripe / Active Theory / Resn / SOTY 2025)

> Этот документ описывает **дизайн-систему** и **моушн-язык** для продакшн-сборки лендинга на 8 секций. Копию, структуру и позиционирование не меняем — поднимаем исполнение. Все механики обязаны быть visibility-safe, reduced-motion / calm-aware и перформансными (LCP < 2.0s, INP < 100ms, CLS ≈ 0, 60fps).

---

## 0. Принципы (north star)

1. **«Показываем, а не рассказываем».** Каждый эффект доказывает инженерную точность студии. Моушн *служит* нарративу (свап слов, decode данных, scan-in портрета), а не «движется ради движения».
2. **Restraint в цвете.** Тёмная база + один тёплый акцент (терракота). Статусные цвета — отдельная служебная группа, не бренд.
3. **Сетка и whitespace = сигнал доверия.** «Точная сетка → у них и инжиниринг точный» (Vercel blueprint grid).
4. **Три голоса типографики, жёстко.** Display/Heading (Golos) · Mono ТОЛЬКО метки/цены/код/readout (IBM Plex Mono) · Prose с reading-measure (Golos, ≤ 64–66 знаков). Запрет mono в абзацах длиннее одной строки.
5. **Безопасность по умолчанию.** Если эффект не нарисовался — под ним валидный фон/контент. Шторки полностью уходят в покое. Тяжёлая работа гейтится вьюпортом и троттлится.
6. **ИИ — только услуга** («внедрение ии и обучение моделей»), никогда не тема и не визуальный мотив.

---

## 1. Критика текущей сборки (по секциям)

### Сквозные сильные стороны
- Дисциплинированный моушн-слой с едиными токенами и честной `calm`/reduced-motion-веткой (`setCalm` гасит rAF, ставит `animation-play-state:paused`, фиксирует reveal/kinetic) — это уже уровень топа.
- Scene-curtain с **idle-resolve** (шторка трекает скролл активно, в покое за ~560ms полностью сходит с экрана и `display:none`) — редкое, правильное решение «иммерсия без перекрытия контента».
- Pinned-horizontal lookbook с editorial-параллаксом медиа внутри рамки (`±9%` от своей ширины) — хороший вкус.
- ASCII-портрет с scan-in по скроллу, decode-кромкой, hover-линзой и live-shimmer — настоящий вау-момент и дифференциатор.
- `image-slot` drag-fill — умный заглушечный паттерн для хэндофа.

### Конкретные пробелы vs Awwwards-grade
| Секция | Проблема | Что нужно |
|---|---|---|
| Глобально | Все стили инлайнами, нет токен-слоя (CSS-vars только `--acc`). Магические px (8/14/26/40/56). | Полная токен-система (color/space/type/radius/shadow/z/motion) в `:root` + dark-scope. |
| Глобально | Тени почти нет — для нео-брутализма не хватает фирменной **офсет-тени** (brutal `Npx Npx 0`). | Ввести `--shadow-brutal-*` на интерактиве (CTA/карточки/окна). |
| Глобально | Фокус-кольца — браузерные дефолты; контраст части subtle-текста (`#6f685c` на `#13110c`) ниже AA. | Focus-HUD (двойное кольцо), аудит контраста, минимум AA 4.5:1 для текста. |
| Глобально | Нет курсор-HUD, нет blueprint-grid, нет scramble/decode — заявленные premium-сигналы отсутствуют. | Добавить (см. §4). |
| 01 Hero | Корректно минимизирован, но «голый»: один акцент, статичный фон → на фоне эталонов читается просто, не «инженерно». LCP-заголовок без энтри-моушна. | Калм-энтри (mask-rise H1 + fade lede), опц. blueprint-grid-fade и тонкий generative-texture (статичный), курсор-HUD. БЕЗ возврата канваса/видео. |
| 02 Manifesto | Гигантская «02» — статичный watermark-параллакс; princip鬼ы появляются стаггером — ок, но плоско. | Kinetic-headline (есть), + scramble на eyebrow `fig.02`, decode у цифр. |
| SLA-bar | Маркиза 36s linear — функционально, но «дешевит» без hover-pause и без edge-fade. | Hover-замедление, mask-fade по краям, дублирование контента для бесшовности (уже есть ×2). |
| 03 Capabilities | Hover-строки (padding-left) — хорошо; но 5 строк выглядят как список, не как «каталог инжиниринга». | Per-row data-readout (мини-тикеры из `specs`), индекс-нумерация с decode, hover-подсветка акцентной линией слева. |
| 04 Cases | Pinned-horizontal — сильно; но прогресс-бар тонкий, нет «FIG»-тех-подписей у кейсов (premium-сигнал из ресёрча), метрики статичны. | Count-up метрик при входе, FIG-подписи к 1–2 кейсам, drag/inertia на тач, snap к карточке. |
| 05 Process | Reveal-стаггер ок; «05» watermark ок; но шаги не читаются как «чертёж процесса». | Blueprint-коннекторы (тонкие линии между шагами), decode у meta-таймингов. |
| 06 Pricing | Аккордеон работает (max-height + chevron rotate 45°), первый открыт. Переход max-height на `scrollHeight+40` может дёргаться при ресайзе/динамике. | Стабилизировать (grid-rows 0fr→1fr или измерение по контенту), фокус-стейты, ARIA-связки. |
| 07 Team + FAQ | ASCII — отлично. Но три имени-кнопки + источники + FAQ в одной секции перегружают; на мобайле грид 1.15fr/1fr схлопнется неудачно. | Чёткая мобильная раскладка (портрет сверху, имена-аккордеон), фокус-стейты кнопок, hint доступнее. |
| 08 Closer | Форма красива (underline-инпуты), но нет error/success-стейтов кроме смены текста кнопки; нет инлайн-валидации, нет focus-HUD на инпутах. | Полные стейты формы (см. §3), success-карточка, scramble на «сегодня»-ротаторе. |
| Footer | Гигантский `vvid.` с параллаксом — ок. | Можно ASCII-логотип reveal (опц.), иначе оставить. |
| Float CTA | Auto-hide у brief/footer — правильно. Пульс-точка ок. | Magnetic + reduced-motion fallback (статичная точка). |

---

## 2. Возвышенная арт-дирекция и токены

Сохраняем тёплую техно-брутальную ДНК. Поднимаем исполнение через дисциплину сетки, тени-офсет, точные токены и три голоса типографики.

### 2.1 Цвет

**Бренд / поверхности (light = дефолт, тёплый cream).**
```
--ink:        #1b1812   /* основной текст на cream; фон тёмных секций — см. --void */
--cream:      #e4ded2   /* основная светлая поверхность */
--void:       #13110c   /* тёмная поверхность секций (почти-чёрный тёплый) */
--void-2:     #0b0906   /* глубже void: канвасы, ASCII-фон */
--paper-2:    #d3ccbd   /* cream-2: заглушки медиа, второстепенные плашки */
```

**Акцент (терракота) + тон-рампа.**
```
--acc:        #b9543f   /* единственный бренд-акцент */
--acc-press:  #a3472f   /* darker — active/press */
--acc-hover:  #c66048   /* lighter — hover-заливка текста */
--acc-tint-8:  rgba(185,84,63,.08)   /* hover-фон строк/карточек */
--acc-tint-16: rgba(185,84,63,.16)   /* активные плашки */
```
Альтернативные акценты (enum в эталоне, оставить как тему-токены, не для рантайм-микса): `#6e2a1c`, `#4f4a3e`, `#1b1812`.

**Текст (роли).**
```
--text-strong:  #1b1812 (на cream) / #e4ded2 (на void)
--text-body:    #5a5346 (на cream) / #b6ad9e (на void)
--text-muted:   #8c8474 (на cream) / #8f877a (на void)
--text-faint:   #a7a090 (на cream) / #6f685c (на void)  /* ⚠ только для деко/≥18px, не для важного текста */
```

**Линии / бордеры.**
```
--line-on-cream:  rgba(27,24,18,.18)
--line-on-void:   rgba(228,222,210,.18)
--line-hair:      rgba(228,222,210,.12)  /* волосяные разделители на void */
```

**Семантика / статусы (служебная группа — НЕ бренд, приглушённая под тёплую палитру).**
```
--ok:      #4f7a52   /* success — приглушённый шалфей */
--ok-bg:   rgba(79,122,82,.12)
--warn:    #b8862f   /* warning — янтарь */
--warn-bg: rgba(184,134,47,.12)
--err:     #b9402f   /* error — близко к акценту, чуть холоднее/краснее */
--err-bg:  rgba(185,64,47,.12)
--info:    #4a6b7c   /* info — пыльно-стальной */
--focus:   #b9543f   /* focus-ring = акцент; на тёмном — внешнее кольцо cream */
```
> Статус-цвета проверены на AA (текст ≥ 4.5:1 на своих фонах; для статус-текста использовать на cream/void, не на цветной заливке мелким кеглем).

**Контраст (WCAG 2.2 AA — обязательные пары).**
| Пара | Контраст | Назначение |
|---|---|---|
| `#1b1812` / `#e4ded2` | ~12.6:1 | основной текст light | 
| `#e4ded2` / `#13110c` | ~13.8:1 | основной текст dark |
| `#5a5346` / `#e4ded2` | ~6.2:1 | body light ✓ |
| `#b6ad9e` / `#13110c` | ~7.1:1 | body dark ✓ |
| `#8c8474` / `#e4ded2` | ~3.4:1 | ⚠ только ≥18px/деко (large-text AA) |
| `#fff` / `#b9543f` | ~3.6:1 | текст на акцент-заливке — только ≥18px bold (large AA) |
| `#13110c` / `#b9543f` | ~4.0:1 | ink-текст на акценте — мелкий ниже AA, НЕ использовать для body |

### 2.2 Типографика

Шрифты: **Golos Text** (400–900) — display/heading/prose. **IBM Plex Mono** (400–600) — ТОЛЬКО метки, цены, код, readout, FIG-подписи, scene-count.

**Шкала (clamp, fluid; десктоп-таргеты).**
```
--fs-display: clamp(42px, 8.4vw, 116px)  /* Hero H1 */
--fs-h1:      clamp(36px, 7vw, 104px)    /* Closer */
--fs-h2:      clamp(28px, 4.6vw, 64px)   /* секц. заголовки */
--fs-h2-sm:   clamp(26px, 4.2vw, 56px)
--fs-h3:      clamp(20px, 2.8vw, 38px)
--fs-h4:      clamp(20px, 2.4vw, 30px)
--fs-lede:    clamp(16px, 1.8vw, 21px)   /* подзаголовок-абзац */
--fs-body:    clamp(15px, 1.5vw, 17px)
--fs-body-sm: 15px
--fs-label:   11px   /* mono eyebrow / nav / specs */
--fs-label-sm:10px
--fs-stat:    clamp(28px, 3vw, 30px)     /* метрики (Golos 300) */
```
**Трекинг / интерлиньяж (индустриальный регистр — трекинг плотнее обычного):**
- Display/H1/H2: `letter-spacing: -.045em … -.035em`, `line-height: .94 … 1.02`.
- H3/H4: `-.03em`, `line-height 1.05`.
- Mono-метки: `letter-spacing: .18em … .26em`, `text-transform: uppercase`.
- Prose: `line-height 1.5 … 1.6`, `text-wrap: pretty`, **measure-cap** `max-width: var(--measure)`.

**Reading-measure (длина строки):**
```
--measure:        66ch  /* основной prose */
--measure-narrow: 52ch  /* lede / hero */
--measure-wide:   72ch
```

**Три голоса — правила применения.**
| Голос | Шрифт / вес | Где | Запрет |
|---|---|---|---|
| **Display / Heading** | Golos 600–800 | H1–H4, гигантские watermark-цифры, метрики (300) | — |
| **Mono / Label** | IBM Plex Mono 400–600, uppercase, tracked | eyebrow `fig.0x`, nav, specs-chips, цены/range, scene-count, readout-тикеры, код | НЕ для абзацев > 1 строки |
| **Prose** | Golos 400–500 | lede, body, FAQ-ответы, описания | measure-cap обязателен; `text-wrap:pretty` |

### 2.3 Spacing (8pt-сетка + 4pt-baseline)
```
--space-1:4  --space-2:8  --space-3:12 --space-4:16 --space-5:24
--space-6:32 --space-7:40 --space-8:56 --space-9:72 --space-10:96 --space-11:128
```
- Внутренние отступы карточек/стеков и вертикальный ритм — ТОЛЬКО из шкалы (убрать ad-hoc 14/26/30/34/50).
- Вертикальный ритм секций: `padding-block: clamp(var(--space-9), 13vw, var(--space-11))` (унифицировать все 6 «обычных» секций под одну формулу — в эталоне разнобой 40/50/60 vs 90/110).
- Gutter контента: `padding-inline: 26px` (мобайл) → max-width контейнеров: `1100px` (текст-секции) / `1320px` (широкие).

### 2.4 Blueprint-grid (сетка как сигнал)
- Базовая колоночная сетка: **12 колонок**, gutter `clamp(16px, 2vw, 32px)`, max-width `1320px`.
- Опциональный **визуальный blueprint-overlay** (Vercel-стиль): тонкие линии `--line-hair`, шаг `clamp(64px, 6vw, 96px)`, появляется fade-in в Hero и Process как деко-слой (не контентный), `pointer-events:none`, гаснет в calm.
- Baseline: 4px. Все строчные элементы выравниваются по 4px-ритму.

### 2.5 Радиусы
```
--radius-0: 0px   /* по умолчанию: брутализм = острые края (карточки, окна, чипы) */
--radius-1: 2px   /* микро-смягчение инпутов/чипов при желании */
--radius-pill: 999px  /* float CTA, status-dot, toggle */
```
> ДНК — `radius:0`. Скругление допускается ТОЛЬКО для pill-CTA и статус-точек.

### 2.6 Тени (фирменная brutal-офсет + мягкие подъёмы)
```
--shadow-brutal-sm: 4px 4px 0 var(--ink)      /* чипы, мелкие кнопки на cream */
--shadow-brutal:    8px 8px 0 var(--ink)      /* карточки, OS-окна (light) */
--shadow-brutal-acc:8px 8px 0 var(--acc)      /* акцентный вариант (hover/active) */
--shadow-brutal-inv:8px 8px 0 var(--cream)    /* на тёмных поверхностях */
--shadow-soft:      0 12px 30px rgba(19,17,12,.30)  /* float CTA, тосты, модалка (мягкий подъём) */
--shadow-soft-lg:   0 24px 60px rgba(19,17,12,.40)  /* модалка/оверлей */
```
**Правило:** офсет-тень — статичный «печатный» вид брутализма; на hover тень сдвигается к `2px 2px 0` + элемент `translate(2px,2px)` (эффект «нажатия в бумагу»). Мягкие тени — только для парящих слоёв (CTA, тосты, модалка).

### 2.7 Z-слои
```
--z-base: 1
--z-content: 10
--z-scene-curtain: 7000   /* шторка переходов (pointer-events:none) */
--z-header: 8000
--z-float-cta: 8500
--z-toast: 9000
--z-modal: 9300
--z-preloader: 9600
--z-cursor-hud: 9800      /* кастомный курсор поверх всего, pointer-events:none */
```

### 2.8 Easing и длительности (моушн-токены)
```
/* easing */
--ease-out-expo:   cubic-bezier(.16,1,.3,1)    /* базовый «дорогой» out — reveal, kinetic, magnetic, аккордеон */
--ease-in-out-quart:cubic-bezier(.76,0,.24,1)  /* симметрия — preloader-уход, шторка-резолв на больших дистанциях */
--ease-out-quart:  cubic-bezier(.25,1,.5,1)    /* быстрые UI-переходы (hover, focus) */
--ease-standard:   cubic-bezier(.4,0,.2,1)     /* нейтральный (тосты, opacity) */

/* durations */
--dur-1: 120ms   /* микро (focus, chip hover) */
--dur-2: 200ms   /* hover, мелкие стейты */
--dur-3: 320ms   /* кнопки, word-swap-out */
--dur-4: 500ms   /* hover-строки, chevron, magnetic */
--dur-5: 700ms   /* reveal-ish, scene idle-resolve фаза */
--dur-6: 1000ms  /* reveal / kinetic word-rise */
--dur-intro: 1500ms /* preloader count */

/* stagger */
--stagger-words: 60ms   /* kinetic слова */
--stagger-list:  80–120ms /* reveal-стеки (principles/process) */
--stagger-chars: ~throttled (scramble/decode по rAF) */
```

---

## 3. Дизайн-система: компоненты и все стейты

> Все интерактивные таргеты ≥ **24×24px** (WCAG 2.2 — Target Size Minimum; CTA/кнопки фактически ≥ 44px). Focus-HUD виден на всех. Light/Dark — через scope-токены секции.

### 3.1 Кнопки / CTA
**Варианты:** Primary (solid), Secondary (outline), Ghost (text), Magnetic-обёртка (для крупных CTA).

| Стейт | Primary (на void) | Secondary (outline) | Заметки |
|---|---|---|---|
| Default | `bg:--cream; color:--void; padding:15px 28px; mono-label .14em uppercase 600` | `border:1px currentColor; bg:transparent` | shadow опц. `--shadow-brutal-inv` |
| Hover | `bg:--acc; color:#fff` + traslate(2px,2px) + тень→`2px 2px 0` | `bg:--cream; color:--void` | magnetic-смещение `±(0.2x,0.28y)` курсора |
| Focus-visible | + **focus-HUD**: `outline:2px --focus; outline-offset:3px` + второе кольцо (на тёмном — внешнее cream) | то же | независимо от hover |
| Active/press | `bg:--acc-press` + translate(3px,3px) + тень→`0 0` | `bg:--acc-press; color:#fff` | «вдавлено» |
| Disabled | `opacity:.45; cursor:not-allowed; bg:--text-faint` | `opacity:.45; border-color:--line` | без magnetic/hover |
| Loading | label→spinner (mono «···» pulse) + `aria-busy` | — | блокирует повторный сабмит |

Reduced/calm: magnetic off (статичная позиция), hover-translate сохраняется (это не «движение ради движения», а аффорданс), либо упрощается до смены цвета.

### 3.2 Форма (Closer / brief)
Поля: текст-инпут (underline-стиль), select, textarea, контакт. Submit — magnetic primary.

| Стейт | Вид |
|---|---|
| Default | underline `1px --line-on-cream`; label = mono `.18em uppercase --text-muted`; value 17px --ink |
| Focus | underline → `2px --acc`; label color→--acc; **focus-HUD** на самом контроле; плавно `--dur-2` |
| Filled | underline `--ink`; label чуть тусклее |
| Error | underline `--err`; под полем mono-подсказка `--err` (`напр. укажите контакт`); `aria-invalid`, `aria-describedby` |
| Success (поле) | короткий tick `--ok` справа inline |
| Submit success | форма → **success-карточка**: `border:1px --ok; bg:--ok-bg`; заголовок «бриф отправлен», текст «вернёмся с оценкой < 2 часов»; кнопка меняет текст (как сейчас) + state persist |
| Submit error | тост `--err` «не удалось отправить — напишите в telegram @vvid» + кнопка в default |

Валидация: инлайн на blur, не на каждый кейстрок. Минимум обяз. полей (контакт + задача).

### 3.3 OS-окна (для кейсов / демо — опциональный premium-слой)
Брутальное окно: title-bar (mono-лейбл + 3 точки-«светофор» в палитре `--acc/--text-muted/--line`), контент-зона, офсет-тень.
| Стейт | Вид |
|---|---|
| Default | `border:1px --ink; shadow:--shadow-brutal; radius:0` |
| Hover | тень→`--shadow-brutal-acc`, lift translate(-2px,-2px) |
| Focus-within | focus-HUD на окне |
| Active/dragged (демо) | курсор grab→grabbing, инерция |

### 3.4 Аккордеон (Pricing / FAQ)
| Стейт | Вид / поведение |
|---|---|
| Collapsed | head: индекс mono `--acc` + title; chevron = плюс `+` |
| Hover | head `bg:--acc-tint-8`; title чуть сдвиг (`padding-left` +2px) |
| Focus-visible | focus-HUD на head-кнопке |
| Expanded | плюс → крест (rotate 45°, `--dur-4 --ease-out-expo`); панель open; `aria-expanded=true` |
| Анимация раскрытия | **стабильно**: `grid-template-rows: 0fr→1fr` (или измеренный `max-height`) + opacity, `--dur-5 --ease-out-expo`; избегать дёрганья при ресайзе |
Reduced/calm: мгновенное раскрытие без transition (или `--dur-1`).
ARIA: head = `button aria-expanded aria-controls`; панель = `region aria-labelledby`.

### 3.5 Чипы (specs / теги)
| Стейт | Вид |
|---|---|
| Default | mono `.12em uppercase --text-muted`; `border:1px --line`; padding 5px 9px; radius 0 |
| Hover (если интерактив) | border→--acc; color→--text-strong |
| Active/selected | `bg:--acc-tint-16; border-color:--acc; color:--acc` |
| Static (дефолт в Capabilities) | без hover — это метки, не контролы |

### 3.6 Табы (если потребуются для EN/RU-демо или фильтра кейсов)
| Стейт | Вид |
|---|---|
| Default | mono-label `--text-muted`; underline transparent |
| Hover | color→--text-strong |
| Active | color→--ink/--cream; underline `2px --acc`; индикатор едет `--dur-3 --ease-out-expo` |
| Focus | focus-HUD на табе |
ARIA: `role=tablist/tab/tabpanel`, стрелки клавиатуры.

### 3.7 Тосты
| Тип | Вид |
|---|---|
| Контейнер | top/bottom-right; `--z-toast`; `shadow:--shadow-soft`; radius 0; mono-лейбл + текст |
| Success | левая полоса `4px --ok`; иконка tick |
| Error | левая полоса `4px --err` |
| Info | левая полоса `4px --info` |
| Вход/выход | slide+fade `translateY(12px)→0` `--dur-3 --ease-standard`; auto-dismiss 5s; `role=status`/`alert` |
Reduced/calm: только fade.

### 3.8 Модалка (опц. — кейс-детали / видео-демо)
- Overlay `rgba(19,17,12,.6)` + backdrop-blur(4px опц.); панель `bg:--cream/--void`, `shadow:--shadow-soft-lg`, radius 0.
- Стейты: open (fade+scale .98→1 `--dur-4`), close, focus-trap, Esc-close, `aria-modal`, восстановление фокуса.
- Reduced/calm: fade без scale.

### 3.9 Case-карточки (lookbook)
| Стейт | Вид |
|---|---|
| Default | медиа-фрейм (overflow hidden) + индекс-плашка `bg:--void color:--cream` + status-плашка с акцент-точкой; ниже — клиент(mono) + title + метрики |
| Hover | media scale 1.03 (внутри фрейма), status-точка pulse, лёгкий lift |
| Focus-within | focus-HUD на article |
| In-view | метрики **count-up**, media-параллакс активен |

### 3.10 Навигация (header)
- `position:fixed; mix-blend-mode:difference` (адаптируется к секции) — оставить, но добавить fallback-цвет для браузеров без mix-blend и для a11y-контраста при scroll.
| Стейт | Вид |
|---|---|
| Link default | mono `.2em uppercase opacity .7` |
| Link hover | opacity 1 + опц. подчёркивание `--acc` (decode-микро на hover, см §4) |
| Link focus | focus-HUD |
| CTA «бриф» | outline-кнопка, magnetic |
| Motion-toggle | pill-переключатель `motion on/off`; `aria-pressed`; точка-индикатор |
Мобайл: nav-группа скрыта (`@max-width:880`), нужен **бургер → fullscreen-меню** (см. §5.0).

### 3.11 Плавающий Telegram-pill
| Стейт | Вид |
|---|---|
| Default | `bg:--void color:--cream`; pill; пульс-точка `--acc` (`vPulse`); `shadow:--shadow-soft` |
| Hover | `bg:--acc color:#fff`; magnetic |
| Focus | focus-HUD |
| Auto-hide | у `#brief`/`footer` → opacity 0 + `translateY(24px)` + `pointer-events:none` (есть) |
Reduced/calm: пульс остановлен (статичная точка), auto-hide сохраняется.

### 3.12 Доступность (свод)
- **Контраст:** WCAG 2.2 AA (4.5:1 текст, 3:1 large/UI). `--text-faint` — только деко/large.
- **Focus-HUD:** единый паттерн — `outline:2px --focus; outline-offset:3px` + (на тёмном) внешнее кольцо cream 1px → читается на любой поверхности. Никогда не `outline:none` без замены.
- **Targets ≥ 24px** (CTA ≥ 44px), хит-зоны у nav/иконок расширены паддингом.
- **prefers-reduced-motion + calm-mode:** один тумблер `motion on/off` (persist localStorage) + системный медиа-запрос. Calm = `setCalm(true)`: rAF off, `animation-play-state:paused`, reveal/kinetic зафиксированы, шторка `display:none`, ASCII рисует 1 статичный кадр, scramble→финальный текст, маркиза стоп.
- **Семантика:** landmark-роли, h1→h2 иерархия, `sc-for`-списки → корректные list-семантики, формы с label/aria.
- **Клавиатура:** весь интерактив доступен с Tab; аккордеон/табы/модалка — клавиши по WAI-ARIA APG.

---

## 4. ⭐ Иммерсивный моушн-язык (ядро)

### 4.1 Единый язык
- **Один easing-герой:** `--ease-out-expo (.16,1,.3,1)` — все «прибытия» (reveal, kinetic, magnetic, аккордеон, шторка-резолв). Симметричный `--ease-in-out-quart` — только для крупных «занавес»-движений (preloader-уход, шторка на больших дистанциях).
- **Глаголы моушна:** *rise* (из-под маски), *decode* (scramble→текст), *scan-in* (ASCII построчно), *sweep* (шторка), *drift* (параллакс), *count-up* (числа), *magnetize* (CTA к курсору), *lens* (hover-линза ASCII).
- **Ритм:** энтри ≈ `--dur-6` со стаггером `--stagger-words/list`; микро-UI ≈ `--dur-2`; всё гейтится IntersectionObserver и троттлится (rAF ≥ 30–33ms для канвасов).
- **Бюджет производительности:** только `transform`/`opacity` для слоёв (никаких layout-props в анимации). `will-change` ставится на входе и снимается через ~1.2s. Канвасы (ASCII, опц. generative) — `IntersectionObserver`-gated, throttle, `dpr ≤ 1.5`. Heavy-decode — небольшими батчами.

### 4.2 Per-animation таблица

| # | Эффект | Триггер | Что происходит | Длит. | Easing | Стаггер | Fallback (reduced / calm) |
|---|---|---|---|---|---|---|---|
| 1 | **Preloader / boot** | load | count 0→100 (ease-out-cubic), прогресс-бар 0→100%; затем панель уезжает `translateY(-100%)` | count `--dur-intro`; уход 850ms | count: out-cubic; уход `--ease-in-out-quart` | — | reduced: счёт=100, бар=100%, панель сразу `display:none` |
| 2 | **Hero calm-entrance** *(нов., вместо канваса)* | mount после preloader | eyebrow fade; H1 — **mask-rise** по словам; lede fade-up; CTA fade-up; (опц.) blueprint-grid fade-in | 700–1000ms | `--ease-out-expo` | words 60ms, блоки 120ms | reduced/calm: всё сразу видимо, без transform |
| 3 | **Hero scroll-fade** | scroll в Hero | контент `opacity 1→0` + `translateY 0→-40px` по прогрессу (p>0.5) | rAF (scroll-bound) | linear к скроллу | — | calm: статично (без сдвига) |
| 4 | **Scene-curtain (keep + idle-resolve)** | active scroll рядом с границей секции | панель трекает скролл `translateY (0.5-u)*200%`; цифра/бары fade по центру band; **в покое** (~700ms после стопа, факт. 560ms timeout) — уходит в сторону движения и `display:none` | sweep = scroll-bound; resolve 550ms | resolve `--ease-out-expo` | — | calm/reduced: `display:none`, никогда не показывается |
| 5 | **Reveal-on-scroll** | вход во вьюпорт (IO 12%) | `opacity 0→1` + `translateY 26px→0`; `data-delay` per-item | `--dur-6` | `--ease-out-expo` | list 80–120ms (через data-delay) | reduced/calm: opacity 1, transform none сразу |
| 6 | **Kinetic headline (word-rise)** | вход (IO 25%) | каждое слово выезжает из-под `overflow:hidden`-маски `translateY 118%→0` | `--dur-6` | `--ease-out-expo` | `--stagger-words` 60ms | reduced/calm: transform none |
| 7 | **Word-swap (ротатор)** | таймер 2800ms | слово fade-out down → подмена → fade-in up (Hero: «веб/мобайл/боты…», Closer: «сегодня/за 2 спринта…») | out+in ~`--dur-3` | `--ease-out-expo` | — | calm: интервал очищен, статичное слово; reduced: то же |
| 8 | **ASCII-portrait scan-in** | scroll (canvas top 88%→32% vh) | reveal 0→1: глифы проявляются сверху-вниз c джиттером; **decode-кромка** (терракот-глифы) над фронтом | scroll-bound | — (порог per-cell) | per-cell threshold | reduced/calm: 1 статичный полный кадр (`prog=1`) |
| 9 | **ASCII live-shimmer** | canvas видим, не calm | проявленные глифы «дышат» (sin-волны меняют ramp-индекс/цвет) | rAF ~30fps | — | — | calm: shimmer off (статичный кадр) |
| 10 | **ASCII hover-lens** | mousemove/touch по canvas | в радиусе ~8 ячеек глифы укрупняются, светлеют до `#fff`, «boil» усиливается; cursor crosshair | rAF | — | по близости | reduced/calm: линза off |
| 11 | **Magnetic CTA** | mousemove по `[data-magnetic]` | элемент тянется к курсору `translate(mx*.2, my*.28)`; на leave → 0 | `--dur-4` | `--ease-out-expo` | — | calm: off (return early); reduced: off |
| 12 | **Hover micro (строки/ссылки)** | hover | Capabilities-строка: `padding-left +18px` + `bg:--acc-tint`; nav-link: opacity/decode-микро | `--dur-4` / `--dur-2` | `--ease-out-expo` | — | calm: мгновенно/без сдвига |
| 13 | **SLA marquee** | autoplay | бесконечный `translateX 0→-50%` (контент дублирован ×2) | 36s linear loop | linear | — | + **hover-замедление** (анимация pause/slow) ; reduced/calm: `animation-play-state:paused` |
| 14 | **Pinned horizontal cases** | scroll в sticky-секции (340vh) | трек едет `translateX -(p*max)`; прогресс-бар 6→100%; счётчик 01/03 | scroll-bound | linear к скроллу | — | reduced/calm: секция как вертикальный список карточек (no pin) |
| 15 | **Case metrics count-up** *(нов.)* | карточка in-view | числа метрик от 0 к значению (`+34%`, `−480ч`, `1.2м`) | 900ms | out-quart | per-metric 80ms | reduced/calm: финальное число сразу |
| 16 | **Case media drift** | scroll (видим) | медиа внутри фрейма `translateX ±9%` по позиции относительно центра | rAF | linear | — | calm: transform none |
| 17 | **Watermark параллакс** | scroll | гигантские «0x» / footer `vvid.` дрейфуют `translateY` (capped `--pmax`) | rAF | linear | — | calm: transform none |
| 18 | **Accordion expand** | click/Enter | панель `0fr→1fr` (или max-height) + opacity; chevron rotate 0→45° | `--dur-5` / `--dur-4` | `--ease-out-expo` | — | reduced/calm: `--dur-1`/мгновенно |
| 19 | **Float CTA auto-hide** | IO у brief/footer | opacity 1→0 + `translateY 24px` + pointer-events off | `--dur-4` | `--ease-out-expo` | — | сохраняется (a11y-полезно) |
| 20 | **Cursor-HUD** *(нов.)* | pointer move (fine-pointer) | кастомный курсор: точка + рамка-«прицел», mono-readout (`x/y`, либо контекст-лейбл у CTA «→ открыть»); magnetize к интерактиву; mix-blend difference | rAF (lerp) | — | — | reduced/calm + coarse-pointer: системный курсор, HUD off |
| 21 | **Blueprint-grid reveal** *(нов.)* | вход секции (Hero/Process) | тонкая координатная сетка `--line-hair` fade-in + лёгкий «draw» (scaleX/Y линий) | 700ms | `--ease-out-expo` | линии 30–50ms | reduced/calm: статичная сетка или off |
| 22 | **Data-readout тикеры** *(нов.)* | Capabilities/Process in-view | mono-«приборные» строки из `specs`/meta печатаются/тикают (`1.2m sku/day`, `sla 99.9%`) | 600ms | out-quart | per-char throttled | reduced/calm: финальный текст сразу |
| 23 | **Scramble / decode текст** *(нов., ScrambleText)* | eyebrow/FIG/числа in-view (IO 40%) | символы «декодируются» из мусора в финал (терракот-глифы в процессе) | ~30–60 кадров | — | per-char random offset | reduced/calm: финальный текст сразу (компонент уже это делает) |
| 24 | **Generative texture (опц.)** | Hero/section фон | статичный seeded value-noise canvas (Ferrofield-логика) как тонкая фактура | — (static) | — | — | visibility-safe: не нарисовался → фон секции; всегда статичный (не анимируется) |

> Реализация существующих эффектов (1–19) уже в `VVID.dc.html`; новые (20–24) — добавить, соблюдая ту же дисциплину (IO-gating, throttle, calm-ветка, visibility-safe).

### 4.3 Перф-гарантии (acceptance)
- **LCP < 2.0s:** Hero H1/lede — критический CSS инлайн, шрифты `display:swap` + preconnect (есть); preloader не блокирует LCP-текст (контент рендерится под ним).
- **INP < 100ms:** scroll-хендлеры через single rAF-gate (`_scrollPending`) (есть); hover-стейты — `transform/opacity`; тяжёлые канвасы вне критического пути.
- **CLS ≈ 0:** все медиа/слоты с зарезервированной высотой (`image-slot` фиксирует), kinetic-маски не сдвигают layout (inline-block + padding-bottom компенсирует свисание), шрифты-swap без метрик-скачка (size-adjust при необходимости).
- **60fps:** канвасы throttled (≥30fps осознанно), `will-change` точечно, IO-gating, `dpr≤1.5`, no layout-thrash (чтения getBoundingClientRect батчатся в applyScroll).

---

## 5. Секция за секцией (визуальный интент + энтри/скролл + стейты)

### 5.0 Глобальные слои
- **Header:** fixed, mix-blend difference; добавить мобильный бургер→fullscreen-меню (слайд/decode-список ссылок, scene-numbers как навигация). Motion-toggle и «бриф»-CTA всегда доступны.
- **Cursor-HUD** (fine-pointer), **Float Telegram-pill**, **Scene-curtain** — сквозные.

### 5.1 01 Hero (минимальный, тёмный, 100vh)
- **Интент:** спокойный, уверенный, «инженерная тишина» + один акцент. БЕЗ канваса/видео/word-rotation в самом H1 (минимизация — канон).
- **Энтри:** preloader-уход → calm-entrance (#2): eyebrow→H1 mask-rise→lede→CTA; опц. blueprint-grid fade (#21) и статичная generative-фактура (#24); cursor-HUD активируется.
- **Скролл:** контент fade+lift (#3); scene-curtain к Manifesto (#4).
- **Стейты:** два CTA (primary «смотреть кейсы», secondary «telegram») — magnetic + focus-HUD; scroll-индикатор.
- **Мобайл-чек:** H1 `clamp(42px,8.4vw,116px)` читается; CTA в столбец, ≥44px; lede measure-narrow; курсор-HUD off (coarse pointer).

### 5.2 02 Manifesto (cream)
- **Интент:** манифест-постер, гигантская «02» watermark, 3 принципа-сетка (1px-грид).
- **Энтри:** eyebrow scramble (#23), H2 kinetic word-rise (#6), lede reveal (#5), принципы reveal-стаггер (#5, delay 0/100/200).
- **Скролл:** watermark параллакс (#17).
- **Стейты:** принципы — статичные карточки (hover опц. подсветка border-left `--acc`).

### 5.3 SLA-bar (маркиза, void)
- **Интент:** доверие-лента (договор, NDA, <2ч, билингва).
- **Моушн:** marquee (#13) + hover-замедление + edge mask-fade; reduced/calm — стоп.

### 5.4 03 Capabilities (void, 5 строк)
- **Интент:** каталог инжиниринга, не список. Индекс + tag + title + desc + specs-чипы.
- **Энтри:** H2 kinetic (#6); строки reveal (#5); data-readout тикеры из specs (#22).
- **Hover:** строка `padding-left +18px` + `bg:--acc-tint` + акцент-линия слева (#12); decode-микро у индекса (#23).
- **Стейты:** строка = ссылка на `#brief` (focus-HUD); чипы static.

### 5.5 04 Cases (pinned horizontal, cream, 340vh)
- **Интент:** lookbook-как-опыт; «метрики, не обещания»; FIG-подписи у 1–2 кейсов (premium).
- **Энтри/скролл:** pin + horizontal track (#14); media drift (#16); metrics count-up при входе карточки (#15); прогресс-бар + счётчик.
- **Стейты:** карточка hover (media scale, status-pulse, lift), focus-within; финальная «ваш кейс — следующий» CTA magnetic.
- **Тач:** свайп/инерция + snap к карточке; reduced/calm → вертикальный список (no pin).

### 5.6 05 Process (void, 5 шагов)
- **Интент:** «чертёж процесса», прозрачность, SLA-блок.
- **Энтри:** H2 kinetic (#6); шаги reveal-стаггер (#5, delay 0–320); blueprint-коннекторы draw (#21); meta-тайминги decode (#23/#22).
- **Скролл:** watermark «05» параллакс (#17).
- **Стейты:** строки static; SLA-блок акцент-eyebrow.

### 5.7 06 Pricing (cream, аккордеоны)
- **Интент:** прозрачный прайс, «без по запросу».
- **Энтри:** H2 kinetic (#6); список reveal (#5); первый аккордеон авто-открыт.
- **Интеракция:** accordion expand (#18) — стабилизировать (0fr→1fr); chevron +→×.
- **Стейты:** head hover/focus/expanded (см. §3.4); revenue-share-нота внизу.

### 5.8 07 Team + FAQ (void, ASCII-портрет)
- **Интент:** компетенции как гигантские слова + ASCII-портрет (вау-момент); FAQ ниже.
- **Энтри/скролл:** ASCII scan-in (#8) + shimmer (#9) + hover-lens (#10); имена-кнопки переключают активного (#12 padding+подсветка); FAQ reveal (#5).
- **Стейты:** имя-кнопка default/hover/active/focus; источники = drag-fill слоты (`image-slot`); FAQ-аккордеоны (#18).
- **Мобайл:** портрет сверху (canvas высота clamp), имена — вертикальный аккордеон-список, источники — горизонтальный скролл; hint доступнее; touch=lens.

### 5.9 08 Closer (cream, форма)
- **Интент:** низкий порог входа, «бриф в 2 строки», ответ <2ч.
- **Энтри:** H1 + ротатор «сегодня…» (#7, опц. scramble #23); форма reveal (#5).
- **Интеракция:** форма-стейты (§3.2): focus/error/success-карточка; submit magnetic + loading.
- **Стейты:** trust-строки (договор/NDA/<2ч).

### 5.10 Footer (void)
- **Интент:** гигантский `vvid.` + навигация/контакты.
- **Моушн:** `vvid.` параллакс (#17); опц. ASCII-логотип reveal; float-CTA авто-скрыт здесь (#19).

---

## 6. Что агентство должно сдать (deliverables)

### 6.1 Figma — дизайн-система
- **Foundations:** все токены как Figma Variables (color: light/dark + semantic; type scale; spacing 8pt; radius; shadow incl. brutal-offset; z; motion-токены в виде doc-страницы). Modes: Light/Dark, RU/EN.
- **Type styles** (3 голоса), **grid styles** (12-col + blueprint overlay), **effect styles** (brutal-shadow, soft-shadow).
- **Компоненты + варианты со ВСЕМИ стейтами** (§3): buttons/CTA, form-fields, OS-window, accordion, chips, tabs, toasts, modal, case-card, nav (desktop+mobile burger), float-pill, status-dot, cursor-HUD-спека.
- **Code Connect** маппинг компонентов на сборку (по возможности).

### 6.2 Экраны
- 8 секций × **RU/EN** × **desktop / tablet / mobile** (=минимум 48 фреймов) + ключевые стейты (hover/expanded/error/success/scene-curtain-кадр/ASCII-фазы/preloader).
- Mobile-first проверка Hero (LCP-кадр) и Cases (no-pin fallback).

### 6.3 Motion
- **Motion-prototypes** (Figma Smart Animate / video / Lottie / код-прототип) для эффектов 1–24, особенно: preloader, hero-entrance, scene-curtain (active + idle-resolve), kinetic, ASCII scan-in/lens, pinned-cases, magnetic, cursor-HUD, decode.
- **Motion-guide** (md/PDF): эта per-animation таблица как канон + easing/duration/stagger токены + reduced/calm-матрица + перф-бюджет (acceptance §4.3).

### 6.4 Ассеты
- **Hero-media:** статичный фон/градиент-арт (минимизированный hero); опц. generative seeded texture (PNG/SVG) — visibility-safe.
- **Generative:** seeded value-noise фактуры (несколько сидов) как PNG/canvas-параметры.
- **3D/Lottie:** микро-Lottie для preloader/иконок при необходимости (легковесные, reduced-aware).
- **Icons:** mono-стиль набор (24px grid), status-точки.
- **Cursors:** cursor-HUD ассеты/спека (точка+рамка+readout), fallback.
- **OG / соц:** OG-картинки RU/EN, favicon-комплект.
- **Изображения кейсов/команды:** правила кропа для `image-slot` (16:?, портрет 96×120 для ASCII-источников).

### 6.5 Документация
- Design-system docs (токены + usage + do/don't, особенно «mono только метки»).
- A11y-чеклист (WCAG 2.2 AA, focus-HUD, targets ≥24px, reduced-motion/calm).
- Hand-off-заметки по интеграции в `<x-dc>`-рантайм (структура секций, `data-*`-хуки моушна, `sc-for`-данные).

---

### Приложение A. Карта существующих moushn-функций (эталон)
`initPreloader` (#1) · *(initHero/initHeroVideo — наследие канваса/видео; в текущем минимальном Hero нет соответствующих DOM-узлов → no-op, не восстанавливать)* · `initScroll`/`applyScroll` (#3,14,16,17) · `initScenes`/`updateScenes` (#4, idle-resolve через `_scrolling`+timeout) · `initReveal` (#5) · `initKinetic` (#6) · `initWordSwap`/`makeSwap` (#7) · `initAsciiTeam`/`switchTeam`/`_teamRenderStatic` (#8,9,10) · `initMagnetic` (#11) · `initFloatCTA` (#19) · `toggleAcc`/`openFirstAcc` (#18) · `setCalm` (глобальный fallback всех слоёв).

### Приложение B. Новые компоненты для интеграции
`ScrambleText` (#23), `KineticHeadline` (#6 — уже воспроизведён инлайн), `AsciiMedia` (#8/опц. для кейс-медиа), `GenerativeField` (#24, seeded static). Все — `"use client"`-эквивалент в рантайме, IO-gated, reduced/calm-aware из коробки.
