import { Capacitor } from '@capacitor/core'

export const isNative: boolean = Capacitor.isNativePlatform()
export const platformName: 'web' | 'android' | 'ios' = (() => {
  const p = Capacitor.getPlatform()
  if (p === 'android' || p === 'ios') return p
  return 'web'
})()

export { copyText } from './clipboard'
export { shareFile } from './share'
export {
  requestNotificationPermission,
  scheduleReminder,
  cancelReminder,
} from './notifications'
export { getAppVersion } from './appInfo'
export {
  oauthRequestDeviceCode,
  oauthPollAccessToken,
  isOAuthTransportAvailable,
} from './githubOAuth'
