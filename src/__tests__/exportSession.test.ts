import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildSessionText,
  buildSessionHtml,
  buildShareCaption,
  exportSession,
  type SessionExportData,
} from '../utils/exportSession'
import type { Session, Technique } from '../types'

function makeSession(overrides?: Partial<Session>): Session {
  return {
    id: 1,
    date: new Date('2025-03-10T12:00:00Z').getTime(),
    durationMinutes: 90,
    sessionType: 'GI',
    clubId: null,
    notes: '',
    energyLevel: 4,
    ...overrides,
  }
}

function makeTechnique(id: number, name: string): Technique {
  return {
    id,
    name,
    description: '',
    cues: [],
    categoryId: 1,
    youtubeUrl: '',
    difficulty: 'BEGINNER',
    isCustom: false,
  }
}

const baseData: SessionExportData = {
  session: makeSession(),
  techniques: [{ technique: makeTechnique(1, 'Armbar') }],
  givenTaps: [],
  receivedTaps: [],
}

describe('buildSessionText', () => {
  it('includes the session metadata in the text summary', () => {
    const text = buildSessionText(baseData, 'en', 'en-US')
    expect(text).toContain('BJJ Dojo — Session Summary')
    expect(text).toContain('Duration: 90 min')
    expect(text).toContain('Type: Gi')
    expect(text).toContain('Energy: 4/5')
    expect(text).toContain('• Armbar')
  })

  it('omits the club line when no club is given and includes it when present', () => {
    expect(buildSessionText(baseData, 'en', 'en-US')).not.toContain('Club:')
    const withClub = buildSessionText(
      { ...baseData, clubName: 'Main Dojo' },
      'en',
      'en-US',
    )
    expect(withClub).toContain('Club: Main Dojo')
  })

  it('shows "None" when no techniques were practised', () => {
    const text = buildSessionText(
      { ...baseData, techniques: [] },
      'en',
      'en-US',
    )
    expect(text).toContain('Techniques practiced:')
    expect(text).toContain('— None')
  })

  it('indents technique notes underneath the technique', () => {
    const text = buildSessionText(
      {
        ...baseData,
        techniques: [
          { technique: makeTechnique(1, 'Armbar'), notes: 'keep elbow tight' },
        ],
      },
      'en',
      'en-US',
    )
    expect(text).toContain('• Armbar')
    expect(text).toContain('keep elbow tight')
  })

  it('includes a taps section with given and received counts', () => {
    const text = buildSessionText(
      {
        ...baseData,
        givenTaps: [{ techniqueName: 'Armbar' }, { techniqueName: 'Triangle' }],
        receivedTaps: [{ techniqueName: 'Kimura' }],
      },
      'en',
      'en-US',
    )
    expect(text).toContain('Given (2):')
    expect(text).toContain('Received (1):')
    expect(text).toContain('• Kimura')
  })

  it('omits the taps section when there are no taps', () => {
    expect(buildSessionText(baseData, 'en', 'en-US')).not.toContain(
      'Taps / Submissions',
    )
  })

  it('includes the notes section only when notes are present', () => {
    expect(buildSessionText(baseData, 'en', 'en-US')).not.toContain('Notes:')
    const withNotes = buildSessionText(
      { ...baseData, session: makeSession({ notes: 'felt sharp today' }) },
      'en',
      'en-US',
    )
    expect(withNotes).toContain('Notes:')
    expect(withNotes).toContain('felt sharp today')
  })

  it('localises labels for non-English languages', () => {
    const text = buildSessionText(baseData, 'es', 'es-ES')
    expect(text).toContain('BJJ Dojo — Resumen de sesión')
    expect(text).toContain('Duración: 90 min')
  })
})

