export const ONBOARDING_COMPLETED_STORAGE_KEY = 'bjj-dojo:onboarding-completed'

export function isOnboardingRequired(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) !== '1'
}
