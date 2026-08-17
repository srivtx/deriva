"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { applyPreferences, defaultPreferences, loadPreferences, savePreferences, type AccentPreference, type DensityPreference, type Preferences, type ShapePreference, type TexturePreference, type ThemePreference, type TypePreference } from "@/persistence/preferences"
import { getNotificationPermission, requestDesktopNotifications } from "@/notifications/desktop-reminder"
import { canPromptPwaInstall, promptPwaInstall } from "@/components/pwa-branding"
import Logo from "@/components/logo"

const themes: { value: ThemePreference; title: string; body: string; swatch: string }[] = [
  { value: "moss", title: "Moss", body: "Grounded, green, and clear.", swatch: "#2F8F5B" },
  { value: "system", title: "System", body: "Follow your device.", swatch: "linear-gradient(135deg, #FAF9F6 50%, #14161A 50%)" },
  { value: "paper", title: "Paper", body: "Warm, quiet, editorial.", swatch: "#FAF9F6" },
  { value: "ink", title: "Ink", body: "Low-light workbench.", swatch: "#1C1F24" },
  { value: "violet", title: "Violet", body: "Night study, vivid focus.", swatch: "#B79CFF" },
  { value: "sunset", title: "Sunset", body: "Warm studio light.", swatch: "#B55335" },
]

const accents: { value: AccentPreference; title: string; color: string }[] = [
  { value: "cobalt", title: "Cobalt", color: "#2E5AAC" },
  { value: "ember", title: "Ember", color: "#B55335" },
  { value: "violet", title: "Violet", color: "#7655B8" },
  { value: "mint", title: "Moss green", color: "#2F8F5B" },
  { value: "gold", title: "Gold", color: "#A26C19" },
]

const typeVoices: { value: TypePreference; title: string; body: string }[] = [
  { value: "technical", title: "Technical", body: "One precise sans-serif voice" },
  { value: "editorial", title: "Editorial", body: "Newsreader ideas + Inter controls" },
  { value: "humanist", title: "Humanist", body: "Classic reading rhythm" },
]

const presets: { title: string; body: string; values: Partial<Preferences> }[] = [
  { title: "Moss Technical", body: "Green, precise, instrument-like", values: { theme: "moss", accent: "mint", type: "technical", density: "focused", shape: "precise", texture: "grid" } },
  { title: "Deriva Classic", body: "Paper, cobalt, editorial", values: { theme: "paper", accent: "cobalt", type: "editorial", density: "calm", shape: "soft", texture: "plain" } },
  { title: "Field Notes", body: "Moss, mint, textured", values: { theme: "moss", accent: "mint", type: "humanist", density: "calm", shape: "soft", texture: "grid" } },
  { title: "Night Lab", body: "Violet, precise, focused", values: { theme: "violet", accent: "violet", type: "technical", density: "focused", shape: "precise", texture: "grid" } },
  { title: "Sunset Studio", body: "Warm, compact, vivid", values: { theme: "sunset", accent: "ember", type: "editorial", density: "compact", shape: "soft", texture: "plain" } },
]

const densityOptions: { value: DensityPreference; title: string; body: string }[] = [
  { value: "calm", title: "Calm", body: "More air for reading" },
  { value: "focused", title: "Focused", body: "Less travel, same clarity" },
  { value: "compact", title: "Compact", body: "More evidence in view" },
]

const shapeOptions: { value: ShapePreference; title: string; body: string }[] = [
  { value: "soft", title: "Soft", body: "Round surfaces, gentle depth" },
  { value: "precise", title: "Precise", body: "Sharper edges, instrument feel" },
]

