import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, ConnectionType, Difficulty, Technique, TechniqueConnection } from '../types'
import { CONNECTION_LABELS } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import { useI18n, connectionTypeLabel, difficultyLabel } from '../i18n'
import { isValidYoutubeUrl, normalizeTechniquePayload, VALIDATION_LIMITS } from '../utils/validation'
import { runWithTelemetry } from '../utils/telemetry'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'

const inputCls =
  'w-full bg-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ELITE: 'Elite',
}

const CONNECTION_TYPES = Object.keys(CONNECTION_LABELS) as ConnectionType[]

export default function TechniqueEditPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const isNew = !id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('BEGINNER')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [cues, setCues] = useState<string[]>([])
  const [newCue, setNewCue] = useState('')
  const [connections, setConnections] = useState<TechniqueConnection[]>([])
  const [newConnectionType, setNewConnectionType] = useState<ConnectionType>('FOLLOW_UP')
  const [newConnectionTargetId, setNewConnectionTargetId] = useState<number | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)

  const categories = useLiveQuery(
    () => getCategoryMap().then(m => [...m.values()]),
    [],
    [] as Category[],
  )
  const allTechniques = useLiveQuery(
    () => db.techniques.orderBy('name').toArray(),
    [],
    [] as Technique[],
  )

  useEffect(() => {
    if (isNew || !id) return
    db.techniques.get(Number(id)).then(async t => {
      if (!t) return
      setName(t.name)
      setDescription(t.description)
      setYoutubeUrl(t.youtubeUrl)
      setDifficulty(t.difficulty)
      setCategoryId(t.categoryId)
      setCues(t.cues ?? [])
      setTagsInput((t.tags ?? []).join(', '))
      setIsFavorite(Boolean(t.isFavorite))
      const techniqueConnections = await db.techniqueConnections
        .where('fromTechniqueId')
        .equals(Number(id))
        .toArray()
      setConnections(techniqueConnections)
    })
  }, [id, isNew])

  const handleSave = async () => {
    const payload = normalizeTechniquePayload({
      name,
      description,
      cues,
      youtubeUrl,
      tags: tagsInput.split(','),
    })
    if (!payload.name) return
    if (!isValidYoutubeUrl(payload.youtubeUrl)) {
      window.alert(language === 'es' ? 'URL de YouTube inválida.' : 'Invalid YouTube URL.')
      return
    }
    try {
      if (isNew) {
        const maxId = await db.techniques.orderBy('id').last()
        const newId = (maxId?.id ?? 1000) + 1
        const technique: Technique = {
          id: newId,
          name: payload.name,
          description: payload.description,
          youtubeUrl: payload.youtubeUrl,
          difficulty,
          categoryId,
          cues: payload.cues,
          tags: payload.tags,
          isFavorite,
          isCustom: true,
        }
        await runWithTelemetry('technique.save_failed', () => db.techniques.add(technique))
        if (connections.length > 0) {
          await runWithTelemetry('technique.connection_save_failed', () => db.techniqueConnections.bulkAdd(
            connections.map(connection => ({
              fromTechniqueId: newId,
              toTechniqueId: connection.toTechniqueId,
              connectionType: connection.connectionType,
            })),
          ))
        }
        navigate(`/techniques/${newId}`)
      } else {
        await runWithTelemetry('technique.update_failed', () => db.techniques.update(Number(id), {
          name: payload.name,
          description: payload.description,
          youtubeUrl: payload.youtubeUrl,
          difficulty,
          categoryId,
          cues: payload.cues,
          tags: payload.tags,
          isFavorite,
        }))
        await runWithTelemetry('technique.connection_clear_failed', () => db.techniqueConnections.where('fromTechniqueId').equals(Number(id)).delete())
        if (connections.length > 0) {
          await runWithTelemetry('technique.connection_save_failed', () => db.techniqueConnections.bulkAdd(
            connections.map(connection => ({
              fromTechniqueId: Number(id),
              toTechniqueId: connection.toTechniqueId,
              connectionType: connection.connectionType,
            })),
          ))
        }
        navigate(`/techniques/${id}`)
      }
    } catch (err) {
      if (isQuotaError(err)) {
        notifyQuotaError()
      } else {
        window.alert(language === 'es' ? 'No se pudo guardar la técnica.' : 'Could not save technique.')
      }
    }
  }

  const handleDelete = async () => {
    if (!id || isNew) return
    if (!window.confirm(language === 'es'
      ? '¿Eliminar esta técnica? Esta acción no se puede deshacer.'
      : 'Delete this technique? This cannot be undone.')) return
    try {
      await db.techniques.delete(Number(id))
      await db.techniqueConnections.where('fromTechniqueId').equals(Number(id)).delete()
      await db.techniqueConnections.where('toTechniqueId').equals(Number(id)).delete()
      navigate('/techniques')
    } catch (err) {
      if (isQuotaError(err)) notifyQuotaError()
    }
  }

  const addCue = () => {
    const trimmed = newCue.trim()
    if (!trimmed) return
    setCues(prev => [...prev, trimmed])
    setNewCue('')
  }

  const removeCue = (i: number) => {
    setCues(prev => prev.filter((_, idx) => idx !== i))
  }

  const addConnection = () => {
    if (!newConnectionTargetId) return
    if (!isNew && newConnectionTargetId === Number(id)) return
    const exists = connections.some(c => c.toTechniqueId === newConnectionTargetId)
    if (exists) return
    setConnections(prev => [
      ...prev,
      { fromTechniqueId: isNew ? 0 : Number(id), toTechniqueId: newConnectionTargetId, connectionType: newConnectionType },
    ])
    setNewConnectionTargetId(null)
    setNewConnectionType('FOLLOW_UP')
  }

  const removeConnection = (targetId: number) => {
    setConnections(prev => prev.filter(item => item.toTechniqueId !== targetId))
  }

  const updateConnectionType = (targetId: number, type: ConnectionType) => {
    setConnections(prev => prev.map(item => (item.toTechniqueId === targetId ? { ...item, connectionType: type } : item)))
  }

  const updateConnectionTarget = (previousTargetId: number, targetId: number) => {
    if (!isNew && targetId === Number(id)) return
    // Exclude the current row so editing its target/type doesn't trigger a false duplicate.
    const isDuplicate = connections.some(c => c.toTechniqueId !== previousTargetId && c.toTechniqueId === targetId)
    if (isDuplicate) return
    setConnections(prev =>
      prev.map(item => (item.toTechniqueId === previousTargetId ? { ...item, toTechniqueId: targetId } : item)),
    )
  }

  const connectionOptions = allTechniques.filter(t => !id || t.id !== Number(id))
  const techniqueNameById = new Map(allTechniques.map(t => [t.id, t.name]))

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{isNew ? t('New Technique') : t('Edit Technique')}</h1>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-gold font-bold text-sm active:text-gold-light px-2 disabled:opacity-40"
        >
            {t('Save')}
        </button>
      </div>

      <div className="px-4 space-y-5 pb-8">
        {/* Name */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('NAME')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
              placeholder={t('Technique name')}
            maxLength={VALIDATION_LIMITS.NAME_MAX_LENGTH}
            className={`${inputCls} mt-2`}
          />
        </div>

        {/* Category */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('CATEGORY')}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories?.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categoryId === c.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                <CategoryIcon
                  value={c.icon}
                  fallbackId={c.id}
                  size={13}
                  className={categoryId === c.id ? 'text-black' : 'text-gold'}
                />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('DIFFICULTY')}</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  difficulty === d ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {difficultyLabel(d, DIFFICULTY_LABELS[d], language)}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('DESCRIPTION')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
              placeholder={language === 'es' ? 'Describe esta técnica…' : 'Describe this technique…'}
            maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
            rows={4}
            className={`${inputCls} mt-2 resize-none`}
          />
        </div>

        {/* YouTube URL */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('YOUTUBE URL')}</label>
          <input
            type="url"
            inputMode="url"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className={`${inputCls} mt-2`}
          />
        </div>

        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">{language === 'es' ? 'TAGS' : 'TAGS'}</label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder={language === 'es' ? 'ej: guardia, sweep, sumisión' : 'e.g. guard, sweep, submission'}
            className={`${inputCls} mt-2`}
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={e => setIsFavorite(e.target.checked)}
            />
            {language === 'es' ? 'Marcar como favorita' : 'Mark as favorite'}
          </label>
        </div>

        {/* Coaching cues */}
        <div>
           <label className="text-xs text-gold font-semibold tracking-wide">{t('COACHING CUES')}</label>
          <div className="space-y-2 mt-2">
            {cues.map((cue, i) => (
              <div key={i} className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 py-2.5">
                <span className="text-gold text-xs shrink-0">▸</span>
                <span className="flex-1 text-sm text-zinc-100">{cue}</span>
                <button onClick={() => removeCue(i)} className="text-zinc-600 active:text-zinc-300 shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCue}
                 onChange={e => setNewCue(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addCue()}
                  placeholder={language === 'es' ? 'Añadir clave técnica…' : 'Add a coaching cue…'}
                maxLength={VALIDATION_LIMITS.CUE_MAX_LENGTH}
                 className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
               />
              <button
                onClick={addCue}
                disabled={!newCue.trim()}
                className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-gold disabled:opacity-40 active:bg-zinc-700"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div>
             <label className="text-xs text-gold font-semibold tracking-wide">{t('TECHNIQUE CONNECTIONS')}</label>
            <div className="space-y-2 mt-2">
              {connections.length === 0 && (
                <div className="bg-zinc-900 rounded-xl px-3 py-2.5 text-sm text-zinc-500">
                  {t('No connections yet.')}
                </div>
              )}
              {connections.map(connection => (
                <div key={connection.toTechniqueId} className="bg-zinc-900 rounded-xl px-3 py-2.5 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={connection.toTechniqueId}
                      onChange={e => updateConnectionTarget(connection.toTechniqueId, Number(e.target.value))}
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
                    >
                      {connectionOptions.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <select
                      value={connection.connectionType}
                      onChange={e => updateConnectionType(connection.toTechniqueId, e.target.value as ConnectionType)}
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
                    >
                      {CONNECTION_TYPES.map(type => (
                          <option key={type} value={type}>{connectionTypeLabel(type, CONNECTION_LABELS[type], language)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 truncate">
                      {techniqueNameById.get(connection.toTechniqueId) ?? t('Unknown technique')}
                    </span>
                    <button
                      onClick={() => removeConnection(connection.toTechniqueId)}
                      className="text-zinc-500 active:text-zinc-200 text-xs font-semibold"
                    >
                       {t('Remove')}
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-zinc-900 rounded-xl px-3 py-2.5 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newConnectionTargetId ?? ''}
                    onChange={e => setNewConnectionTargetId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
                  >
                     <option value="">{t('Select connected technique…')}</option>
                    {connectionOptions
                      .filter(t => !connections.some(c => c.toTechniqueId === t.id))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                  </select>
                  <select
                    value={newConnectionType}
                    onChange={e => setNewConnectionType(e.target.value as ConnectionType)}
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold"
                  >
                    {CONNECTION_TYPES.map(type => (
                       <option key={type} value={type}>{connectionTypeLabel(type, CONNECTION_LABELS[type], language)}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addConnection}
                  disabled={!newConnectionTargetId}
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm font-semibold text-gold active:bg-zinc-700 disabled:opacity-40"
                >
                   {t('Add Connection')}
                </button>
              </div>
            </div>
          </div>

        {/* Delete */}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full mt-4 py-3 rounded-xl bg-red-900/30 text-red-400 text-sm font-semibold active:bg-red-900/50"
          >
             {t('Delete Technique')}
           </button>
        )}
      </div>
    </div>
  )
}
