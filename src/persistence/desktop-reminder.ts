const REMINDER_KEY = "deriva-leave-reminder-v1"
const REMINDER_COOLDOWN = 6 * 60 * 60 * 1000

export function recentlySentDesktopReminder() {
  try {
    const lastSent = Number(localStorage.getItem(REMINDER_KEY) || 0)
    return Date.now() - lastSent < REMINDER_COOLDOWN
  } catch {
    return false
  }
}

export function rememberDesktopReminder() {
  try { localStorage.setItem(REMINDER_KEY, String(Date.now())) } catch {}
}
