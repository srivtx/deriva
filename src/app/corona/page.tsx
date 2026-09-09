"use client"

import { useEffect, useRef, useState } from "react"
import { PUZZLES_CORONA, type CoronaGoal, type CoronaPuzzle } from "@/data/corona"
import CoronaLab, { type CoronaParams, type CoronaGrade } from "@/components/corona-lab"
import ProgressRing from "@/components/progress-ring"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — The Witness", note: "one closed ring is already a proof", stages: [0] },
  { name: "II — The Frontier", note: "stack coronas toward the open five", stages: [1] },
]

const STORE_KEY = "corona-progress-v1"

export default function CoronaPage() {
  const [solved, setSolved] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [picks, setPicks] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const picksRef = useRef<Record<number, number>>({})
  const numInputs = useRef<Record<number, string>>({})
  const paramsRef = useRef<CoronaParams>({ grid: "square", cells: [], tool: "draw", maxDepth: 3 })
  const puzzleRef = useRef<CoronaGrade | null>(null)

  const pickOption = (id: number, i: number) => {
    picksRef.current[id] = i
    setPicks(prev => ({ ...prev, [id]: i }))
    setChecked(prev => ({ ...prev, [id]: false }))
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setSolved(JSON.parse(raw).solved ?? [])
    } catch {}
    setHydrated(true)
  }, [])

  const markSolved = (id: number) => {
    setSolved(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ solved: next })) } catch {}
      return next
    })
  }

  const done = new Set(solved)
  const total = PUZZLES_CORONA.length
  const pct = (done.size / total) * 100

  const checkMc = (id: number) => {
    const p = PUZZLES_CORONA.find(x => x.id === id)!
    const pick = picksRef.current[id]
    if (pick === undefined) return
    setChecked(prev => ({ ...prev, [id]: true }))
    if (pick === p.answer) markSolved(id)
  }

  const checkNum = (id: number) => {
    const p = PUZZLES_CORONA.find(x => x.id === id)!
    const v = Number(numInputs.current[id])
    if (Number.isNaN(v)) return
    const ok = Math.abs(v - (p.answer ?? 0)) <= (p.tol ?? 0.01)
    setChecked(prev => ({ ...prev, [id]: true }))
    if (ok) markSolved(id)
  }

  const gradeCreate = (goal: CoronaGoal, grade: CoronaGrade | null) => {
    if (!grade || !grade.ready) return false
    if (goal.tiler !== undefined && grade.tiler !== goal.tiler) return false
    if (goal.minDepth !== undefined && grade.depthReached < goal.minDepth) return false
    if (goal.minCells !== undefined && grade.cellCount < goal.minCells) return false
    if (goal.maxCells !== undefined && grade.cellCount > goal.maxCells) return false
    if (goal.grid !== undefined && paramsRef.current.grid !== goal.grid) return false
    return true
  }

  const createFailReason = (p: CoronaPuzzle) => {
    const goal = p.goal!
    const g = puzzleRef.current
    if (!g) return "The lab above has no shape yet — draw some cells, then check again."
    if (!g.ready) return g.error ? `The engine says: ${g.error}` : "The engine has nothing to grade yet — draw a shape and check again."
    if (goal.grid !== undefined && paramsRef.current.grid !== goal.grid) return `The lab is on the ${paramsRef.current.grid} grid — this puzzle wants ${goal.grid}.`
    if (goal.tiler === true && g.tiler !== true) return "The engine can't tile this shape yet — keep drawing until it proves a tiling."
    if (goal.tiler === false && g.tiler === true) return "The engine proves this shape TILES — a tiler has no Heesch number. Break it."
    if (goal.minCells !== undefined && g.cellCount < goal.minCells) return `${g.cellCount} cells — you need at least ${goal.minCells}.`
    if (goal.maxCells !== undefined && g.cellCount > goal.maxCells) return `${g.cellCount} cells — trim to ${goal.maxCells} or fewer.`
    if (goal.minDepth !== undefined && g.depthReached < goal.minDepth) return `Deepest corona so far: ${g.depthReached}. You need ${goal.minDepth}.`
    return "Not yet — re-read the goal chips and check again."
  }

  const checkCreate = (id: number) => {
    const p = PUZZLES_CORONA.find(x => x.id === id)!
    setChecked(prev => ({ ...prev, [id]: true }))
    if (gradeCreate(p.goal!, puzzleRef.current)) markSolved(id)
  }

  const goalChips = (goal: CoronaGoal) => {
    const chips: { label: string; req?: boolean }[] = []
    if (goal.tiler === true) chips.push({ label: "engine must prove TILES", req: true })
    if (goal.tiler === false) chips.push({ label: "engine must NOT tile", req: true })
    if (goal.minDepth !== undefined) chips.push({ label: `≥ ${goal.minDepth} ring${goal.minDepth === 1 ? "" : "s"}`, req: true })
    if (goal.maxDepth !== undefined) chips.push({ label: `rings set to ${goal.maxDepth}` })
    if (goal.minCells !== undefined) chips.push({ label: `≥ ${goal.minCells} cells` })
    if (goal.maxCells !== undefined) chips.push({ label: `≤ ${goal.maxCells} cells` })
    if (goal.grid !== undefined) chips.push({ label: `${goal.grid} grid` })
    return chips
  }

  return (
    <main className="icpc-page corona-page">
      <section className="corona-hero">
        <div className="corona-hero-copy">
          <span className="corona-hero-kicker">CORONA / DRAW A SHAPE · RING IT · CLIMB TO FIVE</span>
          <h1>The Heesch lab</h1>
          <p className="corona-hero-sub">
            Some shapes never tile the plane — the rings of copies they survive before the packing
            dies is their Heesch number. The record is 3; five is open.
          </p>
        </div>
        <div className="corona-hero-signal" aria-label="Puzzle progress">
          <span>SOLVED</span>
          <ProgressRing value={hydrated ? pct : 0} size={60} stroke={6} label={hydrated ? `${done.size}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      <a className="corona-contest" href="https://github.com/Layr-Labs/heesch" target="_blank" rel="noreferrer">
        <b>Live contest &middot; Sept 2026</b>
        <span>Five rings. No survivor. Find the first. <b>github.com/Layr-Labs/heesch</b> is running the hunt — your lab feeds it.</span>
      </a>

      <section className="corona-howto">
        <div className="corona-howto-card">
          <b>&copy; Watch</b>
          <span>A corona is a ring of copies that seals a shape in — no gaps, no overlaps. Watch the engine close rings around your shape and count how deep it gets.</span>
        </div>
        <div className="corona-howto-card">
          <b>&#9881; Operate</b>
          <span>Every control is live: draw and erase cells, switch square/hex grids, load presets, and dial how many coronas deep the engine should push.</span>
        </div>
        <div className="corona-howto-card">
          <b>&#10003; Solve</b>
          <span>Then the engine grades you: prove a tiling, break one on purpose, stack coronas toward the open frontier. 12 puzzles — progress saves on this device.</span>
        </div>
      </section>

      <section id="lab" className="corona-section">
        <div className="corona-lab-card">
          <CoronaLab paramsRef={paramsRef} puzzleRef={puzzleRef} />
        </div>
      </section>

      <div className="corona-stages">
        {TIERS.map(tier => {
          const puzzles = PUZZLES_CORONA.filter(p => tier.stages.includes(p.stage))
          const complete = puzzles.every(p => done.has(p.id))
          return (
            <section key={tier.name} className={`corona-stages-sec${complete ? " corona-complete" : ""}`}>
              <div className="corona-stages-head">
                <span className="corona-stages-name">{tier.name}</span>
                <span className="corona-stages-note">{tier.note}</span>
                <span className="corona-stages-count">
                  {puzzles.filter(p => done.has(p.id)).length}/{puzzles.length}
                </span>
              </div>
              <ul className="kyma-puzzle-list">
                {puzzles.map(p => {
                  const isDone = done.has(p.id)
                  const isChecked = checked[p.id]
                  const pick = picks[p.id]
                  const pickRight = pick !== undefined && pick === p.answer
                  const numVal = Number(numInputs.current[p.id])
                  const numRight = !Number.isNaN(numVal) && Math.abs(numVal - (p.answer ?? 0)) <= (p.tol ?? 0.01)
                  const createRight = p.kind === "create" ? gradeCreate(p.goal!, puzzleRef.current) : false
                  const right = isDone || pickRight || numRight || createRight
                  return (
                    <li key={p.id} className={`kyma-puzzle${isDone ? " done" : ""}`}>
                      <div className="kyma-puzzle-head">
                        <span className="icpc-problem-dot">{isDone ? "✓" : p.id}</span>
                        <h3>{p.title}</h3>
                        {p.hard && <span className="corona-hard">hard</span>}
                        {p.kind === "create" && (
                          <div className="corona-goal-row">
                            {goalChips(p.goal!).map(c => (
                              <span key={c.label} className={`corona-goal${c.req ? " corona-goal-req" : ""}`}>{c.label}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="kyma-prompt" title={p.prompt}>{p.prompt}</p>
                      {p.kind === "mc" && (
                        <div className="kyma-options">
                          {p.choices!.map((opt, i) => (
                            <button key={i} type="button"
                              className={`kyma-option${pick === i ? " picked" : ""}${isChecked && i === p.answer ? " right" : ""}${isChecked && pick === i && i !== p.answer ? " wrong" : ""}`}
                              onClick={() => pickOption(p.id, i)}>
                              {opt}
                            </button>
                          ))}
                          <button type="button" className="btn btn-sm kyma-check" onClick={() => checkMc(p.id)} disabled={pick === undefined}>
                            Check
                          </button>
                        </div>
                      )}
                      {p.kind === "num" && (
                        <div className="kyma-numrow">
                          <input type="number" step="any" className="kyma-num" placeholder="your answer"
                            onChange={e => { numInputs.current[p.id] = e.target.value; setChecked(prev => ({ ...prev, [p.id]: false })) }} />
                          <button type="button" className="btn btn-sm kyma-check" onClick={() => checkNum(p.id)}>Check</button>
                        </div>
                      )}
                      {p.kind === "create" && (
                        <div className="kyma-sim-puzzle">
                          <div className="corona-actions">
                            {p.goal?.grid && paramsRef.current.grid !== p.goal.grid && (
                              <button type="button" className="btn btn-sm" onClick={() => { paramsRef.current.grid = p.goal!.grid!; setChecked(prev => ({ ...prev, [p.id]: false })) }}>
                                Point the lab at the {p.goal.grid} grid
                              </button>
                            )}
                            {p.goal?.maxDepth && paramsRef.current.maxDepth !== p.goal.maxDepth && (
                              <button type="button" className="btn btn-sm" onClick={() => { paramsRef.current.maxDepth = p.goal!.maxDepth!; setChecked(prev => ({ ...prev, [p.id]: false })) }}>
                                Set the lab to {p.goal.maxDepth} rings
                              </button>
                            )}
                            <button type="button" className="btn btn-sm kyma-check" onClick={() => checkCreate(p.id)}>Check the shape</button>
                          </div>
                          {isChecked && !isDone && !createRight && <span className="corona-verdict no">{createFailReason(p)}</span>}
                          {(isDone || (isChecked && createRight)) && <span className="corona-verdict yes">{isDone && !isChecked ? "Solved." : "The engine agrees."}</span>}
                        </div>
                      )}
                      {(isDone || (isChecked && (p.kind === "mc" || p.kind === "num")) || (isChecked && p.kind === "create" && createRight)) && (
                        <p className="corona-why">
                          <b>{right ? "Why it works — " : "Why — "}</b>{p.why}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}
