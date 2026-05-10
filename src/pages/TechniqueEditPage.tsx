import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { db } from '../db/database'
import type { Category, Difficulty, Technique } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'

const inputCls =
  'w-full bg-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ELITE: 'Elite',
}

export default function TechniqueEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isNew = !id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('BEGINNER')
  const [categoryId, setCategoryId] = useState<number>(1)
  const [cues, setCues] = useState<string[]>([])
  const [newCue, setNewCue] = useState('')

  const categories = useLiveQuery(
    () => db.categories.orderBy('name').toArray(),
    [],
    [] as Category[],
  )

  useEffect(() => {
    if (isNew || !id) return
    db.techniques.get(Number(id)).then(t => {
      if (!t) return
      setName(t.name)
      setDescription(t.description)
      setYoutubeUrl(t.youtubeUrl)
      setDifficulty(t.difficulty)
      setCategoryId(t.categoryId)
      setCues(t.cues ?? [])
    })
  }, [id, isNew])

  const handleSave = async () => {
    if (!name.trim()) return
    if (isNew) {
      const maxId = await db.techniques.orderBy('id').last()
      const newId = (maxId?.id ?? 1000) + 1
      const technique: Technique = {
        id: newId,
        name: name.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        difficulty,
        categoryId,
        cues,
        isCustom: true,
      }
      await db.techniques.add(technique)
      navigate(`/techniques/${newId}`)
    } else {
      await db.techniques.update(Number(id), {
        name: name.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        difficulty,
        categoryId,
        cues,
      })
      navigate(`/techniques/${id}`)
    }
  }

  const handleDelete = async () => {
    if (!id || isNew) return
    if (!window.confirm('Delete this technique? This cannot be undone.')) return
    await db.techniques.delete(Number(id))
    await db.techniqueConnections.where('fromTechniqueId').equals(Number(id)).delete()
    await db.techniqueConnections.where('toTechniqueId').equals(Number(id)).delete()
    navigate('/techniques')
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

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{isNew ? 'New Technique' : 'Edit Technique'}</h1>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="text-gold font-bold text-sm active:text-gold-light px-2 disabled:opacity-40"
        >
          Save
        </button>
      </div>

      <div className="px-4 space-y-5 pb-8">
        {/* Name */}
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Technique name"
            className={`${inputCls} mt-2`}
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">CATEGORY</label>
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
          <label className="text-xs text-gold font-semibold tracking-wide">DIFFICULTY</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  difficulty === d ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">DESCRIPTION</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe this technique…"
            rows={4}
            className={`${inputCls} mt-2 resize-none`}
          />
        </div>

        {/* YouTube URL */}
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">YOUTUBE URL</label>
          <input
            type="url"
            inputMode="url"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
            className={`${inputCls} mt-2`}
          />
        </div>

        {/* Coaching cues */}
        <div>
          <label className="text-xs text-gold font-semibold tracking-wide">COACHING CUES</label>
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
                placeholder="Add a coaching cue…"
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

        {/* Delete */}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full mt-4 py-3 rounded-xl bg-red-900/30 text-red-400 text-sm font-semibold active:bg-red-900/50"
          >
            Delete Technique
          </button>
        )}
      </div>
    </div>
  )
}
