import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import BottomNav from './BottomNav'
import OfflineNotice from './OfflineNotice'
import PwaUpdatePrompt from './PwaUpdatePrompt'
import FirstLaunchSetupPrompt, { isInitialSetupRequired } from './FirstLaunchSetupPrompt'
import OnboardingFlow, { isOnboardingRequired } from './OnboardingFlow'
import QuotaErrorModal from './QuotaErrorModal'

export default function Layout() {
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
