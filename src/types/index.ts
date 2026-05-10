export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE'
export type SessionType = 'GI' | 'NOGI' | 'OPEN_MAT' | 'COMPETITION' | 'DRILLING'
export type ConnectionType = 'FOLLOW_UP' | 'COUNTER' | 'SETUP' | 'TRANSITION'

export interface Category {
  id: number
  name: string
  description: string
}

export interface Technique {
  id: number
  name: string
  description: string
  categoryId: number
  youtubeUrl: string
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
  location: string
  partners: string
  notes: string
  energyLevel: number
  tapsGiven: number
  tapsReceived: number
}

export interface SessionTechnique {
  sessionId: number
  techniqueId: number
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  GI: 'Gi',
  NOGI: 'No-Gi',
  OPEN_MAT: 'Open Mat',
  COMPETITION: 'Competition',
  DRILLING: 'Drilling',
}

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  GI: 'bg-blue-900/40 text-blue-300',
  NOGI: 'bg-green-900/40 text-green-300',
  OPEN_MAT: 'bg-purple-900/40 text-purple-300',
  COMPETITION: 'bg-red-900/40 text-red-300',
  DRILLING: 'bg-amber-900/40 text-amber-300',
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
