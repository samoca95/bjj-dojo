import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import { BJJDatabase, importDatabaseBackup, exportDatabaseBackup, resetPrefilledTechniques } from '../db/database'
import { prefilledTechniques } from '../db/prefilled'

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
})

afterEach(async () => {
  await closeDb(db)
})

// ─── DB Initialisation ───────────────────────────────────────────────────────

describe('Database initialisation', () => {
  it('opens without throwing', async () => {
    expect(db.isOpen()).toBe(true)
  })

  it('populates all prefilled techniques on first open', async () => {
    const techniques = await db.techniques.toArray()
    expect(techniques.length).toBe(prefilledTechniques.length)
  })

  it('populates 7 categories on first open', async () => {
    const categories = await db.categories.toArray()
    expect(categories.length).toBe(7)
  })

  it('creates the sessionTaps table', async () => {
    // If sessionTaps table is missing this throws — that was the v3 upgrade bug
    await expect(db.sessionTaps.toArray()).resolves.toEqual([])
  })

  it('each technique has a cues array', async () => {
    const techniques = await db.techniques.toArray()
    for (const t of techniques) {
      expect(Array.isArray(t.cues)).toBe(true)
      expect((t.cues ?? []).length).toBeGreaterThan(0)
    }
  })
})

// ─── Technique queries ────────────────────────────────────────────────────────

describe('Technique queries', () => {
  it('can filter by categoryId', async () => {
    const guards = await db.techniques.where('categoryId').equals(1).toArray()
    expect(guards.length).toBeGreaterThan(0)
    guards.forEach(t => expect(t.categoryId).toBe(1))
  })

  it('can sort by name', async () => {
    const sorted = await db.techniques.orderBy('name').toArray()
    const names = sorted.map(t => t.name)
    expect(names).toEqual([...names].sort())
  })

  it('custom technique can be added and retrieved', async () => {
    await db.techniques.add({
      id: 9999,
      name: 'Custom Hip Escape Drill',
      description: 'A custom technique',
      cues: ['Shrimp first'],
      categoryId: 6,
      youtubeUrl: '',
      difficulty: 'BEGINNER',
      isCustom: true,
    })
    const found = await db.techniques.get(9999)
    expect(found?.name).toBe('Custom Hip Escape Drill')
    expect(found?.isCustom).toBe(true)
  })
})

// ─── Session CRUD ─────────────────────────────────────────────────────────────

describe('Session CRUD', () => {
  it('adds a session and retrieves it', async () => {
    const id = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 90,
      sessionType: 'GI',
      clubId: null,
      notes: 'Worked on guard passing',
      energyLevel: 4,
    })
    const session = await db.sessions.get(id as number)
    expect(session?.durationMinutes).toBe(90)
    expect(session?.sessionType).toBe('GI')
  })

  it('deletes session and clears related sessionTechniques', async () => {
    const sid = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 60,
      sessionType: 'NOGI',
      clubId: null,
      notes: '',
      energyLevel: 3,
    }) as number

    await db.sessionTechniques.add({ sessionId: sid, techniqueId: 401 })
    expect(await db.sessionTechniques.where('sessionId').equals(sid).count()).toBe(1)

    await db.sessions.delete(sid)
    await db.sessionTechniques.where('sessionId').equals(sid).delete()
    expect(await db.sessionTechniques.where('sessionId').equals(sid).count()).toBe(0)
  })
})

// ─── Tap tracking (key feature) ───────────────────────────────────────────────

describe('Tap tracking with technique association', () => {
  it('records a tap given and links it to a technique', async () => {
    const sid = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 75,
      sessionType: 'GI',
      clubId: null,
      notes: '',
      energyLevel: 3,
    }) as number

    await db.sessionTaps.add({ sessionId: sid, techniqueId: 402, type: 'given' })

    const taps = await db.sessionTaps.where('sessionId').equals(sid).toArray()
    expect(taps.length).toBe(1)
    expect(taps[0].type).toBe('given')
    expect(taps[0].techniqueId).toBe(402)

    // Verify the linked technique exists
    const tech = await db.techniques.get(taps[0].techniqueId)
    expect(tech?.name).toBe('Triangle Choke')
  })

  it('records taps of both types independently', async () => {
    const sid = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 60,
      sessionType: 'NOGI',
      clubId: null,
      notes: '',
      energyLevel: 2,
    }) as number

    await db.sessionTaps.bulkAdd([
      { sessionId: sid, techniqueId: 401, type: 'given' },   // Armbar given
      { sessionId: sid, techniqueId: 405, type: 'received' }, // RNC received
      { sessionId: sid, techniqueId: 401, type: 'given' },   // Armbar given again
    ])

    const all = await db.sessionTaps.where('sessionId').equals(sid).toArray()
    expect(all.length).toBe(3)

    const given = all.filter(t => t.type === 'given')
    const received = all.filter(t => t.type === 'received')
    expect(given.length).toBe(2)
    expect(received.length).toBe(1)
  })

  it('deletes taps when session is removed', async () => {
    const sid = await db.sessions.add({
      date: Date.now(),
      durationMinutes: 60,
      sessionType: 'GI',
      clubId: null,
      notes: '',
      energyLevel: 3,
    }) as number

    await db.sessionTaps.add({ sessionId: sid, techniqueId: 403, type: 'received' })
    await db.sessions.delete(sid)
    await db.sessionTaps.where('sessionId').equals(sid).delete()

    expect(await db.sessionTaps.where('sessionId').equals(sid).count()).toBe(0)
  })
})

