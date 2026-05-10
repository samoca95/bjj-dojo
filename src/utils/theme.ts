export type AppTheme = 'black' | 'light'

export const APP_THEME_STORAGE_KEY = 'bjj-dojo.theme'
export const APP_THEME_UPDATED_EVENT = 'bjj-dojo:theme-updated'

export function getAppTheme(): AppTheme {
  if (typeof window === 'undefined') return 'black'
  const raw = window.localStorage.getItem(APP_THEME_STORAGE_KEY)
  return raw === 'light' ? 'light' : 'black'
}

export function applyAppTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('theme-light', theme === 'light')
}

export function setAppTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme)
  applyAppTheme(theme)
  window.dispatchEvent(new Event(APP_THEME_UPDATED_EVENT))
}
