import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import type { BJJDatabase } from '../db/database'
import { exportDatabase, importDatabase, parseBackupJson } from '../db/backup'

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
})

afterEach(async () => {
  await closeDb(db)
})

describe('backup utilities', () => {
  it('exports and imports database payload', async () => {
    const sid = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 60,
      sessionType: 'GI',
      clubId: null,
      notes: 'backup test',
      energyLevel: 3,
    }) as number

    await db.sessionTaps.add({ sessionId: sid, techniqueId: 401, type: 'given' })

    const payload = await exportDatabase(db)
    expect(payload.schemaVersion).toBe(1)
    expect(payload.sessions.length).toBeGreaterThan(0)

    await db.sessions.clear()
    await importDatabase(db, payload)

    const restored = await db.sessions.toArray()
    expect(restored.length).toBe(payload.sessions.length)
  })

  it('parses valid backup json', async () => {
    const payload = await exportDatabase(db)
    const parsed = parseBackupJson(JSON.stringify(payload))
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.techniques.length).toBeGreaterThan(0)
  })

  it('rejects invalid backup json', () => {
    expect(() => parseBackupJson('{"schemaVersion":999}')).toThrow()
  })
})
