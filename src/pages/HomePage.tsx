import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  BookOpen,
  ChevronRight,
  Flame,
  Crosshair,
  Zap,
  Hand,
  Pencil,
  Plus,
  Minus,
  Trophy,
  Sparkles,
  X,
} from 'lucide-react'
import { db } from '../db/database'
import { useI18n, withLocalizedName, type TranslationKey } from '../i18n'
import ErrorBoundary from '../components/ErrorBoundary'
import { BELT } from '../constants/themeColors'
import { getGoalMatTime } from '../utils/goalMatTime'
import {
  getFocusTechniqueIds,
  setFocusTechniqueIds,
} from '../utils/focusTechniques'
import { techniqueMatchesQuery, techniqueScore } from '../utils/fuzzySearch'
import TrainingCalendar from '../components/TrainingCalendar'
import { CategoryIcon } from '../components/CategoryIcon'
import {
  getHomeSectionOrder,
  getHomeSectionVisibility,
  HOME_SECTION_ORDER_UPDATED_EVENT,
  type HomeSectionId,
} from '../utils/homeSectionOrder'
import {
  getBeltColor,
  getBeltStripes,
  BELT_RANK_UPDATED_EVENT,
  type BeltColor,
} from '../utils/beltRank'
import {
  getFocusGoals,
  setFocusGoal,
  clearFocusGoal,
  getManualCount,
  incrementManualCount,
  computeFocusProgress,
  FOCUS_GOAL_TYPES,
  FOCUS_GOALS_UPDATED_EVENT,
  type FocusGoal,
  type FocusGoalType,
  type FocusProgress,
} from '../utils/focusGoals'
import { computeDailyStreak } from '../utils/dailyStreak'
import { computeRank } from '../utils/rankLadder'
import { computeXp, computeLevel } from '../utils/xpLevel'
import {
  ACHIEVEMENTS,
  recomputeEarned,
  trackGoalCompletions,
  getAchievementsMeta,
  ACHIEVEMENTS_UPDATED_EVENT,
  type AchievementCtx,
} from '../utils/achievements'
import {
  getCardVisible,
  setCardVisible,
  HOME_CARD_VISIBILITY_UPDATED_EVENT,
} from '../utils/homeCardVisibility'
import AchievementsCard from '../components/AchievementBadge'
import { PlainLogo } from '../components/PlainLogo'
import jujitsuKanjiHorizontal from '../../icons/jujitsu_kanji_horizontal.svg'

const DAY_MS = 24 * 60 * 60 * 1000

const BELT_STYLES: Record<
  BeltColor,
  { bg: string; text: string; activeStripe: string; dimStripe: string }
> = {
  white: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-900',
    activeStripe: 'bg-white',
    dimStripe: 'bg-transparent border border-zinc-400/70',
  },
  blue: {
    bg: 'bg-blue-600',
    text: 'text-white',
    activeStripe: 'bg-white',
    dimStripe: 'bg-transparent border border-zinc-400/60',
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-white',
    activeStripe: 'bg-white',
    dimStripe: 'bg-transparent border border-zinc-400/60',
  },
  brown: {
    bg: 'bg-amber-800',
    text: 'text-white',
    activeStripe: 'bg-white',
    dimStripe: 'bg-transparent border border-zinc-400/60',
  },
  black: {
    bg: 'bg-belt-black',
    text: 'text-white',
    activeStripe: 'bg-white',
    dimStripe: 'bg-transparent border border-red-300/40',
  },
}

function BeltDisplay({
  color,
  stripes,
  beltLabel,
}: {
  color: BeltColor
  stripes: number
  beltLabel: string
}) {
  const s = BELT_STYLES[color]
  const tipClass = color === 'black' ? 'bg-red-700' : 'bg-belt-black'
  const logoFill = color === 'black' ? BELT.redTip : BELT.black
  return (
    <div className="overflow-hidden rounded-xl flex h-10 belt-outline">
      <div className={`flex-1 flex items-center px-5 gap-2 ${s.bg}`}>
        <PlainLogo fill={logoFill} className="h-10 w-10 shrink-0" />
        <span
          className={`text-xs font-bold tracking-widest uppercase ${s.text}`}
        >
          {beltLabel}
        </span>
      </div>
      {/* Tip with stripes */}
      <div className={`flex items-center gap-2 px-4 ${tipClass}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-5 w-3 rounded-sm transition-colors ${i < stripes ? s.activeStripe : s.dimStripe}`}
          />
        ))}
      </div>
    </div>
  )
}

