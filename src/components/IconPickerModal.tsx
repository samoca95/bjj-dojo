import { useMemo, useState } from 'react'
import { DynamicIcon, iconNames } from 'lucide-react/dynamic'
import { CATEGORY_ICON_OPTIONS, CategoryIcon, EMOJI_SUGGESTIONS, SUGGESTED_ICON_IDS } from './CategoryIcon'
import { useI18n } from '../i18n'

type IconName = Parameters<typeof DynamicIcon>[0]['name']

// kebab-case id → human-readable label
function iconIdToLabel(id: string) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Full sorted list of all lucide icon IDs
const ALL_ICON_IDS: string[] = [...new Set(iconNames as string[])].sort()

export default function IconPickerModal({
  title,
  value,
  onClose,
  onSelect,
}: {
  title: string
  value?: string
  onClose: () => void
  onSelect: (value: string) => void
}) {
  const { t: tr } = useI18n()
  const [tab, setTab] = useState<'icons' | 'emoji'>('icons')
  const [search, setSearch] = useState('')
  const [emojiInput, setEmojiInput] = useState('')

  const suggestedIcons = useMemo(
    () => CATEGORY_ICON_OPTIONS.filter(icon => SUGGESTED_ICON_IDS.includes(icon.id)),
    [],
  )

  const filteredIconIds = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return ALL_ICON_IDS
    return ALL_ICON_IDS.filter(id => id.includes(query) || iconIdToLabel(id).toLowerCase().includes(query))
  }, [search])

  const showSuggested = tab === 'icons' && search.trim() === ''

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="bg-zinc-900 w-full rounded-t-3xl max-h-[85vh] flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-800">
          <h2 className="flex-1 font-bold text-zinc-100">{title}</h2>
          <button
            onClick={() => { onSelect(''); onClose() }}
            className="text-xs text-zinc-400 active:text-zinc-200"
          >
            {tr('Clear')}
          </button>
          <button onClick={onClose} className="text-gold font-semibold active:text-gold-light">
            {tr('Done')}
          </button>
        </div>

        <div className="px-4 pt-4 flex gap-2">
          {(['icons', 'emoji'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide ${
                tab === t ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
               {t === 'icons' ? tr('Icons') : tr('Emoji')}
            </button>
          ))}
        </div>

        {tab === 'icons' ? (
          <>
            <div className="px-4 py-3">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr('Search all icons…')}
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
            </div>
            <div className="px-4 pb-4 overflow-y-auto space-y-5">
              {showSuggested && (
                <div>
                   <div className="text-xs text-zinc-500 font-semibold mb-2">{tr('Suggested')}</div>
                  <div className="grid grid-cols-5 gap-2">
                    {suggestedIcons.map(icon => (
                      <button
                        key={icon.id}
                        onClick={() => { onSelect(icon.id); onClose() }}
                        className={`rounded-2xl border px-2 py-3 flex flex-col items-center gap-2 transition-colors ${
                          value === icon.id ? 'border-gold bg-gold/10' : 'border-zinc-800 bg-zinc-950/40'
                        }`}
                      >
                        <CategoryIcon value={icon.id} size={22} className="text-gold" />
                        <span className="text-[10px] text-zinc-300 truncate w-full text-center">{icon.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                {showSuggested && (
                    <div className="text-xs text-zinc-500 font-semibold mb-2">{tr('All Icons')} ({ALL_ICON_IDS.length})</div>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {filteredIconIds.map(id => (
                    <button
                      key={id}
                      onClick={() => { onSelect(id); onClose() }}
                      className={`rounded-2xl border px-2 py-3 flex flex-col items-center gap-2 transition-colors ${
                        value === id ? 'border-gold bg-gold/10' : 'border-zinc-800 bg-zinc-950/40'
                      }`}
                    >
                      <DynamicIcon name={id as IconName} size={22} className="text-gold" strokeWidth={2} />
                      <span className="text-[10px] text-zinc-300 truncate w-full text-center">{iconIdToLabel(id)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 py-4 space-y-4 overflow-y-auto">
            <div className="bg-zinc-800 rounded-xl p-3">
               <label className="text-xs text-zinc-400">{tr('Paste or type an emoji')}</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={emojiInput}
                  onChange={e => setEmojiInput(e.target.value)}
                   placeholder={tr('e.g. 🥋')}
                  className="flex-1 bg-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
                />
                <button
                  onClick={() => {
                    const trimmed = emojiInput.trim()
                    if (!trimmed) return
                    onSelect(trimmed)
                    onClose()
                  }}
                  className="px-3 rounded-lg bg-gold text-black text-sm font-semibold"
                >
                   {tr('Use')}
                </button>
              </div>
            </div>
            <div>
               <div className="text-xs text-zinc-400 mb-2">{tr('Suggestions')}</div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_SUGGESTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose() }}
                    className={`rounded-xl py-2 text-xl transition-colors ${
                      value === emoji ? 'bg-gold/20 ring-2 ring-gold' : 'bg-zinc-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
