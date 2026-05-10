import Dexie, { type Table } from 'dexie'
import type {
  Category,
  Technique,
  TechniqueConnection,
  Session,
  SessionTechnique,
  Club,
  SessionSubmission,
} from '../types'
import { prefilledCategories, prefilledTechniques, prefilledConnections } from './prefilled'

export class BJJDatabase extends Dexie {
  categories!: Table<Category, number>
  techniques!: Table<Technique, number>
  techniqueConnections!: Table<TechniqueConnection, [number, number]>
  sessions!: Table<Session, number>
  sessionTechniques!: Table<SessionTechnique, [number, number]>
  clubs!: Table<Club, number>
  sessionSubmissions!: Table<SessionSubmission, number>

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
      clubs: '++id, sortOrder, name',
      sessionSubmissions: '++id, sessionId, techniqueId, outcome',
    }).upgrade(async tx => {
      const techniquesTable = tx.table('techniques')
      await techniquesTable.bulkPut(prefilledTechniques)
      const sessions = await tx.table('sessions').toArray()
      const needsMigration = sessions.some(s => {
        const legacy = s as { tapsGiven?: number; tapsReceived?: number }
        return (legacy.tapsGiven ?? 0) > 0 || (legacy.tapsReceived ?? 0) > 0
      })
      if (!needsMigration) return
      const submissionsTable = tx.table('sessionSubmissions')
      const existing = await techniquesTable.where('name').equals('Unspecified Submission').first()
      let unspecifiedId = existing?.id as number | undefined
      if (!unspecifiedId) {
        const last = await techniquesTable.orderBy('id').last()
        unspecifiedId = typeof last?.id === 'number' ? last.id + 1 : 1000
        await techniquesTable.add({
          id: unspecifiedId,
          name: 'Unspecified Submission',
          description: 'Placeholder technique used to track past submissions without a specific name.',
          cues: ['Identify the finish used', 'Update sessions with the real technique'],
          categoryId: 4,
          youtubeUrl: '',
          difficulty: 'BEGINNER',
          isCustom: true,
        })
      }
      const entries: Omit<SessionSubmission, 'id'>[] = []
      sessions.forEach(s => {
        const legacy = s as { id?: number; tapsGiven?: number; tapsReceived?: number }
        if (!legacy.id) return
        const tapsGiven = Number(legacy.tapsGiven ?? 0)
        const tapsReceived = Number(legacy.tapsReceived ?? 0)
        if (tapsGiven > 0) {
          entries.push({
            sessionId: legacy.id,
            techniqueId: unspecifiedId!,
            outcome: 'GIVEN',
            count: tapsGiven,
          })
        }
        if (tapsReceived > 0) {
          entries.push({
            sessionId: legacy.id,
            techniqueId: unspecifiedId!,
            outcome: 'RECEIVED',
            count: tapsReceived,
          })
        }
      })
      if (entries.length > 0) {
        await submissionsTable.bulkAdd(entries)
      }
    })
  }
}

export const db = new BJJDatabase()

db.on('populate', async () => {
  await db.categories.bulkAdd(prefilledCategories)
  await db.techniques.bulkAdd(prefilledTechniques)
  await db.techniqueConnections.bulkAdd(prefilledConnections)
})
