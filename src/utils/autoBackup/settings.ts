/**
 * Auto-backup configuration persisted in localStorage. Values are scoped per
 * destination so enabling one does not enable the other. The `*Updated` event
 * is dispatched whenever a value changes so the Settings UI can refresh live.
 */

export const AUTO_BACKUP_UPDATED_EVENT = 'bjj-dojo:auto-backup-updated'

const FS_ENABLED_KEY = 'bjj-dojo:auto-backup-fs-enabled'
const FS_FOLDER_NAME_KEY = 'bjj-dojo:auto-backup-fs-folder-name'
const FS_LAST_RUN_KEY = 'bjj-dojo:auto-backup-fs-last-run'
const FS_LAST_ERROR_KEY = 'bjj-dojo:auto-backup-fs-last-error'

const GH_ENABLED_KEY = 'bjj-dojo:auto-backup-github-enabled'
const GH_TARGET_KEY = 'bjj-dojo:auto-backup-github-target'
const GH_TOKEN_KEY = 'bjj-dojo:auto-backup-github-token'
const GH_LAST_RUN_KEY = 'bjj-dojo:auto-backup-github-last-run'
const GH_LAST_ERROR_KEY = 'bjj-dojo:auto-backup-github-last-error'

const APP_LAST_RUN_KEY = 'bjj-dojo:auto-backup-last-run'
const LAST_MUTATION_KEY = 'bjj-dojo:last-mutation-time'
const RETENTION_KEY = 'bjj-dojo:auto-backup-retention'

export const DEFAULT_BACKUP_RETENTION = 50
const MIN_BACKUP_RETENTION = 1
const MAX_BACKUP_RETENTION = 365

export type GithubTarget =
  | { kind: 'gist'; gistId: string }
  | { kind: 'repo'; owner: string; repo: string; branch?: string }

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

// ─── GitHub destination ─────────────────────────────────────────────────────

export function isGithubBackupEnabled(): boolean {
  return read(GH_ENABLED_KEY) === '1'
}

export function setGithubBackupEnabled(enabled: boolean) {
  write(GH_ENABLED_KEY, enabled ? '1' : null)
  notify()
}

export function getGithubTarget(): GithubTarget | null {
  const raw = read(GH_TARGET_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as GithubTarget
    if (parsed.kind === 'gist' && typeof parsed.gistId === 'string')
      return parsed
    if (
      parsed.kind === 'repo' &&
      typeof parsed.owner === 'string' &&
      typeof parsed.repo === 'string'
    )
      return parsed
    return null
  } catch {
    return null
  }
}

export function setGithubTarget(target: GithubTarget | null) {
  write(GH_TARGET_KEY, target ? JSON.stringify(target) : null)
  notify()
}

export function getGithubToken(): string | null {
  return read(GH_TOKEN_KEY)
}

export function setGithubToken(token: string | null) {
  write(GH_TOKEN_KEY, token)
  notify()
}

export function getGithubLastRun(): number | null {
  const raw = read(GH_LAST_RUN_KEY)
  return raw ? Number(raw) : null
}

export function setGithubLastRun(when: number) {
  write(GH_LAST_RUN_KEY, String(when))
  notify()
}

export function getGithubLastError(): string | null {
  return read(GH_LAST_ERROR_KEY)
}

export function setGithubLastError(message: string | null) {
  write(GH_LAST_ERROR_KEY, message)
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
