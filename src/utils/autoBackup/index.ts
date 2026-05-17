/**
 * Auto-backup orchestrator.
 *
 * Mutations enqueue component-scoped backups. The scheduler drains the queue
 * serially and coalesces rapid updates into the latest pending component set.
 */
import {
  exportDatabaseBackupComponent,
  type DatabaseBackup,
  type BJJDatabase,
  db,
} from '../../db/database'
import { telemetry } from '../telemetry'
import { fileSystemDestination } from './destinations/fileSystem'
import { githubDestination } from './destinations/github'
import {
  BACKUP_COMPONENTS,
  backupFilenameForComponent,
  isLegacyBackupFilename,
  parseBackupComponentFromFilename,
  parseBackupTimestampFromFilename,
} from './files'
import {
  getOverallLastRun,
  setFsLastError,
  setFsLastRun,
  setGithubLastError,
  setGithubLastRun,
  setOverallLastRun,
} from './settings'
import type {
  BackupComponent,
  BackupDestination,
  DestinationId,
  RunReport,
} from './types'

let runInFlight: Promise<RunReport[]> | null = null
let queuedComponents = new Set<BackupComponent>()
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
  if (!report.success && report.error === 'offline-skipped') return
  if (report.destinationId === 'fileSystem') {
    if (report.success) {
      setFsLastRun(Date.now())
      setFsLastError(null)
    } else {
      setFsLastError(report.error ?? 'Unknown error')
    }
    return
  }
  if (report.success) {
    setGithubLastRun(Date.now())
    setGithubLastError(null)
  } else {
    setGithubLastError(report.error ?? 'Unknown error')
  }
}

