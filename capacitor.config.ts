import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.bjjdojo.app',
  appName: 'BJJ Dojo',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0a0a0a',
    },
  },
}

export default config
