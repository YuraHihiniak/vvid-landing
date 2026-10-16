import type { CSSProperties, ElementType } from 'react'

export type TintName = 'cool' | 'gold' | 'custom'

export interface TintSpec {
  /** base colour of the metal — a near-white keeps the reflections honest */
  base: string
  /** colour of the big white highlights: a touch cold or a touch warm */
  highlight: string
  /** [left, right] coloured walls of the studio — this is where the tint lives */
  accents: [string, string]
  /** soft light spot behind the letters */
  glow: string
  /** CSS fallback: bands of the chrome gradient, light → dark, and the extrusion shadow */
  css: { light: string; mid: string; dark: string; shadow: string }
}

export const TINTS: Record<Exclude<TintName, 'custom'>, TintSpec> = {
  cool: {
    base: '#f3f6ff',
    highlight: '#eef3ff',
    accents: ['#4f93ff', '#a56bff'],
    glow: '#5b6cff',
    css: { light: '#ffffff', mid: '#c4cee6', dark: '#2d3550', shadow: '#070912' },
  },
  gold: {
    base: '#ffe6bd',
    highlight: '#fff0d2',
    accents: ['#ffb24a', '#ff6a3d'],
    glow: '#ff9a3a',
    css: { light: '#fff7e3', mid: '#e9b45f', dark: '#5a3610', shadow: '#150c02' },
  },
}

export interface GeometryOptions {
  /** extrusion depth, in em of the font size */
  depth: number
  /** how far the bevel reaches across the face of the letter */
  bevelSize: number
  /** how far the bevel bulges out of the face */
  bevelThickness: number
  /** negative = bevel eats into the glyph instead of fattening it; -bevelSize keeps the outline exactly */
  bevelOffset: number
  bevelSegments: number
  curveSegments: number
  /** extra tracking, in em */
  letterSpacing: number
  /** baseline-to-baseline distance for a wrapped title, in cap heights */
  lineHeight: number
  roughness: number
}

export const DEFAULT_GEOMETRY: GeometryOptions = {
  depth: 0.3,
  bevelSize: 0.1,
  bevelThickness: 0.13,
  bevelOffset: -0.06,
  bevelSegments: 14,
  curveSegments: 24,
  letterSpacing: 0.02,
  lineHeight: 1.45,
  roughness: 0.05,
}

/** on `pointer: coarse` — same bevel, fewer segments, so the letters build in half the time */
export const TOUCH_GEOMETRY: Partial<GeometryOptions> = {
  bevelSegments: 12,
  curveSegments: 14,
}

export type FallbackReason =
  | 'forced'
  | 'ssr'
  | 'no-webgl'
  | 'software-renderer'
  | 'webgl-error'
  | 'save-data'
  | 'low-memory'
  | 'few-cores'
  | 'low-fps'
  | 'context-lost'
  | 'scene-error'

export type RenderMode = 'webgl' | 'css'

export interface ChromeTitleProps {
  /** the title; `\n` forces a line break, otherwise it wraps to two lines on its own when it would get too small */
  text: string
  /** three.js typeface.json (see README for converting a font with Cyrillic) */
  fontUrl?: string
  /** CSS font-family of the same face, for the fallback and the first paint; the page declares the @font-face */
  fontFamily?: string
  tint?: TintName
  /** overrides for `tint="custom"` (or on top of a named tint) */
  customTint?: Partial<TintSpec>
  /** follow the cursor; idle sway stays on either way */
  interactive?: boolean
  /** share of the container width the title fills, 0..1 */
  size?: number
  /** below this single-line font size (px) the title wraps to two lines */
  minFontPx?: number
  /** `auto` probes WebGL and the device; `css` and `webgl` force a side */
  mode?: 'auto' | RenderMode
  /** `left` sets the lines flush with the left edge of the box, for a hero with left-aligned copy */
  align?: 'center' | 'left'
  /** stop the render loop (e.g. while a scroll film plays over the hero); the picture freezes */
  paused?: boolean
  /** contact shadow under the letters, 0..1; lighter backgrounds want less */
  shadowOpacity?: number
  /** colour the metal shifts toward while the pointer is over the title (CSS fallback gets a matching overlay) */
  hoverTint?: string
  /** every `\n`-separated line fills the full width on its own, so a short line gets bigger letters */
  fitLines?: boolean
  /** the slow idle rocking; off → the title sits still (only the hover tint moves) */
  sway?: boolean
  /** optional equirectangular .hdr; replaces the built-in Lightformer studio */
  environmentUrl?: string
  geometry?: Partial<GeometryOptions>
  /** element for the real text; keep h1 for a hero */
  as?: ElementType
  className?: string
  style?: CSSProperties
  onModeChange?: (mode: RenderMode, reason?: FallbackReason) => void
}
