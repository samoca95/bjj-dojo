import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FirstLaunchSetupPrompt from '../components/FirstLaunchSetupPrompt'
import {
  INITIAL_SETUP_COMPLETED_STORAGE_KEY,
  isInitialSetupRequired,
} from '../components/firstLaunchSetup'
import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'
import { BELT_STORAGE_KEY, STRIPES_STORAGE_KEY } from '../utils/beltRank'

describe('FirstLaunchSetupPrompt', () => {
  beforeEach(() => {
    localStorage.removeItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY)
    localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
    localStorage.removeItem(BELT_STORAGE_KEY)
    localStorage.removeItem(STRIPES_STORAGE_KEY)
  })

  it('requires setup on first app open', () => {
    expect(isInitialSetupRequired()).toBe(true)
  })

  it('does not require setup once completed', () => {
    localStorage.setItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY, '1')
    expect(isInitialSetupRequired()).toBe(false)
  })

  it('saves language, belt, and stripes', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<FirstLaunchSetupPrompt onComplete={onComplete} />)

    await user.click(screen.getByRole('button', { name: 'ES' }))
    await user.click(screen.getByRole('button', { name: 'Azul' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar grados' }))
    await user.click(screen.getByRole('button', { name: 'Comenzar' }))

    expect(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('es')
    expect(localStorage.getItem(BELT_STORAGE_KEY)).toBe('blue')
    expect(localStorage.getItem(STRIPES_STORAGE_KEY)).toBe('1')
    expect(localStorage.getItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY)).toBe('1')
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
