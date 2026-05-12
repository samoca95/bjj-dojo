import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { APP_LANGUAGE_STORAGE_KEY, setAppLanguage, type AppLanguage } from '../i18n'
import {
  BELT_COLORS,
  BELT_STORAGE_KEY,
  MAX_STRIPES,
  STRIPES_STORAGE_KEY,
  type BeltColor,
  setBeltColor,
  setBeltStripes,
} from '../utils/beltRank'

export const INITIAL_SETUP_COMPLETED_STORAGE_KEY = 'bjj-dojo:initial-setup-completed'

export function isInitialSetupRequired(): boolean {
  if (typeof window === 'undefined') return false
  if (window.localStorage.getItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY) === '1') return false
  return !window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
    && !window.localStorage.getItem(BELT_STORAGE_KEY)
    && !window.localStorage.getItem(STRIPES_STORAGE_KEY)
}

function completeInitialSetup() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY, '1')
}

interface FirstLaunchSetupPromptProps {
  onComplete?: () => void
}

const BELT_LABELS: Record<AppLanguage, Record<BeltColor, string>> = {
  en: {
    white: 'White',
    blue: 'Blue',
    purple: 'Purple',
    brown: 'Brown',
    black: 'Black',
  },
  es: {
    white: 'Blanco',
    blue: 'Azul',
    purple: 'Morado',
    brown: 'Marrón',
    black: 'Negro',
  },
}

const SWATCH_CLASS: Record<BeltColor, string> = {
  white: 'bg-zinc-100',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-belt-black',
}

export default function FirstLaunchSetupPrompt({ onComplete }: FirstLaunchSetupPromptProps) {
  const [language, setLanguage] = useState<AppLanguage>('en')
  const [belt, setBelt] = useState<BeltColor>('white')
  const [stripes, setStripes] = useState<number>(0)

  const saveSetup = () => {
    setAppLanguage(language)
    setBeltColor(belt)
    setBeltStripes(stripes)
    completeInitialSetup()
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-100">
            {language === 'es' ? '¡Bienvenido a BJJ Dojo!' : 'Welcome to BJJ Dojo!'}
          </h2>
          <p className="text-sm text-zinc-400">
            {language === 'es'
              ? 'Configura tu cinturón, grados e idioma para comenzar.'
              : 'Set your belt, stripes, and language to get started.'}
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'IDIOMA' : 'LANGUAGE'}
          </span>
          <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                language === 'en' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                language === 'es' ? 'bg-gold text-black' : 'text-zinc-400 active:text-zinc-200'
              }`}
            >
              ES
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'CINTURÓN' : 'BELT'}
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {BELT_COLORS.map(color => {
              const isSelected = belt === color
              return (
                <button
                  key={color}
                  onClick={() => setBelt(color)}
                  aria-label={BELT_LABELS[language][color]}
                  className={`relative rounded-xl py-2.5 flex items-center justify-center transition-all ${SWATCH_CLASS[color]} ${
                    isSelected ? 'ring-2 ring-gold' : 'ring-2 ring-white/40 opacity-70 active:opacity-100'
                  }`}
                >
                  <span className={`text-[10px] font-bold tracking-wide uppercase ${
                    color === 'white' ? 'text-zinc-700' : 'text-white'
                  }`}>
                    {BELT_LABELS[language][color].slice(0, 3)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'GRADOS' : 'STRIPES'}
          </span>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStripes(prev => Math.max(0, prev - 1))}
              disabled={stripes === 0}
              aria-label={language === 'es' ? 'Disminuir grados' : 'Decrease stripes'}
              className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: MAX_STRIPES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const selected = i + 1
                    setStripes(selected === stripes ? Math.max(0, stripes - 1) : selected)
                  }}
                  aria-label={language === 'es'
                    ? `${i + 1} grado${i > 0 ? 's' : ''}`
                    : `${i + 1} stripe${i > 0 ? 's' : ''}`}
                  className={`h-7 w-4 rounded-sm transition-colors ${
                    i < stripes ? 'bg-gold' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setStripes(prev => Math.min(MAX_STRIPES, prev + 1))}
              disabled={stripes === MAX_STRIPES}
              aria-label={language === 'es' ? 'Aumentar grados' : 'Increase stripes'}
              className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <button
          onClick={saveSetup}
          className="w-full rounded-xl bg-gold text-black text-sm font-semibold py-2.5 active:bg-gold-light"
        >
          {language === 'es' ? 'Comenzar' : 'Start'}
        </button>
      </div>
    </div>
  )
}
