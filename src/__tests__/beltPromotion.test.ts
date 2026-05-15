import { describe, it, expect, beforeEach } from 'vitest'
import {
  recordBeltChange,
  getBeltHistory,
  wasPromotedWithinLastWeek,
  BELT_HISTORY_STORAGE_KEY,
} from '../utils/beltPromotion'
import {
  setBeltColor,
  setBeltStripes,
  getBeltStripes,
  BELT_STORAGE_KEY,
  STRIPES_STORAGE_KEY,
} from '../utils/beltRank'

beforeEach(() => {
  window.localStorage.removeItem(BELT_HISTORY_STORAGE_KEY)
  window.localStorage.removeItem(BELT_STORAGE_KEY)
  window.localStorage.removeItem(STRIPES_STORAGE_KEY)
})

describe('recordBeltChange', () => {
  it('does not stamp on first ever change (no prior history)', () => {
    const r = recordBeltChange({ color: 'white', stripes: 0 }, 1000)
    expect(r.promoted).toBe(false)
    expect(getBeltHistory()?.promotedAt).toBe(null)
  })

  it('forces stripes reset and stamps on color promotion', () => {
    recordBeltChange({ color: 'blue', stripes: 3 }, 1000)
    const r = recordBeltChange({ color: 'purple', stripes: 3 }, 2000)
    expect(r.promoted).toBe(true)
    expect(r.forceStripesReset).toBe(true)
    const snap = getBeltHistory()
    expect(snap?.color).toBe('purple')
    expect(snap?.stripes).toBe(0)
    expect(snap?.promotedAt).toBe(2000)
  })

  it('stamps on stripe increase without resetting', () => {
    recordBeltChange({ color: 'blue', stripes: 1 }, 1000)
    const r = recordBeltChange({ color: 'blue', stripes: 2 }, 2000)
    expect(r.promoted).toBe(true)
    expect(r.forceStripesReset).toBe(false)
    expect(getBeltHistory()?.stripes).toBe(2)
  })

  it('does not stamp on downgrade and preserves prior promotedAt', () => {
    recordBeltChange({ color: 'blue', stripes: 0 }, 500)
    recordBeltChange({ color: 'purple', stripes: 0 }, 1000) // stamps at 1000
    const r = recordBeltChange({ color: 'blue', stripes: 4 }, 2000)
    expect(r.promoted).toBe(false)
    expect(getBeltHistory()?.promotedAt).toBe(1000)
  })
})

describe('wasPromotedWithinLastWeek', () => {
  it('returns false with no promotion stamp', () => {
    expect(wasPromotedWithinLastWeek(1000)).toBe(false)
  })

  it('returns true within 7 days', () => {
    recordBeltChange({ color: 'blue', stripes: 0 }, 1000)
    recordBeltChange({ color: 'purple', stripes: 0 }, 2000)
    expect(wasPromotedWithinLastWeek(2000 + 6 * 24 * 60 * 60 * 1000)).toBe(true)
  })

  it('returns false after 7 days', () => {
    recordBeltChange({ color: 'blue', stripes: 0 }, 1000)
    recordBeltChange({ color: 'purple', stripes: 0 }, 2000)
    expect(wasPromotedWithinLastWeek(2000 + 8 * 24 * 60 * 60 * 1000)).toBe(
      false,
    )
  })
})

describe('setBeltColor integration', () => {
  it('resets stripes to 0 when promoting belt color', () => {
    setBeltColor('blue')
    setBeltStripes(3)
    expect(getBeltStripes()).toBe(3)
    setBeltColor('purple')
    expect(getBeltStripes()).toBe(0)
  })
})
