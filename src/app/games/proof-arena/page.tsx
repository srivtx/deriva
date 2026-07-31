"use client"

import { useState } from "react"
import { ConceptGameCompletion, ConceptGameShell } from "@/components/concept-game-shell"
import { PROOF_ARENA } from "@/games/proof-arena"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

type Mode = "predict" | "test"
type Tone = "correct" | "wrong"

export default function ProofArenaPage() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [tested, setTested] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: Tone; label: string; message: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const round = PROOF_ARENA.rounds[roundIndex]
  const total = PROOF_ARENA.rounds.length * 2
  const progress = roundIndex * 2 + (tested ? 2 : mode === "test" ? 1 : 0)

  const choose = (value: string) => {
    if (!round || tested) return
    setAnswer(value)
    const correct = value === (mode === "predict" ? round.predictionCorrect : round.actionCorrect)
    if (!correct) {
      triggerGameFeedback("wrong")
      setMistakes(current => current + 1)
      setFeedback({ tone: "wrong", label: mode === "predict" ? "The claim needs a harder challenge." : "The test did not establish safety.", message: round.failure })
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("test")
      setAnswer(null)
      setFeedback({ tone: "correct", label: "Prediction locked.", message: "Now run the witness and let the state change produce evidence." })
    } else {
      setTested(true)
      setFeedback({ tone: "correct", label: "Evidence recorded.", message: round.success })
    }
  }

  const next = () => {
    if (!tested || !round) return
    if (roundIndex + 1 === PROOF_ARENA.rounds.length) {
      triggerGameFeedback("complete")
      recordGameRun(PROOF_ARENA.id, mistakes)
    }
    setRoundIndex(index => index + 1)
    setMode("predict")
    setAnswer(null)
    setTested(false)
    setFeedback(null)
  }

  const restart = () => {
    setRoundIndex(0)
    setMode("predict")
    setAnswer(null)
    setTested(false)
    setFeedback(null)
    setMistakes(0)
  }

  if (!round) return <ConceptGameShell className="proof-session" status="Arena complete" progress={total} total={total}>
    <ConceptGameCompletion
      kicker="Shortcuts challenged through play"
      title="You stopped confusing examples with proof."
      description="An optimization becomes trustworthy only after its invariant, reduction, or exchange survives a deliberate challenge."
      stats={[{ label: "Claims tested", value: PROOF_ARENA.rounds.length }, { label: "Mistakes this run", value: mistakes }]}
      concepts={[{ title: "Counterexample", description: "One valid witness can break a universal claim." }, { title: "Invariant", description: "A reduction must preserve the property being asked for." }, { title: "Halving", description: "Count the work a shortcut actually removes." }, { title: "Exchange", description: "Swap one choice while keeping the useful suffix feasible." }]}
      transferHref="/practice?topic=greedy&problem=1"
      transferLabel="Transfer to Greedy proofs"
      onRestart={restart}
    />
  </ConceptGameShell>

  const options = mode === "predict" ? round.predictionOptions : round.actionOptions
  const trace = tested ? round.after : round.before
  return <ConceptGameShell className="proof-session" status={`Round ${roundIndex + 1} of ${PROOF_ARENA.rounds.length}`} progress={progress} total={total}>
    <section className="game-act">
      <span className="stage-kicker">{mode === "predict" ? "Predict the verdict" : "Run the witness"}</span>
      <h1 className="stage-title">{round.title}</h1>
      <p className="narrative">{round.instruction}</p>
      <div className={`concept-visual proof-board ${tested ? "is-tested" : ""}`} aria-live="polite">
        <div className="concept-visual-top"><span>Claim under test</span><b>{tested ? "EVIDENCE" : "UNPROVEN"}</b></div>
        <strong>{round.claim}</strong>
        <div className="proof-trace">{trace.map((line, index) => <code key={`${line}-${index}`}>{line}</code>)}</div>
        <small>{tested ? "The changed trace is the reason, not decoration." : "A shortcut has no proof until a state-changing test challenges it."}</small>
      </div>
      <div className="game-choice-box">
        {options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Test: "}{option.label}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedback.tone}`} aria-live="polite"><b>{feedback.label}</b><p>{feedback.message}</p></div>}
      {tested && <button className="btn-primary" onClick={next}>{roundIndex + 1 === PROOF_ARENA.rounds.length ? "Complete the arena →" : "Challenge the next claim →"}</button>}
    </section>
  </ConceptGameShell>
}
