"use client";
/**
 * AsciiMedia — ASCII/дизер-фильтр изображения или видео на <canvas>.
 * Главный эффект с референса: контент рассыпается в сетку цветных символов,
 * растворение управляется скроллом.
 *
 * Next.js 14 App Router + TypeScript. Это КЛИЕНТСКИЙ компонент:
 *  - вся работа в useEffect (на сервере window нет — SSR-safe);
 *  - rAF и листенеры корректно чистятся при размонтировании;
 *  - уважает prefers-reduced-motion.
 *
 * Использование:
 *   <AsciiMedia src="/hero.jpg" />
 *   <AsciiMedia src="/reel.mp4" type="video" cell={7} color />
 *   <AsciiMedia src="/hero.jpg" dissolveOnScroll={false} />   // статичный ASCII
 */
import { useEffect, useRef } from "react";

type Props = {
  src: string;
  /** image | video. Если не задано — определяется по расширению. */
  type?: "image" | "video";
  /** размер ячейки в px (меньше = детальнее и тяжелее). По умолчанию 8. */
  cell?: number;
  /** красить символы цветом исходного пикселя (true) или монохром (false). */
  color?: boolean;
  /** рампа яркости тёмный→светлый. Замени на " ..::34RT#@" для «цифрового» вида. */
  ramp?: string;
  /** растворять по скроллу. false = всегда полный ASCII. */
  dissolveOnScroll?: boolean;
  /** css aspect-ratio контейнера, напр. "16 / 8". */
  aspectRatio?: string;
  className?: string;
};

export default function AsciiMedia({
  src,
  type,
  cell = 8,
  color = true,
  ramp = " .,:;i1tfLCG08@",
  dissolveOnScroll = true,
  aspectRatio = "16 / 8",
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isVideo =
      type === "video" || (!type && /\.(mp4|webm|mov|m4v)$/i.test(src));

    // скрытый буфер для семплинга (в памяти, не в DOM)
    const sampler = document.createElement("canvas");
    const sctx = sampler.getContext("2d", { willReadFrequently: true })!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cols = 0, rows = 0, W = 0, H = 0;
    let dissolve = dissolveOnScroll ? 0 : 1;
    let raf = 0;
    let ready = false;

    // ---- источник: <img> или <video> ----
    let media: HTMLImageElement | HTMLVideoElement;
    if (isVideo) {
      const v = document.createElement("video");
      v.src = src;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = true;
      v.crossOrigin = "anonymous";
      v.addEventListener("loadeddata", () => { ready = true; v.play().catch(() => {}); });
      media = v;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.addEventListener("load", () => { ready = true; });
      media = img;
    }

    const mono =
      getComputedStyle(document.body).getPropertyValue("font-family") ||
      "monospace";

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = Math.round(r.width);
      H = Math.round(r.height);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(1, Math.floor(W / cell));
      rows = Math.max(1, Math.floor(H / cell));
      sampler.width = cols;
      sampler.height = rows;
    }

    function drawSampler() {
      // вписываем медиа в сетку (cover)
      const mw = isVideo
        ? (media as HTMLVideoElement).videoWidth
        : (media as HTMLImageElement).naturalWidth;
      const mh = isVideo
        ? (media as HTMLVideoElement).videoHeight
        : (media as HTMLImageElement).naturalHeight;
      if (!mw || !mh) return;
      const ir = mw / mh, cr = cols / rows;
      let dw = cols, dh = rows, dx = 0, dy = 0;
      if (ir > cr) { dw = rows * ir; dx = (cols - dw) / 2; }
      else { dh = cols / ir; dy = (rows - dh) / 2; }
      sctx.drawImage(media, dx, dy, dw, dh);
    }

    function render() {
      if (ready) drawSampler();
      const data = sctx.getImageData(0, 0, cols, rows).data;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${cell}px ${mono}`;
      ctx.textBaseline = "top";

      for (let y = 0; y < rows; y++) {
        const yNorm = y / rows;
        const chance = dissolve * 1.35 - (1 - yNorm); // низ рассыпается раньше
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const noise = ((x * 7 + y * 13) % 17) / 17;
          const px = x * cell, py = y * cell;

          if (chance > noise) {
            const ch = ramp[Math.min(ramp.length - 1, Math.floor(lum * ramp.length))];
            if (ch === " ") continue;
            ctx.fillStyle = color
              ? `rgb(${r},${g},${b})`
              : `rgba(242,242,240,${0.25 + lum * 0.75})`;
            ctx.fillText(ch, px, py);
          } else {
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(px, py, cell, cell);
          }
        }
      }
    }

    function updateDissolve() {
      if (!dissolveOnScroll) return;
      const r = wrap.getBoundingClientRect();
      const p = (window.innerHeight * 0.55 - r.top) / (r.height * 0.9);
      dissolve = Math.max(0, Math.min(1, p));
    }

    function loop() {
      render();
      raf = requestAnimationFrame(loop);
    }

    resize();
    updateDissolve();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener("scroll", updateDissolve, { passive: true });

    if (reduce) {
      // без анимации: один кадр после загрузки
      dissolve = 1;
      const once = () => { if (ready) render(); else requestAnimationFrame(once); };
      once();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", updateDissolve);
      if (isVideo) (media as HTMLVideoElement).pause();
    };
  }, [src, type, cell, color, ramp, dissolveOnScroll]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ position: "relative", width: "100%", aspectRatio, background: "#000", overflow: "hidden" }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
