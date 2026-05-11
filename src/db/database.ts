import Dexie, { type Table } from 'dexie'
import type { Category, Technique, TechniqueConnection, Session, SessionTechnique, SessionTap, Club } from '../types'
import { prefilledCategories, prefilledTechniques, prefilledConnections } from './prefilled'

export class BJJDatabase extends Dexie {
  categories!: Table<Category, number>
  techniques!: Table<Technique, number>
  techniqueConnections!: Table<TechniqueConnection, [number, number]>
  sessions!: Table<Session, number>
  sessionTechniques!: Table<SessionTechnique, [number, number]>
  sessionTaps!: Table<SessionTap, number>
  clubs!: Table<Club, number>

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
