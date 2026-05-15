import type { Session, Technique } from '../types'
import { SESSION_TYPE_LABELS } from '../types'
import type { AppLanguage } from '../i18n'
import { sessionTypeLabel } from '../i18n'
import { jsPDF } from 'jspdf'

export interface SessionExportData {
  session: Session
  clubName?: string
  techniques: { technique: Technique; notes?: string }[]
  givenTaps: { techniqueName: string }[]
  receivedTaps: { techniqueName: string }[]
}

interface ExportLabels {
  title: string
  date: string
  duration: string
  minutes: string
  type: string
  club: string
  energy: string
  techniques: string
  taps: string
  given: string
  received: string
  notes: string
  none: string
}

const LABELS: Record<AppLanguage, ExportLabels> = {
  en: {
    title: 'BJJ Dojo — Session Summary',
    date: 'Date',
    duration: 'Duration',
    minutes: 'min',
    type: 'Type',
    club: 'Club',
    energy: 'Energy',
    techniques: 'Techniques practiced',
    taps: 'Taps / Submissions',
    given: 'Given',
    received: 'Received',
    notes: 'Notes',
    none: 'None',
  },
  es: {
    title: 'BJJ Dojo — Resumen de sesión',
    date: 'Fecha',
    duration: 'Duración',
    minutes: 'min',
    type: 'Tipo',
    club: 'Academia',
    energy: 'Energía',
    techniques: 'Técnicas practicadas',
    taps: 'Sumisiones',
    given: 'Aplicadas',
    received: 'Recibidas',
    notes: 'Notas',
    none: 'Ninguna',
  },
  fr: {
    title: 'BJJ Dojo — Résumé de session',
    date: 'Date',
    duration: 'Durée',
    minutes: 'min',
    type: 'Type',
    club: 'Club',
    energy: 'Énergie',
    techniques: 'Techniques travaillées',
    taps: 'Soumissions',
    given: 'Réussies',
    received: 'Subies',
    notes: 'Notes',
    none: 'Aucune',
  },
}

