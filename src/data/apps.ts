// Central app catalog for the launcher, the More menu, and the App Store.
// `id` matches the key used to track install/uninstall state.

export type AppStatus = "installed" | "available" | "soon"

export interface AppMeta {
  id: string
  name: string
  glyph: string
  gradient: string
  desc: string
  category: string
  href?: string
  status: AppStatus
}

const G = {
  green: "linear-gradient(135deg, #2F8F5B, #1E6B45)",
  cobalt: "linear-gradient(135deg, #2E5AAC, #1D3D7A)",
  violet: "linear-gradient(135deg, #7655B8, #55398F)",
  ember: "linear-gradient(135deg, #B55335, #8C3A24)",
  gold: "linear-gradient(135deg, #B07C24, #855C17)",
  teal: "linear-gradient(135deg, #2B8063, #1D5C46)",
  slate: "linear-gradient(135deg, #5C6470, #434A55)",
  pink: "linear-gradient(135deg, #DB2777, #A31D58)",
  dark: "linear-gradient(135deg, #1E2922, #0F1512)",
  sky: "linear-gradient(135deg, #0891B2, #056680)",
  ghost: "linear-gradient(135deg, #4B4B5E, #14141C)",
  osc: "linear-gradient(135deg, #3A3A46, #10101A)",
  wine: "linear-gradient(135deg, #A0305A, #6E1F3E)",
  lake: "linear-gradient(135deg, #1F6F8B, #123F52)",
  ultron: "linear-gradient(135deg, #6D28D9, #3B0E7E)",
  pdb: "linear-gradient(135deg, #B45309, #7C2D12)",
}

