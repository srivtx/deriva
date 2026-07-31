"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { ALGORITHM_RELAY } from "@/games/relay"
import { recordGameRun } from "@/persistence/game-progress"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"

const PatternRelayScene = dynamic(() => import("@/components/pattern-relay-scene"), { ssr: false })

type Mode = "predict" | "act"

export default function AlgorithmRelayPage() {
  const [room, setRoom] = useState(0)
  const [mode, setMode] = useState<Mode>("predict")
  const [answer, setAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const current = ALGORITHM_RELAY.rooms[room]
  const done = room >= ALGORITHM_RELAY.rooms.length
  const correct = answer === current?.correct

  const choose = (value: string) => {
    if (submitted) return
    setAnswer(value)
    const isCorrect = value === current.correct
    if (!isCorrect) {
      triggerGameFeedback("wrong")
      setMistakes(count => count + 1)
      setSubmitted(true)
      return
    }
    triggerGameFeedback("correct")
    if (mode === "predict") {
      setMode("act")
      setAnswer(null)
      return
    }
    setSubmitted(true)
  }
  const next = () => {
    if (!correct) { setAnswer(null); setSubmitted(false); setMode("predict"); return }
    if (room + 1 === ALGORITHM_RELAY.rooms.length) { triggerGameFeedback("complete"); recordGameRun(ALGORITHM_RELAY.id, mistakes); setRoom(ALGORITHM_RELAY.rooms.length); return }
    setRoom(value => value + 1); setAnswer(null); setSubmitted(false); setMode("predict")
  }

  if (done) return <main className="game-session relay-session"><div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Relay complete</span><GameSoundToggle /></div><PatternRelayScene progress={5} /><section className="game-finished"><span className="discovery-kicker">✦ Five patterns composed</span><h1 className="stage-title">You carried one solution across the map.</h1><p className="narrative">Representation, invariants, frontiers, state, and proof are not isolated tricks. They are decisions inside one algorithm.</p><div className="relay-summary">{ALGORITHM_RELAY.rooms.map(item => <span key={item.concept}>✓ {item.concept}</span>)}</div><div className="game-result"><span>Mistakes this run</span><b>{mistakes}</b><span>Next move</span><b>Transfer one room into a real problem</b></div><Link href="/expedition" className="btn-primary as-link">Continue the Expedition →</Link></section></main>

  return <main className="game-session relay-session"><div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Room {room + 1} · {mode === "predict" ? "Predict" : "Carry"}</span><GameSoundToggle /></div><div className="game-meter"><span style={{ width: `${((room + (mode === "act" ? .5 : 0)) / ALGORITHM_RELAY.rooms.length) * 100}%` }} /></div><PatternRelayScene progress={room + (mode === "act" ? .5 : 0)} /><section className="game-act"><span className="stage-kicker">{mode === "predict" ? "Predict the relay" : "Carry the decision"} · {current.verb}</span><h1 className="stage-title">{current.name}</h1><p className="narrative">{mode === "predict" ? current.prompt : "The prediction is locked. Now perform the same decision and move the solution into the next room."}</p><div className="game-choice-box">{current.options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{mode === "predict" ? "I predict: " : "Carry: "}{option.label}</button>)}</div>{(submitted || mode === "act") && <div className={`game-feedback ${submitted && !correct ? "wrong" : "correct"}`}><b>{submitted ? correct ? "The relay moved forward." : "The relay is blocked." : "Prediction accepted."}</b><p>{submitted ? correct ? current.success : current.miss : "Now perform the decision you just predicted."}</p></div>}{submitted && <button className="btn-primary" onClick={next}>{correct ? room + 1 === ALGORITHM_RELAY.rooms.length ? "Complete the relay →" : "Enter the next room →" : "Repair your decision →"}</button>}</section></main>
}
