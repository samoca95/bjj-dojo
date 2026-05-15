import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, type AchievementCtx } from '../utils/achievements'
import type { Session, SessionTap } from '../types'

const makeSession = (id: number, date: number): Session => ({
  id,
  date,
  durationMinutes: 60,
  sessionType: 'GI',
  notes: '',
  energyLevel: 3,
})

function ctx(overrides: Partial<AchievementCtx>): AchievementCtx {
  return {
    sessions: [],
    taps: [],
    totalMinutes: 0,
    weeklyStreak: 0,
    dailyStreak: 0,
    level: 1,
    focusProgresses: [],
    goalSlayerCount: 0,
    now: 1000,
    ...overrides,
  }
}

const find = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!

describe('achievements', () => {
  it('First Steps unlocks at 1 session', () => {
    expect(find('firstSteps').isEarned(ctx({ sessions: [] }))).toBe(false)
    expect(
      find('firstSteps').isEarned(ctx({ sessions: [makeSession(1, 1)] })),
    ).toBe(true)
  })

  it('Tap Master needs 50 given taps', () => {
    const taps: SessionTap[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      sessionId: 1,
      techniqueId: 1,
      type: 'given',
    }))
    expect(find('tapMaster').isEarned(ctx({ taps }))).toBe(true)
  })

  it('Defensive Wizard needs 7 most-recent sessions without received tap', () => {
    const sessions = Array.from({ length: 7 }, (_, i) =>
      makeSession(i + 1, (i + 1) * 1000),
    )
    expect(find('defensiveWizard').isEarned(ctx({ sessions, taps: [] }))).toBe(
      true,
    )

    const taps: SessionTap[] = [
      { id: 1, sessionId: 7, techniqueId: 1, type: 'received' },
    ]
    expect(find('defensiveWizard').isEarned(ctx({ sessions, taps }))).toBe(
      false,
    )
  })

  it('Focused needs 3 focus progresses at-or-above target', () => {
    const focusProgresses = [
      { current: 5, target: 5, pct: 100, type: 'tapsGiven' as const },
      { current: 3, target: 3, pct: 100, type: 'manual' as const },
      { current: 2, target: 5, pct: 40, type: 'drilled' as const },
    ]
    expect(find('focused').isEarned(ctx({ focusProgresses }))).toBe(false)
    focusProgresses[2].current = 5
    expect(find('focused').isEarned(ctx({ focusProgresses }))).toBe(true)
  })
})
