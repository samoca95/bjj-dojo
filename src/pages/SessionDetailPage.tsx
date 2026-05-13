import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Pencil, Trash2, ChevronRight,
  Zap, Hand, Building2,
} from 'lucide-react'
import { db } from '../db/database'
import type { Session, SessionTap, Technique } from '../types'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../types'
import EnergyDots from '../components/EnergyDots'
import { CategoryIcon } from '../components/CategoryIcon'
import { getSessionTypeIcons, SESSION_TYPE_ICONS_UPDATED_EVENT } from '../utils/sessionTypeIcons'
import { sessionTypeLabel, useI18n } from '../i18n'
import { useUndo } from '../components/UndoContext'

function formatDate(epoch: number, locale?: string) {
  return new Date(epoch).toLocaleDateString(locale, {
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
  const { t, language, locale } = useI18n()
  const { push: pushUndo } = useUndo()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionTypeIcons, setSessionTypeIcons] = useState(getSessionTypeIcons())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const club = useLiveQuery(
    () => session?.clubId ? db.clubs.get(session.clubId) : undefined,
    [session?.clubId],
  )

  useEffect(() => {
    if (id) db.sessions.get(Number(id)).then(s => setSession(s ?? null))
  }, [id])

  useEffect(() => {
    const sync = () => setSessionTypeIcons(getSessionTypeIcons())
    window.addEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(SESSION_TYPE_ICONS_UPDATED_EVENT, sync)
  }, [])

  const techniqueEntries = useLiveQuery(async () => {
    if (!id) return []
    const sts = await db.sessionTechniques.where('sessionId').equals(Number(id)).toArray()
    const ids = sts.map(st => st.techniqueId)
    const techs = await db.techniques.where('id').anyOf(ids).sortBy('name')
    const notesMap = new Map(sts.map(st => [st.techniqueId, st.notes]))
    return techs.map(tech => ({ technique: tech, notes: notesMap.get(tech.id) }))
  }, [id], [] as { technique: Technique; notes: string | undefined }[])

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

  const handleDelete = async () => {
    if (!session?.id || isDeleting) return
    setIsDeleting(true)
    try {
      const [sessionTechniques, sessionTaps] = await Promise.all([
        db.sessionTechniques.where('sessionId').equals(session.id).toArray(),
        db.sessionTaps.where('sessionId').equals(session.id).toArray(),
      ])
      await db.sessions.delete(session.id)
      await db.sessionTechniques.where('sessionId').equals(session.id).delete()
      await db.sessionTaps.where('sessionId').equals(session.id).delete()
      const savedSession = session as Session & { id: number }
      pushUndo({
        label: language === 'es' ? 'Sesión eliminada.' : 'Session deleted.',
        onUndo: async () => {
          await db.sessions.put(savedSession)
          if (sessionTechniques.length > 0) await db.sessionTechniques.bulkPut(sessionTechniques)
          if (sessionTaps.length > 0) await db.sessionTaps.bulkPut(sessionTaps)
        },
      })
      setShowDeleteModal(false)
      navigate(-1)
    } finally {
      setIsDeleting(false)
    }
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
        <h1 className="flex-1 font-bold text-zinc-100 truncate">{formatDate(session.date, locale)}</h1>
        <button onClick={() => navigate(`/sessions/${session.id}/edit`)} className="p-2 text-gold active:text-gold-light">
          <Pencil size={20} strokeWidth={2} />
        </button>
        <button onClick={() => setShowDeleteModal(true)} className="p-2 text-red-500 active:text-red-400">
          <Trash2 size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Type badge with icon */}
        <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg ${SESSION_TYPE_COLORS[session.sessionType]}`}>
          <CategoryIcon value={sessionTypeIcons[session.sessionType]} size={16} className="text-current" />
          {sessionTypeLabel(session.sessionType, SESSION_TYPE_LABELS[session.sessionType], language)}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label={t('Duration')} value={`${session.durationMinutes} ${t('min')}`} />
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="text-xs text-gold mb-2">{t('Energy')}</div>
            <EnergyDots level={session.energyLevel} />
          </div>
        </div>

        {club && (
          <div className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-start">
            <Building2 size={16} className="text-gold mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">{t('Club')}</div>
              <div className="text-sm text-zinc-100">{club.name}</div>
            </div>
          </div>
        )}

        {/* Techniques Practiced — before taps */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3">{t('TECHNIQUES PRACTICED')}</h2>
          {techniqueEntries?.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('No techniques logged for this session.')}</p>
          ) : (
            <div className="space-y-2">
              {techniqueEntries?.map(({ technique: tech, notes: techNote }) => (
                <button
                  key={tech.id}
                  onClick={() => navigate(`/techniques/${tech.id}`)}
                  className="w-full bg-zinc-900 rounded-xl px-4 py-3 flex items-start gap-3 text-left active:bg-zinc-800"
                >
                  <Zap size={16} className="text-gold shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-zinc-100">{tech.name}</span>
                    {techNote && (
                      <span className="block text-xs text-zinc-400 mt-1 whitespace-pre-wrap">{techNote}</span>
                    )}
                  </span>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0 mt-0.5" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Taps / Submissions — after techniques */}
        {(givenTaps.length > 0 || receivedTaps.length > 0) && (
          <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gold">{t('Taps / Submissions')}</div>
              <span className="text-xs text-zinc-500">
                {givenTaps.length > 0 && `${givenTaps.length} ${language === 'es' ? 'aplicada' : 'given'}`}
                {givenTaps.length > 0 && receivedTaps.length > 0 && ' · '}
                {receivedTaps.length > 0 && `${receivedTaps.length} ${language === 'es' ? 'recibida' : 'received'}`}
              </span>
            </div>
            {givenTaps.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1.5">{t('Given')} ({givenTaps.length})</div>
                <div className="space-y-1.5">
                  {givenTaps.map((tap, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                      <Zap size={13} className="text-green-500 shrink-0" strokeWidth={2} />
                      <span className="text-sm text-zinc-100">
                          {tapTechniqueMap?.get(tap.techniqueId) ?? t('Unknown')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {receivedTaps.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-1.5">{t('Received')} ({receivedTaps.length})</div>
                <div className="space-y-1.5">
                  {receivedTaps.map((tap, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                      <Hand size={13} className="text-red-400 shrink-0" strokeWidth={2} />
                      <span className="text-sm text-zinc-100">
                          {tapTechniqueMap?.get(tap.techniqueId) ?? t('Unknown')}
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
            <div className="text-xs text-gold mb-2">{t('Notes')}</div>
            <p className="text-sm text-zinc-100 whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-4"
          >
            <h2 id="delete-session-title" className="text-base font-bold text-zinc-100">
              {language === 'es' ? 'Eliminar sesión' : 'Delete session'}
            </h2>
            <div className="text-sm text-zinc-300 space-y-2">
              <p>
                {language === 'es'
                  ? 'Se eliminará esta sesión:'
                  : 'This session will be deleted:'}
              </p>
              <p className="font-semibold text-zinc-100">{formatDate(session.date, locale)}</p>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{t('TECHNIQUES PRACTICED')}</p>
                {techniqueEntries.length === 0 ? (
                  <p className="text-zinc-400">
                    {language === 'es' ? 'Sin técnicas registradas.' : 'No techniques logged.'}
                  </p>
                ) : (
                  <ul className="space-y-1 list-disc list-inside text-zinc-200">
                    {techniqueEntries.map(({ technique }) => (
                      <li key={technique.id}>{technique.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-semibold active:bg-zinc-700"
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="px-3 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm font-semibold disabled:opacity-60 active:bg-red-900/70"
              >
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
