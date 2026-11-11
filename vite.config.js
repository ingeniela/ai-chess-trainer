import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const buildBase = process.env.VITE_BASE_PATH || '/ai-chess-trainer/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? buildBase : '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app updates don't invalidate these caches.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (/[\/]node_modules[\/](react|react-dom|scheduler)[\/]/.test(id))
            return 'react'
          if (/chess\.js|react-chessboard/.test(id)) return 'chess'
          if (/@google[\/]genai/.test(id)) return 'gemini'
          if (/react-markdown|remark|micromark|mdast|unified|hast|vfile|unist/.test(id))
            return 'markdown'
          if (/radix-ui|@radix-ui|lucide-react|sonner/.test(id)) return 'ui'
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}))