function startOfDay(epoch: number): number {
  const day = new Date(epoch)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

function startOfWeek(epoch: number): number {
  const day = new Date(epoch)
  day.setHours(0, 0, 0, 0)
  const dayOfWeek = day.getDay()
  const offset = (dayOfWeek + 6) % 7 // Monday = 0
  day.setDate(day.getDate() - offset)
  return day.getTime()
}

function SectionErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-zinc-400">{t('Section unavailable')}</span>
      <button onClick={onRetry} className="text-xs font-semibold text-gold">
        {t('Try again')}
      </button>
    </div>
  )
}

function SectionHeader({
  title,
  sectionId,
  editing,
  onToggleEdit,
  cards,
}: {
  title: string
  sectionId: string
  editing: boolean
  onToggleEdit: () => void
  cards: { id: string; label: string }[]
}) {
  return (
    <div className="px-1 mb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-gold">
          {title}
        </h2>
        <button
          onClick={onToggleEdit}
          aria-label="Edit cards"
          className={`p-1.5 -mr-1 rounded-lg ${
            editing ? 'bg-gold text-black' : 'text-zinc-500 active:bg-zinc-800'
          }`}
        >
          {editing ? <X size={14} /> : <Pencil size={14} />}
        </button>
      </div>
      {editing && <SectionCardEditor sectionId={sectionId} cards={cards} />}
    </div>
  )
}

