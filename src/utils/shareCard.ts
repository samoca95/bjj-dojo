import type { SessionType } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import type { AppLanguage } from '../i18n'
import { sessionTypeLabel } from '../i18n'
import type { SessionExportData } from './exportSession'

/**
 * Renders a training session as a polished, social-media-ready PNG using the
 * Canvas API. No external dependency — the card is drawn shape by shape so the
 * output works offline and stays on-brand.
 */

export type ShareCardFormat = 'square' | 'story'

export interface ShareCardOptions {
  format: ShareCardFormat
  /** Optional user-supplied photo used as the card background. */
  background?: CanvasImageSource | null
}

const DIMENSIONS: Record<ShareCardFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
}

const GOLD = '#d4a017'
const GOLD_LIGHT = '#ffcc44'
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const SESSION_TYPE_HEX: Record<SessionType, { bg: string; fg: string }> = {
  GI: { bg: '#1e3a8a', fg: '#bfdbfe' },
  NOGI: { bg: '#14532d', fg: '#bbf7d0' },
  OPEN_MAT: { bg: '#581c87', fg: '#e9d5ff' },
  COMPETITION: { bg: '#7f1d1d', fg: '#fecaca' },
  DRILLING: { bg: '#78350f', fg: '#fde68a' },
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
  footer: string
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
    footer: 'Tracked with BJJ Dojo',
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
    footer: 'Registrado con BJJ Dojo',
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
    footer: 'Suivi avec BJJ Dojo',
  },
}

/** Loads a user-picked file into something drawable on a canvas. */
export async function loadShareImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
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
  const any = img as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number }
  return {
    w: any.naturalWidth || any.width || 0,
    h: any.naturalHeight || any.height || 0,
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number) {
  const { w: iw, h: ih } = imageSize(img)
  if (!iw || !ih) return
  const scale = Math.max(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 0 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1)
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
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = value
  }
}

