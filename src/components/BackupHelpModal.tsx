import { useState } from 'react'
import { X, FolderOpen, Cloud, Info, Shield } from 'lucide-react'
import { useI18n, type AppLanguage } from '../i18n'

interface Props {
  onClose: () => void
  /** Which section opens expanded first. Default 'overview'. */
  initialTab?: 'overview' | 'folder' | 'github'
}

type Tab = 'overview' | 'folder' | 'github'

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
    'A backup makes a small file that holds everything. You can keep that file in a folder on your device (which can sync to Dropbox, iCloud, Google Drive, etc.) or push it to a free GitHub repository or gist. Pick the option that matches how you already store other personal files.',
    'Backups run automatically each time you log or delete a session, no more than once per minute. You can also press "Backup now" at any time. To restore, the app lets you choose your backup the next time you open it fresh.',
  ],
  es: [
    'Tus datos de entrenamiento — sesiones, sumisiones, técnicas personalizadas, ajustes — viven dentro de este navegador. Si borras los datos del navegador, cambias de teléfono o desinstalas la app, esos datos se pierden.',
    'Una copia de seguridad crea un archivo pequeño que contiene todo. Puedes guardarlo en una carpeta de tu dispositivo (que puede sincronizarse con Dropbox, iCloud, Google Drive, etc.) o subirlo a un repositorio o gist gratuito de GitHub. Elige la opción que mejor encaje con cómo guardas otros archivos personales.',
    'Las copias se hacen automáticamente cada vez que registras o eliminas una sesión, como máximo una vez por minuto. También puedes pulsar "Hacer copia ahora" en cualquier momento. Para restaurar, la app te deja elegir tu copia la próxima vez que la abras desde cero.',
  ],
  fr: [
    'Vos données d’entraînement — sessions, soumissions, techniques personnalisées, réglages — vivent dans ce navigateur. Si vous effacez les données du navigateur, changez de téléphone ou supprimez l’app, ces données disparaissent.',
    'Une sauvegarde crée un petit fichier qui contient tout. Vous pouvez le conserver dans un dossier de votre appareil (qui peut se synchroniser avec Dropbox, iCloud, Google Drive, etc.) ou le pousser vers un dépôt ou gist GitHub gratuit. Choisissez l’option qui correspond à la façon dont vous stockez vos autres fichiers personnels.',
    'Les sauvegardes s’exécutent automatiquement à chaque session enregistrée ou supprimée, au maximum une fois par minute. Vous pouvez aussi appuyer sur « Sauvegarder maintenant » à tout moment. Pour restaurer, l’app vous laisse choisir votre sauvegarde la prochaine fois que vous l’ouvrez de zéro.',
  ],
}

const FOLDER_STEPS: Record<AppLanguage, string[]> = {
  en: [
    'Tap "Choose folder". Your browser opens a window to pick any folder on your device.',
    'TIP: Pick a folder that already syncs to the cloud (e.g. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). That way every backup is mirrored to your other devices automatically.',
    'After a session is saved, the app writes a small file like bjj-dojo-backup-2026-05-16.json into that folder. It keeps the 7 most recent files and removes the rest.',
    'To restore on a new device or after a reset: when the welcome prompt appears, choose "A folder on your device", point at the same folder, and tap "Restore this backup".',
  ],
  es: [
    'Pulsa "Elegir carpeta". Tu navegador abre una ventana para escoger cualquier carpeta de tu dispositivo.',
    'CONSEJO: Elige una carpeta que ya se sincronice con la nube (p. ej. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). Así cada copia se refleja automáticamente en tus otros dispositivos.',
    'Después de guardar una sesión, la app escribe un archivo pequeño como bjj-dojo-backup-2026-05-16.json en esa carpeta. Conserva los 7 más recientes y borra los demás.',
    'Para restaurar en un nuevo dispositivo o después de un reinicio: cuando aparezca la pantalla de bienvenida, elige "Una carpeta en tu dispositivo", apunta a la misma carpeta y pulsa "Restaurar esta copia".',
  ],
  fr: [
    'Touchez « Choisir un dossier ». Votre navigateur ouvre une fenêtre pour choisir n’importe quel dossier sur votre appareil.',
    'CONSEIL : choisissez un dossier déjà synchronisé avec le cloud (par ex. Dropbox, iCloud Drive, Google Drive, OneDrive, Nextcloud). Chaque sauvegarde sera ainsi miroitée sur vos autres appareils.',
    'Après l’enregistrement d’une session, l’app écrit un petit fichier comme bjj-dojo-backup-2026-05-16.json dans ce dossier. Elle conserve les 7 plus récents et supprime les autres.',
    'Pour restaurer sur un nouvel appareil ou après une réinitialisation : à l’écran d’accueil, choisissez « Un dossier sur votre appareil », pointez vers le même dossier et touchez « Restaurer cette sauvegarde ».',
  ],
}

const FOLDER_NOTE: Record<AppLanguage, string> = {
  en: 'Folder backup needs a Chromium-based browser (Chrome, Edge, Brave, Opera, Arc). Safari and Firefox don’t support it yet — use GitHub backup on those.',
  es: 'La copia a carpeta requiere un navegador basado en Chromium (Chrome, Edge, Brave, Opera, Arc). Safari y Firefox aún no son compatibles — usa la copia a GitHub en ellos.',
  fr: 'La sauvegarde dossier nécessite un navigateur basé sur Chromium (Chrome, Edge, Brave, Opera, Arc). Safari et Firefox ne sont pas encore compatibles — utilisez la sauvegarde GitHub à la place.',
}

