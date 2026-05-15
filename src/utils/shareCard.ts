import type { SessionType } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import type { AppLanguage } from '../i18n'
import { sessionTypeLabel } from '../i18n'
import type { BeltColor } from './beltRank'
import type { SessionExportData } from './exportSession'
import qrcode from 'qrcode-generator'
import bjjIconUrl from '/bjj-icon.svg'

/**
 * Renders a training session as a polished, social-media-ready PNG using the
 * Canvas API. No rendering dependency — the card is drawn shape by shape so the
 * output works offline and stays on-brand.
 */

export type ShareCardFormat = 'square' | 'story'

export interface ShareCardTheme {
  id: string
  /** Localised display name shown in the picker. */
  label: Record<AppLanguage, string>
  accent: string
  accentLight: string
  gradient: [string, string, string]
  glow: string
}

export const SHARE_CARD_THEMES: ShareCardTheme[] = [
  {
    id: 'gold',
    label: { en: 'Gold', es: 'Oro', fr: 'Or' },
    accent: '#d4a017',
    accentLight: '#ffcc44',
    gradient: ['#1c1917', '#0a0a0a', '#000000'],
    glow: 'rgba(212,160,23,0.18)',
  },
  {
    id: 'crimson',
    label: { en: 'Crimson', es: 'Carmesí', fr: 'Cramoisi' },
    accent: '#dc2626',
    accentLight: '#f87171',
    gradient: ['#1f1110', '#0b0606', '#000000'],
    glow: 'rgba(220,38,38,0.20)',
  },
  {
    id: 'ocean',
    label: { en: 'Ocean', es: 'Océano', fr: 'Océan' },
    accent: '#0ea5e9',
    accentLight: '#7dd3fc',
    gradient: ['#0c1a24', '#06101a', '#000000'],
    glow: 'rgba(14,165,233,0.20)',
  },
  {
    id: 'emerald',
    label: { en: 'Emerald', es: 'Esmeralda', fr: 'Émeraude' },
    accent: '#10b981',
    accentLight: '#6ee7b7',
    gradient: ['#0c1f17', '#06120d', '#000000'],
    glow: 'rgba(16,185,129,0.20)',
  },
  {
    id: 'mono',
    label: { en: 'Mono', es: 'Mono', fr: 'Mono' },
    accent: '#e5e5e5',
    accentLight: '#ffffff',
    gradient: ['#262626', '#0f0f0f', '#000000'],
    glow: 'rgba(255,255,255,0.14)',
  },
]

export function getShareCardTheme(id: string): ShareCardTheme {
  return SHARE_CARD_THEMES.find((t) => t.id === id) ?? SHARE_CARD_THEMES[0]
}

/** Pan/zoom applied to a user-supplied background photo. */
export interface BackgroundTransform {
  /** Zoom multiplier on top of the cover-fit scale (1 = cover). */
  scale: number
  /** Horizontal offset in canvas pixels from the centred position. */
  x: number
  /** Vertical offset in canvas pixels from the centred position. */
  y: number
}

export const DEFAULT_TRANSFORM: BackgroundTransform = { scale: 1, x: 0, y: 0 }

export interface ShareCardBelt {
  color: BeltColor
  stripes: number
  name?: string
}

export interface ShareCardOptions {
  format: ShareCardFormat
  theme: ShareCardTheme
  /** Optional user-supplied photo used as the card background. */
  background?: CanvasImageSource | null
  backgroundTransform?: BackgroundTransform
  /** When set, a belt bar (and optional name) is drawn near the top. */
  belt?: ShareCardBelt | null
  /** When set, a scannable QR code linking to the app is drawn in the footer. */
  qrUrl?: string | null
  /**
   * Output resolution multiplier (1 = full 1080px export). The share sheet
   * renders previews at a fraction of this for snappy, interactive updates.
   */
  pixelScale?: number
}

const DIMENSIONS: Record<ShareCardFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
}

const FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const SESSION_TYPE_HEX: Record<SessionType, { bg: string; fg: string }> = {
  GI: { bg: '#1e3a8a', fg: '#bfdbfe' },
  NOGI: { bg: '#14532d', fg: '#bbf7d0' },
  OPEN_MAT: { bg: '#581c87', fg: '#e9d5ff' },
  COMPETITION: { bg: '#7f1d1d', fg: '#fecaca' },
  DRILLING: { bg: '#78350f', fg: '#fde68a' },
}

