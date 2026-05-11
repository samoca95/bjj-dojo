import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, BookOpen, ChevronRight } from 'lucide-react'
import { db } from '../db/database'
import { useI18n } from '../i18n'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-zinc-100">{value}</span>
      {sub && <span className="text-sm text-zinc-400">{sub}</span>}
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  const sessionCount = useLiveQuery(() => db.sessions.count(), [], 0)
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], [])
  const totalMinutes = sessions?.reduce((s, r) => s + r.durationMinutes, 0) ?? 0

  const tapCounts = useLiveQuery(async () => {
    const taps = await db.sessionTaps.toArray()
    return {
      given: taps.filter(t => t.type === 'given').length,
      received: taps.filter(t => t.type === 'received').length,
    }
  }, [], { given: 0, received: 0 })

  const recommendations = useLiveQuery(async () => {
    const sessionLinks = await db.sessionTechniques.toArray()
    if (sessionLinks.length === 0) return [] as string[]
    const counts = new Map<number, number>()
    for (const link of sessionLinks) {
      counts.set(link.techniqueId, (counts.get(link.techniqueId) ?? 0) + 1)
    }
    const topPracticed = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)
    if (topPracticed.length === 0) return [] as string[]

    const connections = await db.techniqueConnections.toArray()
    const suggestionCounts = new Map<number, number>()
    for (const connection of connections) {
      if (!topPracticed.includes(connection.fromTechniqueId)) continue
      suggestionCounts.set(
        connection.toTechniqueId,
        (suggestionCounts.get(connection.toTechniqueId) ?? 0) + 1,
      )
    }
    const recommendedIds = [...suggestionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)
    if (recommendedIds.length === 0) return [] as string[]
    const techniques = await db.techniques.where('id').anyOf(recommendedIds).toArray()
    return techniques.map(t => t.name)
  }, [], [] as string[])

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <h1 className="text-3xl font-black tracking-widest text-gold">BJJ DOJO</h1>
        <p className="text-zinc-400 text-sm mt-1">{t('Track your journey on the mats')}</p>
      </div>

      <div className="px-4 space-y-6 pb-6">
        {/* Stats */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('YOUR STATS')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('Sessions')} value={String(sessionCount ?? 0)} />
            <StatCard label={t('Mat Time')} value={totalMinutes > 0 ? timeLabel : '0m'} />
            <StatCard label={t('Taps Given')} value={String(tapCounts?.given ?? 0)} />
            <StatCard label={t('Taps Received')} value={String(tapCounts?.received ?? 0)} />
          </div>
        </section>

        {/* Quick access */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">{t('QUICK ACCESS')}</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/sessions')}
              className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <CalendarDays size={28} className="text-gold" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">{t('Training Sessions')}</div>
                <div className="text-sm text-zinc-400">{t('Log and review your mat time')}</div>
              </div>
              <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
            </button>

            <button
              onClick={() => navigate('/techniques')}
              className="w-full bg-zinc-900 rounded-2xl p-5 flex items-center gap-4 text-left active:bg-zinc-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                <BookOpen size={28} className="text-gold" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">{t('Technique Library')}</div>
                <div className="text-sm text-zinc-400">{t('60+ techniques with YouTube refs')}</div>
              </div>
              <ChevronRight size={20} className="text-zinc-600" strokeWidth={2} />
            </button>
          </div>
        </section>

        {recommendations && recommendations.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-gold mb-3 px-1">
              {t('RECOMMENDED NEXT')}
            </h2>
            <div className="bg-zinc-900 rounded-2xl p-4 space-y-2">
              {recommendations.map(name => (
                <div key={name} className="text-sm text-zinc-200">• {name}</div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
