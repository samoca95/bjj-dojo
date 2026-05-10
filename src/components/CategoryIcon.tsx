import type { ReactNode } from 'react'
import { DEFAULT_CATEGORY_ICONS } from '../constants/categoryDefaults'

export type CategoryIconOption = {
  id: string
  label: string
  paths: ReactNode
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  {
    id: 'shield',
    label: 'Shield',
    paths: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V7l7-4z" />,
  },
  {
    id: 'arrows-swap',
    label: 'Swap',
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10l-3-3m3 3l-3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H7l3 3m-3-3l3-3" />
      </>
    ),
  },
  {
    id: 'repeat',
    label: 'Repeat',
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-6h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10a7 7 0 0 1 12-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14a7 7 0 0 1-12 3" />
      </>
    ),
  },
  {
    id: 'target',
    label: 'Target',
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  {
    id: 'arrow-down',
    label: 'Arrow Down',
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l4 4 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h14" />
      </>
    ),
  },
  {
    id: 'lifebuoy',
    label: 'Lifebuoy',
    paths: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3" />
      </>
    ),
  },
  {
    id: 'crown',
    label: 'Crown',
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l4 4 4-6 4 6 4-4v10H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
      </>
    ),
  },
  {
    id: 'bolt',
    label: 'Bolt',
    paths: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  },
  {
    id: 'flame',
    label: 'Flame',
    paths: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3s4 4 4 7a4 4 0 0 1-8 0c0-3 4-7 4-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14a4 4 0 0 0 8 0c0-1.5-1-3-2.5-4" />
      </>
    ),
  },
  {
    id: 'star',
    label: 'Star',
    paths: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l2.5 5 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z"
      />
    ),
  },
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
  const icon = ICON_MAP[resolved]
  if (!icon) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {resolved}
      </span>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      {icon.paths}
    </svg>
  )
}
