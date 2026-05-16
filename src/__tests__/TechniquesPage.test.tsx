import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { forwardRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TechniquesPage from '../pages/TechniquesPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    categories: {
      orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      count: vi.fn().mockResolvedValue(0),
    },
    techniques: {
      toCollection: vi.fn(() => ({ sortBy: vi.fn().mockResolvedValue([]) })),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({ sortBy: vi.fn().mockResolvedValue([]) })),
      })),
    },
  },
}))

vi.mock('../db/categoryCache', () => ({
  getCategoryMap: vi.fn().mockResolvedValue(new Map()),
}))

// Render all items without virtualization — tests care about content, not windowing
vi.mock('react-window', () => ({
  VariableSizeList: forwardRef<
    HTMLDivElement,
    {
      children: (props: {
        index: number
        style: React.CSSProperties
      }) => React.ReactNode
      itemCount: number
    }
  >(({ children, itemCount }, ref) => (
    <div ref={ref}>
      {Array.from({ length: itemCount }, (_, i) => (
        <div key={i}>{children({ index: i, style: {} })}</div>
      ))}
    </div>
  )),
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const sampleCategories = [
  { id: 1, name: 'Guards', description: '', icon: 'shield' },
  { id: 4, name: 'Submissions', description: '', icon: 'target' },
]

const sampleTechniques = [
  {
    id: 401,
    name: 'Armbar',
    categoryId: 4,
    difficulty: 'BEGINNER' as const,
    isCustom: false,
    isFavorite: true,
    description: 'Classic armbar',
    cues: [],
    youtubeUrl: '',
  },
  {
    id: 101,
    name: 'Closed Guard',
    categoryId: 1,
    difficulty: 'BEGINNER' as const,
    isCustom: false,
    isFavorite: false,
    description: 'Guard position',
    cues: [],
    youtubeUrl: '',
  },
]

function setupMocks(
  categories = sampleCategories,
  techniques = sampleTechniques,
) {
  // TechniquesPage calls useLiveQuery twice per render:
  // 1st: categories with [] deps
  // 2nd: techniques+freqMap with non-empty deps — returns { items, freqMap }
  mockUseLiveQuery.mockImplementation((_fn, deps) => {
    if (Array.isArray(deps) && deps.length === 0) return categories
    return { items: techniques, freqMap: new Map<number, number>() }
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/techniques']}>
      <Routes>
        <Route path="/techniques" element={<TechniquesPage />} />
        <Route
          path="/techniques/new/edit"
          element={<div data-testid="new-technique-page" />}
        />
        <Route
          path="/techniques/graph"
          element={<div data-testid="technique-graph-page" />}
        />
        <Route path="/flows" element={<div data-testid="flows-page" />} />
        <Route
          path="/techniques/:id"
          element={<div data-testid="technique-detail" />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TechniquesPage — structure', () => {
  it('renders page heading', () => {
    setupMocks()
    renderPage()
    expect(screen.getByText('Techniques')).toBeInTheDocument()
  })

  it('renders technique rows', () => {
    setupMocks()
    renderPage()
    expect(screen.getByText('Armbar')).toBeInTheDocument()
    expect(screen.getByText('Closed Guard')).toBeInTheDocument()
  })

  it('renders direct new-technique button opposite to the technique counter', () => {
    setupMocks()
    renderPage()
    const addButton = screen.getByRole('button', { name: 'New technique' })
    expect(addButton).toBeInTheDocument()
    expect(addButton.className).toContain('w-10')
    expect(addButton.className).toContain('h-10')
    expect(addButton.className).not.toContain('shadow')
  })

  it('new-technique button navigates to new technique page', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'New technique' }))
    expect(screen.getByTestId('new-technique-page')).toBeInTheDocument()
  })

  it('bottom-right Flows button opens the Flows page', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderPage()
    const flowsButton = screen.getByRole('button', { name: 'Open Flows' })
    expect(flowsButton.className).toContain('rounded-full')
    expect(flowsButton.className).toContain('bg-gold')
    await user.click(flowsButton)
    expect(screen.getByTestId('flows-page')).toBeInTheDocument()
  })

  it('shows technique count', () => {
    setupMocks()
    renderPage()
    expect(screen.getByText(/2 techniques/)).toBeInTheDocument()
  })

  it('navigates to technique detail on click', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Armbar'))
    expect(screen.getByTestId('technique-detail')).toBeInTheDocument()
  })
})

describe('TechniquesPage — search and filter', () => {
  it('renders search input', () => {
    setupMocks()
    renderPage()
    expect(
      screen.getByPlaceholderText('Search techniques…'),
    ).toBeInTheDocument()
  })

  it('shows category filter chips when filters are opened', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(screen.getAllByText('All').length).toBeGreaterThan(0)
    // Category names appear in both chips and technique rows — check at least one chip exists
    expect(screen.getAllByText('Guards').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Submissions').length).toBeGreaterThan(0)
  })

  it('restores search, sort, and filter context from session storage', async () => {
    window.sessionStorage.setItem(
      'bjj-dojo.techniques.list-context',
      JSON.stringify({
        search: 'arm',
        categoryId: 4,
        favoritesOnly: true,
        difficultyFilter: 'BEGINNER',
        sortBy: 'name_desc',
      }),
    )

    setupMocks()
    const user = userEvent.setup()
    renderPage()

    expect(
      (screen.getByPlaceholderText('Search techniques…') as HTMLInputElement)
        .value,
    ).toBe('arm')
    expect(
      (screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement)
        .value,
    ).toBe('name_desc')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(
      screen.getByRole('button', { name: 'Submissions' }).className,
    ).toContain('bg-gold')
    expect(
      screen.getByRole('button', { name: 'Favorites' }).className,
    ).toContain('bg-gold')
    expect(
      screen.getByRole('button', { name: 'BEGINNER' }).className,
    ).toContain('bg-gold')
  })
})
