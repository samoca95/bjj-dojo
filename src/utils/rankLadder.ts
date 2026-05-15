import type { TranslationKey } from '../i18n'

export interface RankTier {
  id: string
  nameKey: TranslationKey
  hours: number
}

export const RANK_TIERS: RankTier[] = [
  { id: 'recruit', nameKey: 'Recruit', hours: 0 },
  { id: 'whiteSpirit', nameKey: 'White Belt Spirit', hours: 10 },
  { id: 'striped', nameKey: 'Striped', hours: 25 },
  { id: 'roller', nameKey: 'Roller', hours: 75 },
  { id: 'grinder', nameKey: 'Grinder', hours: 150 },
  { id: 'veteran', nameKey: 'Veteran', hours: 300 },
  { id: 'blackPath', nameKey: 'Black Belt Path', hours: 600 },
  { id: 'legend', nameKey: 'Legend', hours: 1000 },
]

export interface RankProgress {
  tier: RankTier
  next: RankTier | null
  hours: number
  hoursIntoTier: number
  hoursForNext: number
  pct: number
}

export function computeRank(totalMinutes: number): RankProgress {
  const hours = totalMinutes / 60
  let tierIdx = 0
  for (let i = 0; i < RANK_TIERS.length; i += 1) {
    if (hours >= RANK_TIERS[i].hours) tierIdx = i
  }
  const tier = RANK_TIERS[tierIdx]
  const next = RANK_TIERS[tierIdx + 1] ?? null
  const hoursIntoTier = hours - tier.hours
  const hoursForNext = next ? next.hours - tier.hours : 0
  const pct =
    next && hoursForNext > 0
      ? Math.min(100, Math.round((hoursIntoTier / hoursForNext) * 100))
      : 100
  return { tier, next, hours, hoursIntoTier, hoursForNext, pct }
}
