export interface GraphNodePosition {
  x: number
  y: number
}

export interface LayoutEdge {
  from: number
  to: number
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ForceDirectedLayoutOptions {
  iterations?: number
  spacing?: number
  footprints?: Map<number, number>
  nodeForces?: Map<number, number>
  minFootprintGap?: number
}

/**
 * Fruchterman-Reingold style force-directed layout for the full technique
 * graph. Deterministic given the same inputs (no randomness) so the graph
 * renders consistently between mounts and can be unit tested.
 */
export function forceDirectedLayout(
  nodeIds: number[],
  edges: LayoutEdge[],
  options?: ForceDirectedLayoutOptions,
): Map<number, GraphNodePosition> {
  const iterations = options?.iterations ?? 300
  const k = options?.spacing ?? 56
  const footprints = options?.footprints ?? new Map<number, number>()
  const nodeForces = options?.nodeForces ?? new Map<number, number>()
  const minFootprintGap = options?.minFootprintGap ?? 0
  const pos = new Map<number, GraphNodePosition>()
  if (nodeIds.length === 0) return pos
  if (nodeIds.length === 1) {
    pos.set(nodeIds[0], { x: 0, y: 0 })
    return pos
  }

  const idSet = new Set(nodeIds)
  const validEdges = edges.filter(
    (e) => idSet.has(e.from) && idSet.has(e.to) && e.from !== e.to,
  )
  const adjacency = new Map<number, Set<number>>()
  nodeIds.forEach((id) => adjacency.set(id, new Set()))
  for (const edge of validEdges) {
    adjacency.get(edge.from)?.add(edge.to)
    adjacency.get(edge.to)?.add(edge.from)
  }

  const components: number[][] = []
  const seen = new Set<number>()
  for (const id of nodeIds) {
    if (seen.has(id)) continue
    const queue = [id]
    const component: number[] = []
    seen.add(id)
    while (queue.length > 0) {
      const current = queue.shift()!
      component.push(current)
      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    component.sort((a, b) => a - b)
    components.push(component)
  }
  components.sort((a, b) => b.length - a.length || a[0] - b[0])

  const componentGap = k * 2
  const componentLayouts: Array<{
    ids: number[]
    positions: Map<number, GraphNodePosition>
    minX: number
    maxX: number
    minY: number
    maxY: number
  }> = []
  for (const ids of components) {
    const componentSet = new Set(ids)
    const componentEdges = validEdges.filter(
      (edge) => componentSet.has(edge.from) && componentSet.has(edge.to),
    )
    const componentPositions = runForceLayout(
      ids,
      componentEdges,
      iterations,
      k,
      footprints,
      nodeForces,
      minFootprintGap,
    )
    const bounds = computeBounds(componentPositions, footprints)
    componentLayouts.push({ ids, positions: componentPositions, ...bounds })
  }

  const totalArea = componentLayouts.reduce((sum, c) => {
    const width = Math.max(c.maxX - c.minX, k)
    const height = Math.max(c.maxY - c.minY, k)
    return sum + width * height
  }, 0)
  const targetRowWidth = Math.max(Math.sqrt(totalArea) * 1.4, k * 6)

  let cursorX = 0
  let cursorY = 0
  let rowHeight = 0
  for (const component of componentLayouts) {
    const width = Math.max(component.maxX - component.minX, k)
    const height = Math.max(component.maxY - component.minY, k)
    if (cursorX > 0 && cursorX + width > targetRowWidth) {
      cursorX = 0
      cursorY += rowHeight + componentGap
      rowHeight = 0
    }
    const offsetX = cursorX - component.minX
    const offsetY = cursorY - component.minY
    for (const id of component.ids) {
      const p = component.positions.get(id)!
      pos.set(id, { x: p.x + offsetX, y: p.y + offsetY })
    }
    cursorX += width + componentGap
    rowHeight = Math.max(rowHeight, height)
  }

  const allBounds = computeBounds(pos, footprints)
  const centerX = (allBounds.minX + allBounds.maxX) / 2
  const centerY = (allBounds.minY + allBounds.maxY) / 2
  for (const p of pos.values()) {
    p.x -= centerX
    p.y -= centerY
  }

  return pos
}

function runForceLayout(
  nodeIds: number[],
  edges: LayoutEdge[],
  iterations: number,
  k: number,
  footprints: Map<number, number>,
  nodeForces: Map<number, number>,
  minFootprintGap: number,
): Map<number, GraphNodePosition> {
  const n = nodeIds.length
  const pos = new Map<number, GraphNodePosition>()
  if (n === 0) return pos

  nodeIds.forEach((id, i) => {
    const angle = (i / n) * 2 * Math.PI
    pos.set(id, { x: Math.cos(angle) * k * 3, y: Math.sin(angle) * k * 3 })
  })

  let temp = k * 4
  const cooling = Math.pow(0.05, 1 / iterations) // anneal down to ~5% of starting temp

  for (let iter = 0; iter < iterations; iter++) {
    const disp = new Map<number, GraphNodePosition>()
    for (const id of nodeIds) disp.set(id, { x: 0, y: 0 })

    // Repulsion between every pair of nodes.
    for (let i = 0; i < n; i++) {
      const a = pos.get(nodeIds[i])!
      for (let j = i + 1; j < n; j++) {
        const b = pos.get(nodeIds[j])!
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.01) {
          // Two nodes on the same spot — nudge deterministically.
          dx = 0.01 * (i + 1)
          dy = 0.01 * (j + 1)
          dist = Math.sqrt(dx * dx + dy * dy)
        }
        const distSquared = Math.max(dist * dist, 0.0001)
        const forceScaleA = nodeForces.get(nodeIds[i]) ?? 1
        const forceScaleB = nodeForces.get(nodeIds[j]) ?? 1
        const force = ((k * k) / distSquared) * forceScaleA * forceScaleB
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const di = disp.get(nodeIds[i])!
        const dj = disp.get(nodeIds[j])!
        di.x += fx
        di.y += fy
        dj.x -= fx
        dj.y -= fy

        const footprintA = footprints.get(nodeIds[i]) ?? 0
        const footprintB = footprints.get(nodeIds[j]) ?? 0
        const minDistance = footprintA + footprintB + minFootprintGap
        if (dist < minDistance) {
          const overlap = minDistance - dist
          const overlapForce = overlap * 1.05
          const ofx = (dx / dist) * overlapForce
          const ofy = (dy / dist) * overlapForce
          di.x += ofx
          di.y += ofy
          dj.x -= ofx
          dj.y -= ofy
        }
      }
    }

    // Attraction along edges.
    for (const edge of edges) {
      const a = pos.get(edge.from)!
      const b = pos.get(edge.to)!
      const dx = a.x - b.x
      const dy = a.y - b.y
      let dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 0.01) dist = 0.01
      const force = (dist * dist) / k
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      const da = disp.get(edge.from)!
      const db = disp.get(edge.to)!
      da.x -= fx
      da.y -= fy
      db.x += fx
      db.y += fy
    }

    // Apply displacement, capped by the current temperature, with a mild pull
    // toward the origin so disconnected nodes don't drift off indefinitely.
    for (const id of nodeIds) {
      const d = disp.get(id)!
      const p = pos.get(id)!
      let dist = Math.sqrt(d.x * d.x + d.y * d.y)
      if (dist < 0.01) dist = 0.01
      p.x += (d.x / dist) * Math.min(dist, temp)
      p.y += (d.y / dist) * Math.min(dist, temp)
      p.x *= 0.965
      p.y *= 0.965
    }

    // Hard-separate overlapped node+label footprints to prevent visual collisions.
    for (let i = 0; i < n; i++) {
      const idA = nodeIds[i]
      const a = pos.get(idA)!
      const footprintA = footprints.get(idA) ?? 0
      for (let j = i + 1; j < n; j++) {
        const idB = nodeIds[j]
        const b = pos.get(idB)!
        const footprintB = footprints.get(idB) ?? 0
        const minDistance = footprintA + footprintB + minFootprintGap
        if (minDistance <= 0) continue
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.01) {
          dx = 0.01 * (i + 1)
          dy = 0.01 * (j + 1)
          dist = Math.sqrt(dx * dx + dy * dy)
        }
        if (dist >= minDistance) continue
        const correction = (minDistance - dist) / 2
        const ux = dx / dist
        const uy = dy / dist
        a.x -= ux * correction
        a.y -= uy * correction
        b.x += ux * correction
        b.y += uy * correction
      }
    }

