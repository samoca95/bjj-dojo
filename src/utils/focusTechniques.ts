export const FOCUS_TECHNIQUE_IDS_STORAGE_KEY = 'bjj-dojo:focus-technique-ids'

export function getFocusTechniqueIds(): number[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(FOCUS_TECHNIQUE_IDS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0)
  } catch {
    return []
  }
}

export function setFocusTechniqueIds(ids: number[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids)).filter(
    (id) => Number.isInteger(id) && id > 0,
  )
  window.localStorage.setItem(
    FOCUS_TECHNIQUE_IDS_STORAGE_KEY,
    JSON.stringify(unique),
  )
}
