import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Minus, Maximize2 } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category } from '../types'
import { useI18n, getCategoryName } from '../i18n'
import { categoryColor } from '../utils/categoryColor'
import {
  forceDirectedLayout,
  computeViewBox,
  zoomViewBox,
  parseViewBox,
  type ViewBox,
} from '../utils/graphLayout'

const NODE_RADIUS = 14
const LABEL_FONT_SIZE = 12
// Persists the pan/zoom position so navigating to a technique and back
// returns the graph to the exact same coordinates.
const GRAPH_VIEW_KEY = 'bjj-dojo.techniques.graph-view'

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

interface PanState {
  pointerId: number
  clientX: number
  clientY: number
  startView: ViewBox
  rectW: number
  rectH: number
  moved: boolean
}

export default function TechniqueGraphPage() {
  const navigate = useNavigate()
  const { language, t } = useI18n()

  const techniques = useLiveQuery(() => db.techniques.toArray(), [])
  const connections = useLiveQuery(() => db.techniqueConnections.toArray(), [])
  const catMap = useLiveQuery(() => getCategoryMap(), [], new Map<number, Category>())

  // Force-directed layout — recomputed only when the graph data actually changes.
  const { positions, fittedViewBox } = useMemo(() => {
    const ids = (techniques ?? []).map(tech => tech.id)
    const edges = (connections ?? []).map(c => ({ from: c.fromTechniqueId, to: c.toTechniqueId }))
    const pos = forceDirectedLayout(ids, edges)
    return { positions: pos, fittedViewBox: computeViewBox(pos, 60) }
  }, [techniques, connections])

  // Restore a previously saved view (kept across navigation); otherwise null
  // until the data loads and we can fit the whole graph.
  const [view, setView] = useState<ViewBox | null>(
    () => parseViewBox(window.sessionStorage.getItem(GRAPH_VIEW_KEY)),
  )

  // First load only: fit the viewport to the whole graph. Skipped when a saved
  // view was restored, so returning to the page keeps the previous coordinates.
  useEffect(() => {
    if (view === null && techniques !== undefined && connections !== undefined) {
      setView(fittedViewBox)
    }
  }, [view, techniques, connections, fittedViewBox])

  // Persist the current view so it survives navigating away and back.
  useEffect(() => {
    if (view) window.sessionStorage.setItem(GRAPH_VIEW_KEY, JSON.stringify(view))
  }, [view])

  const svgRef = useRef<SVGSVGElement>(null)
  const panRef = useRef<PanState | null>(null)
  const didPanRef = useRef(false)

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    didPanRef.current = false
    if (!view) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    panRef.current = {
      pointerId: e.pointerId,
      clientX: e.clientX,
      clientY: e.clientY,
      startView: view,
      rectW: rect.width,
      rectH: rect.height,
      moved: false,
    }
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current
    if (!pan) return
    if (Math.abs(e.clientX - pan.clientX) > 3 || Math.abs(e.clientY - pan.clientY) > 3) {
      pan.moved = true
    }
    const dx = (e.clientX - pan.clientX) * (pan.startView.width / pan.rectW)
    const dy = (e.clientY - pan.clientY) * (pan.startView.height / pan.rectH)
    setView({
      x: pan.startView.x - dx,
      y: pan.startView.y - dy,
      width: pan.startView.width,
      height: pan.startView.height,
    })
  }

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current
    if (pan) {
      didPanRef.current = pan.moved
      svgRef.current?.releasePointerCapture(e.pointerId)
    }
    panRef.current = null
  }

  const activateNode = (id: number) => {
    if (didPanRef.current) return
    navigate(`/techniques/${id}`)
  }

  const dataLoaded = techniques !== undefined && connections !== undefined
  const showLabels = view !== null && view.width < fittedViewBox.width * 0.7

  const usedCategories = useMemo(() => {
    const ids = new Set((techniques ?? []).map(tech => tech.categoryId))
    return [...(catMap?.values() ?? [])]
      .filter(c => ids.has(c.id))
      .sort((a, b) => a.id - b.id)
  }, [techniques, catMap])

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">{t('Technique Graph')}</h1>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 min-h-0 relative">
        {!dataLoaded || !view ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (techniques ?? []).length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-zinc-500">
            {t('No connections to display')}
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
              className="absolute inset-0 w-full h-full touch-none select-none cursor-grab active:cursor-grabbing"
              role="img"
              aria-label={t('Technique Graph')}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* Edges */}
              {(connections ?? []).map(c => {
                const a = positions.get(c.fromTechniqueId)
                const b = positions.get(c.toTechniqueId)
                if (!a || !b) return null
                return (
                  <line
                    key={`${c.fromTechniqueId}-${c.toTechniqueId}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#52525b"
                    strokeWidth={1}
                    strokeOpacity={0.4}
                  />
                )
              })}

              {/* Nodes — coloured by category */}
              {(techniques ?? []).map(tech => {
                const p = positions.get(tech.id)
                if (!p) return null
                const color = categoryColor(tech.categoryId)
                return (
                  <g
                    key={tech.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() => activateNode(tech.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/techniques/${tech.id}`)
                      }
                    }}
                  >
                    <circle cx={p.x} cy={p.y} r={NODE_RADIUS} fill="#18181b" stroke={color} strokeWidth={2.5} />
                    <circle cx={p.x} cy={p.y} r={NODE_RADIUS - 5} fill={color} fillOpacity={0.35} />
                    {showLabels && (
                      <text
                        x={p.x}
                        y={p.y + NODE_RADIUS + LABEL_FONT_SIZE}
                        textAnchor="middle"
                        fontSize={LABEL_FONT_SIZE}
                        fill="#d4d4d8"
                      >
                        {truncate(tech.name, 22)}
                      </text>
                    )}
                    <title>{tech.name}</title>
                  </g>
                )
              })}
            </svg>

            {/* Zoom controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5">
              <button
                onClick={() => setView(v => (v ? zoomViewBox(v, 0.7) : v))}
                aria-label={t('Zoom in')}
                className="w-9 h-9 flex items-center justify-center bg-zinc-800/90 text-zinc-200 rounded-lg active:bg-zinc-700"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setView(v => (v ? zoomViewBox(v, 1.4) : v))}
                aria-label={t('Zoom out')}
                className="w-9 h-9 flex items-center justify-center bg-zinc-800/90 text-zinc-200 rounded-lg active:bg-zinc-700"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setView(fittedViewBox)}
                aria-label={t('Reset view')}
                className="w-9 h-9 flex items-center justify-center bg-zinc-800/90 text-zinc-200 rounded-lg active:bg-zinc-700"
              >
                <Maximize2 size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Category legend */}
            {usedCategories.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-3 gap-y-1.5 bg-zinc-900/85 backdrop-blur-sm rounded-xl px-3 py-2">
                {usedCategories.map(c => (
                  <span key={c.id} className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: categoryColor(c.id) }}
                    />
                    {getCategoryName(c, language)}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
