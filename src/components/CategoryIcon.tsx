import type { LucideProps } from 'lucide-react'
import {
  Shield, ArrowLeftRight, RefreshCw, Target, ArrowDown,
  LifeBuoy, Crown, Zap, Flame, Star,
} from 'lucide-react'
import type { FC } from 'react'
import { DEFAULT_CATEGORY_ICONS } from '../constants/categoryDefaults'

export type CategoryIconOption = {
  id: string
  label: string
  Icon: FC<LucideProps>
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'shield',      label: 'Shield',      Icon: Shield },
  { id: 'arrows-swap', label: 'Swap',         Icon: ArrowLeftRight },
  { id: 'repeat',      label: 'Repeat',       Icon: RefreshCw },
  { id: 'target',      label: 'Target',       Icon: Target },
  { id: 'arrow-down',  label: 'Arrow Down',   Icon: ArrowDown },
  { id: 'lifebuoy',    label: 'Life Ring',    Icon: LifeBuoy },
  { id: 'crown',       label: 'Crown',        Icon: Crown },
  { id: 'bolt',        label: 'Bolt',         Icon: Zap },
  { id: 'flame',       label: 'Flame',        Icon: Flame },
  { id: 'star',        label: 'Star',         Icon: Star },
]

const ICON_MAP = Object.fromEntries(CATEGORY_ICON_OPTIONS.map(icon => [icon.id, icon]))

export const EMOJI_SUGGESTIONS = ['🥋', '🤼‍♂️', '💪', '🔥', '⚡️', '🛡️', '🏆', '🧠', '🧭', '🦵', '🤜', '🤛']

export function resolveCategoryIcon(icon?: string, fallbackId?: number) {
  if (icon) return icon
  if (fallbackId && DEFAULT_CATEGORY_ICONS[fallbackId]) return DEFAULT_CATEGORY_ICONS[fallbackId]
  return undefined
}

export function isIconOption(value?: string) {
  return Boolean(value && ICON_MAP[value])
}

export function CategoryIcon({
  value,
  fallbackId,
  size = 18,
  className = 'text-gold',
}: {
  value?: string
  fallbackId?: number
  size?: number
  className?: string
}) {
  const resolved = resolveCategoryIcon(value, fallbackId)
  if (!resolved) return null
  const option = ICON_MAP[resolved]
  if (!option) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {resolved}
      </span>
    )
  }
  return <option.Icon size={size} className={className} strokeWidth={2} />
}
