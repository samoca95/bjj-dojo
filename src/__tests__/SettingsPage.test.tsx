import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPage'
import { APP_THEME_STORAGE_KEY } from '../utils/theme'
import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'

const { resetPrefilledTechniquesMock } = vi.hoisted(() => ({
  resetPrefilledTechniquesMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../db/database', async () => {
  const actual = await vi.importActual<typeof import('../db/database')>('../db/database')
  return {
    ...actual,
    resetPrefilledTechniques: resetPrefilledTechniquesMock,
  }
})

describe('SettingsPage — theme mode', () => {
  beforeEach(() => {
    localStorage.removeItem(APP_THEME_STORAGE_KEY)
    localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
    document.documentElement.classList.remove('theme-light')
    resetPrefilledTechniquesMock.mockClear()
  })

  it('renders Light and Black theme options', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('THEME MODE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
  })

  it('applies light theme when Light is selected', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(localStorage.getItem(APP_THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })

  it('removes light class when Black is selected', async () => {
    localStorage.setItem(APP_THEME_STORAGE_KEY, 'light')
    document.documentElement.classList.add('theme-light')
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Black' }))
    expect(localStorage.getItem(APP_THEME_STORAGE_KEY)).toBe('black')
    expect(document.documentElement.classList.contains('theme-light')).toBe(false)
  })

  it('changes app language to Spanish', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Spanish' }))
    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('es')
    expect(screen.getByText('Ajustes')).toBeInTheDocument()
  })

  it('resets pre-filled techniques from settings', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Reset pre-filled techniques' }))
    expect(resetPrefilledTechniquesMock).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
  })
})
