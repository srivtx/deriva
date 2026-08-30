"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH } from "@/data/patterns"
import { loadLessonProgress, type LessonProgress } from "@/persistence/lesson-progress"
import { loadPracticeCompletion } from "@/persistence/practice-progress"
import { loadPatternMastery } from "@/persistence/pattern-mastery"
import { getNextActions, type NextAction } from "@/learning/next-actions"
import { loadPreferences, type Preferences } from "@/persistence/preferences"
import { dailyPickForDate, todayKey, loadDailyHistory } from "@/persistence/daily"
import { dueCards, seedQueueFromMastery } from "@/persistence/review-queue"
import ProgressRing from "@/components/progress-ring"
import AppTile from "@/components/app-tile"
import { loadTasks } from "@/persistence/toolkit"
import { loadInstalled } from "@/persistence/app-store"
import { canPromptPwaInstall, promptPwaInstall } from "@/components/pwa-branding"

type HomeMomentum = { practiceDone: number; practiceTotal: number; pathDone: number }
type MasteryMomentum = { recognized: number; transferred: number; review: number }

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
  ultron: "linear-gradient(135deg, #6D28D9, #3B0E7E)",
  pdb: "linear-gradient(135deg, #B45309, #7C2D12)",
}

const APP_SECTIONS = [
  { label: "Today", apps: [
    { id: "daily", href: "/daily", name: "Daily", glyph: "☀", gradient: G.green },
    { id: "review", href: "/review", name: "Review", glyph: "↻", gradient: G.violet },
    { id: "contest", href: "/contest", name: "Contest", glyph: "⏱", gradient: G.ember },
    { id: "interview", href: "/interview", name: "Interview", glyph: "◉", gradient: G.cobalt },
  ] },
  { label: "Practice", apps: [
    { id: "practice", href: "/practice", name: "Drill", glyph: "▶", gradient: G.cobalt },
    { id: "one", href: "/one", name: "0NE", glyph: "⊙", gradient: G.violet },
    { id: "pdb", href: "/pdb", name: "PDB", glyph: "⌖", gradient: G.pdb },
    { id: "icpc", href: "/icpc", name: "ICPC", glyph: "⚑", gradient: G.green },
    { id: "atlas", href: "/atlas", name: "Atlas", glyph: "◎", gradient: G.sky },
    { id: "cheatsheets", href: "/cheatsheets", name: "Cheatsheets", glyph: "≡", gradient: G.gold },
  ] },
  { label: "Build", apps: [
    { id: "playground", href: "/playground", name: "Playground", glyph: "❯_", gradient: G.dark },
    { id: "complexity", href: "/complexity", name: "Big-O Lab", glyph: "∿", gradient: G.violet },
    { id: "notebook", href: "/notebook", name: "Notebook", glyph: "✎", gradient: G.gold },
  ] },
  { label: "Studio", apps: [
    { id: "media", href: "/media", name: "Media Studio", glyph: "◑", gradient: G.ember },
    { id: "glyph", href: "/glyph", name: "Glyph Studio", glyph: "✺", gradient: G.pink },
    { id: "ghost", href: "/ghost", name: "Ghost", glyph: "◍", gradient: "linear-gradient(135deg, #4B4B5E, #14141C)" },
    { id: "osc", href: "/osc", name: "OSC-1", glyph: "≋", gradient: "linear-gradient(135deg, #3A3A46, #10101A)" },
    { id: "rig", href: "/rig", name: "RIG", glyph: "⌘", gradient: "linear-gradient(135deg, #3A3A46, #10101A)" },
  ] },
  { label: "Life", apps: [
    { id: "toolkit", href: "/toolkit", name: "Toolkit", glyph: "▦", gradient: G.teal },
    { id: "tasks", href: "/toolkit?tool=tasks", name: "Tasks", glyph: "☑", gradient: G.teal },
    { id: "focus", href: "/toolkit?tool=focus", name: "Focus", glyph: "◔", gradient: G.ember },
    { id: "habits", href: "/toolkit?tool=habits", name: "Habits", glyph: "☾", gradient: G.green },
    { id: "vault", href: "/vault", name: "Password Vault", glyph: "⚿", gradient: G.slate },
    { id: "weather", href: "/weather", name: "Weather", glyph: "⛅", gradient: G.sky },
    { id: "images", href: "/images", name: "Image Tools", glyph: "◳", gradient: G.pink },
    { id: "qr", href: "/qr", name: "QR Tools", glyph: "⊞", gradient: G.violet },
    { id: "whiteboard", href: "/whiteboard", name: "Whiteboard", glyph: "✏", gradient: G.gold },
    { id: "expenses", href: "/expenses", name: "Expense Tracker", glyph: "₿", gradient: G.teal },
    { id: "calendar", href: "/calendar", name: "Calendar", glyph: "◷", gradient: G.ember },
    { id: "translate", href: "/translate", name: "Translator", glyph: "⇄", gradient: G.violet },
  ] },
  { label: "Explore", apps: [
    { id: "ai-ml", href: "/ai-ml", name: "AI/ML", glyph: "✳", gradient: G.violet },
    { id: "design", href: "/design", name: "Design", glyph: "▣", gradient: G.cobalt },
    { id: "lld", href: "/lld", name: "LLD", glyph: "◇", gradient: G.teal },
    { id: "db", href: "/db", name: "DB", glyph: "⌗", gradient: "linear-gradient(135deg, #1F6F8B, #123F52)" },
    { id: "ultron", href: "/ultron", name: "Ultron", glyph: "⊛", gradient: G.ultron },
    { id: "expedition", href: "/expedition", name: "Expedition", glyph: "△", gradient: G.ember },
    { id: "res", href: "/res", name: "RES", glyph: "∴", gradient: "linear-gradient(135deg, #A0305A, #6E1F3E)" },
    { id: "games", href: "/games", name: "Games", glyph: "◆", gradient: G.pink },
  ] },
  { label: "System", apps: [
    { id: "observatory", href: "/observatory", name: "Observatory", glyph: "◌", gradient: G.slate },
    { id: "dashboard", href: "/dashboard", name: "Progress", glyph: "▤", gradient: G.slate },
    { id: "store", href: "/store", name: "App Center", glyph: "❖", gradient: G.cobalt },
    { id: "android", href: "/android", name: "Get app", glyph: "⤓", gradient: G.green },
    { id: "releases", href: "/releases", name: "What's new", glyph: "✦", gradient: G.green },
    { id: "settings", href: "/settings", name: "Settings", glyph: "⚙", gradient: G.slate },
  ] },
] as const

