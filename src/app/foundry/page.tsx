"use client"

// FOUNDRY — the AI production workshop. A standalone app: six stations,
// six real engines, progress and XP tracked locally.

import Link from "next/link"
import { useEffect, useState } from "react"
import { FOUNDRIES, FOUNDRY } from "@/foundry/catalog"
import { FOUNDRY_TOTAL_MISSIONS, foundryLevel, foundryRank, foundryTotals, loadAllFoundryProgress, type StationProgress } from "@/foundry/progress"

function StationDots({ cleared, total }: { cleared: number; total: number }) {
  return (
    <span className="foundry-mission-dots" aria-label={`${cleared} of ${total} missions cleared`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < cleared ? "on" : ""} />
      ))}
    </span>
  )
}

function StationCard({ station, progress, isNext }: { station: (typeof FOUNDRIES)[number]; progress?: StationProgress; isNext?: boolean }) {
  const cleared = Math.min(progress?.missionsCleared ?? 0, station.missions)
  return (
    <Link href={station.href} className="foundry-station-card">
      <div className="foundry-station-head">
        <span className="foundry-station-index">{station.index}</span>
        <div>
          <span className="foundry-station-verb">{station.verb}</span>
          <h2>{station.title}</h2>
        </div>
        <StationDots cleared={cleared} total={station.missions} />
      </div>
      <p>{station.description}</p>
      <div className="foundry-station-meta">
        <span className="foundry-skill-tag">{station.skill}</span>
        {progress ? (
          <span className="foundry-station-score">
            {progress.runs} {progress.runs === 1 ? "run" : "runs"}
            {progress.bestMistakes !== null ? ` · best ${progress.bestMistakes} mistakes` : ""}
            {cleared >= station.missions ? " · cleared ✦" : ""}
          </span>
        ) : (
          <span className="foundry-station-score">no runs yet</span>
        )}
      </div>
      {isNext && <span className="foundry-continue-chip">resume · mission {cleared + 1} →</span>}
    </Link>
  )
}

export default function FoundryPage() {
  const [progress, setProgress] = useState<Record<string, StationProgress>>({})
  const [totals, setTotals] = useState({ xp: 0, missionsCleared: 0, stationsCleared: 0 })

  useEffect(() => {
    setProgress(loadAllFoundryProgress())
    setTotals(foundryTotals())
  }, [])

  const level = foundryLevel(totals.xp)
  const nextStation = FOUNDRIES.find(station => (progress[station.id]?.missionsCleared ?? 0) < station.missions)

  return (
    <main className="foundry-home">
      <span className="stage-kicker">{FOUNDRY.tagline}</span>
      <h1 className="stage-title">Foundry</h1>
      <p className="narrative foundry-intro">{FOUNDRY.intro}</p>

      <section className="foundry-progress-card" aria-label="Workshop progress">
        <div className="foundry-progress-readout">
          <span>level {level.level} · {foundryRank(level.level)}</span>
          <b>{totals.xp} XP</b>
        </div>
        <div className="foundry-progress-bar">
          <span style={{ width: `${(level.intoLevel / level.levelSpan) * 100}%` }} />
        </div>
        <div className="foundry-progress-stats">
          <span>{totals.missionsCleared} / {FOUNDRY_TOTAL_MISSIONS} missions</span>
          <span>{totals.stationsCleared} / {FOUNDRIES.length} stations cleared</span>
        </div>
        <span className="foundry-next-up">
          {nextStation
            ? `next up: ${nextStation.title} · mission ${(progress[nextStation.id]?.missionsCleared ?? 0) + 1} of ${nextStation.missions}`
            : "the whole floor is cleared ✦ — replay any station to sharpen"}
        </span>
      </section>

      <section className="foundry-station-list">
        <div className="game-section-label">The floor</div>
        {FOUNDRIES.map(station => (
          <StationCard key={station.id} station={station} progress={progress[station.id]} isNext={nextStation?.id === station.id} />
        ))}
      </section>

      <div className="game-design-note">
        <b>Why this exists</b>
        <p>
          Production AI work is full of invisible machinery — tokenizers, samplers, attention,
          KV caches, retrievers, agent loops. You can memorize their names, or you can operate
          them. Every station here is the real algorithm at bench scale: deterministic, inspectable,
          and small enough to break on purpose.
        </p>
      </div>

      <Link href="/games" className="expedition-secondary-link">Play the concept games →</Link>
    </main>
  )
}
