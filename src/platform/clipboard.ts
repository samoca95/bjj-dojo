import { Capacitor } from '@capacitor/core'
import { Clipboard } from '@capacitor/clipboard'

export async function copyText(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text })
    return
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  throw new Error('Clipboard not available in this environment.')
}