describe('buildSessionHtml', () => {
  it('renders an HTML document with the session sections', () => {
    const html = buildSessionHtml(baseData, 'en', 'en-US')
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('lang="en"')
    expect(html).toContain('BJJ Dojo — Session Summary')
    expect(html).toContain('<li>Armbar')
  })

  it('omits the taps and notes sections when there is no data for them', () => {
    const html = buildSessionHtml(baseData, 'en', 'en-US')
    expect(html).not.toContain('Taps / Submissions')
    expect(html).not.toMatch(/<h2>Notes<\/h2>/)
  })

  it('escapes HTML in technique names to prevent injection', () => {
    const html = buildSessionHtml(
      {
        ...baseData,
        techniques: [
          { technique: makeTechnique(1, '<script>alert(1)</script>') },
        ],
      },
      'en',
      'en-US',
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes HTML in session notes', () => {
    const html = buildSessionHtml(
      {
        ...baseData,
        session: makeSession({ notes: '<img src=x onerror=alert(1)>' }),
      },
      'en',
      'en-US',
    )
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x')
  })
})

describe('buildShareCaption', () => {
  it('summarises duration, type and drilled techniques', () => {
    const caption = buildShareCaption(baseData, 'en')
    expect(caption).toContain('90 min Gi session')
    expect(caption).toContain('Drilled: Armbar')
    expect(caption).toContain('#bjj')
  })

  it('appends the club when present', () => {
    const caption = buildShareCaption(
      { ...baseData, clubName: 'Main Dojo' },
      'en',
    )
    expect(caption).toContain('at Main Dojo')
  })

  it('caps the technique list at three names and counts the rest', () => {
    const caption = buildShareCaption(
      {
        ...baseData,
        techniques: [
          { technique: makeTechnique(1, 'Armbar') },
          { technique: makeTechnique(2, 'Triangle') },
          { technique: makeTechnique(3, 'Kimura') },
          { technique: makeTechnique(4, 'Omoplata') },
          { technique: makeTechnique(5, 'Ezekiel') },
        ],
      },
      'en',
    )
    expect(caption).toContain('Armbar, Triangle, Kimura +2')
  })

  it('mentions submissions landed only when there are given taps', () => {
    expect(buildShareCaption(baseData, 'en')).not.toContain('landed')
    const withTaps = buildShareCaption(
      { ...baseData, givenTaps: [{ techniqueName: 'Armbar' }] },
      'en',
    )
    expect(withTaps).toContain('1 submission landed')
  })

  it('localises the caption for non-English languages', () => {
    const caption = buildShareCaption(baseData, 'es')
    expect(caption).toContain('Sesión de Gi de 90 min')
    expect(caption).toContain('Técnicas: Armbar')
  })
})

describe('exportSession', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete (URL as Partial<typeof URL>).createObjectURL
    delete (URL as Partial<typeof URL>).revokeObjectURL
  })

  it('shares a text file via the Web Share API when file sharing is supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { canShare, share })

    const result = await exportSession(baseData, 'en', 'en-US')

    expect(result).toEqual({ method: 'share' })
    expect(canShare).toHaveBeenCalled()
    expect(share).toHaveBeenCalledTimes(1)
    const shareArg = share.mock.calls[0][0]
    expect(shareArg.files).toHaveLength(1)
    expect(shareArg.files[0].name).toMatch(
      /^bjj-session-\d{4}-\d{2}-\d{2}\.txt$/,
    )
  })

  it('falls back to sharing plain text when file sharing is unavailable', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    const result = await exportSession(baseData, 'en', 'en-US')

    expect(result).toEqual({ method: 'share' })
    expect(share).toHaveBeenCalledTimes(1)
    expect(share.mock.calls[0][0].files).toBeUndefined()
  })

  it('treats a user-cancelled share (AbortError) as a successful share', async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    const canShare = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { canShare, share })

    const result = await exportSession(baseData, 'en', 'en-US')

    expect(result).toEqual({ method: 'share' })
  })

  it('downloads an HTML file when no Web Share API is available', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {})
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    ;(
      URL as unknown as { createObjectURL: typeof createObjectURL }
    ).createObjectURL = createObjectURL
    ;(
      URL as unknown as { revokeObjectURL: typeof revokeObjectURL }
    ).revokeObjectURL = revokeObjectURL
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    const result = await exportSession(baseData, 'en', 'en-US')

    expect(result).toEqual({ method: 'download' })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)

    vi.runOnlyPendingTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    vi.useRealTimers()
  })
})
