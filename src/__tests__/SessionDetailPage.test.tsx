import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SessionDetailPage from '../pages/SessionDetailPage'
import { UndoProvider, UndoSnackbar } from '../components/UndoContext'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  sessionTechsWhere: vi.fn(() => ({
    equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })),
  })),
  tapsWhere: vi.fn(() => ({
    equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })),
  })),
  techsWhere: vi.fn(() => ({
    anyOf: vi.fn(() => ({
      sortBy: vi.fn().mockResolvedValue([]),
      toArray: vi.fn().mockResolvedValue([]),
    })),
  })),
  sessionsDelete: vi.fn(),
  sessionsPut: vi.fn(),
  sessionTechniquesBulkPut: vi.fn(),
  sessionTapsBulkPut: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    sessions: { get: mocks.get, delete: mocks.sessionsDelete, put: mocks.sessionsPut },
    clubs: { get: vi.fn() },
    sessionTechniques: { where: mocks.sessionTechsWhere, bulkPut: mocks.sessionTechniquesBulkPut },
    sessionTaps: { where: mocks.tapsWhere, bulkPut: mocks.sessionTapsBulkPut },
    techniques: { where: mocks.techsWhere },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const mockSession = {
  id: 1,
  date: new Date('2025-03-10').getTime(),
  durationMinutes: 90,
  sessionType: 'GI' as const,
  clubId: null,
  notes: 'Great session',
  energyLevel: 4,
}

const mockTechniques = [
  { id: 401, name: 'Armbar', categoryId: 4, difficulty: 'BEGINNER' as const, isCustom: false, description: '', cues: [], youtubeUrl: '' },
]

import type { TapType } from '../types'
const mockGivenTap = { id: 1, sessionId: 1, techniqueId: 401, type: 'given' as TapType }
const mockReceivedTap = { id: 2, sessionId: 1, techniqueId: 401, type: 'received' as TapType }

function setupMocks(overrides?: {
  techniques?: typeof mockTechniques
  taps?: (typeof mockGivenTap)[]
  club?: { id: number; name: string } | undefined
}) {
  const techniques = overrides?.techniques ?? []
  const taps = overrides?.taps ?? []
  const club = overrides?.club ?? undefined

  mocks.get.mockResolvedValue(mockSession)

  // SessionDetailPage calls useLiveQuery 3 times per render:
  // 0 (mod 3): club query
  // 1 (mod 3): techniques query
  // 2 (mod 3): tapData query
  let call = 0
  mockUseLiveQuery.mockImplementation(() => {
    const c = call++
    if (c % 3 === 0) return club
    if (c % 3 === 1) return techniques
    return { taps, techMap: new Map([[401, 'Armbar']]) }
  })
}

function renderPage(initialEntries: string[] = ['/sessions/1']) {
  return render(
    <UndoProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<div data-testid="home-page" />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/sessions/:id/edit" element={<div data-testid="edit-page" />} />
          <Route path="/sessions" element={<div data-testid="sessions-list" />} />
          <Route path="/techniques/:id" element={<div data-testid="technique-detail" />} />
        </Routes>
      </MemoryRouter>
      <UndoSnackbar />
    </UndoProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.sessionTechsWhere.mockReturnValue({
    equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })),
  })
  mocks.tapsWhere.mockReturnValue({
    equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })),
  })
  mocks.techsWhere.mockReturnValue({
    anyOf: vi.fn(() => ({
      sortBy: vi.fn().mockResolvedValue([]),
      toArray: vi.fn().mockResolvedValue([]),
    })),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionDetailPage — structure', () => {
  it('renders session type badge with label', async () => {
    setupMocks()
    renderPage()
    await waitFor(() => expect(screen.getByText('Gi')).toBeInTheDocument())
  })

  it('renders duration info card', async () => {
    setupMocks()
    renderPage()
    await waitFor(() => expect(screen.getByText('90 min')).toBeInTheDocument())
  })

  it('renders notes when present', async () => {
    setupMocks()
    renderPage()
    await waitFor(() => expect(screen.getByText('Great session')).toBeInTheDocument())
  })

  it('shows TECHNIQUES PRACTICED section', async () => {
    setupMocks()
    renderPage()
    await waitFor(() => expect(screen.getByText('TECHNIQUES PRACTICED')).toBeInTheDocument())
  })

  it('shows "No techniques logged" when none', async () => {
    setupMocks({ techniques: [] })
    renderPage()
    await waitFor(() => expect(screen.getByText('No techniques logged for this session.')).toBeInTheDocument())
  })

  it('shows technique names when techniques are present', async () => {
    setupMocks({ techniques: mockTechniques })
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument())
  })
})