const GITHUB_STEPS_REPO: Record<AppLanguage, string[]> = {
  en: [
    'Create a free account on github.com if you don’t have one.',
    'Create a new PRIVATE repository — name it anything you like, e.g. "bjj-backups". Leave it empty.',
    'Go to github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Give it any name, set expiration as you prefer, and under "Repository access" choose "Only select repositories" and pick the one you just made. Under "Permissions" expand "Repository permissions" and set "Contents" to "Read and write". Generate, then copy the token (it’s shown once).',
    'Back in the app, choose Repo, paste the token, type the repo in owner/repo form (e.g. "alice/bjj-backups"), then tap "Test connection". If the alert shows your GitHub username, you are connected.',
  ],
  es: [
    'Crea una cuenta gratuita en github.com si no tienes una.',
    'Crea un repositorio nuevo PRIVADO — ponle el nombre que quieras, p. ej. "bjj-backups". Déjalo vacío.',
    'Ve a github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Ponle un nombre, ajusta la caducidad, y en "Repository access" elige "Only select repositories" y selecciona el que acabas de crear. En "Permissions" expande "Repository permissions" y pon "Contents" en "Read and write". Genera y copia el token (solo se muestra una vez).',
    'Vuelve a la app, elige Repo, pega el token, escribe el repo como usuario/repo (p. ej. "alice/bjj-backups") y pulsa "Probar conexión". Si la alerta muestra tu nombre de usuario de GitHub, estás conectado.',
  ],
  fr: [
    'Créez un compte gratuit sur github.com si vous n’en avez pas.',
    'Créez un nouveau dépôt PRIVÉ — donnez-lui le nom que vous voulez, par ex. « bjj-backups ». Laissez-le vide.',
    'Allez sur github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Donnez-lui un nom, réglez l’expiration, et sous « Repository access » choisissez « Only select repositories » puis le dépôt que vous venez de créer. Sous « Permissions », dépliez « Repository permissions » et mettez « Contents » à « Read and write ». Générez puis copiez le jeton (il n’est affiché qu’une fois).',
    'Dans l’app, choisissez Repo, collez le jeton, tapez le dépôt au format utilisateur/dépôt (par ex. « alice/bjj-backups ») puis touchez « Tester la connexion ». Si l’alerte affiche votre nom d’utilisateur GitHub, vous êtes connecté.',
  ],
}

const GITHUB_STEPS_GIST: Record<AppLanguage, string[]> = {
  en: [
    'Or, simpler: open gist.github.com → new gist → set the filename to bjj-dojo-backup.json and content to {} → create as a SECRET gist.',
    'Copy the gist ID from the URL — it’s the long letters-and-numbers part after your username.',
    'Create a classic token at github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Check ONLY the "gist" scope. Generate and copy the token.',
    'In the app pick Gist, paste the token and the gist ID, then "Test connection".',
  ],
  es: [
    'O más simple: abre gist.github.com → nuevo gist → ponle al archivo el nombre bjj-dojo-backup.json y como contenido {} → créalo como gist SECRETO.',
    'Copia el ID del gist desde la URL — es la cadena larga de letras y números después de tu nombre de usuario.',
    'Crea un token clásico en github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Marca SOLO el scope "gist". Genera y copia el token.',
    'En la app elige Gist, pega el token y el ID del gist, y pulsa "Probar conexión".',
  ],
  fr: [
    'Ou plus simple : ouvrez gist.github.com → nouveau gist → nommez le fichier bjj-dojo-backup.json avec le contenu {} → créez-le en gist SECRET.',
    'Copiez l’ID du gist depuis l’URL — c’est la longue chaîne de lettres et chiffres après votre nom d’utilisateur.',
    'Créez un jeton classique sur github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic). Cochez UNIQUEMENT le scope « gist ». Générez et copiez le jeton.',
    'Dans l’app, choisissez Gist, collez le jeton et l’ID, puis « Tester la connexion ».',
  ],
}

const SAFETY: Record<AppLanguage, string> = {
  en: 'The GitHub token is stored on this device. If your device is lost or shared, go to GitHub → Settings → Developer settings and revoke the token. Use a private repo or secret gist — anyone with the URL of a public one could read your training history.',
  es: 'El token de GitHub se guarda en este dispositivo. Si lo pierdes o lo compartes, ve a GitHub → Settings → Developer settings y revoca el token. Usa un repo privado o un gist secreto — cualquiera con la URL de uno público podría leer tu historial.',
  fr: 'Le jeton GitHub est stocké sur cet appareil. En cas de perte ou de partage, allez sur GitHub → Settings → Developer settings et révoquez-le. Utilisez un dépôt privé ou un gist secret — n’importe qui avec l’URL d’un public pourrait lire votre historique.',
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
                <Cloud size={16} strokeWidth={2} />
                <span className="text-xs tracking-widest uppercase">
                  {language === 'es'
                    ? 'COPIA EN GITHUB'
                    : language === 'fr'
                      ? 'SAUVEGARDE GITHUB'
                      : 'GITHUB BACKUP'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {language === 'es'
                  ? 'Opción A — repositorio (recomendado, conserva historial)'
                  : language === 'fr'
                    ? 'Option A — dépôt (recommandé, conserve l’historique)'
                    : 'Option A — repository (recommended, keeps history)'}
              </p>
              <ol className="space-y-2 list-decimal list-inside marker:text-gold">
                {GITHUB_STEPS_REPO[language].map((s, i) => (
                  <li key={i} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-zinc-400 mt-3">
                {language === 'es'
                  ? 'Opción B — gist (más rápido, un solo archivo)'
                  : language === 'fr'
                    ? 'Option B — gist (plus rapide, un seul fichier)'
                    : 'Option B — gist (faster, single file)'}
              </p>
              <ol className="space-y-2 list-decimal list-inside marker:text-gold">
                {GITHUB_STEPS_GIST[language].map((s, i) => (
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
