"use client"

// /patterns — the pattern journal (F10, 09 §7). Every completed lesson deposits
// a named pattern in the student's own words. This page is the real transcript.

import { useEffect, useState } from "react"
import Link from "next/link"
import { listPatternDeposits, type PatternDeposit } from "@/persistence/lesson-progress"
import { loadPatternQuizProgress, type PatternQuizProgress } from "@/persistence/pattern-quiz"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH, type PatternFamily } from "@/data/patterns"

const FAMILIES: (PatternFamily | "All")[] = ["All", "Foundations", "Structures", "Graphs", "Choices", "State", "Compression", "Proof"]

export default function PatternsPage() {
  const [deposits, setDeposits] = useState<PatternDeposit[]>([])
  const [quizProgress, setQuizProgress] = useState<PatternQuizProgress>()
  const [query, setQuery] = useState("")
  const [family, setFamily] = useState<PatternFamily | "All">("All")

  useEffect(() => {
    setDeposits(listPatternDeposits())
    setQuizProgress(loadPatternQuizProgress())
  }, [])

  const visiblePatterns = PATTERN_DIRECTORY.filter(pattern => {
    const matchesFamily = family === "All" || pattern.family === family
    const text = `${pattern.name} ${pattern.cue} ${pattern.move} ${pattern.examples.join(" ")}`.toLowerCase()
    return matchesFamily && text.includes(query.toLowerCase().trim())
  })
  const quizLabel = quizProgress?.completed ? "Retake the quiz →" : quizProgress?.answered ? "Continue the quiz →" : "Enter Quiz Mode →"

  return (
    <main className="patterns-page">
      <header className="patterns-head">
        <span className="stage-kicker">The real course outline</span>
        <h1 className="stage-title">Pattern Directory</h1>
        <p className="stage-move">
          Learn the mental moves behind the problems: when a pattern fits, what it
          preserves, and what makes the tempting alternative fail.
        </p>
      </header>

      <section className="pattern-quiz-banner">
        <div>
          <span className="discovery-kicker">7 sessions · 5 questions each</span>
          <h2>Can you recognize the move before the code?</h2>
          <p>Choose the pattern, invariant, state, or proof that makes each situation click. Your place saves after every answer.</p>
        </div>
        <Link href="/patterns/quiz" className="btn-primary as-link">{quizLabel}</Link>
      </section>

      <section className="pattern-learning-path" aria-labelledby="pattern-path-heading">
        <div className="pattern-section-heading">
          <div>
            <span className="discovery-kicker">Recommended curriculum order</span>
            <h2 id="pattern-path-heading">Follow the path, do not pick at random</h2>
          </div>
          <span className="pattern-count">{PATTERN_LEARNING_PATH.length} stops</span>
        </div>
        <p className="pattern-guide-intro">This is the order to learn the patterns: Trees first, then explicit references, ordered structures, search, choices, state, optimization, and proof. Each stop reuses the previous move before adding the next one.</p>
        <div className="pattern-path-list">
          {PATTERN_LEARNING_PATH.map(step => {
            const newPatterns = step.newPatternIds.map(id => PATTERN_DIRECTORY.find(pattern => pattern.id === id)).filter(Boolean)
            const revisitPatterns = step.revisitPatternIds.map(id => PATTERN_DIRECTORY.find(pattern => pattern.id === id)).filter(Boolean)
            return (
            <article key={step.topicId} className="pattern-path-step">
              <div className="pattern-path-step-head">
                <span className="pattern-route-number">{step.number}</span>
                <div><span className="pattern-family">{step.topicName}</span><h3>{step.title}</h3></div>
                <Link href={`/practice?topic=${step.topicId}`} className="pattern-path-link">Open topic →</Link>
              </div>
              <p className="pattern-path-why">{step.whyNow}</p>
              <div className="pattern-path-patterns">
                <div><span>Learn now</span>{newPatterns.length > 0 ? newPatterns.map(pattern => <Link key={pattern!.id} href={`/patterns#${pattern!.id}`}>{pattern!.name}</Link>) : <em>Transfer the earlier moves to interval problems.</em>}</div>
                <div><span>Revisit</span>{revisitPatterns.map(pattern => <Link key={pattern!.id} href={`/patterns#${pattern!.id}`}>{pattern!.name}</Link>)}</div>
              </div>
            </article>
            )
          })}
        </div>
        <div className="pattern-guide-next"><b>How much</b><span>Stay on one topic until its core problems feel familiar, then take one five-question quiz block. The quiz is mixed on purpose: it tests whether you can recognize the move outside the original story.</span></div>
      </section>

      <section className="pattern-directory" aria-labelledby="directory-heading">
        <div className="pattern-section-heading">
          <div>
            <span className="discovery-kicker">{PATTERN_DIRECTORY.length} mental models</span>
            <h2 id="directory-heading">Browse the moves</h2>
          </div>
          <span className="pattern-count">{visiblePatterns.length} shown</span>
        </div>
        <div className="pattern-controls">
          <label className="pattern-search">
            <span className="sr-only">Search patterns</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by cue, move, or example" />
          </label>
          <div className="pattern-filters" aria-label="Filter pattern families">
            {FAMILIES.map(option => <button key={option} className={family === option ? "active" : ""} onClick={() => setFamily(option)}>{option}</button>)}
          </div>
        </div>
        <div className="pattern-directory-grid">
          {visiblePatterns.map(pattern => (
            <article key={pattern.id} id={pattern.id} className="pattern-directory-card">
              <div className="pattern-card-top"><span className="pattern-family">{pattern.family}</span><span className="pattern-index">{String(PATTERN_DIRECTORY.indexOf(pattern) + 1).padStart(2, "0")}</span></div>
              <h3>{pattern.name}</h3>
              <p className="pattern-cue"><b>Use it when</b> {pattern.cue}</p>
              <p><b>The move</b> {pattern.move}</p>
              <p className="pattern-watch"><b>Watch out</b> {pattern.watchOut}</p>
              <div className="pattern-examples">{pattern.examples.map(example => <span key={example}>{example}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="pattern-journal-section" aria-labelledby="journal-heading">
        <div className="pattern-section-heading"><div><span className="discovery-kicker">Earned in guided lessons</span><h2 id="journal-heading">Your Pattern Journal</h2></div><span className="pattern-count">{deposits.length} earned</span></div>
        {deposits.length === 0 ? (
          <div className="patterns-empty">
            <p className="narrative">No personal deposits yet. Earn your first one at Stage 8 of the guided Trees lesson.</p>
            <Link href="/learn/trees/sum-1-to-n" className="btn-ghost as-link">Start the guided lesson →</Link>
          </div>
        ) : (
          <div className="patterns-grid">
            {deposits.map((d) => (
              <article key={d.patternId} className="pattern-card earned">
                <span className="discovery-kicker">✦ Earned {new Date(d.earnedAt).toLocaleDateString()}</span>
                <h2 className="pattern-name">{d.name}</h2>
                <blockquote className="ownwords-quote">“{d.ownWords}”</blockquote>
                <Link href="/learn/trees/sum-1-to-n" className="related-go">Revisit the lesson →</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
