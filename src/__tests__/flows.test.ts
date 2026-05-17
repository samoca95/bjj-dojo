import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { makeTestDb, openDb, closeDb } from '../test/testDb'
import {
  BJJDatabase,
  BACKUP_FILE_FORMAT_VERSION,
  exportDatabaseBackup,
  importDatabaseBackup,
  type DatabaseBackup,
} from '../db/database'
import { prefilledFlows } from '../db/prefilled'
import type { Flow } from '../types'

let db: BJJDatabase

beforeEach(async () => {
  db = makeTestDb()
  await openDb(db)
})

afterEach(async () => {
  await closeDb(db)
})

function userFlow(overrides: Partial<Flow> = {}): Flow {
  return {
    name: 'User flow',
    description: 'desc',
    isCustom: true,
    createdAt: 1,
    updatedAt: 1,
    rootNodeId: 'a',
    nodes: [
      { id: 'a', techniqueId: 101, childIds: ['b'] },
      { id: 'b', techniqueId: 405, childIds: [] },
    ],
    ...overrides,
  }
}

describe('Flows table', () => {
  it('populates prefilled flows on first open', async () => {
    const flows = await db.flows.toArray()
    expect(flows.length).toBe(prefilledFlows.length)
    const ids = flows.map((f) => f.id).sort()
    expect(ids).toEqual([9001, 9002, 9003])
  })

  it('round-trips a user flow with nested nodes', async () => {
    const id = await db.flows.add(userFlow())
    const loaded = await db.flows.get(id)
    expect(loaded?.nodes).toHaveLength(2)
    expect(loaded?.nodes[0].childIds).toEqual(['b'])
    expect(loaded?.rootNodeId).toBe('a')
  })

  it('user flow ids start above the prefilled 9000+ range', async () => {
    const id = await db.flows.add(userFlow())
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(9003)
  })
})

describe('Flow backup roundtrip', () => {
  it('exports and re-imports flows intact', async () => {
    await db.flows.add(userFlow({ name: 'Roundtrip flow' }))
    const backup = await exportDatabaseBackup(db)
    expect(backup.flows.length).toBe(prefilledFlows.length + 1)

    const fresh = makeTestDb()
    await openDb(fresh)
    try {
      await importDatabaseBackup(backup, fresh)
      const after = await fresh.flows.toArray()
      expect(after.length).toBe(prefilledFlows.length + 1)
      expect(after.find((f) => f.name === 'Roundtrip flow')).toBeTruthy()
    } finally {
      await closeDb(fresh)
    }
  })
})

describe('validateFlows', () => {
  function importWithFlows(flows: unknown[]) {
    const backup: DatabaseBackup = {
      version: BACKUP_FILE_FORMAT_VERSION,
      exportedAt: 1,
      categories: [],
      techniques: [],
      techniqueConnections: [],
      sessions: [],
      sessionTechniques: [],
      sessionTaps: [],
      clubs: [],
      drillPlans: [],
      flows: flows as Flow[],
    }
    return importDatabaseBackup(backup, db)
  }

  it('rejects empty nodes array', async () => {
    await expect(
      importWithFlows([
        { ...userFlow(), nodes: [], rootNodeId: 'a' },
      ]),
    ).rejects.toThrow(/'nodes' must not be empty/)
  })

  it('rejects rootNodeId not in nodes', async () => {
    await expect(
      importWithFlows([{ ...userFlow(), rootNodeId: 'missing' }]),
    ).rejects.toThrow(/'rootNodeId' 'missing' is not in 'nodes'/)
  })

  it('rejects duplicate node ids', async () => {
    await expect(
      importWithFlows([
        {
          ...userFlow(),
          rootNodeId: 'a',
          nodes: [
            { id: 'a', techniqueId: 101, childIds: ['b'] },
            { id: 'a', techniqueId: 102, childIds: [] },
            { id: 'b', techniqueId: 405, childIds: [] },
          ],
        },
      ]),
    ).rejects.toThrow(/duplicate node id 'a'/)
  })

  it('rejects a child reference to a missing node', async () => {
    await expect(
      importWithFlows([
        {
          ...userFlow(),
          rootNodeId: 'a',
          nodes: [{ id: 'a', techniqueId: 101, childIds: ['ghost'] }],
        },
      ]),
    ).rejects.toThrow(/missing child 'ghost'/)
  })

  it('rejects a node referenced by two parents (DAG)', async () => {
    await expect(
      importWithFlows([
        {
          ...userFlow(),
          rootNodeId: 'a',
          nodes: [
            { id: 'a', techniqueId: 101, childIds: ['b', 'c'] },
            { id: 'b', techniqueId: 102, childIds: ['d'] },
            { id: 'c', techniqueId: 103, childIds: ['d'] },
            { id: 'd', techniqueId: 405, childIds: [] },
          ],
        },
      ]),
    ).rejects.toThrow(/node 'd' must be referenced by exactly one parent/)
  })

  it('rejects a cycle', async () => {
    await expect(
      importWithFlows([
        {
          ...userFlow(),
          rootNodeId: 'a',
          nodes: [
            { id: 'a', techniqueId: 101, childIds: ['b'] },
            { id: 'b', techniqueId: 102, childIds: ['a'] },
          ],
        },
      ]),
    ).rejects.toThrow(
      /must be referenced by exactly one parent|cycle detected|root node 'a' must not be a child/,
    )
  })

  it('rejects flows referencing a missing technique', async () => {
    // The fixture has no techniques, so the user flow's techniqueId 101 is missing.
    await expect(importWithFlows([userFlow()])).rejects.toThrow(
      /flows\[0\]\.nodes\[0\]: 'techniqueId' 101 does not match any technique/,
    )
  })
})
