# VVID — текст сайта, v2 (короткая редакция)

Это то, что стоит в `VVID.dc.html` после переноса (словари `T` и `D`, мета, JSON-LD). Предыдущие версии: `VVID.site-content.orig.md` (выгрузка до правок). Строчные буквы и «·» в коротких строках сохранены.

**Что сделано при переносе:**
- Удалены из словарей и шаблона: heroSub, heroProof, heroProof1–3, capabilities[].desc, pricing[].desc, мостики между секциями, хвосты кикеров, бейджи брифа, сноска прайса (заменена строкой гарантии), юр. строка и слоган футера, подпись под CTA в hero, строка процесса под услугами.
- Манифест: абзац и mono-подпись заменены одной строкой тем же кеглем, что пункты карточек (`.ds-line`). Proof-строка: четыре пункта без подписей, сетка 2×2.
- Карточки услуг и прайса: заголовок · строка спеков/пунктов · цена. Ничего мелким кеглем, кроме согласия под формой и копирайта.
- FAQ: 8 вопросов, якоря `faq-pay`, `faq-code`, `faq-privacy` сохранены. JSON-LD FAQPage перегенерирован.
- Ссылка «как храним данные» переехала из юр. строки футера в колонку «сайт».

---

## 0. Мета / SEO

| Поле | RU | EN |
|---|---|---|
| `<title>` | VVID — приложения, сайты и телеграм-боты. Цены на сайте | VVID — apps, websites & telegram bots. Prices on the site |
| description | Делаем приложения, интернет-магазины, сайты и телеграм-ботов под ваш бизнес. Цены открыты: бот от 20 000 ₽, магазин от 140 000 ₽. Договор, гарантия после запуска. | Apps, online stores, websites and telegram bots for your business. Open prices: a bot from $250, a store from $1,500. Contract, post-launch guarantee. |
| keywords | без изменений | — |
| geo.placename | Минск · Россия · Беларусь · Казахстан | — |
| og:title / twitter:title | VVID — приложения, сайты и боты для бизнеса. Цены открыты | — |
| og:description | Убираем ручную работу из заявок, склада, оплат и отчётов. Цены на сайте, договор, код остаётся вам. | — |
| twitter:description | Приложения, сайты и телеграм-боты для бизнеса. Цены открыты, договор, гарантия. | — |
| og:image:alt | VVID — разработка и автоматизация | — |
| og:url | https://vvid.solutions/ | — |

**Schema.org (JSON-LD):** Organization description → «Приложения, интернет-магазины, сайты и телеграм-боты для бизнеса. Интеграции с 1с и crm.», slogan → «Приложения, сайты и боты для бизнеса». Offers без изменений. FAQPage — 8 вопросов из раздела 10 (RU).

---

## 1. Прелоадер

| Элемент | RU | EN |
|---|---|---|
| Строка 1 | vvid — приложения · сайты · телеграм-боты | vvid — apps · websites · telegram bots |
| Метка языка | ru | en |
| Колонка 2 | studio / разработка · автоматизация | studio / development · automation |

---

## 2. Шапка / навигация

| Элемент | RU | EN |
|---|---|---|
| Лого | vvid | vvid |
| Кнопка брифа | оставить бриф → | leave a brief → |
| Кнопка меню | меню | menu |
| Навигация | услуги · кейсы · прайс · бриф · вопросы | services · work · pricing · brief · faq |
| Telegram в панели | telegram @vvid ↗ | telegram @vvid ↗ |

---

## 3. Hero

**Белая полоса (SVG):** МЫ · VVID / WE ARE · VVID
**H1 (скрытый, aria):** vvid — приложения, сайты и телеграм-боты для бизнеса / vvid — apps, websites and telegram bots for business

**Бегущая строка:**
- RU: приложения // интернет-магазины // сайты // телеграм-боты // интеграции с 1с и crm
- EN: apps // online stores // websites // telegram bots // 1c & crm integrations

- **CTA:** написать в telegram / message us on telegram
- **Скролл-подсказка:** scroll

### Фильм

Ключи кадров (мелкая mono-строка над текстом) убраны, у финала ключ «vvid.».

| Кадр | RU | EN |
|---|---|---|
| 1 | сначала смотрим, как у вас всё устроено. потом называем цену и срок. | first we look at how things work on your side. then we name the price and the deadline. |
| 2 | каждые две недели показываем, что готово | every two weeks we show you what’s done |
| 3 | запускаем. 50 дней после запуска правим бесплатно | we launch. 50 days after that we fix things for free |
| Финал | vvid. — напишите, обсудим вашу задачу | vvid. — write to us, let’s talk about your task |
| CTA | написать в telegram | message us on telegram |

---

## 4. Rail

Подпись «глубина / depth», якорь «бриф ↓», пункты: старт · 01 кто мы · 02 что делаем · 03 кейсы · 04 прайс · 05 бриф · вопросы — без изменений.

