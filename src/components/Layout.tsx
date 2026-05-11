import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import OfflineNotice from './OfflineNotice'
import PwaUpdatePrompt from './PwaUpdatePrompt'

export default function Layout() {
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <OfflineNotice />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <PwaUpdatePrompt />
    </div>
  )
}
