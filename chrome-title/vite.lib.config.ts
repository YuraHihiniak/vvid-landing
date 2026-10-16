// Build for the landing: `npm run build:lib` → ../vendor/chrome-title/{chrome-title.js, three.js, ChromeScene.js}
//
// The landing already runs React 18.3.1 as UMD globals (support.js loads vendor/react*.js), so the
// bundle must not carry a second copy: every `react` / `react-dom` import inside it — ours, r3f's,
// drei's, zustand's, react-reconciler's — resolves to a tiny shim that re-exports window.React.
import { createRequire } from 'node:module'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

function reactFromPageGlobals(): Plugin {
  const names = (id: string) => Object.keys(require(id)).filter((k) => k !== 'default' && /^[A-Za-z_$][\w$]*$/.test(k))
  const reexport = (global: string, id: string) =>
    `const G = window.${global};\n` +
    `if (!G) throw new Error('chrome-title: window.${global} must be loaded before this module');\n` +
    `export default G;\n` +
    names(id)
      .map((n) => `export const ${n} = G.${n};`)
      .join('\n')
  const jsx =
    `const R = window.React;\n` +
    `export const Fragment = R.Fragment;\n` +
    `export function jsx(type, props, key) {\n` +
    `  const { children, ...rest } = props;\n` +
    `  if (key !== undefined) rest.key = key;\n` +
    `  if (children === undefined) return R.createElement(type, rest);\n` +
    `  return Array.isArray(children) ? R.createElement(type, rest, ...children) : R.createElement(type, rest, children);\n` +
    `}\n` +
    `export const jsxs = jsx;\n`
  const shims: Record<string, string> = {
    react: reexport('React', 'react'),
    'react-dom': reexport('ReactDOM', 'react-dom'),
    'react-dom/client': `const D = window.ReactDOM;\nexport const createRoot = D.createRoot;\nexport const hydrateRoot = D.hydrateRoot;\nexport default { createRoot, hydrateRoot };\n`,
    'react/jsx-runtime': jsx,
    'react/jsx-dev-runtime': jsx + `export const jsxDEV = jsx;\n`,
  }
  const PREFIX = '\0page-global:'
  return {
    name: 'react-from-page-globals',
    enforce: 'pre',
    resolveId(id) {
      return id in shims ? PREFIX + id : null
    },
    load(id) {
      return id.startsWith(PREFIX) ? shims[id.slice(PREFIX.length)] : null
    },
  }
}

export default defineConfig({
  plugins: [reactFromPageGlobals(), react()],
  // lib builds leave process.env.NODE_ENV for a consumer's bundler; here the browser is the consumer
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: '../vendor/chrome-title',
    emptyOutDir: true,
    copyPublicDir: false,
    target: 'es2020',
    lib: {
      entry: 'src/lib.tsx',
      formats: ['es'],
      fileName: () => 'chrome-title.js',
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name].js',
        manualChunks: (id) => {
          // the React shims in their own tiny chunk, otherwise they land in `three` and the entry imports it eagerly
          if (id.startsWith('\0page-global:') || id.includes('vite/preload-helper')) return 'react-shim'
          if (/node_modules\/(three|@react-three|three-stdlib|troika|maath|suspend-react|zustand|its-fine|react-reconciler|scheduler|@babel\/runtime)/.test(id)) return 'three'
          return undefined
        },
      },
    },
  },
})
