import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import BottomNav from './BottomNav'
import OfflineNotice from './OfflineNotice'
import PwaUpdatePrompt from './PwaUpdatePrompt'
import FirstLaunchSetupPrompt, { isInitialSetupRequired } from './FirstLaunchSetupPrompt'
import OnboardingFlow, { isOnboardingRequired } from './OnboardingFlow'
import QuotaErrorModal from './QuotaErrorModal'
import { UndoProvider, useUndo } from './UndoContext'
import { useI18n } from '../i18n'

function UndoSnackbar() {
  const { current, execute, dismiss } = useUndo()
  const { language } = useI18n()
  if (!current) return null
  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <span className="text-sm text-zinc-100">{current.label}</span>
      <button
        onClick={execute}
        className="text-sm font-bold text-gold active:text-gold-light shrink-0"
      >
        {language === 'es' ? 'DESHACER' : language === 'fr' ? 'ANNULER' : 'UNDO'}
      </button>
      <button
        onClick={dismiss}
        className="text-xs text-zinc-500 active:text-zinc-300 shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

function LayoutInner() {
  const navigate = useNavigate()
  const [showInitialSetup, setShowInitialSetup] = useState(() => isInitialSetupRequired())
  const [showOnboarding, setShowOnboarding] = useState(
    () => !isInitialSetupRequired() && isOnboardingRequired(),
  )

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <OfflineNotice />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <PwaUpdatePrompt />
      <QuotaErrorModal />
      <UndoSnackbar />
      {showInitialSetup && (
        <FirstLaunchSetupPrompt
          onComplete={() => {
            setShowInitialSetup(false)
            navigate('/', { replace: true })
            if (isOnboardingRequired()) setShowOnboarding(true)
          }}
        />
      )}
      {!showInitialSetup && showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}

export default function Layout() {
  return (
    <UndoProvider>
      <LayoutInner />
    </UndoProvider>
  )
}
