import { useEffect, useRef, useState } from 'react'
import { Cloud, Folder } from 'lucide-react'
import { useI18n } from '../i18n'
import type { DestinationId } from '../utils/autoBackup/types'

type DestState = 'idle' | 'syncing' | 'success'

interface ErrorInfo {
  destinationId: DestinationId
  error: string
}

interface OfflineToast {
  id: number
}

const DEST_LABELS: Record<DestinationId, string> = {
  fileSystem: 'folder',
  github: 'GitHub',
}

const SUCCESS_DURATION_MS = 3000

export default function BackupSyncIndicator() {
  const { t } = useI18n()
  const [destStates, setDestStates] = useState<
    Partial<Record<DestinationId, DestState>>
  >({})
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [offlineToasts, setOfflineToasts] = useState<OfflineToast[]>([])
  const successTimers = useRef<
    Partial<Record<DestinationId, ReturnType<typeof setTimeout>>>
  >({})
  const toastCounter = useRef(0)

  useEffect(() => {
    const handleTriggered = (e: Event) => {
      const { destinationIds } = (
        e as CustomEvent<{ destinationIds: DestinationId[] }>
      ).detail
      setDestStates((prev) => {
        const next = { ...prev }
        for (const destinationId of destinationIds) {
          next[destinationId] = 'syncing'
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
      Object.values(timers).forEach((t) => t && clearTimeout(t))
    }
  }, [])

  const activeDestinations = (
    Object.entries(destStates) as [DestinationId, DestState][]
  ).filter(([, state]) => state !== 'idle')

  return (
    <>
      {activeDestinations.length > 0 && (
        <div className="fixed top-3 left-3 z-50 flex gap-1.5 items-center">
          {activeDestinations.map(([destId, state]) => {
            const Icon = destId === 'github' ? Cloud : Folder
            return (
              <div
                key={destId}
                aria-label={
                  state === 'syncing'
                    ? `Syncing ${DEST_LABELS[destId]} backup…`
                    : t('Backup up to date')
                }
                className={`w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800/90 ${
                  state === 'success' ? 'text-green-400' : 'text-zinc-300'
                }`}
              >
                <Icon
                  size={14}
                  strokeWidth={2}
                  className={state === 'syncing' ? 'animate-spin' : ''}
                />
              </div>
            )
          })}
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
