/**
 * Auto-backup configuration persisted in localStorage. Values are scoped per
 * destination so enabling one does not enable the others. The `*Updated` event
 * is dispatched whenever a value changes so the Settings UI can refresh live.
 */
import type { DestinationId } from './types'

export const AUTO_BACKUP_UPDATED_EVENT = 'bjj-dojo:auto-backup-updated'

const FS_ENABLED_KEY = 'bjj-dojo:auto-backup-fs-enabled'
const FS_FOLDER_NAME_KEY = 'bjj-dojo:auto-backup-fs-folder-name'
const FS_LAST_RUN_KEY = 'bjj-dojo:auto-backup-fs-last-run'
const FS_LAST_ERROR_KEY = 'bjj-dojo:auto-backup-fs-last-error'
const FS_NEEDS_RECONNECT_KEY = 'bjj-dojo:auto-backup-fs-needs-reconnect'

// ─── Cloud (Google Drive, Dropbox) ─────────────────────────────────────────
// Per-provider keys share the same layout so the settings helpers can be
// generated for each provider. Tokens are stored in localStorage; PKCE OAuth
// has no client secret, so this is the same security boundary as the rest of
// the app's per-device state.
type CloudProvider = Extract<DestinationId, 'googleDrive' | 'dropbox'>

interface CloudKeys {
  enabled: string
  accountLabel: string
  accessToken: string
  refreshToken: string
  expiresAt: string
  /** Provider-specific destination id (Drive: appDataFolderId, Dropbox: unused). */
  remoteRootId: string
  lastRun: string
  lastError: string
  needsReconnect: string
}

const CLOUD_KEYS: Record<CloudProvider, CloudKeys> = {
  googleDrive: {
    enabled: 'bjj-dojo:auto-backup-gdrive-enabled',
    accountLabel: 'bjj-dojo:auto-backup-gdrive-account',
    accessToken: 'bjj-dojo:auto-backup-gdrive-access-token',
    refreshToken: 'bjj-dojo:auto-backup-gdrive-refresh-token',
    expiresAt: 'bjj-dojo:auto-backup-gdrive-expires-at',
    remoteRootId: 'bjj-dojo:auto-backup-gdrive-folder-id',
    lastRun: 'bjj-dojo:auto-backup-gdrive-last-run',
    lastError: 'bjj-dojo:auto-backup-gdrive-last-error',
    needsReconnect: 'bjj-dojo:auto-backup-gdrive-needs-reconnect',
  },
  dropbox: {
    enabled: 'bjj-dojo:auto-backup-dropbox-enabled',
    accountLabel: 'bjj-dojo:auto-backup-dropbox-account',
    accessToken: 'bjj-dojo:auto-backup-dropbox-access-token',
    refreshToken: 'bjj-dojo:auto-backup-dropbox-refresh-token',
    expiresAt: 'bjj-dojo:auto-backup-dropbox-expires-at',
    remoteRootId: 'bjj-dojo:auto-backup-dropbox-root',
    lastRun: 'bjj-dojo:auto-backup-dropbox-last-run',
    lastError: 'bjj-dojo:auto-backup-dropbox-last-error',
    needsReconnect: 'bjj-dojo:auto-backup-dropbox-needs-reconnect',
  },
}

// ─── Legacy GitHub keys ─────────────────────────────────────────────────────
// Purged on app load by `purgeLegacyAutoBackupKeys()` so old installs don't
// keep stale state in localStorage forever.
const LEGACY_GITHUB_KEYS = [
  'bjj-dojo:auto-backup-github-enabled',
  'bjj-dojo:auto-backup-github-target',
  'bjj-dojo:auto-backup-github-token',
  'bjj-dojo:auto-backup-github-last-run',
  'bjj-dojo:auto-backup-github-last-error',
]

const APP_LAST_RUN_KEY = 'bjj-dojo:auto-backup-last-run'
const LAST_MUTATION_KEY = 'bjj-dojo:last-mutation-time'
const RETENTION_KEY = 'bjj-dojo:auto-backup-retention'

export const DEFAULT_BACKUP_RETENTION = 50
const MIN_BACKUP_RETENTION = 1
const MAX_BACKUP_RETENTION = 365

function notify() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTO_BACKUP_UPDATED_EVENT))
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function write(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  if (value == null) window.localStorage.removeItem(key)
  else window.localStorage.setItem(key, value)
}

/**
 * Remove leftover keys from the retired GitHub auto-backup destination. Called
 * once on app load — idempotent, no-op if the keys are absent.
 */
export function purgeLegacyAutoBackupKeys(): void {
  if (typeof window === 'undefined') return
  let removed = false
  for (const key of LEGACY_GITHUB_KEYS) {
    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key)
      removed = true
    }
  }
  if (removed) notify()
}

// ─── File-system destination ────────────────────────────────────────────────

export function isFsBackupEnabled(): boolean {
  return read(FS_ENABLED_KEY) === '1'
}

export function setFsBackupEnabled(enabled: boolean) {
  write(FS_ENABLED_KEY, enabled ? '1' : null)
  notify()
}

export function getFsFolderName(): string | null {
  return read(FS_FOLDER_NAME_KEY)
}

export function setFsFolderName(name: string | null) {
  write(FS_FOLDER_NAME_KEY, name)
  notify()
}

export function getFsLastRun(): number | null {
  const raw = read(FS_LAST_RUN_KEY)
  return raw ? Number(raw) : null
}

