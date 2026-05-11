import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaUpdatePrompt() {
  const { needRefresh, updateServiceWorker } = useRegisterSW()

  if (!needRefresh[0]) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl">
      <p className="text-sm text-zinc-100">A new app version is available.</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="mt-3 w-full rounded-xl bg-gold text-black text-sm font-semibold py-2.5 active:bg-gold-light"
      >
        Update now
      </button>
    </div>
  )
}
