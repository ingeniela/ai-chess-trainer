import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const buildBase = process.env.VITE_BASE_PATH || '/ai-chess-trainer/'

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? buildBase : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'AI Chess Trainer',
        short_name: 'Chess Trainer',
        description:
          'Play, analyze and train chess in your browser with Stockfish 18 and an AI coach.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: './',
        scope: './',
        categories: ['education', 'games'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell and the Stockfish engine so play and
        // analysis keep working offline.
        globPatterns: ['**/*.{js,css,html,svg,png,wasm}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/(quiz|tutorial)\/.+\.json$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'training-content',
              expiration: { maxEntries: 200 },
            },
          },
        ],
      },
    }),
  ],
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
