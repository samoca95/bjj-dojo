import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPage'
import { APP_THEME_STORAGE_KEY } from '../utils/theme'
import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'
import { HOME_SECTION_VISIBILITY_STORAGE_KEY } from '../utils/homeSectionOrder'

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
    localStorage.removeItem(HOME_SECTION_VISIBILITY_STORAGE_KEY)
    document.documentElement.classList.remove('theme-light')
    resetPrefilledTechniquesMock.mockClear()
  })

  it('renders Light and Black theme options', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('THEME & LANGUAGE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
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

  it('removes light class when Dark is selected', async () => {
    localStorage.setItem(APP_THEME_STORAGE_KEY, 'light')
    document.documentElement.classList.add('theme-light')
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Dark' }))
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
    await user.click(screen.getByRole('button', { name: 'ES' }))
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

  it('persists hidden state when hiding a homepage section', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getAllByLabelText('Hide section')[0])

    expect(localStorage.getItem(HOME_SECTION_VISIBILITY_STORAGE_KEY)).toContain('"focus":false')
  })

  it('shows app info and github link at the bottom', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('App version: v1.0.0')).toBeInTheDocument()
    expect(screen.getByText('Developed by: samoca95')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'github.com/samoca95/bjj-dojo' })).toHaveAttribute(
      'href',
      'https://github.com/samoca95/bjj-dojo',
    )
  })
})
