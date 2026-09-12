"use client"

// FOUNDRY · Station 04 — Serving Floor.
// A discrete-event inference server. Four missions: fit the KV cache with
// a dtype, break the straggler lock with continuous batching, kill the
// fragmentation waste with paging, then hold the SLA in a traffic crisis.

import { useMemo, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { recordStationRun } from "@/foundry/progress"
import {
  DTYPE_MB_PER_TOKEN,
  WORKLOAD_BATCHING,
  WORKLOAD_CRISIS,
  WORKLOAD_FIT,
  WORKLOAD_PAGING,
  simulateServing,
  type Dtype,
  type ServingConfig,
  type ServingResult,
  type Workload,
} from "@/foundry/engine-serving"

const STATION = FOUNDRIES[3]

type Locks = { dtype: boolean; slots: boolean; paging: boolean; continuous: boolean }

function FloorControls({ config, setConfig, locks }: { config: ServingConfig; setConfig: (config: ServingConfig) => void; locks: Locks }) {
  const dtypes: Dtype[] = ["fp16", "q8", "q4"]
  return (
    <div className="foundry-control-grid">
      <div className="foundry-control">
        <span className="foundry-dial-label">KV dtype <b>{DTYPE_MB_PER_TOKEN[config.dtype]} MB/token</b></span>
        <div className="foundry-segmented">
          {dtypes.map(dtype => (
            <button key={dtype} className={config.dtype === dtype ? "on" : ""} disabled={locks.dtype} onClick={() => setConfig({ ...config, dtype })}>{dtype}</button>
          ))}
        </div>
      </div>
      <div className="foundry-control">
        <span className="foundry-dial-label">batch slots <b>{config.slots}</b></span>
        <input type="range" min={1} max={8} step={1} value={config.slots} disabled={locks.slots} aria-label="batch slots" onChange={event => setConfig({ ...config, slots: Number(event.target.value) })} />
      </div>
      <div className="foundry-control">
        <span className="foundry-dial-label">KV allocation</span>
        <div className="foundry-segmented">
          <button className={!config.paging ? "on" : ""} disabled={locks.paging} onClick={() => setConfig({ ...config, paging: false })}>contiguous</button>
          <button className={config.paging ? "on" : ""} disabled={locks.paging} onClick={() => setConfig({ ...config, paging: true })}>paged</button>
        </div>
      </div>
      <div className="foundry-control">
        <span className="foundry-dial-label">batching</span>
        <div className="foundry-segmented">
          <button className={!config.continuous ? "on" : ""} disabled={locks.continuous} onClick={() => setConfig({ ...config, continuous: false })}>static</button>
          <button className={config.continuous ? "on" : ""} disabled={locks.continuous} onClick={() => setConfig({ ...config, continuous: true })}>continuous</button>
        </div>
      </div>
    </div>
  )
}

function LaneChart({ result }: { result: ServingResult }) {
  const rows = result.outcomes.length
  const maxT = Math.max(...result.outcomes.map(outcome => outcome.done ?? 0), 1)
  const width = 640
  const rowH = 14
  const x = (tick: number) => (tick / maxT) * width
  return (
    <svg viewBox={`0 0 ${width} ${rows * rowH + 18}`} className="foundry-lane-svg" role="img" aria-label="request lanes">
      {result.outcomes.map((outcome, index) => {
        const y = index * rowH + 4
        const start = x(outcome.arrive)
        const end = x(outcome.done ?? 0)
        const prefillEnd = outcome.firstToken !== null ? x(outcome.firstToken) : end
        return (
          <g key={outcome.id}>
            <line x1={start} y1={y + rowH / 2 - 3} x2={end} y2={y + rowH / 2 - 3} stroke={outcome.dropped ? "var(--viz-pruned)" : "var(--viz-settled)"} strokeWidth={5} strokeOpacity={0.55} />
            <line x1={start} y1={y + rowH / 2 - 3} x2={prefillEnd} y2={y + rowH / 2 - 3} stroke="var(--viz-cached)" strokeWidth={5} />
            {outcome.dropped && (
              <text x={end + 4} y={y + rowH / 2} className="foundry-lane-label foundry-lane-drop">{outcome.dropped}</text>
            )}
          </g>
        )
      })}
      <line x1={0} y1={rows * rowH + 8} x2={width} y2={rows * rowH + 8} stroke="var(--line)" strokeWidth={1} />
      <text x={2} y={rows * rowH + 16} className="foundry-lane-label">t=0</text>
      <text x={width - 34} y={rows * rowH + 16} className="foundry-lane-label">t={maxT}</text>
    </svg>
  )
}

function RunView({ result, pool }: { result: ServingResult; pool: number }) {
  const [tick, setTick] = useState(Math.floor(result.trace.length / 2))
  const snapshot = result.trace[Math.min(tick, result.trace.length - 1)]
  const metrics = result.metrics
  const readouts: { label: string; value: string; bad?: boolean }[] = [
    { label: "served", value: String(metrics.served) },
    { label: "dropped", value: String(metrics.dropped), bad: metrics.dropped > 0 },
    { label: "throughput", value: `${(metrics.throughputTokPerTick * 100).toFixed(0)} tok/s` },
    { label: "p99 TTFT", value: `${(metrics.p99TTFT * 10).toFixed(0)} ms` },
    { label: "p99 latency", value: `${(metrics.p99Latency * 10).toFixed(0)} ms` },
    { label: "KV waste peak", value: `${metrics.kvWastePeakMB.toFixed(0)} MB`, bad: metrics.kvWastePeakMB > 12 },
    { label: "avg batch", value: metrics.avgBatchOccupancy.toFixed(1) },
    { label: "KV peak", value: `${metrics.kvPeakMB.toFixed(0)} MB` },
  ]
  return (
    <div className="concept-visual forge-panel foundry-run-view">
      <div className="foundry-readout-grid">
        {readouts.map(entry => (
          <div key={entry.label} className={`foundry-readout ${entry.bad ? "bad" : ""}`}>
            <small>{entry.label}</small>
            <b>{entry.value}</b>
          </div>
        ))}
      </div>
      <LaneChart result={result} />
      <div className="foundry-kv-gauge">
        <span className="foundry-dial-label">KV pool <b>{pool} MB</b></span>
        <div className="foundry-kv-track">
          <span style={{ width: `${Math.min(100, (snapshot.kvAllocMB / pool) * 100)}%` }} />
        </div>
        <small>t={snapshot.tick} · alloc {snapshot.kvAllocMB.toFixed(0)} MB · in flight {snapshot.active} · queued {snapshot.queue}</small>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, result.trace.length - 1)}
        value={Math.min(tick, result.trace.length - 1)}
        aria-label="trace scrubber"
        onChange={event => setTick(Number(event.target.value))}
      />
    </div>
  )
}

