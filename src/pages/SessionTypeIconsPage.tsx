import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil } from 'lucide-react'
import type { SessionType } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import IconPickerModal from '../components/IconPickerModal'
import { getSessionTypeIcons, saveSessionTypeIcons, type SessionTypeIconsMap } from '../utils/sessionTypeIcons'
import { useI18n } from '../i18n'

const SESSION_TYPES = Object.keys(SESSION_TYPE_LABELS) as SessionType[]

export default function SessionTypeIconsPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const [sessionTypeIcons, setSessionTypeIcons] = useState<SessionTypeIconsMap>(getSessionTypeIcons())
  const [activeSessionType, setActiveSessionType] = useState<SessionType | null>(null)

  const pickerTitle = activeSessionType
    ? language === 'es'
      ? `Icono para ${SESSION_TYPE_LABELS[activeSessionType]}`
      : `Icon for ${SESSION_TYPE_LABELS[activeSessionType]}`
    : ''

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{t('SESSION TYPE ICONS')}</h1>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {SESSION_TYPES.map(sessionType => (
          <button
            key={sessionType}
            onClick={() => setActiveSessionType(sessionType)}
            className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-zinc-800 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <CategoryIcon value={sessionTypeIcons[sessionType]} size={20} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-100">{SESSION_TYPE_LABELS[sessionType]}</div>
            </div>
            <Pencil size={18} className="text-zinc-600" strokeWidth={2} />
          </button>
        ))}
      </div>

      {activeSessionType && (
        <IconPickerModal
          title={pickerTitle}
          value={sessionTypeIcons[activeSessionType]}
          onClose={() => setActiveSessionType(null)}
          onSelect={icon => {
            const next = {
              ...sessionTypeIcons,
              [activeSessionType]: icon.trim(),
            } as SessionTypeIconsMap
            setSessionTypeIcons(next)
            saveSessionTypeIcons(next)
          }}
        />
      )}
    </div>
  )
}
