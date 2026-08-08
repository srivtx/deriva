"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TOPIC_LIST } from "@/data"
import { PROBLEMS_DESIGN } from "@/data/system-design"
import { PROBLEMS_LLD } from "@/data/lld"
import { loadLessonProgress } from "@/persistence/lesson-progress"

export default function DashboardPage() {
  const [dsa, setDsa] = useState<Record<string, number[]>>({})
  const [hld, setHld] = useState<number[]>([])
  const [lld, setLld] = useState<number[]>([])
  const [guided, setGuided] = useState<ReturnType<typeof loadLessonProgress>>()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const c = localStorage.getItem("deriva-completed-v2")
      if (c) setDsa(JSON.parse(c))
      const d = localStorage.getItem("deriva-design-completed")
      if (d) setHld(JSON.parse(d))
      const l = localStorage.getItem("deriva-lld-completed")
      if (l) setLld(JSON.parse(l))
      setGuided(loadLessonProgress("trees/00-recursion-reflex/sum-1-to-n"))
      setHydrated(true)
    } catch {} finally {
      setHydrated(true)
    }
  }, [])

  if (!hydrated) return <div className="page-loading" role="status">Loading your progress…</div>

  const dsaDone = Object.values(dsa).reduce((a, b) => a + b.length, 0)
  const dsaTotal = TOPIC_LIST.reduce((a, t) => a + t.problems.length, 0)
  const grandDone = dsaDone + hld.length + lld.length
  const grandTotal = dsaTotal + PROBLEMS_DESIGN.length + PROBLEMS_LLD.length
  const grandPct = Math.round((grandDone / grandTotal) * 100)

  const sections = [
    { name: "DSA — 14 Topics", done: dsaDone, total: dsaTotal, href: "/practice", color: "var(--accent)" },
    { name: "System Design (HLD)", done: hld.length, total: PROBLEMS_DESIGN.length, href: "/design", color: "#7c3aed" },
    { name: "Low-Level Design (OOP)", done: lld.length, total: PROBLEMS_LLD.length, href: "/lld", color: "#16a34a" },
  ]

  return (
    <div className="dashboard-page" style={{ minHeight: "calc(100vh - 52px)", background: "var(--paper)", fontFamily: "var(--font-ui)", padding: "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 48px)" }}>
      <div className="dashboard-inner" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontFamily: "var(--font-narrative)", margin: "0 0 8px" }}>Your Progress</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 24px" }}>
          {grandDone} of {grandTotal} problems across all tracks · {grandPct}%
        </p>
         <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={grandPct} aria-label={`${grandPct}% complete`} style={{ height: 10, background: "var(--line)", borderRadius: 5, overflow: "hidden", marginBottom: 40 }}>
          <div style={{ width: `${grandPct}%`, height: "100%", background: "var(--accent)", transition: "width 0.5s" }} />
        </div>

        <Link href="/learn/trees/sum-1-to-n" className="dashboard-focus" style={{
          display: "flex", alignItems: "center", gap: 18, marginBottom: 32, padding: "18px 20px",
          border: "1px solid var(--accent)", borderRadius: "var(--radius)", background: "var(--accent-soft)",
          color: "var(--ink)", textDecoration: "none",
        }}>
          <div style={{ width: 44, height: 44, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            {guided?.stages.generalize?.completed ? "✓" : "→"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>
              {guided?.stages.generalize?.completed ? "Pattern ready for retrieval" : "Your next thinking move"}
            </div>
            <div style={{ marginTop: 4, fontFamily: "var(--font-narrative)", fontSize: 20, fontWeight: 700 }}>Recursive Leap of Faith</div>
            <div style={{ marginTop: 2, color: "var(--ink-soft)", fontSize: 13 }}>
              {guided ? `Resume at ${guided.currentStage}. The next move is waiting.` : "Start the reference lesson before opening another problem."}
            </div>
          </div>
          <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>Continue →</span>
        </Link>

        <div style={{ display: "grid", gap: 12, marginBottom: 48 }}>
          {sections.map(s => {
            const pct = Math.round((s.done / s.total) * 100)
            return (
               <Link key={s.name} href={s.href} className="dashboard-track-card" style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 22px",
                background: "var(--paper-raised)", border: "1px solid var(--line)",
                borderRadius: "var(--radius)", textDecoration: "none", color: "var(--ink)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
                  <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color }} />
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-soft)", minWidth: 80, textAlign: "right" }}>
                  {s.done}/{s.total} · {pct}%
                </span>
              </Link>
            )
          })}
        </div>

        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--ink-soft)", marginBottom: 16 }}>DSA Topic Breakdown</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {TOPIC_LIST.map(t => {
            const done = (dsa[t.id] || []).length
            const total = t.problems.length
            const pct = Math.round((done / total) * 100)
            return (
               <Link key={t.id} href={`/topic/${t.id}`} className="dashboard-topic-card" style={{
                padding: "14px 16px", background: "var(--paper-raised)", border: "1px solid var(--line)",
                borderRadius: "var(--radius)", textDecoration: "none", color: "var(--ink)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t.name}</div>
                <div style={{ height: 4, background: "var(--line)", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--viz-settled)" : "var(--accent)" }} />
                </div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>{done}/{total}</div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
