import type { Session, Technique } from '../types'

export const MAX_NOTE_LENGTH = 1000
export const MAX_TECHNIQUE_NAME_LENGTH = 80
export const MAX_TECHNIQUE_DESCRIPTION_LENGTH = 2000
export const MAX_CUE_LENGTH = 180
export const MAX_CUE_COUNT = 12

export interface ValidationResult {
  ok: boolean
  error?: string
}

export function normalizeYoutubeUrl(input: string): string {
  const value = input.trim()
  if (!value) return ''
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    const allowed = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
    return allowed.includes(host) ? url.toString() : ''
  } catch {
    return ''
  }
}

export function sanitizeCues(cues: string[]): string[] {
  const unique = new Set<string>()
  for (const cue of cues) {
    const trimmed = cue.trim()
    if (!trimmed || trimmed.length > MAX_CUE_LENGTH) continue
    unique.add(trimmed)
    if (unique.size >= MAX_CUE_COUNT) break
  }
  return [...unique]
}

export function validateTechniqueDraft(draft: Pick<Technique, 'name' | 'description' | 'youtubeUrl' | 'cues'>): ValidationResult {
  if (!draft.name.trim()) return { ok: false, error: 'Technique name is required.' }
  if (draft.name.trim().length > MAX_TECHNIQUE_NAME_LENGTH) {
    return { ok: false, error: `Technique name must be ${MAX_TECHNIQUE_NAME_LENGTH} characters or fewer.` }
  }
  if (draft.description.trim().length > MAX_TECHNIQUE_DESCRIPTION_LENGTH) {
    return { ok: false, error: `Description must be ${MAX_TECHNIQUE_DESCRIPTION_LENGTH} characters or fewer.` }
  }
  if (draft.youtubeUrl.trim() && !normalizeYoutubeUrl(draft.youtubeUrl)) {
    return { ok: false, error: 'Please enter a valid YouTube URL.' }
  }
  const sanitizedCues = sanitizeCues(draft.cues ?? [])
  if (sanitizedCues.length !== (draft.cues ?? []).filter(c => c.trim()).length) {
    return { ok: false, error: 'Some coaching cues are invalid or too long.' }
  }
  return { ok: true }
}

export function validateSessionDraft(draft: Pick<Session, 'durationMinutes' | 'notes' | 'energyLevel'>): ValidationResult {
  if (!Number.isFinite(draft.durationMinutes) || draft.durationMinutes <= 0 || draft.durationMinutes > 720) {
    return { ok: false, error: 'Duration must be between 1 and 720 minutes.' }
  }
  if (!Number.isFinite(draft.energyLevel) || draft.energyLevel < 1 || draft.energyLevel > 5) {
    return { ok: false, error: 'Energy level must be between 1 and 5.' }
  }
  if (draft.notes.trim().length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.` }
  }
  return { ok: true }
}
