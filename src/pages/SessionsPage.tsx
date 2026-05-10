import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import type { Session } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function SessionCard({ session, onClick }: { session: Session; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 items-start text-left active:bg-zinc-800 transition-colors"
    >
      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5 ${SESSION_TYPE_COLORS[session.sessionType]}`}>
        {SESSION_TYPE_LABELS[session.sessionType]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-zinc-100 text-sm">{formatDate(session.date)}</div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-zinc-400">{session.durationMinutes} min</span>
          {session.location && <span className="text-xs text-zinc-500 truncate">{session.location}</span>}
        </div>
        {session.notes && (
          <p className="text-xs text-zinc-500 mt-1 truncate">{session.notes}</p>
        )}
      </div>
      <EnergyDots level={session.energyLevel} />
    </button>
  )
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().toArray(),
    [],
    [],
  )

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-6 pt-12 pb-4 z-10">
        <h1 className="text-2xl font-bold text-zinc-100">Sessions</h1>
      </div>

      <div className="px-4 pb-4">
        {sessions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <p className="text-zinc-400 font-medium">No sessions yet</p>
            <p className="text-zinc-600 text-sm">Tap + to log your first training</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions?.map(s => (
              <SessionCard key={s.id} session={s} onClick={() => navigate(`/sessions/${s.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/sessions/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 active:bg-gold-light transition-colors z-40"
      >
        <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
