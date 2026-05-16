/**
 * Native (Capacitor) filesystem backup destination.
 *
 * Writes backups to `Documents/BJJDojo/` via `@capacitor/filesystem`. The
 * web equivalent (`fileSystem.ts`) uses the File System Access API, which
 * doesn't exist in a WebView; this destination takes its place on native.
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { isNative } from '../../../platform'
import type { DatabaseBackup } from '../../../db/database'
import type {
  BackupDestination,
  BackupResult,
  DiscoveredBackup,
} from '../types'
import { getBackupRetentionCount, isFsBackupEnabled } from '../settings'

const FOLDER = 'BJJDojo'
const BACKUP_JSON_INDENT = 2
const BACKUP_FILENAME_PATTERN = /^bjj-dojo-backup(?:-\d{4}-\d{2}-\d{2})?\.json$/

function serialize(payload: DatabaseBackup): string {
  return `${JSON.stringify(payload, null, BACKUP_JSON_INDENT)}\n`
}

async function ensureFolder(): Promise<void> {
  try {
    await Filesystem.mkdir({
      path: FOLDER,
      directory: Directory.Documents,
      recursive: true,
    })
  } catch {
    // Already exists — Filesystem.mkdir throws when the dir is present;
    // any other failure surfaces from the subsequent write call.
  }
}

async function listMatchingFiles(): Promise<{ name: string; mtime: number }[]> {
  try {
    const res = await Filesystem.readdir({
      path: FOLDER,
      directory: Directory.Documents,
    })
    return res.files
      .filter((f) => f.type === 'file' && BACKUP_FILENAME_PATTERN.test(f.name))
      .map((f) => ({ name: f.name, mtime: f.mtime ?? 0 }))
  } catch {
    return []
  }
}

export const nativeFileSystemDestination: BackupDestination = {
  // Reuses the same destination ID as the web filesystem destination so
  // settings (`isFsBackupEnabled`, `setFsLastRun`, etc.) stay shared.
  // Only one of the two destinations is ever enabled at a time (gated by
  // `isNative`).
  id: 'fileSystem',

  async isEnabled() {
    if (!isNative) return false
    return isFsBackupEnabled()
  },

  async write(
    payload: DatabaseBackup,
    filename: string,
  ): Promise<BackupResult> {
    await ensureFolder()
    const data = serialize(payload)
    await Filesystem.writeFile({
      path: `${FOLDER}/${filename}`,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    await rotate(filename)
    return { filename, bytesWritten: data.length }
  },

  async discoverExistingBackups(): Promise<DiscoveredBackup[]> {
    const files = await listMatchingFiles()
    files.sort((a, b) => b.mtime - a.mtime)
    return files.map((f) => ({
      id: f.name,
      filename: f.name,
      label: `${f.name} (${new Date(f.mtime).toLocaleString()})`,
      modifiedAt: f.mtime,
    }))
  },

  async readBackup(id: string): Promise<DatabaseBackup> {
    const res = await Filesystem.readFile({
      path: `${FOLDER}/${id}`,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    const text = typeof res.data === 'string' ? res.data : ''
    return JSON.parse(text) as DatabaseBackup
  },
}

async function rotate(justWritten: string): Promise<void> {
  const keep = getBackupRetentionCount()
  const files = (await listMatchingFiles()).filter(
    (f) => f.name !== justWritten,
  )
  files.sort((a, b) => b.mtime - a.mtime)
  const toDelete = files.slice(Math.max(0, keep - 1))
  for (const f of toDelete) {
    try {
      await Filesystem.deleteFile({
        path: `${FOLDER}/${f.name}`,
        directory: Directory.Documents,
      })
    } catch {
      // best effort
    }
  }
}
