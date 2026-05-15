import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShareSheet from '../components/ShareSheet'
import type { SessionExportData } from '../utils/exportSession'

vi.mock('../utils/shareCard', async () => {
  const actual = await vi.importActual('../utils/shareCard')
  return {
    ...actual,
    renderShareCard: vi
      .fn()
      .mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
  }
})

vi.mock('../utils/exportSession', async () => {
  const actual = await vi.importActual('../utils/exportSession')
  return {
    ...actual,
    shareSessionImage: vi.fn().mockResolvedValue({ method: 'share' }),
    downloadSessionPdf: vi.fn().mockResolvedValue(undefined),
  }
})

function makeData(): SessionExportData {
  return {
    session: {
      id: 1,
      date: new Date('2025-03-10T12:00:00Z').getTime(),
      durationMinutes: 75,
      sessionType: 'GI',
      clubId: null,
      notes: 'Sharp armbars',
      energyLevel: 4,
    },
    clubName: 'Main Dojo',
    techniques: [],
    givenTaps: [],
    receivedTaps: [],
  }
}

describe('ShareSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows icon-only quick-share targets for WhatsApp, X, and Instagram', () => {
    render(
      <ShareSheet
        data={makeData()}
        language="en"
        locale="en-US"
        onClose={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Instagram' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Copy caption')).not.toBeInTheDocument()
    expect(screen.queryByText('Export as text')).not.toBeInTheDocument()
  })

  it('shows PNG and PDF save actions', () => {
    render(
      <ShareSheet
        data={makeData()}
        language="en"
        locale="en-US"
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Save PNG' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save PDF' })).toBeInTheDocument()
  })
})
