import type {
  Session,
  SessionTap,
  SessionTechnique,
  SessionFlow,
  SessionFlowTap,
} from '../types'
import { notifyPreferenceMutation } from './autoBackup/notify'

export type FocusGoalType =
  | 'sessions'
  | 'tapsGiven'
  | 'drilled'
  | 'manual'
  | 'sessionsSinceTap'

export interface FocusGoal {
  type: FocusGoalType
  target: number
}

export const FOCUS_GOALS_STORAGE_KEY = 'bjj-dojo:focus-goals'
export const FOCUS_MANUAL_COUNTS_STORAGE_KEY = 'bjj-dojo:focus-manual-counts'
export const FOCUS_GOALS_UPDATED_EVENT = 'bjj-dojo:focus-goals-updated'

export const FOCUS_GOAL_TYPES: FocusGoalType[] = [
  'sessions',
  'tapsGiven',
  'drilled',
  'manual',
  'sessionsSinceTap',
]

const VALID_TYPES = new Set<FocusGoalType>(FOCUS_GOAL_TYPES)

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(FOCUS_GOALS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export function getFocusGoals(): Record<number, FocusGoal> {
  const raw = readJSON<Record<string, unknown>>(FOCUS_GOALS_STORAGE_KEY, {})
  const result: Record<number, FocusGoal> = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    if (!Number.isInteger(id) || id <= 0) continue
    if (!value || typeof value !== 'object') continue
    const v = value as { type?: unknown; target?: unknown }
    if (typeof v.type !== 'string' || !VALID_TYPES.has(v.type as FocusGoalType))
      continue
    const target = Number(v.target)
    if (!Number.isFinite(target) || target <= 0) continue
    result[id] = { type: v.type as FocusGoalType, target: Math.floor(target) }
  }
  return result
}

export function setFocusGoal(techniqueId: number, goal: FocusGoal) {
  const all = getFocusGoals()
  all[techniqueId] = {
    type: goal.type,
    target: Math.max(1, Math.floor(goal.target)),
  }
  writeJSON(FOCUS_GOALS_STORAGE_KEY, all)
}

export function clearFocusGoal(techniqueId: number) {
  const all = getFocusGoals()
  delete all[techniqueId]
  writeJSON(FOCUS_GOALS_STORAGE_KEY, all)
}

export function getManualCounts(): Record<number, number> {
  const raw = readJSON<Record<string, unknown>>(
    FOCUS_MANUAL_COUNTS_STORAGE_KEY,
    {},
  )
  const result: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    const n = Number(value)
    if (!Number.isInteger(id) || id <= 0) continue
    if (!Number.isFinite(n) || n < 0) continue
    result[id] = Math.floor(n)
  }
  return result
}

export function getManualCount(techniqueId: number): number {
  return getManualCounts()[techniqueId] ?? 0
}

