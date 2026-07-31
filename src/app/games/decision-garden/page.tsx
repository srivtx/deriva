"use client"

import { useState } from "react"
import { ConceptGameCompletion, ConceptGameShell } from "@/components/concept-game-shell"
import { DECISION_GARDEN } from "@/games/decision-garden"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

type Mode = "predict" | "plant"
type Tone = "correct" | "wrong"

export default function DecisionGardenPage() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [path, setPath] = useState<number[]>([])
  const [resolved, setResolved] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: Tone; label: string; message: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const round = DECISION_GARDEN.rounds[roundIndex]
  const total = DECISION_GARDEN.rounds.length * 2
  const progress = roundIndex * 2 + (resolved ? 2 : mode === "plant" ? 1 : 0)

  const choose = (value: string) => {
    if (!round || resolved) return
    setAnswer(value)
    const correct = value === (mode === "predict" ? round.predictionCorrect : round.actionCorrect)
    if (!correct) {
      triggerGameFeedback("wrong")
      setMistakes(current => current + 1)
      setFeedback({ tone: "wrong", label: mode === "predict" ? "The branch is risky." : "The garden rejected that move.", message: round.failure })
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("plant")
      setAnswer(null)
      setFeedback({ tone: "correct", label: "Prediction locked.", message: "Now change the path: plant, uproot, or prune exactly that branch." })
    } else {
      setPath(round.nextPath)
      setResolved(true)
      setFeedback({ tone: "correct", label: "The path changed.", message: round.success })
    }
  }

  const next = () => {
    if (!resolved || !round) return
    if (roundIndex + 1 === DECISION_GARDEN.rounds.length) {
      triggerGameFeedback("complete")
      recordGameRun(DECISION_GARDEN.id, mistakes)
    }
    setRoundIndex(index => index + 1)
    setMode("predict")
    setAnswer(null)
    setResolved(false)
    setPath([])
    setFeedback(null)
  }

  const restart = () => {
    setRoundIndex(0)
    setMode("predict")
    setAnswer(null)
    setPath([])
    setResolved(false)
    setFeedback(null)
    setMistakes(0)
  }

  if (!round) return <ConceptGameShell className="garden-session" status="Garden complete" progress={total} total={total}>
    <ConceptGameCompletion
      kicker="Decision tree grown through play"
      title="You learned when to branch and when to cut."
      description="Backtracking is disciplined exploration: choose a value, explore the consequences, restore the shared path, and prune only with proof."
      stats={[{ label: "Branches resolved", value: DECISION_GARDEN.rounds.length }, { label: "Mistakes this run", value: mistakes }]}
      concepts={[{ title: "Decision levels", description: "Each level represents one stable choice." }, { title: "Choose and explore", description: "A path carries a partial answer forward." }, { title: "Unchoose cleanly", description: "Sibling branches reuse a restored path." }, { title: "Prune by proof", description: "Cut only when recovery is impossible." }]}
      transferHref="/practice?topic=backtracking&problem=1"
      transferLabel="Transfer to Backtracking"
      onRestart={restart}
    />
  </ConceptGameShell>

  const options = mode === "predict" ? round.predictionOptions : round.actionOptions
  const shownPath = resolved ? path : round.path
  return <ConceptGameShell className="garden-session" status={`Round ${roundIndex + 1} of ${DECISION_GARDEN.rounds.length}`} progress={progress} total={total}>
    <section className="game-act">
      <span className="stage-kicker">{mode === "predict" ? "Predict the branch" : "Change the garden"}</span>
      <h1 className="stage-title">{round.title}</h1>
      <p className="narrative">{round.instruction}</p>
      <div className={`concept-visual garden-board ${resolved ? "is-settled" : ""}`} aria-live="polite">
        <div className="concept-visual-top"><span>Decision garden</span><b>target = {round.target}</b></div>
        <div className="garden-path"><small>live path</small>{shownPath.length ? shownPath.map((value, index) => <span key={`${value}-${index}`} className="garden-seed">{value}</span>) : <span className="garden-empty">root</span>}</div>
        <div className="garden-frontier"><small>unexplored choices</small>{(resolved ? round.nextRemaining : round.remaining).map(value => <span key={value}>{value}</span>)}</div>
        <code>{shownPath.length ? `${shownPath.join(" + ")} = ${shownPath.reduce((sum, value) => sum + value, 0)}` : "choose → explore → unchoose"}</code>
      </div>
      <div className="game-choice-box">
        {options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Make move: "}{option.label}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedback.tone}`} aria-live="polite"><b>{feedback.label}</b><p>{feedback.message}</p></div>}
      {resolved && <button className="btn-primary" onClick={next}>{roundIndex + 1 === DECISION_GARDEN.rounds.length ? "Complete the garden →" : "Grow the next branch →"}</button>}
    </section>
  </ConceptGameShell>
}
