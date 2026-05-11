import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, Zap } from 'lucide-react'
import { db } from '../db/database'
import type { Club, Session, SessionType } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'
import { CategoryIcon } from '../components/CategoryIcon'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT } from '../utils/sessionTypeIcons'
import { useI18n, sessionTypeLabel } from '../i18n'

const WEEKLY_GOAL_KEY = 'bjj-dojo.weekly-goal-minutes'

function formatDate(epoch: number, locale?: string) {
  return new Date(epoch).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateInput(epoch: number) {
  const d = new Date(epoch)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SessionCard({
  session,
  clubName,
  onClick,
  icon,
  locale,
  t,
  language,
  tapSummary,
  techniqueSummary,
}: {
  session: Session
  clubName?: string
  onClick: () => void
  icon: string
  locale?: string
  t: (text: string) => string
  language: 'en' | 'es'
  tapSummary: { given: number; received: number }
  techniqueSummary: string[]
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 items-start text-left active:bg-zinc-800 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-zinc-800 text-gold">
        <CategoryIcon value={icon} size={20} className="text-current" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-100 text-sm">{formatDate(session.date, locale)}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${SESSION_TYPE_COLORS[session.sessionType]}`}>
            {sessionTypeLabel(session.sessionType, SESSION_TYPE_LABELS[session.sessionType], language)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-zinc-400">{session.durationMinutes} {t('min')}</span>
          {clubName && <span className="text-xs text-zinc-500 truncate">{clubName}</span>}
          {(tapSummary.given > 0 || tapSummary.received > 0) && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              {tapSummary.given > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-gold" />
                  {tapSummary.given}
                </span>
              )}
              {tapSummary.received > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-red-400" />
                  {tapSummary.received}
                </span>
              )}
            </span>
          )}
        </div>
        {techniqueSummary.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {techniqueSummary.join(' · ')}
          </p>
        )}
        {session.notes && techniqueSummary.length === 0 && (
          <p className="text-xs text-zinc-500 mt-1 truncate">{session.notes}</p>
        )}
      </div>
      <EnergyDots level={session.energyLevel} />
    </button>
  )
}

function computeStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0
  const unique = [...new Set(sessions.map(s => formatDateInput(s.date)))].sort().reverse()
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (const value of unique) {
    const d = new Date(value)
    d.setHours(0, 0, 0, 0)
    const diffDays = Math.round((cursor.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays === 0 || (streak > 0 && diffDays === 1)) {
      streak += 1
      cursor = d
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (streak === 0 && diffDays === 1) {
      streak += 1
      cursor = d
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }
  return streak
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const { t, locale, language } = useI18n()
  const [sessionTypeIcons, setSessionTypeIcons] = useState(getSessionTypeIcons())
  const [filterSessionType, setFilterSessionType] = useState<SessionType | 'ALL'>('ALL')
  const [filterClubId, setFilterClubId] = useState<number | 'ALL'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(() => {
    if (typeof window === 'undefined') return '180'
    return window.localStorage.getItem(WEEKLY_GOAL_KEY) ?? '180'
  })

  const sessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    [],
    [],
  )
  const clubs = useLiveQuery(() => db.clubs.toArray(), [], [] as Club[])

  const tapsBySession = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    const bySession = new Map<number, { given: number; received: number }>()
    for (const tap of taps) {
      const existing = bySession.get(tap.sessionId) ?? { given: 0, received: 0 }
      if (tap.type === 'given') existing.given += 1
      else existing.received += 1
      bySession.set(tap.sessionId, existing)
    }
    return bySession
  }, [], new Map<number, { given: number; received: number }>())

  const techniquesBySession = useLiveQuery(async () => {
    const links = await db.sessionTechniques.toArray()
    if (links.length === 0) return new Map<number, string[]>()
    const ids = [...new Set(links.map(link => link.techniqueId))]
    const techniques = await db.techniques.where('id').anyOf(ids).toArray()
    const names = new Map(techniques.map(technique => [technique.id, technique.name]))
    const grouped = new Map<number, string[]>()
    for (const link of links) {
      const name = names.get(link.techniqueId)
      if (!name) continue
      const existing = grouped.get(link.sessionId) ?? []
      if (!existing.includes(name)) existing.push(name)
      grouped.set(link.sessionId, existing)
    }
    return grouped
  }, [], new Map<number, string[]>())

  useEffect(() => {
    const sync = () => setSessionTypeIcons(getSessionTypeIcons())
    window.addEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
  }, [])

  const clubMap = useMemo(() => new Map(clubs?.map(c => [c.id, c.name])), [clubs])

  const filteredSessions = useMemo(() => {
    const fromEpoch = fromDate ? new Date(fromDate).getTime() : null
    const toEpoch = toDate ? new Date(toDate).getTime() + (24 * 60 * 60 * 1000 - 1) : null

    return (sessions ?? []).filter(session => {
      if (filterSessionType !== 'ALL' && session.sessionType !== filterSessionType) return false
      if (filterClubId !== 'ALL' && session.clubId !== filterClubId) return false
      if (fromEpoch !== null && session.date < fromEpoch) return false
      if (toEpoch !== null && session.date > toEpoch) return false
      return true
    })
  }, [sessions, filterSessionType, filterClubId, fromDate, toDate])

  const weeklyMinutes = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    start.setHours(0, 0, 0, 0)
    return (sessions ?? [])
      .filter(s => s.date >= start.getTime())
      .reduce((sum, s) => sum + s.durationMinutes, 0)
  }, [sessions])

  const weeklyGoal = Math.max(1, Number.parseInt(weeklyGoalInput, 10) || 180)
  const goalProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))

  const trendData = useMemo(
    () => [...filteredSessions].slice(0, 8).reverse(),
    [filteredSessions],
  )
  const trendMax = Math.max(1, ...trendData.map(s => s.durationMinutes))
  const streak = useMemo(() => computeStreak(sessions ?? []), [sessions])

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-6 pt-12 pb-4 z-10">
        <h1 className="text-2xl font-bold text-zinc-100">{t('Sessions')}</h1>
      </div>

      <div className="px-4 pb-24 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="mt-1 w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="mt-1 w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterSessionType('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filterSessionType === 'ALL' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
            >
              All types
            </button>
            {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterSessionType(type)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filterSessionType === type ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
              >
                {sessionTypeLabel(type, SESSION_TYPE_LABELS[type], language)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilterClubId('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filterClubId === 'ALL' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
            >
              All clubs
            </button>
            {(clubs ?? []).map(club => (
              <button
                key={club.id}
                onClick={() => setFilterClubId(club.id ?? 'ALL')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${filterClubId === club.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
              >
                {club.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-gold">WEEKLY GOAL</h2>
            <span className="text-xs text-zinc-400">{weeklyMinutes}/{weeklyGoal} min</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${goalProgress}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10000}
              value={weeklyGoalInput}
              onChange={e => setWeeklyGoalInput(e.target.value)}
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
            />
            <button
              onClick={() => {
                const next = String(Math.max(1, Number.parseInt(weeklyGoalInput, 10) || 180))
                setWeeklyGoalInput(next)
                window.localStorage.setItem(WEEKLY_GOAL_KEY, next)
              }}
              className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-100 text-sm font-semibold"
            >
              Save goal
            </button>
          </div>
          <p className="text-xs text-zinc-500">Current streak: {streak} day{streak === 1 ? '' : 's'}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3">TREND (LAST 8 SESSIONS)</h2>
          {trendData.length === 0 ? (
            <p className="text-xs text-zinc-500">No session data in the selected range.</p>
          ) : (
            <div className="flex items-end gap-2 h-24">
              {trendData.map(s => (
                <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gold/70"
                    style={{ height: `${Math.max(10, (s.durationMinutes / trendMax) * 100)}%` }}
                    title={`${s.durationMinutes} min`}
                  />
                  <span className="text-[10px] text-zinc-500">{new Date(s.date).toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <CalendarDays size={32} className="text-zinc-600" strokeWidth={2} />
            </div>
            <p className="text-zinc-400 font-medium">{t('No sessions yet')}</p>
            <p className="text-zinc-600 text-sm">{t('Tap + to log your first training')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                icon={sessionTypeIcons[s.sessionType]}
                locale={locale}
                t={t}
                language={language}
                clubName={s.clubId !== null && s.clubId !== undefined ? clubMap.get(s.clubId) : undefined}
                tapSummary={tapsBySession.get(s.id ?? -1) ?? { given: 0, received: 0 }}
                techniqueSummary={techniquesBySession.get(s.id ?? -1) ?? []}
                onClick={() => navigate(`/sessions/${s.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/sessions/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 active:bg-gold-light transition-colors z-40"
      >
        <Plus size={28} className="text-black" strokeWidth={2.5} />
      </button>
    </div>
  )
}
