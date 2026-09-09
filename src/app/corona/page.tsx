"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { STAGES_CORONA, PUZZLES_CORONA, CORONA_PRESETS, type CoronaGoal, type CoronaPuzzle } from "@/data/corona"
import CoronaLab, { type CoronaParams, type CoronaGrade } from "@/components/corona-lab"
import ProgressRing from "@/components/progress-ring"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — The Witness", note: "one closed ring is already a proof", stages: [0] },
  { name: "II — The Frontier", note: "stack coronas toward the open five", stages: [1] },
]

const STORE_KEY = "corona-progress-v1"
const TOUR_KEY = "corona-tour-v1"

const TOUR_STEPS: { title: string; body: string; target?: "lab" | "puzzles" }[] = [
  {
    title: "You just opened the Heesch lab",
    body: "CORONA is a court for one number: how many rings of copies can surround a shape that can never tile the plane. You draw, a real tiling engine checks your shape live, and every claim comes back as a replayable witness. This tour takes 45 seconds.",
  },
  {
    title: "The board — draw, ring, push",
    body: "Paint cells with the draw tool (or erase them), switch between the square and hex grids, load a preset shape, and set how many coronas deep the engine should push. As you work, the engine proves tilings, certifies coronas, and reports the deepest ring it can close around your shape — nothing is canned.",
    target: "lab",
  },
  {
    title: "Then — 12 puzzles graded by the engine",
    body: "The ladder below is scored by the tiling engine itself: make something that provably tiles, break a tiling on purpose, then stack coronas toward the open frontier — three rings is the confirmed record and five is the live contest. Failed checks explain exactly which condition died. Progress saves on this device.",
    target: "puzzles",
  },
]

