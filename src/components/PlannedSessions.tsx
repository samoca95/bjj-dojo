import { useEffect, useMemo, useState } from 'react'
import { Swords, Shirt, Dumbbell } from 'lucide-react'
import { useI18n } from '../i18n'
import {
  addDays,
  cyclePlannedSession,
  getPlannedSessions,
  PLANNED_SESSIONS_UPDATED_EVENT,
  rolloverPlannedSessions,
  startOfDay,
  startOfWeek,
  type PlannedSessionKind,
  type PlannedSessionsMap,
} from '../utils/plannedSessions'

const WEEKDAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function PlannedIcon({ kind }: { kind: PlannedSessionKind }) {
  if (kind === 'gi')
    return <Swords size={16} className="text-blue-400" strokeWidth={2} />
  if (kind === 'nogi')
    return <Shirt size={16} className="text-green-400" strokeWidth={2} />
  return <Dumbbell size={16} className="text-purple-400" strokeWidth={2} />
}

export default function PlannedSessions() {
  const { t } = useI18n()
  const [map, setMap] = useState<PlannedSessionsMap>(() => {
    rolloverPlannedSessions()
    return getPlannedSessions()
  })

  useEffect(() => {
    const sync = () => setMap(getPlannedSessions())
    window.addEventListener(PLANNED_SESSIONS_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PLANNED_SESSIONS_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const { todayKey, weeks } = useMemo(() => {
    const now = Date.now()
    const today = startOfDay(now)
    const week1 = startOfWeek(now)
    return {
      todayKey: today,
      weeks: [week1, startOfDay(addDays(week1, 7))],
    }
  }, [])

  const renderDay = (epoch: number) => {
    const key = String(epoch)
    const kind = map[key]
    const isToday = epoch === todayKey
    const dayNumber = new Date(epoch).getDate()
    return (
      <button
        key={epoch}
        onClick={() => cyclePlannedSession(epoch)}
        aria-label={`Plan ${new Date(epoch).toDateString()}`}
        className="h-10 flex items-center justify-center cursor-pointer"
      >
        <span
          className={`relative flex flex-col items-center justify-center rounded-full h-9 w-9 sm:h-10 sm:w-10 active:scale-95 transition-transform ${
            isToday ? 'ring-[2px] ring-gold' : ''
          } ${kind ? 'bg-zinc-800' : ''}`}
        >
          {kind ? (
            <PlannedIcon kind={kind} />
          ) : (
            <span className="text-sm font-semibold leading-none text-zinc-300">
              {dayNumber}
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-widest text-gold">
          {t('PLANNED SESSIONS')}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1 px-1">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="text-[11px] font-medium uppercase text-zinc-500 text-center"
          >
            {t(key).charAt(0)}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {weeks.map((weekStart) => (
          <div key={weekStart} className="grid grid-cols-7 gap-y-0.5 px-1">
            {Array.from({ length: 7 }).map((_, i) =>
              renderDay(startOfDay(addDays(weekStart, i))),
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
