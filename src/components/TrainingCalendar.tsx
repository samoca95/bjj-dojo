import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Session, SessionType } from '../types'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { useI18n } from '../i18n'

// Dimmed palette — same hues as session types but at low opacity for dot indicators
const SESSION_TYPE_DOT: Record<SessionType, string> = {
  GI: 'bg-blue-400/50',
  NOGI: 'bg-green-400/50',
  OPEN_MAT: 'bg-purple-400/50',
  COMPETITION: 'bg-red-400/50',
  DRILLING: 'bg-amber-400/50',
}

const WEEKDAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function startOfDay(epoch: number): number {
  const d = new Date(epoch)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

interface Props {
  sessions: Session[]
  onDayClick?: (epoch: number) => void
}

export default function TrainingCalendar({ sessions, onDayClick }: Props) {
  const { t, locale } = useI18n()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [iconsMap, setIconsMap] = useState<SessionTypeIconsMap>(getSessionTypeIcons())

  useEffect(() => {
    const sync = () => setIconsMap(getSessionTypeIcons())
    window.addEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
  }, [])

  // keep iconsMap referenced so no unused-var warning
  void iconsMap

  const sessionsByDay = useMemo(() => {
    const map = new Map<number, Session[]>()
    for (const session of sessions) {
      const key = startOfDay(session.date)
      const existing = map.get(key)
      if (existing) existing.push(session)
      else map.set(key, [session])
    }
    return map
  }, [sessions])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7 // Monday-first
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7
  const todayKey = startOfDay(Date.now())

  const monthLabel = firstOfMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  const goPrev = () => setCursor(new Date(year, month - 1, 1))
  const goNext = () => setCursor(new Date(year, month + 1, 1))

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-widest text-gold">{t('TRAINING CALENDAR')}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            aria-label={t('Previous month')}
            className="p-1 text-zinc-600 active:text-zinc-300 transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <span className="text-xs text-zinc-500 capitalize min-w-[7rem] text-center">{monthLabel}</span>
          <button
            onClick={goNext}
            aria-label={t('Next month')}
            className="p-1 text-zinc-600 active:text-zinc-300 transition-colors"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {WEEKDAY_KEYS.map(key => (
          <div key={key} className="text-[9px] uppercase tracking-wider text-zinc-700 text-center">
            {t(key)}
          </div>
        ))}
      </div>

      {/* Day grid — no card background, floats on page bg */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {Array.from({ length: totalCells }).map((_, index) => {
          const dayNumber = index - leadingBlanks + 1
          if (dayNumber < 1 || dayNumber > daysInMonth) {
            return <div key={index} className="aspect-square" />
          }
          const epoch = new Date(year, month, dayNumber).getTime()
          const daySessions = sessionsByDay.get(epoch) ?? []
          const uniqueTypes = Array.from(new Set(daySessions.map(s => s.sessionType)))
          const isToday = epoch === todayKey
          const hasSessions = uniqueTypes.length > 0

          return (
            <button
              key={index}
              onClick={() => onDayClick?.(epoch)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isToday
                  ? 'ring-1 ring-gold/60 text-gold'
                  : hasSessions
                  ? 'text-zinc-300'
                  : 'text-zinc-700'
              } ${onDayClick ? 'active:bg-zinc-800/60 cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-[11px] leading-none font-medium">{dayNumber}</span>
              {hasSessions && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {uniqueTypes.slice(0, 3).map(type => (
                    <span
                      key={type}
                      className={`w-1 h-1 rounded-full ${SESSION_TYPE_DOT[type]}`}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
