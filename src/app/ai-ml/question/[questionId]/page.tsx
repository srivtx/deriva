"use client"

// /ai-ml/question/[questionId] — the typed question player (docs/13 §bank).
// Prompt → fixture → hints → your answer → rubric → expected → next question.
// Drafts, attempts, hints, and review dates persist locally.

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getQuestionById, nextQuestionOf } from "@/curriculum/topics/ai-ml/questions"
import { loadQuestionProgress, saveQuestionProgress } from "@/persistence/ai-question-progress"

const kindLabels: Record<string, string> = {
  derivation: "Derivation", prediction: "Prediction", construction: "Construction",
  implementation: "Implementation", debugging: "Debugging", counterexample: "Counterexample",
  comparison: "Comparison", operations: "Operations", communication: "Communication", transfer: "Transfer",
}

function fixtureToText(fixture: unknown): string {
  return typeof fixture === "string" ? fixture : JSON.stringify(fixture, null, 2)
}

export default function QuestionPage() {
  const params = useParams()
  const questionId = params.questionId as string
  const question = useMemo(() => getQuestionById(questionId), [questionId])

  const [answer, setAnswer] = useState("")
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [rubricOpened, setRubricOpened] = useState(false)
  const [expectedOpened, setExpectedOpened] = useState(false)
  const [done, setDone] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [reviewIn, setReviewIn] = useState(0)

  useEffect(() => {
    if (!question) return
    const saved = loadQuestionProgress(question.id)
    setAnswer(saved?.answer ?? "")
    setHintsRevealed(saved?.hintsRevealed ?? 0)
    setAttempted(saved?.status === "attempted" || saved?.status === "done")
    setRubricOpened(saved?.rubricOpened ?? false)
    setExpectedOpened(saved?.expectedOpened ?? false)
    setDone(saved?.status === "done")
    setAttempts(saved?.attempts ?? 0)
  }, [question])

  if (!question) {
    return (
      <div className="lesson-missing">
        <h2>Question not found</h2>
        <Link href="/ai-ml">← Back to the AI/ML hub</Link>
      </div>
    )
  }

  const persist = (patch: Partial<Parameters<typeof saveQuestionProgress>[1]>) => {
    const next = {
      status: done ? "done" as const : attempted ? "attempted" as const : answer ? "started" as const : "new" as const,
      answer,
      attempts,
      hintsRevealed,
      rubricOpened,
      expectedOpened,
      lastOpened: new Date().toISOString(),
      ...patch,
    }
    saveQuestionProgress(question.id, next)
  }

  const revealHint = () => {
    const next = Math.min(hintsRevealed + 1, question.hints.length)
    setHintsRevealed(next)
    persist({ hintsRevealed: next })
  }

  const submitAttempt = () => {
    setAttempted(true)
    const next = attempts + 1
    setAttempts(next)
    persist({ attempts: next })
  }

  const complete = () => {
    const interval = question.reviewIntervals[reviewIn] ?? question.reviewIntervals[question.reviewIntervals.length - 1] ?? 7
    const nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString()
    setDone(true)
    setReviewIn(Math.min(reviewIn + 1, question.reviewIntervals.length - 1))
    persist({ status: "done", nextReview })
  }

  const next = nextQuestionOf(question)

  return (
    <div className="lab-page ai-question-page">
      <header className="landing-header">
        <span className="home-eyebrow">
          <span>{question.id}</span>
          <span className="home-eyebrow-kind">{kindLabels[question.kind] ?? question.kind}</span>
          <Link href={`/ai-ml/track/${question.track}`} className="home-eyebrow-link">track →</Link>
        </span>
        <h1 className="lab-title">{question.prompt}</h1>
        {question.prerequisites.length > 0 && (
          <p className="chain-note">prerequisite: {question.prerequisites.join(", ")}</p>
        )}
      </header>

      <section className="ai-question-fixture">
        <span className="experiment-kicker">Context fixture</span>
        <pre className="fixture-block"><code>{fixtureToText(question.contextFixture)}</code></pre>
      </section>

      <section className="ai-question-hints">
        <span className="experiment-kicker">Hints · {hintsRevealed}/{question.hints.length}</span>
        {question.hints.slice(0, hintsRevealed).map((hint, i) => (
          <p key={i} className="ai-hint">Q{i + 1}: {hint}</p>
        ))}
        {hintsRevealed < question.hints.length && (
          <button className="btn-ghost" onClick={revealHint}>I&rsquo;m stuck — reveal the next question</button>
        )}
      </section>

      <section className="ai-question-answer">
        <span className="experiment-kicker">Your answer</span>
        <textarea
          className="code-editor answer-editor"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); persist({ answer: e.target.value }) }}
          placeholder="Write your derivation, construction, or decision here…"
          aria-label="Your answer"
          spellCheck={false}
        />
      </section>

      <div className="ai-question-actions">
        {!attempted && (
          <button className="btn-primary" disabled={!answer.trim()} onClick={submitAttempt}>
            {answer.trim() ? "I've answered — show me the bar" : "Write an answer first"}
          </button>
        )}

        {attempted && !done && (
          <>
            <button className={`btn-primary${rubricOpened ? " ghost" : ""}`} disabled={rubricOpened} onClick={() => { setRubricOpened(true); persist({ rubricOpened: true }) }}>
              {rubricOpened ? "Rubric open" : "Open the rubric"}
            </button>
            {rubricOpened && !expectedOpened && (
              <button className="btn-primary" onClick={() => { setExpectedOpened(true); persist({ expectedOpened: true }) }}>
                Compare with the expected result
              </button>
            )}
            {expectedOpened && (
              <button className="btn-primary" onClick={complete}>Self-checked — mark done</button>
            )}
          </>
        )}

        {done && next && (
          <Link href={`/ai-ml/question/${next.id}`} className="btn-primary as-link">
            Next: {next.id} →
          </Link>
        )}
        {done && !next && (
          <Link href="/ai-ml" className="btn-primary as-link">Chain complete — back to the hub →</Link>
        )}
      </div>

      {attempted && (
        <div className="ai-question-rubric">
          <span className="experiment-kicker">Rubric</span>
          {question.rubric.map((check, i) => (
            <p key={i} className="rubric-check">☐ {check}</p>
          ))}
          {expectedOpened && (
            <div className="ai-question-expected">
              <span className="experiment-kicker">Expected {question.expectedArtifact ? "artifact" : "trace observation"}</span>
              <p className="narrative">{question.expectedArtifact ?? question.expectedTraceObservation}</p>
              <p className="chain-note">pattern: <b>{question.pattern}</b> · next review in {question.reviewIntervals[reviewIn] ?? question.reviewIntervals[question.reviewIntervals.length - 1]} days</p>
            </div>
          )}
        </div>
      )}

      <section className="ai-question-foot">
        <Link href={`/ai-ml/lab/${question.lessonId.split("/").pop()}`} className="ai-continue-sub">related lab: {question.lessonId.split("/").pop()} →</Link>
        <span className="ai-continue-sub">{attempts} attempt{attempts === 1 ? "" : "s"}</span>
      </section>
    </div>
  )
}
