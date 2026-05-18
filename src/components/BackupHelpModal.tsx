import { useState } from 'react'
import { X, FolderOpen, Info, Cloud } from 'lucide-react'
import { useI18n, type AppLanguage } from '../i18n'

interface Props {
  onClose: () => void
  /** Which section opens expanded first. Default 'overview'. */
  initialTab?: Tab
}

type Tab = 'overview' | 'folder' | 'cloud'

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
  en: { overview: 'Overview', folder: 'Folder', cloud: 'Cloud' },
  es: { overview: 'Resumen', folder: 'Carpeta', cloud: 'Nube' },
  fr: { overview: 'Aperçu', folder: 'Dossier', cloud: 'Cloud' },
}

const OVERVIEW: Record<AppLanguage, string[]> = {
  en: [
    'Your training data — sessions, taps, custom techniques, settings — lives inside this browser. If you clear browser data, switch phones, or the app gets removed, that data is gone.',
    'A backup makes a small file that holds everything. You can save it to a folder on your device and/or to a cloud account (Google Drive, Dropbox). Use any combination.',
    'Backups run automatically when sessions, techniques, flows, or saved preferences change. You can also press "Backup now" in Settings at any time.',
  ],
  es: [
    'Tus datos de entrenamiento — sesiones, sumisiones, técnicas personalizadas, ajustes — viven dentro de este navegador. Si borras los datos del navegador, cambias de teléfono o desinstalas la app, esos datos se pierden.',
    'Una copia de seguridad crea un archivo pequeño que contiene todo. Puedes guardarla en una carpeta de tu dispositivo y/o en una cuenta en la nube (Google Drive, Dropbox). Combina los destinos como quieras.',
    'Las copias se hacen automáticamente cuando cambian sesiones, técnicas, flujos o preferencias guardadas. También puedes pulsar "Hacer copia ahora" en Ajustes en cualquier momento.',
  ],
  fr: [
    'Vos données d’entraînement — sessions, soumissions, techniques personnalisées, réglages — vivent dans ce navigateur. Si vous effacez les données du navigateur, changez de téléphone ou supprimez l’app, ces données disparaissent.',
    'Une sauvegarde crée un petit fichier qui contient tout. Vous pouvez l’enregistrer dans un dossier de votre appareil et/ou dans un compte cloud (Google Drive, Dropbox). Toutes les combinaisons sont possibles.',
    'Les sauvegardes se lancent automatiquement quand des sessions, techniques, enchaînements ou préférences changent. Vous pouvez aussi appuyer sur « Sauvegarder maintenant » dans Réglages à tout moment.',
  ],
}

const FOLDER_STEPS: Record<AppLanguage, string[]> = {
  en: [
    'Tap "A folder on your device" in the first setup prompt, or "Choose folder" in Settings.',
    'TIP: Pick a folder that already syncs to the cloud (e.g. iCloud Drive, OneDrive, Nextcloud). That way every backup is mirrored to your other devices automatically.',
    'After each relevant change, the app writes small files like bjj-dojo-backup-sessions-1715920000000.json in that folder. It keeps the most recent files per component and removes older ones.',
    'To restore on a new device or after a reset: when the welcome prompt appears, choose "A folder on your device", point to the same folder, and choose your backup.',
  ],
  es: [
    'Pulsa "Una carpeta en tu dispositivo" en la configuración inicial, o "Elegir carpeta" en Ajustes.',
    'CONSEJO: Elige una carpeta que ya se sincronice con la nube (p. ej. iCloud Drive, OneDrive, Nextcloud). Así cada copia se refleja automáticamente en tus otros dispositivos.',
    'Después de cada cambio relevante, la app escribe archivos pequeños como bjj-dojo-backup-sessions-1715920000000.json en esa carpeta. Conserva los más recientes por componente y borra los antiguos.',
    'Para restaurar en un nuevo dispositivo o después de un reinicio: cuando aparezca la pantalla de bienvenida, elige "Una carpeta en tu dispositivo", apunta a la misma carpeta y elige la copia.',
  ],
  fr: [
    'Touchez « Un dossier sur votre appareil » dans le premier écran, ou « Choisir un dossier » dans Réglages.',
    'CONSEIL : choisissez un dossier déjà synchronisé avec le cloud (par ex. iCloud Drive, OneDrive, Nextcloud). Chaque sauvegarde sera ainsi miroitée sur vos autres appareils.',
    'Après chaque changement pertinent, l’app écrit de petits fichiers comme bjj-dojo-backup-sessions-1715920000000.json dans ce dossier. Elle conserve les plus récents par composant et supprime les anciens.',
    'Pour restaurer sur un nouvel appareil ou après une réinitialisation : à l’écran d’accueil, choisissez « Un dossier sur votre appareil », pointez vers le même dossier et choisissez la sauvegarde.',
  ],
}

