import { useState } from 'react'
import { FolderOpen, HelpCircle, Cloud } from 'lucide-react'
import { useI18n, setAppLanguage, type AppLanguage } from '../i18n'
import BackupHelpModal from './BackupHelpModal'

const START_LABEL: Record<AppLanguage, string> = {
  en: 'Start',
  es: 'Comenzar',
  fr: 'Commencer',
}
import { importDatabaseBackup } from '../db/database'
import { invalidateCategoryCache } from '../db/categoryCache'
import {
  pickBackupFolder,
  fileSystemDestination,
  isFileSystemDestinationSupported,
} from '../utils/autoBackup/destinations/fileSystem'
import {
  googleDriveDestination,
  isGoogleDriveConfigured,
} from '../utils/autoBackup/destinations/cloud/googleDrive'
import {
  dropboxDestination,
  isDropboxConfigured,
} from '../utils/autoBackup/destinations/cloud/dropbox'
import {
  setFsBackupEnabled,
  setCloudBackupEnabled,
} from '../utils/autoBackup/settings'
import { readLatestBackupPayload } from '../utils/autoBackup'
import { telemetry } from '../utils/telemetry'
import type {
  DiscoveredBackup,
  BackupDestination,
} from '../utils/autoBackup/types'
import { completeRestorePrompt } from './firstLaunchSetup'

type Step =
  | 'choose'
  | 'connecting'
  | 'searching'
  | 'pick-backup'
  | 'no-backup'
  | 'restoring'
  | 'error'

interface Props {
  onComplete: (restored: boolean) => void
}

