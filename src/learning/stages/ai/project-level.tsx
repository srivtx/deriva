"use client"

// Project level workbench (system-ai/ml-projects-plan.md §Level workbench).
// Compact nine-stage shell: Spec (understand + examples) → Design gate →
// Workbench (Spec | Tests | Code | Output, sticky Run) → Artifact (fields +
// reflection + exit gate). Reuses the existing worker, test runner, hint
// ladder, solution policy, and trace transport — no second engine.

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { AuthoredLevel } from "@/curriculum/schema/project"
import { runTests, runAiTraced, type TestResult, type TraceRun } from "@/execution/pyodide-client"
import { foldProjectEvents } from "@/viz/replay/folds"
import { projectOneFixtures } from "@/curriculum/topics/ai-ml/projects/project-01-fixtures"
import { loadLevelProgress, saveLevelProgress, saveLastOpenedProject, type PaneId, type ProjectLevelProgress } from "@/persistence/project-progress"

interface Props {
  projectId: string
  level: AuthoredLevel
  levels: { id: string; number: number; title: string; available: boolean }[]
  previousLevelId?: string
  nextLevelId?: string
  onComplete: () => void
}

type WorkbenchStage = "spec" | "design" | "workbench" | "artifact"

export function ProjectLevelWorkbench({ projectId, level, levels, previousLevelId, nextLevelId, onComplete }: Props) {
  const key = `${projectId}/${level.id}`
  const fixture = projectOneFixtures[level.trace.fixtureId]
  const entryPoint = level.implementation.entryPoint

  const [stage, setStage] = useState<WorkbenchStage>("spec")
  const [hydrated, setHydrated] = useState(false)
  const [pane, setPane] = useState<PaneId>("spec")
  const [draft, setDraft] = useState(level.implementation.starter)
  const [designPicked, setDesignPicked] = useState<string | null>(null)
  const [designPassed, setDesignPassed] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [hiddenResults, setHiddenResults] = useState<TestResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [syntaxError, setSyntaxError] = useState<string | null>(null)
  const [hintDepth, setHintDepth] = useState(0)
  const [confirmAssertion, setConfirmAssertion] = useState(false)
  const [solutionRevealed, setSolutionRevealed] = useState(false)
  const [confirmSolution, setConfirmSolution] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [traceRun, setTraceRun] = useState<TraceRun | null>(null)
  const [traceLoading, setTraceLoading] = useState(false)
  const [traceError, setTraceError] = useState<string | null>(null)
  const [artifactValues, setArtifactValues] = useState<Record<string, string>>({})
  const [reflection, setReflection] = useState("")
  const [gatePicked, setGatePicked] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set())
  const runNonce = useRef(0)
  const hintsAnchor = useRef<HTMLDivElement | null>(null)

  // hydrate
  useEffect(() => {
    const saved = loadLevelProgress(projectId, level.id)
    if (saved) {
      setStage(saved.stage)
      setPane(saved.pane)
      setDraft(saved.editorDraft)
      setDesignPassed(saved.designPassed)
      setHintDepth(saved.hintDepth)
      setSolutionRevealed(saved.solutionRevealed)
      setAttempts(saved.attempts)
      setArtifactValues(saved.artifactValues)
      setReflection(saved.reflection)
      setGatePassed(saved.exitGatePassed)
      if (saved.testsPassing) setStage(saved.stage === "artifact" ? "artifact" : "workbench")
    }
    saveLastOpenedProject(projectId)
    setHydrated(true)
  }, [projectId, level.id])

  const persist = (patch: Partial<ProjectLevelProgress>) => {
    const status = stage === "artifact" && gatePassed && reflection.trim().length >= 12 ? "complete" : gatePassed ? "tests-passing" : draft.trim() ? "started" : "new"
    saveLevelProgress(projectId, level.id, {
      status,
      stage,
      pane,
      editorDraft: draft,
      designPassed,
      hintDepth,
      solutionRevealed,
      attempts,
      testsPassing: gatePassed,
      traceCursor: traceRun?.trace.events.length ?? 0,
      artifactValues,
      reflection,
      exitGatePassed: gatePassed,
      lastOpened: new Date().toISOString(),
      ...patch,
    })
  }

  const allPassed = results !== null && results.length > 0 && results.every(r => r.ok)
  const hiddenPassed = hiddenResults !== null && hiddenResults.length > 0 && hiddenResults.every(r => r.ok)
  const testsPassing = allPassed && hiddenPassed
  const hints = [...level.implementation.hints].sort((a, b) => a.level - b.level)
  const visibleHints = hints.filter(h => h.level <= hintDepth)
  const nextHint = hints.find(h => h.level === hintDepth + 1)

  const run = async () => {
    setRunning(true)
    setSyntaxError(null)
    runNonce.current += 1
    try {
      const visible = await runTests(draft, level.implementation.visibleTests.map(t => ({ call: t.call, expect: t.expect })))
      setResults(visible.results)
      setSyntaxError(visible.syntaxError ?? null)
      if (!visible.syntaxError && visible.results.length > 0 && visible.results.every(r => r.ok)) {
        const hidden = await runTests(draft, level.implementation.hiddenTestCases.map(t => ({ call: t.call, expect: t.expect })))
        setHiddenResults(hidden.results)
      } else {
        setHiddenResults(null)
      }
      setAttempts(a => a + 1)
    } catch (error) {
      setResults(null)
      setHiddenResults(null)
      setSyntaxError(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
    }
  }

  const runTrace = async () => {
    if (!fixture) return
    setTraceLoading(true)
    setTraceError(null)
    const tracedCode = fixture.wrapper
      ? `${draft}\n\n${fixture.wrapper.replace("{entryPoint}", entryPoint)}`
      : draft
    const tracedEntry = fixture.wrapper ? "__deriva_trace_entry" : entryPoint
    try {
      const run = await runAiTraced(tracedCode, tracedEntry, fixture.payload, level.trace.budget)
      setTraceRun(run)
      if (run.error) setTraceError(run.error)
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : String(error))
    } finally {
      setTraceLoading(false)
    }
  }

  useEffect(() => {
    if (testsPassing && !traceRun && !traceLoading && stage === "workbench") {
      runTrace()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testsPassing, stage])

  const fold = useMemo(() => foldProjectEvents(traceRun?.trace.events ?? [], traceRun?.trace.events.length ?? 0), [traceRun])

  const nextHintAsk = () => {
    if (!nextHint) { setConfirmSolution(true); return }
    if (nextHint.type === "question") { setHintDepth(nextHint.level); persist({ hintDepth: nextHint.level }) }
    else setConfirmAssertion(true)
  }

  const lockDesign = () => {
    if (designPicked === level.designQuestion.correct) {
      setDesignPassed(true)
      setStage("workbench")
      persist({ designPassed: true, stage: "workbench" })
    }
  }

  const enterArtifact = () => {
    setStage("artifact")
    persist({ stage: "artifact" })
  }

  const lockGate = () => {
    if (gatePicked === level.exitGate.correct) {
      setGatePassed(true)
      if (reflection.trim().length >= 12) {
        onComplete()
      }
      persist({ exitGatePassed: true, status: reflection.trim().length >= 12 ? "complete" : "tests-passing" })
    }
  }

  const allFields = level.artifact.fields.every(f => artifactValues[f.name]?.trim())
  // Keep the server render and the first client render identical. Local progress is
  // restored only after hydration, otherwise a saved workbench changes attributes
  // such as disabled before React can reconcile the server HTML.
  const renderedStage: WorkbenchStage = hydrated ? stage : "spec"

  return (
    <div className="project-level">
      <div className="practice-lab-header">
        <Link href={`/ai-ml/projects/${projectId}`} className="practice-lab-back">← Projects</Link>
        <span className="practice-lab-crumb">{projectId} / L{level.number}</span>
        <b className="practice-lab-title">{level.title}</b>
        <span className="practice-lab-duration">~{level.durationMinutes} min</span>
        <div className="practice-lab-actions">
          <button className="btn-ghost compact-action" onClick={nextHintAsk}>✧ AI Hint</button>
          <button className="btn-ghost compact-action" onClick={() => { setPane("spec"); hintsAnchor.current?.scrollIntoView({ behavior: "smooth", block: "center" }) }}>💡 Hints</button>
          <button className="btn-primary compact-action" disabled={!hydrated || renderedStage !== "workbench" || running} onClick={run}>▷ Run Tests</button>
        </div>
      </div>
      <nav className="project-level-tabs" aria-label="Project levels">
        {levels.map(item => item.available ? (
          <Link key={item.id} href={`/ai-ml/projects/${projectId}/level/${item.id}`} className={`project-level-tab${item.id === level.id ? " active" : ""}`}>
            L{item.number}<span>{item.title}</span>
          </Link>
        ) : (
          <span key={item.id} className="project-level-tab locked" aria-disabled="true">L{item.number}<span>locked</span></span>
        ))}
      </nav>
      {renderedStage !== "workbench" && (
        <header className="project-level-head">
          <p className="stage-move">one move: <b>{level.thinkingMove}</b></p>
        </header>
      )}

      {/* ── STAGE: SPEC ─────────────────────────────────────────────── */}
      {renderedStage === "spec" && (
        <div className="level-stage">
          <p className="narrative">{level.spec.brief}</p>
          <div className="spec-block">
            <span className="experiment-kicker">Required API</span>
            <pre className="fixture-block"><code>{level.spec.requiredApi}</code></pre>
          </div>
          <div className="spec-block">
            <span className="experiment-kicker">Behavior</span>
            <ol className="spec-list">
              {level.spec.behavior.map((b, i) => <li key={i}>{b}</li>)}
            </ol>
          </div>
          <div className="spec-block">
            <span className="experiment-kicker">Examples — tap to reveal</span>
            <div className="example-strip">
              {level.spec.examples.map(ex => (
                <button key={ex.id} type="button" className={`example-chip${revealedExamples.has(ex.id) ? " revealed" : ""}`} onClick={() => {
                  const next = new Set(revealedExamples)
                  if (next.has(ex.id)) next.delete(ex.id)
                  else next.add(ex.id)
                  setRevealedExamples(next)
                }} aria-expanded={revealedExamples.has(ex.id)}>
                  <code>{ex.given}</code><span>→</span>
                  <code className="example-result">{revealedExamples.has(ex.id) ? ex.result : "?"}</code>
                </button>
              ))}
            </div>
          </div>
          {level.spec.constraints.length > 0 && (
            <div className="spec-block">
              <span className="experiment-kicker">Constraints</span>
              <ul className="spec-list">
                {level.spec.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div className="level-actions">
            <button className="btn-primary" onClick={() => setStage("design")}>I understand the contract → Design</button>
          </div>
        </div>
      )}

      {/* ── STAGE: DESIGN GATE ──────────────────────────────────────── */}
      {renderedStage === "design" && (
        <div className="level-stage">
          <p className="probe-question">{level.designQuestion.question}</p>
          <div className="probe-options">
            {level.designQuestion.options.map(option => (
              <button key={option.value} className={`opt-card${designPicked === option.value ? " selected" : ""}`} onClick={() => setDesignPicked(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
          {designPicked !== null && designPicked !== level.designQuestion.correct && (
            <p className="design-wrong-feedback">{level.designQuestion.explanation}</p>
          )}
          {designPicked === level.designQuestion.correct && (
            <div className="discovery-ceremony">
              <span className="discovery-kicker">✦ Design locked</span>
              <p className="narrative">{level.designQuestion.explanation}</p>
            </div>
          )}
          <div className="level-actions">
            <button className="btn-primary" disabled={!designPicked} onClick={lockDesign}>
              {designPicked === level.designQuestion.correct ? "The editor is yours → Implement" : "Commit your design"}
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE: WORKBENCH ────────────────────────────────────────── */}
      {renderedStage === "workbench" && (
        <div className="level-workbench">
          <div className="workbench-tabs" role="tablist" aria-label="Workbench panes">
            {(["spec", "tests", "code", "output"] as const).map(tab => (
              <button key={tab} role="tab" aria-selected={pane === tab} className={`workbench-tab${pane === tab ? " active" : ""}`} onClick={() => setPane(tab)}>
                {tab === "spec" ? "Spec" : tab === "tests" ? `Tests (${level.implementation.visibleTests.length}+${level.implementation.hiddenTestCases.length} hidden)` : tab === "code" ? "Code" : "Output"}
              </button>
            ))}
          </div>

          <div className={`workbench-panes pane-${pane}`}>
            <div className={`workbench-pane pane-spec ${pane === "spec" ? "active" : ""}`}>
              <p className="narrative">{level.spec.brief}</p>
              <span className="experiment-kicker">Required API</span>
              <pre className="fixture-block"><code>{level.spec.requiredApi}</code></pre>
              <span className="experiment-kicker">Behavior</span>
              <ol className="spec-list">
                {level.spec.behavior.map((b, i) => <li key={i}>{b}</li>)}
              </ol>
              {level.spec.constraints.length > 0 && (
                <>
                  <span className="experiment-kicker">Constraints</span>
                  <ul className="spec-list">{level.spec.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </>
              )}
            </div>

            <div className={`workbench-pane pane-tests ${pane === "tests" ? "active" : ""}`}>
              <span className="experiment-kicker">Visible contract tests</span>
              <ol className="spec-list tests-list">
                {level.implementation.visibleTests.map(test => {
                  const r = results?.find((_, i) => i === level.implementation.visibleTests.indexOf(test))
                  return (
                    <li key={test.name} className={`test-row ${r ? (r.ok ? "ok" : "fail") : ""}`}>
                      <span className="test-icon">{r ? (r.ok ? "✓" : "✗") : "•"}</span>
                      <div>
                        <b>{test.name}</b>
                        <code>{test.call}</code>
                        <p className="test-invariant">{test.invariant}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
              <p className="chain-note">{level.implementation.hiddenTestCases.length} hidden edge tests guard against hard-coded answers.</p>
            </div>

            <div className={`workbench-pane pane-code ${pane === "code" ? "active" : ""}`}>
              <textarea
                className="code-editor project-editor"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); persist({ editorDraft: e.target.value }) }}
                spellCheck={false}
                aria-label="Python editor"
              />
              <div className="code-tools">
                <button className="btn-ghost" onClick={() => { setDraft(level.implementation.starter); persist({ editorDraft: level.implementation.starter }) }}>Reset</button>
                {level.failureDrill && (
                  <button className="btn-ghost" onClick={() => { setPane("spec"); persist({ pane: "spec" }) }}>Failure drill: {level.failureDrill.prompt.slice(0, 60)}…</button>
                )}
              </div>
            </div>

            <div className={`workbench-pane pane-output ${pane === "output" ? "active" : ""}`}>
              {syntaxError && <div className="test-error"><code>{syntaxError}</code></div>}
              {results && (
                <div className="test-list">
                  {results.map((r, i) => (
                    <div key={i} className={`test-row ${r.ok ? "ok" : "fail"}`}>
                      <span className="test-icon">{r.ok ? "✓" : "✗"}</span>
                      <code>{r.call}</code>
                      <span className="test-expect">
                        {r.ok ? `= ${String(r.got)}` : r.error ? r.error : `got ${String(r.got)}, expected ${String(r.expect)}`}
                      </span>
                      {!r.ok && level.implementation.visibleTests[i] && (
                        <p className="test-invariant">{level.implementation.visibleTests[i]!.invariant}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {allPassed && hiddenResults && (
                <div className="test-list">
                  <span className="experiment-kicker">Hidden edge tests</span>
                  {hiddenResults.map((r, i) => (
                    <div key={i} className={`test-row ${r.ok ? "ok" : "fail"}`}>
                      <span className="test-icon">{r.ok ? "✓" : "✗"}</span>
                      <code>{r.call}</code>
                      {!r.ok && <span className="test-expect">{r.error ?? `got ${String(r.got)}`}</span>}
                    </div>
                  ))}
                </div>
              )}
              {testsPassing && (
                <div className="trace-evidence">
                  <span className="experiment-kicker">Trace</span>
                  {traceLoading && <p className="chain-note">Running your function with tracing…</p>}
                  {traceError && <div className="test-error"><code>{traceError}</code></div>}
                  {traceRun && !traceError && (
                    <>
                      <p className="trace-caption" aria-live="polite">{fold.caption}</p>
                      <div className="ds-reasons">
                        {Object.entries(fold.counts).map(([kind, count]) => (
                          <span key={kind} className="ds-reason-chip">{kind} ×{count}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!running && !results && !syntaxError && <p className="chain-note">Run Tests to see the contract verdicts here.</p>}
            </div>
          </div>

          {/* Hint ladder */}
          <div className="hint-ladder" ref={hintsAnchor}>
            {visibleHints.map(h => (
              <div key={h.level} className={`hint ${h.type}`}>
                <span className="hint-level">{h.type === "question" ? `Q${h.level}` : "A"}</span>
                <p>{h.text}</p>
              </div>
            ))}
            {nextHint && nextHint.type === "question" && (
              <button className="btn-ghost" onClick={nextHintAsk}>I&rsquo;m stuck — ask me a question ({hintDepth}/{hints.length})</button>
            )}
            {nextHint && nextHint.type === "assertion" && !confirmAssertion && (
              <button className="btn-ghost" onClick={() => setConfirmAssertion(true)}>One more hint — but this one tells ({hintDepth}/{hints.length})</button>
            )}
            {nextHint && nextHint.type === "assertion" && confirmAssertion && (
              <div className="confirm-card">
                <p>This hint is an assertion, not a question — it does the thinking for you. Sure?</p>
                <div className="confirm-actions">
                  <button className="btn-ghost" onClick={() => { setHintDepth(nextHint.level); setConfirmAssertion(false); persist({ hintDepth: nextHint.level }) }}>Show it</button>
                  <button className="btn-ghost" onClick={() => setConfirmAssertion(false)}>Keep thinking</button>
                </div>
              </div>
            )}
          </div>

          {/* Solution */}
          {!solutionRevealed && !confirmSolution && (
            <button className="solution-link" onClick={() => setConfirmSolution(true)}>Show solution</button>
          )}
          {confirmSolution && !solutionRevealed && (
            <div className="confirm-card">
              <p>The solution is a map, not a failure. Read it, then explain the key move in your own words before moving on.</p>
              <div className="confirm-actions">
                <button className="btn-ghost" onClick={() => { setSolutionRevealed(true); setConfirmSolution(false); persist({ solutionRevealed: true }) }}>Reveal it anyway</button>
                <button className="btn-ghost" onClick={() => setConfirmSolution(false)}>Back to my code</button>
              </div>
            </div>
          )}
          {solutionRevealed && <pre className="solution-block"><code>{level.implementation.solution}</code></pre>}

          {/* Sticky primary */}
          <div className="level-actions sticky">
            {!testsPassing ? (
              <button className="btn-primary run-tests" onClick={run} disabled={running}>
                {running ? "Loading Python…" : results ? "Run Tests again" : "Run Tests"}
              </button>
            ) : (
              <button className="btn-primary" onClick={enterArtifact}>
                {allPassed && hiddenPassed ? "Tests pass — build the artifact →" : "Check output first"}
              </button>
            )}
            <span className="project-attempts">{attempts} run{attempts === 1 ? "" : "s"}</span>
          </div>
        </div>
      )}

      {/* ── STAGE: ARTIFACT ──────────────────────────────────────────── */}
      {renderedStage === "artifact" && (
        <div className="level-stage">
          <div className="discovery-ceremony">
            <span className="discovery-kicker">✦ Tests pass — {attempts} run{attempts === 1 ? "" : "s"}</span>
            <p className="narrative">Now record the engineering answer. Every field is load-bearing for the next level.</p>
          </div>

          <div className="artifact-form">
            <span className="experiment-kicker">Artifact: {level.artifact.title}</span>
            {level.artifact.fields.map(field => (
              <label key={field.name} className="artifact-field">
                <span>{field.label}{field.required && " *"}</span>
                <input
                  value={artifactValues[field.name] ?? ""}
                  onChange={(e) => { const next = { ...artifactValues, [field.name]: e.target.value }; setArtifactValues(next); persist({ artifactValues: next }) }}
                  placeholder={field.label}
                />
              </label>
            ))}
            <label className="artifact-field">
              <span>Reflection</span>
              <textarea
                className="answer-editor"
                value={reflection}
                onChange={(e) => { setReflection(e.target.value); persist({ reflection: e.target.value }) }}
                placeholder={level.artifact.reflectionQuestion}
              />
            </label>
          </div>

          <div className="exit-gate">
            <span className="experiment-kicker">Exit gate — one engineering answer</span>
            <p className="probe-question">{level.exitGate.question}</p>
            <div className="probe-options">
              {level.exitGate.options.map(option => (
                <button key={option.value} className={`opt-card${gatePicked === option.value ? " selected" : ""}`} onClick={() => setGatePicked(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
            {gatePicked !== null && gatePicked !== level.exitGate.correct && <p className="design-wrong-feedback">{level.exitGate.explanation}</p>}
            {gatePicked === level.exitGate.correct && (
              <div className="discovery-ceremony">
                <span className="discovery-kicker">✦ Gate passed</span>
                <p className="narrative">{level.exitGate.explanation}</p>
              </div>
            )}
          </div>

          <div className="level-actions sticky">
            <button className="btn-primary" disabled={!allFields || reflection.trim().length < 12 || gatePicked !== level.exitGate.correct} onClick={lockGate}>
              {allFields && reflection.trim().length >= 12 && gatePicked === level.exitGate.correct ? "Save artifact — level complete" : "Complete the artifact, reflection, and gate"}
            </button>
          </div>

          {gatePassed && allFields && (
            <div className="level-actions">
              {nextLevelId
                ? <Link href={`/ai-ml/projects/${projectId}/level/${nextLevelId}`} className="btn-primary as-link">Next: {nextLevelId} →</Link>
                : <Link href={`/ai-ml/projects/${projectId}`} className="btn-primary as-link">Project complete — back to the brief →</Link>}
              {previousLevelId && <Link href={`/ai-ml/projects/${projectId}/level/${previousLevelId}`} className="btn-ghost as-link">← Previous level</Link>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
