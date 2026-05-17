import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { githubDestination } from '../utils/autoBackup/destinations/github'
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

describe('GitHub repo writes — SHA conflict retry', () => {
  it('re-fetches the SHA and retries when the PUT returns 409', async () => {
    let shaFetchCount = 0
    let putCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input.toString()
      const method = init?.method ?? 'GET'
      // SHA fetch on the target file
      if (method === 'GET' && url.includes('bjj-dojo-backup-sessions-')) {
        shaFetchCount++
        return jsonResponse(200, { sha: `sha-${shaFetchCount}` })
      }
      if (method === 'PUT' && url.includes('/contents/')) {
        putCount++
        if (putCount === 1) {
          return jsonResponse(409, { message: 'sha conflict' })
        }
        return jsonResponse(201, { content: { sha: 'committed' } })
      }
      // Rotation lookup
      if (method === 'GET' && url.includes('/contents/backups/sessions')) {
        return jsonResponse(404, {})
      }
      return jsonResponse(404, { message: 'unhandled' })
    })

    const result = await githubDestination.write(
      PAYLOAD,
      'bjj-dojo-backup-sessions-1715920000007.json',
    )
    expect(result.filename).toContain('backups/sessions/')
    expect(shaFetchCount).toBe(2)
    expect(putCount).toBe(2)
  })

  it('surfaces non-conflict failures without retrying', async () => {
    let putCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input.toString()
      const method = init?.method ?? 'GET'
      if (method === 'GET' && url.includes('bjj-dojo-backup-sessions-')) {
        return jsonResponse(404, {})
      }
      if (method === 'PUT' && url.includes('/contents/')) {
        putCount++
        return jsonResponse(500, { message: 'internal server error' })
      }
      return jsonResponse(404, {})
    })

    await expect(
      githubDestination.write(
        PAYLOAD,
        'bjj-dojo-backup-sessions-1715920000008.json',
      ),
    ).rejects.toThrow(/500/)
    expect(putCount).toBe(1)
  })

  it('gives up after exhausting all SHA retry attempts', async () => {
    let putCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input.toString()
      const method = init?.method ?? 'GET'
      if (method === 'GET' && url.includes('bjj-dojo-backup-sessions-')) {
        return jsonResponse(200, { sha: `sha-${putCount}` })
      }
      if (method === 'PUT' && url.includes('/contents/')) {
        putCount++
        return jsonResponse(409, { message: 'sha conflict' })
      }
      return jsonResponse(404, {})
    })

    await expect(
      githubDestination.write(
        PAYLOAD,
        'bjj-dojo-backup-sessions-1715920000009.json',
      ),
    ).rejects.toThrow(/409/)
    expect(putCount).toBe(3) // 1 initial + 2 retries
  })
})
