import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'

interface UndoEntry {
  label: string
  onUndo: () => Promise<void> | void
}

interface UndoContextValue {
  push: (entry: UndoEntry, timeoutMs?: number) => void
  execute: () => void
  dismiss: () => void
  current: UndoEntry | null
}

const UndoContext = createContext<UndoContextValue>({
  push: () => {},
  execute: () => {},
  dismiss: () => {},
  current: null,
})

export function UndoProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<UndoEntry | null>(null)
  const timerRef = useRef<number | null>(null)

  const dismiss = () => {
    if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null }
    setCurrent(null)
  }

  const push = (entry: UndoEntry, timeoutMs = 5000) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setCurrent(entry)
    timerRef.current = window.setTimeout(() => { timerRef.current = null; setCurrent(null) }, timeoutMs)
  }

  const execute = () => {
    if (!current) return
    void current.onUndo()
    dismiss()
  }

  return (
    <UndoContext.Provider value={{ push, execute, dismiss, current }}>
      {children}
    </UndoContext.Provider>
  )
}

export const useUndo = () => useContext(UndoContext)

export function UndoSnackbar() {
  const { current, execute, dismiss } = useUndo()
  const { language } = useI18n()
  if (!current) return null
  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
      <button
        onClick={dismiss}
        className="text-xs text-zinc-500 active:text-zinc-300 shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <span className="text-sm text-zinc-100 flex-1">{current.label}</span>
      <button
        onClick={execute}
        className="text-sm font-bold text-gold active:text-gold-light shrink-0"
      >
        {language === 'es' ? 'DESHACER' : language === 'fr' ? 'ANNULER' : 'UNDO'}
      </button>
    </div>
  )
}

