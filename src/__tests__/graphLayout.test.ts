import { describe, it, expect } from 'vitest'
import {
  forceDirectedLayout,
  computeViewBox,
  zoomViewBox,
  parseViewBox,
  type GraphNodePosition,
} from '../utils/graphLayout'

function dist(a: GraphNodePosition, b: GraphNodePosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

describe('forceDirectedLayout', () => {
  it('returns an empty map for no nodes', () => {
    expect(forceDirectedLayout([], []).size).toBe(0)
  })

  it('places a single node at the origin', () => {
    const pos = forceDirectedLayout([5], [])
    expect(pos.get(5)).toEqual({ x: 0, y: 0 })
  })

  it('returns a finite position for every node', () => {
    const ids = [1, 2, 3, 4, 5]
    const pos = forceDirectedLayout(ids, [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
    ])
    expect(pos.size).toBe(5)
    for (const id of ids) {
      const p = pos.get(id)!
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })

  it('is deterministic — identical inputs produce identical layouts', () => {
    const ids = [1, 2, 3, 4]
    const edges = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
    ]
    const a = forceDirectedLayout(ids, edges)
    const b = forceDirectedLayout(ids, edges)
    for (const id of ids) {
      expect(b.get(id)).toEqual(a.get(id))
    }
  })

  it('pulls connected nodes closer than unconnected ones', () => {
    // Star graph: node 1 links to leaves 2, 3, 4 (the leaves are not linked to each other).
    const ids = [1, 2, 3, 4]
    const edges = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
    ]
    const pos = forceDirectedLayout(ids, edges)
    const centreToLeaf = dist(pos.get(1)!, pos.get(2)!)
    const leafToLeaf = dist(pos.get(2)!, pos.get(3)!)
    expect(centreToLeaf).toBeLessThan(leafToLeaf)
  })

  it('ignores edges that reference unknown nodes or are self-loops', () => {
    const pos = forceDirectedLayout(
      [1, 2],
      [
        { from: 1, to: 99 },
        { from: 1, to: 1 },
        { from: 1, to: 2 },
      ],
    )
    expect(pos.size).toBe(2)
    expect(Number.isFinite(pos.get(1)!.x)).toBe(true)
    expect(Number.isFinite(pos.get(2)!.y)).toBe(true)
  })

  it('packs disconnected groups close together without overlapping group bounds', () => {
    const ids = [1, 2, 3, 4, 5, 6]
    const edges = [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
    ]
    const pos = forceDirectedLayout(ids, edges)
    const groupA = [1, 2, 3].map((id) => pos.get(id)!)
    const groupB = [4, 5, 6].map((id) => pos.get(id)!)
    const bounds = (group: GraphNodePosition[]) => ({
      minX: Math.min(...group.map((p) => p.x)),
      maxX: Math.max(...group.map((p) => p.x)),
      minY: Math.min(...group.map((p) => p.y)),
      maxY: Math.max(...group.map((p) => p.y)),
    })
    const a = bounds(groupA)
    const b = bounds(groupB)
    const overlapsX = a.minX <= b.maxX && b.minX <= a.maxX
    const overlapsY = a.minY <= b.maxY && b.minY <= a.maxY
    expect(overlapsX && overlapsY).toBe(false)
    const centreA = { x: (a.minX + a.maxX) / 2, y: (a.minY + a.maxY) / 2 }
    const centreB = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }
    expect(dist(centreA, centreB)).toBeLessThan(500)
  })

  it('respects minimum distance between node footprints when configured', () => {
    const ids = [1, 2, 3]
    const footprints = new Map<number, number>([
      [1, 36],
      [2, 24],
      [3, 28],
    ])
    const minGap = 8
    const pos = forceDirectedLayout(ids, [], {
      iterations: 260,
      spacing: 56,
      footprints,
      nodeForces: new Map([[1, 1.7]]),
      minFootprintGap: minGap,
    })
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]
        const b = ids[j]
        const centerDistance = dist(pos.get(a)!, pos.get(b)!)
        const requiredDistance =
          (footprints.get(a) ?? 0) + (footprints.get(b) ?? 0) + minGap
        expect(centerDistance).toBeGreaterThanOrEqual(requiredDistance - 0.5)
      }
    }
  })
})

describe('computeViewBox', () => {
  it('returns a padding-sized box when there are no positions', () => {
    expect(computeViewBox(new Map(), 40)).toEqual({
      x: -40,
      y: -40,
      width: 80,
      height: 80,
    })
  })

  it('encloses every node position with padding on all sides', () => {
    const positions = new Map<number, GraphNodePosition>([
      [1, { x: 0, y: 0 }],
      [2, { x: 100, y: 50 }],
      [3, { x: -20, y: 80 }],
    ])
    const vb = computeViewBox(positions, 10)
    expect(vb.x).toBe(-30) // minX (-20) - padding
    expect(vb.y).toBe(-10) // minY (0) - padding
    expect(vb.width).toBe(140) // (100 - -20) + 2 * padding
    expect(vb.height).toBe(100) // (80 - 0) + 2 * padding
    for (const p of positions.values()) {
      expect(p.x).toBeGreaterThanOrEqual(vb.x)
      expect(p.x).toBeLessThanOrEqual(vb.x + vb.width)
      expect(p.y).toBeGreaterThanOrEqual(vb.y)
      expect(p.y).toBeLessThanOrEqual(vb.y + vb.height)
    }
  })
})

describe('zoomViewBox', () => {
  it('scales the box about its centre', () => {
    const vb = { x: 0, y: 0, width: 100, height: 100 }
    expect(zoomViewBox(vb, 2)).toEqual({
      x: -50,
      y: -50,
      width: 200,
      height: 200,
    })
    expect(zoomViewBox(vb, 0.5)).toEqual({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    })
  })

  it('keeps the centre point fixed', () => {
    const vb = { x: 10, y: 20, width: 80, height: 40 }
    const z = zoomViewBox(vb, 1.5)
    expect(z.x + z.width / 2).toBeCloseTo(vb.x + vb.width / 2)
    expect(z.y + z.height / 2).toBeCloseTo(vb.y + vb.height / 2)
  })
})

describe('parseViewBox', () => {
  it('returns null for missing input', () => {
    expect(parseViewBox(null)).toBeNull()
    expect(parseViewBox('')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseViewBox('{not json')).toBeNull()
  })

  it('returns null when fields are missing or non-numeric', () => {
    expect(parseViewBox(JSON.stringify({ x: 0, y: 0, width: 100 }))).toBeNull()
    expect(
      parseViewBox(JSON.stringify({ x: 0, y: 0, width: 'wide', height: 10 })),
    ).toBeNull()
  })

  it('returns null for non-positive dimensions', () => {
    expect(
      parseViewBox(JSON.stringify({ x: 0, y: 0, width: 0, height: 10 })),
    ).toBeNull()
    expect(
      parseViewBox(JSON.stringify({ x: 0, y: 0, width: 10, height: -5 })),
    ).toBeNull()
  })

  it('round-trips a valid serialised viewBox', () => {
    const vb = { x: -12.5, y: 30, width: 240, height: 160 }
    expect(parseViewBox(JSON.stringify(vb))).toEqual(vb)
  })
})
