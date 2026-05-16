import type { ConnectionType, Technique } from '../types'
import { categoryColor } from '../utils/categoryColor'

/** SVG-friendly colours per connection type — used for the edges (the
 *  CONNECTION_COLORS map in types holds Tailwind classes, not raw colours). */
const GRAPH_COLORS: Record<ConnectionType, string> = {
  FOLLOW_UP: '#fcd34d',
  COUNTER: '#fca5a5',
  SETUP: '#86efac',
  TRANSITION: '#93c5fd',
}

export interface GraphConnection {
  technique: Technique
  connectionType: ConnectionType
  /** 'from' = current technique leads to this one; 'to' = this one leads to the current technique. */
  direction: 'from' | 'to'
}

interface ConnectionGraphProps {
  centerName: string
  centerCategoryId: number
  connections: GraphConnection[]
  onSelect: (id: number) => void
  connectionTypeName: (type: ConnectionType) => string
  techniqueName: (technique: Technique) => string
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  let a = angle % twoPi
  if (a <= -Math.PI) a += twoPi
  if (a > Math.PI) a -= twoPi
  return a
}

function estimateCompositeRadius(label: string, nodeR: number): number {
  const capped = truncate(label, 20)
  const approximateLabelWidth = Math.max(22, capped.length * 5.1)
  return nodeR + 8 + approximateLabelWidth / 2
}

function distributeAnglesWithOverlapAvoidance(
  labels: string[],
  nodeR: number,
  initialRadius: number,
): { angles: number[]; radius: number } {
  const n = labels.length
  if (n === 0) return { angles: [], radius: initialRadius }

  const footprints = labels.map((label) => estimateCompositeRadius(label, nodeR))
  const maxFootprint = Math.max(...footprints)
  const radius = Math.max(initialRadius, (n * maxFootprint) / Math.PI + 8)
  const initialAngles = Array.from(
    { length: n },
    (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n,
  )
  const angles = [...initialAngles]

  for (let iter = 0; iter < 90; iter++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const delta = normalizeAngle(angles[j] - angles[i])
        const absDelta = Math.abs(delta)
        const minDelta =
          2 *
          Math.asin(
            Math.min(0.98, (footprints[i] + footprints[j]) / (2 * radius)),
          )
        if (absDelta >= minDelta) continue
        const push = (minDelta - absDelta) * 0.52
        const sign = delta >= 0 ? 1 : -1
        angles[i] = normalizeAngle(angles[i] - sign * push)
        angles[j] = normalizeAngle(angles[j] + sign * push)
      }
    }

    for (let i = 0; i < n; i++) {
      const drift = normalizeAngle(angles[i] - initialAngles[i])
      angles[i] = normalizeAngle(angles[i] - drift * 0.07)
    }
  }

  return { angles, radius }
}

