import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TechniqueGraphPage from '../pages/TechniqueGraphPage'
import type { Category, Technique, TechniqueConnection } from '../types'

vi.mock('dexie-react-hooks', () => ({ useLiveQuery: vi.fn() }))
import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const techniques: Technique[] = [
  { id: 101, name: 'Closed Guard', categoryId: 1, difficulty: 'BEGINNER', isCustom: false, description: '', cues: [], youtubeUrl: '' },
  { id: 401, name: 'Armbar', categoryId: 4, difficulty: 'BEGINNER', isCustom: false, description: '', cues: [], youtubeUrl: '' },
  { id: 402, name: 'Triangle', categoryId: 4, difficulty: 'INTERMEDIATE', isCustom: false, description: '', cues: [], youtubeUrl: '' },
]

const connections: TechniqueConnection[] = [
  { fromTechniqueId: 101, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
]

const catMap = new Map<number, Category>([
  [1, { id: 1, name: 'Guards', description: '' }],
  [4, { id: 4, name: 'Submissions', description: '' }],
])

function setupMocks(opts?: { techniques?: Technique[]; connections?: TechniqueConnection[] }) {
  const techs = opts?.techniques ?? techniques
  const conns = opts?.connections ?? connections
  let call = 0
  // The page calls useLiveQuery three times per render: techniques, connections, categories.
  mockUseLiveQuery.mockImplementation((() => {
    const c = call++ % 3
    if (c === 0) return techs
    if (c === 1) return conns
    return catMap
  }) as never)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/techniques/graph']}>
      <Routes>
        <Route path="/techniques/graph" element={<TechniqueGraphPage />} />
        <Route path="/techniques/:id" element={<div data-testid="technique-detail" />} />
      </Routes>
    </MemoryRouter>,
  )
}

const GRAPH_VIEW_KEY = 'bjj-dojo.techniques.graph-view'

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})
afterEach(() => vi.restoreAllMocks())

describe('TechniqueGraphPage', () => {
  it('shows a loading spinner until the data is available', () => {
    let call = 0
    mockUseLiveQuery.mockImplementation((() => {
      const c = call++ % 3
      return c === 2 ? catMap : undefined
    }) as never)
    const { container } = renderPage()
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders a clickable node for every technique', () => {
    setupMocks()
    const { container } = renderPage()
    expect(container.querySelectorAll('g[role="button"]')).toHaveLength(3)
  })

  it('renders an edge for every connection', () => {
    setupMocks()
    const { container } = renderPage()
    expect(container.querySelectorAll('line')).toHaveLength(2)
  })

  it('shows highlighted edge arrows when a node is hovered', () => {
    setupMocks()
    const { container, queryAllByText } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.pointerEnter(firstNode)
    expect(container.querySelector('line[marker-end]')).not.toBeNull()
    expect(queryAllByText('Follow-up')).toHaveLength(0)
  })

  it('uses a uniform colour for non-highlighted edges', () => {
    setupMocks()
    const { container } = renderPage()
    const edges = container.querySelectorAll('line')
    expect(edges.length).toBeGreaterThan(0)
    for (const edge of edges) {
      expect(edge.getAttribute('stroke')).toBe('#52525b')
    }
  })

  it('does not render highlighted white/black type boxes on touch screens', () => {
    vi.mocked(window.matchMedia).mockImplementation(() => ({
      matches: true,
      media: '(hover: none), (pointer: coarse)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    setupMocks()
    const { container } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.click(firstNode)
    const highlightedTypeLabels = [...container.querySelectorAll('text')]
      .filter(node => node.textContent?.trim() === 'Follow-up')
    expect(highlightedTypeLabels).toHaveLength(0)
    expect(container.querySelector('line[marker-end]')).not.toBeNull()
  })

  it('supports wheel zoom on laptop input devices', () => {
    setupMocks()
    const { container } = renderPage()
    const svg = container.querySelector('svg[role="img"]')!
    const before = svg.getAttribute('viewBox')
    fireEvent.wheel(svg, { deltaY: -120, clientX: 200, clientY: 200 })
    const after = svg.getAttribute('viewBox')
    expect(after).not.toBeNull()
    expect(after).not.toBe(before)
  })

  it('selects on first click and navigates on second click of the same node', () => {
    setupMocks()
    const { container, getByTestId, queryByTestId } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.click(firstNode)
    expect(queryByTestId('technique-detail')).toBeNull()
    fireEvent.click(firstNode)
    expect(getByTestId('technique-detail')).toBeInTheDocument()
  })

  it('shows an empty state when there are no techniques', () => {
    setupMocks({ techniques: [], connections: [] })
    const { getByText } = renderPage()
    expect(getByText('No connections to display')).toBeInTheDocument()
  })

  it('renders a category legend entry for each category in use', () => {
    setupMocks()
    const { getByText } = renderPage()
    expect(getByText('Guards')).toBeInTheDocument()
    expect(getByText('Submissions')).toBeInTheDocument()
  })

  it('restores a previously saved view from session storage', () => {
    const saved = { x: 10, y: 20, width: 300, height: 400 }
    window.sessionStorage.setItem(GRAPH_VIEW_KEY, JSON.stringify(saved))
    setupMocks()
    const { container } = renderPage()
    expect(container.querySelector('svg[role="img"]')?.getAttribute('viewBox')).toBe('10 20 300 400')
  })

  it('persists the current view to session storage', () => {
    setupMocks()
    renderPage()
    const raw = window.sessionStorage.getItem(GRAPH_VIEW_KEY)
    expect(raw).not.toBeNull()
    const v = JSON.parse(raw!)
    expect(Number.isFinite(v.x)).toBe(true)
    expect(v.width).toBeGreaterThan(0)
    expect(v.height).toBeGreaterThan(0)
  })
})
