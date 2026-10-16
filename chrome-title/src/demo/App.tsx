import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChromeTitle, type FallbackReason, type RenderMode, type TintName } from '../chrome-title'
import './demo.css'

const FONTS = {
  unbounded: { label: 'Unbounded Black', url: `${import.meta.env.BASE_URL}fonts/unbounded-black.typeface.json`, family: 'Unbounded' },
  rubik: { label: 'Rubik Black', url: `${import.meta.env.BASE_URL}fonts/rubik-black.typeface.json`, family: 'Rubik' },
  boorsok: { label: 'Borsok', url: `${import.meta.env.BASE_URL}fonts/boorsok.typeface.json`, family: 'Borsok' },
} as const
type FontKey = keyof typeof FONTS

const PRESETS = ['НАДУТЫЙ ХРОМ', 'ДЕЛАЕМ ПРОДУКТ ДЛЯ БИЗНЕСА', 'INFLATED CHROME', 'ЁЖ · №1\nVVID']

const REASONS: Record<FallbackReason, string> = {
  forced: 'режим css выбран вручную',
  ssr: 'сервер',
  'no-webgl': 'WebGL недоступен',
  'software-renderer': 'программный рендер (SwiftShader и т.п.)',
  'webgl-error': 'ошибка при создании контекста',
  'save-data': 'включён режим экономии трафика',
  'low-memory': 'мало памяти (deviceMemory < 2)',
  'few-cores': '≤ 2 ядер',
  'low-fps': 'низкий fps — откат на CSS',
  'context-lost': 'потерян WebGL-контекст',
  'scene-error': 'ошибка сцены',
}

function readParams() {
  const q = new URLSearchParams(location.search)
  const font = (q.get('font') ?? 'unbounded') as FontKey
  return {
    text: q.get('text') ?? PRESETS[0],
    tint: (q.get('tint') ?? 'cool') as TintName,
    font: font in FONTS ? font : ('unbounded' as FontKey),
    interactive: q.get('interactive') !== '0',
    size: Number(q.get('size') ?? 0.86),
    mode: (q.get('mode') ?? 'auto') as 'auto' | RenderMode,
    panel: q.get('panel') !== '0',
    chrome: q.get('chrome') !== '0',
    customA: q.get('a') ?? '#ff4fa3',
    customB: q.get('b') ?? '#45f0c8',
    hover: q.get('hover') ?? '',
    caps: q.get('caps') === '1',
    fit: q.get('fit') === '1',
    sway: q.get('sway') !== '0',
  }
}

