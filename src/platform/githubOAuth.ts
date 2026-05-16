/**
 * Cross-platform transport for the GitHub OAuth device flow.
 *
 * GitHub's `/login/device/code` and `/login/oauth/access_token` endpoints
 * are NOT CORS-enabled, so a browser `fetch` against github.com fails with
 * a network error in every web build. We work around this with two
 * different transports:
 *
 *   - Native (Capacitor): use `CapacitorHttp`, which dispatches the request
 *     from native code. No CORS, no proxy.
 *   - Web (PWA):  POST to a tiny stateless proxy worker whose URL is baked
 *     into the build via `VITE_GITHUB_OAUTH_PROXY_URL`. The worker forwards
 *     the request to GitHub and re-emits the JSON response with permissive
 *     CORS headers. See `oauth-proxy/` in the repo root.
 *
 * When neither transport is available (web build with no proxy URL, e.g.
 * local dev), we fall back to a direct `fetch` so the existing CORS error
 * still surfaces clearly instead of silently doing nothing.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core'

const DEVICE_CODE_PATH = '/device/code'
const ACCESS_TOKEN_PATH = '/access_token'
const GH_DEVICE_CODE_URL = 'https://github.com/login/device/code'
const GH_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export interface OAuthJsonResponse {
  status: number
  body: Record<string, unknown>
}

function getProxyBaseUrl(): string | null {
  const raw = import.meta.env.VITE_GITHUB_OAUTH_PROXY_URL
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim().replace(/\/$/, '')
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Returns true if there is a viable transport for OAuth on the current
 * platform. The UI uses this to decide whether to surface the "GitHub
 * login is not available in this build" message before any network calls.
 */
export function isOAuthTransportAvailable(): boolean {
  if (Capacitor.isNativePlatform()) return true
  return getProxyBaseUrl() !== null
}

async function postJsonNative(
  url: string,
  body: Record<string, unknown>,
): Promise<OAuthJsonResponse> {
  const res = await CapacitorHttp.post({
    url,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: body,
  })
  const parsed =
    typeof res.data === 'string'
      ? safeJson(res.data)
      : (res.data as Record<string, unknown>)
  return { status: res.status, body: parsed }
}

async function postJsonWeb(
  url: string,
  body: Record<string, unknown>,
): Promise<OAuthJsonResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: safeJson(text) }
}

function safeJson(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through
  }
  return {}
}

export async function oauthRequestDeviceCode(
  body: Record<string, unknown>,
): Promise<OAuthJsonResponse> {
  if (Capacitor.isNativePlatform()) {
    return postJsonNative(GH_DEVICE_CODE_URL, body)
  }
  const proxy = getProxyBaseUrl()
  const url = proxy ? `${proxy}${DEVICE_CODE_PATH}` : GH_DEVICE_CODE_URL
  return postJsonWeb(url, body)
}

export async function oauthPollAccessToken(
  body: Record<string, unknown>,
): Promise<OAuthJsonResponse> {
  if (Capacitor.isNativePlatform()) {
    return postJsonNative(GH_ACCESS_TOKEN_URL, body)
  }
  const proxy = getProxyBaseUrl()
  const url = proxy ? `${proxy}${ACCESS_TOKEN_PATH}` : GH_ACCESS_TOKEN_URL
  return postJsonWeb(url, body)
}
