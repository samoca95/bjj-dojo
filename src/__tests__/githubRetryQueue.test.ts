import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import { BJJDatabase } from '../db/database'
import {
  enqueueFailedGithubWrite,
  getPendingGithubWrites,
  removeGithubRetryEntry,
  clearGithubRetryQueue,
} from '../utils/autoBackup/destinations/githubRetryQueue'
import { runBackupNow, _resetSchedulerForTests } from '../utils/autoBackup'
import {
  setGithubBackupEnabled,
  setGithubTarget,
  setGithubToken,
} from '../utils/autoBackup/settings'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'
import type { DatabaseBackup } from '../db/database'

const PAYLOAD = {
  schemaSignature: 'test',
  schemaVersion: 1,
  exportedAt: 0,
  appVersion: '0',
  tables: {},
} as unknown as DatabaseBackup

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
  await clearGithubRetryQueue(db)
})

afterEach(async () => {
  await closeDb(db)
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
  vi.restoreAllMocks()
})

describe('GitHub persistent retry queue', () => {
  it('coalesces multiple failures for the same component into a single entry', async () => {
    await enqueueFailedGithubWrite(
      {
        component: 'sessions',
        filename: 'bjj-dojo-backup-sessions-1.json',
        payload: PAYLOAD,
        lastError: 'first',
      },
      db,
    )
    await enqueueFailedGithubWrite(
      {
        component: 'sessions',
        filename: 'bjj-dojo-backup-sessions-2.json',
        payload: PAYLOAD,
        lastError: 'second',
      },
      db,
    )
    const pending = await getPendingGithubWrites(db)
    expect(pending).toHaveLength(1)
    expect(pending[0].attempts).toBe(2)
    expect(pending[0].filename).toBe('bjj-dojo-backup-sessions-2.json')
    expect(pending[0].lastError).toBe('second')
  })

  it('keeps separate entries per component', async () => {
    await enqueueFailedGithubWrite(
      {
        component: 'sessions',
        filename: 'sess.json',
        payload: PAYLOAD,
        lastError: 'x',
      },
      db,
    )
    await enqueueFailedGithubWrite(
      {
        component: 'flows',
        filename: 'flows.json',
        payload: PAYLOAD,
        lastError: 'y',
      },
      db,
    )
    const pending = await getPendingGithubWrites(db)
    expect(pending.map((e) => e.component).sort()).toEqual([
      'flows',
      'sessions',
    ])
  })

  it('removes entries by id', async () => {
    await enqueueFailedGithubWrite(
      {
        component: 'sessions',
        filename: 'sess.json',
        payload: PAYLOAD,
        lastError: 'x',
      },
      db,
    )
    await removeGithubRetryEntry('sessions', db)
    expect(await getPendingGithubWrites(db)).toHaveLength(0)
  })

  it('enqueues a failed write on github destination failure during runBackupNow', async () => {
    setGithubToken('tok')
    setGithubTarget({ kind: 'gist', gistId: 'abc' })
    setGithubBackupEnabled(true)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(500, { message: 'server down' }),
    )

    const reports = await runBackupNow(db)
    expect(reports[0].success).toBe(false)
    const pending = await getPendingGithubWrites(db)
    // The first component to fail (preferences, by BACKUP_COMPONENTS order)
    // gets queued; the run aborts after the throw, so later components don't.
    expect(pending).toHaveLength(1)
    expect(pending[0].component).toBe('preferences')
  })

  it('drains the persistent queue on the next github run when the underlying error clears', async () => {
    setGithubToken('tok')
    setGithubTarget({ kind: 'gist', gistId: 'abc' })
    setGithubBackupEnabled(true)

    // Seed the queue manually.
    await enqueueFailedGithubWrite(
      {
        component: 'sessions',
        filename: 'bjj-dojo-backup-sessions-1715920000000.json',
        payload: PAYLOAD,
        lastError: 'previously failed',
      },
      db,
    )
    expect(await getPendingGithubWrites(db)).toHaveLength(1)

    // Now mock fetch to always succeed.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(200, { commit: {} }),
    )

    await runBackupNow(db)
    expect(await getPendingGithubWrites(db)).toHaveLength(0)
  })
})
