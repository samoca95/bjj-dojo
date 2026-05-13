import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import AddEditSessionPage from '../pages/AddEditSessionPage'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn(),
}))

vi.mock('../db/database', () => ({
  db: {
    sessions: { get: vi.fn(), add: vi.fn().mockResolvedValue(1), put: vi.fn() },
    sessionTechniques: {
      where: vi.fn(() => ({ equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })) })),
      bulkAdd: vi.fn(),
    },
    sessionTaps: {
      where: vi.fn(() => ({ equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() })) })),
      bulkAdd: vi.fn(),
    },
    techniques: {
      orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      last: vi.fn().mockResolvedValue({ id: 1000 }),
      add: vi.fn(),
    },
    clubs: { orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })) },
    categories: { orderBy: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })) },
  },
}))

import { useLiveQuery } from 'dexie-react-hooks'
const mockUseLiveQuery = vi.mocked(useLiveQuery)

const sampleTechniques = [
  { id: 401, name: 'Armbar', categoryId: 4, difficulty: 'BEGINNER' as const, isCustom: false, description: 'Test', cues: ['Squeeze knees'], youtubeUrl: '' },
  { id: 402, name: 'Triangle Choke', categoryId: 4, difficulty: 'BEGINNER' as const, isCustom: false, description: 'Test', cues: ['Angle off'], youtubeUrl: '' },
]
const sampleCategories = [
  { id: 4, name: 'Submissions', description: 'test', icon: 'target' },
]

// AddEditSessionPage calls useLiveQuery 3 times per render, always in the same
// order: [0] allTechniques, [1] clubs, [2] categories.
// Use a cycling implementation so all renders get consistent data.
function setupMocks() {
  const responses = [sampleTechniques, [], sampleCategories]
  let call = 0
  mockUseLiveQuery.mockImplementation(() => responses[call++ % 3])
}

function ClubsStateProbe() {
  const location = useLocation()
  return <pre data-testid="clubs-state">{JSON.stringify(location.state)}</pre>
}

function renderPage(path = '/sessions/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sessions/new" element={<AddEditSessionPage />} />
        <Route path="/sessions/:id/edit" element={<AddEditSessionPage />} />
        <Route path="/sessions" element={<div data-testid="sessions-list" />} />
        <Route path="/clubs" element={<ClubsStateProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  setupMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AddEditSessionPage — structure', () => {
  it('renders the Log Session heading', () => {
    renderPage()
    expect(screen.getByText('Log Session')).toBeInTheDocument()
  })

  it('renders duration presets 60/75/90/120 and Custom', () => {
    renderPage()
    expect(screen.getByText('60m')).toBeInTheDocument()
    expect(screen.getByText('75m')).toBeInTheDocument()
    expect(screen.getByText('90m')).toBeInTheDocument()
    expect(screen.getByText('120m')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('does NOT render Location or Partners fields', () => {
    renderPage()
    expect(screen.queryByText(/^LOCATION$/i)).toBeNull()
    expect(screen.queryByText(/TRAINING PARTNERS/i)).toBeNull()
    expect(screen.queryByPlaceholderText(/main dojo/i)).toBeNull()
    expect(screen.queryByPlaceholderText(/john, sarah/i)).toBeNull()
  })

  it('renders Taps / Submissions section with + Given and + Received', () => {
    renderPage()
    expect(screen.getByText('TAPS / SUBMISSIONS')).toBeInTheDocument()
    expect(screen.getByText('Given')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
  })

  it('renders Techniques Practiced section', () => {
    renderPage()
    expect(screen.getByText('TECHNIQUES PRACTICED')).toBeInTheDocument()
  })
})

describe('AddEditSessionPage — duration preset buttons', () => {
  it('60m is selected by default', () => {
    renderPage()
    expect(screen.getByText('60m').className).toContain('bg-gold')
  })

  it('clicking 90m selects it and deselects 60m', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('90m'))
    expect(screen.getByText('90m').className).toContain('bg-gold')
    expect(screen.getByText('60m').className).not.toContain('bg-gold')
  })

  it('clicking Custom reveals a number input', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.queryByPlaceholderText('Minutes')).toBeNull()
    await user.click(screen.getByText('Custom'))
    expect(screen.getByPlaceholderText('Minutes')).toBeInTheDocument()
  })

  it('clicking a preset after Custom hides the custom input', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Custom'))
    expect(screen.getByPlaceholderText('Minutes')).toBeInTheDocument()
    await user.click(screen.getByText('75m'))
    expect(screen.queryByPlaceholderText('Minutes')).toBeNull()
  })
})

