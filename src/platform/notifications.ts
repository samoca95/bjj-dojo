import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export interface ReminderSchedule {
  id: number
  title: string
  body: string
  /** Hour of day (0-23) for daily reminders. */
  hour: number
  minute: number
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const res = await LocalNotifications.requestPermissions()
    return res.display === 'granted'
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const p = await Notification.requestPermission()
  return p === 'granted'
}

export async function scheduleReminder(r: ReminderSchedule): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: r.id,
          title: r.title,
          body: r.body,
          schedule: {
            on: { hour: r.hour, minute: r.minute },
            allowWhileIdle: true,
            repeats: true,
          },
        },
      ],
    })
    return
  }
  // Web fallback: best-effort timeout while the tab is open.
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const now = new Date()
  const target = new Date()
  target.setHours(r.hour, r.minute, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  const ms = target.getTime() - now.getTime()
  window.setTimeout(() => {
    try {
      new Notification(r.title, { body: r.body })
    } catch {
      // ignore
    }
  }, ms)
}

export async function cancelReminder(id: number): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.cancel({ notifications: [{ id }] })
  }
  // Web: setTimeout fallback is best-effort; nothing to cancel cleanly.
}
