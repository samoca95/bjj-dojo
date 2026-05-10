import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { SessionType } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import IconPickerModal from '../components/IconPickerModal'
import { getSessionTypeIcons, saveSessionTypeIcons, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { getAppTheme, setAppTheme, type AppTheme } from '../utils/theme'

const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS) as SessionType[]

export default function SettingsPage() {
  const navigate = useNavigate()
  const [sessionTypeIcons, setSessionTypeIcons] = useState<SessionTypeIconsMap>(getSessionTypeIcons())
  const [activeSessionType, setActiveSessionType] = useState<SessionType | null>(null)
  const [theme, setTheme] = useState<AppTheme>(getAppTheme())

  useEffect(() => {
    setSessionTypeIcons(getSessionTypeIcons())
  }, [])

  const pickerTitle = useMemo(() => {
    if (!activeSessionType) return ''
    return `Icon for ${SESSION_TYPE_LABELS[activeSessionType]}`
  }, [activeSessionType])

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">Settings</h1>
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">THEME MODE</h2>
          <div className="grid grid-cols-2 gap-2">
            {(['black', 'light'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  setTheme(mode)
                  setAppTheme(mode)
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  theme === mode
                    ? 'bg-gold text-black'
                    : 'bg-zinc-800 text-zinc-200 active:bg-zinc-700'
                }`}
              >
                {mode === 'black' ? 'Black' : 'Light'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs text-gold font-semibold tracking-widest">SESSION TYPE ICONS</h2>
          <div className="space-y-2">
            {SESSION_TYPES.map(sessionType => (
              <button
                key={sessionType}
                onClick={() => setActiveSessionType(sessionType)}
                className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-left flex items-center gap-3 active:bg-zinc-700"
              >
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                  <CategoryIcon value={sessionTypeIcons[sessionType]} size={18} className="text-gold" />
                </div>
                <span className="flex-1 text-sm text-zinc-100">{SESSION_TYPE_LABELS[sessionType]}</span>
                <Pencil size={15} className="text-zinc-500 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-2">
          <button
            onClick={() => navigate('/categories')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="shield" size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-100">Categories</div>
              <div className="text-xs text-zinc-500">Manage technique categories and icons</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/clubs')}
            className="w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value="map-pin" size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-100">Clubs</div>
              <div className="text-xs text-zinc-500">Manage your training locations</div>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
          </button>
        </div>
      </div>

      {activeSessionType && (
        <IconPickerModal
          title={pickerTitle}
          value={sessionTypeIcons[activeSessionType]}
          onClose={() => setActiveSessionType(null)}
          onSelect={value => {
            const next = {
              ...sessionTypeIcons,
              [activeSessionType]: value.trim(),
            } as SessionTypeIconsMap
            setSessionTypeIcons(next)
            saveSessionTypeIcons(next)
          }}
        />
      )}
    </div>
  )
}
