/**
 * File System Access API destination.
 *
 * The directory handle is opaque to JSON, so it lives in the Dexie `appState`
 * table rather than localStorage. Permissions can lapse silently across
 * browser restarts; when that happens we set the `needs-reconnect` flag so
 * the UI surfaces a clear reconnect CTA instead of failing silently on the
 * next mutation. Re-granting permission requires a user gesture, so the
 * caller (button click) must invoke `verifyFolderConnection` /
 * `pickBackupFolder` from inside the handler.
 *
 * Files are written under per-component subdirectories (preferences/, sessions/,
 * techniques/, flows/). Legacy flat files at the picked-folder root are still
 * read for backwards-compatible restore, but new writes never land there.
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
import {
  getBackupRetentionCount,
  getFsNeedsReconnect,
  isFsBackupEnabled,
  setFsFolderName,
  setFsLastError,
  setFsNeedsReconnect,
} from '../settings'
import {
  BACKUP_COMPONENTS,
  BACKUP_SUBDIR_FOR_COMPONENT,
  backupSubdirForComponent,
  isRecognizedBackupFilename,
  parseBackupComponentFromFilename,
} from '../files'

const HANDLE_KEY = 'autoBackup.fsHandle'
const BACKUP_JSON_INDENT = 2
let writeQueue: Promise<void> = Promise.resolve()

function serializeBackup(payload: DatabaseBackup): string {
  return `${JSON.stringify(payload, null, BACKUP_JSON_INDENT)}\n`
}

// Window-level types — the FS Access API isn't in TS's default lib.dom in all
// configs. Keep narrow surface area to avoid pulling in a polyfill type pkg.
type FsPermissionState = 'granted' | 'denied' | 'prompt'
interface DirectoryHandle {
  name: string
  kind: 'directory'
  queryPermission(opts: { mode: 'readwrite' }): Promise<FsPermissionState>
  requestPermission(opts: { mode: 'readwrite' }): Promise<FsPermissionState>
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandle>
  getDirectoryHandle(
    name: string,
    opts?: { create?: boolean },
  ): Promise<DirectoryHandle>
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
  setFsNeedsReconnect(false)
  setFsLastError(null)
  return handle
}

export async function disconnectBackupFolder(): Promise<void> {
  await deleteAppStateValue(HANDLE_KEY)
  setFsFolderName(null)
  setFsNeedsReconnect(false)
  setFsLastError(null)
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

/**
 * Re-acquire permission on the stored handle. Must be called from a user
 * gesture (button click) — the browser will reject the permission prompt
 * otherwise. Clears `needs-reconnect` on success.
 */
export async function reconnectBackupFolder(): Promise<boolean> {
  const handle = await getStoredFolderHandle()
  if (!handle) return false
  const perm = await ensureFolderPermission(handle, true)
  if (perm === 'granted') {
    setFsNeedsReconnect(false)
    setFsLastError(null)
    return true
  }
  setFsNeedsReconnect(true)
  return false
}

/**
 * Probe the stored handle without prompting. Sets `needs-reconnect` if the
 * handle exists but permission has lapsed. Safe to call on app start.
 */
export async function verifyFolderConnection(): Promise<
  'no-handle' | 'granted' | 'needs-reconnect'
> {
  const handle = await getStoredFolderHandle()
  if (!handle) {
    setFsNeedsReconnect(false)
    return 'no-handle'
  }
  const perm = await ensureFolderPermission(handle, false)
  if (perm === 'granted') {
    setFsNeedsReconnect(false)
    return 'granted'
  }
  setFsNeedsReconnect(true)
  return 'needs-reconnect'
}

async function getSubdirHandle(
  root: DirectoryHandle,
  subdir: string,
  create: boolean,
): Promise<DirectoryHandle | null> {
  try {
    return await root.getDirectoryHandle(subdir, { create })
  } catch {
    return null
  }
}

interface ListedBackupFile {
  handle: FileHandle
  /** Subdirectory the file lives in, or '' for legacy flat-root files. */
  subdir: string
}

async function listSubdirFiles(
  subdirHandle: DirectoryHandle,
): Promise<FileHandle[]> {
  const matches: FileHandle[] = []
  for await (const entry of subdirHandle.values()) {
    if (entry.kind === 'file' && isRecognizedBackupFilename(entry.name)) {
      matches.push(entry)
    }
  }
  return matches
}

/**
 * Walks the picked folder + each known subdir, returning every backup file
 * with its subdir context. Subdirs we don't recognize are ignored.
 */
