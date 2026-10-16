/**
 * Standalone entry for pages without a bundler (the VVID landing): one ES module that takes React
 * from the page (`window.React` / `window.ReactDOM`, see vite.lib.config.ts), injects its own CSS,
 * and mounts the title into a DOM node. three/r3f/drei stay in a separate chunk the module fetches
 * on its own when a capable device scrolls the title near the viewport.
 *
 *   const m = await import('./vendor/chrome-title/chrome-title.js')
 *   const title = m.mount(el, { text: '…', fontUrl: './vendor/chrome-title/unbounded-black.typeface.json' })
 *   title.update({ text: '…' }); title.unmount()
 */
import { createRoot } from 'react-dom/client'
import { ChromeTitle } from './chrome-title/ChromeTitle'
import type { ChromeTitleProps } from './chrome-title/types'
import css from './chrome-title/chrome-title.css?inline'

export type { ChromeTitleProps, TintSpec, TintName, FallbackReason, RenderMode } from './chrome-title/types'
export { ChromeTitle, TINTS, DEFAULT_GEOMETRY, TOUCH_GEOMETRY, probeWebGL, probeDevice } from './chrome-title'

export interface ChromeTitleHandle {
  update: (next: Partial<ChromeTitleProps>) => void
  unmount: () => void
}

let styled = false

export function mount(el: HTMLElement, props: ChromeTitleProps): ChromeTitleHandle {
  if (!styled) {
    const style = document.createElement('style')
    style.dataset.chromeTitle = ''
    style.textContent = css
    document.head.appendChild(style)
    styled = true
  }
  const root = createRoot(el)
  let current = props
  const render = () => root.render(<ChromeTitle {...current} />)
  render()
  return {
    update(next) {
      current = { ...current, ...next }
      render()
    },
    unmount() {
      root.unmount()
    },
  }
}
