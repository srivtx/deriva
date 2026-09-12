"use client"

// FOUNDRY · Station 02 — Sampling Deck.
// A trigram LM with the full decode stack exposed. Missions: freeze it
// (T=0), hit an entropy band, cut the nucleus, then fly it hot and land it.

import { useEffect, useMemo, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { loadStationProgress, recordMissionCleared, recordStationRun } from "@/foundry/progress"
import { LM_CORPUS, generate, samplingPipeline, trainLM, type SamplingParams } from "@/foundry/engine-lm"

const STATION = FOUNDRIES[1]
const MODEL = trainLM(LM_CORPUS)
const SEED_CONTEXT = ["the", "sampler", "picks", "the"]

type DialLocks = { temperature: boolean; topK: boolean; topP: boolean }

function Dial({
  label,
  value,
  min,
  max,
  step,
  format,
  locked,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  locked: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className={`foundry-dial ${locked ? "locked" : ""}`}>
      <span className="foundry-dial-label">
        {label}
        <b>{format(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={locked}
        aria-label={label}
        onChange={event => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function SamplingDeck({
  params,
  setParams,
  locks,
  seed,
  onReroll,
}: {
  params: SamplingParams
  setParams: (params: SamplingParams) => void
  locks: DialLocks
  seed: number
  onReroll: () => void
}) {
  const [runTokens, setRunTokens] = useState<string[]>([])
  const pipeline = useMemo(
    () => samplingPipeline(MODEL, SEED_CONTEXT[2], SEED_CONTEXT[3], params),
    [params],
  )
  const maxP = pipeline.dist[0]?.p ?? 1

  const run = () => {
    triggerGameFeedback("move")
    setRunTokens(generate(MODEL, SEED_CONTEXT, 10, params, seed))
  }

  return (
    <div className="concept-visual forge-panel foundry-deck">
      <div className="concept-visual-top">
        <span>context: “{SEED_CONTEXT.join(" ")} …”</span>
        <b>{pipeline.level} · entropy {pipeline.entropyBits.toFixed(2)} bits · {pipeline.dist.length} alive</b>
      </div>
      <div className="foundry-dist-bars" aria-live="polite">
        {pipeline.dist.slice(0, 8).map(item => (
          <div key={item.token} className="foundry-dist-row">
            <code>{item.token}</code>
            <div className="foundry-dist-track"><span style={{ width: `${(item.p / maxP) * 100}%` }} /></div>
            <small>{(item.p * 100).toFixed(1)}%</small>
          </div>
        ))}
      </div>
      <div className="foundry-dial-row">
        <Dial
          label="temperature"
          value={params.temperature}
          min={0}
          max={2}
          step={0.05}
          format={v => (v === 0 ? "0 (greedy)" : v.toFixed(2))}
          locked={locks.temperature}
          onChange={v => setParams({ ...params, temperature: v })}
        />
        <Dial
          label="top-k"
          value={params.topK}
          min={0}
          max={10}
          step={1}
          format={v => (v === 0 ? "off" : String(v))}
          locked={locks.topK}
          onChange={v => setParams({ ...params, topK: v })}
        />
        <Dial
          label="top-p (nucleus)"
          value={params.topP}
          min={0.05}
          max={1}
          step={0.05}
          format={v => (v >= 0.999 ? "off" : v.toFixed(2))}
          locked={locks.topP}
          onChange={v => setParams({ ...params, topP: v })}
        />
      </div>
      <div className="foundry-step-controls">
        <button className="btn-primary" onClick={run}>Run 10 tokens →</button>
        <button className="btn-ghost" onClick={() => { onReroll(); setRunTokens([]) }}>reroll seed ({seed})</button>
      </div>
      {runTokens.length > 0 && (
        <div className="foundry-token-row foundry-generated">
          {runTokens.map((token, index) => (
            <span key={index} className="foundry-token-chip">{token}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function FrozenMission({ onDone }: { onDone: () => void }) {
  const [params, setParams] = useState<SamplingParams>({ temperature: 1, topK: 0, topP: 1 })
  const frozen = params.temperature === 0

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 1 · Freeze it</span>
      <h1 className="stage-title">Temperature 0 is not “cold”. It is greedy.</h1>
      <p className="narrative">
        Slide temperature to zero and watch the entire distribution collapse onto the single most
        likely token. That is what deterministic decoding means — the same prompt, the same words,
        forever. This context leans “token” at 60%.
      </p>
      <SamplingDeck
        params={params}
        setParams={setParams}
        locks={{ temperature: false, topK: true, topP: true }}
        seed={7}
        onReroll={() => undefined}
      />
      <div className="foundry-step-controls">
        <button className="btn-primary" disabled={!frozen} onClick={() => { triggerGameFeedback("correct"); onDone() }}>
          {frozen ? "Locked: greedy it is →" : "Slide temperature to 0 to lock →"}
        </button>
      </div>
      <code className="foundry-formula">T → 0: p^(1/T) collapses to argmax · T = 1: the model's own belief · T &gt; 1: flatter than belief</code>
    </section>
  )
}

function EntropyMission({ onDone }: { onDone: () => void }) {
  const [params, setParams] = useState<SamplingParams>({ temperature: 1, topK: 0, topP: 1 })
  const pipeline = useMemo(
    () => samplingPipeline(MODEL, SEED_CONTEXT[2], SEED_CONTEXT[3], params),
    [params],
  )
  const inBand = pipeline.entropyBits >= 0.6 && pipeline.entropyBits <= 0.9

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 2 · The entropy window</span>
      <h1 className="stage-title">Cool it to 0.60–0.90 bits.</h1>
      <p className="narrative">
        Entropy measures how undecided the sampler is — 0 bits means one inevitable token, log₂(n)
        bits means a perfect coin toss across n tokens. Cool this 60/20/20 distribution until the
        readout sits between 0.60 and 0.90 bits: focused, but not frozen.
      </p>
      <SamplingDeck
        params={params}
        setParams={setParams}
        locks={{ temperature: false, topK: true, topP: true }}
        seed={7}
        onReroll={() => undefined}
      />
      <div className="foundry-step-controls">
        <button className="btn-primary" disabled={!inBand} onClick={() => { triggerGameFeedback("correct"); onDone() }}>
          {inBand ? `Locked at ${pipeline.entropyBits.toFixed(2)} bits →` : "Tune temperature into the band →"}
        </button>
      </div>
      <code className="foundry-formula">H = −Σ p·log₂(p) · uniform 3-way = 1.58 bits · one-hot = 0 bits</code>
    </section>
  )
}

function NucleusMission({ onDone }: { onDone: () => void }) {
  const [params, setParams] = useState<SamplingParams>({ temperature: 1, topK: 0, topP: 1 })
  const pipeline = useMemo(
    () => samplingPipeline(MODEL, SEED_CONTEXT[2], SEED_CONTEXT[3], params),
    [params],
  )
  const survivors = pipeline.dist.length

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 3 · Cut the tail</span>
      <h1 className="stage-title">Keep exactly two tokens alive.</h1>
      <p className="narrative">
        Nucleus truncation sorts the distribution, walks down the cumulative mass, and stops once it
        covers top-p. Set the dial so the 60% token plus one 20% token survive — and the last 20%
        is cut. This is the cut that killed beam-search gibberish in production.
      </p>
      <SamplingDeck
        params={params}
        setParams={setParams}
        locks={{ temperature: true, topK: true, topP: false }}
        seed={7}
        onReroll={() => undefined}
      />
      <div className="foundry-step-controls">
        <button className="btn-primary" disabled={survivors !== 2} onClick={() => { triggerGameFeedback("correct"); onDone() }}>
          {survivors === 2 ? "Nucleus cut confirmed →" : `${survivors} alive — cut to exactly 2 →`}
        </button>
      </div>
      <code className="foundry-formula">cumulative 0.60 → 0.80 → 1.00 · top-p in (0.60, 0.80] keeps two</code>
    </section>
  )
}

function HotLandingMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [params, setParams] = useState<SamplingParams>({ temperature: 2, topK: 0, topP: 1 })
  const [seed, setSeed] = useState(21)
  const [picked, setPicked] = useState<string | null>(null)
  const options = [
    { value: "safe", label: "temperature 0.2 · top-p 0.9 — quiet and predictable" },
    { value: "wild", label: "temperature 2.0 · top-p off — maximum personality" },
    { value: "mid", label: "temperature 1.4 · top-p 0.5 — hot but the tail is cut" },
  ]

  const pick = (value: string) => {
    if (picked !== null) return
    setPicked(value)
    if (value === "safe") triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 4 · Fly it hot, land it safe</span>
      <h1 className="stage-title">Feel the chaos, then choose your defaults.</h1>
      <p className="narrative">
        The deck is fully unlocked. Run it at temperature 2.0 and watch a trigram model sprawl;
        cool it, cut the nucleus, run it again. Then pick the configuration you would actually
        ship for a production assistant.
      </p>
      <SamplingDeck
        params={params}
        setParams={setParams}
        locks={{ temperature: false, topK: false, topP: false }}
        seed={seed}
        onReroll={() => setSeed(s => (s * 31 + 7) % 997)}
      />
      <div className="game-choice-box">
        {options.map(option => (
          <button key={option.value} className={`game-choice ${picked === option.value ? (option.value === "safe" ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className={`game-feedback ${picked === "safe" ? "correct" : "wrong"}`}>
            <b>{picked === "safe" ? "That is the industry default for a reason." : "Bold — but support tickets bold."}</b>
            <p>Assistants ship near temperature 0.2 with a nucleus cut near 0.9: enough life to phrase things well, not enough to improvise facts. Creativity is for drafts, not for answers.</p>
          </div>
          <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Close the deck →</button>
        </>
      )}
    </section>
  )
}

export default function SamplingDeckPage() {
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
            { label: "Deck entropy", value: "1.58 bits max" },
          ]}
          concepts={[
            { title: "Temperature is shape", description: "It reweights the model's own beliefs — 0 is argmax, 1 is belief, higher is flatter." },
            { title: "Entropy is the dial's readout", description: "Bits of undecidedness: 0 means inevitable, log₂(n) means a fair die." },
            { title: "Nucleus cuts the tail", description: "Keep the smallest set covering top-p — the fix for degenerate text." },
            { title: "Defaults are a product decision", description: "Assistants land near T≈0.2, top-p≈0.9. Personality has a blast radius." },
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
      {mission === 1 && <FrozenMission onDone={next} />}
      {mission === 2 && <EntropyMission onDone={next} />}
      {mission === 3 && <NucleusMission onDone={next} />}
      {mission === 4 && <HotLandingMission onDone={complete} onMistake={() => setMistakes(m => m + 1)} />}
    </FoundryShell>
  )
}
