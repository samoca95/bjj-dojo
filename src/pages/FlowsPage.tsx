import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Rotate3d,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react'
import { db } from '../db/database'
import type { Flow, Technique } from '../types'
import { flowMatchesQuery, flowScore } from '../utils/fuzzySearch'
import { getTechniqueName, useI18n } from '../i18n'
import { notifyDbMutation } from '../utils/autoBackup/notify'

const LIST_STATE_KEY = 'bjj-dojo.flows.list-state'

type SortBy = 'name_asc' | 'name_desc' | 'recent_updated' | 'recent_created'

function FlowCard({
  flow,
  onClick,
  onToggleFavorite,
}: {
  flow: Flow
  onClick: () => void
  onToggleFavorite: () => void
}) {
  return (
    <div className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 text-left">
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-100 text-sm">
            {flow.name}
          </span>
          {flow.gi !== false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300">
              Gi
            </span>
          )}
          {flow.noGi !== false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-300">
              No-Gi
            </span>
          )}
          {(flow.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
        {flow.description && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
            {flow.description}
          </p>
        )}
        <p className="text-[11px] text-gold/80 mt-1">
          {flow.nodes.length} {flow.nodes.length === 1 ? 'step' : 'steps'}
        </p>
      </button>
      <button
        onClick={onToggleFavorite}
        className="shrink-0 mt-0.5 p-1 -mr-1 text-amber-400 active:text-amber-300 transition-colors"
        aria-label={
          flow.isFavorite ? 'Remove from favorites' : 'Add to favorites'
        }
      >
        <Star
          size={18}
          strokeWidth={1.5}
          fill={flow.isFavorite ? 'currentColor' : 'none'}
        />
      </button>
    </div>
  )
}