export function incrementManualCount(techniqueId: number, delta = 1) {
  const all = getManualCounts()
  const next = Math.max(0, (all[techniqueId] ?? 0) + delta)
  all[techniqueId] = next
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    FOCUS_MANUAL_COUNTS_STORAGE_KEY,
    JSON.stringify(all),
  )
  window.dispatchEvent(new Event(FOCUS_GOALS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export function resetManualCount(techniqueId: number) {
  const all = getManualCounts()
  delete all[techniqueId]
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    FOCUS_MANUAL_COUNTS_STORAGE_KEY,
    JSON.stringify(all),
  )
  window.dispatchEvent(new Event(FOCUS_GOALS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

// ─── Flow goal storage (separate keys to avoid ID collision with techniques) ─

export const FOCUS_FLOW_GOALS_STORAGE_KEY = 'bjj-dojo:focus-flow-goals'
export const FOCUS_FLOW_MANUAL_COUNTS_STORAGE_KEY =
  'bjj-dojo:focus-flow-manual-counts'

export function getFocusFlowGoals(): Record<number, FocusGoal> {
  const raw = readJSON<Record<string, unknown>>(FOCUS_FLOW_GOALS_STORAGE_KEY, {})
  const result: Record<number, FocusGoal> = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    if (!Number.isInteger(id) || id <= 0) continue
    if (!value || typeof value !== 'object') continue
    const v = value as { type?: unknown; target?: unknown }
    if (typeof v.type !== 'string' || !VALID_TYPES.has(v.type as FocusGoalType))
      continue
    const target = Number(v.target)
    if (!Number.isFinite(target) || target <= 0) continue
    result[id] = { type: v.type as FocusGoalType, target: Math.floor(target) }
  }
  return result
}

export function setFocusFlowGoal(flowId: number, goal: FocusGoal) {
  const all = getFocusFlowGoals()
  all[flowId] = {
    type: goal.type,
    target: Math.max(1, Math.floor(goal.target)),
  }
  writeJSON(FOCUS_FLOW_GOALS_STORAGE_KEY, all)
}

export function clearFocusFlowGoal(flowId: number) {
  const all = getFocusFlowGoals()
  delete all[flowId]
  writeJSON(FOCUS_FLOW_GOALS_STORAGE_KEY, all)
}

function getFlowManualCounts(): Record<number, number> {
  const raw = readJSON<Record<string, unknown>>(
    FOCUS_FLOW_MANUAL_COUNTS_STORAGE_KEY,
    {},
  )
  const result: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    const n = Number(value)
    if (!Number.isInteger(id) || id <= 0) continue
    if (!Number.isFinite(n) || n < 0) continue
    result[id] = Math.floor(n)
  }
  return result
}

export function getFlowManualCount(flowId: number): number {
  return getFlowManualCounts()[flowId] ?? 0
}

export function incrementFlowManualCount(flowId: number, delta = 1) {
  const all = getFlowManualCounts()
  const next = Math.max(0, (all[flowId] ?? 0) + delta)
  all[flowId] = next
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    FOCUS_FLOW_MANUAL_COUNTS_STORAGE_KEY,
    JSON.stringify(all),
  )
  window.dispatchEvent(new Event(FOCUS_GOALS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export function resetFlowManualCount(flowId: number) {
  const all = getFlowManualCounts()
  delete all[flowId]
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    FOCUS_FLOW_MANUAL_COUNTS_STORAGE_KEY,
    JSON.stringify(all),
  )
  window.dispatchEvent(new Event(FOCUS_GOALS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export interface FocusProgress {
  current: number
  target: number
  pct: number
  type: FocusGoalType
}

export function computeFocusProgress(
  goal: FocusGoal,
  techniqueId: number,
  data: {
    sessions: Session[]
    sessionTechniques: SessionTechnique[]
    taps: SessionTap[]
    manualCount: number
  },
): FocusProgress {
  const { sessions, sessionTechniques, taps, manualCount } = data
  let current = 0

  switch (goal.type) {
    case 'tapsGiven':
      current = taps.filter(
        (t) => t.type === 'given' && t.techniqueId === techniqueId,
      ).length
      break
    case 'drilled':
      current = sessionTechniques.filter(
        (st) => st.techniqueId === techniqueId,
      ).length
      break
    case 'manual':
      current = manualCount
      break
    case 'sessions': {
      const ids = new Set<number>()
      for (const st of sessionTechniques) {
        if (st.techniqueId === techniqueId) ids.add(st.sessionId)
      }
      for (const tap of taps) {
        if (tap.type === 'given' && tap.techniqueId === techniqueId)
          ids.add(tap.sessionId)
      }
      current = ids.size
      break
    }
    case 'sessionsSinceTap': {
      const sortedDesc = [...sessions].sort((a, b) => b.date - a.date)
      let count = 0
      for (const s of sortedDesc) {
        const sid = s.id
        if (sid == null) continue
        const wasSubmitted = taps.some(
          (t) =>
            t.type === 'received' &&
            t.techniqueId === techniqueId &&
            t.sessionId === sid,
        )
        if (wasSubmitted) break
        count += 1
      }
      current = count
      break
    }
  }

  const target = Math.max(1, goal.target)
  const pct = Math.min(100, Math.round((current / target) * 100))
  return { current, target, pct, type: goal.type }
}

export function computeFocusProgressForFlow(
  goal: FocusGoal,
  flowId: number,
  data: {
    sessions: Session[]
    sessionFlows: SessionFlow[]
    sessionFlowTaps: SessionFlowTap[]
    manualCount: number
  },
): FocusProgress {
  const { sessions, sessionFlows, sessionFlowTaps, manualCount } = data
  let current = 0

  switch (goal.type) {
    case 'tapsGiven':
      current = sessionFlowTaps.filter(
        (t) => t.type === 'given' && t.flowId === flowId,
      ).length
      break
    case 'drilled':
      current = sessionFlows.filter((sf) => sf.flowId === flowId).length
      break
    case 'manual':
      current = manualCount
      break
    case 'sessions': {
      const ids = new Set<number>()
      for (const sf of sessionFlows) {
        if (sf.flowId === flowId) ids.add(sf.sessionId)
      }
      for (const tap of sessionFlowTaps) {
        if (tap.type === 'given' && tap.flowId === flowId) ids.add(tap.sessionId)
      }
      current = ids.size
      break
    }
    case 'sessionsSinceTap': {
      const sortedDesc = [...sessions].sort((a, b) => b.date - a.date)
      let count = 0
      for (const s of sortedDesc) {
        const sid = s.id
        if (sid == null) continue
        const wasSubmitted = sessionFlowTaps.some(
          (t) =>
            t.type === 'received' && t.flowId === flowId && t.sessionId === sid,
        )
        if (wasSubmitted) break
        count += 1
      }
      current = count
      break
    }
  }

  const target = Math.max(1, goal.target)
  const pct = Math.min(100, Math.round((current / target) * 100))
  return { current, target, pct, type: goal.type }
}
