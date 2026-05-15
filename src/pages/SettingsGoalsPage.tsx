import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  getGoalMatTime,
  setGoalMatTime,
  DEFAULT_WEEKLY_GOAL_MINUTES,
} from '../utils/goalMatTime'
import { getCardVisible, setCardVisible } from '../utils/homeCardVisibility'

export default function SettingsGoalsPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [goalInput, setGoalInput] = useState(String(getGoalMatTime()))
  const [tick, setTick] = useState(0)

  const handleGoalSave = () => {
    const n = Number(goalInput)
    if (n > 0 && Number.isFinite(n)) {
      setGoalMatTime(Math.round(n))
    } else {
      setGoalInput(String(getGoalMatTime()))
    }
  }

  void tick
  const levelCards = [
    { id: 'level', label: t('Level') },
    { id: 'xp', label: t('XP') },
    { id: 'dailyStreak', label: t('Daily streak') },
    { id: 'weeklyStreak', label: t('Weekly streak') },
    { id: 'achievements', label: t('Achievements') },
  ]

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
            ? 'Objetivos y logros'
            : language === 'fr'
              ? 'Objectifs et réalisations'
              : 'Goals and Achievements'}
        </h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('WEEKLY MAT TIME GOAL')}
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
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
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('LEVEL AND SCORES VIEW')}
          </h2>
          <p className="text-xs text-zinc-500">
            {t('Choose which level and score cards are shown on Home.')}
          </p>
          <div className="space-y-2">
            {levelCards.map((card) => {
              const fallback = card.id === 'achievements' ? false : true
              const visible = getCardVisible('gamification', card.id, fallback)
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setCardVisible('gamification', card.id, !visible)
                    setTick((n) => n + 1)
                  }}
                  className="w-full flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 active:bg-zinc-700"
                >
                  <span className="flex-1 text-sm text-zinc-100 text-left">
                    {card.label}
                  </span>
                  {visible ? (
                    <Eye size={16} strokeWidth={2} className="text-zinc-300" />
                  ) : (
                    <EyeOff
                      size={16}
                      strokeWidth={2}
                      className="text-zinc-500"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