type Mission = {
  kicker: string
  title: string
  narrative: string
  workload: Workload
  pool: number
  initial: ServingConfig
  locks: Locks
  target: (result: ServingResult) => boolean
  targetLabel: (result: ServingResult) => string
}

const MISSIONS: Mission[] = [
  {
    kicker: "Mission 1 · Fit the cache",
    title: "Eight requests. One pool.",
    narrative:
      "A 512 MB KV pool, eight simultaneous requests, each holding a 180–220 token conversation. Half-precision KV costs 0.5 MB per token — do the arithmetic before the queue does it for you. Quantization is a serving decision, not just a model decision.",
    workload: WORKLOAD_FIT,
    pool: 512,
    initial: { kvPoolMB: 512, dtype: "fp16", slots: 8, paging: false, continuous: true },
    locks: { dtype: false, slots: true, paging: true, continuous: true },
    target: result => result.metrics.dropped === 0,
    targetLabel: result => (result.metrics.dropped === 0 ? "SLA met — every request served" : `${result.metrics.dropped} requests dropped (timeout)`),
  },
  {
    kicker: "Mission 2 · Break the straggler lock",
    title: "Static batches wait for their slowest member.",
    narrative:
      "Same traffic, six slots, q4, paged KV — only the batching policy is yours. Run it static first: a batch forms, four requests ride together, and the two 40-token quick chats wait a full 240-token straggler before the next batch even forms. Then flip to continuous and watch time-to-first-token collapse.",
    workload: WORKLOAD_BATCHING,
    pool: 2048,
    initial: { kvPoolMB: 2048, dtype: "q4", slots: 6, paging: true, continuous: false },
    locks: { dtype: true, slots: true, paging: true, continuous: false },
    target: result => result.metrics.dropped === 0 && result.metrics.p99TTFT <= 50,
    targetLabel: result => (result.metrics.p99TTFT <= 50 ? `p99 TTFT ${(result.metrics.p99TTFT * 10).toFixed(0)} ms — SLA held` : `p99 TTFT ${(result.metrics.p99TTFT * 10).toFixed(0)} ms — stragglers own your floor`),
  },
  {
    kicker: "Mission 3 · Kill the waste",
    title: "Contiguous reservation is fragmentation.",
    narrative:
      "A 160 MB pool, mixed short and long conversations. Contiguous KV reserves prefill + full decode upfront — a request that might generate 250 tokens holds 250 tokens of cache from tick one. Paged allocation hands out 16-token pages as context actually grows. Same requests, radically different waste.",
    workload: WORKLOAD_PAGING,
    pool: 160,
    initial: { kvPoolMB: 160, dtype: "q4", slots: 4, paging: false, continuous: true },
    locks: { dtype: true, slots: true, paging: false, continuous: true },
    target: result => result.metrics.kvWastePeakMB <= 12,
    targetLabel: result => (result.metrics.kvWastePeakMB <= 12 ? `waste peak ${result.metrics.kvWastePeakMB.toFixed(0)} MB — page-granular` : `waste peak ${result.metrics.kvWastePeakMB.toFixed(0)} MB — reserved but never decoded`),
  },
  {
    kicker: "Mission 4 · The SLA crisis",
    title: "Traffic just doubled. Hold the line.",
    narrative:
      "Twenty-four requests in thirty-six ticks, a 512 MB pool, patience of 250 ticks. Every control is yours: dtype, slots, paging, batching. The SLA: zero drops and p99 time-to-first-token under two seconds. This is the whole station in one config — the exact trade a serving engineer makes before every launch.",
    workload: WORKLOAD_CRISIS,
    pool: 512,
    initial: { kvPoolMB: 512, dtype: "fp16", slots: 4, paging: false, continuous: false },
    locks: { dtype: false, slots: false, paging: false, continuous: false },
    target: result => result.metrics.dropped === 0 && result.metrics.p99TTFT <= 200,
    targetLabel: result =>
      result.metrics.dropped === 0 && result.metrics.p99TTFT <= 200
        ? "SLA held — ship it"
        : `${result.metrics.dropped} dropped · p99 TTFT ${(result.metrics.p99TTFT * 10).toFixed(0)} ms — not yet`,
  },
]

