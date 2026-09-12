"use client"

// Shared chrome for every Foundry station — same grammar as the concept
// game shell, but branded for the workshop: station index, mission meter,
// the research field note that grounds the station in real literature.

import Link from "next/link"
import type { ReactNode } from "react"
import type { FoundryStation } from "@/foundry/catalog"
import GameSoundToggle from "@/components/game-sound-toggle"

export function FoundryShell({
  station,
  mission,
  children,
}: {
  station: FoundryStation
  mission: number
  children: ReactNode
}) {
  return (
    <main className={`game-session foundry-session station-${station.id}`}>
      <div className="game-session-top">
        <Link href="/foundry" className="expedition-back">← Foundry</Link>
        <span>{station.index} · {mission > 0 ? `Mission ${Math.min(mission, station.missions)} of ${station.missions}` : "Overview"}</span>
        <GameSoundToggle />
      </div>
      <div className="game-meter">
        <span style={{ width: `${Math.min(100, (Math.max(0, mission) / station.missions) * 100)}%` }} />
      </div>
      {children}
      <aside className="foundry-field-note">
        <b>Field note</b>
        <p>{station.research}</p>
        <span className="foundry-engine-tag">engine: {station.engine}</span>
      </aside>
    </main>
  )
}

export function FoundryMissionHeader({
  kicker,
  title,
  narrative,
}: {
  kicker: string
  title: string
  narrative: string
}) {
  return (
    <section className="game-act">
      <span className="stage-kicker">{kicker}</span>
      <h1 className="stage-title">{title}</h1>
      <p className="narrative">{narrative}</p>
    </section>
  )
}

export function FoundryCompletion({
  station,
  stats,
  concepts,
  onRestart,
}: {
  station: FoundryStation
  stats: { label: string; value: string | number }[]
  concepts: { title: string; description: string }[]
  onRestart: () => void
}) {
  return (
    <section className="game-finished">
      <span className="discovery-kicker">✦ {station.title} cleared</span>
      <h1 className="stage-title">You operated the machine.</h1>
      <p className="narrative">
        {station.description} The engine stays on the bench — come back any time the
        parameters start to feel abstract again.
      </p>
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
        <button className="btn-primary" onClick={onRestart}>Run the station again →</button>
        <Link href={station.transferHref} className="btn-ghost as-link">{station.transferLabel} →</Link>
      </div>
    </section>
  )
}
