import { useEffect, useState } from 'react'

export default function OfflineNotice() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

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
    <div className="sticky top-0 z-40 px-4 pt-2">
      <div className="rounded-xl bg-amber-900/80 text-amber-100 text-xs px-3 py-2">
        You are offline. Cached content is available; new changes may not save until reconnected.
      </div>
    </div>
  )
}
