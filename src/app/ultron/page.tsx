"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { STAGES_ULTRON, PROBLEMS_ULTRON } from "@/data/ultron"
import ProgressRing from "@/components/progress-ring"
import { loadWorkbenchProgress } from "@/persistence/workbench-progress"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — Numbers", note: "arrays, broadcasting, masks", stages: [0] },
  { name: "II — The First Model", note: "line, loss, gradient, descent", stages: [1] },
  { name: "III — Descend", note: "learning rates, scaling, momentum", stages: [2] },
  { name: "IV — Bend & Judge", note: "probability, generalization, leakage", stages: [3, 4] },
  { name: "V — Geometry & Questions", note: "neighbors, clusters, trees", stages: [5, 6] },
  { name: "VI — Go Deep", note: "networks, backprop, craft", stages: [7, 8, 9] },
]

export default function UltronLadderPage() {
  const [completed, setCompleted] = useState<number[]>([])
  const [currentId, setCurrentId] = useState(1)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadWorkbenchProgress("ultron")
    setCompleted(saved.completed.filter(id => PROBLEMS_ULTRON.some(p => p.id === id)))
    setCurrentId(saved.currentId)
    setHydrated(true)
  }, [])

  const done = new Set(completed)
  const doneCount = done.size
  const total = PROBLEMS_ULTRON.length
  const pct = total > 0 ? (doneCount / total) * 100 : 0
  const started = doneCount > 0

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">ULTRON / {STAGES_ULTRON.length} SECTIONS &middot; {total} PROBLEMS</span>
          <h1>No sklearn. Just math that learns.</h1>
          <p>
            The AI/ML ladder, strictly linear: every problem teaches exactly one machine-learning move
            in pure NumPy — from the first array through gradient descent, classification, generalization
            and trees, to backprop and the training loop that powers everything. Each drill runs real
            Python in your browser with instant tests on frozen datasets.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href={`/ultron/practice?problem=${started ? currentId : 1}`}>
              {started ? "Continue the ladder" : "Start the ladder"} <span aria-hidden="true">-&gt;</span>
            </Link>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Ladder progress">
          <span>TRAINED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${doneCount}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      {TIERS.map(tier => {
        const tierProblems = PROBLEMS_ULTRON.filter(p => tier.stages.includes(p.stage))
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
                const stage = STAGES_ULTRON[stageId]
                const problems = PROBLEMS_ULTRON.filter(p => p.stage === stageId)
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
                          <Link href={`/ultron/practice?problem=${p.id}`} className={`icpc-problem${done.has(p.id) ? " done" : ""}`}>
                            <span className="icpc-problem-dot">{done.has(p.id) ? "✓" : p.id}</span>
                            <span className="icpc-problem-name">{p.title}</span>
                            <span className="icpc-diff db-skill">{p.skill}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link className="icpc-section-cta" href={`/ultron/practice?problem=${firstId}`}>
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