export default function ConnectionGraph({
  centerName,
  centerCategoryId,
  connections,
  onSelect,
  connectionTypeName,
  techniqueName,
}: ConnectionGraphProps) {
  // Merge duplicate neighbours (a technique may be linked by several connections/directions).
  const neighbourMap = new Map<
    number,
    {
      technique: Technique
      types: ConnectionType[]
      directions: Set<'from' | 'to'>
    }
  >()
  for (const conn of connections) {
    const existing = neighbourMap.get(conn.technique.id)
    if (existing) {
      if (!existing.types.includes(conn.connectionType))
        existing.types.push(conn.connectionType)
      existing.directions.add(conn.direction)
    } else {
      neighbourMap.set(conn.technique.id, {
        technique: conn.technique,
        types: [conn.connectionType],
        directions: new Set([conn.direction]),
      })
    }
  }
  const neighbours = [...neighbourMap.values()]
  const n = neighbours.length
  if (n === 0) return null

  const W = 400
  const H = 320
  const cx = W / 2
  const cy = H / 2
  const baseR = 96
  const centerR = 32
  const nodeR = n > 8 ? 13 : 16
  const useRadialLabels = n > 6
  const usedTypes = [...new Set(connections.map((c) => c.connectionType))]
  const neighbourNames = neighbours.map((nb) => techniqueName(nb.technique))
  const { angles, radius: R } = distributeAnglesWithOverlapAvoidance(
    neighbourNames,
    nodeR,
    baseR,
  )

  return (
    <div className="bg-zinc-900 rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Technique connection graph"
      >
        <defs>
          {usedTypes.map((type) => (
            <marker
              key={type}
              id={`cg-arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={GRAPH_COLORS[type]} />
            </marker>
          ))}
        </defs>

        {/* Edges (drawn first so nodes sit on top) */}
        {neighbours.map((nb, i) => {
          const angle = angles[i] ?? -Math.PI / 2 + (i * 2 * Math.PI) / n
          const x = cx + R * Math.cos(angle)
          const y = cy + R * Math.sin(angle)
          const ux = Math.cos(angle)
          const uy = Math.sin(angle)
          const x1 = cx + ux * centerR
          const y1 = cy + uy * centerR
          const x2 = x - ux * nodeR
          const y2 = y - uy * nodeR
          const edgeColor = GRAPH_COLORS[nb.types[0]]
          const hasFrom = nb.directions.has('from')
          const hasTo = nb.directions.has('to')
          return (
            <line
              key={`edge-${nb.technique.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={edgeColor}
              strokeWidth={1.75}
              strokeOpacity={0.7}
              markerEnd={hasFrom ? `url(#cg-arrow-${nb.types[0]})` : undefined}
              markerStart={hasTo ? `url(#cg-arrow-${nb.types[0]})` : undefined}
            />
          )
        })}

        {/* Center node — coloured by its category */}
        <circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill="#18181b"
          stroke={categoryColor(centerCategoryId)}
          strokeWidth={3}
        />
        <circle
          cx={cx}
          cy={cy}
          r={centerR - 6}
          fill={categoryColor(centerCategoryId)}
          fillOpacity={0.2}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={600}
          fill="#fafafa"
        >
          {truncate(centerName, 12)}
          <title>{centerName}</title>
        </text>

        {/* Neighbour nodes */}
        {neighbours.map((nb, i) => {
          const angle = angles[i] ?? -Math.PI / 2 + (i * 2 * Math.PI) / n
          const x = cx + R * Math.cos(angle)
          const y = cy + R * Math.sin(angle)
          const ux = Math.cos(angle)
          const uy = Math.sin(angle)
          const name = techniqueName(nb.technique)
          const nodeColor = categoryColor(nb.technique.categoryId)
          const labelX = x + ux * (nodeR + 8)
          const labelY = y + uy * (nodeR + 8)
          const anchor = useRadialLabels
            ? angle > Math.PI / 2 || angle < -Math.PI / 2
              ? 'end'
              : 'start'
            : ux > 0.3
              ? 'start'
              : ux < -0.3
                ? 'end'
                : 'middle'
          const baseline = useRadialLabels
            ? 'central'
            : uy > 0.3
              ? 'hanging'
              : uy < -0.3
                ? 'auto'
                : 'central'
          const degrees = (angle * 180) / Math.PI
          const radialRotation = useRadialLabels
            ? degrees > 90 || degrees < -90
              ? degrees + 180
              : degrees
            : undefined
          return (
            <g
              key={`node-${nb.technique.id}`}
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onSelect(nb.technique.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(nb.technique.id)
                }
              }}
            >
              <circle
                cx={x}
                cy={y}
                r={nodeR}
                fill="#18181b"
                stroke={nodeColor}
                strokeWidth={2}
              />
              <circle
                cx={x}
                cy={y}
                r={nodeR - 5}
                fill={nodeColor}
                fillOpacity={0.3}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                dominantBaseline={baseline}
                fontSize={9}
                fill="#d4d4d8"
                transform={
                  radialRotation === undefined
                    ? undefined
                    : `rotate(${radialRotation} ${labelX} ${labelY})`
                }
              >
                {truncate(name, 20)}
                <title>{name}</title>
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-1">
        {usedTypes.map((type) => (
          <span
            key={type}
            className="flex items-center gap-1.5 text-xs text-zinc-400"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: GRAPH_COLORS[type] }}
            />
            {connectionTypeName(type)}
          </span>
        ))}
      </div>
    </div>
  )
}
