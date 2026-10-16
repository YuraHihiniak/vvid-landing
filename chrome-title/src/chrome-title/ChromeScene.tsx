import { memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Center, ContactShadows, Environment, Lightformer, PerformanceMonitor, Text3D, useFont } from '@react-three/drei'
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  SRGBColorSpace,
  type Group,
  type Mesh,
  type MeshPhysicalMaterial,
  type PerspectiveCamera,
} from 'three'
import { pillowGeometry } from './geometry'
import { capHeightEm, layoutFitted, layoutLines, measureFromTypeface, splitLines, type TypefaceData } from './metrics'
import type { FallbackReason, GeometryOptions, TintSpec } from './types'

export interface ChromeSceneProps {
  text: string
  fontUrl: string
  tint: TintSpec
  geometry: GeometryOptions
  interactive: boolean
  size: number
  minFontPx: number
  reducedMotion: boolean
  finePointer: boolean
  align: 'center' | 'left'
  shadowOpacity: number
  hoverTint?: string
  hovered: boolean
  fitLines: boolean
  sway: boolean
  /** on screen and not paused — otherwise the render loop stops */
  active: boolean
  environmentUrl?: string
  onReady: () => void
  onFallback: (reason: FallbackReason) => void
}

const BASE_TILT_X = -0.02
const MAX_DPR = 2
/** horizontal field of view the box always gets; the vertical fov follows from the aspect ratio */
const HFOV = (40 * Math.PI) / 180
const VFOV_MIN = (6 * Math.PI) / 180
const VFOV_MAX = (30 * Math.PI) / 180

/**
 * A fixed vertical fov makes a wide box (a hero strip is 5:1) see ~106° horizontally: the ends of the
 * title sit at the edge of a fisheye, and turning toward the cursor swings the near end 30–40 % bigger,
 * past the canvas. So the vertical fov is derived from the aspect ratio instead, and the world-space
 * viewport at the title's plane is computed here rather than read from r3f (which would be stale).
 */
function useFittedView(): { width: number; height: number } {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  return useMemo(() => {
    const aspect = size.width / Math.max(1, size.height)
    const vfov = Math.min(VFOV_MAX, Math.max(VFOV_MIN, 2 * Math.atan(Math.tan(HFOV / 2) / aspect)))
    camera.fov = (vfov * 180) / Math.PI
    camera.updateProjectionMatrix()
    const distance = camera.position.length() // the camera looks at the origin
    const height = 2 * distance * Math.tan(vfov / 2)
    return { width: height * aspect, height }
  }, [camera, size.width, size.height])
}

export default function ChromeScene(props: ChromeSceneProps) {
  const { active, reducedMotion, onFallback, onReady } = props
  const [dpr, setDpr] = useState(() => Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1)))
  const floorHits = useRef(0)
  // nothing moves on its own → render on demand; the hover tint then gets a burst of frames to ease
  const moving = !reducedMotion && (props.sway || (props.interactive && props.finePointer))
  const frameloop = !active ? 'never' : moving ? 'always' : 'demand'

  return (
    <Canvas
      dpr={dpr}
      frameloop={frameloop}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1,
      }}
      // slightly above the title, looking at it: the top faces show and the floor shadow reads as a floor;
      // the fov is overridden per aspect ratio in useFittedView
      camera={{ fov: 30, position: [0, 1.4, 11], near: 1, far: 60 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden
      onCreated={({ gl }) => {
        // the browser may hand the context back (three re-inits on restore); fall back only if it does not
        let timer = 0
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          window.clearTimeout(timer)
          timer = window.setTimeout(() => onFallback('context-lost'), 2500)
        })
        gl.domElement.addEventListener('webglcontextrestored', () => window.clearTimeout(timer))
      }}
    >
      {frameloop === 'always' ? (
        // fps is counted per rendered frame, so the monitor only makes sense on a running loop —
        // and only while the page is visible: a throttled background tab is not a slow device
        <PerformanceMonitor
          factor={1}
          flipflops={3}
          bounds={(hz) => {
            const cap = Math.min(hz || 60, 60)
            return [cap * 0.72, cap * 0.92]
          }}
          onChange={({ factor }) => {
            if (document.visibilityState !== 'visible') return
            const next = Math.round((1 + factor * (MAX_DPR - 1)) * 4) / 4
            setDpr(Math.min(next, Math.max(1, window.devicePixelRatio || 1)))
          }}
          onDecline={({ factor }) => {
            if (document.visibilityState !== 'visible') return
            // still dropping frames at dpr 1 → the CSS version is the better hero on this device
            if (factor <= 0 && ++floorHits.current >= 2) onFallback('low-fps')
          }}
          onIncline={() => {
            floorHits.current = 0
          }}
          onFallback={() => {
            if (document.visibilityState === 'visible') onFallback('low-fps')
          }}
        />
      ) : null}
      <Suspense fallback={null}>
        <Studio tint={props.tint} environmentUrl={props.environmentUrl} />
        <Title {...props} />
        <Ready onReady={onReady} />
      </Suspense>
      {frameloop === 'demand' ? <Kick frames={reducedMotion ? 3 : 45} deps={[props.text, props.fontUrl, props.tint, props.size, props.hovered]} /> : null}
    </Canvas>
  )
}

