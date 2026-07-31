"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { GAME_ENGINES } from "@/games/catalog"
import { PATTERN_GAME_LEVELS } from "@/games/levels"
import { recordGameRun } from "@/persistence/game-progress"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"

const labelForVisual: Record<string, string> = {
  repair: "The structure is live",
  frontier: "The frontier is moving",
  garden: "The decision tree is growing",
  state: "The memory table is changing",
  compress: "The representation is forming",
  proof: "The shortcut is under test",
}

export default function PatternGame({ gameId }: { gameId: string }) {
  const engine = useMemo(() => GAME_ENGINES.find(item => item.id === gameId), [gameId])
  const levels = PATTERN_GAME_LEVELS[gameId] || []
  const [levelIndex, setLevelIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  if (!engine || levels.length === 0) {
    return <main className="game-missing"><h1>Game engine is not ready</h1><Link href="/games">Back to Game Mode</Link></main>
  }

  const level = levels[levelIndex]
  const done = levelIndex >= levels.length
  const isCorrect = answer === level?.correct

  const choose = (value: string) => {
    if (submitted) return
    setAnswer(value)
    setSubmitted(true)
    const correct = value === level.correct
    triggerGameFeedback(correct ? "correct" : "wrong")
    if (!correct) setMistakes(value ? mistakes + 1 : mistakes)
  }

  const next = () => {
    if (!isCorrect) { setAnswer(null); setSubmitted(false); return }
    if (levelIndex + 1 >= levels.length) {
      triggerGameFeedback("complete")
      recordGameRun(engine.id, mistakes)
      setLevelIndex(levels.length)
      return
    }
    setLevelIndex(index => index + 1)
    setAnswer(null)
    setSubmitted(false)
  }

  const restart = () => {
    setLevelIndex(0)
    setAnswer(null)
    setSubmitted(false)
    setMistakes(0)
  }

  if (done) {
    return (
      <main className="game-session pattern-game-session">
        <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Complete</span><GameSoundToggle /></div>
        <div className="game-meter"><span style={{ width: "100%" }} /></div>
        <section className="game-finished">
          <span className="discovery-kicker">✦ Pattern family played</span>
          <h1 className="stage-title">{engine.title}</h1>
          <p className="narrative">You played: {engine.patterns.join(" · ")}</p>
          <div className="game-result"><span>Levels cleared</span><b>{levels.length}/{levels.length}</b><span>Mistakes this run</span><b>{mistakes}</b></div>
          <div className="game-actions"><button className="btn-primary" onClick={restart}>Play again →</button><Link href="/games" className="btn-ghost as-link">Choose another game</Link></div>
        </section>
      </main>
    )
  }

  return (
    <main className="game-session pattern-game-session">
      <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Level {levelIndex + 1} of {levels.length}</span><GameSoundToggle /></div>
      <div className="game-meter"><span style={{ width: `${(levelIndex / levels.length) * 100}%` }} /></div>
      <section className="game-act">
        <span className="stage-kicker">{engine.verb}</span>
        <h1 className="stage-title">{level.prompt}</h1>
        <p className="narrative">{level.instruction}</p>
        <div key={`${levelIndex}-${submitted}-${answer}`} className={`arena-visual arena-${level.visual}`} aria-live="polite">
          <span className="arena-label">{labelForVisual[level.visual]}</span>
          <div className="arena-field">
            {Array.from({ length: 7 }, (_, index) => <span key={index} className={`arena-piece piece-${index + 1}`} />)}
          </div>
          <div className="arena-status">{submitted ? (isCorrect ? "State repaired" : "State disrupted") : "Tap a move to change the world"}</div>
        </div>
        <div className="game-choice-box">
          {level.options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{option.label}</button>)}
        </div>
        {submitted && <div className={`game-feedback ${isCorrect ? "correct" : "wrong"}`}><b>{isCorrect ? "The state changed correctly." : "Watch the consequence, then try again."}</b><p>{isCorrect ? level.success : level.miss}</p></div>}
        {submitted && <button className="btn-primary" onClick={next}>{isCorrect ? (levelIndex + 1 === levels.length ? "Finish the engine →" : "Move to the next level →") : "Repair the move →"}</button>}
      </section>
    </main>
  )
}
