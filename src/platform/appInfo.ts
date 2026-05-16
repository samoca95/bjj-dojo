import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

declare const __APP_VERSION__: string

export async function getAppVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo()
      return info.version
    } catch {
      return __APP_VERSION__
    }
  }
  return __APP_VERSION__
}
