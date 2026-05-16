import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import {
  BJJDatabase,
  exportDatabaseBackup,
  importDatabaseBackup,
  BACKUP_FILE_FORMAT_VERSION,
  type DatabaseBackup,
} from '../db/database'
import { prefilledTechniques, prefilledCategories } from '../db/prefilled'
import {
  BACKUP_PREFERENCE_KEYS,
  clearAllPrefixedStorage,
} from '../utils/backupPreferences'

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
  clearAllPrefixedStorage(window.localStorage)
})

afterEach(async () => {
  await closeDb(db)
  clearAllPrefixedStorage(window.localStorage)
})

async function snapshotTables(database: BJJDatabase) {
  return {
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

describe('exportDatabaseBackup', () => {
  it('writes the current schema version and signature', async () => {
    const backup = await exportDatabaseBackup(db)
    expect(backup.version).toBe(BACKUP_FILE_FORMAT_VERSION)
    expect(backup.schemaVersion).toBe(db.verno)
    expect(typeof backup.schemaSignature).toBe('string')
    expect(backup.schemaSignature?.length).toBeGreaterThan(0)
  })

  it('preserves canonical English text on prefilled techniques regardless of UI language', async () => {
    for (const language of ['en', 'es', 'fr'] as const) {
      const backup = await exportDatabaseBackup(db, language)
      // language is recorded as a hint only — content must be canonical
      expect(backup.language).toBe(language)
      for (const exported of backup.techniques.filter((t) => !t.isCustom)) {
        const source = prefilledTechniques.find((t) => t.id === exported.id)!
        expect(exported.name).toBe(source.name)
        expect(exported.description).toBe(source.description)
        expect(exported.cues).toEqual(source.cues)
      }
      for (const exported of backup.categories) {
        const source = prefilledCategories.find((c) => c.id === exported.id)!
        expect(exported.name).toBe(source.name)
        expect(exported.description).toBe(source.description)
      }
    }
  })

  it('includes a preferences block built from bjj-dojo localStorage keys', async () => {
    window.localStorage.setItem('bjj-dojo:user-name', 'Ana')
    window.localStorage.setItem('bjj-dojo:belt-color', 'purple')
    window.localStorage.setItem('bjj-dojo:goal-mat-time', '180')
    window.localStorage.setItem(
      'bjj-dojo:focus-technique-ids',
      JSON.stringify([401, 402]),
    )
    // A non-backup-list key must NOT be included
    window.localStorage.setItem('bjj-dojo:onboarding-completed', 'true')

    const backup = await exportDatabaseBackup(db)
    expect(backup.preferences).toBeDefined()
    expect(backup.preferences!['bjj-dojo:user-name']).toBe('Ana')
    expect(backup.preferences!['bjj-dojo:belt-color']).toBe('purple')
    expect(backup.preferences!['bjj-dojo:goal-mat-time']).toBe('180')
    expect(backup.preferences!['bjj-dojo:focus-technique-ids']).toBe(
      JSON.stringify([401, 402]),
    )
    expect(backup.preferences!['bjj-dojo:onboarding-completed']).toBeUndefined()
  })
})

describe('Backup round-trip parity', () => {
  it('round-trips a fresh install into an empty DB with identical contents', async () => {
    const before = await snapshotTables(db)
    const backup = await exportDatabaseBackup(db)

    const dest = makeTestDb()
    await openDb(dest)
    try {
      // Wipe the prefilled seed so the import is the sole source.
      await dest.techniques.clear()
      await dest.categories.clear()
      await dest.techniqueConnections.clear()
      await importDatabaseBackup(backup, dest)
      const after = await snapshotTables(dest)
      expect(after).toEqual(before)
    } finally {
      await closeDb(dest)
    }
  })

  it('round-trips mixed prefilled + custom + sessions + taps + drill plans', async () => {
    // Custom data covering every optional field
    await db.clubs.add({ id: 1, name: 'Dojo Alpha', sortOrder: 0 })
    await db.techniques.add({
      id: 9001,
      name: 'Custom Sweep',
      aliases: ['flying sweep'],
      description: 'A custom sweep',
      cues: ['plant the foot'],
      tags: ['sweep', 'guard'],
      isFavorite: true,
      gi: true,
      noGi: false,
      categoryId: 1,
      youtubeUrl: '',
      imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
      referenceLinks: [{ url: 'https://example.com', label: 'Notes' }],
      difficulty: 'INTERMEDIATE',
      isCustom: true,
    })
    await db.techniqueConnections.add({
      fromTechniqueId: 9001,
      toTechniqueId: 401, // Armbar (prefilled)
      connectionType: 'FOLLOW_UP',
    })

    const sessionIds: number[] = []
    for (const type of ['GI', 'NOGI', 'OPEN_MAT', 'COMPETITION', 'DRILLING'] as const) {
      const id = (await db.sessions.add({
        date: Date.now() + sessionIds.length * 1000,
        durationMinutes: 60,
        sessionType: type,
        clubId: 1,
        notes: `${type} session notes`,
        energyLevel: 4,
      })) as number
      sessionIds.push(id)
      await db.sessionTechniques.add({
        sessionId: id,
        techniqueId: 9001,
        notes: 'felt smooth',
      })
      await db.sessionTaps.add({
        sessionId: id,
        techniqueId: 401,
        type: 'given',
      })
      await db.sessionTaps.add({
        sessionId: id,
        techniqueId: 9001,
        type: 'received',
      })
    }
    await db.drillPlans.add({
      name: 'Sweep flow',
      techniqueIds: [9001, 401],
      createdAt: Date.now(),
    })

    const before = await snapshotTables(db)
    const backup = await exportDatabaseBackup(db)

    const dest = makeTestDb()
    await openDb(dest)
    try {
      await importDatabaseBackup(backup, dest)
      const after = await snapshotTables(dest)
      expect(after).toEqual(before)
    } finally {
      await closeDb(dest)
    }
  })

  it('restores preferences and dispatches the matching update events', async () => {
    window.localStorage.setItem('bjj-dojo:user-name', 'Ana')
    window.localStorage.setItem('bjj-dojo:belt-color', 'purple')
    window.localStorage.setItem('bjj-dojo:goal-mat-time', '180')
    window.localStorage.setItem(
      'bjj-dojo:focus-goals',
      JSON.stringify({ 401: 10 }),
    )

    const backup = await exportDatabaseBackup(db)
    clearAllPrefixedStorage(window.localStorage)
    expect(window.localStorage.getItem('bjj-dojo:user-name')).toBeNull()

    let beltEventFired = 0
    let focusEventFired = 0
    const onBelt = () => beltEventFired++
    const onFocus = () => focusEventFired++
    window.addEventListener('bjj-dojo:belt-rank-updated', onBelt)
    window.addEventListener('bjj-dojo:focus-goals-updated', onFocus)
    try {
      await importDatabaseBackup(backup, db)
      expect(window.localStorage.getItem('bjj-dojo:user-name')).toBe('Ana')
      expect(window.localStorage.getItem('bjj-dojo:belt-color')).toBe('purple')
      expect(window.localStorage.getItem('bjj-dojo:goal-mat-time')).toBe('180')
      expect(beltEventFired).toBeGreaterThan(0)
      expect(focusEventFired).toBeGreaterThan(0)
    } finally {
      window.removeEventListener('bjj-dojo:belt-rank-updated', onBelt)
      window.removeEventListener('bjj-dojo:focus-goals-updated', onFocus)
    }
  })

  it('legacy v1 payloads import successfully and leave preferences untouched', async () => {
    window.localStorage.setItem('bjj-dojo:user-name', 'Original')

    const v1Payload = {
      version: 1,
      exportedAt: 1_700_000_000_000,
      categories: [{ id: 1, name: 'Guards', description: '' }],
      techniques: [
        {
          id: 101,
          name: 'Closed Guard',
          description: '',
          categoryId: 1,
          youtubeUrl: '',
          difficulty: 'BEGINNER' as const,
          isCustom: false,
        },
      ],
      techniqueConnections: [],
      sessions: [],
      sessionTechniques: [],
      sessionTaps: [],
      clubs: [],
      drillPlans: [],
    }

    await importDatabaseBackup(v1Payload, db)
    // Preferences in localStorage are unchanged because the payload has no preferences block
    expect(window.localStorage.getItem('bjj-dojo:user-name')).toBe('Original')
    const techniques = await db.techniques.toArray()
    expect(techniques).toHaveLength(1)
    expect(techniques[0].name).toBe('Closed Guard')
  })

  it('round-trip preserves optional fields like aliases:[] and labeled reference links', async () => {
    await db.techniques.add({
      id: 9100,
      name: 'Edge Case Custom',
      aliases: [],
      cues: [],
      tags: [],
      description: '',
      categoryId: 1,
      youtubeUrl: '',
      difficulty: 'BEGINNER',
      isCustom: true,
      referenceLinks: [
        { url: 'https://a.example/1', label: 'A' },
        { url: 'https://b.example/2' },
      ],
    })

    const backup = await exportDatabaseBackup(db)
    const dest = makeTestDb()
    await openDb(dest)
    try {
      await importDatabaseBackup(backup, dest)
      const restored = await dest.techniques.get(9100)
      expect(restored?.aliases).toEqual([])
      expect(restored?.cues).toEqual([])
      expect(restored?.tags).toEqual([])
      expect(restored?.referenceLinks).toEqual([
        { url: 'https://a.example/1', label: 'A' },
        { url: 'https://b.example/2' },
      ])
    } finally {
      await closeDb(dest)
    }
  })
})

describe('Schema signature mismatch', () => {
  it('rejects a backup whose schemaSignature differs from the live build', async () => {
    const bad = (await exportDatabaseBackup(db)) as DatabaseBackup
    bad.schemaSignature = 'something:from-a-newer-build'
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /schema does not match/,
    )
  })

  it('imports a backup that omits schemaSignature (legacy)', async () => {
    const backup = (await exportDatabaseBackup(db)) as DatabaseBackup
    delete backup.schemaSignature
    await expect(importDatabaseBackup(backup, db)).resolves.not.toThrow()
  })
})

describe('Referential integrity', () => {
  function fixture(): DatabaseBackup {
    return {
      version: BACKUP_FILE_FORMAT_VERSION,
      exportedAt: Date.now(),
      categories: [{ id: 1, name: 'Guards', description: '' }],
      techniques: [
        {
          id: 101,
          name: 'Closed Guard',
          description: '',
          categoryId: 1,
          youtubeUrl: '',
          difficulty: 'BEGINNER',
          isCustom: false,
        },
      ],
      techniqueConnections: [],
      sessions: [
        {
          id: 1,
          date: 1_700_000_000_000,
          durationMinutes: 60,
          sessionType: 'GI',
          notes: '',
          energyLevel: 3,
        },
      ],
      sessionTechniques: [{ sessionId: 1, techniqueId: 101 }],
      sessionTaps: [{ id: 1, sessionId: 1, techniqueId: 101, type: 'given' }],
      clubs: [{ id: 1, name: 'Dojo', sortOrder: 1 }],
      drillPlans: [
        {
          id: 1,
          name: 'Warm-up',
          techniqueIds: [101],
          createdAt: 1_700_000_000_000,
        },
      ],
    }
  }

  it('rejects a sessionTechniques row pointing at a missing technique', async () => {
    const bad = fixture()
    bad.sessionTechniques = [{ sessionId: 1, techniqueId: 9999 }]
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /sessionTechniques\[0\]: 'techniqueId' 9999 does not match/,
    )
  })

  it('rejects a sessionTap pointing at a missing session', async () => {
    const bad = fixture()
    bad.sessionTaps = [
      { id: 1, sessionId: 555, techniqueId: 101, type: 'given' },
    ]
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /sessionTaps\[0\]: 'sessionId' 555 does not match/,
    )
  })

  it('rejects a techniqueConnection with a dangling toTechniqueId', async () => {
    const bad = fixture()
    bad.techniqueConnections = [
      { fromTechniqueId: 101, toTechniqueId: 4242, connectionType: 'FOLLOW_UP' },
    ]
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /techniqueConnections\[0\]: 'toTechniqueId' 4242 does not match/,
    )
  })

  it('rejects a session with a clubId not in clubs', async () => {
    const bad = fixture()
    bad.sessions[0].clubId = 77
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /sessions\[0\]: 'clubId' 77 does not match/,
    )
  })

  it('rejects a drillPlan with a dangling techniqueId', async () => {
    const bad = fixture()
    bad.drillPlans[0].techniqueIds = [101, 12345]
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow(
      /drillPlans\[0\]: 'techniqueIds\[1\]' 12345 does not match/,
    )
  })

  it('does not modify the database when referential validation fails', async () => {
    const sid = (await db.sessions.add({
      date: Date.now(),
      durationMinutes: 30,
      sessionType: 'GI',
      notes: 'pre-existing',
      energyLevel: 3,
    })) as number
    const beforeCount = await db.sessions.count()

    const bad = fixture()
    bad.sessionTechniques = [{ sessionId: 1, techniqueId: 9999 }]
    await expect(importDatabaseBackup(bad, db)).rejects.toThrow()

    expect(await db.sessions.count()).toBe(beforeCount)
    expect((await db.sessions.get(sid))?.notes).toBe('pre-existing')
  })
})

