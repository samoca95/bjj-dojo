import { notifyPreferenceMutation } from './autoBackup/notify'

export const FOCUS_FLOW_IDS_STORAGE_KEY = 'bjj-dojo:focus-flow-ids'
export const FOCUS_FLOW_IDS_UPDATED_EVENT = 'bjj-dojo:focus-flow-ids-updated'

export function getFocusFlowIds(): number[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(FOCUS_FLOW_IDS_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0)
  } catch {
    return []
  }
}

export function setFocusFlowIds(ids: number[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids)).filter(
    (id) => Number.isInteger(id) && id > 0,
  )
  window.localStorage.setItem(
    FOCUS_FLOW_IDS_STORAGE_KEY,
    JSON.stringify(unique),
  )
  window.dispatchEvent(new Event(FOCUS_FLOW_IDS_UPDATED_EVENT))
  notifyPreferenceMutation()
}
