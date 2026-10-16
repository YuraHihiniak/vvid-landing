#!/usr/bin/env node
// TTF/OTF → three.js typeface.json, the same format and math as facetype.js
// (gero3.github.io/facetype.js), but scriptable and with a charset that always
// includes Cyrillic.
//
//   node scripts/make-typeface.mjs <in.ttf|otf|woff> <out.json> [--charset latin,cyrillic,punct] [--chars "…"] [--all] [--reverse]
//
//   --charset  comma list of the named ranges below (default: all of them)
//   --chars    extra characters to keep, on top of --charset
//   --all      keep every glyph that has a unicode mapping (big files)
//   --reverse  reverse contour direction — needed for some CFF-based .otf fonts
//              whose letters come out inverted (holes filled, bodies hollow)
import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'

const RANGES = {
  latin: [[0x20, 0x7e]],
  'latin-1': [[0xa0, 0xff]],
  cyrillic: [[0x400, 0x45f], [0x490, 0x491]], // Russian, Ukrainian, Belarusian, Serbian, Macedonian, Bulgarian + Ґґ
  'cyrillic-ext': [[0x460, 0x52f]], // historic + Kazakh, Tatar, Bashkir…
  punct: [[0x2010, 0x2027], [0x2030, 0x2030], [0x2039, 0x203a], [0x20ac, 0x20ac], [0x20bd, 0x20bd], [0x2116, 0x2116], [0x2122, 0x2122]],
}
const DEFAULT_CHARSET = ['latin', 'latin-1', 'cyrillic', 'punct']

const args = process.argv.slice(2)
const positional = args.filter((a, i) => !a.startsWith('--') && !['--charset', '--chars'].includes(args[i - 1]))
const flag = (name) => args.includes(name)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const [input, output] = positional
if (!input || !output) {
  console.error('usage: make-typeface.mjs <in.ttf> <out.json> [--charset latin,cyrillic,punct] [--chars "…"] [--all] [--reverse]')
  process.exit(1)
}

const charsetNames = (opt('--charset') ?? DEFAULT_CHARSET.join(',')).split(',').map((s) => s.trim()).filter(Boolean)
for (const name of charsetNames) {
  if (!RANGES[name]) {
    console.error(`unknown charset "${name}", known: ${Object.keys(RANGES).join(', ')}`)
    process.exit(1)
  }
}
const extraChars = new Set([...(opt('--chars') ?? '')].map((c) => c.codePointAt(0)))
const keepAll = flag('--all')
const reverse = flag('--reverse')

const keep = (cp) =>
  keepAll || extraChars.has(cp) || charsetNames.some((name) => RANGES[name].some(([a, b]) => cp >= a && cp <= b))

const buf = fs.readFileSync(input)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))

// facetype.js: 1000 units at 72 dpi
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72)
const r = (v) => Math.round(v * scale)

function reverseCommands(commands) {
  // split into closed contours and walk each one backwards, as facetype.js does
  const paths = []
  let current
  for (const c of commands) {
    if (c.type.toLowerCase() === 'm') {
      current = [c]
      paths.push(current)
    } else if (c.type.toLowerCase() !== 'z') {
      current.push(c)
    }
  }
  const out = []
  for (const p of paths) {
    const result = [{ type: 'm', x: p[p.length - 1].x, y: p[p.length - 1].y }]
    for (let i = p.length - 1; i > 0; i--) {
      const c = p[i]
      const prev = p[i - 1]
      const seg = { type: c.type, x: prev.x, y: prev.y }
      if (c.x1 !== undefined) {
        if (c.x2 !== undefined) {
          seg.x1 = c.x2
          seg.y1 = c.y2
          seg.x2 = c.x1
          seg.y2 = c.y1
        } else {
          seg.x1 = c.x1
          seg.y1 = c.y1
        }
      }
      result.push(seg)
    }
    out.push(...result)
  }
  return out
}

const glyphs = {}
let kept = 0
const missing = []
for (let i = 0; i < font.glyphs.length; i++) {
  const glyph = font.glyphs.get(i)
  const unicodes = glyph.unicodes?.length ? glyph.unicodes : glyph.unicode !== undefined ? [glyph.unicode] : []
  for (const cp of unicodes) {
    if (!keep(cp)) continue
    const bb = glyph.getBoundingBox()
    let commands = glyph.path.commands
    if (reverse) commands = reverseCommands(commands)
    let o = ''
    for (const c of commands) {
      // three.js FontLoader: m/l x y · q x y cpx cpy · b x y cp1x cp1y cp2x cp2y · z
      const type = c.type.toLowerCase() === 'c' ? 'b' : c.type.toLowerCase()
      o += type + ' '
      if (c.x !== undefined && c.y !== undefined) o += `${r(c.x)} ${r(c.y)} `
      if (c.x1 !== undefined && c.y1 !== undefined) o += `${r(c.x1)} ${r(c.y1)} `
      if (c.x2 !== undefined && c.y2 !== undefined) o += `${r(c.x2)} ${r(c.y2)} `
    }
    glyphs[String.fromCodePoint(cp)] = {
      ha: r(glyph.advanceWidth),
      x_min: r(bb.x1),
      x_max: r(bb.x2),
      o: o.trim(),
    }
    kept++
  }
}

// report what the default Cyrillic set is missing in this font, so a "?" in the 3D text is never a surprise
for (const [a, b] of RANGES.cyrillic) {
  for (let cp = a; cp <= b; cp++) {
    const ch = String.fromCodePoint(cp)
    if (keep(cp) && !glyphs[ch]) missing.push(ch)
  }
}

const name = (key) => font.names[key]?.en ?? Object.values(font.names[key] ?? {})[0] ?? ''
const style = name('fontSubfamily').toLowerCase()
const weightClass = font.tables.os2?.usWeightClass ?? 400

const result = {
  glyphs,
  familyName: name('fontFamily'),
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition),
  underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: {
    yMin: r(font.tables.head.yMin),
    xMin: r(font.tables.head.xMin),
    yMax: r(font.tables.head.yMax),
    xMax: r(font.tables.head.xMax),
  },
  resolution: 1000,
  original_font_information: {
    format: 0,
    fontFamily: name('fontFamily'),
    fontSubfamily: name('fontSubfamily'),
    fullName: name('fullName'),
    version: name('version'),
    copyright: name('copyright'),
    license: name('license'),
    licenseURL: name('licenseURL'),
  },
  cssFontWeight: weightClass >= 600 || style.includes('bold') || style.includes('black') ? 'bold' : 'normal',
  cssFontStyle: style.includes('italic') ? 'italic' : 'normal',
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(result))
const kb = (fs.statSync(output).size / 1024).toFixed(0)
console.log(`${path.basename(input)} → ${output}: ${kept} glyphs, ${kb} KB (${result.familyName} ${name('fontSubfamily')}, weight ${weightClass})`)
if (missing.length) console.warn(`  font has no glyph for: ${missing.join(' ')}`)