const BELT_HEX: Record<
  BeltColor,
  { belt: string; tip: string; stripe: string }
> = {
  white: { belt: '#e7e5e4', tip: '#292524', stripe: '#ffffff' },
  blue: { belt: '#1d4ed8', tip: '#0a0a0a', stripe: '#ffffff' },
  purple: { belt: '#6d28d9', tip: '#0a0a0a', stripe: '#ffffff' },
  brown: { belt: '#78350f', tip: '#0a0a0a', stripe: '#ffffff' },
  black: { belt: '#18181b', tip: '#b91c1c', stripe: '#ffffff' },
}

interface CardLabels {
  brand: string
  minutes: string
  energy: string
  techniques: string
  taps: string
  given: string
  received: string
  more: string
  noTechniques: string
  notes: string
  footer: string
  scanApp: string
}

const LABELS: Record<AppLanguage, CardLabels> = {
  en: {
    brand: 'BJJ DOJO',
    minutes: 'min',
    energy: 'Energy',
    techniques: 'Techniques drilled',
    taps: 'Taps',
    given: 'given',
    received: 'received',
    more: 'more',
    noTechniques: 'Open mat — just rolling',
    notes: 'Notes',
    footer: 'Tracked with BJJ Dojo',
    scanApp: 'SCAN TO GET THE APP',
  },
  es: {
    brand: 'BJJ DOJO',
    minutes: 'min',
    energy: 'Energía',
    techniques: 'Técnicas trabajadas',
    taps: 'Sumisiones',
    given: 'aplicadas',
    received: 'recibidas',
    more: 'más',
    noTechniques: 'Rodando libre',
    notes: 'Notas',
    footer: 'Registrado con BJJ Dojo',
    scanApp: 'ESCANEA PARA LA APP',
  },
  fr: {
    brand: 'BJJ DOJO',
    minutes: 'min',
    energy: 'Énergie',
    techniques: 'Techniques travaillées',
    taps: 'Soumissions',
    given: 'réussies',
    received: 'subies',
    more: 'de plus',
    noTechniques: 'Open mat',
    notes: 'Notes',
    footer: 'Suivi avec BJJ Dojo',
    scanApp: 'SCANNEZ POUR L’APP',
  },
}

/** Loads a user-picked file into something drawable on a canvas. */
export async function loadShareImage(
  file: File,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Fall back to the <img> loader below.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = url
    })
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }
}

function imageSize(img: CanvasImageSource): { w: number; h: number } {
  const any = img as {
    naturalWidth?: number
    naturalHeight?: number
    width?: number
    height?: number
  }
  return {
    w: any.naturalWidth || any.width || 0,
    h: any.naturalHeight || any.height || 0,
  }
}

/** Keeps a pan/zoom transform within bounds that always cover the canvas. */
export function clampTransform(
  img: CanvasImageSource,
  format: ShareCardFormat,
  t: BackgroundTransform,
): BackgroundTransform {
  const { w, h } = DIMENSIONS[format]
  const { w: iw, h: ih } = imageSize(img)
  const scale = Math.min(4, Math.max(1, t.scale))
  if (!iw || !ih) return { scale, x: 0, y: 0 }
  const drawn = Math.max(w / iw, h / ih) * scale
  const maxX = Math.max(0, (iw * drawn - w) / 2)
  const maxY = Math.max(0, (ih * drawn - h) / 2)
  return {
    scale,
    x: Math.min(maxX, Math.max(-maxX, t.x)),
    y: Math.min(maxY, Math.max(-maxY, t.y)),
  }
}

