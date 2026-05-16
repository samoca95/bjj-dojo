export type PlannedSessionKind = 'gi' | 'nogi' | 'gym'

export const PLANNED_SESSIONS_STORAGE_KEY = 'bjj-dojo:planned-sessions'
export const PLANNED_SESSIONS_ROLLOVER_KEY =
  'bjj-dojo:planned-sessions-rollover'
export const PLANNED_SESSIONS_UPDATED_EVENT =
  'bjj-dojo:planned-sessions-updated'

export type PlannedSessionsMap = Record<string, PlannedSessionKind>

const VALID: PlannedSessionKind[] = ['gi', 'nogi', 'gym']
const CYCLE: (PlannedSessionKind | null)[] = [null, 'gi', 'nogi', 'gym']

export function startOfDay(epoch: number): number {
  const d = new Date(epoch)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfWeek(epoch: number): number {
  const d = new Date(epoch)
  d.setHours(0, 0, 0, 0)
  const offset = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - offset)
  return d.getTime()
}

export function addDays(epoch: number, days: number): number {
  const d = new Date(epoch)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

function sanitize(value: unknown): PlannedSessionsMap {
  if (!value || typeof value !== 'object') return {}
  const result: PlannedSessionsMap = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!/^-?\d+$/.test(k)) continue
    if (typeof v === 'string' && (VALID as string[]).includes(v)) {
      result[k] = v as PlannedSessionKind
    }
  }
  return result
}

export function getPlannedSessions(): PlannedSessionsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PLANNED_SESSIONS_STORAGE_KEY)
    if (!raw) return {}
    return sanitize(JSON.parse(raw))
  } catch {
    return {}
  }
}

function writePlannedSessions(map: PlannedSessionsMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PLANNED_SESSIONS_STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event(PLANNED_SESSIONS_UPDATED_EVENT))
}

export function cyclePlannedSession(dayEpoch: number) {
  const key = String(startOfDay(dayEpoch))
  const map = getPlannedSessions()
  const current = map[key] ?? null
  const nextIndex = (CYCLE.indexOf(current) + 1) % CYCLE.length
  const next = CYCLE[nextIndex]
  if (next === null) delete map[key]
  else map[key] = next
  writePlannedSessions(map)
}

/**
 * On the first app open each week, shift any plans from the previous week
 * onto the matching weekday of the current week, and drop plans older than
 * that. Current/future plans are kept and take precedence over rolled-over
 * ones if both exist for the same day.
 */
export function rolloverPlannedSessions(now: number = Date.now()): void {
  if (typeof window === 'undefined') return
  const currentWeekStart = startOfWeek(now)
  const marker = String(currentWeekStart)
  const last = window.localStorage.getItem(PLANNED_SESSIONS_ROLLOVER_KEY)
  if (last === marker) return

  const previousWeekStart = startOfWeek(addDays(currentWeekStart, -7))
  const map = getPlannedSessions()
  const next: PlannedSessionsMap = {}

  for (const [key, value] of Object.entries(map)) {
    const ts = Number(key)
    if (Number.isNaN(ts)) continue
    if (ts >= currentWeekStart) {
      next[key] = value
    } else if (ts >= previousWeekStart && ts < currentWeekStart) {
      const shifted = String(startOfDay(addDays(ts, 7)))
      if (!next[shifted]) next[shifted] = value
    }
  }

  writePlannedSessions(next)
  window.localStorage.setItem(PLANNED_SESSIONS_ROLLOVER_KEY, marker)
}
