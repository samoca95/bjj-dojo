import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Pencil, Trash2, ChevronRight,
  Zap, Building2,
} from 'lucide-react'
import { db } from '../db/database'
import type { Session, SessionTap, Technique } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS, SESSION_TYPE_ICONS } from '../types'
import EnergyDots from '../components/EnergyDots'
import { CategoryIcon } from '../components/CategoryIcon'

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

  const tapData = useLiveQuery(async () => {
    if (!id) return { taps: [] as SessionTap[], techMap: new Map<number, string>() }
    const taps = await db.sessionTaps.where('sessionId').equals(Number(id)).toArray()
    if (taps.length === 0) return { taps: [], techMap: new Map<number, string>() }
    const ids = [...new Set(taps.map(t => t.techniqueId))]
    const techs = await db.techniques.where('id').anyOf(ids).toArray()
    return { taps, techMap: new Map(techs.map(t => [t.id, t.name])) }
  }, [id], { taps: [] as SessionTap[], techMap: new Map<number, string>() })

  if (!session) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleDelete = () => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return
    db.sessions.delete(session.id!)
    db.sessionTechniques.where('sessionId').equals(session.id!).delete()
    db.sessionTaps.where('sessionId').equals(session.id!).delete()
    navigate('/sessions')
  }

  const sessionTaps = tapData?.taps ?? []
  const tapTechniqueMap = tapData?.techMap ?? new Map<number, string>()
  const givenTaps = sessionTaps.filter(t => t.type === 'given')
  const receivedTaps = sessionTaps.filter(t => t.type === 'received')

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">{formatDate(session.date)}</h1>
        <button onClick={() => navigate(`/sessions/${session.id}/edit`)} className="p-2 text-gold active:text-gold-light">
          <Pencil size={20} strokeWidth={2} />
        </button>
        <button onClick={handleDelete} className="p-2 text-red-500 active:text-red-400">
          <Trash2 size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Type badge with icon */}
        <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg ${SESSION_TYPE_COLORS[session.sessionType]}`}>
          <CategoryIcon value={SESSION_TYPE_ICONS[session.sessionType]} size={16} className="text-current" />
          {SESSION_TYPE_LABELS[session.sessionType]}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Duration" value={`${session.durationMinutes} min`} />
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-xs text-gold mb-2">Energy</div>
            <EnergyDots level={session.energyLevel} />
          </div>
        </div>

        {club && (
          <div className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-start">
            <Building2 size={16} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Club</div>
              <div className="text-sm text-zinc-100">{club.name}</div>
            </div>
          </div>
        )}

        {/* Techniques Practiced — before taps */}
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
                  <Zap size={16} className="text-gold shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-sm text-zinc-100">{t.name}</span>
                  <ChevronRight size={16} className="text-zinc-600" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Taps / Submissions — after techniques */}
        {(givenTaps.length > 0 || receivedTaps.length > 0) && (
          <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gold">Taps / Submissions</div>
              <span className="text-xs text-zinc-500">
                {givenTaps.length > 0 && `${givenTaps.length} given`}
                {givenTaps.length > 0 && receivedTaps.length > 0 && ' · '}
                {receivedTaps.length > 0 && `${receivedTaps.length} received`}
              </span>
            </div>
            {givenTaps.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1.5">Given ({givenTaps.length})</div>
                <div className="space-y-1.5">
                  {givenTaps.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                      <Zap size={13} className="text-gold shrink-0" strokeWidth={2} />
                      <span className="text-sm text-zinc-100">
                        {tapTechniqueMap?.get(t.techniqueId) ?? 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {receivedTaps.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1.5">Received ({receivedTaps.length})</div>
                <div className="space-y-1.5">
                  {receivedTaps.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                      <Zap size={13} className="text-red-400 shrink-0" strokeWidth={2} />
                      <span className="text-sm text-zinc-100">
                        {tapTechniqueMap?.get(t.techniqueId) ?? 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {session.notes && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-xs text-gold mb-2">Notes</div>
            <p className="text-sm text-zinc-100 whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
