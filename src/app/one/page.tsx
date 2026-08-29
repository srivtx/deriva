"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { STAGES_ONE, PROBLEMS_ONE } from "@/data/one"
import ProgressRing from "@/components/progress-ring"

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "icpc-diff-easy",
  Medium: "icpc-diff-medium",
  Hard: "icpc-diff-hard",
}

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — Foundations", note: "count, point, window", stages: [0, 1, 2] },
  { name: "II — The Toolkit", note: "sort, search, precompute", stages: [3, 4, 5] },
  { name: "III — Structures", note: "stacks, lists, trees, heaps", stages: [6, 7, 8, 9, 10] },
  { name: "IV — Graphs", note: "search, weights, components", stages: [11, 12, 13] },
  { name: "V — Dynamic Programming", note: "the state is everything", stages: [14, 15] },
  { name: "VI — The Last Boss", note: "expert structures & flows", stages: [16, 17] },
]

export default function OnePage() {
  const [done, setDone] = useState<Set<number>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-completed-v2")
      if (raw) {
        const all = JSON.parse(raw) as Record<string, number[]>
        setDone(new Set(all.one || []))
      }
    } catch {}
    setHydrated(true)
  }, [])

  const doneCount = done.size
  const total = PROBLEMS_ONE.length
  const pct = total > 0 ? (doneCount / total) * 100 : 0

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">0NE LADDER / {STAGES_ONE.length} SECTIONS &middot; {total} PROBLEMS</span>
          <h1>One hundred problems. Zero to mastery.</h1>
          <p>
            The complete DSA ladder, curated to be strictly linear: every problem teaches exactly one
            new move, and every Hard composes only moves taught earlier on the ladder. Six tiers take
            you from counting loop steps to max-flow. Solve in the browser with instant Python tests.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href={`/practice?topic=one&problem=${PROBLEMS_ONE[0]?.id ?? 1}`}>
              Start the climb <span aria-hidden="true">-&gt;</span>
            </Link>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Ladder progress">
          <span>SOLVED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${doneCount}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      {TIERS.map(tier => {
        const tierProblems = PROBLEMS_ONE.filter(p => tier.stages.includes(p.stage))
        const tierDone = tierProblems.filter(p => done.has(p.id)).length
        const tierPct = tierProblems.length ? Math.round((tierDone / tierProblems.length) * 100) : 0
        return (
          <div key={tier.name}>
            <div className="one-tier">
              <span className="one-tier-name">{tier.name}</span>
              <span className="one-tier-note">{tier.note}</span>
              <span className="one-tier-count">{tierDone}/{tierProblems.length}</span>
            </div>
            <ol className="icpc-ladder">
              {tier.stages.map(stageId => {
                const stage = STAGES_ONE[stageId]
                const problems = PROBLEMS_ONE.filter(p => p.stage === stageId)
                const sectionDone = problems.filter(p => done.has(p.id)).length
                const complete = sectionDone === problems.length
                const firstId = problems[0]?.id
                return (
                  <li key={stageId} className={`icpc-section${complete ? " complete" : ""}`}>
                    <div className="icpc-section-head">
                      <span className="icpc-section-num">{String(stageId).padStart(2, "0")}</span>
                      <div className="icpc-section-title">
                        <h2>{stage.name}</h2>
                        <span>{stage.desc}</span>
                      </div>
                      <span className={`icpc-section-count${complete ? " done" : ""}`}>{sectionDone}/{problems.length}</span>
                    </div>
                    <ul className="icpc-problem-list">
                      {problems.map(p => (
                        <li key={p.id}>
                          <Link href={`/practice?topic=one&problem=${p.id}`} className={`icpc-problem${done.has(p.id) ? " done" : ""}`}>
                            <span className="icpc-problem-dot">{done.has(p.id) ? "✓" : p.id}</span>
                            <span className="icpc-problem-name">{p.title}</span>
                            <span className={`icpc-diff ${DIFFICULTY_CLASS[p.difficulty ?? ""] ?? ""}`}>{p.difficulty}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link className="icpc-section-cta" href={`/practice?topic=one&problem=${firstId}`}>
                      Practice section <span aria-hidden="true">-&gt;</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
            <div className="one-tier-progress" aria-hidden="true">
              <div style={{ width: `${hydrated ? tierPct : 0}%` }} />
            </div>
          </div>
        )
      })}
    </main>
  )
}
