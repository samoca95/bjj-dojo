export type BeltColor = 'white' | 'blue' | 'purple' | 'brown' | 'black'

export const BELT_COLORS: BeltColor[] = ['white', 'blue', 'purple', 'brown', 'black']
export const MAX_STRIPES = 4

export const BELT_STORAGE_KEY = 'bjj-dojo:belt-color'
export const STRIPES_STORAGE_KEY = 'bjj-dojo:belt-stripes'
export const BELT_RANK_UPDATED_EVENT = 'bjj-dojo:belt-rank-updated'

export const DEFAULT_BELT: BeltColor = 'white'
export const DEFAULT_STRIPES = 0

export function getBeltColor(): BeltColor {
  if (typeof window === 'undefined') return DEFAULT_BELT
  const raw = window.localStorage.getItem(BELT_STORAGE_KEY)
  return (BELT_COLORS as string[]).includes(raw ?? '') ? (raw as BeltColor) : DEFAULT_BELT
}

export function setBeltColor(belt: BeltColor) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BELT_STORAGE_KEY, belt)
  window.dispatchEvent(new CustomEvent(BELT_RANK_UPDATED_EVENT))
}

export function getBeltStripes(): number {
  if (typeof window === 'undefined') return DEFAULT_STRIPES
  const raw = window.localStorage.getItem(STRIPES_STORAGE_KEY)
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= MAX_STRIPES ? Math.floor(n) : DEFAULT_STRIPES
}

export function setBeltStripes(stripes: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STRIPES_STORAGE_KEY, String(stripes))
  window.dispatchEvent(new CustomEvent(BELT_RANK_UPDATED_EVENT))
}
