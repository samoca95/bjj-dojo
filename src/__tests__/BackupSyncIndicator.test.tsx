import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BackupSyncIndicator from '../components/BackupSyncIndicator'

describe('BackupSyncIndicator', () => {
  it('opens a closable queue popup from the spinning indicator and shows file states', async () => {
    const user = userEvent.setup()
    render(<BackupSyncIndicator />)

    await Promise.resolve()
    act(() => {
      window.dispatchEvent(
        new CustomEvent('bjj-dojo:backup-triggered', {
          detail: {
            destinationIds: ['googleDrive'],
            components: ['sessions'],
          },
        }),
      )
    })

    await user.click(
      await screen.findByLabelText('Syncing Google Drive backup…'),
    )

    expect(screen.getByText('Backup queue')).toBeInTheDocument()
    expect(
      screen.getByText('bjj-dojo-backup-sessions-*.json'),
    ).toBeInTheDocument()
    expect(screen.getByText('Queued')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(
        new CustomEvent('bjj-dojo:backup-file-started', {
          detail: {
            destinationId: 'googleDrive',
            component: 'sessions',
            filename: 'bjj-dojo-backup-sessions-1715920000000.json',
          },
        }),
      )
    })

    expect(
      screen.getByText('bjj-dojo-backup-sessions-1715920000000.json'),
    ).toBeInTheDocument()
    expect(screen.getByText('Saving')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Close'))
    expect(screen.queryByText('Backup queue')).not.toBeInTheDocument()
  })

  it('keeps the queue popup open after sync completes so final states stay visible', async () => {
    const user = userEvent.setup()
    render(<BackupSyncIndicator />)

    act(() => {
      window.dispatchEvent(
        new CustomEvent('bjj-dojo:backup-triggered', {
          detail: {
            destinationIds: ['googleDrive'],
            components: ['sessions'],
          },
        }),
      )
    })

    await user.click(
      await screen.findByLabelText('Syncing Google Drive backup…'),
    )
    expect(screen.getByText('Backup queue')).toBeInTheDocument()

    // Simulate the full sync lifecycle completing.
    act(() => {
      window.dispatchEvent(
        new CustomEvent('bjj-dojo:backup-file-succeeded', {
          detail: {
            destinationId: 'googleDrive',
            component: 'sessions',
            filename: 'bjj-dojo-backup-sessions-1715920000000.json',
          },
        }),
      )
      window.dispatchEvent(
        new CustomEvent('bjj-dojo:backup-dest-succeeded', {
          detail: { destinationId: 'googleDrive' },
        }),
      )
    })

    // Popup must remain open and show the final 'Saved' state.
    expect(screen.getByText('Backup queue')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })
})
