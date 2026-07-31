export type ThemePreference = "system" | "light" | "dark"

export type Preferences = {
  theme: ThemePreference
  reducedMotion: boolean
  textScale: "standard" | "large"
  keyboardHints: boolean
}

const key = "deriva-preferences-v1"
export const defaultPreferences: Preferences = { theme: "system", reducedMotion: false, textScale: "standard", keyboardHints: true }

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences
  try { return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(key) || "{}") } } catch { return defaultPreferences }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(key, JSON.stringify(preferences))
}

export function applyPreferences(preferences: Preferences) {
  const root = document.documentElement
  root.dataset.theme = preferences.theme
  root.dataset.textScale = preferences.textScale
  root.dataset.motion = preferences.reducedMotion ? "reduce" : "full"
}