describe('Strict array handling', () => {
  it('rejects a payload with a string in place of an array field', async () => {
    const backup = (await exportDatabaseBackup(db)) as DatabaseBackup
    const broken = { ...backup, sessionTaps: 'not an array' as unknown }
    await expect(importDatabaseBackup(broken, db)).rejects.toThrow(
      /sessionTaps: expected an array/,
    )
  })

  it('treats missing array fields as empty for forward compatibility', async () => {
    const minimal = {
      version: BACKUP_FILE_FORMAT_VERSION,
      exportedAt: Date.now(),
      categories: [],
      techniques: [],
      // sessions, taps, etc. all missing
    }
    await expect(importDatabaseBackup(minimal, db)).resolves.not.toThrow()
    expect(await db.sessions.count()).toBe(0)
    expect(await db.techniques.count()).toBe(0)
  })
})

describe('Backup constants', () => {
  it('canonical preference list covers belt, name, goals, layout, share, locale', () => {
    const all = BACKUP_PREFERENCE_KEYS as readonly string[]
    expect(all).toContain('bjj-dojo:user-name')
    expect(all).toContain('bjj-dojo:belt-color')
    expect(all).toContain('bjj-dojo:goal-mat-time')
    expect(all).toContain('bjj-dojo:focus-technique-ids')
    expect(all).toContain('bjj-dojo:home-section-order')
    expect(all).toContain('bjj-dojo:share-theme')
    expect(all).toContain('bjj-dojo:language')
    expect(all).toContain('bjj-dojo.theme')
    // Non-backup flags must NOT be included
    expect(all).not.toContain('bjj-dojo:onboarding-completed')
    expect(all).not.toContain('bjj-dojo:initial-setup-completed')
    expect(all).not.toContain('bjj-dojo:telemetry')
  })
})