export default function FlowsPage() {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('name_asc')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [formatFilter, setFormatFilter] = useState<'all' | 'gi' | 'no-gi'>(
    'all',
  )
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Restore persisted list state on mount
  useEffect(() => {
    const raw = window.sessionStorage.getItem(LIST_STATE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<{
        search: string
        sortBy: SortBy
        favoritesOnly: boolean
        formatFilter: 'all' | 'gi' | 'no-gi'
        activeTag: string | null
      }>
      if (typeof parsed.search === 'string') {
        setSearch(parsed.search)
        setDebouncedSearch(parsed.search)
      }
      if (
        parsed.sortBy === 'name_asc' ||
        parsed.sortBy === 'name_desc' ||
        parsed.sortBy === 'recent_updated' ||
        parsed.sortBy === 'recent_created'
      ) {
        setSortBy(parsed.sortBy)
      }
      if (typeof parsed.favoritesOnly === 'boolean') {
        setFavoritesOnly(parsed.favoritesOnly)
      }
      if (
        parsed.formatFilter === 'all' ||
        parsed.formatFilter === 'gi' ||
        parsed.formatFilter === 'no-gi'
      ) {
        setFormatFilter(parsed.formatFilter)
      }
      if (typeof parsed.activeTag === 'string' || parsed.activeTag === null) {
        setActiveTag(parsed.activeTag ?? null)
      }
    } catch {
      // Ignore malformed state.
    }
  }, [])

  useEffect(() => {
    window.sessionStorage.setItem(
      LIST_STATE_KEY,
      JSON.stringify({ search, sortBy, favoritesOnly, formatFilter, activeTag }),
    )
  }, [search, sortBy, favoritesOnly, formatFilter, activeTag])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const flows = useLiveQuery(() => db.flows.toArray(), [], [] as Flow[])
  const techniques = useLiveQuery(
    () => db.techniques.toArray(),
    [],
    [] as Technique[],
  )

  const techniqueNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const tech of techniques ?? []) {
      map.set(tech.id, getTechniqueName(tech, language))
    }
    return (id: number) => map.get(id) ?? ''
  }, [techniques, language])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const flow of flows ?? []) {
      for (const tag of flow.tags ?? []) set.add(tag)
    }
    return [...set].sort()
  }, [flows])

  const visibleFlows = useMemo(() => {
    const list = (flows ?? []).filter((flow) => {
      if (favoritesOnly && !flow.isFavorite) return false
      if (formatFilter === 'gi' && flow.gi === false) return false
      if (formatFilter === 'no-gi' && flow.noGi === false) return false
      if (activeTag && !(flow.tags ?? []).includes(activeTag)) return false
      if (
        debouncedSearch.trim() &&
        !flowMatchesQuery(flow, techniqueNameById, debouncedSearch)
      )
        return false
      return true
    })
    list.sort((a, b) => {
      if (debouncedSearch.trim()) {
        const delta =
          flowScore(b, techniqueNameById, debouncedSearch) -
          flowScore(a, techniqueNameById, debouncedSearch)
        if (delta !== 0) return delta
      }
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      if (sortBy === 'recent_updated') return b.updatedAt - a.updatedAt
      if (sortBy === 'recent_created') return b.createdAt - a.createdAt
      return a.name.localeCompare(b.name)
    })
    return list
  }, [
    flows,
    favoritesOnly,
    formatFilter,
    activeTag,
    debouncedSearch,
    sortBy,
    techniqueNameById,
  ])

  const flowsCountText = (() => {
    const count = visibleFlows.length
    if (language === 'es') return `${count} ${count === 1 ? 'flujo' : 'flujos'}`
    if (language === 'fr') return `${count} ${count === 1 ? 'flux' : 'flux'}`
    return `${count} ${count === 1 ? 'flow' : 'flows'}`
  })()

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="px-4 pt-12 pb-3 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
            aria-label="Back"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="flex-1 text-2xl font-bold text-zinc-100">
            {t('Flows')}
          </h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-9 bg-zinc-800 rounded-xl px-2 text-xs text-zinc-200 outline-none focus:ring-2 focus:ring-gold"
            aria-label={language === 'es' ? 'Ordenar' : 'Sort'}
          >
            <option value="name_asc">
              {language === 'es' ? 'Nombre (A-Z)' : 'Name (A-Z)'}
            </option>
            <option value="name_desc">
              {language === 'es' ? 'Nombre (Z-A)' : 'Name (Z-A)'}
            </option>
            <option value="recent_updated">
              {language === 'es' ? 'Actualizado' : 'Recently updated'}
            </option>
            <option value="recent_created">
              {language === 'es' ? 'Creado' : 'Recently created'}
            </option>
          </select>
          <button
            onClick={() => setFilterOpen((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors relative ${
              filterOpen
                ? 'bg-gold text-black'
                : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
            }`}
            aria-label={t('Filter')}
          >
            <SlidersHorizontal size={18} strokeWidth={2} />
            {(favoritesOnly || formatFilter !== 'all' || activeTag !== null) &&
              !filterOpen && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gold" />
            )}
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === 'es' ? 'Buscar flujos…' : 'Search flows…'
              }
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setDebouncedSearch('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-zinc-300"
                aria-label={t('Clear')}
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div className="mx-4 mb-3 bg-zinc-900 rounded-2xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 tracking-widest">
                {t('FILTERS')}
              </span>
              <button
                onClick={() => {
                  setFavoritesOnly(false)
                  setFormatFilter('all')
                  setActiveTag(null)
                }}
                className="text-xs text-zinc-500 active:text-zinc-300"
              >
                {t('Clear')}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFavoritesOnly((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 ${
                  favoritesOnly
                    ? 'bg-gold text-black'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                <Star
                  size={12}
                  fill={favoritesOnly ? 'currentColor' : 'none'}
                />
                {language === 'es' ? 'Favoritos' : 'Favorites'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'gi', 'no-gi'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormatFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    formatFilter === f
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {f === 'all' ? t('All') : f === 'gi' ? 'Gi' : 'No-Gi'}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activeTag === null
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {t('All')}
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      activeTag === tag
                        ? 'bg-gold text-black'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-6 pb-2 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">{flowsCountText}</span>
          <button
            onClick={() => navigate('/flows/new')}
            aria-label={language === 'es' ? 'Nuevo flujo' : 'New flow'}
            className="w-10 h-10 rounded-full bg-zinc-800 text-gold flex items-center justify-center active:bg-zinc-700 transition-colors"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-3">
        {visibleFlows.length === 0 && (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">
            {language === 'es' ? 'No hay flujos.' : 'No flows yet.'}
          </div>
        )}
        {visibleFlows.map((flow) => (
          <FlowCard
            key={flow.id}
            flow={flow}
            onClick={() => navigate(`/flows/${flow.id}`)}
            onToggleFavorite={() => {
              if (flow.id == null) return
              void db.flows
                .update(flow.id, { isFavorite: !flow.isFavorite })
                .then(() =>
                  notifyDbMutation(undefined, { components: ['flows'] }),
                )
            }}
          />
        ))}
      </div>

      <button
        onClick={() =>
          window.open(
            'https://eel.is/GrappleMap/index.html',
            '_blank',
            'noopener,noreferrer',
          )
        }
        aria-label="Open GrappleMap 3D"
        className="fixed bottom-20 right-4 h-10 pl-3 pr-4 rounded-full bg-gold text-black active:bg-gold-light flex items-center gap-2 transition-colors z-40"
      >
        <Rotate3d size={16} className="text-black" />
        <span className="text-sm font-semibold leading-none">3D</span>
      </button>
    </div>
  )
}
