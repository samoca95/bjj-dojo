import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Plus, Minus, Maximize2 } from 'lucide-react'
import { db } from '../db/database'
import { getCategoryMap } from '../db/categoryCache'
import type { Category, ConnectionType } from '../types'
import { CONNECTION_LABELS } from '../types'
import {
  useI18n,
  connectionTypeLabel,
  getCategoryName,
  getTechniqueName,
} from '../i18n'
import { categoryColor } from '../utils/categoryColor'
import {
  forceDirectedLayout,
  computeViewBox,
  zoomViewBox,
  parseViewBox,
  type ViewBox,
} from '../utils/graphLayout'

const BASE_NODE_RADIUS = 14
const MIN_NODE_SIZE_SCALE = 0.75
const MAX_NODE_SIZE_SCALE = 1.5
const NODE_INNER_FILL_OFFSET = 5
const NODE_STROKE_DEFAULT = 1.4
const NODE_STROKE_HIGHLIGHT = 2.6
const LABEL_FONT_SIZE = 12
const MIN_PINCH_ZOOM_FACTOR = 0.35
const MAX_PINCH_ZOOM_FACTOR = 3.2
const WHEEL_ZOOM_SENSITIVITY = 0.0015
const WHEEL_PINCH_ZOOM_SENSITIVITY = 0.0025
const DEFAULT_EDGE_COLOR = '#52525b'
const DIMMED_NODE_OPACITY = 0.26
const DIMMED_EDGE_OPACITY = 0.14
const GLOBAL_LABEL_MAX_CHARS_PER_LINE = 14
const GLOBAL_LABEL_MAX_LINES = 2
const GLOBAL_LABEL_APPROX_CHAR_WIDTH = 6.1
const GLOBAL_LABEL_MARGIN = 7
const MIN_NODE_FOOTPRINT_RADIUS = 22
const GLOBAL_LAYOUT_MIN_FOOTPRINT_GAP = 6
const EDGE_COLORS: Record<ConnectionType, string> = {
  FOLLOW_UP: '#fcd34d',
  COUNTER: '#fca5a5',
  SETUP: '#86efac',
  TRANSITION: '#93c5fd',
}
// Persists the pan/zoom position so navigating to a technique and back
// returns the graph to the exact same coordinates.
const GRAPH_VIEW_KEY = 'bjj-dojo.techniques.graph-view'

function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  if (!text.trim()) return []
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  const pushCurrent = () => {
    if (current) lines.push(current)
    current = ''
  }

  for (const word of words) {
    if (word.length > maxCharsPerLine) {
      if (current) pushCurrent()
      let start = 0
      while (start < word.length) {
        lines.push(word.slice(start, start + maxCharsPerLine))
        start += maxCharsPerLine
      }
      continue
    }
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxCharsPerLine) {
      current = next
    } else {
      pushCurrent()
      current = word
    }
  }
  pushCurrent()

  if (lines.length <= maxLines) return lines
  const clipped = lines.slice(0, maxLines)
  const last = clipped[maxLines - 1].replace(/\s+$/, '').replace(/…$/, '')
  clipped[maxLines - 1] =
    last.length > maxCharsPerLine - 1
      ? `${last.slice(0, maxCharsPerLine - 1)}…`
      : `${last}…`
  return clipped
}

