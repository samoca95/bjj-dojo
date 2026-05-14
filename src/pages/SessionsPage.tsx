import { useEffect, useLayoutEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Hand, Plus, Search, SlidersHorizontal, Zap } from 'lucide-react'
import { db } from '../db/database'
import type { Club, Session, SessionType } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'
import { CategoryIcon } from '../components/CategoryIcon'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT } from '../utils/sessionTypeIcons'
import { useI18n, sessionTypeLabel, type AppLanguage } from '../i18n'

const LIST_SCROLL_KEY = 'bjj-dojo.sessions.scroll-y'

function formatDate(epoch: number, locale?: string) {
  return new Date(epoch).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

function SessionCard({
  session,
  clubName,
  onClick,
  icon,
  locale,
  t,
  language,
  tapStats,
  techniqueNames,
}: {
  session: Session
  clubName?: string
  onClick: () => void
  icon: string
  locale?: string
  t: (text: import('../i18n').TranslationKey) => string
  language: AppLanguage
  tapStats: { given: number; received: number }
  techniqueNames: string[]
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 items-start text-left active:bg-zinc-800 transition-colors"
    >
      {/* Session type icon column */}
      <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${SESSION_TYPE_COLORS[session.sessionType].replace('text-', 'text-').replace('bg-', 'bg-')}`}>
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
          {(tapStats.given > 0 || tapStats.received > 0) && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              {tapStats.given > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-green-500" />
                  {tapStats.given}
                </span>
              )}
              {tapStats.received > 0 && (
                <span className="flex items-center gap-0.5">
                  <Hand size={10} className="text-red-400" />
                  {tapStats.received}
                </span>
              )}
            </span>
          )}
        </div>
        {techniqueNames.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {techniqueNames.join(' · ')}
          </p>
        )}
      </div>
      <EnergyDots level={session.energyLevel} />
    </button>
  )
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const { t, locale, language } = useI18n()
  const [sessionTypeIcons, setSessionTypeIcons] = useState(getSessionTypeIcons())
  const [filterOpen, setFilterOpen] = useState(false)
  const [clubFilter, setClubFilter] = useState<'all' | number>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | SessionType>('all')
  const [daysFilter, setDaysFilter] = useState<'all' | 30 | 90 | 365>('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'duration' | 'taps_total' | 'taps_given' | 'taps_received'>('date_desc')
  const [searchQuery, setSearchQuery] = useState('')
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    [],
    [],
  )
  const clubs = useLiveQuery(() => db.clubs.toArray(), [], [] as Club[])
  const sessionMeta = useLiveQuery(async () => {
    const [sts, taps, techniques] = await Promise.all([
      db.sessionTechniques.toArray(),
      db.sessionTaps.toArray(),
      db.techniques.toArray(),
    ])

    const techniqueNameById = new Map(techniques.map(technique => [technique.id, technique.name]))
    const searchableTechniqueTextById = new Map(
      techniques.map(technique => {
        const text = [
          technique.name,
          ...(technique.aliases ?? []),
          technique.description,
          ...(technique.cues ?? []),
          ...(technique.tags ?? []),
        ].join(' ').toLowerCase()
        return [technique.id, text]
      }),
    )
    const techniqueNamesBySessionId = new Map<number, string[]>()
    const searchTextBySessionId = new Map<number, string>()
    for (const st of sts) {
      const name = techniqueNameById.get(st.techniqueId)
      if (!name) continue
      const bucket = techniqueNamesBySessionId.get(st.sessionId) ?? []
      bucket.push(name)
      techniqueNamesBySessionId.set(st.sessionId, bucket)

      const searchBucket = searchTextBySessionId.get(st.sessionId) ?? ''
      const techniqueSearchText = searchableTechniqueTextById.get(st.techniqueId) ?? name.toLowerCase()
      searchTextBySessionId.set(
        st.sessionId,
        `${searchBucket} ${techniqueSearchText} ${st.notes ?? ''}`.trim(),
      )
    }

    const tapStatsBySessionId = new Map<number, { given: number; received: number }>()
    for (const tap of taps) {
      const bucket = tapStatsBySessionId.get(tap.sessionId) ?? { given: 0, received: 0 }
      if (tap.type === 'given') bucket.given += 1
      else bucket.received += 1
      tapStatsBySessionId.set(tap.sessionId, bucket)
    }

    return {
      techniqueNamesBySessionId,
      tapStatsBySessionId,
      searchTextBySessionId,
    }
  }, [], {
    techniqueNamesBySessionId: new Map<number, string[]>(),
    tapStatsBySessionId: new Map<number, { given: number; received: number }>(),
    searchTextBySessionId: new Map<number, string>(),
  })
  const clubMap = new Map(clubs?.map(c => [c.id, c.name]))
  const cutoff = daysFilter === 'all' ? null : Date.now() - daysFilter * 24 * 60 * 60 * 1000
  const searchTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const visibleSessions = (sessions ?? []).filter(session => {
    if (cutoff !== null && session.date < cutoff) return false
    if (typeFilter !== 'all' && session.sessionType !== typeFilter) return false
    if (clubFilter !== 'all' && session.clubId !== clubFilter) return false
    if (searchTokens.length > 0) {
      const sessionId = session.id ?? -1
      const clubName = session.clubId !== null && session.clubId !== undefined ? clubMap.get(session.clubId) : ''
      const tapStats = sessionMeta.tapStatsBySessionId?.get(sessionId) ?? { given: 0, received: 0 }
      const searchable = [
        session.notes,
        clubName,
        session.sessionType,
        SESSION_TYPE_LABELS[session.sessionType],
        sessionMeta.searchTextBySessionId?.get(sessionId) ?? '',
        `given ${tapStats.given} received ${tapStats.received}`,
      ].join(' ').toLowerCase()
      const matches = searchTokens.every(token => searchable.includes(token))
      if (!matches) return false
    }
    return true
  })
  const sortedVisibleSessions = [...visibleSessions].sort((a, b) => {
    const tapsA = sessionMeta.tapStatsBySessionId.get(a.id ?? -1) ?? { given: 0, received: 0 }
    const tapsB = sessionMeta.tapStatsBySessionId.get(b.id ?? -1) ?? { given: 0, received: 0 }
    if (sortBy === 'date_asc') return a.date - b.date
    if (sortBy === 'duration') return b.durationMinutes - a.durationMinutes || b.date - a.date
    if (sortBy === 'taps_total') {
      const totalDelta = (tapsB.given + tapsB.received) - (tapsA.given + tapsA.received)
      return totalDelta !== 0 ? totalDelta : b.date - a.date
    }
    if (sortBy === 'taps_given') {
      const givenDelta = tapsB.given - tapsA.given
      return givenDelta !== 0 ? givenDelta : b.date - a.date
    }
    if (sortBy === 'taps_received') {
      const receivedDelta = tapsB.received - tapsA.received
      return receivedDelta !== 0 ? receivedDelta : b.date - a.date
    }
    return b.date - a.date
  })

  useEffect(() => {
    const sync = () => setSessionTypeIcons(getSessionTypeIcons())
    window.addEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
  }, [])

  useLayoutEffect(() => {
    const raw = window.sessionStorage.getItem(LIST_SCROLL_KEY)
    if (!raw) return
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return
    window.requestAnimationFrame(() => {
      try {
        window.scrollTo(0, parsed)
      } catch {
        return
      }
    })
  }, [])

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="px-6 pt-12 pb-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">{t('Sessions')}</h1>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date_desc' | 'date_asc' | 'duration' | 'taps_total' | 'taps_given' | 'taps_received')}
              className="h-9 bg-zinc-800 rounded-xl px-2 text-xs text-zinc-200 outline-none focus:ring-2 focus:ring-gold"
              aria-label={language === 'es' ? 'Ordenar' : 'Sort'}
            >
              <option value="date_desc">{language === 'es' ? 'Fecha (más reciente)' : 'Date (newest)'}</option>
              <option value="date_asc">{language === 'es' ? 'Fecha (más antigua)' : 'Date (oldest)'}</option>
              <option value="duration">{language === 'es' ? 'Duración' : 'Duration'}</option>
              <option value="taps_total">{language === 'es' ? 'Taps (total)' : 'Taps (total)'}</option>
              <option value="taps_given">{language === 'es' ? 'Taps dados' : 'Taps (given)'}</option>
              <option value="taps_received">{language === 'es' ? 'Taps recibidos' : 'Taps (received)'}</option>
            </select>
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors relative ${
                filterOpen ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
              }`}
              aria-label={t('Filter')}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
              {(typeFilter !== 'all' || clubFilter !== 'all' || daysFilter !== 'all') && !filterOpen && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold" />
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('Search sessions…')}
              aria-label={t('Search sessions')}
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
          </div>
        </div>

        {/* Collapsible filter panel */}
        {filterOpen && (
          <div className="mx-4 mb-3 bg-zinc-900 rounded-2xl p-3 space-y-3">
            {/* Header row inside panel */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-widest">
                {t('FILTERS')}
              </span>
              <button
                onClick={() => { setTypeFilter('all'); setClubFilter('all'); setDaysFilter('all') }}
                className="text-xs text-zinc-500 active:text-zinc-300"
              >
                {t('Clear')}
              </button>
            </div>

            {/* Days */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setDaysFilter('all')}
                className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                  daysFilter === 'all' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {t('All')}
              </button>
              {[30, 90, 365].map(days => (
                <button
                  key={days}
                  onClick={() => setDaysFilter(days as 30 | 90 | 365)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                    daysFilter === days ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Session type */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${typeFilter === 'all' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
              >
                {t('All')}
              </button>
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${typeFilter === type ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {sessionTypeLabel(type, SESSION_TYPE_LABELS[type], language)}
                </button>
              ))}
            </div>

            {/* Club filter (only if clubs exist) */}
            {(clubs?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setClubFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${clubFilter === 'all' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {t('All')} {t('Clubs')}
                </button>
                {clubs?.map(club => (
                  <button
                    key={club.id}
                    onClick={() => setClubFilter(club.id ?? 'all')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${clubFilter === club.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
                  >
                    {club.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

        <div className="px-4 pb-4 space-y-3">
          {sortedVisibleSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <CalendarDays size={32} className="text-zinc-600" strokeWidth={2} />
            </div>
              <p className="text-zinc-400 font-medium">
                {searchTokens.length > 0 || typeFilter !== 'all' || clubFilter !== 'all' || daysFilter !== 'all'
                  ? t('No matching sessions')
                  : t('No sessions yet')}
              </p>
              <p className="text-zinc-600 text-sm">
                {searchTokens.length > 0 || typeFilter !== 'all' || clubFilter !== 'all' || daysFilter !== 'all'
                  ? t('Try a different search or filter')
                  : t('Tap + to log your first training')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVisibleSessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  icon={sessionTypeIcons[s.sessionType]}
                  locale={locale}
                  t={t}
                  language={language}
                  tapStats={sessionMeta.tapStatsBySessionId.get(s.id ?? -1) ?? { given: 0, received: 0 }}
                  techniqueNames={sessionMeta.techniqueNamesBySessionId.get(s.id ?? -1) ?? []}
                  clubName={s.clubId !== null && s.clubId !== undefined ? clubMap.get(s.clubId) : undefined}
                  onClick={() => {
                    window.sessionStorage.setItem(LIST_SCROLL_KEY, String(window.scrollY))
                    navigate(`/sessions/${s.id}`)
                  }}
                />
              ))}
            </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/sessions/new')}
        className="fixed bottom-20 right-4 w-10 h-10 bg-gold rounded-full flex items-center justify-center active:bg-gold-light transition-colors z-40"
      >
        <Plus size={18} className="text-black" strokeWidth={2.2} />
      </button>
    </div>
  )
}
