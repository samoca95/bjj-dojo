import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Search, X, ChevronRight, Plus, Star, Tag, ListChecks } from 'lucide-react'
import { db } from '../db/database'
import type { Category, Technique } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'
import { CategoryIcon } from '../components/CategoryIcon'
import { useI18n } from '../i18n'
import { techniqueMatchesQuery } from '../utils/fuzzySearch'

const FAVORITES_KEY = 'bjj-dojo.technique-favorites'
const TAGS_KEY = 'bjj-dojo.technique-tags'
const DRILL_PLANS_KEY = 'bjj-dojo.drill-plans'

interface DrillPlan {
  id: string
  name: string
  techniqueIds: number[]
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function TechniqueRow({
  technique,
  categoryName,
  categoryIcon,
  onClick,
  favorite,
  onToggleFavorite,
  tags,
  onAddTag,
  planMode,
  selected,
}: {
  technique: Technique
  categoryName: string
  categoryIcon?: string
  onClick: () => void
  favorite: boolean
  onToggleFavorite: () => void
  tags: string[]
  onAddTag: () => void
  planMode: boolean
  selected: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 text-left active:bg-zinc-800 transition-colors ${selected ? 'ring-2 ring-gold' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-100 text-sm">{technique.name}</span>
          <DifficultyBadge difficulty={technique.difficulty} />
          {favorite && <Star size={14} className="text-gold" fill="currentColor" />}
        </div>
        <div className="text-xs text-gold mt-0.5 flex items-center gap-1.5">
          <CategoryIcon value={categoryIcon} fallbackId={technique.categoryId} size={14} className="text-gold" />
          <span>{categoryName}</span>
        </div>
        {tags.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">#{tag}</span>
            ))}
          </div>
        )}
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{technique.description}</p>
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <button
          onClick={e => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          className="text-zinc-500 hover:text-gold"
          aria-label="Toggle favorite"
        >
          <Star size={16} className={favorite ? 'text-gold' : 'text-zinc-500'} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            onAddTag()
          }}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label="Add tag"
        >
          <Tag size={16} />
        </button>
        {!planMode && <ChevronRight size={20} className="text-zinc-600 shrink-0 mt-1" strokeWidth={2} />}
      </div>
    </button>
  )
}

