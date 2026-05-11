import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineBanner from './OfflineBanner'
import PwaUpdatePrompt from './PwaUpdatePrompt'

export default function Layout() {
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <PwaUpdatePrompt />
      <BottomNav />
    </div>
  )
}