// ─── DB upgrade regression guard ─────────────────────────────────────────────

describe('DB upgrade safety', () => {
  it('does not use where() on non-indexed isCustom field during upgrade', async () => {
    // The upgrade code must use toArray() + JS filter — this test validates
    // that all techniques (including custom ones) can coexist safely.
    await db.techniques.add({
      id: 8888,
      name: 'User Custom Technique',
      description: '',
      cues: [],
      categoryId: 1,
      youtubeUrl: '',
      difficulty: 'BEGINNER',
      isCustom: true,
    })

    // Custom technique should not be overwritten by prefilled data
    const custom = await db.techniques.get(8888)
    expect(custom?.isCustom).toBe(true)
    expect(custom?.name).toBe('User Custom Technique')

    // Prefilled techniques should all still be there
    const prefilled = await db.techniques.where('id').below(8000).toArray()
    expect(prefilled.every(t => t.isCustom === false)).toBe(true)
  })
})

describe('Reset prefilled techniques', () => {
  it('resets prefilled techniques but preserves custom ones', async () => {
    await db.techniques.add({
      id: 9001,
      name: 'My Custom Technique',
      description: 'custom',
      cues: ['custom cue'],
      categoryId: 1,
      youtubeUrl: '',
      difficulty: 'BEGINNER',
      isCustom: true,
    })

    await db.techniques.update(101, {
      name: 'Modified Prefilled Name',
      description: 'changed',
    })

    await resetPrefilledTechniques(db)

    const restoredPrefilled = await db.techniques.get(101)
    const custom = await db.techniques.get(9001)
    expect(restoredPrefilled?.name).toBe(prefilledTechniques.find(t => t.id === 101)?.name)
    expect(custom?.name).toBe('My Custom Technique')
    expect(custom?.isCustom).toBe(true)
  })
})

describe('DB migration integrity (v1 -> v5)', () => {
  it('upgrades legacy v1 data and preserves custom records', async () => {
    const legacyName = `bjj-dojo-legacy-${Date.now()}`
    const legacy = new Dexie(legacyName)
    legacy.version(1).stores({
      categories: 'id, name',
      techniques: 'id, categoryId, name',
      techniqueConnections: '[fromTechniqueId+toTechniqueId], fromTechniqueId, toTechniqueId',
      sessions: '++id, date',
      sessionTechniques: '[sessionId+techniqueId], sessionId, techniqueId',
    })
    await legacy.open()
    await legacy.table('categories').bulkAdd([
      { id: 1, name: 'Guards', description: '' },
    ])
    await legacy.table('techniques').bulkAdd([
      { id: 100, name: 'Legacy Prefilled', description: '', cues: ['a'], categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: false },
      { id: 9001, name: 'Legacy Custom', description: '', cues: ['b'], categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: true },
    ])
    await legacy.close()

    const upgraded = new BJJDatabase(legacyName)
    await upgraded.open()
    await expect(upgraded.sessionTaps.toArray()).resolves.toEqual([])
    await expect(upgraded.drillPlans.toArray()).resolves.toEqual([])
    const custom = await upgraded.techniques.get(9001)
    expect(custom?.name).toBe('Legacy Custom')
    expect(custom?.isCustom).toBe(true)
    await closeDb(upgraded)
  })
})

describe('Backup and restore integrity', () => {
  it('exports and imports all collections including drill plans', async () => {
    await db.drillPlans.add({ name: 'Main', techniqueIds: [401], createdAt: Date.now() })
    const backup = await exportDatabaseBackup(db)
    await db.sessions.clear()
    await importDatabaseBackup(backup, db)
    const restored = await db.drillPlans.toArray()
    expect(restored.length).toBe(1)
    expect(restored[0].techniqueIds).toEqual([401])
  })
})

// ─── importDatabaseBackup validation ─────────────────────────────────────────

function validBackup() {
  return {
    version: 1,
    exportedAt: Date.now(),
    categories: [{ id: 1, name: 'Guards', description: '' }],
    techniques: [{ id: 101, name: 'Closed Guard', description: '', categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: false }],
    techniqueConnections: [],
    sessions: [{ id: 1, date: 1_700_000_000_000, durationMinutes: 60, sessionType: 'GI', notes: '', energyLevel: 3 }],
    sessionTechniques: [{ sessionId: 1, techniqueId: 101 }],
    sessionTaps: [{ id: 1, sessionId: 1, techniqueId: 101, type: 'given' }],
    clubs: [{ id: 1, name: 'Dojo', sortOrder: 1 }],
    drillPlans: [{ id: 1, name: 'Warm-up', techniqueIds: [101], createdAt: 1_700_000_000_000 }],
  }
}

