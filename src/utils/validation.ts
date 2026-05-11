const NOTE_MAX_LENGTH = 1200
const DESCRIPTION_MAX_LENGTH = 2000
const NAME_MAX_LENGTH = 120
const CUE_MAX_LENGTH = 240
const TAG_MAX_LENGTH = 24
const DEFAULT_DURATION_MINUTES = 60

export const VALIDATION_LIMITS = {
  NOTE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  CUE_MAX_LENGTH,
  TAG_MAX_LENGTH,
  DEFAULT_DURATION_MINUTES,
}

export function trimAndClamp(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength)
}

export function sanitizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const rawTag of tags) {
    const normalized = trimAndClamp(rawTag.toLowerCase(), TAG_MAX_LENGTH)
    if (!normalized) continue
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }
  return result.slice(0, 10)
}

export function normalizeDuration(input: string): number {
  const parsed = Number.parseInt(input, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DURATION_MINUTES
  return Math.min(parsed, 24 * 60)
}

export function normalizeDateInput(input: string): string {
  const matches = /^\d{4}-\d{2}-\d{2}$/.test(input)
  if (!matches) return new Date().toISOString().slice(0, 10)
  return input
}

export function toSafeDateEpoch(input: string): number {
  const [year, month, day] = input.split('-').map(Number)
  const ts = new Date(year, month - 1, day).getTime()
  if (!Number.isFinite(ts)) return Date.now()
  return ts
}

export function isValidYoutubeUrl(url: string): boolean {
  if (!url) return true
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return false
    const host = parsed.hostname.toLowerCase()
    return host === 'youtube.com'
      || host === 'www.youtube.com'
      || host === 'm.youtube.com'
      || host === 'youtu.be'
  } catch {
    return false
  }
}

export function normalizeTechniquePayload(input: {
  name: string
  description: string
  cues: string[]
  youtubeUrl: string
  tags?: string[]
}) {
  return {
    name: trimAndClamp(input.name, NAME_MAX_LENGTH),
    description: trimAndClamp(input.description, DESCRIPTION_MAX_LENGTH),
    cues: input.cues.map(cue => trimAndClamp(cue, CUE_MAX_LENGTH)).filter(Boolean).slice(0, 20),
    youtubeUrl: trimAndClamp(input.youtubeUrl, 300),
    tags: sanitizeTags(input.tags ?? []),
  }
}

export function normalizeSessionNotes(notes: string): string {
  return trimAndClamp(notes, NOTE_MAX_LENGTH)
}
