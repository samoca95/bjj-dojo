import { describe, it, expect } from 'vitest'
import { computeFocusProgress } from '../utils/focusGoals'
import type { Session, SessionTap, SessionTechnique } from '../types'

const baseSession = (id: number, date: number): Session => ({
  id,
  date,
  durationMinutes: 60,
  sessionType: 'GI',
  notes: '',
  energyLevel: 3,
})

describe('computeFocusProgress', () => {
  it('counts taps given for the technique', () => {
    const taps: SessionTap[] = [
      { id: 1, sessionId: 1, techniqueId: 10, type: 'given' },
      { id: 2, sessionId: 1, techniqueId: 10, type: 'given' },
      { id: 3, sessionId: 1, techniqueId: 11, type: 'given' },
      { id: 4, sessionId: 1, techniqueId: 10, type: 'received' },
    ]
    const r = computeFocusProgress({ type: 'tapsGiven', target: 5 }, 10, {
      sessions: [],
      sessionTechniques: [],
      taps,
      manualCount: 0,
    })
    expect(r.current).toBe(2)
    expect(r.target).toBe(5)
    expect(r.pct).toBe(40)
  })

  it('counts drilled (sessionTechniques) for the technique', () => {
    const sts: SessionTechnique[] = [
      { sessionId: 1, techniqueId: 10 },
      { sessionId: 2, techniqueId: 10 },
      { sessionId: 3, techniqueId: 11 },
    ]
    const r = computeFocusProgress({ type: 'drilled', target: 3 }, 10, {
      sessions: [],
      sessionTechniques: sts,
      taps: [],
      manualCount: 0,
    })
    expect(r.current).toBe(2)
  })

  it('uses manual count for manual goal', () => {
    const r = computeFocusProgress({ type: 'manual', target: 10 }, 10, {
      sessions: [],
      sessionTechniques: [],
      taps: [],
      manualCount: 7,
    })
    expect(r.current).toBe(7)
    expect(r.pct).toBe(70)
  })

  it('counts unique sessions where technique appears (sessions type)', () => {
    const sts: SessionTechnique[] = [
      { sessionId: 1, techniqueId: 10 },
      { sessionId: 2, techniqueId: 10 },
    ]
    const taps: SessionTap[] = [
      { id: 1, sessionId: 2, techniqueId: 10, type: 'given' },
      { id: 2, sessionId: 3, techniqueId: 10, type: 'given' },
    ]
    const r = computeFocusProgress({ type: 'sessions', target: 5 }, 10, {
      sessions: [],
      sessionTechniques: sts,
      taps,
      manualCount: 0,
    })
    expect(r.current).toBe(3)
  })

  it('counts consecutive sessions since last received tap', () => {
    const sessions = [
      baseSession(1, 1000),
      baseSession(2, 2000),
      baseSession(3, 3000),
      baseSession(4, 4000),
    ]
    const taps: SessionTap[] = [
      { id: 1, sessionId: 2, techniqueId: 10, type: 'received' },
    ]
    const r = computeFocusProgress(
      { type: 'sessionsSinceTap', target: 5 },
      10,
      { sessions, sessionTechniques: [], taps, manualCount: 0 },
    )
    expect(r.current).toBe(2)
  })

  it('sessionsSinceTap resets to 0 when last session has the received tap', () => {
    const sessions = [baseSession(1, 1000), baseSession(2, 2000)]
    const taps: SessionTap[] = [
      { id: 1, sessionId: 2, techniqueId: 10, type: 'received' },
    ]
    const r = computeFocusProgress(
      { type: 'sessionsSinceTap', target: 5 },
      10,
      { sessions, sessionTechniques: [], taps, manualCount: 0 },
    )
    expect(r.current).toBe(0)
  })

  it('caps pct at 100', () => {
    const r = computeFocusProgress({ type: 'manual', target: 5 }, 10, {
      sessions: [],
      sessionTechniques: [],
      taps: [],
      manualCount: 99,
    })
    expect(r.pct).toBe(100)
  })
})
