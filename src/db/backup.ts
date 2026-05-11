import type { BJJDatabase } from './database'
import type { Category, Club, Session, SessionTap, SessionTechnique, Technique, TechniqueConnection } from '../types'

export interface BackupPayload {
  schemaVersion: number
  exportedAt: number
  categories: Category[]
  techniques: Technique[]
  techniqueConnections: TechniqueConnection[]
  sessions: Session[]
  sessionTechniques: SessionTechnique[]
  sessionTaps: SessionTap[]
  clubs: Club[]
}

const BACKUP_SCHEMA_VERSION = 1

export async function exportDatabase(database: BJJDatabase): Promise<BackupPayload> {
  const [
    categories,
    techniques,
    techniqueConnections,
    sessions,
    sessionTechniques,
    sessionTaps,
    clubs,
  ] = await Promise.all([
    database.categories.toArray(),
    database.techniques.toArray(),
    database.techniqueConnections.toArray(),
    database.sessions.toArray(),
    database.sessionTechniques.toArray(),
    database.sessionTaps.toArray(),
    database.clubs.toArray(),
  ])

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: Date.now(),
    categories,
    techniques,
    techniqueConnections,
    sessions,
    sessionTechniques,
    sessionTaps,
    clubs,
  }
}

function assertArray<T>(value: unknown, label: string): asserts value is T[] {
  if (!Array.isArray(value)) throw new Error(`Invalid backup: ${label} must be an array.`)
}

export function parseBackupJson(raw: string): BackupPayload {
  const parsed = JSON.parse(raw) as Partial<BackupPayload>
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('Unsupported backup schema version.')
  }

  assertArray<Category>(parsed.categories, 'categories')
  assertArray<Technique>(parsed.techniques, 'techniques')
  assertArray<TechniqueConnection>(parsed.techniqueConnections, 'techniqueConnections')
  assertArray<Session>(parsed.sessions, 'sessions')
  assertArray<SessionTechnique>(parsed.sessionTechniques, 'sessionTechniques')
  assertArray<SessionTap>(parsed.sessionTaps, 'sessionTaps')
  assertArray<Club>(parsed.clubs, 'clubs')

  return {
    schemaVersion: parsed.schemaVersion,
    exportedAt: typeof parsed.exportedAt === 'number' ? parsed.exportedAt : Date.now(),
    categories: parsed.categories,
    techniques: parsed.techniques,
    techniqueConnections: parsed.techniqueConnections,
    sessions: parsed.sessions,
    sessionTechniques: parsed.sessionTechniques,
    sessionTaps: parsed.sessionTaps,
    clubs: parsed.clubs,
  }
}

export async function importDatabase(database: BJJDatabase, payload: BackupPayload) {
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
    ],
    async () => {
      await database.sessionTaps.clear()
      await database.sessionTechniques.clear()
      await database.sessions.clear()
      await database.techniqueConnections.clear()
      await database.techniques.clear()
      await database.categories.clear()
      await database.clubs.clear()

      if (payload.categories.length > 0) await database.categories.bulkPut(payload.categories)
      if (payload.techniques.length > 0) await database.techniques.bulkPut(payload.techniques)
      if (payload.techniqueConnections.length > 0) await database.techniqueConnections.bulkPut(payload.techniqueConnections)
      if (payload.sessions.length > 0) await database.sessions.bulkPut(payload.sessions)
      if (payload.sessionTechniques.length > 0) await database.sessionTechniques.bulkPut(payload.sessionTechniques)
      if (payload.sessionTaps.length > 0) await database.sessionTaps.bulkPut(payload.sessionTaps)
      if (payload.clubs.length > 0) await database.clubs.bulkPut(payload.clubs)
    },
  )
}
