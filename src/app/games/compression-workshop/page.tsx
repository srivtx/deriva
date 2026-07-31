"use client"

import { useState } from "react"
import { ConceptGameCompletion, ConceptGameShell } from "@/components/concept-game-shell"
import { COMPRESSION_WORKSHOP } from "@/games/compression-workshop"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

type Mode = "predict" | "operate"
type Tone = "correct" | "wrong"

export default function CompressionWorkshopPage() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [compressed, setCompressed] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: Tone; label: string; message: string } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const round = COMPRESSION_WORKSHOP.rounds[roundIndex]
  const total = COMPRESSION_WORKSHOP.rounds.length * 2
  const progress = roundIndex * 2 + (compressed ? 2 : mode === "operate" ? 1 : 0)

  const choose = (value: string) => {
    if (!round || compressed) return
    setAnswer(value)
    const correct = value === (mode === "predict" ? round.predictionCorrect : round.actionCorrect)
    if (!correct) {
      triggerGameFeedback("wrong")
      setMistakes(current => current + 1)
      setFeedback({ tone: "wrong", label: mode === "predict" ? "The frontier would stay noisy." : "That operation did not compress the work.", message: round.failure })
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("operate")
      setAnswer(null)
      setFeedback({ tone: "correct", label: "Compression plan locked.", message: "Now perform the operation that stores only useful future work." })
    } else {
      setCompressed(true)
      setFeedback({ tone: "correct", label: "Useful frontier stored.", message: round.success })
    }
  }

  const next = () => {
    if (!compressed || !round) return
    if (roundIndex + 1 === COMPRESSION_WORKSHOP.rounds.length) {
      triggerGameFeedback("complete")
      recordGameRun(COMPRESSION_WORKSHOP.id, mistakes)
    }
    setRoundIndex(index => index + 1)
    setMode("predict")
    setAnswer(null)
    setCompressed(false)
    setFeedback(null)
  }

  const restart = () => {
    setRoundIndex(0)
    setMode("predict")
    setAnswer(null)
    setCompressed(false)
    setFeedback(null)
    setMistakes(0)
  }

  if (!round) return <ConceptGameShell className="compression-session" status="Workshop complete" progress={total} total={total}>
    <ConceptGameCompletion
      kicker="Useful structure compressed through play"
      title="You stopped storing work the future cannot use."
      description="A data structure is a compression device: it preserves exactly the relationships the next operation asks for and discards the rest."
      stats={[{ label: "Structures tuned", value: COMPRESSION_WORKSHOP.rounds.length }, { label: "Mistakes this run", value: mistakes }]}
      concepts={[{ title: "Shared prefixes", description: "Store overlap once in a path." }, { title: "Useful extreme", description: "Keep the queried priority at a boundary." }, { title: "Membership masks", description: "One bit answers one yes/no question." }, { title: "Elimination", description: "Discard candidates that cannot change the answer." }]}
      transferHref="/practice?topic=heap&problem=9"
      transferLabel="Transfer to Heap structures"
      onRestart={restart}
    />
  </ConceptGameShell>

  const options = mode === "predict" ? round.predictionOptions : round.actionOptions
  const rows = compressed ? round.after : round.before
  return <ConceptGameShell className="compression-session" status={`Round ${roundIndex + 1} of ${COMPRESSION_WORKSHOP.rounds.length}`} progress={progress} total={total}>
    <section className="game-act">
      <span className="stage-kicker">{mode === "predict" ? "Predict the compression" : "Operate the structure"}</span>
      <h1 className="stage-title">{round.title}</h1>
      <p className="narrative">{round.instruction}</p>
      <div className={`concept-visual compression-board compression-${round.kind} ${compressed ? "is-compressed" : ""}`} aria-live="polite">
        <div className="concept-visual-top"><span>{round.kind} workshop</span><b>{compressed ? "REMEMBERED" : "REPEATED WORK"}</b></div>
        <div className="compression-rows">{rows.map((row, index) => <code key={`${row}-${index}`}>{row}</code>)}</div>
        <small>{compressed ? "The representation changed; the next query has less work." : "Repeated work is visible before the structure earns its shortcut."}</small>
      </div>
      <div className="game-choice-box">
        {options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Operate: "}{option.label}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedback.tone}`} aria-live="polite"><b>{feedback.label}</b><p>{feedback.message}</p></div>}
      {compressed && <button className="btn-primary" onClick={next}>{roundIndex + 1 === COMPRESSION_WORKSHOP.rounds.length ? "Close the workshop →" : "Tune the next structure →"}</button>}
    </section>
  </ConceptGameShell>
}
