import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUOTA_ERROR_EVENT } from '../utils/quotaError'
import { useI18n } from '../i18n'

export default function QuotaErrorModal() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    const handle = () => setOpen(true)
    window.addEventListener(QUOTA_ERROR_EVENT, handle)
    return () => window.removeEventListener(QUOTA_ERROR_EVENT, handle)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="max-w-sm w-full bg-zinc-900 rounded-2xl p-5 space-y-3">
        <h2 className="text-base font-bold text-gold">{t('Storage full')}</h2>
        <p className="text-sm text-zinc-300">
          {t('Your device storage is full. Export a backup to free up space.')}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 bg-zinc-800 text-zinc-100 text-sm font-semibold"
          >
            {t('Dismiss')}
          </button>
          <button
            onClick={() => { setOpen(false); navigate('/settings') }}
            className="rounded-xl px-3 py-2 bg-gold text-black text-sm font-semibold"
          >
            {t('Export backup')}
          </button>
        </div>
      </div>
    </div>
  )
}
