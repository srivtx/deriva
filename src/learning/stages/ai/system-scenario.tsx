"use client"

// Systems Atelier scenario shell (system-ai/systems-atelier-plan.md §Surfaces).
// Stages: design gates (editor locked until they pass) → the atelier workbench
// (Naive run first, then the learner's fixed run; observation studio renders
// both from the real event logs) → artifact. One scenario, one page.

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { TraceEvent } from "@/execution/trace/types"
import { workerBridge } from "@/execution/bridge/worker-client"
import { toRuntimeSpec } from "@/curriculum/topics/ai-ml/systems"
import type { SystemScenario } from "@/curriculum/schema/system-scenario"
import {
  loadScenarioProgress,
  saveScenarioProgress,
  type ScenarioInterventions,
  type ScenarioRunSummary,
} from "@/persistence/system-scenario-progress"
import { evaluateSystemGates, findFirstSimulationDivergence, foldSimulation, type GateResult, type SimulationDivergence, type SimulationFold } from "@/viz/replay/folds"
import {
  SimulationComponents,
  SimulationEvents,
  SimulationSummary,
  SimulationTimeline,
  SimulationWaterfall,
} from "@/viz/panels/simulation"

const RUN_BUDGET = 8000

type RunResult = {
  events: TraceEvent[]
  fold: SimulationFold
  gates: GateResult[]
  truncated: boolean
  error: string | null
}

type Prediction = "latency" | "errors" | "both" | "nothing"

function defaultInterventions(scenario: SystemScenario): ScenarioInterventions {
  const upstream = scenario.components.find(component => component.role === "upstream")
  return {
    trafficMultiplier: 1,
    failureRateOverrides: upstream && !upstream.failureWindow ? { [upstream.id]: upstream.failureRate } : {},
    latencyMultiplierOverrides: upstream ? { [upstream.id]: 1 } : {},
  }
}

function toSummary(fold: SimulationFold, gates: GateResult[]): ScenarioRunSummary {
  return {
    p50: Math.round(fold.metrics.latencyMs.p50),
    p95: Math.round(fold.metrics.latencyMs.p95),
    p99: Math.round(fold.metrics.latencyMs.p99),
    max: Math.round(fold.metrics.latencyMs.max),
    errorRate: fold.metrics.errorRate,
    timeoutCount: fold.metrics.timeoutCount,
    maxAttempts: fold.metrics.maxAttemptsPerRequest,
    gatesPassed: gates.filter(gate => gate.passed).length,
    gatesTotal: gates.length,
  }
}

function componentIds(scenario: SystemScenario): string[] {
  return scenario.components.map(component => component.id)
}

function observedPrediction(fold: SimulationFold): Prediction {
  const errors = fold.metrics.errorRate >= 0.05
  const latency = fold.metrics.latencyMs.p99 >= 200 || fold.metrics.timeoutCount > 0
  if (errors && latency) return "both"
  if (errors) return "errors"
  if (latency) return "latency"
  return "nothing"
}

const PREDICTION_LABEL: Record<Prediction, string> = {
  latency: "latency tail",
  errors: "error rate",
  both: "both latency and errors",
  nothing: "neither signal",
}

function eventEvidence(event: TraceEvent | undefined): string {
  if (!event) return "no corresponding event"
  if (event.t !== "structure") return event.t
  const op = event.op as { kind: string } & Record<string, unknown>
  const detail = ["target", "status", "latencyMs", "attempt", "reason"]
    .filter(key => op[key] !== undefined)
    .map(key => `${key}=${String(op[key])}`)
    .join(" · ")
  return `${op.kind}${detail ? ` · ${detail}` : ""}`
}

