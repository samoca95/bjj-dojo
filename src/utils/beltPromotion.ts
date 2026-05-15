import type { BeltColor } from './beltRank'
import { BELT_COLORS } from './beltRank'

export const BELT_HISTORY_STORAGE_KEY = 'bjj-dojo:belt-history'
const DAY_MS = 24 * 60 * 60 * 1000

export interface BeltSnapshot {
  color: BeltColor
  stripes: number
  promotedAt: number | null
}

export function getBeltHistory(): BeltSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(BELT_HISTORY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const color = (parsed as { color?: unknown }).color
    const stripes = Number((parsed as { stripes?: unknown }).stripes)
    const promotedAtRaw = (parsed as { promotedAt?: unknown }).promotedAt
    if (typeof color !== 'string' || !(BELT_COLORS as string[]).includes(color))
      return null
    return {
      color: color as BeltColor,
      stripes: Number.isFinite(stripes) ? Math.floor(stripes) : 0,
      promotedAt:
        typeof promotedAtRaw === 'number' && Number.isFinite(promotedAtRaw)
          ? promotedAtRaw
          : null,
    }
  } catch {
    return null
  }
}

function writeBeltHistory(snap: BeltSnapshot) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BELT_HISTORY_STORAGE_KEY, JSON.stringify(snap))
}

function rank(color: BeltColor): number {
  return BELT_COLORS.indexOf(color)
}

export interface BeltChangeResult {
  promoted: boolean
  forceStripesReset: boolean
}

export function recordBeltChange(
  next: { color: BeltColor; stripes: number },
  now: number = Date.now(),
): BeltChangeResult {
  const prev = getBeltHistory()
  if (!prev) {
    writeBeltHistory({
      color: next.color,
      stripes: next.stripes,
      promotedAt: null,
    })
    return { promoted: false, forceStripesReset: false }
  }

  const prevRank = rank(prev.color)
  const nextRank = rank(next.color)

  if (nextRank > prevRank) {
    writeBeltHistory({ color: next.color, stripes: 0, promotedAt: now })
    return { promoted: true, forceStripesReset: true }
  }

  if (nextRank === prevRank && next.stripes > prev.stripes) {
    writeBeltHistory({
      color: next.color,
      stripes: next.stripes,
      promotedAt: now,
    })
    return { promoted: true, forceStripesReset: false }
  }

  writeBeltHistory({
    color: next.color,
    stripes: next.stripes,
    promotedAt: prev.promotedAt,
  })
  return { promoted: false, forceStripesReset: false }
}

export function wasPromotedWithinLastWeek(now: number = Date.now()): boolean {
  const snap = getBeltHistory()
  if (!snap || snap.promotedAt == null) return false
  return now - snap.promotedAt < 7 * DAY_MS
}
