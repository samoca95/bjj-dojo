import Dexie, { type Table } from 'dexie'
import type { Category, Technique, TechniqueConnection, Session, SessionTechnique, SessionTap, Club, DrillPlan } from '../types'
import { prefilledCategories, prefilledTechniques, prefilledConnections } from './prefilled'
import { telemetry } from '../utils/telemetry'

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
    }).upgrade(async tx => {
      // Backfill cues onto existing prefilled techniques.
      // Use toArray() + JS filter — isCustom is not an indexed field.
      const all = await tx.table('techniques').toArray() as Technique[]
      const prefilled = all.filter(e => e.isCustom === false)
      const byId = new Map(prefilledTechniques.map(t => [t.id, t]))
      const updates = prefilled
        .filter(e => byId.has(e.id))
        .map(e => ({ ...e, ...byId.get(e.id)! }))
      if (updates.length > 0) await tx.table('techniques').bulkPut(updates)
    })
    this.version(4).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date, clubId',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
      sessionTaps: '++id, sessionId, techniqueId',
      clubs: '++id, sortOrder, name',
    }).upgrade(async tx => {
      // Keep prefilled data in sync for existing installs while preserving custom techniques.
      await tx.table('techniques').bulkPut(prefilledTechniques)
      await tx.table('techniqueConnections').bulkPut(prefilledConnections)
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
    }).upgrade(async tx => {
      const all = await tx.table('techniques').toArray() as Technique[]
      const normalized = all.map(t => ({
        ...t,
        tags: Array.isArray((t as Technique).tags) ? (t as Technique).tags : [],
        isFavorite: Boolean((t as Technique).isFavorite),
      }))
      if (normalized.length > 0) await tx.table('techniques').bulkPut(normalized)
    })

    // Populate on first creation — registered here so every instance gets it
    // (including isolated test instances).
    this.on('populate', async () => {
      await this.categories.bulkAdd(prefilledCategories)
      await this.techniques.bulkAdd(prefilledTechniques)
      await this.techniqueConnections.bulkAdd(prefilledConnections)
    })

    this.on('error', error => {
      telemetry.error('db.operation_failed', error)
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
  categories: Category[]
  techniques: Technique[]
  techniqueConnections: TechniqueConnection[]
  sessions: Session[]
  sessionTechniques: SessionTechnique[]
  sessionTaps: SessionTap[]
  clubs: Club[]
  drillPlans: DrillPlan[]
}

export async function exportDatabaseBackup(database: BJJDatabase = db): Promise<DatabaseBackup> {
  return {
    version: 1,
    exportedAt: Date.now(),
    categories: await database.categories.toArray(),
    techniques: await database.techniques.toArray(),
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

export async function importDatabaseBackup(backup: unknown, database: BJJDatabase = db) {
  const payload = backup as Partial<DatabaseBackup> | null
  if (!payload || typeof payload !== 'object') {
    throw new Error('Malformed backup payload')
  }

  const categories = asArray<Category>(payload.categories)
  const techniques = asArray<Technique>(payload.techniques)
  const techniqueConnections = asArray<TechniqueConnection>(payload.techniqueConnections)
  const sessions = asArray<Session>(payload.sessions)
  const sessionTechniques = asArray<SessionTechnique>(payload.sessionTechniques)
  const sessionTaps = asArray<SessionTap>(payload.sessionTaps)
  const clubs = asArray<Club>(payload.clubs)
  const drillPlans = asArray<DrillPlan>(payload.drillPlans)

  await database.transaction(
    'rw',
    database.categories,
    database.techniques,
    database.techniqueConnections,
    database.sessions,
    database.sessionTechniques,
    database.sessionTaps,
    database.clubs,
    database.drillPlans,
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
}