function IncidentBoard({
  scenario,
  naiveRun,
  fixedRun,
  prediction,
  divergence,
  evidenceSelected,
  onSelectEvidence,
}: {
  scenario: SystemScenario
  naiveRun: RunResult
  fixedRun: RunResult
  prediction: Prediction | null
  divergence: SimulationDivergence | null
  evidenceSelected: boolean
  onSelectEvidence: () => void
}) {
  const actual = observedPrediction(naiveRun.fold)
  const predictionCorrect = prediction === actual
  return (
    <section className="incident-board" aria-label="Incident investigation board">
      <div className="incident-board-head">
        <div>
          <span className="experiment-kicker">Incident board · S{scenario.number} coupling failure</span>
          <h3>Explain the first break</h3>
          <p>Do not summarize the dashboard. Select the event where your policy changed the system.</p>
        </div>
        <span className={`incident-verdict${predictionCorrect ? " correct" : ""}`}>
          {prediction ? (predictionCorrect ? "Prediction matched" : "Prediction needs revision") : "Prediction not recorded"}
        </span>
      </div>
      <div className="incident-board-grid">
        <div className="incident-fact">
          <span className="experiment-kicker">Prediction</span>
          <strong>{prediction ? PREDICTION_LABEL[prediction] : "—"}</strong>
          <small>Trace observed: {PREDICTION_LABEL[actual]}</small>
        </div>
        <div className="incident-fact">
          <span className="experiment-kicker">Naive → fixed</span>
          <strong>p99 {Math.round(naiveRun.fold.metrics.latencyMs.p99)}ms → {Math.round(fixedRun.fold.metrics.latencyMs.p99)}ms</strong>
          <small>errors {(naiveRun.fold.metrics.errorRate * 100).toFixed(1)}% → {(fixedRun.fold.metrics.errorRate * 100).toFixed(1)}%</small>
        </div>
      </div>
      <div className="divergence-card">
        <span className="experiment-kicker">First semantic divergence · event {divergence?.index ?? "—"}</span>
        {divergence ? (
          <div className="divergence-events">
            <div><b>naive</b><code>{eventEvidence(divergence.naive)}</code></div>
            <span aria-hidden="true">→</span>
            <div><b>fixed</b><code>{eventEvidence(divergence.fixed)}</code></div>
          </div>
        ) : <p>No semantic divergence found yet. Change the policy before comparing.</p>}
        <button type="button" className={`evidence-button${evidenceSelected ? " selected" : ""}`} disabled={!divergence} onClick={onSelectEvidence}>
          {evidenceSelected ? "Evidence selected for artifact" : "Use this divergence as evidence"}
        </button>
      </div>
      <p className="incident-objective"><b>Objective:</b> {scenario.systemGates[0]?.invariant}</p>
    </section>
  )
}

