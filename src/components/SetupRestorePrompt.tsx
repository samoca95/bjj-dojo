import { useEffect, useState } from 'react'
import { FolderOpen, HelpCircle } from 'lucide-react'
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
  githubDestination,
  listWritableRepos,
  verifyGithubToken,
  type GithubRepoSummary,
} from '../utils/autoBackup/destinations/github'
import {
  getGithubToken,
  setFsBackupEnabled,
  setGithubBackupEnabled,
  setGithubToken,
  setGithubTarget,
} from '../utils/autoBackup/settings'
import { readLatestBackupPayload } from '../utils/autoBackup'
import { isDeviceFlowConfigured } from '../utils/autoBackup/githubAuth'
import DeviceFlowDialog from './DeviceFlowDialog'
import { telemetry } from '../utils/telemetry'
import type {
  DiscoveredBackup,
  BackupDestination,
} from '../utils/autoBackup/types'
import { completeRestorePrompt } from './firstLaunchSetup'

type Step =
  | 'choose'
  | 'searching'
  | 'pick-backup'
  | 'no-backup'
  | 'restoring'
  | 'error'

interface Props {
  onComplete: (restored: boolean) => void
}

function GitHubMarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12.17c0 5.28 3.44 9.77 8.2 11.35.6.11.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.04-1.65-4.04-1.65-.55-1.42-1.34-1.8-1.34-1.8-1.1-.76.08-.75.08-.75 1.22.09 1.86 1.27 1.86 1.27 1.08 1.9 2.84 1.34 3.53 1.02.11-.8.42-1.35.76-1.66-2.66-.31-5.47-1.37-5.47-6.08 0-1.34.47-2.44 1.24-3.31-.12-.32-.54-1.6.12-3.34 0 0 1.02-.33 3.33 1.26A11.3 11.3 0 0 1 12 6.48c1.02 0 2.04.14 3 .42 2.3-1.59 3.32-1.26 3.32-1.26.67 1.74.25 3.02.12 3.34.77.87 1.24 1.97 1.24 3.31 0 4.72-2.81 5.76-5.49 6.07.43.38.81 1.12.81 2.26 0 1.63-.01 2.95-.01 3.35 0 .33.21.72.82.6 4.76-1.58 8.2-6.07 8.2-11.35A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

