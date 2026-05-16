import type {
  MissingFieldResolutionChoice,
  MissingFieldResolver,
} from '../db/database'
import type { AppLanguage } from '../i18n'

function valueLabel(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return String(value)
  }
  return JSON.stringify(value)
}

export function createWindowMissingFieldResolver(
  language: AppLanguage,
): MissingFieldResolver {
  return (context): MissingFieldResolutionChoice => {
    if (typeof window === 'undefined') {
      return context.hasDefault ? 'default' : 'empty'
    }

    if (context.hasDefault) {
      const defaultLabel = valueLabel(context.defaultValue)
      const message =
        language === 'es'
          ? `Faltan ${context.missingCount} entradas sin "${context.fieldName}" en ${context.tableName}.\n\n¿Quieres usar el valor predeterminado ${defaultLabel} para todas?\n\nCancelar = dejarlo vacío en todas.`
          : language === 'fr'
            ? `Il manque ${context.missingCount} entrée(s) sans "${context.fieldName}" dans ${context.tableName}.\n\nVoulez-vous utiliser la valeur par défaut ${defaultLabel} pour toutes ?\n\nAnnuler = laisser vide pour toutes.`
            : `${context.missingCount} ${context.tableName} entries are missing "${context.fieldName}".\n\nUse default value ${defaultLabel} for all of them?\n\nCancel = leave empty for all.`
      return window.confirm(message) ? 'default' : 'empty'
    }

    const message =
      language === 'es'
        ? `Faltan ${context.missingCount} entradas sin "${context.fieldName}" en ${context.tableName}.\n\nSe dejará vacío para todas.`
        : language === 'fr'
          ? `Il manque ${context.missingCount} entrée(s) sans "${context.fieldName}" dans ${context.tableName}.\n\nCette valeur restera vide pour toutes.`
          : `${context.missingCount} ${context.tableName} entries are missing "${context.fieldName}".\n\nThis field will be left empty for all of them.`
    window.alert(message)
    return 'empty'
  }
}
