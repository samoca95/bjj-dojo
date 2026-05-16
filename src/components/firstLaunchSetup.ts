import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'
import { BELT_STORAGE_KEY, STRIPES_STORAGE_KEY } from '../utils/beltRank'

export const INITIAL_SETUP_COMPLETED_STORAGE_KEY =
  'bjj-dojo:initial-setup-completed'
export const RESTORE_PROMPT_DECIDED_STORAGE_KEY =
  'bjj-dojo:restore-prompt-decided'

export function isRestorePromptRequired(): boolean {
  if (typeof window === 'undefined') return false
  if (window.localStorage.getItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY) !== '1')
    return false
  return window.localStorage.getItem(RESTORE_PROMPT_DECIDED_STORAGE_KEY) !== '1'
}

export function completeRestorePrompt() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RESTORE_PROMPT_DECIDED_STORAGE_KEY, '1')
}

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