const TOPIC_STYLES = [
  { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", dot: "var(--accent)" },
  { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", dot: "var(--viz-settled)" },
  { bg: "#fefce8", border: "#fde68a", accent: "#ca8a04", dot: "#ca8a04" },
  { bg: "#fdf2f8", border: "#fbcfe8", accent: "#db2777", dot: "#db2777" },
  { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed", dot: "#7c3aed" },
  { bg: "#ecfeff", border: "#a5f3fc", accent: "#0891b2", dot: "#0891b2" },
  { bg: "#fff7ed", border: "#fed7aa", accent: "#ea580c", dot: "#ea580c" },
  { bg: "#f1f5f9", border: "#cbd5e1", accent: "#475569", dot: "#475569" },
  { bg: "#fef2f2", border: "#fecaca", accent: "#dc2626", dot: "#dc2626" },
  { bg: "#f0f9ff", border: "#bae6fd", accent: "#0369a1", dot: "#0369a1" },
  { bg: "#faf5ff", border: "#e9d5ff", accent: "#9333ea", dot: "#9333ea" },
  { bg: "#fffbeb", border: "#fde68a", accent: "#b45309", dot: "#b45309" },
  { bg: "#ecfdf5", border: "#a7f3d0", accent: "#047857", dot: "#047857" },
  { bg: "#fff1f2", border: "#fecdd3", accent: "#be123c", dot: "#be123c" },
] as const

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false)
  const [guidedProgress, setGuidedProgress] = useState<LessonProgress | undefined>()
  const [momentum, setMomentum] = useState<HomeMomentum>()
  const [masteryMomentum, setMasteryMomentum] = useState<MasteryMomentum>()
  const [practiceAction, setPracticeAction] = useState<NextAction>()
  const [preferences, setPreferences] = useState<Preferences>()
  const [reviewDue, setReviewDue] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [dailyDone, setDailyDone] = useState(false)
  const [installReady, setInstallReady] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(true)
  const [groupFilter, setGroupFilter] = useState("All")
  const [appQuery, setAppQuery] = useState("")
  const [installed, setInstalled] = useState<Set<string>>(new Set())

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 5) return "Still up"
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  })()

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })

  const openCommand = () => window.dispatchEvent(new CustomEvent("deriva-open-command"))

  const filteredSections = APP_SECTIONS
    .map(section => ({
      ...section,
      apps: section.apps.filter(app =>
        installed.has(app.id) &&
        (groupFilter === "All" || section.label === groupFilter) &&
        (!appQuery.trim() || app.name.toLowerCase().includes(appQuery.trim().toLowerCase()))),
    }))
    .filter(section => section.apps.length > 0)

  useEffect(() => {
    setGuidedProgress(loadLessonProgress("trees/00-recursion-reflex/sum-1-to-n"))
    const allCompletion = loadPracticeCompletion()
    const practiceDone = Object.values(allCompletion).reduce((sum, values) => sum + values.length, 0)
    const practiceTotal = TOPIC_LIST.reduce((sum, item) => sum + item.problems.length, 0)
    const pathDone = PATTERN_LEARNING_PATH.filter(step => (allCompletion[step.topicId] || []).length >= (TOPICS[step.topicId]?.problems.length || 1)).length
    setPracticeAction(getNextActions().find(action => action.kind === "practice"))
    setPreferences(loadPreferences())
    const mastery = loadPatternMastery()
    setMasteryMomentum({
      recognized: PATTERN_DIRECTORY.filter(pattern => mastery.recognized.includes(pattern.id)).length,
      transferred: PATTERN_DIRECTORY.filter(pattern => mastery.transferred.includes(pattern.id)).length,
      review: PATTERN_DIRECTORY.filter(pattern => mastery.missed.includes(pattern.id)).length,
    })
    setMomentum({ practiceDone, practiceTotal, pathDone })
    seedQueueFromMastery()
    setReviewDue(dueCards().length)
    setOpenTasks(loadTasks().filter(task => !task.done).length)
    setDailyDone(Boolean(loadDailyHistory()[todayKey()]))
    setInstalled(loadInstalled())
    try { setInstallDismissed(localStorage.getItem("deriva-install-dismissed-v1") === "1") } catch {}
    const onInstallReady = () => setInstallReady(true)
    window.addEventListener("deriva-pwa-install-available", onInstallReady)
    if (canPromptPwaInstall()) setInstallReady(true)
    setHydrated(true)
    return () => window.removeEventListener("deriva-pwa-install-available", onInstallReady)
  }, [])

  if (!hydrated) return <div className="page-loading" role="status">Loading your learning path…</div>

  const guidedHref = "/learn/trees/sum-1-to-n"
  const guidedStage = guidedProgress?.currentStage || "understand"
  const guidedStages = ["understand", "play", "reason", "discover", "design", "implement", "execute", "reflect", "generalize"]
  const guidedIndex = guidedStages.indexOf(guidedStage)
  const guidedDone = guidedProgress?.stages.generalize?.completed
  const practiceHref = practiceAction?.href || "/practice?topic=trees&problem=1"

  return (
    <div className="home-page os-home">
      <header className="os-header">
        <div className="os-status">
          <div>
            <span className="os-date">{dateLabel}</span>
            <h1 className="os-greeting">{greeting}.</h1>
          </div>
          <button type="button" className="os-search" onClick={openCommand} aria-label="Search apps and problems">
            <span aria-hidden="true">⌕</span>
            <span className="os-search-text">Search</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
        <div className="os-widgets stagger">
          <Link href={guidedHref} className="os-widget os-widget-featured">
            <span className="os-widget-kicker">Continue · Stage {Math.max(guidedIndex + 1, 1)}/9</span>
            <strong>The Recursion Reflex</strong>
            <em>{guidedDone ? "Earned — revisit or transfer next" : guidedProgress ? "Your next small move is ready" : "Derive before you code"}</em>
            <span className="os-widget-cta">{guidedDone ? "Revisit →" : "Continue →"}</span>
          </Link>
          <Link href="/daily" className="os-widget">
            <span className="os-widget-kicker">Daily</span>
            <strong>{dailyPickForDate(todayKey()).problem.title}</strong>
            <em>today&apos;s challenge</em>
          </Link>
          <Link href="/review" className="os-widget">
            <span className="os-widget-kicker">Review</span>
            <strong>{hydrated ? (reviewDue > 0 ? `${reviewDue} due` : "Clear") : "…"}</strong>
            <em>spaced repetition</em>
          </Link>
          <Link href="/toolkit?tool=tasks" className="os-widget">
            <span className="os-widget-kicker">Tasks</span>
            <strong>{hydrated ? `${openTasks} open` : "…"}</strong>
            <em>life toolkit</em>
          </Link>
        </div>
      </header>

      <main className="os-main">
        {installReady && !installDismissed && (
          <div className="install-banner" role="status">
            <span><strong>Install Deriva.</strong> Full screen, home-screen icon, works offline.</span>
            <div className="install-banner-actions">
              <button type="button" className="super-primary install-cta" onClick={async () => { await promptPwaInstall() }}>Install</button>
              <button type="button" className="install-dismiss" aria-label="Dismiss install suggestion" onClick={() => { setInstallDismissed(true); try { localStorage.setItem("deriva-install-dismissed-v1", "1") } catch {} }}>×</button>
            </div>
          </div>
        )}

        <section className="app-library" aria-label="App library">
          <div className="app-library-toolbar">
            <div className="app-library-chips" role="group" aria-label="Filter apps">
              {["All", ...APP_SECTIONS.map(section => section.label)].map(label => (
                <button key={label} type="button" className={`app-chip${groupFilter === label ? " active" : ""}`} onClick={() => setGroupFilter(label)}>{label}</button>
              ))}
            </div>
            <input className="app-library-search" value={appQuery} onChange={event => setAppQuery(event.target.value)} placeholder="Find an app…" aria-label="Search apps" />
          </div>
          {filteredSections.length === 0 && <p className="tool-empty">No app matches “{appQuery}”.</p>}
          {filteredSections.map(section => (
            <div key={section.label} className="app-library-group">
              <span className="app-library-label">{section.label}</span>
              <div className="app-library-grid stagger">
                {section.apps.map(app => {
                  const badge = app.href === "/review" ? (hydrated ? reviewDue : 0) : app.href === "/toolkit?tool=tasks" ? (hydrated ? openTasks : 0) : undefined
                  const dot = app.href === "/daily" ? hydrated && !dailyDone : undefined
                  return <AppTile key={app.href + app.name} app={app} badge={badge} dot={dot} />
                })}
              </div>
            </div>
          ))}
        </section>

        {momentum && <section className="home-momentum compact-momentum" aria-labelledby="momentum-heading">
          <div className="home-momentum-head"><div><span className="discovery-kicker">Your evidence</span><h2 id="momentum-heading">What you can do now.</h2></div><ProgressRing value={momentum.practiceTotal ? (momentum.practiceDone / momentum.practiceTotal) * 100 : 0} size={68} stroke={7} label={`${momentum.practiceDone}`} sub={`of ${momentum.practiceTotal}`} /></div>
          <div className="mastery-momentum" aria-label="Pattern mastery momentum">
            <div><span>Patterns recognized</span><b>{masteryMomentum?.recognized ?? 0}/{PATTERN_DIRECTORY.length}</b></div>
            <div><span>Transfer proof</span><b>{masteryMomentum?.transferred ?? 0} completed</b></div>
            <div><span>Review cues</span><b>{masteryMomentum?.review ? `${masteryMomentum.review} waiting` : "Clear"}</b></div>
          </div>
        </section>}

        <details className="curriculum-explore">
          <summary><span>Explore the curriculum</span><small>AI/ML, DSA, HLD, LLD, games, and pattern tools</small></summary>
          <div className="explore-actions">
            <Link href="/ai-ml" className="explore-link"><b>AI/ML Systems</b><span>Labs + 180 practice questions</span></Link>
            <Link href="/patterns" className="explore-link"><b>Pattern Journal</b><span>Recognize the thinking moves</span></Link>
            <Link href="/expedition" className="explore-link"><b>Expedition</b><span>Retrieve, break, and transfer an idea</span></Link>
            <Link href="/games" className="explore-link"><b>Game Mode</b><span>Practice invariants through play</span></Link>
            <Link href="/design" className="explore-link"><b>System Design</b><span>53 architecture problems</span></Link>
            <Link href="/lld" className="explore-link"><b>Low-Level Design</b><span>55 object design problems, now with concurrency</span></Link>
            <Link href="/db" className="explore-link"><b>Database & SQL</b><span>50 query problems on real SQLite</span></Link>
          </div>
          <h3>DSA Topics</h3>
          <div className="topic-grid">
            {TOPIC_LIST.map((topic, i) => {
              const s = TOPIC_STYLES[i % TOPIC_STYLES.length]
              return <Link key={topic.id} href={`/topic/${topic.id}`} className="topic-card" style={{ background: s.bg, border: `1px solid ${s.border}`, color: "var(--ink)" }}>
                <span className="topic-card-title"><b style={{ background: s.accent }} /><strong>{topic.name}</strong><em>{topic.problems.length}</em></span>
                <span className="topic-card-stages">{topic.stages.map(stage => stage.name).join(" · ")}</span>
              </Link>
            })}
          </div>
        </details>

        <p className="os-footnote">Stuck is part of the lesson — <Link href="/learn/trees/sum-1-to-n">return to the derivation</Link> or <Link href={practiceHref}>hit code practice</Link> anytime. <Link href="/android">Get the Android app →</Link></p>
      </main>

      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--line)", color: "var(--ink-soft)", fontSize: 12 }}>
         <div style={{ maxWidth: 1100, margin: "0 auto" }}>{preferences?.brandName ?? "Deriva"} runs locally in your browser. Nothing is uploaded.</div>
      </footer>

      <style>{`
        a.topic-card { transition: transform 0.2s, box-shadow 0.2s; }
        a.topic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  )
}
