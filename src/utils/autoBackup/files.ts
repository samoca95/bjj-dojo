import type { BackupComponent } from './types'

export const BACKUP_COMPONENTS: BackupComponent[] = [
  'preferences',
  'sessions',
  'techniques',
  'flows',
]

/** Per-component subdirectory inside the chosen folder / `backups/` dir. */
export const BACKUP_SUBDIR_FOR_COMPONENT: Record<BackupComponent, string> = {
  preferences: 'preferences',
  sessions: 'sessions',
  techniques: 'techniques',
  flows: 'flows',
}

const COMPONENT_PATTERN =
  /^bjj-dojo-backup-(preferences|sessions|techniques|flows)-(\d{13})\.json$/
const LEGACY_PATTERN = /^bjj-dojo-backup(?:-\d{4}-\d{2}-\d{2})?\.json$/

export function backupFilenameForComponent(
  component: BackupComponent,
  time = Date.now(),
): string {
  return `bjj-dojo-backup-${component}-${time}.json`
}

export function backupSubdirForComponent(component: BackupComponent): string {
  return BACKUP_SUBDIR_FOR_COMPONENT[component]
}

export function parseBackupComponentFromFilename(
  filename: string,
): BackupComponent | null {
  const match = COMPONENT_PATTERN.exec(filename)
  if (!match) return null
  return match[1] as BackupComponent
}

export function parseBackupTimestampFromFilename(
  filename: string,
): number | null {
  const match = COMPONENT_PATTERN.exec(filename)
  if (!match) return null
  const timestamp = Number(match[2])
  return Number.isFinite(timestamp) ? timestamp : null
}

export function isRecognizedBackupFilename(filename: string): boolean {
  return COMPONENT_PATTERN.test(filename) || LEGACY_PATTERN.test(filename)
}

export function isLegacyBackupFilename(filename: string): boolean {
  return LEGACY_PATTERN.test(filename)
}
