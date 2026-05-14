import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**'],
        exclude: ['src/test/**'],
        // Floor set just below the current baseline so it catches regressions
        // without breaking CI on minor variance. Raise as coverage improves.
        thresholds: {
          statements: 45,
          branches: 40,
          functions: 38,
          lines: 47,
        },
      },
    },
  }),
)
