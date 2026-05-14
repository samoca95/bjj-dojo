import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '**/*.tsbuildinfo',
      'public/offline.html',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Core React hook correctness rules — catch real bugs (stale closures,
      // conditional hooks). The experimental React Compiler rules bundled in
      // react-hooks v7 are intentionally left off to avoid large-scale churn.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['*.config.{ts,js}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettier,
)
