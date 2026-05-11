import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SessionsPage from '../pages/SessionsPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
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

const mockSession = {
  id: 1,
  date: new Date('2025-01-15').getTime(),
  durationMinutes: 90,
  sessionType: 'GI' as const,
  clubId: null,
  notes: 'Worked on guard',
  energyLevel: 4,
}

function setupMocks({
  sessions = [],
  clubs = [],
  tapsBySession = new Map<number, { given: number; received: number }>(),
  techniquesBySession = new Map<number, string[]>(),
}: {
  sessions?: typeof mockSession[]
  clubs?: Array<{ id?: number; name: string }>
  tapsBySession?: Map<number, { given: number; received: number }>
  techniquesBySession?: Map<number, string[]>
} = {}) {
  let call = 0
  mockUseLiveQuery.mockImplementation(() => {
    call += 1
    if (call % 4 === 1) return sessions
    if (call % 4 === 2) return clubs
    if (call % 4 === 3) return tapsBySession
    return techniquesBySession
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionsPage', () => {
  it('renders the page heading', () => {
    setupMocks()
    renderSessionsPage()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
  })

  it('shows empty state when no sessions exist', () => {
    setupMocks()
    renderSessionsPage()
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    expect(screen.getByText('Tap + to log your first training')).toBeInTheDocument()
  })

  it('renders a session card when sessions exist', () => {
    setupMocks({ sessions: [mockSession] })
    renderSessionsPage()
    expect(screen.getByText('90 min')).toBeInTheDocument()
    expect(screen.getByText(/Worked on guard/)).toBeInTheDocument()
  })

  it('has a working +FAB button', async () => {
    setupMocks()
    const user = userEvent.setup()
    renderSessionsPage()

    const fab = document.querySelector('button[class*="fixed bottom-20"]') as HTMLElement
    expect(fab).not.toBeNull()
    await user.click(fab)
    expect(screen.getByTestId('new-session-page')).toBeInTheDocument()
  })

  it('renders weekly goal widget', () => {
    setupMocks({ sessions: [mockSession] })
    renderSessionsPage()
    expect(screen.getByText('WEEKLY GOAL')).toBeInTheDocument()
  })
})
