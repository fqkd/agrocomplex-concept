import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/agrocomplex-concept/',
  build: {
    rollupOptions: {
      input: {
        app: 'index.html',
        case: 'case/index.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
})
