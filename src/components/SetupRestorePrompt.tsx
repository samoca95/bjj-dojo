import { useState } from 'react'
import { useI18n, setAppLanguage, type AppLanguage } from '../i18n'

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
import { githubDestination } from '../utils/autoBackup/destinations/github'
import { verifyGithubToken } from '../utils/autoBackup/destinations/github'
import {
  setFsBackupEnabled,
  setGithubBackupEnabled,
  setGithubToken,
  setGithubTarget,
  type GithubTarget,
} from '../utils/autoBackup/settings'
import { telemetry } from '../utils/telemetry'
import type {
  DiscoveredBackup,
  BackupDestination,
} from '../utils/autoBackup/types'
import { completeRestorePrompt } from './firstLaunchSetup'

type Step =
  | 'choose'
  | 'github-form'
  | 'searching'
  | 'pick-backup'
  | 'no-backup'
  | 'restoring'
  | 'error'

interface Props {
  onComplete: () => void
}

export default function SetupRestorePrompt({ onComplete }: Props) {
  const { t, language } = useI18n()
  const [step, setStep] = useState<Step>('choose')
  const [backups, setBackups] = useState<DiscoveredBackup[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [pickedDestination, setPickedDestination] =
    useState<BackupDestination | null>(null)
  const [githubToken, setGhToken] = useState('')
  const [githubRepo, setGhRepo] = useState('')
  const [githubGist, setGhGist] = useState('')
  const [githubMode, setGhMode] = useState<'repo' | 'gist'>('repo')
  const [busy, setBusy] = useState(false)

  const finishAndSkip = () => {
    completeRestorePrompt()
    onComplete()
  }

  const connectFolder = async () => {
    try {
      setBusy(true)
      await pickBackupFolder()
      setFsBackupEnabled(true)
      setPickedDestination(fileSystemDestination)
      await searchDestination(fileSystemDestination)
    } catch (err) {
      // User cancelled — stay on choose step. Only show on real errors.
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

  const connectGithub = async () => {
    try {
      setBusy(true)
      setErrorMessage('')
      await verifyGithubToken(githubToken)
      let target: GithubTarget
      if (githubMode === 'gist') {
        if (!githubGist.trim()) throw new Error('Gist ID is required.')
        target = { kind: 'gist', gistId: githubGist.trim() }
      } else {
        const [owner, repo] = githubRepo.split('/').map((s) => s.trim())
        if (!owner || !repo) throw new Error('Use owner/repo format.')
        target = { kind: 'repo', owner, repo }
      }
      setGithubToken(githubToken)
      setGithubTarget(target)
      setGithubBackupEnabled(true)
      setPickedDestination(githubDestination)
      await searchDestination(githubDestination)
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
      const payload = await pickedDestination.readBackup(id)
      const importedLanguage = await importDatabaseBackup(payload)
      invalidateCategoryCache()
      if (importedLanguage) setAppLanguage(importedLanguage)
      completeRestorePrompt()
      // Mark initial setup completed too — they came in with existing data.
      window.localStorage.setItem('bjj-dojo:initial-setup-completed', '1')
      onComplete()
    } catch (err) {
      telemetry.error('backup.restore_failed', err)
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-100">
            {t('Set up backup')}
          </h2>
          <p className="text-sm text-zinc-400">
            {t('Where should we keep your backups?')}
          </p>
        </div>

        {step === 'choose' && (
          <div className="space-y-2">
            {isFileSystemDestinationSupported() ? (
              <button
                onClick={() => void connectFolder()}
                disabled={busy}
                className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60"
              >
                {t('A folder on your device')}
              </button>
            ) : (
              <p className="text-xs text-zinc-500 px-1">
                {t(
                  'Folder backup is only available in Chromium-based browsers.',
                )}
              </p>
            )}
            <button
              onClick={() => setStep('github-form')}
              disabled={busy}
              className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60"
            >
              {t('A GitHub repo or gist')}
            </button>
            <button
              onClick={finishAndSkip}
              className="w-full rounded-xl bg-zinc-800/50 text-zinc-300 text-sm py-2.5 active:bg-zinc-800"
            >
              {t('Skip — start fresh in this browser')}
            </button>
          </div>
        )}

        {step === 'github-form' && (
          <div className="space-y-3">
            <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setGhMode('repo')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  githubMode === 'repo'
                    ? 'bg-gold text-black'
                    : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                Repo
              </button>
              <button
                onClick={() => setGhMode('gist')}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  githubMode === 'gist'
                    ? 'bg-gold text-black'
                    : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                Gist
              </button>
            </div>
            <input
              type="password"
              placeholder={t('GitHub token')}
              value={githubToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
            {githubMode === 'repo' ? (
              <input
                type="text"
                placeholder="owner/repo"
                value={githubRepo}
                onChange={(e) => setGhRepo(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
            ) : (
              <input
                type="text"
                placeholder={t('Gist ID')}
                value={githubGist}
                onChange={(e) => setGhGist(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
            )}
            <p className="text-xs text-zinc-500">
              {t(
                'Use a fine-grained token scoped to one repo. Revoke it if your device is lost.',
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep('choose')}
                disabled={busy}
                className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => void connectGithub()}
                disabled={busy || !githubToken}
                className="rounded-xl bg-gold text-black text-sm font-semibold py-2.5 disabled:opacity-60"
              >
                {t('Test connection')}
              </button>
            </div>
          </div>
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
    </div>
  )
}
