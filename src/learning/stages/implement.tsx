"use client"

// Stage 6 — Implement: the editor exists NOW, and only now (PRD §5).
// Hints are a question ladder (B3); the solution stays hidden behind a quiet
// confirm — revealing is logged as a learning signal, never punished (F8).

import { useEffect, useRef, useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, GhostButton } from "./shell"
import { runTests, type TestResult } from "@/execution/pyodide-client"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["implement"]
  design?: StageArtifacts["design"]
  onComplete: (a: StageArtifacts["implement"]) => void
  onDraft: (a: StageArtifacts["implement"]) => void
}

export function ImplementStage({ lesson, saved, design, onComplete, onDraft }: Props) {
  const impl = lesson.stages.implement
  const [code, setCode] = useState(saved?.code ?? impl.starter)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [syntaxError, setSyntaxError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [hintLevel, setHintLevel] = useState(saved?.hintLevel ?? 0)
  const [confirmAssertion, setConfirmAssertion] = useState(false)
  const [solutionOpen, setSolutionOpen] = useState(saved?.solutionRevealed ?? false)
  const [confirmSolution, setConfirmSolution] = useState(false)
  const executionRef = useRef<AbortController | null>(null)

  useEffect(() => () => executionRef.current?.abort(), [])

  const allPassed = results !== null && results.length > 0 && results.every(r => r.ok)
  const hints = [...impl.hints].sort((a, b) => a.level - b.level)
  const visibleHints = hints.filter(h => h.level <= hintLevel)
  const nextHint = hints.find(h => h.level === hintLevel + 1)

  const run = async () => {
    setRunning(true)
    setSyntaxError(null)
    const controller = new AbortController()
    executionRef.current?.abort()
    executionRef.current = controller
    try {
      const { results, syntaxError } = await runTests(code, impl.tests, { signal: controller.signal })
      setResults(results)
      setSyntaxError(syntaxError ?? null)
    } finally {
      if (executionRef.current === controller) executionRef.current = null
      setRunning(false)
    }
  }

  const persist = (patch: Partial<StageArtifacts["implement"]>) => {
    onDraft({
      code, hintLevel, solutionRevealed: solutionOpen,
      testsPassed: results?.filter(r => r.ok).length ?? 0,
      ...patch,
    } as StageArtifacts["implement"])
  }

  return (
    <StageShell stage="implement" title="Translate your contract" move={lesson.stageMoves.implement}>
      {design && (
        <div className="contract-recap">
          <span className="experiment-kicker">Your Stage-5 contract</span>
          <p><code>{design.name}({design.param})</code> — base case, recursive step, O(n). You promised; now transcribe.</p>
        </div>
      )}

      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => { setCode(e.target.value); persist({ code: e.target.value }) }}
        spellCheck={false}
        aria-label="Python editor"
      />

      {syntaxError && <div className="test-error"><code>{syntaxError}</code></div>}

      {results && (
        <div className="test-list" aria-live="polite">
          {results.map((r, i) => (
            <div key={i} className={`test-row ${r.ok ? "ok" : "fail"}`}>
              <span className="test-icon">{r.ok ? "✓" : "✗"}</span>
              <code>{r.call}</code>
              <span className="test-expect">
                {r.ok ? `= ${String(r.got)}` : r.error ? r.error : `got ${String(r.got)}, expected ${String(r.expect)}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hint ladder — questions first; assertion costs a confirm (B3) */}
      <div className="hint-ladder">
        {visibleHints.map(h => (
          <div key={h.level} className={`hint ${h.type}`}>
            <span className="hint-level">{h.type === "question" ? `Q${h.level}` : "A"}</span>
            <p>{h.text}</p>
          </div>
        ))}
        {nextHint && nextHint.type === "question" && (
          <GhostButton onClick={() => { setHintLevel(nextHint.level); persist({ hintLevel: nextHint.level }) }}>
            I&rsquo;m stuck — ask me a question ({hintLevel}/4)
          </GhostButton>
        )}
        {nextHint && nextHint.type === "assertion" && !confirmAssertion && (
          <GhostButton onClick={() => setConfirmAssertion(true)}>
            One more hint — but this one tells ({hintLevel}/4)
          </GhostButton>
        )}
        {nextHint && nextHint.type === "assertion" && confirmAssertion && (
          <div className="confirm-card">
            <p>This hint is an assertion, not a question — it does the thinking for you. Sure?</p>
            <div className="confirm-actions">
              <GhostButton onClick={() => { setHintLevel(nextHint.level); setConfirmAssertion(false); persist({ hintLevel: nextHint.level }) }}>
                Show it
              </GhostButton>
              <GhostButton onClick={() => setConfirmAssertion(false)}>Keep thinking</GhostButton>
            </div>
          </div>
        )}
      </div>

      {/* Solution — hidden by default, reveal logged (F8) */}
      {!solutionOpen && !confirmSolution && (
        <button className="solution-link" onClick={() => setConfirmSolution(true)}>
          Show solution
        </button>
      )}
      {confirmSolution && !solutionOpen && (
        <div className="confirm-card">
          <p>Reading the solution ends the discovery for this lesson. The questions above usually get you there.</p>
          <div className="confirm-actions">
            <GhostButton onClick={() => { setSolutionOpen(true); setConfirmSolution(false); persist({ solutionRevealed: true }) }}>
              Reveal it anyway
            </GhostButton>
            <GhostButton onClick={() => setConfirmSolution(false)}>Back to my code</GhostButton>
          </div>
        </div>
      )}
      {solutionOpen && (
        <pre className="solution-block"><code>{impl.solution}</code></pre>
      )}

      <StageCTA>
        {!allPassed ? (
          <PrimaryButton onClick={run} disabled={running}>
            {running ? "Loading Python…" : results ? "Run tests again" : "Run tests"}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => onComplete({
            code, hintLevel, solutionRevealed: solutionOpen, testsPassed: results.length,
          })}>
            All tests pass — watch it run →
          </PrimaryButton>
        )}
      </StageCTA>
    </StageShell>
  )
}
