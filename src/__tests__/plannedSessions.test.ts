import { describe, it, expect, beforeEach } from 'vitest'
import {
  PLANNED_SESSIONS_ROLLOVER_KEY,
  PLANNED_SESSIONS_STORAGE_KEY,
  addDays,
  cyclePlannedSession,
  getPlannedSessions,
  rolloverPlannedSessions,
  startOfDay,
  startOfWeek,
} from '../utils/plannedSessions'

beforeEach(() => {
  window.localStorage.clear()
})

describe('cyclePlannedSession', () => {
  it('cycles blank → gi → nogi → gym → stretch → blank', () => {
    const day = startOfDay(Date.now())
    cyclePlannedSession(day)
    expect(getPlannedSessions()[String(day)]).toBe('gi')
    cyclePlannedSession(day)
    expect(getPlannedSessions()[String(day)]).toBe('nogi')
    cyclePlannedSession(day)
    expect(getPlannedSessions()[String(day)]).toBe('gym')
    cyclePlannedSession(day)
    expect(getPlannedSessions()[String(day)]).toBe('stretch')
    cyclePlannedSession(day)
    expect(getPlannedSessions()[String(day)]).toBeUndefined()
  })
})

describe('rolloverPlannedSessions', () => {
  it('shifts previous-week plans onto current week on first call', () => {
    const now = Date.now()
    const currentWeekStart = startOfWeek(now)
    const prevWeekStart = startOfDay(addDays(currentWeekStart, -7))
    const prevWednesday = startOfDay(addDays(prevWeekStart, 2))
    const expectedTarget = startOfDay(addDays(prevWednesday, 7))

    window.localStorage.setItem(
      PLANNED_SESSIONS_STORAGE_KEY,
      JSON.stringify({ [String(prevWednesday)]: 'gi' }),
    )

    rolloverPlannedSessions(now)

    const map = getPlannedSessions()
    expect(map[String(prevWednesday)]).toBeUndefined()
    expect(map[String(expectedTarget)]).toBe('gi')
  })

  it('keeps existing current-week plan over rolled-over one', () => {
    const now = Date.now()
    const currentWeekStart = startOfWeek(now)
    const prevWeekStart = startOfDay(addDays(currentWeekStart, -7))
    const prevMonday = prevWeekStart
    const currentMonday = currentWeekStart

    window.localStorage.setItem(
      PLANNED_SESSIONS_STORAGE_KEY,
      JSON.stringify({
        [String(prevMonday)]: 'gi',
        [String(currentMonday)]: 'nogi',
      }),
    )

    rolloverPlannedSessions(now)

    expect(getPlannedSessions()[String(currentMonday)]).toBe('nogi')
  })

  it('drops plans older than the previous week', () => {
    const now = Date.now()
    const currentWeekStart = startOfWeek(now)
    const twoWeeksAgo = startOfDay(addDays(currentWeekStart, -14))

    window.localStorage.setItem(
      PLANNED_SESSIONS_STORAGE_KEY,
      JSON.stringify({ [String(twoWeeksAgo)]: 'gi' }),
    )

    rolloverPlannedSessions(now)

    expect(getPlannedSessions()[String(twoWeeksAgo)]).toBeUndefined()
  })

  it('is idempotent within the same week', () => {
    const now = Date.now()
    const currentWeekStart = startOfWeek(now)
    const prevMonday = startOfDay(addDays(currentWeekStart, -7))

    window.localStorage.setItem(
      PLANNED_SESSIONS_STORAGE_KEY,
      JSON.stringify({ [String(prevMonday)]: 'gi' }),
    )

    rolloverPlannedSessions(now)
    // Manually clear the migrated plan; a second call must NOT re-migrate.
    window.localStorage.setItem(
      PLANNED_SESSIONS_STORAGE_KEY,
      JSON.stringify({}),
    )
    rolloverPlannedSessions(now)

    expect(getPlannedSessions()).toEqual({})
    expect(window.localStorage.getItem(PLANNED_SESSIONS_ROLLOVER_KEY)).toBe(
      String(currentWeekStart),
    )
  })
})
