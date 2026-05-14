import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useI18n } from '../i18n'
import { getGoalMatTime, setGoalMatTime, DEFAULT_WEEKLY_GOAL_MINUTES } from '../utils/goalMatTime'

export default function SettingsGoalsPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [goalInput, setGoalInput] = useState(String(getGoalMatTime()))

  const handleGoalSave = () => {
    const n = Number(goalInput)
    if (n > 0 && Number.isFinite(n)) {
      setGoalMatTime(Math.round(n))
    } else {
      setGoalInput(String(getGoalMatTime()))
    }
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">
          {language === 'es' ? 'Objetivos' : language === 'fr' ? 'Objectifs' : 'Goals'}
        </h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {language === 'es' ? 'SEGUIMIENTO' : language === 'fr' ? 'SUIVI' : 'TRACKING'}
          </h2>
          <p className="text-xs text-zinc-500">
            {language === 'es'
              ? 'Más objetivos y gamificación próximamente.'
              : language === 'fr'
                ? 'Plus d’objectifs et de gamification bientôt.'
                : 'More goals and gamification options coming soon.'}
          </p>
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
      </div>
    </div>
  )
}
