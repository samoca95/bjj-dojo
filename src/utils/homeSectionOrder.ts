export type HomeSectionId = 'focus' | 'trending' | 'stats' | 'calendar'

export const HOME_SECTION_ORDER_STORAGE_KEY = 'bjj-dojo:home-section-order'
export const HOME_SECTION_ORDER_UPDATED_EVENT = 'bjj-dojo:home-section-order-updated'

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionId[] = ['focus', 'trending', 'stats', 'calendar']

const ALL: HomeSectionId[] = ['focus', 'trending', 'stats', 'calendar']

function sanitize(values: unknown): HomeSectionId[] {
  if (!Array.isArray(values)) return DEFAULT_HOME_SECTION_ORDER
  const seen = new Set<HomeSectionId>()
  const result: HomeSectionId[] = []
  for (const v of values) {
    if (typeof v === 'string' && (ALL as string[]).includes(v) && !seen.has(v as HomeSectionId)) {
      seen.add(v as HomeSectionId)
      result.push(v as HomeSectionId)
    }
  }
  for (const id of ALL) {
    if (!seen.has(id)) result.push(id)
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
  window.localStorage.setItem(HOME_SECTION_ORDER_STORAGE_KEY, JSON.stringify(sanitize(order)))
  window.dispatchEvent(new Event(HOME_SECTION_ORDER_UPDATED_EVENT))
}
