import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Search, Trash2, X } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type {
  Category,
  Flow,
  FlowNode,
  ReferenceLink,
  Technique,
} from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import { getTechniqueName, useI18n } from '../i18n'
import { techniqueMatchesQuery } from '../utils/fuzzySearch'
import {
  sanitizeTags,
  trimAndClamp,
  VALIDATION_LIMITS,
} from '../utils/validation'
import { notifyDbMutation } from '../utils/autoBackup/notify'

const { NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, NOTE_MAX_LENGTH } =
  VALIDATION_LIMITS

function newNodeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function descendantsOf(nodes: FlowNode[], rootId: string): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const out = new Set<string>()
  const stack = [rootId]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (out.has(id)) continue
    out.add(id)
    const node = byId.get(id)
    if (node) for (const c of node.childIds) stack.push(c)
  }
  return out
}

function TechniquePicker({
  techniques,
  categoryIconById,
  onPick,
  onClose,
}: {
  techniques: Technique[]
  categoryIconById: Map<number, string | undefined>
  onPick: (technique: Technique) => void
  onClose: () => void
}) {
  const { language } = useI18n()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    if (!query.trim()) return techniques.slice(0, 50)
    return techniques
      .filter((tech) => techniqueMatchesQuery(tech, query))
      .slice(0, 50)
  }, [techniques, query])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <span className="text-sm font-semibold text-zinc-100">
            {language === 'es' ? 'Elegir técnica' : 'Pick a technique'}
          </span>
          <button
            onClick={onClose}
            className="text-zinc-500 active:text-zinc-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                language === 'es' ? 'Buscar técnicas…' : 'Search techniques…'
              }
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-3 pb-3 space-y-1">
          {filtered.map((tech) => (
            <button
              key={tech.id}
              onClick={() => onPick(tech)}
              className="w-full flex items-center gap-3 bg-zinc-950 rounded-xl px-3 py-2 text-left active:bg-zinc-800"
            >
              <CategoryIcon
                value={categoryIconById.get(tech.categoryId)}
                fallbackId={tech.categoryId}
                size={14}
                className="text-gold shrink-0"
              />
              <span className="flex-1 text-sm text-zinc-100 truncate">
                {getTechniqueName(tech, language)}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-zinc-500">
              {language === 'es' ? 'Sin resultados.' : 'No matches.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function NodeEditor({
  node,
  byId,
  techniqueById,
  categoryIconById,
  onUpdateNote,
  onAddChild,
  onRemove,
  canRemove,
}: {
  node: FlowNode
  byId: Map<string, FlowNode>
  techniqueById: Map<number, Technique>
  categoryIconById: Map<number, string | undefined>
  onUpdateNote: (id: string, note: string) => void
  onAddChild: (parentId: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  const { language } = useI18n()
  const tech = techniqueById.get(node.techniqueId)
  const techName = tech ? getTechniqueName(tech, language) : '—'
  const categoryIcon = tech ? categoryIconById.get(tech.categoryId) : undefined

  return (
    <div>
      <div className="bg-zinc-900 rounded-xl p-3 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
            <CategoryIcon
              value={categoryIcon}
              fallbackId={tech?.categoryId}
              size={14}
              className="text-gold"
            />
          </div>
          <span className="flex-1 text-sm font-semibold text-zinc-100">
            {techName}
          </span>
          {canRemove && (
            <button
              onClick={() => onRemove(node.id)}
              className="text-zinc-500 active:text-red-400"
              aria-label={language === 'es' ? 'Eliminar nodo' : 'Remove node'}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <textarea
          value={node.note ?? ''}
          onChange={(e) =>
            onUpdateNote(node.id, trimAndClamp(e.target.value, NOTE_MAX_LENGTH))
          }
          rows={2}
          placeholder={
            language === 'es' ? 'Nota (opcional)' : 'Note (optional)'
          }
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600 resize-none"
        />
        <button
          onClick={() => onAddChild(node.id)}
          className="text-[11px] font-semibold text-gold/80 active:text-gold flex items-center gap-1"
        >
          <Plus size={12} />
          {language === 'es' ? 'Añadir siguiente' : 'Add follow-up'}
        </button>
      </div>
      {node.childIds.length > 0 && (
        <div className="ml-4 mt-2 pl-4 border-l-2 border-zinc-700 space-y-2">
          {node.childIds.map((childId) => {
            const child = byId.get(childId)
            if (!child) return null
            return (
              <NodeEditor
                key={childId}
                node={child}
                byId={byId}
                techniqueById={techniqueById}
                categoryIconById={categoryIconById}
                onUpdateNote={onUpdateNote}
                onAddChild={onAddChild}
                onRemove={onRemove}
                canRemove
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FlowEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { language, t } = useI18n()
  const isNew = id === undefined
  const numId = isNew ? null : Number(id)

  const existingFlow = useLiveQuery<Flow | undefined>(
    () =>
      numId !== null && Number.isFinite(numId)
        ? db.flows.get(numId)
        : Promise.resolve(undefined),
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
    for (const tech of techniques ?? []) map.set(tech.id, tech)
    return map
  }, [techniques])
  const categoryIconById = useMemo(() => {
    const map = new Map<number, string | undefined>()
    for (const c of categories ?? []) map.set(c.id, c.icon)
    return map
  }, [categories])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [gi, setGi] = useState(true)
  const [noGi, setNoGi] = useState(true)
  const [tagsInput, setTagsInput] = useState('')
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [rootNodeId, setRootNodeId] = useState<string>('')
  const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [pickerFor, setPickerFor] = useState<
    { kind: 'root' } | { kind: 'child'; parentId: string } | null
  >(null)
  const [loaded, setLoaded] = useState(isNew)

  useEffect(() => {
    if (isNew || !existingFlow) return
    if (loaded) return
    setName(existingFlow.name)
    setDescription(existingFlow.description)
    setGi(existingFlow.gi !== false)
    setNoGi(existingFlow.noGi !== false)
    setTagsInput((existingFlow.tags ?? []).join(', '))
    setNodes(
      existingFlow.nodes.map((n) => ({ ...n, childIds: [...n.childIds] })),
    )
    setRootNodeId(existingFlow.rootNodeId)
    setReferenceLinks([...(existingFlow.referenceLinks ?? [])])
    setLoaded(true)
  }, [existingFlow, isNew, loaded])

  const nodeById = useMemo(() => {
    const map = new Map<string, FlowNode>()
    for (const n of nodes) map.set(n.id, n)
    return map
  }, [nodes])

  function handlePicked(tech: Technique) {
    const target = pickerFor
    setPickerFor(null)
    if (!target) return
    const id = newNodeId()
    const newNode: FlowNode = { id, techniqueId: tech.id, childIds: [] }
    if (target.kind === 'root') {
      setNodes([newNode])
      setRootNodeId(id)
      return
    }
    setNodes((prev) =>
      prev
        .map((n) =>
          n.id === target.parentId
            ? { ...n, childIds: [...n.childIds, id] }
            : n,
        )
        .concat(newNode),
    )
  }

  function updateNote(nodeId: string, note: string) {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, note: note.length > 0 ? note : undefined }
          : n,
      ),
    )
  }

  function removeNode(nodeId: string) {
    if (nodeId === rootNodeId) return
    const toRemove = descendantsOf(nodes, nodeId)
    if (toRemove.size === 0) return
    if (
      toRemove.size > 1 &&
      !window.confirm(
        language === 'es'
          ? `Eliminar ${toRemove.size} nodo(s) (incluyendo descendientes)?`
          : `Remove ${toRemove.size} node(s) (including descendants)?`,
      )
    ) {
      return
    }
    setNodes((prev) =>
      prev
        .filter((n) => !toRemove.has(n.id))
        .map((n) => ({
          ...n,
          childIds: n.childIds.filter((c) => !toRemove.has(c)),
        })),
    )
  }

  async function handleSave() {
    const trimmedName = trimAndClamp(name, NAME_MAX_LENGTH)
    if (!trimmedName) {
      window.alert(language === 'es' ? 'Falta el nombre.' : 'Name is required.')
      return
    }
    if (nodes.length === 0 || !rootNodeId || !nodeById.has(rootNodeId)) {
      window.alert(
        language === 'es'
          ? 'Añade al menos una técnica al flujo.'
          : 'Add at least one technique to the flow.',
      )
      return
    }
    const now = Date.now()
    const cleanLinks: ReferenceLink[] = referenceLinks
      .map((link) => ({
        url: link.url.trim(),
        ...(link.label?.trim() ? { label: link.label.trim() } : {}),
      }))
      .filter((link) => link.url)

    const payload: Flow = {
      name: trimmedName,
      description: trimAndClamp(description, DESCRIPTION_MAX_LENGTH),
      gi,
      noGi,
      tags: sanitizeTags(tagsInput.split(',')),
      referenceLinks: cleanLinks.length > 0 ? cleanLinks : undefined,
      nodes,
      rootNodeId,
      isCustom: existingFlow?.isCustom ?? true,
      isFavorite: existingFlow?.isFavorite ?? false,
      createdAt: existingFlow?.createdAt ?? now,
      updatedAt: now,
    }

    try {
      let savedId: number
      if (isNew) {
        savedId = (await db.flows.add(payload)) as number
      } else {
        await db.flows.put({ ...payload, id: numId ?? undefined })
        savedId = numId as number
      }
      notifyDbMutation(undefined, { components: ['flows'] })
      navigate(`/flows/${savedId}`, { replace: true })
    } catch (err) {
      window.alert(
        (language === 'es' ? 'No se pudo guardar: ' : 'Could not save: ') +
          String((err as Error)?.message ?? err),
      )
    }
  }

  async function handleDelete() {
    if (isNew || numId === null) return
    if (
      !window.confirm(
        language === 'es' ? 'Eliminar este flujo?' : 'Delete this flow?',
      )
    )
      return
    await db.flows.delete(numId)
    notifyDbMutation(undefined, { components: ['flows'] })
    navigate('/flows', { replace: true })
  }

  const inputCls =
    'w-full bg-zinc-900 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-3 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">
          {isNew
            ? language === 'es'
              ? 'Nuevo flujo'
              : 'New flow'
            : language === 'es'
              ? 'Editar flujo'
              : 'Edit flow'}
        </h1>
        <button
          onClick={handleSave}
          className="px-4 h-9 rounded-xl bg-gold text-black text-sm font-semibold active:bg-gold-light"
        >
          {t('Save')}
        </button>
      </div>

      <div className="px-4 space-y-5 pb-16">
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            {language === 'es' ? 'NOMBRE' : 'NAME'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === 'es' ? 'Nombre del flujo' : 'Flow name'}
            maxLength={NAME_MAX_LENGTH}
            className={`${inputCls} mt-2`}
          />
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            {language === 'es' ? 'DESCRIPCIÓN' : 'DESCRIPTION'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder={
              language === 'es'
                ? 'Intención del flujo, cosas a tener en cuenta…'
                : 'Intention of the flow, things to keep in mind…'
            }
            className={`${inputCls} mt-2 resize-none`}
          />
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            {language === 'es'
              ? 'FORMATO'
              : language === 'fr'
                ? 'FORMAT'
                : 'FORMAT'}
          </label>
          <div className="flex gap-3 mt-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={gi}
                onChange={(e) => setGi(e.target.checked)}
                className="accent-gold"
              />
              Gi
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={noGi}
                onChange={(e) => setNoGi(e.target.checked)}
                className="accent-gold"
              />
              No-Gi
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            TAGS
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={
              language === 'es'
                ? 'ej: back-attack, gi, fundamentos'
                : 'e.g. back-attack, gi, fundamentals'
            }
            className={`${inputCls} mt-2`}
          />
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            {language === 'es' ? 'FLUJO' : 'FLOW'}
          </label>
          <div className="mt-2 bg-zinc-950 rounded-2xl p-3 border border-zinc-800">
            {nodes.length === 0 ? (
              <button
                onClick={() => setPickerFor({ kind: 'root' })}
                className="w-full py-6 text-sm text-gold/80 active:text-gold flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {language === 'es'
                  ? 'Añadir técnica inicial'
                  : 'Add starting technique'}
              </button>
            ) : (
              (() => {
                const root = nodeById.get(rootNodeId)
                if (!root) return null
                return (
                  <NodeEditor
                    node={root}
                    byId={nodeById}
                    techniqueById={techniqueById}
                    categoryIconById={categoryIconById}
                    onUpdateNote={updateNote}
                    onAddChild={(parentId) =>
                      setPickerFor({ kind: 'child', parentId })
                    }
                    onRemove={removeNode}
                    canRemove={false}
                  />
                )
              })()
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">
            {language === 'es'
              ? 'REFERENCIAS (ARTÍCULOS, VIDEOS…)'
              : 'REFERENCE LINKS (ARTICLES, VIDEOS…)'}
          </label>
          <div className="space-y-2 mt-2">
            {referenceLinks.map((link, i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded-xl px-3 py-2.5 space-y-2"
              >
                <input
                  type="text"
                  value={link.label ?? ''}
                  onChange={(e) =>
                    setReferenceLinks((prev) =>
                      prev.map((it, idx) =>
                        idx === i ? { ...it, label: e.target.value } : it,
                      ),
                    )
                  }
                  placeholder={
                    language === 'es'
                      ? 'Etiqueta (opcional)'
                      : 'Label (optional)'
                  }
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    value={link.url}
                    onChange={(e) =>
                      setReferenceLinks((prev) =>
                        prev.map((it, idx) =>
                          idx === i ? { ...it, url: e.target.value } : it,
                        ),
                      )
                    }
                    placeholder="https://…"
                    className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
                  />
                  <button
                    onClick={() =>
                      setReferenceLinks((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 active:text-zinc-200"
                    aria-label={t('Remove')}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-zinc-900 rounded-xl px-3 py-2.5 space-y-2">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder={
                  language === 'es' ? 'Etiqueta (opcional)' : 'Label (optional)'
                }
                className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  inputMode="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
                />
                <button
                  onClick={() => {
                    const trimmedUrl = newLinkUrl.trim()
                    if (!trimmedUrl) return
                    setReferenceLinks((prev) => [
                      ...prev,
                      {
                        url: trimmedUrl,
                        ...(newLinkLabel.trim()
                          ? { label: newLinkLabel.trim() }
                          : {}),
                      },
                    ])
                    setNewLinkUrl('')
                    setNewLinkLabel('')
                  }}
                  disabled={!newLinkUrl.trim()}
                  className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-gold disabled:opacity-40 active:bg-zinc-700"
                  aria-label={
                    language === 'es' ? 'Añadir referencia' : 'Add reference'
                  }
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full py-3 rounded-xl bg-red-900/30 text-red-300 text-sm font-semibold active:bg-red-900/50"
          >
            {language === 'es' ? 'Eliminar flujo' : 'Delete flow'}
          </button>
        )}
      </div>

      {pickerFor && (
        <TechniquePicker
          techniques={techniques ?? []}
          categoryIconById={categoryIconById}
          onPick={handlePicked}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}
