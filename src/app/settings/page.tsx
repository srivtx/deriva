"use client"

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Link from "next/link"
import { applyPreferences, defaultPreferences, loadPreferences, savePreferences, type AccentPreference, type DensityPreference, type Preferences, type ShapePreference, type TexturePreference, type ThemePreference, type TypePreference } from "@/persistence/preferences"
import { ICON_PACKS } from "@/data/icon-packs"
import PackIcon from "@/components/pack-icon"
import NavSlotIcon from "@/components/nav-slot-icon"
import { NAV_ITEMS, NAV_ITEM_MAP, NAV_MAX_SLOTS, DEFAULT_NAV_SLOTS } from "@/data/nav-items"
import { NAV_VARIANTS } from "@/data/nav-icons"
import { LOGO_STYLES } from "@/data/logo-marks"
import { getNotificationPermission, requestDesktopNotifications } from "@/notifications/desktop-reminder"
import { canPromptPwaInstall, promptPwaInstall } from "@/components/pwa-branding"
import Logo from "@/components/logo"
import { downloadWorkspace, importWorkspace, eraseWorkspace } from "@/persistence/data-transfer"

const themes: { value: ThemePreference; title: string; body: string; swatch: string }[] = [
  { value: "moss", title: "Moss", body: "Grounded, green, and clear.", swatch: "#2F8F5B" },
  { value: "system", title: "System", body: "Follow your device.", swatch: "linear-gradient(135deg, #FAF9F6 50%, #14161A 50%)" },
  { value: "paper", title: "Paper", body: "Warm, quiet, editorial.", swatch: "#FAF9F6" },
  { value: "ink", title: "Ink", body: "Low-light workbench.", swatch: "#1C1F24" },
  { value: "ocean", title: "Ocean", body: "Cool sea-air focus.", swatch: "#1E6FA8" },
  { value: "carbon", title: "Carbon", body: "Neutral graphite night.", swatch: "#1E2125" },
  { value: "violet", title: "Violet", body: "Night study, vivid focus.", swatch: "#B79CFF" },
  { value: "sunset", title: "Sunset", body: "Warm studio light.", swatch: "#B55335" },
  { value: "nothing", title: "Nothing", body: "Dot-industrial black. Signal red.", swatch: "#E02020" },
  { value: "opone", title: "OP-1", body: "Teenage Engineering warm grey + orange.", swatch: "#E04A00" },
  { value: "swiss", title: "Swiss", body: "International white, grid red.", swatch: "#D92B2B" },
  { value: "nord", title: "Nord", body: "Frost-blue polar night.", swatch: "#88C0D0" },
  { value: "solarized", title: "Solarized", body: "Classic terminal teal.", swatch: "#2AA198" },
  { value: "braun", title: "Braun", body: "Rams functional grey, mustard dial.", swatch: "#C08A00" },
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
  { value: "dotmatrix", title: "Dot Matrix", body: "Nothing-style Doto headlines" },
  { value: "instrument", title: "Instrument", body: "Space Grotesk, hardware panel feel" },
]

const THEME_PREVIEW: Record<string, { bg: string; panel: string; ink: string; soft: string; line: string }> = {
  paper: { bg: "#F2F4EC", panel: "#FBFBF7", ink: "#1A1D21", soft: "#5C6470", line: "#DCE0D4" },
  ink: { bg: "#14171B", panel: "#1D2126", ink: "#EDEDE8", soft: "#9AA3AD", line: "#2C3138" },
  moss: { bg: "#EAF1E6", panel: "#FAFCF8", ink: "#16281D", soft: "#54685C", line: "#CFDFD0" },
  ocean: { bg: "#E3EEF7", panel: "#F8FBFE", ink: "#0E2237", soft: "#50697F", line: "#C6DAEA" },
  carbon: { bg: "#16181C", panel: "#202329", ink: "#E8EAF0", soft: "#98A0AE", line: "#2E333C" },
  violet: { bg: "#171225", panel: "#211A31", ink: "#EFECF7", soft: "#A79BC4", line: "#332A49" },
  sunset: { bg: "#FBEFDD", panel: "#FFFAF2", ink: "#3A2410", soft: "#8A6A48", line: "#EDD9BC" },
  nothing: { bg: "#0A0A0B", panel: "#141416", ink: "#F4F3EF", soft: "#8E8E93", line: "#27272A" },
  opone: { bg: "#E9E7DE", panel: "#F6F4EB", ink: "#191813", soft: "#6D6A5D", line: "#D2CFC0" },
  swiss: { bg: "#F1F0ED", panel: "#FFFFFF", ink: "#111114", soft: "#55555C", line: "#DEDDD8" },
  nord: { bg: "#2E3440", panel: "#3B4252", ink: "#ECEFF4", soft: "#AEB8C6", line: "#434C5E" },
  solarized: { bg: "#002B36", panel: "#073642", ink: "#D5DCCE", soft: "#839496", line: "#12586A" },
  braun: { bg: "#E6E5E0", panel: "#F4F3EF", ink: "#17171B", soft: "#6E6E74", line: "#CFCFC8" },
}

