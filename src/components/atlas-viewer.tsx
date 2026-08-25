"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ATLAS_GRAPH, type AtlasAlgorithm, type AtlasStep } from "@/data/atlas"

export default function AtlasViewer({ algorithm }: { algorithm: AtlasAlgorithm }) {
  const steps = algorithm.steps
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!playing) return
    if (index >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => setIndex(value => Math.min(value + 1, steps.length - 1)), 950 / speed)
    return () => clearTimeout(timer)
  }, [playing, index, speed, steps.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") { event.preventDefault(); setIndex(value => Math.min(value + 1, steps.length - 1)); setPlaying(false) }
      if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(value => Math.max(value - 1, 0)); setPlaying(false) }
      if (event.key === " ") { event.preventDefault(); setPlaying(value => !value) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [steps.length])

  const step = steps[index]
  const max = useMemo(() => Math.max(...(step.values ?? [1])), [step])

  const restart = () => { setIndex(0); setPlaying(false) }
  const stepBack = () => { setPlaying(false); setIndex(value => Math.max(0, value - 1)) }
  const stepFwd = () => { setPlaying(false); setIndex(value => Math.min(steps.length - 1, value + 1)) }
  const cycleSpeed = () => setSpeed(value => (value === 1 ? 2 : value === 2 ? 4 : 1))

  return (
    <main className="super-page atlas-page">
      <section className="atlas-head">
        <div>
          <span className="super-kicker">ALGORITHM ATLAS / {algorithm.family.toUpperCase()}</span>
          <h1>{algorithm.glyph} {algorithm.title}</h1>
          <p>{algorithm.blurb}</p>
          <span className="atlas-complexity">{algorithm.complexity} · {steps.length} steps</span>
        </div>
        <Link className="super-ghost" href="/atlas">All algorithms</Link>
      </section>

      <section className="atlas-stage" aria-label="Visualization">
        {algorithm.viz === "array" && <ArrayViz step={step} max={max} />}
        {algorithm.viz === "graph" && <GraphViz step={step} algorithm={algorithm} />}
        {algorithm.viz === "stack" && <StackViz step={step} />}
      </section>

      <section className="atlas-desc" aria-label="Current step">
        <span className="super-kicker">STEP {index + 1} / {steps.length}</span>
        <p>{step.desc}</p>
      </section>

      <section className="atlas-controls" aria-label="Playback controls">
        <button type="button" onClick={restart} aria-label="Restart" className="atlas-ctrl">⟲</button>
        <button type="button" onClick={stepBack} disabled={index === 0} aria-label="Step back" className="atlas-ctrl">←</button>
        <button type="button" onClick={() => { if (index >= steps.length - 1) setIndex(0); setPlaying(value => !value) }} aria-label={playing ? "Pause" : "Play"} className="atlas-ctrl atlas-play">{playing ? "❚❚" : "▶"}</button>
        <button type="button" onClick={stepFwd} disabled={index === steps.length - 1} aria-label="Step forward" className="atlas-ctrl">→</button>
        <button type="button" onClick={cycleSpeed} className="atlas-ctrl atlas-speed">{speed}×</button>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={index}
          onChange={event => { setPlaying(false); setIndex(Number(event.target.value)) }}
          className="atlas-scrub"
          aria-label="Scrub through steps"
        />
      </section>

      <section className="atlas-code-wrap" aria-label="Reference code">
        <div className="ed-bar"><span className="ed-lang">Python</span><span className="ed-file">reference.py</span><span className="ready">line {step.line} active</span></div>
        <pre className="atlas-code">
          {algorithm.code.split("\n").map((line, i) => (
            <div key={i} className={step.line === i + 1 ? "active" : ""}>
              <span className="atlas-line-no">{i + 1}</span>
              <code>{line || " "}</code>
            </div>
          ))}
        </pre>
      </section>

      <div className="atlas-keyboard-hint">← → step · space play/pause</div>
    </main>
  )
}

