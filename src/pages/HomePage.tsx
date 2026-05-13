import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, ChevronRight, Flame, Crosshair, Zap, Hand } from 'lucide-react'
import { db } from '../db/database'
import { useI18n } from '../i18n'
import ErrorBoundary from '../components/ErrorBoundary'
import { getGoalMatTime } from '../utils/goalMatTime'
import { getFocusTechniqueIds, setFocusTechniqueIds } from '../utils/focusTechniques'
import { techniqueMatchesQuery, techniqueScore } from '../utils/fuzzySearch'
import TrainingCalendar from '../components/TrainingCalendar'
import { CategoryIcon } from '../components/CategoryIcon'
import {
  getHomeSectionOrder,
  getHomeSectionVisibility,
  HOME_SECTION_ORDER_UPDATED_EVENT,
  type HomeSectionId,
} from '../utils/homeSectionOrder'
import {
  getBeltColor,
  getBeltStripes,
  BELT_RANK_UPDATED_EVENT,
  type BeltColor,
} from '../utils/beltRank'

const DAY_MS = 24 * 60 * 60 * 1000

const BELT_STYLES: Record<BeltColor, { bg: string; text: string; activeStripe: string; dimStripe: string }> = {
  white:  { bg: 'bg-zinc-100',   text: 'text-zinc-900', activeStripe: 'bg-white', dimStripe: 'bg-transparent border border-zinc-400/70' },
  blue:   { bg: 'bg-blue-600',   text: 'text-white',    activeStripe: 'bg-white', dimStripe: 'bg-transparent border border-zinc-400/60' },
  purple: { bg: 'bg-purple-600', text: 'text-white',    activeStripe: 'bg-white', dimStripe: 'bg-transparent border border-zinc-400/60' },
  brown:  { bg: 'bg-amber-800',  text: 'text-white',    activeStripe: 'bg-white', dimStripe: 'bg-transparent border border-zinc-400/60' },
  black:  { bg: 'bg-belt-black', text: 'text-white',    activeStripe: 'bg-white', dimStripe: 'bg-transparent border border-red-300/40' },
}

function BeltDisplay({ color, stripes, beltLabel }: { color: BeltColor; stripes: number; beltLabel: string }) {
  const s = BELT_STYLES[color]
  const tipClass = color === 'black' ? 'bg-red-700' : 'bg-belt-black'
  return (
    <div className="overflow-hidden rounded-xl flex h-10 belt-outline">
      <div className={`flex-1 flex items-center px-5 ${s.bg}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${s.text}`}>{beltLabel}</span>
      </div>
      {/* Tip with stripes */}
      <div className={`flex items-center gap-2 px-4 ${tipClass}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-5 w-3 rounded-sm transition-colors ${i < stripes ? s.activeStripe : s.dimStripe}`}
          />
        ))}
      </div>
    </div>
  )
}

