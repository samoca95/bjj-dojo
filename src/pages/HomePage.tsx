import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
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
  const submissions = useLiveQuery(() => db.sessionSubmissions.toArray(), [], [])
  const totalMinutes = sessions?.reduce((s, r) => s + r.durationMinutes, 0) ?? 0
  const tapsGiven = submissions
    ?.filter(s => s.outcome === 'GIVEN')
    .reduce((sum, s) => sum + s.count, 0) ?? 0
  const tapsReceived = submissions
    ?.filter(s => s.outcome === 'RECEIVED')
    .reduce((sum, s) => sum + s.count, 0) ?? 0

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
            <StatCard label="Submissions Landed" value={String(tapsGiven)} />
            <StatCard label="Submissions Received" value={String(tapsReceived)} />
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
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">Training Sessions</div>
                <div className="text-sm text-zinc-400">Log and review your mat time</div>
              </div>
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/techniques')}
              className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">Technique Library</div>
                <div className="text-sm text-zinc-400">60+ techniques with YouTube refs</div>
              </div>
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
