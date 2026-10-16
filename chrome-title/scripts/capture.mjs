#!/usr/bin/env node
// Screenshots and a short cursor-follow clip of the demo, for the README.
//
//   node scripts/capture.mjs [--url http://localhost:5178] [--out docs] [--no-video]
//
// Needs Google Chrome on this Mac and a running dev server (npm run dev) or preview.
// Video frames go through ffmpeg if it is on PATH; otherwise only the frames are kept.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import puppeteer from 'puppeteer-core'

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const URL_BASE = arg('--url', 'http://localhost:5178')
const OUT = path.resolve(arg('--out', 'docs'))
const VIDEO = !process.argv.includes('--no-video')
fs.mkdirSync(OUT, { recursive: true })

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  process.env.CHROME_PATH,
].filter(Boolean).find((p) => fs.existsSync(p))
if (!CHROME) {
  console.error('no Chrome found; set CHROME_PATH')
  process.exit(1)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars', '--mute-audio'],
})

const SHOTS = [
  { name: 'desktop-cool', w: 1600, h: 900, q: 'panel=0' },
  { name: 'desktop-gold', w: 1600, h: 900, q: 'panel=0&tint=gold' },
  { name: 'desktop-rubik', w: 1600, h: 900, q: 'panel=0&font=rubik&text=' + encodeURIComponent('ДЕЛАЕМ ПРОДУКТ ДЛЯ БИЗНЕСА') },
  { name: 'mobile-wrap', w: 390, h: 844, q: 'panel=0&text=' + encodeURIComponent('ДЕЛАЕМ ПРОДУКТ ДЛЯ БИЗНЕСА'), mobile: true },
  { name: 'css-fallback', w: 1600, h: 900, q: 'panel=0&mode=css' },
  { name: 'css-fallback-mobile', w: 390, h: 844, q: 'panel=0&mode=css&text=' + encodeURIComponent('ДЕЛАЕМ ПРОДУКТ ДЛЯ БИЗНЕСА'), mobile: true },
]

async function open(shot) {
  const page = await browser.newPage()
  await page.setViewport({ width: shot.w, height: shot.h, deviceScaleFactor: 2, isMobile: !!shot.mobile, hasTouch: !!shot.mobile })
  const forced = shot.q.includes('mode=') ? '' : '&mode=webgl'
  await page.goto(`${URL_BASE}/?${shot.q}${forced}`, { waitUntil: 'networkidle0', timeout: 60_000 })
  const target = shot.q.includes('mode=css') ? '.chrome-title--css' : '.chrome-title--3d'
  await page.waitForSelector(target, { timeout: 30_000 }).catch(() => console.warn(`  ${shot.name}: ${target} never appeared`))
  await page.mouse.move(shot.w * 0.5, shot.h * 0.45)
  await new Promise((r) => setTimeout(r, 1200)) // crossfade + settle
  return page
}

for (const shot of SHOTS) {
  const page = await open(shot)
  const info = await page.evaluate(() => {
    const el = document.querySelector('.chrome-title')
    const gl = document.createElement('canvas').getContext('webgl')
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
    return { mode: el?.dataset.mode, reason: el?.dataset.reason, renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a' }
  })
  const file = path.join(OUT, `${shot.name}.png`)
  await page.screenshot({ path: file })
  console.log(`${shot.name}.png — ${info.mode}${info.reason ? ` (${info.reason})` : ''} · ${info.renderer}`)
  await page.close()
}

if (VIDEO) {
  const shot = { name: 'clip', w: 1280, h: 720, q: 'panel=0' }
  const page = await open(shot)
  const framesDir = path.join(OUT, 'clip-frames')
  fs.rmSync(framesDir, { recursive: true, force: true })
  fs.mkdirSync(framesDir)
  const N = 72
  for (let i = 0; i < N; i++) {
    // one lap of the cursor around the title
    const a = (i / N) * Math.PI * 2
    await page.mouse.move(shot.w * (0.5 + 0.42 * Math.cos(a)), shot.h * (0.45 + 0.35 * Math.sin(a)))
    await new Promise((r) => setTimeout(r, 40))
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(3, '0')}.png`) })
  }
  await page.close()
  const ff = spawnSync('ffmpeg', ['-y', '-framerate', '24', '-i', path.join(framesDir, 'f%03d.png'), '-vf', 'scale=1280:-2,format=yuv420p', '-c:v', 'libx264', '-crf', '20', path.join(OUT, 'clip.mp4')], { stdio: 'ignore' })
  if (ff.status === 0) {
    spawnSync('ffmpeg', ['-y', '-i', path.join(OUT, 'clip.mp4'), '-vf', 'fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer', path.join(OUT, 'clip.gif')], { stdio: 'ignore' })
    fs.rmSync(framesDir, { recursive: true, force: true })
    console.log('clip.mp4 + clip.gif')
  } else {
    console.log(`ffmpeg not available — ${N} frames left in ${framesDir}`)
  }
}

await browser.close()
