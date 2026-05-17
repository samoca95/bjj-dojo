import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  BookOpen,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Flame,
  MoreVertical,
  Zap,
  Hand,
  Pencil,
  Plus,
  Minus,
  Trophy,
  Sparkles,
  X,
  CircleHelp,
} from 'lucide-react'
import { db } from '../db/database'
import { useI18n, withLocalizedName, type TranslationKey } from '../i18n'
import ErrorBoundary from '../components/ErrorBoundary'
import { BELT } from '../constants/themeColors'
import {
  getFocusTechniqueIds,
  setFocusTechniqueIds,
} from '../utils/focusTechniques'
import {
  getFocusFlowIds,
  setFocusFlowIds,
  FOCUS_FLOW_IDS_UPDATED_EVENT,
} from '../utils/focusFlows'
import {
  techniqueMatchesQuery,
  techniqueScore,
  flowMatchesQuery,
  flowScore,
} from '../utils/fuzzySearch'
import { getFlowIcon, FLOW_ICON_UPDATED_EVENT } from '../utils/flowIcon'
import type { Flow, SessionFlow, SessionFlowTap, Technique } from '../types'
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
  getFocusFlowGoals,
  setFocusFlowGoal,
  clearFocusFlowGoal,
  getFlowManualCount,
  incrementFlowManualCount,
  computeFocusProgressForFlow,
  FOCUS_GOAL_TYPES,
  FOCUS_GOALS_UPDATED_EVENT,
  type FocusGoal,
  type FocusGoalType,
  type FocusProgress,
} from '../utils/focusGoals'
import { computeDailyStreak } from '../utils/dailyStreak'
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
import PlannedSessions from '../components/PlannedSessions'
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
  showEditButton = true,
}: {
  title: string
  sectionId: string
  editing: boolean
  onToggleEdit: () => void
  cards: { id: string; label: string }[]
  showEditButton?: boolean
}) {
  return (
    <div className="px-1 mb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-gold">
          {title}
        </h2>
        {showEditButton && (
          <button
            onClick={onToggleEdit}
            aria-label="Edit cards"
            className={`p-1.5 -mr-1 rounded-lg ${
              editing
                ? 'bg-gold text-black'
                : 'text-zinc-500 active:bg-zinc-800'
            }`}
          >
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
        )}
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
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onClose,
}: {
  techniqueId: number
  goal: FocusGoal | undefined
  manualCount: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
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
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="text-[11px] font-semibold text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronUp size={12} />
          {t('Move up')}
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="text-[11px] font-semibold text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronDown size={12} />
          {t('Move down')}
        </button>
      </div>
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

function FocusGoalEditorForFlow({
  flowId,
  goal,
  manualCount,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onClose,
}: {
  flowId: number
  goal: FocusGoal | undefined
  manualCount: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [type, setType] = useState<FocusGoalType>(goal?.type ?? 'tapsGiven')
  const [target, setTarget] = useState<number>(goal?.target ?? 5)

  const save = (nextType: FocusGoalType, nextTarget: number) => {
    setFocusFlowGoal(flowId, {
      type: nextType,
      target: Math.max(1, Math.floor(nextTarget)),
    })
  }

  return (
    <div className="border-t border-zinc-800 pt-3 space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="text-[11px] font-semibold text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronUp size={12} />
          {t('Move up')}
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="text-[11px] font-semibold text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronDown size={12} />
          {t('Move down')}
        </button>
      </div>
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
            onClick={() => incrementFlowManualCount(flowId)}
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
              clearFocusFlowGoal(flowId)
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

function ScoreHelp({
  label,
  description,
}: {
  label: string
  description: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`${label} info`}
        className="text-zinc-500 active:text-zinc-300"
      >
        <CircleHelp size={13} />
      </button>
      {open && (
        <div
          className={[
            'fixed left-1/2 top-24 z-30 -translate-x-1/2',
            'w-[min(28rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-y-auto',
            'rounded-xl border border-zinc-700 bg-zinc-900 p-3 pr-9 shadow-lg',
            'text-[11px] leading-relaxed text-zinc-300 whitespace-pre-line',
          ].join(' ')}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close help"
            className="absolute top-2 right-2 w-6 h-6 rounded-full border border-zinc-600 text-zinc-400 flex items-center justify-center active:bg-zinc-800"
          >
            <X size={13} />
          </button>
          {description}
        </div>
      )}
    </div>
  )
}

function ScoreLabel({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <ScoreHelp label={label} description={description} />
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
  const [focusFlowIds, setFocusFlowIdsState] =
    useState<number[]>(getFocusFlowIds)
  const [sectionOrder, setSectionOrder] =
    useState<HomeSectionId[]>(getHomeSectionOrder)
  const [sectionVisibility, setSectionVisibility] = useState(
    getHomeSectionVisibility,
  )
  const [beltColor, setBeltColorState] = useState<BeltColor>(getBeltColor)
  const [beltStripes, setBeltStripesState] = useState<number>(getBeltStripes)
  const [focusGoals, setFocusGoalsState] = useState(getFocusGoals)
  const [focusFlowGoals, setFocusFlowGoalsState] = useState(getFocusFlowGoals)
  const [manualCounts, setManualCountsState] = useState<Record<number, number>>(
    () => ({}),
  )
  const [flowManualCounts, setFlowManualCountsState] = useState<
    Record<number, number>
  >(() => ({}))
  const [flowIcon, setFlowIconState] = useState(getFlowIcon)
  const [cardVisTick, setCardVisTick] = useState(0)
  const [achievementsTick, setAchievementsTick] = useState(0)
  const [editingCardsForSection, setEditingCardsForSection] =
    useState<HomeSectionId | null>(null)
  const [openGoalEditorId, setOpenGoalEditorId] = useState<
    { kind: 'technique'; id: number } | { kind: 'flow'; id: number } | null
  >(null)

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
      setFocusFlowGoalsState(getFocusFlowGoals())
      const fids = getFocusTechniqueIds()
      const counts: Record<number, number> = {}
      for (const id of fids) counts[id] = getManualCount(id)
      setManualCountsState(counts)
      const ffids = getFocusFlowIds()
      const flowCounts: Record<number, number> = {}
      for (const id of ffids) flowCounts[id] = getFlowManualCount(id)
      setFlowManualCountsState(flowCounts)
    }
    refreshGoals()
    window.addEventListener(FOCUS_GOALS_UPDATED_EVENT, refreshGoals)
    window.addEventListener('storage', refreshGoals)
    return () => {
      window.removeEventListener(FOCUS_GOALS_UPDATED_EVENT, refreshGoals)
      window.removeEventListener('storage', refreshGoals)
    }
  }, [focusTechniqueIds, focusFlowIds])

  useEffect(() => {
    const sync = () => setFocusFlowIdsState(getFocusFlowIds())
    window.addEventListener(FOCUS_FLOW_IDS_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FOCUS_FLOW_IDS_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const sync = () => setFlowIconState(getFlowIcon())
    window.addEventListener(FLOW_ICON_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FLOW_ICON_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

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
  const currentWeekStart = startOfWeek(Date.now())
  const previousWeekStart = currentWeekStart - 7 * DAY_MS

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
  const allFlows = useLiveQuery(
    () => db.flows.orderBy('name').toArray(),
    [],
    [] as Flow[],
  )
  const allSessionFlows = useLiveQuery(
    () => db.sessionFlows.toArray(),
    [],
    [] as SessionFlow[],
  )
  const allSessionFlowTaps = useLiveQuery(
    () => db.sessionFlowTaps.toArray(),
    [],
    [] as SessionFlowTap[],
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
  const givenTapTrend = useMemo(() => {
    const sorted = [...(recentSessions ?? [])].sort((a, b) => a.date - b.date)
    const counts = sorted.map((s) => tapCountsBySessionId.get(s.id ?? -1) ?? 0)
    const avgGiven =
      counts.length === 0
        ? 0
        : counts.reduce((sum, value) => sum + value, 0) / counts.length
    const paddedCounts = [
      ...Array(Math.max(0, 5 - counts.length)).fill(0),
      ...counts,
    ]
    const maxGiven = Math.max(1, ...paddedCounts)
    return { avgGiven, paddedCounts, maxGiven }
  }, [recentSessions, tapCountsBySessionId])
  const focusTechniques = useMemo(
    () => {
      const techniqueById = new Map((techniques ?? []).map((t) => [t.id, t]))
      const orderedTechniques: Technique[] = []
      for (const id of focusTechniqueIds) {
        const technique = techniqueById.get(id)
        if (technique) orderedTechniques.push(technique)
      }
      return orderedTechniques
    },
    [techniques, focusTechniqueIds],
  )

  const focusFlows = useMemo(
    () => {
      const flowById = new Map<number, Flow>()
      for (const flow of allFlows ?? []) {
        if (flow.id != null) flowById.set(flow.id, flow)
      }
      const orderedFlows: Flow[] = []
      for (const id of focusFlowIds) {
        const flow = flowById.get(id)
        if (flow) orderedFlows.push(flow)
      }
      return orderedFlows
    },
    [allFlows, focusFlowIds],
  )

  const moveFocusTechnique = (techniqueId: number, direction: -1 | 1) => {
    setFocusTechniqueIdsState((prev) => {
      const fromIndex = prev.indexOf(techniqueId)
      if (fromIndex === -1) return prev
      const toIndex = fromIndex + direction
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const next = [...prev]
      ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
      setFocusTechniqueIds(next)
      return next
    })
  }

  const moveFocusFlow = (flowId: number, direction: -1 | 1) => {
    setFocusFlowIdsState((prev) => {
      const fromIndex = prev.indexOf(flowId)
      if (fromIndex === -1) return prev
      const toIndex = fromIndex + direction
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const next = [...prev]
      ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
      setFocusFlowIds(next)
      return next
    })
  }

  const techniqueNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const t of techniques ?? []) m.set(t.id, t.name)
    return m
  }, [techniques])

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

  const filteredPickerFlows = useMemo(() => {
    const nameById = (id: number) => techniqueNameById.get(id) ?? ''
    const results = (allFlows ?? []).filter((f) =>
      flowMatchesQuery(f, nameById, focusPickerSearch),
    )
    if (focusPickerSearch.trim()) {
      return [...results].sort(
        (a, b) =>
          flowScore(b, nameById, focusPickerSearch) -
          flowScore(a, nameById, focusPickerSearch),
      )
    }
    return results
  }, [allFlows, techniqueNameById, focusPickerSearch])

  type FocusPickerEntry =
    | { kind: 'technique'; item: (typeof filteredPickerTechniques)[number] }
    | { kind: 'flow'; item: (typeof filteredPickerFlows)[number] }

  const combinedFocusPickerResults = useMemo((): FocusPickerEntry[] | null => {
    if (!focusPickerSearch.trim()) return null
    const nameById = (id: number) => techniqueNameById.get(id) ?? ''
    const techniqueEntries = filteredPickerTechniques.map((technique) => ({
      kind: 'technique' as const,
      item: technique,
      score: techniqueScore(
        withLocalizedName(technique, language),
        focusPickerSearch,
      ),
    }))
    const flowEntries = filteredPickerFlows.map((flow) => ({
      kind: 'flow' as const,
      item: flow,
      score: flowScore(flow, nameById, focusPickerSearch),
    }))
    return [...techniqueEntries, ...flowEntries].sort(
      (a, b) => b.score - a.score,
    ) as FocusPickerEntry[]
  }, [
    focusPickerSearch,
    techniqueNameById,
    filteredPickerTechniques,
    filteredPickerFlows,
    language,
  ])

  const givenFlowTapCountsByFlowId = useMemo(() => {
    const m = new Map<number, number>()
    for (const ft of allSessionFlowTaps ?? []) {
      if (ft.type === 'given') m.set(ft.flowId, (m.get(ft.flowId) ?? 0) + 1)
    }
    return m
  }, [allSessionFlowTaps])

  const receivedFlowTapCountsByFlowId = useMemo(() => {
    const m = new Map<number, number>()
    for (const ft of allSessionFlowTaps ?? []) {
      if (ft.type === 'received') m.set(ft.flowId, (m.get(ft.flowId) ?? 0) + 1)
    }
    return m
  }, [allSessionFlowTaps])

  const focusFlowProgresses = useMemo(() => {
    const result: Record<number, FocusProgress> = {}
    for (const flow of focusFlows) {
      const fid = flow.id!
      const goal = focusFlowGoals[fid]
      if (!goal) continue
      result[fid] = computeFocusProgressForFlow(goal, fid, {
        sessions: sessions ?? [],
        sessionFlows: allSessionFlows ?? [],
        sessionFlowTaps: allSessionFlowTaps ?? [],
        manualCount: flowManualCounts[fid] ?? 0,
      })
    }
    return result
  }, [
    focusFlows,
    focusFlowGoals,
    sessions,
    allSessionFlows,
    allSessionFlowTaps,
    flowManualCounts,
  ])

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
    for (const [idStr, p] of Object.entries(focusFlowProgresses)) {
      if (p.current >= p.target) completedKeys.push(`flow:${idStr}:${p.type}`)
    }
    if (completedKeys.length > 0) trackGoalCompletions(completedKeys)
  }, [focusProgresses, focusFlowProgresses])

  const achievementCtx: AchievementCtx = useMemo(
    () => ({
      sessions: sessions ?? [],
      taps: allTaps ?? [],
      totalMinutes,
      weeklyStreak: trainingWeekStreak,
      dailyStreak: dailyStreak.current,
      level: levelInfo.level,
      focusProgresses: [
        ...Object.values(focusProgresses),
        ...Object.values(focusFlowProgresses),
      ],
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
      focusFlowProgresses,
    ],
  )

  const earnedAt = useMemo(() => {
    return recomputeEarned(achievementCtx)
    // achievementsTick forces re-read after meta updates from elsewhere
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievementCtx, achievementsTick])

  const cardVisible = (sectionId: HomeSectionId, cardId: string) => {
    void cardVisTick
    const fallback =
      sectionId === 'gamification' && cardId === 'achievements' ? false : true
    return getCardVisible(sectionId, cardId, fallback)
  }

  const statsCardDefs: {
    id: string
    labelKey: TranslationKey
    node: ReactNode
    fullWidth?: boolean
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
      id: 'taps',
      labelKey: 'Submissions',
      node: (
        <div key="taps" className="bg-zinc-900 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-zinc-500">{t('Submissions')}</span>
            <ScoreHelp
              label={t('Submissions')}
              description={t(
                'Received: total submissions you got caught in.\nGiven: total submissions you finished.\nAvg: average Given submissions across your last 5 logged sessions.\nThe 5 blue bars show Given submissions for each of those sessions (oldest to newest).',
              )}
            />
          </div>
          <div className="grid grid-cols-[1fr_1fr_1.55fr] gap-3 items-end">
            <div>
              <div className="text-xl font-bold text-zinc-100 tabular-nums flex items-center gap-1">
                {tapCounts?.received ?? 0}
                <Hand size={16} className="text-red-400" strokeWidth={2} />
              </div>
              <div className="text-xs text-zinc-500">{t('Received')}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-100 tabular-nums flex items-center gap-1">
                {tapCounts?.given ?? 0}
                <Zap size={16} className="text-green-500" strokeWidth={2} />
              </div>
              <div className="text-xs text-zinc-500">{t('Given')}</div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-sky-400 tabular-nums">
                  {givenTapTrend.avgGiven.toFixed(1)}
                </div>
                <div className="text-xs text-zinc-500">{t('Avg')}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {givenTapTrend.paddedCounts.map((count, idx) => (
                  <div
                    key={idx}
                    className="relative h-8 w-3 overflow-hidden rounded-[3px] bg-zinc-700/45"
                  >
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-[2px]"
                      style={{
                        height: `${Math.round((count / givenTapTrend.maxGiven) * 100)}%`,
                        backgroundColor: 'rgba(56,189,248,0.16)',
                        backgroundImage:
                          'repeating-linear-gradient(-45deg, rgba(56,189,248,0.55) 0 2px, transparent 2px 5px)',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      fullWidth: true,
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
      <div className="space-y-3">
        {(() => {
          const visible = statsCardDefs.filter((c) =>
            cardVisible('stats', c.id),
          )
          const out: ReactNode[] = []
          let pending: typeof visible = []
          const flush = () => {
            if (pending.length === 0) return
            out.push(
              <div key={`row-${out.length}`} className="grid grid-cols-2 gap-3">
                {pending.map((c) => c.node)}
              </div>,
            )
            pending = []
          }
          for (const card of visible) {
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

  const focusSection = (
    <section key="focus" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-widest text-gold">
          {t('FOCUS GOALS')}
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
            {combinedFocusPickerResults
              ? combinedFocusPickerResults.map((entry) => {
                  if (entry.kind === 'technique') {
                    const technique = entry.item
                    const selected = focusTechniqueIds.includes(technique.id)
                    return (
                      <button
                        key={technique.id}
                        onClick={() => {
                          const next = selected
                            ? focusTechniqueIds.filter(
                                (id) => id !== technique.id,
                              )
                            : [...focusTechniqueIds, technique.id]
                          setFocusTechniqueIds(next)
                          setFocusTechniqueIdsState(next)
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          selected
                            ? 'bg-gold text-black font-semibold'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        <CategoryIcon
                          fallbackId={technique.categoryId}
                          size={14}
                          className={selected ? 'text-black' : 'text-gold'}
                        />
                        {technique.name}
                      </button>
                    )
                  }
                  const flow = entry.item
                  const selected = focusFlowIds.includes(flow.id!)
                  return (
                    <button
                      key={`flow-${flow.id}`}
                      onClick={() => {
                        const next = selected
                          ? focusFlowIds.filter((id) => id !== flow.id!)
                          : [...focusFlowIds, flow.id!]
                        setFocusFlowIds(next)
                        setFocusFlowIdsState(next)
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        selected
                          ? 'bg-gold text-black font-semibold'
                          : 'bg-zinc-800 text-zinc-200'
                      }`}
                    >
                      <CategoryIcon
                        value={flowIcon}
                        size={14}
                        className={selected ? 'text-black' : 'text-gold'}
                      />
                      {flow.name}
                    </button>
                  )
                })
              : [
                  ...filteredPickerTechniques.map((technique) => {
                    const selected = focusTechniqueIds.includes(technique.id)
                    return (
                      <button
                        key={technique.id}
                        onClick={() => {
                          const next = selected
                            ? focusTechniqueIds.filter(
                                (id) => id !== technique.id,
                              )
                            : [...focusTechniqueIds, technique.id]
                          setFocusTechniqueIds(next)
                          setFocusTechniqueIdsState(next)
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          selected
                            ? 'bg-gold text-black font-semibold'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        <CategoryIcon
                          fallbackId={technique.categoryId}
                          size={14}
                          className={selected ? 'text-black' : 'text-gold'}
                        />
                        {technique.name}
                      </button>
                    )
                  }),
                  ...filteredPickerFlows.map((flow) => {
                    const selected = focusFlowIds.includes(flow.id!)
                    return (
                      <button
                        key={`flow-${flow.id}`}
                        onClick={() => {
                          const next = selected
                            ? focusFlowIds.filter((id) => id !== flow.id!)
                            : [...focusFlowIds, flow.id!]
                          setFocusFlowIds(next)
                          setFocusFlowIdsState(next)
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          selected
                            ? 'bg-gold text-black font-semibold'
                            : 'bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        <CategoryIcon
                          value={flowIcon}
                          size={14}
                          className={selected ? 'text-black' : 'text-gold'}
                        />
                        {flow.name}
                      </button>
                    )
                  }),
                ]}
          </div>
        </div>
      )}
      {focusTechniques.length === 0 && focusFlows.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl px-4 py-3 text-sm text-zinc-400">
          {t('No focus goals selected')}
        </div>
      ) : (
        <div className="space-y-2">
          {focusTechniques.map((technique) => {
            const goal = focusGoals[technique.id]
            const progress = focusProgresses[technique.id]
            const indexInFocusList = focusTechniqueIds.indexOf(technique.id)
            const isOpen =
              openGoalEditorId?.kind === 'technique' &&
              openGoalEditorId.id === technique.id
            return (
              <div
                key={technique.id}
                className="bg-zinc-900 rounded-2xl px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/techniques/${technique.id}`)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                  >
                    <CategoryIcon
                      fallbackId={technique.categoryId}
                      size={14}
                      className="text-gold shrink-0"
                    />
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {technique.name}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <Hand size={12} strokeWidth={2} />
                      {receivedTapCountsByTechniqueId.get(technique.id) ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Zap size={12} strokeWidth={2} />
                      {givenTapCountsByTechniqueId?.get(technique.id) ?? 0}
                    </span>
                    <button
                      onClick={() =>
                        setOpenGoalEditorId(
                          isOpen
                            ? null
                            : { kind: 'technique', id: technique.id },
                        )
                      }
                      className="p-1 -mr-1 text-zinc-500 active:text-zinc-300"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>

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
                    canMoveUp={indexInFocusList > 0}
                    canMoveDown={
                      indexInFocusList !== -1 &&
                      indexInFocusList < focusTechniqueIds.length - 1
                    }
                    onMoveUp={() => moveFocusTechnique(technique.id, -1)}
                    onMoveDown={() => moveFocusTechnique(technique.id, 1)}
                    onClose={() => setOpenGoalEditorId(null)}
                  />
                )}
              </div>
            )
          })}
          {focusFlows.map((flow) => {
            const fid = flow.id!
            const goal = focusFlowGoals[fid]
            const progress = focusFlowProgresses[fid]
            const indexInFocusList = focusFlowIds.indexOf(fid)
            const isOpen =
              openGoalEditorId?.kind === 'flow' && openGoalEditorId.id === fid
            return (
              <div
                key={`flow-${fid}`}
                className="bg-zinc-900 rounded-2xl px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/flows/${fid}`)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                  >
                    <CategoryIcon
                      value={flowIcon}
                      size={14}
                      className="text-gold shrink-0"
                    />
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {flow.name}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <Hand size={12} strokeWidth={2} />
                      {receivedFlowTapCountsByFlowId.get(fid) ?? 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Zap size={12} strokeWidth={2} />
                      {givenFlowTapCountsByFlowId.get(fid) ?? 0}
                    </span>
                    <button
                      onClick={() =>
                        setOpenGoalEditorId(
                          isOpen ? null : { kind: 'flow', id: fid },
                        )
                      }
                      className="p-1 -mr-1 text-zinc-500 active:text-zinc-300"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>

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
                  <FocusGoalEditorForFlow
                    flowId={fid}
                    goal={goal}
                    manualCount={flowManualCounts[fid] ?? 0}
                    canMoveUp={indexInFocusList > 0}
                    canMoveDown={
                      indexInFocusList !== -1 &&
                      indexInFocusList < focusFlowIds.length - 1
                    }
                    onMoveUp={() => moveFocusFlow(fid, -1)}
                    onMoveDown={() => moveFocusFlow(fid, 1)}
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

  const levelHelpDescription = [
    t(
      'Your level increases as your total XP grows. Levels get progressively harder to reach.',
    ),
    t(
      'Level thresholds: L1 0 XP, L2 100 XP, L3 300 XP, L4 600 XP, L5 1000 XP. Each next level needs 100 XP more than the previous one.',
    ),
    t(
      'XP comes from mat time, submissions given, and sessions logged. Mat time gives 1 XP every 15 minutes.',
    ),
    t('Consecutive days with at least one logged training session.'),
    t('Consecutive weeks with at least one logged training session.'),
  ].join('\n\n')

  const showStreaks = cardVisible('gamification', 'streaks')

  const levelCard = (
    <div key="level" className="bg-zinc-900 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2">
        {/* Level label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Trophy size={14} className="text-gold" />
          <span className="text-sm font-bold tabular-nums text-zinc-100">
            {levelInfo.level}
          </span>
          <ScoreLabel label={t('Level')} description={levelHelpDescription} />
        </div>
        {/* XP counter — fills available space */}
        <span
          className="flex-1 text-sm text-zinc-500 tabular-nums flex items-center justify-end gap-1.5 text-right"
          aria-label={`${levelInfo.xp} ${t('XP')} total`}
        >
          <Sparkles size={14} className="text-gold" />
          {levelInfo.xpIntoLevel}/{levelInfo.xpForNext} {t('XP')}
        </span>
        {/* Streak badges — inline, same row */}
        {showStreaks && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-950/80 px-2.5 py-1 shrink-0">
            <span className="flex items-center gap-1 text-sky-400 text-sm font-bold tabular-nums leading-none">
              {dailyStreak.current}
              <span className="text-[10px] font-semibold uppercase text-sky-400/70">
                {t('d.')}
              </span>
              <Flame size={13} strokeWidth={1.75} />
            </span>
            <span className="flex items-center gap-1 text-orange-400 text-sm font-bold tabular-nums leading-none">
              {trainingWeekStreak}
              <span className="text-[10px] font-semibold uppercase text-orange-400/70">
                {t('w.')}
              </span>
              <CalendarDays size={13} strokeWidth={1.75} />
            </span>
          </div>
        )}
      </div>
      <div className="h-1.5 mt-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-gold"
          style={{ width: `${levelInfo.pct}%` }}
        />
      </div>
    </div>
  )

  const achievementsCard = (
    <AchievementsCard
      key="achievements"
      achievements={ACHIEVEMENTS}
      earnedAt={earnedAt}
      ctx={achievementCtx}
      infoText={t(
        'Milestones unlocked from your long-term training consistency and progress.',
      )}
    />
  )

  const gamificationCardDefs: {
    id: string
    labelKey: TranslationKey
    node: ReactNode
    fullWidth?: boolean
  }[] = [
    { id: 'level', labelKey: 'Level', node: levelCard, fullWidth: true },
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
  const isGamificationFirstVisible =
    sectionOrder.find((id) => sectionVisibility[id]) === 'gamification'

  const gamificationSection = (
    <section key="gamification">
      {!isGamificationFirstVisible && (
        <SectionHeader
          title={t('LEVEL AND SCORES')}
          sectionId="gamification"
          editing={false}
          onToggleEdit={() => {}}
          cards={[]}
          showEditButton={false}
        />
      )}
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

  const plannedSessionsSection = <PlannedSessions key="plannedSessions" />

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
    stats: (
      <ErrorBoundary
        key="stats"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {statsSection}
      </ErrorBoundary>
    ),
    plannedSessions: (
      <ErrorBoundary
        key="plannedSessions"
        fallback={(retry) => <SectionErrorCard onRetry={retry} />}
      >
        {plannedSessionsSection}
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
