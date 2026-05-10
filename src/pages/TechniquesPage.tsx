import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import type { Category, Technique } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'

function TechniqueRow({ technique, categoryName, onClick }: {
  technique: Technique; categoryName: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-zinc-900 rounded-2xl p-4 flex gap-3 text-left active:bg-zinc-800 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-zinc-100 text-sm">{technique.name}</span>
          <DifficultyBadge difficulty={technique.difficulty} />
        </div>
        <div className="text-xs text-gold mt-0.5">{categoryName}</div>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{technique.description}</p>
      </div>
      <svg className="w-5 h-5 text-zinc-600 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default function TechniquesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [], [] as Category[])

  const techniques = useLiveQuery(
    async () => {
      let q = categoryId
        ? db.techniques.where('categoryId').equals(categoryId)
        : db.techniques.toCollection()
      const results = await q.sortBy('name')
      if (search.trim()) {
        const s = search.toLowerCase()
        return results.filter(t => t.name.toLowerCase().includes(s))
      }
      return results
    },
    [search, categoryId],
    [] as Technique[],
  )

  const catMap = new Map(categories?.map(c => [c.id, c.name]))

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="px-6 pt-12 pb-3">
          <h1 className="text-2xl font-bold text-zinc-100">Techniques</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCategoryId(null) }}
              placeholder="Search techniques…"
              className="w-full bg-zinc-800 rounded-xl pl-9 pr-9 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-zinc-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setCategoryId(null); setSearch('') }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              categoryId === null ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
            }`}
          >
            All
          </button>
          {categories?.map((c: Category) => (
            <button
              key={c.id}
              onClick={() => { setCategoryId(c.id); setSearch('') }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                categoryId === c.id ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="px-6 pb-2">
          <span className="text-xs text-zinc-500">{techniques?.length ?? 0} technique{techniques?.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {techniques?.map((t: Technique) => (
          <TechniqueRow
            key={t.id}
            technique={t}
            categoryName={catMap.get(t.categoryId) ?? ''}
            onClick={() => navigate(`/techniques/${t.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