export const APP_CATALOG: AppMeta[] = [
  // Today
  { id: "daily", name: "Daily", glyph: "☀", gradient: G.green, desc: "Today's curated challenge", category: "Today", href: "/daily", status: "installed" },
  { id: "review", name: "Review", glyph: "↻", gradient: G.violet, desc: "Spaced repetition queue", category: "Today", href: "/review", status: "installed" },
  { id: "contest", name: "Contest", glyph: "⏱", gradient: G.ember, desc: "3 problems, one clock", category: "Today", href: "/contest", status: "installed" },
  { id: "interview", name: "Interview", glyph: "◉", gradient: G.cobalt, desc: "Mock interview, hints locked", category: "Today", href: "/interview", status: "installed" },
  // Practice
  { id: "practice", name: "Drill", glyph: "▶", gradient: G.cobalt, desc: "Code practice by topic", category: "Practice", href: "/practice", status: "installed" },
  { id: "icpc", name: "ICPC", glyph: "⚑", gradient: G.green, desc: "91 contest problems", category: "Practice", href: "/icpc", status: "installed" },
  { id: "one", name: "0NE", glyph: "⊙", gradient: G.violet, desc: "148 problems, zero to mastery", category: "Practice", href: "/one", status: "installed" },
  { id: "pdb", name: "PDB", glyph: "⌖", gradient: G.pdb, desc: "41 debugging drills, red to green", category: "Practice", href: "/pdb", status: "installed" },
  { id: "atlas", name: "Atlas", glyph: "◎", gradient: G.sky, desc: "Watch algorithms move", category: "Practice", href: "/atlas", status: "installed" },
  { id: "cheatsheets", name: "Cheatsheets", glyph: "≡", gradient: G.gold, desc: "Contest templates", category: "Practice", href: "/cheatsheets", status: "installed" },
  // Build
  { id: "playground", name: "Playground", glyph: "❯_", gradient: G.dark, desc: "Free Python sandbox", category: "Build", href: "/playground", status: "installed" },
  { id: "complexity", name: "Big-O Lab", glyph: "∿", gradient: G.violet, desc: "Measure complexity", category: "Build", href: "/complexity", status: "installed" },
  { id: "notebook", name: "Notebook", glyph: "✎", gradient: G.gold, desc: "All your notes", category: "Build", href: "/notebook", status: "installed" },
  // Life
  { id: "toolkit", name: "Toolkit", glyph: "▦", gradient: G.teal, desc: "Tasks · focus · habits", category: "Life", href: "/toolkit", status: "installed" },
  { id: "tasks", name: "Tasks", glyph: "☑", gradient: G.teal, desc: "Today's todo list", category: "Life", href: "/toolkit?tool=tasks", status: "installed" },
  { id: "focus", name: "Focus", glyph: "◔", gradient: G.ember, desc: "Pomodoro timer", category: "Life", href: "/toolkit?tool=focus", status: "installed" },
  { id: "habits", name: "Habits", glyph: "☾", gradient: G.green, desc: "Daily streaks without pressure", category: "Life", href: "/toolkit?tool=habits", status: "installed" },
  { id: "vault", name: "Password Vault", glyph: "⚿", gradient: G.slate, desc: "Encrypted, on-device secrets", category: "Life", href: "/vault", status: "installed" },
  { id: "weather", name: "Weather", glyph: "⛅", gradient: G.sky, desc: "Forecast, where you are", category: "Life", href: "/weather", status: "installed" },
  { id: "images", name: "Image Tools", glyph: "◳", gradient: G.pink, desc: "Compress · resize · convert", category: "Life", href: "/images", status: "installed" },
  { id: "qr", name: "QR Tools", glyph: "⊞", gradient: G.violet, desc: "Generate & scan codes", category: "Life", href: "/qr", status: "installed" },
  { id: "whiteboard", name: "Whiteboard", glyph: "✏", gradient: G.gold, desc: "Sketch & share ideas", category: "Life", href: "/whiteboard", status: "installed" },
  { id: "expenses", name: "Expense Tracker", glyph: "₿", gradient: G.teal, desc: "Budget & spending", category: "Life", href: "/expenses", status: "installed" },
  { id: "calendar", name: "Calendar", glyph: "◷", gradient: G.ember, desc: "Events & reminders", category: "Life", href: "/calendar", status: "installed" },
  { id: "translate", name: "Translator", glyph: "⇄", gradient: G.violet, desc: "Text translation", category: "Life", href: "/translate", status: "installed" },
  // Explore
  { id: "ai-ml", name: "AI/ML", glyph: "✳", gradient: G.violet, desc: "Labs + 180 questions", category: "Explore", href: "/ai-ml", status: "installed" },
  { id: "design", name: "Design", glyph: "▣", gradient: G.cobalt, desc: "System design problems", category: "Explore", href: "/design", status: "installed" },
    { id: "lld", name: "LLD", glyph: "◇", gradient: G.teal, desc: "55 design problems, SOLID to concurrency", category: "Explore", href: "/lld", status: "installed" },
    { id: "db", name: "DB", glyph: "⌗", gradient: G.lake, desc: "50 problems, SELECT to transactions", category: "Explore", href: "/db", status: "installed" },
    { id: "ultron", name: "Ultron", glyph: "⊛", gradient: G.ultron, desc: "60 AI/ML drills, loss to backprop", category: "Explore", href: "/ultron", status: "installed" },
  { id: "expedition", name: "Expedition", glyph: "△", gradient: G.ember, desc: "Retrieve & transfer ideas", category: "Explore", href: "/expedition", status: "installed" },
  { id: "res", name: "RES", glyph: "∴", gradient: G.wine, desc: "Research brainstorm trainer", category: "Explore", href: "/res", status: "installed" },
  { id: "games", name: "Games", glyph: "◆", gradient: G.pink, desc: "Practice through play", category: "Explore", href: "/games", status: "installed" },
  // System
  { id: "observatory", name: "Observatory", glyph: "◌", gradient: G.slate, desc: "Concept map", category: "System", href: "/observatory", status: "installed" },
  { id: "dashboard", name: "Progress", glyph: "▤", gradient: G.slate, desc: "Your history", category: "System", href: "/dashboard", status: "installed" },
  { id: "android", name: "Get app", glyph: "⤓", gradient: G.green, desc: "Install the APK", category: "System", href: "/android", status: "installed" },
  { id: "releases", name: "What's new", glyph: "✦", gradient: G.green, desc: "Release notes", category: "System", href: "/releases", status: "installed" },
  { id: "settings", name: "Settings", glyph: "⚙", gradient: G.slate, desc: "Preferences", category: "System", href: "/settings", status: "installed" },
  { id: "store", name: "App Center", glyph: "❖", gradient: G.cobalt, desc: "Install & manage apps", category: "System", href: "/store", status: "installed" },
  // Studio
  { id: "media", name: "Media Studio", glyph: "◑", gradient: G.ember, desc: "Cut · convert · compress — nothing uploaded", category: "Studio", href: "/media", status: "installed" },
  { id: "glyph", name: "Glyph Studio", glyph: "✺", gradient: G.pink, desc: "Draw dot glyphs, export art", category: "Studio", href: "/glyph", status: "installed" },
  { id: "ghost", name: "Ghost", glyph: "◍", gradient: G.ghost, desc: "Offline AI tutor — lives on your phone", category: "Studio", href: "/ghost", status: "installed" },
  { id: "osc", name: "OSC-1", glyph: "≋", gradient: G.osc, desc: "Pocket synthesizer — beats from thin air", category: "Studio", href: "/osc", status: "installed" },
  { id: "rig", name: "RIG", glyph: "⌘", gradient: G.osc, desc: "Code on your Mac — from anywhere", category: "Studio", href: "/rig", status: "installed" },
  // Coming soon
  { id: "soon-expense", name: "Expense Tracker", glyph: "₿", gradient: G.teal, desc: "Budgets & spending charts", category: "Life", status: "soon" },
  { id: "soon-calendar", name: "Calendar", glyph: "▦", gradient: G.ember, desc: "Events with reminders", category: "Life", status: "soon" },
  { id: "soon-translate", name: "Translator", glyph: "⇄", gradient: G.violet, desc: "Text translation", category: "Life", status: "soon" },
  { id: "soon-rss", name: "RSS Reader", glyph: "⊝", gradient: G.gold, desc: "Follow your feeds", category: "Life", status: "soon" },
  { id: "soon-voice", name: "Voice Memos", glyph: "◠", gradient: G.pink, desc: "Record & replay", category: "Life", status: "soon" },
]

export function appsByCategory(): Record<string, AppMeta[]> {
  const groups: Record<string, AppMeta[]> = {}
  for (const app of APP_CATALOG) {
    if (app.status === "soon") continue
    ;(groups[app.category] ||= []).push(app)
  }
  return groups
}
