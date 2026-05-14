import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import { INITIAL_SETUP_COMPLETED_STORAGE_KEY } from '../components/FirstLaunchSetupPrompt'
import { APP_LANGUAGE_STORAGE_KEY } from '../i18n'
import { BELT_STORAGE_KEY, STRIPES_STORAGE_KEY } from '../utils/beltRank'

describe('Layout', () => {
  it('navigates to homepage after first-launch setup completion', async () => {
    localStorage.removeItem(INITIAL_SETUP_COMPLETED_STORAGE_KEY)
    localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
    localStorage.removeItem(BELT_STORAGE_KEY)
    localStorage.removeItem(STRIPES_STORAGE_KEY)

    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Layout />,
          children: [
            { index: true, element: <h1>Home Page</h1> },
            { path: 'sessions', element: <h1>Sessions Page</h1> },
          ],
        },
      ],
      { initialEntries: ['/sessions'] },
    )

    render(<RouterProvider router={router} />)
    expect(
      screen.getByRole('heading', { name: 'Sessions Page' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start' }))

    expect(
      await screen.findByRole('heading', { name: 'Home Page' }),
    ).toBeInTheDocument()
  })
})
