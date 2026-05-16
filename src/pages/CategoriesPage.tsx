import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Pencil, RotateCcw } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap, invalidateCategoryCache } from '../db/categoryCache'
import type { Category } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import IconPickerModal from '../components/IconPickerModal'
import { useI18n, getCategoryName, getCategoryDescription } from '../i18n'
import { isQuotaError, notifyQuotaError } from '../utils/quotaError'
import { prefilledCategories } from '../db/prefilled'
import {
  getFlowIcon,
  setFlowIcon,
  DEFAULT_FLOW_ICON,
  FLOW_ICON_UPDATED_EVENT,
} from '../utils/flowIcon'

const defaultCategoryIcons = new Map(
  prefilledCategories.map((c) => [c.id, c.icon]),
)

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [flowIcon, setFlowIconState] = useState(getFlowIcon)
  const [flowPickerOpen, setFlowPickerOpen] = useState(false)

  useEffect(() => {
    const handler = () => setFlowIconState(getFlowIcon())
    window.addEventListener(FLOW_ICON_UPDATED_EVENT, handler)
    return () => window.removeEventListener(FLOW_ICON_UPDATED_EVENT, handler)
  }, [])

  const categories = useLiveQuery(
    () => getCategoryMap().then((m) => [...m.values()]),
    [],
    [] as Category[],
  )

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{t('Categories')}</h1>
      </div>

      <div className="px-4 pb-6 space-y-3">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">
            {t('FLOWS')}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value={flowIcon} size={20} className="text-gold" />
            </div>
            <div className="flex-1 text-sm text-zinc-300">
              {t('Flow button icon')}
            </div>
            {flowIcon !== DEFAULT_FLOW_ICON && (
              <button
                onClick={() => {
                  setFlowIcon(DEFAULT_FLOW_ICON)
                  setFlowIconState(DEFAULT_FLOW_ICON)
                }}
                aria-label={t('Reset flow icon')}
                className="p-2 text-zinc-500 active:text-zinc-200"
              >
                <RotateCcw size={16} strokeWidth={2} />
              </button>
            )}
            <button
              onClick={() => setFlowPickerOpen(true)}
              aria-label={t('Edit')}
              className="p-2 text-zinc-600 active:text-zinc-200"
            >
              <Pencil size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {categories?.map((category) => {
          const defaultIcon = defaultCategoryIcons.get(category.id)
          const isDefault = !defaultIcon || category.icon === defaultIcon
          return (
            <div
              key={category.id}
              className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                <CategoryIcon
                  value={category.icon}
                  fallbackId={category.id}
                  size={20}
                  className="text-gold"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-100">
                  {getCategoryName(category, language)}
                </div>
                <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {getCategoryDescription(category, language)}
                </div>
              </div>
              {!isDefault && (
                <button
                  onClick={async () => {
                    try {
                      await db.categories.update(category.id, {
                        icon: defaultIcon,
                      })
                      invalidateCategoryCache()
                    } catch (err) {
                      if (isQuotaError(err)) notifyQuotaError()
                    }
                  }}
                  aria-label={
                    language === 'es' ? 'Restablecer icono' : 'Reset icon'
                  }
                  className="p-2 text-zinc-500 active:text-zinc-200"
                >
                  <RotateCcw size={16} strokeWidth={2} />
                </button>
              )}
              <button
                onClick={() => setActiveCategory(category)}
                aria-label={language === 'es' ? 'Editar icono' : 'Edit icon'}
                className="p-2 text-zinc-600 active:text-zinc-200"
              >
                <Pencil size={18} strokeWidth={2} />
              </button>
            </div>
          )
        })}
      </div>

      {flowPickerOpen && (
        <IconPickerModal
          title="Flow button icon"
          value={flowIcon}
          onClose={() => setFlowPickerOpen(false)}
          onSelect={(icon) => {
            setFlowIcon(icon.trim())
            setFlowIconState(icon.trim())
          }}
        />
      )}

      {activeCategory && (
        <IconPickerModal
          title={
            language === 'es'
              ? `Icono para ${getCategoryName(activeCategory, language)}`
              : `Icon for ${getCategoryName(activeCategory, language)}`
          }
          value={activeCategory.icon}
          onClose={() => setActiveCategory(null)}
          onSelect={async (icon) => {
            try {
              await db.categories.update(activeCategory.id, {
                icon: icon.trim(),
              })
              invalidateCategoryCache()
            } catch (err) {
              if (isQuotaError(err)) notifyQuotaError()
            }
          }}
        />
      )}
    </div>
  )
}
