"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { STAGES_PDB, PROBLEMS_PDB } from "@/data/pdb"
import ProgressRing from "@/components/progress-ring"
import { loadWorkbenchProgress } from "@/persistence/workbench-progress"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — The Evidence", note: "read the failure, hunt the one-line lie", stages: [0, 1] },
  { name: "II — The Instrument", note: "step through state, trust the shapes", stages: [2, 3] },
  { name: "III — The Swamp", note: "NaN poisons, dtypes demote", stages: [4, 5] },
  { name: "IV — The Machinery", note: "identities, aliases, recursion floors", stages: [6, 7] },
  { name: "V — The Cascade", note: "many reds, one root", stages: [8] },
  { name: "VI — The Mask", note: "booleans route everything", stages: [9] },
  { name: "VII — The Gauntlet", note: "unfamiliar code, several roots, one clock", stages: [10] },
]

const STAGE_GLYPH: Record<number, string> = {
  0: "!", 1: "?", 2: "◉", 3: "⊞", 4: "∅", 5: "≈",
  6: "⧉", 7: "↻", 8: "⁂", 9: "¬", 10: "⌖",
}

export default function PdbLadderPage() {
  const [completed, setCompleted] = useState<number[]>([])
  const [currentId, setCurrentId] = useState(1)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadWorkbenchProgress("pdb")
    setCompleted(saved.completed.filter(id => PROBLEMS_PDB.some(p => p.id === id)))
    setCurrentId(saved.currentId)
    setHydrated(true)
  }, [])

  const done = new Set(completed)
  const doneCount = done.size
  const total = PROBLEMS_PDB.length
  const pct = total > 0 ? (doneCount / total) * 100 : 0
  const started = doneCount > 0

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">PDB / {STAGES_PDB.length} SECTIONS &middot; {total} DRILLS</span>
          <h1>Red tests in. Green tests out. That&rsquo;s the whole job.</h1>
          <p>
            The debugging ladder, strictly linear: every drill hands you a broken module and a failing
            test suite — the test is the spec, the traceback is the map, and the debugger is the
            flashlight. You start by reading your first assert and end hunting five interacting root
            causes in unfamiliar code, exactly like a real debugging assessment. A scripted pdb runs
            real debugger commands against your code, in your browser.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href={`/pdb/practice?problem=${started ? currentId : 1}`}>
              {started ? "Continue the ladder" : "Start the ladder"} <span aria-hidden="true">-&gt;</span>
            </Link>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Ladder progress">
          <span>FIXED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${doneCount}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      {TIERS.map(tier => {
        const tierProblems = PROBLEMS_PDB.filter(p => tier.stages.includes(p.stage))
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
                const stage = STAGES_PDB[stageId]
                const problems = PROBLEMS_PDB.filter(p => p.stage === stageId)
                const sectionDone = problems.filter(p => done.has(p.id)).length
                const complete = sectionDone === problems.length
                const firstId = problems[0]?.id
                return (
                  <li key={stageId} className={`icpc-section${complete ? " complete" : ""}`}>
                    <div className="icpc-section-head">
                      <span className="icpc-section-num">{STAGE_GLYPH[stageId] ?? String(stageId).padStart(2, "0")}</span>
                      <div className="icpc-section-title">
                        <h2>{stage.name}</h2>
                        <span>{stage.desc}</span>
                      </div>
                      <span className={`icpc-section-count${complete ? " done" : ""}`}>{sectionDone}/{problems.length}</span>
                    </div>
                    <p className="pdb-creed">{stage.creed}</p>
                    <ul className="icpc-problem-list">
                      {problems.map(p => (
                        <li key={p.id}>
                          <Link href={`/pdb/practice?problem=${p.id}`} className={`icpc-problem${done.has(p.id) ? " done" : ""}`}>
                            <span className="icpc-problem-dot">{done.has(p.id) ? "✓" : p.id}</span>
                            <span className="icpc-problem-name">{p.title}</span>
                            <span className="icpc-diff db-skill">{p.bugCount > 1 ? `${p.bugCount} bugs` : p.skill}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link className="icpc-section-cta" href={`/pdb/practice?problem=${firstId}`}>
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

      {hydrated && doneCount === total && total > 0 && (
        <section className="ultron-certified" aria-label="Ladder cleared">
          <span className="ultron-certified-mark">⌖</span>
          <div>
            <span className="ultron-certified-kicker">Ladder cleared</span>
            <strong>All {total} drills — from the first red test to the full gauntlet.</strong>
            <p>You can now take an unfamiliar broken module, read its suite as a specification, walk the traceback to the guilty frame, and fix root causes in order until the board is green. That is the whole craft.</p>
          </div>
          <Link className="ultron-certified-cta" href="/one">The mastery ladder →</Link>
        </section>
      )}

      <style>{`
        .icpc-section-num { font-family: var(--font-mono); }
        .pdb-creed { max-width: 68ch; margin: 4px 0 14px; font-size: 13px; line-height: 1.7; color: var(--ink-soft); white-space: pre-wrap; }
      `}</style>
    </main>
  )
}