**Кикеры секций:** 01 — кто мы · 02 — что делаем · 03 — кейсы · 04 — прайс · 05 — бриф / 01 — who we are · 02 — what we do · 03 — work · 04 — pricing · 05 — brief

Мостики между секциями удалены.

---

## 5. Манифест (01 — кто мы)

**H2 RU:** снимаем ваш бизнес с ручного привода
**H2 EN:** orders in chats, stock in excel, reports done by hand. we automate that.

**Строка под H2:** общаетесь напрямую с теми, кто делает проект. / you talk directly to the people doing the work.

**Proof-строка (2×2, без подписей):**

| RU | EN | ссылка |
|---|---|---|
| цены открыты | prices are open | #pricing |
| договор и nda | contract & nda | #faq |
| код остаётся вам | you own the code | #faq-code |
| ответ в telegram за 2 часа | telegram reply within 2 hours | https://t.me/vvid |

---

## 6. Услуги (02 — что делаем)

**H2 RU:** делаем то, что не собрать на конструкторе.
**H2 EN:** we build what a site builder can’t.

Карточка = заголовок · строка спеков · цена. Каждая — ссылка на #brief.

| № | RU | цена RU | EN | цена EN |
|---|---|---|---|---|
| 01 | приложения — web · mobile · crm · кабинеты | от 700 000 ₽ | apps — web · mobile · crm · portals | from $8,000 |
| 02 | сайты и интернет-магазины — лендинг · магазин · оплаты · 1с | от 30 000 ₽ | websites & online stores — landing · store · payments · 1c | from $350 |
| 03 | дизайн — figma · прототипы · ui-kit | по задаче | design — figma · prototypes · ui kit | per project |
| 04 | телеграм-боты — заявки · записи · оплаты · mini apps | от 20 000 ₽ | telegram bots — leads · bookings · payments · mini apps | from $250 |
| 05 | интеграции и доработки — 1с · crm · оплаты · api | по задаче | integrations & fixes — 1c · crm · payments · api | per project |

---

## 7. Кейсы (03 — кейсы)

**H2:** что уже сделали / what we’ve built