export default function SetupRestorePrompt({ onComplete }: Props) {
  const { t, language } = useI18n()
  const [step, setStep] = useState<Step>('choose')
  const [helpTab, setHelpTab] = useState<
    'overview' | 'folder' | 'github' | null
  >(null)
  const [backups, setBackups] = useState<DiscoveredBackup[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [pickedDestination, setPickedDestination] =
    useState<BackupDestination | null>(null)
  const [busy, setBusy] = useState(false)
  const [showDeviceFlow, setShowDeviceFlow] = useState(false)
  const [ghLogin, setGhLogin] = useState<string | null>(null)
  const [ghRepos, setGhRepos] = useState<GithubRepoSummary[] | null>(null)
  const [ghReposLoading, setGhReposLoading] = useState(false)
  const [ghReposError, setGhReposError] = useState<string | null>(null)
  const ghToken = getGithubToken()
  const ghConfigured = isDeviceFlowConfigured()

  const finishAndSkip = () => {
    completeRestorePrompt()
    onComplete(false)
  }

  const loadGhRepos = async (token: string) => {
    setGhReposLoading(true)
    setGhReposError(null)
    try {
      const repos = await listWritableRepos(token)
      setGhRepos(repos)
    } catch (err) {
      setGhReposError(err instanceof Error ? err.message : String(err))
    } finally {
      setGhReposLoading(false)
    }
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

  const handleDeviceFlowAuthorized = async (token: string) => {
    setShowDeviceFlow(false)
    try {
      const user = await verifyGithubToken(token)
      setGithubToken(token)
      setGhLogin(user.login)
      await loadGhRepos(token)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err))
      setStep('error')
    }
  }

  const handleSelectRepo = async (repo: GithubRepoSummary) => {
    try {
      setBusy(true)
      setGithubTarget({
        kind: 'repo',
        owner: repo.owner,
        repo: repo.name,
        branch: repo.defaultBranch,
      })
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

  const handleDisconnectGithub = () => {
    setGithubBackupEnabled(false)
    setGithubToken(null)
    setGithubTarget(null)
    setGhLogin(null)
    setGhRepos(null)
    setGhReposError(null)
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
      // Mark initial setup completed too — they came in with existing data.
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

  useEffect(() => {
    if (!ghToken || ghLogin) return
    let cancelled = false
    void verifyGithubToken(ghToken)
      .then((u) => {
        if (!cancelled) setGhLogin(u.login)
      })
      .catch(() => {
        // stale token — keep login unknown
      })
    return () => {
      cancelled = true
    }
  }, [ghToken, ghLogin])

  useEffect(() => {
    if (!ghToken || ghRepos || ghReposLoading) return
    void loadGhRepos(ghToken)
  }, [ghToken, ghRepos, ghReposLoading])

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
            {!ghToken ? (
              ghConfigured ? (
                <button
                  onClick={() => setShowDeviceFlow(true)}
                  disabled={busy}
                  className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <GitHubMarkIcon className="h-[15px] w-[15px] shrink-0" />
                  <span>{t('Connect GitHub')}</span>
                </button>
              ) : (
                <p className="text-xs text-zinc-500 px-1">
                  {t('GitHub login is not configured in this build.')}
                </p>
              )
            ) : (
              <div className="space-y-2 rounded-xl bg-zinc-800/40 p-2">
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <p className="text-xs text-zinc-400">
                    {t('Signed in as')}{' '}
                    <span className="text-zinc-200">@{ghLogin ?? '…'}</span>
                  </p>
                  <button
                    onClick={handleDisconnectGithub}
                    className="rounded-lg bg-zinc-800 text-zinc-300 text-[11px] font-semibold px-2 py-1 active:bg-zinc-700"
                  >
                    {t('Sign out')}
                  </button>
                </div>

                {ghReposLoading ? (
                  <p className="text-xs text-zinc-500 px-2 py-1">
                    {t('Loading repositories…')}
                  </p>
                ) : ghReposError ? (
                  <p className="text-xs text-red-300 px-2 py-1">
                    {ghReposError}
                  </p>
                ) : ghRepos && ghRepos.length === 0 ? (
                  <p className="text-xs text-zinc-500 px-2 py-1">
                    {t('No repositories with write access.')}
                  </p>
                ) : (
                  <select
                    value=""
                    onChange={(e) => {
                      const repo = ghRepos?.find(
                        (r) => r.fullName === e.target.value,
                      )
                      if (repo) void handleSelectRepo(repo)
                    }}
                    className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
                  >
                    <option value="" disabled>
                      {t('Select a repository')}
                    </option>
                    {ghRepos?.map((r) => (
                      <option key={r.fullName} value={r.fullName}>
                        {r.fullName}
                        {r.private ? ' · 🔒' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <p className="text-xs text-zinc-500 px-1">
              {t(
                'You can enable folder and GitHub backups together later in Settings.',
              )}
            </p>
            <button
              onClick={finishAndSkip}
              className="w-full rounded-xl bg-zinc-800/50 text-zinc-300 text-sm py-2.5 active:bg-zinc-800"
            >
              {t('Omit for now')}
            </button>
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

      {helpTab && (
        <BackupHelpModal
          initialTab={helpTab}
          onClose={() => setHelpTab(null)}
        />
      )}

      {showDeviceFlow && (
        <DeviceFlowDialog
          onClose={() => setShowDeviceFlow(false)}
          onAuthorized={(token) => void handleDeviceFlowAuthorized(token)}
        />
      )}
    </div>
  )
}