export async function renderShareCard(
  data: SessionExportData,
  language: AppLanguage,
  locale: string | undefined,
  options: ShareCardOptions,
): Promise<Blob> {
  const L = LABELS[language] ?? LABELS.en
  const { w, h } = DIMENSIONS[options.format]
  const { session, clubName, techniques, givenTaps, receivedTaps } = data

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const PAD = 88
  const FOOTER_H = 110
  const contentW = w - PAD * 2

  // --- Background ---------------------------------------------------------
  if (options.background) {
    drawCover(ctx, options.background, w, h)
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#1c1917')
    g.addColorStop(0.55, '#0a0a0a')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.22, 0, w * 0.5, h * 0.22, w * 0.95)
    glow.addColorStop(0, 'rgba(212,160,23,0.18)')
    glow.addColorStop(1, 'rgba(212,160,23,0)')
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

  // Gold frame.
  ctx.strokeStyle = 'rgba(212,160,23,0.55)'
  ctx.lineWidth = 5
  ctx.strokeRect(26, 26, w - 52, h - 52)

  // --- Brand row ----------------------------------------------------------
  let y = PAD
  const brandSize = 36
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillStyle = GOLD
  ctx.font = `800 ${brandSize}px ${FONT}`
  setLetterSpacing(ctx, '6px')
  ctx.fillText(L.brand, PAD, y + 12)
  setLetterSpacing(ctx, '0px')

  // Session type badge, right-aligned on the brand row.
  const typeLabel = sessionTypeLabel(
    session.sessionType, SESSION_TYPE_LABELS[session.sessionType], language,
  ).toUpperCase()
  const badge = SESSION_TYPE_HEX[session.sessionType]
  ctx.font = `700 26px ${FONT}`
  setLetterSpacing(ctx, '1px')
  const badgePadX = 26
  const badgeH = 58
  const badgeW = ctx.measureText(typeLabel).width + badgePadX * 2
  const badgeX = w - PAD - badgeW
  const badgeY = y + 2
  ctx.fillStyle = badge.bg
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 2
  roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.stroke()
  ctx.fillStyle = badge.fg
  ctx.textBaseline = 'middle'
  ctx.fillText(typeLabel, badgeX + badgePadX, badgeY + badgeH / 2 + 2)
  setLetterSpacing(ctx, '0px')
  ctx.textBaseline = 'top'

  y += badgeH + 34

  // --- Date ---------------------------------------------------------------
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 60px ${FONT}`
  const dateLines = wrapText(ctx, formatCardDate(session.date, locale), contentW, 2)
  for (const line of dateLines) {
    ctx.fillText(line, PAD, y)
    y += 72
  }
  y += 14

  // Gold divider.
  ctx.strokeStyle = 'rgba(212,160,23,0.5)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(PAD + 120, y)
  ctx.stroke()
  y += 36

  // --- Stat tiles ---------------------------------------------------------
  const tiles: { label: string; render: (x: number, ty: number, tw: number) => void }[] = []

  tiles.push({
    label: 'Time'.toUpperCase(),
    render: (x, ty) => {
      ctx.fillStyle = '#ffffff'
      ctx.font = `800 46px ${FONT}`
      ctx.fillText(`${session.durationMinutes}`, x, ty)
      const numW = ctx.measureText(`${session.durationMinutes}`).width
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = `600 26px ${FONT}`
      ctx.fillText(` ${L.minutes}`, x + numW, ty + 16)
    },
  })

  tiles.push({
    label: L.energy.toUpperCase(),
    render: (x, ty) => {
      const dot = 30
      const gap = 12
      for (let i = 0; i < 5; i++) {
        const dx = x + i * (dot + gap)
        roundRectPath(ctx, dx, ty + 6, dot, dot, 8)
        ctx.fillStyle = i < session.energyLevel ? GOLD : 'rgba(255,255,255,0.16)'
        ctx.fill()
      }
    },
  })

  if (clubName) {
    tiles.push({
      label: 'Club'.toUpperCase(),
      render: (x, ty, tw) => {
        ctx.fillStyle = '#ffffff'
        ctx.font = `700 34px ${FONT}`
        ctx.fillText(truncateToWidth(ctx, clubName, tw - 44), x, ty + 4)
      },
    })
  }

  const tileGap = 20
  const tileH = 152
  const tileW = (contentW - tileGap * (tiles.length - 1)) / tiles.length
  tiles.forEach((tile, i) => {
    const tx = PAD + i * (tileW + tileGap)
    roundRectPath(ctx, tx, y, tileW, tileH, 22)
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(212,160,23,0.28)'
    ctx.lineWidth = 2
    roundRectPath(ctx, tx, y, tileW, tileH, 22)
    ctx.stroke()
    const innerX = tx + 28
    ctx.fillStyle = GOLD
    ctx.font = `700 22px ${FONT}`
    setLetterSpacing(ctx, '2px')
    ctx.fillText(tile.label, innerX, y + 26)
    setLetterSpacing(ctx, '0px')
    tile.render(innerX, y + 72, tileW)
  })
  y += tileH + 44

  // --- Techniques ---------------------------------------------------------
  ctx.fillStyle = GOLD
  ctx.font = `800 26px ${FONT}`
  setLetterSpacing(ctx, '3px')
  ctx.fillText(L.techniques.toUpperCase(), PAD, y)
  setLetterSpacing(ctx, '0px')
  y += 50

  const bottomLimit = h - PAD - FOOTER_H
  const techFontSize = 36
  const techLineHeight = 47
  let shown = 0

  if (techniques.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font = `italic 600 34px ${FONT}`
    ctx.fillText(L.noTechniques, PAD, y + 4)
  } else {
    for (const { technique } of techniques) {
      ctx.font = `500 ${techFontSize}px ${FONT}`
      const lines = wrapText(ctx, technique.name, contentW - 44, 2)
      const blockH = lines.length * techLineHeight + 14
      if (y + blockH > bottomLimit) break
      ctx.fillStyle = GOLD
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
    if (remaining > 0 && y + 44 <= bottomLimit) {
      ctx.fillStyle = GOLD_LIGHT
      ctx.font = `700 30px ${FONT}`
      ctx.fillText(`+${remaining} ${L.more}`, PAD + 38, y + 4)
    }
  }

  // --- Footer -------------------------------------------------------------
  const footerLineY = h - PAD - FOOTER_H + 28
  ctx.strokeStyle = 'rgba(212,160,23,0.4)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(PAD, footerLineY)
  ctx.lineTo(w - PAD, footerLineY)
  ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.font = `700 26px ${FONT}`
  setLetterSpacing(ctx, '1px')
  ctx.fillText(L.footer, PAD, footerLineY + 26)
  setLetterSpacing(ctx, '0px')

  const totalTaps = givenTaps.length + receivedTaps.length
  if (totalTaps > 0) {
    const tapText = `${L.taps}: ${givenTaps.length} ${L.given} · ${receivedTaps.length} ${L.received}`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = `600 26px ${FONT}`
    ctx.textAlign = 'right'
    ctx.fillText(tapText, w - PAD, footerLineY + 26)
    ctx.textAlign = 'left'
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not render image'))),
      'image/png',
    )
  })
}
