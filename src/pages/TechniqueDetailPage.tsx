import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Copy,
  Focus,
  GitBranch,
  MoreVertical,
  Pencil,
  Star,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, ConnectionType, Session, Technique } from '../types'
import { CONNECTION_LABELS, CONNECTION_COLORS } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'
import { CategoryIcon } from '../components/CategoryIcon'
import ConnectionGraph, {
  type GraphConnection,
} from '../components/ConnectionGraph'
import {
  useI18n,
  connectionTypeLabel,
  getCategoryName,
  getTechniqueName,
  getTechniqueDescription,
  getTechniqueCues,
} from '../i18n'
import { notifyDbMutation } from '../utils/autoBackup/notify'
import {
  getFocusTechniqueIds,
  setFocusTechniqueIds,
} from '../utils/focusTechniques'
import { useUndo } from '../components/undo'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'
// import { defaultTechniqueImageUrl, normalizeTechniqueImageUrl } from '../utils/validation' // kept for future image re-implementation

const FOCUS_TECHNIQUE_IDS_UPDATED_EVENT = 'bjj-dojo:focus-technique-ids-updated'

const CONNECTION_TYPES = Object.keys(CONNECTION_LABELS) as ConnectionType[]

function ConnectedTechniqueRow({
  name,
  badge,
  badgeCls,
  onClick,
}: {
  name: string
  badge: string
  badgeCls: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-zinc-950 rounded-xl px-3 py-3 text-left active:bg-zinc-800 transition-colors"
    >
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${badgeCls}`}
      >
        {badge}
      </span>
      <span className="flex-1 text-sm text-zinc-100">{name}</span>
      <ChevronRight
        size={16}
        className="text-zinc-600 shrink-0"
        strokeWidth={2}
      />
    </button>
  )
}

function CollapsibleHeading({
  label,
  open,
  onToggle,
}: {
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-left"
    >
      <span className="text-xs font-semibold tracking-widest text-gold">
        {label}
      </span>
      {open ? (
        <ChevronUp size={14} className="text-gold shrink-0" strokeWidth={2} />
      ) : (
        <ChevronDown size={14} className="text-gold shrink-0" strokeWidth={2} />
      )}
    </button>
  )
}

const CONNECTION_TYPE_DESCRIPTIONS: Record<
  'en' | 'es' | 'fr',
  Record<ConnectionType, string>
> = {
  en: {
    FOLLOW_UP: 'Natural next attack or finish from this position.',
    COUNTER: "Response that shuts down or punishes the opponent's action.",
    SETUP: 'Entry or preparation that creates the opening for the technique.',
    TRANSITION: 'Smooth change between related positions or controls.',
  },
  es: {
    FOLLOW_UP: 'Siguiente ataque o finalización natural desde esta posición.',
    COUNTER: 'Respuesta para neutralizar o castigar la acción del oponente.',
    SETUP: 'Entrada o preparación que crea la oportunidad para la técnica.',
    TRANSITION: 'Cambio fluido entre posiciones o controles relacionados.',
  },
  fr: {
    FOLLOW_UP: 'Attaque ou finalisation naturelle qui suit cette position.',
    COUNTER: "Réponse pour neutraliser ou punir l'action de l'adversaire.",
    SETUP: "Entrée ou préparation qui crée l'ouverture pour la technique.",
    TRANSITION: 'Passage fluide entre des positions ou contrôles liés.',
  },
}

function connectionTypeDescription(
  type: ConnectionType,
  language: 'en' | 'es' | 'fr',
): string {
  return CONNECTION_TYPE_DESCRIPTIONS[language][type]
}

function AddConnectionModal({
  technique,
  onClose,
}: {
  technique: Technique
  onClose: () => void
}) {
  const { language, t } = useI18n()
  const allTechniques = useLiveQuery(
    () => db.techniques.orderBy('name').toArray(),
    [],
    [] as Technique[],
  )
  const existingConnections = useLiveQuery(
    () =>
      db.techniqueConnections
        .where('fromTechniqueId')
        .equals(technique.id)
        .toArray(),
    [technique.id],
    [],
  )
  const [targetId, setTargetId] = useState<number | null>(null)
  const [connType, setConnType] = useState<ConnectionType>('FOLLOW_UP')
  const [saving, setSaving] = useState(false)

  const options = (allTechniques ?? []).filter(
    (t) =>
      t.id !== technique.id &&
      !(existingConnections ?? []).some((c) => c.toTechniqueId === t.id),
  )

  const handleSave = async () => {
    if (!targetId) return
    setSaving(true)
    try {
      await db.techniqueConnections.add({
        fromTechniqueId: technique.id,
        toTechniqueId: targetId,
        connectionType: connType,
      })
      notifyDbMutation(undefined, { components: ['techniques'] })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-100">
            {language === 'es' ? 'Añadir conexión' : 'Add connection'}
          </span>
          <button
            onClick={onClose}
            className="text-zinc-500 active:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>
        <select
          value={targetId ?? ''}
          onChange={(e) =>
            setTargetId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="">{t('Select connected technique…')}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {getTechniqueName(opt, language)}
            </option>
          ))}
        </select>
        <select
          value={connType}
          onChange={(e) => setConnType(e.target.value as ConnectionType)}
          className="w-full bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
        >
          {CONNECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {connectionTypeLabel(type, CONNECTION_LABELS[type], language)}
            </option>
          ))}
        </select>
        <button
          onClick={() => void handleSave()}
          disabled={!targetId || saving}
          className="w-full py-2.5 rounded-xl bg-gold/20 text-gold text-sm font-semibold disabled:opacity-40 active:bg-gold/30"
        >
          {t('Add Connection')}
        </button>
      </div>
    </div>
  )
}

function TechniqueActionMenu({
  technique,
  onClose,
}: {
  technique: Technique
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { language } = useI18n()
  const { push: pushUndo } = useUndo()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(() =>
    getFocusTechniqueIds().includes(technique.id),
  )
  const [showAddConnection, setShowAddConnection] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showAddConnection || showDeleteModal) return
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, showAddConnection, showDeleteModal])

  useEffect(() => {
    const handler = () =>
      setIsFocused(getFocusTechniqueIds().includes(technique.id))
    window.addEventListener(FOCUS_TECHNIQUE_IDS_UPDATED_EVENT, handler)
    return () =>
      window.removeEventListener(FOCUS_TECHNIQUE_IDS_UPDATED_EVENT, handler)
  }, [technique.id])

  const handleEdit = () => {
    onClose()
    navigate(`/techniques/${technique.id}/edit`)
  }

  const handleDuplicate = async () => {
    onClose()
    const maxId = await db.techniques.orderBy('id').last()
    const newId = (maxId?.id ?? 1000) + 1
    await db.techniques.add({
      ...technique,
      id: newId,
      name: `${technique.name} - copy`,
      isCustom: true,
      isFavorite: false,
    })
    notifyDbMutation(undefined, { components: ['techniques'] })
    navigate(`/techniques/${newId}`)
  }

  const handleToggleFavorite = async () => {
    onClose()
    await db.techniques.update(technique.id, {
      isFavorite: !technique.isFavorite,
    })
    notifyDbMutation(undefined, { components: ['techniques'] })
  }

  const handleToggleFocus = () => {
    onClose()
    const ids = getFocusTechniqueIds()
    if (ids.includes(technique.id)) {
      setFocusTechniqueIds(ids.filter((i) => i !== technique.id))
    } else {
      setFocusTechniqueIds([...ids, technique.id])
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const [outgoing, incoming] = await Promise.all([
        db.techniqueConnections
          .where('fromTechniqueId')
          .equals(technique.id)
          .toArray(),
        db.techniqueConnections
          .where('toTechniqueId')
          .equals(technique.id)
          .toArray(),
      ])
      await db.techniques.delete(technique.id)
      await db.techniqueConnections
        .where('fromTechniqueId')
        .equals(technique.id)
        .delete()
      await db.techniqueConnections
        .where('toTechniqueId')
        .equals(technique.id)
        .delete()
      const saved = [...outgoing, ...incoming]
      pushUndo({
        label: language === 'es' ? 'Técnica eliminada.' : 'Technique deleted.',
        onUndo: async () => {
          await db.techniques.put(technique)
          if (saved.length > 0) await db.techniqueConnections.bulkPut(saved)
          notifyDbMutation(undefined, { components: ['techniques', 'flows'] })
        },
      })
      notifyDbMutation(undefined, { components: ['techniques', 'flows'] })
      setShowDeleteModal(false)
      onClose()
      navigate(-1)
    } catch (err) {
      if (isQuotaError(err)) notifyQuotaError()
    } finally {
      setIsDeleting(false)
    }
  }

  const isFav = technique.isFavorite ?? false

  return (
    <>
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
          onClick={() => {
            setShowAddConnection(true)
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-100 active:bg-zinc-800"
        >
          <GitBranch size={16} className="text-zinc-400 shrink-0" />
          {language === 'es' ? 'Añadir conexión' : 'Add connection'}
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
              ? 'Favorita'
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
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 active:bg-zinc-800"
        >
          <Trash2 size={16} className="shrink-0" />
          {language === 'es' ? 'Eliminar' : 'Delete'}
        </button>
      </div>

      {showAddConnection && (
        <AddConnectionModal
          technique={technique}
          onClose={() => setShowAddConnection(false)}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 grid place-items-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-4"
          >
            <h2 className="text-base font-bold text-zinc-100">
              {language === 'es' ? 'Eliminar técnica' : 'Delete technique'}
            </h2>
            <p className="text-sm text-zinc-300">
              {language === 'es'
                ? 'Se eliminará esta técnica permanentemente.'
                : 'This technique will be permanently deleted.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-semibold active:bg-zinc-700"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
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
    </>
  )
}

export default function TechniqueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const numId = Number(id)
  const [connectionsOpen, setConnectionsOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [connectionsView, setConnectionsView] = useState<'graph' | 'list'>(
    'list',
  )
  const [practiceSessionsOpen, setPracticeSessionsOpen] = useState(true)

  const technique = useLiveQuery(() => db.techniques.get(numId), [numId])
  // P5: use cached map — no per-categoryId re-query when only the technique changes
  const catMap = useLiveQuery(
    () => getCategoryMap(),
    [],
    new Map<number, Category>(),
  )
  const category = technique ? catMap?.get(technique.categoryId) : undefined
  const sessionCount = useLiveQuery(
    async () => {
      const sts = await db.sessionTechniques
        .where('techniqueId')
        .equals(numId)
        .toArray()
      return new Set(sts.map((st) => st.sessionId)).size
    },
    [numId],
    0,
  )

  const connectionsFrom = useLiveQuery(
    async () => {
      const conns = await db.techniqueConnections
        .where('fromTechniqueId')
        .equals(numId)
        .toArray()
      return Promise.all(
        conns.map(async (c) => ({
          technique: await db.techniques.get(c.toTechniqueId),
          connectionType: c.connectionType,
        })),
      )
    },
    [numId],
    [],
  )

  const connectionsTo = useLiveQuery(
    async () => {
      const conns = await db.techniqueConnections
        .where('toTechniqueId')
        .equals(numId)
        .toArray()
      return Promise.all(
        conns.map(async (c) => ({
          technique: await db.techniques.get(c.fromTechniqueId),
          connectionType: c.connectionType,
        })),
      )
    },
    [numId],
    [],
  )

  const practiceSessions = useLiveQuery(
    async () => {
      const sts = await db.sessionTechniques
        .where('techniqueId')
        .equals(numId)
        .toArray()
      const sessionIds = [...new Set(sts.map((st) => st.sessionId))]
      if (sessionIds.length === 0) return []
      const sessions = await db.sessions.where('id').anyOf(sessionIds).toArray()
      return sessions.sort((a, b) => b.date - a.date) as Session[]
    },
    [numId],
    [],
  )

  const practiceSessionNotes = useLiveQuery(
    async () => {
      const sts = await db.sessionTechniques
        .where('techniqueId')
        .equals(numId)
        .toArray()
      const noted = sts.filter((st) => st.notes?.trim())
      if (noted.length === 0) return []
      const sessions = await db.sessions
        .where('id')
        .anyOf(noted.map((st) => st.sessionId))
        .toArray()
      const sessionById = new Map(
        sessions.map((session) => [session.id, session]),
      )
      return noted
        .map((st) => {
          const session = sessionById.get(st.sessionId)
          if (!session) return null
          return {
            sessionId: st.sessionId,
            date: session.date,
            note: st.notes!.trim(),
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

  const recommendations = useLiveQuery(
    async () => {
      const edges = await db.techniqueConnections
        .where('fromTechniqueId')
        .equals(numId)
        .toArray()
      if (edges.length === 0) return []
      const targets = await db.techniques
        .where('id')
        .anyOf(edges.map((edge) => edge.toTechniqueId))
        .toArray()
      const sessionTechniques = await db.sessionTechniques
        .where('techniqueId')
        .anyOf(targets.map((target) => target.id))
        .toArray()
      const usage = new Map<number, number>()
      for (const item of sessionTechniques) {
        usage.set(item.techniqueId, (usage.get(item.techniqueId) ?? 0) + 1)
      }
      return targets
        .map((target) => ({
          technique: target,
          usage: usage.get(target.id) ?? 0,
        }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 3)
    },
    [numId],
    [],
  )

  if (!technique)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )

  const cues = getTechniqueCues(technique, language)

  const graphConnections: GraphConnection[] = [
    ...(connectionsFrom ?? []).flatMap((c) =>
      c.technique
        ? [
            {
              technique: c.technique,
              connectionType: c.connectionType,
              direction: 'from' as const,
            },
          ]
        : [],
    ),
    ...(connectionsTo ?? []).flatMap((c) =>
      c.technique
        ? [
            {
              technique: c.technique,
              connectionType: c.connectionType,
              direction: 'to' as const,
            },
          ]
        : [],
    ),
  ]
  // Image vars kept for future re-implementation (image display is currently hidden)
  // const fallbackImageSrc = defaultTechniqueImageUrl(technique.name)
  // const originalImageSrc = technique.imageUrl?.trim() ?? ''
  // const normalizedImageSrc = originalImageSrc ? normalizeTechniqueImageUrl(originalImageSrc) : ''
  // const imageCandidates = [normalizedImageSrc, originalImageSrc, fallbackImageSrc]
  //   .filter((value, index, arr) => Boolean(value) && arr.indexOf(value) === index)
  // const imageSrc = imageCandidates[0]

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-zinc-100 truncate">
            {getTechniqueName(technique, language)}
          </h1>
          {(technique.aliases?.length ?? 0) > 0 && (
            <p className="text-xs text-zinc-500 truncate">
              {technique.aliases!.join(' · ')}
            </p>
          )}
          {language !== 'en' &&
            !technique.isCustom &&
            getTechniqueName(technique, language) !== technique.name && (
              <p className="text-xs text-zinc-500 truncate">
                🇬🇧 {technique.name}
              </p>
            )}
        </div>
        <button
          onClick={() => navigate(`/techniques/${numId}/edit`)}
          className="p-2 text-gold active:text-gold-light"
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
          {menuOpen && technique && (
            <TechniqueActionMenu
              technique={technique}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Info card */}
        <div className="bg-zinc-900 rounded-2xl p-5">
          {/* Image display hidden — kept for future re-implementation
          <div className="mb-4 -mx-2 -mt-2 overflow-hidden rounded-xl bg-zinc-950">
            <img
              src={imageSrc}
              alt={technique.name}
              loading="eager"
              className="w-full h-44 sm:h-56 object-cover"
              onError={e => {
                const image = e.currentTarget as HTMLImageElement
                const currentIndex = Number(image.dataset.candidateIndex ?? '0')
                const nextIndex = currentIndex + 1
                if (nextIndex < imageCandidates.length) {
                  image.dataset.candidateIndex = String(nextIndex)
                  image.src = imageCandidates[nextIndex]
                  return
                }
                image.style.display = 'none'
              }}
            />
          </div>
          */}
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gold/20 text-gold flex items-center gap-1.5">
                <CategoryIcon
                  value={category.icon}
                  fallbackId={category.id}
                  size={12}
                  className="text-gold"
                />
                {getCategoryName(category, language)}
              </span>
            )}
            <DifficultyBadge difficulty={technique.difficulty} />
            {technique.isFavorite && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-900/40 text-amber-300 flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                {language === 'es' ? 'Favorita' : 'Favorite'}
              </span>
            )}
            {(sessionCount ?? 0) > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-900/40 text-blue-300">
                {language === 'es' ? 'Practicada' : 'Practiced'} {sessionCount}×
              </span>
            )}
            {technique.gi !== false && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-900/40 text-indigo-300">
                Gi
              </span>
            )}
            {technique.noGi !== false && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-teal-900/40 text-teal-300">
                No-Gi
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {getTechniqueDescription(technique, language)}
          </p>
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
          {(technique.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(technique.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Coaching cues */}
        {cues.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {t('COACHING CUES')}
            </div>
            <ul className="space-y-2">
              {cues.map((cue, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-gold text-xs mt-1 shrink-0">▸</span>
                  <span className="text-sm text-zinc-200 leading-snug">
                    {cue}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* YouTube button */}
        {technique.youtubeUrl && (
          <a
            href={technique.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-2xl py-3.5 font-semibold text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            {t('Watch on YouTube')}
          </a>
        )}

        {/* Additional reference links */}
        {(technique.referenceLinks?.length ?? 0) > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {language === 'es' ? 'REFERENCIAS' : 'REFERENCES'}
            </div>
            <div className="space-y-2">
              {technique.referenceLinks!.map((link, i) => (
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

        {/* Connections */}
        {((connectionsFrom?.length ?? 0) > 0 ||
          (connectionsTo?.length ?? 0) > 0) && (
          <div className="space-y-3">
            <div className="px-1">
              <CollapsibleHeading
                label={t('TECHNIQUE CONNECTIONS')}
                open={connectionsOpen}
                onToggle={() => setConnectionsOpen((prev) => !prev)}
              />
            </div>
            {connectionsOpen && (
              <>
                <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
                  {(['graph', 'list'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setConnectionsView(view)}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                        connectionsView === view
                          ? 'bg-zinc-800 text-gold'
                          : 'text-zinc-500 active:text-zinc-300'
                      }`}
                    >
                      {view === 'graph' ? t('Graph') : t('List')}
                    </button>
                  ))}
                </div>
                {connectionsView === 'graph' && (
                  <ConnectionGraph
                    centerName={getTechniqueName(technique, language)}
                    centerCategoryId={technique.categoryId}
                    connections={graphConnections}
                    onSelect={(tid) => navigate(`/techniques/${tid}`)}
                    connectionTypeName={(ct) =>
                      connectionTypeLabel(ct, CONNECTION_LABELS[ct], language)
                    }
                    techniqueName={(t) => getTechniqueName(t, language)}
                  />
                )}
                {connectionsView === 'list' && (
                  <>
                    {connectionsFrom && connectionsFrom.length > 0 && (
                      <div className="bg-zinc-900 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRight
                            size={16}
                            className="text-gold"
                            strokeWidth={2}
                          />
                          <span className="font-semibold text-zinc-100 text-sm">
                            {t('Leads To / Follow-ups')}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {connectionsFrom.map(
                            ({ technique: t, connectionType }, i) =>
                              t ? (
                                <ConnectedTechniqueRow
                                  key={i}
                                  name={getTechniqueName(t, language)}
                                  badge={connectionTypeLabel(
                                    connectionType,
                                    CONNECTION_LABELS[connectionType],
                                    language,
                                  )}
                                  badgeCls={CONNECTION_COLORS[connectionType]}
                                  onClick={() =>
                                    navigate(`/techniques/${t.id}`)
                                  }
                                />
                              ) : null,
                          )}
                        </div>
                      </div>
                    )}
                    {connectionsTo && connectionsTo.length > 0 && (
                      <div className="bg-zinc-900 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowLeft
                            size={16}
                            className="text-gold"
                            strokeWidth={2}
                          />
                          <span className="font-semibold text-zinc-100 text-sm">
                            {t('Can Be Set Up From')}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {connectionsTo.map(
                            ({ technique: t, connectionType }, i) =>
                              t ? (
                                <ConnectedTechniqueRow
                                  key={i}
                                  name={getTechniqueName(t, language)}
                                  badge={connectionTypeLabel(
                                    connectionType,
                                    CONNECTION_LABELS[connectionType],
                                    language,
                                  )}
                                  badgeCls={CONNECTION_COLORS[connectionType]}
                                  onClick={() =>
                                    navigate(`/techniques/${t.id}`)
                                  }
                                />
                              ) : null,
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="bg-zinc-900 rounded-2xl p-3">
                  <div className="space-y-1.5">
                    {(
                      ['FOLLOW_UP', 'SETUP', 'COUNTER', 'TRANSITION'] as const
                    ).map((type) => (
                      <div key={type} className="text-xs text-zinc-300">
                        <span
                          className={`inline-flex mr-1.5 rounded px-1.5 py-0.5 font-semibold ${CONNECTION_COLORS[type]}`}
                        >
                          {connectionTypeLabel(
                            type,
                            CONNECTION_LABELS[type],
                            language,
                          )}
                        </span>
                        <span className="text-zinc-400">
                          {connectionTypeDescription(type, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Practice sessions */}
        {(practiceSessions?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <div className="px-1">
              <CollapsibleHeading
                label={t('PRACTICE SESSIONS')}
                open={practiceSessionsOpen}
                onToggle={() => setPracticeSessionsOpen((prev) => !prev)}
              />
            </div>
            {practiceSessionsOpen && (
              <div className="bg-zinc-900 rounded-2xl p-4">
                <div className="space-y-2">
                  {practiceSessions!.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => navigate(`/sessions/${session.id}`)}
                      className="w-full flex items-center gap-3 bg-zinc-950 rounded-xl px-3 py-2.5 text-left active:bg-zinc-800 transition-colors"
                    >
                      <span className="flex-1 text-sm text-zinc-100">
                        {new Date(session.date).toLocaleDateString(
                          language === 'en' ? 'en-GB' : language,
                          { day: 'numeric', month: 'short', year: 'numeric' },
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {session.durationMinutes}min
                      </span>
                      <ChevronRight
                        size={15}
                        className="text-zinc-600 shrink-0"
                        strokeWidth={2}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(recommendations?.length ?? 0) > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {language === 'es'
                ? 'SIGUIENTES RECOMENDADAS'
                : 'RECOMMENDED NEXT'}
            </div>
            <div className="space-y-2">
              {recommendations?.map((item) => (
                <button
                  key={item.technique.id}
                  onClick={() => navigate(`/techniques/${item.technique.id}`)}
                  className="w-full bg-zinc-950 rounded-xl px-3 py-2.5 flex items-center gap-2 text-left active:bg-zinc-800"
                >
                  <span className="flex-1 text-sm text-zinc-100">
                    {getTechniqueName(item.technique, language)}
                  </span>
                  <span className="text-xs text-zinc-500">{item.usage}×</span>
                  <ChevronRight size={15} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
