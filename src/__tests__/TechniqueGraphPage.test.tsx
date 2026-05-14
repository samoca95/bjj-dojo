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

beforeEach(() => vi.clearAllMocks())
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

  it('navigates to the technique detail page when a node is clicked', () => {
    setupMocks()
    const { container, getByTestId } = renderPage()
    fireEvent.click(container.querySelector('g[role="button"]')!)
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
})
