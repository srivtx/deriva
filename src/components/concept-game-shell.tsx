"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import GameSoundToggle from "@/components/game-sound-toggle"

type GameStat = { label: string; value: string | number }

type ConceptGameShellProps = {
  className?: string
  status: string
  progress: number
  total: number
  children: ReactNode
}

export function ConceptGameShell({ className = "", status, progress, total, children }: ConceptGameShellProps) {
  return (
    <main className={`game-session concept-game-session ${className}`}>
      <div className="game-session-top">
        <Link href="/games" className="expedition-back">← Game Mode</Link>
        <span>{status}</span>
        <GameSoundToggle />
      </div>
      <div className="game-meter"><span style={{ width: `${Math.min(100, (progress / total) * 100)}%` }} /></div>
      {children}
    </main>
  )
}

export function ConceptGameCompletion({
  kicker,
  title,
  description,
  stats,
  concepts,
  transferHref,
  transferLabel,
  onRestart,
}: {
  kicker: string
  title: string
  description: string
  stats: GameStat[]
  concepts: { title: string; description: string }[]
  transferHref: string
  transferLabel: string
  onRestart: () => void
}) {
  return (
    <section className="game-finished">
      <span className="discovery-kicker">✦ {kicker}</span>
      <h1 className="stage-title">{title}</h1>
      <p className="narrative">{description}</p>
      <div className="game-result">
        {stats.flatMap(stat => [
          <span key={stat.label}>{stat.label}</span>,
          <b key={`${stat.label}-value`}>{stat.value}</b>,
        ])}
      </div>
      <div className="concept-map">
        <span>What you just trained</span>
        {concepts.map((concept, index) => (
          <div key={concept.title}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <strong>{concept.title}</strong>
            <small>{concept.description}</small>
          </div>
        ))}
      </div>
      <div className="game-actions">
        <button className="btn-primary" onClick={onRestart}>Play again →</button>
        <Link href={transferHref} className="btn-ghost as-link">{transferLabel} →</Link>
      </div>
    </section>
  )
}
