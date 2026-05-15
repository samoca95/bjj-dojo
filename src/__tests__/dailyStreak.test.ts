import { describe, it, expect } from 'vitest'
import { computeDailyStreak } from '../utils/dailyStreak'
import type { Session } from '../types'

const DAY = 24 * 60 * 60 * 1000

function makeSession(date: number, id = date): Session {
  return {
    id,
    date,
    durationMinutes: 60,
    sessionType: 'GI',
    notes: '',
    energyLevel: 3,
  }
}

describe('computeDailyStreak', () => {
  it('returns zero on empty input', () => {
    expect(computeDailyStreak([], 0)).toEqual({ current: 0, longest: 0 })
  })

  it('counts consecutive days backwards from today', () => {
    const now = new Date(2026, 4, 15, 10, 0, 0).getTime()
    const sessions = [
      makeSession(now),
      makeSession(now - DAY),
      makeSession(now - 2 * DAY),
    ]
    const r = computeDailyStreak(sessions, now)
    expect(r.current).toBe(3)
  })

  it('does not break the streak if today is empty', () => {
    const now = new Date(2026, 4, 15, 10, 0, 0).getTime()
    const sessions = [makeSession(now - DAY), makeSession(now - 2 * DAY)]
    const r = computeDailyStreak(sessions, now)
    expect(r.current).toBe(2)
  })

  it('breaks streak with a gap', () => {
    const now = new Date(2026, 4, 15, 10, 0, 0).getTime()
    const sessions = [
      makeSession(now),
      makeSession(now - 2 * DAY),
      makeSession(now - 3 * DAY),
    ]
    const r = computeDailyStreak(sessions, now)
    expect(r.current).toBe(1)
  })

  it('reports longest historical streak', () => {
    const now = new Date(2026, 4, 15, 10, 0, 0).getTime()
    const sessions = [
      makeSession(now),
      makeSession(now - 10 * DAY),
      makeSession(now - 11 * DAY),
      makeSession(now - 12 * DAY),
      makeSession(now - 13 * DAY),
    ]
    const r = computeDailyStreak(sessions, now)
    expect(r.longest).toBeGreaterThanOrEqual(4)
  })
})
