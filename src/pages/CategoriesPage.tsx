import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Category } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import IconPickerModal from '../components/IconPickerModal'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const categories = useLiveQuery(
    () => db.categories.orderBy('name').toArray(),
    [],
    [] as Category[],
  )

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">Categories</h1>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {categories?.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category)}
            className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-zinc-800 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value={category.icon} fallbackId={category.id} size={20} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-100">{category.name}</div>
              <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{category.description}</div>
            </div>
            <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        ))}
      </div>

      {activeCategory && (
        <IconPickerModal
          title={`Icon for ${activeCategory.name}`}
          value={activeCategory.icon}
          onClose={() => setActiveCategory(null)}
          onSelect={async icon => {
            await db.categories.update(activeCategory.id, { icon: icon.trim() })
          }}
        />
      )}
    </div>
  )
}

