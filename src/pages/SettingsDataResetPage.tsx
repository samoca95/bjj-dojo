import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '../i18n'
import { db, resetPrefilledTechniques } from '../db/database'
import { invalidateCategoryCache } from '../db/categoryCache'
import { telemetry } from '../utils/telemetry'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'

function clearPrefixedStorage(storage: Storage, prefix: string) {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  keys.forEach(key => storage.removeItem(key))
}

export default function SettingsDataResetPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [showResetModal, setShowResetModal] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleFullReset = async () => {
    if (isResetting) return
    setIsResetting(true)
    try {
      db.close()
      await db.delete()
      invalidateCategoryCache()
      clearPrefixedStorage(window.localStorage, 'bjj-dojo')
      clearPrefixedStorage(window.sessionStorage, 'bjj-dojo')
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration => registration.unregister()))
      }
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys()
        await Promise.all(cacheKeys.map(key => window.caches.delete(key)))
      }
      window.location.reload()
    } catch (error) {
      telemetry.error('app.reset_failed', error)
      setIsResetting(false)
      window.alert(language === 'es' ? 'No se pudo reiniciar la aplicación.' : language === 'fr' ? 'Impossible de réinitialiser l’application.' : 'Could not reset the app.')
    }
  }

  const handleResetPrefilled = async () => {
    if (!window.confirm(t('Reset all pre-filled techniques?\nYour custom techniques will be preserved.'))) return
    try {
      await resetPrefilledTechniques()
      window.alert(t('Pre-filled techniques were reset successfully.'))
    } catch (err) {
      if (isQuotaError(err)) {
        notifyQuotaError()
      } else {
        window.alert(t('Could not reset techniques.'))
      }
    }
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">
          {language === 'es' ? 'Datos y reinicio' : language === 'fr' ? 'Données et réinitialisation' : 'Data & reset'}
        </h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'REINICIO PREDEFINIDO' : language === 'fr' ? 'RÉINITIALISATION PRÉREMPLIE' : 'PRE-FILLED RESET'}
          </h2>
          <button
            onClick={handleResetPrefilled}
            className="w-full rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
          >
            {t('Reset pre-filled techniques')}
          </button>
          <p className="text-xs text-zinc-500">
            {t('Only pre-filled techniques and links are reset; custom techniques are kept.')}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'REINICIO COMPLETO' : language === 'fr' ? 'RÉINITIALISATION COMPLÈTE' : 'FULL RESET'}
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full rounded-xl bg-red-900/50 text-red-200 text-sm font-semibold py-2.5 active:bg-red-900"
          >
            {language === 'es' ? 'Reiniciar y actualizar la app' : language === 'fr' ? 'Réinitialiser et mettre à jour l’app' : 'Reset & update app'}
          </button>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? 'Borra todos los datos locales, elimina la caché de la app y vuelve al estado inicial con la última versión desplegada.'
              : language === 'fr'
                ? 'Efface toutes les données locales, supprime le cache de l’app et revient à l’état initial avec la dernière version déployée.'
                : 'Deletes all local data, clears the app cache, and restores a first-time state with the latest deployed version.'}
          </p>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-zinc-100">
                {language === 'es' ? 'Reiniciar y actualizar la app' : language === 'fr' ? 'Réinitialiser et mettre à jour l’app' : 'Reset & update app'}
              </h2>
              <p className="text-sm text-zinc-300">
                {language === 'es'
                  ? 'Esto eliminará tus sesiones, técnicas personalizadas, ajustes, caché y datos locales.'
                  : language === 'fr'
                    ? 'Cela supprimera vos sessions, techniques personnalisées, réglages, cache et données locales.'
                    : 'This will delete your sessions, custom techniques, settings, cache, and local data.'}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
              >
                {t('Cancel')}
              </button>
            </div>
            <button
              onClick={() => void handleFullReset()}
              disabled={isResetting}
              className="w-full rounded-xl bg-red-900/60 text-red-100 text-sm font-semibold py-2.5 disabled:opacity-60 active:bg-red-900"
            >
              {isResetting
                ? language === 'es'
                  ? 'Reiniciando…'
                  : language === 'fr'
                    ? 'Réinitialisation…'
                    : 'Resetting…'
                : language === 'es'
                  ? 'Confirmar reinicio completo'
                  : language === 'fr'
                    ? 'Confirmer la réinitialisation complète'
                    : 'Confirm full reset'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
