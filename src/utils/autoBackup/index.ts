/**
 * Auto-backup orchestrator.
 *
 * `scheduleAfterMutation()` is wired into mutation paths.
 * It runs immediately, skips if no destination is enabled, and queues one
 * follow-up run if additional mutations happen during an in-flight backup.
 * Destinations run in parallel — one failing does not block others.
 * `runBackupNow()` is also used for explicit user-triggered backups.
 */
import { db, exportDatabaseBackup, type BJJDatabase } from '../../db/database'
import { telemetry } from '../telemetry'
import { fileSystemDestination } from './destinations/fileSystem'
import { githubDestination } from './destinations/github'
import {
  backupFilenameForDate,
  getOverallLastRun,
  setFsLastError,
  setFsLastRun,
  setGithubLastError,
  setGithubLastRun,
  setOverallLastRun,
} from './settings'
import type { BackupDestination, DestinationId, RunReport } from './types'

let runInFlight: Promise<RunReport[]> | null = null
let rerunRequested = false
let queuedDatabase: BJJDatabase | null = null

const allDestinations: BackupDestination[] = [
  fileSystemDestination,
  githubDestination,
]

async function activeDestinations(): Promise<BackupDestination[]> {
  const enabled = await Promise.all(
    allDestinations.map(async (d) => ((await d.isEnabled()) ? d : null)),
  )
  return enabled.filter((d): d is BackupDestination => d !== null)
}

function recordResult(report: RunReport) {
  // Offline-skipped is not an error; leave existing error/run state alone.
  if (!report.success && report.error === 'offline-skipped') return

  if (report.destinationId === 'fileSystem') {
    if (report.success) {
      setFsLastRun(Date.now())
      setFsLastError(null)
    } else {
      setFsLastError(report.error ?? 'Unknown error')
    }
  } else if (report.destinationId === 'github') {
    if (report.success) {
      setGithubLastRun(Date.now())
      setGithubLastError(null)
    } else {
      setGithubLastError(report.error ?? 'Unknown error')
    }
  }
}

export async function runBackupNow(
  database: BJJDatabase = db,
): Promise<RunReport[]> {
  if (runInFlight) return runInFlight
  runInFlight = (async () => {
    const targets = await activeDestinations()
    if (targets.length === 0) return []
    const payload = await exportDatabaseBackup(database)
    const filename = backupFilenameForDate()
    const reports = await Promise.all(
      targets.map(async (destination): Promise<RunReport> => {
        if (
          destination.id === 'github' &&
          typeof navigator !== 'undefined' &&
          !navigator.onLine
        ) {
          window.dispatchEvent(
            new CustomEvent('bjj-dojo:backup-offline-skipped', {
              detail: { destinationId: destination.id },
            }),
          )
          return {
            destinationId: destination.id,
            success: false,
            error: 'offline-skipped',
          }
        }
        window.dispatchEvent(
          new CustomEvent('bjj-dojo:backup-dest-started', {
            detail: { destinationId: destination.id },
          }),
        )
        try {
          const result = await destination.write(payload, filename)
          window.dispatchEvent(
            new CustomEvent('bjj-dojo:backup-dest-succeeded', {
              detail: { destinationId: destination.id },
            }),
          )
          return {
            destinationId: destination.id,
            success: true,
            filename: result.filename,
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          telemetry.error('backup.auto_failed', err)
          window.dispatchEvent(
            new CustomEvent('bjj-dojo:backup-dest-failed', {
              detail: { destinationId: destination.id, error: message },
            }),
          )
          return {
            destinationId: destination.id,
            success: false,
            error: message,
          }
        }
      }),
    )
    reports.forEach(recordResult)
    if (reports.some((r) => r.success)) setOverallLastRun(Date.now())
    return reports
  })()
  try {
    return await runInFlight
  } finally {
    runInFlight = null
  }
}

function getEnabledDestinationIds(): DestinationId[] {
  if (typeof window === 'undefined') return []
  const ids: DestinationId[] = []
  if (window.localStorage.getItem('bjj-dojo:auto-backup-fs-enabled') === '1') {
    ids.push('fileSystem')
  }
  if (
    window.localStorage.getItem('bjj-dojo:auto-backup-github-enabled') === '1'
  ) {
    ids.push('github')
  }
  return ids
}

async function runScheduledBackups(database: BJJDatabase): Promise<void> {
  let pendingDatabase: BJJDatabase = database
  do {
    rerunRequested = false
    await runBackupNow(pendingDatabase)
    if (queuedDatabase) {
      pendingDatabase = queuedDatabase
      queuedDatabase = null
    }
  } while (rerunRequested)
}

export function scheduleAfterMutation(database: BJJDatabase = db): void {
  if (typeof window === 'undefined') return
  const destinationIds = getEnabledDestinationIds()
  if (destinationIds.length === 0) return
  window.dispatchEvent(
    new CustomEvent('bjj-dojo:backup-triggered', {
      detail: { destinationIds },
    }),
  )
  if (runInFlight) {
    rerunRequested = true
    queuedDatabase = database
    return
  }
  void runScheduledBackups(database)
}

/** Called on app start; runs if the last backup is older than 24h. */
export async function runStartupBackupIfDue(
  database: BJJDatabase = db,
): Promise<void> {
  const last = getOverallLastRun() ?? 0
  if (Date.now() - last < 24 * 60 * 60 * 1000) return
  await runBackupNow(database)
}

/** Reset scheduler state, used in tests. */
export function _resetSchedulerForTests() {
  runInFlight = null
  rerunRequested = false
  queuedDatabase = null
}
