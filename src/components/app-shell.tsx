"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { useState, useEffect } from "react"
import Logo from "./logo"
import NotificationCenter from "./notification-center"
import { applyPreferences, loadPreferences } from "@/persistence/preferences"

type AppIconName = "home" | "practice" | "progress" | "design" | "settings"

function AppIcon({ name, size = 20 }: { name: AppIconName; size?: number }) {
  const paths: Record<AppIconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></>,
    practice: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    progress: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    design: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="m8.5 8.3 2.1 6.8M15.5 8.3l-2.1 6.8" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.08 2.08-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.12A1.7 1.7 0 0 0 10.76 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.08-2.08.06-.06A1.7 1.7 0 0 0 7.14 15a1.7 1.7 0 0 0-1.56-1.03H5.5v-3h.08A1.7 1.7 0 0 0 7.14 9.94a1.7 1.7 0 0 0-.34-1.88L6.74 8 8.82 5.92l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V4.68h3v.08a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.84 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.08v3H21a1.7 1.7 0 0 0-1.6 1.03Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

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
    parts.push({ label: "LLD", href: "/lld" })
  } else if (pathname === "/dashboard") {
    parts.push({ label: "Dashboard", href: "/dashboard" })
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

export default function AppShell() {
  const pathname = usePathname()
  useEffect(() => { applyPreferences(loadPreferences()) }, [])
  const mobileTitle = pathname.startsWith("/learn/") ? "Guided Lesson" : pathname.startsWith("/expedition") ? "Expedition" : pathname.startsWith("/games") ? "Game Mode" : pathname.startsWith("/patterns/quiz") ? "Pattern Quiz" : pathname.startsWith("/patterns") ? "Patterns" : pathname === "/practice" ? "Practice" : pathname === "/dashboard" ? "Progress" : pathname === "/design" ? "System Design" : pathname === "/lld" ? "Low-Level Design" : pathname === "/settings" ? "Settings" : "Deriva"
  const tabs: { label: string; href: string; icon: AppIconName; active: boolean }[] = [
    { label: "Home", href: "/", icon: "home", active: pathname === "/" || pathname.startsWith("/topic/") || pathname.startsWith("/learn/") },
    { label: "Practice", href: "/practice", icon: "practice", active: pathname === "/practice" },
    { label: "Progress", href: "/dashboard", icon: "progress", active: pathname === "/dashboard" },
    { label: "Design", href: "/design", icon: "design", active: pathname === "/design" || pathname === "/lld" },
    { label: "Settings", href: "/settings", icon: "settings", active: pathname === "/settings" },
  ]

  return (
    <>
      <header className="app-shell-header">
        <div className="desktop-shell" style={{ alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
              <Logo size={26} />
              <span style={{ fontWeight: 800, fontFamily: "var(--font-narrative)", fontSize: 17, color: "var(--ink)" }}>Deriva</span>
            </Link>
            <Suspense fallback={null}><Breadcrumbs /></Suspense>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <Link href="/design" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>HLD</Link>
            <Link href="/lld" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>LLD</Link>
            <Link href="/practice" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>DSA</Link>
            <Link href="/patterns" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>Patterns</Link>
            <Link href="/expedition" className="nav-link" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>Expedition</Link>
            <Link href="/games" className="nav-link" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>Games</Link>
            <NotificationCenter />
            <ProgressBadge />
          </div>
        </div>
        <div className="mobile-shell">
          <Link href="/" className="mobile-brand" aria-label="Deriva home"><Logo size={24} /></Link>
          <span className="mobile-page-title">{mobileTitle}</span>
           <div className="mobile-header-actions"><NotificationCenter /><ProgressBadge className="mobile-progress" /></div>
        </div>
      </header>
      <nav className="mobile-tabbar" aria-label="Primary navigation">
        {tabs.map(tab => (
          <Link key={tab.href} href={tab.href} className={`mobile-tab${tab.active ? " active" : ""}`} aria-current={tab.active ? "page" : undefined}>
            <AppIcon name={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
      <style>{`
        .app-shell-header { height: 52px; border-bottom: 1px solid var(--line); background: var(--paper-raised); display: flex; align-items: center; padding: 0 16px; position: sticky; top: 0; z-index: 50; }
        .desktop-shell { display: flex; }
        .mobile-shell, .mobile-tabbar { display: none; }
        @media (max-width: 700px) {
           .app-shell-header { height: calc(60px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) var(--sp-3) 0; background: color-mix(in srgb, var(--paper-raised) 88%, transparent); backdrop-filter: blur(18px); box-shadow: 0 8px 22px rgb(26 29 33 / .05); }
          .desktop-shell { display: none !important; }
           .mobile-shell { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; width: 100%; height: 60px; }
           .mobile-brand { color: var(--ink); display: flex; align-items: center; padding: 8px; border-radius: 14px; }
           .mobile-brand:active { background: var(--accent-soft); }
           .mobile-page-title { text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-narrative); font-weight: 700; font-size: 19px; letter-spacing: -.02em; }
          .mobile-progress { min-width: 44px; min-height: 44px; display: flex; justify-content: flex-end; align-items: center; }
          .mobile-progress .progress-badge > div { width: 30px !important; }
           .mobile-progress .progress-badge > span { display: none; }
           .mobile-header-actions { display: flex; align-items: center; gap: 2px; }
           .mobile-tabbar { position: fixed; z-index: 50; inset: auto 0 0; display: grid; grid-template-columns: repeat(5, 1fr); min-height: calc(68px + env(safe-area-inset-bottom)); padding: 5px 6px env(safe-area-inset-bottom); background: color-mix(in srgb, var(--paper-raised) 90%, transparent); backdrop-filter: blur(18px); border-top: 1px solid color-mix(in srgb, var(--line) 80%, transparent); box-shadow: 0 -12px 30px rgb(26 29 33 / .1); }
           .mobile-tab { min-height: 56px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; border-radius: 15px; color: var(--ink-soft); text-decoration: none; font-family: var(--font-ui); font-size: 10px; font-weight: 650; transition: background var(--dur-fast), color var(--dur-fast), transform var(--dur-fast); }
           .mobile-tab:active { transform: scale(.96); }
           .mobile-tab.active { background: var(--accent-soft); color: var(--accent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent); }
           .mobile-tab.active::before { content: ""; width: 18px; height: 2px; position: absolute; top: 4px; border-radius: 999px; background: var(--accent); }
           .mobile-tab { position: relative; }
           .mobile-tab.active svg { stroke-width: 2.4; }
        }
      `}</style>
    </>
  )
}
