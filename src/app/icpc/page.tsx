"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { STAGES_ICPC, PROBLEMS_ICPC } from "@/data/icpc"

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "icpc-diff-easy",
  Medium: "icpc-diff-medium",
  Hard: "icpc-diff-hard",
}

export default function IcpcPage() {
  const [done, setDone] = useState<Set<number>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-completed-v2")
      if (raw) {
        const all = JSON.parse(raw) as Record<string, number[]>
        setDone(new Set(all.icpc || []))
      }
    } catch {}
    setHydrated(true)
  }, [])

  const doneCount = done.size
  const pct = PROBLEMS_ICPC.length > 0 ? (doneCount / PROBLEMS_ICPC.length) * 100 : 0

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker">ICPC LADDER / {STAGES_ICPC.length} SECTIONS &middot; {PROBLEMS_ICPC.length} PROBLEMS</span>
          <h1>Contest strength, built in order.</h1>
          <p>
            A linear ladder from ad-hoc warmups to geometry and game theory, curated the way ICPC
            regionals layer skills: each section assumes exactly the ones before it. Solve in the
            browser with instant Python tests, then carry the pattern to the contest floor.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href={`/practice?topic=icpc&problem=${PROBLEMS_ICPC[0]?.id ?? 1}`}>
              Start the ladder <span aria-hidden="true">-&gt;</span>
            </Link>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Ladder progress">
          <span>SOLVED</span>
          <strong>{hydrated ? `${doneCount}/${PROBLEMS_ICPC.length}` : `0/${PROBLEMS_ICPC.length}`}</strong>
          <div className="icpc-signal-track"><div style={{ width: `${hydrated ? pct : 0}%` }} /></div>
          <small>{hydrated ? `${Math.round(pct)}% of the ladder` : "loading progress"}</small>
        </div>
      </section>

      <ol className="icpc-ladder">
        {STAGES_ICPC.map(stage => {
          const problems = PROBLEMS_ICPC.filter(p => p.stage === stage.id)
          const sectionDone = problems.filter(p => done.has(p.id)).length
          const complete = sectionDone === problems.length
          const firstId = problems[0]?.id
          return (
            <li key={stage.id} className={`icpc-section${complete ? " complete" : ""}`}>
              <div className="icpc-section-head">
                <span className="icpc-section-num">{String(stage.id).padStart(2, "0")}</span>
                <div className="icpc-section-title">
                  <h2>{stage.name}</h2>
                  <span>{stage.desc}</span>
                </div>
                <span className={`icpc-section-count${complete ? " done" : ""}`}>{sectionDone}/{problems.length}</span>
              </div>
              <ul className="icpc-problem-list">
                {problems.map(p => (
                  <li key={p.id}>
                    <Link href={`/practice?topic=icpc&problem=${p.id}`} className={`icpc-problem${done.has(p.id) ? " done" : ""}`}>
                      <span className="icpc-problem-dot">{done.has(p.id) ? "✓" : p.id}</span>
                      <span className="icpc-problem-name">{p.title}</span>
                      <span className={`icpc-diff ${DIFFICULTY_CLASS[p.difficulty] ?? ""}`}>{p.difficulty}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="icpc-section-cta" href={`/practice?topic=icpc&problem=${firstId}`}>
                Practice section <span aria-hidden="true">-&gt;</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
