const NOTE_MAX_LENGTH = 1200
const DESCRIPTION_MAX_LENGTH = 2000
const NAME_MAX_LENGTH = 120
const CUE_MAX_LENGTH = 240
const TAG_MAX_LENGTH = 24
const IMAGE_URL_MAX_LENGTH = 500
const DEFAULT_DURATION_MINUTES = 60
const PLACEHOLDER_TEXT_MAX_LENGTH = 60

export const VALIDATION_LIMITS = {
  NOTE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  CUE_MAX_LENGTH,
  TAG_MAX_LENGTH,
  DEFAULT_DURATION_MINUTES,
  IMAGE_URL_MAX_LENGTH,
  PLACEHOLDER_TEXT_MAX_LENGTH,
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

export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function defaultTechniqueImageUrl(name: string): string {
  const text = (name.trim().slice(0, PLACEHOLDER_TEXT_MAX_LENGTH) || 'Technique')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#18181b"/><stop offset="100%" stop-color="#27272a"/></linearGradient></defs><rect width="1200" height="720" fill="url(#g)"/><rect x="48" y="48" width="1104" height="624" rx="40" fill="none" stroke="#eab308" stroke-opacity="0.5" stroke-width="6"/><text x="600" y="352" fill="#eab308" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="76" font-weight="700" text-anchor="middle">BJJ Dojo</text><text x="600" y="436" fill="#f4f4f5" font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="44" text-anchor="middle">${text}</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function normalizeTechniqueImageUrl(url: string): string {
  const raw = url.trim()
  if (!raw) return raw
  try {
    const parsed = new URL(raw)
    if (parsed.hostname === 'upload.wikimedia.org' && parsed.pathname.includes('/thumb/')) {
      const parts = parsed.pathname.split('/')
      const thumbIndex = parts.findIndex(part => part === 'thumb')
      const fileName = thumbIndex >= 0 ? parts[thumbIndex + 3] : ''
      if (fileName) {
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`
      }
    }
  } catch {
    return raw
  }
  return raw
}

export function normalizeTechniquePayload(input: {
  name: string
  description: string
  cues: string[]
  youtubeUrl: string
  imageUrl?: string
  tags?: string[]
}) {
  return {
    name: trimAndClamp(input.name, NAME_MAX_LENGTH),
    description: trimAndClamp(input.description, DESCRIPTION_MAX_LENGTH),
    cues: input.cues.map(cue => trimAndClamp(cue, CUE_MAX_LENGTH)).filter(Boolean).slice(0, 20),
    youtubeUrl: trimAndClamp(input.youtubeUrl, 300),
    imageUrl: trimAndClamp(input.imageUrl ?? '', IMAGE_URL_MAX_LENGTH),
    tags: sanitizeTags(input.tags ?? []),
  }
}

export function normalizeSessionNotes(notes: string): string {
  return trimAndClamp(notes, NOTE_MAX_LENGTH)
}
