import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, ChevronRight } from 'lucide-react'
import { db } from '../db/database'

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

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <h1 className="text-3xl font-black tracking-widest text-gold">BJJ DOJO</h1>
        <p className="text-zinc-400 text-sm mt-1">Track your journey on the mats</p>
      </div>

      <div className="px-4 space-y-6 pb-6">
        {/* Stats */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">YOUR STATS</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sessions" value={String(sessionCount ?? 0)} />
            <StatCard label="Mat Time" value={totalMinutes > 0 ? timeLabel : '0m'} />
            <StatCard label="Taps Given" value={String(tapCounts?.given ?? 0)} />
            <StatCard label="Taps Received" value={String(tapCounts?.received ?? 0)} />
          </div>
        </section>

        {/* Quick access */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">QUICK ACCESS</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/sessions')}
              className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <CalendarDays size={28} className="text-gold" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">Training Sessions</div>
                <div className="text-sm text-zinc-400">Log and review your mat time</div>
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
                <div className="font-semibold text-zinc-100">Technique Library</div>
                <div className="text-sm text-zinc-400">60+ techniques with YouTube refs</div>
              </div>
              <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
