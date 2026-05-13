export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE'
export type SessionType = 'GI' | 'NOGI' | 'OPEN_MAT' | 'COMPETITION' | 'DRILLING'
export type ConnectionType = 'FOLLOW_UP' | 'COUNTER' | 'SETUP' | 'TRANSITION'
export type TapType = 'given' | 'received'

export interface Category {
  id: number
  name: string
  description: string
  icon?: string
}

export interface ReferenceLink {
  url: string
  label?: string
}

export interface Technique {
  id: number
  name: string
  description: string
  cues?: string[]
  tags?: string[]
  isFavorite?: boolean
  categoryId: number
  youtubeUrl: string
  referenceLinks?: ReferenceLink[]
  difficulty: Difficulty
  isCustom: boolean
}

export interface TechniqueConnection {
  fromTechniqueId: number
  toTechniqueId: number
  connectionType: ConnectionType
}

export interface Session {
  id?: number
  date: number
  durationMinutes: number
  sessionType: SessionType
  clubId?: number | null
  notes: string
  energyLevel: number
}

export interface Club {
  id?: number
  name: string
  sortOrder: number
}

export interface SessionTechnique {
  sessionId: number
  techniqueId: number
}

export interface SessionTap {
  id?: number
  sessionId: number
  techniqueId: number
  type: TapType
}

export interface DrillPlan {
  id?: number
  name: string
  techniqueIds: number[]
  createdAt: number
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  GI: 'Gi',
  NOGI: 'No-Gi',
  OPEN_MAT: 'Open Mat',
  COMPETITION: 'Competition',
  DRILLING: 'Drilling',
}

export const SESSION_TYPE_ICONS: Record<SessionType, string> = {
  GI: 'swords',
  NOGI: 'shirt',
  OPEN_MAT: 'users',
  COMPETITION: 'trophy',
  DRILLING: 'rotate-ccw',
}

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  GI: 'bg-blue-900/55 text-blue-300',
  NOGI: 'bg-green-900/55 text-green-300',
  OPEN_MAT: 'bg-purple-900/55 text-purple-300',
  COMPETITION: 'bg-red-900/55 text-red-300',
  DRILLING: 'bg-amber-900/55 text-amber-300',
}

export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  FOLLOW_UP: 'Follow-up',
  COUNTER: 'Counter',
  SETUP: 'Setup',
  TRANSITION: 'Transition',
}

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  FOLLOW_UP: 'bg-amber-900/40 text-amber-300',
  COUNTER: 'bg-red-900/40 text-red-300',
  SETUP: 'bg-green-900/40 text-green-300',
  TRANSITION: 'bg-blue-900/40 text-blue-300',
}
