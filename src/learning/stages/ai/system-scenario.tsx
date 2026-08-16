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
  type ScenarioRunSummary,
} from "@/persistence/system-scenario-progress"
import { evaluateSystemGates, foldSimulation, type GateResult, type SimulationFold } from "@/viz/replay/folds"
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
    if (running) return
    setRunning(which)
    setShown(which)
    setRunError(null)
    try {
      const code = which === "naive" ? scenario.naiveCode : which === "contract" ? scenario.contractDrillCode : draft
      const response = await workerBridge.runSimulation(code, toRuntimeSpec(scenario), RUN_BUDGET)
      const events: TraceEvent[] = response.events
      const fold = foldSimulation(events, events.length, { error: response.error, truncated: response.truncated })
      const gates = evaluateSystemGates(scenario.systemGates, fold.metrics, fold.eligible)
      const result: RunResult = { events, fold, gates, truncated: response.truncated, error: response.error }
      if (which === "naive") {
        setNaiveRun(result)
        persist({ naiveRunDone: true, naiveSummary: toSummary(fold, gates) })
      } else if (which === "fixed") {
        setFixedRun(result)
        persist({ fixedRunDone: true, fixedSummary: toSummary(fold, gates) })
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
                    <button type="button" className="btn-ghost" onClick={() => run("naive")} disabled={running !== null}>
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
                </>
              )}
            </div>
          )}

          {gatesAllPassed && (
            <div className="exit-gate">
              <span className="experiment-kicker">All system gates pass — your policy changed the system's behavior</span>
              <div className="level-actions">
                <button className="btn-primary" onClick={() => { setStage("artifact"); persist({}) }}>Save the engineering artifact →</button>
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
