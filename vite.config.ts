import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isCapacitorBuild = process.env.CAPACITOR_BUILD === '1'

export default defineConfig({
  resolve: {
    alias: isCapacitorBuild
      ? {
          'virtual:pwa-register/react': fileURLToPath(
            new URL('./src/shims/pwaRegisterStub.ts', import.meta.url),
          ),
        }
      : undefined,
  },
  base: isCapacitorBuild
    ? './'
    : process.env.DEPLOY_DEV === 'true'
      ? '/bjj-dojo/dev/'
      : process.env.GITHUB_ACTIONS
        ? '/bjj-dojo/'
        : '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '1.0.0'),
  },
  plugins: [
    react(),
    // Service workers don't make sense inside a native WebView (assets are
    // already local and SWs conflict with the capacitor:// scheme).
    ...(isCapacitorBuild
      ? []
      : [
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
        ]),
  ],
})
