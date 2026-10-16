/** Line breaking and measuring shared by the 3D scene and the CSS fallback. */

export interface TypefaceGlyph {
  ha: number
  o: string
  x_min?: number
  x_max?: number
}

export interface TypefaceData {
  glyphs: Record<string, TypefaceGlyph>
  resolution: number
  ascender: number
  descender: number
  boundingBox: { yMin: number; yMax: number; xMin?: number; xMax?: number }
}

/** width of a string in em (font size 1) */
export type MeasureEm = (s: string) => number

export interface LineLayout {
  lines: string[]
  widths: number[]
  maxWidth: number
}

/** Measure with the glyph advances of a typeface.json — what TextGeometry will actually lay out. */
export function measureFromTypeface(data: TypefaceData, letterSpacingEm = 0): MeasureEm {
  const res = data.resolution
  const fallback = data.glyphs['?']
  return (s) => {
    let x = 0
    let left = 0
    let right = 0
    let i = 0
    for (const ch of s) {
      const g = data.glyphs[ch] ?? fallback
      const ha = g ? g.ha : res * 0.5
      if (i === 0) left = g?.x_min ?? 0
      right = x + (g?.x_max ?? ha)
      x += ha + letterSpacingEm * res
      i++
    }
    return Math.max(0, right - left) / res
  }
}

/** Height of a flat capital, in em — from the outline of Н/H/E. */
export function capHeightEm(data: TypefaceData): number {
  const g = data.glyphs['Н'] ?? data.glyphs['H'] ?? data.glyphs['E'] ?? data.glyphs['Е']
  if (!g) return 0.7
  const t = g.o.split(' ')
  let max = -Infinity
  let i = 0
  while (i < t.length) {
    const cmd = t[i]
    const take = cmd === 'm' || cmd === 'l' ? 2 : cmd === 'q' ? 4 : cmd === 'b' ? 6 : 0
    // the end point is first; control points follow and may overshoot — ignore them
    if (take) max = Math.max(max, Number(t[i + 2]))
    i += 1 + take
  }
  return Number.isFinite(max) ? max / data.resolution : 0.7
}

/** Measure with a 2D canvas and a CSS font — for the fallback. Null until canvas is available. */
export function measureFromCanvas(fontFamily: string, weight = 900): MeasureEm | null {
  if (typeof document === 'undefined') return null
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.font = `${weight} 100px "${fontFamily}", sans-serif`
  return (s) => ctx.measureText(s).width / 100
}

/** Split one line at the space that leaves the two halves closest in width. */
export function splitNearMiddle(line: string, measure: MeasureEm): [string, string] | null {
  let best: [string, string] | null = null
  let bestDiff = Infinity
  for (let i = 1; i < line.length - 1; i++) {
    if (line[i] !== ' ') continue
    const a = line.slice(0, i).trimEnd()
    const b = line.slice(i + 1).trimStart()
    if (!a || !b) continue
    const diff = Math.abs(measure(a) - measure(b))
    if (diff < bestDiff) {
      bestDiff = diff
      best = [a, b]
    }
  }
  return best
}

export interface FittedLayout {
  /** font size per line, in the units of availW/availH */
  sizes: number[]
  /** top of each line's cap-height box, measured down from the block top */
  tops: number[]
  totalH: number
  width: number
}

/**
 * Each line fills `availW` on its own (so lines differ in size and share one width);
 * when the stack would not fit `availH`, every line shrinks by the same factor.
 * `lineHeight` is baseline-to-baseline in cap heights, applied with the smaller neighbour's size.
 */
export function layoutFitted(lines: string[], measure: MeasureEm, capEm: number, availW: number, availH: number, lineHeight: number): FittedLayout {
  const widths = lines.map((l) => Math.max(measure(l), 1e-3))
  let sizes = widths.map((w) => availW / w)
  const stack = (s: number[]) => {
    const tops: number[] = []
    let y = 0
    for (let i = 0; i < s.length; i++) {
      if (i > 0) y += (lineHeight - 1) * capEm * Math.min(s[i - 1], s[i])
      tops.push(y)
      y += capEm * s[i]
    }
    return { tops, totalH: y }
  }
  let block = stack(sizes)
  if (block.totalH > availH) {
    const k = availH / block.totalH
    sizes = sizes.map((v) => v * k)
    block = stack(sizes)
  }
  return { sizes, tops: block.tops, totalH: block.totalH, width: Math.max(...widths.map((w, i) => w * sizes[i])) }
}

/**
 * Explicit `\n` wins. A single line wraps to two when it could not be set
 * at `minFontPx` or larger inside `availWidthPx`.
 */
export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function layoutLines(text: string, measure: MeasureEm, availWidthPx: number, minFontPx: number): LineLayout {
  let lines = splitLines(text)
  if (lines.length === 0) lines = [' ']
  if (lines.length === 1) {
    const w = measure(lines[0])
    if (w > 0 && availWidthPx / w < minFontPx) {
      const pair = splitNearMiddle(lines[0], measure)
      if (pair) lines = pair
    }
  }
  const widths = lines.map(measure)
  return { lines, widths, maxWidth: Math.max(...widths, 1e-3) }
}
