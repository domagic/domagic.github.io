import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    // 字体强制独立文件（不内联 data: URI），符合严格 CSP font-src 'self'，避免小字体被拦截
    assetsInlineLimit: (filePath: string) =>
      /\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
})