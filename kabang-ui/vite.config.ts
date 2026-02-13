import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [TanStackRouterVite(), tailwindcss(), react()],
  server: {
    proxy: {
      '/kabangs': {
        target: 'http://localhost:5674',
        changeOrigin: true,
      },
      '/bookmarks': {
        target: 'http://localhost:5674',
        changeOrigin: true,
      },
      '/search': {
        target: 'http://localhost:5674',
        changeOrigin: true,
      },
      '/suggestions': {
        target: 'http://localhost:5674',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5674',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
