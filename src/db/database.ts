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
