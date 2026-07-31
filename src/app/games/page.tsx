"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { STACK_CLIMBER } from "@/games/stack-climber"
import { GAME_ENGINES } from "@/games/catalog"
import { useEffect, useState } from "react"
import { loadGameProgress, type GameProgress } from "@/persistence/game-progress"

const ConceptGalaxy = dynamic(() => import("@/components/concept-galaxy"), { ssr: false })

function GameCardArt({ engineId }: { engineId: string }) {
  return (
    <div className={`game-card-art art-${engineId}`} aria-hidden="true">
      <span className="art-orbit orbit-a" />
      <span className="art-orbit orbit-b" />
      <span className="art-core" />
      <span className="art-piece piece-a" />
      <span className="art-piece piece-b" />
      <span className="art-piece piece-c" />
    </div>
  )
}

function EngineCard({ engine }: { engine: (typeof GAME_ENGINES)[number] }) {
  const content = (
    <>
      <GameCardArt engineId={engine.id} />
      <div>
        <span className="game-engine-verb">{engine.verb}</span>
        <h2>{engine.title}</h2>
        <p>{engine.description}</p>
      </div>
      <div className="game-patterns">
        {engine.patterns.map(pattern => <span key={pattern}>{pattern}</span>)}
      </div>
      <span className="game-coming">{engine.status === "playable" ? "Play engine →" : engine.status === "prototype" ? "Prototype in progress" : "Next engine"}</span>
    </>
  )

  if (engine.status === "playable" && engine.href) {
    return <Link href={engine.href} className="game-engine-card playable">{content}</Link>
  }
  return <article className="game-engine-card">{content}</article>
}

export default function GamesPage() {
  const [progress, setProgress] = useState<GameProgress>()

  useEffect(() => setProgress(loadGameProgress(STACK_CLIMBER.id)), [])

  return (
    <main className="games-home">
      <span className="stage-kicker">Play the concept</span>
      <h1 className="stage-title">Game Mode</h1>
      <p className="narrative games-intro">
        Games here are not distractions from learning. They make the mental move physical
        enough to remember, then send you back to the real derivation.
      </p>

      <ConceptGalaxy />

      <Link href="/games/stack-climber" className="game-card">
        <GameCardArt engineId={STACK_CLIMBER.id} />
        <div className="game-card-top">
          <span className="discovery-kicker">Concept game 01</span>
          <span className="game-duration">2–4 min</span>
        </div>
        <h2>{STACK_CLIMBER.title}</h2>
        <p>{STACK_CLIMBER.description}</p>
        <div className="game-card-footer">
          <span>{progress ? `${progress.plays} plays · best ${progress.bestMistakes ?? 0} mistakes` : "No score. Just a cleaner mental model."}</span>
          <b>Play →</b>
        </div>
      </Link>

      <section className="game-engine-list">
        <div className="game-section-label">The concept map</div>
        {GAME_ENGINES.filter(engine => engine.id !== STACK_CLIMBER.id).map(engine => <EngineCard key={engine.id} engine={engine} />)}
      </section>

      <div className="game-design-note">
        <b>Why this works</b>
        <p>You physically descend the call stack, meet the base case, and return values upward. The game trains the shape before the code.</p>
      </div>

      <Link href="/expedition" className="expedition-secondary-link">Return to pattern Expeditions →</Link>
    </main>
  )
}
