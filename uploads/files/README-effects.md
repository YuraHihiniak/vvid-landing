# Внедрение эффектов в проект (Next.js 14 App Router)

Три компонента под твой стек (Next.js 14 + TS + Tailwind + Framer Motion):

| Файл | Эффект |
|------|--------|
| `AsciiMedia.tsx` | ASCII/дизер-фильтр картинки или видео + растворение по скроллу |
| `ScrambleText.tsx` | «Декодирование» текста при появлении во вьюпорте |
| `KineticHeadline.tsx` | Кинетический заголовок (на Framer Motion) |

---

## 1. Куда положить

```
src/
  components/
    effects/
      AsciiMedia.tsx
      ScrambleText.tsx
      KineticHeadline.tsx
```

Все три уже содержат `"use client"` — это обязательно: они работают с `window`,
`canvas`, `requestAnimationFrame`, которых нет при серверном рендере.

## 2. Зависимости

Ничего ставить не нужно. `framer-motion` у тебя уже есть, остальное — нативный
Canvas API. Если `framer-motion` вдруг не установлен:

```bash
npm i framer-motion
```

## 3. Подключение на странице

В App Router server-компонент (`page.tsx`) может импортировать клиентские
компоненты напрямую — Next сам проведёт границу:

```tsx
// app/(public)/page.tsx
import AsciiMedia from "@/components/effects/AsciiMedia";
import ScrambleText from "@/components/effects/ScrambleText";
import KineticHeadline from "@/components/effects/KineticHeadline";

export default function Home() {
  return (
    <main>
      <section className="px-6 py-24">
        <KineticHeadline
          words={["Центр", "мебели", { t: "и света", thin: true }]}
          className="text-6xl md:text-8xl font-black uppercase tracking-tight"
        />

        {/* положи свой файл в /public */}
        <AsciiMedia src="/hero.jpg" className="mt-10" cell={8} />
      </section>

      <section className="px-6 py-24">
        <ScrambleText
          text="Доставка по Туапсинскому району"
          as="h2"
          className="text-4xl font-black uppercase"
        />
      </section>
    </main>
  );
}
```

## 4. Картинка/видео

`src` указывает на файл в `/public` (`/hero.jpg`, `/reel.mp4`) или абсолютный URL.
Для внешних URL нужен CORS (`crossOrigin="anonymous"` уже выставлен) — иначе
`getImageData` упадёт с tainted-canvas. Свои файлы из `/public` всегда безопасны.

Видео:
```tsx
<AsciiMedia src="/reel.mp4" type="video" cell={7} />
```

## 5. Цвет «мусорных» символов в scramble

В `globals.css`:
```css
[data-scramble]{ color: #E8B800; } /* твой --y, жёлтый акцент */
```

## 6. Производительность

- `cell` — главный рычаг. 8px — баланс. 5–6px заметно тяжелее, 10–12px легче.
- Эффект работает в `requestAnimationFrame` и сам останавливается при размонтировании.
- При `prefers-reduced-motion` ASCII рисует один статичный кадр, scramble отключается,
  заголовок появляется без анимации — доступность из коробки.
- На мобильных лучше ставить `cell={10}` и подумать, нужен ли ASCII на видео (тяжело).

---

## Важное замечание по стилю

Твой сайт — светлый, «тёплый» магазин мебели (Cormorant + Inter, бежевая палитра,
жёлтый акцент). ASCII-дизер — приём из тёмной техно/брутал-эстетики студийных сайтов.
В лоб он может выбиться из дизайна.

Варианты, как вписать аккуратно:
- **Точечно**: ASCII только на одной hero-картинке или на промо-баннере акции —
  как «вау-момент», а не сквозной стиль.
- **Перекрасить рампу**: `ramp=" ..::oO0@"` + `color={false}` даёт мягкий
  монохром-дизер вместо «цифрового хакерского» вида.
- **Scramble и KineticHeadline** в твою палитру ложатся легко — они нейтральны
  по стилю, только подбери шрифт/цвет через className.

Если хочешь — соберу версию ASCII-фильтра, перекрашенную под твою бежево-жёлтую
тему, или вынесу всё в один npm-пакетоподобный модуль с барелл-экспортом.
