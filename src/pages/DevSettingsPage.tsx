import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Waypoints } from 'lucide-react'
import { telemetry } from '../utils/telemetry'
import { useI18n } from '../i18n'

export default function DevSettingsPage() {
  const navigate = useNavigate()
  const { language } = useI18n()
  const [telemetryCount, setTelemetryCount] = useState(0)

  useEffect(() => {
    setTelemetryCount(telemetry.read().length)
  }, [])

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">
          {language === 'es'
            ? 'Ajustes de desarrollo'
            : language === 'fr'
              ? 'Réglages développeur'
              : 'Dev settings'}
        </h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es'
              ? 'REGISTRO LOCAL'
              : language === 'fr'
                ? 'JOURNAL LOCAL'
                : 'LOCAL LOGGING'}
          </h2>
          <p className="text-sm text-zinc-300">
            {language === 'es'
              ? 'Guarda en este dispositivo los errores y eventos recientes para ayudar a diagnosticar problemas.'
              : language === 'fr'
                ? 'Conserve sur cet appareil les erreurs et événements récents pour aider au diagnostic.'
                : 'Keeps recent app errors and events on this device to help diagnose issues.'}
          </p>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? `Eventos guardados: ${telemetryCount}`
              : language === 'fr'
                ? `Événements enregistrés : ${telemetryCount}`
                : `Stored events: ${telemetryCount}`}
          </p>
          <button
            onClick={() => {
              telemetry.clear()
              setTelemetryCount(0)
            }}
            className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 px-3 active:bg-zinc-700"
          >
            {language === 'es'
              ? 'Borrar registro'
              : language === 'fr'
                ? 'Effacer le journal'
                : 'Clear logs'}
          </button>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            TECHNIQUE GRAPH
          </h2>
          <p className="text-sm text-zinc-300">
            {language === 'es'
              ? 'Vista de grafo global de técnicas.'
              : language === 'fr'
                ? 'Vue du graphe global des techniques.'
                : 'Global technique graph visualisation.'}
          </p>
          <button
            onClick={() => navigate('/techniques/graph')}
            className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 px-3 active:bg-zinc-700 flex items-center gap-2"
          >
            <Waypoints size={16} strokeWidth={2} />
            {language === 'es'
              ? 'Abrir grafo'
              : language === 'fr'
                ? 'Ouvrir le graphe'
                : 'Open graph'}
          </button>
        </div>
      </div>
    </div>
  )
}
