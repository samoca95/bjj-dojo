import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Minus, Maximize2 } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, ConnectionType } from '../types'
import { CONNECTION_LABELS } from '../types'
import { useI18n, connectionTypeLabel, getCategoryName } from '../i18n'
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
const MIN_PINCH_ZOOM_FACTOR = 0.35
const MAX_PINCH_ZOOM_FACTOR = 3.2
const WHEEL_ZOOM_SENSITIVITY = 0.0015
const WHEEL_PINCH_ZOOM_SENSITIVITY = 0.0025
const DEFAULT_EDGE_COLOR = '#52525b'
const DIMMED_NODE_OPACITY = 0.26
const DIMMED_EDGE_OPACITY = 0.14
const EDGE_COLORS: Record<ConnectionType, string> = {
  FOLLOW_UP: '#fcd34d',
  COUNTER: '#fca5a5',
  SETUP: '#86efac',
  TRANSITION: '#93c5fd',
}
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

interface PinchState {
  startDistance: number
  startView: ViewBox
  rectLeft: number
  rectTop: number
  rectW: number
  rectH: number
}

function zoomAtClientPoint(view: ViewBox, factor: number, pinch: PinchState, clientX: number, clientY: number): ViewBox {
  const relX = (clientX - pinch.rectLeft) / pinch.rectW
  const relY = (clientY - pinch.rectTop) / pinch.rectH
  const anchorX = view.x + relX * view.width
  const anchorY = view.y + relY * view.height
  const width = view.width * factor
  const height = view.height * factor
  return {
    x: anchorX - relX * width,
    y: anchorY - relY * height,
    width,
    height,
  }
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
    return { positions: pos, fittedViewBox: computeViewBox(pos, 32) }
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
  const pinchRef = useRef<PinchState | null>(null)
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const didPanRef = useRef(false)
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null)
  const [isTouchGraph, setIsTouchGraph] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      (typeof window.matchMedia === 'function' && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
      navigator.maxTouchPoints > 0
    )
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => {
      setIsTouchGraph(mediaQuery.matches || navigator.maxTouchPoints > 0)
    }
    update()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }
    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  useEffect(() => {
    if (!isTouchGraph) setSelectedNodeId(null)
  }, [isTouchGraph])

  const activeNodeId = hoveredNodeId ?? selectedNodeId
  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<number>()
    if (!activeNodeId) return ids
    ids.add(activeNodeId)
    for (const c of connections ?? []) {
      if (c.fromTechniqueId === activeNodeId) ids.add(c.toTechniqueId)
      if (c.toTechniqueId === activeNodeId) ids.add(c.fromTechniqueId)
    }
    return ids
  }, [activeNodeId, connections])

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    didPanRef.current = false
    if (!view) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    if (pointersRef.current.size === 1) {
      panRef.current = {
        pointerId: e.pointerId,
        clientX: e.clientX,
        clientY: e.clientY,
        startView: view,
        rectW: rect.width,
        rectH: rect.height,
        moved: false,
      }
      pinchRef.current = null
    } else if (pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()]
      const startDistance = Math.hypot(a.x - b.x, a.y - b.y)
      pinchRef.current = {
        startDistance: Math.max(startDistance, 1),
        startView: view,
        rectLeft: rect.left,
        rectTop: rect.top,
        rectW: rect.width,
        rectH: rect.height,
      }
      panRef.current = null
    }
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pinch = pinchRef.current
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()]
      const currentDistance = Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1)
      const centerX = (a.x + b.x) / 2
      const centerY = (a.y + b.y) / 2
      const factor = Math.min(MAX_PINCH_ZOOM_FACTOR, Math.max(MIN_PINCH_ZOOM_FACTOR, pinch.startDistance / currentDistance))
      didPanRef.current = true
      setView(zoomAtClientPoint(pinch.startView, factor, pinch, centerX, centerY))
      return
    }
    const pan = panRef.current
    if (!pan) return
    if (Math.abs(e.clientX - pan.clientX) > 6 || Math.abs(e.clientY - pan.clientY) > 6) {
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
    pointersRef.current.delete(e.pointerId)
    const pan = panRef.current
    if (pan) {
      didPanRef.current = pan.moved
      svgRef.current?.releasePointerCapture(e.pointerId)
    }
    panRef.current = null
    if (pointersRef.current.size < 2) pinchRef.current = null
  }

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    if (!view || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const sensitivity = e.ctrlKey ? WHEEL_PINCH_ZOOM_SENSITIVITY : WHEEL_ZOOM_SENSITIVITY
    const factor = Math.exp(e.deltaY * sensitivity)
    const wheelPinchState: PinchState = {
      startDistance: 1,
      startView: view,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectW: rect.width,
      rectH: rect.height,
    }
    setView(zoomAtClientPoint(view, factor, wheelPinchState, e.clientX, e.clientY))
  }

  const activateTouchNode = (id: number) => {
    if (didPanRef.current) return
    setSelectedNodeId(prev => {
      if (prev === id) {
        navigate(`/techniques/${id}`)
        return prev
      }
      return id
    })
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
              onWheel={onWheel}
            >
              {/* Edges */}
              {(connections ?? []).map(c => {
                const a = positions.get(c.fromTechniqueId)
                const b = positions.get(c.toTechniqueId)
                if (!a || !b) return null
                const highlighted = activeNodeId !== null && (c.fromTechniqueId === activeNodeId || c.toTechniqueId === activeNodeId)
                const dimmed = activeNodeId !== null && !highlighted
                const typeLabel = connectionTypeLabel(c.connectionType, CONNECTION_LABELS[c.connectionType], language)
                const edgeColor = highlighted ? EDGE_COLORS[c.connectionType] : DEFAULT_EDGE_COLOR
                const dx = b.x - a.x
                const dy = b.y - a.y
                const dist = Math.max(Math.hypot(dx, dy), 0.001)
                const sourcePad = NODE_RADIUS + (highlighted ? 4.5 : 0.75)
                const targetPad = NODE_RADIUS + (highlighted ? 4.5 : 0.75)
                const x1 = a.x + (dx / dist) * sourcePad
                const y1 = a.y + (dy / dist) * sourcePad
                const x2 = b.x - (dx / dist) * targetPad
                const y2 = b.y - (dy / dist) * targetPad
                return (
                  <g key={`${c.fromTechniqueId}-${c.toTechniqueId}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={edgeColor}
                      strokeWidth={highlighted ? 2.4 : 1.8}
                      strokeOpacity={dimmed ? DIMMED_EDGE_OPACITY : highlighted ? 0.98 : 0.56}
                      markerEnd={highlighted ? `url(#tg-arrow-${c.connectionType})` : undefined}
                    />
                    <desc>{typeLabel}</desc>
                  </g>
                )
              })}

              {/* Nodes — coloured by category */}
              {(techniques ?? []).map(tech => {
                const p = positions.get(tech.id)
                if (!p) return null
                const color = categoryColor(tech.categoryId)
                const highlighted = highlightedNodeIds.has(tech.id)
                const dimmed = activeNodeId !== null && !highlighted
                return (
                  <g
                    key={tech.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    opacity={dimmed ? DIMMED_NODE_OPACITY : 1}
                    onClick={() => {
                      if (didPanRef.current) return
                      if (isTouchGraph) {
                        activateTouchNode(tech.id)
                        return
                      }
                      navigate(`/techniques/${tech.id}`)
                    }}
                    onPointerEnter={isTouchGraph ? undefined : () => setHoveredNodeId(tech.id)}
                    onPointerLeave={isTouchGraph ? undefined : () => setHoveredNodeId(prev => (prev === tech.id ? null : prev))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/techniques/${tech.id}`)
                      }
                    }}
                    aria-label={tech.name}
                  >
                    {highlighted && (
                      <circle cx={p.x} cy={p.y} r={NODE_RADIUS + 4.5} fill="none" stroke={color} strokeWidth={3} />
                    )}
                    <circle cx={p.x} cy={p.y} r={NODE_RADIUS} fill="#18181b" stroke="#3f3f46" strokeWidth={1.4} />
                    <circle cx={p.x} cy={p.y} r={NODE_RADIUS - 5} fill={color} fillOpacity={highlighted ? 0.5 : 0.28} />
                    {showLabels && (
                      <text
                        x={p.x}
                        y={p.y + NODE_RADIUS + LABEL_FONT_SIZE}
                        textAnchor="middle"
                        fontSize={LABEL_FONT_SIZE}
                        fill="#d4d4d8"
                        fillOpacity={dimmed ? 0 : 1}
                      >
                        {truncate(tech.name, 22)}
                      </text>
                    )}
                  </g>
                )
              })}
              <defs>
                {Object.entries(EDGE_COLORS).map(([type, color]) => (
                  <marker
                    key={type}
                    id={`tg-arrow-${type}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="4.75"
                    markerHeight="4.75"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill={color} />
                  </marker>
                ))}
              </defs>
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
