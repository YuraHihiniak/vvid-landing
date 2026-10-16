import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import type { FallbackReason } from './types'

export type Verdict = { ok: true } | { ok: false; reason: FallbackReason }

/** Real WebGL, not a software rasteriser: those render the chrome at 5 fps and the CSS version looks better. */
export function probeWebGL(): Verdict {
  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' }
  try {
    const canvas = document.createElement('canvas')
    const attrs = { failIfMajorPerformanceCaveat: true }
    const gl = (canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs)) as WebGLRenderingContext | null
    if (!gl) return { ok: false, reason: 'no-webgl' }
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer)) {
      return { ok: false, reason: 'software-renderer' }
    }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'webgl-error' }
  }
}

/** Cheap hints that the device would rather not run a 200k-triangle hero. */
export function probeDevice(): Verdict {
  if (typeof navigator === 'undefined') return { ok: false, reason: 'ssr' }
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean }
    deviceMemory?: number
  }
  if (nav.connection?.saveData) return { ok: false, reason: 'save-data' }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 2) return { ok: false, reason: 'low-memory' }
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) {
    return { ok: false, reason: 'few-cores' }
  }
  return { ok: true }
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

/**
 * Whether the element intersects the viewport (grown by `rootMargin`).
 * `sticky` latches on the first hit — for "start loading", as opposed to "is on screen".
 */
export function useIntersection(ref: RefObject<Element>, rootMargin: string, sticky: boolean): boolean {
  const [hit, setHit] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setHit(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting)
        if (on) {
          setHit(true)
          if (sticky) io.disconnect()
        } else if (!sticky) {
          setHit(false)
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, sticky])
  return hit
}

/** Content-box size of an element, live. */
export function useElementSize(ref: RefObject<HTMLElement>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setSize((s) => (s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height }))
    }
    read()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', read)
      return () => window.removeEventListener('resize', read)
    }
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
