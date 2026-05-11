import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-100 font-semibold">New version available</p>
          <p className="text-xs text-zinc-400">Refresh to update to the latest app build.</p>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-xs text-zinc-400 px-2 py-1"
        >
          Later
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="text-xs font-semibold bg-gold text-black rounded-lg px-3 py-1.5"
        >
          Update
        </button>
      </div>
    </div>
  )
}
