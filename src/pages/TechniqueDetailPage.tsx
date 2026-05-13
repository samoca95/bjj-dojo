import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Pencil, Star, ExternalLink } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, Technique } from '../types'
import { CONNECTION_LABELS, CONNECTION_COLORS } from '../types'
import DifficultyBadge from '../components/DifficultyBadge'
import { CategoryIcon } from '../components/CategoryIcon'
import { useI18n, connectionTypeLabel, getCategoryName, getTechniqueDescription, getTechniqueCues } from '../i18n'
import { defaultTechniqueImageUrl } from '../utils/validation'

function ConnectedTechniqueRow({
  technique, badge, badgeCls, onClick,
}: { technique: Technique; badge: string; badgeCls: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-zinc-950 rounded-xl px-3 py-3 text-left active:bg-zinc-800 transition-colors"
    >
      <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${badgeCls}`}>{badge}</span>
      <span className="flex-1 text-sm text-zinc-100">{technique.name}</span>
      <ChevronRight size={16} className="text-zinc-600 shrink-0" strokeWidth={2} />
    </button>
  )
}

export default function TechniqueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const numId = Number(id)

  const technique = useLiveQuery(() => db.techniques.get(numId), [numId])
  // P5: use cached map — no per-categoryId re-query when only the technique changes
  const catMap = useLiveQuery(() => getCategoryMap(), [], new Map<number, Category>())
  const category = technique ? catMap?.get(technique.categoryId) : undefined
  const sessionCount = useLiveQuery(async () => {
    const sts = await db.sessionTechniques.where('techniqueId').equals(numId).toArray()
    return new Set(sts.map(st => st.sessionId)).size
  }, [numId], 0)

  const connectionsFrom = useLiveQuery(async () => {
    const conns = await db.techniqueConnections.where('fromTechniqueId').equals(numId).toArray()
    return Promise.all(conns.map(async c => ({
      technique: await db.techniques.get(c.toTechniqueId),
      connectionType: c.connectionType,
    })))
  }, [numId], [])

  const connectionsTo = useLiveQuery(async () => {
    const conns = await db.techniqueConnections.where('toTechniqueId').equals(numId).toArray()
    return Promise.all(conns.map(async c => ({
      technique: await db.techniques.get(c.fromTechniqueId),
      connectionType: c.connectionType,
    })))
  }, [numId], [])

  const recommendations = useLiveQuery(async () => {
    const edges = await db.techniqueConnections.where('fromTechniqueId').equals(numId).toArray()
    if (edges.length === 0) return []
    const targets = await db.techniques.where('id').anyOf(edges.map(edge => edge.toTechniqueId)).toArray()
    const sessionTechniques = await db.sessionTechniques.where('techniqueId').anyOf(targets.map(target => target.id)).toArray()
    const usage = new Map<number, number>()
    for (const item of sessionTechniques) {
      usage.set(item.techniqueId, (usage.get(item.techniqueId) ?? 0) + 1)
    }
    return targets
      .map(target => ({ technique: target, usage: usage.get(target.id) ?? 0 }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3)
  }, [numId], [])

  if (!technique) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cues = getTechniqueCues(technique, language)
  const imageSrc = (technique.imageUrl?.trim() || defaultTechniqueImageUrl(technique.name))

  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">{technique.name}</h1>
        <button onClick={() => navigate(`/techniques/${numId}/edit`)} className="p-2 text-gold active:text-gold-light">
          <Pencil size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Info card */}
        <div className="bg-zinc-900 rounded-2xl p-5">
          <div className="mb-4 -mx-2 -mt-2 overflow-hidden rounded-xl bg-zinc-950">
            <img
              src={imageSrc}
              alt={technique.name}
              loading="lazy"
              className="w-full h-44 sm:h-56 object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gold/20 text-gold flex items-center gap-1.5">
                <CategoryIcon value={category.icon} fallbackId={category.id} size={12} className="text-gold" />
                {getCategoryName(category, language)}
              </span>
            )}
            <DifficultyBadge difficulty={technique.difficulty} />
            {technique.isFavorite && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-900/40 text-amber-300 flex items-center gap-1">
                <Star size={12} fill="currentColor" />
                {language === 'es' ? 'Favorita' : 'Favorite'}
              </span>
            )}
            {(sessionCount ?? 0) > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-900/40 text-blue-300">
                 {language === 'es' ? 'Practicada' : 'Practiced'} {sessionCount}×
               </span>
            )}
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{getTechniqueDescription(technique, language)}</p>
          {(technique.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(technique.tags ?? []).map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Coaching cues */}
        {cues.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-5">
             <div className="text-xs font-semibold tracking-widest text-gold mb-3">{t('COACHING CUES')}</div>
            <ul className="space-y-2">
              {cues.map((cue, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-gold text-xs mt-1 shrink-0">▸</span>
                  <span className="text-sm text-zinc-200 leading-snug">{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* YouTube button */}
        {technique.youtubeUrl && (
          <a
            href={technique.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-red-700 hover:bg-red-600 active:bg-red-800 rounded-2xl py-3.5 font-semibold text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            {t('Watch on YouTube')}
          </a>
        )}

        {/* Additional reference links */}
        {(technique.referenceLinks?.length ?? 0) > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {language === 'es' ? 'REFERENCIAS' : 'REFERENCES'}
            </div>
            <div className="space-y-2">
              {technique.referenceLinks!.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-zinc-950 rounded-xl px-3 py-2.5 text-sm text-zinc-100 active:bg-zinc-800"
                >
                  <ExternalLink size={14} className="text-gold shrink-0" />
                  <span className="flex-1 truncate">{link.label?.trim() || link.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {((connectionsFrom?.length ?? 0) > 0 || (connectionsTo?.length ?? 0) > 0) && (
          <div>
             <h2 className="text-xs font-semibold tracking-widest text-gold mb-3">{t('TECHNIQUE CONNECTIONS')}</h2>
          </div>
        )}

        {connectionsFrom && connectionsFrom.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight size={16} className="text-gold" strokeWidth={2} />
               <span className="font-semibold text-zinc-100 text-sm">{t('Leads To / Follow-ups')}</span>
            </div>
            <div className="space-y-2">
              {connectionsFrom.map(({ technique: t, connectionType }, i) =>
                t ? (
                  <ConnectedTechniqueRow
                    key={i}
                    technique={t}
                     badge={connectionTypeLabel(connectionType, CONNECTION_LABELS[connectionType], language)}
                    badgeCls={CONNECTION_COLORS[connectionType]}
                    onClick={() => navigate(`/techniques/${t.id}`)}
                  />
                ) : null,
              )}
            </div>
          </div>
        )}

        {connectionsTo && connectionsTo.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeft size={16} className="text-gold" strokeWidth={2} />
               <span className="font-semibold text-zinc-100 text-sm">{t('Can Be Set Up From')}</span>
            </div>
            <div className="space-y-2">
              {connectionsTo.map(({ technique: t, connectionType }, i) =>
                t ? (
                  <ConnectedTechniqueRow
                    key={i}
                    technique={t}
                     badge={connectionTypeLabel(connectionType, CONNECTION_LABELS[connectionType], language)}
                    badgeCls={CONNECTION_COLORS[connectionType]}
                    onClick={() => navigate(`/techniques/${t.id}`)}
                  />
                ) : null,
              )}
            </div>
          </div>
        )}

        {(recommendations?.length ?? 0) > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <div className="text-xs font-semibold tracking-widest text-gold mb-3">
              {language === 'es' ? 'SIGUIENTES RECOMENDADAS' : 'RECOMMENDED NEXT'}
            </div>
            <div className="space-y-2">
              {recommendations?.map(item => (
                <button
                  key={item.technique.id}
                  onClick={() => navigate(`/techniques/${item.technique.id}`)}
                  className="w-full bg-zinc-950 rounded-xl px-3 py-2.5 flex items-center gap-2 text-left active:bg-zinc-800"
                >
                  <span className="flex-1 text-sm text-zinc-100">{item.technique.name}</span>
                  <span className="text-xs text-zinc-500">{item.usage}×</span>
                  <ChevronRight size={15} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
