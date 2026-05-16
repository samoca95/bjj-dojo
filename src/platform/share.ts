import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export interface ShareFilePayload {
  filename: string
  blob: Blob
  mimeType: string
  title?: string
  text?: string
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read blob.'))
        return
      }
      // Strip the `data:<mime>;base64,` prefix.
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Read failed.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Save or share a file. On native this writes to the cache and opens the
 * system share sheet. On web this triggers an anchor download (and falls
 * back to navigator.share when the platform supports file sharing).
 */
export async function shareFile(payload: ShareFilePayload): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const data = await blobToBase64(payload.blob)
    const written = await Filesystem.writeFile({
      path: payload.filename,
      data,
      directory: Directory.Cache,
    })
    await Share.share({
      title: payload.title,
      text: payload.text,
      url: written.uri,
      dialogTitle: payload.title,
    })
    return
  }

  // Try native Web Share for files (mobile Safari/Chrome).
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'
  ) {
    try {
      const file = new File([payload.blob], payload.filename, {
        type: payload.mimeType,
      })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: payload.title,
          text: payload.text,
        })
        return
      }
    } catch {
      // fall through to anchor download
    }
  }

  // Fallback: anchor download.
  const url = URL.createObjectURL(payload.blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = payload.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
