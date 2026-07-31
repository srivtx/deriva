"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getCapsule } from "@/expedition"
import type { ExpeditionStep } from "@/expedition/schema"
import { loadExpeditionProgress, saveExpeditionProgress, type ExpeditionProgress } from "@/persistence/expedition-progress"

const steps: ExpeditionStep[] = ["retrieve", "derive", "failure", "transfer", "notebook"]
const labels: Record<ExpeditionStep, string> = {
  retrieve: "Retrieve", derive: "Derive", failure: "Break it", transfer: "Transfer", notebook: "Own it",
}

export default function ExpeditionSessionPage() {
  const params = useParams()
  const capsule = useMemo(() => getCapsule(params.capsule as string), [params.capsule])
  const [progress, setProgress] = useState<ExpeditionProgress>({ currentStep: "retrieve", completed: {}, lastVisited: new Date().toISOString() })
  const [answer, setAnswer] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(3)
  const [ownWords, setOwnWords] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [failureStep, setFailureStep] = useState(1)

  useEffect(() => {
    if (!capsule) return
    const saved = loadExpeditionProgress(capsule.id)
    if (saved) {
      setProgress(saved)
      setConfidence(saved.confidence || 3)
      setOwnWords(saved.ownWords || "")
    }
  }, [capsule])

  if (!capsule) {
    return <main className="expedition-missing"><h1>Expedition not found</h1><Link href="/expedition">Back to the Expedition</Link></main>
  }

  const step = progress.currentStep
  const stepIndex = steps.indexOf(step)
  const currentAnswer = step === "retrieve" ? capsule.retrieval : step === "derive" ? capsule.derive : step === "failure" ? capsule.failure : capsule.transfer
  const correct = answer === (currentAnswer as { correct: string }).correct
  const completed = progress.completed[step]
  const isFinished = !!progress.completedAt
  const failureTraceComplete = failureStep >= capsule.failure.brokenTrace.length

  const persist = (patch: Partial<ExpeditionProgress>) => {
    const next = { ...progress, ...patch, lastVisited: new Date().toISOString() }
    setProgress(next)
    saveExpeditionProgress(capsule.id, next)
  }

  const submitAnswer = () => {
    if (!answer) return
    setSubmitted(true)
    if (step === "retrieve") persist({ confidence, retrievalCorrect: correct })
    if (step === "failure") persist({ failureCorrect: correct })
    if (step === "transfer") persist({ transferCorrect: correct })
  }

  const advance = () => {
    const nextStep = steps[stepIndex + 1]
    if (!nextStep) return
    persist({ currentStep: nextStep, completed: { ...progress.completed, [step]: true } })
    setAnswer(null)
    setSubmitted(false)
  }

  const finishNotebook = () => {
    if (ownWords.trim().length < 20) return
    persist({
      currentStep: "notebook",
      completed: { ...progress.completed, notebook: true },
      ownWords: ownWords.trim(),
      nextQuestion: capsule.breadcrumb,
      completedAt: new Date().toISOString(),
    })
  }

  const renderChoice = (options: { label: string; value: string }[]) => (
    <div className="expedition-options">
      {options.map(option => (
        <button
          key={option.value}
          className={`expedition-option ${answer === option.value ? "selected" : ""} ${submitted && answer === option.value ? (correct ? "correct" : "wrong") : ""}`}
          onClick={() => !submitted && setAnswer(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <main className="expedition-session">
      <div className="expedition-session-top">
        <Link href="/expedition" className="expedition-back">← Expedition</Link>
        <span className="expedition-counter">{isFinished ? "Pattern earned" : `${stepIndex + 1} of ${steps.length}`}</span>
      </div>

      <div className="expedition-stepper" aria-label="Expedition acts">
        {steps.map((item, index) => (
          <span key={item} className={`${progress.completed[item] ? "complete" : ""} ${item === step ? "current" : ""}`}>
            {progress.completed[item] ? "✓" : index + 1} {labels[item]}
          </span>
        ))}
      </div>

      {isFinished ? (
        <section className="expedition-finished">
          <span className="discovery-kicker">✦ Pattern earned</span>
          <h1 className="stage-title">{capsule.name}</h1>
          <p className="narrative">{capsule.definition}</p>
          <blockquote>“{progress.ownWords}”</blockquote>
          <div className="expedition-breadcrumb">
            <span>Leave this question open:</span>
            <b>{capsule.breadcrumb}</b>
          </div>
          <div className="expedition-finished-actions">
            <Link href={capsule.transfer.existingHref || "/practice"} className="btn-primary as-link">Try the transfer problem →</Link>
            <Link href="/expedition" className="btn-ghost as-link">Back to Expedition</Link>
          </div>
        </section>
      ) : step === "notebook" ? (
        <section className="expedition-act">
          <span className="stage-kicker">Act 5 · Own it</span>
          <h1 className="stage-title">Make the pattern yours</h1>
          <p className="narrative">A definition you read belongs to the course. A definition you write belongs to you.</p>
          <div className="expedition-evidence">
            <span>Pattern</span><b>{capsule.name}</b>
            <span>Next question</span><b>{capsule.breadcrumb}</b>
          </div>
          <textarea className="expedition-own-words" value={ownWords} onChange={event => setOwnWords(event.target.value)} placeholder="In my own words, this pattern means…" />
          <button className="btn-primary" disabled={ownWords.trim().length < 20} onClick={finishNotebook}>Save my theory →</button>
          <p className="expedition-hint">Write at least one honest sentence. This becomes your retrieval cue later.</p>
        </section>
      ) : step === "derive" ? (
        <section className="expedition-act">
          <span className="stage-kicker">Act 2 · Derive</span>
          <h1 className="stage-title">{capsule.derive.title}</h1>
          {capsule.derive.paragraphs.map(paragraph => <p className="narrative" key={paragraph}>{paragraph}</p>)}
          <div className="expedition-question">
            <h2>{capsule.derive.prompt}</h2>
            {renderChoice(capsule.derive.options)}
            {submitted && <div className={`expedition-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "The contract is precise." : "Look for the condition that makes trust safe."}</b><p>{correct ? capsule.derive.commitment : "Ask: what does the function promise, and does every call move toward a floor?"}</p></div>}
          </div>
          {!submitted ? <button className="btn-primary" disabled={!answer} onClick={submitAnswer}>Commit my reasoning →</button> : <button className="btn-primary" onClick={advance}>Carry the idea forward →</button>}
        </section>
      ) : step === "failure" ? (
        <section className="expedition-act">
          <span className="stage-kicker">Act 3 · Break it</span>
          <h1 className="stage-title">Find the broken promise</h1>
          <p className="narrative">The tempting version looks recursive, but it never finishes. Watch the failure before you repair it.</p>
          <div className="broken-trace" aria-live="polite">
            {capsule.failure.brokenTrace.slice(0, failureStep).map(line => <code key={line}>{line}</code>)}
            {!failureTraceComplete && <button className="trace-next" onClick={() => setFailureStep(value => value + 1)}>Run the next step →</button>}
            {failureTraceComplete && <span className="trace-stopped">The trace is still asking. It has no floor.</span>}
          </div>
          <div className={`expedition-question ${!failureTraceComplete ? "question-locked" : ""}`}><h2>{capsule.failure.question}</h2>{failureTraceComplete && renderChoice(capsule.failure.options)}
            {!failureTraceComplete && <p className="expedition-hint">Keep stepping through the trace before naming the failure.</p>}
            {submitted && <div className={`expedition-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "You found the broken invariant." : "Trace the chain one line further."}</b><p>{correct ? capsule.failure.repair : "What condition would make the chain stop asking?"}</p></div>}
          </div>
          {!submitted ? <button className="btn-primary" disabled={!answer || !failureTraceComplete} onClick={submitAnswer}>Name the failure →</button> : <button className="btn-primary" onClick={advance}>Repair complete →</button>}
        </section>
      ) : step === "transfer" ? (
        <section className="expedition-act">
          <span className="stage-kicker">Act 4 · Transfer</span>
          <h1 className="stage-title">{capsule.transfer.title}</h1>
          <p className="narrative">The surface changed. The question is whether the mental move survived.</p>
          <div className="expedition-question"><h2>{capsule.transfer.prompt}</h2>{renderChoice(capsule.transfer.options)}
            {submitted && <div className={`expedition-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "You recognized the pattern in disguise." : "Ignore the surface. Ask what smaller answers the current unit needs."}</b><p>{correct ? capsule.transfer.explanation : "The current node still needs answers from smaller structures before it can combine its result."}</p></div>}
          </div>
          {capsule.transfer.existingHref && <Link href={capsule.transfer.existingHref} className="expedition-secondary-link">Optional existing practice problem →</Link>}
          {!submitted ? <button className="btn-primary" disabled={!answer} onClick={submitAnswer}>Test the transfer →</button> : <button className="btn-primary" onClick={advance}>Save the connection →</button>}
        </section>
      ) : (
        <section className="expedition-act">
          <span className="stage-kicker">Act 1 · Retrieve</span>
          <h1 className="stage-title">Can you still see the leap?</h1>
          <p className="narrative">Do not reread the lesson yet. Retrieval first. Your confidence is part of the evidence.</p>
          <div className="expedition-question"><h2>{capsule.retrieval.question}</h2>{renderChoice(capsule.retrieval.options)}
            {submitted && <div className={`expedition-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "Your memory held." : "A useful miss."}</b><p>{capsule.retrieval.explanation}</p></div>}
          </div>
          <label className="confidence-control">How confident are you? <b>{confidence}/5</b><input type="range" min="1" max="5" value={confidence} onChange={event => setConfidence(Number(event.target.value))} /></label>
          {!submitted ? <button className="btn-primary" disabled={!answer} onClick={submitAnswer}>Lock prediction →</button> : <button className="btn-primary" onClick={advance}>Open the next act →</button>}
        </section>
      )}
    </main>
  )
}
