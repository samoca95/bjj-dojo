import { useEffect, useRef, useState } from 'react'
import { X, Copy, Check, ExternalLink } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  DeviceFlowError,
  requestDeviceCode,
  pollForToken,
  type DeviceCodeResponse,
} from '../utils/autoBackup/githubAuth'

interface Props {
  onClose: () => void
  onAuthorized: (token: string) => void
}

export default function DeviceFlowDialog({ onClose, onAuthorized }: Props) {
  const { t } = useI18n()
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    let cancelled = false
    ;(async () => {
      try {
        const code = await requestDeviceCode()
        if (cancelled) return
        setDeviceCode(code)
        const token = await pollForToken(code.device_code, code.interval, {
          signal: controller.signal,
        })
        if (cancelled) return
        onAuthorized(token)
      } catch (err) {
        if (cancelled) return
        if (err instanceof DeviceFlowError) {
          if (err.code === 'expired_token') {
            setError(t('Authorization timed out. Try again.'))
          } else if (err.code === 'access_denied') {
            setError(t('Authorization was denied.'))
          } else if (err.code === 'not_configured') {
            setError(t('GitHub login is not configured in this build.'))
          } else {
            setError(err.message)
          }
        } else {
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [onAuthorized, t])

  const handleCopy = async () => {
    if (!deviceCode) return
    try {
      await navigator.clipboard.writeText(deviceCode.user_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore — copy is a convenience
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5 text-zinc-100 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('Connect GitHub')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 active:bg-zinc-800"
            aria-label={t('Cancel')}
          >
            <X size={16} />
          </button>
        </div>

        {error ? (
          <div className="space-y-3">
            <p className="text-xs text-red-300">{error}</p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-zinc-800 py-2 text-xs font-semibold active:bg-zinc-700"
            >
              {t('Cancel')}
            </button>
          </div>
        ) : !deviceCode ? (
          <p className="text-xs text-zinc-400">
            {t('Waiting for authorization…')}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              {t('Enter this code at GitHub')}:
            </p>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-800 px-3 py-3">
              <code className="font-mono text-lg tracking-widest text-gold">
                {deviceCode.user_code}
              </code>
              <button
                onClick={() => void handleCopy()}
                className="flex items-center gap-1 rounded-lg bg-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 active:bg-zinc-600"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? t('Copied') : t('Copy code')}
              </button>
            </div>
            <a
              href={deviceCode.verification_uri}
              target="_blank"
              rel="noreferrer noopener"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gold py-2 text-xs font-semibold text-black active:bg-gold-light"
            >
              <ExternalLink size={12} />
              {t('Open GitHub')}
            </a>
            <p className="text-[11px] text-zinc-500">
              {t('Waiting for authorization…')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
