/**
 * Smoke tests for the Google Drive and Dropbox auto-backup providers.
 *
 * We stub `import.meta.env`, `window.open`, and `fetch` to exercise the
 * happy-path connect / upload / list / 401-refresh-retry flows without ever
 * talking to the real providers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'
import {
  getCloudNeedsReconnect,
  getCloudTokens,
  setCloudTokens,
} from '../utils/autoBackup/settings'

beforeEach(() => {
  clearAllPrefixedStorage(window.localStorage)
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-gdrive-client')
  vi.stubEnv('VITE_DROPBOX_APP_KEY', 'test-dropbox-key')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  clearAllPrefixedStorage(window.localStorage)
})

function fakePopupAuthorize(code = 'auth-code') {
  // Mock `window.open` and synthesize the postMessage from the callback page
  // once the listener has been attached.
  const popup = { closed: false, close: vi.fn() } as unknown as Window
  vi.spyOn(window, 'open').mockImplementation(() => {
    queueMicrotask(() => {
      // Pull the expected state out of the URL the caller passed to window.open.
      const calls = (window.open as unknown as { mock: { calls: unknown[][] } })
        .mock.calls
      const url = String(calls[calls.length - 1]?.[0] ?? '')
      const state = new URL(url).searchParams.get('state') ?? ''
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { source: 'bjj-dojo:oauth-callback', state, code },
          origin: window.location.origin,
        }),
      )
    })
    return popup
  })
}

describe('googleDriveDestination.connect', () => {
  it('exchanges the code for tokens, persists them, and ensures the app folder', async () => {
    fakePopupAuthorize()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url.startsWith('https://oauth2.googleapis.com/token')) {
          return new Response(
            JSON.stringify({
              access_token: 'access-1',
              refresh_token: 'refresh-1',
              expires_in: 3600,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (url.includes('/drive/v3/about')) {
          return new Response(
            JSON.stringify({ user: { emailAddress: 'a@b.com' } }),
            { status: 200 },
          )
        }
        if (url.includes('/drive/v3/files') && url.includes('mimeType')) {
          // Search returns empty -> caller will create.
          return new Response(JSON.stringify({ files: [] }), { status: 200 })
        }
        if (url.includes('/drive/v3/files')) {
          return new Response(JSON.stringify({ id: 'folder-id' }), {
            status: 200,
          })
        }
        return new Response('{}', { status: 200 })
      })
    const { googleDriveDestination } =
      await import('../utils/autoBackup/destinations/cloud/googleDrive')
    const { accountLabel } = await googleDriveDestination.connect()
    expect(accountLabel).toBe('a@b.com')
    expect(getCloudTokens('googleDrive')?.accessToken).toBe('access-1')
    expect(getCloudTokens('googleDrive')?.refreshToken).toBe('refresh-1')
    expect(getCloudNeedsReconnect('googleDrive')).toBe(false)
    expect(fetchMock).toHaveBeenCalled()
  })
})

describe('dropboxDestination.connect', () => {
  it('exchanges the code, persists tokens, fetches the account label', async () => {
    fakePopupAuthorize()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url === 'https://api.dropboxapi.com/oauth2/token') {
        return new Response(
          JSON.stringify({
            access_token: 'dbx-access',
            refresh_token: 'dbx-refresh',
            expires_in: 14400,
          }),
          { status: 200 },
        )
      }
      if (url.endsWith('/users/get_current_account')) {
        return new Response(JSON.stringify({ email: 'me@example.com' }), {
          status: 200,
        })
      }
      return new Response('{}', { status: 200 })
    })
    const { dropboxDestination } =
      await import('../utils/autoBackup/destinations/cloud/dropbox')
    const { accountLabel } = await dropboxDestination.connect()
    expect(accountLabel).toBe('me@example.com')
    expect(getCloudTokens('dropbox')?.accessToken).toBe('dbx-access')
    expect(getCloudTokens('dropbox')?.refreshToken).toBe('dbx-refresh')
  })
})

describe('cloud provider 401 → refresh → retry', () => {
  it('refreshes the access token transparently when a request returns 401', async () => {
    setCloudTokens('googleDrive', {
      accessToken: 'expired',
      refreshToken: 'still-good',
      expiresAt: Date.now() + 60_000, // not yet expired by clock
    })
    let listCalls = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      const auth = (init?.headers as Record<string, string> | undefined)?.[
        'Authorization'
      ]
      if (url.startsWith('https://oauth2.googleapis.com/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'refreshed',
            refresh_token: 'still-good',
            expires_in: 3600,
          }),
          { status: 200 },
        )
      }
      if (url.includes('/drive/v3/files')) {
        listCalls += 1
        if (auth === 'Bearer expired') {
          return new Response('Unauthorized', { status: 401 })
        }
        return new Response(JSON.stringify({ files: [] }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    })
    const { googleDriveDestination } =
      await import('../utils/autoBackup/destinations/cloud/googleDrive')
    const backups = await googleDriveDestination.discoverExistingBackups()
    expect(backups).toEqual([])
    expect(listCalls).toBeGreaterThanOrEqual(2) // first 401, retry succeeded
    expect(getCloudTokens('googleDrive')?.accessToken).toBe('refreshed')
    expect(getCloudNeedsReconnect('googleDrive')).toBe(false)
  })

  it('marks needs-reconnect when refresh itself fails', async () => {
    setCloudTokens('googleDrive', {
      accessToken: 'expired',
      refreshToken: 'rotten',
      expiresAt: Date.now() + 60_000,
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.startsWith('https://oauth2.googleapis.com/token')) {
        return new Response('Invalid grant', { status: 400 })
      }
      if (url.includes('/drive/v3/files')) {
        return new Response('Unauthorized', { status: 401 })
      }
      return new Response('{}', { status: 200 })
    })
    const { googleDriveDestination } =
      await import('../utils/autoBackup/destinations/cloud/googleDrive')
    // discoverExistingBackups swallows errors and returns [] (best-effort
    // restore), but the refresh attempt should still flag needs-reconnect.
    const result = await googleDriveDestination.discoverExistingBackups()
    expect(result).toEqual([])
    expect(getCloudNeedsReconnect('googleDrive')).toBe(true)
  })
})

describe('googleDriveDestination.disconnect', () => {
  it('clears local tokens and revokes via the Google revoke endpoint', async () => {
    setCloudTokens('googleDrive', {
      accessToken: 'tok',
      refreshToken: 'r',
      expiresAt: Date.now() + 60_000,
    })
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))
    const { googleDriveDestination } =
      await import('../utils/autoBackup/destinations/cloud/googleDrive')
    await googleDriveDestination.disconnect()
    expect(getCloudTokens('googleDrive')).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('oauth2.googleapis.com/revoke'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
