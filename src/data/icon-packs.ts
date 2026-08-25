// Icon pack system — app icons are independent of the color theme.
// Packs are inspired by distinct industrial design languages:
//  - classic: Deriva's native symbol set
//  - nothing: Nothing (London) — dot-industrial, mono type labels, signal red
//  - teenage: Teenage Engineering — numbered modules, warm grey + orange

export type IconPackId = "classic" | "nothing" | "teenage"

export const ICON_PACKS: { id: IconPackId; name: string; desc: string; themeHint?: string }[] = [
  { id: "classic", name: "Classic", desc: "Deriva's native symbols. Colorful, friendly." },
  { id: "nothing", name: "Nothing", desc: "Dot-industrial mono labels on black. Signal red.", themeHint: "Pairs with the Nothing theme" },
  { id: "teenage", name: "OP-1", desc: "Numbered modules on warm grey. Instrument orange.", themeHint: "Pairs with the OP-1 theme" },
]

const NOTHING_CODES: Record<string, string> = {
  daily: "DAI", review: "REV", contest: "CON", interview: "INT",
  practice: "DRL", icpc: "ICP", atlas: "ATL", cheatsheets: "CHE",
  playground: "PLY", complexity: "CPX", notebook: "NBK",
  toolkit: "TLK", tasks: "TSK", focus: "FCS", habits: "HBT",
  vault: "VLT", weather: "WTH", images: "IMG", qr: "QRC", whiteboard: "WBD",
  expenses: "EXP", calendar: "CAL", translate: "TRN",
  "ai-ml": "AIM", design: "DSN", lld: "LLD", expedition: "EPD", games: "GMS",
  observatory: "OBS", dashboard: "PRG", android: "AND", releases: "REL", settings: "SET", store: "CTR",
}

const TE_ORDER = [
  "daily", "review", "contest", "interview",
  "practice", "icpc", "atlas", "cheatsheets",
  "playground", "complexity", "notebook",
  "toolkit", "tasks", "focus", "habits",
  "vault", "weather", "images", "qr", "whiteboard", "expenses", "calendar", "translate",
  "ai-ml", "design", "lld", "expedition", "games",
  "observatory", "dashboard", "android", "releases", "settings", "store",
]

export function teCodeFor(id: string): string {
  const index = TE_ORDER.indexOf(id)
  return index >= 0 ? String(index + 1).padStart(2, "0") : "--"
}

// Returns the glyph for a pack, or undefined to let the caller use its own.
export function glyphFor(id: string, pack: IconPackId): string | undefined {
  if (pack === "nothing") return NOTHING_CODES[id] ?? id.slice(0, 3).toUpperCase()
  if (pack === "teenage") return teCodeFor(id)
  return undefined
}

export function currentIconPack(): IconPackId {
  if (typeof document === "undefined") return "classic"
  const value = document.documentElement.dataset.icons
  return value === "nothing" || value === "teenage" ? value : "classic"
}
