"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { TOPICS } from "@/data"

export default function TopicHubPage() {
  const params = useParams()
  const id = params.id as string
  const topic = TOPICS[id]
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-completed-v2")
      if (raw) {
        const map = JSON.parse(raw) as Record<string, number[]>
        setCompleted(new Set(map[id] || []))
      }
    } catch {}
  }, [id])

  if (!topic) {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-ui)" }}>
        <h2>Topic not found</h2>
        <Link href="/" style={{ color: "var(--accent)" }}>← Back to all topics</Link>
      </div>
    )
  }

  const total = topic.problems.length
  const done = completed.size
  const pct = Math.round((done / total) * 100)
  const nextProblem = topic.problems.find(problem => !completed.has(problem.id)) || topic.problems[topic.problems.length - 1]
  const nextStage = topic.stages.find(stage => stage.id === nextProblem.stage)

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", background: "var(--paper)", fontFamily: "var(--font-ui)", padding: "clamp(20px, 5vw, 40px) clamp(16px, 5vw, 48px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <h1 style={{ fontSize: 34, fontFamily: "var(--font-narrative)", margin: 0 }}>{topic.name}</h1>
          <span style={{ fontSize: 14, color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{done}/{total} · {pct}%</span>
        </div>
        <div style={{ height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s" }} />
        </div>

        <section className="topic-next-step">
          <span>YOUR NEXT DERIVATION</span>
          <h2>{nextProblem.title}</h2>
          <p>{nextStage?.name} · {nextStage?.desc}</p>
          <Link href={`/practice?topic=${id}&problem=${nextProblem.id}`}>
            {done === total ? "Revisit this pattern →" : "Continue the path →"}
          </Link>
        </section>

        <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--ink-soft)", marginBottom: 20 }}>The Scaffolding Path</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topic.stages.map((stage) => {
            const sp = topic.problems.filter(p => p.stage === stage.id)
            const spDone = sp.filter(p => completed.has(p.id)).length
            const spPct = sp.length > 0 ? Math.round((spDone / sp.length) * 100) : 0
            return (
              <Link key={stage.id} href={`/practice?topic=${id}&problem=${sp.find(problem => !completed.has(problem.id))?.id || sp[0]?.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                  background: "var(--paper-raised)", border: "1px solid var(--line)",
                  borderRadius: "var(--radius)", textDecoration: "none", color: "var(--ink)",
                }}>
                <span style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: spPct === 100 ? "var(--viz-settled)" : "var(--accent-soft)", color: spPct === 100 ? "#fff" : "var(--accent)",
                  fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: 13, flexShrink: 0,
                }}>{spPct === 100 ? "✓" : stage.id}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{stage.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{stage.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink-soft)" }}>{spDone}/{sp.length}</div>
                  <div style={{ width: 60, height: 4, background: "var(--line)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ width: `${spPct}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      <style>{`.topic-next-step { margin: 28px 0 40px; padding: 20px; border: 1px solid var(--accent); border-radius: var(--radius); background: var(--accent-soft); }.topic-next-step > span { color: var(--accent); font: 700 10px var(--font-ui); letter-spacing: .1em; }.topic-next-step h2 { margin: 5px 0 3px; font: 700 24px var(--font-narrative); }.topic-next-step p { margin: 0 0 16px; color: var(--ink-soft); font-size: 13px; }.topic-next-step a { display: inline-block; min-height: 44px; box-sizing: border-box; padding: 12px 16px; border-radius: var(--radius); background: var(--accent); color: var(--paper-raised); font: 700 13px var(--font-ui); text-decoration: none; }`}</style>
      </div>
    </div>
  )
}