const textureOptions: { value: TexturePreference; title: string; body: string }[] = [
  { value: "plain", title: "Plain", body: "Quiet paper" },
  { value: "grid", title: "Grid", body: "Subtle study graph" },
]

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default")
  const logoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreferences(loadPreferences())
    setNotificationPermission(getNotificationPermission())
  }, [])
  const update = (next: Preferences) => { setPreferences(next); savePreferences(next); applyPreferences(next) }
  const enableNotifications = async () => {
    const permission = await requestDesktopNotifications()
    setNotificationPermission(permission)
    if (permission === "granted") new Notification("Leave reminders enabled", { body: "Deriva will remind you about your next move when you leave." })
  }
  const readLogo = (file: File) => {
    if (file.size > 240_000 || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext("2d")
        if (!context) return
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1A1D21"
        context.fillRect(0, 0, 512, 512)
        const scale = Math.min(376 / image.width, 376 / image.height)
        const width = image.width * scale
        const height = image.height * scale
        context.drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height)
        update({ ...preferences, logoDataUrl: canvas.toDataURL("image/png") })
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const resetIdentity = () => update({ ...preferences, brandName: defaultPreferences.brandName, tagline: defaultPreferences.tagline, logoMark: defaultPreferences.logoMark, logoDataUrl: undefined })
  const applyPreset = (values: Partial<Preferences>) => update({ ...preferences, ...values })
  const resetAll = () => update({ ...defaultPreferences })

  return (
    <main className="settings-page">
      <section className="settings-intro"><div className="settings-intro-line"><span>{preferences.brandName.toUpperCase()} / SETTINGS</span><button type="button" className="settings-reset" onClick={resetAll}>Reset all</button></div><h1>Make the workspace yours.</h1><p>{preferences.tagline} Preferences stay on this device and never change the learning path.</p></section>

      <section className="settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <div className="theme-options theme-options-expanded">
          {themes.map(theme => <button type="button" key={theme.value} className={`theme-option${preferences.theme === theme.value ? " selected" : ""}`} onClick={() => update({ ...preferences, theme: theme.value })}><i style={{ background: theme.swatch }} /><strong>{theme.title}</strong><span>{theme.body}</span></button>)}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="presets-heading">
        <h2 id="presets-heading">Curated atmospheres</h2>
        <div className="style-presets">{presets.map(preset => <button type="button" key={preset.title} className="style-preset" onClick={() => applyPreset(preset.values)}><span className="preset-spark" /><strong>{preset.title}</strong><small>{preset.body}</small></button>)}</div>
      </section>

      <section className="settings-section" aria-labelledby="accent-heading">
        <h2 id="accent-heading">Focus color</h2>
        <div className="accent-options">
          {accents.map(accent => <button type="button" key={accent.value} className={`accent-option${preferences.accent === accent.value ? " selected" : ""}`} onClick={() => update({ ...preferences, accent: accent.value })}><i style={{ background: accent.color }} /><span>{accent.title}</span></button>)}
          <label className={`accent-option custom-accent${preferences.accent === "custom" ? " selected" : ""}`}><i style={{ background: preferences.customAccent }} /><span>Custom</span><input type="color" value={preferences.customAccent} onChange={event => update({ ...preferences, accent: "custom", customAccent: event.target.value })} aria-label="Custom focus color" /></label>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="identity-heading">
        <div className="settings-section-head"><h2 id="identity-heading">Workspace identity</h2><button type="button" className="settings-reset" onClick={resetIdentity}>Reset identity</button></div>
        <div className="identity-preview"><div><span className="experiment-kicker">Preview</span><strong>{preferences.brandName}</strong><small>{preferences.tagline}</small></div><div className="identity-logo-preview"><LogoPreview preferences={preferences} /></div></div>
        <label className="settings-field"><span>Workspace name</span><input value={preferences.brandName} maxLength={28} onChange={event => update({ ...preferences, brandName: event.target.value })} /></label>
        <label className="settings-field"><span>Tagline</span><input value={preferences.tagline} maxLength={80} onChange={event => update({ ...preferences, tagline: event.target.value })} /></label>
        <div className="logo-controls"><div className="settings-field"><span>Logo image</span><button type="button" className="btn-ghost" onClick={() => logoInput.current?.click()}>Upload image</button><input ref={logoInput} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={event => { const file = event.target.files?.[0]; if (file) readLogo(file); event.currentTarget.value = "" }} /><small>PNG, JPG, WEBP, or SVG under 240 KB. The moss mark stays as the default.</small></div></div>
        {preferences.logoDataUrl && <button type="button" className="settings-remove-logo" onClick={() => update({ ...preferences, logoDataUrl: undefined })}>Remove uploaded logo</button>}
      </section>

      <section className="settings-section" aria-labelledby="pwa-heading">
        <h2 id="pwa-heading">Phone app icon</h2>
        <PwaInstallStatus logoReady={Boolean(preferences.logoDataUrl)} />
      </section>

      <section className="settings-section" aria-labelledby="type-heading">
        <h2 id="type-heading">Reading voice</h2>
        <div className="type-options">{typeVoices.map(voice => <button type="button" key={voice.value} className={`type-option${preferences.type === voice.value ? " selected" : ""}`} onClick={() => update({ ...preferences, type: voice.value })}><strong>{voice.title}</strong><span>{voice.body}</span></button>)}</div>
      </section>

      <section className="settings-section" aria-labelledby="surface-heading">
        <h2 id="surface-heading">Surface language</h2>
        <ChoiceGroup label="Density" value={preferences.density} options={densityOptions} onChange={density => update({ ...preferences, density })} />
        <ChoiceGroup label="Shape" value={preferences.shape} options={shapeOptions} onChange={shape => update({ ...preferences, shape })} />
        <ChoiceGroup label="Texture" value={preferences.texture} options={textureOptions} onChange={texture => update({ ...preferences, texture })} />
      </section>

      <section className="settings-section" aria-labelledby="preview-heading">
        <h2 id="preview-heading">Live workspace preview</h2>
        <div className="workspace-preview">
          <div className="workspace-preview-bar"><span className="preview-dot" /><b>{preferences.brandName}</b><span>Today&rsquo;s session</span><i>{preferences.theme}</i></div>
          <div className="workspace-preview-body"><div className="preview-copy"><span className="experiment-kicker">Stage 01 / Understand</span><strong>{preferences.tagline}</strong><p>Build the idea first. Let the interface stay quiet until the next useful decision.</p><button type="button" className="preview-action">Continue the derivation →</button></div><div className="preview-instrument"><span>TRACE / READY</span><b>p99 148ms</b><small>your evidence appears here</small></div></div>
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
        <div className="notification-setting"><div><strong>Next-move reminders</strong><p>Allow Deriva to show one quiet reminder when you leave, linked directly to your next useful action. The browser may require permission in its site settings.</p></div><button className="btn-ghost" onClick={enableNotifications} disabled={notificationPermission === "granted" || notificationPermission === "unsupported" || notificationPermission === "denied"}>{notificationPermission === "granted" ? "Enabled" : notificationPermission === "denied" ? "Blocked" : notificationPermission === "unsupported" ? "Unavailable" : "Enable"}</button></div>
      </section>

      <section className="settings-note"><strong>Learning preference</strong><p>Deriva keeps progress calm: no streaks, points, or urgency. Your record is the patterns you can derive again.</p></section>
    </main>
  )
}

