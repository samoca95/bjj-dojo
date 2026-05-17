import { notifyPreferenceMutation } from './autoBackup/notify'

export const HOME_CARD_VISIBILITY_STORAGE_KEY = 'bjj-dojo:home-card-visibility'
export const HOME_CARD_VISIBILITY_UPDATED_EVENT =
  'bjj-dojo:home-card-visibility-updated'

export type HomeCardVisibilityMap = Record<string, Record<string, boolean>>

function readMap(): HomeCardVisibilityMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(HOME_CARD_VISIBILITY_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: HomeCardVisibilityMap = {}
    for (const [section, cards] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (!cards || typeof cards !== 'object') continue
      const inner: Record<string, boolean> = {}
      for (const [card, vis] of Object.entries(
        cards as Record<string, unknown>,
      ))
        if (typeof vis === 'boolean') inner[card] = vis
      result[section] = inner
    }
    return result
  } catch {
    return {}
  }
}

export function getHomeCardVisibility(): HomeCardVisibilityMap {
  return readMap()
}

export function getCardVisible(
  sectionId: string,
  cardId: string,
  fallback = true,
): boolean {
  const map = readMap()
  const section = map[sectionId]
  if (!section) return fallback
  return section[cardId] ?? fallback
}

export function setCardVisible(
  sectionId: string,
  cardId: string,
  visible: boolean,
) {
  if (typeof window === 'undefined') return
  const map = readMap()
  const section = { ...(map[sectionId] ?? {}) }
  section[cardId] = visible
  map[sectionId] = section
  window.localStorage.setItem(
    HOME_CARD_VISIBILITY_STORAGE_KEY,
    JSON.stringify(map),
  )
  window.dispatchEvent(new Event(HOME_CARD_VISIBILITY_UPDATED_EVENT))
  notifyPreferenceMutation()
}
