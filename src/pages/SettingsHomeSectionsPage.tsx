import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  getHomeSectionOrder,
  setHomeSectionOrder,
  getHomeSectionVisibility,
  setHomeSectionVisibility,
  type HomeSectionId,
} from '../utils/homeSectionOrder'

export default function SettingsHomeSectionsPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [sectionOrder, setSectionOrder] =
    useState<HomeSectionId[]>(getHomeSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState(
    getHomeSectionVisibility,
  )

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
    gamification: t('LEVEL AND SCORES'),
    stats: t('YOUR STATS'),
    plannedSessions: t('PLANNED SESSIONS'),
    calendar: t('TRAINING CALENDAR'),
    quickAccess: t('QUICK ACCESS'),
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
        <h1 className="flex-1 font-bold text-zinc-100">
          {language === 'es'
            ? 'Orden del inicio'
            : language === 'fr'
              ? 'Ordre de l’accueil'
              : 'Home section order'}
        </h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('HOME SECTION ORDER')}
          </h2>
          <p className="text-xs text-zinc-500">
            {t(
              'Reorder the sections on the home screen and hide the ones you do not want to see.',
            )}
          </p>
          <div className="space-y-2">
            {sectionOrder.map((id, index) => (
              <div
                key={id}
                className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2"
              >
                <span className="flex-1 text-sm text-zinc-100">
                  {sectionLabels[id]}
                </span>
                <button
                  onClick={() => toggleSectionVisibility(id)}
                  aria-label={
                    sectionVisibility[id]
                      ? t('Hide section')
                      : t('Show section')
                  }
                  className="p-1.5 rounded-lg text-zinc-300 active:bg-zinc-700"
                >
                  {sectionVisibility[id] ? (
                    <Eye size={16} strokeWidth={2} />
                  ) : (
                    <EyeOff size={16} strokeWidth={2} />
                  )}
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
      </div>
    </div>
  )
}
