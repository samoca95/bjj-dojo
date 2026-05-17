import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Calendar,
  Crown,
  Flame,
  Hand,
  Medal,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Sword,
  Target,
  Zap,
} from 'lucide-react'
import type { Session, SessionTap } from '../types'
import type { TranslationKey } from '../i18n'
import type { FocusProgress } from './focusGoals'
import { wasPromotedWithinLastWeek } from './beltPromotion'
import { notifyPreferenceMutation } from './autoBackup/notify'

export interface AchievementCtx {
  sessions: Session[]
  taps: SessionTap[]
  totalMinutes: number
  weeklyStreak: number
  dailyStreak: number
  level: number
  focusProgresses: FocusProgress[]
  goalSlayerCount: number
  now: number
}

export interface Achievement {
  id: string
  titleKey: TranslationKey
  descKey: TranslationKey
  icon: LucideIcon
  color: string
  isEarned(ctx: AchievementCtx): boolean
  progress?(ctx: AchievementCtx): { current: number; target: number }
}

const givenTapCount = (ctx: AchievementCtx) =>
  ctx.taps.filter((t) => t.type === 'given').length

function consecutiveSessionsWithoutReceivedTap(ctx: AchievementCtx): number {
  const sorted = [...ctx.sessions].sort((a, b) => b.date - a.date)
  let count = 0
  for (const s of sorted) {
    const sid = s.id
    if (sid == null) continue
    const hadReceived = ctx.taps.some(
      (t) => t.type === 'received' && t.sessionId === sid,
    )
    if (hadReceived) break
    count += 1
  }
  return count
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'firstSteps',
    titleKey: 'First Steps',
    descKey: 'Log your first training session.',
    icon: Star,
    color: 'text-amber-300 bg-amber-500/20',
    isEarned: (c) => c.sessions.length >= 1,
    progress: (c) => ({ current: Math.min(1, c.sessions.length), target: 1 }),
  },
  {
    id: 'onTheMat',
    titleKey: 'On the Mat',
    descKey: 'Log 10 training sessions.',
    icon: Calendar,
    color: 'text-sky-300 bg-sky-500/20',
    isEarned: (c) => c.sessions.length >= 10,
    progress: (c) => ({ current: Math.min(10, c.sessions.length), target: 10 }),
  },
  {
    id: 'matVeteran',
    titleKey: 'Mat Veteran',
    descKey: 'Log 100 training sessions.',
    icon: Medal,
    color: 'text-violet-300 bg-violet-500/20',
    isEarned: (c) => c.sessions.length >= 100,
    progress: (c) => ({
      current: Math.min(100, c.sessions.length),
      target: 100,
    }),
  },
  {
    id: 'tenHours',
    titleKey: 'Ten Hours',
    descKey: 'Train 10 hours total.',
    icon: Mountain,
    color: 'text-emerald-300 bg-emerald-500/20',
    isEarned: (c) => c.totalMinutes >= 600,
    progress: (c) => ({ current: Math.min(600, c.totalMinutes), target: 600 }),
  },
  {
    id: 'century',
    titleKey: 'Century',
    descKey: 'Train 100 hours total.',
    icon: Crown,
    color: 'text-yellow-300 bg-yellow-500/20',
    isEarned: (c) => c.totalMinutes >= 6000,
    progress: (c) => ({
      current: Math.min(6000, c.totalMinutes),
      target: 6000,
    }),
  },
  {
    id: 'firstSubmission',
    titleKey: 'First Submission',
    descKey: 'Submit your first training partner.',
    icon: Zap,
    color: 'text-green-300 bg-green-500/20',
    isEarned: (c) => givenTapCount(c) >= 1,
    progress: (c) => ({
      current: Math.min(1, givenTapCount(c)),
      target: 1,
    }),
  },
  {
    id: 'tapMaster',
    titleKey: 'Tap Master',
    descKey: 'Get 50 submissions.',
    icon: Sword,
    color: 'text-rose-300 bg-rose-500/20',
    isEarned: (c) => givenTapCount(c) >= 50,
    progress: (c) => ({
      current: Math.min(50, givenTapCount(c)),
      target: 50,
    }),
  },
  {
    id: 'defensiveWizard',
    titleKey: 'Defensive Wizard',
    descKey: 'Survive 7 sessions in a row without getting submitted.',
    icon: Shield,
    color: 'text-indigo-300 bg-indigo-500/20',
    isEarned: (c) => consecutiveSessionsWithoutReceivedTap(c) >= 7,
    progress: (c) => ({
      current: Math.min(7, consecutiveSessionsWithoutReceivedTap(c)),
      target: 7,
    }),
  },
  {
    id: 'weekWarrior',
    titleKey: 'Week Warrior',
    descKey: 'Reach a 4-week training streak.',
    icon: Flame,
    color: 'text-orange-300 bg-orange-500/20',
    isEarned: (c) => c.weeklyStreak >= 4,
    progress: (c) => ({ current: Math.min(4, c.weeklyStreak), target: 4 }),
  },
  {
    id: 'dailyDevotee',
    titleKey: 'Daily Devotee',
    descKey: 'Reach a 7-day training streak.',
    icon: Hand,
    color: 'text-cyan-300 bg-cyan-500/20',
    isEarned: (c) => c.dailyStreak >= 7,
    progress: (c) => ({ current: Math.min(7, c.dailyStreak), target: 7 }),
  },
  {
    id: 'focused',
    titleKey: 'Focused',
    descKey: 'Hit 3 focus-technique goals at the same time.',
    icon: Target,
    color: 'text-gold bg-gold/20',
    isEarned: (c) =>
      c.focusProgresses.filter((p) => p.current >= p.target).length >= 3,
    progress: (c) => ({
      current: Math.min(
        3,
        c.focusProgresses.filter((p) => p.current >= p.target).length,
      ),
      target: 3,
    }),
  },
  {
    id: 'goalSlayer',
    titleKey: 'Goal Slayer',
    descKey: 'Complete any focus-technique goal.',
    icon: Sparkles,
    color: 'text-fuchsia-300 bg-fuchsia-500/20',
    isEarned: (c) => c.goalSlayerCount >= 1,
    progress: (c) => ({
      current: Math.min(1, c.goalSlayerCount),
      target: 1,
    }),
  },
  {
    id: 'beltPromoted',
    titleKey: 'Belt Promoted',
    descKey: 'Earned a new belt or stripe in the last 7 days.',
    icon: Award,
    color: 'text-red-300 bg-red-500/20',
    isEarned: (c) => wasPromotedWithinLastWeek(c.now),
  },
]