async function listAllBackupFiles(
  handle: DirectoryHandle,
): Promise<ListedBackupFile[]> {
  const out: ListedBackupFile[] = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && isRecognizedBackupFilename(entry.name)) {
      out.push({ handle: entry, subdir: '' })
    }
  }
  for (const subdir of Object.values(BACKUP_SUBDIR_FOR_COMPONENT)) {
    const sub = await getSubdirHandle(handle, subdir, false)
    if (!sub) continue
    const files = await listSubdirFiles(sub)
    for (const fh of files) out.push({ handle: fh, subdir })
  }
  return out
}

export const fileSystemDestination: BackupDestination = {
  id: 'fileSystem',

  async isEnabled() {
    if (!isFsBackupEnabled()) return false
    if (getFsNeedsReconnect()) return false
    const handle = await getStoredFolderHandle()
    if (!handle) return false
    const perm = await ensureFolderPermission(handle, false)
    if (perm !== 'granted') {
      setFsNeedsReconnect(true)
      return false
    }
    return true
  },

  async write(
    payload: DatabaseBackup,
    filename: string,
  ): Promise<BackupResult> {
    const run = async () => {
      const handle = await getStoredFolderHandle()
      if (!handle) throw new Error('No backup folder connected.')
      const perm = await ensureFolderPermission(handle, false)
      if (perm !== 'granted') {
        setFsNeedsReconnect(true)
        throw new Error(
          'Folder permission was revoked. Reconnect the folder in Settings.',
        )
      }
      const component = parseBackupComponentFromFilename(filename)
      const subdir = component ? backupSubdirForComponent(component) : null
      const targetDir = subdir
        ? await handle.getDirectoryHandle(subdir, { create: true })
        : handle
      const fileHandle = await targetDir.getFileHandle(filename, {
        create: true,
      })
      const serialized = serializeBackup(payload)
      const writable = await fileHandle.createWritable()
      await writable.write(serialized)
      await writable.close()
      await rotateOldBackups(handle, filename, subdir)
      const relPath = subdir ? `${subdir}/${filename}` : filename
      return { filename: relPath, bytesWritten: serialized.length }
    }
    const queued = writeQueue.then(run, run)
    writeQueue = queued.then(
      () => undefined,
      () => undefined,
    )
    return await queued
  },

  async discoverExistingBackups(): Promise<DiscoveredBackup[]> {
    const handle = await getStoredFolderHandle()
    if (!handle) return []
    const perm = await ensureFolderPermission(handle, false)
    if (perm !== 'granted') {
      setFsNeedsReconnect(true)
      return []
    }
    const all = await listAllBackupFiles(handle)
    const results = await Promise.all(
      all.map(async ({ handle: fh, subdir }) => {
        const file = await fh.getFile()
        const modifiedAt = file.lastModified
        const id = subdir ? `${subdir}/${fh.name}` : fh.name
        return {
          id,
          filename: fh.name,
          label: `${id} (${new Date(modifiedAt).toLocaleString()})`,
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
    const slashIndex = id.indexOf('/')
    let dir: DirectoryHandle = handle
    let name = id
    if (slashIndex !== -1) {
      const subdir = id.slice(0, slashIndex)
      name = id.slice(slashIndex + 1)
      dir = await handle.getDirectoryHandle(subdir, { create: false })
    }
    const fileHandle = await dir.getFileHandle(name, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as DatabaseBackup
  },
}

/**
 * Keep the N most recent backups for the just-written component. When `subdir`
 * is set, rotation happens inside that subdirectory only — legacy flat files
 * at the picked-folder root are left untouched.
 */
async function rotateOldBackups(
  root: DirectoryHandle,
  justWritten: string,
  subdir: string | null,
) {
  const KEEP = getBackupRetentionCount()
  const writtenComponent = parseBackupComponentFromFilename(justWritten)
  let dir: DirectoryHandle = root
  if (subdir) {
    const sub = await getSubdirHandle(root, subdir, false)
    if (!sub) return
    dir = sub
  }
  const files = (await listSubdirFiles(dir)).filter(
    (f) => f.name !== justWritten,
  )
  const sameComponent = files.filter((f) => {
    if (!writtenComponent) return true
    return parseBackupComponentFromFilename(f.name) === writtenComponent
  })
  const dated = await Promise.all(
    sameComponent.map(async (f) => ({
      name: f.name,
      mtime: (await f.getFile()).lastModified,
    })),
  )
  dated.sort((a, b) => b.mtime - a.mtime)
  // We just wrote one — keep KEEP-1 of the existing files
  const toDelete = dated.slice(Math.max(0, KEEP - 1))
  for (const f of toDelete) {
    try {
      await dir.removeEntry(f.name)
    } catch {
      // best effort
    }
  }
}

// Re-export for tests / orchestrator helpers that want the component list.
export { BACKUP_COMPONENTS }
