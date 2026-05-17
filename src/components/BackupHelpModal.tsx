import { useState } from 'react'
import { X, FolderOpen, Info, Shield } from 'lucide-react'
import { useI18n, type AppLanguage } from '../i18n'

interface Props {
  onClose: () => void
  /** Which section opens expanded first. Default 'overview'. */
  initialTab?: 'overview' | 'folder' | 'github'
}

type Tab = 'overview' | 'folder' | 'github'

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

const TITLES: Record<AppLanguage, string> = {
  en: 'How backups work',
  es: 'Cómo funcionan las copias',
  fr: 'Comment fonctionnent les sauvegardes',
}

const CLOSE_LABEL: Record<AppLanguage, string> = {
  en: 'Close',
  es: 'Cerrar',
  fr: 'Fermer',
}

const TAB_LABELS: Record<AppLanguage, Record<Tab, string>> = {
  en: { overview: 'Overview', folder: 'Folder', github: 'GitHub' },
  es: { overview: 'Resumen', folder: 'Carpeta', github: 'GitHub' },
  fr: { overview: 'Aperçu', folder: 'Dossier', github: 'GitHub' },
}

const OVERVIEW: Record<AppLanguage, string[]> = {
  en: [
    'Your training data — sessions, taps, custom techniques, settings — lives inside this browser. If you clear browser data, switch phones, or the app gets removed, that data is gone.',
    'A backup makes a small file that holds everything. You can save it to a folder on your device and/or to a private GitHub repository. You can use one method or both together.',
    'Backups run automatically when sessions, techniques, flows, or saved preferences change. The app writes small component files and queues uploads to keep syncing stable. You can also press "Backup now" in Settings at any time.',
  ],
  es: [
    'Tus datos de entrenamiento — sesiones, sumisiones, técnicas personalizadas, ajustes — viven dentro de este navegador. Si borras los datos del navegador, cambias de teléfono o desinstalas la app, esos datos se pierden.',
    'Una copia de seguridad crea un archivo pequeño que contiene todo. Puedes guardarlo en una carpeta de tu dispositivo y/o en un repositorio privado de GitHub. Puedes usar un método o ambos a la vez.',
    'Las copias se hacen automáticamente cuando cambian sesiones, técnicas, flujos o preferencias guardadas. La app guarda archivos pequeños por componente y usa una cola para sincronizar de forma estable. También puedes pulsar "Hacer copia ahora" en Ajustes en cualquier momento.',
  ],
  fr: [
    'Vos données d’entraînement — sessions, soumissions, techniques personnalisées, réglages — vivent dans ce navigateur. Si vous effacez les données du navigateur, changez de téléphone ou supprimez l’app, ces données disparaissent.',
    'Une sauvegarde crée un petit fichier qui contient tout. Vous pouvez l’enregistrer dans un dossier de votre appareil et/ou dans un dépôt GitHub privé. Vous pouvez utiliser une méthode ou les deux ensemble.',
    'Les sauvegardes se lancent automatiquement quand des sessions, techniques, enchaînements ou préférences changent. L’app écrit de petits fichiers par composant et utilise une file d’attente pour une synchronisation stable. Vous pouvez aussi appuyer sur « Sauvegarder maintenant » dans Réglages à tout moment.',
  ],
}

const FOLDER_STEPS: Record<AppLanguage, string[]> = {
  en: [
    'Tap "A folder on your device" in the first setup prompt, or "Choose folder" in Settings.',
    'TIP: Pick a folder that already syncs to the cloud (e.g. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). That way every backup is mirrored to your other devices automatically.',
    'After each relevant change, the app writes small files like bjj-dojo-backup-sessions-1715920000000.json in that folder. It keeps the most recent files per component and removes older ones.',
    'To restore on a new device or after a reset: when the welcome prompt appears, choose "A folder on your device", point to the same folder, and choose your backup.',
  ],
  es: [
    'Pulsa "Una carpeta en tu dispositivo" en la configuración inicial, o "Elegir carpeta" en Ajustes.',
    'CONSEJO: Elige una carpeta que ya se sincronice con la nube (p. ej. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). Así cada copia se refleja automáticamente en tus otros dispositivos.',
    'Después de cada cambio relevante, la app escribe archivos pequeños como bjj-dojo-backup-sessions-1715920000000.json en esa carpeta. Conserva los más recientes por componente y borra los antiguos.',
    'Para restaurar en un nuevo dispositivo o después de un reinicio: cuando aparezca la pantalla de bienvenida, elige "Una carpeta en tu dispositivo", apunta a la misma carpeta y elige la copia.',
  ],
  fr: [
    'Touchez « Un dossier sur votre appareil » dans le premier écran, ou « Choisir un dossier » dans Réglages.',
    'CONSEIL : choisissez un dossier déjà synchronisé avec le cloud (par ex. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). Chaque sauvegarde sera ainsi miroitée sur vos autres appareils.',
    'Après chaque changement pertinent, l’app écrit de petits fichiers comme bjj-dojo-backup-sessions-1715920000000.json dans ce dossier. Elle conserve les plus récents par composant et supprime les anciens.',
    'Pour restaurer sur un nouvel appareil ou après une réinitialisation : à l’écran d’accueil, choisissez « Un dossier sur votre appareil », pointez vers le même dossier et choisissez la sauvegarde.',
  ],
}