export default function CoronaPage() {
  const [solved, setSolved] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [picks, setPicks] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const picksRef = useRef<Record<number, number>>({})
  const numInputs = useRef<Record<number, string>>({})
  const paramsRef = useRef<CoronaParams>({ grid: "square", cells: [], tool: "draw", maxDepth: 3 })
  const puzzleRef = useRef<CoronaGrade | null>(null)
  const labCardRef = useRef<HTMLDivElement>(null)
  const puzzleSectionRef = useRef<HTMLDivElement>(null)
  const [tour, setTour] = useState<number | null>(null)

  const pickOption = (id: number, i: number) => {
    picksRef.current[id] = i
    setPicks(prev => ({ ...prev, [id]: i }))
    setChecked(prev => ({ ...prev, [id]: false }))
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setSolved(JSON.parse(raw).solved ?? [])
      if (!localStorage.getItem(TOUR_KEY)) setTour(0)
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (tour === null) return
    const target = TOUR_STEPS[tour]?.target
    if (!target) return
    const el = target === "lab" ? labCardRef.current : puzzleSectionRef.current
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [tour])

  const closeTour = () => {
    setTour(null)
    try { localStorage.setItem(TOUR_KEY, "1") } catch {}
  }

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

  const loadPreset = (id: number, name: string) => {
    const preset = CORONA_PRESETS.find(x => x.name === name)
    if (!preset) return
    paramsRef.current.grid = preset.grid
    paramsRef.current.cells = preset.cells.map(([x, y]) => `${x},${y}`)
    setChecked(prev => ({ ...prev, [id]: false }))
  }

  return (
    <main className="icpc-page">
      <section className="icpc-hero corona-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">CORONA / DRAW A SHAPE · RING IT · CLIMB TO FIVE</span>
          <h1>The Heesch lab</h1>
          <p>
            Some shapes tile the plane forever. Some can&apos;t even be ringed once. The number of
            rings a non-tiler survives is its Heesch number — and whether it can reach 5 is a live
            open problem, with a contest running right now.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href="#lab">Open the lab <span aria-hidden="true">-&gt;</span></Link>
            <button type="button" className="btn" onClick={() => setTour(0)}>What is this? <small style={{ opacity: 0.7 }}>(45-sec tour)</small></button>
            <span className="icpc-hero-meta">Grading runs live in your browser. Progress saves locally.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Puzzle progress">
          <span>SOLVED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${done.size}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      <section className="corona-howto">
        <div className="corona-howto-card">
          <b>&copy; Watch</b>
          <span>A corona is a ring of copies that seals a shape in — no gaps, no overlaps. Watch the engine close rings around your shape and count how deep it gets before the packing dies.</span>
        </div>
        <div className="corona-howto-card">
          <b>&#9881; Operate</b>
          <span>Every control is live: draw and erase cells, switch square/hex grids, load the T, L, P or dihex presets, and dial how many coronas deep the engine should push.</span>
        </div>
        <div className="corona-howto-card">
          <b>&#10003; Solve</b>
          <span>Then the engine grades you: prove a tiling, break one on purpose, and stack coronas toward the open frontier. 12 puzzles — three is the record, five would end the problem.</span>
        </div>
      </section>

      <section id="lab" className="corona-lab">
        <div ref={labCardRef} className={`corona-lab-card${tour !== null && TOUR_STEPS[tour]?.target === "lab" ? " corona-tour-glow" : ""}`}>
          <div className="kyma-lab-head">
            <div>
              <h2>The Corona Board</h2>
              <span>1960s &middot; Heesch&rsquo;s problem &middot; square &amp; hex grids &middot; live tiling engine</span>
            </div>
            <span className="kyma-live-chip">live</span>
          </div>
          <div className="corona-lab-body">
            <div className="corona-stage">
              <CoronaLab paramsRef={paramsRef} puzzleRef={puzzleRef} />
            </div>
            <div className="corona-rail">
              <p className="kyma-lab-note">
                Surround a shape with copies of itself — no gaps, no overlaps — and you have built a
                <b> corona</b>. If the shape can never tile the plane, the number of nested coronas it
                survives is its <b>Heesch number</b>: 0 means it can&apos;t even be ringed once. The
                deepest number anyone has ever certified is 3.
              </p>
              <ul className="kyma-how">
                <li><b>Draw / erase</b> — paint cells on the square or hex grid.</li>
                <li><b>Rings dial</b> — how deep the engine pushes the coronas.</li>
                <li><b>Presets</b> — the T, the L, the P, the dihex: known shapes to carve from.</li>
                <li><b>Check puzzles</b> — the engine grades your current shape from this board.</li>
              </ul>
              <div className="kyma-facts">
                <span>A corona is a <b>witness</b>: exact copy positions anyone can replay to verify.</span>
                <span>Heesch asked in the 1960s — is there a shape no ring can kill at any depth? Still open.</span>
              </div>
              <a className="corona-contest" href="https://github.com/Layr-Labs/heesch" target="_blank" rel="noreferrer">
                <b>Live contest &middot; Sept 2026</b>
                <span>Five rings. No survivor. Find the first — github.com/Layr-Labs/heesch is running the hunt right now.</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div ref={puzzleSectionRef} className={tour !== null && TOUR_STEPS[tour]?.target === "puzzles" ? "corona-tour-glow" : ""}>
        {TIERS.map(tier => (
          <div key={tier.name}>
            <div className="one-tier">
              <span className="one-tier-name">{tier.name}</span>
              <span className="one-tier-note">{tier.note}</span>
              <span className="one-tier-count">
                {PUZZLES_CORONA.filter(p => tier.stages.includes(p.stage) && done.has(p.id)).length}
                /{PUZZLES_CORONA.filter(p => tier.stages.includes(p.stage)).length}
              </span>
            </div>
            {tier.stages.map(stageId => {
              const stage = STAGES_CORONA[stageId]
              const puzzles = PUZZLES_CORONA.filter(p => p.stage === stageId)
              const complete = puzzles.every(p => done.has(p.id))
              return (
                <div key={stageId} className={`icpc-section${complete ? " complete" : ""}`}>
                  <div className="icpc-section-head">
                    <span className="icpc-section-num">&#9673;</span>
                    <div className="icpc-section-title">
                      <h2>{stage.name}</h2>
                      <span>{stage.desc}</span>
                    </div>
                    <span className={`icpc-section-count${complete ? " done" : ""}`}>
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
                          </div>
                          <p className="kyma-prompt">{p.prompt}</p>
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
                              <div className="corona-goal-row">
                                {goalChips(p.goal!).map(c => (
                                  <span key={c.label} className={`corona-goal${c.req ? " corona-goal-req" : ""}`}>{c.label}</span>
                                ))}
                              </div>
                              <div className="corona-preset-row">
                                <span className="corona-preset-label">presets:</span>
                                {CORONA_PRESETS.map(pr => (
                                  <button key={pr.name} type="button" className="corona-preset" onClick={() => loadPreset(p.id, pr.name)}>
                                    {pr.name}
                                  </button>
                                ))}
                              </div>
                              <div className="corona-goal-row">
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
                              </div>
                              <button type="button" className="btn btn-sm kyma-check" onClick={() => checkCreate(p.id)}>Check the shape</button>
                              {isChecked && !isDone && !createRight && <span className="kyma-verdict no">{createFailReason(p)}</span>}
                              {(isDone || (isChecked && createRight)) && <span className="kyma-verdict yes">{isDone && !isChecked ? "Solved." : "The engine agrees."}</span>}
                            </div>
                          )}
                          {(isDone || (isChecked && (p.kind === "mc" || p.kind === "num")) || (isChecked && p.kind === "create" && createRight)) && (
                            <p className="kyma-why">
                              <b>{right ? "Why it works — " : "Why — "}</b>{p.why}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {tour !== null && typeof document !== "undefined" && createPortal(
        <div className="kyma-tour-backdrop" onClick={closeTour}>
          <div className="kyma-tour-card" onClick={e => e.stopPropagation()}>
            <span className="kyma-tour-step">{tour + 1} / {TOUR_STEPS.length}</span>
            <h3>{TOUR_STEPS[tour].title}</h3>
            <p>{TOUR_STEPS[tour].body}</p>
            <div className="kyma-tour-actions">
              <button type="button" className="btn btn-sm" onClick={closeTour}>Skip tour</button>
              {TOUR_STEPS[tour].target && (
                <button type="button" className="btn btn-sm" onClick={() => {
                  const t = TOUR_STEPS[tour].target
                  const el = t === "lab" ? labCardRef.current : puzzleSectionRef.current
                  el?.scrollIntoView({ behavior: "smooth", block: "center" })
                }}>Show me</button>
              )}
              <button type="button" className="btn btn-sm btn-accent" onClick={() => tour < TOUR_STEPS.length - 1 ? setTour(tour + 1) : closeTour()}>
                {tour < TOUR_STEPS.length - 1 ? "Next" : "Start playing"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}
