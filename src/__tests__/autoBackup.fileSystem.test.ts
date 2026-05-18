/**
 * Tests for the File System destination's permission-staleness handling.
 *
 * We mock a `DirectoryHandle` instead of relying on `showDirectoryPicker`
 * (jsdom has no FS Access API). The mock lets us flip the queryPermission
 * result between calls to simulate a handle that loses permission between
 * sessions, which is the most common "backup silently stopped working"
 * symptom we're guarding against.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db } from '../db/database'
import {
  fileSystemDestination,
  verifyFolderConnection,
  reconnectBackupFolder,
} from '../utils/autoBackup/destinations/fileSystem'
import {
  getFsNeedsReconnect,
  setFsBackupEnabled,
  setFsFolderName,
} from '../utils/autoBackup/settings'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'

interface MockHandle {
  name: string
  kind: 'directory'
  permission: 'granted' | 'denied' | 'prompt'
  queryPermission: ReturnType<typeof vi.fn>
  requestPermission: ReturnType<typeof vi.fn>
}

function mockHandle(
  permission: 'granted' | 'denied' | 'prompt' = 'granted',
): MockHandle {
  const h: MockHandle = {
    name: 'My Backups',
    kind: 'directory',
    permission,
    queryPermission: vi.fn(async () => h.permission),
    requestPermission: vi.fn(async () => h.permission),
  }
  return h
}

let storedHandle: MockHandle | null = null

beforeEach(async () => {
  if (!db.isOpen()) await db.open()
  clearAllPrefixedStorage(window.localStorage)
  // Stub the appState reads/writes so the test never needs to round-trip a
  // mock handle through IndexedDB's structured-clone (it strips functions).
  storedHandle = null
  // Dexie's typed signatures expect a PromiseExtended; an unknown-typed cast
  // keeps the spy simple while still exercising the production code paths.
  const get = vi.fn(async (key: string) =>
    key === 'autoBackup.fsHandle' && storedHandle
      ? { key, value: storedHandle as unknown }
      : undefined,
  )
  const put = vi.fn(async (record: { key: string; value: unknown }) => {
    if (record.key === 'autoBackup.fsHandle')
      storedHandle = record.value as MockHandle
    return record.key
  })
  const del = vi.fn(async (key: string) => {
    if (key === 'autoBackup.fsHandle') storedHandle = null
  })
  vi.spyOn(db.appState, 'get').mockImplementation(get as never)
  vi.spyOn(db.appState, 'put').mockImplementation(put as never)
  vi.spyOn(db.appState, 'delete').mockImplementation(del as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  clearAllPrefixedStorage(window.localStorage)
})

function setSavedHandle(h: MockHandle | null) {
  storedHandle = h
}

describe('verifyFolderConnection', () => {
  it('returns no-handle and clears needs-reconnect when no handle is saved', async () => {
    window.localStorage.setItem('bjj-dojo:auto-backup-fs-needs-reconnect', '1')
    const result = await verifyFolderConnection()
    expect(result).toBe('no-handle')
    expect(getFsNeedsReconnect()).toBe(false)
  })

  it('marks needs-reconnect when the saved handle reports prompt', async () => {
    const handle = mockHandle('prompt')
    setSavedHandle(handle)
    setFsFolderName(handle.name)
    setFsBackupEnabled(true)
    const result = await verifyFolderConnection()
    expect(result).toBe('needs-reconnect')
    expect(getFsNeedsReconnect()).toBe(true)
  })

  it('returns granted and clears needs-reconnect when permission is intact', async () => {
    const handle = mockHandle('granted')
    setSavedHandle(handle)
    window.localStorage.setItem('bjj-dojo:auto-backup-fs-needs-reconnect', '1')
    const result = await verifyFolderConnection()
    expect(result).toBe('granted')
    expect(getFsNeedsReconnect()).toBe(false)
  })
})

describe('fileSystemDestination.isEnabled', () => {
  it('is false when needs-reconnect is set so we do not attempt to write', async () => {
    const handle = mockHandle('granted')
    setSavedHandle(handle)
    setFsBackupEnabled(true)
    window.localStorage.setItem('bjj-dojo:auto-backup-fs-needs-reconnect', '1')
    expect(await fileSystemDestination.isEnabled()).toBe(false)
  })

  it('sets needs-reconnect if the live permission check returns prompt', async () => {
    const handle = mockHandle('prompt')
    setSavedHandle(handle)
    setFsBackupEnabled(true)
    expect(await fileSystemDestination.isEnabled()).toBe(false)
    expect(getFsNeedsReconnect()).toBe(true)
  })
})

describe('reconnectBackupFolder', () => {
  it('clears needs-reconnect when the user grants permission', async () => {
    const handle = mockHandle('prompt')
    setSavedHandle(handle)
    // Re-grant on requestPermission.
    handle.requestPermission.mockImplementation(async () => {
      handle.permission = 'granted'
      return 'granted'
    })
    const ok = await reconnectBackupFolder()
    expect(ok).toBe(true)
    expect(getFsNeedsReconnect()).toBe(false)
  })

  it('keeps needs-reconnect when the user denies the prompt', async () => {
    const handle = mockHandle('prompt')
    setSavedHandle(handle)
    handle.requestPermission.mockImplementation(async () => 'denied')
    const ok = await reconnectBackupFolder()
    expect(ok).toBe(false)
    expect(getFsNeedsReconnect()).toBe(true)
  })
})
