"use client"

import { useEffect, useState } from "react"
import { applyPreferences, defaultPreferences, loadPreferences, savePreferences, type Preferences, type ThemePreference } from "@/persistence/preferences"

const themes: { value: ThemePreference; title: string; body: string }[] = [
  { value: "system", title: "System", body: "Follow your phone's appearance." },
  { value: "light", title: "Paper", body: "The calm reading surface." },
  { value: "dark", title: "Ink", body: "A low-light workbench." },
]

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default")

  useEffect(() => {
    setPreferences(loadPreferences())
    setNotificationPermission("Notification" in window ? Notification.permission : "unsupported")
  }, [])
  const update = (next: Preferences) => { setPreferences(next); savePreferences(next); applyPreferences(next) }
  const enableNotifications = async () => {
    if (!("Notification" in window)) return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === "granted") new Notification("Deriva is ready", { body: "Your next move is waiting in the notification center." })
  }

  return (
    <main className="settings-page">
      <section className="settings-intro"><span>DERIVA / SETTINGS</span><h1>Make the workspace yours.</h1><p>Preferences stay on this device and never change the learning path.</p></section>

      <section className="settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <div className="theme-options">
          {themes.map(theme => <button key={theme.value} className={`theme-option${preferences.theme === theme.value ? " selected" : ""}`} onClick={() => update({ ...preferences, theme: theme.value })}><strong>{theme.title}</strong><span>{theme.body}</span></button>)}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="comfort-heading">
        <h2 id="comfort-heading">Comfort</h2>
        <PreferenceRow label="Larger learning text" description="Increase reading comfort for explanations and prompts." checked={preferences.textScale === "large"} onChange={checked => update({ ...preferences, textScale: checked ? "large" : "standard" })} />
        <PreferenceRow label="Reduce motion" description="Use instant transitions and quiet state changes." checked={preferences.reducedMotion} onChange={checked => update({ ...preferences, reducedMotion: checked })} />
        <PreferenceRow label="Show keyboard hints" description="Keep desktop shortcuts visible when a keyboard is connected." checked={preferences.keyboardHints} onChange={checked => update({ ...preferences, keyboardHints: checked })} />
      </section>

      <section className="settings-section" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>
        <div className="notification-setting"><div><strong>Next-move reminders</strong><p>The in-app notification center always works. Optional browser notifications can remind you when you return to Deriva.</p></div><button className="btn-ghost" onClick={enableNotifications} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}>{notificationPermission === "granted" ? "Enabled" : notificationPermission === "unsupported" ? "Unavailable" : "Enable"}</button></div>
      </section>

      <section className="settings-note"><strong>Learning preference</strong><p>Deriva keeps progress calm: no streaks, points, or urgency. Your record is the patterns you can derive again.</p></section>
    </main>
  )
}

function PreferenceRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="preference-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /></label>
}
