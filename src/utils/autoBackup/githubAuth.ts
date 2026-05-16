/**
 * GitHub OAuth Device Flow client.
 *
 * Transport selection lives in `src/platform/githubOAuth.ts`:
 *  - Native (Capacitor) uses CapacitorHttp (no CORS).
 *  - Web uses a proxy worker when `VITE_GITHUB_OAUTH_PROXY_URL` is set,
 *    otherwise falls back to a direct browser fetch (which will fail with
 *    a CORS error against github.com — surfaced as `OAUTH_BROWSER_ERROR`).
 *
 * Bake the OAuth App client_id into the build via
 * VITE_GITHUB_OAUTH_CLIENT_ID. If unset, the UI must surface the
 * "not configured" path; never start polling without a client_id.
 */

import {
  oauthRequestDeviceCode,
  oauthPollAccessToken,
  isOAuthTransportAvailable,
} from '../../platform/githubOAuth'

const REQUIRED_SCOPE = 'repo'
const OAUTH_BROWSER_ERROR =
  'GitHub OAuth cannot be completed from this browser build because GitHub blocks cross-origin device-flow requests (CORS). Configure VITE_GITHUB_OAUTH_PROXY_URL or use the native app.'

export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  /** Seconds between polls. GitHub default is 5; honour `slow_down` bumps. */
  interval: number
  /** Seconds until device_code expires. */
  expires_in: number
}

export class DeviceFlowError extends Error {
  constructor(
    message: string,
    public code:
      | 'access_denied'
      | 'expired_token'
      | 'incorrect_device_code'
      | 'not_configured'
      | 'network'
      | 'unknown',
  ) {
    super(message)
    this.name = 'DeviceFlowError'
  }
}

export function getOAuthClientId(): string | null {
  const raw = import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isDeviceFlowConfigured(): boolean {
  return getOAuthClientId() !== null && isOAuthTransportAvailable()
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const clientId = getOAuthClientId()
  if (!clientId) {
    throw new DeviceFlowError(
      'GitHub login is not configured in this build.',
      'not_configured',
    )
  }
  let res
  try {
    res = await oauthRequestDeviceCode({
      client_id: clientId,
      scope: REQUIRED_SCOPE,
    })
  } catch {
    throw new DeviceFlowError(OAUTH_BROWSER_ERROR, 'network')
  }
  if (res.status < 200 || res.status >= 300) {
    throw new DeviceFlowError(
      `Device code request failed (${res.status}).`,
      'network',
    )
  }
  const body = res.body as Partial<DeviceCodeResponse>
  if (
    typeof body.device_code !== 'string' ||
    typeof body.user_code !== 'string' ||
    typeof body.verification_uri !== 'string'
  ) {
    throw new DeviceFlowError(OAUTH_BROWSER_ERROR, 'network')
  }
  return {
    device_code: body.device_code,
    user_code: body.user_code,
    verification_uri: body.verification_uri,
    interval: typeof body.interval === 'number' ? body.interval : 5,
    expires_in: typeof body.expires_in === 'number' ? body.expires_in : 900,
  }
}

interface PollOptions {
  signal?: AbortSignal
  /** Test seam: replaces window.setTimeout with a sync mock. */
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls GitHub's token endpoint until the user authorises, denies, or the
 * device code expires. `interval` starts from DeviceCodeResponse and is bumped
 * by 5s on every `slow_down` response per the spec.
 */
export async function pollForToken(
  deviceCode: string,
  initialIntervalSeconds: number,
  options: PollOptions = {},
): Promise<string> {
  const clientId = getOAuthClientId()
  if (!clientId) {
    throw new DeviceFlowError(
      'GitHub login is not configured in this build.',
      'not_configured',
    )
  }
  const sleep = options.sleep ?? defaultSleep
  let intervalSeconds = Math.max(1, initialIntervalSeconds)

  while (true) {
    if (options.signal?.aborted) {
      throw new DeviceFlowError('Cancelled.', 'unknown')
    }
    await sleep(intervalSeconds * 1000)
    if (options.signal?.aborted) {
      throw new DeviceFlowError('Cancelled.', 'unknown')
    }

    let res
    try {
      res = await oauthPollAccessToken({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      })
    } catch {
      throw new DeviceFlowError(OAUTH_BROWSER_ERROR, 'network')
    }
    if (res.status < 200 || res.status >= 300) {
      throw new DeviceFlowError(
        `Token request failed (${res.status}).`,
        'network',
      )
    }
    const body = res.body as {
      access_token?: string
      error?: string
      error_description?: string
      interval?: number
    }
    if (typeof body.access_token === 'string') return body.access_token
    switch (body.error) {
      case 'authorization_pending':
        continue
      case 'slow_down':
        intervalSeconds =
          typeof body.interval === 'number'
            ? body.interval
            : intervalSeconds + 5
        continue
      case 'expired_token':
        throw new DeviceFlowError(
          body.error_description ?? 'Device code expired.',
          'expired_token',
        )
      case 'access_denied':
        throw new DeviceFlowError(
          body.error_description ?? 'Authorization was denied.',
          'access_denied',
        )
      case 'incorrect_device_code':
        throw new DeviceFlowError(
          body.error_description ?? 'Invalid device code.',
          'incorrect_device_code',
        )
      default:
        throw new DeviceFlowError(
          body.error_description ?? body.error ?? 'Unknown error.',
          'unknown',
        )
    }
  }
}
