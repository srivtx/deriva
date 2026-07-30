"use client"

import Link from "next/link"
import { TOPIC_LIST } from "@/data"
import Logo from "@/components/logo"

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
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-ui)" }}>
      <header className="landing-header" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 48px) clamp(20px, 4vw, 32px)", borderBottom: "1px solid var(--line)", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Logo size={44} />
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--ink-soft)" }}>
            Deriva · Learn DSA from first principles
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontFamily: "var(--font-narrative)", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
          Derive the algorithm.<br/>
          <span style={{ color: "var(--accent)" }}>Don't memorize it.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", maxWidth: 600, fontSize: 17, lineHeight: 1.6, fontFamily: "var(--font-narrative)" }}>
          DSA (700 problems) · System Design HLD (45) · LLD (35). Every topic follows 7-stage slow scaffolding —
          each stage adds exactly one new mental model. In-browser Python. No install. Just think.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <Link href="/practice" style={{ padding: "12px 28px", background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            DSA Practice →
          </Link>
          <Link href="/design" style={{ padding: "12px 28px", background: "#7c3aed", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            System Design (HLD) →
          </Link>
          <Link href="/lld" style={{ padding: "12px 28px", background: "#16a34a", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Low-Level Design →
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 48px) 60px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", marginBottom: 32 }}>
          <Link href="/design" className="topic-card" style={{
            background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe", borderRadius: "var(--radius)",
            padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none", color: "var(--ink)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
              <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>System Design (HLD)</h2>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>45</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
              Requirements → API → capacity math → components → naive → optimized → full designs. Interactive architecture canvas (React Flow).
            </p>
          </Link>
          <Link href="/lld" className="topic-card" style={{
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0", borderRadius: "var(--radius)",
            padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none", color: "var(--ink)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>Low-Level Design (OOP)</h2>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>35</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
              Entities → responsibilities → relationships → state machines → god classes → patterns → full designs (parking lot, LRU cache, splitwise).
            </p>
          </Link>
        </div>
        <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--ink-soft)", marginBottom: 16 }}>DSA Topics — 700 Problems</h3>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {TOPIC_LIST.map((topic, i) => {
            const s = TOPIC_STYLES[i % TOPIC_STYLES.length]
            const stageNames = topic.stages.map(st => st.name)
            return (
              <Link key={topic.id} href={`/topic/${topic.id}`}
                className="topic-card"
                style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: "var(--radius)",
                  padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none",
                  color: "var(--ink)", transition: "all 0.2s", cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                  <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>{topic.name}</h2>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{topic.problems.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {stageNames.map((name, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 10,
                      background: `${s.accent}14`, color: s.accent, border: `1px solid ${s.accent}33`,
                      fontFamily: "var(--font-mono)",
                    }}>{name}</span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--line)", color: "var(--ink-soft)", fontSize: 12 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>Deriva — All code runs locally in your browser. Nothing is uploaded.</div>
      </footer>

      <style>{`
        a.topic-card { transition: transform 0.2s, box-shadow 0.2s; }
        a.topic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  )
}
