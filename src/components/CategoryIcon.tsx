import { DynamicIcon } from 'lucide-react/dynamic'
import { ICON_MAP, resolveCategoryIcon } from './categoryIcons'

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
    // Check if it could be a lucide icon name (kebab-case) - try DynamicIcon
    if (/^[a-z][a-z0-9-]*$/.test(resolved)) {
      return (
        <DynamicIcon
          name={resolved as Parameters<typeof DynamicIcon>[0]['name']}
          size={size}
          className={className}
          strokeWidth={2}
        />
      )
    }
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {resolved}
      </span>
    )
  }
  return <option.Icon size={size} className={className} strokeWidth={2} />
}
