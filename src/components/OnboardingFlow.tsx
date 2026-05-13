import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, ChevronRight, Home, Sparkles } from 'lucide-react'
import { db } from '../db/database'
import { getAppLanguage, type AppLanguage } from '../i18n'

export const ONBOARDING_COMPLETED_STORAGE_KEY = 'bjj-dojo:onboarding-completed'
const DUMMY_SESSION_STORAGE_KEY = 'bjj-dojo:onboarding-dummy-session-id'

export function isOnboardingRequired(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) !== '1'
}

interface Slide {
  title: string
  body: string
  icon: 'sparkles' | 'sessions' | 'techniques' | 'home'
  route?: string
}

const SLIDES: Record<AppLanguage, Slide[]> = {
  en: [
    {
      icon: 'sparkles',
      title: 'Welcome to BJJ Dojo',
      body: 'A quick tour of the main features. You can skip this anytime.',
    },
    {
      icon: 'sessions',
      title: 'Log your sessions',
      body: 'Track mat time, taps, and techniques drilled. We added a sample session so you can see how it looks.',
      route: '/sessions',
    },
    {
      icon: 'techniques',
      title: 'Browse techniques',
      body: 'Explore the library, mark favorites, and add your own with references and coaching cues.',
      route: '/techniques',
    },
    {
      icon: 'home',
      title: 'See your progress',
      body: 'Your Home tab shows weekly mat time, streaks, and focus techniques. That\'s it — enjoy the mats!',
      route: '/',
    },
  ],
  es: [
    {
      icon: 'sparkles',
      title: 'Bienvenido a BJJ Dojo',
      body: 'Un recorrido rápido por las funciones principales. Puedes saltarlo cuando quieras.',
    },
    {
      icon: 'sessions',
      title: 'Registra tus sesiones',
      body: 'Lleva tu tiempo en el tatami, sumisiones y técnicas. Añadimos una sesión de ejemplo para que la veas.',
      route: '/sessions',
    },
    {
      icon: 'techniques',
      title: 'Explora técnicas',
      body: 'Recorre la biblioteca, marca favoritas y añade las tuyas con referencias y claves técnicas.',
      route: '/techniques',
    },
    {
      icon: 'home',
      title: 'Sigue tu progreso',
      body: 'En Inicio verás tiempo semanal, rachas y técnicas de enfoque. ¡A entrenar!',
      route: '/',
    },
  ],
}

function ICON({ name }: { name: Slide['icon'] }) {
  if (name === 'sparkles') return <Sparkles size={28} className="text-gold" />
  if (name === 'sessions') return <CalendarDays size={28} className="text-gold" />
  if (name === 'techniques') return <BookOpen size={28} className="text-gold" />
  return <Home size={28} className="text-gold" />
}

async function createDummySession(language: AppLanguage): Promise<number | null> {
  try {
    const existing = window.localStorage.getItem(DUMMY_SESSION_STORAGE_KEY)
    if (existing) return Number(existing)
    const notes = language === 'es'
      ? 'Sesión de ejemplo — se borrará al terminar el recorrido.'
      : 'Sample session — will be removed when the tour ends.'
    const id = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 60,
      sessionType: 'GI',
      clubId: null,
      notes,
      energyLevel: 4,
    })
    window.localStorage.setItem(DUMMY_SESSION_STORAGE_KEY, String(id))
    return id as number
  } catch {
    return null
  }
}

async function removeDummySession() {
  const raw = window.localStorage.getItem(DUMMY_SESSION_STORAGE_KEY)
  if (!raw) return
  const id = Number(raw)
  window.localStorage.removeItem(DUMMY_SESSION_STORAGE_KEY)
  if (!Number.isFinite(id)) return
  try {
    await db.sessions.delete(id)
    await db.sessionTechniques.where('sessionId').equals(id).delete()
    await db.sessionTaps.where('sessionId').equals(id).delete()
  } catch {
    // best effort
  }
}

interface OnboardingFlowProps {
  onComplete?: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const navigate = useNavigate()
  const language = getAppLanguage()
  const slides = SLIDES[language]
  const [index, setIndex] = useState(0)
  const dummyCreatedRef = useRef(false)

  useEffect(() => {
    if (dummyCreatedRef.current) return
    dummyCreatedRef.current = true
    void createDummySession(language)
  }, [language])

  useEffect(() => {
    const route = slides[index].route
    if (route) navigate(route, { replace: true })
  }, [index, navigate, slides])

  const finish = async (skipped: boolean) => {
    await removeDummySession()
    window.localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, '1')
    if (!skipped) navigate('/', { replace: true })
    onComplete?.()
  }

  const slide = slides[index]
  const isLast = index === slides.length - 1

  return (
    <div className="fixed inset-x-0 bottom-16 z-[90] px-4 pb-4 pointer-events-none">
      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl shadow-black/50 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0">
            <ICON name={slide.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-zinc-100 text-base">{slide.title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{slide.body}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-gold' : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void finish(true)}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 active:text-zinc-200"
            >
              {language === 'es' ? 'Saltar' : 'Skip'}
            </button>
            {isLast ? (
              <button
                onClick={() => void finish(false)}
                className="px-4 py-1.5 rounded-lg bg-gold text-black text-xs font-bold active:bg-gold-light"
              >
                {language === 'es' ? 'Listo' : 'Done'}
              </button>
            ) : (
              <button
                onClick={() => setIndex(i => Math.min(slides.length - 1, i + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold text-black text-xs font-bold active:bg-gold-light"
              >
                {language === 'es' ? 'Siguiente' : 'Next'}
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
