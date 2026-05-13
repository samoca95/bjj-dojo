import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Plus, Eye, EyeOff, GitFork } from 'lucide-react'
import { CategoryIcon } from '../components/CategoryIcon'
import { getAppTheme, setAppTheme, type AppTheme } from '../utils/theme'
import { useI18n, translate } from '../i18n'
import { db, exportDatabaseBackup, importDatabaseBackup, resetPrefilledTechniques } from '../db/database'
import { invalidateCategoryCache } from '../db/categoryCache'
import { setAppLanguage } from '../i18n'
import { telemetry } from '../utils/telemetry'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'
import { getGoalMatTime, setGoalMatTime, DEFAULT_WEEKLY_GOAL_MINUTES } from '../utils/goalMatTime'
import {
  getHomeSectionOrder,
  setHomeSectionOrder,
  getHomeSectionVisibility,
  setHomeSectionVisibility,
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
import type { AppLanguage } from '../i18n'

const BELT_ABBREV: Record<AppLanguage, Record<BeltColor, string>> = {
  en: { white: 'Wht', blue: 'Blu', purple: 'Pur', brown: 'Brn', black: 'Blk' },
  es: { white: 'Bco', blue: 'Azl', purple: 'Mor', brown: 'Mrn', black: 'Ngr' },
  fr: { white: 'Bla', blue: 'Ble', purple: 'Vio', brown: 'Mar', black: 'Noi' },
}

const LANGUAGE_OPTIONS: { code: AppLanguage; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useI18n()
  const appVersion = __APP_VERSION__
  const appVersionLabel = appVersion.startsWith('v') ? appVersion : `v${appVersion}`
  const githubRepoUrl = 'https://github.com/samoca95/bjj-dojo'
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())
  const [telemetryCount, setTelemetryCount] = useState(0)
  const [goalInput, setGoalInput] = useState(String(getGoalMatTime()))
  const [sectionOrder, setSectionOrder] = useState<HomeSectionId[]>(getHomeSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState(getHomeSectionVisibility)
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

  const toggleSectionVisibility = (id: HomeSectionId) => {
    const next = {
      ...sectionVisibility,
      [id]: !sectionVisibility[id],
    }
    setSectionVisibility(next)
    setHomeSectionVisibility(next)
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
      invalidateCategoryCache()
      if (importedLanguage) setAppLanguage(importedLanguage)
      const lang = importedLanguage ?? language
      window.alert(translate('Backup imported successfully.', lang))
      setTelemetryCount(telemetry.read().length)
    } catch (error) {
      telemetry.error('backup.import_failed', error)
      if (isQuotaError(error)) {
        notifyQuotaError()
      } else {
        window.alert(t('Could not import backup.'))
      }
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
        <h1 className="flex-1 font-bold text-zinc-100">{t('Settings')}</h1>
      </div>

      <div className="px-4 pb-6 space-y-4">

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('YOUR BELT')}
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
                    {BELT_ABBREV[language][color]}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Stripe counter */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">
              {t('Stripes')}
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
            {t('THEME & LANGUAGE')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{t('Theme')}</span>
            <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => { setTheme('black'); setAppTheme('black') }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === 'black' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                {t('Dark')}
              </button>
              <button
                onClick={() => { setTheme('light'); setAppTheme('light') }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  theme === 'light' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                {t('Light')}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{t('Language')}</span>
            <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
              {LANGUAGE_OPTIONS.map(({ code, flag, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  aria-label={label}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1 ${
                    language === code ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
                  }`}
                >
                  <span aria-hidden="true">{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('HOME SECTION ORDER')}
          </h2>
          <p className="text-xs text-zinc-500">
            {t('Reorder the sections on the home screen and hide the ones you do not want to see.')}
          </p>
          <div className="space-y-2">
            {sectionOrder.map((id, index) => (
              <div
                key={id}
                className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2"
              >
                <span className="flex-1 text-sm text-zinc-100">{sectionLabels[id]}</span>
                <button
                  onClick={() => toggleSectionVisibility(id)}
                  aria-label={sectionVisibility[id] ? t('Hide section') : t('Show section')}
                  className="p-1.5 rounded-lg text-zinc-300 active:bg-zinc-700"
                >
                  {sectionVisibility[id] ? <Eye size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />}
                </button>
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
              <div className="text-sm font-semibold text-zinc-100">{t('Session type')}</div>
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
            {t('WEEKLY MAT TIME GOAL')}
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
            {t('Default:')} {DEFAULT_WEEKLY_GOAL_MINUTES} {t('min')}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <button
            onClick={handleResetPrefilled}
            className="w-full rounded-xl bg-red-900/50 text-red-200 text-sm font-semibold py-2.5 active:bg-red-900"
          >
            {t('Reset pre-filled techniques')}
          </button>
          <p className="text-xs text-zinc-500 mt-2">
            {t('Only pre-filled techniques and links are reset; custom techniques are kept.')}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('BACKUP & RECOVERY')}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportBackup}
              className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
            >
              {t('Export JSON')}
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 active:bg-zinc-700"
            >
              {t('Import JSON')}
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
            {t('Use export/import to recover your data if browser storage is lost.')}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('LOCAL LOGGING')}
          </h2>
          <p className="text-xs text-zinc-500">
            {t('Logged events:')} {telemetryCount}
          </p>
          <button
            onClick={() => {
              telemetry.clear()
              setTelemetryCount(0)
            }}
            className="rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5 px-3 active:bg-zinc-700"
          >
            {t('Clear logs')}
          </button>
        </div>

        <div className="px-1 pt-2 pb-4 text-center space-y-1">
          <p className="text-xs text-zinc-500">
            {t('App version:')} {appVersionLabel}
          </p>
          <p className="text-xs text-zinc-500">
            {t('Developed by:')} samoca95
          </p>
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold underline underline-offset-2 hover:text-gold-light"
          >
            <GitFork size={13} strokeWidth={2} />
            {t('Github repo')}
          </a>
        </div>
      </div>
    </div>
  )
}
