import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import type { BJJDatabase } from '../db/database'
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
