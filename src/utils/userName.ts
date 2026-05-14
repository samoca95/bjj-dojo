/**
 * The user's display name, shown on share cards when belt branding is enabled.
 * Stored alongside the belt rank as lightweight profile data — a plain
 * localStorage getter/setter pair is enough, no cross-component event sync.
 */

export const MAX_USER_NAME_LENGTH = 40

const NAME_KEY = 'bjj-dojo:user-name'
const PROMPTED_KEY = 'bjj-dojo:user-name-prompted'

export function getUserName(): string {
  if (typeof window === 'undefined') return ''
  return (window.localStorage.getItem(NAME_KEY) ?? '').slice(
    0,
    MAX_USER_NAME_LENGTH,
  )
}

export function setUserName(name: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    NAME_KEY,
    name.trim().slice(0, MAX_USER_NAME_LENGTH),
  )
}

/** Whether the user has already been asked for their name on first share. */
export function getUserNamePrompted(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(PROMPTED_KEY) === 'true'
}

export function setUserNamePrompted() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PROMPTED_KEY, 'true')
}
