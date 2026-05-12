import { useEffect, useMemo, useState } from 'react'
import type { ConnectionType, Difficulty, SessionType } from '../types'

export type AppLanguage = 'en' | 'es'

export const APP_LANGUAGE_STORAGE_KEY = 'bjj-dojo:language'
export const APP_LANGUAGE_UPDATED_EVENT = 'bjj-dojo:language-updated'

const ES_TRANSLATIONS: Record<string, string> = {
  Home: 'Inicio',
  Sessions: 'Sesiones',
  Techniques: 'Técnicas',
  Settings: 'Ajustes',
  'Track your journey on the mats': 'Sigue tu camino en el tatami',
  'YOUR STATS': 'TUS ESTADÍSTICAS',
  'Mat Time': 'Tiempo en Tatami',
  'Taps Given': 'Sumisiones Aplicadas',
  'Taps Received': 'Sumisiones Recibidas',
  'QUICK ACCESS': 'ACCESO RÁPIDO',
  TRENDING: 'TENDENCIAS',
  'Training Sessions': 'Sesiones de Entrenamiento',
  'Log and review your mat time': 'Registra y revisa tu tiempo en tatami',
  'Technique Library': 'Biblioteca de Técnicas',
  '60+ techniques with YouTube refs': 'Más de 60 técnicas con referencias de YouTube',
  Categories: 'Categorías',
  Clubs: 'Academias',
  'No clubs yet. Add one above.': 'Aún no hay academias. Añade una arriba.',
  'ADD CLUB': 'AÑADIR ACADEMIA',
  'e.g. Main Dojo': 'p. ej. Academia Principal',
  'Add Club': 'Añadir Academia',
  Save: 'Guardar',
  Cancel: 'Cancelar',
  Edit: 'Editar',
  Delete: 'Eliminar',
  'Move up': 'Mover arriba',
  'Move down': 'Mover abajo',
  Order: 'Orden',
  'THEME MODE': 'MODO DE TEMA',
  Black: 'Oscuro',
  Light: 'Claro',
  'SESSION TYPE ICONS': 'ICONOS DE TIPO DE SESIÓN',
  'Customize icons for each session type': 'Personaliza los iconos de cada tipo de sesión',
  'Manage technique categories and icons': 'Gestiona categorías e iconos de técnicas',
  'Manage your training locations': 'Gestiona tus lugares de entrenamiento',
  Language: 'Idioma',
  English: 'Inglés',
  Spanish: 'Español',
  'No sessions yet': 'Aún no hay sesiones',
  'Tap + to log your first training': 'Pulsa + para registrar tu primer entrenamiento',
  DATE: 'FECHA',
  DURATION: 'DURACIÓN',
  'SESSION TYPE': 'TIPO DE SESIÓN',
  CLUB: 'ACADEMIA',
  Manage: 'Gestionar',
  Another: 'Otra',
  Custom: 'Personalizado',
  Minutes: 'Minutos',
  'ENERGY LEVEL': 'NIVEL DE ENERGÍA',
  Exhausted: 'Agotado',
  Low: 'Bajo',
  Average: 'Medio',
  Good: 'Bueno',
  Peak: 'Máximo',
  'TECHNIQUES PRACTICED': 'TÉCNICAS PRACTICADAS',
  'Add techniques…': 'Añadir técnicas…',
  'TAPS / SUBMISSIONS': 'SUMISIONES',
  Given: 'Aplicadas',
  Received: 'Recibidas',
  NOTES: 'NOTAS',
  'What did you work on? Any insights?': '¿Qué trabajaste? ¿Alguna observación?',
  'Select Techniques': 'Seleccionar Técnicas',
  'Select Technique — Tap Given': 'Seleccionar Técnica — Sumisión Aplicada',
  'Select Technique — Tap Received': 'Seleccionar Técnica — Sumisión Recibida',
  Done: 'Listo',
  'Search techniques…': 'Buscar técnicas…',
  'Search all icons…': 'Buscar todos los iconos…',
  'Add new technique…': 'Añadir técnica nueva…',
  'NEW TECHNIQUE': 'NUEVA TÉCNICA',
  Add: 'Añadir',
  'Technique name': 'Nombre de técnica',
  'Log Session': 'Registrar Sesión',
  'Edit Session': 'Editar Sesión',
  Duration: 'Duración',
  Energy: 'Energía',
  Club: 'Academia',
  Notes: 'Notas',
  'No techniques logged for this session.': 'No se registraron técnicas en esta sesión.',
  Unknown: 'Desconocida',
  'Taps / Submissions': 'Sumisiones',
  'New Technique': 'Nueva Técnica',
  'Edit Technique': 'Editar Técnica',
  NAME: 'NOMBRE',
  CATEGORY: 'CATEGORÍA',
  DIFFICULTY: 'DIFICULTAD',
  DESCRIPTION: 'DESCRIPCIÓN',
  'YOUTUBE URL': 'URL DE YOUTUBE',
  'COACHING CUES': 'CLAVES TÉCNICAS',
  'TECHNIQUE CONNECTIONS': 'CONEXIONES ENTRE TÉCNICAS',
  'No connections yet.': 'Aún no hay conexiones.',
  'Unknown technique': 'Técnica desconocida',
  Remove: 'Quitar',
  'Select connected technique…': 'Selecciona técnica conectada…',
  'Add Connection': 'Añadir conexión',
  'Delete Technique': 'Eliminar Técnica',
  'Watch on YouTube': 'Ver en YouTube',
  'Leads To / Follow-ups': 'Conduce a / Seguimientos',
  'Can Be Set Up From': 'Puede iniciarse desde',
  Clear: 'Limpiar',
  Filter: 'Filtrar',
  FILTERS: 'FILTROS',
  'Weekly goal': 'Meta semanal',
  'Avg taps / last 5': 'Avg. taps (últ. 5)',
  weeks: 'semanas',
  'FOCUS TECHNIQUES': 'TÉCNICAS DE ENFOQUE',
  'Set focus': 'Definir enfoque',
  'Select focus techniques': 'Selecciona técnicas de enfoque',
  'No focus techniques selected': 'No hay técnicas de enfoque seleccionadas',
  Icons: 'Iconos',
  Emoji: 'Emoji',
  Suggested: 'Sugeridos',
  'All Icons': 'Todos los iconos',
  'Paste or type an emoji': 'Pega o escribe un emoji',
  'e.g. 🥋': 'p. ej. 🥋',
  Suggestions: 'Sugerencias',
  Use: 'Usar',
  All: 'Todas',
  min: 'min',
}

