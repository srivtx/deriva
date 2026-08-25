import { sanitizeNavSlots } from "@/data/nav-items"
import { sanitizeNavIcons } from "@/data/nav-icons"
import { sanitizePersonalDots, setPersonalDots } from "@/data/icon-packs"

export type ThemePreference = "system" | "paper" | "ink" | "moss" | "ocean" | "carbon" | "violet" | "sunset" | "nothing" | "opone" | "swiss" | "nord" | "solarized" | "braun"
export type AccentPreference = "cobalt" | "ember" | "violet" | "mint" | "gold" | "custom"
export type TypePreference = "editorial" | "technical" | "humanist" | "dotmatrix" | "instrument"
export type DensityPreference = "calm" | "focused" | "compact"
export type ShapePreference = "soft" | "precise"
export type TexturePreference = "plain" | "grid"
export type IconPackPreference = "classic" | "nothing" | "teenage" | "personal"

export type Preferences = {
  theme: ThemePreference
  accent: AccentPreference
  customAccent: string
  type: TypePreference
  density: DensityPreference
  shape: ShapePreference
  texture: TexturePreference
  iconPack: IconPackPreference
  navSlots: string[]
  navIcons: Record<string, string>
  personalDots: Record<string, string>
  reducedMotion: boolean
  textScale: "standard" | "large" | "xlarge"
  keyboardHints: boolean
  brandName: string
  tagline: string
  logoMark: string
  logoStyle: "classic" | "nothing" | "opone" | "custom"
  logoDataUrl?: string
}

const key = "deriva-preferences-v2"
const legacyKey = "deriva-preferences-v1"
export const defaultPreferences: Preferences = {
  theme: "moss",
  accent: "mint",
  customAccent: "#2F8F5B",
  type: "technical",
  density: "calm",
  shape: "soft",
  texture: "plain",
  iconPack: "classic",
  navSlots: ["home", "learn", "patterns", "observe"],
  navIcons: {},
  personalDots: {},
  reducedMotion: false,
  textScale: "standard",
  keyboardHints: true,
  brandName: "Deriva",
  tagline: "Derive the algorithm.",
  logoMark: "m",
  logoStyle: "classic",
}

const THEME_VALUES = new Set<ThemePreference>(["system", "paper", "ink", "moss", "ocean", "carbon", "violet", "sunset", "nothing", "opone", "swiss", "nord", "solarized", "braun"])
const ACCENT_VALUES = new Set<AccentPreference>(["cobalt", "ember", "violet", "mint", "gold", "custom"])
const TYPE_VALUES = new Set<TypePreference>(["editorial", "technical", "humanist", "dotmatrix", "instrument"])
const DENSITY_VALUES = new Set<DensityPreference>(["calm", "focused", "compact"])
const SHAPE_VALUES = new Set<ShapePreference>(["soft", "precise"])
const TEXTURE_VALUES = new Set<TexturePreference>(["plain", "grid"])
const ICON_VALUES = new Set<IconPackPreference>(["classic", "nothing", "teenage", "personal"])

function hex(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function shortText(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback
}

function isLegacyBaseline(value: unknown) {
  if (!value || typeof value !== "object") return false
  const raw = value as Record<string, unknown>
  return raw.theme === "system" && raw.accent === "cobalt" && raw.customAccent === "#2E5AAC" && raw.type === "editorial" && raw.density === "calm" && raw.shape === "soft" && raw.texture === "plain" && raw.reducedMotion === false && raw.textScale === "standard" && raw.keyboardHints === true && raw.brandName === "Deriva" && raw.tagline === "Derive the algorithm." && raw.logoMark === "d" && !raw.logoDataUrl
}

function normalize(value: unknown): Preferences {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const legacyTheme = raw.theme === "light" ? "paper" : raw.theme === "dark" ? "ink" : raw.theme
  return {
    ...defaultPreferences,
    ...raw,
    theme: THEME_VALUES.has(legacyTheme as ThemePreference) ? legacyTheme as ThemePreference : defaultPreferences.theme,
    accent: ACCENT_VALUES.has(raw.accent as AccentPreference) ? raw.accent as AccentPreference : defaultPreferences.accent,
    customAccent: hex(raw.customAccent, defaultPreferences.customAccent),
    type: TYPE_VALUES.has(raw.type as TypePreference) ? raw.type as TypePreference : defaultPreferences.type,
    density: DENSITY_VALUES.has(raw.density as DensityPreference) ? raw.density as DensityPreference : defaultPreferences.density,
    shape: SHAPE_VALUES.has(raw.shape as ShapePreference) ? raw.shape as ShapePreference : defaultPreferences.shape,
    texture: TEXTURE_VALUES.has(raw.texture as TexturePreference) ? raw.texture as TexturePreference : defaultPreferences.texture,
    iconPack: ICON_VALUES.has(raw.iconPack as IconPackPreference) ? raw.iconPack as IconPackPreference : defaultPreferences.iconPack,
    navSlots: sanitizeNavSlots(raw.navSlots),
    navIcons: sanitizeNavIcons(raw.navIcons),
    personalDots: sanitizePersonalDots(raw.personalDots),
    reducedMotion: raw.reducedMotion === true,
    textScale: raw.textScale === "large" || raw.textScale === "xlarge" ? raw.textScale : "standard",
    keyboardHints: raw.keyboardHints !== false,
    brandName: shortText(raw.brandName, defaultPreferences.brandName, 28),
    tagline: shortText(raw.tagline, defaultPreferences.tagline, 80),
    logoMark: shortText(raw.logoMark, defaultPreferences.logoMark, 2),
    logoStyle: raw.logoStyle === "nothing" || raw.logoStyle === "opone" || raw.logoStyle === "custom" ? raw.logoStyle : "classic",
    logoDataUrl: typeof raw.logoDataUrl === "string" && raw.logoDataUrl.startsWith("data:image/") && raw.logoDataUrl.length < 120_000 ? raw.logoDataUrl : undefined,
  }
}

let prefsCache: { raw: string; parsed: Preferences } | null = null

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences
  try {
    const current = localStorage.getItem(key) ?? localStorage.getItem(legacyKey)
    if (!current) return defaultPreferences
    if (prefsCache && prefsCache.raw === current) return prefsCache.parsed
    let stored: unknown
    try { stored = JSON.parse(current) } catch { stored = {} }
    const parsed = isLegacyBaseline(stored as Record<string, unknown>) ? defaultPreferences : normalize(stored)
    prefsCache = { raw: current, parsed }
    return parsed
  } catch { return defaultPreferences }
}

export function savePreferences(preferences: Preferences) {
  const next = normalize(preferences)
  try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("deriva-preferences-change", { detail: next }))
}

export function applyPreferences(preferences: Preferences) {
  const root = document.documentElement
  root.dataset.theme = preferences.theme
  root.dataset.accent = preferences.accent
  root.dataset.type = preferences.type
  root.dataset.density = preferences.density
  root.dataset.shape = preferences.shape
  root.dataset.texture = preferences.texture
  root.dataset.icons = preferences.iconPack
  root.dataset.textScale = preferences.textScale
  root.dataset.motion = preferences.reducedMotion ? "reduce" : "full"
  setPersonalDots(preferences.personalDots)
  if (preferences.accent === "custom") root.style.setProperty("--accent", hex(preferences.customAccent, defaultPreferences.customAccent))
  else root.style.removeProperty("--accent")
  root.style.setProperty("--accent-soft", "color-mix(in srgb, var(--accent) 13%, var(--paper-raised))")
}
