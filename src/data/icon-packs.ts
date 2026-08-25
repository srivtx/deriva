// Icon pack system — app icons are independent of the color theme.
//  - classic: Deriva's native symbol glyphs
//  - nothing: dot-matrix bitmaps (Nothing's Ndot/Glyph language) — 7×7 grids,
//    '#' = lit dot. Rendered by <PackIcon> as a physical dot grid.
//  - teenage: Teenage Engineering instrument pictograms — thin-line SVG paths
//    drawn on a 24×24 grid, stroke-only, like OP-1 / Pocket Operator panels.

export type IconPackId = "classic" | "nothing" | "teenage" | "personal"

export const ICON_PACKS: { id: IconPackId; name: string; desc: string; themeHint?: string }[] = [
  { id: "classic", name: "Classic", desc: "Deriva's native symbols. Colorful, friendly." },
  { id: "nothing", name: "Nothing", desc: "Dot-matrix glyphs on black glass. Signal red.", themeHint: "Pairs with the Nothing theme" },
  { id: "teenage", name: "OP-1", desc: "Thin-line instrument pictograms. Warm grey + orange.", themeHint: "Pairs with the OP-1 theme" },
  { id: "personal", name: "Personal", desc: "Your own dot glyphs, drawn in the Glyph Studio.", themeHint: "Draw them in Settings → Glyph Studio" },
]

// ── Nothing: 7×7 dot-matrix bitmaps ────────────────────────────────
export const NOTHING_DOTS: Record<string, string[]> = {
  daily: ["#..#..#", ".#.#.#.", "..###..", ".#####.", "..###..", ".#.#.#.", "#..#..#"],
  review: [".####..", "#....#.", "......#", ".#####.", "#......", "#....#.", "..####."],
  contest: ["..###..", "...#...", "..###..", ".#...#.", ".#...#.", "..###..", "...#..."],
  interview: ["..###..", ".#####.", ".#####.", ".#####.", "..###..", "...#...", ".##.##."],
  practice: ["#......", "##.....", ".###...", ".####..", ".###...", "##.....", "#......"],
  icpc: ["#......", "######.", "######.", "######.", "#......", "#......", "#......"],
  atlas: ["..###..", ".#...#.", "#.....#", "###.###", "#.....#", ".#...#.", "..###.."],
  cheatsheets: ["#..###.", "#..###.", ".......", "#..###.", "#..###.", ".......", "#..###."],
  playground: ["#......", ".#.....", "..#....", "...#...", "..#....", ".#.....", "#.....#"],
  complexity: ["..#..#.", ".#..#..", "#....#.", "......#", "#....#.", ".#..#..", "..#..#."],
  notebook: ["....###", "...####", "..###..", ".###...", "###....", "##.....", "#......"],
  toolkit: [".......", ".##..##", ".##..##", ".......", ".##..##", ".##..##", "......."],
  tasks: [".#####.", "#.....#", "#....#.", "#...#..", "#.#.#..", "#.....#", ".#####."],
  focus: ["...#...", "..###..", ".#####.", ".#####.", ".#####.", "..###..", "...#..."],
  habits: ["..####.", ".#...#.", "......#", ".#####.", "#......", "#....#.", ".####.."],
  vault: ["..###..", ".#...#.", ".#...#.", ".#####.", "#######", "###.###", ".#####."],
  weather: ["...##..", "..####.", ".######", "#######", ".######", "..####.", "......."],
  images: ["#######", "#.....#", "#.#...#", "#..#..#", "#...#.#", "#.....#", "#######"],
  qr: ["###.##.", "#.#.#.#", "###.##.", ".......", "###..##", "#.#..#.", "###..##"],
  whiteboard: ["#######", "#..#..#", "#.###.#", "#######", "...#...", "...#...", "..###.."],
  expenses: [".#####.", "#.....#", "#.....#", ".#####.", "#.....#", "#.....#", ".#####."],
  calendar: [".#####.", "#######", "#.#.#.#", "#.....#", "#..##.#", "#.....#", ".#####."],
  translate: ["..###..", ".#.#.#.", "#..#..#", "###.###", "#..#..#", ".#.#.#.", "..###.."],
  "ai-ml": ["#..#..#", ".#####.", "#.###.#", "#.###.#", "#.###.#", ".#####.", "#..#..#"],
  design: ["...#...", "..###..", ".#####.", "...#...", "..###..", ".#####.", "...#..."],
  lld: ["...#...", "..###..", ".#####.", "#######", ".#####.", "..###..", "...#..."],
  expedition: ["...#...", "..##..#", ".####.#", "########", "#.....#", "..###..", ".#####."],
  games: [".......", "##...##", "#######", "##.#.##", "#######", "##...##", "......."],
  observatory: ["..###..", ".#...#.", "#..#..#", "#.##..#", "#..#..#", ".#...#.", "..###.."],
  dashboard: ["......#", "....#.#", "....#.#", "..#.#.#", "..#.#.#", "#.#.#.#", "#.#.#.#"],
  android: ["...#...", "..###..", ".#####.", ".##.##.", ".#####.", "..###..", ".##.##."],
  releases: ["...#...", "..#.#..", "#..#..#", "..###..", "#..#..#", "..#.#..", "...#..."],
  settings: ["#..#..#", ".#####.", "#.#.#.#", "##...##", "#.#.#.#", ".#####.", "#..#..#"],
  store: ["..###..", ".#...#.", ".#####.", "#######", "#######", "#######", ".#####."],
  home: [".......", "..###..", ".#####.", "#######", ".#####.", "..###..", "......."],
  more: [".......", ".......", ".......", ".#.#.#.", ".......", ".......", "......."],
  patterns: ["...#...", "..#.#..", ".#...#.", "#.....#", ".#...#.", "..#.#..", "...#..."],
}

