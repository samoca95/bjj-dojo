const SPARKLINE_WIDTH = 220
const SPARKLINE_HEIGHT = 60

export default function TrendSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)

  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * SPARKLINE_WIDTH
    const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`} className="w-full h-14" role="img" aria-label="Trend chart">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
