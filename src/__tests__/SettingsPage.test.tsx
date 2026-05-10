import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPage'
import { APP_THEME_STORAGE_KEY } from '../utils/theme'

describe('SettingsPage — theme mode', () => {
  beforeEach(() => {
    localStorage.removeItem(APP_THEME_STORAGE_KEY)
    document.documentElement.classList.remove('theme-light')
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
})