function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  w: number,
  h: number,
  transform: BackgroundTransform,
) {
  const { w: iw, h: ih } = imageSize(img)
  if (!iw || !ih) return
  const scale = Math.max(w / iw, h / ih) * Math.max(1, transform.scale)
  const dw = iw * scale
  const dh = ih * scale
  let dx = (w - dw) / 2 + transform.x
  let dy = (h - dh) / 2 + transform.y
  dx = Math.min(0, Math.max(w - dw, dx))
  dy = Math.min(0, Math.max(h - dh, dy))
  ctx.drawImage(img, dx, dy, dw, dh)
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 0 && ctx.measureText(`${t}…`).width > maxWidth)
    t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = Infinity,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const head = lines.slice(0, maxLines - 1)
  head.push(truncateToWidth(ctx, lines.slice(maxLines - 1).join(' '), maxWidth))
  return head
}

function formatCardDate(epoch: number, locale?: string): string {
  return new Date(epoch).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  if ('letterSpacing' in ctx) {
    ;(
      ctx as CanvasRenderingContext2D & { letterSpacing: string }
    ).letterSpacing = value
  }
}

function withAlpha(
  ctx: CanvasRenderingContext2D,
  alpha: number,
  draw: () => void,
) {
  const prev = ctx.globalAlpha
  ctx.globalAlpha = alpha
  draw()
  ctx.globalAlpha = prev
}

