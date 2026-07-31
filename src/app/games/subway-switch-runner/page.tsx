"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { SUBWAY_SWITCH_RUNNER, type SubwayStationId } from "@/games/subway-switch-runner"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

const SubwaySwitchScene = dynamic(() => import("@/components/subway-switch-scene"), { ssr: false })

type Phase = "blind" | "stamped" | "done"
type Mode = "predict" | "switch"
type FeedbackTone = "correct" | "wrong"

export default function SubwaySwitchRunnerPage() {
  const [phase, setPhase] = useState<Phase>("blind")
  const [mode, setMode] = useState<Mode>("predict")
  const [station, setStation] = useState<SubwayStationId>("HUB")
  const [visited, setVisited] = useState<SubwayStationId[]>(["HUB"])
  const [answer, setAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null)
  const [feedbackLabel, setFeedbackLabel] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [motionKey, setMotionKey] = useState(0)
  const [steps, setSteps] = useState(0)

  const current = SUBWAY_SWITCH_RUNNER.stations[station]
  const memoryUnlocked = phase === "stamped"

  const showFeedback = (tone: FeedbackTone, label: string, message: string) => {
    setFeedbackTone(tone)
    setFeedbackLabel(label)
    setFeedback(message)
  }

  const resetStampedRun = () => {
    setPhase("stamped")
    setMode("predict")
    setStation("HUB")
    setVisited(["HUB"])
    setAnswer(null)
    setMotionKey(value => value + 1)
    setSteps(3)
  }

  const selectChoice = (choiceId: string) => {
    const choice = current.choices.find(item => item.id === choiceId)
    if (!choice) return
    setAnswer(choiceId)

    if (!choice.safe) {
      triggerGameFeedback("wrong")
      setMistakes(value => value + 1)
      if (choice.outcome === "cycle") {
        if (!memoryUnlocked) {
          showFeedback("wrong", "The route looped.", `You returned through ${choice.target}. A graph can revisit a station forever unless the search remembers it.`)
          resetStampedRun()
        } else {
          showFeedback("wrong", "Visited station blocked.", `${choice.target} already has a stamp. Skip it instead of doing the same work again.`)
          setAnswer(null)
        }
      } else {
        showFeedback("wrong", "Dead platform.", "This branch cannot reach the terminal. Back up and try another switch.")
        setAnswer(null)
      }
      return
    }

    if (mode === "predict") {
      triggerGameFeedback("correct")
      setMode("switch")
      setAnswer(null)
      showFeedback("correct", "Prediction accepted.", "Now switch onto that line and make the station change.")
      return
    }

    triggerGameFeedback("correct")
    setMotionKey(value => value + 1)
    setSteps(value => value + 1)
    setAnswer(null)
    setMode("predict")
    if (choice.outcome === "finish") {
      if (memoryUnlocked) {
        triggerGameFeedback("complete")
        setPhase("done")
        recordGameRun(SUBWAY_SWITCH_RUNNER.id, mistakes)
      } else {
        showFeedback("correct", "Lucky route.", "You reached the terminal, but you did not prove that your search can avoid loops. Replay with station stamps.")
        resetStampedRun()
      }
      return
    }
    const next = choice.target as SubwayStationId
    setStation(next)
    setVisited(items => items.includes(next) ? items : [...items, next])
    showFeedback("correct", "Switch changed.", `You reached ${SUBWAY_SWITCH_RUNNER.stations[next].title}. Predict the next track.`)
  }

  const restart = () => {
    setPhase("blind")
    setMode("predict")
    setStation("HUB")
    setVisited(["HUB"])
    setAnswer(null)
    setFeedback(null)
    setFeedbackTone(null)
    setFeedbackLabel(null)
    setMistakes(0)
    setMotionKey(0)
    setSteps(0)
  }

  if (phase === "done") {
    return <main className="game-session subway-session">
      <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Run complete</span><GameSoundToggle /></div>
      <div className="game-meter"><span style={{ width: "100%" }} /></div>
      <section className="game-finished">
        <span className="discovery-kicker">✦ Cycle detection unlocked through play</span>
        <h1 className="stage-title">You stopped the subway loop.</h1>
        <p className="narrative">The first run got trapped because the network had no memory. The second run stamped each station and refused to explore the same state twice.</p>
        <div className="game-result"><span>Stations stamped</span><b>{visited.length}</b><span>Mistakes this run</span><b>{mistakes}</b></div>
        <div className="concept-map">
          <span>What you just trained</span>
          <div><b>01</b><strong>Visited set</strong><small>Remember the states already explored.</small></div>
          <div><b>02</b><strong>Cycle</strong><small>A repeated station means the path can loop forever.</small></div>
          <div><b>03</b><strong>Search boundary</strong><small>Do not spend work outside the unexplored frontier.</small></div>
          <div><b>04</b><strong>Transfer</strong><small>The same protection appears in DFS, BFS, and grid problems.</small></div>
        </div>
        <div className="game-actions"><button className="btn-primary" onClick={restart}>Run again →</button><Link href="/topic/graphs" className="btn-ghost as-link">Transfer to Graphs →</Link></div>
      </section>
    </main>
  }

  return <main className="game-session subway-session">
    <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>{memoryUnlocked ? "Stamped run" : "First run"}</span><GameSoundToggle /></div>
    <div className="game-meter"><span style={{ width: `${Math.min(100, (steps / 6) * 100)}%` }} /></div>
    <section className="game-act">
      <span className="stage-kicker">{memoryUnlocked ? mode === "predict" ? "Predict with memory" : "Switch without looping" : mode === "predict" ? "Predict the switch" : "Run the line"}</span>
      <h1 className="stage-title">{current.prompt}</h1>
      <p className="narrative">{memoryUnlocked ? "Every station with a green stamp is already explored. Do not send the runner back into finished work." : "The subway has no map of where you have been. Notice what happens when a line sends you back."}</p>
      <SubwaySwitchScene station={station} choices={current.choices} visited={visited} memoryUnlocked={memoryUnlocked} motionKey={motionKey} onSelectChoice={selectChoice} />
      <div className="subway-station-status"><span>Current station</span><b>{current.title}</b><span>{memoryUnlocked ? "Stamped" : "Memory"}</span><b>{memoryUnlocked ? visited.join(" · ") : "none"}</b></div>
      <div className="game-choice-box subway-choice-box">
        {current.choices.map(choice => {
          const blocked = memoryUnlocked && visited.includes(choice.target as SubwayStationId)
          return <button key={choice.id} className={`game-choice ${answer === choice.id ? "selected" : ""} ${blocked ? "blocked" : ""}`} onClick={() => selectChoice(choice.id)}>{mode === "predict" ? "It will take " : "Switch to "}<b>{choice.label}</b>{blocked && <small>visited</small>}</button>
        })}
      </div>
      {feedback && <div className={`game-feedback ${feedbackTone || "correct"}`} aria-live="polite"><b>{feedbackLabel}</b><p>{feedback}</p></div>}
    </section>
  </main>
}
