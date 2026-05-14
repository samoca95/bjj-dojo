import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsDataResetPage from '../pages/SettingsDataResetPage'
import SettingsHomeSectionsPage from '../pages/SettingsHomeSectionsPage'
import { HOME_SECTION_VISIBILITY_STORAGE_KEY } from '../utils/homeSectionOrder'

const { resetPrefilledTechniquesMock } = vi.hoisted(() => ({
  resetPrefilledTechniquesMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../db/database', async () => {
  const actual =
    await vi.importActual<typeof import('../db/database')>('../db/database')
  return {
    ...actual,
    resetPrefilledTechniques: resetPrefilledTechniquesMock,
  }
})

describe('Settings subpages', () => {
  beforeEach(() => {
    localStorage.removeItem(HOME_SECTION_VISIBILITY_STORAGE_KEY)
    resetPrefilledTechniquesMock.mockClear()
  })

  it('persists hidden state when hiding a homepage section', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsHomeSectionsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getAllByLabelText('Hide section')[0])

    expect(localStorage.getItem(HOME_SECTION_VISIBILITY_STORAGE_KEY)).toContain(
      '"focus":false',
    )
  })

  it('resets pre-filled techniques from data and reset page', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <SettingsDataResetPage />
      </MemoryRouter>,
    )
    await user.click(
      screen.getByRole('button', { name: 'Reset pre-filled techniques' }),
    )
    expect(resetPrefilledTechniquesMock).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })
})
