import { useEffect, useMemo, useRef, useState } from 'react'
import { Cloud, Folder, X } from 'lucide-react'
import { useI18n } from '../i18n'
import type { BackupComponent, DestinationId } from '../utils/autoBackup/types'

type DestState = 'idle' | 'syncing' | 'success'
type QueueState = 'queued' | 'syncing' | 'success' | 'failed'

interface ErrorInfo {
  destinationId: DestinationId
  error: string
}

interface OfflineToast {
  id: number
}

interface QueueFile {
  destinationId: DestinationId
  component: BackupComponent
  filename: string
  queueState: QueueState
  error?: string
  updatedAt: number
}

const DEST_LABELS: Record<DestinationId, string> = {
  fileSystem: 'folder',
  github: 'GitHub',
}

const DEFAULT_COMPONENTS: BackupComponent[] = [
  'preferences',
  'sessions',
  'techniques',
  'flows',
]

const SUCCESS_DURATION_MS = 3000

export default function BackupSyncIndicator() {
  const { t } = useI18n()
  const [destStates, setDestStates] = useState<
    Partial<Record<DestinationId, DestState>>
  >({})
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [offlineToasts, setOfflineToasts] = useState<OfflineToast[]>([])
  const [queueFiles, setQueueFiles] = useState<Record<string, QueueFile>>({})
  const [showQueuePopup, setShowQueuePopup] = useState(false)
  const successTimers = useRef<
    Partial<Record<DestinationId, ReturnType<typeof setTimeout>>>
  >({})
  const toastCounter = useRef(0)

  const queueKey = (destinationId: DestinationId, component: BackupComponent) =>
    `${destinationId}:${component}`

  useEffect(() => {
    const handleTriggered = (e: Event) => {
      const { destinationIds, components } = (
        e as CustomEvent<{
          destinationIds: DestinationId[]
          components?: BackupComponent[]
        }>
      ).detail
      const nextComponents =
        components && components.length > 0 ? components : DEFAULT_COMPONENTS
      setDestStates((prev) => {
        const next = { ...prev }
        for (const destinationId of destinationIds) {
          next[destinationId] = 'syncing'
        }
        return next
      })
      setQueueFiles((prev) => {
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

    const handleStarted = (e: Event) => {
      const { destinationId } = (
        e as CustomEvent<{ destinationId: DestinationId }>
      ).detail
      setDestStates((prev) => ({ ...prev, [destinationId]: 'syncing' }))
    }

    const handleSucceeded = (e: Event) => {
      const { destinationId } = (
        e as CustomEvent<{ destinationId: DestinationId }>
      ).detail
      setDestStates((prev) => ({ ...prev, [destinationId]: 'success' }))
      if (successTimers.current[destinationId])
        clearTimeout(successTimers.current[destinationId])
      successTimers.current[destinationId] = setTimeout(() => {
        setDestStates((prev) => ({ ...prev, [destinationId]: 'idle' }))
      }, SUCCESS_DURATION_MS)
    }

    const handleFailed = (e: Event) => {
      const { destinationId, error } = (
        e as CustomEvent<{ destinationId: DestinationId; error: string }>
      ).detail
      setDestStates((prev) => ({ ...prev, [destinationId]: 'idle' }))
      setErrorInfo({ destinationId, error })
      setQueueFiles((prev) => {
        const next = { ...prev }
        const now = Date.now()
        Object.entries(next).forEach(([key, item]) => {
          if (item.destinationId !== destinationId) return
          if (item.queueState !== 'queued' && item.queueState !== 'syncing')
            return
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

    const handleFileStarted = (e: Event) => {
      const { destinationId, component, filename } = (
        e as CustomEvent<{
          destinationId: DestinationId
          component: BackupComponent
          filename: string
        }>
      ).detail
      const key = queueKey(destinationId, component)
      setQueueFiles((prev) => ({
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

    const handleFileSucceeded = (e: Event) => {
      const { destinationId, component, filename } = (
        e as CustomEvent<{
          destinationId: DestinationId
          component: BackupComponent
          filename: string
        }>
      ).detail
      const key = queueKey(destinationId, component)
      setQueueFiles((prev) => ({
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

    const handleFileFailed = (e: Event) => {
      const { destinationId, component, filename, error } = (
        e as CustomEvent<{
          destinationId: DestinationId
          component: BackupComponent
          filename: string
          error: string
        }>
      ).detail
      const key = queueKey(destinationId, component)
      setQueueFiles((prev) => ({
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

    const handleOfflineSkipped = () => {
      const id = ++toastCounter.current
      setOfflineToasts((prev) => [...prev, { id }])
      setTimeout(() => {
        setOfflineToasts((prev) => prev.filter((t) => t.id !== id))
      }, 6000)
    }

    window.addEventListener('bjj-dojo:backup-triggered', handleTriggered)
    window.addEventListener('bjj-dojo:backup-dest-started', handleStarted)
    window.addEventListener('bjj-dojo:backup-dest-succeeded', handleSucceeded)
    window.addEventListener('bjj-dojo:backup-dest-failed', handleFailed)
    window.addEventListener('bjj-dojo:backup-file-started', handleFileStarted)
    window.addEventListener(
      'bjj-dojo:backup-file-succeeded',
      handleFileSucceeded,
    )
    window.addEventListener('bjj-dojo:backup-file-failed', handleFileFailed)
    window.addEventListener(
      'bjj-dojo:backup-offline-skipped',
      handleOfflineSkipped,
    )

    const timers = successTimers.current
    return () => {
      window.removeEventListener('bjj-dojo:backup-triggered', handleTriggered)
      window.removeEventListener('bjj-dojo:backup-dest-started', handleStarted)
      window.removeEventListener(
        'bjj-dojo:backup-dest-succeeded',
        handleSucceeded,
      )
      window.removeEventListener('bjj-dojo:backup-dest-failed', handleFailed)
      window.removeEventListener(
        'bjj-dojo:backup-offline-skipped',
        handleOfflineSkipped,
      )
      window.removeEventListener(
        'bjj-dojo:backup-file-started',
        handleFileStarted,
      )
      window.removeEventListener(
        'bjj-dojo:backup-file-succeeded',
        handleFileSucceeded,
      )
      window.removeEventListener('bjj-dojo:backup-file-failed', handleFileFailed)
      Object.values(timers).forEach((t) => t && clearTimeout(t))
    }
  }, [])

  const activeDestinations = (
    Object.entries(destStates) as [DestinationId, DestState][]
  ).filter(([, state]) => state !== 'idle')
  const isSyncing = activeDestinations.some(([, state]) => state === 'syncing')
  const visibleQueueFiles = useMemo(
    () =>
      Object.values(queueFiles).sort((a, b) => {
        const stateRank: Record<QueueState, number> = {
          syncing: 0,
          queued: 1,
          failed: 2,
          success: 3,
        }
        const stateDiff = stateRank[a.queueState] - stateRank[b.queueState]
        if (stateDiff !== 0) return stateDiff
        return b.updatedAt - a.updatedAt
      }),
    [queueFiles],
  )

  return (
    <>
      {activeDestinations.length > 0 && (
        <div className="fixed top-3 left-3 z-50 flex gap-1.5 items-center">
          {activeDestinations.map(([destId, state]) => {
            const Icon = destId === 'github' ? Cloud : Folder
            return (
              <button
                key={destId}
                type="button"
                onClick={() => {
                  if (state === 'syncing') setShowQueuePopup(true)
                }}
                aria-label={
                  state === 'syncing'
                    ? `Syncing ${DEST_LABELS[destId]} backup…`
                    : t('Backup up to date')
                }
                aria-haspopup="dialog"
                className={`w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800/90 ${
                  state === 'success' ? 'text-green-400' : 'text-zinc-300'
                }`}
              >
                <Icon
                  size={14}
                  strokeWidth={2}
                  className={state === 'syncing' ? 'animate-spin' : ''}
                />
              </button>
            )
          })}
        </div>
      )}

      {showQueuePopup && isSyncing && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-zinc-800">
              <h2 className="flex-1 text-base font-bold text-zinc-100">
                {t('Backup queue')}
              </h2>
              <button
                type="button"
                onClick={() => setShowQueuePopup(false)}
                aria-label="Close"
                className="p-1.5 -mr-1.5 text-zinc-400 active:text-zinc-100"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="px-4 py-3 text-xs text-zinc-400 border-b border-zinc-800">
              {t('Files currently being saved')}
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {visibleQueueFiles.length === 0 ? (
                <p className="text-sm text-zinc-400">{t('No files in queue')}</p>
              ) : (
                visibleQueueFiles.map((item) => (
                  <div
                    key={`${item.destinationId}:${item.component}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 capitalize">
                          {DEST_LABELS[item.destinationId]} · {item.component}
                        </p>
                        <p className="text-xs text-zinc-400 break-all mt-0.5">
                          {item.filename}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                        {item.queueState === 'queued'
                          ? t('Queued')
                          : item.queueState === 'syncing'
                            ? t('Saving')
                            : item.queueState === 'failed'
                              ? t('Failed')
                              : t('Saved')}
                      </span>
                    </div>
                    {item.error && (
                      <p className="mt-2 text-xs text-red-300 break-all">
                        {item.error}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {offlineToasts.map((toast) => (
        <div
          key={toast.id}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 py-2.5 bg-zinc-800 rounded-xl text-xs text-zinc-300 shadow-lg text-center"
        >
          {t(
            'No network — backup will be retried next time you save a session with a connection.',
          )}
        </div>
      ))}

      {errorInfo && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-5 space-y-3 border border-zinc-800">
            <h2 className="text-base font-bold text-zinc-100">
              {t('Backup failed')}
            </h2>
            <p className="text-sm text-zinc-300">
              <span className="capitalize">
                {DEST_LABELS[errorInfo.destinationId]}
              </span>
              {': '}
              {errorInfo.error}
            </p>
            <p className="text-xs text-zinc-500">
              {t('Your data is still safely stored in this browser.')}
            </p>
            <button
              onClick={() => setErrorInfo(null)}
              className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
