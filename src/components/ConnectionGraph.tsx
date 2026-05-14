import type { ConnectionType, Technique } from '../types'

/** SVG-friendly colours per connection type (the CONNECTION_COLORS map holds Tailwind classes). */
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
  connections: GraphConnection[]
  onSelect: (id: number) => void
  connectionTypeName: (type: ConnectionType) => string
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export default function ConnectionGraph({
  centerName, connections, onSelect, connectionTypeName,
}: ConnectionGraphProps) {
  // Merge duplicate neighbours (a technique may be linked by several connections/directions).
  const neighbourMap = new Map<number, {
    technique: Technique
    types: ConnectionType[]
    directions: Set<'from' | 'to'>
  }>()
  for (const conn of connections) {
    const existing = neighbourMap.get(conn.technique.id)
    if (existing) {
      if (!existing.types.includes(conn.connectionType)) existing.types.push(conn.connectionType)
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
  const R = 96
  const centerR = 32
  const nodeR = n > 8 ? 13 : 16
  const usedTypes = [...new Set(connections.map(c => c.connectionType))]

  return (
    <div className="bg-zinc-900 rounded-2xl p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Technique connection graph"
      >
        <defs>
          {usedTypes.map(type => (
            <marker
              key={type}
              id={`cg-arrow-${type}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={GRAPH_COLORS[type]} />
            </marker>
          ))}
        </defs>

        {/* Edges (drawn first so nodes sit on top) */}
        {neighbours.map((nb, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
          const x = cx + R * Math.cos(angle)
          const y = cy + R * Math.sin(angle)
          const ux = Math.cos(angle)
          const uy = Math.sin(angle)
          const x1 = cx + ux * centerR
          const y1 = cy + uy * centerR
          const x2 = x - ux * nodeR
          const y2 = y - uy * nodeR
          const color = GRAPH_COLORS[nb.types[0]]
          const hasFrom = nb.directions.has('from')
          const hasTo = nb.directions.has('to')
          return (
            <line
              key={`edge-${nb.technique.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={1.75}
              strokeOpacity={0.7}
              markerEnd={hasFrom ? `url(#cg-arrow-${nb.types[0]})` : undefined}
              markerStart={hasTo ? `url(#cg-arrow-${nb.types[0]})` : undefined}
            />
          )
        })}

        {/* Center node */}
        <circle cx={cx} cy={cy} r={centerR} fill="#18181b" stroke="#d4a017" strokeWidth={2} />
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
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
          const x = cx + R * Math.cos(angle)
          const y = cy + R * Math.sin(angle)
          const ux = Math.cos(angle)
          const uy = Math.sin(angle)
          const color = GRAPH_COLORS[nb.types[0]]
          const labelX = x + ux * (nodeR + 6)
          const labelY = y + uy * (nodeR + 6)
          const anchor = ux > 0.3 ? 'start' : ux < -0.3 ? 'end' : 'middle'
          const baseline = uy > 0.3 ? 'hanging' : uy < -0.3 ? 'auto' : 'central'
          return (
            <g
              key={`node-${nb.technique.id}`}
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onSelect(nb.technique.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(nb.technique.id)
                }
              }}
            >
              <circle cx={x} cy={y} r={nodeR} fill="#18181b" stroke={color} strokeWidth={2} />
              <circle cx={x} cy={y} r={nodeR - 5} fill={color} fillOpacity={0.25} />
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                dominantBaseline={baseline}
                fontSize={9}
                fill="#d4d4d8"
              >
                {truncate(nb.technique.name, 20)}
                <title>{nb.technique.name}</title>
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-1">
        {usedTypes.map(type => (
          <span key={type} className="flex items-center gap-1.5 text-xs text-zinc-400">
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
