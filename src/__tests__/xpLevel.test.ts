import { describe, it, expect } from 'vitest'
import { computeXp, computeLevel, xpRequiredForLevel } from '../utils/xpLevel'

describe('computeXp', () => {
  it('floors mat-time XP to integers (1 per 15 min)', () => {
    expect(computeXp({ totalMinutes: 75, givenTaps: 0, sessionCount: 0 })).toBe(
      5,
    )
    expect(computeXp({ totalMinutes: 14, givenTaps: 0, sessionCount: 0 })).toBe(
      0,
    )
  })

  it('combines mat, tap, and session XP', () => {
    const xp = computeXp({ totalMinutes: 60, givenTaps: 3, sessionCount: 2 })
    expect(xp).toBe(4 + 15 + 4)
  })
})

describe('computeLevel', () => {
  it('starts at level 1 with 0 XP', () => {
    const r = computeLevel(0)
    expect(r.level).toBe(1)
    expect(r.xpIntoLevel).toBe(0)
  })

  it('increases level when xp meets threshold', () => {
    const lv2Threshold = xpRequiredForLevel(2)
    const r = computeLevel(lv2Threshold)
    expect(r.level).toBe(2)
  })

  it('returns integer pct', () => {
    const r = computeLevel(50)
    expect(Number.isInteger(r.pct)).toBe(true)
    expect(r.pct).toBeGreaterThanOrEqual(0)
    expect(r.pct).toBeLessThanOrEqual(100)
  })
})
