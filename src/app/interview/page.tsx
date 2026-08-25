"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TOPIC_LIST, TOPICS } from "@/data"
import { cancelInterview, endInterview, getActiveInterview, interviewHistory, startInterview, type ActiveInterview, type InterviewDebrief } from "@/persistence/interview"

const DURATIONS = [
  { label: "Phone screen · 15 min", ms: 15 * 60_000 },
  { label: "Standard · 25 min", ms: 25 * 60_000 },
  { label: "Onsite · 40 min", ms: 40 * 60_000 },
]

const RUBRIC = [
  { key: "correctness", label: "Correctness", desc: "Did the code actually work?" },
  { key: "complexity", label: "Complexity", desc: "Was the approach the right order?" },
  { key: "communication", label: "Communication", desc: "Could you have narrated the derivation?" },
] as const

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function pickProblem(difficulty: "any" | "Medium" | "Hard", completed: Record<string, number[]>) {
  const pool = TOPIC_LIST.flatMap(topic => topic.problems.map(problem => ({ topicId: topic.id, topicName: topic.name, problem })))
  const unsolved = pool.filter(entry => !(completed[entry.topicId] || []).includes(entry.problem.id) && (difficulty === "any" || entry.problem.difficulty === difficulty))
  const source = unsolved.length ? unsolved : pool
  return source[Math.floor(Math.random() * source.length)]
}

export default function InterviewPage() {
  const [session, setSession] = useState<ActiveInterview | null>(null)
  const [history, setHistory] = useState<InterviewDebrief[]>([])
  const [difficulty, setDifficulty] = useState<"any" | "Medium" | "Hard">("any")
  const [durationMs, setDurationMs] = useState(DURATIONS[1].ms)
  const [now, setNow] = useState(Date.now())
  const [scores, setScores] = useState<Record<string, number>>({ correctness: 3, complexity: 3, communication: 3 })
  const [note, setNote] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSession(getActiveInterview())
    setHistory(interviewHistory())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!session) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [session])

  const remaining = session ? session.durationMs - (now - session.startedAt) : 0
  const timeUp = session ? remaining <= 0 : false
  const average = useMemo(() => {
    if (!history.length) return null
    const total = history.reduce((sum, entry) => sum + (entry.scores.correctness + entry.scores.complexity + entry.scores.communication) / 3, 0)
    return (total / history.length).toFixed(1)
  }, [history])

  const begin = () => {
    const pick = pickProblem(difficulty, JSON.parse(localStorage.getItem("deriva-completed-v2") || "{}"))
    startInterview({
      topicId: pick.topicId,
      problemId: pick.problem.id,
      problemTitle: pick.problem.title,
      difficulty: pick.problem.difficulty ?? "Medium",
      startedAt: Date.now(),
      durationMs,
    })
    setSession(getActiveInterview())
    setNow(Date.now())
  }

  const debrief = () => {
    if (!session) return
    const entry = endInterview({
      problemTitle: session.problemTitle,
      difficulty: session.difficulty,
      durationMs: session.durationMs,
      solved: Boolean(session.solvedAt),
      scores: {
        correctness: scores.correctness ?? 3,
        complexity: scores.complexity ?? 3,
        communication: scores.communication ?? 3,
      },
      note: note.trim(),
    })
    cancelInterview()
    setSession(null)
    setHistory(interviewHistory())
    setNote("")
    return entry
  }

  const quit = () => {
    cancelInterview()
    setSession(null)
  }

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">MOCK INTERVIEW / PRESSURE ROOM</span>
          <h1>A random problem, a countdown, no hints.</h1>
          <p>The drill room locks hints and solutions while the clock runs. When time is up — or you pass — come back and score yourself honestly.</p>
        </div>
        <div className="contest-history-signal" aria-label="Interview average">
          <span>AVG SCORE</span>
          <strong>{hydrated && average ? average : "—"}</strong>
          <small>{history.length} sessions</small>
        </div>
      </section>

      {hydrated && !session && (
        <section className="contest-setup">
          <label className="super-field">
            <span>Difficulty</span>
            <div className="segmented" role="group" aria-label="Difficulty">
              {(["any", "Medium", "Hard"] as const).map(option => (
                <button key={option} type="button" className={difficulty === option ? "selected" : ""} onClick={() => setDifficulty(option)}>{option === "any" ? "Any" : option}</button>
              ))}
            </div>
          </label>
          <div className="super-field">
            <span>Format</span>
            <div className="segmented" role="group" aria-label="Interview length">
              {DURATIONS.map(option => (
                <button key={option.ms} type="button" className={durationMs === option.ms ? "selected" : ""} onClick={() => setDurationMs(option.ms)}>{option.label}</button>
              ))}
            </div>
          </div>
          <button type="button" className="super-primary" onClick={begin}>Generate interview <span aria-hidden="true">-&gt;</span></button>
        </section>
      )}

      {session && (
        <section className={`contest-live${timeUp ? " up" : ""}`}>
          <div className="contest-clock" role="timer" aria-label="Time remaining">
            <span>{timeUp ? "TIME" : "REMAINING"}</span>
            <strong>{clock(remaining)}</strong>
          </div>
          <div className="contest-status">{session.difficulty} · {session.solvedAt ? "passed ✓" : "in progress"}</div>
          <p className="interview-problem">{session.problemTitle}</p>
          <div className="contest-live-actions">
            <Link className="super-primary" href={`/practice?topic=${session.topicId}&problem=${session.problemId}&interview=1`}>
              {session.solvedAt ? "Back in the room" : "Enter interview room"} <span aria-hidden="true">-&gt;</span>
            </Link>
            <button type="button" className="super-ghost" onClick={quit}>Cancel session</button>
          </div>
          <p className="contest-note">The clock runs on wall time — leaving the room does not pause it.</p>
        </section>
      )}

      {session && (timeUp || session.solvedAt) && (
        <section className="interview-debrief" aria-label="Self-score debrief">
          <span className="super-kicker">DEBRIEF / SCORE YOURSELF</span>
          {RUBRIC.map(item => (
            <div key={item.key} className="interview-rubric-row">
              <div><strong>{item.label}</strong><small>{item.desc}</small></div>
              <div className="segmented" role="group" aria-label={`${item.label} score`}>
                {[1, 2, 3, 4, 5].map(score => (
                  <button key={score} type="button" className={(scores[item.key] ?? 3) === score ? "selected" : ""} onClick={() => setScores(prev => ({ ...prev, [item.key]: score }))}>{score}</button>
                ))}
              </div>
            </div>
          ))}
          <textarea className="interview-note" value={note} onChange={event => setNote(event.target.value)} placeholder="What would you do differently in the first five minutes?" aria-label="Debrief note" />
          <button type="button" className="super-primary" onClick={debrief}>Save debrief <span aria-hidden="true">-&gt;</span></button>
        </section>
      )}

      {history.length > 0 && (
        <section className="contest-history" aria-label="Past interviews">
          <span className="super-kicker">PAST SESSIONS</span>
          <ul>
            {history.map(entry => (
              <li key={entry.id}>
                <span>{entry.problemTitle}</span>
                <em>{entry.solved ? "passed" : "timed out"} · {(entry.scores.correctness + entry.scores.complexity + entry.scores.communication) / 3}/5</em>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