describe('SessionDetailPage — order: techniques before taps', () => {
  it('TECHNIQUES PRACTICED appears before Taps / Submissions in the DOM', async () => {
    setupMocks({ techniques: mockTechniques, taps: [mockGivenTap] })
    renderPage()
    await waitFor(() => {
      const techSection = screen.getByText('TECHNIQUES PRACTICED')
      const tapSection = screen.getByText('Taps / Submissions')
      // DOCUMENT_POSITION_FOLLOWING (4) means tapSection comes after techSection
      expect(techSection.compareDocumentPosition(tapSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })
})

describe('SessionDetailPage — taps', () => {
  it('shows given tap count', async () => {
    setupMocks({ taps: [mockGivenTap] })
    renderPage()
    await waitFor(() => expect(screen.getByText(/1 given/)).toBeInTheDocument())
  })

  it('shows received tap count', async () => {
    setupMocks({ taps: [mockReceivedTap] })
    renderPage()
    await waitFor(() => expect(screen.getByText(/1 received/)).toBeInTheDocument())
  })

  it('does not show taps section when empty', async () => {
    setupMocks({ taps: [] })
    renderPage()
    await waitFor(() => expect(screen.queryByText('Taps / Submissions')).toBeNull())
  })
})

describe('SessionDetailPage — navigation', () => {
  it('renders edit icon button', async () => {
    setupMocks()
    renderPage()
    await waitFor(() => expect(screen.getByText('Gi')).toBeInTheDocument())
    const editBtn = document.querySelector('button svg.lucide-pencil')?.closest('button') as HTMLElement
    expect(editBtn).not.toBeNull()
  })

  it('navigates to technique detail on row click', async () => {
    setupMocks({ techniques: mockTechniques })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument())
    await user.click(screen.getByText('Armbar'))
    expect(screen.getByTestId('technique-detail')).toBeInTheDocument()
  })
})

describe('SessionDetailPage — delete flow', () => {
  it('opens in-app delete modal with session details', async () => {
    setupMocks({ techniques: mockTechniques })
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument())

    const deleteBtn = document.querySelector('button svg.lucide-trash-2')?.closest('button') as HTMLElement
    await user.click(deleteBtn)

    expect(screen.getByText('Delete session')).toBeInTheDocument()
    expect(screen.getByText('This session will be deleted:')).toBeInTheDocument()
    expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('shows undo snackbar and restores session when undo is clicked', async () => {
    setupMocks({
      techniques: mockTechniques,
      taps: [mockGivenTap],
    })
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument())

    const deleteBtn = document.querySelector('button svg.lucide-trash-2')?.closest('button') as HTMLElement
    await user.click(deleteBtn)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.getByText('Session deleted.')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'UNDO' }))

    await waitFor(() => {
      expect(mocks.sessionsPut).toHaveBeenCalledWith(mockSession)
    })
  })

  it('returns to previous window after delete timeout', async () => {
    const user = userEvent.setup()
    setupMocks({ techniques: mockTechniques })
    renderPage(['/', '/sessions/1'])
    await waitFor(() => expect(screen.getAllByText('Armbar')[0]).toBeInTheDocument())

    const deleteBtn = document.querySelector('button svg.lucide-trash-2')?.closest('button') as HTMLElement
    await user.click(deleteBtn)
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('Session deleted.')).toBeInTheDocument())

    await new Promise(resolve => setTimeout(resolve, 5100))
    await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument())
  }, 12000)
})
