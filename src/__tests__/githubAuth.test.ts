import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DeviceFlowError,
  pollForToken,
  requestDeviceCode,
  isDeviceFlowConfigured,
} from '../utils/autoBackup/githubAuth'

const ORIGINAL_CLIENT_ID = import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID

beforeEach(() => {
  vi.stubEnv('VITE_GITHUB_OAUTH_CLIENT_ID', 'test-client-id')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  // Restore the .env value for downstream tests.
  if (ORIGINAL_CLIENT_ID) {
    vi.stubEnv('VITE_GITHUB_OAUTH_CLIENT_ID', ORIGINAL_CLIENT_ID)
    vi.unstubAllEnvs()
  }
})

const okJson = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response

const errResp = (status: number): Response =>
  ({
    ok: false,
    status,
    json: async () => ({ message: 'fail' }),
  }) as Response

describe('isDeviceFlowConfigured', () => {
  it('is true when VITE_GITHUB_OAUTH_CLIENT_ID is set', () => {
    expect(isDeviceFlowConfigured()).toBe(true)
  })

  it('is false when unset/empty', () => {
    vi.stubEnv('VITE_GITHUB_OAUTH_CLIENT_ID', '')
    expect(isDeviceFlowConfigured()).toBe(false)
  })
})

describe('requestDeviceCode', () => {
  it('throws not_configured when no client_id', async () => {
    vi.stubEnv('VITE_GITHUB_OAUTH_CLIENT_ID', '')
    await expect(requestDeviceCode()).rejects.toMatchObject({
      code: 'not_configured',
    })
  })

  it('returns the parsed device code response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({
        device_code: 'dev',
        user_code: 'USER-CODE',
        verification_uri: 'https://github.com/login/device',
        interval: 5,
        expires_in: 900,
      }),
    )
    const res = await requestDeviceCode()
    expect(res.user_code).toBe('USER-CODE')
    expect(res.interval).toBe(5)
  })

  it('throws DeviceFlowError on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errResp(500))
    await expect(requestDeviceCode()).rejects.toBeInstanceOf(DeviceFlowError)
  })

  it('routes requests through the proxy URL when configured', async () => {
    vi.stubEnv('VITE_GITHUB_OAUTH_PROXY_URL', 'https://oauth.test/proxy')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({
        device_code: 'dev',
        user_code: 'USER-CODE',
        verification_uri: 'https://github.com/login/device',
        interval: 5,
        expires_in: 900,
      }),
    )
    await requestDeviceCode()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://oauth.test/proxy/device/code',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('falls back to github.com directly when no proxy URL is set', async () => {
    vi.stubEnv('VITE_GITHUB_OAUTH_PROXY_URL', '')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({
        device_code: 'dev',
        user_code: 'USER-CODE',
        verification_uri: 'https://github.com/login/device',
        interval: 5,
        expires_in: 900,
      }),
    )
    await requestDeviceCode()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://github.com/login/device/code',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('pollForToken', () => {
  const noSleep = async () => {}

  it('resolves with access_token on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({ access_token: 'gho_xyz' }),
    )
    const token = await pollForToken('dev', 1, { sleep: noSleep })
    expect(token).toBe('gho_xyz')
  })

  it('retries on authorization_pending then resolves', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(okJson({ error: 'authorization_pending' }))
      .mockResolvedValueOnce(okJson({ access_token: 'gho_ok' }))
    const token = await pollForToken('dev', 1, { sleep: noSleep })
    expect(token).toBe('gho_ok')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('honours slow_down by bumping the interval', async () => {
    const sleeps: number[] = []
    const sleep = async (ms: number) => {
      sleeps.push(ms)
    }
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(okJson({ error: 'slow_down', interval: 12 }))
      .mockResolvedValueOnce(okJson({ access_token: 'gho_ok' }))
    await pollForToken('dev', 5, { sleep })
    expect(sleeps).toEqual([5_000, 12_000])
  })

  it('rejects with access_denied', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({
        error: 'access_denied',
        error_description: 'user said no',
      }),
    )
    await expect(
      pollForToken('dev', 1, { sleep: noSleep }),
    ).rejects.toMatchObject({ code: 'access_denied' })
  })

  it('rejects with expired_token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      okJson({ error: 'expired_token' }),
    )
    await expect(
      pollForToken('dev', 1, { sleep: noSleep }),
    ).rejects.toMatchObject({ code: 'expired_token' })
  })

  it('aborts when the signal is triggered', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      pollForToken('dev', 1, { sleep: noSleep, signal: controller.signal }),
    ).rejects.toBeInstanceOf(DeviceFlowError)
  })
})
