import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Check, X, Zap, Hand } from 'lucide-react'
import { db } from '../db/database'
import { GOLD, DARK } from '../constants/themeColors'
import { getCategoryMap } from '../db/categoryCache'
import type {
  Category,
  Club,
  Flow,
  Session,
  SessionType,
  Technique,
  TapType,
} from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import {
  useI18n,
  sessionTypeLabel,
  withLocalizedName,
  getTechniqueName,
} from '../i18n'
import {
  techniqueMatchesQuery,
  techniqueScore,
  getMatchingAlias,
  flowMatchesQuery,
  flowScore,
} from '../utils/fuzzySearch'
import { getFlowIcon, FLOW_ICON_UPDATED_EVENT } from '../utils/flowIcon'
import {
  normalizeDateInput,
  normalizeDuration,
  normalizeSessionNotes,
  normalizeTechniquePayload,
  toSafeDateEpoch,
  VALIDATION_LIMITS,
} from '../utils/validation'
import { runWithTelemetry } from '../utils/telemetry'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'
import { notifyDbMutation } from '../utils/autoBackup/notify'

function toDateInput(epoch: number) {
  const d = new Date(epoch)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const inputCls =
  'w-full bg-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

const DURATION_PRESETS = [60, 75, 90, 120]

const ENERGY_LABELS_EN = ['', 'Exhausted', 'Low', 'Average', 'Good', 'Peak']
const ENERGY_LABELS_ES = ['', 'Agotado', 'Bajo', 'Medio', 'Bueno', 'Máximo']

type LocalTap = {
  uid: string
  techniqueId: number
  techniqueName: string
  type: TapType
}

type LocalFlowTap = {
  uid: string
  flowId: number
  flowName: string
  type: TapType
}

type PickerMode = 'techniques' | 'tap-given' | 'tap-received'


export default function AddEditSessionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useI18n()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [date, setDate] = useState(() => {
    const stateDate = (location.state as { date?: number } | null)?.date
    return toDateInput(stateDate ?? Date.now())
  })
  const [duration, setDuration] = useState('60')
  const [customDuration, setCustomDuration] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('GI')
  const [clubId, setClubId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState(3)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [techNotes, setTechNotes] = useState<Map<number, string>>(new Map())
  const [taps, setTaps] = useState<LocalTap[]>([])
  const [selectedFlowIds, setSelectedFlowIds] = useState<Set<number>>(new Set())
  const [flowTaps, setFlowTaps] = useState<LocalFlowTap[]>([])
  const [flowIcon, setFlowIconState] = useState(getFlowIcon)

  const [showPicker, setShowPicker] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('techniques')
  const [pickerSearch, setPickerSearch] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const [showCreateTechnique, setShowCreateTechnique] = useState(false)
  const [newTechName, setNewTechName] = useState('')
  const [newTechCatId, setNewTechCatId] = useState<number>(1)

  const allTechniques = useLiveQuery(
    () => db.techniques.orderBy('name').toArray(),
    [],
    [] as Technique[],
  )
  const sessionTechniqueNotes = useLiveQuery(
    async () => {
      const sts = await db.sessionTechniques.toArray()
      const noteMap = new Map<number, string[]>()
      for (const st of sts) {
        const note = st.notes?.trim()
        if (!note) continue
        const notes = noteMap.get(st.techniqueId) ?? []
        notes.push(note)
        noteMap.set(st.techniqueId, notes)
      }
      return noteMap
    },
    [],
    new Map<number, string[]>(),
  )
  const clubs = useLiveQuery(
    () => db.clubs.orderBy('sortOrder').toArray(),
    [],
    [] as Club[],
  )
  const categories = useLiveQuery(
    () => getCategoryMap().then((m) => [...m.values()]),
    [],
    [] as Category[],
  )
  const allFlows = useLiveQuery(
    () => db.flows.orderBy('name').toArray(),
    [],
    [] as Flow[],
  )

  useEffect(() => {
    const handler = () => setFlowIconState(getFlowIcon())
    window.addEventListener(FLOW_ICON_UPDATED_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(FLOW_ICON_UPDATED_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    db.sessions.get(Number(id)).then(async (s) => {
      if (!s) return
      setDate(toDateInput(s.date))
      const dur = String(s.durationMinutes)
      if (DURATION_PRESETS.includes(s.durationMinutes)) {
        setDuration(dur)
        setCustomDuration(false)
      } else {
        setDuration(dur)
        setCustomDuration(true)
      }
      setSessionType(s.sessionType)
      setClubId(s.clubId ?? null)
      setNotes(s.notes)
      setEnergy(s.energyLevel)
      const sts = await db.sessionTechniques
        .where('sessionId')
        .equals(Number(id))
        .toArray()
      setSelectedIds(new Set(sts.map((st) => st.techniqueId)))
      const notesMap = new Map<number, string>()
      for (const st of sts) {
        if (st.notes) notesMap.set(st.techniqueId, st.notes)
      }
      setTechNotes(notesMap)

      const storedTaps = await db.sessionTaps
        .where('sessionId')
        .equals(Number(id))
        .toArray()
      const techIds = [...new Set(storedTaps.map((t) => t.techniqueId))]
      const techs = await db.techniques.where('id').anyOf(techIds).toArray()
      const techMap = new Map(techs.map((t) => [t.id, t.name]))
      setTaps(
        storedTaps.map((t, i) => ({
          uid: `existing-${i}`,
          techniqueId: t.techniqueId,
          techniqueName: techMap.get(t.techniqueId) ?? 'Unknown',
          type: t.type,
        })),
      )

      const storedFlows = await db.sessionFlows
        .where('sessionId')
        .equals(Number(id))
        .toArray()
      setSelectedFlowIds(new Set(storedFlows.map((sf) => sf.flowId)))

      const storedFlowTaps = await db.sessionFlowTaps
        .where('sessionId')
        .equals(Number(id))
        .toArray()
      const flowIds = [...new Set(storedFlowTaps.map((t) => t.flowId))]
      const flows = await db.flows.where('id').anyOf(flowIds).toArray()
      const flowMap = new Map(flows.map((f) => [f.id!, f.name]))
      setFlowTaps(
        storedFlowTaps.map((t, i) => ({
          uid: `existing-flow-${i}`,
          flowId: t.flowId,
          flowName: flowMap.get(t.flowId) ?? 'Unknown',
          type: t.type,
        })),
      )
    })
  }, [id, isEdit])

  // Default to first club when creating a new session
  useEffect(() => {
    if (!isEdit && clubs && clubs.length > 0 && clubId === null) {
      setClubId(clubs[0].id ?? null)
    }
  }, [clubs, isEdit, clubId])

  const openClubSettings = () => {
    navigate('/clubs', {
      state: {
        returnTo: location.pathname,
        returnState: location.state,
      },
    })
  }

  const handleSave = async () => {
    if (submitting) return
    setSubmitting(true)
    const safeDate = normalizeDateInput(date)
    const safeDuration = normalizeDuration(duration)
    const safeNotes = normalizeSessionNotes(notes)
    const session: Session = {
      date: toSafeDateEpoch(safeDate),
      durationMinutes: safeDuration,
      sessionType,
      clubId,
      notes: safeNotes,
      energyLevel: energy,
    }
    let sid: number
    try {
      sid = await runWithTelemetry('session.save_failed', async () => {
        if (isEdit && id) {
          session.id = Number(id)
          await db.sessions.put(session)
          await db.sessionTechniques
            .where('sessionId')
            .equals(Number(id))
            .delete()
          await db.sessionTaps.where('sessionId').equals(Number(id)).delete()
          await db.sessionFlows.where('sessionId').equals(Number(id)).delete()
          await db.sessionFlowTaps
            .where('sessionId')
            .equals(Number(id))
            .delete()
          return Number(id)
        }
        return (await db.sessions.add(session)) as number
      })

      await runWithTelemetry('session.links_save_failed', async () => {
        if (selectedIds.size > 0) {
          await db.sessionTechniques.bulkAdd(
            [...selectedIds].map((tid) => {
              const note = techNotes.get(tid)
              return note
                ? {
                    sessionId: sid,
                    techniqueId: tid,
                    notes: note
                      .trim()
                      .slice(0, VALIDATION_LIMITS.NOTE_MAX_LENGTH),
                  }
                : { sessionId: sid, techniqueId: tid }
            }),
          )
        }
        if (taps.length > 0) {
          await db.sessionTaps.bulkAdd(
            taps.map((t) => ({
              sessionId: sid,
              techniqueId: t.techniqueId,
              type: t.type,
            })),
          )
        }
        if (selectedFlowIds.size > 0) {
          await db.sessionFlows.bulkAdd(
            [...selectedFlowIds].map((flowId) => ({ sessionId: sid, flowId })),
          )
        }
        if (flowTaps.length > 0) {
          await db.sessionFlowTaps.bulkAdd(
            flowTaps.map((ft) => ({
              sessionId: sid,
              flowId: ft.flowId,
              type: ft.type,
            })),
          )
        }
      })
      notifyDbMutation(undefined, { components: ['sessions'] })
      navigate(
        `/sessions/${sid}`,
        isEdit ? undefined : { replace: true, state: { justCreated: true } },
      )
    } catch (err) {
      setSubmitting(false)
      if (isQuotaError(err)) {
        notifyQuotaError()
      } else {
        window.alert(
          language === 'es'
            ? 'No se pudo guardar la sesión.'
            : 'Could not save session.',
        )
      }
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  const techniqueNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const t of allTechniques ?? []) m.set(t.id, getTechniqueName(t, language))
    return m
  }, [allTechniques, language])

  const filteredPickerFlows = useMemo((): Flow[] => {
    const nameById = (id: number) => techniqueNameById.get(id) ?? ''
    if (!pickerSearch.trim()) return (allFlows ?? []).slice(0, 20)
    return (allFlows ?? [])
      .filter((f) => flowMatchesQuery(f, nameById, pickerSearch))
      .sort(
        (a, b) =>
          flowScore(b, nameById, pickerSearch) -
          flowScore(a, nameById, pickerSearch),
      )
  }, [allFlows, techniqueNameById, pickerSearch])

  const filteredTechniques = (() => {
    const noteMap = sessionTechniqueNotes ?? new Map<number, string[]>()
    const results = (allTechniques ?? []).filter((t) =>
      techniqueMatchesQuery(
        {
          ...withLocalizedName(t, language),
          cues: [...(t.cues ?? []), ...(noteMap.get(t.id) ?? [])],
        },
        pickerSearch,
      ),
    )
    if (pickerSearch.trim()) {
      return [...results].sort(
        (a, b) =>
          techniqueScore(
            {
              ...withLocalizedName(b, language),
              cues: [...(b.cues ?? []), ...(noteMap.get(b.id) ?? [])],
            },
            pickerSearch,
          ) -
          techniqueScore(
            {
              ...withLocalizedName(a, language),
              cues: [...(a.cues ?? []), ...(noteMap.get(a.id) ?? [])],
            },
            pickerSearch,
          ),
      )
    }
    return results
  })()

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode)
    setPickerSearch('')
    setShowCreateTechnique(false)
    setNewTechName('')
    setShowPicker(true)
  }

  const handlePickerSelect = (technique: Technique) => {
    if (pickerMode === 'techniques') {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(technique.id)) {
          next.delete(technique.id)
        } else {
          next.add(technique.id)
        }
        return next
      })
    } else {
      const tapType: TapType = pickerMode === 'tap-given' ? 'given' : 'received'
      setTaps((prev) => [
        ...prev,
        {
          uid: `${Date.now()}-${Math.random()}`,
          techniqueId: technique.id,
          techniqueName: technique.name,
          type: tapType,
        },
      ])
    }
  }

  const handleCreateTechnique = async () => {
    const payload = normalizeTechniquePayload({
      name: newTechName,
      aliases: [],
      description: '',
      cues: [],
      youtubeUrl: '',
      tags: [],
    })
    const name = payload.name
    if (!name) return
    const maxId = await db.techniques.orderBy('id').last()
    const newId = (maxId?.id ?? 1000) + 1
    const newTech: Technique = {
      id: newId,
      name,
      aliases: [],
      description: '',
      cues: [],
      categoryId: newTechCatId,
      youtubeUrl: payload.youtubeUrl,
      difficulty: 'BEGINNER',
      isCustom: true,
      tags: [],
      isFavorite: false,
    }
    await runWithTelemetry('technique.quick_create_failed', () =>
      db.techniques.add(newTech),
    )
    notifyDbMutation(undefined, { components: ['techniques'] })
    handlePickerSelect(newTech)
    setNewTechName('')
    setShowCreateTechnique(false)
  }

  const handleFlowPickerSelect = (flow: Flow) => {
    if (pickerMode === 'techniques') {
      setSelectedFlowIds((prev) => {
        const next = new Set(prev)
        if (next.has(flow.id!)) next.delete(flow.id!)
        else next.add(flow.id!)
        return next
      })
    } else {
      const tapType: TapType = pickerMode === 'tap-given' ? 'given' : 'received'
      setFlowTaps((prev) => [
        ...prev,
        {
          uid: `${Date.now()}-${Math.random()}`,
          flowId: flow.id!,
          flowName: flow.name,
          type: tapType,
        },
      ])
    }
  }

  const removeTap = (uid: string) => {
    setTaps((prev) => prev.filter((t) => t.uid !== uid))
  }

  const removeFlowTap = (uid: string) => {
    setFlowTaps((prev) => prev.filter((t) => t.uid !== uid))
  }

  const setTechNote = (tid: number, value: string) => {
    setTechNotes((prev) => {
      const next = new Map(prev)
      if (value) next.set(tid, value)
      else next.delete(tid)
      return next
    })
  }

  const selectedTechniques =
    allTechniques?.filter((t) => selectedIds.has(t.id)) ?? []

  const givenTaps = taps.filter((t) => t.type === 'given')
  const receivedTaps = taps.filter((t) => t.type === 'received')
  const energyProgress = ((energy - 1) / 4) * 100
  const ENERGY_LABELS = language === 'es' ? ENERGY_LABELS_ES : ENERGY_LABELS_EN

  return (
    <>
      <div className="min-h-full bg-zinc-950">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="text-zinc-400 font-semibold text-sm active:text-zinc-200"
          >
            {t('Cancel')}
          </button>
          <h1 className="flex-1 font-bold text-zinc-100">
            {isEdit ? t('Edit Session') : t('Log Session')}
          </h1>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="text-gold font-bold text-sm active:text-gold-light px-2 disabled:opacity-40"
          >
            {t('Save')}
          </button>
        </div>

        <div className="px-4 space-y-5 pb-8">
          {/* Date — first field */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('DATE')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputCls} mt-2 [color-scheme:dark]`}
            />
          </div>

          {/* Session type */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('SESSION TYPE')}
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sessionType === t
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                  }`}
                >
                  {sessionTypeLabel(t, SESSION_TYPE_LABELS[t], language)}
                </button>
              ))}
            </div>
          </div>

          {/* Club */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gold font-semibold tracking-wide">
                {t('CLUB')}
              </label>
              <button
                onClick={openClubSettings}
                className="text-xs text-gold font-semibold tracking-wide active:text-gold-light"
              >
                {t('Manage')}
              </button>
            </div>
            {clubs?.length === 0 ? (
              <button
                onClick={openClubSettings}
                className="mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-left text-zinc-400 active:bg-zinc-700 transition-colors"
              >
                {language === 'es'
                  ? 'Añade tu primera academia'
                  : 'Add your first club'}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {clubs?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setClubId(c.id ?? null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      clubId === c.id
                        ? 'bg-gold text-black'
                        : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  onClick={() => setClubId(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    clubId === null
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                  }`}
                >
                  {t('Another')}
                </button>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('DURATION')}
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(String(d))
                    setCustomDuration(false)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !customDuration && duration === String(d)
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                  }`}
                >
                  {d}m
                </button>
              ))}
              <button
                onClick={() => setCustomDuration(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  customDuration
                    ? 'bg-gold text-black'
                    : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {t('Custom')}
              </button>
            </div>
            {customDuration && (
              <input
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder={t('Minutes')}
                min={1}
                max={1440}
                className={`${inputCls} mt-2`}
              />
            )}
          </div>

          {/* Energy — responsive slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gold font-semibold tracking-wide">
                {t('ENERGY LEVEL')}
              </label>
              <span className="text-sm text-zinc-400 font-medium">
                {ENERGY_LABELS[energy]}
              </span>
            </div>
            <div className="mt-3 px-1">
              <input
                type="range"
                min={1}
                max={5}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="energy-slider w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${GOLD.DEFAULT} 0%, ${GOLD.DEFAULT} ${energyProgress}%, ${DARK.border} ${energyProgress}%, ${DARK.border} 100%)`,
                }}
              />
              <div className="flex justify-between mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`text-xs ${n === energy ? 'text-gold' : 'text-zinc-600'}`}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Techniques Practiced — before taps */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('TECHNIQUES PRACTICED')}
            </label>
            <button
              onClick={() => openPicker('techniques')}
              className="mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-left active:bg-zinc-700 transition-colors"
            >
              {selectedIds.size === 0 && selectedFlowIds.size === 0 ? (
                <span className="text-zinc-500">{t('Add techniques…')}</span>
              ) : (
                <span className="text-zinc-100">
                  {selectedIds.size + selectedFlowIds.size}{' '}
                  {language === 'es'
                    ? `técnica${selectedIds.size + selectedFlowIds.size !== 1 ? 's' : ''} seleccionada${selectedIds.size + selectedFlowIds.size !== 1 ? 's' : ''}`
                    : `technique${selectedIds.size + selectedFlowIds.size !== 1 ? 's' : ''} selected`}
                </span>
              )}
            </button>
            {selectedTechniques.length > 0 && (
              <div className="mt-2 space-y-2">
                {selectedTechniques.map((tech) => (
                  <div
                    key={tech.id}
                    className="bg-zinc-900 rounded-xl px-4 py-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Zap
                        size={14}
                        className="text-gold shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-sm text-zinc-100">{tech.name}</span>
                    </div>
                    <textarea
                      value={techNotes.get(tech.id) ?? ''}
                      onChange={(e) => setTechNote(tech.id, e.target.value)}
                      placeholder={t('What clicked? What to fix?')}
                      maxLength={VALIDATION_LIMITS.NOTE_MAX_LENGTH}
                      rows={2}
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs outline-none focus:ring-1 focus:ring-gold placeholder-zinc-600 resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
            {selectedFlowIds.size > 0 && (
              <div className="mt-2 space-y-1.5">
                {(allFlows ?? [])
                  .filter((f) => selectedFlowIds.has(f.id!))
                  .map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 bg-zinc-900 rounded-xl px-4 py-3"
                    >
                      <CategoryIcon
                        value={flowIcon}
                        size={14}
                        className="text-gold shrink-0"
                      />
                      <span className="flex-1 text-sm text-zinc-100">
                        {f.name}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedFlowIds((prev) => {
                            const next = new Set(prev)
                            next.delete(f.id!)
                            return next
                          })
                        }
                        className="text-zinc-600 active:text-zinc-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Taps / Submissions — after techniques */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('TAPS / SUBMISSIONS')}
            </label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => openPicker('tap-given')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 active:bg-zinc-700"
              >
                <Plus size={14} />
                {t('Given')}
              </button>
              <button
                onClick={() => openPicker('tap-received')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 active:bg-zinc-700"
              >
                <Plus size={14} />
                {t('Received')}
              </button>
            </div>

            {givenTaps.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-1.5">
                  {t('Given')} ({givenTaps.length})
                </div>
                <div className="space-y-1.5">
                  {givenTaps.map((t) => (
                    <div
                      key={t.uid}
                      className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                    >
                      <Zap size={13} className="text-green-500 shrink-0" />
                      <span className="flex-1 text-sm text-zinc-100">
                        {t.techniqueName}
                      </span>
                      <button
                        onClick={() => removeTap(t.uid)}
                        className="text-zinc-600 active:text-zinc-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {receivedTaps.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-1.5">
                  {t('Received')} ({receivedTaps.length})
                </div>
                <div className="space-y-1.5">
                  {receivedTaps.map((t) => (
                    <div
                      key={t.uid}
                      className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                    >
                      <Hand size={13} className="text-red-400 shrink-0" />
                      <span className="flex-1 text-sm text-zinc-100">
                        {t.techniqueName}
                      </span>
                      <button
                        onClick={() => removeTap(t.uid)}
                        className="text-zinc-600 active:text-zinc-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {flowTaps.filter((ft) => ft.type === 'given').length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-1.5">
                  {t('Given')} — {t('Flow')} (
                  {flowTaps.filter((ft) => ft.type === 'given').length})
                </div>
                <div className="space-y-1.5">
                  {flowTaps
                    .filter((ft) => ft.type === 'given')
                    .map((ft) => (
                      <div
                        key={ft.uid}
                        className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                      >
                        <CategoryIcon
                          value={flowIcon}
                          size={13}
                          className="text-green-500 shrink-0"
                        />
                        <span className="flex-1 text-sm text-zinc-100">
                          {ft.flowName}
                        </span>
                        <button
                          onClick={() => removeFlowTap(ft.uid)}
                          className="text-zinc-600 active:text-zinc-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {flowTaps.filter((ft) => ft.type === 'received').length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 mb-1.5">
                  {t('Received')} — {t('Flow')} (
                  {flowTaps.filter((ft) => ft.type === 'received').length})
                </div>
                <div className="space-y-1.5">
                  {flowTaps
                    .filter((ft) => ft.type === 'received')
                    .map((ft) => (
                      <div
                        key={ft.uid}
                        className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                      >
                        <CategoryIcon
                          value={flowIcon}
                          size={13}
                          className="text-red-400 shrink-0"
                        />
                        <span className="flex-1 text-sm text-zinc-100">
                          {ft.flowName}
                        </span>
                        <button
                          onClick={() => removeFlowTap(ft.uid)}
                          className="text-zinc-600 active:text-zinc-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">
              {t('NOTES')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('What did you work on? Any insights?')}
              maxLength={VALIDATION_LIMITS.NOTE_MAX_LENGTH}
              rows={4}
              className={`${inputCls} mt-2 resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Technique Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-zinc-900 w-full rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-800">
              <h2 className="flex-1 font-bold text-zinc-100">
                {pickerMode === 'techniques'
                  ? t('Select Techniques')
                  : pickerMode === 'tap-given'
                    ? t('Select Technique — Tap Given')
                    : t('Select Technique — Tap Received')}
              </h2>
              <button
                onClick={() => {
                  setShowPicker(false)
                  setShowCreateTechnique(false)
                }}
                className="text-gold font-semibold active:text-gold-light"
              >
                {pickerMode === 'techniques'
                  ? `${t('Done')} (${selectedIds.size})`
                  : pickerMode === 'tap-given'
                    ? `${t('Done')} (${givenTaps.length})`
                    : `${t('Done')} (${receivedTaps.length})`}
              </button>
            </div>

            <div className="px-4 py-3 border-b border-zinc-800">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder={language === 'es' ? 'Buscar…' : 'Search…'}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Create new technique */}
              {!showCreateTechnique ? (
                <button
                  onClick={() => setShowCreateTechnique(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 active:bg-zinc-800 text-left text-gold"
                >
                  <Plus size={16} className="shrink-0" />
                  <span className="text-sm font-medium">
                    {t('Add new technique…')}
                  </span>
                </button>
              ) : (
                <div className="px-4 py-3 border-b border-zinc-800 space-y-3 bg-zinc-950/40">
                  <div className="text-xs text-gold font-semibold">
                    {t('NEW TECHNIQUE')}
                  </div>
                  <input
                    type="text"
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder={t('Technique name')}
                    maxLength={VALIDATION_LIMITS.NAME_MAX_LENGTH}
                    autoFocus
                    className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    {categories?.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setNewTechCatId(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          newTechCatId === c.id
                            ? 'bg-gold text-black'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <CategoryIcon
                          value={c.icon}
                          fallbackId={c.id}
                          size={12}
                          className={
                            newTechCatId === c.id
                              ? 'text-black inline mr-1'
                              : 'text-gold inline mr-1'
                          }
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateTechnique}
                      disabled={!newTechName.trim()}
                      className="flex-1 bg-gold text-black font-semibold py-2 rounded-xl text-sm disabled:opacity-40"
                    >
                      {t('Add')}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateTechnique(false)
                        setNewTechName('')
                      }}
                      className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-2 rounded-xl text-sm"
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              )}

              {filteredTechniques?.map((t) => {
                const isSelected =
                  pickerMode === 'techniques' && selectedIds.has(t.id)
                const tapType =
                  pickerMode === 'tap-given'
                    ? 'given'
                    : pickerMode === 'tap-received'
                      ? 'received'
                      : null
                const tapCount = tapType
                  ? taps.filter(
                      (tap) => tap.techniqueId === t.id && tap.type === tapType,
                    ).length
                  : 0
                const matchingAlias =
                  getMatchingAlias(
                    t,
                    pickerSearch,
                    getTechniqueName(t, language),
                  ) ?? undefined
                return (
                  <button
                    key={t.id}
                    onClick={() => handlePickerSelect(t)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/50 active:bg-zinc-800 text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-gold border-gold'
                          : tapCount > 0
                            ? 'bg-zinc-700 border-zinc-500'
                            : 'border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <Check
                          size={11}
                          className="text-black"
                          strokeWidth={3}
                        />
                      )}
                      {tapCount > 0 && (
                        <span className="text-[10px] text-zinc-100 font-bold leading-none">
                          {tapCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-zinc-100">{t.name}</span>
                      {matchingAlias && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          → {matchingAlias}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Flow items in picker */}
              {filteredPickerFlows.length > 0 && (
                <>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 bg-zinc-950/60">
                    {t('FLOWS')}
                  </div>
                  {filteredPickerFlows.map((f) => {
                    const isSelected =
                      pickerMode === 'techniques' && selectedFlowIds.has(f.id!)
                    const tapType =
                      pickerMode === 'tap-given'
                        ? 'given'
                        : pickerMode === 'tap-received'
                          ? 'received'
                          : null
                    const flowTapCount = tapType
                      ? flowTaps.filter(
                          (ft) => ft.flowId === f.id! && ft.type === tapType,
                        ).length
                      : 0
                    return (
                      <button
                        key={`flow-${f.id}`}
                        onClick={() => handleFlowPickerSelect(f)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/50 active:bg-zinc-800 text-left"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-gold border-gold'
                              : flowTapCount > 0
                                ? 'bg-zinc-700 border-zinc-500'
                                : 'border-zinc-600'
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={11}
                              className="text-black"
                              strokeWidth={3}
                            />
                          )}
                          {flowTapCount > 0 && (
                            <span className="text-[10px] text-zinc-100 font-bold leading-none">
                              {flowTapCount}
                            </span>
                          )}
                        </div>
                        <CategoryIcon
                          value={flowIcon}
                          size={14}
                          className="text-gold shrink-0"
                        />
                        <span className="text-sm text-zinc-100 flex-1 min-w-0 truncate">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {t('Flow')}
                        </span>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