function SectionCardEditor({
  sectionId,
  cards,
}: {
  sectionId: string
  cards: { id: string; label: string }[]
}) {
  const [, force] = useState(0)
  return (
    <div className="mt-2 bg-zinc-900 rounded-xl p-2 space-y-1">
      {cards.map((c) => {
        const visible = getCardVisible(sectionId, c.id, true)
        return (
          <button
            key={c.id}
            onClick={() => {
              setCardVisible(sectionId, c.id, !visible)
              force((n) => n + 1)
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left active:bg-zinc-800"
          >
            <span className="text-xs text-zinc-200">{c.label}</span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                visible ? 'text-gold' : 'text-zinc-500'
              }`}
            >
              {visible ? 'On' : 'Off'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function focusGoalLabel(type: FocusGoalType): TranslationKey {
  switch (type) {
    case 'sessions':
      return 'Sessions used in'
    case 'tapsGiven':
      return 'Taps given'
    case 'drilled':
      return 'Drilled'
    case 'manual':
      return 'Manual count'
    case 'sessionsSinceTap':
      return 'Sessions since last submitted'
  }
}

function FocusGoalEditor({
  techniqueId,
  goal,
  manualCount,
  onClose,
}: {
  techniqueId: number
  goal: FocusGoal | undefined
  manualCount: number
  onClose: () => void
}) {
  const { t } = useI18n()
  const [type, setType] = useState<FocusGoalType>(goal?.type ?? 'tapsGiven')
  const [target, setTarget] = useState<number>(goal?.target ?? 5)

  const save = (nextType: FocusGoalType, nextTarget: number) => {
    setFocusGoal(techniqueId, {
      type: nextType,
      target: Math.max(1, Math.floor(nextTarget)),
    })
  }

  return (
    <div className="border-t border-zinc-800 pt-3 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
          {t('Goal type')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_GOAL_TYPES.map((g) => (
            <button
              key={g}
              onClick={() => {
                setType(g)
                save(g, target)
              }}
              className={`text-[11px] px-2 py-1 rounded-lg ${
                type === g
                  ? 'bg-gold text-black font-semibold'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {t(focusGoalLabel(g))}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {t('Target')}
        </span>
        <button
          onClick={() => {
            const next = Math.max(1, target - 1)
            setTarget(next)
            save(type, next)
          }}
          className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-bold text-zinc-100 w-8 text-center tabular-nums">
          {target}
        </span>
        <button
          onClick={() => {
            const next = target + 1
            setTarget(next)
            save(type, next)
          }}
          className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center"
        >
          <Plus size={14} />
        </button>

        {type === 'manual' && (
          <button
            onClick={() => incrementManualCount(techniqueId)}
            className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold text-black"
          >
            {t('+1')} ({manualCount})
          </button>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {goal && (
          <button
            onClick={() => {
              clearFocusGoal(techniqueId)
              onClose()
            }}
            className="text-[11px] font-semibold text-zinc-400 px-2 py-1"
          >
            {t('Clear goal')}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-[11px] font-semibold text-gold px-2 py-1"
        >
          {t('Done')}
        </button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex flex-col gap-1">
      <span className="text-xl font-bold text-zinc-100">{value}</span>
      {sub && <span className="text-sm text-zinc-400">{sub}</span>}
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const [focusPickerOpen, setFocusPickerOpen] = useState(false)
  const [focusPickerSearch, setFocusPickerSearch] = useState('')
  const [focusTechniqueIds, setFocusTechniqueIdsState] =
    useState<number[]>(getFocusTechniqueIds)
  const [sectionOrder, setSectionOrder] =
    useState<HomeSectionId[]>(getHomeSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState(
    getHomeSectionVisibility,
  )
  const [beltColor, setBeltColorState] = useState<BeltColor>(getBeltColor)
  const [beltStripes, setBeltStripesState] = useState<number>(getBeltStripes)
  const [focusGoals, setFocusGoalsState] = useState(getFocusGoals)
  const [manualCounts, setManualCountsState] = useState<Record<number, number>>(
    () => ({}),
  )
  const [cardVisTick, setCardVisTick] = useState(0)
  const [achievementsTick, setAchievementsTick] = useState(0)
  const [editingCardsForSection, setEditingCardsForSection] =
    useState<HomeSectionId | null>(null)
  const [openGoalEditorId, setOpenGoalEditorId] = useState<number | null>(null)

  useEffect(() => {
    const sync = () => {
      setSectionOrder(getHomeSectionOrder())
      setSectionVisibility(getHomeSectionVisibility())
    }
    window.addEventListener(HOME_SECTION_ORDER_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(HOME_SECTION_ORDER_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const sync = () => {
      setBeltColorState(getBeltColor())
      setBeltStripesState(getBeltStripes())
      setAchievementsTick((n) => n + 1)
    }
    window.addEventListener(BELT_RANK_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(BELT_RANK_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const refreshGoals = () => {
      setFocusGoalsState(getFocusGoals())
      const fids = getFocusTechniqueIds()
      const counts: Record<number, number> = {}
      for (const id of fids) counts[id] = getManualCount(id)
      setManualCountsState(counts)
    }
    refreshGoals()
    window.addEventListener(FOCUS_GOALS_UPDATED_EVENT, refreshGoals)
    window.addEventListener('storage', refreshGoals)
    return () => {
      window.removeEventListener(FOCUS_GOALS_UPDATED_EVENT, refreshGoals)
      window.removeEventListener('storage', refreshGoals)
    }
  }, [focusTechniqueIds])

  useEffect(() => {
    const sync = () => setCardVisTick((n) => n + 1)
    window.addEventListener(HOME_CARD_VISIBILITY_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(HOME_CARD_VISIBILITY_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const sync = () => setAchievementsTick((n) => n + 1)
    window.addEventListener(ACHIEVEMENTS_UPDATED_EVENT, sync)
    return () => window.removeEventListener(ACHIEVEMENTS_UPDATED_EVENT, sync)
  }, [])
  const todayStart = startOfDay(Date.now())
  const weekStart = todayStart - 6 * DAY_MS
  const currentWeekStart = startOfWeek(Date.now())
  const previousWeekStart = currentWeekStart - 7 * DAY_MS
  const weeklyGoalMinutes = getGoalMatTime()

  const sessionCount = useLiveQuery(() => db.sessions.count(), [], 0)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])
  const totalMinutes = useMemo(
    () => (sessions ?? []).reduce((s, r) => s + r.durationMinutes, 0),
    [sessions],
  )

  const tapCounts = useLiveQuery(
    async () => {
      const taps = await db.sessionTaps.toArray()
      return {
        given: taps.filter((t) => t.type === 'given').length,
        received: taps.filter((t) => t.type === 'received').length,
      }
    },
    [],
    { given: 0, received: 0 },
  )
  const weeklySessions = useLiveQuery(
    () => db.sessions.where('date').aboveOrEqual(weekStart).toArray(),
    [weekStart],
    [],
  )
  const recentSessions = useLiveQuery(
    () => db.sessions.orderBy('date').reverse().limit(5).toArray(),
    [],
    [],
  )
  const tapCountsBySessionId = useLiveQuery(
    async () => {
      const taps = await db.sessionTaps.toArray()
      const counts = new Map<number, number>()
      for (const tap of taps) {
        if (tap.type !== 'given') continue
        counts.set(tap.sessionId, (counts.get(tap.sessionId) ?? 0) + 1)
      }
      return counts
    },
    [],
    new Map<number, number>(),
  )
  const techniques = useLiveQuery(
    () => db.techniques.orderBy('name').toArray(),
    [],
    [],
  )
  const allTaps = useLiveQuery(() => db.sessionTaps.toArray(), [], [])
  const sessionTechniques = useLiveQuery(
    () => db.sessionTechniques.toArray(),
    [],
    [],
  )
  const givenTapCountsByTechniqueId = useLiveQuery(
    async () => {
      const taps = await db.sessionTaps.toArray()
      const counts = new Map<number, number>()
      for (const tap of taps) {
        if (tap.type !== 'given') continue
        counts.set(tap.techniqueId, (counts.get(tap.techniqueId) ?? 0) + 1)
      }
      return counts
    },
    [],
    new Map<number, number>(),
  )
  const receivedTapCountsByTechniqueId = useLiveQuery(
    async () => {
      const taps = await db.sessionTaps.toArray()
      const counts = new Map<number, number>()
      for (const tap of taps) {
        if (tap.type !== 'received') continue
        counts.set(tap.techniqueId, (counts.get(tap.techniqueId) ?? 0) + 1)
      }
      return counts
    },
    [],
    new Map<number, number>(),
  )
  const timeLabel = useMemo(() => {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }, [totalMinutes])
  const weeklyMinutes = useMemo(
    () => (weeklySessions ?? []).reduce((sum, s) => sum + s.durationMinutes, 0),
    [weeklySessions],
  )
  const weeklyGoalPct = useMemo(
    () => Math.min(100, Math.round((weeklyMinutes / weeklyGoalMinutes) * 100)),
    [weeklyMinutes, weeklyGoalMinutes],
  )

  const { last5TapCounts, avgTaps5, maxTaps5 } = useMemo(() => {
    const sorted = [...(recentSessions ?? [])].sort((a, b) => a.date - b.date)
    const last5TapCounts = sorted.map(
      (s) => tapCountsBySessionId.get(s.id ?? -1) ?? 0,
    )
    const avgTaps5 =
      last5TapCounts.length === 0
        ? 0
        : last5TapCounts.reduce((a, b) => a + b, 0) / last5TapCounts.length
    const maxTaps5 = Math.max(...last5TapCounts, 1)
    return { last5TapCounts, avgTaps5, maxTaps5 }
  }, [recentSessions, tapCountsBySessionId])
  const focusTechniques = useMemo(
    () => (techniques ?? []).filter((t) => focusTechniqueIds.includes(t.id)),
    [techniques, focusTechniqueIds],
  )

  const filteredPickerTechniques = useMemo(() => {
    const results = (techniques ?? []).filter((t) =>
      techniqueMatchesQuery(withLocalizedName(t, language), focusPickerSearch),
    )
    if (focusPickerSearch.trim()) {
      return [...results].sort(
        (a, b) =>
          techniqueScore(withLocalizedName(b, language), focusPickerSearch) -
          techniqueScore(withLocalizedName(a, language), focusPickerSearch),
      )
    }
    return results
  }, [techniques, focusPickerSearch, language])

  const trainingWeekStreak = useMemo(() => {
    const weekStarts = Array.from(
      new Set((sessions ?? []).map((s) => startOfWeek(s.date))),
    ).sort((a, b) => b - a)
    let streak = 0
    if (weekStarts.length > 0) {
      const firstWeek = weekStarts[0]
      if (firstWeek === currentWeekStart || firstWeek === previousWeekStart) {
        for (let index = 0; index < weekStarts.length; index += 1) {
          if (index === 0) {
            streak += 1
            continue
          }
          if (weekStarts[index] !== weekStarts[index - 1] - 7 * DAY_MS) break
          streak += 1
        }
      }
    }
    return streak
  }, [sessions, currentWeekStart, previousWeekStart])

  const dailyStreak = useMemo(
    () => computeDailyStreak(sessions ?? [], Date.now()),
    [sessions],
  )

  const rankProgress = useMemo(() => computeRank(totalMinutes), [totalMinutes])

  const levelInfo = useMemo(
    () =>
      computeLevel(
        computeXp({
          totalMinutes,
          givenTaps: tapCounts?.given ?? 0,
          sessionCount: sessionCount ?? 0,
        }),
      ),
    [totalMinutes, tapCounts, sessionCount],
  )

  const focusProgresses: Record<number, FocusProgress> = useMemo(() => {
    const result: Record<number, FocusProgress> = {}
    for (const id of focusTechniqueIds) {
      const goal = focusGoals[id]
      if (!goal) continue
      result[id] = computeFocusProgress(goal, id, {
        sessions: sessions ?? [],
        sessionTechniques: sessionTechniques ?? [],
        taps: allTaps ?? [],
        manualCount: manualCounts[id] ?? 0,
      })
    }
    return result
  }, [
    focusTechniqueIds,
    focusGoals,
    sessions,
    sessionTechniques,
    allTaps,
    manualCounts,
  ])

  // Track newly-completed goals into the lifetime "Goal Slayer" counter.
  useEffect(() => {
    const completedKeys: string[] = []
    for (const [idStr, p] of Object.entries(focusProgresses)) {
      if (p.current >= p.target) completedKeys.push(`${idStr}:${p.type}`)
    }
    if (completedKeys.length > 0) trackGoalCompletions(completedKeys)
  }, [focusProgresses])

  const achievementCtx: AchievementCtx = useMemo(
    () => ({
      sessions: sessions ?? [],
      taps: allTaps ?? [],
      totalMinutes,
      weeklyStreak: trainingWeekStreak,
      dailyStreak: dailyStreak.current,
      level: levelInfo.level,
      focusProgresses: Object.values(focusProgresses),
      goalSlayerCount: getAchievementsMeta().goalSlayerCount,
      now: Date.now(),
    }),
    [
      sessions,
      allTaps,
      totalMinutes,
      trainingWeekStreak,
      dailyStreak,
      levelInfo,
      focusProgresses,
    ],
  )

  const earnedAt = useMemo(() => {
    return recomputeEarned(achievementCtx)
    // achievementsTick forces re-read after meta updates from elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementCtx, achievementsTick])

  const cardVisible = (sectionId: HomeSectionId, cardId: string) => {
    void cardVisTick
    return getCardVisible(sectionId, cardId, true)
  }

  const statsCardDefs: {
    id: string
    labelKey: TranslationKey
    node: ReactNode
  }[] = [
    {
      id: 'matTime',
      labelKey: 'Mat time',
      node: (
        <StatCard
          key="matTime"
          label={t('Mat Time')}
          value={totalMinutes > 0 ? timeLabel : '0m'}
        />
      ),
    },
    {
      id: 'sessions',
      labelKey: 'Sessions',
      node: (
        <StatCard
          key="sessions"
          label={t('Sessions')}
          value={String(sessionCount ?? 0)}
        />
      ),
    },
    {
      id: 'tapsGiven',
      labelKey: 'Taps Given',
      node: (
        <StatCard
          key="tapsGiven"
          label={t('Taps Given')}
          value={String(tapCounts?.given ?? 0)}
        />
      ),
    },
    {
      id: 'tapsReceived',
      labelKey: 'Taps Received',
      node: (
        <StatCard
          key="tapsReceived"
          label={t('Taps Received')}
          value={String(tapCounts?.received ?? 0)}
        />
      ),
    },
  ]

  const statsSection = (
    <section key="stats">
      <SectionHeader
        title={t('YOUR STATS')}
        sectionId="stats"
        editing={editingCardsForSection === 'stats'}
        onToggleEdit={() =>
          setEditingCardsForSection((cur) => (cur === 'stats' ? null : 'stats'))
        }
        cards={statsCardDefs.map((c) => ({
          id: c.id,
          label: t(c.labelKey),
        }))}
      />
      <div className="grid grid-cols-2 gap-3">
        {statsCardDefs
          .filter((c) => cardVisible('stats', c.id))
          .map((c) => c.node)}
      </div>
    </section>
  )

  const sparklineCard = (
    <div
      key="sparkline"
      className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center gap-4"
    >
      <div className="flex-1">
        <div className="text-xs text-zinc-500">{t('Avg taps')}</div>
        <div className="text-xl font-bold text-blue-400 mt-0.5">
          {avgTaps5.toFixed(1)}
        </div>
      </div>
      {last5TapCounts.length > 0 && (
        <div className="flex items-end gap-1 h-6">
          {last5TapCounts.map((count, i) => (
            <div
              key={i}
              className="w-2 rounded-sm bg-blue-400/60"
              style={{
                height: `${Math.max(3, Math.round((count / maxTaps5) * 24))}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  const weeklyGoalCard = (
    <div key="weeklyGoal" className="bg-zinc-900 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">{t('Weekly goal')}</span>
        <span className="text-xs text-zinc-500 tabular-nums">
          {weeklyMinutes}/{weeklyGoalMinutes}m
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-gold"
          style={{ width: `${weeklyGoalPct}%` }}
        />
      </div>
    </div>
  )

  const trendingCardDefs: {
    id: string
    labelKey: TranslationKey
    node: ReactNode
  }[] = [
    { id: 'sparkline', labelKey: 'Sparkline', node: sparklineCard },
    { id: 'weeklyGoal', labelKey: 'Weekly goal', node: weeklyGoalCard },
  ]

  const trendingSection = (
    <section key="trending">
      <SectionHeader
        title={t('THIS WEEK')}
        sectionId="trending"
        editing={editingCardsForSection === 'trending'}
        onToggleEdit={() =>
          setEditingCardsForSection((cur) =>
            cur === 'trending' ? null : 'trending',
          )
        }
        cards={trendingCardDefs.map((c) => ({
          id: c.id,
          label: t(c.labelKey),
        }))}
      />
      <div className="grid grid-cols-2 gap-3">
        {trendingCardDefs
          .filter((c) => cardVisible('trending', c.id))
          .map((c) => c.node)}
      </div>
    </section>
  )

  const focusSection = (
    <section key="focus" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-widest text-gold">
          {t('FOCUS TECHNIQUES')}
        </h2>
        <button
          onClick={() => {
            setFocusPickerOpen((prev) => !prev)
            setFocusPickerSearch('')
          }}
          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
            focusPickerOpen ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          {t('Set focus')}
        </button>
      </div>
      {focusPickerOpen && (
        <div className="bg-zinc-900 rounded-2xl p-3">
          <input
            type="text"
            value={focusPickerSearch}
            onChange={(e) => setFocusPickerSearch(e.target.value)}
            placeholder={t('Search…')}
            className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600 mb-2"
          />
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
            {filteredPickerTechniques.map((technique) => {
              const selected = focusTechniqueIds.includes(technique.id)
              return (
                <button
                  key={technique.id}
                  onClick={() => {
                    const next = selected
                      ? focusTechniqueIds.filter((id) => id !== technique.id)
                      : [...focusTechniqueIds, technique.id]
                    setFocusTechniqueIds(next)
                    setFocusTechniqueIdsState(next)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? 'bg-gold text-black font-semibold'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {technique.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {focusTechniques.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl px-4 py-3 text-sm text-zinc-400">
          {t('No focus techniques selected')}
        </div>
      ) : (
        <div className="space-y-2">
          {focusTechniques.map((technique) => {
            const goal = focusGoals[technique.id]
            const progress = focusProgresses[technique.id]
            const isOpen = openGoalEditorId === technique.id
            return (
              <div
                key={technique.id}
                className="bg-zinc-900 rounded-2xl px-4 py-3 space-y-2"
              >
                <button
                  onClick={() =>
                    setOpenGoalEditorId(isOpen ? null : technique.id)
                  }
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Crosshair size={14} className="text-gold shrink-0" />
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {technique.name}
                    </span>
                    <CategoryIcon
                      fallbackId={technique.categoryId}
                      size={14}
                      className="text-gold shrink-0"
                    />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <Hand size={12} strokeWidth={2} />
                      {receivedTapCountsByTechniqueId.get(technique.id) ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Zap size={12} strokeWidth={2} />
                      {givenTapCountsByTechniqueId?.get(technique.id) ?? 0}
                    </span>
                  </div>
                </button>

                {progress && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span>{t(focusGoalLabel(progress.type))}</span>
                      <span className="tabular-nums">
                        {progress.current}/{progress.target}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full ${
                          progress.type === 'sessionsSinceTap' &&
                          progress.current >= progress.target
                            ? 'bg-green-500'
                            : 'bg-gold'
                        }`}
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {isOpen && (
                  <FocusGoalEditor
                    techniqueId={technique.id}
                    goal={goal}
                    manualCount={manualCounts[technique.id] ?? 0}
                    onClose={() => setOpenGoalEditorId(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )

  const rankCard = (
    <div
      key="rank"
      className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
        <Trophy size={22} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-100 truncate">
            {t(rankProgress.tier.nameKey)}
          </span>
          <span className="text-[11px] text-zinc-500 tabular-nums">
            {Math.floor(rankProgress.hours)}h
            {rankProgress.next ? ` / ${rankProgress.next.hours}h` : ''}
          </span>
        </div>
        <div className="h-1.5 mt-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gold"
            style={{ width: `${rankProgress.pct}%` }}
          />
        </div>
      </div>
    </div>
  )

  const xpCard = (
    <div key="xp" className="bg-zinc-900 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <span className="text-sm font-bold text-zinc-100">
            {t('Level')} {levelInfo.level}
          </span>
        </div>
        <span
          className="text-[11px] text-zinc-500 tabular-nums"
          aria-label={`${levelInfo.xp} ${t('XP')} total`}
        >
          {levelInfo.xpIntoLevel}/{levelInfo.xpForNext} {t('XP')}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-gold"
          style={{ width: `${levelInfo.pct}%` }}
        />
      </div>
    </div>
  )

  const dailyStreakCard = (
    <div
      key="dailyStreak"
      className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between"
    >
      <div>
        <div className="text-xs text-zinc-500">{t('Daily streak')}</div>
        <div className="text-xl font-bold text-sky-400 mt-0.5 tabular-nums">
          {dailyStreak.current}
          <span className="text-[10px] uppercase tracking-wide text-sky-400/70 ml-1">
            {t('d.')}
          </span>
        </div>
      </div>
      <Flame size={20} className="text-sky-400" strokeWidth={1.75} />
    </div>
  )

  const weeklyStreakCard = (
    <div
      key="weeklyStreak"
      className="bg-zinc-900 rounded-2xl px-4 py-3 flex items-center justify-between"
    >
      <div>
        <div className="text-xs text-zinc-500">{t('Weekly streak')}</div>
        <div className="text-xl font-bold text-orange-400 mt-0.5 tabular-nums">
          {trainingWeekStreak}
          <span className="text-[10px] uppercase tracking-wide text-orange-400/70 ml-1">
            {t('w.')}
          </span>
        </div>
      </div>
      <Flame
        size={20}
        className="text-orange-400"
        fill="currentColor"
        strokeWidth={0}
      />
    </div>
  )

  const achievementsCard = (
    <AchievementsCard
      key="achievements"
      achievements={ACHIEVEMENTS}
      earnedAt={earnedAt}
      ctx={achievementCtx}
    />
  )

  const gamificationCardDefs: {
    id: string
    labelKey: TranslationKey
    node: ReactNode
    fullWidth?: boolean
  }[] = [
    { id: 'rank', labelKey: 'Rank', node: rankCard, fullWidth: true },
    { id: 'xp', labelKey: 'Level', node: xpCard, fullWidth: true },
    { id: 'dailyStreak', labelKey: 'Daily streak', node: dailyStreakCard },
    { id: 'weeklyStreak', labelKey: 'Weekly streak', node: weeklyStreakCard },
    {
      id: 'achievements',
      labelKey: 'Achievements',
      node: achievementsCard,
      fullWidth: true,
    },
  ]

  const visibleGamificationCards = gamificationCardDefs.filter((c) =>
    cardVisible('gamification', c.id),
  )

  const gamificationSection = (
    <section key="gamification">
      <SectionHeader
        title={t('GAMIFICATION')}
        sectionId="gamification"
        editing={editingCardsForSection === 'gamification'}
        onToggleEdit={() =>
          setEditingCardsForSection((cur) =>
            cur === 'gamification' ? null : 'gamification',
          )
        }
        cards={gamificationCardDefs.map((c) => ({
          id: c.id,
          label: t(c.labelKey),
        }))}
      />
      <div className="space-y-3">
        {(() => {
          const out: ReactNode[] = []
          let pending: typeof visibleGamificationCards = []
          const flush = () => {
            if (pending.length === 0) return
            out.push(
              <div key={`row-${out.length}`} className="grid grid-cols-2 gap-3">
                {pending.map((c) => c.node)}
              </div>,
            )
            pending = []
          }
          for (const card of visibleGamificationCards) {
            if (card.fullWidth) {
              flush()
              out.push(card.node)
            } else {
              pending.push(card)
              if (pending.length === 2) flush()
            }
          }
          flush()
          return out
        })()}
      </div>
    </section>
  )

  const calendarSection = (
    <TrainingCalendar
      key="calendar"
      sessions={sessions ?? []}
      onDayClick={(epoch) =>
        navigate('/sessions/new', { state: { date: epoch } })
      }
    />
  )

  const quickAccessSection = (
    <section key="quickAccess">
      <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">
        {t('QUICK ACCESS')}
      </h2>
      <div className="space-y-3">
        <button
          onClick={() => navigate('/sessions')}
          className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <CalendarDays size={28} className="text-gold" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-zinc-100">
              {t('Training Sessions')}
            </div>
            <div className="text-sm text-zinc-400">
              {t('Log and review your mat time')}
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
        </button>

        <button
          onClick={() => navigate('/techniques')}
          className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
            <BookOpen size={28} className="text-gold" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-zinc-100">
              {t('Technique Library')}
            </div>
            <div className="text-sm text-zinc-400">
              {t('60+ techniques with YouTube refs')}
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
        </button>
      </div>
    </section>
  )

  const sectionMap: Record<HomeSectionId, ReactNode> = {
    focus: (
      <ErrorBoundary
        key="focus"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {focusSection}
      </ErrorBoundary>
    ),
    gamification: (
      <ErrorBoundary
        key="gamification"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {gamificationSection}
      </ErrorBoundary>
    ),
    trending: (
      <ErrorBoundary
        key="trending"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {trendingSection}
      </ErrorBoundary>
    ),
    stats: (
      <ErrorBoundary
        key="stats"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {statsSection}
      </ErrorBoundary>
    ),
    calendar: (
      <ErrorBoundary
        key="calendar"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {calendarSection}
      </ErrorBoundary>
    ),
    quickAccess: (
      <ErrorBoundary
        key="quickAccess"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {quickAccessSection}
      </ErrorBoundary>
    ),
  }

  const beltLabelKeys: Record<
    BeltColor,
    'White Belt' | 'Blue Belt' | 'Purple Belt' | 'Brown Belt' | 'Black Belt'
  > = {
    white: 'White Belt',
    blue: 'Blue Belt',
    purple: 'Purple Belt',
    brown: 'Brown Belt',
    black: 'Black Belt',
  }
  const beltLabel = t(beltLabelKeys[beltColor])

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-widest text-gold">
            BJJ DOJO
          </h1>
          <img
            src={jujitsuKanjiHorizontal}
            alt="Jiu-jitsu kanji"
            className="h-7 w-auto shrink-0 opacity-90"
            style={{
              filter:
                'brightness(0) saturate(100%) invert(68%) sepia(7%) saturate(315%) hue-rotate(202deg) brightness(90%) contrast(88%)',
            }}
          />
        </div>
        <p className="text-zinc-400 text-sm mt-1">
          {t('Track your journey on the mats')}
        </p>
      </div>

      <div className="px-4 space-y-6 pb-6">
        <BeltDisplay
          color={beltColor}
          stripes={beltStripes}
          beltLabel={beltLabel}
        />
        {sectionOrder
          .filter((id) => sectionVisibility[id])
          .map((id) => sectionMap[id])}
      </div>
    </div>
  )
}