function formatDate(epoch: number, locale?: string) {
  return new Date(epoch).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function buildSessionText(
  data: SessionExportData,
  language: AppLanguage,
  locale?: string,
): string {
  const L = LABELS[language]
  const { session, clubName, techniques, givenTaps, receivedTaps } = data
  const typeLabel = sessionTypeLabel(
    session.sessionType,
    SESSION_TYPE_LABELS[session.sessionType],
    language,
  )

  const lines: string[] = []
  lines.push(L.title)
  lines.push('='.repeat(L.title.length))
  lines.push('')
  lines.push(`${L.date}: ${formatDate(session.date, locale)}`)
  lines.push(`${L.duration}: ${session.durationMinutes} ${L.minutes}`)
  lines.push(`${L.type}: ${typeLabel}`)
  if (clubName) lines.push(`${L.club}: ${clubName}`)
  lines.push(`${L.energy}: ${session.energyLevel}/5`)
  lines.push('')

  lines.push(`${L.techniques}:`)
  if (techniques.length === 0) {
    lines.push(`  — ${L.none}`)
  } else {
    for (const { technique, notes } of techniques) {
      lines.push(`  • ${technique.name}`)
      if (notes) {
        for (const noteLine of notes.split('\n')) {
          lines.push(`      ${noteLine}`)
        }
      }
    }
  }
  lines.push('')

  if (givenTaps.length > 0 || receivedTaps.length > 0) {
    lines.push(`${L.taps}:`)
    if (givenTaps.length > 0) {
      lines.push(`  ${L.given} (${givenTaps.length}):`)
      for (const t of givenTaps) lines.push(`    • ${t.techniqueName}`)
    }
    if (receivedTaps.length > 0) {
      lines.push(`  ${L.received} (${receivedTaps.length}):`)
      for (const t of receivedTaps) lines.push(`    • ${t.techniqueName}`)
    }
    lines.push('')
  }

  if (session.notes && session.notes.trim()) {
    lines.push(`${L.notes}:`)
    for (const noteLine of session.notes.split('\n')) {
      lines.push(`  ${noteLine}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildSessionHtml(
  data: SessionExportData,
  language: AppLanguage,
  locale?: string,
): string {
  const L = LABELS[language]
  const { session, clubName, techniques, givenTaps, receivedTaps } = data
  const typeLabel = sessionTypeLabel(
    session.sessionType,
    SESSION_TYPE_LABELS[session.sessionType],
    language,
  )
  const dateText = formatDate(session.date, locale)

  const techList =
    techniques.length === 0
      ? `<p><em>${escapeHtml(L.none)}</em></p>`
      : `<ul>${techniques
          .map(({ technique, notes }) => {
            const noteHtml = notes
              ? `<div style="color:#555;font-size:0.9em;white-space:pre-wrap;margin-top:2px">${escapeHtml(notes)}</div>`
              : ''
            return `<li>${escapeHtml(technique.name)}${noteHtml}</li>`
          })
          .join('')}</ul>`

  const tapsSection =
    givenTaps.length > 0 || receivedTaps.length > 0
      ? `
        <h2>${escapeHtml(L.taps)}</h2>
        ${
          givenTaps.length > 0
            ? `
          <h3>${escapeHtml(L.given)} (${givenTaps.length})</h3>
          <ul>${givenTaps.map((t) => `<li>${escapeHtml(t.techniqueName)}</li>`).join('')}</ul>
        `
            : ''
        }
        ${
          receivedTaps.length > 0
            ? `
          <h3>${escapeHtml(L.received)} (${receivedTaps.length})</h3>
          <ul>${receivedTaps.map((t) => `<li>${escapeHtml(t.techniqueName)}</li>`).join('')}</ul>
        `
            : ''
        }
      `
      : ''

  const notesSection =
    session.notes && session.notes.trim()
      ? `<h2>${escapeHtml(L.notes)}</h2><p style="white-space:pre-wrap">${escapeHtml(session.notes)}</p>`
      : ''

  const clubLine = clubName
    ? `<p><strong>${escapeHtml(L.club)}:</strong> ${escapeHtml(clubName)}</p>`
    : ''

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(L.title)} — ${escapeHtml(dateText)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #222; line-height: 1.5; }
  h1 { border-bottom: 2px solid #c5a253; padding-bottom: 0.3rem; }
  h2 { margin-top: 1.5rem; color: #8a6a1d; }
  h3 { margin-top: 0.8rem; color: #555; font-size: 1em; }
  ul { padding-left: 1.2rem; }
  .meta { color: #555; margin: 0.3rem 0; }
</style>
</head>
<body>
  <h1>${escapeHtml(L.title)}</h1>
  <p class="meta"><strong>${escapeHtml(L.date)}:</strong> ${escapeHtml(dateText)}</p>
  <p class="meta"><strong>${escapeHtml(L.duration)}:</strong> ${session.durationMinutes} ${escapeHtml(L.minutes)}</p>
  <p class="meta"><strong>${escapeHtml(L.type)}:</strong> ${escapeHtml(typeLabel)}</p>
  ${clubLine}
  <p class="meta"><strong>${escapeHtml(L.energy)}:</strong> ${session.energyLevel}/5</p>
  <h2>${escapeHtml(L.techniques)}</h2>
  ${techList}
  ${tapsSection}
  ${notesSection}
</body>
</html>
`
}

function fileBaseName(session: Session): string {
  const d = new Date(session.date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `bjj-session-${yyyy}-${mm}-${dd}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface ExportResult {
  method: 'share' | 'download'
}

export async function exportSession(
  data: SessionExportData,
  language: AppLanguage,
  locale: string | undefined,
): Promise<ExportResult> {
  const text = buildSessionText(data, language, locale)
  const html = buildSessionHtml(data, language, locale)
  const base = fileBaseName(data.session)
  const title = LABELS[language].title

  const nav = typeof navigator !== 'undefined' ? navigator : undefined

  if (
    nav &&
    typeof nav.canShare === 'function' &&
    typeof nav.share === 'function'
  ) {
    try {
      const file = new File([text], `${base}.txt`, { type: 'text/plain' })
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text })
        return { method: 'share' }
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError')
        return { method: 'share' }
    }
  }

  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ title, text })
      return { method: 'share' }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError')
        return { method: 'share' }
    }
  }

  downloadBlob(
    new Blob([html], { type: 'text/html;charset=utf-8' }),
    `${base}.html`,
  )
  return { method: 'download' }
}

// --- Social media sharing --------------------------------------------------

interface CaptionLabels {
  session: (duration: number, type: string) => string
  at: string
  drilled: string
  taps: (count: number) => string
  hashtags: string
}

const CAPTION_LABELS: Record<AppLanguage, CaptionLabels> = {
  en: {
    session: (d, t) => `🥋 ${d} min ${t} session`,
    at: 'at',
    drilled: 'Drilled',
    taps: (c) => `${c} ${c === 1 ? 'submission' : 'submissions'} landed 🔥`,
    hashtags: '#bjj #jiujitsu #grappling #bjjdojo',
  },
  es: {
    session: (d, t) => `🥋 Sesión de ${t} de ${d} min`,
    at: 'en',
    drilled: 'Técnicas',
    taps: (c) =>
      `${c} ${c === 1 ? 'sumisión aplicada' : 'sumisiones aplicadas'} 🔥`,
    hashtags: '#bjj #jiujitsu #grappling #bjjdojo',
  },
  fr: {
    session: (d, t) => `🥋 Session ${t} de ${d} min`,
    at: 'à',
    drilled: 'Travaillé',
    taps: (c) =>
      `${c} ${c === 1 ? 'soumission réussie' : 'soumissions réussies'} 🔥`,
    hashtags: '#bjj #jiujitsu #grappling #bjjdojo',
  },
}

/** Builds a short, punchy caption suited to a social media post. */
export function buildShareCaption(
  data: SessionExportData,
  language: AppLanguage,
): string {
  const C = CAPTION_LABELS[language] ?? CAPTION_LABELS.en
  const { session, clubName, techniques, givenTaps } = data
  const typeLabel = sessionTypeLabel(
    session.sessionType,
    SESSION_TYPE_LABELS[session.sessionType],
    language,
  )

  const lines: string[] = []
  let header = C.session(session.durationMinutes, typeLabel)
  if (clubName) header += ` ${C.at} ${clubName}`
  lines.push(header)

  if (techniques.length > 0) {
    const names = techniques.map((t) => t.technique.name)
    const shown = names.slice(0, 3)
    const extra = names.length - shown.length
    let techLine = `${C.drilled}: ${shown.join(', ')}`
    if (extra > 0) techLine += ` +${extra}`
    lines.push(techLine)
  }

  if (givenTaps.length > 0) lines.push(C.taps(givenTaps.length))

  lines.push('')
  lines.push(C.hashtags)
  return lines.join('\n')
}

export interface ImageShareResult {
  method: 'share' | 'download'
}

/**
 * Shares the rendered PNG via the Web Share API (which surfaces WhatsApp,
 * Instagram, X, etc. on mobile). Falls back to a direct download.
 */
export async function shareSessionImage(
  blob: Blob,
  session: Session,
  caption: string,
  language: AppLanguage,
): Promise<ImageShareResult> {
  const filename = `${fileBaseName(session)}.png`
  const title = LABELS[language].title
  const nav = typeof navigator !== 'undefined' ? navigator : undefined

  if (
    nav &&
    typeof nav.canShare === 'function' &&
    typeof nav.share === 'function'
  ) {
    try {
      const file = new File([blob], filename, { type: 'image/png' })
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text: caption })
        return { method: 'share' }
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError')
        return { method: 'share' }
    }
  }

  downloadBlob(blob, filename)
  return { method: 'download' }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(blob)
  })
}

async function getImageSize(
  blob: Blob,
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob)
      const size = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return size
    } catch {
      // Fall through to <img> loader.
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () =>
        resolve({
          width: img.naturalWidth || 1080,
          height: img.naturalHeight || 1080,
        })
      img.onerror = () => reject(new Error('Could not load image size'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Creates and downloads a one-page PDF containing the rendered session PNG.
 */
export async function downloadSessionPdf(
  blob: Blob,
  session: Session,
): Promise<void> {
  const [{ width, height }, imageDataUrl] = await Promise.all([
    getImageSize(blob),
    blobToDataUrl(blob),
  ])
  const orientation = width >= height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  })
  pdf.addImage(imageDataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST')
  pdf.save(`${fileBaseName(session)}.pdf`)
}
