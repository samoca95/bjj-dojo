import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OfflineNotice from '../components/OfflineNotice'
import QuotaErrorModal from '../components/QuotaErrorModal'
import TrainingCalendar from '../components/TrainingCalendar'
import { useI18n, APP_LANGUAGE_UPDATED_EVENT } from '../i18n'
import { QUOTA_ERROR_EVENT } from '../utils/quotaError'
import { SESSION_TYPE_ICONS_UPDATED_EVENT } from '../utils/sessionTypeIcons'
import { APP_THEME_UPDATED_EVENT } from '../utils/theme'
import { HOME_SECTION_ORDER_UPDATED_EVENT } from '../utils/homeSectionOrder'
import { BELT_RANK_UPDATED_EVENT } from '../utils/beltRank'

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn().mockReturnValue([]),
}))

vi.mock('../db/database', () => ({
  db: {
    sessions: { count: vi.fn().mockResolvedValue(0), toArray: vi.fn().mockResolvedValue([]), where: vi.fn().mockReturnThis(), aboveOrEqual: vi.fn().mockReturnThis() },
    sessionTaps: { toArray: vi.fn().mockResolvedValue([]) },
    sessionTechniques: { where: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) },
    techniques: { orderBy: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) },
  },
}))

function spyOnListeners() {
  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')
  return { addSpy, removeSpy }
}

function assertCleanedUp(
  addSpy: ReturnType<typeof vi.spyOn>,
  removeSpy: ReturnType<typeof vi.spyOn>,
  eventType: string,
) {
  const added = addSpy.mock.calls.filter(c => c[0] === eventType)
  const removed = removeSpy.mock.calls.filter(c => c[0] === eventType)
  expect(added.length, `${eventType}: should be registered at least once`).toBeGreaterThan(0)
  expect(removed.length, `${eventType}: removeEventListener count must match addEventListener count`).toBe(added.length)
  for (let i = 0; i < added.length; i++) {
    expect(removed[i][1], `${eventType}: handler[${i}] passed to removeEventListener must be the same reference registered via addEventListener`).toBe(added[i][1])
  }
}

// ---- OfflineNotice --------------------------------------------------------

describe('OfflineNotice — event listener cleanup', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => { ({ addSpy, removeSpy } = spyOnListeners()) })
  afterEach(() => { addSpy.mockRestore(); removeSpy.mockRestore() })

  it('removes online and offline listeners on unmount', () => {
    const { unmount } = render(<OfflineNotice />)
    unmount()
    assertCleanedUp(addSpy, removeSpy, 'online')
    assertCleanedUp(addSpy, removeSpy, 'offline')
  })
})

// ---- QuotaErrorModal -------------------------------------------------------

describe('QuotaErrorModal — event listener cleanup', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => { ({ addSpy, removeSpy } = spyOnListeners()) })
  afterEach(() => { addSpy.mockRestore(); removeSpy.mockRestore() })

  it(`removes ${QUOTA_ERROR_EVENT} listener on unmount`, () => {
    const { unmount } = render(
      <MemoryRouter>
        <QuotaErrorModal />
      </MemoryRouter>,
    )
    unmount()
    assertCleanedUp(addSpy, removeSpy, QUOTA_ERROR_EVENT)
  })
})

// ---- TrainingCalendar ------------------------------------------------------

describe('TrainingCalendar — event listener cleanup', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => { ({ addSpy, removeSpy } = spyOnListeners()) })
  afterEach(() => { addSpy.mockRestore(); removeSpy.mockRestore() })

  it(`removes ${SESSION_TYPE_ICONS_UPDATED_EVENT} and ${APP_THEME_UPDATED_EVENT} listeners on unmount`, () => {
    const { unmount } = render(
      <MemoryRouter>
        <TrainingCalendar sessions={[]} />
      </MemoryRouter>,
    )
    unmount()
    assertCleanedUp(addSpy, removeSpy, SESSION_TYPE_ICONS_UPDATED_EVENT)
    assertCleanedUp(addSpy, removeSpy, APP_THEME_UPDATED_EVENT)
  })
})

// ---- HomePage --------------------------------------------------------------

describe('HomePage — event listener cleanup', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => { ({ addSpy, removeSpy } = spyOnListeners()) })
  afterEach(() => { addSpy.mockRestore(); removeSpy.mockRestore() })

  it('removes section-order, belt-rank, and storage listeners on unmount', async () => {
    const { default: HomePage } = await import('../pages/HomePage')
    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    // Capture storage count while mounted so we can assert full removal after unmount
    const storageAddedBeforeUnmount = addSpy.mock.calls.filter(c => c[0] === 'storage').length

    unmount()

    assertCleanedUp(addSpy, removeSpy, HOME_SECTION_ORDER_UPDATED_EVENT)
    assertCleanedUp(addSpy, removeSpy, BELT_RANK_UPDATED_EVENT)

    const storageRemoved = removeSpy.mock.calls.filter(c => c[0] === 'storage').length
    expect(storageRemoved, 'all storage listeners must be removed on unmount').toBe(storageAddedBeforeUnmount)
  })
})

// ---- useI18n ---------------------------------------------------------------

function I18nConsumer() {
  useI18n()
  return null
}

describe('useI18n — event listener cleanup', () => {
  let addSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => { ({ addSpy, removeSpy } = spyOnListeners()) })
  afterEach(() => { addSpy.mockRestore(); removeSpy.mockRestore() })

  it(`removes ${APP_LANGUAGE_UPDATED_EVENT} and storage listeners on unmount`, () => {
    const { unmount } = render(<I18nConsumer />)
    unmount()
    assertCleanedUp(addSpy, removeSpy, APP_LANGUAGE_UPDATED_EVENT)
    assertCleanedUp(addSpy, removeSpy, 'storage')
  })
})
