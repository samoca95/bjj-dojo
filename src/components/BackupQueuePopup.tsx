import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useBackupQueueFiles } from '../hooks/useBackupQueueFiles'
import type { DestinationId } from '../utils/autoBackup/types'

const DEST_LABELS: Record<DestinationId, string> = {
  fileSystem: 'folder',
  github: 'GitHub',
}

interface BackupQueuePopupProps {
  onClose: () => void
  filterDestination?: DestinationId
}

export default function BackupQueuePopup({
  onClose,
  filterDestination,
}: BackupQueuePopupProps) {
  const { t } = useI18n()
  const { visibleQueueFiles } = useBackupQueueFiles(filterDestination)

  return (
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
            onClick={onClose}
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
  )
}
