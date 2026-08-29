"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { useState, useEffect, useRef, useMemo } from "react"
import Logo from "./logo"
import NotificationCenter from "./notification-center"
import CommandCenter from "./command-center"
import FloatingFocus from "./floating-focus"
import FloatingOsc from "./floating-osc"
import AppIcon from "./app-icon"
import NavSlotIcon from "./nav-slot-icon"
import { NAV_ITEM_MAP } from "@/data/nav-items"
import { currentIconPack } from "@/data/icon-packs"
import { clearContentAnimations } from "@/lib/app-transition"
import { installRecoveryGuards } from "@/lib/recovery"
import { installDiagnostics } from "@/lib/diagnostics"
import ShellErrorBoundary from "./shell-error-boundary"
import { applyPreferences, defaultPreferences, loadPreferences, type Preferences } from "@/persistence/preferences"
import { todayKey } from "@/persistence/daily"
import { dueCards, seedQueueFromMastery } from "@/persistence/review-queue"

type MoreLink = { label: string; href: string; desc: string }
type MoreGroup = { label: string; links: MoreLink[] }

const MORE_GROUPS: MoreGroup[] = [
  {
    label: "Today",
    links: [
      { label: "Daily Challenge", href: "/daily", desc: "today's pick" },
      { label: "Review Queue", href: "/review", desc: "spaced repetition" },
      { label: "Contest Simulator", href: "/contest", desc: "3 problems, one clock" },
      { label: "Mock Interview", href: "/interview", desc: "hints locked" },
    ],
  },
  {
    label: "Studio",
    links: [
      { label: "Media Studio", href: "/media", desc: "cut · convert · compress" },
      { label: "Glyph Studio", href: "/glyph", desc: "draw dot glyphs, export art" },
      { label: "Ghost", href: "/ghost", desc: "offline AI tutor" },
      { label: "OSC-1", href: "/osc", desc: "pocket synthesizer" },
    ],
  },
  {
    label: "Practice",
    links: [
      { label: "0NE Ladder", href: "/one", desc: "148 problems, zero to mastery" },
      { label: "ICPC Ladder", href: "/icpc", desc: "91 contest problems" },
      { label: "Algorithm Atlas", href: "/atlas", desc: "watch algorithms move" },
      { label: "Cheatsheet Hub", href: "/cheatsheets", desc: "contest templates" },
      { label: "RES Brainstorm", href: "/res", desc: "research thinking, rehearsed" },
    ],
  },
  {
    label: "Build",
    links: [
      { label: "Playground", href: "/playground", desc: "free sandbox" },
      { label: "Complexity Lab", href: "/complexity", desc: "measure Big-O" },
      { label: "Notebook", href: "/notebook", desc: "all your notes" },
    ],
  },
  {
    label: "Life",
    links: [
      { label: "Life Toolkit", href: "/toolkit", desc: "tasks · focus · habits" },
      { label: "Tasks", href: "/toolkit?tool=tasks", desc: "today's list" },
      { label: "Focus Timer", href: "/toolkit?tool=focus", desc: "25/5 sessions" },
      { label: "Password Vault", href: "/vault", desc: "encrypted secrets" },
      { label: "Weather", href: "/weather", desc: "forecast near you" },
      { label: "Image Tools", href: "/images", desc: "compress · convert" },
      { label: "QR Tools", href: "/qr", desc: "generate & scan" },
      { label: "Whiteboard", href: "/whiteboard", desc: "sketch ideas" },
      { label: "Expense Tracker", href: "/expenses", desc: "budget & spending" },
      { label: "Calendar", href: "/calendar", desc: "events & reminders" },
      { label: "Translator", href: "/translate", desc: "text translation" },
    ],
  },
  {
    label: "Explore",
    links: [
      { label: "AI/ML Systems", href: "/ai-ml", desc: "labs + 180 questions" },
      { label: "System Design", href: "/design", desc: "HLD" },
      { label: "LLD Ladder", href: "/lld", desc: "55 design problems" },
      { label: "DB Ladder", href: "/db", desc: "50 SQL problems" },
      { label: "Ultron", href: "/ultron", desc: "50 AI/ML drills" },
      { label: "Expedition", href: "/expedition", desc: "retrieval" },
      { label: "Game Mode", href: "/games", desc: "play" },
    ],
  },
  {
    label: "Workspace",
    links: [
      { label: "Progress details", href: "/dashboard", desc: "history" },
      { label: "App Center", href: "/store", desc: "install & manage apps" },
      { label: "Get Android app", href: "/android", desc: "install the APK" },
      { label: "What's new", href: "/releases", desc: "release notes" },
      { label: "Settings", href: "/settings", desc: "preferences" },
    ],
  },
]

