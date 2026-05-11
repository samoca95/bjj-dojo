import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="bg-amber-900/80 text-amber-100 text-xs px-4 py-2 text-center border-b border-amber-700/60">
      You are offline. You can keep using local data.
    </div>
  )
}