const PRESET_ACCENTS: Record<string, string> = { cobalt: "#2E5AAC", ember: "#C2481F", violet: "#7C5CD6", mint: "#2F8F5B", gold: "#B8860B" }

const VOICE_FONT: Record<string, string> = {
  technical: "var(--font-ui)",
  editorial: '"Newsreader", Georgia, serif',
  humanist: 'Georgia, "Times New Roman", serif',
  dotmatrix: '"Doto", monospace',
  instrument: '"Space Grotesk", var(--font-ui)',
}

const presets: { title: string; body: string; values: Partial<Preferences> }[] = [
  { title: "Moss Technical", body: "Green, precise, instrument-like", values: { theme: "moss", accent: "mint", type: "technical", density: "focused", shape: "precise", texture: "grid" } },
  { title: "Nothing Dark", body: "Black, signal red, dot-industrial", values: { theme: "nothing", iconPack: "nothing", type: "technical", density: "focused", shape: "precise", texture: "grid" } },
  { title: "OP-1 Studio", body: "Warm grey, instrument orange, numbered", values: { theme: "opone", iconPack: "teenage", type: "technical", density: "calm", shape: "soft", texture: "plain" } },
  { title: "Deriva Classic", body: "Paper, cobalt, editorial", values: { theme: "paper", accent: "cobalt", type: "editorial", density: "calm", shape: "soft", texture: "plain" } },
  { title: "Field Notes", body: "Moss, mint, textured", values: { theme: "moss", accent: "mint", type: "humanist", density: "calm", shape: "soft", texture: "grid" } },
  { title: "Night Lab", body: "Violet, precise, focused", values: { theme: "violet", accent: "violet", type: "technical", density: "focused", shape: "precise", texture: "grid" } },
  { title: "Sunset Studio", body: "Warm, compact, vivid", values: { theme: "sunset", accent: "ember", type: "editorial", density: "compact", shape: "soft", texture: "plain" } },
  { title: "Braun Werk", body: "Rams grey, mustard dial, functional", values: { theme: "braun", accent: "gold", type: "instrument", density: "focused", shape: "precise", texture: "plain" } },
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

const iconSamples = [
  { id: "daily", glyph: "☀", gradient: "linear-gradient(135deg, #2F8F5B, #1E6B45)" },
  { id: "practice", glyph: "▶", gradient: "linear-gradient(135deg, #2E5AAC, #1D3D7A)" },
  { id: "vault", glyph: "⚿", gradient: "linear-gradient(135deg, #5C6470, #434A55)" },
  { id: "weather", glyph: "⛅", gradient: "linear-gradient(135deg, #0891B2, #056680)" },
  { id: "store", glyph: "❖", gradient: "linear-gradient(135deg, #DB2777, #A31D58)" },
]

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default")
  const [dataMessage, setDataMessage] = useState("")
  const logoInput = useRef<HTMLInputElement>(null)
  const dragNav = useRef<{ id: string; pointerId: number } | null>(null)
  const [navDragging, setNavDragging] = useState<string | null>(null)

  const beginNavDrag = (event: ReactPointerEvent, id: string) => {
    dragNav.current = { id, pointerId: event.pointerId }
    setNavDragging(id)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onNavDragMove = (event: ReactPointerEvent) => {
    const drag = dragNav.current
    if (!drag) return
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-nav-slot]")?.getAttribute("data-nav-slot")
    if (target && target !== drag.id) reorderNavSlots(drag.id, target)
  }
  const endNavDrag = () => {
    dragNav.current = null
    setNavDragging(null)
  }

  useEffect(() => {
    setPreferences(loadPreferences())
    setNotificationPermission(getNotificationPermission())
  }, [])
  const update = (next: Preferences) => { setPreferences(next); savePreferences(next); applyPreferences(next) }
  const toggleNavSlot = (id: string) => {
    const on = preferences.navSlots.includes(id)
    if (!on && preferences.navSlots.length >= NAV_MAX_SLOTS) return
    const next = on ? preferences.navSlots.filter(slot => slot !== id) : [...preferences.navSlots, id]
    update({ ...preferences, navSlots: next.length ? next : DEFAULT_NAV_SLOTS })
  }
  const dropKey = (record: Record<string, string> | undefined, key: string): Record<string, string> => {
    const next = { ...(record ?? {}) }
    delete next[key]
    return next
  }
  const moveNavSlot = (id: string, direction: -1 | 1) => {
    const slots = [...preferences.navSlots]
    const index = slots.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= slots.length) return
    ;[slots[index], slots[target]] = [slots[target], slots[index]]
    update({ ...preferences, navSlots: slots })
  }
  const reorderNavSlots = (from: string, to: string) => {
    if (from === to) return
    const slots = [...preferences.navSlots]
    const fromIndex = slots.indexOf(from)
    const toIndex = slots.indexOf(to)
    if (fromIndex < 0 || toIndex < 0) return
    slots.splice(fromIndex, 1)
    slots.splice(toIndex, 0, from)
    if ("vibrate" in navigator) navigator.vibrate(6)
    update({ ...preferences, navSlots: slots })
  }
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
        update({ ...preferences, logoStyle: "custom", logoDataUrl: canvas.toDataURL("image/png") })
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  }
  const resetIdentity = () => update({ ...preferences, brandName: defaultPreferences.brandName, tagline: defaultPreferences.tagline, logoMark: defaultPreferences.logoMark, logoStyle: defaultPreferences.logoStyle, logoDataUrl: undefined })
  const applyPreset = (values: Partial<Preferences>) => update({ ...preferences, ...values })
  const resetAll = () => update({ ...defaultPreferences })
  const handleExport = () => {
    downloadWorkspace()
    setDataMessage("Backup downloaded. Keep it somewhere safe — it holds every trace of your workspace.")
  }
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    try {
      const restored = await importWorkspace(file)
      setDataMessage(`Restored ${restored} data keys. Reloading…`)
      setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "Import failed.")
    }
  }
  const handleErase = () => {
    if (!window.confirm("Erase every trace of Deriva on this device? Export a backup first — this cannot be undone.")) return
    eraseWorkspace()
    window.location.reload()
  }

  return (
    <main className="settings-page">
      <section className="settings-intro"><div className="settings-intro-line"><span>{preferences.brandName.toUpperCase()} / SETTINGS</span><button type="button" className="settings-reset" onClick={resetAll}>Reset all</button></div><h1>Make the workspace yours.</h1><p>{preferences.tagline} Preferences stay on this device and never change the learning path.</p></section>

      <section className="settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>
        <div className="theme-options theme-options-expanded">
          {themes.map(theme => <button type="button" key={theme.value} className={`theme-option${preferences.theme === theme.value ? " selected" : ""}`} onClick={() => update({ ...preferences, theme: theme.value })}><i style={{ background: theme.swatch }} /><strong>{theme.title}</strong><span>{theme.body}</span></button>)}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="nav-heading">
        <div className="settings-section-head"><h2 id="nav-heading">Navigation bar</h2><button type="button" className="settings-reset" onClick={() => update({ ...preferences, navSlots: ["home", "learn", "patterns", "observe"] })}>Reset bar</button></div>
        <p className="settings-hint">Choose up to four slots — “More” always closes the row. Icons follow your icon pack.</p>
        <div className="chip-row" role="group" aria-label="Navigation slots">
          {NAV_ITEMS.map(item => {
            const on = preferences.navSlots.includes(item.id)
            return (
              <button key={item.id} type="button" aria-pressed={on} className={`app-chip${on ? " active" : ""}`} onClick={() => toggleNavSlot(item.id)}>
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="nav-slot-preview" aria-hidden="true">
          {[...preferences.navSlots, "more"].map(id => {
            const label = id === "more" ? "More" : NAV_ITEM_MAP[id]?.label ?? id
            return (
              <span
                key={id}
                className={`nav-slot-cell${navDragging === id ? " dragging" : ""}`}
                {...(id === "more" ? {} : {
                  "data-nav-slot": id,
                  onPointerDown: event => beginNavDrag(event as React.PointerEvent, id),
                  onPointerMove: onNavDragMove,
                  onPointerUp: endNavDrag,
                  onLostPointerCapture: endNavDrag,
                })}
              >
                <NavSlotIcon itemId={id} variantId={preferences.navIcons?.[id]} autoPack={preferences.iconPack} size={20} />
                {label}
                {id !== "more" && (
                  <span className="nav-slot-nudge">
                    <button type="button" tabIndex={-1} aria-label={`Move ${label} left`} onClick={() => moveNavSlot(id, -1)}>‹</button>
                    <button type="button" tabIndex={-1} aria-label={`Move ${label} right`} onClick={() => moveNavSlot(id, 1)}>›</button>
                  </span>
                )}
              </span>
            )
          })}
        </div>
        <div className="nav-style-list">
          {[...preferences.navSlots, "more"].map(id => {
            const label = id === "more" ? "More" : NAV_ITEM_MAP[id]?.label ?? id
            const current = preferences.navIcons?.[id]
            return (
              <div key={id} className="nav-style-row">
                <span className="nav-style-label">{label}</span>
                <div className="nav-style-options" role="group" aria-label={`${label} icon style`}>
                  <button type="button" className={`nav-style-tile${!current ? " selected" : ""}`} onClick={() => update({ ...preferences, navIcons: dropKey(preferences.navIcons, id) })}>
                    <NavSlotIcon itemId={id} autoPack={preferences.iconPack} size={20} />
                    <small>Auto</small>
                  </button>
                  {(NAV_VARIANTS[id] ?? []).map(variant => (
                    <button key={variant.id} type="button" className={`nav-style-tile${current === variant.id ? " selected" : ""}`} onClick={() => update({ ...preferences, navIcons: { ...preferences.navIcons, [id]: variant.id } })}>
                      <NavSlotIcon itemId={id} variantId={variant.id} autoPack={preferences.iconPack} size={20} />
                      <small>{variant.name}</small>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="icons-heading">
        <h2 id="icons-heading">Icon pack</h2>
        <p className="settings-hint">App icons are independent of your theme — pair any pack with any palette and switch anytime.</p>
        <div className="icon-pack-grid">
          {ICON_PACKS.map(pack => (
            <button key={pack.id} type="button" className={`icon-pack-card${preferences.iconPack === pack.id ? " selected" : ""}`} onClick={() => update({ ...preferences, iconPack: pack.id })}>
              <strong>{pack.name}</strong>
              <span>{pack.desc}</span>
              <div className="icon-pack-preview" data-icons={pack.id} aria-hidden="true">
                {iconSamples.map(sample => (
                  <span key={sample.id} className="app-tile-icon" style={{ background: sample.gradient }}>
                    <PackIcon id={sample.id} fallback={sample.glyph} pack={pack.id} />
                  </span>
                ))}
              </div>
              {pack.themeHint && <small>{pack.themeHint}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="presets-heading">
        <h2 id="presets-heading">Curated atmospheres</h2>
        <div className="style-presets">
          {presets.map(preset => {
            const theme = THEME_PREVIEW[preset.values.theme ?? "paper"] ?? THEME_PREVIEW.paper
            const accent = preset.values.accent === "custom" ? "#E04A00" : PRESET_ACCENTS[preset.values.accent ?? "mint"] ?? PRESET_ACCENTS.mint
            const radius = preset.values.shape === "precise" ? 5 : 11
            return (
              <button type="button" key={preset.title} className="style-preset" onClick={() => applyPreset(preset.values)}>
                <span className="preset-mini" style={{ background: theme.bg, borderColor: theme.line, borderRadius: radius + 4 }} aria-hidden="true">
                  <span className="preset-mini-bar" style={{ background: theme.panel, borderBottomColor: theme.line, borderRadius: radius }} />
                  <span className="preset-mini-title" style={{ color: theme.ink, fontFamily: VOICE_FONT[preset.values.type ?? "technical"] }}>Derive</span>
                  <span className="preset-mini-line" style={{ background: theme.soft, opacity: .55 }} />
                  <span className="preset-mini-line short" style={{ background: theme.soft, opacity: .4 }} />
                  <span className="preset-mini-cta" style={{ background: accent, borderRadius: Math.max(3, radius - 3) }} />
                  {preset.values.texture === "grid" && <span className="preset-mini-grid" style={{ borderColor: theme.line }} />}
                  {(preset.values.iconPack === "nothing") && <span className="preset-mini-dots" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <b key={i} />)}</span>}
                </span>
                <strong>{preset.title}</strong>
                <small>{preset.body}</small>
              </button>
            )
          })}
        </div>
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
        <div className="logo-controls"><div className="settings-field"><span>Logo image</span><button type="button" className="btn-ghost" onClick={() => logoInput.current?.click()}>Upload image</button><input ref={logoInput} className="visually-hidden-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={event => { const file = event.target.files?.[0]; if (file) readLogo(file); event.currentTarget.value = "" }} /><small>PNG, JPG, WEBP, or SVG under 240 KB. An uploaded image overrides the styles below.</small></div></div>
        <div className="logo-style-grid" role="group" aria-label="App logo mark">
          {LOGO_STYLES.map(style => (
            <button key={style.id} type="button" className={`logo-style-card${preferences.logoStyle === style.id && !preferences.logoDataUrl ? " selected" : ""}`} onClick={() => update({ ...preferences, logoStyle: style.id, logoDataUrl: undefined })}>
              <Logo size={44} label={preferences.brandName} style={style.id} />
              <strong>{style.name}</strong>
              <small>{style.body}</small>
              <span className="logo-style-note">Header · favicon · installed app icon</span>
            </button>
          ))}
        </div>
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
        <div className="segmented-row">
          <span><strong>Learning text size</strong><small>Scales the entire workspace, instantly.</small></span>
          <div className="segmented" role="group" aria-label="Learning text size">
            {(["standard", "large", "xlarge"] as const).map(size => (
              <button key={size} type="button" className={preferences.textScale === size ? "selected" : ""} onClick={() => update({ ...preferences, textScale: size })}>{size === "standard" ? "A" : size === "large" ? "A+" : "A++"}</button>
            ))}
          </div>
        </div>
        <PreferenceRow label="Reduce motion" description="Use instant transitions and quiet state changes." checked={preferences.reducedMotion} onChange={checked => update({ ...preferences, reducedMotion: checked })} />
        <PreferenceRow label="Show keyboard hints" description="Keep desktop shortcuts visible when a keyboard is connected." checked={preferences.keyboardHints} onChange={checked => update({ ...preferences, keyboardHints: checked })} />
      </section>

      <section className="settings-section" aria-labelledby="data-heading">
        <h2 id="data-heading">Your data</h2>
        <p className="data-intro">Everything lives on this device — nothing is uploaded. Export a backup file, restore it in any browser, or erase the workspace completely.</p>
        <div className="data-actions">
          <button type="button" className="btn-primary data-export" onClick={handleExport}>Export backup (.json)</button>
          <label className="data-import">
            Import backup
            <input type="file" accept="application/json,.json" onChange={handleImport} aria-label="Import backup file" />
          </label>
          <button type="button" className="btn-danger" onClick={handleErase}>Erase all data</button>
        </div>
        {dataMessage && <p className="data-message" role="status">{dataMessage}</p>}
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
  return <Logo size={52} label={preferences.brandName} mark={preferences.logoMark} imageUrl={preferences.logoDataUrl} style={preferences.logoStyle} />
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
