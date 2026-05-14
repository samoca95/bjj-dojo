# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BJJ Dojo is an offline-first PWA for tracking Brazilian Jiu-Jitsu training sessions and browsing a technique library. All data lives in the browser's IndexedDB — there is no backend.

Stack: React 18 + TypeScript + Vite, Tailwind CSS, Dexie (IndexedDB), React Router, `vite-plugin-pwa`.

## Commands

```bash
npm run dev            # Vite dev server (http://localhost:5173)
npm run build          # tsc -b (type-check) then vite build
npm test               # vitest run — full suite once
npm run test:watch     # vitest in watch mode
npm run test:coverage  # vitest run with v8 coverage
npm run preview        # serve the production build locally
```

Run a single test file or filter by name:

```bash
npx vitest run src/__tests__/database.test.ts
npx vitest run -t "imports a backup"
```

There is no separate lint step — type-checking is done by `tsc -b` as part of `npm run build`. CI (`.github/workflows/ci.yml`) runs `npm test` then `npm run build` on every PR.

## Architecture

### Routing
`src/App.tsx` defines a **hash router** (`createHashRouter`) — required because the app is served from a GitHub Pages subpath. All pages are `lazy()`-loaded and render inside `src/components/Layout.tsx`, which also hosts the bottom nav, offline notice, PWA update prompt, undo snackbar, and the first-launch setup / onboarding flows.

### Data layer (`src/db/`)
- `database.ts` — a single Dexie database named `bjj-dojo`. The schema is **versioned**: each `this.version(N).stores({...})` block is immutable history. To change the schema, add a *new* version block with an `.upgrade()` migration; never edit an existing one. The exported `db` singleton is used app-wide; tests use isolated instances (see Testing).
- `prefilled.ts` — the seed technique library (`prefilledCategories`, `prefilledTechniques`, `prefilledConnections`). Prefilled records use fixed IDs (techniques are numbered by category: 1xx Guards, 2xx Passing, etc.). Seeded via Dexie's `on('populate')`; later schema versions re-sync prefilled data via `.upgrade()` while preserving user-created records (`isCustom: true`). `resetPrefilledTechniques()` restores them on demand without touching custom data.
- `categoryCache.ts` — module-level `Map` cache of categories. After any mutation to the `categories` table, call `invalidateCategoryCache()`. `getCategoryMap()` still calls `db.categories.count()` on cache hits so `useLiveQuery` keeps observing the table.
- Backup import/export (`exportDatabaseBackup` / `importDatabaseBackup` in `database.ts`) — every record type has a strict per-field validator that throws a user-facing message; **all records are validated before any write**, and import wipes every table then `bulkAdd`s.

Components read data reactively with `useLiveQuery` from `dexie-react-hooks`.

### Types (`src/types/index.ts`)
Domain enums (`Difficulty`, `SessionType`, `ConnectionType`, `TapType`) are string-literal unions, each paired with `*_LABELS` / `*_COLORS` / `*_ICONS` lookup maps. The validators in `database.ts` keep their own `VALID_*` sets — update both when adding an enum member.

### i18n (`src/i18n/`)
English is the base language: **translation keys are the English strings themselves**. Language packs live in `src/i18n/languages/` (`en`, `es`, `fr`) and must satisfy `LanguagePack` — TypeScript enforces full key coverage. The header comment in `src/i18n/index.ts` documents the exact steps to add a language. Current language is read from `localStorage` via `getAppLanguage()` and consumed through the `useI18n()` hook.

### Preferences & cross-component sync
Settings that aren't domain data (theme, language, belt rank, home section order/visibility, weekly mat-time goal, session-type icons, telemetry opt-in, onboarding flags) are stored in `localStorage` under `bjj-dojo:`-prefixed keys. They are synced across mounted components by dispatching a matching `CustomEvent` on `window` (e.g. `setAppTheme` writes the key then fires `bjj-dojo:theme-updated`); hooks listen for both that event and the native `storage` event. There is no global store/context for these — follow the existing event pattern when adding one.

### PWA & deployment
`vite-plugin-pwa` is configured in `vite.config.ts` with `registerType: 'autoUpdate'` and `offline.html` as the navigation fallback. `deploy.yml` builds and publishes to GitHub Pages on push to `main`; the build sets `base: '/bjj-dojo/'` when the `GITHUB_ACTIONS` env var is present. `__APP_VERSION__` is a global injected from `package.json`.

## Testing

Vitest + jsdom + Testing Library. `src/test/setup.ts` loads `@testing-library/jest-dom` and `fake-indexeddb/auto`. Use `makeTestDb()` / `openDb()` / `closeDb()` from `src/test/testDb.ts` to get a fresh, isolated `BJJDatabase` per test — most data-layer and page functions accept an optional `database` argument so tests can inject one. Test files live in `src/__tests__/` and match `src/**/*.test.{ts,tsx}`.

## Git workflow

Active development branch: `claude/add-claude-documentation-l163F`. Push with `git push -u origin <branch>`. Do not open pull requests unless explicitly asked.
