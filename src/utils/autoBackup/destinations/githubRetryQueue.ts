/**
 * Persistent queue of GitHub backup writes that failed after the in-flight
 * retry loop in `repoWrite()` exhausted itself. Entries live in the Dexie
 * `appState` table so they survive tab close / reload, and are drained on the
 * next `runBackupNow()` GitHub pass.
 *
 * Coalescing: a single pending entry per component. The latest payload wins —
 * each file is a full snapshot, not a delta, so stale ones can be dropped.
 */
import {
  getAppStateValue,
  setAppStateValue,
  type DatabaseBackup,
  type BJJDatabase,
  db,
} from '../../../db/database'
import type { BackupComponent } from '../types'
import { AUTO_BACKUP_UPDATED_EVENT } from '../settings'

const QUEUE_KEY = 'autoBackup.githubRetryQueue'
export const MAX_RETRY_ATTEMPTS = 10

export interface GithubRetryEntry {
  /** `${component}` — at most one entry per component, latest wins. */
  id: BackupComponent
  component: BackupComponent
  filename: string
  payload: DatabaseBackup
  attempts: number
  firstFailedAt: number
  lastError: string
}

async function loadQueue(
  database: BJJDatabase = db,
): Promise<GithubRetryEntry[]> {
  const raw = await getAppStateValue<GithubRetryEntry[]>(QUEUE_KEY, database)
  return Array.isArray(raw) ? raw : []
}

async function saveQueue(
  entries: GithubRetryEntry[],
  database: BJJDatabase = db,
): Promise<void> {
  await setAppStateValue(QUEUE_KEY, entries, database)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTO_BACKUP_UPDATED_EVENT))
  }
}

export async function enqueueFailedGithubWrite(
  entry: Omit<GithubRetryEntry, 'id' | 'attempts' | 'firstFailedAt'>,
  database: BJJDatabase = db,
): Promise<void> {
  const queue = await loadQueue(database)
  const existing = queue.find((e) => e.id === entry.component)
  const now = Date.now()
  if (existing) {
    existing.filename = entry.filename
    existing.payload = entry.payload
    existing.attempts = existing.attempts + 1
    existing.lastError = entry.lastError
  } else {
    queue.push({
      id: entry.component,
      component: entry.component,
      filename: entry.filename,
      payload: entry.payload,
      attempts: 1,
      firstFailedAt: now,
      lastError: entry.lastError,
    })
  }
  await saveQueue(queue, database)
}

export async function getPendingGithubWrites(
  database: BJJDatabase = db,
): Promise<GithubRetryEntry[]> {
  return await loadQueue(database)
}

export async function removeGithubRetryEntry(
  id: BackupComponent,
  database: BJJDatabase = db,
): Promise<void> {
  const queue = await loadQueue(database)
  const next = queue.filter((e) => e.id !== id)
  if (next.length !== queue.length) await saveQueue(next, database)
}

export async function clearGithubRetryQueue(
  database: BJJDatabase = db,
): Promise<void> {
  await saveQueue([], database)
}

export async function hasPendingGithubWrites(
  database: BJJDatabase = db,
): Promise<boolean> {
  const queue = await loadQueue(database)
  return queue.length > 0
}
