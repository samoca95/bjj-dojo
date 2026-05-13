import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import TechniqueEditPage from '../pages/TechniqueEditPage'
import { UndoProvider, UndoSnackbar } from '../components/UndoContext'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

// vi.hoisted ensures these are available when vi.mock factory runs (hoisting order)
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  add: vi.fn().mockResolvedValue(1001),
  update: vi.fn(),
  del: vi.fn(),
  put: vi.fn(),
  last: vi.fn().mockResolvedValue({ id: 1000 }),
  connBulkPut: vi.fn(),
  connWhere: vi.fn(() => ({
    equals: vi.fn(() => ({
      delete: vi.fn().mockResolvedValue(0),
      toArray: vi.fn().mockResolvedValue([]),
    })),
  })),
}))

vi.mock('../db/database', () => ({
  db: {
    techniques: {
      get: mocks.get,
      add: mocks.add,
      update: mocks.update,
      delete: mocks.del,
      put: mocks.put,
      orderBy: vi.fn(() => ({ last: mocks.last })),
    },
    techniqueConnections: {
      where: mocks.connWhere,
      bulkAdd: vi.fn(),
      bulkPut: mocks.connBulkPut,
    },
    categories: {
      orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const sampleCategories = [
  { id: 1, name: 'Guards', description: '', icon: 'shield' },
  { id: 4, name: 'Submissions', description: '', icon: 'target' },
]

const sampleTechnique = {
  id: 42,
  name: 'Armbar',
  description: 'Classic armbar',
  youtubeUrl: 'https://youtube.com/watch?v=test',
  difficulty: 'INTERMEDIATE' as const,
  categoryId: 4,
  cues: ['Squeeze knees', 'Hips up'],
  isCustom: false,
}

function renderNew() {
  // Alternate: odd calls → categories, even calls → allTechniques ([])
  // This handles multiple renders without running out of mocked values
  let callIdx = 0
  mockUseLiveQuery.mockImplementation(() => callIdx++ % 2 === 0 ? sampleCategories : [])
  return render(
    <UndoProvider>
      <MemoryRouter initialEntries={['/techniques/new/edit']}>
        <Routes>
          {/* literal path — no :id param captured, so id is undefined → isNew=true */}
          <Route path="/techniques/new/edit" element={<TechniqueEditPage />} />
          <Route path="/techniques/:id" element={<div data-testid="technique-detail" />} />
        </Routes>
      </MemoryRouter>
      <UndoSnackbar />
    </UndoProvider>,
  )
}

function renderEdit(technique = sampleTechnique, initialEntries: string[] = [`/techniques/${technique.id}/edit`]) {
  mocks.get.mockResolvedValue(technique)
  // Alternate: odd calls → categories, even calls → allTechniques ([])
  let callIdx = 0
  mockUseLiveQuery.mockImplementation(() => callIdx++ % 2 === 0 ? sampleCategories : [])
  return render(
    <UndoProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/settings" element={<div data-testid="settings-page" />} />
          <Route path="/techniques/:id/edit" element={<TechniqueEditPage />} />
          <Route path="/techniques/:id" element={<div data-testid="technique-detail" />} />
          <Route path="/techniques" element={<div data-testid="techniques-list" />} />
        </Routes>
      </MemoryRouter>
      <UndoSnackbar />
    </UndoProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.add.mockResolvedValue(1001)
  mocks.last.mockResolvedValue({ id: 1000 })
  mocks.connWhere.mockReturnValue({
    equals: vi.fn(() => ({
      delete: vi.fn().mockResolvedValue(0),
      toArray: vi.fn().mockResolvedValue([]),
    })),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TechniqueEditPage — new technique', () => {
  it('renders "New Technique" heading', () => {
    renderNew()
    expect(screen.getByText('New Technique')).toBeInTheDocument()
  })

  it('Save button is disabled when name is empty', () => {
    renderNew()
    const save = screen.getByText('Save')
    expect(save).toHaveAttribute('disabled')
  })

  it('Save button enables after typing a name', async () => {
    const user = userEvent.setup()
    renderNew()
    await user.type(screen.getByPlaceholderText('Technique name'), 'Hip Escape')
    expect(screen.getByText('Save')).not.toHaveAttribute('disabled')
  })

  it('shows all difficulty options', () => {
    renderNew()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
    expect(screen.getByText('Advanced')).toBeInTheDocument()
    expect(screen.getByText('Elite')).toBeInTheDocument()
  })

  it('shows category buttons from live query', () => {
    renderNew()
    expect(screen.getByText('Guards')).toBeInTheDocument()
    expect(screen.getByText('Submissions')).toBeInTheDocument()
  })

  it('shows YouTube URL field', () => {
    renderNew()
    expect(screen.getByPlaceholderText(/youtube/i)).toBeInTheDocument()
  })

  it('does not show Delete button for new techniques', () => {
    renderNew()
    expect(screen.queryByText('Delete Technique')).toBeNull()
  })

  it('can type in coaching cue input', async () => {
    const user = userEvent.setup()
    renderNew()
    const cueInput = screen.getByPlaceholderText('Add a coaching cue…')
    await user.type(cueInput, 'Keep hips low')
    expect((cueInput as HTMLInputElement).value).toBe('Keep hips low')
  })
})

describe('TechniqueEditPage — edit existing technique', () => {
  it('renders "Edit Technique" heading', () => {
    renderEdit()
    expect(screen.getByText('Edit Technique')).toBeInTheDocument()
  })

  it('pre-populates the name field after load', async () => {
    renderEdit()
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Technique name') as HTMLInputElement
      expect(input.value).toBe('Armbar')
    })
  })

  it('pre-populates the youtube URL after load', async () => {
    renderEdit()
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/youtube/i) as HTMLInputElement
      expect(input.value).toBe('https://youtube.com/watch?v=test')
    })
  })

  it('shows coaching cues from existing technique', async () => {
    renderEdit()
    await waitFor(() => {
      expect(screen.getByText('Squeeze knees')).toBeInTheDocument()
      expect(screen.getByText('Hips up')).toBeInTheDocument()
    })
  })

  it('shows Delete button for existing techniques', () => {
    renderEdit()
    expect(screen.getByText('Delete Technique')).toBeInTheDocument()
  })

  it('can remove a coaching cue', async () => {
    const user = userEvent.setup()
    renderEdit()
    await waitFor(() => expect(screen.getByText('Squeeze knees')).toBeInTheDocument())
    const cueRow = screen.getByText('Squeeze knees').closest('div')!
    const xBtn = cueRow.parentElement!.querySelector('button') as HTMLElement
    await user.click(xBtn)
    await waitFor(() => expect(screen.queryByText('Squeeze knees')).toBeNull())
  })

  it('adds a coaching cue with Enter', async () => {
    const user = userEvent.setup()
    renderEdit()
    const cueInput = screen.getByPlaceholderText('Add a coaching cue…')
    await user.type(cueInput, 'Hip escape first{Enter}')
    expect(screen.getByText('Hip escape first')).toBeInTheDocument()
  })

  it('opens in-app delete modal showing technique name', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    renderEdit()
    await waitFor(() => expect(screen.getByText('Delete Technique')).toBeInTheDocument())
    await user.click(screen.getByText('Delete Technique'))

    expect(screen.getByText('Delete technique')).toBeInTheDocument()
    expect(screen.getByText('This technique will be deleted:')).toBeInTheDocument()
    expect(screen.getByText('Armbar')).toBeInTheDocument()
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('shows undo snackbar and restores deleted technique', async () => {
    const user = userEvent.setup()
    renderEdit()
    await waitFor(() => expect(screen.getByText('Delete Technique')).toBeInTheDocument())

    await user.click(screen.getByText('Delete Technique'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('Technique deleted.')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'UNDO' }))

    await waitFor(() => {
      expect(mocks.put).toHaveBeenCalled()
    })
  })

  it('returns to previous window after delete timeout', async () => {
    const user = userEvent.setup()
    renderEdit(sampleTechnique, ['/settings', `/techniques/${sampleTechnique.id}/edit`])
    await waitFor(() => expect(screen.getByText('Delete Technique')).toBeInTheDocument())

    await user.click(screen.getByText('Delete Technique'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByText('Technique deleted.')).toBeInTheDocument())

    await new Promise(resolve => setTimeout(resolve, 5100))
    await waitFor(() => expect(screen.getByTestId('settings-page')).toBeInTheDocument())
  }, 12000)
})
