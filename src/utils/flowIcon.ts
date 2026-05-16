export const FLOW_ICON_STORAGE_KEY = 'bjj-dojo:flow-icon'
export const FLOW_ICON_UPDATED_EVENT = 'bjj-dojo:flow-icon-updated'
export const DEFAULT_FLOW_ICON = 'route'

export function getFlowIcon(): string {
  if (typeof window === 'undefined') return DEFAULT_FLOW_ICON
  const raw = window.localStorage.getItem(FLOW_ICON_STORAGE_KEY)
  return raw && raw.trim() ? raw : DEFAULT_FLOW_ICON
}

export function setFlowIcon(icon: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(FLOW_ICON_STORAGE_KEY, icon)
  window.dispatchEvent(new Event(FLOW_ICON_UPDATED_EVENT))
}
