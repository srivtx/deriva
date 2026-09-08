"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { STAGES_KYMA, PUZZLES_KYMA } from "@/data/kyma"
import KymaPlate from "@/components/kyma-plate"
import KymaRD from "@/components/kyma-rd"
import ProgressRing from "@/components/progress-ring"

const TIERS: { name: string; note: string; stages: number[] }[] = [
  { name: "I — The Still Plate", note: "resonance draws; the sand remembers", stages: [0, 1] },
  { name: "II — The Turing Zoo", note: "the mixer that paints, fed and killed", stages: [2, 3] },
]

const STORE_KEY = "kyma-progress-v1"

export default function KymaPage() {
  const [solved, setSolved] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [picks, setPicks] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const picksRef = useRef<Record<number, number>>({})
  const plateRefs = useRef<Record<number, { m: number; n: number; mix: number }>>({})
  const fkRefs = useRef<Record<number, { F: number; k: number }>>({})
  const numInputs = useRef<Record<number, string>>({})

  const pickOption = (id: number, i: number) => {
    picksRef.current[id] = i
    setPicks(prev => ({ ...prev, [id]: i }))
    setChecked(prev => ({ ...prev, [id]: false }))
  }

  const getPlateRef = (id: number) => {
    if (!plateRefs.current[id]) plateRefs.current[id] = { m: 0, n: 0, mix: 0 }
    return plateRefs.current[id]
  }
  const getFkRef = (id: number) => {
    if (!fkRefs.current[id]) fkRefs.current[id] = { F: 0, k: 0 }
    return fkRefs.current[id]
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setSolved(JSON.parse(raw).solved ?? [])
    } catch { /* fresh device */ }
    setHydrated(true)
  }, [])

  const markSolved = (id: number) => {
    setSolved(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ solved: next })) } catch { /* private mode */ }
      return next
    })
  }

  const done = new Set(solved)
  const total = PUZZLES_KYMA.length
  const pct = (done.size / total) * 100

  const checkMc = (id: number) => {
    const p = PUZZLES_KYMA.find(x => x.id === id)!
    const pick = picksRef.current[id]
    if (pick === undefined) return
    setChecked(prev => ({ ...prev, [id]: true }))
    if (pick === p.answer) markSolved(id)
  }

  const checkNum = (id: number) => {
    const p = PUZZLES_KYMA.find(x => x.id === id)!
    const v = Number(numInputs.current[id])
    if (Number.isNaN(v)) return
    const ok = Math.abs(v - (p.numAnswer ?? 0)) <= (p.tol ?? 0.01)
    setChecked(prev => ({ ...prev, [id]: true }))
    if (ok) markSolved(id)
  }

  const checkPlate = (id: number) => {
    const p = PUZZLES_KYMA.find(x => x.id === id)!
    const cur = plateRefs.current[id]
    const t = p.target!
    const ok = !!cur && cur.m === t.m && cur.n === t.n && Math.abs(cur.mix - t.mix) <= 0.15
    setChecked(prev => ({ ...prev, [id]: true }))
    if (ok) markSolved(id)
  }

  const checkFk = (id: number) => {
    const p = PUZZLES_KYMA.find(x => x.id === id)!
    const cur = fkRefs.current[id]
    const t = p.fkTarget!
    const tol = p.fkTol!
    const ok = !!cur && Math.abs(cur.F - t.F) <= tol.F && Math.abs(cur.k - t.k) <= tol.k
    setChecked(prev => ({ ...prev, [id]: true }))
    if (ok) markSolved(id)
  }

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">KYMA / 2 PHENOMENA &middot; {total} PUZZLES</span>
          <h1>The wave draws. The sand remembers.</h1>
          <p>
            Why does sand on a humming plate snap into mandalas? Why does heated fluid grow hexagons?
            Why can diffusion — the great mixer — paint leopard spots? KYMA is the pattern-formation
            lab: drive a real Chladni plate (with its tone), grow a Turing reaction in a live dish,
            then test yourself with puzzles graded against the actual physics — dial the plate to
            match a figure, set the chemistry to grow coral. Every figure you&rsquo;ll meet is one
            instability away from uniform.
          </p>
          <div className="icpc-hero-actions">
            <Link className="icpc-primary" href="#lab">Open the lab <span aria-hidden="true">-&gt;</span></Link>
            <span className="icpc-hero-meta">Sims run on your GPU. Progress saves locally.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Puzzle progress">
          <span>SOLVED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${done.size}` : "0"} sub={`of ${total}`} />
        </div>
      </section>

      <section id="lab" className="kyma-lab">
        <div className="kyma-lab-card kyma-lab-card-wide">
          <div className="kyma-lab-head">
            <div>
              <h2>The Chladni Plate</h2>
              <span>1787 &middot; resonance &middot; cymatics &middot; square &amp; circular plates</span>
            </div>
            <span className="kyma-live-chip">live</span>
          </div>
          <div className="kyma-lab-body">
            <div className="kyma-lab-stage">
              <KymaPlate initial={{ m: 3, n: 2, mix: 0 }} />
            </div>
            <div className="kyma-lab-rail">
              <p className="kyma-lab-note">
                Bow a plate at one of its resonant frequencies and it settles into a standing wave.
                Sand is kicked off the fast regions and comes to rest on the <b>nodal lines</b> — the
                places the plate never moves. Each frequency owns exactly one figure.
              </p>
              <ul className="kyma-how">
                <li><b>Slide m / n</b> — walk the mode ladder and watch the figure snap.</li>
                <li><b>Circle plate</b> — Bessel modes: nodal rings and spokes, true mandalas.</li>
                <li><b>Drive</b> — crank it and the sand boils; calm it and lines lock.</li>
                <li><b>Click the plate</b> — pour fresh sand where you like.</li>
                <li><b>Play the tone</b> — hear the frequency that draws what you see.</li>
              </ul>
              <div className="kyma-facts">
                <span>Sand gathers where the plate is <b>still</b> — the figure is a zero-motion map.</span>
                <span>Chladni&rsquo;s law for round plates: f &prop; (m + 2n)&sup2; — a ring costs two spokes.</span>
                <span>Violin makers still tune plates by sprinkling sand and listening.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="kyma-lab-card kyma-lab-card-wide">
          <div className="kyma-lab-head">
            <div>
              <h2>The Turing Dish</h2>
              <span>1952 &middot; Gray&ndash;Scott reaction&ndash;diffusion &middot; live F&ndash;k atlas</span>
            </div>
            <span className="kyma-live-chip">live</span>
          </div>
          <div className="kyma-lab-body">
            <div className="kyma-lab-stage">
              <KymaRD initial={{ F: 0.0545, k: 0.062 }} />
            </div>
            <div className="kyma-lab-rail">
              <p className="kyma-lab-note">
                Two chemicals: A is fed in, B makes more of itself by consuming A and is drained at
                rate k. B&rsquo;s inhibitor-like spread fences off neighborhoods, so the uniform soup
                breaks into cells, worms, coral or spirals — depending only on F and k. This is a
                real Gray&ndash;Scott integration on your GPU, frame by frame.
              </p>
              <ul className="kyma-how">
                <li><b>Click the atlas</b> — steer the chemistry anywhere on the F&ndash;k plane.</li>
                <li><b>Seed / Clear brush</b> — paint colonies or wipe them, any size.</li>
                <li><b>Pause / Step</b> — freeze time and advance frame by frame.</li>
                <li><b>Colormaps</b> — Ember, Rose, Tide, Dune — same chemistry, new light.</li>
              </ul>
              <div className="kyma-facts">
                <span>Diffusion — the homogenizer — is the thing that paints. That was Turing&rsquo;s 1952 shock.</span>
                <span>The prediction waited <b>38 years</b> for a laboratory confirmation (CIMA gel, 1990).</span>
                <span>Zebrafish stripes, hair follicles and palate ridges run this same math.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {TIERS.map(tier => (
        <div key={tier.name}>
          <div className="one-tier">
            <span className="one-tier-name">{tier.name}</span>
            <span className="one-tier-note">{tier.note}</span>
            <span className="one-tier-count">
              {PUZZLES_KYMA.filter(p => tier.stages.includes(p.stage) && done.has(p.id)).length}
              /{PUZZLES_KYMA.filter(p => tier.stages.includes(p.stage)).length}
            </span>
          </div>
          {tier.stages.map(stageId => {
            const stage = STAGES_KYMA[stageId]
            const puzzles = PUZZLES_KYMA.filter(p => p.stage === stageId)
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
                    const numRight = !Number.isNaN(numVal) && Math.abs(numVal - (p.numAnswer ?? 0)) <= (p.tol ?? 0.01)
                    const plateCur = plateRefs.current[p.id]
                    const plateRight = !!plateCur && p.target && plateCur.m === p.target.m && plateCur.n === p.target.n && Math.abs(plateCur.mix - p.target.mix) <= 0.15
                    const fkCur = fkRefs.current[p.id]
                    const fkRight = !!fkCur && p.fkTarget && p.fkTol && Math.abs(fkCur.F - p.fkTarget.F) <= p.fkTol.F && Math.abs(fkCur.k - p.fkTarget.k) <= p.fkTol.k
                    const right = isDone || pickRight || numRight || plateRight || fkRight
                    return (
                      <li key={p.id} className={`kyma-puzzle${isDone ? " done" : ""}`}>
                        <div className="kyma-puzzle-head">
                          <span className="icpc-problem-dot">{isDone ? "✓" : p.id}</span>
                          <h3>{p.title}</h3>
                        </div>
                        <p className="kyma-prompt">{p.prompt}</p>
                        {p.kind === "mc" && (
                          <div className="kyma-options">
                            {p.options!.map((opt, i) => (
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
                        {p.kind === "plate" && (
                          <div className="kyma-sim-puzzle">
                            <KymaPlate target={p.target} paramsRef={{ current: getPlateRef(p.id) }} mini />
                            <button type="button" className="btn btn-sm kyma-check" onClick={() => checkPlate(p.id)}>Check the plate</button>
                            {isChecked && !isDone && !right && <span className="kyma-verdict no">Not yet — match the green target figure.</span>}
                            {(isDone || (isChecked && right)) && <span className="kyma-verdict yes">{isDone && !isChecked ? "Solved." : "The sand agrees."}</span>}
                          </div>
                        )}
                        {p.kind === "fk" && (
                          <div className="kyma-sim-puzzle">
                            <KymaRD fkRef={{ current: getFkRef(p.id) }} mini />
                            <button type="button" className="btn btn-sm kyma-check" onClick={() => checkFk(p.id)}>Check the dish</button>
                            {isChecked && !isDone && !right && <span className="kyma-verdict no">Not yet — grow the described texture.</span>}
                            {(isDone || (isChecked && right)) && <span className="kyma-verdict yes">{isDone && !isChecked ? "Solved." : "The dish agrees."}</span>}
                          </div>
                        )}
                        {(isDone || (isChecked && (p.kind === "mc" || p.kind === "num")) || (isChecked && (p.kind === "plate" || p.kind === "fk") && right)) && (
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
    </main>
  )
}