function ExperimentConsole({
  scenario,
  interventions,
  locked,
  prediction,
  running,
  onChange,
  onPrediction,
  onRunBaseline,
  onReset,
}: {
  scenario: SystemScenario
  interventions: ScenarioInterventions
  locked: boolean
  prediction: Prediction | null
  running: boolean
  onChange: (next: ScenarioInterventions) => void
  onPrediction: (value: Prediction) => void
  onRunBaseline: () => void
  onReset: () => void
}) {
  const root = scenario.components.find(component => component.role === "root")
  const upstream = scenario.components.find(component => component.role === "upstream")
  if (!root || !upstream) return null

  const failureRate = interventions.failureRateOverrides[upstream.id] ?? upstream.failureWindow?.rate ?? upstream.failureRate
  const latencyMultiplier = interventions.latencyMultiplierOverrides[upstream.id] ?? 1
  const requestRate = Math.round(scenario.loadShape.baseRate * interventions.trafficMultiplier)
  const dependencyState = failureRate >= 0.2 ? "degraded" : failureRate > 0 ? "at risk" : "ready"
  const predictedLatency = Math.round(upstream.latency.p50 * latencyMultiplier)

  const update = (patch: Partial<ScenarioInterventions>) => onChange({ ...interventions, ...patch })

  return (
    <section className="experiment-console" aria-label="SignalDesk experiment console">
      <div className="console-heading">
        <div>
          <span className="experiment-kicker">Play the incident before code</span>
          <h3>SignalDesk control room</h3>
          <p>Change one condition, predict the consequence, then run the same world through your handlers.</p>
        </div>
        {locked ? (
          <button type="button" className="btn-ghost console-reset" onClick={onReset}>Reset experiment</button>
        ) : (
          <span className="console-seed">seed {scenario.loadShape.seed}</span>
        )}
      </div>

      <div className="experiment-topology" aria-label="Live system topology">
        <div className="topology-node topology-root">
          <span className="topology-status">{root.id} · serving</span>
          <strong>Service A</strong>
          <small>{requestRate} r/s entering</small>
        </div>
        <span className="topology-arrow" aria-hidden="true">→</span>
        <div className={`topology-node topology-upstream state-${dependencyState}`}>
          <span className="topology-status">{upstream.id} · {dependencyState}</span>
          <strong>Service B</strong>
          <small>p50 {predictedLatency}ms · {Math.round(failureRate * 100)}% failures</small>
        </div>
      </div>

      <div className="console-controls">
        <label className="console-control">
          <span><b>Traffic</b><output>{interventions.trafficMultiplier}× · {requestRate} r/s</output></span>
          <input type="range" min="0.5" max="2" step="0.5" value={interventions.trafficMultiplier} disabled={locked} onChange={event => update({ trafficMultiplier: Number(event.target.value) })} />
          <small>How much work enters the system?</small>
        </label>
        <label className="console-control">
          <span><b>Dependency failures</b><output>{Math.round(failureRate * 100)}%</output></span>
          <input type="range" min="0" max="0.3" step="0.05" value={failureRate} disabled={locked} onChange={event => update({ failureRateOverrides: { ...interventions.failureRateOverrides, [upstream.id]: Number(event.target.value) } })} />
          <small>What happens when B stops keeping its promise?</small>
        </label>
        <label className="console-control">
          <span><b>Slow-tail multiplier</b><output>{latencyMultiplier}× · p50 {predictedLatency}ms</output></span>
          <input type="range" min="1" max="3" step="0.5" value={latencyMultiplier} disabled={locked} onChange={event => update({ latencyMultiplierOverrides: { ...interventions.latencyMultiplierOverrides, [upstream.id]: Number(event.target.value) } })} />
          <small>How much latency does A inherit from B?</small>
        </label>
      </div>

      <div className="prediction-checkpoint">
        <span className="experiment-kicker">Make a prediction</span>
        <p>Before the baseline runs, what will the injected condition change first?</p>
        <div className="prediction-options">
          {([
            ["latency", "latency tail"],
            ["errors", "error rate"],
            ["both", "both"],
            ["nothing", "nothing"],
          ] as const).map(([value, label]) => (
            <button type="button" key={value} className={`prediction-option${prediction === value ? " picked" : ""}`} onClick={() => onPrediction(value)}>{label}</button>
          ))}
        </div>
        <button type="button" className="btn-primary console-run" disabled={!prediction || running || locked} onClick={onRunBaseline}>
          {running ? "Running the world…" : locked ? "Baseline captured" : prediction ? "Run the baseline incident →" : "Choose a prediction first"}
        </button>
      </div>
    </section>
  )
}

