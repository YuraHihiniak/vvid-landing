# design-sync notes — VVID

## Repo shape (important)
`vvid-landing` is **not** a component library. It's a self-contained single-page
"Design Composition": `VVID.dc.html` is the whole landing, rendered by a homegrown
runtime `support.js` ("dc-runtime") that injects React 18.3.1 + ReactDOM +
@babel/standalone from unpkg.com at runtime and transpiles inline JSX. The landing's
logic is **one imperative `class Component extends DCLogic`** (DOM/canvas/Three.js
animations), not a tree of reusable React components. So the design-sync converter has
nothing to compile/bundle.

Decision (user, 2026-07-01): sync a **brand bundle** — tokens + fonts + motion +
conventions — so the Claude Design agent builds on-brand VVID work. Not reimplementing
the landing into React (explicitly rejected: would violate "ship what they built").

## Sources of truth
- `VVID.dc.html` `<style>` block (lines 44–178) + inline styles — live CSS.
- `STYLE-MOTION-BRIEF.md` — comprehensive human brand spec (palette HEX, type scale,
  motion language, easings/timings). Cross-checked against the live CSS.
- Fonts are **Google Fonts** (Golos Text, IBM Plex Mono, Unbounded), loaded via
  `<link>` in the site and via `@import` in `ds-bundle/styles.css`. No local font files.

## Build / verify
- Bundle is **hand-authored** into `ds-bundle/` (off-script — no converter run).
- Preview cards verified by rendering: `.claude/launch.json` has a `ds-bundle` server
  (`python3 -m http.server 4178 --directory ds-bundle`). All 4 Foundations cards render
  with fonts + tokens resolved, no console errors.
- Conventions doc validated: all 49 named tokens/classes grep-verified in built artifacts.

## Upload (BLOCKED in this environment)
DesignSync needs design-system authorization; `/design-login` requires an interactive
terminal, unavailable here. The bundle is fully prepared in `ds-bundle/`. To push:
re-run `/design-sync` from an interactive `claude` terminal (it'll find this config and
upload), or use Claude Design's "Send to Claude Code Web". No project created yet, so
no `projectId` pin — first interactive run creates the "VVID" project.
