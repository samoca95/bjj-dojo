import type { SessionType } from '../types'
import { SESSION_TYPE_ICONS } from '../types'

export const SESSION_TYPE_ICONS_STORAGE_KEY = 'bjj-dojo.session-type-icons'
export const SESSION_TYPE_ICONS_UPDATED_EVENT =
  'bjj-dojo:session-type-icons-updated'

export type SessionTypeIconsMap = Record<SessionType, string>

function coerceIcon(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

export function getSessionTypeIcons(): SessionTypeIconsMap {
  if (typeof window === 'undefined') return SESSION_TYPE_ICONS
  try {
    const raw = window.localStorage.getItem(SESSION_TYPE_ICONS_STORAGE_KEY)
    if (!raw) return SESSION_TYPE_ICONS
    const parsed = JSON.parse(raw) as Partial<Record<SessionType, unknown>>
    return {
      GI: coerceIcon(parsed.GI, SESSION_TYPE_ICONS.GI),
      NOGI: coerceIcon(parsed.NOGI, SESSION_TYPE_ICONS.NOGI),
      OPEN_MAT: coerceIcon(parsed.OPEN_MAT, SESSION_TYPE_ICONS.OPEN_MAT),
      COMPETITION: coerceIcon(
        parsed.COMPETITION,
        SESSION_TYPE_ICONS.COMPETITION,
      ),
      DRILLING: coerceIcon(parsed.DRILLING, SESSION_TYPE_ICONS.DRILLING),
    }
  } catch {
    return SESSION_TYPE_ICONS
  }
}

export function saveSessionTypeIcons(icons: SessionTypeIconsMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SESSION_TYPE_ICONS_STORAGE_KEY,
    JSON.stringify(icons),
  )
  window.dispatchEvent(new Event(SESSION_TYPE_ICONS_UPDATED_EVENT))
}
