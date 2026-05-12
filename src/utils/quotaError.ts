export const QUOTA_ERROR_EVENT = 'bjj-dojo:quota-exceeded'

export function isQuotaError(err: unknown): boolean {
  if (err instanceof DOMException) {
    // Standard name; code 22 is the legacy numeric alias
    return err.name === 'QuotaExceededError' || err.code === 22
  }
  if (err instanceof Error) {
    return err.name === 'QuotaExceededError'
  }
  return false
}

export function notifyQuotaError(): void {
  window.dispatchEvent(new CustomEvent(QUOTA_ERROR_EVENT))
}
