import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsPage from '../pages/SettingsPage'
import { APP_THEME_STORAGE_KEY } from '../utils/theme'
import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'

const mockPickBackupFolder = vi.fn()
const mockDiscoverExistingBackups = vi.fn()
const mockReadBackup = vi.fn()

vi.mock('../utils/autoBackup/destinations/fileSystem', () => ({
  isFileSystemDestinationSupported: () => true,
  pickBackupFolder: mockPickBackupFolder,
  disconnectBackupFolder: vi.fn(),
  fileSystemDestination: {
    id: 'fileSystem',
    isEnabled: () => true,
    write: vi.fn(),
    discoverExistingBackups: mockDiscoverExistingBackups,
    readBackup: mockReadBackup,
  },
}))

describe('SettingsPage — theme mode', () => {
  beforeEach(() => {
    localStorage.removeItem(APP_THEME_STORAGE_KEY)
    localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
    document.documentElement.classList.remove('theme-light')
    mockPickBackupFolder.mockReset()
    mockDiscoverExistingBackups.mockReset()
    mockReadBackup.mockReset()
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
    expect(document.documentElement.classList.contains('theme-light')).toBe(
      true,
    )
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
    expect(document.documentElement.classList.contains('theme-light')).toBe(
      false,
    )
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

  it('shows hidden settings shortcut links', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('button', { name: /Session type/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Categories/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clubs/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Goals/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Home section order/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Dev settings/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Data & reset/i }),
    ).toBeInTheDocument()
  })

  it('shows app info and github link at the bottom', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText((text) => /^App version: v\d+\.\d+\.\d+/.test(text)),
    ).toBeInTheDocument()
    expect(screen.getByText('Developed by: samoca95')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Github repo/i })).toHaveAttribute(
      'href',
      'https://github.com/samoca95/bjj-dojo',
    )
  })

  it('offers restoring existing data when first backup destination is added', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    mockPickBackupFolder.mockResolvedValue({})
    mockDiscoverExistingBackups.mockResolvedValue([
      { id: 'b1', filename: 'b1.json', label: 'b1' },
    ])

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Choose folder' }))

    expect(mockDiscoverExistingBackups).toHaveBeenCalledTimes(1)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
  })
})
