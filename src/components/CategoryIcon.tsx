import type { LucideProps } from 'lucide-react'
import {
  Shield, ArrowLeftRight, RefreshCw, Target, ArrowDown,
  LifeBuoy, Crown, Zap, Flame, Star,
  Sword, Swords, Dumbbell, Trophy, Medal, Award,
  Timer, Activity, Heart, Users, User, Brain,
  Wind, Mountain, Waves, Lock, Unlock, Anchor, Compass,
  Layers, Shirt, Flag, BookOpen,
  Crosshair, RotateCcw, Move, Hand,
  Circle, Square, Triangle, Octagon, Hexagon,
  Power, GitBranch, MapPin, Navigation, Eye,
  RefreshCcw, ArrowUp, ArrowRight, ArrowUpDown,
  CheckCircle, XCircle,
  Scan, Grip, Footprints,
  FlipHorizontal, Rotate3D,
  ChevronUp, ChevronDown,
  Focus, Radio,
  Cpu, Network,
} from 'lucide-react'
import type { FC } from 'react'
import { DEFAULT_CATEGORY_ICONS } from '../constants/categoryDefaults'

export type CategoryIconOption = {
  id: string
  label: string
  Icon: FC<LucideProps>
}

export const SUGGESTED_ICON_IDS = [
  'shield', 'arrows-swap', 'repeat', 'target', 'arrow-down',
  'lifebuoy', 'crown', 'bolt', 'flame', 'star',
]

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // Suggested (original set)
  { id: 'shield',       label: 'Shield',       Icon: Shield },
  { id: 'arrows-swap',  label: 'Swap',          Icon: ArrowLeftRight },
  { id: 'repeat',       label: 'Repeat',        Icon: RefreshCw },
  { id: 'target',       label: 'Target',        Icon: Target },
  { id: 'arrow-down',   label: 'Arrow Down',    Icon: ArrowDown },
  { id: 'lifebuoy',     label: 'Life Ring',     Icon: LifeBuoy },
  { id: 'crown',        label: 'Crown',         Icon: Crown },
  { id: 'bolt',         label: 'Bolt',          Icon: Zap }, // 'Bolt' id maps to Zap icon
  { id: 'flame',        label: 'Flame',         Icon: Flame },
  { id: 'star',         label: 'Star',          Icon: Star },
  // Combat & martial arts
  { id: 'sword',        label: 'Sword',         Icon: Sword },
  { id: 'swords',       label: 'Swords',        Icon: Swords },
  { id: 'crosshair',    label: 'Crosshair',     Icon: Crosshair },
  { id: 'octagon',      label: 'Octagon',       Icon: Octagon },
  { id: 'power',        label: 'Power',         Icon: Power },
  // Training & sport
  { id: 'dumbbell',     label: 'Dumbbell',      Icon: Dumbbell },
  { id: 'trophy',       label: 'Trophy',        Icon: Trophy },
  { id: 'medal',        label: 'Medal',         Icon: Medal },
  { id: 'award',        label: 'Award',         Icon: Award },
  { id: 'flag',         label: 'Flag',          Icon: Flag },
  { id: 'timer',        label: 'Timer',         Icon: Timer },
  { id: 'activity',     label: 'Activity',      Icon: Activity },
  // Body & health
  { id: 'heart',        label: 'Heart',         Icon: Heart },
  { id: 'hand',         label: 'Hand',          Icon: Hand },
  { id: 'footprints',   label: 'Footprints',    Icon: Footprints },
  { id: 'grip',         label: 'Grip',          Icon: Grip },
  { id: 'eye',          label: 'Eye',           Icon: Eye },
  { id: 'brain',        label: 'Brain',         Icon: Brain },
  // Movement & direction
  { id: 'move',         label: 'Move',          Icon: Move },
  { id: 'rotate-ccw',   label: 'Rotate CCW',    Icon: RotateCcw },
  { id: 'refresh-ccw',  label: 'Refresh CCW',   Icon: RefreshCcw },
  { id: 'flip-h',       label: 'Flip Horiz.',   Icon: FlipHorizontal },
  { id: 'rotate-3d',    label: 'Rotate 3D',     Icon: Rotate3D },
  { id: 'arrow-up',     label: 'Arrow Up',      Icon: ArrowUp },
  { id: 'arrow-right',  label: 'Arrow Right',   Icon: ArrowRight },
  { id: 'arrow-updown', label: 'Up/Down',       Icon: ArrowUpDown },
  // People
  { id: 'users',        label: 'Users',         Icon: Users },
  { id: 'user',         label: 'User',          Icon: User },
  // Shapes
  { id: 'circle',       label: 'Circle',        Icon: Circle },
  { id: 'square',       label: 'Square',        Icon: Square },
  { id: 'triangle',     label: 'Triangle',      Icon: Triangle },
  { id: 'hexagon',      label: 'Hexagon',       Icon: Hexagon },
  // Nature/elements
  { id: 'wind',         label: 'Wind',          Icon: Wind },
  { id: 'mountain',     label: 'Mountain',      Icon: Mountain },
  { id: 'waves',        label: 'Waves',         Icon: Waves },
  { id: 'anchor',       label: 'Anchor',        Icon: Anchor },
  // Objects
  { id: 'compass',      label: 'Compass',       Icon: Compass },
  { id: 'layers',       label: 'Layers',        Icon: Layers },
  { id: 'shirt',        label: 'Shirt',         Icon: Shirt },
  { id: 'book-open',    label: 'Book',          Icon: BookOpen },
  { id: 'lock',         label: 'Lock',          Icon: Lock },
  { id: 'unlock',       label: 'Unlock',        Icon: Unlock },
  { id: 'map-pin',      label: 'Map Pin',       Icon: MapPin },
  { id: 'navigation',   label: 'Navigation',    Icon: Navigation },
  { id: 'scan',         label: 'Scan',          Icon: Scan },
  { id: 'git-branch',   label: 'Branch',        Icon: GitBranch },
  { id: 'check-circle', label: 'Check',         Icon: CheckCircle },
  { id: 'x-circle',     label: 'X Circle',      Icon: XCircle },
  { id: 'radio',        label: 'Signal',        Icon: Radio },
  { id: 'chevron-up',   label: 'Chevron Up',    Icon: ChevronUp },
  { id: 'chevron-down', label: 'Chevron Down',  Icon: ChevronDown },
  { id: 'focus',        label: 'Focus',         Icon: Focus },
  { id: 'network',      label: 'Network',       Icon: Network },
  { id: 'cpu',          label: 'CPU',           Icon: Cpu },
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
