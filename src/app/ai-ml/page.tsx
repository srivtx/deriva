"use client"

// /ai-ml — the AI/ML hub (docs/13 §Product navigation). The primary entry point:
// Continue, tracks, labs, practice queue, projects, and patterns. Every card has
// a Start or Resume path — no route guessing.

import { useEffect, useState } from "react"
import Link from "next/link"
import { aiMlTopic, plannedLabs } from "@/curriculum/topics/ai-ml/topic"
import { aiQuestions, aiQuestionTracks, getQuestionById } from "@/curriculum/topics/ai-ml/questions"
import { listLessons } from "@/curriculum"
import { loadLessonProgress } from "@/persistence/lesson-progress"
import { loadAllQuestionProgress } from "@/persistence/ai-question-progress"

export default function AiMlHubPage() {
  const [continueTarget, setContinueTarget] = useState<{ label: string; href: string; sub: string } | null>(null)
  const [queue, setQueue] = useState<{ due: number; done: number }>({ due: 0, done: 0 })

  useEffect(() => {
    const lessonProgress = loadLessonProgress("ai-ml/00-data-contract/what-counts-as-training-data")
    const questionProgress = loadAllQuestionProgress()

    const firstNotDone = aiQuestions.find(question => (questionProgress[question.id]?.status ?? "new") !== "done")
    const dueToday = aiQuestions.filter(question => {
      const p = questionProgress[question.id]
      if (!p || p.status === "done") return false
      return p.nextReview ? new Date(p.nextReview) <= new Date() : true
    })
    const doneCount = aiQuestions.filter(question => questionProgress[question.id]?.status === "done").length

    if (lessonProgress && !lessonProgress.finishedAt) {
      const unfinishedStage = Object.entries(lessonProgress.stages).find(([, s]) => !s.completed)
      setContinueTarget({
        label: "Resume What counts as training data?",
        href: "/lab/what-counts-as-training-data",
        sub: unfinishedStage ? `stage ${unfinishedStage[0]}` : "in progress",
      })
    } else if (dueToday.length > 0) {
      setContinueTarget({
        label: `${dueToday.length} question${dueToday.length > 1 ? "s" : ""} due for review`,
        href: `/ai-ml/question/${dueToday[0]!.id}`,
        sub: dueToday[0]!.id,
      })
    } else if (firstNotDone) {
      setContinueTarget({
        label: "Start the next question",
        href: `/ai-ml/question/${firstNotDone.id}`,
        sub: `${firstNotDone.track} · ${firstNotDone.id}`,
      })
    } else {
      setContinueTarget({
        label: "All 180 questions done — review due questions",
        href: "/ai-ml/question/MATH-001",
        sub: "review queue",
      })
    }
    setQueue({ due: dueToday.length, done: doneCount })
  }, [])

  const labs = listLessons().filter(lesson => lesson.topic === "ai-ml")

  return (
    <div className="lab-page ai-hub">
      <header className="landing-header">
        <span className="home-eyebrow"><span>AI/ML Systems</span></span>
        <h1 className="lab-title">{aiMlTopic.tagline}</h1>
        <p className="narrative">
          Labs build the pipeline. Questions drill the thinking. Every card below leads
          somewhere — nothing needs a URL.
        </p>
      </header>

      {continueTarget && (
        <Link href={continueTarget.href} className="ai-continue-card">
          <span className="lab-kicker">Continue</span>
          <b>{continueTarget.label}</b>
          <span className="ai-continue-sub">{continueTarget.sub} →</span>
        </Link>
      )}

      <section className="ai-hub-section">
        <span className="experiment-kicker">Practice queue · {queue.done} done · {queue.due} due</span>
        <div className="ai-hub-grid">
          <Link href="/ai-ml/projects" className="ai-hub-card"><b>Projects</b><span>15 cumulative builds, from data contract to the knowledge system</span></Link>
          <Link href="/ai-ml/systems" className="ai-hub-card ai-hub-card-featured"><b>Systems Atelier beta</b><span>S1–S2: build the handlers, watch the API interaction under load</span></Link>
          <Link href="/ai-ml/build-everything" className="ai-hub-card"><b>Build Everything</b><span>37 first-principles projects: gradient descent → transformers → real systems → DeepSeek</span></Link>
          <Link href="/ai-ml/patterns" className="ai-hub-card"><b>Patterns</b><span>The named patterns this track deposits into your journal</span></Link>
        </div>
      </section>

      <section className="ai-hub-section">
        <span className="experiment-kicker">Labs · build the pipeline</span>
        <div className="ai-hub-grid">
          {labs.map(lab => (
            <Link key={lab.id} href={`/ai-ml/lab/${lab.routeSlug}`} className="ai-hub-card">
              <span className="lab-kicker">{lab.ai?.kind} · authored</span>
              <b>{lab.title}</b>
              <span className="ai-continue-sub">one move: {lab.thinkingMove}</span>
            </Link>
          ))}
          {Object.entries(plannedLabIndex()).map(([slug, meta]) => (
            <Link key={slug} href={`/ai-ml/lab/${slug}`} className="ai-hub-card muted">
              <span className="lab-kicker">{meta.kind} · coming next</span>
              <b>{meta.title}</b>
              <span className="ai-continue-sub">one move: {meta.thinkingMove}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="ai-hub-section">
        <span className="experiment-kicker">Tracks · 180 typed questions</span>
        <div className="ai-hub-grid">
          {aiQuestionTracks.map(track => {
            const trackQuestions = aiQuestions.filter(question => question.track === track.id)
            return (
              <Link key={track.id} href={`/ai-ml/track/${track.id}`} className="ai-hub-card">
                <span className="lab-kicker">{track.from}–{track.to}</span>
                <b>{track.name}</b>
                <span className="ai-continue-sub">{trackQuestions.length} questions →</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="ai-hub-section">
        <span className="experiment-kicker">Start anywhere — three taps from here</span>
        <div className="ai-hub-grid">
          {["MATH-001", "DATA-001", "MODEL-001", "EVAL-001", "TENSOR-001", "SEARCH-001", "RAG-001", "API-001"].map(id => {
            const question = getQuestionById(id)
            if (!question) return null
            return (
              <Link key={id} href={`/ai-ml/question/${id}`} className="ai-hub-card">
                <span className="lab-kicker">{question.kind}</span>
                <b>{question.prompt.length > 60 ? question.prompt.slice(0, 60) + "…" : question.prompt}</b>
                <span className="ai-continue-sub">{id} →</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="artifact-chain">
        <span className="experiment-kicker">The artifact chain every lab builds toward</span>
        <div className="artifact-chain-strip">
          {aiMlTopic.artifactChain.map((artifact, i, all) => (
            <span key={artifact} className="chain-link">
              <span className={`chain-node${i === 0 ? " done" : ""}`}>{artifact}</span>
              {i < all.length - 1 && <span className="chain-arrow">→</span>}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

// Server-side planned lab map (title/kind/move) for the hub list.
function plannedLabIndex() {
  const out: Record<string, { title: string; kind: string; thinkingMove: string }> = {}
  for (const [id, meta] of Object.entries(plannedLabs)) {
    const slug = id.split("/").pop()!
    out[slug] = meta
  }
  return out
}
