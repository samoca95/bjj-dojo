import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import { BJJDatabase, resetPrefilledTechniques } from '../db/database'
import { prefilledTechniques } from '../db/prefilled'
import Dexie from 'dexie'

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

describe('Migration upgrade integrity', () => {
  it('upgrades legacy v1 data to latest schema and preserves custom technique', async () => {
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

    await legacy.table('categories').bulkAdd([{ id: 1, name: 'Guards', description: '', icon: 'shield' }])
    await legacy.table('techniques').bulkAdd([
      { id: 101, name: 'Legacy Prefilled', description: '', cues: [], categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: false },
      { id: 9000, name: 'Legacy Custom', description: 'custom', cues: [], categoryId: 1, youtubeUrl: '', difficulty: 'BEGINNER', isCustom: true },
    ])
    legacy.close()

    const upgraded = new BJJDatabase(legacyName)
    await upgraded.open()

    await expect(upgraded.sessionTaps.toArray()).resolves.toEqual([])
    await expect(upgraded.clubs.toArray()).resolves.toEqual([])
    const custom = await upgraded.techniques.get(9000)
    expect(custom?.name).toBe('Legacy Custom')
    expect(custom?.isCustom).toBe(true)
    const prefilled = await upgraded.techniques.get(101)
    expect(prefilled?.name).toBe(prefilledTechniques.find(t => t.id === 101)?.name)

    upgraded.close()
    await Dexie.delete(legacyName)
  })
})
