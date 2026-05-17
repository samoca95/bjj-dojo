import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FlowsPage from '../pages/FlowsPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    flows: { toArray: vi.fn().mockResolvedValue([]) },
    techniques: { toArray: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock('../utils/autoBackup/notify', () => ({
  notifyDbMutation: vi.fn(),
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const sampleTechniques = [
  {
    id: 512,
    name: 'Arm Drag to Back Take',
    categoryId: 5,
    difficulty: 'INTERMEDIATE' as const,
    isCustom: false,
    description: '',
    youtubeUrl: '',
  },
  {
    id: 405,
    name: 'Rear Naked Choke',
    categoryId: 4,
    difficulty: 'BEGINNER' as const,
    isCustom: false,
    description: '',
    youtubeUrl: '',
  },
]

const sampleFlows = [
  {
    id: 9001,
    name: 'Back attack flow',
    description: 'Get to the back, finish with RNC',
    gi: true,
    noGi: true,
    tags: ['back-attack'],
    nodes: [
      { id: 'a', techniqueId: 512, childIds: ['b'] },
      { id: 'b', techniqueId: 405, childIds: [] },
    ],
    rootNodeId: 'a',
    isCustom: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 9002,
    name: 'Spider lasso sweep',
    description: 'Open guard sweep chain',
    gi: true,
    noGi: false,
    tags: ['open-guard'],
    nodes: [{ id: 'x', techniqueId: 405, childIds: [] }],
    rootNodeId: 'x',
    isCustom: false,
    createdAt: 0,
    updatedAt: 0,
  },
]

describe('FlowsPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    mockUseLiveQuery.mockImplementation((fn) => {
      const src = fn.toString()
      if (src.includes('flows')) return sampleFlows
      if (src.includes('techniques')) return sampleTechniques
      return []
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.sessionStorage.clear()
  })

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/flows']}>
        <Routes>
          <Route path="/flows" element={<FlowsPage />} />
          <Route path="/flows/new" element={<div>New flow page</div>} />
          <Route path="/flows/:id" element={<div>Flow detail</div>} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders all flows with their tags and step count', () => {
    renderPage()
    expect(screen.getByText('Back attack flow')).toBeInTheDocument()
    expect(screen.getByText('Spider lasso sweep')).toBeInTheDocument()
    expect(screen.getByText('#back-attack')).toBeInTheDocument()
    expect(screen.getByText('2 steps')).toBeInTheDocument()
    expect(screen.getByText('1 step')).toBeInTheDocument()
    expect(screen.getAllByText('Gi').length).toBeGreaterThan(0)
    expect(screen.getByText('No-Gi')).toBeInTheDocument()
  })

  it('filters flows by gi/no-gi format', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByLabelText('Filter'))
    await user.click(screen.getByRole('button', { name: 'No-Gi' }))
    await waitFor(() => {
      expect(screen.getByText('Back attack flow')).toBeInTheDocument()
      expect(screen.queryByText('Spider lasso sweep')).not.toBeInTheDocument()
    })
  })

  it('filters by referenced technique name', async () => {
    const user = userEvent.setup()
    renderPage()
    const search = screen.getByPlaceholderText('Search flows…')
    await user.type(search, 'rear naked')
    // Both flows reference RNC, but the first card name does not include "rear naked"
    // and the second flow's RNC root means it should still match.
    await waitFor(() => {
      expect(screen.getByText('Back attack flow')).toBeInTheDocument()
      expect(screen.getByText('Spider lasso sweep')).toBeInTheDocument()
    })

    // Typing something unique to flow 1 only:
    await user.clear(search)
    await user.type(search, 'back attack')
    await waitFor(() => {
      expect(screen.getByText('Back attack flow')).toBeInTheDocument()
      expect(screen.queryByText('Spider lasso sweep')).not.toBeInTheDocument()
    })
  })

  it('+ FAB navigates to the new flow page', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByLabelText('New flow'))
    expect(await screen.findByText('New flow page')).toBeInTheDocument()
  })

  it('keeps the GrappleMap 3D button', () => {
    renderPage()
    expect(screen.getByLabelText('Open GrappleMap 3D')).toBeInTheDocument()
  })
})