export function SystemScenarioStage({ scenario }: { scenario: SystemScenario }) {
  const [hydrated, setHydrated] = useState(false)
  const [stage, setStage] = useState<"design" | "atelier" | "artifact">("design")
  const [pane, setPane] = useState<"spec" | "code" | "output">("spec")
  const [designPicked, setDesignPicked] = useState<string[]>([])
  const [designIndex, setDesignIndex] = useState(0)
  const [designSubmitted, setDesignSubmitted] = useState(false)
  const [designPassed, setDesignPassed] = useState(false)
  const [draft, setDraft] = useState(scenario.starter)
  const [naiveRun, setNaiveRun] = useState<RunResult | null>(null)
  const [fixedRun, setFixedRun] = useState<RunResult | null>(null)
  const [contractRun, setContractRun] = useState<RunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [running, setRunning] = useState<"naive" | "fixed" | "contract" | null>(null)
  const [shown, setShown] = useState<"naive" | "fixed" | "contract">("naive")
  const [eventFilter, setEventFilter] = useState<string | null>(null)
  const [artifactValues, setArtifactValues] = useState<Record<string, string>>({})
  const [reflection, setReflection] = useState("")
  const [interventions, setInterventions] = useState<ScenarioInterventions>(() => defaultInterventions(scenario))
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [evidenceSelected, setEvidenceSelected] = useState(false)

  useEffect(() => {
    const saved = loadScenarioProgress(scenario.id)
    if (!saved) {
      setHydrated(true)
      return
    }
    setStage(saved.status === "complete" ? "artifact" : saved.fixedRunDone || saved.naiveRunDone ? "atelier" : saved.designPassed ? "atelier" : "design")
    setDesignPicked(saved.designPicked)
    setDesignPassed(saved.designPassed)
    const nextGate = scenario.designGates.findIndex((gate, index) => saved.designPicked[index] !== gate.correct)
    setDesignIndex(nextGate < 0 ? scenario.designGates.length - 1 : nextGate)
    if (saved.draft) setDraft(saved.draft)
    setArtifactValues(saved.artifactValues)
    setReflection(saved.reflection)
    setInterventions(saved.interventions ?? defaultInterventions(scenario))
    setEvidenceSelected(saved.evidenceSelected ?? false)
    setHydrated(true)
  }, [scenario.id])

  const persist = (patch: Partial<Parameters<typeof saveScenarioProgress>[1]>) => {
    if (typeof window === "undefined") return
    const current = loadScenarioProgress(scenario.id) ?? {
      status: "new" as const,
      designPicked: [],
      designPassed: false,
      naiveRunDone: false,
      fixedRunDone: false,
      draft: "",
      artifactValues: {},
      reflection: "",
      interventions: defaultInterventions(scenario),
      evidenceSelected: false,
    }
    const next: Parameters<typeof saveScenarioProgress>[1] = { ...current, ...patch }
    const fixedSummary = next.fixedSummary
    const status: Parameters<typeof saveScenarioProgress>[1]["status"] =
      stage === "artifact" && reflection.trim().length >= 12 ? "complete"
        : next.fixedRunDone && fixedSummary && fixedSummary.gatesPassed === fixedSummary.gatesTotal ? "fixed-done"
        : next.naiveRunDone ? "naive-done"
        : next.designPassed ? "gates-passed"
        : "new"
    next.status = status
    next.lastOpened = new Date().toISOString()
    saveScenarioProgress(scenario.id, next)
  }

  const chooseDesign = (value: string) => {
    const picked = [...designPicked]
    picked[designIndex] = value
    setDesignPicked(picked)
    setDesignSubmitted(false)
    persist({ designPicked: picked })
  }

  const commitDesign = () => {
    const value = designPicked[designIndex]
    if (!value) return
    setDesignSubmitted(true)
    if (value !== scenario.designGates[designIndex]!.correct) return
    if (designIndex === scenario.designGates.length - 1) {
      setDesignPassed(true)
      setStage("atelier")
      persist({ designPicked, designPassed: true })
      return
    }
    setDesignIndex(index => index + 1)
    setDesignSubmitted(false)
  }

  const run = async (which: "naive" | "fixed" | "contract") => {
    if (running || (which === "naive" && !prediction)) return
    setRunning(which)
    setShown(which)
    setPane("output")
    setRunError(null)
    try {
      const code = which === "naive" ? scenario.naiveCode : which === "contract" ? scenario.contractDrillCode : draft
      const response = await workerBridge.runSimulation(code, toRuntimeSpec(scenario, interventions), RUN_BUDGET)
      const events: TraceEvent[] = response.events
      const fold = foldSimulation(events, events.length, { error: response.error, truncated: response.truncated })
      const gates = evaluateSystemGates(scenario.systemGates, fold.metrics, fold.eligible)
      const result: RunResult = { events, fold, gates, truncated: response.truncated, error: response.error }
      if (which === "naive") {
        setNaiveRun(result)
        persist({ naiveRunDone: fold.eligible, naiveSummary: fold.eligible ? toSummary(fold, gates) : undefined })
      } else if (which === "fixed") {
        setFixedRun(result)
        persist({ fixedRunDone: fold.eligible, fixedSummary: fold.eligible ? toSummary(fold, gates) : undefined })
      } else {
        setContractRun(result)
      }
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(null)
    }
  }

  const gatesAllPassed = fixedRun?.gates.every(gate => gate.passed) ?? false
  const allFields = scenario.artifact.fields.every(field => (artifactValues[field.name] ?? "").trim().length > 0)
  const components = useMemo(() => componentIds(scenario), [scenario])

  if (!hydrated) return <div className="stage-shell" />

  const selected = shown === "naive" ? naiveRun : shown === "fixed" ? fixedRun : contractRun
  const hasBoth = naiveRun && fixedRun
  const divergence = hasBoth ? findFirstSimulationDivergence(naiveRun.events, fixedRun.events) : null
  const updateInterventions = (next: ScenarioInterventions) => {
    setInterventions(next)
    persist({ interventions: next })
  }
  const resetExperiment = () => {
    const next = defaultInterventions(scenario)
    setInterventions(next)
    setPrediction(null)
    setNaiveRun(null)
    setFixedRun(null)
    setContractRun(null)
    setShown("naive")
    setEventFilter(null)
    setRunError(null)
    setEvidenceSelected(false)
    persist({ interventions: next, naiveRunDone: false, fixedRunDone: false, naiveSummary: undefined, fixedSummary: undefined, evidenceSelected: false })
  }

  return (
    <div className="stage-shell scenario-page">
      <header className="project-level-page scenario-hero">
        <Link href="/ai-ml/systems" className="project-back">← Systems</Link>
        <div className="project-level-head">
          <span className="experiment-kicker">S{scenario.number} · {scenario.thinkingMove}</span>
          <h2 className="narrative-heading">{scenario.title}</h2>
          <p className="spec-pitch">{scenario.pitch}</p>
          <div className="interaction-path" aria-label="System interaction path">
            <span>{scenario.components.find(component => component.role === "root")?.id ?? "Service A"}</span>
            <b>calls</b>
            <span>{scenario.components.find(component => component.role === "upstream")?.id ?? "Service B"} API</span>
            <i>versioned boundary</i>
          </div>
        </div>
      </header>

      {stage === "design" && (
        <section className="spec-block scenario-design">
          <span className="experiment-kicker">Design gate {designIndex + 1} of {scenario.designGates.length} · the editor unlocks after all gates pass</span>
          {(() => {
            const gate = scenario.designGates[designIndex]!
            const picked = designPicked[designIndex]
            const correct = picked === gate.correct
            return (
              <div className={`design-question${designSubmitted ? (correct ? " ok" : " wrong") : ""}`}>
                <p className="design-question-text">{gate.question}</p>
                <div className="design-options">
                  {gate.options.map(option => (
                    <button type="button" key={option.value} className={`design-option${picked === option.value ? " picked" : ""}`} onClick={() => chooseDesign(option.value)}>
                      {option.label}
                    </button>
                  ))}
                </div>
                {designSubmitted && <p className="design-explanation">{correct ? gate.explanation : "Not quite. Choose another answer and commit it."}</p>}
                <div className="design-actions">
                  <button type="button" className="btn-primary" disabled={!picked} onClick={commitDesign}>
                    {correct && designSubmitted ? "Committed" : "Commit answer"}
                  </button>
                  {picked && <span className="design-selection">Selected: {gate.options.find(option => option.value === picked)?.label}</span>}
                </div>
              </div>
            )
          })()}
          <div className="spec-load">
            <span className="experiment-kicker">The world you are designing against</span>
            <ul className="spec-list">
              <li>load: {scenario.loadShape.baseRate} r/s{scenario.loadShape.burst ? `, bursting to ${scenario.loadShape.burst.rate} r/s at t=${scenario.loadShape.burst.at}s` : ""} over {scenario.loadShape.simSeconds}s · seed {scenario.loadShape.seed}</li>
              {scenario.components.map(component => (
                <li key={component.id} className="scenario-component-row">
                  <span className="scenario-component-top"><strong>{component.id}</strong><em>{component.role}</em><small>API {component.api.version}</small></span>
                  <span className="scenario-component-contract">{component.api.requestFields.join(", ")} <b>→</b> {component.api.responseFields.join(", ")}</span>
                  <span className="scenario-component-latency">p50 {component.latency.p50}ms · p99 {component.latency.p99}ms{component.failureRate > 0 ? ` · ${Math.round(component.failureRate * 100)}% failure rate` : ""}{component.failureWindow ? ` · failing ${Math.round(component.failureWindow.rate * 100)}% from t=${component.failureWindow.from}s` : ""}</span>
                </li>
              ))}
            </ul>
          </div>
          {designPassed && (
            <div className="level-actions">
              <button className="btn-primary" onClick={() => setStage("atelier")}>Open the atelier →</button>
            </div>
          )}
        </section>
      )}

      {stage === "atelier" && (
        <div className="level-workbench scenario-atelier">
          <div className="workbench-tabs" role="tablist" aria-label="Atelier panes">
            {(["spec", "code", "output"] as const).map(tab => (
              <button key={tab} role="tab" aria-selected={pane === tab} className={`workbench-tab${pane === tab ? " active" : ""}`} onClick={() => setPane(tab)}>
                {tab === "spec" ? "Spec" : tab === "code" ? "Code" : "Output"}
              </button>
            ))}
          </div>

          <div className="workbench-panes">
            <div className={`workbench-pane${pane === "spec" ? " active" : ""}`}>
              <ExperimentConsole
                scenario={scenario}
                interventions={interventions}
                locked={Boolean(naiveRun)}
                prediction={prediction}
                running={running === "naive"}
                onChange={updateInterventions}
                onPrediction={setPrediction}
                onRunBaseline={() => run("naive")}
                onReset={resetExperiment}
              />
              <section className="spec-block">
                <span className="experiment-kicker">The system</span>
                <p className="spec-brief">{scenario.pitch} The thinking move: <strong>{scenario.thinkingMove}</strong>.</p>
                <div className="spec-load">
                  <ul className="spec-list">
                    {scenario.components.map(component => (
                      <li key={component.id} className="scenario-component-row">
                        <span className="scenario-component-top"><strong>{component.id}</strong><em>{component.role}</em><small>API {component.api.version}</small></span>
                        <span className="scenario-component-contract">{component.api.requestFields.join(", ")} <b>→</b> {component.api.responseFields.join(", ")}</span>
                        <span className="scenario-component-latency">p50 {component.latency.p50}ms · p99 {component.latency.p99}ms{component.failureRate > 0 ? ` · ${Math.round(component.failureRate * 100)}% failures` : ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="experiment-kicker">Handler contract</span>
                {scenario.handlers.map(handler => (
                  <p key={handler.name} className="spec-list">
                    <code>{handler.signature}</code> — {handler.purpose}
                  </p>
                ))}
                <span className="experiment-kicker">Load shape</span>
                <p className="spec-list">seed {scenario.loadShape.seed} · {scenario.loadShape.baseRate} r/s{scenario.loadShape.burst ? `, burst {scenario.loadShape.burst.rate} r/s at t={scenario.loadShape.burst.at}s` : ""} · {scenario.loadShape.simSeconds}s</p>
              </section>
            </div>

            <div className={`workbench-pane${pane === "code" ? " active" : ""}`}>
              <div className="level-editor">
                <div className="code-tools">
                  <span className="experiment-kicker">Handlers · POLICY · ctx (call, retry, circuit, cache, queue)</span>
                </div>
                <textarea
                  className="answer-editor project-editor"
                  value={draft}
                  onChange={event => { setDraft(event.target.value); persist({ draft: event.target.value }) }}
                  spellCheck={false}
                  aria-label="Your handlers"
                />
                <div className="sim-run-actions level-actions sticky">
                  <div className="sim-run-copy">
                    <span className="experiment-kicker">Run the system</span>
                    <p>See the broken behavior first. Then change the policy and compare the trace. The contract drill is a separate failure.</p>
                  </div>
                  <div className="sim-run-buttons">
                     <button type="button" className="btn-ghost" onClick={() => run("naive")} disabled={running !== null || !prediction}>
                       {running === "naive" ? "Loading Python…" : naiveRun ? "Run naive again" : "1. Run broken policy"}
                    </button>
                    <button type="button" className="btn-primary run-tests" onClick={() => run("fixed")} disabled={running !== null || !naiveRun?.fold.eligible || fixedRun?.gates.every(gate => gate.passed)}>
                      {running === "fixed" ? "Loading Python…" : !naiveRun?.fold.eligible ? "2. Run broken policy first" : fixedRun ? "Run handlers again" : "2. Run my handlers"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => run("contract")} disabled={running !== null || !naiveRun?.fold.eligible}>
                      {running === "contract" ? "Loading Python…" : "Inspect contract failure"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`workbench-pane${pane === "output" ? " active" : ""}`}>
              {runError ? (
                <div className="sim-error">The simulation could not run: {runError}</div>
              ) : running ? (
                <div className="sim-pending">Simulating… (deterministic seed {scenario.loadShape.seed})</div>
              ) : selected ? (
                <div className="sim-output">
                  {selected.error && <div className="sim-error">{selected.error}</div>}
                  {selected.truncated && !selected.error && <div className="sim-error">Run exceeded its event budget and was cut off — that is usually the naive policy amplifying work.</div>}
                  <SimulationSummary fold={selected.fold} gates={selected.gates} />
                </div>
              ) : (
                <div className="sim-pending">Run the naive policy first — the collapse is the lesson.</div>
              )}
            </div>
          </div>

          {hasBoth && (
            <div className="observation-studio">
              <div className="studio-run-switch" role="tablist" aria-label="Which run is shown">
                <button role="tab" aria-selected={shown === "naive"} className={`workbench-tab${shown === "naive" ? " active" : ""}`} onClick={() => setShown("naive")}>Naive policy</button>
                <button role="tab" aria-selected={shown === "fixed"} className={`workbench-tab${shown === "fixed" ? " active" : ""}`} onClick={() => setShown("fixed")}>My handlers</button>
                <button role="tab" aria-selected={shown === "contract"} className={`workbench-tab${shown === "contract" ? " active" : ""}`} onClick={() => setShown("contract")} disabled={!contractRun}>Contract drill</button>
              </div>
              {selected && (
                <>
                  <div className="sim-before-after">
                    <div>
                      <span className="experiment-kicker">naive</span>
                      <p>p99 {naiveRun ? `${Math.round(naiveRun.fold.metrics.latencyMs.p99)}ms` : "—"} · p50 {naiveRun ? `${Math.round(naiveRun.fold.metrics.latencyMs.p50)}ms` : "—"} · {naiveRun ? `${Math.round(naiveRun.fold.metrics.errorRate * 100)}% errors` : "—"}</p>
                    </div>
                    <div>
                      <span className="experiment-kicker">fixed</span>
                      <p>p99 {fixedRun ? `${Math.round(fixedRun.fold.metrics.latencyMs.p99)}ms` : "—"} · p50 {fixedRun ? `${Math.round(fixedRun.fold.metrics.latencyMs.p50)}ms` : "—"} · {fixedRun ? `${Math.round(fixedRun.fold.metrics.errorRate * 100)}% errors` : "—"}</p>
                    </div>
                  </div>
                  <SimulationWaterfall fold={selected.fold} components={components} />
                   <SimulationTimeline fold={selected.fold} />
                   <SimulationComponents fold={selected.fold} components={components} />
                   <SimulationEvents events={selected.events} filter={eventFilter} onFilter={setEventFilter} />
                   <IncidentBoard
                     scenario={scenario}
                     naiveRun={naiveRun}
                     fixedRun={fixedRun}
                     prediction={prediction}
                     divergence={divergence}
                     evidenceSelected={evidenceSelected}
                     onSelectEvidence={() => { setEvidenceSelected(true); persist({ evidenceSelected: true }) }}
                   />
                 </>
               )}
            </div>
          )}

          {gatesAllPassed && (
            <div className="exit-gate">
              <span className="experiment-kicker">{evidenceSelected ? "Evidence selected — your policy changed the system's behavior" : "Select the first divergence before writing the artifact"}</span>
              <div className="level-actions">
                <button className="btn-primary" disabled={!evidenceSelected} onClick={() => { setStage("artifact"); persist({}) }}>Save the engineering artifact →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "artifact" && (
        <section className="artifact-form">
          <span className="experiment-kicker">Artifact: {scenario.artifact.title}</span>
          {scenario.artifact.fields.map(field => (
            <label key={field.name} className="artifact-field">
              <span>{field.label} *</span>
              <input
                value={artifactValues[field.name] ?? ""}
                onChange={event => { const next = { ...artifactValues, [field.name]: event.target.value }; setArtifactValues(next); persist({ artifactValues: next }) }}
                placeholder={field.label}
              />
            </label>
          ))}
          <label className="artifact-field">
            <span>Reflection *</span>
            <textarea className="answer-editor" value={reflection} onChange={event => { setReflection(event.target.value); persist({ reflection: event.target.value }) }} placeholder={scenario.artifact.reflectionQuestion} />
          </label>
          <div className="level-actions sticky">
            <button className="btn-primary" disabled={!allFields || reflection.trim().length < 12} onClick={() => persist({})}>
              Save scenario {scenario.number} artifact
            </button>
          </div>
          <div className="level-actions">
            <Link href="/ai-ml/systems" className="btn-ghost as-link">Back to the ladder</Link>
          </div>
        </section>
      )}
    </div>
  )
}
