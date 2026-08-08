import { loadAppNotifications } from "@/persistence/app-notifications"
import { recentlySentDesktopReminder, rememberDesktopReminder } from "@/persistence/desktop-reminder"

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
}

export async function requestDesktopNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.requestPermission()
}

export async function showReturnReminder() {
  if (getNotificationPermission() !== "granted" || recentlySentDesktopReminder()) return false

  const next = loadAppNotifications()[0]
  if (!next) return false
  rememberDesktopReminder()

  const title = "Your next move is waiting"
  const options: NotificationOptions = {
    body: `${next.title}. ${next.body}`,
    icon: "/icons/icon-192.png",
    tag: "deriva-next-move",
    data: { href: next.href },
  }

  try {
    // Use the service worker when installed so the notification survives the tab.
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
      return true
    }

    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      window.location.assign(next.href)
    }
    return true
  } catch {
    return false
  }
}
