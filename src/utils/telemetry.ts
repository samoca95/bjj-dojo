export type TelemetryLevel = 'info' | 'warn' | 'error'

export interface TelemetryEntry {
  timestamp: number
  level: TelemetryLevel
  event: string
  context?: unknown
}

const TELEMETRY_STORAGE_KEY = 'bjj-dojo:telemetry'
const MAX_TELEMETRY_ENTRIES = 200
const MAX_SESSION_TELEMETRY_ENTRIES = 50

let sessionEntryCount = 0

function serializeErrorContext(context?: unknown): unknown {
  if (context instanceof Error) {
    return {
      name: context.name,
      message: context.message,
      stack: context.stack,
    }
  }
  return context
}

function readTelemetry(): TelemetryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.event === 'string') as TelemetryEntry[]
  } catch {
    return []
  }
}

function writeTelemetry(entries: TelemetryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(entries.slice(-MAX_TELEMETRY_ENTRIES)))
  } catch {
    // ignore storage failures
  }
}

export function logTelemetry(level: TelemetryLevel, event: string, context?: unknown) {
  if (sessionEntryCount >= MAX_SESSION_TELEMETRY_ENTRIES) return

  const entry: TelemetryEntry = {
    timestamp: Date.now(),
    level,
    event,
    context: serializeErrorContext(context),
  }

  const history = readTelemetry()

  // Skip consecutive identical entries to avoid log spam
  const last = history[history.length - 1]
  if (last && last.event === entry.event && last.level === entry.level) {
    try {
      if (JSON.stringify(last.context) === JSON.stringify(entry.context)) return
    } catch {
      // ignore comparison failures; allow the entry
    }
  }

  sessionEntryCount++
  history.push(entry)
  writeTelemetry(history)

  const payload = entry.context === undefined ? undefined : entry.context
  if (level === 'error') {
    console.error(`[telemetry] ${event}`, payload)
  } else if (level === 'warn') {
    console.warn(`[telemetry] ${event}`, payload)
  } else {
    console.info(`[telemetry] ${event}`, payload)
  }
}

export const telemetry = {
  info: (event: string, context?: unknown) => logTelemetry('info', event, context),
  warn: (event: string, context?: unknown) => logTelemetry('warn', event, context),
  error: (event: string, context?: unknown) => logTelemetry('error', event, context),
  read: () => readTelemetry(),
  clear: () => writeTelemetry([]),
}

export async function runWithTelemetry<T>(event: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    telemetry.error(event, error)
    throw error
  }
}

export function setupGlobalErrorTelemetry() {
  if (typeof window === 'undefined') return () => undefined

  const onError = (event: ErrorEvent) => {
    telemetry.error('runtime.unhandled_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  }

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    telemetry.error('runtime.unhandled_rejection', event.reason)
  }

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)

  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }
}
