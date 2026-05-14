import type { Category } from '../types'
import { db } from './database'

let _cache: Map<number, Category> | null = null

/**
 * Returns all categories as a Map keyed by id.
 * Populated on first call; subsequent calls return the cached Map while
 * still touching db.categories.count() so useLiveQuery keeps observing
 * the table and re-runs when categories are mutated.
 */
export async function getCategoryMap(): Promise<Map<number, Category>> {
  if (_cache) {
    await db.categories.count()
    return _cache
  }
  const cats = await db.categories.orderBy('name').toArray()
  _cache = new Map(cats.map((c) => [c.id, c]))
  return _cache
}

export function invalidateCategoryCache(): void {
  _cache = null
}
