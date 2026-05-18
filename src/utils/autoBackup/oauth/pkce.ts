/**
 * PKCE OAuth helper.
 *
 * Both Google Drive and Dropbox support Authorization Code + PKCE entirely
 * in-browser — no client secret, no proxy/Worker. We open the provider's
 * auth URL in a popup, the user grants consent, the provider redirects to a
 * tiny static callback page (`/oauth-callback.html`) which `postMessage`s the
 * `code` back to the opener. We then exchange the code for tokens directly
 * from the SPA.
 *
 * Why a separate HTML page (not a hash-router route): the app uses
 * `createHashRouter`, so OAuth `?code=...` query params would compete with
 * hash navigation. Keeping the callback as a plain static file isolates it.
 */

const POPUP_FEATURES = 'width=520,height=640,menubar=no,toolbar=no'
const CALLBACK_PATH = 'oauth-callback.html'

function randomString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  // RFC 7636 §4.1: ALPHA / DIGIT / "-" / "." / "_" / "~", 43-128 chars.
  // Base64url-encode then strip padding.
  return base64UrlEncode(bytes)
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(input: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(input)
  return await crypto.subtle.digest('SHA-256', data)
}

export interface PkcePair {
  verifier: string
  challenge: string
  state: string
}

export async function generatePkcePair(): Promise<PkcePair> {
  const verifier = randomString(32)
  const state = randomString(16)
  const challenge = base64UrlEncode(await sha256(verifier))
  return { verifier, challenge, state }
}

/**
 * Resolve the absolute URL of the OAuth callback page, accounting for the
 * Vite base path used in production (GitHub Pages serves the app from a
 * subpath, see `vite.config.ts`).
 */
export function getCallbackUrl(): string {
  const base =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.BASE_URL ?? '/')
      : '/'
  const origin = window.location.origin
  const path = `${base}${CALLBACK_PATH}`.replace(/\/+/g, '/')
  return `${origin}${path}`
}

interface CallbackMessage {
  source: 'bjj-dojo:oauth-callback'
  state: string
  code?: string
  error?: string
  errorDescription?: string
}

function isCallbackMessage(value: unknown): value is CallbackMessage {
  if (!value || typeof value !== 'object') return false
  const v = value as { source?: unknown }
  return v.source === 'bjj-dojo:oauth-callback'
}

export interface AuthorizeResult {
  code: string
}

/**
 * Open the provider's authorization URL in a popup, wait for the callback
 * page to relay the `code` via `postMessage`, return it. Throws on user
 * cancellation, popup blocked, error response, or state mismatch.
 */
export async function authorizeWithPopup(
  authorizationUrl: string,
  expectedState: string,
  options: { popupTitle?: string } = {},
): Promise<AuthorizeResult> {
  const popup = window.open(
    authorizationUrl,
    options.popupTitle ?? 'oauth',
    POPUP_FEATURES,
  )
  if (!popup) {
    throw new Error(
      'Could not open the authorization popup. Allow popups for this site and try again.',
    )
  }
  return await new Promise<AuthorizeResult>((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      clearInterval(closedPoll)
    }
    const settle = (err: Error | null, result?: AuthorizeResult) => {
      if (settled) return
      settled = true
      cleanup()
      try {
        popup.close()
      } catch {
        // popup may have already closed
      }
      if (err) reject(err)
      else if (result) resolve(result)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!isCallbackMessage(event.data)) return
      const msg = event.data
      if (msg.state !== expectedState) {
        settle(new Error('OAuth state mismatch — request was tampered with.'))
        return
      }
      if (msg.error) {
        settle(
          new Error(
            msg.errorDescription
              ? `${msg.error}: ${msg.errorDescription}`
              : msg.error,
          ),
        )
        return
      }
      if (!msg.code) {
        settle(new Error('OAuth callback returned no code.'))
        return
      }
      settle(null, { code: msg.code })
    }
    const closedPoll = setInterval(() => {
      if (popup.closed) {
        settle(new Error('Authorization was cancelled.'))
      }
    }, 500)
    window.addEventListener('message', onMessage)
  })
}
