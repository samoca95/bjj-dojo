import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Search, X, Plus, Star } from 'lucide-react'
import { db } from '../db/database'
import type { Category, Technique } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'
import { CategoryIcon } from '../components/CategoryIcon'
import { useI18n, getCategoryName, getTechniqueDescription } from '../i18n'
import { techniqueMatchesQuery, techniqueScore } from '../utils/fuzzySearch'

function TechniqueRow({ technique, categoryName, categoryIcon, description, onClick, onToggleFavorite }: {
  technique: Technique; categoryName: string; categoryIcon?: string; description: string; onClick: () => void; onToggleFavorite: () => void
}) {
  return (
    <div className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 text-left">
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-100 text-sm">{technique.name}</span>
          <DifficultyBadge difficulty={technique.difficulty} />
        </div>
        <div className="text-xs text-gold mt-0.5 flex items-center gap-1.5">
          <CategoryIcon value={categoryIcon} fallbackId={technique.categoryId} size={14} className="text-gold" />
          <span>{categoryName}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{description}</p>
      </button>
      <button
        onClick={() => onToggleFavorite()}
        className="shrink-0 mt-0.5 p-1 -mr-1 text-amber-400 active:text-amber-300 transition-colors"
        aria-label={technique.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={18} strokeWidth={1.5} fill={technique.isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

export default function TechniquesPage() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [], [] as Category[])

  const techniques = useLiveQuery(
    async () => {
      let q = categoryId
        ? db.techniques.where('categoryId').equals(categoryId)
        : db.techniques.toCollection()
      const results = await q.sortBy('name')
      const filtered = results.filter(t => {
        if (debouncedSearch.trim() && !techniqueMatchesQuery(t, debouncedSearch)) return false
        if (favoritesOnly && !t.isFavorite) return false
        if (tagFilter && !(t.tags ?? []).includes(tagFilter)) return false
        return true
      })
      if (debouncedSearch.trim()) {
        filtered.sort((a, b) => techniqueScore(b, debouncedSearch) - techniqueScore(a, debouncedSearch))
      }
      return filtered
    },
    [debouncedSearch, categoryId, favoritesOnly, tagFilter],
    [] as Technique[],
  )

  const catMap = new Map(categories?.map(c => [c.id, getCategoryName(c, language)]))
  const catIconMap = new Map(categories?.map(c => [c.id, c.icon]))
  const allTags = Array.from(new Set((techniques ?? []).flatMap(t => t.tags ?? []))).slice(0, 8)

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="px-6 pt-12 pb-3">
          <h1 className="text-2xl font-bold text-zinc-100">{t('Techniques')}</h1>
        </div>

        {/* Search */}
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
              <button onClick={() => { setSearch(''); setDebouncedSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-zinc-300">
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setCategoryId(null); setSearch(''); setDebouncedSearch(''); setFavoritesOnly(false); setTagFilter(null) }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              categoryId === null ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
            }`}
          >
            {t('All')}
          </button>
          {categories?.map((c: Category) => (
            <button
              key={c.id}
              onClick={() => { setCategoryId(c.id); setSearch(''); setDebouncedSearch('') }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                categoryId === c.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
              }`}
            >
              <CategoryIcon value={c.icon} fallbackId={c.id} size={14} className={categoryId === c.id ? 'text-black' : 'text-zinc-300'} />
              {getCategoryName(c, language)}
            </button>
          ))}
          <button
            onClick={() => setFavoritesOnly(prev => !prev)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
              favoritesOnly ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
            }`}
          >
            <Star size={12} fill={favoritesOnly ? 'currentColor' : 'none'} />
            {language === 'es' ? 'Favoritas' : 'Favorites'}
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(prev => prev === tag ? null : tag)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                tagFilter === tag ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="px-6 pb-2">
          <span className="text-xs text-zinc-500">
            {techniques?.length ?? 0}{' '}
            {(() => {
              const count = techniques?.length ?? 0
              if (language === 'es') return count === 1 ? 'técnica' : 'técnicas'
              return count === 1 ? 'technique' : 'techniques'
            })()}
          </span>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-3">
        {techniques?.map((t: Technique) => (
          <TechniqueRow
            key={t.id}
            technique={t}
            categoryName={catMap.get(t.categoryId) ?? ''}
            categoryIcon={catIconMap.get(t.categoryId)}
            description={getTechniqueDescription(t, language)}
            onClick={() => navigate(`/techniques/${t.id}`)}
            onToggleFavorite={() => {
              void db.techniques.update(t.id, { isFavorite: !t.isFavorite })
            }}
          />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/techniques/new/edit')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30 active:bg-gold-light transition-colors z-40"
      >
        <Plus size={28} className="text-black" strokeWidth={2.5} />
      </button>
    </div>
  )
}
