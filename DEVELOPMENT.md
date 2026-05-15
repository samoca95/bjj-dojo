# Development Guide

This document covers developer-focused setup and technical details for BJJ Dojo.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Dexie + dexie-react-hooks (IndexedDB)
- React Router
- vite-plugin-pwa
- Vitest + Testing Library + jsdom
- ESLint + Prettier

## Scripts

```bash
npm run dev            # Start local dev server
npm run build          # Type-check + production build
npm run preview        # Preview production build
npm test               # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage thresholds
npm run typecheck      # TypeScript type-check only
npm run lint           # ESLint
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check
npm run check          # Full local gate: lint + format check + tests + build
```

## Architecture Overview

### App & Routing

- `src/App.tsx` uses a hash router (`createHashRouter`) for GitHub Pages subpath compatibility.
- Pages are lazy-loaded and rendered inside `src/components/Layout.tsx`.

### Data Layer

- `src/db/database.ts` defines a single Dexie database (`bjj-dojo`).
- Schema is versioned with Dexie `version(N).stores(...)` blocks.
- To evolve schema, add a **new** version block with migration logic.

### Prefilled Library

- `src/db/prefilled.ts` contains seed categories/techniques/connections.
- Prefilled data is synced while preserving user-created records (`isCustom: true`).

### Caching

- `src/db/categoryCache.ts` caches category maps at module level.
- Mutations to categories must invalidate the cache.

### Validation & Import/Export

- `database.ts` enforces strict field validators for backup import.
- Import validates all records before writing and then replaces table data.

### Types

- Domain unions and UI maps live in `src/types/index.ts`.
- If enum members are added, update both type definitions and validator sets.

### i18n

- Base language is English.
- Translation keys are English strings.
- Language packs are in `src/i18n/languages/` and must maintain full key coverage.

### Preferences Sync

- Non-domain settings are stored in `localStorage` with `bjj-dojo:` keys.
- Cross-component updates are synchronized via `CustomEvent` + `storage` listeners.

### PWA / Deployment

- PWA is configured in `vite.config.ts` (`registerType: 'autoUpdate'`).
- GitHub Pages build uses `/bjj-dojo/` base path under GitHub Actions.

## Testing Notes

- Test runner: Vitest.
- Browser-like environment: jsdom + fake IndexedDB.
- Use helpers in `src/test/testDb.ts` for isolated database instances in tests.

## CI Overview

The CI workflow runs:

1. Lint
2. Format check
3. Tests
4. Build

## Repository Entry Points

- App bootstrap: `src/main.tsx`
- Root app shell and routing: `src/App.tsx`
- Layout and persistent UI: `src/components/Layout.tsx`
- Database + migrations: `src/db/database.ts`

## Documentation Split

- User/product overview: `README.md`
- Developer/technical guide: `DEVELOPMENT.md`
