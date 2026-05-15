import type { Session } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(epoch: number): number {
  const d = new Date(epoch)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface DailyStreak {
  current: number
  longest: number
}

export function computeDailyStreak(
  sessions: Session[],
  now: number = Date.now(),
): DailyStreak {
  const days = new Set<number>()
  for (const s of sessions) days.add(startOfDay(s.date))
  if (days.size === 0) return { current: 0, longest: 0 }

  const today = startOfDay(now)

  let cursor = today
  if (!days.has(cursor)) cursor -= DAY_MS

  let current = 0
  while (days.has(cursor)) {
    current += 1
    cursor -= DAY_MS
  }

  const sorted = [...days].sort((a, b) => a - b)
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] === sorted[i - 1] + DAY_MS) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  return { current, longest: Math.max(longest, current) }
}