const ES_DIFFICULTY: Record<Difficulty, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  ELITE: 'Élite',
}

const ES_SESSION_TYPES: Record<SessionType, string> = {
  GI: 'Gi',
  NOGI: 'No-Gi',
  OPEN_MAT: 'Entrenamiento Libre',
  COMPETITION: 'Competición',
  DRILLING: 'Drills',
}

const ES_CONNECTION_TYPES: Record<ConnectionType, string> = {
  FOLLOW_UP: 'Seguimiento',
  COUNTER: 'Contra',
  SETUP: 'Preparación',
  TRANSITION: 'Transición',
}

export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const raw = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
  return raw === 'es' ? 'es' : 'en'
}

export function setAppLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language)
  window.dispatchEvent(new CustomEvent(APP_LANGUAGE_UPDATED_EVENT))
}

export function translate(text: string, language: AppLanguage): string {
  if (language !== 'es') return text
  return ES_TRANSLATIONS[text] ?? text
}

export function difficultyLabel(difficulty: Difficulty, fallback: string, language: AppLanguage): string {
  if (language !== 'es') return fallback
  return ES_DIFFICULTY[difficulty] ?? fallback
}

export function sessionTypeLabel(sessionType: SessionType, fallback: string, language: AppLanguage): string {
  if (language !== 'es') return fallback
  return ES_SESSION_TYPES[sessionType] ?? fallback
}

export function connectionTypeLabel(connectionType: ConnectionType, fallback: string, language: AppLanguage): string {
  if (language !== 'es') return fallback
  return ES_CONNECTION_TYPES[connectionType] ?? fallback
}

export function useI18n() {
  const [language, setLanguageState] = useState<AppLanguage>(getAppLanguage())

  useEffect(() => {
    const sync = () => setLanguageState(getAppLanguage())
    window.addEventListener(APP_LANGUAGE_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(APP_LANGUAGE_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const api = useMemo(() => ({
    language,
    setLanguage: (next: AppLanguage) => setAppLanguage(next),
    t: (text: string) => translate(text, language),
    locale: language === 'es' ? 'es-ES' : undefined,
  }), [language])

  return api
}
