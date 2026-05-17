/**
 * i18n module — internationalisation for BJJ Dojo.
 *
 * ## Adding a new language
 * 1. Add the code to AppLanguage: `export type AppLanguage = 'en' | 'es' | 'fr' | 'de'`
 * 2. Create `src/i18n/languages/de.ts` implementing LanguagePack:
 *    - `translations` must satisfy `Record<TranslationKey, string>` (compile-time
 *      coverage check — TypeScript will error on any missing key)
 *    - Add `categoryContent` and `techniqueContent` for localised technique text
 *    - Export a `DE_LANGUAGE_PACK` and add `satisfies LanguagePack` at the bottom
 * 3. Import and register it in `LANGUAGE_PACKS` below
 * 4. Add a button for the new language in `SettingsPage` and `FirstLaunchSetupPrompt`
 */
import { useEffect, useMemo, useState } from 'react'
import type {
  Category,
  ConnectionType,
  Difficulty,
  SessionType,
  Technique,
} from '../types'
import { EN_LANGUAGE_PACK } from './languages/en'
import { ES_LANGUAGE_PACK } from './languages/es'
import { FR_LANGUAGE_PACK } from './languages/fr'
import type { LanguagePack, TranslationKey } from './languages/types'
import { notifyPreferenceMutation } from '../utils/autoBackup/notify'

export type AppLanguage = 'en' | 'es' | 'fr'
export type { TranslationKey }

export const APP_LANGUAGE_STORAGE_KEY = 'bjj-dojo:language'
export const APP_LANGUAGE_UPDATED_EVENT = 'bjj-dojo:language-updated'

const LANGUAGE_PACKS: Record<AppLanguage, LanguagePack> = {
  en: EN_LANGUAGE_PACK,
  es: ES_LANGUAGE_PACK,
  fr: FR_LANGUAGE_PACK,
}

function getLanguagePack(language: AppLanguage): LanguagePack {
  return LANGUAGE_PACKS[language] ?? EN_LANGUAGE_PACK
}

export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  const raw = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
  return raw === 'es' || raw === 'fr' ? raw : 'en'
}

export function setAppLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language)
  window.dispatchEvent(new CustomEvent(APP_LANGUAGE_UPDATED_EVENT))
  notifyPreferenceMutation()
}

export function translate(text: TranslationKey, language: AppLanguage): string {
  if (language === 'en') return text
  const pack = getLanguagePack(language)
  return pack.translations[text] ?? text
}

export function difficultyLabel(
  difficulty: Difficulty,
  fallback: string,
  language: AppLanguage,
): string {
  if (language === 'en') return fallback
  const pack = getLanguagePack(language)
  return pack.difficulty[difficulty] ?? fallback
}

export function sessionTypeLabel(
  sessionType: SessionType,
  fallback: string,
  language: AppLanguage,
): string {
  if (language === 'en') return fallback
  const pack = getLanguagePack(language)
  return pack.sessionTypes[sessionType] ?? fallback
}

export function connectionTypeLabel(
  connectionType: ConnectionType,
  fallback: string,
  language: AppLanguage,
): string {
  if (language === 'en') return fallback
  const pack = getLanguagePack(language)
  return pack.connectionTypes[connectionType] ?? fallback
}

export function getCategoryName(
  category: Category,
  language: AppLanguage,
): string {
  if (language === 'en') return category.name
  const pack = getLanguagePack(language)
  return pack.categoryContent[category.id]?.name ?? category.name
}

export function getCategoryDescription(
  category: Category,
  language: AppLanguage,
): string {
  if (language === 'en') return category.description
  const pack = getLanguagePack(language)
  return pack.categoryContent[category.id]?.description ?? category.description
}

export function getTechniqueName(
  technique: Technique,
  language: AppLanguage,
): string {
  if (language === 'en' || technique.isCustom) return technique.name
  const pack = getLanguagePack(language)
  return pack.techniqueContent[technique.id]?.name ?? technique.name
}

export function withLocalizedName(
  technique: Technique,
  language: AppLanguage,
): Technique {
  if (language === 'en' || technique.isCustom) return technique
  const localizedName = getTechniqueName(technique, language)
  if (localizedName === technique.name) return technique
  return {
    ...technique,
    aliases: [...(technique.aliases ?? []), localizedName],
  }
}

export function getTechniqueDescription(
  technique: Technique,
  language: AppLanguage,
): string {
  if (language === 'en' || technique.isCustom) return technique.description
  const pack = getLanguagePack(language)
  return (
    pack.techniqueContent[technique.id]?.description ?? technique.description
  )
}

export function getTechniqueCues(
  technique: Technique,
  language: AppLanguage,
): string[] {
  if (language === 'en' || technique.isCustom) return technique.cues ?? []
  const pack = getLanguagePack(language)
  return pack.techniqueContent[technique.id]?.cues ?? technique.cues ?? []
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

  const api = useMemo(
    () => ({
      language,
      setLanguage: (next: AppLanguage) => setAppLanguage(next),
      t: (text: TranslationKey) => translate(text, language),
      locale: getLanguagePack(language).locale,
    }),
    [language],
  )

  return api
}
