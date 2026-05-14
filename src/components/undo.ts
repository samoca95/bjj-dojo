import { createContext, useContext } from 'react'

export interface UndoEntry {
  label: string
  onUndo: () => Promise<void> | void
}

export interface UndoContextValue {
  push: (entry: UndoEntry, timeoutMs?: number) => void
  execute: () => void
  dismiss: () => void
  current: UndoEntry | null
}

export const UndoContext = createContext<UndoContextValue>({
  push: () => {},
  execute: () => {},
  dismiss: () => {},
  current: null,
})

export const useUndo = () => useContext(UndoContext)
