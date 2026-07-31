"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { EXPEDITION_CAPSULES } from "@/expedition"
import { loadExpeditionProgress } from "@/persistence/expedition-progress"

export default function ExpeditionHomePage() {
  const [progress, setProgress] = useState<ReturnType<typeof loadExpeditionProgress>>()
  const capsule = EXPEDITION_CAPSULES[0]

  useEffect(() => {
    setProgress(loadExpeditionProgress(capsule.id))
  }, [capsule.id])

  const completed = progress?.completed
  const isComplete = !!progress?.completedAt
  const steps = ["retrieve", "derive", "failure", "transfer", "notebook"] as const
  const completedCount = steps.filter(step => completed?.[step]).length

  return (
    <main className="expedition-home">
      <section className="expedition-hero">
        <span className="stage-kicker">A separate learning experiment</span>
        <h1 className="stage-title">The Expedition</h1>
        <p className="narrative">
          Short pattern journeys built around retrieval, failure, transfer, and your own theory.
          The existing practice bank stays exactly as it is.
        </p>
      </section>

      <section className="expedition-focus">
        <div className="expedition-focus-top">
          <span className="discovery-kicker">Pattern capsule 01</span>
          <span className="expedition-time">10–15 min</span>
        </div>
        <h2>{capsule.name}</h2>
        <p className="narrative">{capsule.coreQuestion}</p>
        <div className="expedition-progress" aria-label={`${completedCount} of 5 acts complete`}>
          <span style={{ width: `${(completedCount / steps.length) * 100}%` }} />
        </div>
        <div className="expedition-focus-footer">
          <span>{isComplete ? "Pattern ready for retrieval" : progress ? `Resume at ${progress.currentStep}` : "Start with one thinking move"}</span>
          <Link href={`/expedition/${capsule.id}`} className="btn-primary as-link">
            {isComplete ? "Revisit the pattern →" : progress ? "Continue the expedition →" : "Begin the expedition →"}
          </Link>
        </div>
      </section>

      <section className="expedition-principles">
        <div><b>Retrieve</b><span>before rereading</span></div>
        <div><b>Break</b><span>the tempting wrong idea</span></div>
        <div><b>Transfer</b><span>the pattern to new terrain</span></div>
        <div><b>Own</b><span>the explanation in your words</span></div>
      </section>

      <Link href={capsule.anchorHref} className="expedition-secondary-link">
        Want the full guided lesson first? Open the nine-stage Recursion Reflex lesson →
      </Link>
      <Link href="/games" className="expedition-secondary-link">
        Want to feel the concept in your hands? Open Game Mode →
      </Link>
    </main>
  )
}
