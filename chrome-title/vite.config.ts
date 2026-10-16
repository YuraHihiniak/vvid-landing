import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5178, strictPort: true },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // react on its own so the first paint needs only it; three + r3f + drei in a chunk that is
        // fetched when the 3D scene is requested
        manualChunks: (id) => {
          // the dynamic-import helper is shared by the entry and by drei; left alone it is pulled
          // into the three chunk and the entry then imports that chunk statically
          if (id.includes('vite/preload-helper')) return 'react'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(three|@react-three|three-stdlib|troika|maath|suspend-react|zustand)/.test(id)) return 'three'
          return undefined
        },
      },
    },
  },
})
