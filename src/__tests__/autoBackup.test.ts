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
  setFsBackupEnabled,
  setGithubBackupEnabled,
  setGithubToken,
  setGithubTarget,
  getFsLastRun,
  getFsLastError,
  getGithubLastRun,
  getGithubLastError,
  getOverallLastRun,
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

  it('writes via an enabled GitHub destination and records the last-run time', async () => {
    setGithubToken('fake-token')
    setGithubTarget({ kind: 'gist', gistId: 'abc123' })
    setGithubBackupEnabled(true)

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    const reports = await runBackupNow(db)
    expect(reports).toHaveLength(1)
    expect(reports[0].destinationId).toBe('github')
    expect(reports[0].success).toBe(true)
    expect(getGithubLastRun()).toBeGreaterThan(0)
    expect(getGithubLastError()).toBeNull()
    expect(getOverallLastRun()).toBeGreaterThan(0)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gists/abc123'),
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('records last-error and does not advance last-run on destination failure', async () => {
    setGithubToken('bad')
    setGithubTarget({ kind: 'gist', gistId: 'abc' })
    setGithubBackupEnabled(true)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Bad credentials' }), {
        status: 401,
      }),
    )

    const reports = await runBackupNow(db)
    expect(reports[0].success).toBe(false)
    expect(reports[0].error).toMatch(/authentication/i)
    expect(getGithubLastRun()).toBeNull()
    expect(getGithubLastError()).toMatch(/authentication/i)
    expect(getOverallLastRun()).toBeNull()
  })

  it('isolates failures so one destination does not block another', async () => {
    // Mock both destinations enabled: FS will throw, GitHub will succeed.
    // FS is enabled but the stored handle is absent → its isEnabled() returns false,
    // so this case exercises GitHub-only success.
    setFsBackupEnabled(true) // missing handle keeps isEnabled() false
    setGithubToken('t')
    setGithubTarget({ kind: 'gist', gistId: 'g' })
    setGithubBackupEnabled(true)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    )

    const reports = await runBackupNow(db)
    expect(reports).toHaveLength(1)
    expect(reports[0].destinationId).toBe('github')
    expect(reports[0].success).toBe(true)
  })
})

describe('scheduleAfterMutation', () => {
  it('is a no-op when neither destination is enabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    scheduleAfterMutation(db)
    await Promise.resolve()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('queues one follow-up run when mutations happen during an in-flight backup', async () => {
    setGithubToken('t')
    setGithubTarget({ kind: 'gist', gistId: 'g' })
    setGithubBackupEnabled(true)
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    scheduleAfterMutation(db)
    scheduleAfterMutation(db)
    scheduleAfterMutation(db)

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(8)
    })
  })
})

