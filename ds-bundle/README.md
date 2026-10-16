# VVID — building on-brand

VVID is **warm techno-brutalism**: calm, expensive, engineered. Dark and light surfaces alternate, corners are sharp, structure is drawn with 1px hairlines (not shadow), labels are monospaced, and there is exactly **one warm accent — terracotta `#b9543f` — used at most once per screen** (the thing to look at). Motion settles, never bounces.

## Setup — one stylesheet, no provider

There is no React runtime to wrap. Link the design system's root stylesheet and everything resolves through its `@import` closure (Google Fonts + all tokens):

```html
<link rel="stylesheet" href="_ds/vvid/styles.css">
```

After that, style with the CSS custom properties below — **do not invent hex values, font names, or easings; use the tokens.** The default surface is cream `var(--vv-cream)` with ink text; dark sections set `background: var(--vv-void); color: var(--vv-cream)`.

## The idiom — CSS custom properties (`var(--vv-*)`)

This is a **token system**, not a class framework. Reach for these names:

**Color** — surfaces `--vv-void` `--vv-void-2` `--vv-ink` (dark), `--vv-cream` `--vv-paper-2` (light); accent `--vv-accent` / `--vv-accent-hover` / `--vv-accent-press`; text on dark `--vv-body-dark` `--vv-muted-dark`; text on light `--vv-body-light` `--vv-muted-light`; hairlines `--vv-line-on-dark` `--vv-line-on-dark-strong` `--vv-line-on-light` `--vv-line-on-light-strong`.

**Type** — families `--vv-font-display` (Unbounded — giant headlines/watermarks ONLY), `--vv-font-text` (Golos Text — H1–H3, leads, body), `--vv-font-mono` (IBM Plex Mono — labels, nav, prices, metrics, counters; never prose). Sizes `--vv-text-hero` `--vv-text-h2` `--vv-text-h3` `--vv-text-lead` `--vv-text-body` `--vv-text-label` `--vv-text-metric`. Tracking `--vv-tracking-display` (tight, negative) and `--vv-tracking-label` (open, positive, for UPPERCASE mono labels).

**Layout/form** — `--vv-section-pad` (vertical rhythm), `--vv-gutter` (26px), `--vv-container-text` (1100) / `--vv-container-wide` (1320), `--vv-header-height` (62). Shape: `--vv-radius` is **0** (sharp); only `--vv-radius-pill` (50px) and `--vv-radius-dot` round. Shadow is `--vv-shadow-none` almost everywhere; `--vv-shadow-float` is the single exception (floating button).

**Motion** — easings `--vv-ease-expo` `cubic-bezier(.16,1,.3,1)` (main: hovers, kinetic text, chevrons), `--vv-ease-reveal` `cubic-bezier(.22,1,.36,1)` (scroll-in reveals), `--vv-ease-drift` (background), curtain `--vv-ease-curtain`; marquees use `linear`. Animate **only transform & opacity**. NO bounce/elastic/overshoot/springs. One moving focus per screen. Every animation needs a `@media (prefers-reduced-motion: reduce)` static fallback — this is a rule, not an option.

Optional text helpers exist for convenience: `.vv-display`, `.vv-label`, `.vv-metric` (the tokens above are the source of truth).

## Where the truth lives

Read `_ds/vvid/styles.css` and `_ds/vvid/tokens/{colors,typography,spacing,motion}.css` before styling. The `Foundations` preview cards (Colors, Typography, Motion, Form & Layout) show every token in use.

## One idiomatic snippet

```html
<section style="background:var(--vv-void);color:var(--vv-cream);padding:var(--vv-section-pad) var(--vv-gutter)">
  <p style="font-family:var(--vv-font-mono);font-size:var(--vv-text-label);
            text-transform:uppercase;letter-spacing:var(--vv-tracking-label);
            color:var(--vv-muted-dark)">fig.02 · what we do</p>
  <h2 style="font-family:var(--vv-font-display);font-weight:800;text-transform:uppercase;
             letter-spacing:var(--vv-tracking-display);line-height:var(--vv-lh-hero);
             font-size:var(--vv-text-h2)">Build it <span style="color:var(--vv-accent)">right</span></h2>
  <a style="display:inline-flex;gap:13px;border:1.5px solid var(--vv-line-on-dark-strong);
            border-radius:var(--vv-radius-pill);padding:15px 28px;font-family:var(--vv-font-mono);
            font-size:13px;text-transform:uppercase;letter-spacing:.1em;
            transition:color var(--vv-dur-hover) var(--vv-ease-expo)">View work →</a>
</section>
```

Lowercase copy, short and concrete, open pricing, founder-led tone. Bilingual RU/EN.

---

## What's in this design system

A **brand foundation** for VVID — tokens, fonts, and the motion language extracted from the live site (`VVID.dc.html`) and `STYLE-MOTION-BRIEF.md`. There are no compiled React components: the source site is an imperative single-page composition, so this bundle ships the design *language* (colors, type, spacing, hairlines, motion) rather than a component library.

### Foundations
- **Colors** — full palette (surfaces, accent, text, hairlines) with roles and HEX.
- **Typography** — the three voices (Unbounded / Golos Text / IBM Plex Mono) and the fluid type scale.
- **Motion** — signature easings (expo-out), reference timings, and the DO/DON'T rules.
- **Form & Layout** — sharp rectangles, radius 0, pills, hairline fields, section rhythm, containers.

### Files
- `styles.css` — root stylesheet; `@import`s Google Fonts + all token files.
- `tokens/{colors,typography,spacing,motion}.css` — the `--vv-*` custom properties.
- `components/Foundations/*/` — preview cards (each links `styles.css`).