export default function SetupRestorePrompt({ onComplete }: Props) {
  const { t, language } = useI18n()
  const [step, setStep] = useState<Step>('choose')
  const [helpTab, setHelpTab] = useState<
    'overview' | 'folder' | 'cloud' | null
  >(null)
  const [backups, setBackups] = useState<DiscoveredBackup[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [pickedDestination, setPickedDestination] =
    useState<BackupDestination | null>(null)
  const [busy, setBusy] = useState(false)

  const finishAndSkip = () => {
    completeRestorePrompt()
    onComplete(false)
  }

  const connectFolder = async () => {
    try {
      setBusy(true)
      await pickBackupFolder()
      setFsBackupEnabled(true)
      setPickedDestination(fileSystemDestination)
      await searchDestination(fileSystemDestination)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setBusy(false)
        return
      }
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    } finally {
      setBusy(false)
    }
  }

  const connectCloud = async (
    destination: typeof googleDriveDestination | typeof dropboxDestination,
  ) => {
    try {
      setBusy(true)
      setStep('connecting')
      await destination.connect()
      setCloudBackupEnabled(destination.id, true)
      setPickedDestination(destination)
      await searchDestination(destination)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    } finally {
      setBusy(false)
    }
  }

  const searchDestination = async (destination: BackupDestination) => {
    setStep('searching')
    const found = await destination.discoverExistingBackups()
    if (found.length === 0) {
      setStep('no-backup')
      return
    }
    setBackups(found)
    setStep('pick-backup')
  }

  const restoreBackup = async (id: string) => {
    if (!pickedDestination) return
    try {
      setBusy(true)
      setStep('restoring')
      const payload = await readLatestBackupPayload(pickedDestination, id)
      const importedLanguage = await importDatabaseBackup(payload)
      invalidateCategoryCache()
      if (importedLanguage) setAppLanguage(importedLanguage)
      completeRestorePrompt()
      window.localStorage.setItem('bjj-dojo:initial-setup-completed', '1')
      onComplete(true)
    } catch (err) {
      telemetry.error('backup.restore_failed', err)
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    } finally {
      setBusy(false)
    }
  }

  const gdriveConfigured = isGoogleDriveConfigured()
  const dropboxConfigured = isDropboxConfigured()

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1">
            <h2 className="text-lg font-bold text-zinc-100">
              {t('Set up backup')}
            </h2>
            <p className="text-sm text-zinc-400">
              {t('Where should we keep your backups?')}
            </p>
          </div>
          <button
            onClick={() => setHelpTab('overview')}
            aria-label={t('Need help?')}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 active:bg-zinc-700 flex items-center justify-center shrink-0"
          >
            <HelpCircle size={16} strokeWidth={2.5} />
          </button>
        </div>

        {step === 'choose' && (
          <div className="space-y-2">
            {isFileSystemDestinationSupported() ? (
              <button
                onClick={() => void connectFolder()}
                disabled={busy}
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FolderOpen size={15} strokeWidth={2.25} className="shrink-0" />
                <span>{t('A folder on your device')}</span>
              </button>
            ) : (
              <p className="text-xs text-zinc-500 px-1">
                {t(
                  'Folder backup is only available in Chromium-based browsers.',
                )}
              </p>
            )}
            {gdriveConfigured ? (
              <button
                onClick={() => void connectCloud(googleDriveDestination)}
                disabled={busy}
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Cloud size={15} strokeWidth={2.25} className="shrink-0" />
                <span>{t('Connect Google Drive')}</span>
              </button>
            ) : (
              <p className="text-xs text-zinc-500 px-1">
                {t('Google Drive login is not configured in this build.')}
              </p>
            )}
            {dropboxConfigured ? (
              <button
                onClick={() => void connectCloud(dropboxDestination)}
                disabled={busy}
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Cloud size={15} strokeWidth={2.25} className="shrink-0" />
                <span>{t('Connect Dropbox')}</span>
              </button>
            ) : (
              <p className="text-xs text-zinc-500 px-1">
                {t('Dropbox login is not configured in this build.')}
              </p>
            )}
            <p className="text-xs text-zinc-500 px-1">
              {t('You can combine destinations later in Settings.')}
            </p>
            <button
              onClick={finishAndSkip}
              className="w-full rounded-xl bg-zinc-800/50 text-zinc-300 text-sm py-2.5 active:bg-zinc-800"
            >
              {t('Omit for now')}
            </button>
          </div>
        )}

        {step === 'connecting' && (
          <p className="text-sm text-zinc-300 py-2">
            {t('Connected. Looking for backups…')}
          </p>
        )}

        {step === 'searching' && (
          <p className="text-sm text-zinc-300 py-2">
            {t('Connected. Looking for backups…')}
          </p>
        )}

        {step === 'no-backup' && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">
              {t('No previous backup here — starting fresh.')}
            </p>
            <button
              onClick={finishAndSkip}
              className="w-full rounded-xl bg-gold text-black text-sm font-semibold py-2.5"
            >
              {START_LABEL[language]}
            </button>
          </div>
        )}

        {step === 'pick-backup' && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">
              {backups.length === 1
                ? t('Found a backup')
                : t('Choose a backup to restore')}
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {backups.map((b) => (
                <button
                  key={b.id}
                  onClick={() => void restoreBackup(b.id)}
                  disabled={busy}
                  className="w-full text-left rounded-xl bg-zinc-800 text-zinc-100 text-sm py-2.5 px-3 active:bg-zinc-700 disabled:opacity-60"
                >
                  {b.label}
                </button>
              ))}
            </div>
            <button
              onClick={finishAndSkip}
              className="w-full rounded-xl bg-zinc-800/50 text-zinc-300 text-sm py-2.5 active:bg-zinc-800"
            >
              {t('Ignore — start fresh')}
            </button>
          </div>
        )}

        {step === 'restoring' && (
          <p className="text-sm text-zinc-300 py-2">
            {t('Restore from backup')}…
          </p>
        )}

        {step === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-red-300">{errorMessage}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep('choose')}
                className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
              >
                {t('Try again')}
              </button>
              <button
                onClick={finishAndSkip}
                className="rounded-xl bg-zinc-800/50 text-zinc-300 text-sm py-2.5 active:bg-zinc-800"
              >
                {t('Skip — start fresh in this browser')}
              </button>
            </div>
          </div>
        )}
      </div>

      {helpTab && (
        <BackupHelpModal
          initialTab={helpTab}
          onClose={() => setHelpTab(null)}
        />
      )}
    </div>
  )
}