const FOLDER_NOTE: Record<AppLanguage, string> = {
  en: 'Folder backup needs a Chromium-based browser (Chrome, Edge, Brave, Opera, Arc). Safari and Firefox don’t support it yet — use Google Drive or Dropbox on those.',
  es: 'La copia a carpeta requiere un navegador basado en Chromium (Chrome, Edge, Brave, Opera, Arc). Safari y Firefox aún no son compatibles — usa Google Drive o Dropbox en ellos.',
  fr: 'La sauvegarde dossier nécessite un navigateur basé sur Chromium (Chrome, Edge, Brave, Opera, Arc). Safari et Firefox ne sont pas encore compatibles — utilisez Google Drive ou Dropbox à la place.',
}

const CLOUD_STEPS: Record<AppLanguage, string[]> = {
  en: [
    'Tap "Connect Google Drive" or "Connect Dropbox". A popup opens to the provider so you can grant access.',
    'After signing in, the app creates a small folder ("BJJ Dojo" on Drive, the App folder on Dropbox) and saves backups there automatically.',
    'To restore on a new device: open the app, choose the same cloud destination on the welcome prompt, and pick the most recent backup.',
    'Disconnecting in Settings revokes the access token and clears local credentials. Your files in the cloud are kept until you delete them.',
  ],
  es: [
    'Pulsa "Conectar Google Drive" o "Conectar Dropbox". Se abre una ventana del proveedor para que concedas permiso.',
    'Tras iniciar sesión, la app crea una carpeta pequeña ("BJJ Dojo" en Drive, la carpeta de la app en Dropbox) y guarda las copias allí automáticamente.',
    'Para restaurar en otro dispositivo: abre la app, elige el mismo destino en la pantalla de bienvenida y selecciona la copia más reciente.',
    'Al desconectar desde Ajustes se revoca el token y se borran las credenciales locales. Tus archivos en la nube se conservan hasta que los elimines.',
  ],
  fr: [
    'Touchez « Connecter Google Drive » ou « Connecter Dropbox ». Une fenêtre du fournisseur s’ouvre pour vous laisser autoriser l’accès.',
    'Après connexion, l’app crée un petit dossier (« BJJ Dojo » sur Drive, le dossier d’app sur Dropbox) et y enregistre les sauvegardes automatiquement.',
    'Pour restaurer sur un autre appareil : ouvrez l’app, choisissez la même destination cloud à l’écran d’accueil, puis sélectionnez la sauvegarde la plus récente.',
    'Se déconnecter depuis Réglages révoque le jeton et efface les identifiants locaux. Vos fichiers dans le cloud sont conservés jusqu’à ce que vous les supprimiez.',
  ],
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
          {(['overview', 'folder', 'cloud'] as const).map((id) => (
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

          {tab === 'cloud' && (
            <>
              <div className="flex items-center gap-2 text-gold font-semibold">
                <Cloud size={16} strokeWidth={2} />
                <span className="text-xs tracking-widest uppercase">
                  {language === 'es'
                    ? 'COPIA EN LA NUBE'
                    : language === 'fr'
                      ? 'SAUVEGARDE CLOUD'
                      : 'CLOUD BACKUP'}
                </span>
              </div>
              <ol className="space-y-2 list-decimal list-inside marker:text-gold">
                {CLOUD_STEPS[language].map((s, i) => (
                  <li key={i} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
