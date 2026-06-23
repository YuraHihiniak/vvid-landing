"use client";
/**
 * ScrambleText — текст «декодируется» из случайных символов в финальные слова.
 * Запускается, когда элемент попадает во вьюпорт.
 *
 * Использование:
 *   <ScrambleText text="We shoot." as="span" className="text-5xl font-black" />
 *   <ScrambleText text="Центр мебели и света" />
 */
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  /** какой тег рендерить (span/h1/h2/p...). По умолчанию span. */
  as?: keyof JSX.IntrinsicElements;
  /** запускать каждый раз при входе во вьюпорт (true) или один раз (false). */
  repeat?: boolean;
  /** набор «мусорных» символов. */
  glyphs?: string;
  className?: string;
};

export default function ScrambleText({
  text,
  as = "span",
  repeat = false,
  glyphs = "!<>-_\\/[]{}=+*^?#________",
  className = "",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [out, setOut] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setOut(text); return; }

    let raf = 0;
    let frame = 0;
    let running = false;
    type Q = { from: string; to: string; start: number; end: number; ch: string };
    let queue: Q[] = [];

    function tick() {
      let html = "";
      let done = 0;
      for (const q of queue) {
        if (frame >= q.end) { done++; html += q.to; }
        else if (frame >= q.start) {
          if (!q.ch || Math.random() < 0.28)
            q.ch = glyphs[Math.floor(Math.random() * glyphs.length)];
          html += `<span data-scramble>${q.ch}</span>`;
        } else html += q.from;
      }
      if (el) el.innerHTML = html;
      if (done < queue.length) { frame++; raf = requestAnimationFrame(tick); }
      else { if (el) el.textContent = text; running = false; }
    }

    function run() {
      if (running) return;
      running = true;
      const old = el!.textContent || "";
      queue = [];
      for (let i = 0; i < text.length; i++) {
        const start = Math.floor(Math.random() * 30);
        const end = start + Math.floor(Math.random() * 30) + 10;
        queue.push({ from: old[i] || "", to: text[i], start, end, ch: "" });
      }
      frame = 0;
      cancelAnimationFrame(raf);
      tick();
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { run(); if (!repeat) io.unobserve(e.target); }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [text, repeat, glyphs]);

  const Tag = as as any;
  return <Tag ref={ref} className={className}>{out}</Tag>;
}

/* Подсветку «мусорных» символов задай в globals.css:
   [data-scramble]{ color: var(--accent, #ff5b2e); }            */
