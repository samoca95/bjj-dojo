/**
 * Auto-backup orchestrator.
 *
 * `scheduleAfterMutation()` is wired into the session save/delete paths.
 * It debounces (≥60s between runs), skips if no destination is enabled,
 * and fires destinations in parallel — one failing does not block others.
 * `runBackupNow()` bypasses the debounce for explicit user clicks.
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
import type { BackupDestination, RunReport } from './types'

const MIN_INTERVAL_MS = 60_000

let scheduleTimer: ReturnType<typeof setTimeout> | null = null
let runInFlight: Promise<RunReport[]> | null = null

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
        try {
          const result = await destination.write(payload, filename)
          return {
            destinationId: destination.id,
            success: true,
            filename: result.filename,
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          telemetry.error('backup.auto_failed', err)
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

/**
 * Called from mutation sites (session save/delete, drill plan changes).
 * Defers an actual run to a single debounced timer; bails immediately if
 * the last run was within MIN_INTERVAL_MS.
 */
export function scheduleAfterMutation(database: BJJDatabase = db): void {
  if (typeof window === 'undefined') return
  // Skip when nothing is enabled — cheap localStorage check, no FS/network.
  const fsEnabled =
    window.localStorage.getItem('bjj-dojo:auto-backup-fs-enabled') === '1'
  const ghEnabled =
    window.localStorage.getItem('bjj-dojo:auto-backup-github-enabled') === '1'
  if (!fsEnabled && !ghEnabled) return

  const last = getOverallLastRun() ?? 0
  const elapsed = Date.now() - last
  const delay = Math.max(0, MIN_INTERVAL_MS - elapsed)

  if (scheduleTimer) return
  scheduleTimer = setTimeout(() => {
    scheduleTimer = null
    void runBackupNow(database)
  }, delay)
}

/** Called on app start; runs if the last backup is older than 24h. */
export async function runStartupBackupIfDue(
  database: BJJDatabase = db,
): Promise<void> {
  const last = getOverallLastRun() ?? 0
  if (Date.now() - last < 24 * 60 * 60 * 1000) return
  await runBackupNow(database)
}

/** Reset of the debounce timer, used in tests. */
export function _resetSchedulerForTests() {
  if (scheduleTimer) clearTimeout(scheduleTimer)
  scheduleTimer = null
  runInFlight = null
}
