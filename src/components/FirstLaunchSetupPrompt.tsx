import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { setAppLanguage, type AppLanguage } from '../i18n'
import {
  BELT_COLORS,
  MAX_STRIPES,
  type BeltColor,
  setBeltColor,
  setBeltStripes,
} from '../utils/beltRank'
import {
  getUserName,
  setUserName,
  setUserNamePrompted,
} from '../utils/userName'
import { completeInitialSetup } from './firstLaunchSetup'

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
  fr: {
    white: 'Blanc',
    blue: 'Bleu',
    purple: 'Violet',
    brown: 'Marron',
    black: 'Noir',
  },
}

const WELCOME_TITLE: Record<AppLanguage, string> = {
  en: 'Welcome to BJJ Dojo!',
  es: '¡Bienvenido a BJJ Dojo!',
  fr: 'Bienvenue sur BJJ Dojo !',
}

const WELCOME_SUBTITLE: Record<AppLanguage, string> = {
  en: 'Set your belt, stripes, and language to get started.',
  es: 'Configura tu cinturón, grados e idioma para comenzar.',
  fr: 'Configurez votre ceinture, vos barrettes et votre langue pour commencer.',
}

const LANGUAGE_LABEL: Record<AppLanguage, string> = {
  en: 'LANGUAGE',
  es: 'IDIOMA',
  fr: 'LANGUE',
}

const BELT_LABEL: Record<AppLanguage, string> = {
  en: 'BELT',
  es: 'CINTURÓN',
  fr: 'CEINTURE',
}

const STRIPES_LABEL: Record<AppLanguage, string> = {
  en: 'STRIPES',
  es: 'GRADOS',
  fr: 'BARRETTES',
}

const DECREASE_STRIPES_LABEL: Record<AppLanguage, string> = {
  en: 'Decrease stripes',
  es: 'Disminuir grados',
  fr: 'Réduire les barrettes',
}

const INCREASE_STRIPES_LABEL: Record<AppLanguage, string> = {
  en: 'Increase stripes',
  es: 'Aumentar grados',
  fr: 'Augmenter les barrettes',
}

const START_LABEL: Record<AppLanguage, string> = {
  en: 'Start',
  es: 'Comenzar',
  fr: 'Commencer',
}

const NAME_LABEL: Record<AppLanguage, string> = {
  en: 'YOUR NAME',
  es: 'TU NOMBRE',
  fr: 'VOTRE NOM',
}

const NAME_PLACEHOLDER: Record<AppLanguage, string> = {
  en: 'Your name',
  es: 'Tu nombre',
  fr: 'Votre nom',
}

const SWATCH_CLASS: Record<BeltColor, string> = {
  white: 'bg-zinc-100',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-belt-black',
}

export default function FirstLaunchSetupPrompt({
  onComplete,
}: FirstLaunchSetupPromptProps) {
  const [language, setLanguage] = useState<AppLanguage>('en')
  const [belt, setBelt] = useState<BeltColor>('white')
  const [stripes, setStripes] = useState<number>(0)
  const [name, setNameState] = useState<string>(getUserName())

  const saveSetup = () => {
    setAppLanguage(language)
    setBeltColor(belt)
    setBeltStripes(stripes)
    setUserName(name)
    setUserNamePrompted()
    completeInitialSetup()
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-100">
            {WELCOME_TITLE[language]}
          </h2>
          <p className="text-sm text-zinc-400">{WELCOME_SUBTITLE[language]}</p>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {NAME_LABEL[language]}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setNameState(e.target.value)}
            placeholder={NAME_PLACEHOLDER[language]}
            className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {LANGUAGE_LABEL[language]}
          </span>
          <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
            {(
              [
                { code: 'en', flag: '🇬🇧', label: 'EN' },
                { code: 'es', flag: '🇪🇸', label: 'ES' },
                { code: 'fr', flag: '🇫🇷', label: 'FR' },
              ] as const
            ).map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                aria-label={label}
                className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
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

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {BELT_LABEL[language]}
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {BELT_COLORS.map((color) => {
              const isSelected = belt === color
              return (
                <button
                  key={color}
                  onClick={() => setBelt(color)}
                  aria-label={BELT_LABELS[language][color]}
                  className={`relative rounded-xl py-2.5 flex items-center justify-center transition-all ${SWATCH_CLASS[color]} ${
                    isSelected
                      ? 'ring-2 ring-gold'
                      : 'ring-2 ring-white/40 opacity-70 active:opacity-100'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold tracking-wide uppercase ${
                      color === 'white' ? 'text-zinc-700' : 'text-white'
                    }`}
                  >
                    {BELT_LABELS[language][color].slice(0, 3)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-gold font-semibold tracking-widest">
            {STRIPES_LABEL[language]}
          </span>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStripes((prev) => Math.max(0, prev - 1))}
              disabled={stripes === 0}
              aria-label={DECREASE_STRIPES_LABEL[language]}
              className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 disabled:text-zinc-600 active:bg-zinc-700"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: MAX_STRIPES }).map((_, i) => {
                const selected = i + 1
                const plural = selected > 1
                const stripeLabel =
                  language === 'es'
                    ? `${selected} grado${plural ? 's' : ''}`
                    : language === 'fr'
                      ? `${selected} barrette${plural ? 's' : ''}`
                      : `${selected} stripe${plural ? 's' : ''}`
                return (
                  <button
                    key={i}
                    onClick={() => setStripes(selected)}
                    aria-label={stripeLabel}
                    className={`h-7 w-4 rounded-sm transition-colors ${
                      i < stripes ? 'bg-gold' : 'bg-zinc-700'
                    }`}
                  />
                )
              })}
            </div>
            <button
              onClick={() =>
                setStripes((prev) => Math.min(MAX_STRIPES, prev + 1))
              }
              disabled={stripes === MAX_STRIPES}
              aria-label={INCREASE_STRIPES_LABEL[language]}
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
          {START_LABEL[language]}
        </button>
      </div>
    </div>
  )
}
