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

  constructor() {
    super('bjj-dojo')
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
      // Update prefilled techniques to include cues
      const existing = await tx.table('techniques').where('isCustom').equals(0).toArray()
      const updates = prefilledTechniques.filter(pt =>
        existing.some((e: Technique) => e.id === pt.id),
      )
      if (updates.length > 0) await tx.table('techniques').bulkPut(updates)
    })
  }
}

export const db = new BJJDatabase()

db.on('populate', async () => {
  await db.categories.bulkAdd(prefilledCategories)
  await db.techniques.bulkAdd(prefilledTechniques)
  await db.techniqueConnections.bulkAdd(prefilledConnections)
})
