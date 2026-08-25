// Bottom navigation bar registry — slots are user-configurable (Settings → Navigation bar).
// Icons resolve through the icon-pack system: classic uses AppIcon strokes when a
// mapping exists, Nothing renders dot-matrix bitmaps, OP-1 renders thin-line paths.

export interface NavItem {
  id: string
  label: string
  href: string
  glyph: string
  classicIcon?: "home" | "practice" | "progress" | "design"
  match: (pathname: string) => boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/", glyph: "⌂", classicIcon: "home", match: p => p === "/" },
  { id: "learn", label: "Learn", href: "/practice", glyph: "▶", classicIcon: "practice", match: p => p === "/practice" || p.startsWith("/topic/") || p.startsWith("/learn/") },
  { id: "patterns", label: "Patterns", href: "/patterns", glyph: "◈", classicIcon: "progress", match: p => p.startsWith("/patterns") },
  { id: "observe", label: "Observe", href: "/observatory", glyph: "◔", classicIcon: "design", match: p => p === "/dashboard" || p === "/observatory" },
  { id: "icpc", label: "ICPC", href: "/icpc", glyph: "⚑", match: p => p.startsWith("/icpc") },
  { id: "atlas", label: "Atlas", href: "/atlas", glyph: "◎", match: p => p.startsWith("/atlas") },
  { id: "toolkit", label: "Toolkit", href: "/toolkit", glyph: "▦", match: p => p.startsWith("/toolkit") },
  { id: "store", label: "Apps", href: "/store", glyph: "❖", match: p => p.startsWith("/store") },
]

export const NAV_MAX_SLOTS = 4

export const DEFAULT_NAV_SLOTS = ["home", "learn", "patterns", "observe"]

const NAV_IDS = new Set(NAV_ITEMS.map(item => item.id))

export function sanitizeNavSlots(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_NAV_SLOTS
  const cleaned = value.filter((id): id is string => typeof id === "string" && NAV_IDS.has(id))
  const unique = [...new Set(cleaned)].slice(0, NAV_MAX_SLOTS)
  return unique.length > 0 ? unique : DEFAULT_NAV_SLOTS
}

export const NAV_ITEM_MAP: Record<string, NavItem> = Object.fromEntries(NAV_ITEMS.map(item => [item.id, item]))