/** Draws the optional name + belt bar block; returns the height it consumed. */
function drawBeltBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  belt: ShareCardBelt,
): number {
  let cursor = y
  const name = belt.name?.trim()
  if (name) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 38px ${FONT}`
    ctx.textBaseline = 'top'
    setLetterSpacing(ctx, '1px')
    ctx.fillText(truncateToWidth(ctx, name.toUpperCase(), maxW), x, cursor)
    setLetterSpacing(ctx, '0px')
    cursor += 52
  }

  const barW = Math.min(maxW, 460)
  const barH = 50
  const colors = BELT_HEX[belt.color]

  ctx.save()
  roundRectPath(ctx, x, cursor, barW, barH, 10)
  ctx.clip()
  ctx.fillStyle = colors.belt
  ctx.fillRect(x, cursor, barW, barH)

  const tipW = 168
  const tipX = x + barW - tipW - 30
  ctx.fillStyle = colors.tip
  ctx.fillRect(tipX, cursor, tipW, barH)

  const stripes = Math.max(0, Math.min(4, belt.stripes))
  if (stripes > 0) {
    const stripeW = 12
    const stripeGap = 13
    const totalW = stripes * stripeW + (stripes - 1) * stripeGap
    let sx = tipX + (tipW - totalW) / 2
    ctx.fillStyle = colors.stripe
    for (let i = 0; i < stripes; i++) {
      ctx.fillRect(sx, cursor + 8, stripeW, barH - 16)
      sx += stripeW + stripeGap
    }
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 2
  roundRectPath(ctx, x, cursor, barW, barH, 10)
  ctx.stroke()

  return cursor + barH - y
}

function drawQrCode(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  size: number,
) {
  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()
  const count = qr.getModuleCount()

  roundRectPath(ctx, x, y, size, size, 16)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  const padding = 16
  const inner = size - padding * 2
  const cell = inner / count
  ctx.fillStyle = '#0a0a0a'
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          x + padding + c * cell,
          y + padding + r * cell,
          Math.ceil(cell),
          Math.ceil(cell),
        )
      }
    }
  }
}

function drawCompactStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  drawValue: (x: number, y: number, w: number) => void,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.font = `700 18px ${FONT}`
  setLetterSpacing(ctx, '1.5px')
  ctx.fillText(label, x, y)
  setLetterSpacing(ctx, '0px')
  drawValue(x, y + 28, w)
}

let appLogoPromise: Promise<HTMLImageElement | null> | null = null

async function getAppLogoImage(): Promise<HTMLImageElement | null> {
  if (appLogoPromise) return appLogoPromise
  appLogoPromise = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = bjjIconUrl
  })
  return await appLogoPromise
}

export async function renderShareCard(
  data: SessionExportData,
  language: AppLanguage,
  locale: string | undefined,
  options: ShareCardOptions,
): Promise<Blob> {
  const L = LABELS[language] ?? LABELS.en
  const theme = options.theme
  const { w, h } = DIMENSIONS[options.format]
  const { session, clubName, techniques, givenTaps, receivedTaps } = data

  const pixelScale =
    options.pixelScale && options.pixelScale > 0 ? options.pixelScale : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * pixelScale)
  canvas.height = Math.round(h * pixelScale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  // Draw in logical 1080-wide coordinates; the transform scales to the
  // requested output resolution. measureText is unaffected by the transform,
  // so all layout maths stay in logical units.
  if (pixelScale !== 1) ctx.scale(pixelScale, pixelScale)

  const PAD = 88
  const qrSize = 156
  const FOOTER_H = options.qrUrl ? 208 : 110
  const contentW = w - PAD * 2

  // --- Background ---------------------------------------------------------
  if (options.background) {
    drawBackgroundImage(
      ctx,
      options.background,
      w,
      h,
      options.backgroundTransform ?? DEFAULT_TRANSFORM,
    )
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, theme.gradient[0])
    g.addColorStop(0.55, theme.gradient[1])
    g.addColorStop(1, theme.gradient[2])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const glow = ctx.createRadialGradient(
      w * 0.5,
      h * 0.22,
      0,
      w * 0.5,
      h * 0.22,
      w * 0.95,
    )
    glow.addColorStop(0, theme.glow)
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }

  // Legibility scrim — keeps text readable over any photo.
  const scrim = ctx.createLinearGradient(0, 0, 0, h)
  scrim.addColorStop(0, 'rgba(0,0,0,0.62)')
  scrim.addColorStop(0.42, 'rgba(0,0,0,0.40)')
  scrim.addColorStop(0.78, 'rgba(0,0,0,0.62)')
  scrim.addColorStop(1, 'rgba(0,0,0,0.88)')
  ctx.fillStyle = scrim
  ctx.fillRect(0, 0, w, h)

  // --- Brand row ----------------------------------------------------------
  let y = PAD
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = theme.accent
  ctx.font = `800 30px ${FONT}`
  setLetterSpacing(ctx, '5px')
  ctx.fillText(L.brand, PAD, y + 10)
  setLetterSpacing(ctx, '0px')

  const logo = await getAppLogoImage()
  if (logo) {
    const logoSize = 56
    const logoX = w - PAD - logoSize
    const logoY = y
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
  }

  y += 74

  // --- Belt + name (optional) --------------------------------------------
  if (options.belt) {
    y += drawBeltBlock(ctx, PAD, y, contentW, options.belt) + 34
  }

  // --- Date ---------------------------------------------------------------
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 54px ${FONT}`
  const typeLabel = sessionTypeLabel(
    session.sessionType,
    SESSION_TYPE_LABELS[session.sessionType],
    language,
  ).toUpperCase()
  const badge = SESSION_TYPE_HEX[session.sessionType]
  ctx.font = `700 26px ${FONT}`
  setLetterSpacing(ctx, '1px')
  const badgePadX = 26
  const badgeH = 58
  const badgeW = ctx.measureText(typeLabel).width + badgePadX * 2
  const inlineBadge = contentW - badgeW - 24 >= 340
  const dateMaxW = inlineBadge ? contentW - badgeW - 24 : contentW
  ctx.font = `800 54px ${FONT}`
  const dateLines = wrapText(
    ctx,
    formatCardDate(session.date, locale),
    dateMaxW,
    2,
  )
  const dateStartY = y
  for (const line of dateLines) {
    ctx.fillText(line, PAD, y)
    y += 64
  }
  const badgeX = inlineBadge ? PAD + dateMaxW + 24 : PAD
  const badgeY = inlineBadge ? dateStartY + 2 : y + 6
  ctx.fillStyle = badge.bg
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.stroke()
  ctx.fillStyle = badge.fg
  ctx.font = `700 26px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.fillText(typeLabel, badgeX + badgePadX, badgeY + badgeH / 2 + 2)
  ctx.textBaseline = 'top'
  setLetterSpacing(ctx, '0px')
  y = Math.max(y, badgeY + badgeH + 10)
  y += 10

  // Theme divider.
  ctx.strokeStyle = theme.accent
  ctx.lineWidth = 4
  withAlpha(ctx, 0.6, () => {
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(PAD + 120, y)
    ctx.stroke()
  })
  y += 26

  // --- Compact session stats ----------------------------------------------
  const stats: {
    label: string
    render: (x: number, ty: number, tw: number) => void
  }[] = []

  stats.push({
    label: 'TIME',
    render: (x, ty) => {
      ctx.fillStyle = '#ffffff'
      ctx.font = `800 42px ${FONT}`
      ctx.fillText(`${session.durationMinutes}`, x, ty)
      const numW = ctx.measureText(`${session.durationMinutes}`).width
      ctx.fillStyle = 'rgba(255,255,255,0.62)'
      ctx.font = `600 22px ${FONT}`
      ctx.fillText(` ${L.minutes}`, x + numW, ty + 15)
    },
  })

  stats.push({
    label: L.energy.toUpperCase(),
    render: (x, ty) => {
      const dot = 18
      const gap = 10
      for (let i = 0; i < 5; i++) {
        const dx = x + i * (dot + gap)
        roundRectPath(ctx, dx, ty + 7, dot, dot, 6)
        ctx.fillStyle =
          i < session.energyLevel ? theme.accent : 'rgba(255,255,255,0.14)'
        ctx.fill()
      }
    },
  })

  if (clubName) {
    stats.push({
      label: 'CLUB',
      render: (x, ty, tw) => {
        ctx.fillStyle = '#ffffff'
        ctx.font = `700 28px ${FONT}`
        ctx.fillText(truncateToWidth(ctx, clubName, tw), x, ty + 2)
      },
    })
  }

  const tileGap = 20
  const statW = (contentW - tileGap * (stats.length - 1)) / stats.length
  stats.forEach((stat, i) => {
    const tx = PAD + i * (statW + tileGap)
    drawCompactStat(ctx, tx, y, statW, stat.label, stat.render)
  })
  y += 88

  // --- Taps / submissions highlight --------------------------------------
  const totalTaps = givenTaps.length + receivedTaps.length
  if (totalTaps > 0) {
    const tapsH = 132
    roundRectPath(ctx, PAD, y, contentW, tapsH, 22)
    ctx.fillStyle = 'rgba(255,255,255,0.09)'
    ctx.fill()
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 2
    withAlpha(ctx, 0.45, () => {
      roundRectPath(ctx, PAD, y, contentW, tapsH, 22)
      ctx.stroke()
    })
    ctx.fillStyle = theme.accentLight
    ctx.font = `800 24px ${FONT}`
    setLetterSpacing(ctx, '2px')
    ctx.fillText(L.taps.toUpperCase(), PAD + 26, y + 20)
    setLetterSpacing(ctx, '0px')
    const half = contentW / 2
    ctx.font = `800 56px ${FONT}`
    ctx.fillStyle = '#22c55e'
    ctx.fillText(`${givenTaps.length}`, PAD + 26, y + 54)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `700 22px ${FONT}`
    ctx.fillText(L.given.toUpperCase(), PAD + 26, y + 94)
    ctx.font = `800 56px ${FONT}`
    ctx.fillStyle = '#f87171'
    ctx.fillText(`${receivedTaps.length}`, PAD + half + 26, y + 54)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = `700 22px ${FONT}`
    ctx.fillText(L.received.toUpperCase(), PAD + half + 26, y + 94)
    y += tapsH + 28
  }

  // --- Techniques ---------------------------------------------------------
  ctx.fillStyle = theme.accent
  ctx.font = `800 26px ${FONT}`
  setLetterSpacing(ctx, '3px')
  ctx.fillText(L.techniques.toUpperCase(), PAD, y)
  setLetterSpacing(ctx, '0px')
  y += 50

  const bottomLimit = h - PAD - FOOTER_H
  const hasNotes = Boolean(session.notes && session.notes.trim())
  const notesReserve = hasNotes ? (options.format === 'square' ? 170 : 200) : 0
  const techBottomLimit = bottomLimit - notesReserve

  if (techniques.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font = `italic 600 34px ${FONT}`
    ctx.fillText(L.noTechniques, PAD, y + 4)
  } else {
    if (options.format === 'square') {
      const techCount = techniques.length
      const rowH = techCount > 36 ? 22 : techCount > 22 ? 26 : 30
      const maxRows = Math.max(1, Math.floor((techBottomLimit - y) / rowH))
      const cols = Math.min(3, Math.max(1, Math.ceil(techCount / maxRows)))
      const colGap = 14
      const colW = (contentW - colGap * (cols - 1)) / cols
      ctx.font = `500 ${rowH - 7}px ${FONT}`
      techniques.forEach(({ technique }, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const tx = PAD + col * (colW + colGap)
        const ty = y + row * rowH
        ctx.fillStyle = theme.accent
        roundRectPath(ctx, tx, ty + 7, 10, 10, 3)
        ctx.fill()
        ctx.fillStyle = '#f4f4f5'
        ctx.fillText(
          truncateToWidth(ctx, technique.name, colW - 24),
          tx + 18,
          ty,
        )
      })
      y += Math.ceil(techCount / cols) * rowH + 16
    } else {
      const techFontSize = 36
      const techLineHeight = 47
      let shown = 0
      for (const { technique } of techniques) {
        ctx.font = `500 ${techFontSize}px ${FONT}`
        const lines = wrapText(ctx, technique.name, contentW - 44, 2)
        const blockH = lines.length * techLineHeight + 14
        if (y + blockH > techBottomLimit) break
        ctx.fillStyle = theme.accent
        roundRectPath(ctx, PAD, y + 11, 14, 14, 4)
        ctx.fill()
        ctx.fillStyle = '#f4f4f5'
        ctx.font = `500 ${techFontSize}px ${FONT}`
        lines.forEach((line, li) => {
          ctx.fillText(line, PAD + 38, y + li * techLineHeight)
        })
        y += blockH
        shown++
      }
      const remaining = techniques.length - shown
      if (remaining > 0 && y + 44 <= techBottomLimit) {
        ctx.fillStyle = theme.accentLight
        ctx.font = `700 30px ${FONT}`
        ctx.fillText(`+${remaining} ${L.more}`, PAD + 38, y + 4)
      }
    }
  }

  // --- Session notes ------------------------------------------------------
  if (hasNotes && y + 44 <= bottomLimit) {
    const notesText = session.notes!.trim()
    ctx.fillStyle = theme.accent
    ctx.font = `800 24px ${FONT}`
    setLetterSpacing(ctx, '2px')
    ctx.fillText(L.notes.toUpperCase(), PAD, y)
    setLetterSpacing(ctx, '0px')
    y += 38
    ctx.fillStyle = 'rgba(244,244,245,0.9)'
    ctx.font = `500 26px ${FONT}`
    const maxLines = Math.max(1, Math.floor((bottomLimit - y) / 32))
    const lines = wrapText(ctx, notesText, contentW, maxLines)
    lines.forEach((line) => {
      if (y + 28 > bottomLimit) return
      ctx.fillText(line, PAD, y)
      y += 32
    })
  }

  // --- Footer -------------------------------------------------------------
  const footerLineY = h - PAD - FOOTER_H + 28
  const footerRight = options.qrUrl ? w - PAD - qrSize - 36 : w - PAD

  ctx.strokeStyle = theme.accent
  ctx.lineWidth = 3
  withAlpha(ctx, 0.42, () => {
    ctx.beginPath()
    ctx.moveTo(PAD, footerLineY)
    ctx.lineTo(footerRight, footerLineY)
    ctx.stroke()
  })

  ctx.fillStyle = theme.accent
  ctx.font = `700 26px ${FONT}`
  setLetterSpacing(ctx, '1px')
  ctx.fillText(L.footer, PAD, footerLineY + 26)
  setLetterSpacing(ctx, '0px')

  // --- QR code (optional) -------------------------------------------------
  if (options.qrUrl) {
    const qrX = w - PAD - qrSize
    const qrY = h - PAD - qrSize
    ctx.fillStyle = theme.accentLight
    ctx.font = `700 21px ${FONT}`
    ctx.textAlign = 'center'
    setLetterSpacing(ctx, '1px')
    ctx.fillText(L.scanApp, qrX + qrSize / 2, qrY - 32)
    setLetterSpacing(ctx, '0px')
    ctx.textAlign = 'left'
    drawQrCode(ctx, options.qrUrl, qrX, qrY, qrSize)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not render image')),
      'image/png',
    )
  })
}