export default function App() {
  const initial = useMemo(readParams, [])
  const [text, setText] = useState(initial.text)
  const [tint, setTint] = useState<TintName>(initial.tint)
  const [font, setFont] = useState<FontKey>(initial.font)
  const [interactive, setInteractive] = useState(initial.interactive)
  const [size, setSize] = useState(initial.size)
  const [mode, setMode] = useState(initial.mode)
  const [panel, setPanel] = useState(initial.panel)
  const [customA, setCustomA] = useState(initial.customA)
  const [customB, setCustomB] = useState(initial.customB)
  const [hover, setHover] = useState(initial.hover)
  const [caps, setCaps] = useState(initial.caps)
  const [fit, setFit] = useState(initial.fit)
  const [sway, setSway] = useState(initial.sway)
  const [shown, setShown] = useState<{ mode: RenderMode; reason?: FallbackReason }>({ mode: 'css' })
  const [fps, setFps] = useState(0)

  const onModeChange = useCallback((m: RenderMode, reason?: FallbackReason) => setShown({ mode: m, reason }), [])

  // keep the URL shareable
  useEffect(() => {
    const q = new URLSearchParams()
    if (text !== PRESETS[0]) q.set('text', text)
    if (tint !== 'cool') q.set('tint', tint)
    if (font !== 'unbounded') q.set('font', font)
    if (!interactive) q.set('interactive', '0')
    if (size !== 0.86) q.set('size', String(size))
    if (mode !== 'auto') q.set('mode', mode)
    if (!panel) q.set('panel', '0')
    if (tint === 'custom') {
      q.set('a', customA)
      q.set('b', customB)
    }
    if (hover) q.set('hover', hover)
    if (caps) q.set('caps', '1')
    if (fit) q.set('fit', '1')
    if (!sway) q.set('sway', '0')
    const s = q.toString()
    history.replaceState(null, '', s ? `?${s}` : location.pathname)
  }, [text, tint, font, interactive, size, mode, panel, customA, customB, hover, caps, fit, sway])

  // page fps, for the panel only
  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let id = 0
    const tick = (now: number) => {
      frames++
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)))
        frames = 0
        last = now
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) setPanel((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const customTint = useMemo(
    () =>
      tint === 'custom'
        ? { accents: [customA, customB] as [string, string], glow: customA, css: { light: '#ffffff', mid: '#d6d6e0', dark: '#2a2a38', shadow: '#08080f' } }
        : undefined,
    [tint, customA, customB],
  )

  return (
    <main className={`demo demo--${tint}`}>
      <header className="demo__top">
        <span className="demo__brand">VVID / chrome-title</span>
        <span className="demo__status">
          <b data-mode={shown.mode}>{shown.mode}</b>
          {shown.reason ? <span> · {REASONS[shown.reason]}</span> : null}
          <span> · {fps} fps</span>
        </span>
      </header>

      <section className="demo__hero">
        <ChromeTitle
          text={caps ? text.toUpperCase() : text}
          fontUrl={FONTS[font].url}
          fontFamily={FONTS[font].family}
          tint={tint}
          customTint={customTint}
          interactive={interactive}
          size={size}
          mode={mode}
          hoverTint={hover || undefined}
          fitLines={fit}
          sway={sway}
          className="demo__title"
          onModeChange={onModeChange}
        />
        <p className="demo__lede">
          Надутые зеркальные буквы на react-three-fiber. Кириллица из typeface.json, CSS-хром как фолбэк и первый кадр.
        </p>
      </section>

      <section className="demo__below" aria-hidden>
        <p>ниже пусто — проскрольте, чтобы убедиться, что сцена засыпает вне экрана и просыпается обратно</p>
      </section>

      {panel ? (
        <aside className="panel">
          <label className="panel__row panel__row--wide">
            <span>text</span>
            <textarea value={text} rows={2} onChange={(e) => setText(e.target.value)} spellCheck={false} />
          </label>
          <div className="panel__row panel__row--wide panel__presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" className={p === text ? 'is-active' : ''} onClick={() => setText(p)}>
                {p.replace('\n', ' ⏎ ')}
              </button>
            ))}
          </div>
          <label className="panel__row">
            <span>tint</span>
            <select value={tint} onChange={(e) => setTint(e.target.value as TintName)}>
              <option value="cool">cool</option>
              <option value="gold">gold</option>
              <option value="custom">custom</option>
            </select>
          </label>
          {tint === 'custom' ? (
            <div className="panel__row panel__colors">
              <span>accents</span>
              <input type="color" value={customA} onChange={(e) => setCustomA(e.target.value)} />
              <input type="color" value={customB} onChange={(e) => setCustomB(e.target.value)} />
            </div>
          ) : null}
          <label className="panel__row">
            <span>font</span>
            <select value={font} onChange={(e) => setFont(e.target.value as FontKey)}>
              {Object.entries(FONTS).map(([k, f]) => (
                <option key={k} value={k}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="panel__row">
            <span>size {size.toFixed(2)}</span>
            <input type="range" min={0.4} max={1} step={0.01} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </label>
          <label className="panel__row">
            <span>mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as 'auto' | RenderMode)}>
              <option value="auto">auto</option>
              <option value="webgl">webgl</option>
              <option value="css">css</option>
            </select>
          </label>
          <label className="panel__row panel__check">
            <input type="checkbox" checked={interactive} onChange={(e) => setInteractive(e.target.checked)} />
            <span>interactive (follow the cursor)</span>
          </label>
          <label className="panel__row panel__check">
            <input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} />
            <span>caps</span>
          </label>
          <label className="panel__row panel__check">
            <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} />
            <span>fit lines (each line full width)</span>
          </label>
          <label className="panel__row panel__check">
            <input type="checkbox" checked={sway} onChange={(e) => setSway(e.target.checked)} />
            <span>idle sway</span>
          </label>
          <label className="panel__row panel__check">
            <input type="checkbox" checked={!!hover} onChange={(e) => setHover(e.target.checked ? '#ff6f61' : '')} />
            <span>hover tint {hover ? <input type="color" value={hover} onChange={(e) => setHover(e.target.value)} /> : null}</span>
          </label>
          <p className="panel__hint">h — скрыть панель · параметры живут в URL</p>
        </aside>
      ) : null}
    </main>
  )
}
