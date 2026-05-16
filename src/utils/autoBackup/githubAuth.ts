/**
 * GitHub OAuth Device Flow client.
 *
 * Browser limitation: GitHub's /login/device/* endpoints are not CORS-enabled
 * for static frontend origins, so direct browser fetches always fail with a
 * network error ("Failed to fetch"). We work around this with a tiny
 * stateless proxy worker (see `oauth-proxy/` at the repo root) that forwards
 * requests to GitHub with permissive CORS. The proxy URL is baked into the
 * build via VITE_GITHUB_OAUTH_PROXY_URL; when set, requests go through it
 * instead of github.com directly. When unset (e.g. local dev without the
 * env var) the original direct fetch still runs so the CORS error surfaces
 * clearly.
 *
 * Bake the OAuth App client_id into the build via
 * VITE_GITHUB_OAUTH_CLIENT_ID. If unset, the UI must surface the
 * "not configured" path; never start polling without a client_id.
 */

const GH_DEVICE_CODE_URL = 'https://github.com/login/device/code'
const GH_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const PROXY_DEVICE_CODE_PATH = '/device/code'
const PROXY_ACCESS_TOKEN_PATH = '/access_token'
const REQUIRED_SCOPE = 'repo'
const OAUTH_BROWSER_ERROR =
  'GitHub OAuth cannot be completed from this browser build because GitHub blocks cross-origin device-flow requests (CORS). Configure VITE_GITHUB_OAUTH_PROXY_URL with a deployed proxy worker URL.'

function getProxyBaseUrl(): string | null {
  const raw = import.meta.env.VITE_GITHUB_OAUTH_PROXY_URL
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().replace(/\/$/, '')
  return trimmed.length > 0 ? trimmed : null
}

function deviceCodeEndpoint(): string {
  const proxy = getProxyBaseUrl()
  return proxy ? `${proxy}${PROXY_DEVICE_CODE_PATH}` : GH_DEVICE_CODE_URL
}

function accessTokenEndpoint(): string {
  const proxy = getProxyBaseUrl()
  return proxy ? `${proxy}${PROXY_ACCESS_TOKEN_PATH}` : GH_ACCESS_TOKEN_URL
}

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
  return getOAuthClientId() !== null
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const clientId = getOAuthClientId()
  if (!clientId) {
    throw new DeviceFlowError(
      'GitHub login is not configured in this build.',
      'not_configured',
    )
  }
  let res: Response
  try {
    res = await fetch(deviceCodeEndpoint(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, scope: REQUIRED_SCOPE }),
    })
  } catch {
    throw new DeviceFlowError(OAUTH_BROWSER_ERROR, 'network')
  }
  if (!res.ok) {
    throw new DeviceFlowError(
      `Device code request failed (${res.status}).`,
      'network',
    )
  }
  return (await res.json()) as DeviceCodeResponse
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

    let res: Response
    try {
      res = await fetch(accessTokenEndpoint(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      })
    } catch {
      throw new DeviceFlowError(OAUTH_BROWSER_ERROR, 'network')
    }
    if (!res.ok) {
      throw new DeviceFlowError(
        `Token request failed (${res.status}).`,
        'network',
      )
    }
    const body = (await res.json()) as {
      access_token?: string
      error?: string
      error_description?: string
      interval?: number
    }
    if (body.access_token) return body.access_token
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
