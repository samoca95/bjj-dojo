/**
 * Persisted preferences for the session share card. These are only consumed by
 * the share sheet, so a simple localStorage getter/setter pair is enough — no
 * cross-component event sync needed.
 */

/** Live app URL encoded into the optional QR code. */
export const APP_URL = 'https://samoca95.github.io/bjj-dojo/'

const THEME_KEY = 'bjj-dojo:share-theme'
const SHOW_BELT_KEY = 'bjj-dojo:share-show-belt'
const SHOW_QR_KEY = 'bjj-dojo:share-show-qr'
const NAME_KEY = 'bjj-dojo:share-name'

function getString(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function getBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  return raw == null ? fallback : raw === 'true'
}

function setItem(key: string, value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, value)
}

export function getShareThemeId(): string {
  return getString(THEME_KEY, 'gold')
}
export function setShareThemeId(id: string) {
  setItem(THEME_KEY, id)
}

export function getShareShowBelt(): boolean {
  return getBool(SHOW_BELT_KEY, false)
}
export function setShareShowBelt(value: boolean) {
  setItem(SHOW_BELT_KEY, String(value))
}

export function getShareShowQr(): boolean {
  return getBool(SHOW_QR_KEY, false)
}
export function setShareShowQr(value: boolean) {
  setItem(SHOW_QR_KEY, String(value))
}

export function getShareName(): string {
  return getString(NAME_KEY, '').slice(0, 40)
}
export function setShareName(value: string) {
  setItem(NAME_KEY, value.slice(0, 40))
}