// ── Teenage Engineering: thin-line pictograms (24×24 stroke paths) ──
export const TEENAGE_PATHS: Record<string, string> = {
  daily: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1",
  review: "M21 12a9 9 0 1 1-3.2-6.9M18 2.5V7h-4.5",
  contest: "M12 7V4M9 3.5h6M17 14a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM12 11.5V14l2 1.5",
  interview: "M10 3h4a2.5 2.5 0 0 1 2.5 2.5V10a4.5 4.5 0 0 1-9 0V5.5A2.5 2.5 0 0 1 10 3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6",
  practice: "M8 5.5l10.5 6.5L8 18.5z",
  icpc: "M6 21V4M6 5h11l-3 4 3 4H6",
  atlas: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 14.5c1.5 2 5.4 3 9.5 3s8-1 9.5-3M2.5 9.5c1.5-2 5.4-3 9.5-3s8 1 9.5 3",
  cheatsheets: "M4 6h16M4 12h16M4 18h10",
  playground: "M8 6l-5 6 5 6M16 6l5 6-5 6M13.5 20h6",
  complexity: "M4 20V4M4 20h16M6.5 17.5c4.5 0 3.5-10 11-10.5",
  notebook: "M7 3h11a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 18 21H7zM3.5 7H7M3.5 12H7M3.5 17H7M10.5 8h5",
  toolkit: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  tasks: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM8.5 12l2.8 2.8L16.5 9",
  focus: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM12 8v4.5l3 2",
  habits: "M4 12a8 8 0 0 1 13.6-5.7M20 12a8 8 0 0 1-13.6 5.7M17.5 2.5v4h-4M6.5 21.5v-4h4",
  vault: "M8 10.5V7a4 4 0 0 1 8 0v3.5M5.5 10.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM12 14v2.5",
  weather: "M7.5 18.5a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.7 12a3.25 3.25 0 0 1-.45 6.47zM17.5 4.5v1M21 8h-1M20 4l-.8.8",
  images: "M3.5 5.5h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM8 10.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zM20.5 16l-5-5-8.5 8",
  qr: "M3.5 3.5h6v6h-6zM14.5 3.5h6v6h-6zM3.5 14.5h6v6h-6zM14.5 14.5h2.5v2.5h-2.5zM20.5 17.5v3h-3M6 6h1v1H6zM17 6h1v1h-1zM6 17h1v1H6z",
  whiteboard: "M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM12 16v3.5M8.5 21l1.8-3.5M15.5 21l-1.8-3.5M7 10c1.7-1.8 3.3 1.8 5 0s3.3 1.8 5 0",
  expenses: "M12 3c3.9 0 7 1.3 7 3s-3.1 3-7 3-7-1.3-7-3 3.1-3 7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3",
  calendar: "M4.5 5.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1zM3 10h18M8 3v4M16 3v4M8 14h2.5M14 14h2.5",
  translate: "M3 5h9v7H8.5L6 14.5V12H3zM12.5 9.5H21v7h-2.5v3l-3-3h-3M5.5 7.5h4M7.5 7.5V7M6 7.5c.5 2 1.8 3.2 3.5 4M15 12c.3 1.8 1.5 3 3.5 3.7M17 12c-.3 1.8-1.5 3-3.5 3.7",
  "ai-ml": "M8 8h8v8H8zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.5 5.5l1.5 1.5M18.5 5.5L17 7M5.5 18.5L7 17M18.5 18.5L17 17",
  design: "M12 3l8.5 4.75L12 12.5 3.5 7.75zM3.5 12.25L12 17l8.5-4.75M3.5 16.75L12 21.5l8.5-4.75",
  lld: "M12 2.5l8 9.5-8 9.5-8-9.5zM4 12h16",
  expedition: "M2.5 20L9 8.5l4 7 2.5-4 6 8.5zM8 20l1-1.8M22 20h-2",
  games: "M7 8h10a5 5 0 0 1 5 5v1.5a3.5 3.5 0 0 1-6.3 2.1L14.5 15h-5l-1.2 1.6A3.5 3.5 0 0 1 2 14.5V13a5 5 0 0 1 5-5zM7.5 11v3M6 12.5h3M15.5 11.2h.01M18 13.2h.01",
  observatory: "M12 4a8 8 0 0 1 8 8v8H4v-8a8 8 0 0 1 8-8zM4 16h16M12 12l3.5 3.5M12 8.5v.01",
  dashboard: "M5 20v-7M10 20V5M15 20v-9M20 20V9",
  android: "M5 15a7 7 0 0 1 14 0v2.5H5zM8.5 5.5L7 3M15.5 5.5L17 3M8.5 11.5v.01M15.5 11.5v.01",
  releases: "M12 3.5l1.9 4.9 4.9 1.9-4.9 1.9L12 17.1l-1.9-4.9L5.2 10.3l4.9-1.9zM18.5 15.5v4M16.5 17.5h4",
  settings: "M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19",
  store: "M6 8h12l-1.2 12.5H7.2zM9 8V6.5a3 3 0 0 1 6 0V8",
  home: "M4 11l8-7 8 7M6.5 9.5V20h11V9.5M10 20v-5.5h4V20",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  patterns: "M12 3l7 9-7 9-7-9zM8.5 12h7",
}

export function currentIconPack(): IconPackId {
  if (typeof document === "undefined") return "classic"
  const value = document.documentElement.dataset.icons
  return value === "nothing" || value === "teenage" || value === "personal" ? value : "classic"
}

// ── Personal pack: user-drawn bitmaps (Glyph Studio) ────────────────
const PERSONAL_DOTS: Record<string, string[]> = {}

export function sanitizePersonalDots(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {}
  const out: Record<string, string> = {}
  for (const [id, packed] of Object.entries(value as Record<string, unknown>)) {
    if (typeof packed !== "string") continue
    const rows = packed.split("/").filter(row => /^[.#]*$/.test(row) && row.length > 0)
    if (rows.length === 7 && rows.every(row => row.length === 7)) out[id] = rows.join("/")
  }
  return out
}

export function setPersonalDots(packed: Record<string, string>) {
  for (const key of Object.keys(PERSONAL_DOTS)) delete PERSONAL_DOTS[key]
  for (const [id, packedRows] of Object.entries(packed)) {
    PERSONAL_DOTS[id] = packedRows.split("/")
  }
}

export function getPersonalDots(id: string): string[] | undefined {
  return PERSONAL_DOTS[id]
}
