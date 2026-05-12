import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, ChevronRight, Flame } from 'lucide-react'
import { db } from '../db/database'
import { useI18n } from '../i18n'
import { getGoalMatTime } from '../utils/goalMatTime'

const DAY_MS = 24 * 60 * 60 * 1000

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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-zinc-100">{value}</span>
      {sub && <span className="text-sm text-zinc-400">{sub}</span>}
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const todayStart = startOfDay(Date.now())
  const weekStart = todayStart - 6 * DAY_MS
  const currentWeekStart = startOfWeek(Date.now())
  const previousWeekStart = currentWeekStart - 7 * DAY_MS
  const weeklyGoalMinutes = getGoalMatTime()

  const sessionCount = useLiveQuery(() => db.sessions.count(), [], 0)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])
  const totalMinutes = sessions?.reduce((s, r) => s + r.durationMinutes, 0) ?? 0

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
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  const weeklyMinutes = weeklySessions.reduce((sum, session) => sum + session.durationMinutes, 0)
  const weeklyGoalPct = Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100))

  const sortedAsc = [...recentSessions].sort((a, b) => a.date - b.date)
  const last5TapCounts = sortedAsc.map(s => tapCountsBySessionId.get(s.id ?? -1) ?? 0)
  const avgTaps5 = last5TapCounts.length === 0
    ? 0
    : last5TapCounts.reduce((a, b) => a + b, 0) / last5TapCounts.length
  const maxTaps5 = Math.max(...last5TapCounts, 1)

  const weekStarts = Array.from(
    new Set((sessions ?? []).map(session => {
      return startOfWeek(session.date)
    })),
  ).sort((a, b) => b - a)

  let trainingWeekStreak = 0
  if (weekStarts.length > 0) {
    const firstWeek = weekStarts[0]
    if (firstWeek === currentWeekStart || firstWeek === previousWeekStart) {
      for (let index = 0; index < weekStarts.length; index += 1) {
        if (index === 0) {
          trainingWeekStreak += 1
          continue
        }
        const expectedNext = weekStarts[index - 1] - 7 * DAY_MS
        if (weekStarts[index] !== expectedNext) break
        trainingWeekStreak += 1
      }
    }
  }

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <h1 className="text-3xl font-black tracking-widest text-gold">BJJ DOJO</h1>
        <p className="text-zinc-400 text-sm mt-1">{t('Track your journey on the mats')}</p>
      </div>

      <div className="px-4 space-y-6 pb-6">
        {/* Stats */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('YOUR STATS')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('Sessions')} value={String(sessionCount ?? 0)} />
            <StatCard label={t('Mat Time')} value={totalMinutes > 0 ? timeLabel : '0m'} />
            <StatCard label={t('Taps Given')} value={String(tapCounts?.given ?? 0)} />
            <StatCard label={t('Taps Received')} value={String(tapCounts?.received ?? 0)} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-gold px-1">
            {t('TRENDING')}
          </h2>
          {/* Taps Given – avg of last 5 sessions */}
          <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-zinc-500">{t('Avg taps / last 5')}</div>
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
          {/* Weekly goal + week streak */}
          <div className="bg-zinc-900 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{t('Weekly goal')}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{weeklyMinutes}/{weeklyGoalMinutes} min</span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-400">
                  <Flame size={13} fill="currentColor" strokeWidth={0} />
                  {trainingWeekStreak}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-gold" style={{ width: `${weeklyGoalPct}%` }} />
            </div>
          </div>
        </section>

        {/* Quick access */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('QUICK ACCESS')}</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/sessions')}
              className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <CalendarDays size={28} className="text-gold" strokeWidth={2} />
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
                <BookOpen size={28} className="text-gold" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">{t('Technique Library')}</div>
                <div className="text-sm text-zinc-400">{t('60+ techniques with YouTube refs')}</div>
              </div>
              <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