function LogoPreview({ preferences }: { preferences: Preferences }) {
  return <Logo size={52} label={preferences.brandName} mark={preferences.logoMark} imageUrl={preferences.logoDataUrl} />
}

function ChoiceGroup<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; title: string; body: string }[]; onChange: (value: T) => void }) {
  return <div className="choice-group"><span className="choice-group-label">{label}</span><div className="choice-group-options">{options.map(option => <button type="button" key={option.value} className={`choice-group-option${value === option.value ? " selected" : ""}`} onClick={() => onChange(option.value)}><strong>{option.title}</strong><small>{option.body}</small></button>)}</div></div>
}

function PwaInstallStatus({ logoReady }: { logoReady: boolean }) {
  const [standalone, setStandalone] = useState(false)
  const [android, setAndroid] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setAndroid(/Android/i.test(navigator.userAgent))
    setCanInstall(canPromptPwaInstall())
    const refresh = () => setCanInstall(canPromptPwaInstall())
    window.addEventListener("deriva-pwa-install-available", refresh)
    window.addEventListener("deriva-pwa-install-complete", refresh)
    return () => { window.removeEventListener("deriva-pwa-install-available", refresh); window.removeEventListener("deriva-pwa-install-complete", refresh) }
  }, [])
  const installPwa = async () => { await promptPwaInstall(); setCanInstall(canPromptPwaInstall()) }
  return <div className="pwa-status-card"><div className={`pwa-status-dot${logoReady || android ? " ready" : ""}`} /><div><strong>{android ? "Bundled icons available" : logoReady ? "Custom icon prepared" : "Default icon active"}</strong><p>{standalone ? "This Android app is already installed. Remove it from the home screen and install again to replace its icon." : android ? "Choose the signed APK page or the browser PWA below." : "New installs use this icon. On iPhone, use Share → Add to Home Screen after uploading."}</p>{android && !standalone && <Link className="btn-primary pwa-install-button" href="/android">Install signed Android app →</Link>}{!standalone && canInstall && <button type="button" className="btn-ghost pwa-install-button" onClick={installPwa}>Install browser PWA</button>}{android && <a className="pwa-native-icon-link" href="deriva://settings/icons">Change app icon in Android app</a>}{!android && <Link className="pwa-download-link" href="/android">Download the signed Android app</Link>}</div></div>
}

function PreferenceRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="preference-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /></label>
}
