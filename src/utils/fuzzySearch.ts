import type { Technique } from '../types'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function isSubsequence(target: string, query: string): boolean {
  let i = 0
  for (const ch of target) {
    if (ch === query[i]) i += 1
    if (i >= query.length) return true
  }
  return query.length === 0
}

function matchesToken(target: string, token: string): boolean {
  if (token.length === 0) return true
  return target.includes(token) || isSubsequence(target, token)
}

export function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = normalize(text)
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every(token => matchesToken(normalizedText, token))
}

export function techniqueMatchesQuery(technique: Technique, query: string): boolean {
  if (!query.trim()) return true
  const combined = `${technique.name} ${technique.description}`
  return fuzzyMatch(combined, query)
}