| № | Название | Тип RU | Тип EN | Факты RU | Факты EN | Ссылка RU | Ссылка EN |
|---|---|---|---|---|---|---|---|
| 01 | ВМЕСТО / VMESTO · в разработке | приложение для поиска событий | an event discovery app | ios · минск | ios · minsk | покажем на созвоне ↗ (t.me/vvid) | we’ll show it on a call ↗ |
| 02 | Центр мебели и света / Furniture & Light Center · в проде | интернет-магазин мебели и света | furniture & lighting store | каталог · корзина · доставка | catalog · cart · delivery | открыть сайт ↗ (mebel-novomih.ru) | open the site ↗ |
| 03 | Vitrina · в проде | сервис карточек для wb и ozon | product cards for wb & ozon | фото → карточка · подписка | photo → card · subscription | демо по запросу → (#brief) | demo on request → |
| 04 | 1kik · в проде | интернет-магазин компьютеров | computer store | каталог · корзина · рассрочка | catalog · cart · installments | открыть сайт ↗ (1kik.by) | open the site ↗ |

---

## 8. Прайс (04 — прайс)

**H2:** сколько стоит / what it costs

| № | Пакет RU | Пакет EN | Пункты RU | Пункты EN |
|---|---|---|---|---|
| 01 | бот или лендинг · от 20 000 ₽ | bot or landing · from $250 | бот от 20 000 ₽ · лендинг от 30 000 ₽ · цена фиксируется до старта | bot from $250 · landing from $350 · price fixed before we start |
| 02 | сайт или магазин под ключ · от 140 000 ₽ | turnkey site or store · from $1,500 | дизайн, разработка, запуск · оплаты, доставка, 1с · админка | design, build, launch · payments, delivery, 1c · admin panel |
| 03 | приложение · от 700 000 ₽ | app · from $8,000 | начинаем с mvp · crm, кабинеты, внутренние системы · оплата по этапам | we start with an mvp · crm, portals, internal systems · pay by stage |

**Строка под пакетами (тем же кеглем, что пункты):** на всё гарантия 50 дней после запуска. / everything comes with a 50-day guarantee after launch.

---

## 9. Бриф (05 — форма)

**H2:** давайте работать. / let’s work.
**Строка под H2:** опишите задачу в двух словах. в рабочее время отвечаем за 2 часа. / describe the task in a couple of words. in work hours we reply within 2 hours.

| Элемент | RU | EN |
|---|---|---|
| Поле 1 — лейбл | 01 / задача | 01 / task |
| Поле 1 — placeholder | что нужно сделать? | what needs doing? |
| Поле 2 — лейбл | 02 / контакт | 02 / contact |
| Поле 2 — placeholder | telegram или почта | telegram or email |
| Кнопка | отправить → | send → |
| Альтернатива | или сразу в telegram ↗ | or straight to telegram ↗ |
| Согласие | отправляя, вы разрешаете использовать контакт, чтобы вам ответить. | by sending you let us use your contact to reply. |
| Ссылка в согласии | как храним данные (→ #faq-privacy) | how we handle data |

**Состояния:**

| Ситуация | RU | EN |
|---|---|---|
| Контакт пустой / невалидный | укажите telegram, телефон или почту | leave a telegram, phone or email |
| Кнопка после отправки | готово → открываем telegram ↗ (fallback: готово ✓) | done → opening telegram ↗ |
| Если telegram не открылся | если telegram не открылся, текст уже скопирован. вставьте его в чат: | if telegram didn’t open, the text is already copied. paste it into the chat: |
| Ссылка | открыть @vvid ↗ | open @vvid ↗ |
| Ссылка | или письмом | or by email |
| Тема письма | бриф с vvid.solutions | brief from vvid.solutions |

---

## 10. FAQ

**Метка:** faq · **H2:** что обычно спрашивают / what people usually ask

### RU
1. **почему цены на сайте?** — чтобы вы сразу поняли, подходит ли бюджет. точную сумму называем после разбора и фиксируем до старта.
2. **зачем вы, если есть конструкторы?** — если нужна визитка, берите конструктор, выйдет дешевле. мы нужны, когда есть своя логика: 1с, оплаты, кабинет клиента, crm под ваш процесс.
3. **есть договор?** *(faq-pay)* — да, с юрлицом. nda по запросу. счёт в рублях или долларах, платите по этапам, всю сумму вперёд не просим.
4. **у нас уже есть сайт и 1с. всё переделывать?** — нет. обычно дешевле подключиться к тому, что есть. что оставить, а что менять, скажем на разборе.
5. **сколько займёт?** — зависит от объёма. срок фиксируем до старта вместе с ценой. каждые две недели показываем, что готово.
6. **приложение от 700 000 ₽ — дорого. можно меньше?** — можно. начинаем с mvp, с той части, которая уже снимает рутину. или с бота от 20 000 ₽, чтобы посмотреть, как мы работаем.
7. **кому принадлежит код?** *(faq-code)* — вам. после запуска отдаём репозиторий, сервера и доступы. продолжать можете с любой командой.
8. **что с моими контактами?** *(faq-privacy)* — только отвечаем. никому не передаём, рассылок не шлём.

**Под списком RU:** не нашли ответ? написать в telegram ↗

### EN
1. **why are the prices on the site?** — so you can tell right away if the budget fits. we name the exact amount after discovery and fix it before we start.
2. **why you, if there are site builders?** — if you need a brochure site, use a builder, it’s cheaper. you need us when there’s your own logic: 1c, payments, a customer portal, a crm built around your process.
3. **is there a contract?** — yes, with a legal entity. nda on request. we invoice in rubles or dollars, you pay by stage, never the full amount up front.
4. **we already have a site and 1c. do you rebuild everything?** — no. it’s usually cheaper to connect to what you have. what stays and what changes, we tell you at discovery.
5. **how long does it take?** — depends on the scope. we fix the deadline before we start, together with the price. every two weeks we show you what’s done.
6. **an app from $8,000 is a lot. can we start smaller?** — yes. we start with an mvp, the part that already removes the routine. or with a bot from $250, to see how we work.
7. **who owns the code?** — you do. after launch we hand over the repo, servers and access. carry on with any team.
8. **what happens to my contact details?** — we only reply. we don’t share them and we don’t send mailings.

**Под списком EN:** didn’t find your answer? message us on telegram ↗

---

## 11. Футер

| Элемент | RU | EN |
|---|---|---|
| Описание | приложения, сайты и телеграм-боты для бизнеса. минск, работаем по снг. | apps, websites and telegram bots for business. minsk, working across cis. |
| Кнопка | написать в telegram | message us on telegram |
| Колонка «сайт» | сайт: услуги · кейсы · прайс · бриф · вопросы · как храним данные | site: services · work · pricing · brief · faq · how we handle data |
| Колонка «контакт» | контакт: telegram @vvid · info@vvid.dev · ru / en | contact: telegram @vvid · info@vvid.dev · ru / en |
| Wordmark | vvid. | vvid. |
| Копирайт | © 2026 vvid | © 2026 vvid |

---

## 12. Прочие UI-подписи

| Элемент | RU | EN |
|---|---|---|
| Плавающая кнопка telegram | написать в telegram | message us on telegram |
| Rail (aria-label) | главы | chapters |
| Переключатель анимации (в разметке не выводится) | анимация · вкл / выкл | motion · on / off |
| Строки фильма, не выводятся | пропустить фильм ↓ · оставить бриф | skip the film ↓ · leave a brief |