function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic")
  const topic = topicParam ? TOPICS[topicParam] : null

  const parts: { label: string; href: string }[] = []
  if (pathname === "/practice") {
    parts.push({ label: "DSA", href: "/practice" })
    if (topic) parts.push({ label: topic.name, href: `/practice?topic=${topic.id}` })
  } else if (pathname.startsWith("/topic/")) {
    const id = pathname.split("/")[2]
    parts.push({ label: TOPICS[id]?.name || id, href: pathname })
  } else if (pathname === "/design") {
    parts.push({ label: "System Design", href: "/design" })
  } else if (pathname === "/lld") {
    parts.push({ label: "LLD Ladder", href: "/lld" })
  } else if (pathname === "/lld/practice") {
    parts.push({ label: "LLD Workbench", href: "/lld/practice" })
  } else if (pathname === "/db") {
    parts.push({ label: "DB Ladder", href: "/db" })
  } else if (pathname === "/db/practice") {
    parts.push({ label: "DB Workbench", href: "/db/practice" })
  } else if (pathname === "/one") {
    parts.push({ label: "0NE Ladder", href: "/one" })
  } else if (pathname === "/res") {
    parts.push({ label: "RES Brainstorm", href: "/res" })
  } else if (pathname === "/icpc") {
    parts.push({ label: "ICPC Ladder", href: "/icpc" })
  } else if (pathname === "/daily") {
    parts.push({ label: "Daily Challenge", href: "/daily" })
  } else if (pathname === "/review") {
    parts.push({ label: "Review Queue", href: "/review" })
  } else if (pathname === "/contest") {
    parts.push({ label: "Contest Simulator", href: "/contest" })
  } else if (pathname === "/interview") {
    parts.push({ label: "Mock Interview", href: "/interview" })
  } else if (pathname === "/cheatsheets") {
    parts.push({ label: "Cheatsheet Hub", href: "/cheatsheets" })
  } else if (pathname.startsWith("/atlas")) {
    parts.push({ label: "Algorithm Atlas", href: "/atlas" })
  } else if (pathname === "/complexity") {
    parts.push({ label: "Complexity Lab", href: "/complexity" })
  } else if (pathname === "/notebook") {
    parts.push({ label: "Notebook", href: "/notebook" })
  } else if (pathname === "/toolkit") {
    parts.push({ label: "Life Toolkit", href: "/toolkit" })
  } else if (pathname === "/playground") {
    parts.push({ label: "Playground", href: "/playground" })
  } else if (pathname === "/releases") {
    parts.push({ label: "Releases", href: "/releases" })
  } else if (pathname === "/dashboard") {
    parts.push({ label: "Dashboard", href: "/dashboard" })
  } else if (pathname === "/observatory") {
    parts.push({ label: "Learning Observatory", href: "/observatory" })
  } else if (pathname.startsWith("/learn/")) {
    parts.push({ label: "Trees", href: "/topic/trees" })
    parts.push({ label: "Guided Lesson", href: pathname })
  } else if (pathname.startsWith("/expedition")) {
    parts.push({ label: "Expedition", href: "/expedition" })
  } else if (pathname.startsWith("/games")) {
    parts.push({ label: "Game Mode", href: "/games" })
  } else if (pathname.startsWith("/patterns/")) {
    parts.push({ label: "Pattern Directory", href: "/patterns" })
    parts.push({ label: "Quiz Mode", href: pathname })
  } else if (pathname === "/patterns") {
    parts.push({ label: "Pattern Journal", href: "/patterns" })
  } else if (pathname === "/ai-ml") {
    parts.push({ label: "AI/ML Systems", href: "/ai-ml" })
  } else if (pathname.startsWith("/ai-ml/track/")) {
    parts.push({ label: "AI/ML", href: "/ai-ml" })
    parts.push({ label: "Track", href: pathname })
  } else if (pathname.startsWith("/ai-ml/lab/")) {
    parts.push({ label: "AI/ML", href: "/ai-ml" })
    parts.push({ label: "Lab", href: pathname })
  } else if (pathname.startsWith("/ai-ml/question/")) {
    parts.push({ label: "AI/ML", href: "/ai-ml" })
    parts.push({ label: "Question", href: pathname })
  } else if (pathname.startsWith("/ai-ml/projects")) {
    parts.push({ label: "AI/ML", href: "/ai-ml" })
    parts.push({ label: "Projects", href: pathname })
  } else if (pathname.startsWith("/ai-ml/patterns")) {
    parts.push({ label: "AI/ML", href: "/ai-ml" })
    parts.push({ label: "Patterns", href: pathname })
  } else if (pathname === "/vault") {
    parts.push({ label: "Password Vault", href: "/vault" })
  } else if (pathname === "/weather") {
    parts.push({ label: "Weather", href: "/weather" })
  } else if (pathname === "/ultron") {
    parts.push({ label: "Ultron", href: "/ultron" })
  } else if (pathname === "/media") {
    parts.push({ label: "Media Studio", href: "/media" })
  } else if (pathname === "/images") {
    parts.push({ label: "Image Tools", href: "/images" })
  } else if (pathname === "/qr") {
    parts.push({ label: "QR Tools", href: "/qr" })
  } else if (pathname === "/whiteboard") {
    parts.push({ label: "Whiteboard", href: "/whiteboard" })
  } else if (pathname === "/store") {
    parts.push({ label: "App Center", href: "/store" })
  }

  if (parts.length === 0) return null

  return (
    <nav className="crumbs" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginLeft: 10, overflow: "hidden" }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          {i > 0 && <span style={{ color: "var(--ink-soft)", opacity: 0.5 }}>›</span>}
          <Link href={p.href} style={{
            color: i === parts.length - 1 ? "var(--ink)" : "var(--ink-soft)",
            textDecoration: "none", fontWeight: i === parts.length - 1 ? 600 : 400,
          }}>{p.label}</Link>
        </span>
      ))}
    </nav>
  )
}