function startOfDay(epoch: number): number {
  const day = new Date(epoch)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

function startOfWeek(epoch: number): number {
  const day = new Date(epoch)
  day.setHours(0, 0, 0, 0)
  const dayOfWeek = day.getDay()
  const offset = (dayOfWeek + 6) % 7 // Monday = 0
  day.setDate(day.getDate() - offset)
  return day.getTime()
}

function SectionErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-zinc-400">{t('Section unavailable')}</span>
      <button onClick={onRetry} className="text-xs font-semibold text-gold">{t('Try again')}</button>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex flex-col gap-1">
      <span className="text-xl font-bold text-zinc-100">{value}</span>
      {sub && <span className="text-sm text-zinc-400">{sub}</span>}
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [focusPickerOpen, setFocusPickerOpen] = useState(false)
  const [focusPickerSearch, setFocusPickerSearch] = useState('')
  const [focusTechniqueIds, setFocusTechniqueIdsState] = useState<number[]>(getFocusTechniqueIds)
  const [sectionOrder, setSectionOrder] = useState<HomeSectionId[]>(getHomeSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState(getHomeSectionVisibility)
  const [beltColor, setBeltColorState] = useState<BeltColor>(getBeltColor)
  const [beltStripes, setBeltStripesState] = useState<number>(getBeltStripes)

  useEffect(() => {
    const sync = () => {
      setSectionOrder(getHomeSectionOrder())
      setSectionVisibility(getHomeSectionVisibility())
    }
    window.addEventListener(HOME_SECTION_ORDER_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(HOME_SECTION_ORDER_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const sync = () => {
      setBeltColorState(getBeltColor())
      setBeltStripesState(getBeltStripes())
    }
    window.addEventListener(BELT_RANK_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(BELT_RANK_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const todayStart = startOfDay(Date.now())
  const weekStart = todayStart - 6 * DAY_MS
  const currentWeekStart = startOfWeek(Date.now())
  const previousWeekStart = currentWeekStart - 7 * DAY_MS
  const weeklyGoalMinutes = getGoalMatTime()

  const sessionCount = useLiveQuery(() => db.sessions.count(), [], 0)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])
  const totalMinutes = useMemo(
    () => (sessions ?? []).reduce((s, r) => s + r.durationMinutes, 0),
    [sessions],
  )

  const tapCounts = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    return {
      given: taps.filter(t => t.type === 'given').length,
      received: taps.filter(t => t.type === 'received').length,
    }
  }, [], { given: 0, received: 0 })
  const weeklySessions = useLiveQuery(
    () => db.sessions.where('date').aboveOrEqual(weekStart).toArray(),
    [weekStart],
    [],
  )
  const recentSessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().limit(5).toArray(),
    [],
    [],
  )
  const tapCountsBySessionId = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    const counts = new Map<number, number>()
    for (const tap of taps) {
      if (tap.type !== 'given') continue
      counts.set(tap.sessionId, (counts.get(tap.sessionId) ?? 0) + 1)
    }
    return counts
  }, [], new Map<number, number>())
  const techniques = useLiveQuery(() => db.techniques.orderBy('name').toArray(), [], [])
  const givenTapCountsByTechniqueId = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    const counts = new Map<number, number>()
    for (const tap of taps) {
      if (tap.type !== 'given') continue
      counts.set(tap.techniqueId, (counts.get(tap.techniqueId) ?? 0) + 1)
    }
    return counts
  }, [], new Map<number, number>())
  const receivedTapCountsByTechniqueId = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    const counts = new Map<number, number>()
    for (const tap of taps) {
      if (tap.type !== 'received') continue
      counts.set(tap.techniqueId, (counts.get(tap.techniqueId) ?? 0) + 1)
    }
    return counts
  }, [], new Map<number, number>())
  const timeLabel = useMemo(() => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }, [totalMinutes])
  const weeklyMinutes = useMemo(
    () => (weeklySessions ?? []).reduce((sum, s) => sum + s.durationMinutes, 0),
    [weeklySessions],
  )
  const weeklyGoalPct = useMemo(
    () => Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100)),
    [weeklyMinutes, weeklyGoalMinutes],
  )

  const { last5TapCounts, avgTaps5, maxTaps5 } = useMemo(() => {
    const sorted = [...(recentSessions ?? [])].sort((a, b) => a.date - b.date)
    const last5TapCounts = sorted.map(s => tapCountsBySessionId.get(s.id ?? -1) ?? 0)
    const avgTaps5 = last5TapCounts.length === 0
      ? 0
      : last5TapCounts.reduce((a, b) => a + b, 0) / last5TapCounts.length
    const maxTaps5 = Math.max(...last5TapCounts, 1)
    return { last5TapCounts, avgTaps5, maxTaps5 }
  }, [recentSessions, tapCountsBySessionId])
  const focusTechniques = useMemo(
    () => (techniques ?? []).filter(t => focusTechniqueIds.includes(t.id)),
    [techniques, focusTechniqueIds],
  )

  const filteredPickerTechniques = useMemo(() => {
    const results = (techniques ?? []).filter(t => techniqueMatchesQuery(t, focusPickerSearch))
    if (focusPickerSearch.trim()) {
      return [...results].sort((a, b) => techniqueScore(b, focusPickerSearch) - techniqueScore(a, focusPickerSearch))
    }
    return results
  }, [techniques, focusPickerSearch])

  const trainingWeekStreak = useMemo(() => {
    const weekStarts = Array.from(
      new Set((sessions ?? []).map(s => startOfWeek(s.date))),
    ).sort((a, b) => b - a)
    let streak = 0
    if (weekStarts.length > 0) {
      const firstWeek = weekStarts[0]
      if (firstWeek === currentWeekStart || firstWeek === previousWeekStart) {
        for (let index = 0; index < weekStarts.length; index += 1) {
          if (index === 0) { streak += 1; continue }
          if (weekStarts[index] !== weekStarts[index - 1] - 7 * DAY_MS) break
          streak += 1
        }
      }
    }
    return streak
  }, [sessions, currentWeekStart, previousWeekStart])

  const statsSection = (
    <section key="stats">
      <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('YOUR STATS')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('Sessions')} value={String(sessionCount ?? 0)} />
        <StatCard label={t('Mat Time')} value={totalMinutes > 0 ? timeLabel : '0m'} />
        <StatCard label={t('Taps Given')} value={String(tapCounts?.given ?? 0)} />
        <StatCard label={t('Taps Received')} value={String(tapCounts?.received ?? 0)} />
      </div>
    </section>
  )

  const trendingSection = (
    <section key="trending" className="space-y-3">
      <h2 className="text-xs font-semibold tracking-widest text-gold px-1">
        {t('TRENDING')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-zinc-500">{t('Avg taps')}</div>
            <div className="text-xl font-bold text-blue-400 mt-0.5">
              {avgTaps5.toFixed(1)}
            </div>
          </div>
          {last5TapCounts.length > 0 && (
            <div className="flex items-end gap-1 h-6">
              {last5TapCounts.map((count, i) => (
                <div
                  key={i}
                  className="w-2 rounded-sm bg-blue-400/60"
                  style={{ height: `${Math.max(3, Math.round((count / maxTaps5) * 24))}px` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="bg-zinc-900 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">{t('Weekly goal')}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-400">
                <Flame size={13} fill="currentColor" strokeWidth={0} />
                <span>{trainingWeekStreak}</span>
                <span className="text-[10px] uppercase tracking-wide">{t('w.')}</span>
              </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${weeklyGoalPct}%` }} />
          </div>
        </div>
      </div>
    </section>
  )

  const focusSection = (
    <section key="focus" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-widest text-gold">{t('FOCUS TECHNIQUES')}</h2>
        <button
          onClick={() => {
            setFocusPickerOpen(prev => !prev)
            setFocusPickerSearch('')
          }}
          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
            focusPickerOpen ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          {t('Set focus')}
        </button>
      </div>
      {focusPickerOpen && (
        <div className="bg-zinc-900 rounded-2xl p-3">
          <input
            type="text"
            value={focusPickerSearch}
            onChange={e => setFocusPickerSearch(e.target.value)}
            placeholder={t('Search…')}
            className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600 mb-2"
          />
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {filteredPickerTechniques.map(technique => {
              const selected = focusTechniqueIds.includes(technique.id)
              return (
                <button
                  key={technique.id}
                  onClick={() => {
                    const next = selected
                      ? focusTechniqueIds.filter(id => id !== technique.id)
                      : [...focusTechniqueIds, technique.id]
                    setFocusTechniqueIds(next)
                    setFocusTechniqueIdsState(next)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected ? 'bg-gold text-black font-semibold' : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {technique.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {focusTechniques.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl px-4 py-3 text-sm text-zinc-400">
          {t('No focus techniques selected')}
        </div>
      ) : (
        <div className="space-y-2">
          {focusTechniques.map(technique => (
            <div key={technique.id} className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Crosshair size={14} className="text-gold shrink-0" />
                <span className="text-sm font-semibold text-zinc-100 truncate">{technique.name}</span>
                <CategoryIcon fallbackId={technique.categoryId} size={14} className="text-gold shrink-0" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <Hand size={12} strokeWidth={2} />
                  {receivedTapCountsByTechniqueId.get(technique.id) ?? 0}
                </span>
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <Zap size={12} strokeWidth={2} />
                  {givenTapCountsByTechniqueId?.get(technique.id) ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  const calendarSection = (
    <TrainingCalendar
      key="calendar"
      sessions={sessions ?? []}
      onDayClick={epoch => navigate('/sessions/new', { state: { date: epoch } })}
    />
  )

  const quickAccessSection = (
    <section key="quickAccess">
      <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('QUICK ACCESS')}</h2>
      <div className="space-y-3">
        <button
          onClick={() => navigate('/sessions')}
          className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <CalendarDays size={28} className="text-gold" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-zinc-100">{t('Training Sessions')}</div>
            <div className="text-sm text-zinc-400">{t('Log and review your mat time')}</div>
          </div>
          <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
        </button>

        <button
          onClick={() => navigate('/techniques')}
          className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <BookOpen size={28} className="text-gold" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-zinc-100">{t('Technique Library')}</div>
            <div className="text-sm text-zinc-400">{t('60+ techniques with YouTube refs')}</div>
          </div>
          <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
        </button>
      </div>
    </section>
  )

  const sectionMap: Record<HomeSectionId, ReactNode> = {
    focus: <ErrorBoundary key="focus" fallback={retry => <SectionErrorCard onRetry={retry} />}>{focusSection}</ErrorBoundary>,
    trending: <ErrorBoundary key="trending" fallback={retry => <SectionErrorCard onRetry={retry} />}>{trendingSection}</ErrorBoundary>,
    stats: <ErrorBoundary key="stats" fallback={retry => <SectionErrorCard onRetry={retry} />}>{statsSection}</ErrorBoundary>,
    calendar: <ErrorBoundary key="calendar" fallback={retry => <SectionErrorCard onRetry={retry} />}>{calendarSection}</ErrorBoundary>,
    quickAccess: <ErrorBoundary key="quickAccess" fallback={retry => <SectionErrorCard onRetry={retry} />}>{quickAccessSection}</ErrorBoundary>,
  }

  const beltLabelKeys: Record<BeltColor, 'White Belt' | 'Blue Belt' | 'Purple Belt' | 'Brown Belt' | 'Black Belt'> = {
    white: 'White Belt', blue: 'Blue Belt', purple: 'Purple Belt', brown: 'Brown Belt', black: 'Black Belt',
  }
  const beltLabel = t(beltLabelKeys[beltColor])

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-black tracking-widest text-gold">BJJ DOJO</h1>
          <span
            className="text-2xl text-gold leading-none"
            style={{ fontFamily: "'Zen Old Mincho', serif", fontWeight: 900 }}
          >
            柔術
          </span>
        </div>
        <p className="text-zinc-400 text-sm mt-1">{t('Track your journey on the mats')}</p>
      </div>

      <div className="px-4 space-y-6 pb-6">
        <BeltDisplay color={beltColor} stripes={beltStripes} beltLabel={beltLabel} />
        {sectionOrder.filter(id => sectionVisibility[id]).map(id => sectionMap[id])}
      </div>
    </div>
  )
}
