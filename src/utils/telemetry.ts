export interface TelemetryEvent {
  type: string
  message: string
  timestamp: number
  details?: Record<string, unknown>
}

const TELEMETRY_KEY = 'bjj-dojo.telemetry'
const MAX_EVENTS = 200

function safeRead(): TelemetryEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(TELEMETRY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.type === 'string' && typeof item.message === 'string')
  } catch {
    return []
  }
}

function safeWrite(events: TelemetryEvent[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events.slice(-MAX_EVENTS)))
  } catch {
    // Intentionally ignore storage failures.
  }
}

export function logEvent(type: string, message: string, details?: Record<string, unknown>) {
  const event: TelemetryEvent = {
    type,
    message,
    timestamp: Date.now(),
    details,
  }
  const events = safeRead()
  events.push(event)
  safeWrite(events)
  if (typeof console !== 'undefined') console.info(`[telemetry:${type}] ${message}`, details ?? {})
}

export function logError(type: string, error: unknown, details?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error)
  logEvent(type, message, details)
  if (typeof console !== 'undefined') console.error(`[telemetry:${type}]`, error)
}

export function getTelemetryEvents(): TelemetryEvent[] {
  return safeRead().sort((a, b) => b.timestamp - a.timestamp)
}

export function clearTelemetryEvents() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(TELEMETRY_KEY)
}
