import { createContext, useContext, useRef, useState, type ReactNode } from 'react'

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
