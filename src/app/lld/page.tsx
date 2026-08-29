"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { STAGES_LLD, PROBLEMS_LLD } from "@/data/lld"
import ProgressRing from "@/components/progress-ring"
import { loadWorkbenchProgress } from "@/persistence/workbench-progress"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — Model It", note: "nouns, responsibilities", stages: [0, 1] },
  { name: "II — Connect It", note: "relationships, state machines", stages: [2, 3] },
  { name: "III — Feel the Pain", note: "god classes and smells", stages: [4] },
  { name: "IV — Fix It", note: "patterns and first full systems", stages: [5, 6] },
  { name: "V — Name It", note: "SOLID and five more patterns", stages: [7, 8] },
  { name: "VI — The Second Canon", note: "the classic interview systems", stages: [9] },
]

export default function LLDLadderPage() {
  const [completed, setCompleted] = useState<number[]>([])
  const [currentId, setCurrentId] = useState(1)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadWorkbenchProgress("lld")
    setCompleted(saved.completed.filter(id => PROBLEMS_LLD.some(p => p.id === id)))
    setCurrentId(saved.currentId)
    setHydrated(true)
  }, [])

  const done = new Set(completed)
  const doneCount = done.size
  const total = PROBLEMS_LLD.length
  const pct = total > 0 ? (doneCount / total) * 100 : 0
  const started = doneCount > 0

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">LLD LADDER / {STAGES_LLD.length} SECTIONS &middot; {total} PROBLEMS</span>
          <h1>Design the objects. Name the principles.</h1>
          <p>
            The low-level design ladder, strictly linear: every problem teaches exactly one design move,
            and every full system composes only moves taught earlier. From noun-to-class reflex through
            state machines and smells, into patterns, SOLID, and the complete interview canon — parking
            lots to news feeds — each solved in the browser with instant Python tests.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href={`/lld/practice?problem=${started ? currentId : 1}`}>
              {started ? "Continue designing" : "Start the ladder"} <span aria-hidden="true">-&gt;</span>
            </Link>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Ladder progress">
          <span>DESIGNED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${doneCount}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      {TIERS.map(tier => {
        const tierProblems = PROBLEMS_LLD.filter(p => tier.stages.includes(p.stage))
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
                const stage = STAGES_LLD[stageId]
                const problems = PROBLEMS_LLD.filter(p => p.stage === stageId)
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
                          <Link href={`/lld/practice?problem=${p.id}`} className={`icpc-problem${done.has(p.id) ? " done" : ""}`}>
                            <span className="icpc-problem-dot">{done.has(p.id) ? "✓" : p.id}</span>
                            <span className="icpc-problem-name">{p.title}</span>
                            <span className="icpc-diff lld-skill">{p.skill}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link className="icpc-section-cta" href={`/lld/practice?problem=${firstId}`}>
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
