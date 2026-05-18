import type { DatabaseBackup } from '../../db/database'

export type DestinationId = 'fileSystem' | 'googleDrive' | 'dropbox'
export type BackupComponent =
  | 'preferences'
  | 'sessions'
  | 'techniques'
  | 'flows'

/**
 * Surface state for a backup destination. `disabled` means the user has not
 * connected it; `needs-reconnect` means a previously connected destination
 * lost permission / its token expired and a user action is required.
 */
export type DestinationStatus = 'disabled' | 'ok' | 'error' | 'needs-reconnect'

export interface DiscoveredBackup {
  /** Stable identifier the destination understands when restoring. */
  id: string
  filename: string
  /** Free-form human-readable description (filename + when known, last-modified date). */
  label: string
  /** Epoch ms of last modification when available — used to sort newest-first. */
  modifiedAt?: number
}

export interface BackupResult {
  filename: string
  bytesWritten: number
}

export interface BackupDestination {
  id: DestinationId
  isEnabled(): boolean | Promise<boolean>
  /** Persists a snapshot. Throws with a user-facing message on failure. */
  write(payload: DatabaseBackup, filename: string): Promise<BackupResult>
  /** Lists candidate backups at this destination, newest-first. */
  discoverExistingBackups(): Promise<DiscoveredBackup[]>
  /** Reads a single backup payload by id (the id returned by discoverExistingBackups). */
  readBackup(id: string): Promise<DatabaseBackup>
}

export interface RunReport {
  destinationId: DestinationId
  success: boolean
  filename?: string
  error?: string
}
