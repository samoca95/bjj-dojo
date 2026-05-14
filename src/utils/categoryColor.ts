/**
 * Deterministic colour per category, used to tint technique nodes in the
 * connection graphs. Categories carry no stored colour, so the palette is
 * keyed by id — the seven prefilled categories (ids 1-7) each get a distinct
 * hue; custom categories with higher ids wrap around the palette.
 */
const CATEGORY_PALETTE = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#4ade80', // green
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
] as const

export const CATEGORY_PALETTE_SIZE = CATEGORY_PALETTE.length

export function categoryColor(categoryId: number): string {
  const len = CATEGORY_PALETTE.length
  const idx = (((Math.round(categoryId) - 1) % len) + len) % len
  return CATEGORY_PALETTE[idx]
}
