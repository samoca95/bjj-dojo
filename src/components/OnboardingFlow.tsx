import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Home, Sparkles, X } from 'lucide-react'
import { db } from '../db/database'
import { getAppLanguage, type AppLanguage } from '../i18n'

export const ONBOARDING_COMPLETED_STORAGE_KEY = 'bjj-dojo:onboarding-completed'
const DUMMY_SESSION_STORAGE_KEY = 'bjj-dojo:onboarding-dummy-session-id'

// Prefilled technique used by the onboarding tour for the "detail view" slide.
// Armbar is recognizable and exists in every install (see prefilled.ts).
const SHOWCASE_TECHNIQUE_ID = 401

export function isOnboardingRequired(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) !== '1'
}

interface Slide {
  title: string
  body: string
  icon: 'sparkles' | 'sessions' | 'techniques' | 'home'
  // route is resolved when the slide becomes active; may depend on the dummy session id
  route?: (ctx: { dummySessionId: number | null }) => string | undefined
}

const SLIDES: Record<AppLanguage, Slide[]> = {
  en: [
    {
      icon: 'sparkles',
      title: 'Welcome to BJJ Dojo',
      body: 'A quick tour of the main features. You can skip this anytime — or go back if you want to revisit a step.',
    },
    {
      icon: 'sessions',
      title: 'Log your sessions',
      body: 'Track mat time, taps, and techniques drilled. We added a sample session so you can see how it looks.',
      route: () => '/sessions',
    },
    {
      icon: 'sessions',
      title: 'Open a session',
      body: 'Tap any session to see its details — duration, taps, techniques, notes, and energy level.',
      route: ({ dummySessionId }) => dummySessionId ? `/sessions/${dummySessionId}` : '/sessions',
    },
    {
      icon: 'techniques',
      title: 'Browse techniques',
      body: 'Explore the library, mark favorites, and add your own with references and coaching cues.',
      route: () => '/techniques',
    },
    {
      icon: 'techniques',
      title: 'Inspect a technique',
      body: 'Every technique has a detail view with image, cues, references and connected follow-ups, counters and setups.',
      route: () => `/techniques/${SHOWCASE_TECHNIQUE_ID}`,
    },
    {
      icon: 'home',
      title: 'See your progress',
      body: 'Your Home tab shows weekly mat time, streaks, and focus techniques. That\'s it — enjoy the mats!',
      route: () => '/',
    },
  ],
  es: [
    {
      icon: 'sparkles',
      title: 'Bienvenido a BJJ Dojo',
      body: 'Un recorrido rápido por las funciones principales. Puedes saltarlo o volver atrás cuando quieras.',
    },
    {
      icon: 'sessions',
      title: 'Registra tus sesiones',
      body: 'Lleva tu tiempo en el tatami, sumisiones y técnicas. Añadimos una sesión de ejemplo para que la veas.',
      route: () => '/sessions',
    },
    {
      icon: 'sessions',
      title: 'Abre una sesión',
      body: 'Toca cualquier sesión para ver sus detalles: duración, sumisiones, técnicas, notas y energía.',
      route: ({ dummySessionId }) => dummySessionId ? `/sessions/${dummySessionId}` : '/sessions',
    },
    {
      icon: 'techniques',
      title: 'Explora técnicas',
      body: 'Recorre la biblioteca, marca favoritas y añade las tuyas con referencias y claves técnicas.',
      route: () => '/techniques',
    },
    {
      icon: 'techniques',
      title: 'Mira una técnica',
      body: 'Cada técnica tiene una vista de detalle con imagen, claves, referencias y conexiones (continuaciones, contras y entradas).',
      route: () => `/techniques/${SHOWCASE_TECHNIQUE_ID}`,
    },
    {
      icon: 'home',
      title: 'Sigue tu progreso',
      body: 'En Inicio verás tiempo semanal, rachas y técnicas de enfoque. ¡A entrenar!',
      route: () => '/',
    },
  ],
  fr: [
    {
      icon: 'sparkles',
      title: 'Bienvenue sur BJJ Dojo',
      body: 'Un aperçu rapide des fonctionnalités principales. Vous pouvez ignorer ce guide à tout moment ou revenir en arrière.',
    },
    {
      icon: 'sessions',
      title: 'Enregistrez vos sessions',
      body: 'Suivez votre temps de tatami, vos soumissions et les techniques travaillées. Une session exemple a été ajoutée.',
      route: () => '/sessions',
    },
    {
      icon: 'sessions',
      title: 'Ouvrez une session',
      body: 'Touchez une session pour voir les détails : durée, soumissions, techniques, notes et niveau d’énergie.',
      route: ({ dummySessionId }) => dummySessionId ? `/sessions/${dummySessionId}` : '/sessions',
    },
    {
      icon: 'techniques',
      title: 'Parcourez les techniques',
      body: 'Explorez la bibliothèque, marquez des favorites et ajoutez les vôtres avec références et conseils.',
      route: () => '/techniques',
    },
    {
      icon: 'techniques',
      title: 'Consultez une technique',
      body: 'Chaque technique a une vue détaillée avec image, conseils, références et connexions (enchaînements, contres, entrées).',
      route: () => `/techniques/${SHOWCASE_TECHNIQUE_ID}`,
    },
    {
      icon: 'home',
      title: 'Suivez vos progrès',
      body: 'L’onglet Accueil montre votre temps hebdomadaire, vos séries et vos techniques de focus. Bonne séance !',
      route: () => '/',
    },
  ],
}

