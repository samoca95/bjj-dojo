import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Session, Technique } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'

function formatDate(epoch: number) {
  return new Date(epoch).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <div className="text-xs text-gold mb-1">{label}</div>
      <div className="font-semibold text-zinc-100">{value}</div>
    </div>
  )
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const club = useLiveQuery(
    () => session?.clubId ? db.clubs.get(session.clubId) : undefined,
    [session?.clubId],
  )

  useEffect(() => {
    if (id) db.sessions.get(Number(id)).then(s => setSession(s ?? null))
  }, [id])

  const techniques = useLiveQuery(async () => {
    if (!id) return []
    const sts = await db.sessionTechniques.where('sessionId').equals(Number(id)).toArray()
    const ids = sts.map(st => st.techniqueId)
    return db.techniques.where('id').anyOf(ids).sortBy('name')
  }, [id], [] as Technique[])

  const submissions = useLiveQuery(async () => {
    if (!id) {
      return {
        given: [] as { technique?: Technique; count: number }[],
        received: [] as { technique?: Technique; count: number }[],
        totalGiven: 0,
        totalReceived: 0,
      }
    }
    const rows = await db.sessionSubmissions.where('sessionId').equals(Number(id)).toArray()
    if (rows.length === 0) {
      return {
        given: [] as { technique?: Technique; count: number }[],
        received: [] as { technique?: Technique; count: number }[],
        totalGiven: 0,
        totalReceived: 0,
      }
    }
    const techniqueIds = rows.map(r => r.techniqueId)
    const techniqueList = await db.techniques.where('id').anyOf(techniqueIds).toArray()
    const techniqueMap = new Map(techniqueList.map(t => [t.id, t]))
    const mapped = rows.map(r => ({ ...r, technique: techniqueMap.get(r.techniqueId) }))
    const given = mapped
      .filter(r => r.outcome === 'GIVEN')
      .map(r => ({ technique: r.technique, count: r.count }))
    const received = mapped
      .filter(r => r.outcome === 'RECEIVED')
      .map(r => ({ technique: r.technique, count: r.count }))
    const totalGiven = given.reduce((sum, r) => sum + r.count, 0)
    const totalReceived = received.reduce((sum, r) => sum + r.count, 0)
    return { given, received, totalGiven, totalReceived }
  }, [id], {
    given: [] as { technique?: Technique; count: number }[],
    received: [] as { technique?: Technique; count: number }[],
    totalGiven: 0,
    totalReceived: 0,
  })

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleDelete = () => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return
    db.sessions.delete(session.id!)
    db.sessionTechniques.where('sessionId').equals(session.id!).delete()
    db.sessionSubmissions.where('sessionId').equals(session.id!).delete()
    navigate('/sessions')
  }

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">{formatDate(session.date)}</h1>
        <button onClick={() => navigate(`/sessions/${session.id}/edit`)} className="p-2 text-gold active:text-gold-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={handleDelete} className="p-2 text-red-500 active:text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Type badge */}
        <span className={`inline-block text-sm font-bold px-3 py-1 rounded-lg ${SESSION_TYPE_COLORS[session.sessionType]}`}>
          {SESSION_TYPE_LABELS[session.sessionType]}
        </span>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Duration" value={`${session.durationMinutes} min`} />
          <InfoCard label="Submissions Landed" value={String(submissions?.totalGiven ?? 0)} />
          <InfoCard label="Submissions Received" value={String(submissions?.totalReceived ?? 0)} />
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-xs text-gold mb-2">Energy</div>
            <EnergyDots level={session.energyLevel} />
          </div>
        </div>

        {club && (
          <div className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-4 h-4 text-gold mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 20h8m-6 0V8a2 2 0 0 1 4 0v12m-6-8h8" />
            </svg>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Club</div>
              <div className="text-sm text-zinc-100">{club.name}</div>
            </div>
          </div>
        )}

        {/* Submissions */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3">SUBMISSIONS</h2>
          {(submissions?.given.length ?? 0) === 0 && (submissions?.received.length ?? 0) === 0 ? (
            <p className="text-sm text-zinc-500">No submissions logged for this session.</p>
          ) : (
            <div className="space-y-3">
              {submissions?.given.length ? (
                <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-zinc-500 mb-1">Submissions Landed</div>
                  {submissions.given.map((entry, index) => (
                    <div key={`given-${index}`} className="flex items-center justify-between text-sm text-zinc-100">
                      <span>{entry.technique?.name ?? 'Unknown technique'}</span>
                      <span className="text-zinc-400">×{entry.count}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {submissions?.received.length ? (
                <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-zinc-500 mb-1">Submissions Received</div>
                  {submissions.received.map((entry, index) => (
                    <div key={`received-${index}`} className="flex items-center justify-between text-sm text-zinc-100">
                      <span>{entry.technique?.name ?? 'Unknown technique'}</span>
                      <span className="text-zinc-400">×{entry.count}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {session.partners && (
          <div className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-4 h-4 text-gold mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Partners</div>
              <div className="text-sm text-zinc-100">{session.partners}</div>
            </div>
          </div>
        )}

        {session.notes && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-xs text-gold mb-2">Notes</div>
            <p className="text-sm text-zinc-100 whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}

        {/* Techniques */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3">TECHNIQUES PRACTICED</h2>
          {techniques?.length === 0 ? (
            <p className="text-sm text-zinc-500">No techniques logged for this session.</p>
          ) : (
            <div className="space-y-2">
              {techniques?.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/techniques/${t.id}`)}
                  className="w-full bg-zinc-900 rounded-xl px-4 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
                >
                  <svg className="w-4 h-4 text-gold shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="flex-1 text-sm text-zinc-100">{t.name}</span>
                  <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
