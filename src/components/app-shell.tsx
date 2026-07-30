"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { useState, useEffect } from "react"
import Logo from "./logo"

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

function ProgressBadge() {
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
    <Link href="/dashboard" className="progress-badge" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
      <div style={{ width: 64, height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{pct}%</span>
    </Link>
  )
}

export default function AppShell() {
  return (
    <header style={{
      height: 52, borderBottom: "1px solid var(--line)", background: "var(--paper-raised)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <Logo size={26} />
          <span style={{ fontWeight: 800, fontFamily: "var(--font-narrative)", fontSize: 17, color: "var(--ink)" }}>Deriva</span>
        </Link>
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <Link href="/design" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>HLD</Link>
        <Link href="/lld" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>LLD</Link>
        <Link href="/practice" className="nav-link" style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", fontWeight: 600 }}>DSA</Link>
        <ProgressBadge />
      </div>
      <style>{`
        @media (max-width: 700px) {
          .crumbs { display: none !important; }
          .progress-badge > div { width: 40px !important; }
        }
        @media (max-width: 420px) {
          .progress-badge { display: none !important; }
        }
      `}</style>
    </header>
  )
}
