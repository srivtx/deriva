"use client"

import { useState } from "react"
import { ConceptGameCompletion, ConceptGameShell } from "@/components/concept-game-shell"
import { INVARIANT_INSPECTOR } from "@/games/invariant-inspector"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

type Mode = "predict" | "repair"
type Tone = "correct" | "wrong"

export default function InvariantInspectorPage() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [resolved, setResolved] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: Tone; label: string; message: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const round = INVARIANT_INSPECTOR.rounds[roundIndex]
  const total = INVARIANT_INSPECTOR.rounds.length * 2
  const progress = roundIndex * 2 + (resolved ? 2 : mode === "repair" ? 1 : 0)

  const choose = (value: string) => {
    if (!round || resolved) return
    setAnswer(value)
    const correct = value === (mode === "predict" ? round.predictionCorrect : round.actionCorrect)
    if (!correct) {
      triggerGameFeedback("wrong")
      setMistakes(current => current + 1)
      setFeedback({ tone: "wrong", label: mode === "predict" ? "The inspection missed." : "Repair failed.", message: mode === "predict" ? "Follow the invariant from the root to the first illegal state." : round.failure })
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("repair")
      setAnswer(null)
      setFeedback({ tone: "correct", label: "Prediction locked.", message: "Now perform the repair that changes the structure." })
    } else {
      setResolved(true)
      setFeedback({ tone: "correct", label: "Invariant restored.", message: round.success })
    }
  }

  const next = () => {
    if (!resolved || !round) return
    if (roundIndex + 1 === INVARIANT_INSPECTOR.rounds.length) {
      triggerGameFeedback("complete")
      recordGameRun(INVARIANT_INSPECTOR.id, mistakes)
    }
    setRoundIndex(index => index + 1)
    setMode("predict")
    setAnswer(null)
    setResolved(false)
    setFeedback(null)
  }

  const restart = () => {
    setRoundIndex(0)
    setMode("predict")
    setAnswer(null)
    setResolved(false)
    setFeedback(null)
    setMistakes(0)
  }

  if (!round) {
    return <ConceptGameShell className="invariant-session" status="Inspection complete" progress={total} total={total}>
      <ConceptGameCompletion
        kicker="Invariant restored through play"
        title="You caught the first illegal state."
        description="An invariant is not a final check. It is a promise every operation must preserve while the structure changes."
        stats={[{ label: "Structures repaired", value: INVARIANT_INSPECTOR.rounds.length }, { label: "Mistakes this run", value: mistakes }]}
        concepts={[{ title: "Path constraints", description: "Bounds can come from distant ancestors." }, { title: "Pointer safety", description: "Save the path before changing an arrow." }, { title: "Boundary objects", description: "Sentinels make edge cases share one rule." }, { title: "Operation repair", description: "Fix the mutation that created the illegal state." }]}
        transferHref="/practice?topic=bst&problem=9"
        transferLabel="Transfer to BST invariants"
        onRestart={restart}
      />
    </ConceptGameShell>
  }

  const options = mode === "predict" ? round.predictionOptions : round.actionOptions
  return <ConceptGameShell className="invariant-session" status={`Round ${roundIndex + 1} of ${INVARIANT_INSPECTOR.rounds.length}`} progress={progress} total={total}>
    <section className="game-act">
      <span className="stage-kicker">{mode === "predict" ? "Predict the break" : "Repair the operation"}</span>
      <h1 className="stage-title">{round.title}</h1>
      <p className="narrative">{round.instruction}</p>
      <div className={`concept-visual inspector-board ${resolved ? "is-repaired" : "is-broken"}`} aria-live="polite">
        <div className="concept-visual-top"><span>Invariant trace</span><b>{resolved ? "LEGAL STATE" : "ILLEGAL STATE"}</b></div>
        <div className="inspector-nodes">{round.nodes.map(node => <span key={node.label} className={`inspector-node ${node.state === "broken" && !resolved ? "is-broken" : "is-safe"}`}>{node.label}</span>)}</div>
        <code>{resolved ? round.repairedRelation : round.relation}</code>
        <small>{resolved ? "The operation preserved the rule." : "The next query would observe this structure."}</small>
      </div>
      <div className="game-choice-box">
        {options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Perform: "}{option.label}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedback.tone}`} aria-live="polite"><b>{feedback.label}</b><p>{feedback.message}</p></div>}
      {resolved && <button className="btn-primary" onClick={next}>{roundIndex + 1 === INVARIANT_INSPECTOR.rounds.length ? "Complete inspection →" : "Inspect the next state →"}</button>}
    </section>
  </ConceptGameShell>
}
