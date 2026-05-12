import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { APP_LANGUAGE_STORAGE_KEY, setAppLanguage } from '../i18n'

describe('BottomNav', () => {
  beforeEach(() => {
    localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
  })

  it('updates labels when app language changes to Spanish', async () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    setAppLanguage('es')

    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Sesiones')).toBeInTheDocument()
      expect(screen.getByText('Técnicas')).toBeInTheDocument()
      expect(screen.getByText('Ajustes')).toBeInTheDocument()
    })
  })
})
