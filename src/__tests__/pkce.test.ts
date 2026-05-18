import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generatePkcePair,
  authorizeWithPopup,
} from '../utils/autoBackup/oauth/pkce'

describe('generatePkcePair', () => {
  it('produces a verifier and a S256 challenge of valid base64url shape', async () => {
    const { verifier, challenge, state } = await generatePkcePair()
    // Base64url: A–Z, a–z, 0–9, -, _ — no padding.
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/) // SHA-256 → 32B → 43 chars
    expect(state).toMatch(/^[A-Za-z0-9_-]{20,}$/)
    expect(verifier).not.toBe(challenge)
  })

  it('returns distinct verifiers across calls', async () => {
    const a = await generatePkcePair()
    const b = await generatePkcePair()
    expect(a.verifier).not.toBe(b.verifier)
    expect(a.state).not.toBe(b.state)
  })
})

describe('authorizeWithPopup', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects when window.open returns null (popup blocked)', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    await expect(
      authorizeWithPopup('https://example.test/auth', 'state-xyz'),
    ).rejects.toThrow(/popup/i)
  })

  it('resolves with the code when the callback page postMessages a matching state', async () => {
    const popup = {
      closed: false,
      close: vi.fn(),
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(popup)
    const promise = authorizeWithPopup('https://example.test/auth', 'state-xyz')
    // Let the listener register.
    await Promise.resolve()
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          source: 'bjj-dojo:oauth-callback',
          state: 'state-xyz',
          code: 'the-code',
        },
        origin: window.location.origin,
      }),
    )
    await expect(promise).resolves.toEqual({ code: 'the-code' })
  })

  it('rejects when the callback state does not match (CSRF guard)', async () => {
    const popup = {
      closed: false,
      close: vi.fn(),
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(popup)
    const promise = authorizeWithPopup('https://example.test/auth', 'expected')
    await Promise.resolve()
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          source: 'bjj-dojo:oauth-callback',
          state: 'tampered',
          code: 'x',
        },
        origin: window.location.origin,
      }),
    )
    await expect(promise).rejects.toThrow(/state mismatch/i)
  })

  it('rejects when the callback reports an error', async () => {
    const popup = {
      closed: false,
      close: vi.fn(),
    } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(popup)
    const promise = authorizeWithPopup('https://example.test/auth', 's')
    await Promise.resolve()
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          source: 'bjj-dojo:oauth-callback',
          state: 's',
          error: 'access_denied',
          errorDescription: 'user said no',
        },
        origin: window.location.origin,
      }),
    )
    await expect(promise).rejects.toThrow(/access_denied/)
  })
})
