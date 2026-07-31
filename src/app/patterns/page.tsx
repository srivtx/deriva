"use client"

// /patterns — the pattern journal (F10, 09 §7). Every completed lesson deposits
// a named pattern in the student's own words. This page is the real transcript.

import { useEffect, useState } from "react"
import Link from "next/link"
import { listPatternDeposits, type PatternDeposit } from "@/persistence/lesson-progress"

export default function PatternsPage() {
  const [deposits, setDeposits] = useState<PatternDeposit[]>([])

  useEffect(() => {
    setDeposits(listPatternDeposits())
  }, [])

  return (
    <div className="patterns-page">
      <header className="patterns-head">
        <span className="stage-kicker">The real course outline</span>
        <h1 className="stage-title">Your Pattern Journal</h1>
        <p className="stage-move">
          Problems are forgettable. Patterns are what you keep — each one earned,
          each one written in your own words.
        </p>
      </header>

      {deposits.length === 0 ? (
        <div className="patterns-empty">
          <p className="narrative">
            No patterns yet. Patterns are earned at Stage 8 of a guided lesson —
            the first one, <b>Recursive Leap of Faith</b>, is waiting in Trees.
          </p>
          <Link href="/learn/trees/sum-1-to-n" className="btn-primary as-link">
            Start the guided lesson →
          </Link>
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

      <style>{`
        .patterns-page { min-height: calc(100dvh - 52px); max-width: 720px; margin: 0 auto; padding: clamp(28px, 7vw, 56px) clamp(16px, 5vw, 32px) calc(112px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 32px; }
        .patterns-head { display: flex; flex-direction: column; gap: 4px; }
        .patterns-empty { display: flex; flex-direction: column; gap: 20px; }
        .patterns-grid { display: flex; flex-direction: column; gap: 16px; }
      `}</style>
    </div>
  )
}