export const ACHIEVEMENTS_META_KEY = 'bjj-dojo:achievements-meta'
export const ACHIEVEMENTS_UPDATED_EVENT = 'bjj-dojo:achievements-updated'

export interface AchievementsMeta {
  earnedAt: Record<string, number>
  goalSlayerCount: number
  completedGoalKeys: string[]
}

const DEFAULT_META: AchievementsMeta = {
  earnedAt: {},
  goalSlayerCount: 0,
  completedGoalKeys: [],
}

export function getAchievementsMeta(): AchievementsMeta {
  if (typeof window === 'undefined') return { ...DEFAULT_META }
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_META_KEY)
    if (!raw) return { ...DEFAULT_META }
    const parsed = JSON.parse(raw)
    return {
      earnedAt:
        parsed && typeof parsed.earnedAt === 'object'
          ? (parsed.earnedAt as Record<string, number>)
          : {},
      goalSlayerCount:
        Number(parsed?.goalSlayerCount) >= 0
          ? Math.floor(Number(parsed.goalSlayerCount))
          : 0,
      completedGoalKeys: Array.isArray(parsed?.completedGoalKeys)
        ? (parsed.completedGoalKeys as string[]).filter(
            (s) => typeof s === 'string',
          )
        : [],
    }
  } catch {
    return { ...DEFAULT_META }
  }
}

function writeMeta(meta: AchievementsMeta) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACHIEVEMENTS_META_KEY, JSON.stringify(meta))
  window.dispatchEvent(new Event(ACHIEVEMENTS_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export function trackGoalCompletions(
  completedKeys: string[],
): AchievementsMeta {
  const meta = getAchievementsMeta()
  const known = new Set(meta.completedGoalKeys)
  let added = 0
  for (const key of completedKeys) {
    if (!known.has(key)) {
      known.add(key)
      added += 1
    }
  }
  if (added === 0) return meta
  const next: AchievementsMeta = {
    ...meta,
    goalSlayerCount: meta.goalSlayerCount + added,
    completedGoalKeys: [...known],
  }
  writeMeta(next)
  return next
}

export function recomputeEarned(ctx: AchievementCtx): Record<string, number> {
  const meta = getAchievementsMeta()
  const earnedAt = { ...meta.earnedAt }
  let changed = false
  for (const a of ACHIEVEMENTS) {
    if (a.isEarned(ctx)) {
      if (earnedAt[a.id] == null) {
        earnedAt[a.id] = ctx.now
        changed = true
      }
    } else if (a.id === 'beltPromoted' && earnedAt[a.id] != null) {
      delete earnedAt[a.id]
      changed = true
    }
  }
  if (changed) writeMeta({ ...meta, earnedAt })
  return earnedAt
}
