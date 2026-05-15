import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  HandHeart,
  Lightbulb,
  Bug,
  Target,
  SlidersVertical,
  DatabaseZap,
  Moon,
  Sun,
} from 'lucide-react'
import { PlainLogo } from '../components/PlainLogo'
import { themeFill } from '../constants/themeColors'
import { CategoryIcon } from '../components/CategoryIcon'
import { getAppTheme, setAppTheme, type AppTheme } from '../utils/theme'
import { useI18n, translate } from '../i18n'
import { db, exportDatabaseBackup, importDatabaseBackup } from '../db/database'
import { invalidateCategoryCache } from '../db/categoryCache'
import { setAppLanguage } from '../i18n'
import { telemetry } from '../utils/telemetry'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'
import {
  getBeltColor,
  setBeltColor,
  getBeltStripes,
  setBeltStripes,
  BELT_COLORS,
  MAX_STRIPES,
  type BeltColor,
} from '../utils/beltRank'
import {
  getUserName,
  setUserName,
  MAX_USER_NAME_LENGTH,
} from '../utils/userName'
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
  const appVersionLabel = appVersion.startsWith('v')
    ? appVersion
    : `v${appVersion}`
  const githubRepoUrl = 'https://github.com/samoca95/bjj-dojo'
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())
  const [belt, setBelt] = useState<BeltColor>(getBeltColor)
  const [stripes, setStripes] = useState<number>(getBeltStripes)
  const [name, setName] = useState<string>(getUserName)

  const updateName = (value: string) => {
    setName(value)
    setUserName(value)
  }

  const importRef = useRef<HTMLInputElement>(null)

  const handleExportBackup = async () => {
    const backup = await exportDatabaseBackup(db, language)
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
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
    } catch (error) {
      telemetry.error('backup.import_failed', error)
      if (isQuotaError(error)) {
        notifyQuotaError()
      } else {
        window.alert(t('Could not import backup.'))
      }
    }
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{t('Settings')}</h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('YOUR BELT')}
          </h2>
          {/* Display name */}
          <div>
            <label className="text-xs text-zinc-400">{t('NAME')}</label>
            <input
              type="text"
              value={name}
              maxLength={MAX_USER_NAME_LENGTH}
              onChange={(e) => updateName(e.target.value)}
              placeholder={t('Your name')}
              className="mt-1.5 w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
          </div>
          {/* Belt color picker */}
          <div className="grid grid-cols-5 gap-1.5">
            {BELT_COLORS.map((color) => {
              const isSelected = belt === color
              const swatchClass: Record<BeltColor, string> = {
                white: 'bg-zinc-100',
                blue: 'bg-blue-600',
                purple: 'bg-purple-600',
                brown: 'bg-amber-800',
                black: 'bg-belt-black',
              }
              return (
                <button
                  key={color}
                  onClick={() => {
                    setBelt(color)
                    setBeltColor(color)
                  }}
                  className={`relative rounded-xl py-2.5 flex items-center justify-center transition-all ${swatchClass[color]} ${
                    isSelected
                      ? 'ring-2 ring-gold'
                      : 'ring-2 ring-white/40 opacity-60 active:opacity-100'
                  }`}
                  aria-label={color}
                >
                  <span
                    className={`text-[10px] font-bold tracking-wide uppercase ${
                      color === 'white' ? 'text-zinc-700' : 'text-white'
                    }`}
                  >
                    {BELT_ABBREV[language][color]}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Stripe counter */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400">{t('Stripes')}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const n = Math.max(0, stripes - 1)
                  setStripes(n)
                  setBeltStripes(n)
                }}
                disabled={stripes === 0}
                className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <div className="flex gap-2">
                {Array.from({ length: MAX_STRIPES }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const n = i + 1 === stripes ? i : i + 1
                      setStripes(n)
                      setBeltStripes(n)
                    }}
                    className={`h-7 w-4 rounded-sm transition-colors ${
                      i < stripes ? 'bg-gold' : 'bg-zinc-700'
                    }`}
                    aria-label={`${i + 1} stripe${i > 0 ? 's' : ''}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  const n = Math.min(MAX_STRIPES, stripes + 1)
                  setStripes(n)
                  setBeltStripes(n)
                }}
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
                onClick={() => {
                  setTheme('black')
                  setAppTheme('black')
                }}
                aria-label={t('Dark')}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  theme === 'black'
                    ? 'bg-gold text-black'
                    : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                <Moon size={15} strokeWidth={2} />
              </button>
              <button
                onClick={() => {
                  setTheme('light')
                  setAppTheme('light')
                }}
                aria-label={t('Light')}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  theme === 'light'
                    ? 'bg-gold text-black'
                    : 'text-zinc-400 active:text-zinc-200'
                }`}
              >
                <Sun size={15} strokeWidth={2} />
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
                    language === code
                      ? 'bg-gold text-black'
                      : 'text-zinc-400 active:text-zinc-200'
                  }`}
                >
                  <span aria-hidden="true">{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-2 space-y-1">
          <div className="px-3 pt-2 pb-1 text-xs text-gold font-semibold tracking-widest">
            {language === 'es'
              ? 'AJUSTES'
              : language === 'fr'
                ? 'RÉGLAGES'
                : 'SETTINGS'}
          </div>
          <button
            onClick={() => navigate('/session-type-icons')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="swords" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {t('Session type')}
              </div>
              <div className="text-xs text-zinc-500">
                {t('Customize icons for each session type')}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="shield" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {t('Categories')}
              </div>
              <div className="text-xs text-zinc-500">
                {t('Manage technique categories and icons')}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/clubs')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="map-pin" size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {t('Clubs')}
              </div>
              <div className="text-xs text-zinc-500">
                {t('Manage your training locations')}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/settings/goals')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Target size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {language === 'es'
                  ? 'Objetivos'
                  : language === 'fr'
                    ? 'Objectifs'
                    : 'Goals'}
              </div>
              <div className="text-xs text-zinc-500">
                {language === 'es'
                  ? 'Meta semanal y próximos objetivos'
                  : language === 'fr'
                    ? 'Objectif hebdomadaire et prochains objectifs'
                    : 'Weekly goal and upcoming goals'}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/settings/home-sections')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <SlidersVertical size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {t('Home section order')}
              </div>
              <div className="text-xs text-zinc-500">
                {t(
                  'Reorder the sections on the home screen and hide the ones you do not want to see.',
                )}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/settings/dev')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <Bug size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {language === 'es'
                  ? 'Ajustes de desarrollo'
                  : language === 'fr'
                    ? 'Réglages développeur'
                    : 'Dev settings'}
              </div>
              <div className="text-xs text-zinc-500">
                {language === 'es'
                  ? 'Registro local y herramientas de diagnóstico'
                  : language === 'fr'
                    ? 'Journal local et outils de diagnostic'
                    : 'Local logging and diagnostics tools'}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
          <button
            onClick={() => navigate('/settings/data-reset')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-900"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <DatabaseZap size={18} className="text-gold" />
            </div>
            <div className="bg-zinc-900 flex-1">
              <div className="text-sm font-semibold text-zinc-100">
                {language === 'es'
                  ? 'Datos y reinicio'
                  : language === 'fr'
                    ? 'Données et réinitialisation'
                    : 'Data & reset'}
              </div>
              <div className="text-xs text-zinc-500">
                {language === 'es'
                  ? 'Opciones de reinicio predefinido y completo'
                  : language === 'fr'
                    ? 'Options de réinitialisation préremplie et complète'
                    : 'Pre-filled and full reset options'}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-zinc-600 shrink-0"
              strokeWidth={2}
            />
          </button>
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
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImportBackup(file)
              event.currentTarget.value = ''
            }}
          />
          <p className="text-xs text-zinc-500">
            {t(
              'Use export/import to recover your data if browser storage is lost.',
            )}
          </p>
        </div>

        <div className="px-4 pb-2">
          <a
            href={`${githubRepoUrl}/issues/new?labels=feature+request&template=feature_request.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-zinc-900 text-sm font-semibold text-gold border border-gold/20 active:bg-zinc-800"
          >
            <Lightbulb size={16} strokeWidth={2} />
            {t('Request a feature')}
          </a>
        </div>

        <div className="px-1 pt-2 pb-4 text-center space-y-1">
          <div className="flex justify-center mb-3">
            <PlainLogo
              fill={themeFill(theme === 'light' ? 'light' : 'dark').goldAccent}
              className="h-14 w-14"
            />
          </div>
          <p className="text-xs text-zinc-500">
            {t('App version:')} {appVersionLabel}
          </p>
          <p className="text-xs text-zinc-500">{t('Developed by:')} samoca95</p>
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold underline underline-offset-2 hover:text-gold-light"
          >
            <HandHeart size={13} strokeWidth={2} />
            {t('Github repo')}
          </a>
        </div>
      </div>
    </div>
  )
}
