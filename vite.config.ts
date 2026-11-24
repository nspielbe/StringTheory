import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps the build portable (GitHub Pages, Netlify, any static host).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5188, strictPort: true },
  // three.js is most of the bundle; one chunk keeps static hosting simple.
  build: { chunkSizeWarningLimit: 1800 },
})
