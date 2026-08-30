import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@futbolismo/core/env': fileURLToPath(
        new URL('../../packages/core/src/env.ts', import.meta.url),
      ),
      '@futbolismo/core': fileURLToPath(
        new URL('../../packages/core/src', import.meta.url),
      ),
    },
  },
})
