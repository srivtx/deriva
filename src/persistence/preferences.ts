export type ThemePreference = "system" | "paper" | "ink" | "moss" | "violet" | "sunset"
export type AccentPreference = "cobalt" | "ember" | "violet" | "mint" | "gold" | "custom"
export type TypePreference = "editorial" | "technical" | "humanist"
export type DensityPreference = "calm" | "focused" | "compact"
export type ShapePreference = "soft" | "precise"
export type TexturePreference = "plain" | "grid"

export type Preferences = {
  theme: ThemePreference
  accent: AccentPreference
  customAccent: string
  type: TypePreference
  density: DensityPreference
  shape: ShapePreference
  texture: TexturePreference
  reducedMotion: boolean
  textScale: "standard" | "large"
  keyboardHints: boolean
  brandName: string
  tagline: string
  logoMark: string
  logoDataUrl?: string
}

const key = "deriva-preferences-v2"
const legacyKey = "deriva-preferences-v1"
export const defaultPreferences: Preferences = {
  theme: "system",
  accent: "cobalt",
  customAccent: "#2E5AAC",
  type: "editorial",
  density: "calm",
  shape: "soft",
  texture: "plain",
  reducedMotion: false,
  textScale: "standard",
  keyboardHints: true,
  brandName: "Deriva",
  tagline: "Derive the algorithm.",
  logoMark: "d",
}

const THEME_VALUES = new Set<ThemePreference>(["system", "paper", "ink", "moss", "violet", "sunset"])
const ACCENT_VALUES = new Set<AccentPreference>(["cobalt", "ember", "violet", "mint", "gold", "custom"])
const TYPE_VALUES = new Set<TypePreference>(["editorial", "technical", "humanist"])
const DENSITY_VALUES = new Set<DensityPreference>(["calm", "focused", "compact"])
const SHAPE_VALUES = new Set<ShapePreference>(["soft", "precise"])
const TEXTURE_VALUES = new Set<TexturePreference>(["plain", "grid"])

function hex(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function shortText(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : fallback
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
    reducedMotion: raw.reducedMotion === true,
    textScale: raw.textScale === "large" ? "large" : "standard",
    keyboardHints: raw.keyboardHints !== false,
    brandName: shortText(raw.brandName, defaultPreferences.brandName, 28),
    tagline: shortText(raw.tagline, defaultPreferences.tagline, 80),
    logoMark: shortText(raw.logoMark, defaultPreferences.logoMark, 2),
    logoDataUrl: typeof raw.logoDataUrl === "string" && raw.logoDataUrl.startsWith("data:image/") && raw.logoDataUrl.length < 350_000 ? raw.logoDataUrl : undefined,
  }
}

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences
  try {
    const current = localStorage.getItem(key)
    const legacy = localStorage.getItem(legacyKey)
    const parse = (value: string | null) => {
      if (!value) return undefined
      try { return JSON.parse(value) } catch { return undefined }
    }
    return normalize(parse(current) ?? parse(legacy) ?? {})
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
  root.dataset.textScale = preferences.textScale
  root.dataset.motion = preferences.reducedMotion ? "reduce" : "full"
  if (preferences.accent === "custom") root.style.setProperty("--accent", hex(preferences.customAccent, defaultPreferences.customAccent))
  else root.style.removeProperty("--accent")
  root.style.setProperty("--accent-soft", "color-mix(in srgb, var(--accent) 13%, var(--paper-raised))")
}
