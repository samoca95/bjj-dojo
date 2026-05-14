import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'
import { BELT_STORAGE_KEY, STRIPES_STORAGE_KEY } from '../utils/beltRank'

export const INITIAL_SETUP_COMPLETED_STORAGE_KEY =
  'bjj-dojo:initial-setup-completed'

export function isInitialSetupRequired(): boolean {
  if (typeof window === 'undefined') return false
  if (window.localStorage.getItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY) === '1')
    return false
  return (
    !window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) &&
    !window.localStorage.getItem(BELT_STORAGE_KEY) &&
    !window.localStorage.getItem(STRIPES_STORAGE_KEY)
  )
}

export function completeInitialSetup() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY, '1')
}
