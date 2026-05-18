import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import { BJJDatabase } from '../db/database'
import type { DatabaseBackup } from '../db/database'
import {
  readLatestBackupPayload,
  runBackupNow,
  scheduleAfterMutation,
  _resetSchedulerForTests,
} from '../utils/autoBackup'
import {
  getOverallLastRun,
  purgeLegacyAutoBackupKeys,
} from '../utils/autoBackup/settings'
import { backupFilenameForComponent } from '../utils/autoBackup/files'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
})

afterEach(async () => {
  await closeDb(db)
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
  vi.restoreAllMocks()
})

describe('backupFilenameForComponent', () => {
  it('produces a stable bjj-dojo-backup-<component>-<timestamp>.json filename', () => {
    const filename = backupFilenameForComponent('sessions', 1_715_920_000_000)
    expect(filename).toBe('bjj-dojo-backup-sessions-1715920000000.json')
  })
})

describe('runBackupNow', () => {
  it('returns empty when no destinations are enabled', async () => {
    const reports = await runBackupNow(db)
    expect(reports).toEqual([])
    expect(getOverallLastRun()).toBeNull()
  })
})

describe('scheduleAfterMutation', () => {
  it('is a no-op when no destination is enabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    scheduleAfterMutation(db)
    await Promise.resolve()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('readLatestBackupPayload', () => {
  it('merges the latest file of each component and falls back to legacy for missing parts', async () => {
    const destination = {
      id: 'googleDrive' as const,
      isEnabled: () => true,
      write: vi.fn(),
      discoverExistingBackups: vi.fn(async () => [
        {
          id: 'legacy',
          filename: 'bjj-dojo-backup-2026-05-16.json',
          label: 'legacy',
        },
        {
          id: 'tech',
          filename: 'bjj-dojo-backup-techniques-1715920000000.json',
          label: 'tech',
        },
      ]),
      readBackup: vi.fn(async (id: string): Promise<DatabaseBackup> => {
        if (id === 'legacy')
          return {
            version: 2,
            exportedAt: 1,
            categories: [{ id: 1, name: 'Guards', description: '' }],
            techniques: [],
            techniqueConnections: [],
            sessions: [
              {
                id: 1,
                date: 1,
                durationMinutes: 60,
                sessionType: 'GI',
                notes: '',
                energyLevel: 3,
              },
            ],
            sessionTechniques: [],
            sessionTaps: [],
            sessionFlows: [],
            sessionFlowTaps: [],
            clubs: [],
            drillPlans: [],
            flows: [],
            preferences: { 'bjj-dojo:user-name': 'Ana' },
          }
        return {
          version: 2,
          exportedAt: 2,
          component: 'techniques',
          categories: [{ id: 1, name: 'Updated', description: '' }],
          techniques: [],
          techniqueConnections: [],
          sessions: [],
          sessionTechniques: [],
          sessionTaps: [],
          sessionFlows: [],
          sessionFlowTaps: [],
          clubs: [],
          drillPlans: [],
          flows: [],
          preferences: {},
        }
      }),
    }
    const merged = await readLatestBackupPayload(destination)
    expect(merged.sessions).toHaveLength(1)
    expect(merged.categories?.[0].name).toBe('Updated')
    expect(merged.preferences?.['bjj-dojo:user-name']).toBe('Ana')
  })
})

describe('purgeLegacyAutoBackupKeys', () => {
  it('removes leftover GitHub keys without touching other prefs', () => {
    window.localStorage.setItem('bjj-dojo:auto-backup-github-enabled', '1')
    window.localStorage.setItem('bjj-dojo:auto-backup-github-token', 'xyz')
    window.localStorage.setItem('bjj-dojo:user-name', 'Ana')
    purgeLegacyAutoBackupKeys()
    expect(
      window.localStorage.getItem('bjj-dojo:auto-backup-github-enabled'),
    ).toBeNull()
    expect(
      window.localStorage.getItem('bjj-dojo:auto-backup-github-token'),
    ).toBeNull()
    expect(window.localStorage.getItem('bjj-dojo:user-name')).toBe('Ana')
  })
})
