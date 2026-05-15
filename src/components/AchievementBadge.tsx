import { useState } from 'react'
import { CircleHelp, X } from 'lucide-react'
import { useI18n } from '../i18n'
import type { Achievement, AchievementCtx } from '../utils/achievements'

interface BadgeProps {
  achievement: Achievement
  earned: boolean
  ctx: AchievementCtx
  onClick: () => void
}

export function AchievementChip({
  achievement,
  earned,
  ctx,
  onClick,
}: BadgeProps) {
  const { t } = useI18n()
  const Icon = achievement.icon
  const progress = achievement.progress?.(ctx)
  const pct =
    progress && progress.target > 0
      ? Math.min(100, Math.round((progress.current / progress.target) * 100))
      : earned
        ? 100
        : 0

  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-20 flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl ${
        earned
          ? `${achievement.color} ring-1 ring-gold/40`
          : 'bg-zinc-800/60 text-zinc-500'
      }`}
    >
      <Icon size={28} strokeWidth={1.75} />
      <span
        className={`text-[10px] font-semibold leading-tight text-center line-clamp-2 ${
          earned ? '' : 'text-zinc-400'
        }`}
      >
        {t(achievement.titleKey)}
      </span>
      {!earned && progress && (
        <span className="text-[9px] text-zinc-600 tabular-nums">{pct}%</span>
      )}
    </button>
  )
}

interface StripProps {
  achievements: Achievement[]
  earnedAt: Record<string, number>
  ctx: AchievementCtx
  infoText?: string
}

export default function AchievementsCard({
  achievements,
  earnedAt,
  ctx,
  infoText,
}: StripProps) {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const selected =
    selectedId != null
      ? (achievements.find((a) => a.id === selectedId) ?? null)
      : null

  const sorted = [...achievements].sort((a, b) => {
    const ae = earnedAt[a.id] != null ? 0 : 1
    const be = earnedAt[b.id] != null ? 0 : 1
    return ae - be
  })

  return (
    <div className="bg-zinc-900 rounded-2xl px-3 py-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">{t('Achievements')}</span>
          {infoText && (
            <div className="relative">
              <button
                onClick={() => setShowInfo((prev) => !prev)}
                aria-label={`${t('Achievements')} info`}
                className="text-zinc-500 active:text-zinc-300"
              >
                <CircleHelp size={13} />
              </button>
              {showInfo && (
                <div className="absolute left-0 z-20 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-[11px] leading-relaxed text-zinc-300 shadow-lg">
                  {infoText}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold text-gold"
        >
          {t('View all')}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {sorted.map((a) => (
          <AchievementChip
            key={a.id}
            achievement={a}
            earned={earnedAt[a.id] != null}
            ctx={ctx}
            onClick={() => setSelectedId(a.id)}
          />
        ))}
      </div>

      {selected && (
        <AchievementPopover
          achievement={selected}
          earned={earnedAt[selected.id] != null}
          ctx={ctx}
          onClose={() => setSelectedId(null)}
        />
      )}

      {showAll && (
        <AchievementGrid
          achievements={achievements}
          earnedAt={earnedAt}
          ctx={ctx}
          onClose={() => setShowAll(false)}
        />
      )}
    </div>
  )
}

function AchievementPopover({
  achievement,
  earned,
  ctx,
  onClose,
}: {
  achievement: Achievement
  earned: boolean
  ctx: AchievementCtx
  onClose: () => void
}) {
  const { t } = useI18n()
  const Icon = achievement.icon
  const progress = achievement.progress?.(ctx)
  const pct =
    progress && progress.target > 0
      ? Math.min(100, Math.round((progress.current / progress.target) * 100))
      : earned
        ? 100
        : 0

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-5 m-0 sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              earned ? achievement.color : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            <Icon size={32} strokeWidth={1.75} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 active:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>
        <h3 className="text-base font-bold text-zinc-100">
          {t(achievement.titleKey)}
        </h3>
        <p className="text-sm text-zinc-400 mt-1">{t(achievement.descKey)}</p>
        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span>{earned ? t('Earned') : t('Locked')}</span>
              <span className="tabular-nums">
                {progress.current} / {progress.target}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full ${earned ? 'bg-gold' : 'bg-zinc-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AchievementGrid({
  achievements,
  earnedAt,
  ctx,
  onClose,
}: {
  achievements: Achievement[]
  earnedAt: Record<string, number>
  ctx: AchievementCtx
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] bg-zinc-900 rounded-2xl p-4 m-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-zinc-100">
            {t('Achievements')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 active:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {achievements.map((a) => {
            const Icon = a.icon
            const earned = earnedAt[a.id] != null
            const progress = a.progress?.(ctx)
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 bg-zinc-800/60 rounded-xl px-3 py-2.5"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    earned ? a.color : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {t(a.titleKey)}
                    </span>
                    {progress && (
                      <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">
                        {progress.current}/{progress.target}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{t(a.descKey)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
