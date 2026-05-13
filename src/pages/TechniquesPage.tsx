import { useState, useEffect, useRef, useLayoutEffect, forwardRef } from 'react'
import { getAppTheme, APP_THEME_UPDATED_EVENT, type AppTheme } from '../utils/theme'
import { PlainLogo } from '../components/PlainLogo'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { Search, X, Plus, Star, SlidersHorizontal } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, Difficulty, Technique } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'
import { CategoryIcon } from '../components/CategoryIcon'
import { useI18n, difficultyLabel, getCategoryName, getTechniqueDescription } from '../i18n'
import { techniqueMatchesQuery, techniqueScore } from '../utils/fuzzySearch'

const ITEM_SIZE = 116 // card height (~104px) + gap (12px)
const LIST_SCROLL_KEY = 'bjj-dojo.techniques.scroll-offset'
const LIST_CONTEXT_KEY = 'bjj-dojo.techniques.list-context'
const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
  ELITE: 3,
}
const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']

// Adds bottom padding so the last card clears the bottom nav + FAB
const ListInner = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, ...rest }, ref) => (
    <div ref={ref} style={{ ...style, paddingBottom: 96 }} {...rest} />
  ),
)
ListInner.displayName = 'ListInner'

function TechniqueRow({ technique, categoryName, categoryIcon, description, practiceCount, onClick, onToggleFavorite }: {
  technique: Technique; categoryName: string; categoryIcon?: string; description: string; practiceCount: number; onClick: () => void; onToggleFavorite: () => void
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
          {practiceCount > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">
              {practiceCount}×
            </span>
          )}
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
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'level' | 'frequency'>('name_asc')
  const [filterOpen, setFilterOpen] = useState(false)
  const scrollOffsetRef = useRef(0)
  const [initialScrollOffset, setInitialScrollOffset] = useState(0)

  const headerRef = useRef<HTMLDivElement>(null)
  const [listHeight, setListHeight] = useState(() => window.innerHeight - 200)

  useLayoutEffect(() => {
    function update() {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0
      setListHeight(window.innerHeight - h)
    }
    update()
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      const ro = new ResizeObserver(update)
      ro.observe(headerRef.current)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const sync = () => setTheme(getAppTheme())
    window.addEventListener(APP_THEME_UPDATED_EVENT, sync)
    return () => window.removeEventListener(APP_THEME_UPDATED_EVENT, sync)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const rawContext = window.sessionStorage.getItem(LIST_CONTEXT_KEY)
    if (rawContext) {
      try {
        const parsed = JSON.parse(rawContext) as {
          search?: unknown
          categoryId?: unknown
          favoritesOnly?: unknown
          difficultyFilter?: unknown
          sortBy?: unknown
        }
        if (typeof parsed.search === 'string') {
          setSearch(parsed.search)
          setDebouncedSearch(parsed.search)
        }
        if (typeof parsed.categoryId === 'number' || parsed.categoryId === null) {
          setCategoryId(parsed.categoryId)
        }
        if (typeof parsed.favoritesOnly === 'boolean') {
          setFavoritesOnly(parsed.favoritesOnly)
        }
        if (parsed.difficultyFilter === 'all' || DIFFICULTIES.includes(parsed.difficultyFilter as Difficulty)) {
          setDifficultyFilter(parsed.difficultyFilter as 'all' | Difficulty)
        }
        if (parsed.sortBy === 'name_asc' || parsed.sortBy === 'name_desc' || parsed.sortBy === 'level' || parsed.sortBy === 'frequency') {
          setSortBy(parsed.sortBy)
        }
      } catch {
        // Ignore malformed storage and fall back to defaults.
      }
    }

    const raw = window.sessionStorage.getItem(LIST_SCROLL_KEY)
    if (!raw) return
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return
    setInitialScrollOffset(parsed)
    scrollOffsetRef.current = parsed
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem(
      LIST_CONTEXT_KEY,
      JSON.stringify({
        search,
        categoryId,
        favoritesOnly,
        difficultyFilter,
        sortBy,
      }),
    )
  }, [search, categoryId, favoritesOnly, difficultyFilter, sortBy])

  // P5: category data served from module-level cache; returns ordered Category[]
  const categories = useLiveQuery(
    () => getCategoryMap().then(m => [...m.values()]),
    [],
    [] as Category[],
  )

  const queryResult = useLiveQuery(
    async () => {
      let q = categoryId
        ? db.techniques.where('categoryId').equals(categoryId)
        : db.techniques.toCollection()
      const results = await q.sortBy('name')
      const sessionTechniques = await db.sessionTechniques.toArray()
      const freqMap = new Map<number, number>()
      for (const st of sessionTechniques) {
        freqMap.set(st.techniqueId, (freqMap.get(st.techniqueId) ?? 0) + 1)
      }
      const filtered = results.filter(t => {
        if (debouncedSearch.trim() && !techniqueMatchesQuery(t, debouncedSearch)) return false
        if (favoritesOnly && !t.isFavorite) return false
        if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false
        return true
      })
      const compareBySort = (a: Technique, b: Technique) => {
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
        if (sortBy === 'level') {
          const levelDelta = DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
          return levelDelta !== 0 ? levelDelta : a.name.localeCompare(b.name)
        }
        if (sortBy === 'frequency') {
          const freqDelta = (freqMap.get(b.id) ?? 0) - (freqMap.get(a.id) ?? 0)
          return freqDelta !== 0 ? freqDelta : a.name.localeCompare(b.name)
        }
        return a.name.localeCompare(b.name)
      }
      filtered.sort((a, b) => {
        if (debouncedSearch.trim()) {
          const scoreDelta = techniqueScore(b, debouncedSearch) - techniqueScore(a, debouncedSearch)
          if (scoreDelta !== 0) return scoreDelta
        }
        return compareBySort(a, b)
      })
      return { items: filtered, freqMap }
    },
    [debouncedSearch, categoryId, favoritesOnly, difficultyFilter, sortBy],
    null as null | { items: Technique[]; freqMap: Map<number, number> },
  )

  const techniques = queryResult?.items ?? []
  const freqMap = queryResult?.freqMap ?? new Map<number, number>()

  const catMap = new Map(categories?.map(c => [c.id, getCategoryName(c, language)]))
  const catIconMap = new Map(categories?.map(c => [c.id, c.icon]))

  const renderRow = ({ index, style }: ListChildComponentProps) => {
    const technique = techniques[index]
    return (
      <div style={{ ...style, paddingLeft: 16, paddingRight: 16 }}>
        <TechniqueRow
          technique={technique}
          categoryName={catMap.get(technique.categoryId) ?? ''}
          categoryIcon={catIconMap.get(technique.categoryId)}
          description={getTechniqueDescription(technique, language)}
          practiceCount={freqMap.get(technique.id) ?? 0}
          onClick={() => {
            window.sessionStorage.setItem(
              LIST_CONTEXT_KEY,
              JSON.stringify({
                search,
                categoryId,
                favoritesOnly,
                difficultyFilter,
                sortBy,
              }),
            )
            window.sessionStorage.setItem(LIST_SCROLL_KEY, String(scrollOffsetRef.current))
            navigate(`/techniques/${technique.id}`)
          }}
          onToggleFavorite={() => {
            void db.techniques.update(technique.id, { isFavorite: !technique.isFavorite })
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
        <PlainLogo
          fill={theme === 'light' ? '#18181b' : '#ffffff'}
          className="w-72 h-72 opacity-[0.04]"
        />
      </div>
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10" ref={headerRef}>
        <div className="px-6 pt-12 pb-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">{t('Techniques')}</h1>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name_asc' | 'name_desc' | 'level' | 'frequency')}
              className="h-9 bg-zinc-800 rounded-xl px-2 text-xs text-zinc-200 outline-none focus:ring-2 focus:ring-gold"
              aria-label={language === 'es' ? 'Ordenar' : 'Sort'}
            >
              <option value="name_asc">{language === 'es' ? 'Nombre (A-Z)' : 'Name (A-Z)'}</option>
              <option value="name_desc">{language === 'es' ? 'Nombre (Z-A)' : 'Name (Z-A)'}</option>
              <option value="level">{language === 'es' ? 'Nivel' : 'Level'}</option>
              <option value="frequency">{language === 'es' ? 'Frecuencia' : 'Frequency'}</option>
            </select>
            <button
              onClick={() => setFilterOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors relative ${
                filterOpen ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
              }`}
              aria-label={t('Filter')}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
              {(categoryId !== null || favoritesOnly || difficultyFilter !== 'all') && !filterOpen && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold" />
              )}
            </button>
          </div>
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

        {/* Collapsible filters */}
        {filterOpen && (
          <div className="mx-4 mb-3 bg-zinc-900 rounded-2xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-widest">{t('FILTERS')}</span>
              <button
                onClick={() => { setCategoryId(null); setFavoritesOnly(false); setDifficultyFilter('all') }}
                className="text-xs text-zinc-500 active:text-zinc-300"
              >
                {t('Clear')}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { setCategoryId(null); setSearch(''); setDebouncedSearch('') }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  categoryId === null ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {t('All')}
              </button>
              {categories?.map((c: Category) => (
                <button
                  key={c.id}
                  onClick={() => { setCategoryId(c.id); setSearch(''); setDebouncedSearch('') }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 ${
                    categoryId === c.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <CategoryIcon value={c.icon} fallbackId={c.id} size={14} className={categoryId === c.id ? 'text-black' : 'text-zinc-300'} />
                  {getCategoryName(c, language)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFavoritesOnly(prev => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 ${
                  favoritesOnly ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                <Star size={12} fill={favoritesOnly ? 'currentColor' : 'none'} />
                {language === 'es' ? 'Favoritas' : 'Favorites'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDifficultyFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  difficultyFilter === 'all' ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {t('All')}
              </button>
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    difficultyFilter === d ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {difficultyLabel(d, d, language)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pb-2">
          <span className="text-xs text-zinc-500">
            {techniques.length}{' '}
            {(() => {
              const count = techniques.length
              if (language === 'es') return count === 1 ? 'técnica' : 'técnicas'
              return count === 1 ? 'technique' : 'techniques'
            })()}
          </span>
        </div>
      </div>

      {/* P4: windowed list — only visible cards are in the DOM */}
      <FixedSizeList
        height={listHeight}
        itemCount={techniques.length}
        itemSize={ITEM_SIZE}
        width="100%"
        innerElementType={ListInner}
        overscanCount={3}
        initialScrollOffset={initialScrollOffset}
        onScroll={({ scrollOffset }) => {
          scrollOffsetRef.current = scrollOffset
          window.sessionStorage.setItem(LIST_SCROLL_KEY, String(scrollOffset))
        }}
      >
        {renderRow}
      </FixedSizeList>

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
