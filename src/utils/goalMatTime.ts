import { notifyPreferenceMutation } from './autoBackup/notify'

export const GOAL_MAT_TIME_STORAGE_KEY = 'bjj-dojo:goal-mat-time'
export const DEFAULT_WEEKLY_GOAL_MINUTES = 180

export function getGoalMatTime(): number {
  if (typeof window === 'undefined') return DEFAULT_WEEKLY_GOAL_MINUTES
  const raw = window.localStorage.getItem(GOAL_MAT_TIME_STORAGE_KEY)
  const n = Number(raw)
  return n > 0 && Number.isFinite(n) ? n : DEFAULT_WEEKLY_GOAL_MINUTES
}

export function setGoalMatTime(minutes: number) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(GOAL_MAT_TIME_STORAGE_KEY, String(minutes))
  notifyPreferenceMutation()
}
