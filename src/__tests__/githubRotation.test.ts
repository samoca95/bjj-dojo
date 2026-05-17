import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { githubDestination } from '../utils/autoBackup/destinations/github'
import {
  setBackupRetentionCount,
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

beforeEach(() => {
  clearAllPrefixedStorage(window.localStorage)
  setGithubToken('tok')
  setGithubTarget({ kind: 'repo', owner: 'me', repo: 'backups' })
  setGithubBackupEnabled(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  clearAllPrefixedStorage(window.localStorage)
})

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response
}

describe('GitHub repo backup rotation', () => {
  it('deletes older dated backups beyond the retention count in the per-component subdir', async () => {
    setBackupRetentionCount(3)
    const existing = [
      1715920000001, 1715920000002, 1715920000003, 1715920000004, 1715920000005,
      1715920000006,
    ].map((n) => ({
      name: `bjj-dojo-backup-sessions-${n}.json`,
      path: `backups/sessions/bjj-dojo-backup-sessions-${n}.json`,
      type: 'file',
      sha: `sha-${n}`,
    }))

    const deletedPaths: string[] = []
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = input.toString()
        const method = init?.method ?? 'GET'
        if (
          method === 'GET' &&
          url.includes('/contents/backups/sessions/bjj-dojo-backup-')
        ) {
          return jsonResponse(404, { message: 'not found' })
        }
        if (method === 'PUT' && url.includes('/contents/')) {
          return jsonResponse(201, { content: { sha: 'new' } })
        }
        if (method === 'GET' && url.includes('/contents/backups/sessions')) {
          return jsonResponse(200, existing)
        }
        if (method === 'DELETE') {
          const path = decodeURIComponent(
            url.split('/contents/')[1].split('?')[0],
          )
          deletedPaths.push(path)
          return jsonResponse(200, { commit: {} })
        }
        return jsonResponse(404, { message: 'unhandled' })
      })

    await githubDestination.write(
      PAYLOAD,
      'bjj-dojo-backup-sessions-1715920000007.json',
    )

    // KEEP=3 → keep 2 of the existing 6 (since the new file is the 3rd).
    expect(deletedPaths.sort()).toEqual([
      'backups/sessions/bjj-dojo-backup-sessions-1715920000001.json',
      'backups/sessions/bjj-dojo-backup-sessions-1715920000002.json',
      'backups/sessions/bjj-dojo-backup-sessions-1715920000003.json',
      'backups/sessions/bjj-dojo-backup-sessions-1715920000004.json',
    ])
    expect(fetchMock).toHaveBeenCalled()
  })

  it('tolerates per-file delete failures without aborting the run', async () => {
    setBackupRetentionCount(1)
    const existing = [1715920000011, 1715920000012].map((n) => ({
      name: `bjj-dojo-backup-sessions-${n}.json`,
      path: `backups/sessions/bjj-dojo-backup-sessions-${n}.json`,
      type: 'file',
      sha: `sha-${n}`,
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input.toString()
      const method = init?.method ?? 'GET'
      if (
        method === 'GET' &&
        url.includes('/contents/backups/sessions/bjj-dojo-backup-')
      ) {
        return jsonResponse(404, {})
      }
      if (method === 'PUT') return jsonResponse(201, {})
      if (method === 'GET' && url.includes('/contents/backups/sessions')) {
        return jsonResponse(200, existing)
      }
      if (method === 'DELETE') {
        throw new Error('boom')
      }
      return jsonResponse(404, {})
    })

    await expect(
      githubDestination.write(
        PAYLOAD,
        'bjj-dojo-backup-sessions-1715920000013.json',
      ),
    ).resolves.toBeDefined()
  })
})
