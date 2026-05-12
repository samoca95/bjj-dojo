import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Session, SessionType } from '../types'
import { CategoryIcon } from './CategoryIcon'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { useI18n } from '../i18n'

const SESSION_TYPE_HEX: Record<SessionType, string> = {
  GI: '#3b82f6',          // blue-500
  NOGI: '#22c55e',        // green-500
  OPEN_MAT: '#a855f7',    // purple-500
  COMPETITION: '#ef4444', // red-500
  DRILLING: '#f59e0b',    // amber-500
}

const WEEKDAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function startOfDay(epoch: number): number {
  const d = new Date(epoch)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function stripeBackground(colors: string[]): string {
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  const stops = colors
    .map((color, i) => `${color} ${i * step}% ${(i + 1) * step}%`)
    .join(', ')
  return `linear-gradient(135deg, ${stops})`
}

export default function TrainingCalendar({ sessions }: { sessions: Session[] }) {
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
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label={t('Previous month')}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 active:bg-zinc-700"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <span className="text-xs text-zinc-300 capitalize min-w-[7rem] text-center">{monthLabel}</span>
          <button
            onClick={goNext}
            aria-label={t('Next month')}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 active:bg-zinc-700"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div className="bg-zinc-900 rounded-2xl p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_KEYS.map(key => (
            <div key={key} className="text-[10px] uppercase tracking-wider text-zinc-500 text-center">
              {t(key)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: totalCells }).map((_, index) => {
            const dayNumber = index - leadingBlanks + 1
            if (dayNumber < 1 || dayNumber > daysInMonth) {
              return <div key={index} className="aspect-square" />
            }
            const key = new Date(year, month, dayNumber).getTime()
            const daySessions = sessionsByDay.get(key) ?? []
            const uniqueTypes = Array.from(new Set(daySessions.map(s => s.sessionType)))
            const isToday = key === todayKey
            const hasSessions = uniqueTypes.length > 0
            const background = hasSessions
              ? stripeBackground(uniqueTypes.map(type => SESSION_TYPE_HEX[type]))
              : undefined
            const singleType = uniqueTypes.length === 1 ? uniqueTypes[0] : null

            return (
              <div
                key={index}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative text-[11px] ${
                  hasSessions ? 'text-white font-semibold' : 'bg-zinc-800/60 text-zinc-500'
                } ${isToday ? 'ring-1 ring-gold' : ''}`}
                style={hasSessions ? { background } : undefined}
              >
                <span className="leading-none">{dayNumber}</span>
                {singleType && (
                  <CategoryIcon
                    value={iconsMap[singleType]}
                    size={12}
                    className="text-white mt-0.5"
                  />
                )}
                {uniqueTypes.length > 1 && (
                  <span className="text-[9px] leading-none mt-0.5 opacity-90">
                    {daySessions.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
