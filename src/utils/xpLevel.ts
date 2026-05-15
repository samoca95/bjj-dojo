export interface XpInputs {
  totalMinutes: number
  givenTaps: number
  sessionCount: number
}

export interface LevelInfo {
  level: number
  xp: number
  xpIntoLevel: number
  xpForNext: number
  pct: number
}

export const XP_PER_15MIN = 1
export const XP_PER_GIVEN_TAP = 5
export const XP_PER_SESSION = 2

export function computeXp(inputs: XpInputs): number {
  const matXp = Math.floor(inputs.totalMinutes / 15) * XP_PER_15MIN
  const tapXp = inputs.givenTaps * XP_PER_GIVEN_TAP
  const sessionXp = inputs.sessionCount * XP_PER_SESSION
  return matXp + tapXp + sessionXp
}

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  const n = level - 1
  return Math.floor((100 * n * (n + 1)) / 2)
}

export function computeLevel(xp: number): LevelInfo {
  let level = 1
  while (xpRequiredForLevel(level + 1) <= xp) level += 1
  const start = xpRequiredForLevel(level)
  const next = xpRequiredForLevel(level + 1)
  const xpIntoLevel = xp - start
  const xpForNext = next - start
  const pct =
    xpForNext > 0
      ? Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100))
      : 100
  return { level, xp, xpIntoLevel, xpForNext, pct }
}