const FOLDER_NOTE: Record<AppLanguage, string> = {
  en: 'Folder backup needs a Chromium-based browser (Chrome, Edge, Brave, Opera, Arc). Safari and Firefox don’t support it yet — use GitHub backup on those.',
  es: 'La copia a carpeta requiere un navegador basado en Chromium (Chrome, Edge, Brave, Opera, Arc). Safari y Firefox aún no son compatibles — usa la copia a GitHub en ellos.',
  fr: 'La sauvegarde dossier nécessite un navigateur basé sur Chromium (Chrome, Edge, Brave, Opera, Arc). Safari et Firefox ne sont pas encore compatibles — utilisez la sauvegarde GitHub à la place.',
}

const GITHUB_STEPS: Record<AppLanguage, string[]> = {
  en: [
    'Tap "Connect GitHub". The app shows a one-time code and an "Open GitHub" button.',
    'On GitHub, paste the code, authorize the app, and return to BJJ Dojo.',
    'After sign-in, pick one of your writable repositories or create a new private repository from Settings.',
    'The app writes backups under the repository "backups/" folder and keeps only the latest files based on your retention setting.',
  ],
  es: [
    'Pulsa "Conectar con GitHub". La app muestra un código de un solo uso y el botón "Abrir GitHub".',
    'En GitHub, pega el código, autoriza la app y vuelve a BJJ Dojo.',
    'Después de iniciar sesión, elige uno de tus repositorios con escritura o crea uno privado nuevo desde Ajustes.',
    'La app guarda las copias en la carpeta "backups/" del repositorio y conserva solo las más recientes según tu ajuste de retención.',
  ],
  fr: [
    'Touchez « Se connecter à GitHub ». L’app affiche un code temporaire et le bouton « Ouvrir GitHub ».',
    'Sur GitHub, collez le code, autorisez l’app, puis revenez dans BJJ Dojo.',
    'Après connexion, choisissez un dépôt avec accès en écriture ou créez un nouveau dépôt privé depuis Réglages.',
    'L’app enregistre les sauvegardes dans le dossier « backups/ » du dépôt et ne garde que les plus récentes selon votre rétention.',
  ],
}

const SAFETY: Record<AppLanguage, string> = {
  en: 'The GitHub token is stored on this device. If your device is lost or shared, go to GitHub → Settings → Developer settings and revoke the token. Use a private repository.',
  es: 'El token de GitHub se guarda en este dispositivo. Si lo pierdes o lo compartes, ve a GitHub → Settings → Developer settings y revoca el token. Usa un repositorio privado.',
  fr: 'Le jeton GitHub est stocké sur cet appareil. En cas de perte ou de partage, allez sur GitHub → Settings → Developer settings et révoquez-le. Utilisez un dépôt privé.',
}

export default function BackupHelpModal({
  onClose,
  initialTab = 'overview',
}: Props) {
  const { language } = useI18n()
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div
      className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Info size={18} className="text-gold" strokeWidth={2} />
          <h2 className="flex-1 text-base font-bold text-zinc-100">
            {TITLES[language]}
          </h2>
          <button
            onClick={onClose}
            aria-label={CLOSE_LABEL[language]}
            className="p-1.5 -mr-1.5 text-zinc-400 active:text-zinc-100"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-0.5 px-4 pb-2 bg-zinc-900">
          {(['overview', 'folder', 'github'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                tab === id
                  ? 'bg-gold text-black'
                  : 'bg-zinc-800 text-zinc-400 active:text-zinc-200'
              }`}
            >
              {TAB_LABELS[language][id]}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-4 pb-4 space-y-3 text-sm text-zinc-200">
          {tab === 'overview' &&
            OVERVIEW[language].map((p, i) => (
              <p key={i} className="leading-relaxed">
                {p}
              </p>
            ))}

          {tab === 'folder' && (
            <>
              <div className="flex items-center gap-2 text-gold font-semibold">
                <FolderOpen size={16} strokeWidth={2} />
                <span className="text-xs tracking-widest uppercase">
                  {language === 'es'
                    ? 'COPIA EN CARPETA'
                    : language === 'fr'
                      ? 'SAUVEGARDE DOSSIER'
                      : 'FOLDER BACKUP'}
                </span>
              </div>
              <ol className="space-y-2 list-decimal list-inside marker:text-gold">
                {FOLDER_STEPS[language].map((s, i) => (
                  <li key={i} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {FOLDER_NOTE[language]}
              </p>
            </>
          )}

          {tab === 'github' && (
            <>
              <div className="flex items-center gap-2 text-gold font-semibold">
                <GitHubMarkIcon className="h-4 w-4" />
                <span className="text-xs tracking-widest uppercase">
                  {language === 'es'
                    ? 'COPIA EN GITHUB'
                    : language === 'fr'
                      ? 'SAUVEGARDE GITHUB'
                      : 'GITHUB BACKUP'}
                </span>
              </div>
              <ol className="space-y-2 list-decimal list-inside marker:text-gold">
                {GITHUB_STEPS[language].map((s, i) => (
                  <li key={i} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded-xl bg-zinc-800/60 p-3 flex gap-2">
                <Shield
                  size={14}
                  className="text-gold shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {SAFETY[language]}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
