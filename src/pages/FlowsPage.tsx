import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Rotate3d } from 'lucide-react'

export default function FlowsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-zinc-400 active:text-zinc-100"
        >
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">Flows</h1>
      </div>

      <div className="px-4 pb-6 flex items-center justify-center min-h-48">
        <p className="text-sm text-zinc-500">Coming soon</p>
      </div>

      <button
        onClick={() =>
          window.open(
            'https://eel.is/GrappleMap/index.html',
            '_blank',
            'noopener,noreferrer',
          )
        }
        aria-label="Open GrappleMap 3D"
        className="fixed bottom-20 right-4 h-10 pl-3 pr-4 rounded-full bg-gold text-black active:bg-gold-light flex items-center gap-2 transition-colors z-40"
      >
        <Rotate3d size={16} className="text-black" />
        <span className="text-sm font-semibold leading-none">3D</span>
      </button>
    </div>
  )
}
