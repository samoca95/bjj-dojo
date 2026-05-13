import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/bjj-dojo/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['bjj-icon.svg', 'bjj-icon.png', 'offline.html'],
      manifest: {
        name: 'BJJ Dojo',
        short_name: 'BJJ Dojo',
        description: 'Log BJJ training sessions and browse techniques',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          {
            src: 'bjj-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cacheId: 'bjj-dojo-v1',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2}'],
        navigateFallback: 'offline.html',
      },
    }),
  ],
})
