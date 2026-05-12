import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClubsPage from '../pages/ClubsPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    clubs: {
      orderBy: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([]),
        last: vi.fn().mockResolvedValue({ sortOrder: 1 }),
      })),
      add: vi.fn().mockResolvedValue(1),
      update: vi.fn().mockResolvedValue(1),
      bulkPut: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    sessions: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          modify: vi.fn().mockResolvedValue(undefined),
        })),
      })),
    },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

function renderPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/clubs', state }]}> 
      <Routes>
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/sessions/new" element={<div data-testid="session-log-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ClubsPage — return flow', () => {
  it('returns to session log after adding a club when return context is provided', async () => {
    mockUseLiveQuery.mockReturnValue([])
    const user = userEvent.setup()
    renderPage({ returnTo: '/sessions/new' })

    await user.type(screen.getByPlaceholderText('e.g. Main Dojo'), 'New Academy')
    await user.click(screen.getByText('Add Club'))

    expect(await screen.findByTestId('session-log-page')).toBeInTheDocument()
  })

  it('returns to session log after editing a club when return context is provided', async () => {
    mockUseLiveQuery.mockReturnValue([{ id: 7, name: 'Original Name', sortOrder: 1 }])
    const user = userEvent.setup()
    renderPage({ returnTo: '/sessions/new' })

    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Save'))

    expect(await screen.findByTestId('session-log-page')).toBeInTheDocument()
  })
})
