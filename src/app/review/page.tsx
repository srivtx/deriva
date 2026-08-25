"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PATTERN_DIRECTORY } from "@/data/patterns"
import { allCards, dueCards, gradeCard, removeCard, seedQueueFromMastery, type ReviewCard, type ReviewGrade } from "@/persistence/review-queue"
import ProgressRing from "@/components/progress-ring"

const GRADES: { grade: ReviewGrade; label: string; hint: string }[] = [
  { grade: "again", label: "Lost it", hint: "back in 10 minutes" },
  { grade: "hard", label: "Shaky", hint: "back sooner" },
  { grade: "good", label: "Got it", hint: "interval doubles" },
  { grade: "easy", label: "Instant", hint: "interval jumps" },
]

function formatDue(dueAt: number): string {
  const diff = dueAt - Date.now()
  if (diff <= 0) return "due now"
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `in ${hours}h`
  return `in ${Math.round(hours / 24)}d`
}

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewCard[]>([])
  const [revealed, setRevealed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    seedQueueFromMastery()
    setQueue(allCards())
    setHydrated(true)
  }, [])

  const due = useMemo(() => dueCards(), [queue])
  const current = due[0]
  const pattern = current ? PATTERN_DIRECTORY.find(p => p.id === current.patternId) : undefined
  const upcoming = queue.filter(card => card.dueAt > Date.now()).slice(0, 6)

  const handleGrade = (grade: ReviewGrade) => {
    if (!current) return
    gradeCard(current.patternId, grade)
    setRevealed(false)
    setQueue(allCards())
  }

  const handleDrop = () => {
    if (!current) return
    removeCard(current.patternId)
    setRevealed(false)
    setQueue(allCards())
  }

  return (
    <main className="super-page">
      <section className="review-hero">
        <div>
          <span className="super-kicker">REVIEW QUEUE / SPACED REPETITION</span>
          <h1>Patterns you earned, returned on schedule.</h1>
          <p>Deriva pulls every pattern you recognized or missed into this queue. Grade yourself honestly — the intervals do the rest. Nothing leaves this device.</p>
        </div>
        <div className="review-signal" aria-label="Cards due">
          <span>DUE NOW</span>
          <ProgressRing value={hydrated && queue.length ? (due.length / queue.length) * 100 : 0} size={80} stroke={8} label={hydrated ? `${due.length}` : "0"} sub={`of ${queue.length}`} />
        </div>
      </section>

      {hydrated && current && pattern && (
        <section className="review-card" aria-label="Review card">
          <span className="review-family">{pattern.family} · {formatDue(current.dueAt)}</span>
          <h2 className="review-cue">{pattern.cue}</h2>
          {!revealed && (
            <button type="button" className="super-primary review-reveal" onClick={() => setRevealed(true)}>
              Recall the move, then reveal <span aria-hidden="true">-&gt;</span>
            </button>
          )}
          {revealed && (
            <>
              <div className="review-move">
                <span className="review-move-label">{pattern.name}</span>
                <p>{pattern.move}</p>
              </div>
              <div className="review-grades">
                {GRADES.map(entry => (
                  <button key={entry.grade} type="button" className={`review-grade grade-${entry.grade}`} onClick={() => handleGrade(entry.grade)}>
                    <strong>{entry.label}</strong>
                    <small>{entry.hint}</small>
                  </button>
                ))}
              </div>
              <button type="button" className="review-drop" onClick={handleDrop}>Remove from deck</button>
            </>
          )}
        </section>
      )}

      {hydrated && !current && (
        <section className="review-empty">
          <div className="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="76" height="76" fill="none">
              <rect x="4" y="4" width="56" height="56" rx="16" stroke="var(--line)" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M20 40 44 16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="44" cy="16" r="4" fill="var(--accent)" />
            </svg>
          </div>
          <strong>Deck clear.</strong>
          <p>Nothing is due right now. Earn new patterns in the quiz, or come back when the schedule surfaces something.</p>
          <div className="review-empty-actions">
            <Link className="super-primary" href="/patterns/quiz">Practice recognition <span aria-hidden="true">-&gt;</span></Link>
            <Link className="super-ghost" href="/patterns">Open pattern journal</Link>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="review-upcoming" aria-label="Upcoming reviews">
          <span className="super-kicker">COMING BACK</span>
          <ul>
            {upcoming.map(card => {
              const def = PATTERN_DIRECTORY.find(p => p.id === card.patternId)
              return <li key={card.patternId}><span>{def?.name ?? card.patternId}</span><em>{formatDue(card.dueAt)}</em></li>
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
