import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TechniqueGraphPage from '../pages/TechniqueGraphPage'
import type { Category, Technique, TechniqueConnection } from '../types'

vi.mock('dexie-react-hooks', () => ({ useLiveQuery: vi.fn() }))
import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const techniques: Technique[] = [
  {
    id: 101,
    name: 'Closed Guard',
    categoryId: 1,
    difficulty: 'BEGINNER',
    isCustom: false,
    description: '',
    cues: [],
    youtubeUrl: '',
  },
  {
    id: 401,
    name: 'Armbar',
    categoryId: 4,
    difficulty: 'BEGINNER',
    isCustom: false,
    description: '',
    cues: [],
    youtubeUrl: '',
  },
  {
    id: 402,
    name: 'Triangle',
    categoryId: 4,
    difficulty: 'INTERMEDIATE',
    isCustom: false,
    description: '',
    cues: [],
    youtubeUrl: '',
  },
]

const connections: TechniqueConnection[] = [
  { fromTechniqueId: 101, toTechniqueId: 401, connectionType: 'FOLLOW_UP' },
  { fromTechniqueId: 101, toTechniqueId: 402, connectionType: 'FOLLOW_UP' },
]

const catMap = new Map<number, Category>([
  [1, { id: 1, name: 'Guards', description: '' }],
  [4, { id: 4, name: 'Submissions', description: '' }],
])

function setupMocks(opts?: {
  techniques?: Technique[]
  connections?: TechniqueConnection[]
}) {
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
        <Route
          path="/techniques/:id"
          element={<div data-testid="technique-detail" />}
        />
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

  it('shows highlighted edge arrows and renders indicator legend entries when a node is hovered', () => {
    setupMocks()
    const { container } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.pointerEnter(firstNode)
    expect(container.querySelector('line[marker-end]')).not.toBeNull()
    const indicatorLegend = container.querySelector(
      '[data-testid="indicator-legend"]',
    )
    expect(indicatorLegend).not.toBeNull()
    expect(indicatorLegend?.textContent).toContain('Follow-up')
    const inlineHighlightedTypeLabels = [
      ...container.querySelectorAll('text'),
    ].filter((node) => node.getAttribute('font-size') === '8')
    expect(inlineHighlightedTypeLabels).toHaveLength(0)
  })

  it('dims non-highlighted techniques when a node is highlighted', () => {
    setupMocks({
      techniques: [
        ...techniques,
        {
          id: 999,
          name: 'Knee Slice',
          categoryId: 1,
          difficulty: 'BEGINNER',
          isCustom: false,
          description: '',
          cues: [],
          youtubeUrl: '',
        },
      ],
      connections,
    })
    const { container } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.pointerEnter(firstNode)
    expect(
      container.querySelectorAll('g[role="button"][opacity="0.26"]'),
    ).toHaveLength(1)
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

  it('renders highlighted indicator legend on touch screens after selecting a node', () => {
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
    expect(container.querySelector('line[marker-end]')).not.toBeNull()
    const indicatorLegend = container.querySelector(
      '[data-testid="indicator-legend"]',
    )
    expect(indicatorLegend).not.toBeNull()
    expect(indicatorLegend?.textContent).toContain('Follow-up')
  })

  it('supports wheel zoom on laptop input devices', async () => {
    setupMocks()
    const { container } = renderPage()
    const svg = container.querySelector('svg[role="img"]')!
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      toJSON: () => ({}),
    } as DOMRect)
    const before = svg.getAttribute('viewBox')
    fireEvent.wheel(svg, { deltaY: -120, clientX: 200, clientY: 200 })
    await waitFor(() => {
      const after = svg.getAttribute('viewBox')
      expect(after).not.toBeNull()
      expect(after).not.toBe(before)
    })
  })

  it('navigates on first click of a node on non-touch screens', () => {
    setupMocks()
    const { container, getByTestId, queryByTestId } = renderPage()
    const firstNode = container.querySelector('g[role="button"]')!
    fireEvent.click(firstNode)
    expect(getByTestId('technique-detail')).toBeInTheDocument()
    expect(queryByTestId('technique-detail')).not.toBeNull()
  })

  it('selects on first tap and navigates on second tap of the same node on touch screens', () => {
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

  it('renders technique labels in the current app language', () => {
    window.localStorage.setItem('bjj-dojo:language', 'es')
    setupMocks()
    const { container } = renderPage()
    const titles = [
      ...container.querySelectorAll('g[role="button"] title'),
    ].map((node) => node.textContent)
    expect(titles).toContain('Guardia Cerrada')
    expect(titles).toContain('Triángulo')
  })

  it('renders global labels below nodes and wraps long names', () => {
    const longName =
      'Very Long Global Label Name That Should Wrap Across Two Lines'
    window.sessionStorage.setItem(
      GRAPH_VIEW_KEY,
      JSON.stringify({ x: -120, y: -120, width: 10, height: 10 }),
    )
    setupMocks({
      techniques: [
        {
          ...techniques[0],
          name: longName,
        },
        techniques[1],
      ],
      connections: [{ fromTechniqueId: 101, toTechniqueId: 401, connectionType: 'FOLLOW_UP' }],
    })
    const { container } = renderPage()
    const label = container.querySelector('[data-testid="global-node-label-101"]')
    expect(label).not.toBeNull()
    expect(label?.getAttribute('text-anchor')).toBe('middle')
    expect(label?.getAttribute('dominant-baseline')).toBe('hanging')
    expect(label?.querySelectorAll('tspan').length).toBeGreaterThan(1)
  })

  it('restores a previously saved view from session storage', () => {
    const saved = { x: 10, y: 20, width: 300, height: 400 }
    window.sessionStorage.setItem(GRAPH_VIEW_KEY, JSON.stringify(saved))
    setupMocks()
    const { container } = renderPage()
    expect(
      container.querySelector('svg[role="img"]')?.getAttribute('viewBox'),
    ).toBe('10 20 300 400')
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