function ProgressBadge({ className = "" }: { className?: string }) {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-completed-v2")
      if (!raw) return
      const map = JSON.parse(raw) as Record<string, number[]>
      const totalDone = Object.values(map).reduce((a, b) => a + b.length, 0)
      const totalProblems = TOPIC_LIST.reduce((a, t) => a + t.problems.length, 0)
      setPct(Math.round((totalDone / totalProblems) * 100))
    } catch {}
  }, [])
  return (
    <Link href="/dashboard" className={`progress-badge ${className}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{ width: 64, height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{pct}%</span>
    </Link>
  )
}

  const APP_MODE_PREFIXES = ["/daily", "/review", "/contest", "/interview", "/icpc", "/one", "/res", "/atlas", "/cheatsheets", "/playground", "/complexity", "/notebook", "/toolkit", "/releases", "/android", "/settings", "/dashboard", "/observatory", "/practice", "/topic", "/patterns", "/ai-ml", "/design", "/lld", "/db", "/lab", "/expedition", "/games", "/learn", "/vault", "/weather", "/images", "/qr", "/whiteboard", "/media", "/ultron", "/store", "/expenses", "/calendar", "/translate", "/focus", "/glyph", "/ghost", "/osc", "/rig"]

export default function AppShell() {
  const pathname = usePathname()
  const router = useRouter()
  const isAppMode = APP_MODE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"))
  useEffect(() => {
    document.body.classList.toggle("app-mode-active", isAppMode)
    return () => document.body.classList.remove("app-mode-active")
  }, [isAppMode])
  const [moreOpen, setMoreOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [attention, setAttention] = useState(false)
  const [online, setOnline] = useState(true)
  const sheetRef = useRef<HTMLElement>(null)
  const dragStart = useRef<number | null>(null)
  useEffect(() => {
    setMoreOpen(false)
    setCommandOpen(false)
  }, [pathname])
  useEffect(() => {
    installRecoveryGuards()
    installDiagnostics()
  }, [])
  useEffect(() => {
    const next = loadPreferences()
    setPreferences(next)
    applyPreferences(next)
    const onPreferencesChange = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail
      if (!detail) return
      setPreferences(detail)
      applyPreferences(detail)
    }
    window.addEventListener("deriva-preferences-change", onPreferencesChange)
    try {
      const daily = JSON.parse(localStorage.getItem("deriva-daily-v1") || "{}") as Record<string, unknown>
      seedQueueFromMastery()
      setAttention(!daily[todayKey()] || dueCards().length > 0)
    } catch {}
    return () => window.removeEventListener("deriva-preferences-change", onPreferencesChange)
  }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true) }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
  useEffect(() => { setMoreOpen(false) }, [pathname])
  useEffect(() => {
    clearContentAnimations(document.querySelector(".app-content"))
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    const open = () => setCommandOpen(true)
    window.addEventListener("deriva-open-command", open)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    setOnline(navigator.onLine)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    const haptic = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest(".mobile-tab, .app-chip, .app-tile, .toolkit-tab") && "vibrate" in navigator) navigator.vibrate(8)
    }
    document.addEventListener("pointerdown", haptic)
    return () => {
      window.removeEventListener("deriva-open-command", open)
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
      document.removeEventListener("pointerdown", haptic)
    }
  }, [])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!moreOpen || !sheet) return
    let current = 0
    const onTouchStart = (event: TouchEvent) => {
      if ((event.target as HTMLElement).closest(".mobile-more-links")) dragStart.current = event.touches[0].clientY
    }
    const onTouchMove = (event: TouchEvent) => {
      if (dragStart.current == null) return
      current = Math.max(0, event.touches[0].clientY - dragStart.current)
      sheet.style.transform = `translateY(${current}px)`
      sheet.style.transition = "none"
    }
    const onTouchEnd = () => {
      if (dragStart.current == null) return
      sheet.style.transform = ""
      sheet.style.transition = "transform .22s var(--ease-standard)"
      if (current > 110) setMoreOpen(false)
      dragStart.current = null
      current = 0
    }
    sheet.addEventListener("touchstart", onTouchStart, { passive: true })
    sheet.addEventListener("touchmove", onTouchMove, { passive: true })
    sheet.addEventListener("touchend", onTouchEnd)
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart)
      sheet.removeEventListener("touchmove", onTouchMove)
      sheet.removeEventListener("touchend", onTouchEnd)
    }
  }, [moreOpen])
  useEffect(() => {
    if (!moreOpen) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest("[data-more-root]")) return
      setMoreOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [moreOpen])
  const mobileTitle = pathname === "/icpc" ? "ICPC Ladder" : pathname === "/one" ? "0NE Ladder" : pathname === "/res" ? "RES Brainstorm" : pathname === "/daily" ? "Daily Challenge" : pathname === "/review" ? "Review Queue" : pathname === "/contest" ? "Contest Sim" : pathname === "/interview" ? "Mock Interview" : pathname === "/cheatsheets" ? "Cheatsheets" : pathname.startsWith("/atlas") ? "Algorithm Atlas" : pathname === "/complexity" ? "Complexity Lab" : pathname === "/notebook" ? "Notebook" : pathname === "/toolkit" ? "Life Toolkit" : pathname === "/playground" ? "Playground" : pathname === "/releases" ? "Releases" : pathname.startsWith("/learn/") ? "Guided Lesson" : pathname.startsWith("/ai-ml") ? "AI/ML Systems" : pathname.startsWith("/expedition") ? "Expedition" : pathname.startsWith("/games") ? "Game Mode" : pathname.startsWith("/patterns/quiz") ? "Pattern Quiz" : pathname.startsWith("/patterns") ? "Patterns" : pathname === "/practice" ? "Drill Mode" : pathname.startsWith("/topic/") ? "DSA Drill" : pathname === "/dashboard" ? "Progress Details" : pathname === "/observatory" ? "Observatory" : pathname === "/design" ? "System Design" : pathname === "/lld" ? "LLD Ladder" : pathname.startsWith("/lld/practice") ? "LLD Workbench" : pathname === "/db" ? "DB Ladder" : pathname.startsWith("/db/practice") ? "DB Workbench" : pathname === "/ultron" ? "Ultron Ladder" : pathname.startsWith("/ultron/practice") ? "Ultron Workbench" : pathname === "/settings" ? "Settings" : pathname === "/focus" ? "Focus Dial" : pathname === "/media" ? "Media Studio" : pathname === "/glyph" ? "Glyph Studio" : pathname === "/ghost" ? "Ghost" : pathname === "/osc" ? "OSC-1" : pathname === "/rig" ? "RIG" : "Deriva"
  const moreActive = pathname === "/design" || pathname.startsWith("/lld") || pathname.startsWith("/db") || pathname.startsWith("/expedition") || pathname.startsWith("/games") || pathname === "/settings" || pathname === "/icpc" || pathname === "/one" || pathname === "/res" || pathname === "/daily" || pathname === "/review" || pathname === "/contest" || pathname === "/interview" || pathname === "/cheatsheets" || pathname.startsWith("/atlas") || pathname === "/complexity" || pathname === "/notebook" || pathname === "/toolkit" || pathname === "/playground" || pathname === "/releases"
  const navSlots = preferences.navSlots.length ? preferences.navSlots : ["home", "learn", "patterns", "observe"]
  const slotItems = navSlots.map(id => NAV_ITEM_MAP[id]).filter(Boolean)
  const iconPack = currentIconPack()

  const tabs = useMemo(() => slotItems.map(item => ({
    key: item.id,
    label: item.label,
    href: item.href,
    glyph: item.glyph,
    classicIcon: item.classicIcon,
    active: item.match(pathname),
  })), [slotItems, pathname])

  return (
    <ShellErrorBoundary>
    <div className={isAppMode ? "app-root app-mode-active" : "app-root"}>
      <header className="app-mode-header" aria-hidden={!isAppMode}>
        <button
          type="button"
          className="app-back"
          aria-label="Go back"
          onClick={() => {
            if ("vibrate" in navigator) navigator.vibrate(8)
            if (window.history.length <= 1) router.push("/")
            else router.back()
          }}
        >
          ←
        </button>
        <span className="app-mode-title">{mobileTitle}</span>
      </header>
      <header className="app-shell-header">        <div className="desktop-shell" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
              <Logo size={26} variant="wordmark" label={preferences.brandName} mark={preferences.logoMark} imageUrl={preferences.logoDataUrl} style={preferences.logoStyle} />
            </Link>
            <Suspense fallback={null}><Breadcrumbs /></Suspense>
          </div>
          <div className="desktop-nav-actions">
            <Link href="/learn/trees/sum-1-to-n" className={`nav-link${pathname === "/practice" || pathname.startsWith("/topic/") || pathname.startsWith("/learn/") ? " active" : ""}`}>Learn</Link>
            <Link href="/ai-ml" className={`nav-link${pathname.startsWith("/ai-ml") || pathname.startsWith("/lab") ? " active" : ""}`}>AI/ML</Link>
            <Link href="/patterns" className={`nav-link${pathname.startsWith("/patterns") ? " active" : ""}`}>Patterns</Link>
           <Link href="/observatory" className={`nav-link${pathname === "/dashboard" || pathname === "/observatory" ? " active" : ""}`}>Observe</Link>
            <button type="button" className="command-trigger" onClick={() => setCommandOpen(true)} aria-label="Open Command Center"><span>Search</span><kbd>⌘K</kbd></button>
            <div data-more-root>
              <button className={`nav-more${moreActive ? " active" : ""}`} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}>More <span aria-hidden="true">⌄</span>{attention && <i className="more-dot" aria-hidden="true" />}</button>
              {moreOpen && <div className="desktop-more-menu" role="menu">
                {MORE_GROUPS.map(group => (
                  <div key={group.label} className="more-group" role="group" aria-label={group.label}>
                    <span className="more-group-label">{group.label}</span>
                    {group.links.map(link => (
                      <Link key={link.href} href={link.href} role="menuitem" onClick={() => setMoreOpen(false)}>
                        <strong>{link.label}</strong>
                        <small>{link.desc}</small>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>}
            </div>
            <NotificationCenter />
            <ProgressBadge />
          </div>
        </div>
        <div className="mobile-shell">
           <Link href="/" className="mobile-brand" aria-label={`${preferences.brandName} home`}><Logo size={24} label={preferences.brandName} mark={preferences.logoMark} imageUrl={preferences.logoDataUrl} style={preferences.logoStyle} /></Link>
          <span className="mobile-page-title">{mobileTitle}</span>
            <div className="mobile-header-actions"><button type="button" className="command-mobile-trigger" onClick={() => setCommandOpen(true)} aria-label="Open Command Center"><AppIcon name="search" size={19} /></button><NotificationCenter /><ProgressBadge className="mobile-progress" /></div>
        </div>
      </header>
      {!online && <div className="offline-banner" role="status">You are offline — everything still works, progress stays on this device.</div>}
       <nav className="mobile-tabbar" aria-label="Primary navigation" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
         {tabs.map(tab => (
          <Link key={tab.key} href={tab.href} className={`mobile-tab${tab.active ? " active" : ""}`} aria-current={tab.active ? "page" : undefined}>
            <NavSlotIcon itemId={tab.key} variantId={preferences.navIcons?.[tab.key]} autoPack={iconPack} />
             <span>{tab.label}</span>
           </Link>
         ))}
          <button data-more-root className={`mobile-tab${moreActive ? " active" : ""}`} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}>
           <NavSlotIcon itemId="more" variantId={preferences.navIcons?.more} autoPack={iconPack} />
           <span>More</span>
         </button>
       </nav>
        {moreOpen && <div className="mobile-more-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
          <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More destinations" data-more-root ref={sheetRef} onClick={event => event.stopPropagation()}>
           <div className="mobile-sheet-handle" />
           <div className="mobile-more-heading"><span className="notification-kicker">More destinations</span><button onClick={() => setMoreOpen(false)} aria-label="Close more destinations">×</button></div>
            <div className="mobile-more-links">
              {MORE_GROUPS.map(group => (
                <div key={group.label} className="mobile-more-group" role="group" aria-label={group.label}>
                  <span className="mobile-more-group-label">{group.label}</span>
                  <div className="mobile-more-group-links">
                    {group.links.map(link => (
                      <Link key={link.href} href={link.href} onClick={() => setMoreOpen(false)}>
                        <span className="mobile-more-link-label">{link.label}</span>
                        <span className="mobile-more-link-desc">{link.desc}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
         </section>
       </div>}
        <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
        <FloatingFocus />
        <FloatingOsc />
       <style>{`
         .app-shell-header { height: var(--app-header-height); border-bottom: 1px solid var(--line); background: var(--paper-raised); display: flex; align-items: center; padding: 0 16px; position: sticky; top: 0; z-index: 50; }
         .app-mode-header { display: none; }
         .desktop-shell { display: flex; }
         .mobile-shell, .mobile-tabbar { display: none; }
         .desktop-nav-actions { position: relative; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
         .nav-link, .nav-more { border: 0; background: transparent; color: var(--ink-soft); font: 600 12px var(--font-ui); text-decoration: none; cursor: pointer; }
         .nav-link.active, .nav-more.active { color: var(--accent); }
          .nav-more { display: inline-flex; align-items: center; gap: 4px; padding: 5px 0; position: relative; }
          .more-dot { position: absolute; top: 2px; right: -8px; width: 7px; height: 7px; border-radius: 50%; background: var(--viz-pruned); box-shadow: 0 0 0 3px color-mix(in srgb, var(--viz-pruned) 18%, transparent); }
          .desktop-more-menu { position: absolute; top: calc(100% + 10px); right: 0; z-index: 120; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 4px 20px; width: max-content; max-width: min(640px, calc(100vw - 32px)); max-height: min(70vh, 560px); overflow-y: auto; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--paper-raised); box-shadow: var(--shadow-raised); animation: menu-in .18s var(--ease-standard) both; }
          @keyframes menu-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
          .more-group { display: grid; gap: 2px; align-content: start; }
          .more-group-label { padding: 2px 10px 8px; color: var(--accent); font: 700 9px var(--font-ui); letter-spacing: .13em; text-transform: uppercase; }
          .desktop-more-menu a { display: grid; gap: 1px; padding: 8px 10px; border-radius: 10px; text-decoration: none; transition: background var(--dur-fast); }
          .desktop-more-menu a strong { color: var(--ink); font: 600 13px var(--font-ui); }
          .desktop-more-menu a small { color: var(--ink-soft); font: 11px var(--font-ui); }
          .desktop-more-menu a:hover { background: var(--accent-soft); }
          .desktop-more-menu a:hover strong { color: var(--accent); }
         .mobile-more-backdrop { position: fixed; z-index: 110; inset: 0; display: flex; align-items: flex-end; background: rgb(26 29 33 / .25); }
         .mobile-more-sheet { width: 100%; padding: 10px 16px calc(16px + env(safe-area-inset-bottom)); border-radius: 22px 22px 0 0; background: var(--paper-raised); box-shadow: 0 -12px 34px rgb(26 29 33 / .16); }
         .mobile-more-heading { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 12px; }
         .mobile-more-heading button { width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 50%; background: transparent; color: var(--ink); font-size: 22px; }
          .mobile-more-links { display: flex; flex-direction: column; gap: 14px; max-height: min(62vh, 480px); overflow-y: auto; overscroll-behavior: contain; padding-right: 2px; }
          .mobile-more-group { display: grid; gap: 6px; }
          .mobile-more-group-label { padding: 0 2px; color: var(--accent); font: 700 9px var(--font-ui); letter-spacing: .13em; text-transform: uppercase; }
          .mobile-more-group-links { display: grid; grid-template-columns: 1fr; gap: 6px; }
          .mobile-more-links a { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0; min-height: 46px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); font: 600 13px var(--font-ui); text-decoration: none; transition: border-color var(--dur-fast); }
          .mobile-more-links a:hover { border-color: var(--accent); }
          .mobile-more-links a:active { background: var(--accent-soft); }
          .mobile-more-link-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .mobile-more-link-desc { flex: 0 0 auto; max-width: 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink-soft); font: 10px var(--font-mono); }
         @media (max-width: 700px) {
           .app-shell-header { position: fixed; inset: 0 0 auto; height: var(--mobile-header-height); padding: env(safe-area-inset-top) var(--sp-3) 0; background: color-mix(in srgb, var(--paper-raised) 94%, transparent); backdrop-filter: blur(18px); box-shadow: 0 8px 22px rgb(26 29 33 / .05); }
           .desktop-shell { display: none !important; }
           .desktop-nav-actions { display: none; }
           .mobile-shell { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; width: 100%; height: 60px; }
           .mobile-brand { color: var(--ink); display: flex; align-items: center; padding: 8px; border-radius: 14px; }
           .mobile-brand:active { background: var(--accent-soft); }
           .mobile-page-title { text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-narrative); font-weight: 700; font-size: 19px; letter-spacing: -.02em; }
           .mobile-progress { min-width: 44px; min-height: 44px; display: flex; justify-content: flex-end; align-items: center; }
           .mobile-progress .progress-badge > div { width: 30px !important; }
            .mobile-progress .progress-badge > span { display: none; }
            .mobile-header-actions { display: flex; align-items: center; gap: 2px; }
             .app-mode-active .app-shell-header, .app-mode-active .mobile-tabbar, body.app-mode-active .app-shell-header, body.app-mode-active .mobile-tabbar { display: none !important; }
             body.app-mode-active { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
             body.app-mode-active .app-content { flex: 1 1 auto; height: auto; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; padding-top: var(--mobile-header-height); padding-bottom: env(safe-area-inset-bottom); }
            .app-mode-active .app-mode-header, body.app-mode-active .app-mode-header { display: flex; position: fixed; inset: 0 0 auto; z-index: 100; height: var(--mobile-header-height); padding: env(safe-area-inset-top) 8px 0; align-items: center; gap: 4px; background: color-mix(in srgb, var(--paper-raised) 94%, transparent); backdrop-filter: blur(18px); border-bottom: 1px solid color-mix(in srgb, var(--line) 80%, transparent); animation: menu-in .2s var(--ease-standard) both; }
            .app-back { display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 auto; border: 0; border-radius: 12px; background: transparent; color: var(--accent); font-size: 22px; line-height: 1; cursor: pointer; }
            .app-back:active { background: var(--accent-soft); transform: scale(.94); }
            .app-mode-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-narrative); font-weight: 700; font-size: 18px; letter-spacing: -.02em; }
            .mobile-tabbar { position: fixed; z-index: 100; inset: auto 0 0; display: grid; grid-template-columns: repeat(5, 1fr); min-height: var(--mobile-tabbar-height); padding: 5px 6px env(safe-area-inset-bottom); background: color-mix(in srgb, var(--paper-raised) 96%, transparent); backdrop-filter: blur(18px); border-top: 1px solid color-mix(in srgb, var(--line) 80%, transparent); box-shadow: 0 -12px 30px rgb(26 29 33 / .1); }
           .mobile-tab { min-height: 56px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; border-radius: 15px; color: var(--ink-soft); text-decoration: none; font-family: var(--font-ui); font-size: 10px; font-weight: 650; transition: background var(--dur-fast), color var(--dur-fast), transform var(--dur-fast); }
           .mobile-tab:active { transform: scale(.96); }
           .mobile-tab.active { background: var(--accent-soft); color: var(--accent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent); }
           .mobile-tab.active::before { content: ""; width: 18px; height: 2px; position: absolute; top: 4px; border-radius: 999px; background: var(--accent); }
           .mobile-tab { position: relative; }
            .mobile-tab.active svg { stroke-width: 2.4; }
         }
       `}</style>
    </div>
    </ShellErrorBoundary>
  )
}
