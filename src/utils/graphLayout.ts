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

/**
 * Fruchterman-Reingold style force-directed layout for the full technique
 * graph. Deterministic given the same inputs (no randomness) so the graph
 * renders consistently between mounts and can be unit tested.
 */
export function forceDirectedLayout(
  nodeIds: number[],
  edges: LayoutEdge[],
  options?: { iterations?: number; spacing?: number },
): Map<number, GraphNodePosition> {
  const iterations = options?.iterations ?? 300
  const k = options?.spacing ?? 56
  const n = nodeIds.length
  const pos = new Map<number, GraphNodePosition>()
  if (n === 0) return pos
  if (n === 1) {
    pos.set(nodeIds[0], { x: 0, y: 0 })
    return pos
  }

  // Deterministic initial placement on a circle.
  nodeIds.forEach((id, i) => {
    const angle = (i / n) * 2 * Math.PI
    pos.set(id, { x: Math.cos(angle) * k * 3, y: Math.sin(angle) * k * 3 })
  })

  const idSet = new Set(nodeIds)
  const validEdges = edges.filter(e => idSet.has(e.from) && idSet.has(e.to) && e.from !== e.to)

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
        const force = (k * k) / dist
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const di = disp.get(nodeIds[i])!
        const dj = disp.get(nodeIds[j])!
        di.x += fx
        di.y += fy
        dj.x -= fx
        dj.y -= fy
      }
    }

    // Attraction along edges.
    for (const edge of validEdges) {
      const a = pos.get(edge.from)!
      const b = pos.get(edge.to)!
      let dx = a.x - b.x
      let dy = a.y - b.y
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

    temp *= cooling
  }

  return pos
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
      v && typeof v === 'object' &&
      Number.isFinite(v.x) && Number.isFinite(v.y) &&
      Number.isFinite(v.width) && Number.isFinite(v.height) &&
      (v.width as number) > 0 && (v.height as number) > 0
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
