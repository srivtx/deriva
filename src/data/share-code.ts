// Appearance share codes — compact, versioned, URL-safe. Encoded into QR codes
// by Settings → "Share appearance"; pasted back on another device to adopt.

import { defaultPreferences, type Preferences } from "@/persistence/preferences"

const PREFIX = "deriva-theme:v1:"

const APPEARANCE_KEYS = [
  "theme",
  "accent",
  "customAccent",
  "type",
  "density",
  "shape",
  "texture",
  "iconPack",
  "textScale",
  "reducedMotion",
  "logoStyle",
] as const

export function encodeAppearance(preferences: Preferences): string {
  const payload: Record<string, unknown> = {}
  for (const key of APPEARANCE_KEYS) {
    const value = preferences[key]
    if (value !== defaultPreferences[key]) payload[key] = value
  }
  return PREFIX + btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeAppearance(code: string): Partial<Preferences> | null {
  try {
    const trimmed = code.trim()
    if (!trimmed.startsWith(PREFIX)) return null
    const b64 = trimmed.slice(PREFIX.length).replace(/-/g, "+").replace(/_/g, "/")
    const parsed = JSON.parse(atob(b64)) as Record<string, unknown>
    const out: Partial<Preferences> = {}
    for (const key of APPEARANCE_KEYS) {
      if (key in parsed) (out as Record<string, unknown>)[key] = parsed[key]
    }
    return out
  } catch {
    return null
  }
}
