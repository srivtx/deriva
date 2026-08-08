"use client"

// /patterns — the pattern journal (F10, 09 §7). Every completed lesson deposits
// a named pattern in the student's own words. This page is the real transcript.

import { useEffect, useState } from "react"
import Link from "next/link"
import { listPatternDeposits, type PatternDeposit } from "@/persistence/lesson-progress"
import { loadPatternQuizProgress, type PatternQuizProgress } from "@/persistence/pattern-quiz"
import { loadPracticeCompletion } from "@/persistence/practice-progress"
import { loadPatternMastery, recordPatternTransfer, type PatternMastery } from "@/persistence/pattern-mastery"
import { loadPatternDeskProgress, savePatternDeskPosition } from "@/persistence/pattern-desk-progress"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH, PATTERN_QUIZ, type PatternFamily } from "@/data/patterns"
import { TOPICS } from "@/data"

const FAMILIES: (PatternFamily | "All")[] = ["All", "Foundations", "Structures", "Graphs", "Choices", "State", "Compression", "Proof"]

export default function PatternsPage() {
  const [deposits, setDeposits] = useState<PatternDeposit[]>([])
  const [quizProgress, setQuizProgress] = useState<PatternQuizProgress>()
  const [practiceCompletion, setPracticeCompletion] = useState<Record<string, number[]>>({})
  const [mastery, setMastery] = useState<PatternMastery>({ recognized: [], missed: [], transferred: [] })
  const [currentPatternId, setCurrentPatternId] = useState<string>()
  const [bossChoice, setBossChoice] = useState<number | null>(null)
  const [bossSubmitted, setBossSubmitted] = useState(false)
  const [query, setQuery] = useState("")
  const [family, setFamily] = useState<PatternFamily | "All">("All")

  useEffect(() => {
    setDeposits(listPatternDeposits())
    setQuizProgress(loadPatternQuizProgress())
    setPracticeCompletion(loadPracticeCompletion())
    setMastery(loadPatternMastery())
    const savedPatternId = loadPatternDeskProgress().currentPatternId
    setCurrentPatternId(savedPatternId)
    if (savedPatternId && !window.location.hash) {
      window.history.replaceState(null, "", `#${savedPatternId}`)
      window.setTimeout(() => document.getElementById(savedPatternId)?.scrollIntoView({ block: "center" }), 0)
    }
  }, [])

  const rememberPattern = (patternId: string) => {
    setCurrentPatternId(patternId)
    savePatternDeskPosition(patternId)
  }

  const visiblePatterns = PATTERN_DIRECTORY.filter(pattern => {
    const matchesFamily = family === "All" || pattern.family === family
    const text = `${pattern.name} ${pattern.cue} ${pattern.move} ${pattern.examples.join(" ")}`.toLowerCase()
    return matchesFamily && text.includes(query.toLowerCase().trim())
  })
  const quizLabel = quizProgress?.completed ? "Retake the quiz →" : quizProgress?.answered ? "Continue the quiz →" : "Enter Quiz Mode →"
  const firstIncompleteIndex = PATTERN_LEARNING_PATH.findIndex(step => (practiceCompletion[step.topicId] || []).length < (TOPICS[step.topicId]?.problems.length || 1))
  const missedPatterns = PATTERN_DIRECTORY.filter(pattern => mastery.missed.includes(pattern.id))
  const recognizedCount = PATTERN_DIRECTORY.filter(pattern => mastery.recognized.includes(pattern.id)).length
  const transferredCount = PATTERN_DIRECTORY.filter(pattern => mastery.transferred.includes(pattern.id)).length
  const bossStep = PATTERN_LEARNING_PATH[firstIncompleteIndex >= 0 ? firstIncompleteIndex : PATTERN_LEARNING_PATH.length - 1]
  const bossQuestion = PATTERN_QUIZ.find(question => question.patternId === (bossStep.newPatternIds[0] || bossStep.revisitPatternIds[0])) || PATTERN_QUIZ[0]
  const bossPattern = PATTERN_DIRECTORY.find(pattern => pattern.id === bossQuestion.patternId)
  const bossCorrect = bossChoice === bossQuestion.answer

  const submitBoss = () => {
    if (bossChoice === null || bossSubmitted) return
    setBossSubmitted(true)
    if (bossCorrect) {
      recordPatternTransfer(bossQuestion.patternId)
      setMastery(loadPatternMastery())
    }
  }

  return (
    <main className="patterns-page">
      <header className="pattern-desk-hero">
        <div className="patterns-head">
          <span className="stage-kicker">Pattern Desk · open curriculum</span>
          <h1 className="stage-title">Build the instinct.</h1>
          <p className="stage-move">A guided route through 35 mental moves. Learn the cue, use it in a problem, then prove you can recognize it somewhere new.</p>
          <Link href="/patterns/quiz" className="pattern-desk-launch">{quizLabel}</Link>
        </div>
        <div className="pattern-desk-stats" aria-label="Pattern progress">
          <div><b>{recognizedCount}</b><span>recognized</span><small>of 35 patterns</small></div>
          <div><b>{missedPatterns.length}</b><span>to review</span><small>from quiz answers</small></div>
          <div><b>{transferredCount}</b><span>transferred</span><small>proved in new terrain</small></div>
        </div>
      </header>

      <section className="pattern-learning-path" aria-labelledby="pattern-path-heading">
        <div className="pattern-section-heading">
          <div>
            <span className="discovery-kicker">Recommended curriculum order</span>
            <h2 id="pattern-path-heading">Follow the path, do not pick at random</h2>
          </div>
          <span className="pattern-count">{PATTERN_LEARNING_PATH.length} stops</span>
        </div>
        <p className="pattern-guide-intro">This is the recommended order to learn the patterns: Trees first, then explicit references, ordered structures, search, choices, state, optimization, and proof. Nothing is locked; the route only tells you what is most useful next.</p>
        <div className="pattern-path-list">
          {PATTERN_LEARNING_PATH.map(step => {
            const newPatterns = step.newPatternIds.map(id => PATTERN_DIRECTORY.find(pattern => pattern.id === id)).filter(Boolean)
            const revisitPatterns = step.revisitPatternIds.map(id => PATTERN_DIRECTORY.find(pattern => pattern.id === id)).filter(Boolean)
            const completedCount = (practiceCompletion[step.topicId] || []).length
            const totalCount = TOPICS[step.topicId]?.problems.length || 0
            const complete = totalCount > 0 && completedCount >= totalCount
            const current = firstIncompleteIndex === PATTERN_LEARNING_PATH.indexOf(step)
            return (
            <article key={step.topicId} className={`pattern-path-step${complete ? " complete" : current ? " current" : ""}`}>
              <div className="pattern-path-step-head">
                <span className="pattern-route-number">{step.number}</span>
                <div><span className="pattern-family">{step.topicName}</span><h3>{step.title}</h3></div>
                <div className="pattern-path-status">{complete ? "Complete" : current ? "Suggested next" : "Open"}</div>
              </div>
              <p className="pattern-path-why">{step.whyNow}</p>
              <div className="pattern-path-progress"><span style={{ width: `${totalCount ? Math.min(100, (completedCount / totalCount) * 100) : 0}%` }} /></div>
              <div className="pattern-path-patterns">
                <div><span>Learn now</span>{newPatterns.length > 0 ? newPatterns.map(pattern => <Link key={pattern!.id} href={`/patterns#${pattern!.id}`} onClick={() => rememberPattern(pattern!.id)}>{pattern!.name}</Link>) : <em>Transfer the earlier moves to interval problems.</em>}</div>
                <div><span>Revisit</span>{revisitPatterns.map(pattern => <Link key={pattern!.id} href={`/patterns#${pattern!.id}`} onClick={() => rememberPattern(pattern!.id)}>{pattern!.name}</Link>)}</div>
              </div>
              <Link href={`/practice?topic=${step.topicId}`} className="pattern-path-link">{complete ? "Review topic →" : completedCount > 0 ? `Continue topic · ${completedCount}/${totalCount} complete →` : "Start topic →"}</Link>
            </article>
            )
          })}
        </div>
        <div className="pattern-guide-next"><b>How much</b><span>Stay on one topic until its core problems feel familiar, then take one five-question quiz block. The quiz is mixed on purpose: it tests whether you can recognize the move outside the original story. You can always jump ahead.</span></div>
      </section>

      {bossPattern && <section className="pattern-boss" aria-labelledby="boss-heading">
        <div className="pattern-section-heading"><div><span className="discovery-kicker">Transfer challenge</span><h2 id="boss-heading">Prove the move outside its home topic.</h2></div><span className="pattern-count">{bossStep.topicName}</span></div>
        <p className="pattern-boss-intro">This is the next pattern the route wants you to carry. No lock, no penalty: just a quick test of whether the cue survives a new surface.</p>
        <div className="pattern-boss-card"><span className="pattern-family">{bossPattern.name}</span><h3>{bossQuestion.prompt}</h3><div className="pattern-boss-options">{bossQuestion.options.map((option, index) => <button key={option} className={bossSubmitted ? index === bossQuestion.answer ? "correct" : index === bossChoice ? "wrong" : "" : bossChoice === index ? "selected" : ""} onClick={() => !bossSubmitted && setBossChoice(index)} disabled={bossSubmitted}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{bossSubmitted && <div className={`pattern-boss-feedback ${bossCorrect ? "correct" : "wrong"}`}><b>{bossCorrect ? "Transferred. The move survived the new surface." : `Revisit ${bossPattern.name}, then try this challenge again.`}</b><p>{bossQuestion.explanation}</p></div>}{!bossSubmitted ? <button className="btn-primary" onClick={submitBoss} disabled={bossChoice === null}>Check transfer →</button> : <div className="pattern-boss-actions"><button className="btn-ghost" onClick={() => { setBossSubmitted(false); setBossChoice(null) }}>Try again</button><Link href={`/patterns#${bossPattern.id}`} className="btn-ghost as-link">Review {bossPattern.name}</Link></div>}</div>
      </section>}

      {missedPatterns.length > 0 && <section className="pattern-review-queue" aria-labelledby="review-heading">
        <div className="pattern-section-heading"><div><span className="discovery-kicker">Personal review queue</span><h2 id="review-heading">Turn misses into instinct</h2></div><span className="pattern-count">{missedPatterns.length} to revisit</span></div>
        <p>These patterns were recently missed in retrieval. Read the cue once, then return to the quiz when you are ready.</p>
        <div className="pattern-review-list">{missedPatterns.map(pattern => <Link key={pattern.id} href={`/patterns#${pattern.id}`} onClick={() => rememberPattern(pattern.id)}><span>{pattern.name}</span><small>Review cue →</small></Link>)}</div>
      </section>}

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
            <article key={pattern.id} id={pattern.id} className={`pattern-directory-card${currentPatternId === pattern.id ? " current" : mastery.missed.includes(pattern.id) ? " needs-review" : mastery.recognized.includes(pattern.id) ? " recognized" : ""}`}>
              <div className="pattern-card-top"><span className="pattern-family">{pattern.family}</span><span className={`pattern-card-state${mastery.transferred.includes(pattern.id) ? " transfer" : mastery.missed.includes(pattern.id) ? " review" : mastery.recognized.includes(pattern.id) ? " known" : ""}`}>{mastery.transferred.includes(pattern.id) ? "Transferred" : mastery.missed.includes(pattern.id) ? "Review" : mastery.recognized.includes(pattern.id) ? "Recognized" : "New"}</span><span className="pattern-index">{String(PATTERN_DIRECTORY.indexOf(pattern) + 1).padStart(2, "0")}</span></div>
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
