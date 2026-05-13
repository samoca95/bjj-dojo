/**
 * Centralized theme color tokens for the BJJ Dojo app.
 *
 * Edit here to retune the palette globally. CSS uses the corresponding
 * custom properties defined in `src/index.css` (kept in sync with these values).
 *
 * Hex values are exposed for inline SVG/fill props and dynamic styles that
 * cannot reference Tailwind classes or CSS variables directly.
 */

export const GOLD = {
  DEFAULT: '#d4a017',
  light: '#ffcc44',
  dim: '#8a6a00',
} as const

export const DARK = {
  bg: '#0a0a0a',
  surface: '#18181b',
  surfaceAlt: '#27272a',
  border: '#3f3f46',
  text: '#ffffff',
  textMuted: '#f4f4f5',
} as const

export const LIGHT = {
  bg: '#f4f4f5',
  surface: '#ffffff',
  surfaceAlt: '#e4e4e7',
  border: '#d4d4d8',
  text: '#18181b',
  textStrong: '#27272a',
  textMuted: '#3f3f46',
  textSubtle: '#52525b',
} as const

export const BELT = {
  black: '#18181b',
  redTip: '#b91c1c',
} as const

export const BADGE_DARK = {
  blueBg: '#1e3a8a',
  greenBg: '#14532d',
  purpleBg: '#581c87',
  redBg: '#7f1d1d',
  amberBg: '#78350f',
} as const

export const BADGE_LIGHT = {
  blueBg: '#dbeafe',
  greenBg: '#dcfce7',
  purpleBg: '#f3e8ff',
  redBg: '#fee2e2',
  amberBg: '#fef3c7',
  blueText: '#1d4ed8',
  greenText: '#15803d',
  purpleText: '#7e22ce',
  redText: '#b91c1c',
  redTextStrong: '#991b1b',
  amberText: '#92400e',
  amberTextStrong: '#b45309',
  orangeText: '#c2410c',
} as const

/** Theme-aware color helpers for inline styles. */
export const themeFill = (theme: 'light' | 'dark') => ({
  primary: theme === 'light' ? LIGHT.text : DARK.text,
  inverted: theme === 'light' ? DARK.text : LIGHT.text,
  goldAccent: theme === 'light' ? GOLD.dim : GOLD.DEFAULT,
})
