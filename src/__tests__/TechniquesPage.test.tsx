import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TechniquesPage from '../pages/TechniquesPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    categories: { orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })), count: vi.fn().mockResolvedValue(0) },
    techniques: {
      toCollection: vi.fn(() => ({ sortBy: vi.fn().mockResolvedValue([]) })),
      where: vi.fn(() => ({ equals: vi.fn(() => ({ sortBy: vi.fn().mockResolvedValue([]) })) })),
    },
  },
}))

vi.mock('../db/categoryCache', () => ({
  getCategoryMap: vi.fn().mockResolvedValue(new Map()),
}))

// Render all items without virtualization — tests care about content, not windowing
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }: {
    children: (props: { index: number; style: React.CSSProperties }) => React.ReactNode
    itemCount: number
  }) => (
    <div>
      {Array.from({ length: itemCount }, (_, i) => children({ index: i, style: {} }))}
    </div>
  ),
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const sampleCategories = [
  { id: 1, name: 'Guards', description: '', icon: 'shield' },
  { id: 4, name: 'Submissions', description: '', icon: 'target' },
]

const sampleTechniques = [
  { id: 401, name: 'Armbar', categoryId: 4, difficulty: 'BEGINNER' as const, isCustom: false, isFavorite: true, description: 'Classic armbar', cues: [], youtubeUrl: '' },
  { id: 101, name: 'Closed Guard', categoryId: 1, difficulty: 'BEGINNER' as const, isCustom: false, isFavorite: false, description: 'Guard position', cues: [], youtubeUrl: '' },
]

function setupMocks(categories = sampleCategories, techniques = sampleTechniques) {
  // TechniquesPage calls useLiveQuery twice per render:
  // 1st: categories with [] deps
  // 2nd: techniques with [search, categoryId] deps (length 2)
  mockUseLiveQuery.mockImplementation((_fn, deps) => {
    if (Array.isArray(deps) && deps.length === 0) return categories
    return techniques
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/techniques']}>
      <Routes>
        <Route path="/techniques" element={<TechniquesPage />} />
        <Route path="/techniques/new/edit" element={<div data-testid="new-technique-page" />} />
        <Route path="/techniques/:id" element={<div data-testid="technique-detail" />} />
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

  it('renders FAB button to add a technique', () => {
    setupMocks()
    renderPage()
    const fab = document.querySelector('button[class*="fixed bottom-20"]') as HTMLElement
    expect(fab).not.toBeNull()
  })

  it('FAB navigates to new technique page', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderPage()
    const fab = document.querySelector('button[class*="fixed bottom-20"]') as HTMLElement
    await user.click(fab)
    expect(screen.getByTestId('new-technique-page')).toBeInTheDocument()
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
    expect(screen.getByPlaceholderText('Search techniques…')).toBeInTheDocument()
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
    window.sessionStorage.setItem('bjj-dojo.techniques.list-context', JSON.stringify({
      search: 'arm',
      categoryId: 4,
      favoritesOnly: true,
      difficultyFilter: 'BEGINNER',
      sortBy: 'name_desc',
    }))

    setupMocks()
    const user = userEvent.setup()
    renderPage()

    expect((screen.getByPlaceholderText('Search techniques…') as HTMLInputElement).value).toBe('arm')
    expect((screen.getByRole('combobox', { name: 'Sort' }) as HTMLSelectElement).value).toBe('name_desc')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(screen.getByRole('button', { name: 'Submissions' }).className).toContain('bg-gold')
    expect(screen.getByRole('button', { name: 'Favorites' }).className).toContain('bg-gold')
    expect(screen.getByRole('button', { name: 'BEGINNER' }).className).toContain('bg-gold')
  })
})
