"use client"

import Link from "next/link"
import { useState } from "react"
import { ALGORITHM_RELAY } from "@/games/relay"
import { recordGameRun } from "@/persistence/game-progress"
import PatternRelayScene from "@/components/pattern-relay-scene"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"

export default function AlgorithmRelayPage() {
  const [room, setRoom] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const current = ALGORITHM_RELAY.rooms[room]
  const done = room >= ALGORITHM_RELAY.rooms.length
  const correct = answer === current?.correct

  const choose = (value: string) => { if (!submitted) { setAnswer(value); setSubmitted(true); const isCorrect = value === current.correct; triggerGameFeedback(isCorrect ? "correct" : "wrong"); if (!isCorrect) setMistakes(value ? mistakes + 1 : mistakes) } }
  const next = () => {
    if (!correct) { setAnswer(null); setSubmitted(false); return }
    if (room + 1 === ALGORITHM_RELAY.rooms.length) { triggerGameFeedback("complete"); recordGameRun(ALGORITHM_RELAY.id, mistakes); setRoom(ALGORITHM_RELAY.rooms.length); return }
    setRoom(value => value + 1); setAnswer(null); setSubmitted(false)
  }

  if (done) return <main className="game-session relay-session"><div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Relay complete</span><GameSoundToggle /></div><PatternRelayScene progress={5} /><section className="game-finished"><span className="discovery-kicker">✦ Five patterns composed</span><h1 className="stage-title">You carried one solution across the map.</h1><p className="narrative">Representation, invariants, frontiers, state, and proof are not isolated tricks. They are decisions inside one algorithm.</p><div className="relay-summary">{ALGORITHM_RELAY.rooms.map(item => <span key={item.concept}>✓ {item.concept}</span>)}</div><div className="game-result"><span>Mistakes this run</span><b>{mistakes}</b><span>Next move</span><b>Transfer one room into a real problem</b></div><Link href="/expedition" className="btn-primary as-link">Continue the Expedition →</Link></section></main>

  return <main className="game-session relay-session"><div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Room {room + 1} of {ALGORITHM_RELAY.rooms.length}</span><GameSoundToggle /></div><div className="game-meter"><span style={{ width: `${(room / ALGORITHM_RELAY.rooms.length) * 100}%` }} /></div><PatternRelayScene progress={room} /><section className="game-act"><span className="stage-kicker">{current.verb} · {current.concept}</span><h1 className="stage-title">{current.name}</h1><p className="narrative">{current.prompt}</p><div className="game-choice-box">{current.options.map(option => <button key={option.value} className={`game-choice ${answer === option.value ? "selected" : ""}`} onClick={() => choose(option.value)}>{option.label}</button>)}</div>{submitted && <div className={`game-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "The relay moved forward." : "The relay is blocked."}</b><p>{correct ? current.success : current.miss}</p></div>}{submitted && <button className="btn-primary" onClick={next}>{correct ? room + 1 === ALGORITHM_RELAY.rooms.length ? "Complete the relay →" : "Enter the next room →" : "Repair your decision →"}</button>}</section></main>
}
