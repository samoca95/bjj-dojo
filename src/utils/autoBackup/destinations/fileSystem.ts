/**
 * File System Access API destination.
 *
 * The directory handle is opaque to JSON, so it lives in the Dexie `appState`
 * table rather than localStorage. Permissions need a user gesture to upgrade
 * from 'prompt' → 'granted', so the caller is expected to invoke the picker
 * (or the reconnect button) in response to a click.
 */
import {
  getAppStateValue,
  setAppStateValue,
  deleteAppStateValue,
  type DatabaseBackup,
} from '../../../db/database'
import type {
  BackupDestination,
  BackupResult,
  DiscoveredBackup,
} from '../types'
import { isFsBackupEnabled, setFsFolderName } from '../settings'

const HANDLE_KEY = 'autoBackup.fsHandle'

// Window-level types — the FS Access API isn't in TS's default lib.dom in all
// configs. Keep narrow surface area to avoid pulling in a polyfill type pkg.
type FsPermissionState = 'granted' | 'denied' | 'prompt'
interface DirectoryHandle {
  name: string
  kind: 'directory'
  queryPermission(opts: { mode: 'readwrite' }): Promise<FsPermissionState>
  requestPermission(opts: { mode: 'readwrite' }): Promise<FsPermissionState>
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandle>
  removeEntry(name: string): Promise<void>
  values(): AsyncIterable<DirectoryEntry>
}
interface FileHandle {
  name: string
  kind: 'file'
  getFile(): Promise<File>
  createWritable(): Promise<
    WritableStreamDefaultWriter<unknown> & {
      write(data: string): Promise<void>
      close(): Promise<void>
    }
  >
}
type DirectoryEntry = DirectoryHandle | FileHandle

interface DirectoryPickerWindow {
  showDirectoryPicker?: (options: {
    mode: 'readwrite'
    id?: string
  }) => Promise<DirectoryHandle>
}

export function isFileSystemDestinationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as DirectoryPickerWindow).showDirectoryPicker ===
      'function'
  )
}

export async function pickBackupFolder(): Promise<DirectoryHandle> {
  const w = window as unknown as DirectoryPickerWindow
  if (!w.showDirectoryPicker) {
    throw new Error('Folder picker not supported in this browser.')
  }
  const handle = await w.showDirectoryPicker({
    mode: 'readwrite',
    id: 'bjj-dojo-backup-folder',
  })
  await setAppStateValue(HANDLE_KEY, handle as unknown)
  setFsFolderName(handle.name)
  return handle
}

export async function disconnectBackupFolder(): Promise<void> {
  await deleteAppStateValue(HANDLE_KEY)
  setFsFolderName(null)
}

export async function getStoredFolderHandle(): Promise<DirectoryHandle | null> {
  const stored = await getAppStateValue<DirectoryHandle>(HANDLE_KEY)
  return stored ?? null
}

export async function ensureFolderPermission(
  handle: DirectoryHandle,
  requestIfNeeded = false,
): Promise<FsPermissionState> {
  const current = await handle.queryPermission({ mode: 'readwrite' })
  if (current === 'granted') return current
  if (!requestIfNeeded) return current
  return await handle.requestPermission({ mode: 'readwrite' })
}

const BACKUP_FILENAME_PATTERN = /^bjj-dojo-backup(?:-\d{4}-\d{2}-\d{2})?\.json$/

async function listBackupFiles(handle: DirectoryHandle): Promise<FileHandle[]> {
  const matches: FileHandle[] = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && BACKUP_FILENAME_PATTERN.test(entry.name)) {
      matches.push(entry)
    }
  }
  return matches
}

export const fileSystemDestination: BackupDestination = {
  id: 'fileSystem',

  async isEnabled() {
    if (!isFsBackupEnabled()) return false
    const handle = await getStoredFolderHandle()
    if (!handle) return false
    const perm = await ensureFolderPermission(handle, false)
    return perm === 'granted'
  },

  async write(
    payload: DatabaseBackup,
    filename: string,
  ): Promise<BackupResult> {
    const handle = await getStoredFolderHandle()
    if (!handle) throw new Error('No backup folder connected.')
    const perm = await ensureFolderPermission(handle, false)
    if (perm !== 'granted') {
      throw new Error(
        'Folder permission was revoked. Reconnect the folder in Settings.',
      )
    }
    const fileHandle = await handle.getFileHandle(filename, { create: true })
    const serialized = JSON.stringify(payload)
    const writable = await fileHandle.createWritable()
    await writable.write(serialized)
    await writable.close()
    await rotateOldBackups(handle, filename)
    return { filename, bytesWritten: serialized.length }
  },

  async discoverExistingBackups(): Promise<DiscoveredBackup[]> {
    const handle = await getStoredFolderHandle()
    if (!handle) return []
    const perm = await ensureFolderPermission(handle, false)
    if (perm !== 'granted') return []
    const files = await listBackupFiles(handle)
    const results = await Promise.all(
      files.map(async (fh) => {
        const file = await fh.getFile()
        const modifiedAt = file.lastModified
        return {
          id: fh.name,
          filename: fh.name,
          label: `${fh.name} (${new Date(modifiedAt).toLocaleString()})`,
          modifiedAt,
        }
      }),
    )
    results.sort((a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0))
    return results
  },

  async readBackup(id: string): Promise<DatabaseBackup> {
    const handle = await getStoredFolderHandle()
    if (!handle) throw new Error('No backup folder connected.')
    const fileHandle = await handle.getFileHandle(id, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as DatabaseBackup
  },
}

/** Keep the 7 most recent daily backups; remove older same-pattern files. */
async function rotateOldBackups(handle: DirectoryHandle, justWritten: string) {
  const KEEP = 7
  const files = await listBackupFiles(handle)
  // Skip the file we just wrote — its lastModified is current
  const dated = await Promise.all(
    files
      .filter((f) => f.name !== justWritten)
      .map(async (f) => ({
        name: f.name,
        mtime: (await f.getFile()).lastModified,
      })),
  )
  dated.sort((a, b) => b.mtime - a.mtime)
  // We just wrote one — keep KEEP-1 of the existing files
  const toDelete = dated.slice(Math.max(0, KEEP - 1))
  for (const f of toDelete) {
    try {
      await handle.removeEntry(f.name)
    } catch {
      // best effort
    }
  }
}