/* ---------- lighting ---------- */

/**
 * The backdrop behind the camera is what the flat faces of the letters mirror. A sky → horizon → ground
 * gradient there is what makes them read as chrome; the razor strips in front of it add the hard lines.
 */
function useHorizonMap(tint: TintSpec): CanvasTexture {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 512
    const ctx = c.getContext('2d')!
    // the camera sits a little above the title, so the faces mirror the band just below the panel's
    // middle (v ≈ 0.50–0.64 at rest, ±0.1 as the cursor tilts them): the horizon goes there
    const g = ctx.createLinearGradient(0, 0, 0, c.height)
    g.addColorStop(0.0, '#ffffff')
    g.addColorStop(0.34, '#ffffff')
    g.addColorStop(0.48, tint.highlight)
    g.addColorStop(0.545, tint.highlight)
    g.addColorStop(0.58, tint.css.mid)
    g.addColorStop(0.597, tint.css.dark)
    g.addColorStop(0.607, tint.css.shadow)
    g.addColorStop(0.615, '#06070c')
    g.addColorStop(0.625, tint.glow)
    g.addColorStop(0.665, tint.accents[1])
    g.addColorStop(0.76, '#0b0c16')
    g.addColorStop(1.0, '#03030a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, c.width, c.height)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [tint])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}

const Studio = memo(function Studio({ tint, environmentUrl }: { tint: TintSpec; environmentUrl?: string }) {
  if (environmentUrl) return <Environment files={environmentUrl} resolution={256} />
  return <LightformerStudio tint={tint} />
})

function LightformerStudio({ tint }: { tint: TintSpec }) {
  const horizon = useHorizonMap(tint)
  const [left, right] = tint.accents
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#04050a']} />
      {/* behind the camera: the horizon the faces mirror */}
      <Lightformer form="rect" intensity={1.7} map={horizon} position={[0, 0, 14]} scale={[44, 26, 1]} />
      {/* razor strips above and below that band → hard lines on the top and bottom bevels */}
      <Lightformer form="rect" intensity={9} color="#ffffff" position={[0, 3.2, 10]} scale={[30, 0.5, 1]} />
      <Lightformer form="rect" intensity={11} color="#ffffff" position={[0, -4.6, 10]} scale={[30, 0.9, 1]} />
      {/* ceiling: one wide soft light → the broad bright top of every letter */}
      <Lightformer form="rect" intensity={3.5} color={tint.highlight} position={[0, 8, 2]} scale={[20, 8, 1]} />
      {/* coloured walls: the tint lives in the side reflections */}
      <Lightformer form="rect" intensity={3} color={left} position={[-11, 1, 3]} scale={[10, 16, 1]} />
      <Lightformer form="rect" intensity={3} color={right} position={[11, 1, 3]} scale={[10, 16, 1]} />
      {/* floor: dim accent so the undersides do not go black */}
      <Lightformer form="rect" intensity={1.4} color={right} position={[0, -8, 2]} scale={[20, 8, 1]} />
      {/* a round specular, off-axis */}
      <Lightformer form="ring" intensity={6} color="#ffffff" position={[6, 5, 8]} scale={3} />
    </Environment>
  )
}

/* ---------- the letters ---------- */

function Title({
  text,
  fontUrl,
  tint,
  geometry,
  interactive,
  size,
  minFontPx,
  reducedMotion,
  finePointer,
  align,
  shadowOpacity,
  hoverTint,
  hovered,
  fitLines,
  sway,
}: ChromeSceneProps) {
  const font = useFont(fontUrl)
  const data = font.data as unknown as TypefaceData
  const viewport = useFittedView()
  const canvasWidth = useThree((s) => s.size.width)
  const group = useRef<Group>(null)

  // world units: a size (scale of the size-1 geometry) and a baseline y per line
  const layout = useMemo(() => {
    const measure = measureFromTypeface(data, geometry.letterSpacing)
    const availW = viewport.width * size
    const availH = viewport.height * 0.78
    const cap = capHeightEm(data)
    // left-aligned: every line starts at the left edge of the available width; the rotation pivot stays at the centre
    const left = align === 'left' ? -availW / 2 : 0
    const explicit = splitLines(text)
    if (fitLines && explicit.length) {
      const f = layoutFitted(explicit, measure, cap, availW, availH, geometry.lineHeight)
      const baselines = f.tops.map((top, i) => f.totalH / 2 - top - cap * f.sizes[i])
      return { lines: explicit, sizes: f.sizes, baselines, totalH: f.totalH, width: f.width, left }
    }
    const pxPerUnit = canvasWidth / viewport.width
    const lineStep = cap * geometry.lineHeight
    const ll = layoutLines(text, measure, availW * pxPerUnit, minFontPx)
    const totalH = cap + (ll.lines.length - 1) * lineStep
    const scale = Math.min(availW / ll.maxWidth, availH / totalH)
    const baselines = ll.lines.map((_, i) => (((ll.lines.length - 1) / 2 - i) * lineStep - cap / 2) * scale)
    return { lines: ll.lines, sizes: ll.lines.map(() => scale), baselines, totalH: totalH * scale, width: ll.maxWidth * scale, left }
  }, [data, text, geometry.letterSpacing, geometry.lineHeight, viewport.width, viewport.height, canvasWidth, size, minFontPx, align, fitLines])

  // cursor, normalised to the window: the title answers wherever the pointer is, not only over the canvas
  const pointer = useRef({ x: 0, y: 0 })
  const followPointer = interactive && finePointer && !reducedMotion
  useEffect(() => {
    if (!followPointer) {
      pointer.current.x = pointer.current.y = 0
      return
    }
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const reset = () => {
      pointer.current.x = pointer.current.y = 0
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('mouseleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('mouseleave', reset)
      window.removeEventListener('blur', reset)
    }
  }, [followPointer])

  useLayoutEffect(() => {
    const g = group.current
    if (g && reducedMotion) {
      g.rotation.set(BASE_TILT_X, 0, 0)
      g.position.y = 0
    }
  }, [reducedMotion])

  // 0..1 strength of the hover tint, eased; the letters read it every frame
  const hoverK = useRef(0)
  useFrame((state, delta) => {
    const g = group.current
    const dt = Math.min(delta, 1 / 20)
    if (reducedMotion) {
      hoverK.current = hovered ? 1 : 0
      return
    }
    hoverK.current += ((hovered ? 1 : 0) - hoverK.current) * (1 - Math.exp(-dt / 0.22))
    if (!g || (!sway && !followPointer)) return
    const t = state.clock.elapsedTime
    const p = pointer.current
    const s = sway ? 1 : 0
    const wantX = BASE_TILT_X + (followPointer ? -p.y * 0.09 : 0) + s * Math.sin(t * 0.55) * 0.026
    const wantY = (followPointer ? p.x * 0.16 : 0) + s * Math.sin(t * 0.38 + 1.3) * 0.042
    const wantZ = s * Math.sin(t * 0.47 + 2.1) * 0.006
    const wantPosY = s * Math.sin(t * 0.6 + 0.6) * 0.02
    // exponential smoothing — frame-rate independent, never overshoots
    const k = 1 - Math.exp(-dt / 0.16)
    g.rotation.x += (wantX - g.rotation.x) * k
    g.rotation.y += (wantY - g.rotation.y) * k
    g.rotation.z += (wantZ - g.rotation.z) * k
    g.position.y += (wantPosY - g.position.y) * k
  })

  const shadowY = -layout.totalH / 2 - 0.3
  const liveShadow = followPointer || sway

  return (
    <>
      <group ref={group} rotation={[BASE_TILT_X, 0, 0]} position={[layout.left, 0, 0]}>
        {layout.lines.map((line, i) => (
          // the line is re-mounted on a text change (key) so Center measures fresh, unscaled matrices
          <group key={`${i}:${line}`} position={[0, layout.baselines[i], 0]} scale={layout.sizes[i]}>
            <Center
              disableY
              // drei's `right` puts the box to the right of the pivot (its left edge at x=0)
              right={align === 'left'}
              cacheKey={`${line}|${fontUrl}`}
            >
              <InflatedText text={line} fontUrl={fontUrl} tint={tint} geometry={geometry} hoverTint={hoverTint} hoverK={hoverK} />
            </Center>
          </group>
        ))}
      </group>
      {shadowOpacity > 0 ? (
        // sized to the letters, not the canvas: a plane wider than the text shows its edges as a band on a light background
        <ContactShadows
          position={[layout.left + (align === 'left' ? layout.width / 2 : 0), shadowY, 0]}
          scale={[layout.width * 1.35, 3.5]}
          far={layout.totalH + 0.8}
          blur={2.6}
          opacity={shadowOpacity}
          resolution={256}
          frames={liveShadow ? Infinity : 1}
          color="#000000"
        />
      ) : null}
    </>
  )
}

/** how far the metal goes toward `hoverTint` at full hover — all the way reads as paint, not a sheen */
const HOVER_STRENGTH = 0.7

function InflatedText({
  text,
  fontUrl,
  tint,
  geometry,
  hoverTint,
  hoverK,
}: {
  text: string
  fontUrl: string
  tint: TintSpec
  geometry: GeometryOptions
  hoverTint?: string
  hoverK: MutableRefObject<number>
}) {
  const ref = useRef<Mesh>(null)
  const material = useRef<MeshPhysicalMaterial>(null)
  const colors = useMemo(() => ({ base: new Color(tint.base), hover: new Color(hoverTint ?? tint.base) }), [tint.base, hoverTint])
  useFrame(() => {
    const m = material.current
    if (!m || !hoverTint) return
    m.color.copy(colors.base).lerp(colors.hover, hoverK.current * HOVER_STRENGTH)
  })

  // the geometry Text3D builds is faceted; swap in the welded pillow (see geometry.ts)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const flat = mesh.geometry
    const smooth = pillowGeometry(flat)
    mesh.geometry = smooth
    return () => {
      smooth.dispose()
      if (mesh.geometry === smooth) mesh.geometry = flat
    }
  }, [text, fontUrl, geometry])

  return (
    <Text3D
      ref={ref}
      font={fontUrl}
      size={1}
      height={geometry.depth}
      bevelEnabled
      bevelSize={geometry.bevelSize}
      bevelThickness={geometry.bevelThickness}
      bevelOffset={geometry.bevelOffset}
      bevelSegments={geometry.bevelSegments}
      curveSegments={geometry.curveSegments}
      letterSpacing={geometry.letterSpacing}
    >
      {text}
      <meshPhysicalMaterial
        ref={material}
        color={tint.base}
        metalness={1}
        roughness={geometry.roughness}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={1.25}
      />
    </Text3D>
  )
}

/* ---------- plumbing ---------- */

/** Fires once the scene has actually drawn a couple of frames, so the CSS title can fade out over a finished picture. */
function Ready({ onReady }: { onReady: () => void }) {
  const count = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    if (++count.current >= 2) {
      done.current = true
      onReady()
    }
  })
  return null
}

/** On a demand loop nothing moves, but the environment bakes on frame one and shows on frame two. */
function Kick({ deps, frames = 3 }: { deps: unknown[]; frames?: number }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let n = 0
    let id = 0
    const tick = () => {
      invalidate()
      if (++n < frames) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate, frames, ...deps])
  return null
}
