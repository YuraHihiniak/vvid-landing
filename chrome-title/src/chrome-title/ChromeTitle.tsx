import { Component, Fragment, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { probeDevice, probeWebGL, useElementSize, useIntersection, useMediaQuery } from './capabilities'
import { layoutFitted, layoutLines, measureFromCanvas, splitLines, type MeasureEm } from './metrics'
import { DEFAULT_GEOMETRY, TINTS, TOUCH_GEOMETRY, type ChromeTitleProps, type FallbackReason, type RenderMode, type TintSpec } from './types'
// the stylesheet is imported by the page (src/main.tsx) or injected by the standalone entry (src/lib.tsx)

// three + r3f + drei only load when a capable device scrolls the title near the viewport
const ChromeScene = lazy(() => import('./ChromeScene'))

const DEFAULT_FONT_URL = `${import.meta.env.BASE_URL}fonts/unbounded-black.typeface.json`

type Decision = { mode: RenderMode; reason?: FallbackReason }

export function ChromeTitle({
  text,
  fontUrl = DEFAULT_FONT_URL,
  fontFamily = 'Unbounded',
  tint = 'cool',
  customTint,
  interactive = true,
  size = 0.86,
  minFontPx = 44,
  mode = 'auto',
  align = 'center',
  paused = false,
  shadowOpacity = 0.5,
  hoverTint,
  fitLines = false,
  sway = true,
  environmentUrl,
  geometry: geometryOverrides,
  as: Tag = 'h1',
  className,
  style,
  onModeChange,
}: ChromeTitleProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(pointer: fine)')
  const near = useIntersection(rootRef, '320px', true)
  const active = useIntersection(rootRef, '0px', false)
  const box = useElementSize(rootRef)

  const tintSpec = useMemo<TintSpec>(() => {
    const base = tint === 'gold' ? TINTS.gold : TINTS.cool
    return customTint ? { ...base, ...customTint, css: { ...base.css, ...customTint.css } } : base
  }, [tint, customTint])
  // touch devices get fewer segments: the geometry is built on the main thread, ~2× fewer triangles
  // halves that; the pillow reads the same at phone sizes. Keyed by value so an inline object does
  // not rebuild the letters on every render.
  const overridesKey = JSON.stringify(geometryOverrides ?? null)
  const geometry = useMemo(
    () => ({ ...DEFAULT_GEOMETRY, ...(finePointer ? null : TOUCH_GEOMETRY), ...geometryOverrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overridesKey, finePointer],
  )

  // which side renders: decided on the client, after mount, so SSR always emits the CSS title
  const [decision, setDecision] = useState<Decision | null>(null)
  const [ready, setReady] = useState(false)
  // hover is tracked on the root: the canvas and the heading let pointer events through
  const [hovered, setHovered] = useState(false)
  const hoverOn = !!hoverTint && finePointer
  useEffect(() => {
    setReady(false)
    if (mode === 'css') return setDecision({ mode: 'css', reason: 'forced' })
    if (mode === 'webgl') return setDecision({ mode: 'webgl' })
    const gl = probeWebGL()
    if (!gl.ok) return setDecision({ mode: 'css', reason: gl.reason })
    const dev = probeDevice()
    if (!dev.ok) return setDecision({ mode: 'css', reason: dev.reason })
    setDecision({ mode: 'webgl' })
  }, [mode])
  const fallback = useCallback((reason: FallbackReason) => {
    setReady(false)
    setDecision({ mode: 'css', reason })
  }, [])
  const onReady = useCallback(() => setReady(true), [])

  const shown: RenderMode = ready ? 'webgl' : 'css'
  const reason = decision?.mode === 'css' ? decision.reason : undefined
  useEffect(() => {
    onModeChange?.(shown, reason)
  }, [shown, reason, onModeChange])

  // the CSS title: same wrapping rule as the scene, measured with the CSS face
  const [measure, setMeasure] = useState<MeasureEm | null>(() => measureFromCanvas(fontFamily))
  useEffect(() => {
    setMeasure(() => measureFromCanvas(fontFamily))
    let cancelled = false
    document.fonts?.load(`900 100px "${fontFamily}"`).then(() => {
      if (!cancelled) setMeasure(() => measureFromCanvas(fontFamily))
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [fontFamily])
  // cap height ≈ 0.72 em for a black display face; the stylesheet sets line-height 1
  const cssLayout = useMemo(() => {
    if (!box.width || !measure) return null
    const availW = box.width * size
    const availH = box.height * 0.78
    const explicit = splitLines(text)
    if (fitLines && explicit.length) {
      const f = layoutFitted(explicit, measure, 0.72, availW, availH, 1.3)
      return { lines: explicit, sizes: f.sizes }
    }
    const ll = layoutLines(text, measure, availW, minFontPx)
    const totalH = 0.72 + (ll.lines.length - 1) * 1
    const fontPx = Math.min(availW / ll.maxWidth, availH / totalH)
    return { lines: ll.lines, sizes: ll.lines.map(() => fontPx) }
  }, [box.width, box.height, measure, text, size, minFontPx, fitLines])
  // lines are blocks, separated by a space so the heading's text reads as one sentence
  const renderLines = () =>
    cssLayout
      ? cssLayout.lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span className="chrome-title__line" data-line={line} style={{ fontSize: `${cssLayout.sizes[i].toFixed(1)}px` }}>
              {line}
            </span>
          </Fragment>
        ))
      : text

  const vars = {
    '--ct-light': tintSpec.css.light,
    '--ct-mid': tintSpec.css.mid,
    '--ct-dark': tintSpec.css.dark,
    '--ct-shadow': tintSpec.css.shadow,
    '--ct-accent-a': tintSpec.accents[0],
    '--ct-accent-b': tintSpec.accents[1],
    '--ct-glow': tintSpec.glow,
    '--ct-font-family': `"${fontFamily}"`,
    ...(hoverTint ? { '--ct-hover': hoverTint } : null),
    ...(cssLayout ? { '--ct-font-px': `${cssLayout.sizes[0].toFixed(1)}px` } : null),
  } as CSSProperties

  const classes = [
    'chrome-title',
    `chrome-title--${tint}`,
    `chrome-title--${align}`,
    ready ? 'chrome-title--3d' : 'chrome-title--css',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={classes}
      style={{ ...vars, ...style }}
      data-mode={shown}
      data-reason={reason}
      data-hovered={hoverOn && hovered ? '' : undefined}
      onPointerEnter={hoverOn ? () => setHovered(true) : undefined}
      onPointerLeave={hoverOn ? () => setHovered(false) : undefined}
    >
      <div className="chrome-title__glow" aria-hidden />
      {decision?.mode === 'webgl' && near ? (
        <SceneBoundary onError={fallback}>
          <Suspense fallback={null}>
            <ChromeScene
              text={text}
              fontUrl={fontUrl}
              tint={tintSpec}
              geometry={geometry}
              interactive={interactive}
              size={size}
              minFontPx={minFontPx}
              reducedMotion={reducedMotion}
              finePointer={finePointer}
              align={align}
              shadowOpacity={shadowOpacity}
              hoverTint={hoverTint}
              hovered={hoverOn && hovered}
              fitLines={fitLines}
              sway={sway}
              active={active && !paused}
              environmentUrl={environmentUrl}
              onReady={onReady}
              onFallback={fallback}
            />
          </Suspense>
        </SceneBoundary>
      ) : null}
      <Tag className="chrome-title__text">{renderLines()}</Tag>
      {/* a sibling, not a child: the heading's text must stay single for crawlers */}
      {hoverTint ? (
        <div className="chrome-title__hover" aria-hidden>
          {renderLines()}
        </div>
      ) : null}
    </div>
  )
}

/** A broken scene (bad font JSON, shader failure) must never take the heading down with it. */
class SceneBoundary extends Component<{ onError: (r: FallbackReason) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError('scene-error')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