    temp *= cooling
  }

  return pos
}

function computeBounds(
  positions: Map<number, GraphNodePosition>,
  footprints: Map<number, number>,
): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [id, { x, y }] of positions.entries()) {
    const footprint = footprints.get(id) ?? 0
    if (x - footprint < minX) minX = x - footprint
    if (y - footprint < minY) minY = y - footprint
    if (x + footprint > maxX) maxX = x + footprint
    if (y + footprint > maxY) maxY = y + footprint
  }
  return { minX, maxX, minY, maxY }
}

/**
 * Axis-aligned bounding box of all node positions, expanded by `padding` on
 * every side. Always returns a box with non-zero width and height so it can be
 * used directly as an SVG viewBox.
 */
export function computeViewBox(
  positions: Map<number, GraphNodePosition>,
  padding = 40,
): ViewBox {
  if (positions.size === 0) {
    return { x: -padding, y: -padding, width: padding * 2, height: padding * 2 }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { x, y } of positions.values()) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX, 1) + padding * 2,
    height: Math.max(maxY - minY, 1) + padding * 2,
  }
}

/** Zooms a viewBox by `factor` (>1 zooms out, <1 zooms in) about its centre. */
export function zoomViewBox(view: ViewBox, factor: number): ViewBox {
  const cx = view.x + view.width / 2
  const cy = view.y + view.height / 2
  const width = view.width * factor
  const height = view.height * factor
  return { x: cx - width / 2, y: cy - height / 2, width, height }
}

/**
 * Parses a serialised viewBox (e.g. from session storage), returning null when
 * it is missing or malformed so callers can fall back to a freshly fitted view.
 */
export function parseViewBox(raw: string | null): ViewBox | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Record<string, unknown>
    if (
      v &&
      typeof v === 'object' &&
      Number.isFinite(v.x) &&
      Number.isFinite(v.y) &&
      Number.isFinite(v.width) &&
      Number.isFinite(v.height) &&
      (v.width as number) > 0 &&
      (v.height as number) > 0
    ) {
      return {
        x: v.x as number,
        y: v.y as number,
        width: v.width as number,
        height: v.height as number,
      }
    }
  } catch {
    // Malformed JSON — fall through to null.
  }
  return null
}
