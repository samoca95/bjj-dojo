export type HomeSectionId =
  | 'gamification'
  | 'focus'
  | 'stats'
  | 'plannedSessions'
  | 'calendar'
  | 'quickAccess'
export type HomeSectionVisibility = Record<HomeSectionId, boolean>

export const HOME_SECTION_ORDER_STORAGE_KEY = 'bjj-dojo:home-section-order'
export const HOME_SECTION_VISIBILITY_STORAGE_KEY =
  'bjj-dojo:home-section-visibility'
export const HOME_SECTION_ORDER_UPDATED_EVENT =
  'bjj-dojo:home-section-order-updated'

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionId[] = [
  'gamification',
  'focus',
  'stats',
  'plannedSessions',
  'calendar',
  'quickAccess',
]
export const DEFAULT_HOME_SECTION_VISIBILITY: HomeSectionVisibility = {
  gamification: true,
  focus: true,
  stats: true,
  plannedSessions: true,
  calendar: true,
  quickAccess: false,
}

const ALL: HomeSectionId[] = [
  'gamification',
  'focus',
  'stats',
  'plannedSessions',
  'calendar',
  'quickAccess',
]

function sanitize(values: unknown): HomeSectionId[] {
  if (!Array.isArray(values)) return DEFAULT_HOME_SECTION_ORDER
  const seen = new Set<HomeSectionId>()
  const result: HomeSectionId[] = []
  for (const v of values) {
    if (
      typeof v === 'string' &&
      (ALL as string[]).includes(v) &&
      !seen.has(v as HomeSectionId)
    ) {
      seen.add(v as HomeSectionId)
      result.push(v as HomeSectionId)
    }
  }
  for (const id of ALL) {
    if (!seen.has(id)) result.push(id)
  }
  return result
}

function sanitizeVisibility(values: unknown): HomeSectionVisibility {
  const result: HomeSectionVisibility = { ...DEFAULT_HOME_SECTION_VISIBILITY }
  if (!values || typeof values !== 'object') return result
  const source = values as Record<string, unknown>
  for (const id of ALL) {
    if (typeof source[id] === 'boolean') result[id] = source[id]
  }
  return result
}

export function getHomeSectionOrder(): HomeSectionId[] {
  if (typeof window === 'undefined') return DEFAULT_HOME_SECTION_ORDER
  try {
    const raw = window.localStorage.getItem(HOME_SECTION_ORDER_STORAGE_KEY)
    if (!raw) return DEFAULT_HOME_SECTION_ORDER
    return sanitize(JSON.parse(raw))
  } catch {
    return DEFAULT_HOME_SECTION_ORDER
  }
}

export function setHomeSectionOrder(order: HomeSectionId[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    HOME_SECTION_ORDER_STORAGE_KEY,
    JSON.stringify(sanitize(order)),
  )
  window.dispatchEvent(new Event(HOME_SECTION_ORDER_UPDATED_EVENT))
}

export function getHomeSectionVisibility(): HomeSectionVisibility {
  if (typeof window === 'undefined') return DEFAULT_HOME_SECTION_VISIBILITY
  try {
    const raw = window.localStorage.getItem(HOME_SECTION_VISIBILITY_STORAGE_KEY)
    if (!raw) return DEFAULT_HOME_SECTION_VISIBILITY
    return sanitizeVisibility(JSON.parse(raw))
  } catch {
    return DEFAULT_HOME_SECTION_VISIBILITY
  }
}

export function setHomeSectionVisibility(visibility: HomeSectionVisibility) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    HOME_SECTION_VISIBILITY_STORAGE_KEY,
    JSON.stringify(sanitizeVisibility(visibility)),
  )
  window.dispatchEvent(new Event(HOME_SECTION_ORDER_UPDATED_EVENT))
}