function estimateNodeFootprintRadius(name: string, nodeRadius: number): number {
  const wrapped = wrapText(
    name,
    GLOBAL_LABEL_MAX_CHARS_PER_LINE,
    GLOBAL_LABEL_MAX_LINES,
  )
  const maxLineChars = Math.max(
    1,
    ...wrapped.map((line) => line.replace(/…$/, '').length),
  )
  const labelWidth = maxLineChars * GLOBAL_LABEL_APPROX_CHAR_WIDTH
  const lineCount = Math.max(1, wrapped.length)
  const labelHeight = lineCount * LABEL_FONT_SIZE
  const horizontalReach = Math.max(nodeRadius, labelWidth / 2 + 3)
  const verticalReach = nodeRadius + GLOBAL_LABEL_MARGIN + labelHeight
  return Math.max(
    MIN_NODE_FOOTPRINT_RADIUS,
    horizontalReach,
    verticalReach,
    nodeRadius,
  )
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

function zoomAtClientPoint(
  view: ViewBox,
  factor: number,
  pinch: PinchState,
  clientX: number,
  clientY: number,
): ViewBox {
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
  const catMap = useLiveQuery(
    () => getCategoryMap(),
    [],
    new Map<number, Category>(),
  )

  const nodeConnectionCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const tech of techniques ?? []) counts.set(tech.id, 0)
    for (const conn of connections ?? []) {
      counts.set(
        conn.fromTechniqueId,
        (counts.get(conn.fromTechniqueId) ?? 0) + 1,
      )
      counts.set(conn.toTechniqueId, (counts.get(conn.toTechniqueId) ?? 0) + 1)
    }
    return counts
  }, [techniques, connections])

  const nodeRadiusById = useMemo(() => {
    const radiusById = new Map<number, number>()
    const nodes = techniques ?? []
    const maxConnections = Math.max(
      0,
      ...nodes.map((tech) => nodeConnectionCounts.get(tech.id) ?? 0),
    )
    const minRadius = BASE_NODE_RADIUS * MIN_NODE_SIZE_SCALE
    const maxRadius = BASE_NODE_RADIUS * MAX_NODE_SIZE_SCALE
    for (const tech of nodes) {
      const degree = nodeConnectionCounts.get(tech.id) ?? 0
      const normalized = maxConnections > 0 ? degree / maxConnections : 0
      radiusById.set(tech.id, minRadius + (maxRadius - minRadius) * normalized)
    }
    return radiusById
  }, [techniques, nodeConnectionCounts])

  const localizedTechniqueNamesById = useMemo(() => {
    const names = new Map<number, string>()
    for (const tech of techniques ?? []) {
      names.set(tech.id, getTechniqueName(tech, language))
    }
    return names
  }, [techniques, language])

  const nodeFootprints = useMemo(() => {
    const footprints = new Map<number, number>()
    for (const tech of techniques ?? []) {
      const radius = nodeRadiusById.get(tech.id) ?? BASE_NODE_RADIUS
      const name = localizedTechniqueNamesById.get(tech.id) ?? tech.name
      footprints.set(tech.id, estimateNodeFootprintRadius(name, radius))
    }
    return footprints
  }, [techniques, nodeRadiusById, localizedTechniqueNamesById])

  const nodeForceWeights = useMemo(() => {
    const forceById = new Map<number, number>()
    const values = [...nodeFootprints.values()]
    const minFootprint = values.length > 0 ? Math.min(...values) : 1
    const maxFootprint = values.length > 0 ? Math.max(...values) : 1
    const range = Math.max(maxFootprint - minFootprint, 0.001)
    for (const [id, footprint] of nodeFootprints.entries()) {
      const normalized = (footprint - minFootprint) / range
      forceById.set(id, 1 + normalized * 0.8)
    }
    return forceById
  }, [nodeFootprints])

  // Force-directed layout — recomputed only when the graph data actually changes.
  const { positions, fittedViewBox } = useMemo(() => {
    const ids = (techniques ?? []).map((tech) => tech.id)
    const edges = (connections ?? []).map((c) => ({
      from: c.fromTechniqueId,
      to: c.toTechniqueId,
    }))
    const pos = forceDirectedLayout(ids, edges, {
      footprints: nodeFootprints,
      nodeForces: nodeForceWeights,
      minFootprintGap: GLOBAL_LAYOUT_MIN_FOOTPRINT_GAP,
    })
    const maxFootprint = Math.max(32, ...nodeFootprints.values())
    return {
      positions: pos,
      fittedViewBox: computeViewBox(pos, maxFootprint + GLOBAL_LABEL_MARGIN),
    }
  }, [techniques, connections, nodeFootprints, nodeForceWeights])

  // Restore a previously saved view (kept across navigation); otherwise null
  // until the data loads and we can fit the whole graph.
  const [view, setView] = useState<ViewBox | null>(() =>
    parseViewBox(window.sessionStorage.getItem(GRAPH_VIEW_KEY)),
  )

  // First load only: fit the viewport to the whole graph. Skipped when a saved
  // view was restored, so returning to the page keeps the previous coordinates.
  useEffect(() => {
    if (
      view === null &&
      techniques !== undefined &&
      connections !== undefined
    ) {
      setView(fittedViewBox)
    }
  }, [view, techniques, connections, fittedViewBox])

  // Persist the current view so it survives navigating away and back.
  useEffect(() => {
    if (view)
      window.sessionStorage.setItem(GRAPH_VIEW_KEY, JSON.stringify(view))
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
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
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
  const highlightedIndicatorTypes = useMemo(() => {
    if (!activeNodeId) return [] as ConnectionType[]
    const types = new Set<ConnectionType>()
    for (const c of connections ?? []) {
      if (
        c.fromTechniqueId === activeNodeId ||
        c.toTechniqueId === activeNodeId
      ) {
        types.add(c.connectionType)
      }
    }
    return (Object.keys(EDGE_COLORS) as ConnectionType[]).filter((type) =>
      types.has(type),
    )
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
      const factor = Math.min(
        MAX_PINCH_ZOOM_FACTOR,
        Math.max(MIN_PINCH_ZOOM_FACTOR, pinch.startDistance / currentDistance),
      )
      didPanRef.current = true
      setView(
        zoomAtClientPoint(pinch.startView, factor, pinch, centerX, centerY),
      )
      return
    }
    const pan = panRef.current
    if (!pan) return
    if (
      Math.abs(e.clientX - pan.clientX) > 6 ||
      Math.abs(e.clientY - pan.clientY) > 6
    ) {
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
    const sensitivity = e.ctrlKey
      ? WHEEL_PINCH_ZOOM_SENSITIVITY
      : WHEEL_ZOOM_SENSITIVITY
    const factor = Math.exp(e.deltaY * sensitivity)
    const wheelPinchState: PinchState = {
      startDistance: 1,
      startView: view,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectW: rect.width,
      rectH: rect.height,
    }
    setView(
      zoomAtClientPoint(view, factor, wheelPinchState, e.clientX, e.clientY),
    )
  }

  const activateTouchNode = (id: number) => {
    if (didPanRef.current) return
    setSelectedNodeId((prev) => {
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
    const ids = new Set((techniques ?? []).map((tech) => tech.categoryId))
    return [...(catMap?.values() ?? [])]
      .filter((c) => ids.has(c.id))
      .sort((a, b) => a.id - b.id)
  }, [techniques, catMap])

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100 truncate">
          {t('Technique Graph')}
        </h1>
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
              {(connections ?? []).map((c) => {
                const a = positions.get(c.fromTechniqueId)
                const b = positions.get(c.toTechniqueId)
                if (!a || !b) return null
                const highlighted =
                  activeNodeId !== null &&
                  (c.fromTechniqueId === activeNodeId ||
                    c.toTechniqueId === activeNodeId)
                const dimmed = activeNodeId !== null && !highlighted
                const edgeColor = highlighted
                  ? EDGE_COLORS[c.connectionType]
                  : DEFAULT_EDGE_COLOR
                const dx = b.x - a.x
                const dy = b.y - a.y
                const dist = Math.max(Math.hypot(dx, dy), 0.001)
                const sourceRadius =
                  nodeRadiusById.get(c.fromTechniqueId) ?? BASE_NODE_RADIUS
                const targetRadius =
                  nodeRadiusById.get(c.toTechniqueId) ?? BASE_NODE_RADIUS
                const sourcePad = sourceRadius + (highlighted ? 4.5 : 0.75)
                const targetPad = targetRadius + (highlighted ? 4.5 : 0.75)
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
                      strokeOpacity={
                        dimmed ? DIMMED_EDGE_OPACITY : highlighted ? 0.98 : 0.56
                      }
                      markerEnd={
                        highlighted
                          ? `url(#tg-arrow-${c.connectionType})`
                          : undefined
                      }
                    />
                    {!isTouchGraph && (
                      <title>
                        {connectionTypeLabel(
                          c.connectionType,
                          CONNECTION_LABELS[c.connectionType],
                          language,
                        )}
                      </title>
                    )}
                  </g>
                )
              })}

              {/* Nodes — coloured by category */}
              {(techniques ?? []).map((tech) => {
                const p = positions.get(tech.id)
                if (!p) return null
                const color = categoryColor(tech.categoryId)
                const highlighted = highlightedNodeIds.has(tech.id)
                const dimmed = activeNodeId !== null && !highlighted
                const localizedName = getTechniqueName(tech, language)
                const nodeRadius = nodeRadiusById.get(tech.id) ?? BASE_NODE_RADIUS
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
                    onPointerEnter={
                      isTouchGraph ? undefined : () => setHoveredNodeId(tech.id)
                    }
                    onPointerLeave={
                      isTouchGraph
                        ? undefined
                        : () =>
                            setHoveredNodeId((prev) =>
                              prev === tech.id ? null : prev,
                            )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/techniques/${tech.id}`)
                      }
                    }}
                    aria-label={localizedName}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={nodeRadius}
                      fill="#18181b"
                      stroke={highlighted ? color : '#3f3f46'}
                      strokeWidth={
                        highlighted ? NODE_STROKE_HIGHLIGHT : NODE_STROKE_DEFAULT
                      }
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={Math.max(1, nodeRadius - NODE_INNER_FILL_OFFSET)}
                      fill={color}
                      fillOpacity={highlighted ? 0.5 : 0.28}
                    />
                    {!isTouchGraph && <title>{localizedName}</title>}
                  </g>
                )
              })}
              {showLabels &&
                (techniques ?? []).map((tech) => {
                  const p = positions.get(tech.id)
                  if (!p) return null
                  const highlighted = highlightedNodeIds.has(tech.id)
                  const dimmed = activeNodeId !== null && !highlighted
                  const localizedName = getTechniqueName(tech, language)
                  const nodeRadius = nodeRadiusById.get(tech.id) ?? BASE_NODE_RADIUS
                  const labelX = p.x
                  const labelY = p.y + nodeRadius + GLOBAL_LABEL_MARGIN
                  const lines = wrapText(
                    localizedName,
                    GLOBAL_LABEL_MAX_CHARS_PER_LINE,
                    GLOBAL_LABEL_MAX_LINES,
                  )
                  return (
                    <text
                      key={`label-${tech.id}`}
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fontSize={LABEL_FONT_SIZE}
                      fill="#d4d4d8"
                      fillOpacity={dimmed ? 0 : 1}
                      data-testid={`global-node-label-${tech.id}`}
                    >
                      {lines.map((line, idx) => (
                        <tspan
                          key={`${tech.id}-${idx}`}
                          x={labelX}
                          dy={idx === 0 ? 0 : LABEL_FONT_SIZE}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
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
                onClick={() => setView((v) => (v ? zoomViewBox(v, 0.7) : v))}
                aria-label={t('Zoom in')}
                className="w-9 h-9 flex items-center justify-center bg-zinc-800/90 text-zinc-200 rounded-lg active:bg-zinc-700"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setView((v) => (v ? zoomViewBox(v, 1.4) : v))}
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

            {/* Bottom legends */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
              {usedCategories.length > 0 && (
                <div
                  className="flex flex-wrap gap-x-3 gap-y-1.5 bg-zinc-900/85 backdrop-blur-sm rounded-xl px-3 py-2"
                  data-testid="category-legend"
                >
                  {usedCategories.map((c) => (
                    <span
                      key={c.id}
                      className="flex items-center gap-1.5 text-xs text-zinc-300"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: categoryColor(c.id) }}
                      />
                      {getCategoryName(c, language)}
                    </span>
                  ))}
                </div>
              )}
              {highlightedIndicatorTypes.length > 0 && (
                <div
                  className="self-end flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5"
                  data-testid="indicator-legend"
                >
                  {highlightedIndicatorTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 text-[10px] text-zinc-300"
                    >
                      <svg
                        viewBox="0 0 18 8"
                        className="w-4.5 h-2 shrink-0"
                        aria-hidden="true"
                      >
                        <line
                          x1="1"
                          y1="4"
                          x2="13"
                          y2="4"
                          stroke={EDGE_COLORS[type]}
                          strokeWidth="1.6"
                        />
                        <path
                          d="M12 1 L17 4 L12 7 z"
                          fill={EDGE_COLORS[type]}
                        />
                      </svg>
                      {connectionTypeLabel(
                        type,
                        CONNECTION_LABELS[type],
                        language,
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
