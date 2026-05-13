import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SessionsPage from '../pages/SessionsPage'

// Mock dexie-react-hooks useLiveQuery
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

// Mock the db module
vi.mock('../db/database', () => ({
  db: {
    sessions: { orderBy: vi.fn(), toArray: vi.fn() },
    clubs: { toArray: vi.fn() },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

function renderSessionsPage() {
  return render(
    <MemoryRouter initialEntries={['/sessions']}>
      <Routes>
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/new" element={<div data-testid="new-session-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

// SessionsPage calls useLiveQuery three times per render: sessions, clubs, meta
const mockSession = {
  id: 1,
  date: Date.now(),
  durationMinutes: 90,
  sessionType: 'GI' as const,
  clubId: null,
  notes: 'Worked on guard',
  energyLevel: 4,
}

function setupEmptyMocks() {
  const responses = [
    [],
    [],
    { techniqueNamesBySessionId: new Map(), tapStatsBySessionId: new Map() },
  ]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

function setupSessionMocks() {
  const responses = [
    [mockSession],
    [],
    {
      techniqueNamesBySessionId: new Map([[1, []]]),
      tapStatsBySessionId: new Map([[1, { given: 0, received: 0 }]]),
    },
  ]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

function setupTapSessionMocks() {
  const responses = [
    [mockSession],
    [],
    {
      techniqueNamesBySessionId: new Map([[1, []]]),
      tapStatsBySessionId: new Map([[1, { given: 2, received: 1 }]]),
    },
  ]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

function setupMixedDateSessionMocks() {
  const now = Date.now()
  const responses = [
    [
      { ...mockSession, id: 1, date: now, notes: 'Recent session' },
      { ...mockSession, id: 2, date: now - 120 * 24 * 60 * 60 * 1000, notes: 'Old session' },
    ],
    [],
    {
      techniqueNamesBySessionId: new Map([[1, []], [2, []]]),
      tapStatsBySessionId: new Map([[1, { given: 0, received: 0 }], [2, { given: 0, received: 0 }]]),
    },
  ]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

function setupSearchSessionMocks() {
  const now = Date.now()
  const responses = [
    [
      { ...mockSession, id: 1, date: now, notes: 'Guard passing rounds' },
      { ...mockSession, id: 2, date: now - 1000, notes: 'Competition prep' },
    ],
    [],
    {
      techniqueNamesBySessionId: new Map([[1, ['Knee cut pass']], [2, ['Armbar']]]),
      tapStatsBySessionId: new Map([[1, { given: 0, received: 0 }], [2, { given: 0, received: 0 }]]),
      searchTextBySessionId: new Map([[1, 'knee cut pass pressure passing'], [2, 'armbar submission mechanics']]),
    },
  ]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionsPage', () => {
  it('renders the page heading', () => {
    setupEmptyMocks()
    renderSessionsPage()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
  })

  it('shows empty state when no sessions exist', () => {
    setupEmptyMocks()
    renderSessionsPage()
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    expect(screen.getByText('Tap + to log your first training')).toBeInTheDocument()
  })

  it('renders a session card when sessions exist', () => {
    setupSessionMocks()
    renderSessionsPage()
    expect(screen.getByText('90 min')).toBeInTheDocument()
    expect(screen.getByText(/Worked on guard/)).toBeInTheDocument()
  })

  it('shows given and received tap stats with green zap and red hand icons', () => {
    setupTapSessionMocks()
    renderSessionsPage()
    const sessionCard = screen.getByText(/Worked on guard/).closest('button')

    expect(sessionCard).not.toBeNull()
    expect(within(sessionCard!).getByText('2')).toBeInTheDocument()
    expect(within(sessionCard!).getByText('1')).toBeInTheDocument()
    expect(sessionCard?.querySelector('svg.text-green-500')).not.toBeNull()
    expect(sessionCard?.querySelector('svg.text-red-400')).not.toBeNull()
  })

  it('has a working + FAB button', async () => {
    setupEmptyMocks()
    const user = userEvent.setup()
    renderSessionsPage()

    const fab = document.querySelector('button[class*="fixed bottom-20"]') as HTMLElement
    expect(fab).not.toBeNull()
    await user.click(fab)
    expect(screen.getByTestId('new-session-page')).toBeInTheDocument()
  })

  it('shows all sessions by default before selecting a day range', () => {
    setupMixedDateSessionMocks()
    renderSessionsPage()
    expect(screen.getByText('Recent session')).toBeInTheDocument()
    expect(screen.getByText('Old session')).toBeInTheDocument()
  })

  it('filters sessions when a day range is selected', async () => {
    setupMixedDateSessionMocks()
    const user = userEvent.setup()
    renderSessionsPage()

    await user.click(screen.getByLabelText('Filter'))
    await user.click(screen.getByRole('button', { name: '30d' }))

    expect(screen.getByText('Recent session')).toBeInTheDocument()
    expect(screen.queryByText('Old session')).not.toBeInTheDocument()
  })

  it('filters sessions by search query across notes and techniques', async () => {
    setupSearchSessionMocks()
    const user = userEvent.setup()
    renderSessionsPage()

    await user.type(screen.getByLabelText('Search sessions'), 'knee cut')

    expect(screen.getByText('Knee cut pass')).toBeInTheDocument()
    expect(screen.queryByText('Competition prep')).not.toBeInTheDocument()
  })
})
