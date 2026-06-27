import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 5173,
    host: process.env.DOCKER ? '0.0.0.0' : 'localhost',
    open: !process.env.DOCKER,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
