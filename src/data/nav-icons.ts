// Curated per-slot icon variants for the bottom navigation bar.
// Each slot offers: Auto (follow the global icon pack), Classic (native stroke),
// Dots (Nothing dot-matrix), Line (OP-1 thin-line), Mark (typographic glyph).
import { NOTHING_DOTS, TEENAGE_PATHS, type IconPackId } from "@/data/icon-packs"
import type { AppIconName } from "@/components/app-icon"

export type NavVariantLang = "classic" | "nothing" | "teenage" | "glyph"

export interface NavVariant {
  id: "auto" | "classic" | "dots" | "line" | "mark"
  lang: NavVariantLang
  name: string
  dots?: string[]
  path?: string
  glyph?: string
  classicIcon?: AppIconName
}

function set(itemId: string, classicIcon: AppIconName | undefined, dotsKey: string, lineKey: string, glyph: string): NavVariant[] {
  const variants: NavVariant[] = [{ id: "classic", lang: "classic", name: "Classic", classicIcon }]
  if (NOTHING_DOTS[dotsKey]) variants.push({ id: "dots", lang: "nothing", name: "Dots", dots: NOTHING_DOTS[dotsKey] })
  if (TEENAGE_PATHS[lineKey]) variants.push({ id: "line", lang: "teenage", name: "Line", path: TEENAGE_PATHS[lineKey] })
  variants.push({ id: "mark", lang: "glyph", name: "Mark", glyph })
  return variants
}

export const NAV_VARIANTS: Record<string, NavVariant[]> = {
  home: set("home", "home", "home", "home", "⌂"),
  learn: set("learn", "practice", "practice", "practice", "▶"),
  patterns: set("patterns", "progress", "patterns", "patterns", "◈"),
  observe: set("observe", "design", "observatory", "observatory", "◔"),
  icpc: set("icpc", undefined, "icpc", "icpc", "⚑"),
  atlas: set("atlas", undefined, "atlas", "atlas", "◎"),
  toolkit: set("toolkit", undefined, "toolkit", "toolkit", "▦"),
  store: set("store", undefined, "store", "store", "❖"),
  more: set("more", "more", "more", "more", "⋯"),
}

const VARIANT_IDS = new Set(["classic", "dots", "line", "mark"])

export function sanitizeNavIcons(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {}
  const out: Record<string, string> = {}
  for (const [itemId, variantId] of Object.entries(value as Record<string, unknown>)) {
    if (NAV_VARIANTS[itemId] && typeof variantId === "string" && VARIANT_IDS.has(variantId)) out[itemId] = variantId
  }
  return out
}

export function resolveNavVariant(itemId: string, preference: string | undefined, autoPack: IconPackId): NavVariant {
  const list = NAV_VARIANTS[itemId] ?? []
  const byId = (id: string) => list.find(v => v.id === id)
  if (preference) {
    const chosen = byId(preference)
    if (chosen) return chosen
  }
  if (autoPack === "nothing") return byId("dots") ?? list[0]
  if (autoPack === "teenage") return byId("line") ?? list[0]
  const classic = byId("classic")
  return classic ?? byId("mark") ?? list[0]
}