describe('AddEditSessionPage — technique picker', () => {
  it('opens technique picker when clicking Add techniques', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Add techniques…'))
    expect(screen.getByText('Select Techniques')).toBeInTheDocument()
    expect(screen.getByText('Armbar')).toBeInTheDocument()
    expect(screen.getByText('Triangle Choke')).toBeInTheDocument()
  })

  it('selecting a technique updates the count', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Add techniques…'))
    await user.click(screen.getByText('Armbar'))
    await user.click(screen.getByText(/Done/))
    expect(screen.getByText('1 technique selected')).toBeInTheDocument()
  })

  it('shows Add new technique option in picker', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Add techniques…'))
    expect(screen.getByText('Add new technique…')).toBeInTheDocument()
  })

  it('deselecting a technique removes it from count', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Add techniques…'))
    await user.click(screen.getByText('Armbar'))
    // After selecting, Armbar appears in both the picker list and the selected-techniques
    // list below; click the last occurrence (in the picker) to deselect.
    const armbarEls = screen.getAllByText('Armbar')
    await user.click(armbarEls[armbarEls.length - 1])
    await user.click(screen.getByText(/Done/))
    expect(screen.queryByText('1 technique selected')).toBeNull()
    expect(screen.getByText('Add techniques…')).toBeInTheDocument()
  })
})

describe('AddEditSessionPage — tap tracking', () => {
  it('opens tap-given picker when clicking + Given', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Given'))
    expect(screen.getByText('Select Technique — Tap Given')).toBeInTheDocument()
  })

  it('opens tap-received picker when clicking + Received', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Received'))
    expect(screen.getByText('Select Technique — Tap Received')).toBeInTheDocument()
  })

  it('adding a tap given shows it in the given list', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Given'))
    // Picker auto-closes after tap selection — no need to click Close
    await user.click(screen.getByText('Armbar'))
    expect(screen.getByText(/Given \(1\)/)).toBeInTheDocument()
    const container = screen.getByText(/Given \(1\)/).closest('div')!
    expect(within(container.parentElement!).getByText('Armbar')).toBeInTheDocument()
  })

  it('adding a tap received shows it in the received list', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Received'))
    // Picker auto-closes after tap selection
    await user.click(screen.getByText('Triangle Choke'))
    expect(screen.getByText(/Received \(1\)/)).toBeInTheDocument()
  })

  it('tap can be removed with the X button', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByText('Given'))
    // Picker auto-closes after tap selection
    await user.click(screen.getByText('Armbar'))
    expect(screen.getByText(/Given \(1\)/)).toBeInTheDocument()

    // Scope to the Given section because the picker stays open and also shows technique rows.
    const givenSection = screen.getByText(/Given \(1\)/).parentElement!
    const tapRow = within(givenSection).getByText('Armbar').closest('div')!
    await user.click(within(tapRow).getByRole('button'))
    expect(screen.queryByText(/Given \(1\)/)).toBeNull()
  })
})
describe('AddEditSessionPage — clubs flow', () => {
  it('opens clubs page with return context from session log', async () => {
    const user = userEvent.setup()
    renderPage('/sessions/new')

    await user.click(screen.getByText('Manage'))

    const stateText = screen.getByTestId('clubs-state').textContent ?? ''
    expect(stateText).toContain('"returnTo":"/sessions/new"')
  })
})
