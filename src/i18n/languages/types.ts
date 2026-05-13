import type { ConnectionType, Difficulty, SessionType } from '../../types'

export interface LanguagePack {
  translations: Record<string, string>
  categoryContent: Record<number, { name: string; description: string }>
  techniqueContent: Record<number, { description: string; cues: string[] }>
  difficulty: Partial<Record<Difficulty, string>>
  sessionTypes: Partial<Record<SessionType, string>>
  connectionTypes: Partial<Record<ConnectionType, string>>
  locale?: string
}