const ONBOARDING_ACTION_LABELS: Record<AppLanguage, {
  skip: string
  back: string
  done: string
  next: string
}> = {
  en: { skip: 'Skip', back: 'Back', done: 'Done', next: 'Next' },
  es: { skip: 'Saltar', back: 'Atrás', done: 'Listo', next: 'Siguiente' },
  fr: { skip: 'Ignorer', back: 'Retour', done: 'Terminer', next: 'Suivant' },
}

function ICON({ name, size = 28 }: { name: Slide['icon']; size?: number }) {
  if (name === 'sparkles') return <Sparkles size={size} className="text-gold" />
  if (name === 'sessions') return <CalendarDays size={size} className="text-gold" />
  if (name === 'techniques') return <BookOpen size={size} className="text-gold" />
  return <Home size={size} className="text-gold" />
}

async function createDummySession(language: AppLanguage): Promise<number | null> {
  try {
    const existing = window.localStorage.getItem(DUMMY_SESSION_STORAGE_KEY)
    if (existing) return Number(existing)
    const notes = language === 'es'
      ? 'Sesión de ejemplo — se borrará al terminar el recorrido.'
      : language === 'fr'
        ? 'Session exemple — elle sera supprimée à la fin du guide.'
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
  const [dummySessionId, setDummySessionId] = useState<number | null>(null)
  const dummyCreatedRef = useRef(false)

  useEffect(() => {
    if (dummyCreatedRef.current) return
    dummyCreatedRef.current = true
    void createDummySession(language).then(id => setDummySessionId(id))
  }, [language])

  useEffect(() => {
    const route = slides[index].route?.({ dummySessionId })
    if (route) navigate(route, { replace: true })
  }, [index, navigate, slides, dummySessionId])

  const finish = async (skipped: boolean) => {
    await removeDummySession()
    window.localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, '1')
    if (!skipped) navigate('/', { replace: true })
    onComplete?.()
  }

  const slide = slides[index]
  const isFirst = index === 0
  const isLast = index === slides.length - 1

  return (
    <>
      {/* Backdrop — strong blur+dim on the intro slide so attention is locked onto the card.
          On later slides we use a lighter dim so the user can still see the page being toured. */}
      <div
        className={`fixed inset-0 z-[80] transition-all duration-300 ${
          isFirst
            ? 'bg-black/70 backdrop-blur-md pointer-events-auto'
            : 'bg-black/30 pointer-events-none'
        }`}
        onClick={isFirst ? undefined : undefined}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-x-0 z-[90] px-4 pointer-events-none ${
          isFirst ? 'inset-y-0 flex items-center justify-center' : 'bottom-16 pb-4'
        }`}
      >
        <div
          className="
            max-w-md w-full mx-auto pointer-events-auto
            bg-zinc-900 ring-1 ring-gold/40 border border-zinc-700
            rounded-2xl p-4 shadow-2xl shadow-black/70
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          {isFirst ? (
            // Intro slide — larger, image-forward layout
            <div className="flex flex-col items-center text-center px-2 py-3">
              <div className="w-20 h-20 rounded-2xl bg-gold/15 ring-1 ring-gold/30 flex items-center justify-center mb-4">
                <ICON name={slide.icon} size={44} />
              </div>
              <h2 id="onboarding-title" className="font-bold text-zinc-50 text-xl">{slide.title}</h2>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed max-w-sm">{slide.body}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold/15 ring-1 ring-gold/30 flex items-center justify-center shrink-0">
                <ICON name={slide.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="onboarding-title" className="font-bold text-zinc-50 text-base">{slide.title}</h2>
                <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{slide.body}</p>
              </div>
              <button
                onClick={() => void finish(true)}
                className="p-1 -m-1 text-zinc-500 active:text-zinc-200"
                aria-label={ONBOARDING_ACTION_LABELS[language].skip}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 gap-3">
            <div className="flex gap-1.5 shrink-0">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-5 bg-gold' : 'w-1.5 bg-zinc-600'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={() => setIndex(i => Math.max(0, i - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold active:bg-zinc-700"
                  aria-label={ONBOARDING_ACTION_LABELS[language].back}
                >
                  <ChevronLeft size={14} strokeWidth={2.5} />
                  {ONBOARDING_ACTION_LABELS[language].back}
                </button>
              )}
              {isFirst && (
                <button
                  onClick={() => void finish(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-400 active:text-zinc-200"
                >
                  {ONBOARDING_ACTION_LABELS[language].skip}
                </button>
              )}
              {isLast ? (
                <button
                  onClick={() => void finish(false)}
                  className="px-4 py-1.5 rounded-lg bg-gold text-black text-xs font-bold active:bg-gold-light"
                >
                  {ONBOARDING_ACTION_LABELS[language].done}
                </button>
              ) : (
                <button
                  onClick={() => setIndex(i => Math.min(slides.length - 1, i + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold text-black text-xs font-bold active:bg-gold-light"
                >
                  {ONBOARDING_ACTION_LABELS[language].next}
                  <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
