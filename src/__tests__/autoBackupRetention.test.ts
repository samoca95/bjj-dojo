import { describe, it, expect, beforeEach } from 'vitest'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'
import {
  DEFAULT_BACKUP_RETENTION,
  getBackupRetentionCount,
  setBackupRetentionCount,
} from '../utils/autoBackup/settings'

beforeEach(() => {
  clearAllPrefixedStorage(window.localStorage)
})

describe('backup retention setting', () => {
  it('defaults to 7 when unset', () => {
    expect(getBackupRetentionCount()).toBe(DEFAULT_BACKUP_RETENTION)
    expect(DEFAULT_BACKUP_RETENTION).toBe(7)
  })

  it('persists user-chosen values', () => {
    setBackupRetentionCount(14)
    expect(getBackupRetentionCount()).toBe(14)
  })

  it('clamps to [1, 365]', () => {
    setBackupRetentionCount(0)
    expect(getBackupRetentionCount()).toBe(1)
    setBackupRetentionCount(-5)
    expect(getBackupRetentionCount()).toBe(1)
    setBackupRetentionCount(10_000)
    expect(getBackupRetentionCount()).toBe(365)
  })

  it('falls back to the default when localStorage holds garbage', () => {
    window.localStorage.setItem('bjj-dojo:auto-backup-retention', 'banana')
    expect(getBackupRetentionCount()).toBe(DEFAULT_BACKUP_RETENTION)
  })

  it('truncates fractional values', () => {
    setBackupRetentionCount(7.9)
    expect(getBackupRetentionCount()).toBe(7)
  })

  it('dispatches the auto-backup-updated event', () => {
    let fired = 0
    const listener = () => {
      fired += 1
    }
    window.addEventListener('bjj-dojo:auto-backup-updated', listener)
    setBackupRetentionCount(30)
    window.removeEventListener('bjj-dojo:auto-backup-updated', listener)
    expect(fired).toBeGreaterThan(0)
  })
})
