import Dexie, { type Table } from 'dexie'
import type { Category, Technique, TechniqueConnection, Session, SessionTechnique, SessionTap, Club, DrillPlan } from '../types'
import { prefilledCategories, prefilledTechniques, prefilledConnections } from './prefilled'
import { type AppLanguage, translateCategoryForExport, translateTechniqueForExport } from '../i18n'
import { VALIDATION_LIMITS, isValidYoutubeUrl } from '../utils/validation'

export class BJJDatabase extends Dexie {
  categories!: Table<Category, number>
  techniques!: Table<Technique, number>
  techniqueConnections!: Table<TechniqueConnection, [number, number]>
  sessions!: Table<Session, number>
  sessionTechniques!: Table<SessionTechnique, [number, number]>
  sessionTaps!: Table<SessionTap, number>
  clubs!: Table<Club, number>
  drillPlans!: Table<DrillPlan, number>

  constructor(name = 'bjj-dojo') {
    super(name)
    this.version(1).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
    })
    this.version(2).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date, clubId',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
      clubs: '++id, sortOrder, name',
    })
    this.version(3).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date, clubId',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
      sessionTaps: '++id, sessionId, techniqueId',
      clubs: '++id, sortOrder, name',
    }).upgrade(async () => {
      await this.transaction('rw', [this.techniques], async () => {
        // Backfill cues onto existing prefilled techniques.
        // Use toArray() + JS filter — isCustom is not an indexed field.
        const all = await this.techniques.toArray() as Technique[]
        const prefilled = all.filter(e => e.isCustom === false)
        const byId = new Map(prefilledTechniques.map(t => [t.id, t]))
        const updates = prefilled
          .filter(e => byId.has(e.id))
          .map(e => ({ ...e, ...byId.get(e.id)! }))
        if (updates.length > 0) await this.techniques.bulkPut(updates)
      })
    })
    this.version(4).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date, clubId',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
      sessionTaps: '++id, sessionId, techniqueId',
      clubs: '++id, sortOrder, name',
    }).upgrade(async () => {
      // Keep prefilled data in sync for existing installs while preserving custom techniques.
      await this.transaction('rw', [this.techniques, this.techniqueConnections], async () => {
        await this.techniques.bulkPut(prefilledTechniques)
        await this.techniqueConnections.bulkPut(prefilledConnections)
      })
    })
    this.version(5).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date, clubId',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
      sessionTaps: '++id, sessionId, techniqueId',
      clubs: '++id, sortOrder, name',
      drillPlans: '++id, name, createdAt',
    }).upgrade(async () => {
      await this.transaction('rw', [this.techniques], async () => {
        const all = await this.techniques.toArray() as Technique[]
        const normalized = all.map(t => ({
          ...t,
          tags: Array.isArray(t.tags) ? t.tags : [],
          isFavorite: Boolean(t.isFavorite),
        }))
        if (normalized.length > 0) await this.techniques.bulkPut(normalized)
      })
    })

    // Populate on first creation — registered here so every instance gets it
    // (including isolated test instances).
    this.on('populate', async () => {
      await this.categories.bulkAdd(prefilledCategories)
      await this.techniques.bulkAdd(prefilledTechniques)
      await this.techniqueConnections.bulkAdd(prefilledConnections)
    })

  }
}

export const db = new BJJDatabase()

export async function resetPrefilledTechniques(database: BJJDatabase = db) {
  const prefilledIds = prefilledTechniques.map(t => t.id)
  const prefilledIdSet = new Set(prefilledIds)

  await database.transaction('rw', database.techniques, database.techniqueConnections, async () => {
    // Remove all prefilled techniques only; custom techniques are preserved.
    await database.techniques.bulkDelete(prefilledIds)
    await database.techniques.bulkPut(prefilledTechniques)

    // Preserve custom↔custom links, wipe links touching prefilled techniques, then restore canonical prefilled links.
    const existingConnections = await database.techniqueConnections.toArray()
    const customConnections = existingConnections.filter(
      c => !prefilledIdSet.has(c.fromTechniqueId) && !prefilledIdSet.has(c.toTechniqueId),
    )
    await database.techniqueConnections.clear()
    if (customConnections.length > 0) {
      await database.techniqueConnections.bulkAdd(customConnections)
    }
    await database.techniqueConnections.bulkPut(prefilledConnections)
  })
}

export interface DatabaseBackup {
  version: number
  exportedAt: number
  language?: AppLanguage
  categories: Category[]
  techniques: Technique[]
  techniqueConnections: TechniqueConnection[]
  sessions: Session[]
  sessionTechniques: SessionTechnique[]
  sessionTaps: SessionTap[]
  clubs: Club[]
  drillPlans: DrillPlan[]
}

