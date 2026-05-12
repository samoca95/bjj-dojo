import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Plus } from 'lucide-react'
import { CategoryIcon } from '../components/CategoryIcon'
import { getAppTheme, setAppTheme, type AppTheme } from '../utils/theme'
import { useI18n } from '../i18n'
import { db, exportDatabaseBackup, importDatabaseBackup, resetPrefilledTechniques } from '../db/database'
import { setAppLanguage } from '../i18n'
import { telemetry } from '../utils/telemetry'
import { getGoalMatTime, setGoalMatTime, DEFAULT_WEEKLY_GOAL_MINUTES } from '../utils/goalMatTime'
import {
  getHomeSectionOrder,
  setHomeSectionOrder,
  type HomeSectionId,
} from '../utils/homeSectionOrder'
import {
  getBeltColor,
  setBeltColor,
  getBeltStripes,
  setBeltStripes,
  BELT_COLORS,
  MAX_STRIPES,
  type BeltColor,
} from '../utils/beltRank'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())
  const [telemetryCount, setTelemetryCount] = useState(0)
  const [goalInput, setGoalInput] = useState(String(getGoalMatTime()))
  const [sectionOrder, setSectionOrder] = useState<HomeSectionId[]>(getHomeSectionOrder)
  const [belt, setBelt] = useState<BeltColor>(getBeltColor)
  const [stripes, setStripes] = useState<number>(getBeltStripes)

  const moveSection = (index: number, delta: number) => {
    const next = [...sectionOrder]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSectionOrder(next)
    setHomeSectionOrder(next)
  }

  const sectionLabels: Record<HomeSectionId, string> = {
    focus: t('FOCUS TECHNIQUES'),
    trending: t('TRENDING'),
    stats: t('YOUR STATS'),
    calendar: t('TRAINING CALENDAR'),
  }
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTelemetryCount(telemetry.read().length)
  }, [])

  const handleGoalSave = () => {
    const n = Number(goalInput)
    if (n > 0 && Number.isFinite(n)) {
      setGoalMatTime(Math.round(n))
    } else {
      setGoalInput(String(getGoalMatTime()))
    }
  }

  const handleExportBackup = async () => {
    const backup = await exportDatabaseBackup(db, language)
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `bjj-dojo-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const importedLanguage = await importDatabaseBackup(parsed)
      if (importedLanguage) setAppLanguage(importedLanguage)
      const lang = importedLanguage ?? language
      window.alert(lang === 'es' ? 'Respaldo importado correctamente.' : 'Backup imported successfully.')
      setTelemetryCount(telemetry.read().length)
    } catch (error) {
      telemetry.error('backup.import_failed', error)
      window.alert(language === 'es' ? 'No se pudo importar el respaldo.' : 'Could not import backup.')
    }
  }

  const handleResetPrefilled = async () => {
    const message = language === 'es'
      ? '¿Restablecer todas las técnicas predefinidas?\nTus técnicas personalizadas no se eliminarán.'
      : 'Reset all pre-filled techniques?\nYour custom techniques will be preserved.'
    if (!window.confirm(message)) return
    await resetPrefilledTechniques()
    const done = language === 'es'
      ? 'Técnicas predefinidas restablecidas correctamente.'
      : 'Pre-filled techniques were reset successfully.'
    window.alert(done)
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{t('Settings')}</h1>
      </div>

      <div className="px-4 pb-6 space-y-4">

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'TU CINTURÓN' : 'YOUR BELT'}
          </h2>
          {/* Belt color picker */}
          <div className="grid grid-cols-5 gap-1.5">
            {BELT_COLORS.map(color => {
              const isSelected = belt === color
              const swatchClass: Record<BeltColor, string> = {
                white:  'bg-zinc-100',
                blue:   'bg-blue-600',
                purple: 'bg-purple-600',
                brown:  'bg-amber-800',
                black:  'bg-belt-black',
              }
              return (
                <button
                  key={color}
                  onClick={() => { setBelt(color); setBeltColor(color) }}
                  className={`relative rounded-xl py-2.5 flex items-center justify-center transition-all ${swatchClass[color]} ${
                    isSelected ? 'ring-2 ring-gold' : 'ring-2 ring-white/40 opacity-60 active:opacity-100'
                  }`}
                  aria-label={color}
                >
                  <span className={`text-[10px] font-bold tracking-wide uppercase ${
                    color === 'white' ? 'text-zinc-700' : 'text-white'
                  }`}>
                    {color === 'white' ? (language === 'es' ? 'Bco' : 'Wht') :
                     color === 'blue'  ? (language === 'es' ? 'Azl' : 'Blu') :
                     color === 'purple'? (language === 'es' ? 'Mor' : 'Pur') :
                     color === 'brown' ? (language === 'es' ? 'Mrn' : 'Brn') :
                                         (language === 'es' ? 'Ngr' : 'Blk')}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Stripe counter */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {language === 'es' ? 'Grados' : 'Stripes'}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { const n = Math.max(0, stripes - 1); setStripes(n); setBeltStripes(n) }}
                disabled={stripes === 0}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: MAX_STRIPES }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { const n = i + 1 === stripes ? i : i + 1; setStripes(n); setBeltStripes(n) }}
                    className={`h-7 w-4 rounded-sm transition-colors ${
                      i < stripes ? 'bg-gold' : 'bg-zinc-700'
                    }`}
                    aria-label={`${i + 1} stripe${i > 0 ? 's' : ''}`}
                  />
                ))}
              </div>
              <button
                onClick={() => { const n = Math.min(MAX_STRIPES, stripes + 1); setStripes(n); setBeltStripes(n) }}
                disabled={stripes === MAX_STRIPES}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'TEMA E IDIOMA' : 'THEME & LANGUAGE'}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{language === 'es' ? 'Tema' : 'Theme'}</span>
            <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => { setTheme('black'); setAppTheme('black') }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === 'black' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                {language === 'es' ? 'Oscuro' : 'Dark'}
              </button>
              <button
                onClick={() => { setTheme('light'); setAppTheme('light') }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === 'light' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                {language === 'es' ? 'Claro' : 'Light'}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{language === 'es' ? 'Idioma' : 'Language'}</span>
            <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setLanguage('en')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  language === 'en' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  language === 'es' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'ORDEN DEL INICIO' : 'HOME SECTION ORDER'}
          </h2>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? 'Reordena las secciones de la pantalla principal.'
              : 'Reorder the sections on the home screen.'}
          </p>
          <div className="space-y-2">
            {sectionOrder.map((id, index) => (
              <div
                key={id}
                className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2"
              >
                <span className="flex-1 text-sm text-zinc-100">{sectionLabels[id]}</span>
                <button
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  aria-label={t('Move up')}
                  className="p-1.5 rounded-lg text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
                >
                  <ArrowUp size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sectionOrder.length - 1}
                  aria-label={t('Move down')}
                  className="p-1.5 rounded-lg text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
                >
                  <ArrowDown size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-2">
          <button
            onClick={() => navigate('/session-type-icons')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="swords" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">{t('SESSION TYPE ICONS')}</div>
              <div className="text-xs text-zinc-500">{t('Customize icons for each session type')}</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="shield" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">{t('Categories')}</div>
              <div className="text-xs text-zinc-500">{t('Manage technique categories and icons')}</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/clubs')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="map-pin" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">{t('Clubs')}</div>
              <div className="text-xs text-zinc-500">{t('Manage your training locations')}</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'META SEMANAL DE TATAMI' : 'WEEKLY MAT TIME GOAL'}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onBlur={handleGoalSave}
              min={1}
              max={10080}
              className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
            />
            <span className="text-sm text-zinc-400">{t('min')}</span>
            <button
              onClick={handleGoalSave}
              className="rounded-xl bg-gold text-black text-sm font-semibold px-4 py-2.5 active:bg-gold-light"
            >
              {t('Save')}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? `Predeterminado: ${DEFAULT_WEEKLY_GOAL_MINUTES} min`
              : `Default: ${DEFAULT_WEEKLY_GOAL_MINUTES} min`}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <button
            onClick={handleResetPrefilled}
            className="w-full rounded-xl bg-red-900/50 text-red-200 text-sm font-semibold py-2.5 active:bg-red-900"
          >
            {language === 'es'
              ? 'Restablecer técnicas predefinidas'
              : 'Reset pre-filled techniques'}
          </button>
          <p className="text-xs text-zinc-500 mt-2">
            {language === 'es'
              ? 'Solo se reinician técnicas y conexiones predefinidas; las personalizadas no se eliminan.'
              : 'Only pre-filled techniques and links are reset; custom techniques are kept.'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'RESPALDO Y RECUPERACIÓN' : 'BACKUP & RECOVERY'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportBackup}
              className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
            >
              {language === 'es' ? 'Exportar JSON' : 'Export JSON'}
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
            >
              {language === 'es' ? 'Importar JSON' : 'Import JSON'}
            </button>
          </div>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) void handleImportBackup(file)
              event.currentTarget.value = ''
            }}
          />
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? 'Usa exportar/importar para recuperar tus datos si el almacenamiento del navegador se pierde.'
              : 'Use export/import to recover your data if browser storage is lost.'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'REGISTRO LOCAL' : 'LOCAL LOGGING'}
          </h2>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? `Eventos registrados: ${telemetryCount}`
              : `Logged events: ${telemetryCount}`}
          </p>
          <button
            onClick={() => {
              telemetry.clear()
              setTelemetryCount(0)
            }}
            className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 px-3 active:bg-zinc-700"
          >
            {language === 'es' ? 'Limpiar registros' : 'Clear logs'}
          </button>
        </div>
      </div>
    </div>
  )
}