function MissionRunner({ mission, index, onDone, onMistake }: { mission: Mission; index: number; onDone: () => void; onMistake: () => void }) {
  const [config, setConfig] = useState<ServingConfig>(mission.initial)
  const [result, setResult] = useState<ServingResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const passed = result !== null && mission.target(result)

  const run = () => {
    triggerGameFeedback("move")
    const outcome = simulateServing(config, mission.workload)
    setResult(outcome)
    setAttempts(a => a + 1)
    if (mission.target(outcome)) triggerGameFeedback("correct")
    else if (attempts >= 1) {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">{mission.kicker}</span>
      <h1 className="stage-title">{mission.title}</h1>
      <p className="narrative">{mission.narrative}</p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>floor controls</span><b>pool {mission.pool} MB · {mission.workload.arrivals.length} requests</b></div>
        <FloorControls config={config} setConfig={setConfig} locks={mission.locks} />
      </div>
      <div className="foundry-step-controls">
        <button className="btn-primary" onClick={run}>{result ? "Run again →" : "Open the doors →"}</button>
      </div>
      {result && (
        <>
          <RunView result={result} pool={mission.pool} />
          <div className={`game-feedback ${passed ? "correct" : "wrong"}`}>
            <b>{mission.targetLabel(result)}</b>
            <p>
              {passed
                ? index === 3
                  ? "Zero drops, first tokens fast, cache lean — that is a launch-ready serving config."
                  : "The floor held. Read the lanes and the gauge before you move on."
                : "Read the lane chart: gold segments are prefill, green is decode, red is a dropped request. Then change one control at a time."}
            </p>
          </div>
          {passed && <button className="btn-primary" onClick={onDone}>{index === 3 ? "Close the floor →" : "Next mission →"}</button>}
        </>
      )}
    </section>
  )
}

export default function ServingFloorPage() {
  const [mission, setMission] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

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
            { label: "Best throughput", value: "~650 tok/s" },
          ]}
          concepts={[
            { title: "KV cache is the budget", description: "Concurrent sessions × context length × bytes/token — dtype decides how many fit." },
            { title: "Continuous batching", description: "Admit at slot-free time, not batch-drain time — stragglers stop owning your p99." },
            { title: "Paged allocation", description: "16-token pages replace upfront reservation; waste collapses to page granularity." },
            { title: "The SLA mindset", description: "Zero drops and bounded TTFT under peak load is the launch gate." },
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
      <MissionRunner
        mission={MISSIONS[mission - 1]}
        index={mission - 1}
        onDone={() => {
          if (mission === STATION.missions) complete()
          else setMission(m => m + 1)
        }}
        onMistake={() => setMistakes(m => m + 1)}
      />
    </FoundryShell>
  )
}