export async function exportDatabaseBackup(database: BJJDatabase = db, language: AppLanguage = 'en'): Promise<DatabaseBackup> {
  const categories = await database.categories.toArray()
  const techniques = await database.techniques.toArray()
  return {
    version: 1,
    exportedAt: Date.now(),
    language,
    categories: categories.map(c => translateCategoryForExport(c, language)),
    techniques: techniques.map(t => translateTechniqueForExport(t, language)),
    techniqueConnections: await database.techniqueConnections.toArray(),
    sessions: await database.sessions.toArray(),
    sessionTechniques: await database.sessionTechniques.toArray(),
    sessionTaps: await database.sessionTaps.toArray(),
    clubs: await database.clubs.toArray(),
    drillPlans: await database.drillPlans.toArray(),
  }
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

// ─── Backup validation ────────────────────────────────────────────────────────

const VALID_DIFFICULTIES = new Set(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'])
const VALID_SESSION_TYPES = new Set(['GI', 'NOGI', 'OPEN_MAT', 'COMPETITION', 'DRILLING'])
const VALID_CONNECTION_TYPES = new Set(['FOLLOW_UP', 'COUNTER', 'SETUP', 'TRANSITION'])
const VALID_TAP_TYPES = new Set(['given', 'received'])

const {
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  CUE_MAX_LENGTH,
  TAG_MAX_LENGTH,
} = VALIDATION_LIMITS

function isPosInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function validateCategories(records: unknown[]): Category[] {
  return records.map((r, i) => {
    const ctx = `categories[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (!isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (typeof rec.name !== 'string' || !rec.name.trim()) throw new Error(`${ctx}: 'name' must be a non-empty string`)
    if (rec.name.length > NAME_MAX_LENGTH) throw new Error(`${ctx}: 'name' exceeds ${NAME_MAX_LENGTH} characters`)
    if (typeof rec.description !== 'string') throw new Error(`${ctx}: 'description' must be a string`)
    if (rec.description.length > DESCRIPTION_MAX_LENGTH) throw new Error(`${ctx}: 'description' exceeds ${DESCRIPTION_MAX_LENGTH} characters`)
    if (rec.icon !== undefined && typeof rec.icon !== 'string') throw new Error(`${ctx}: 'icon' must be a string`)
    return rec as unknown as Category
  })
}

function validateTechniques(records: unknown[]): Technique[] {
  return records.map((r, i) => {
    const ctx = `techniques[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (!isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (typeof rec.name !== 'string' || !rec.name.trim()) throw new Error(`${ctx}: 'name' must be a non-empty string`)
    if (rec.name.length > NAME_MAX_LENGTH) throw new Error(`${ctx}: 'name' exceeds ${NAME_MAX_LENGTH} characters`)
    if (typeof rec.description !== 'string') throw new Error(`${ctx}: 'description' must be a string`)
    if (rec.description.length > DESCRIPTION_MAX_LENGTH) throw new Error(`${ctx}: 'description' exceeds ${DESCRIPTION_MAX_LENGTH} characters`)
    if (!isPosInt(rec.categoryId)) throw new Error(`${ctx}: 'categoryId' must be a positive integer`)
    if (typeof rec.youtubeUrl !== 'string') throw new Error(`${ctx}: 'youtubeUrl' must be a string`)
    if (!isValidYoutubeUrl(rec.youtubeUrl)) throw new Error(`${ctx}: 'youtubeUrl' is not a valid YouTube URL`)
    if (rec.imageUrl !== undefined && typeof rec.imageUrl !== 'string') throw new Error(`${ctx}: 'imageUrl' must be a string`)
    if (!VALID_DIFFICULTIES.has(rec.difficulty as string)) throw new Error(`${ctx}: 'difficulty' must be one of ${[...VALID_DIFFICULTIES].join(', ')}`)
    if (typeof rec.isCustom !== 'boolean') throw new Error(`${ctx}: 'isCustom' must be a boolean`)
    if (rec.cues !== undefined) {
      if (!Array.isArray(rec.cues)) throw new Error(`${ctx}: 'cues' must be an array`)
      for (let j = 0; j < rec.cues.length; j++) {
        if (typeof rec.cues[j] !== 'string') throw new Error(`${ctx}: 'cues[${j}]' must be a string`)
        if ((rec.cues[j] as string).length > CUE_MAX_LENGTH) throw new Error(`${ctx}: 'cues[${j}]' exceeds ${CUE_MAX_LENGTH} characters`)
      }
    }
    if (rec.tags !== undefined) {
      if (!Array.isArray(rec.tags)) throw new Error(`${ctx}: 'tags' must be an array`)
      for (let j = 0; j < rec.tags.length; j++) {
        if (typeof rec.tags[j] !== 'string') throw new Error(`${ctx}: 'tags[${j}]' must be a string`)
        if ((rec.tags[j] as string).length > TAG_MAX_LENGTH) throw new Error(`${ctx}: 'tags[${j}]' exceeds ${TAG_MAX_LENGTH} characters`)
      }
    }
    if (rec.isFavorite !== undefined && typeof rec.isFavorite !== 'boolean') throw new Error(`${ctx}: 'isFavorite' must be a boolean`)
    if (rec.referenceLinks !== undefined) {
      if (!Array.isArray(rec.referenceLinks)) throw new Error(`${ctx}: 'referenceLinks' must be an array`)
      for (let j = 0; j < rec.referenceLinks.length; j++) {
        const link = rec.referenceLinks[j] as { url?: unknown; label?: unknown } | null
        if (!link || typeof link !== 'object') throw new Error(`${ctx}: 'referenceLinks[${j}]' must be an object`)
        if (typeof link.url !== 'string' || !link.url.trim()) throw new Error(`${ctx}: 'referenceLinks[${j}].url' must be a non-empty string`)
        if (link.label !== undefined && typeof link.label !== 'string') throw new Error(`${ctx}: 'referenceLinks[${j}].label' must be a string`)
      }
    }
    return rec as unknown as Technique
  })
}

function validateTechniqueConnections(records: unknown[]): TechniqueConnection[] {
  return records.map((r, i) => {
    const ctx = `techniqueConnections[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (!isPosInt(rec.fromTechniqueId)) throw new Error(`${ctx}: 'fromTechniqueId' must be a positive integer`)
    if (!isPosInt(rec.toTechniqueId)) throw new Error(`${ctx}: 'toTechniqueId' must be a positive integer`)
    if (!VALID_CONNECTION_TYPES.has(rec.connectionType as string)) throw new Error(`${ctx}: 'connectionType' must be one of ${[...VALID_CONNECTION_TYPES].join(', ')}`)
    return rec as unknown as TechniqueConnection
  })
}

function validateSessions(records: unknown[]): Session[] {
  return records.map((r, i) => {
    const ctx = `sessions[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (rec.id !== undefined && !isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (!isFiniteNum(rec.date) || (rec.date as number) <= 0) throw new Error(`${ctx}: 'date' must be a positive finite number`)
    if (!Number.isInteger(rec.durationMinutes) || (rec.durationMinutes as number) < 1 || (rec.durationMinutes as number) > 1440) throw new Error(`${ctx}: 'durationMinutes' must be an integer between 1 and 1440`)
    if (!VALID_SESSION_TYPES.has(rec.sessionType as string)) throw new Error(`${ctx}: 'sessionType' must be one of ${[...VALID_SESSION_TYPES].join(', ')}`)
    if (rec.clubId !== undefined && rec.clubId !== null && !Number.isInteger(rec.clubId)) throw new Error(`${ctx}: 'clubId' must be an integer or null`)
    if (typeof rec.notes !== 'string') throw new Error(`${ctx}: 'notes' must be a string`)
    if (rec.notes.length > NOTE_MAX_LENGTH) throw new Error(`${ctx}: 'notes' exceeds ${NOTE_MAX_LENGTH} characters`)
    if (!Number.isInteger(rec.energyLevel) || (rec.energyLevel as number) < 1 || (rec.energyLevel as number) > 5) throw new Error(`${ctx}: 'energyLevel' must be an integer between 1 and 5`)
    return rec as unknown as Session
  })
}

function validateClubs(records: unknown[]): Club[] {
  return records.map((r, i) => {
    const ctx = `clubs[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (rec.id !== undefined && !isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (typeof rec.name !== 'string' || !rec.name.trim()) throw new Error(`${ctx}: 'name' must be a non-empty string`)
    if (rec.name.length > NAME_MAX_LENGTH) throw new Error(`${ctx}: 'name' exceeds ${NAME_MAX_LENGTH} characters`)
    if (!isFiniteNum(rec.sortOrder)) throw new Error(`${ctx}: 'sortOrder' must be a finite number`)
    return rec as unknown as Club
  })
}

function validateSessionTechniques(records: unknown[]): SessionTechnique[] {
  return records.map((r, i) => {
    const ctx = `sessionTechniques[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (!isPosInt(rec.sessionId)) throw new Error(`${ctx}: 'sessionId' must be a positive integer`)
    if (!isPosInt(rec.techniqueId)) throw new Error(`${ctx}: 'techniqueId' must be a positive integer`)
    return rec as unknown as SessionTechnique
  })
}

function validateSessionTaps(records: unknown[]): SessionTap[] {
  return records.map((r, i) => {
    const ctx = `sessionTaps[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (rec.id !== undefined && !isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (!isPosInt(rec.sessionId)) throw new Error(`${ctx}: 'sessionId' must be a positive integer`)
    if (!isPosInt(rec.techniqueId)) throw new Error(`${ctx}: 'techniqueId' must be a positive integer`)
    if (!VALID_TAP_TYPES.has(rec.type as string)) throw new Error(`${ctx}: 'type' must be one of ${[...VALID_TAP_TYPES].join(', ')}`)
    return rec as unknown as SessionTap
  })
}

function validateDrillPlans(records: unknown[]): DrillPlan[] {
  return records.map((r, i) => {
    const ctx = `drillPlans[${i}]`
    if (!r || typeof r !== 'object') throw new Error(`${ctx}: not an object`)
    const rec = r as Record<string, unknown>
    if (rec.id !== undefined && !isPosInt(rec.id)) throw new Error(`${ctx}: 'id' must be a positive integer`)
    if (typeof rec.name !== 'string' || !rec.name.trim()) throw new Error(`${ctx}: 'name' must be a non-empty string`)
    if (rec.name.length > NAME_MAX_LENGTH) throw new Error(`${ctx}: 'name' exceeds ${NAME_MAX_LENGTH} characters`)
    if (!Array.isArray(rec.techniqueIds)) throw new Error(`${ctx}: 'techniqueIds' must be an array`)
    for (let j = 0; j < (rec.techniqueIds as unknown[]).length; j++) {
      if (!Number.isInteger((rec.techniqueIds as unknown[])[j])) throw new Error(`${ctx}: 'techniqueIds[${j}]' must be an integer`)
    }
    if (!isFiniteNum(rec.createdAt) || (rec.createdAt as number) <= 0) throw new Error(`${ctx}: 'createdAt' must be a positive finite number`)
    return rec as unknown as DrillPlan
  })
}

export async function importDatabaseBackup(backup: unknown, database: BJJDatabase = db): Promise<AppLanguage | undefined> {
  const payload = backup as Partial<DatabaseBackup> | null
  if (!payload || typeof payload !== 'object') {
    throw new Error('Malformed backup payload')
  }
  const backupLanguage = payload.language === 'es' || payload.language === 'fr'
    ? payload.language
    : payload.language === 'en'
      ? 'en'
      : undefined

  // Validate all records before any write — throws with a user-facing message on first failure
  const categories = validateCategories(asArray<unknown>(payload.categories))
  const techniques = validateTechniques(asArray<unknown>(payload.techniques))
  const techniqueConnections = validateTechniqueConnections(asArray<unknown>(payload.techniqueConnections))
  const sessions = validateSessions(asArray<unknown>(payload.sessions))
  const sessionTechniques = validateSessionTechniques(asArray<unknown>(payload.sessionTechniques))
  const sessionTaps = validateSessionTaps(asArray<unknown>(payload.sessionTaps))
  const clubs = validateClubs(asArray<unknown>(payload.clubs))
  const drillPlans = validateDrillPlans(asArray<unknown>(payload.drillPlans))

  await database.transaction(
    'rw',
    [
      database.categories,
      database.techniques,
      database.techniqueConnections,
      database.sessions,
      database.sessionTechniques,
      database.sessionTaps,
      database.clubs,
      database.drillPlans,
    ],
    async () => {
      await database.sessionTaps.clear()
      await database.sessionTechniques.clear()
      await database.techniqueConnections.clear()
      await database.sessions.clear()
      await database.drillPlans.clear()
      await database.techniques.clear()
      await database.clubs.clear()
      await database.categories.clear()

      if (categories.length) await database.categories.bulkAdd(categories)
      if (techniques.length) await database.techniques.bulkAdd(techniques)
      if (techniqueConnections.length) await database.techniqueConnections.bulkAdd(techniqueConnections)
      if (sessions.length) await database.sessions.bulkAdd(sessions)
      if (sessionTechniques.length) await database.sessionTechniques.bulkAdd(sessionTechniques)
      if (sessionTaps.length) await database.sessionTaps.bulkAdd(sessionTaps)
      if (clubs.length) await database.clubs.bulkAdd(clubs)
      if (drillPlans.length) await database.drillPlans.bulkAdd(drillPlans)
    },
  )
  return backupLanguage
}
