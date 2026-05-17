import type { Flow, Technique } from '../types'

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
  return tokens.every((token) => matchesToken(normalizedText, token))
}

export function techniqueMatchesQuery(
  technique: Technique,
  query: string,
): boolean {
  if (!query.trim()) return true
  const combined = [
    technique.name,
    ...(technique.aliases ?? []),
    technique.description,
    ...(technique.cues ?? []),
    ...(technique.tags ?? []),
  ].join(' ')
  return fuzzyMatch(combined, query)
}

/**
 * Returns the first alias (or English name) that matches the query, but only
 * when the displayed name itself does not match — so callers can show "why"
 * this result appeared.
 *
 * Pass `displayName` when showing a localized name: if the English
 * `technique.name` is what matched (not the localized display name), it is
 * returned so the UI can surface it as an indicator.
 */
export function getMatchingAlias(
  technique: Technique,
  query: string,
  displayName?: string,
): string | null {
  if (!query.trim()) return null

  const normQuery = normalize(query)
  const tokens = normQuery.split(/\s+/).filter(Boolean)
  const normDisplayName = normalize(displayName ?? technique.name)

  const displayNameMatches =
    normDisplayName === normQuery ||
    normDisplayName.startsWith(normQuery) ||
    normDisplayName.includes(normQuery) ||
    isSubsequence(normDisplayName, normQuery) ||
    (tokens.length > 1 &&
      tokens.every((token) => normDisplayName.includes(token)))

  if (displayNameMatches) return null

  // When a localized name is displayed and the English name is what matched,
  // surface the English name as the match indicator.
  if (displayName && displayName !== technique.name) {
    const normEnglish = normalize(technique.name)
    const englishMatches =
      normEnglish === normQuery ||
      normEnglish.startsWith(normQuery) ||
      normEnglish.includes(normQuery) ||
      isSubsequence(normEnglish, normQuery) ||
      (tokens.length > 1 &&
        tokens.every((token) => normEnglish.includes(token)))
    if (englishMatches) return technique.name
  }

  for (const alias of technique.aliases ?? []) {
    if (fuzzyMatch(alias, query)) return alias
  }
  return null
}

/**
 * Returns a sort score for the technique against the query.
 * Higher score = closer match = should appear earlier in results.
 * Strict/exact matches in name rank highest; description-only matches rank lowest.
 */
export function techniqueScore(technique: Technique, query: string): number {
  if (!query.trim()) return 0
  const normName = normalize(technique.name)
  const normAliases = (technique.aliases ?? []).map(normalize)
  const normQuery = normalize(query)

  if (normName === normQuery) return 100
  if (normName.startsWith(normQuery)) return 90
  if (normName.includes(normQuery)) return 70
  if (isSubsequence(normName, normQuery)) return 50

  if (normAliases.includes(normQuery)) return 80
  if (normAliases.some((alias) => alias.startsWith(normQuery))) return 65
  if (normAliases.some((alias) => alias.includes(normQuery))) return 45

  // Multi-token: check if every token strictly matches the name
  const tokens = normQuery.split(/\s+/).filter(Boolean)
  if (tokens.length > 1 && tokens.every((token) => normName.includes(token)))
    return 60
  if (
    tokens.length > 1 &&
    normAliases.some((alias) => tokens.every((token) => alias.includes(token)))
  )
    return 40

  // Match only found in description
  return 10
}

function flowHaystacks(
  flow: Flow,
  techniqueNameById: (id: number) => string,
): {
  name: string
  description: string
  techniqueNames: string
  notes: string
  tags: string
} {
  const techniqueNames = flow.nodes
    .map((n) => techniqueNameById(n.techniqueId))
    .filter(Boolean)
    .join(' ')
  const notes = flow.nodes
    .map((n) => n.note ?? '')
    .filter(Boolean)
    .join(' ')
  return {
    name: flow.name,
    description: flow.description,
    techniqueNames,
    notes,
    tags: (flow.tags ?? []).join(' '),
  }
}

export function flowMatchesQuery(
  flow: Flow,
  techniqueNameById: (id: number) => string,
  query: string,
): boolean {
  if (!query.trim()) return true
  const h = flowHaystacks(flow, techniqueNameById)
  const combined = [h.name, h.description, h.techniqueNames, h.notes, h.tags]
    .filter(Boolean)
    .join(' ')
  return fuzzyMatch(combined, query)
}

export function flowScore(
  flow: Flow,
  techniqueNameById: (id: number) => string,
  query: string,
): number {
  if (!query.trim()) return 0
  const h = flowHaystacks(flow, techniqueNameById)
  const normName = normalize(h.name)
  const normQuery = normalize(query)

  if (normName === normQuery) return 100
  if (normName.startsWith(normQuery)) return 90
  if (normName.includes(normQuery)) return 70
  if (isSubsequence(normName, normQuery)) return 50

  const tokens = normQuery.split(/\s+/).filter(Boolean)
  if (tokens.length > 1 && tokens.every((token) => normName.includes(token)))
    return 60

  if (fuzzyMatch(h.techniqueNames, query)) return 55
  if (fuzzyMatch(h.tags, query)) return 35
  if (fuzzyMatch(h.notes, query)) return 25
  if (fuzzyMatch(h.description, query)) return 10
  return 0
}
