import type { SessionType } from '../types'
import { SESSION_TYPE_ICONS } from '../types'

export const SESSION_TYPE_ICONS_STORAGE_KEY = 'bjj-dojo.session-type-icons'
export const SESSION_TYPE_ICONS_UPDATED_EVENT = 'bjj-dojo:session-type-icons-updated'

export type SessionTypeIconsMap = Record<SessionType, string>

export function getSessionTypeIcons(): SessionTypeIconsMap {
  if (typeof window === 'undefined') return SESSION_TYPE_ICONS
  try {
    const raw = window.localStorage.getItem(SESSION_TYPE_ICONS_STORAGE_KEY)
    if (!raw) return SESSION_TYPE_ICONS
    const parsed = JSON.parse(raw) as Partial<Record<SessionType, unknown>>
    return {
      GI: typeof parsed.GI === 'string' && parsed.GI.trim() ? parsed.GI : SESSION_TYPE_ICONS.GI,
      NOGI: typeof parsed.NOGI === 'string' && parsed.NOGI.trim() ? parsed.NOGI : SESSION_TYPE_ICONS.NOGI,
      OPEN_MAT:
        typeof parsed.OPEN_MAT === 'string' && parsed.OPEN_MAT.trim()
          ? parsed.OPEN_MAT
          : SESSION_TYPE_ICONS.OPEN_MAT,
      COMPETITION:
        typeof parsed.COMPETITION === 'string' && parsed.COMPETITION.trim()
          ? parsed.COMPETITION
          : SESSION_TYPE_ICONS.COMPETITION,
      DRILLING:
        typeof parsed.DRILLING === 'string' && parsed.DRILLING.trim()
          ? parsed.DRILLING
          : SESSION_TYPE_ICONS.DRILLING,
    }
  } catch {
    return SESSION_TYPE_ICONS
  }
}

export function saveSessionTypeIcons(icons: SessionTypeIconsMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_TYPE_ICONS_STORAGE_KEY, JSON.stringify(icons))
  window.dispatchEvent(new Event(SESSION_TYPE_ICONS_UPDATED_EVENT))
}
