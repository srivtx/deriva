"use client"

// The executable surface for the Build Everything lane. It intentionally uses
// the same worker runner and workbench vocabulary as Systems Projects, while
// keeping this source-mapped lane's contract separate from AuthoredLevel.

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type {
  BuildEverythingImplementation,
  BuildEverythingProject,
} from "@/curriculum/schema/build-everything"
import { runTests, type TestResult } from "@/execution/pyodide-client"
import {
  loadBuildEverythingProgress,
  saveBuildEverythingProgress,
  type BuildEverythingPane,
  type BuildEverythingProgress,
  type BuildEverythingStage,
} from "@/persistence/build-everything-progress"

interface Props {
  project: BuildEverythingProject & { implementation: BuildEverythingImplementation }
}

export function BuildEverythingWorkbench({ project }: Props) {
  const implementation = project.implementation
  const [stage, setStage] = useState<BuildEverythingStage>("workbench")
  const [pane, setPane] = useState<BuildEverythingPane>("code")
  const [draft, setDraft] = useState(implementation.starter)
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
  const [artifactValues, setArtifactValues] = useState<Record<string, string>>({})
  const [reflection, setReflection] = useState("")
  const [gatePicked, setGatePicked] = useState<string | null>(null)
  const [gatePassed, setGatePassed] = useState(false)
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const hintsAnchor = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const saved = loadBuildEverythingProgress(project.id)
    if (saved) {
      // Older progress could leave the learner behind a design/spec gate. The
      // editor is always an available starting point; preserve artifact work,
      // otherwise resume directly in the code pane.
      // A completed artifact is reusable evidence, not a locked terminal page.
      // Reopening the workspace always returns to the editor; the saved
      // artifact fields remain loaded and can be revisited after coding.
      const restoredStage: BuildEverythingStage = "workbench"
      setStage(restoredStage)
      setPane(saved.stage === "artifact" || saved.stage === "spec" || saved.stage === "design" ? "code" : saved.pane)
      setDraft(saved.editorDraft)
      setDesignPassed(saved.designPassed)
      setHintDepth(saved.hintDepth)
      setSolutionRevealed(saved.solutionRevealed)
      setAttempts(saved.attempts)
      setArtifactValues(saved.artifactValues)
      setReflection(saved.reflection)
      setGatePassed(saved.exitGatePassed)
      if (saved.testsPassing) setStage("workbench")
    }
    setHydrated(true)
  }, [project.id])

  const persist = (patch: Partial<BuildEverythingProgress> = {}) => {
    saveBuildEverythingProgress(project.id, {
      stage,
      pane,
      editorDraft: draft,
      designPassed,
      hintDepth,
      solutionRevealed,
      attempts,
      testsPassing,
      artifactValues,
      reflection,
      exitGatePassed: gatePassed,
      lastOpened: new Date().toISOString(),
      ...patch,
    })
  }

  const allPassed = results !== null && results.length > 0 && results.every(result => result.ok)
  const hiddenPassed = hiddenResults !== null && hiddenResults.length > 0 && hiddenResults.every(result => result.ok)
  const testsPassing = allPassed && hiddenPassed
  const hints = [...implementation.hints].sort((a, b) => a.level - b.level)
  const visibleHints = hints.filter(hint => hint.level <= hintDepth)
  const nextHint = hints.find(hint => hint.level === hintDepth + 1)
  const allFields = implementation.artifact.fields.every(field => artifactValues[field.name]?.trim())
  const renderedStage: BuildEverythingStage = hydrated ? stage : "workbench"

  const updateDraft = (nextDraft: string) => {
    setDraft(nextDraft)
    setResults(null)
    setHiddenResults(null)
    setSyntaxError(null)
    // A saved artifact describes the previous code. Editing makes it stale
    // until the new draft passes the contract and is recorded again.
    if (gatePassed) setGatePassed(false)
    persist({ editorDraft: nextDraft, testsPassing: false, exitGatePassed: false })
  }

  const selectPane = (nextPane: BuildEverythingPane) => {
    setPane(nextPane)
    persist({ pane: nextPane })
  }

  const viewSavedArtifact = () => {
    setGatePicked(implementation.exitGate.correct)
    setStage("artifact")
    persist({ stage: "artifact", exitGatePassed: gatePassed })
  }

  const run = async () => {
    setRunning(true)
    setSyntaxError(null)
    setPane("output")
    try {
      const visible = await runTests(draft, implementation.visibleTests.map(test => ({ call: test.call, expect: test.expect })))
      setResults(visible.results)
      setSyntaxError(visible.syntaxError ?? null)
      let hidden: TestResult[] | null = null
      if (!visible.syntaxError && visible.results.length > 0 && visible.results.every(result => result.ok)) {
        const hiddenResponse = await runTests(draft, implementation.hiddenTests.map(test => ({ call: test.call, expect: test.expect })))
        hidden = hiddenResponse.results
      }
      setHiddenResults(hidden)
      setAttempts(value => value + 1)
      persist({
        pane: "output",
        attempts: attempts + 1,
        testsPassing: visible.results.every(result => result.ok) && !!hidden && hidden.length > 0 && hidden.every(result => result.ok),
      })
    } catch (error) {
      setResults(null)
      setHiddenResults(null)
      setSyntaxError(error instanceof Error ? error.message : String(error))
      setAttempts(value => value + 1)
      persist({ pane: "output", attempts: attempts + 1, testsPassing: false })
    } finally {
      setRunning(false)
    }
  }

  const continueFromDesign = () => {
    if (designPicked === implementation.designQuestion.correct) setDesignPassed(true)
    setStage("workbench")
    setPane("code")
    persist({ designPassed: designPicked === implementation.designQuestion.correct, stage: "workbench", pane: "code" })
  }

  const enterArtifact = () => {
    setStage("artifact")
    persist({ stage: "artifact", testsPassing: true })
  }

  const lockGate = () => {
    if (gatePicked !== implementation.exitGate.correct || !allFields || reflection.trim().length < 12) return
    setGatePassed(true)
    persist({ stage: "artifact", exitGatePassed: true })
  }

  const nextHintAsk = () => {
    if (!nextHint) { setConfirmSolution(true); return }
    if (nextHint.type === "question") {
      setHintDepth(nextHint.level)
      persist({ hintDepth: nextHint.level })
    } else {
      setConfirmAssertion(true)
    }
  }

  return (
    <div className="project-level build-everything-workbench">
      <div className="practice-lab-header">
        <Link href={`/ai-ml/build-everything/${project.id}`} className="practice-lab-back">← Project</Link>
        <span className="practice-lab-crumb">Build Everything / {project.code}</span>
        <b className="practice-lab-title">{project.title}</b>
        <span className="practice-lab-duration">~{project.durationMinutes} min</span>
        <div className="practice-lab-actions">
          <button className="btn-ghost compact-action" onClick={nextHintAsk}>✧ AI Hint</button>
          <button className="btn-ghost compact-action" onClick={() => { selectPane("spec"); hintsAnchor.current?.scrollIntoView({ behavior: "smooth", block: "center" }) }}>💡 Hints</button>
          <button className="btn-primary compact-action" disabled={!hydrated || renderedStage !== "workbench" || running} onClick={run}>▷ Run Tests</button>
        </div>
      </div>

      <div className="build-everything-workbench-meta">
        <span className="build-everything-code">{project.code}</span>
        <span>{project.thinkingMove}</span>
        <span>{project.lines} lines · {project.sourceReuse}</span>
        {gatePassed && <span className="build-everything-complete-pill">✓ artifact saved · reusable</span>}
        {gatePassed && <button className="btn-ghost build-everything-artifact-link" onClick={viewSavedArtifact}>View saved artifact</button>}
      </div>

      {renderedStage === "spec" && (
        <div className="level-stage">
          <p className="narrative">{implementation.problemStatement}</p>
          <div className="spec-block">
            <span className="experiment-kicker">Required API</span>
            <pre className="fixture-block"><code>{implementation.requiredApi}</code></pre>
          </div>
          <div className="spec-block">
            <span className="experiment-kicker">Behavior</span>
            <ul className="spec-list">{implementation.behavior.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="spec-block">
            <span className="experiment-kicker">Examples — tap to reveal</span>
            <div className="example-strip">
              {implementation.examples.map(example => (
                <button key={example.id} type="button" className={`example-chip${revealedExamples.has(example.id) ? " revealed" : ""}`} onClick={() => {
                  const next = new Set(revealedExamples)
                  if (next.has(example.id)) next.delete(example.id)
                  else next.add(example.id)
                  setRevealedExamples(next)
                }} aria-expanded={revealedExamples.has(example.id)}>
                  <code>{example.given}</code><span>→</span><code className="example-result">{revealedExamples.has(example.id) ? example.result : "?"}</code>
                </button>
              ))}
            </div>
          </div>
          {implementation.constraints.length > 0 && <div className="spec-block"><span className="experiment-kicker">Constraints</span><ul className="spec-list">{implementation.constraints.map(item => <li key={item}>{item}</li>)}</ul></div>}
          <div className="level-actions"><button className="btn-primary" onClick={() => { setStage("workbench"); setPane("code"); persist({ stage: "workbench", pane: "code" }) }}>Open coding workspace →</button><button className="btn-ghost" onClick={() => { setStage("design"); persist({ stage: "design" }) }}>Try the optional design question</button></div>
        </div>
      )}

      {renderedStage === "design" && (
        <div className="level-stage">
          <p className="probe-question">{implementation.designQuestion.question}</p>
          <div className="probe-options">
            {implementation.designQuestion.options.map(option => <button key={option.value} className={`opt-card${designPicked === option.value ? " selected" : ""}`} onClick={() => setDesignPicked(option.value)}>{option.label}</button>)}
          </div>
          {designPicked !== null && designPicked !== implementation.designQuestion.correct && <p className="design-wrong-feedback">{implementation.designQuestion.explanation}</p>}
          {designPicked === implementation.designQuestion.correct && <div className="discovery-ceremony"><span className="discovery-kicker">✦ Design locked</span><p className="narrative">{implementation.designQuestion.explanation}</p></div>}
          <div className="level-actions"><button className="btn-primary" onClick={continueFromDesign}>Open the editor →</button><button className="btn-ghost" onClick={continueFromDesign}>Skip for now → editor</button></div>
        </div>
      )}

      {renderedStage === "workbench" && (
        <div className="level-workbench">
          <div className="workbench-tabs" role="tablist" aria-label="Workbench panes">
            {(["spec", "tests", "code", "output"] as const).map(tab => <button key={tab} role="tab" aria-selected={pane === tab} className={`workbench-tab${pane === tab ? " active" : ""}`} onClick={() => selectPane(tab)}>{tab === "spec" ? "Spec" : tab === "tests" ? `Tests (${implementation.visibleTests.length}+${implementation.hiddenTests.length} hidden)` : tab === "code" ? "Code" : "Output"}</button>)}
          </div>
          <div className={`workbench-panes pane-${pane}`}>
            <div className={`workbench-pane pane-spec ${pane === "spec" ? "active" : ""}`}>
              <p className="narrative">{implementation.problemStatement}</p>
              <span className="experiment-kicker">Required API</span><pre className="fixture-block"><code>{implementation.requiredApi}</code></pre>
              <span className="experiment-kicker">Behavior</span><ul className="spec-list">{implementation.behavior.map(item => <li key={item}>{item}</li>)}</ul>
              <div className="build-everything-optional-card"><div><span className="experiment-kicker">Optional design question</span><p>Think through the mechanism first if you want the extra reasoning step. It never blocks the editor.</p></div><button className="btn-ghost" onClick={() => { setStage("design"); persist({ stage: "design" }) }}>Try it</button></div>
            </div>
            <div className={`workbench-pane pane-tests ${pane === "tests" ? "active" : ""}`}>
              <span className="experiment-kicker">Visible contract tests</span>
              <ol className="spec-list tests-list">{implementation.visibleTests.map((test, index) => { const result = results?.[index]; return <li key={test.name} className={`test-row ${result ? (result.ok ? "ok" : "fail") : ""}`}><span className="test-icon">{result ? (result.ok ? "✓" : "✗") : "•"}</span><div><b>{test.name}</b><code>{test.call}</code><p className="test-invariant">{test.invariant}</p></div></li> })}</ol>
              <p className="chain-note">{implementation.hiddenTests.length} hidden edge tests run after the visible contract passes.</p>
            </div>
            <div className={`workbench-pane pane-code ${pane === "code" ? "active" : ""}`}>
              <div className="build-everything-editor-shell">
                <div className="build-everything-editor-topbar"><span>solution.py</span><span>Python 3 · Pyodide worker</span></div>
                <div className="build-everything-editor-body">
                  <div className="build-everything-line-numbers" aria-hidden="true">
                    {draft.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}
                  </div>
                  <textarea className="code-editor project-editor" value={draft} onChange={event => updateDraft(event.target.value)} spellCheck={false} aria-label="Python editor" />
                </div>
              </div>
              <div className="code-tools"><button className="btn-ghost" onClick={() => updateDraft(implementation.starter)}>Reset</button><button className="btn-ghost" onClick={() => selectPane("tests")}>Inspect tests</button></div>
            </div>
            <div className={`workbench-pane pane-output ${pane === "output" ? "active" : ""}`}>
              {syntaxError && <div className="test-error"><code>{syntaxError}</code></div>}
              {results && <div className="test-list">{results.map((result, index) => <div key={index} className={`test-row ${result.ok ? "ok" : "fail"}`}><span className="test-icon">{result.ok ? "✓" : "✗"}</span><code>{result.call}</code><span className="test-expect">{result.ok ? `= ${formatValue(result.got)}` : result.error ?? `got ${formatValue(result.got)}, expected ${formatValue(result.expect)}`}</span></div>)}</div>}
              {allPassed && hiddenResults && <div className="test-list"><span className="experiment-kicker">Hidden edge tests</span>{hiddenResults.map((result, index) => <div key={index} className={`test-row ${result.ok ? "ok" : "fail"}`}><span className="test-icon">{result.ok ? "✓" : "✗"}</span><code>{result.call}</code><span className="test-expect">{result.ok ? "passed" : result.error ?? `got ${formatValue(result.got)}`}</span></div>)}</div>}
              {!running && !results && !syntaxError && <p className="chain-note">Run Tests to see the contract verdicts here.</p>}
              {testsPassing && <div className="trace-evidence"><span className="experiment-kicker">Evidence captured</span><p className="trace-caption">Every visible and hidden contract test passed. The history is ready to become your first learning artifact.</p></div>}
            </div>
          </div>

          <div className="hint-ladder" ref={hintsAnchor}>
            {visibleHints.map(hint => <div key={hint.level} className={`hint ${hint.type}`}><span className="hint-level">{hint.type === "question" ? `Q${hint.level}` : "A"}</span><p>{hint.text}</p></div>)}
            {nextHint && nextHint.type === "question" && <button className="btn-ghost" onClick={nextHintAsk}>I’m stuck — ask me a question ({hintDepth}/{hints.length})</button>}
            {nextHint && nextHint.type === "assertion" && !confirmAssertion && <button className="btn-ghost" onClick={() => setConfirmAssertion(true)}>One more hint — but this one tells ({hintDepth}/{hints.length})</button>}
            {nextHint && nextHint.type === "assertion" && confirmAssertion && <div className="confirm-card"><p>This hint is an assertion, not a question — it does the thinking for you. Sure?</p><div className="confirm-actions"><button className="btn-ghost" onClick={() => { setHintDepth(nextHint.level); setConfirmAssertion(false); persist({ hintDepth: nextHint.level }) }}>Show it</button><button className="btn-ghost" onClick={() => setConfirmAssertion(false)}>Keep thinking</button></div></div>}
          </div>
          {!solutionRevealed && !confirmSolution && <button className="solution-link" onClick={() => setConfirmSolution(true)}>Show solution</button>}
          {confirmSolution && !solutionRevealed && <div className="confirm-card"><p>The solution is a map, not a failure. Read it, then explain the key move in your own words before moving on.</p><div className="confirm-actions"><button className="btn-ghost" onClick={() => { setSolutionRevealed(true); setConfirmSolution(false); persist({ solutionRevealed: true }) }}>Reveal it anyway</button><button className="btn-ghost" onClick={() => setConfirmSolution(false)}>Back to my code</button></div></div>}
          {solutionRevealed && <pre className="solution-block"><code>{implementation.solution}</code></pre>}
          <div className="level-actions sticky">{!testsPassing ? <button className="btn-primary run-tests" onClick={run} disabled={running}>{running ? "Loading Python…" : results ? "Run Tests again" : "Run Tests"}</button> : <button className="btn-primary" onClick={enterArtifact}>Tests pass — build the artifact →</button>}<span className="project-attempts">{attempts} run{attempts === 1 ? "" : "s"}</span></div>
        </div>
      )}

      {renderedStage === "artifact" && (
        <div className="level-stage">
          <div className="discovery-ceremony"><span className="discovery-kicker">✦ Tests pass — {attempts} run{attempts === 1 ? "" : "s"}</span><p className="narrative">Now record the engineering answer. This artifact is the input to the next project.</p></div>
          <div className="artifact-form"><span className="experiment-kicker">Artifact: {implementation.artifact.title}</span>{implementation.artifact.fields.map(field => <label key={field.name} className="artifact-field"><span>{field.label} *</span><input value={artifactValues[field.name] ?? ""} onChange={event => { const next = { ...artifactValues, [field.name]: event.target.value }; setArtifactValues(next); persist({ artifactValues: next }) }} placeholder={field.label} /></label>)}<label className="artifact-field"><span>Reflection *</span><textarea className="answer-editor" value={reflection} onChange={event => { setReflection(event.target.value); persist({ reflection: event.target.value }) }} placeholder={implementation.artifact.reflectionQuestion} /></label></div>
          <div className="exit-gate"><span className="experiment-kicker">Exit gate — one engineering answer</span><p className="probe-question">{implementation.exitGate.question}</p><div className="probe-options">{implementation.exitGate.options.map(option => <button key={option.value} className={`opt-card${gatePicked === option.value ? " selected" : ""}`} onClick={() => setGatePicked(option.value)}>{option.label}</button>)}</div>{gatePicked !== null && gatePicked !== implementation.exitGate.correct && <p className="design-wrong-feedback">{implementation.exitGate.explanation}</p>}{gatePicked === implementation.exitGate.correct && <div className="discovery-ceremony"><span className="discovery-kicker">✦ Gate passed</span><p className="narrative">{implementation.exitGate.explanation}</p></div>}</div>
          <div className="level-actions sticky"><button className="btn-primary" disabled={!allFields || reflection.trim().length < 12 || gatePicked !== implementation.exitGate.correct} onClick={lockGate}>{gatePassed ? "Artifact saved" : `Save artifact — complete ${project.code}`}</button></div>
          {gatePassed && <div className="discovery-ceremony"><span className="discovery-kicker">{project.code} complete</span><p className="narrative">Your {project.code} artifact is saved and reusable. You can return to the code anytime and continue refining it.</p><div className="level-actions"><button className="btn-primary" onClick={() => { setStage("workbench"); setPane("code"); persist({ stage: "workbench", pane: "code" }) }}>Review code workspace →</button><Link href={`/ai-ml/build-everything/${project.id}`} className="btn-ghost as-link">Back to project brief</Link></div></div>}
        </div>
      )}
    </div>
  )
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value
  try {
    const encoded = JSON.stringify(value)
    return encoded === undefined ? String(value) : encoded
  } catch {
    return String(value)
  }
}