export async function runBackupNow(
  database: BJJDatabase = db,
  options: { components?: BackupComponent[] } = {},
): Promise<RunReport[]> {
  if (runInFlight) return runInFlight
  runInFlight = (async () => {
    const targets = await activeDestinations()
    if (targets.length === 0) return []
    const components =
      options.components && options.components.length > 0
        ? options.components
        : BACKUP_COMPONENTS
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
          let lastFilename: string | undefined
          for (const component of components) {
            const payload = await exportDatabaseBackupComponent(
              component,
              database,
            )
            const filename = backupFilenameForComponent(component)
            const result = await destination.write(payload, filename)
            lastFilename = result.filename
          }
          window.dispatchEvent(
            new CustomEvent('bjj-dojo:backup-dest-succeeded', {
              detail: { destinationId: destination.id },
            }),
          )
          return {
            destinationId: destination.id,
            success: true,
            filename: lastFilename,
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
  while (queuedComponents.size > 0) {
    const pendingDatabase = queuedDatabase ?? database
    const pendingComponents = [...queuedComponents]
    queuedDatabase = null
    queuedComponents = new Set<BackupComponent>()
    await runBackupNow(pendingDatabase, { components: pendingComponents })
  }
}

export function scheduleAfterMutation(
  database: BJJDatabase = db,
  options: { components?: BackupComponent[]; showSyncIndicator?: boolean } = {},
): void {
  if (typeof window === 'undefined') return
  const destinationIds = getEnabledDestinationIds()
  if (destinationIds.length === 0) return
  const components =
    options.components && options.components.length > 0
      ? options.components
      : BACKUP_COMPONENTS
  for (const component of components) queuedComponents.add(component)
  if (options.showSyncIndicator ?? true) {
    window.dispatchEvent(
      new CustomEvent('bjj-dojo:backup-triggered', {
        detail: { destinationIds },
      }),
    )
  }
  queuedDatabase = database
  if (runInFlight) return
  void runScheduledBackups(database)
}

function backupSortValue(backup: {
  filename: string
  modifiedAt?: number
}): number {
  const parsed = parseBackupTimestampFromFilename(backup.filename)
  if (backup.modifiedAt != null) return backup.modifiedAt
  if (parsed != null) return parsed
  return Date.parse(backup.filename) || 0
}

function mergeBackupPayload(
  base: DatabaseBackup,
  incoming: DatabaseBackup,
): DatabaseBackup {
  if (incoming.component === 'preferences') {
    return {
      ...base,
      version: incoming.version ?? base.version,
      schemaVersion: incoming.schemaVersion ?? base.schemaVersion,
      schemaSignature: incoming.schemaSignature ?? base.schemaSignature,
      exportedAt: Math.max(base.exportedAt ?? 0, incoming.exportedAt ?? 0),
      language: incoming.language ?? base.language,
      preferences: incoming.preferences ?? base.preferences,
    }
  }
  if (incoming.component === 'sessions') {
    return {
      ...base,
      version: incoming.version ?? base.version,
      schemaVersion: incoming.schemaVersion ?? base.schemaVersion,
      schemaSignature: incoming.schemaSignature ?? base.schemaSignature,
      exportedAt: Math.max(base.exportedAt ?? 0, incoming.exportedAt ?? 0),
      language: incoming.language ?? base.language,
      sessions: incoming.sessions,
      sessionTechniques: incoming.sessionTechniques,
      sessionTaps: incoming.sessionTaps,
    }
  }
  if (incoming.component === 'techniques') {
    return {
      ...base,
      version: incoming.version ?? base.version,
      schemaVersion: incoming.schemaVersion ?? base.schemaVersion,
      schemaSignature: incoming.schemaSignature ?? base.schemaSignature,
      exportedAt: Math.max(base.exportedAt ?? 0, incoming.exportedAt ?? 0),
      language: incoming.language ?? base.language,
      categories: incoming.categories,
      techniques: incoming.techniques,
      flows: incoming.flows ?? base.flows,
    }
  }
  if (incoming.component === 'flows') {
    return {
      ...base,
      version: incoming.version ?? base.version,
      schemaVersion: incoming.schemaVersion ?? base.schemaVersion,
      schemaSignature: incoming.schemaSignature ?? base.schemaSignature,
      exportedAt: Math.max(base.exportedAt ?? 0, incoming.exportedAt ?? 0),
      language: incoming.language ?? base.language,
      techniqueConnections: incoming.techniqueConnections,
      clubs: incoming.clubs,
      drillPlans: incoming.drillPlans,
    }
  }
  return {
    ...base,
    version: incoming.version ?? base.version,
    schemaVersion: incoming.schemaVersion ?? base.schemaVersion,
    schemaSignature: incoming.schemaSignature ?? base.schemaSignature,
    exportedAt: Math.max(base.exportedAt ?? 0, incoming.exportedAt ?? 0),
    language: incoming.language ?? base.language,
    categories: incoming.categories ?? base.categories,
    techniques: incoming.techniques ?? base.techniques,
    techniqueConnections:
      incoming.techniqueConnections ?? base.techniqueConnections,
    sessions: incoming.sessions ?? base.sessions,
    sessionTechniques: incoming.sessionTechniques ?? base.sessionTechniques,
    sessionTaps: incoming.sessionTaps ?? base.sessionTaps,
    clubs: incoming.clubs ?? base.clubs,
    drillPlans: incoming.drillPlans ?? base.drillPlans,
    flows: incoming.flows ?? base.flows,
    preferences: incoming.preferences ?? base.preferences,
  }
}

export async function readLatestBackupPayload(
  destination: BackupDestination,
  preferredId?: string,
): Promise<DatabaseBackup> {
  const discovered = await destination.discoverExistingBackups()
  if (discovered.length === 0) throw new Error('No backup found.')
  const sorted = [...discovered].sort((a, b) => {
    const diff = backupSortValue(b) - backupSortValue(a)
    if (diff !== 0) return diff
    return a.filename < b.filename ? 1 : -1
  })

  const latestByComponent = new Map<BackupComponent, string>()
  const legacyIds: string[] = []
  for (const item of sorted) {
    const component = parseBackupComponentFromFilename(item.filename)
    if (component) {
      if (!latestByComponent.has(component))
        latestByComponent.set(component, item.id)
      continue
    }
    if (isLegacyBackupFilename(item.filename)) legacyIds.push(item.id)
  }

  if (latestByComponent.size === 0) {
    const fallbackId = preferredId ?? sorted[0].id
    return await destination.readBackup(fallbackId)
  }

  let merged: DatabaseBackup = {
    version: 2,
    exportedAt: 0,
    categories: [],
    techniques: [],
    techniqueConnections: [],
    sessions: [],
    sessionTechniques: [],
    sessionTaps: [],
    sessionFlows: [],
    sessionFlowTaps: [],
    clubs: [],
    drillPlans: [],
    flows: [],
    preferences: {},
  }

  if (legacyIds.length > 0) {
    const legacyPayload = await destination.readBackup(legacyIds[0])
    merged = mergeBackupPayload(merged, legacyPayload)
  }

  for (const component of BACKUP_COMPONENTS) {
    const id = latestByComponent.get(component)
    if (!id) continue
    const payload = await destination.readBackup(id)
    merged = mergeBackupPayload(merged, payload)
  }

  return merged
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
  queuedComponents = new Set<BackupComponent>()
  queuedDatabase = null
}