export default function TechniquesPage() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [planMode, setPlanMode] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planSelection, setPlanSelection] = useState<Set<number>>(new Set())
  const [tagEditorTechniqueId, setTagEditorTechniqueId] = useState<number | null>(null)
  const [tagInput, setTagInput] = useState('')

  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => safeRead<number[]>(FAVORITES_KEY, []))
  const [tagsByTechnique, setTagsByTechnique] = useState<Record<string, string[]>>(() => safeRead<Record<string, string[]>>(TAGS_KEY, {}))
  const [drillPlans, setDrillPlans] = useState<DrillPlan[]>(() => safeRead<DrillPlan[]>(DRILL_PLANS_KEY, []))

  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [], [] as Category[])

  const techniques = useLiveQuery(
    async () => {
      const q = categoryId
        ? db.techniques.where('categoryId').equals(categoryId)
        : db.techniques.toCollection()
      const results = await q.sortBy('name')
      return results.filter(technique => techniqueMatchesQuery(technique, search))
    },
    [search, categoryId],
    [] as Technique[],
  )

  const filtered = useMemo(() => {
    const favorites = new Set(favoriteIds)
    if (!favoritesOnly) return techniques
    return techniques.filter(technique => favorites.has(technique.id))
  }, [techniques, favoritesOnly, favoriteIds])

  const catMap = new Map(categories?.map(c => [c.id, c.name]))
  const catIconMap = new Map(categories?.map(c => [c.id, c.icon]))

  const toggleFavorite = (techniqueId: number) => {
    const current = new Set(favoriteIds)
    if (current.has(techniqueId)) current.delete(techniqueId)
    else current.add(techniqueId)
    const next = [...current]
    setFavoriteIds(next)
    safeWrite(FAVORITES_KEY, next)
  }

  const addTag = (techniqueId: number, value: string) => {
    const tag = value.trim().toLowerCase()
    if (!tag) return
    const key = String(techniqueId)
    const existing = tagsByTechnique[key] ?? []
    if (existing.includes(tag)) return
    const next = {
      ...tagsByTechnique,
      [key]: [...existing, tag].slice(0, 8),
    }
    setTagsByTechnique(next)
    safeWrite(TAGS_KEY, next)
    setTagInput('')
    setTagEditorTechniqueId(null)
  }

  const togglePlanSelection = (techniqueId: number) => {
    setPlanSelection(prev => {
      const next = new Set(prev)
      if (next.has(techniqueId)) next.delete(techniqueId)
      else next.add(techniqueId)
      return next
    })
  }

  const saveDrillPlan = () => {
    const name = planName.trim()
    if (!name || planSelection.size === 0) return
    const nextPlan: DrillPlan = {
      id: `${Date.now()}`,
      name,
      techniqueIds: [...planSelection],
    }
    const next = [nextPlan, ...drillPlans].slice(0, 15)
    setDrillPlans(next)
    safeWrite(DRILL_PLANS_KEY, next)
    setPlanName('')
    setPlanSelection(new Set())
    setPlanMode(false)
  }

  const deleteDrillPlan = (id: string) => {
    const next = drillPlans.filter(plan => plan.id !== id)
    setDrillPlans(next)
    safeWrite(DRILL_PLANS_KEY, next)
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="px-6 pt-12 pb-3">
          <h1 className="text-2xl font-bold text-zinc-100">{t('Techniques')}</h1>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCategoryId(null) }}
              placeholder={t('Search techniques…')}
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-zinc-300">
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFavoritesOnly(prev => !prev)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${favoritesOnly ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
          >
            {language === 'es' ? 'Favoritas' : 'Favorites'}
          </button>
          <button
            onClick={() => {
              setPlanMode(prev => !prev)
              setPlanSelection(new Set())
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${planMode ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'}`}
          >
            <ListChecks size={12} /> {language === 'es' ? 'Modo plan de drills' : 'Drill plan mode'}
          </button>
        </div>

        {tagEditorTechniqueId !== null && (
          <div className="px-4 pb-3 space-y-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder={language === 'es' ? 'Nueva etiqueta (sin #)' : 'New tag (without #)'}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100"
            />
            <div className="flex gap-2">
              <button
                onClick={() => addTag(tagEditorTechniqueId, tagInput)}
                disabled={!tagInput.trim()}
                className="flex-1 rounded-xl bg-gold text-black text-sm font-semibold py-2.5 disabled:opacity-50"
              >
                {language === 'es' ? 'Guardar etiqueta' : 'Save tag'}
              </button>
              <button
                onClick={() => { setTagEditorTechniqueId(null); setTagInput('') }}
                className="flex-1 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold py-2.5"
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setCategoryId(null); setSearch('') }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              categoryId === null ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
            }`}
          >
            {t('All')}
          </button>
          {categories?.map((c: Category) => (
            <button
              key={c.id}
              onClick={() => { setCategoryId(c.id); setSearch('') }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                categoryId === c.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
              }`}
            >
              <CategoryIcon value={c.icon} fallbackId={c.id} size={14} className={categoryId === c.id ? 'text-black' : 'text-zinc-300'} />
              {c.name}
            </button>
          ))}
        </div>

        {planMode && (
          <div className="px-4 pb-3 space-y-2">
            <input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder={language === 'es' ? 'Nombre del plan' : 'Plan name'}
              className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100"
            />
            <button
              onClick={saveDrillPlan}
              disabled={!planName.trim() || planSelection.size === 0}
              className="w-full rounded-xl bg-gold text-black text-sm font-semibold py-2.5 disabled:opacity-50"
            >
              {language === 'es' ? 'Guardar plan de drills' : 'Save drill plan'} ({planSelection.size})
            </button>
          </div>
        )}

        {drillPlans.length > 0 && (
          <div className="px-4 pb-3 space-y-2">
            {drillPlans.slice(0, 3).map(plan => (
              <div key={plan.id} className="bg-zinc-900 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="text-xs text-zinc-200 flex-1">{plan.name} ({plan.techniqueIds.length})</span>
                <button
                  onClick={() => deleteDrillPlan(plan.id)}
                  className="text-xs text-zinc-500"
                >
                  {t('Delete')}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 pb-2">
          <span className="text-xs text-zinc-500">
            {filtered.length}{' '}
            {(() => {
              const count = filtered.length
              if (language === 'es') return count === 1 ? 'técnica' : 'técnicas'
              return count === 1 ? 'technique' : 'techniques'
            })()}
          </span>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-3">
        {filtered.map((technique: Technique) => (
          <TechniqueRow
            key={technique.id}
            technique={technique}
            categoryName={catMap.get(technique.categoryId) ?? ''}
            categoryIcon={catIconMap.get(technique.categoryId)}
            favorite={favoriteIds.includes(technique.id)}
            tags={tagsByTechnique[String(technique.id)] ?? []}
            onToggleFavorite={() => toggleFavorite(technique.id)}
            onAddTag={() => {
              setTagEditorTechniqueId(technique.id)
              setTagInput('')
            }}
            planMode={planMode}
            selected={planSelection.has(technique.id)}
            onClick={() => {
              if (planMode) {
                togglePlanSelection(technique.id)
                return
              }
              navigate(`/techniques/${technique.id}`)
            }}
          />
        ))}
      </div>

      <button
        onClick={() => navigate('/techniques/new/edit')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 active:bg-gold-light transition-colors z-40"
      >
        <Plus size={28} className="text-black" strokeWidth={2.5} />
      </button>
    </div>
  )
}
