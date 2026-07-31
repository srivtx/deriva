"use client"

import { useState } from "react"
import { ConceptGameCompletion, ConceptGameShell } from "@/components/concept-game-shell"
import { STATE_FORGE } from "@/games/state-forge"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

type Mode = "predict" | "forge"
type Tone = "correct" | "wrong"

export default function StateForgePage() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [forged, setForged] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: Tone; label: string; message: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const round = STATE_FORGE.rounds[roundIndex]
  const total = STATE_FORGE.rounds.length * 2
  const progress = roundIndex * 2 + (forged ? 2 : mode === "forge" ? 1 : 0)

  const choose = (value: string) => {
    if (!round || forged) return
    setAnswer(value)
    const correct = value === (mode === "predict" ? round.predictionCorrect : round.actionCorrect)
    if (!correct) {
      triggerGameFeedback("wrong")
      setMistakes(current => current + 1)
      setFeedback({ tone: "wrong", label: mode === "predict" ? "The state would lose information." : "The forge rejected that transition.", message: round.failure })
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("forge")
      setAnswer(null)
      setFeedback({ tone: "correct", label: "State contract locked.", message: "Now write the next answer into the smallest sufficient table." })
    } else {
      setForged(true)
      setFeedback({ tone: "correct", label: "State forged.", message: round.success })
    }
  }

  const next = () => {
    if (!forged || !round) return
    if (roundIndex + 1 === STATE_FORGE.rounds.length) {
      triggerGameFeedback("complete")
      recordGameRun(STATE_FORGE.id, mistakes)
    }
    setRoundIndex(index => index + 1)
    setMode("predict")
    setAnswer(null)
    setForged(false)
    setFeedback(null)
  }

  const restart = () => {
    setRoundIndex(0)
    setMode("predict")
    setAnswer(null)
    setForged(false)
    setFeedback(null)
    setMistakes(0)
  }

  if (!round) return <ConceptGameShell className="state-session" status="Forge complete" progress={total} total={total}>
    <ConceptGameCompletion
      kicker="State design forged through play"
      title="You remembered what the future needs."
      description="A dynamic-programming state is not a diary of the past. It is the smallest coordinate system that keeps every future answer recoverable."
      stats={[{ label: "States forged", value: STATE_FORGE.rounds.length }, { label: "Mistakes this run", value: mistakes }]}
      concepts={[{ title: "Amnesia test", description: "Forget history and keep only future-relevant facts." }, { title: "Overlap", description: "Identical states share one stored answer." }, { title: "Dependencies", description: "Fill a table only after its inputs exist." }, { title: "Coordinates", description: "Every variable that changes the future belongs in state." }]}
      transferHref="/practice?topic=dp&problem=1"
      transferLabel="Transfer to Dynamic Programming"
      onRestart={restart}
    />
  </ConceptGameShell>

  const options = mode === "predict" ? round.predictionOptions : round.actionOptions
  const table = forged ? [...round.table.slice(0, -1), round.result] : round.table
  return <ConceptGameShell className="state-session" status={`Round ${roundIndex + 1} of ${STATE_FORGE.rounds.length}`} progress={progress} total={total}>
    <section className="game-act">
      <span className="stage-kicker">{mode === "predict" ? "Predict the state" : "Forge the transition"}</span>
      <h1 className="stage-title">{round.title}</h1>
      <p className="narrative">{round.instruction}</p>
      <div className={`concept-visual state-board ${forged ? "is-forged" : ""}`} aria-live="polite">
        <div className="concept-visual-top"><span>Memory table</span><b>{round.focus}</b></div>
        <div className="state-cells">{table.map((cell, index) => <span key={`${cell}-${index}`} className={`${index === table.length - 1 ? "state-focus" : ""} ${forged && index === table.length - 1 ? "state-filled" : ""}`}>{cell}</span>)}</div>
        <code>{forged ? `${round.focus} ← ${round.result}` : `${round.focus} ← ?`}</code>
        <small>{forged ? "Stored answer can now serve a future call." : "The next cell is waiting for a state-preserving transition."}</small>
      </div>
      <div className="game-choice-box">
        {options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Forge: "}{option.label}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedback.tone}`} aria-live="polite"><b>{feedback.label}</b><p>{feedback.message}</p></div>}
      {forged && <button className="btn-primary" onClick={next}>{roundIndex + 1 === STATE_FORGE.rounds.length ? "Complete the forge →" : "Open the next state →"}</button>}
    </section>
  </ConceptGameShell>
}
