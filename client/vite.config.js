import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function syncAssetsPlugin() {
  return {
    name: 'sync-assets-plugin',
    configResolved() {
      try {
        const targetDir = fileURLToPath(new URL('./src/assets/images', import.meta.url))
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        const sourceFile = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\53ea15c7-03e7-417f-b024-4403e326708e\\creator_portrait_1788451833222.jpg'
        const targetFile = path.join(targetDir, 'creator.jpg')
        if (fs.existsSync(sourceFile) && !fs.existsSync(targetFile)) {
          fs.copyFileSync(sourceFile, targetFile)
        }
        const refSource = 'C:\\Users\\Asus\\.gemini\\antigravity-ide\\brain\\53ea15c7-03e7-417f-b024-4403e326708e\\.user_uploaded\\media_1788451727452.jpg'
        const refTarget = path.join(targetDir, 'hero-reference.jpg')
        if (fs.existsSync(refSource) && !fs.existsSync(refTarget)) {
          fs.copyFileSync(refSource, refTarget)
        }
      } catch (err) {
        console.warn('[sync-assets] Warning:', err.message)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [syncAssetsPlugin(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