export function setFsLastRun(when: number) {
  write(FS_LAST_RUN_KEY, String(when))
  notify()
}

export function getFsLastError(): string | null {
  return read(FS_LAST_ERROR_KEY)
}

export function setFsLastError(message: string | null) {
  write(FS_LAST_ERROR_KEY, message)
  notify()
}

export function getFsNeedsReconnect(): boolean {
  return read(FS_NEEDS_RECONNECT_KEY) === '1'
}

export function setFsNeedsReconnect(value: boolean) {
  write(FS_NEEDS_RECONNECT_KEY, value ? '1' : null)
  notify()
}

// ─── Cloud destinations (Google Drive, Dropbox) ─────────────────────────────

export function isCloudBackupEnabled(provider: CloudProvider): boolean {
  return read(CLOUD_KEYS[provider].enabled) === '1'
}

export function setCloudBackupEnabled(
  provider: CloudProvider,
  enabled: boolean,
) {
  write(CLOUD_KEYS[provider].enabled, enabled ? '1' : null)
  notify()
}

export function getCloudAccountLabel(provider: CloudProvider): string | null {
  return read(CLOUD_KEYS[provider].accountLabel)
}

export function setCloudAccountLabel(
  provider: CloudProvider,
  label: string | null,
) {
  write(CLOUD_KEYS[provider].accountLabel, label)
  notify()
}

export interface CloudTokens {
  accessToken: string
  refreshToken?: string
  /** Epoch ms when accessToken stops being valid. */
  expiresAt?: number
}

export function getCloudTokens(provider: CloudProvider): CloudTokens | null {
  const access = read(CLOUD_KEYS[provider].accessToken)
  if (!access) return null
  const refresh = read(CLOUD_KEYS[provider].refreshToken) ?? undefined
  const expiresRaw = read(CLOUD_KEYS[provider].expiresAt)
  const expiresAt =
    expiresRaw && Number.isFinite(Number(expiresRaw))
      ? Number(expiresRaw)
      : undefined
  return { accessToken: access, refreshToken: refresh, expiresAt }
}

export function setCloudTokens(
  provider: CloudProvider,
  tokens: CloudTokens | null,
) {
  if (!tokens) {
    write(CLOUD_KEYS[provider].accessToken, null)
    write(CLOUD_KEYS[provider].refreshToken, null)
    write(CLOUD_KEYS[provider].expiresAt, null)
  } else {
    write(CLOUD_KEYS[provider].accessToken, tokens.accessToken)
    write(CLOUD_KEYS[provider].refreshToken, tokens.refreshToken ?? null)
    write(
      CLOUD_KEYS[provider].expiresAt,
      tokens.expiresAt != null ? String(tokens.expiresAt) : null,
    )
  }
  notify()
}

export function getCloudRemoteRootId(provider: CloudProvider): string | null {
  return read(CLOUD_KEYS[provider].remoteRootId)
}

export function setCloudRemoteRootId(
  provider: CloudProvider,
  id: string | null,
) {
  write(CLOUD_KEYS[provider].remoteRootId, id)
  notify()
}

export function getCloudLastRun(provider: CloudProvider): number | null {
  const raw = read(CLOUD_KEYS[provider].lastRun)
  return raw ? Number(raw) : null
}

export function setCloudLastRun(provider: CloudProvider, when: number) {
  write(CLOUD_KEYS[provider].lastRun, String(when))
  notify()
}

export function getCloudLastError(provider: CloudProvider): string | null {
  return read(CLOUD_KEYS[provider].lastError)
}

export function setCloudLastError(
  provider: CloudProvider,
  message: string | null,
) {
  write(CLOUD_KEYS[provider].lastError, message)
  notify()
}

export function getCloudNeedsReconnect(provider: CloudProvider): boolean {
  return read(CLOUD_KEYS[provider].needsReconnect) === '1'
}

export function setCloudNeedsReconnect(
  provider: CloudProvider,
  value: boolean,
) {
  write(CLOUD_KEYS[provider].needsReconnect, value ? '1' : null)
  notify()
}

// ─── Cross-destination ──────────────────────────────────────────────────────

export function getOverallLastRun(): number | null {
  const raw = read(APP_LAST_RUN_KEY)
  return raw ? Number(raw) : null
}

export function setOverallLastRun(when: number) {
  write(APP_LAST_RUN_KEY, String(when))
  notify()
}

export function backupFilenameForDate(date = new Date()): string {
  return `bjj-dojo-backup-${date.toISOString().slice(0, 10)}.json`
}

export function getLastMutationTime(): number | null {
  const raw = read(LAST_MUTATION_KEY)
  return raw ? Number(raw) : null
}

export function setLastMutationTime(when: number) {
  write(LAST_MUTATION_KEY, String(when))
  notify()
}

export function getBackupRetentionCount(): number {
  const raw = read(RETENTION_KEY)
  if (!raw) return DEFAULT_BACKUP_RETENTION
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return DEFAULT_BACKUP_RETENTION
  return clampRetention(Math.floor(parsed))
}

export function setBackupRetentionCount(count: number) {
  const clamped = clampRetention(Math.floor(count))
  write(RETENTION_KEY, String(clamped))
  notify()
}

function clampRetention(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BACKUP_RETENTION
  return Math.min(MAX_BACKUP_RETENTION, Math.max(MIN_BACKUP_RETENTION, value))
}
