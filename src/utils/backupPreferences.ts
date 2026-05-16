/**
 * Backs up and restores the `bjj-dojo`-prefixed localStorage keys that
 * represent user-owned settings (belt, name, goals, focus, layout, etc.).
 *
 * Volatile or device-local flags (telemetry buffer, onboarding decisions,
 * quota error banner, transient ids) are intentionally excluded — those
 * should not roam between devices on restore.
 *
 * When a key is restored, the matching `*-updated` event is dispatched so
 * any mounted hook re-reads the value without requiring a reload.
 */

const PREFIX = 'bjj-dojo'

/** Canonical list of user-data settings keys that belong in a backup. */
export const BACKUP_PREFERENCE_KEYS = [
  // Identity & belt
  'bjj-dojo:user-name',
  'bjj-dojo:belt-color',
  'bjj-dojo:belt-stripes',
  'bjj-dojo:belt-history',
  // Goals & focus
  'bjj-dojo:goal-mat-time',
  'bjj-dojo:focus-technique-ids',
  'bjj-dojo:focus-goals',
  'bjj-dojo:focus-manual-counts',
  'bjj-dojo:achievements-meta',
  // Home layout
  'bjj-dojo:home-section-order',
  'bjj-dojo:home-section-visibility',
  'bjj-dojo:home-card-visibility',
  // Sharing
  'bjj-dojo:share-theme',
  'bjj-dojo:share-format',
  'bjj-dojo:share-show-belt',
  'bjj-dojo:share-show-qr',
  // Locale & theme (the dot-prefixed legacy keys live in localStorage too)
  'bjj-dojo:language',
  'bjj-dojo.theme',
  'bjj-dojo.session-type-icons',
] as const

export type BackupPreferenceKey = (typeof BACKUP_PREFERENCE_KEYS)[number]

/** Events to dispatch after restoring a given key, so listeners refresh. */
const KEY_EVENTS: Partial<Record<string, string[]>> = {
  'bjj-dojo:belt-color': ['bjj-dojo:belt-rank-updated'],
  'bjj-dojo:belt-stripes': ['bjj-dojo:belt-rank-updated'],
  'bjj-dojo:focus-goals': ['bjj-dojo:focus-goals-updated'],
  'bjj-dojo:focus-manual-counts': ['bjj-dojo:focus-goals-updated'],
  'bjj-dojo:achievements-meta': ['bjj-dojo:achievements-updated'],
  'bjj-dojo:home-section-order': ['bjj-dojo:home-section-order-updated'],
  'bjj-dojo:home-section-visibility': ['bjj-dojo:home-section-order-updated'],
  'bjj-dojo:home-card-visibility': ['bjj-dojo:home-card-visibility-updated'],
  'bjj-dojo:language': ['bjj-dojo:language-updated'],
  'bjj-dojo.theme': ['bjj-dojo:theme-updated'],
  'bjj-dojo.session-type-icons': ['bjj-dojo:session-type-icons-updated'],
}

export function collectBackupPreferences(
  storage: Storage = window.localStorage,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of BACKUP_PREFERENCE_KEYS) {
    const value = storage.getItem(key)
    if (value !== null) out[key] = value
  }
  return out
}

export function restoreBackupPreferences(
  preferences: Record<string, string> | undefined,
  storage: Storage = window.localStorage,
): void {
  if (!preferences || typeof preferences !== 'object') return
  const eventsToFire = new Set<string>()
  for (const [key, value] of Object.entries(preferences)) {
    if (typeof value !== 'string') continue
    if (!(BACKUP_PREFERENCE_KEYS as readonly string[]).includes(key)) continue
    storage.setItem(key, value)
    for (const event of KEY_EVENTS[key] ?? []) eventsToFire.add(event)
  }
  if (typeof window === 'undefined') return
  for (const event of eventsToFire) {
    window.dispatchEvent(new Event(event))
  }
}

/** Removes every `bjj-dojo`-prefixed key from the given storage, like reset does. */
export function clearAllPrefixedStorage(storage: Storage): void {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(PREFIX)) keys.push(key)
  }
  keys.forEach((key) => storage.removeItem(key))
}