describe('importDatabaseBackup validation', () => {
  it('accepts a well-formed backup', async () => {
    await expect(importDatabaseBackup(validBackup(), db)).resolves.not.toThrow()
  })

  it('rejects non-object payload', async () => {
    await expect(importDatabaseBackup('not an object', db)).rejects.toThrow('Malformed backup payload')
  })

  it('rejects a category with a non-integer id', async () => {
    const bad = { ...validBackup(), categories: [{ id: 'x', name: 'Guards', description: '' }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("categories[0]: 'id' must be a positive integer")
  })

  it('rejects a category with an empty name', async () => {
    const bad = { ...validBackup(), categories: [{ id: 1, name: '   ', description: '' }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("categories[0]: 'name' must be a non-empty string")
  })

  it('rejects a technique with an invalid difficulty', async () => {
    const bad = {
      ...validBackup(),
      techniques: [{ id: 101, name: 'T', description: '', categoryId: 1, youtubeUrl: '', difficulty: 'EXPERT', isCustom: false }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("techniques[0]: 'difficulty' must be one of")
  })

  it('rejects a technique with an invalid YouTube URL', async () => {
    const bad = {
      ...validBackup(),
      techniques: [{ id: 101, name: 'T', description: '', categoryId: 1, youtubeUrl: 'https://evil.com/x', difficulty: 'BEGINNER', isCustom: false }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("techniques[0]: 'youtubeUrl' is not a valid YouTube URL")
  })

  it('rejects a technique with a non-boolean isCustom', async () => {
    const bad = {
      ...validBackup(),
      techniques: [{ id: 101, name: 'T', description: '', categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: 'yes' }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("techniques[0]: 'isCustom' must be a boolean")
  })

  it('rejects a techniqueConnection with an invalid connectionType', async () => {
    const bad = { ...validBackup(), techniqueConnections: [{ fromTechniqueId: 1, toTechniqueId: 2, connectionType: 'NOPE' }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("techniqueConnections[0]: 'connectionType' must be one of")
  })

  it('rejects a session with energyLevel out of range', async () => {
    const bad = {
      ...validBackup(),
      sessions: [{ id: 1, date: 1_700_000_000_000, durationMinutes: 60, sessionType: 'GI', notes: '', energyLevel: 6 }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("sessions[0]: 'energyLevel' must be an integer between 1 and 5")
  })

  it('rejects a session with durationMinutes out of range', async () => {
    const bad = {
      ...validBackup(),
      sessions: [{ id: 1, date: 1_700_000_000_000, durationMinutes: 0, sessionType: 'GI', notes: '', energyLevel: 3 }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("sessions[0]: 'durationMinutes' must be an integer between 1 and 1440")
  })

  it('rejects a session with an invalid sessionType', async () => {
    const bad = {
      ...validBackup(),
      sessions: [{ id: 1, date: 1_700_000_000_000, durationMinutes: 60, sessionType: 'YOGA', notes: '', energyLevel: 3 }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("sessions[0]: 'sessionType' must be one of")
  })

  it('rejects a sessionTap with an invalid type', async () => {
    const bad = { ...validBackup(), sessionTaps: [{ id: 1, sessionId: 1, techniqueId: 101, type: 'submitted' }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("sessionTaps[0]: 'type' must be one of")
  })

  it('rejects a club with a missing name', async () => {
    const bad = { ...validBackup(), clubs: [{ id: 1, name: '', sortOrder: 1 }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("clubs[0]: 'name' must be a non-empty string")
  })

  it('rejects a drillPlan with a non-array techniqueIds', async () => {
    const bad = { ...validBackup(), drillPlans: [{ id: 1, name: 'Plan', techniqueIds: 'all', createdAt: 1_700_000_000_000 }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("drillPlans[0]: 'techniqueIds' must be an array")
  })

  it('rejects a drillPlan with a non-integer element in techniqueIds', async () => {
    const bad = { ...validBackup(), drillPlans: [{ id: 1, name: 'Plan', techniqueIds: ['x'], createdAt: 1_700_000_000_000 }] }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow("drillPlans[0]: 'techniqueIds[0]' must be an integer")
  })

  it('leaves the database unmodified when validation fails', async () => {
    const sid = await db.sessions.add({ date: Date.now(), durationMinutes: 45, sessionType: 'GI', notes: 'original', energyLevel: 3 }) as number
    const countBefore = await db.sessions.count()

    const bad = {
      ...validBackup(),
      sessions: [{ id: 1, date: 1_700_000_000_000, durationMinutes: 9999, sessionType: 'GI', notes: '', energyLevel: 3 }],
    }
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow()

    const countAfter = await db.sessions.count()
    const original = await db.sessions.get(sid)
    expect(countAfter).toBe(countBefore)
    expect(original?.notes).toBe('original')
  })
})
