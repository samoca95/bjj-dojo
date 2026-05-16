import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { _resetSchedulerForTests } from '../utils/autoBackup'
import { notifyDbMutation } from '../utils/autoBackup/notify'
import { getLastMutationTime } from '../utils/autoBackup/settings'
import { clearAllPrefixedStorage } from '../utils/backupPreferences'

beforeEach(() => {
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
})

afterEach(() => {
  clearAllPrefixedStorage(window.localStorage)
  _resetSchedulerForTests()
})

describe('notifyDbMutation', () => {
  it('writes the last mutation timestamp', () => {
    const before = Date.now()
    notifyDbMutation()
    const stored = getLastMutationTime()
    expect(stored).not.toBeNull()
    expect(stored!).toBeGreaterThanOrEqual(before)
  })

  it('is a no-op for the scheduler when no destination is enabled', () => {
    // Should not throw despite no enabled destinations — schedule bails early.
    expect(() => notifyDbMutation()).not.toThrow()
  })
})
