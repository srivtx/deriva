"use client"

// FOUNDRY · Station 03 — Attention Lens.
// One frozen head, three missions: predict the arcs, repair a smeared
// context (Lost in the Middle), and see why scores are scaled by 1/√d.

import { useEffect, useMemo, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { loadStationProgress, recordMissionCleared, recordStationRun } from "@/foundry/progress"
import {
  ATTENTION_CORPUS,
  COREFERENCE_SENTENCE,
  SMEAR_BASE,
  SMEAR_CONTROL,
  SMEAR_FILLERS,
  SMEAR_RECOVERED,
  attentionMassOn,
  buildEmbeddings,
  saturation,
  selfAttention,
  smearQueryIndex,
  topTargets,
} from "@/foundry/engine-attention"

const STATION = FOUNDRIES[2]
const EMBEDDINGS = buildEmbeddings(ATTENTION_CORPUS, 8)

function ArcView({
  tokens,
  queryIndex,
  weights,
  height = 110,
}: {
  tokens: string[]
  queryIndex: number
  weights: number[]
  height?: number
}) {
  const span = tokens.length * 56
  const x = (index: number) => (index + 0.5) * 56
  const max = Math.max(...weights.filter((_, i) => i !== queryIndex), 0.0001)
  return (
    <svg viewBox={`0 0 ${span} ${height}`} className="foundry-arc-svg" role="img" aria-label="attention arcs">
      {tokens.map((_, index) => {
        if (index === queryIndex) return null
        const weight = weights[index]
        const mid = (x(queryIndex) + x(index)) / 2
        const lift = 30 + Math.abs(x(index) - x(queryIndex)) / span * 60
        return (
          <path
            key={index}
            d={`M ${x(queryIndex)} ${height - 18} Q ${mid} ${height - 18 - lift} ${x(index)} ${height - 18}`}
            stroke="var(--viz-active)"
            strokeWidth={0.6 + (weight / max) * 7}
            strokeOpacity={0.25 + (weight / max) * 0.75}
            fill="none"
          />
        )
      })}
      {tokens.map((token, index) => (
        <g key={index}>
          <circle cx={x(index)} cy={height - 18} r={index === queryIndex ? 7 : 4} fill={index === queryIndex ? "var(--viz-pruned)" : "var(--viz-cached)"} />
          <text x={x(index)} y={height - 4} textAnchor="middle" className="foundry-arc-label">{token}</text>
        </g>
      ))}
    </svg>
  )
}

function PredictTheArcs({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const tokens = useMemo(() => COREFERENCE_SENTENCE.split(" "), [])
  const trace = useMemo(() => selfAttention(tokens, EMBEDDINGS), [tokens])
  const queries = useMemo(() => {
    const itIndex = tokens.indexOf("it")
    const wrenchIndex = tokens.indexOf("wrench")
    return [
      { index: itIndex, ask: "“it” sits between “because” and “was”. Where does its attention land?" },
      { index: wrenchIndex, ask: "Now “wrench”, the load-bearing noun. Its top target?" },
    ].filter(query => query.index > 0)
  }, [tokens])

  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const query = queries[round]
  const top = useMemo(() => (query ? topTargets(trace, query.index, 3) : []), [trace, query])
  const correct = picked !== null && top.length > 0 && picked === top[0].index

  const reveal = () => {
    setRevealed(true)
    if (correct) triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  const next = () => {
    if (round + 1 === queries.length) {
      triggerGameFeedback("complete")
      onDone()
      return
    }
    setRound(r => r + 1)
    setPicked(null)
    setRevealed(false)
  }

  if (!query) return null

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 1 · Predict the arc</span>
      <h1 className="stage-title">Attention is a weather report.</h1>
      <p className="narrative">
        Every token sends a query; every token offers a key. The score is their dot product scaled
        by 1/√d, softmaxed into weights. Before the reveal — predict where the highlighted token's
        strongest arc lands. Position pulls toward neighbours; meaning pulls toward kin.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>{COREFERENCE_SENTENCE}</span><b>query: {tokens[query.index]}</b></div>
        {revealed && <ArcView tokens={tokens} queryIndex={query.index} weights={trace.weights[query.index]} />}
        <div className="foundry-token-row">
          {tokens.map((token, index) => (
            <button
              key={index}
              className={`foundry-token-chip as-button ${index === query.index ? "is-query" : ""} ${picked === index ? "is-picked" : ""}`}
              disabled={index === query.index || revealed}
              onClick={() => setPicked(index)}
            >
              {token}
            </button>
          ))}
        </div>
        {revealed && (
          <div className="foundry-arc-ranking">
            {top.map((entry, rank) => (
              <span key={entry.index}><b>#{rank + 1}</b> {tokens[entry.index]} · {(entry.weight * 100).toFixed(1)}%</span>
            ))}
          </div>
        )}
        <code>{revealed ? `score(q,k) = q·k / √${8} → softmax row → weights` : "pick the chip you believe receives the strongest arc"}</code>
      </div>
      {!revealed && (
        <button className="btn-primary" disabled={picked === null} onClick={reveal}>Reveal the arcs →</button>
      )}
      {revealed && (
        <>
          <div className={`game-feedback ${correct ? "correct" : "wrong"}`}>
            <b>{correct ? "You read the head." : `The engine chose ${tokens[top[0].index]} at ${(top[0].weight * 100).toFixed(1)}%.`}</b>
            <p>
              A trained head resolves “it” toward the noun it refers to. This frozen head mixes
              positional neighbours with semantic kin from co-occurrence embeddings — the machinery
              is identical, only the learned weights differ.
            </p>
          </div>
          <button className="btn-primary" onClick={next}>{round + 1 === queries.length ? "Open the context lab →" : "Next query →"}</button>
        </>
      )}
    </section>
  )
}

function SmearMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const smearedTokens = useMemo(() => [...SMEAR_BASE.slice(0, 8), ...SMEAR_FILLERS, ...SMEAR_BASE.slice(8)], [])
  const mass = useMemo(() => {
    const measure = (tokens: string[], includeTail = false) => {
      const trace = selfAttention(tokens, EMBEDDINGS)
      const query = smearQueryIndex(tokens)
      const info = tokens.map((_, i) => i).filter(i => i < 8 || (includeTail && i >= 22))
      return { trace, query, mass: attentionMassOn(trace, query, info) }
    }
    return {
      base: measure(SMEAR_BASE),
      smeared: measure(smearedTokens),
      control: measure(SMEAR_CONTROL),
      recovered: measure(SMEAR_RECOVERED, true),
    }
  }, [smearedTokens])

  const [picked, setPicked] = useState<string | null>(null)
  const options = [
    { value: "repeat", label: "Repeat the key fact again at the very end" },
    { value: "pad", label: "Pad the context with even more generic text" },
    { value: "middle", label: "Move the key fact into the middle of the context" },
  ]

  const pick = (value: string) => {
    if (picked !== null) return
    setPicked(value)
    if (value === "repeat") triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  const bars = [
    { label: "clean context (14 tokens)", value: mass.base.mass },
    { label: "8 distractors injected", value: mass.smeared.mass },
    { label: "…plus 5 neutral tail tokens", value: mass.control.mass },
    { label: "…plus the fact repeated at the end", value: mass.recovered.mass },
  ]
  const maxMass = Math.max(...bars.map(bar => bar.value))

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 2 · The smear</span>
      <h1 className="stage-title">Distractors dilute attention. Edges restore it.</h1>
      <p className="narrative">
        The query is the final “cache”. The key fact — “the cache stores the keys near the values” —
        sits at the start. Watch its attention mass fall as noise floods in, then choose the repair
        a production engineer would actually make.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>attention mass on the key fact</span><b>query: “cache”</b></div>
        <div className="foundry-mass-bars">
          {bars.map(bar => (
            <div key={bar.label} className="foundry-mass-row">
              <small>{bar.label}</small>
              <div className="foundry-dist-track"><span style={{ width: `${(bar.value / maxMass) * 100}%` }} /></div>
              <b>{(bar.value * 100).toFixed(1)}%</b>
            </div>
          ))}
        </div>
        <code>Lost in the Middle: models trust the edges; the middle gets scraped thin</code>
      </div>
      <div className="game-choice-box">
        {options.map(option => (
          <button key={option.value} className={`game-choice ${picked === option.value ? (option.value === "repeat" ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className={`game-feedback ${picked === "repeat" ? "correct" : "wrong"}`}>
            <b>{picked === "repeat" ? "The bar proves it: 30% → 45%." : "The bars above already vetoed that."}</b>
            <p>
              Padding dilutes further (30.4%); burying the fact mid-context is exactly where
              attention is weakest. Repeating the critical instruction at the end restores the
              mass — the same reason production prompts restate constraints after long context.
            </p>
          </div>
          <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Open the scaling bench →</button>
        </>
      )}
    </section>
  )
}

function ScalingMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const tokens = useMemo(() => ["the", "keys", "match", "the", "values"], [])
  const [scaled, setScaled] = useState(true)
  const trace = useMemo(() => selfAttention(tokens, EMBEDDINGS, { scale: scaled }), [tokens, scaled])
  const heat = useMemo(() => saturation(trace), [trace])
  const unscaledHeat = useMemo(() => saturation(selfAttention(tokens, EMBEDDINGS, { scale: false })), [tokens])

  const [picked, setPicked] = useState<string | null>(null)
  const options = [
    { value: "onehot", label: "Rows saturate near one-hot — attention locks onto whoever is loudest" },
    { value: "uniform", label: "Rows flatten to uniform — every token gets equal attention" },
    { value: "negative", label: "Scores go negative and softmax fails" },
  ]

  const pick = (value: string) => {
    if (picked !== null) return
    setPicked(value)
    if (value === "onehot") triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 3 · The 1/√d switch</span>
      <h1 className="stage-title">Why the dot product is divided by √8.</h1>
      <p className="narrative">
        Dimension d means d terms summed in every dot product — with unit-ish vectors the raw scores
        grow with d, and softmax on large scores saturates. Flip the switch and watch a five-token
        row go from opinionated to fanatical.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top">
          <span>weights grid · row = query</span>
          <b>avg row-max: {(heat * 100).toFixed(1)}% {scaled ? "(scaled)" : "(raw)"}</b>
        </div>
        <div className="foundry-heat-grid" style={{ gridTemplateColumns: `repeat(${tokens.length}, 1fr)` }}>
          {tokens.map((_, row) =>
            tokens.map((__, column) => {
              const weight = trace.weights[row][column]
              return <span key={`${row}-${column}`} style={{ opacity: 0.12 + weight * 0.85 }} title={`${tokens[row]} → ${tokens[column]}: ${(weight * 100).toFixed(1)}%`} />
            }),
          )}
        </div>
        <div className="foundry-token-row">
          {tokens.map((token, index) => <span key={index} className="foundry-token-chip">{token}</span>)}
        </div>
        <div className="foundry-step-controls">
          <button className="btn-ghost" onClick={() => { triggerGameFeedback("move"); setScaled(s => !s) }}>
            {scaled ? "Turn OFF 1/√d scaling" : "Turn ON 1/√d scaling"}
          </button>
        </div>
        <code>scaled rows max ≈ {(heat * 100).toFixed(0)}% · raw rows max ≈ {(unscaledHeat * 100).toFixed(0)}%</code>
      </div>
      <div className="game-choice-box">
        {options.map(option => (
          <button key={option.value} className={`game-choice ${picked === option.value ? (option.value === "onehot" ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className={`game-feedback ${picked === "onehot" ? "correct" : "wrong"}`}>
            <b>{picked === "onehot" ? "Saturation is the enemy." : "Flip the switch and re-read the grid."}</b>
            <p>Without scaling, large raw scores push softmax toward winner-take-all: gradients die, attention stops listening, and one loud token drowns the sentence. Vaswani et al. called it “dot products growing large” — you just watched it.</p>
          </div>
          <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Finish the lens →</button>
        </>
      )}
    </section>
  )
}

export default function AttentionLensPage() {
  const [mission, setMission] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

  // Resume where the last session left off; fully cleared stations replay from the top.
  useEffect(() => {
    const saved = loadStationProgress(STATION.id)
    if (saved && saved.missionsCleared > 0 && saved.missionsCleared < STATION.missions) setMission(saved.missionsCleared + 1)
  }, [])

  const next = () => {
    recordMissionCleared(STATION.id, mission)
    setMission(m => m + 1)
  }

  const complete = () => {
    triggerGameFeedback("complete")
    recordStationRun(STATION.id, STATION.missions, mistakes)
    setFinished(true)
  }

  if (finished) {
    return (
      <FoundryShell station={STATION} mission={STATION.missions}>
        <FoundryCompletion
          station={STATION}
          stats={[
            { label: "Missions cleared", value: STATION.missions },
            { label: "Mistakes this run", value: mistakes },
            { label: "Head dimensions", value: "d = 8" },
          ]}
          concepts={[
            { title: "Queries meet keys", description: "Attention weight = softmax(q·k/√d) — a differentiable lookup." },
            { title: "Position + meaning mix", description: "Embeddings carry semantics; sinusoids carry order; the head reads both." },
            { title: "Edges beat middles", description: "Distractors dilute attention mass; repeating key facts at the end restores it." },
            { title: "Scaling keeps softmax sane", description: "1/√d stops dot products from saturating rows into one-hot." },
          ]}
          onRestart={() => {
            setMission(1)
            setMistakes(0)
            setFinished(false)
          }}
        />
      </FoundryShell>
    )
  }

  return (
    <FoundryShell station={STATION} mission={mission}>
      {mission === 1 && <PredictTheArcs onDone={next} onMistake={() => setMistakes(m => m + 1)} />}
      {mission === 2 && <SmearMission onDone={next} onMistake={() => setMistakes(m => m + 1)} />}
      {mission === 3 && <ScalingMission onDone={complete} onMistake={() => setMistakes(m => m + 1)} />}
    </FoundryShell>
  )
}