function ArrayViz({ step, max }: { step: AtlasStep; max: number }) {
  const values = step.values ?? []
  return (
    <div className="atlas-array">
      {step.window && (
        <div
          className="atlas-window"
          style={{ left: `${(step.window[0] / values.length) * 100}%`, width: `${((step.window[1] - step.window[0] + 1) / values.length) * 100}%` }}
          aria-hidden="true"
        />
      )}
      <div className="atlas-bars">
        {values.map((value, i) => {
          const isSwap = step.swap?.includes(i)
          const isCompare = step.compare?.includes(i)
          const isSettled = step.settled?.includes(i)
          return (
            <div key={i} className="atlas-bar-slot">
              <span className="atlas-bar-value">{value}</span>
              <div
                className={`atlas-bar${isSwap ? " swap" : isCompare ? " compare" : isSettled ? " settled" : ""}`}
                style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
              />
              <span className="atlas-bar-index">{i}</span>
            </div>
          )
        })}
      </div>
      {step.pointers && step.pointers.length > 0 && (
        <div className="atlas-pointers">
          {step.pointers.map(pointer => (
            <span key={pointer.label} className="atlas-pointer" style={{ left: `${((pointer.index + 0.5) / values.length) * 100}%` }}>{pointer.label}</span>
          ))}
        </div>
      )}
      {step.aux && step.aux.length > 0 && (
        <div className="atlas-aux">
          {step.aux.map(item => <span key={item.label}>{item.label}: <b>{item.value}</b></span>)}
        </div>
      )}
    </div>
  )
}

function GraphViz({ step, algorithm }: { step: AtlasStep; algorithm: AtlasAlgorithm }) {
  const isDijkstra = algorithm.slug === "dijkstra"
  const edges = isDijkstra ? ATLAS_GRAPH.dijkstraEdges.map(([u, v, w]) => ({ u, v, w })) : ATLAS_GRAPH.edges.map(([u, v]) => ({ u, v, w: null }))
  return (
    <div className="atlas-graph">
      <svg viewBox="0 0 100 62" role="img" aria-label="Graph visualization">
        {edges.map((edge, i) => {
          const isActive = step.activeEdge && ((step.activeEdge[0] === edge.u && step.activeEdge[1] === edge.v) || (step.activeEdge[0] === edge.v && step.activeEdge[1] === edge.u))
          const midX = (ATLAS_GRAPH.nodes[edge.u].x + ATLAS_GRAPH.nodes[edge.v].x) / 2
          const midY = (ATLAS_GRAPH.nodes[edge.u].y + ATLAS_GRAPH.nodes[edge.v].y) / 2
          return (
            <g key={i}>
              <line
                x1={ATLAS_GRAPH.nodes[edge.u].x} y1={ATLAS_GRAPH.nodes[edge.u].y}
                x2={ATLAS_GRAPH.nodes[edge.v].x} y2={ATLAS_GRAPH.nodes[edge.v].y}
                className={`atlas-edge${isActive ? " active" : ""}`}
              />
              {edge.w != null && <text x={midX} y={midY - 1.5} className="atlas-edge-weight">{edge.w}</text>}
            </g>
          )
        })}
        {ATLAS_GRAPH.nodes.map((node, i) => {
          const isCurrent = step.current === i
          const isFrontier = step.frontier?.includes(i)
          const isVisited = step.visited?.includes(i)
          const dist = step.dist?.[i]
          return (
            <g key={i}>
              <circle
                cx={node.x} cy={node.y} r={5}
                className={`atlas-node${isCurrent ? " current" : isFrontier ? " frontier" : isVisited ? " visited" : ""}`}
              />
              <text x={node.x} y={node.y + 1.6} className="atlas-node-label">{i}</text>
              {dist != null && <text x={node.x} y={node.y + 10} className="atlas-node-dist">{dist === null ? "∞" : dist}</text>}
            </g>
          )
        })}
      </svg>
      {step.stackItems && step.stackItems.length > 0 && (
        <p className="atlas-stack-note">stack: [{step.stackItems.join(", ")}]</p>
      )}
    </div>
  )
}

function StackViz({ step }: { step: AtlasStep }) {
  const items = step.stackItems ?? []
  return (
    <div className="atlas-stack">
      <div className="atlas-stack-frame">
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className={`atlas-stack-item${i === items.length - 1 ? " top" : i === (step.highlight ?? -1) ? " flash" : ""}`}>{item}</div>
        ))}
        {items.length === 0 && <div className="atlas-stack-empty">empty stack</div>}
      </div>
      <span className="atlas-stack-base">stack base</span>
    </div>
  )
}
