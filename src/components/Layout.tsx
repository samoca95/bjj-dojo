import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import BottomNav from './BottomNav'
import OfflineNotice from './OfflineNotice'
import PwaUpdatePrompt from './PwaUpdatePrompt'
import FirstLaunchSetupPrompt from './FirstLaunchSetupPrompt'
import SetupRestorePrompt from './SetupRestorePrompt'
import {
  isInitialSetupRequired,
  isRestorePromptRequired,
} from './firstLaunchSetup'
import OnboardingFlow from './OnboardingFlow'
import { isOnboardingRequired } from './onboarding'
import QuotaErrorModal from './QuotaErrorModal'
import { UndoProvider, UndoSnackbar } from './UndoContext'

function LayoutInner() {
  const navigate = useNavigate()
  const [showRestorePrompt, setShowRestorePrompt] = useState(() =>
    isRestorePromptRequired(),
  )
  const [showInitialSetup, setShowInitialSetup] = useState(
    () => !isRestorePromptRequired() && isInitialSetupRequired(),
  )
  const [showOnboarding, setShowOnboarding] = useState(
    () =>
      !isRestorePromptRequired() &&
      !isInitialSetupRequired() &&
      isOnboardingRequired(),
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
      {showRestorePrompt && (
        <SetupRestorePrompt
          onComplete={() => {
            setShowRestorePrompt(false)
            // After restore the initial-setup flag is set, so isInitialSetupRequired() is false.
            if (isInitialSetupRequired()) setShowInitialSetup(true)
            else if (isOnboardingRequired()) setShowOnboarding(true)
            navigate('/', { replace: true })
          }}
        />
      )}
      {!showRestorePrompt && showInitialSetup && (
        <FirstLaunchSetupPrompt
          onComplete={() => {
            setShowInitialSetup(false)
            navigate('/', { replace: true })
            if (isOnboardingRequired()) setShowOnboarding(true)
          }}
        />
      )}
      {!showRestorePrompt && !showInitialSetup && showOnboarding && (
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
