import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import type { SessionType } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import IconPickerModal from '../components/IconPickerModal'
import { getSessionTypeIcons, saveSessionTypeIcons, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { getAppTheme, setAppTheme, type AppTheme } from '../utils/theme'
import { useI18n } from '../i18n'
import { resetPrefilledTechniques } from '../db/database'
import { db } from '../db/database'
import { exportDatabase, importDatabase, parseBackupJson } from '../db/backup'
import { clearTelemetryEvents, getTelemetryEvents, logError, logEvent } from '../utils/telemetry'

const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS) as SessionType[]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t, locale } = useI18n()
  const [sessionTypeIcons, setSessionTypeIcons] = useState<SessionTypeIconsMap>(getSessionTypeIcons())
  const [activeSessionType, setActiveSessionType] = useState<SessionType | null>(null)
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())
  const [typeIconsOpen, setTypeIconsOpen] = useState(false)
  const [telemetryCount, setTelemetryCount] = useState(0)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setSessionTypeIcons(getSessionTypeIcons())
    setTelemetryCount(getTelemetryEvents().length)
  }, [])

  const pickerTitle = useMemo(() => {
    if (!activeSessionType) return ''
    return language === 'es'
      ? `Icono para ${SESSION_TYPE_LABELS[activeSessionType]}`
      : `Icon for ${SESSION_TYPE_LABELS[activeSessionType]}`
  }, [activeSessionType, language])

  const handleResetPrefilled = async () => {
    const message = language === 'es'
      ? '¿Restablecer todas las técnicas predefinidas?\nTus técnicas personalizadas no se eliminarán.'
      : 'Reset all pre-filled techniques?\nYour custom techniques will be preserved.'
    if (!window.confirm(message)) return
    try {
      await resetPrefilledTechniques()
      const done = language === 'es'
        ? 'Técnicas predefinidas restablecidas correctamente.'
        : 'Pre-filled techniques were reset successfully.'
      window.alert(done)
      logEvent('settings.reset-prefilled.success', 'Prefilled techniques reset')
    } catch (error) {
      logError('settings.reset-prefilled.error', error)
      window.alert(language === 'es' ? 'No se pudo restablecer.' : 'Failed to reset pre-filled techniques.')
    }
  }

  const handleExportBackup = async () => {
    try {
      const payload = await exportDatabase(db)
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const datePart = new Date().toLocaleDateString(locale).replace(/[^\dA-Za-z-]/g, '-')
      link.download = `bjj-dojo-backup-${datePart}.json`
      link.click()
      URL.revokeObjectURL(url)
      logEvent('settings.backup.export', 'Backup exported', { size: blob.size })
    } catch (error) {
      logError('settings.backup.export.error', error)
      window.alert(language === 'es' ? 'No se pudo exportar el respaldo.' : 'Failed to export backup.')
    }
  }

  const handleImportBackupClick = () => {
    importInputRef.current?.click()
  }

  const handleImportBackup = async (file: File | null) => {
    if (!file) return
    try {
      const raw = await file.text()
      const payload = parseBackupJson(raw)
      const message = language === 'es'
        ? '¿Importar respaldo y reemplazar todos los datos actuales?'
        : 'Import backup and replace all current data?'
      if (!window.confirm(message)) return
      await importDatabase(db, payload)
      logEvent('settings.backup.import', 'Backup imported', {
        techniques: payload.techniques.length,
        sessions: payload.sessions.length,
      })
      window.alert(language === 'es' ? 'Respaldo importado correctamente.' : 'Backup imported successfully.')
      window.location.reload()
    } catch (error) {
      logError('settings.backup.import.error', error)
      window.alert(language === 'es' ? 'Respaldo inválido o dañado.' : 'Invalid or corrupted backup file.')
    }
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
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">{t('THEME MODE')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['black', 'light'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setTheme(mode)
                  setAppTheme(mode)
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  theme === mode
                    ? 'bg-gold text-black'
                    : 'bg-zinc-800 text-zinc-200 active:bg-zinc-700'
                }`}
              >
                {mode === 'black' ? t('Black') : t('Light')}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">{t('Language')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLanguage('en')}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-gold text-black'
                  : 'bg-zinc-800 text-zinc-200 active:bg-zinc-700'
              }`}
            >
              {t('English')}
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                language === 'es'
                  ? 'bg-gold text-black'
                  : 'bg-zinc-800 text-zinc-200 active:bg-zinc-700'
              }`}
            >
              {t('Spanish')}
            </button>
          </div>
          <div className="text-xs text-zinc-500">
            {language === 'es' ? 'Vista previa de fecha:' : 'Date preview:'} {new Date().toLocaleDateString(locale)}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <button
            onClick={() => setTypeIconsOpen(prev => !prev)}
            className="w-full flex items-center gap-3 text-left"
          >
            <h2 className="flex-1 text-xs text-gold font-semibold tracking-widest">{t('SESSION TYPE ICONS')}</h2>
            {typeIconsOpen ? (
              <ChevronUp size={15} className="text-zinc-500 shrink-0" strokeWidth={2} />
            ) : (
              <ChevronDown size={15} className="text-zinc-500 shrink-0" strokeWidth={2} />
            )}
          </button>
          {typeIconsOpen && (
            <div className="space-y-2">
              {SESSION_TYPES.map(sessionType => (
                <button
                  key={sessionType}
                  onClick={() => setActiveSessionType(sessionType)}
                  className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-left flex items-center gap-3 active:bg-zinc-700"
                >
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                    <CategoryIcon value={sessionTypeIcons[sessionType]} size={18} className="text-gold" />
                  </div>
                  <span className="flex-1 text-sm text-zinc-100">{SESSION_TYPE_LABELS[sessionType]}</span>
                  <Pencil size={15} className="text-zinc-500 shrink-0" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-2">
          <button
            onClick={() => navigate('/categories')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="shield" size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-100">{t('Categories')}</div>
              <div className="text-xs text-zinc-500">{t('Manage technique categories and icons')}</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/clubs')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="map-pin" size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-100">{t('Clubs')}</div>
              <div className="text-xs text-zinc-500">{t('Manage your training locations')}</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
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
            {t('DATA BACKUP')}
          </h2>
          <button
            onClick={handleExportBackup}
            className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700"
          >
            {t('Export backup (JSON)')}
          </button>
          <button
            onClick={handleImportBackupClick}
            className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700"
          >
            {t('Import backup (JSON)')}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const file = e.currentTarget.files?.[0] ?? null
              void handleImportBackup(file)
              e.currentTarget.value = ''
            }}
          />
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('LOCAL TELEMETRY')}
          </h2>
          <p className="text-xs text-zinc-500">
            {t('Stored events')}: {telemetryCount}
          </p>
          <button
            onClick={() => {
              clearTelemetryEvents()
              setTelemetryCount(0)
            }}
            className="w-full rounded-xl bg-zinc-800 text-zinc-100 text-sm font-semibold py-2.5 active:bg-zinc-700"
          >
            {t('Clear telemetry logs')}
          </button>
        </div>
      </div>

      {activeSessionType && (
        <IconPickerModal
          title={pickerTitle}
          value={sessionTypeIcons[activeSessionType]}
          onClose={() => setActiveSessionType(null)}
          onSelect={value => {
            const next = {
              ...sessionTypeIcons,
              [activeSessionType]: value,
            } as SessionTypeIconsMap
            setSessionTypeIcons(next)
            saveSessionTypeIcons(next)
          }}
        />
      )}
    </div>
  )
}
