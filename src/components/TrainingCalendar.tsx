import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Session, SessionType } from '../types'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { useI18n } from '../i18n'

// Day-circle fill — matches the session log icon background (bg-{hue}-900/40)
const SESSION_TYPE_HEX: Record<SessionType, string> = {
  GI: 'rgba(30, 58, 138, 0.4)',   // blue-900/40
  NOGI: 'rgba(20, 83, 45, 0.4)',  // green-900/40
  OPEN_MAT: 'rgba(88, 28, 135, 0.4)', // purple-900/40
  COMPETITION: 'rgba(127, 29, 29, 0.4)', // red-900/40
  DRILLING: 'rgba(120, 53, 15, 0.4)', // amber-900/40
}

function buildCircleBackground(types: SessionType[]): string | undefined {
  if (types.length === 0) return undefined
  if (types.length === 1) return SESSION_TYPE_HEX[types[0]]
  const step = 100 / types.length
  const stops = types
    .map((type, i) => `${SESSION_TYPE_HEX[type]} ${i * step}% ${(i + 1) * step}%`)
    .join(', ')
  return `conic-gradient(from 0deg, ${stops})`
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

  const monthLabel = firstOfMonth
    .toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    .replace(/\sde\s/i, ' ')

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

      {/* Weekday headers — single letter, minimalist */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {WEEKDAY_KEYS.map(key => (
          <div key={key} className="text-[11px] font-medium uppercase text-zinc-500 text-center">
            {t(key).charAt(0)}
          </div>
        ))}
      </div>

      {/* Day grid — no card background, floats on page bg */}
      <div className="grid grid-cols-7 gap-y-0.5 px-1">
        {Array.from({ length: totalCells }).map((_, index) => {
          const offset = index - leadingBlanks
          const cellDate = new Date(year, month, offset + 1)
          const dayNumber = cellDate.getDate()
          const inMonth = offset >= 0 && offset < daysInMonth
          const epoch = cellDate.getTime()
          const daySessions = inMonth ? sessionsByDay.get(epoch) ?? [] : []
          const uniqueTypes = Array.from(new Set(daySessions.map(s => s.sessionType)))
          const isToday = inMonth && epoch === todayKey
          const hasSessions = uniqueTypes.length > 0
          const background = buildCircleBackground(uniqueTypes)

          const numberColor = hasSessions
            ? 'text-white'
            : inMonth
            ? 'text-zinc-300'
            : 'text-zinc-600'

          return (
            <button
              key={index}
              onClick={() => (inMonth ? onDayClick?.(epoch) : undefined)}
              disabled={!inMonth}
              className={`h-10 flex items-center justify-center ${
                onDayClick && inMonth ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`relative flex items-center justify-center rounded-full h-9 w-9 sm:h-10 sm:w-10 ${
                  hasSessions ? 'shadow-sm' : ''
                } ${isToday ? 'ring-[2px] ring-gold' : ''} ${
                  onDayClick && inMonth ? 'active:scale-95 transition-transform' : ''
                }`}
                style={background ? { background } : undefined}
              >
                <span className={`text-sm font-semibold leading-none ${numberColor}`}>
                  {dayNumber}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
