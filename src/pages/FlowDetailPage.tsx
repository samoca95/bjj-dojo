import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Pencil, X } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, Flow, FlowNode, Technique } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import { getTechniqueName, useI18n } from '../i18n'

function NoteText({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <p className="text-xs text-zinc-400 line-clamp-2">{note}</p>
      <button
        onClick={() => setExpanded(true)}
        className="mt-1 text-[11px] font-semibold text-gold/80 active:text-gold"
      >
        Expand
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
        <div className="ml-4 mt-2 pl-4 border-l-2 border-zinc-700 space-y-2">
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

export default function FlowDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language } = useI18n()
  const numId = Number(id)

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
