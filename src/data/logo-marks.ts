// Curated Deriva logo marks. Each style is defined once as an SVG string and
// reused for: the in-app header logo (<img src=data-url>), the dynamic PWA
// manifest icon, and the browser favicon — so what you pick is what installs.

export type LogoStyleId = "classic" | "nothing" | "opone"

export const LOGO_STYLES: { id: LogoStyleId; name: string; body: string }[] = [
  { id: "classic", name: "Classic", body: "Moss cipher on your focus color" },
  { id: "nothing", name: "Nothing", body: "Dot-matrix D on black glass" },
  { id: "opone", name: "OP-1", body: "Thin-line D, instrument orange" },
]

// Nothing mark: 6×7 dot-matrix "D" on black glass.
const NOTHING_DOTS_GRID = [
  "#####.",
  "#....#",
  "#....#",
  "#....#",
  "#....#",
  "#....#",
  "#####.",
]

function nothingMarkSvg(): string {
  const cols = NOTHING_DOTS_GRID[0].length
  const rows = NOTHING_DOTS_GRID.length
  const cell = 56
  const dot = 34
  const gridW = cols * cell
  const gridH = rows * cell
  const pad = (512 - Math.max(gridW, gridH)) / 2
  const dots: string[] = []
  NOTHING_DOTS_GRID.forEach((row, y) => {
    row.split("").forEach((cellChar, x) => {
      if (cellChar !== "#") return
      dots.push(`<circle cx="${pad + x * cell + cell / 2}" cy="${pad + y * cell + cell / 2}" r="${dot / 2}" fill="#F4F3EF"/>`)
    })
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0A0A0B"/><g opacity=".16">${Array.from({ length: 7 }, (_, i) => `<circle cx="${64 + i * 64}" cy="${64 + i * 64}" r="5" fill="#F4F3EF"/><circle cx="${448 - i * 64}" cy="${64 + i * 64}" r="5" fill="#F4F3EF"/>`).join("")}</g>${dots.join("")}</svg>`
}

function oponeMarkSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#E9E7DE"/><g fill="none" stroke="#191813" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><path d="M148 128h116a128 128 0 0 1 0 256H148z"/><path d="M148 384h216"/></g><circle cx="368" cy="160" r="26" fill="#E04A00"/></svg>`
}

const MARK_BUILDERS: Record<LogoStyleId, () => string> = {
  classic: () => "",
  nothing: nothingMarkSvg,
  opone: oponeMarkSvg,
}

const DATA_URL_CACHE = new Map<LogoStyleId, string>()

export function logoStyleDataUrl(style: LogoStyleId): string | null {
  if (style === "classic") return null
  let cached = DATA_URL_CACHE.get(style)
  if (!cached) {
    cached = `data:image/svg+xml;utf8,${encodeURIComponent(MARK_BUILDERS[style]())}`
    DATA_URL_CACHE.set(style, cached)
  }
  return cached
}
