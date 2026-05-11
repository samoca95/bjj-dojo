import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, Zap } from 'lucide-react'
import { db } from '../db/database'
import type { Club, Session } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'
import { CategoryIcon } from '../components/CategoryIcon'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT } from '../utils/sessionTypeIcons'
import { useI18n, sessionTypeLabel } from '../i18n'

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
}: {
  session: Session
  clubName?: string
  onClick: () => void
  icon: string
  locale?: string
  t: (text: string) => string
  language: 'en' | 'es'
}) {
  const tapData = useLiveQuery(async () => {
    if (!session.id) return { given: 0, received: 0 }
    const taps = await db.sessionTaps.where('sessionId').equals(session.id).toArray()
    return {
      given: taps.filter(t => t.type === 'given').length,
      received: taps.filter(t => t.type === 'received').length,
    }
  }, [session.id], { given: 0, received: 0 })

  const techniques = useLiveQuery(async () => {
    if (!session.id) return [] as string[]
    const sts = await db.sessionTechniques.where('sessionId').equals(session.id).toArray()
    if (sts.length === 0) return []
    const techs = await db.techniques.where('id').anyOf(sts.map(s => s.techniqueId)).toArray()
    return techs.map(t => t.name)
  }, [session.id], [] as string[])

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
          {(tapData?.given > 0 || tapData?.received > 0) && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              {(tapData?.given ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-gold" />
                  {tapData?.given}
                </span>
              )}
              {(tapData?.received ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <Zap size={10} className="text-red-400" />
                  {tapData?.received}
                </span>
              )}
            </span>
          )}
        </div>
        {techniques && techniques.length > 0 && (
          <p className="text-xs text-zinc-500 mt-1 truncate">
            {techniques.join(' · ')}
          </p>
        )}
        {session.notes && !techniques?.length && (
          <p className="text-xs text-zinc-500 mt-1 truncate">{session.notes}</p>
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
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    [],
    [],
  )
  const clubs = useLiveQuery(() => db.clubs.toArray(), [], [] as Club[])
  const clubMap = new Map(clubs?.map(c => [c.id, c.name]))

  useEffect(() => {
    const sync = () => setSessionTypeIcons(getSessionTypeIcons())
    window.addEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
  }, [])

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-6 pt-12 pb-4 z-10">
        <h1 className="text-2xl font-bold text-zinc-100">{t('Sessions')}</h1>
      </div>

      <div className="px-4 pb-4">
        {sessions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <CalendarDays size={32} className="text-zinc-600" strokeWidth={2} />
            </div>
            <p className="text-zinc-400 font-medium">{t('No sessions yet')}</p>
            <p className="text-zinc-600 text-sm">{t('Tap + to log your first training')}</p>
          </div>
        ) : (
            <div className="space-y-3">
              {sessions?.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  icon={sessionTypeIcons[s.sessionType]}
                  locale={locale}
                  t={t}
                  language={language}
                  clubName={s.clubId !== null && s.clubId !== undefined ? clubMap.get(s.clubId) : undefined}
                  onClick={() => navigate(`/sessions/${s.id}`)}
                />
              ))}
            </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/sessions/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 active:bg-gold-light transition-colors z-40"
      >
        <Plus size={28} className="text-black" strokeWidth={2.5} />
      </button>
    </div>
  )
}
