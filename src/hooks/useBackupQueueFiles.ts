/**
 * Module-level store for the per-file backup queue state. We keep the state
 * here (rather than inside a component) because:
 *  - The `<BackupQueuePopup>` mounts on demand. If we listened to events only
 *    while mounted, we'd miss everything that happened before the click.
 *  - Multiple consumers (the BackupSyncIndicator + the Settings page popup)
 *    should see the same state without races.
 *
 * Wiring: `attachBackupQueueListeners()` is called once at module load and
 * accumulates state in the `queueState` map. `useBackupQueueFiles()` is a tiny
 * subscribe hook that re-renders on each update.
 */
import { useEffect, useMemo, useState } from 'react'
import type { BackupComponent, DestinationId } from '../utils/autoBackup/types'

export type QueueState = 'queued' | 'syncing' | 'success' | 'failed'

export interface QueueFile {
  destinationId: DestinationId
  component: BackupComponent
  filename: string
  queueState: QueueState
  error?: string
  updatedAt: number
}

const DEFAULT_COMPONENTS: BackupComponent[] = [
  'preferences',
  'sessions',
  'techniques',
  'flows',
]

const queueKey = (destinationId: DestinationId, component: BackupComponent) =>
  `${destinationId}:${component}`

const STATE_RANK: Record<QueueState, number> = {
  syncing: 0,
  queued: 1,
  failed: 2,
  success: 3,
}

let queueState: Record<string, QueueFile> = {}
const subscribers = new Set<() => void>()
let listenersAttached = false

function emit() {
  subscribers.forEach((cb) => cb())
}

function set(
  updater: (prev: Record<string, QueueFile>) => Record<string, QueueFile>,
) {
  queueState = updater(queueState)
  emit()
}

function handleTriggered(e: Event) {
  const { destinationIds, components } = (
    e as CustomEvent<{
      destinationIds: DestinationId[]
      components?: BackupComponent[]
    }>
  ).detail
  const nextComponents =
    components && components.length > 0 ? components : DEFAULT_COMPONENTS
  set((prev) => {
    const next = { ...prev }
    const now = Date.now()
    for (const destinationId of destinationIds) {
      for (const component of nextComponents) {
        const key = queueKey(destinationId, component)
        next[key] = {
          destinationId,
          component,
          filename: `bjj-dojo-backup-${component}-*.json`,
          queueState: 'queued',
          updatedAt: now,
        }
      }
    }
    return next
  })
}

function handleDestFailed(e: Event) {
  const { destinationId, error } = (
    e as CustomEvent<{ destinationId: DestinationId; error: string }>
  ).detail
  set((prev) => {
    const next = { ...prev }
    const now = Date.now()
    Object.entries(next).forEach(([key, item]) => {
      if (item.destinationId !== destinationId) return
      if (item.queueState !== 'queued' && item.queueState !== 'syncing') return
      next[key] = {
        ...item,
        queueState: 'failed',
        error,
        updatedAt: now,
      }
    })
    return next
  })
}

function handleFileStarted(e: Event) {
  const { destinationId, component, filename } = (
    e as CustomEvent<{
      destinationId: DestinationId
      component: BackupComponent
      filename: string
    }>
  ).detail
  const key = queueKey(destinationId, component)
  set((prev) => ({
    ...prev,
    [key]: {
      destinationId,
      component,
      filename,
      queueState: 'syncing',
      updatedAt: Date.now(),
    },
  }))
}

function handleFileSucceeded(e: Event) {
  const { destinationId, component, filename } = (
    e as CustomEvent<{
      destinationId: DestinationId
      component: BackupComponent
      filename: string
    }>
  ).detail
  const key = queueKey(destinationId, component)
  set((prev) => ({
    ...prev,
    [key]: {
      destinationId,
      component,
      filename,
      queueState: 'success',
      updatedAt: Date.now(),
    },
  }))
}

function handleFileFailed(e: Event) {
  const { destinationId, component, filename, error } = (
    e as CustomEvent<{
      destinationId: DestinationId
      component: BackupComponent
      filename: string
      error: string
    }>
  ).detail
  const key = queueKey(destinationId, component)
  set((prev) => ({
    ...prev,
    [key]: {
      destinationId,
      component,
      filename,
      queueState: 'failed',
      error,
      updatedAt: Date.now(),
    },
  }))
}

export function attachBackupQueueListeners() {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  window.addEventListener('bjj-dojo:backup-triggered', handleTriggered)
  window.addEventListener('bjj-dojo:backup-dest-failed', handleDestFailed)
  window.addEventListener('bjj-dojo:backup-file-started', handleFileStarted)
  window.addEventListener('bjj-dojo:backup-file-succeeded', handleFileSucceeded)
  window.addEventListener('bjj-dojo:backup-file-failed', handleFileFailed)
}

// Reset for tests — clears state and detaches listeners.
export function _resetBackupQueueForTests() {
  if (listenersAttached && typeof window !== 'undefined') {
    window.removeEventListener('bjj-dojo:backup-triggered', handleTriggered)
    window.removeEventListener('bjj-dojo:backup-dest-failed', handleDestFailed)
    window.removeEventListener(
      'bjj-dojo:backup-file-started',
      handleFileStarted,
    )
    window.removeEventListener(
      'bjj-dojo:backup-file-succeeded',
      handleFileSucceeded,
    )
    window.removeEventListener('bjj-dojo:backup-file-failed', handleFileFailed)
    listenersAttached = false
  }
  queueState = {}
  subscribers.clear()
}

if (typeof window !== 'undefined') {
  attachBackupQueueListeners()
}

export function useBackupQueueFiles(filterDestination?: DestinationId) {
  attachBackupQueueListeners()
  const [, force] = useState(0)
  useEffect(() => {
    const cb = () => force((n) => n + 1)
    subscribers.add(cb)
    return () => {
      subscribers.delete(cb)
    }
  }, [])

  const visibleQueueFiles = useMemo(() => {
    return Object.values(queueState)
      .filter((item) =>
        filterDestination ? item.destinationId === filterDestination : true,
      )
      .sort((a, b) => {
        const stateDiff = STATE_RANK[a.queueState] - STATE_RANK[b.queueState]
        if (stateDiff !== 0) return stateDiff
        return b.updatedAt - a.updatedAt
      })
    // queueState is module-level; force re-runs the memo when it mutates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDestination, queueState])

  return { queueFiles: queueState, visibleQueueFiles }
}
