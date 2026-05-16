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
import BackupSyncIndicator from './BackupSyncIndicator'

function LayoutInner() {
  const navigate = useNavigate()
  const [showInitialSetup, setShowInitialSetup] = useState(() =>
    isInitialSetupRequired(),
  )
  const [showRestorePrompt, setShowRestorePrompt] = useState(
    () => !isInitialSetupRequired() && isRestorePromptRequired(),
  )
  const [showOnboarding, setShowOnboarding] = useState(
    () =>
      !isInitialSetupRequired() &&
      !isRestorePromptRequired() &&
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
      <BackupSyncIndicator />
      {showInitialSetup && (
        <FirstLaunchSetupPrompt
          onComplete={() => {
            setShowInitialSetup(false)
            navigate('/', { replace: true })
            if (isRestorePromptRequired()) setShowRestorePrompt(true)
            else if (isOnboardingRequired()) setShowOnboarding(true)
          }}
        />
      )}
      {!showInitialSetup && showRestorePrompt && (
        <SetupRestorePrompt
          onComplete={(restored) => {
            setShowRestorePrompt(false)
            navigate('/', { replace: true })
            if (!restored && isOnboardingRequired()) setShowOnboarding(true)
          }}
        />
      )}
      {!showInitialSetup && !showRestorePrompt && showOnboarding && (
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
