import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Copy,
  ExternalLink,
  Focus,
  MoreVertical,
  Pencil,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, Flow, FlowNode, Technique } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import { getTechniqueName, useI18n } from '../i18n'
import { notifyDbMutation } from '../utils/autoBackup/notify'
import {
  getFocusFlowIds,
  setFocusFlowIds,
  FOCUS_FLOW_IDS_UPDATED_EVENT,
} from '../utils/focusFlows'

function NoteText({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(true)
        }}
        className="text-left w-full text-xs text-zinc-400 line-clamp-2 active:text-zinc-200"
      >
        {note}
      </button>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-zinc-900 rounded-2xl max-w-md w-full p-5 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-xs font-semibold tracking-widest text-gold">
                NOTE
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-zinc-500 active:text-zinc-200"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{note}</p>
          </div>
        </div>
      )}
    </>
  )
}

function FlowTreeNode({
  node,
  byId,
  techniqueById,
  categoryIconById,
}: {
  node: FlowNode
  byId: Map<string, FlowNode>
  techniqueById: Map<number, Technique>
  categoryIconById: Map<number, string | undefined>
}) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const tech = techniqueById.get(node.techniqueId)
  const techName = tech ? getTechniqueName(tech, language) : '—'
  const categoryIcon = tech ? categoryIconById.get(tech.categoryId) : undefined

  return (
    <div>
      <div className="flex gap-3 bg-zinc-900 rounded-xl p-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <CategoryIcon
              value={categoryIcon}
              fallbackId={tech?.categoryId}
              size={14}
              className="text-gold"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => tech && navigate(`/techniques/${tech.id}`)}
            className="text-sm font-semibold text-zinc-100 active:text-gold text-left"
          >
            {techName}
          </button>
          {node.note && <NoteText note={node.note} />}
        </div>
      </div>
      {node.childIds.length > 0 && (
        <div className="ml-[25px] mt-1 pl-4 border-l-2 border-gold space-y-1">
          {node.childIds.map((childId) => {
            const child = byId.get(childId)
            if (!child) return null
            return (
              <FlowTreeNode
                key={childId}
                node={child}
                byId={byId}
                techniqueById={techniqueById}
                categoryIconById={categoryIconById}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function ActionMenu({ flow, onClose }: { flow: Flow; onClose: () => void }) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(() =>
    getFocusFlowIds().includes(flow.id!),
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = () => setIsFocused(getFocusFlowIds().includes(flow.id!))
    window.addEventListener(FOCUS_FLOW_IDS_UPDATED_EVENT, handler)
    return () =>
      window.removeEventListener(FOCUS_FLOW_IDS_UPDATED_EVENT, handler)
  }, [flow.id])

  const handleEdit = () => {
    onClose()
    navigate(`/flows/${flow.id}/edit`)
  }

  const handleDuplicate = async () => {
    onClose()
    const { id: _id, ...rest } = flow
    const now = Date.now()
    const newId = await db.flows.add({
      ...rest,
      name: `${flow.name} - copy`,
      createdAt: now,
      updatedAt: now,
    })
    notifyDbMutation(undefined, { components: ['flows'] })
    navigate(`/flows/${newId}`)
  }

  const handleToggleFavorite = async () => {
    onClose()
    await db.flows.update(flow.id!, { isFavorite: !flow.isFavorite })
    notifyDbMutation(undefined, { components: ['flows'] })
  }

  const handleToggleFocus = () => {
    onClose()
    const ids = getFocusFlowIds()
    if (ids.includes(flow.id!)) {
      setFocusFlowIds(ids.filter((i) => i !== flow.id!))
    } else {
      setFocusFlowIds([...ids, flow.id!])
    }
  }

  const handleDelete = async () => {
    onClose()
    if (
      !window.confirm(
        language === 'es' ? 'Eliminar este flujo?' : 'Delete this flow?',
      )
    )
      return
    await db.flows.delete(flow.id!)
    notifyDbMutation(undefined, { components: ['flows'] })
    navigate('/flows', { replace: true })
  }

  const isFav = flow.isFavorite ?? false

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl overflow-hidden z-50"
    >
      <button
        onClick={handleEdit}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-100 active:bg-zinc-800"
      >
        <Pencil size={16} className="text-gold shrink-0" />
        {language === 'es' ? 'Editar' : 'Edit'}
      </button>
      <button
        onClick={() => void handleDuplicate()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-100 active:bg-zinc-800"
      >
        <Copy size={16} className="text-zinc-400 shrink-0" />
        {language === 'es' ? 'Duplicar' : 'Duplicate'}
      </button>
      <button
        onClick={() => void handleToggleFavorite()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-100 active:bg-zinc-800"
      >
        <Star
          size={16}
          className={
            isFav ? 'text-amber-400 shrink-0' : 'text-zinc-400 shrink-0'
          }
          fill={isFav ? 'currentColor' : 'none'}
        />
        {isFav
          ? language === 'es'
            ? 'Sin favorito'
            : 'Unfavorite'
          : language === 'es'
            ? 'Favorito'
            : 'Favorite'}
      </button>
      <button
        onClick={handleToggleFocus}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-100 active:bg-zinc-800"
      >
        <Focus
          size={16}
          className={
            isFocused ? 'text-blue-400 shrink-0' : 'text-zinc-400 shrink-0'
          }
        />
        {isFocused
          ? language === 'es'
            ? 'Sin foco'
            : 'Unfocus'
          : language === 'es'
            ? 'Foco'
            : 'Focus'}
      </button>
      <div className="border-t border-zinc-800" />
      <button
        onClick={() => void handleDelete()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 active:bg-zinc-800"
      >
        <Trash2 size={16} className="shrink-0" />
        {language === 'es' ? 'Eliminar' : 'Delete'}
      </button>
    </div>
  )
}

export default function FlowDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language } = useI18n()
  const numId = Number(id)
  const [menuOpen, setMenuOpen] = useState(false)

  const flow = useLiveQuery<Flow | undefined>(
    () =>
      Number.isFinite(numId) ? db.flows.get(numId) : Promise.resolve(undefined),
    [numId],
  )
  const techniques = useLiveQuery(
    () => db.techniques.toArray(),
    [],
    [] as Technique[],
  )
  const categories = useLiveQuery(
    () => getCategoryMap().then((m) => [...m.values()]),
    [],
    [] as Category[],
  )

  const practiceSessionNotes = useLiveQuery(
    async () => {
      const sfs = await db.sessionFlows.where('flowId').equals(numId).toArray()
      if (sfs.length === 0) return []
      const noted = sfs.filter((sf) => sf.notes?.trim())
      if (noted.length === 0) return []
      const sessions = await db.sessions
        .where('id')
        .anyOf(noted.map((sf) => sf.sessionId))
        .toArray()
      const sessionById = new Map(sessions.map((s) => [s.id, s]))
      return noted
        .map((sf) => {
          const session = sessionById.get(sf.sessionId)
          if (!session) return null
          return {
            sessionId: sf.sessionId,
            date: session.date,
            note: sf.notes!.trim(),
          }
        })
        .filter(
          (entry): entry is { sessionId: number; date: number; note: string } =>
            Boolean(entry),
        )
        .sort((a, b) => b.date - a.date)
    },
    [numId],
    [],
  )

  const techniqueById = useMemo(() => {
    const map = new Map<number, Technique>()
    for (const t of techniques ?? []) map.set(t.id, t)
    return map
  }, [techniques])

  const categoryIconById = useMemo(() => {
    const map = new Map<number, string | undefined>()
    for (const c of categories ?? []) map.set(c.id, c.icon)
    return map
  }, [categories])

  const nodeById = useMemo(() => {
    const map = new Map<string, FlowNode>()
    for (const n of flow?.nodes ?? []) map.set(n.id, n)
    return map
  }, [flow])

  if (!flow) {
    return (
      <div className="min-h-full bg-zinc-950 px-4 pt-12 text-sm text-zinc-500">
        <button
          onClick={() => navigate('/flows')}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <p className="mt-4">
          {language === 'es' ? 'Flujo no encontrado.' : 'Flow not found.'}
        </p>
      </div>
    )
  }

  const root = nodeById.get(flow.rootNodeId)

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 min-w-0 font-bold text-zinc-100 truncate">
          {flow.name}
        </h1>
        <button
          onClick={() => navigate(`/flows/${flow.id}/edit`)}
          className="p-2 text-gold active:text-gold-light"
          aria-label="Edit flow"
        >
          <Pencil size={20} strokeWidth={2} />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 text-zinc-400 active:text-zinc-100"
            aria-label="More options"
          >
            <MoreVertical size={20} strokeWidth={2} />
          </button>
          {menuOpen && (
            <ActionMenu flow={flow} onClose={() => setMenuOpen(false)} />
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-12">
        <div className="bg-zinc-900 rounded-2xl p-5">
          {(flow.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(flow.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {flow.description && (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {flow.description}
            </p>
          )}
          {(practiceSessionNotes?.length ?? 0) > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {language === 'es'
                  ? 'Desde sesiones'
                  : language === 'fr'
                    ? 'Depuis les sessions'
                    : 'From sessions'}
              </div>
              <div className="space-y-2">
                {practiceSessionNotes!.map(({ sessionId, date, note }) => (
                  <button
                    key={`${sessionId}-${date}`}
                    onClick={() => navigate(`/sessions/${sessionId}`)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-left active:bg-zinc-800/80 transition-colors"
                  >
                    <div className="text-[11px] text-zinc-500 mb-1">
                      {new Date(date).toLocaleDateString(
                        language === 'en' ? 'en-GB' : language,
                        { day: 'numeric', month: 'short', year: 'numeric' },
                      )}
                    </div>
                    <div className="text-sm text-zinc-300 leading-snug whitespace-pre-wrap">
                      {note}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4">
          {root ? (
            <FlowTreeNode
              node={root}
              byId={nodeById}
              techniqueById={techniqueById}
              categoryIconById={categoryIconById}
            />
          ) : (
            <p className="text-sm text-zinc-500">
              {language === 'es'
                ? 'Este flujo no tiene técnicas.'
                : 'This flow has no techniques.'}
            </p>
          )}
        </div>

        {(flow.referenceLinks?.length ?? 0) > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {language === 'es' ? 'REFERENCIAS' : 'REFERENCES'}
            </div>
            <div className="space-y-2">
              {flow.referenceLinks!.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-zinc-950 rounded-xl px-3 py-2.5 text-sm text-zinc-100 active:bg-zinc-800"
                >
                  <ExternalLink size={14} className="text-gold shrink-0" />
                  <span className="flex-1 truncate">
                    {link.label?.trim() || link.url}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