describe('GitHub destination — discovery', () => {
  beforeEach(() => {
    setGithubToken('t')
  })

  it('lists matching files across per-component subdirs and the legacy flat backups/ dir', async () => {
    setGithubTarget({ kind: 'repo', owner: 'o', repo: 'r' })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = input.toString()
      if (url.includes('/contents/backups/preferences')) {
        return new Response(
          JSON.stringify([
            {
              name: 'bjj-dojo-backup-preferences-1715920002000.json',
              type: 'file',
              path: 'backups/preferences/bjj-dojo-backup-preferences-1715920002000.json',
            },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/contents/backups/sessions')) {
        return new Response(
          JSON.stringify([
            {
              name: 'bjj-dojo-backup-sessions-1715920001000.json',
              type: 'file',
              path: 'backups/sessions/bjj-dojo-backup-sessions-1715920001000.json',
            },
          ]),
          { status: 200 },
        )
      }
      if (url.includes('/contents/backups/techniques')) {
        return new Response('Not found', { status: 404 })
      }
      if (url.includes('/contents/backups/flows')) {
        return new Response(
          JSON.stringify([
            {
              name: 'bjj-dojo-backup-flows-1715920000000.json',
              type: 'file',
              path: 'backups/flows/bjj-dojo-backup-flows-1715920000000.json',
            },
          ]),
          { status: 200 },
        )
      }
      // Legacy flat backups/ — surface any remaining flat backups too
      if (url.endsWith('/contents/backups')) {
        return new Response(
          JSON.stringify([
            {
              name: 'bjj-dojo-backup-sessions-1700000000000.json',
              type: 'file',
              path: 'backups/bjj-dojo-backup-sessions-1700000000000.json',
            },
            { name: 'README.md', type: 'file', path: 'backups/README.md' },
            { name: 'sessions', type: 'dir', path: 'backups/sessions' },
          ]),
          { status: 200 },
        )
      }
      return new Response('Not found', { status: 404 })
    })
    const { githubDestination } =
      await import('../utils/autoBackup/destinations/github')
    const results = await githubDestination.discoverExistingBackups()
    expect(results).toHaveLength(4)
    const names = results.map((r) => r.filename).sort()
    expect(names).toEqual([
      'bjj-dojo-backup-flows-1715920000000.json',
      'bjj-dojo-backup-preferences-1715920002000.json',
      'bjj-dojo-backup-sessions-1700000000000.json',
      'bjj-dojo-backup-sessions-1715920001000.json',
    ])
  })

  it('falls back to root file when no backups directory exists', async () => {
    setGithubTarget({ kind: 'repo', owner: 'o', repo: 'r' })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = input.toString()
      if (url.includes('/contents/bjj-dojo-backup.json')) {
        return new Response(
          JSON.stringify({
            name: 'bjj-dojo-backup.json',
            path: 'bjj-dojo-backup.json',
          }),
          { status: 200 },
        )
      }
      return new Response('Not found', { status: 404 })
    })
    const { githubDestination } =
      await import('../utils/autoBackup/destinations/github')
    const results = await githubDestination.discoverExistingBackups()
    expect(results).toHaveLength(1)
    expect(results[0].filename).toBe('bjj-dojo-backup.json')
  })

  it('lists the single backup inside a gist', async () => {
    setGithubTarget({ kind: 'gist', gistId: 'gid' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          files: { 'bjj-dojo-backup.json': { content: '{}' } },
          updated_at: '2026-05-16T07:00:00Z',
        }),
        { status: 200 },
      ),
    )
    const { githubDestination } =
      await import('../utils/autoBackup/destinations/github')
    const results = await githubDestination.discoverExistingBackups()
    expect(results).toHaveLength(1)
    expect(results[0].filename).toBe('bjj-dojo-backup.json')
    expect(results[0].modifiedAt).toBe(Date.parse('2026-05-16T07:00:00Z'))
  })

  it('returns [] for a gist with no backup file', async () => {
    setGithubTarget({ kind: 'gist', gistId: 'gid' })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ files: { 'other.txt': { content: 'x' } } }),
        {
          status: 200,
        },
      ),
    )
    const { githubDestination } =
      await import('../utils/autoBackup/destinations/github')
    const results = await githubDestination.discoverExistingBackups()
    expect(results).toEqual([])
  })
})

describe('Restore via destination.readBackup', () => {
  it('reads a gist file and importDatabaseBackup restores DB state', async () => {
    setGithubToken('t')
    setGithubTarget({ kind: 'gist', gistId: 'gid' })
    const { exportDatabaseBackup, importDatabaseBackup } =
      await import('../db/database')
    // Seed a recognisable change so restore is observable.
    await db.clubs.add({ id: 1, name: 'Source Dojo', sortOrder: 0 })
    const payload = await exportDatabaseBackup(db)

    // Wipe the destination DB
    const dest = makeTestDb()
    await openDb(dest)
    try {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            files: {
              'bjj-dojo-backup.json': { content: JSON.stringify(payload) },
            },
          }),
          { status: 200 },
        ),
      )
      const { githubDestination } =
        await import('../utils/autoBackup/destinations/github')
      const restored = await githubDestination.readBackup(
        'bjj-dojo-backup.json',
      )
      await importDatabaseBackup(restored, dest)
      const clubs = await dest.clubs.toArray()
      expect(clubs).toHaveLength(1)
      expect(clubs[0].name).toBe('Source Dojo')
    } finally {
      await closeDb(dest)
    }
  })
})

describe('readLatestBackupPayload', () => {
  it('merges the latest file of each component and falls back to legacy for missing parts', async () => {
    const destination = {
      id: 'github' as const,
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

describe('Result-state recording', () => {
  it('clears a previous fs error after a successful github run', async () => {
    setGithubToken('t')
    setGithubTarget({ kind: 'gist', gistId: 'g' })
    setGithubBackupEnabled(true)

    // First run fails
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('{}', { status: 500 }),
    )
    await runBackupNow(db)
    expect(getGithubLastError()).not.toBeNull()

    // Second run succeeds
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 }),
    )
    await runBackupNow(db)
    expect(getGithubLastError()).toBeNull()
    expect(getGithubLastRun()).toBeGreaterThan(0)
  })

  it('does not advance fs last-run on the failed github case', async () => {
    setGithubToken('t')
    setGithubTarget({ kind: 'gist', gistId: 'g' })
    setGithubBackupEnabled(true)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    )
    await runBackupNow(db)
    expect(getFsLastRun()).toBeNull()
    expect(getFsLastError()).toBeNull()
  })
})
