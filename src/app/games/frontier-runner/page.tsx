"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useState } from "react"
import { FRONTIER_RUNNER, type FrontierStep } from "@/games/frontier-runner"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"
import { recordGameRun } from "@/persistence/game-progress"

const FrontierRunnerScene = dynamic(() => import("@/components/frontier-runner-scene"), { ssr: false })

type Phase = "bfs" | "dijkstra" | "done"
type Mode = "predict" | "ride"
type FeedbackTone = "correct" | "wrong"

function formatDistance(distance: number | undefined) {
  return distance === undefined || !Number.isFinite(distance) ? "?" : String(distance)
}

export default function FrontierRunnerPage() {
  const [phase, setPhase] = useState<Phase>("bfs")
  const [mode, setMode] = useState<Mode>("predict")
  const [bfsStep, setBfsStep] = useState(0)
  const [dijkstraStep, setDijkstraStep] = useState(0)
  const [bikeNode, setBikeNode] = useState("A")
  const [answer, setAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackLabel, setFeedbackLabel] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [motionKey, setMotionKey] = useState(0)

  const step: FrontierStep | null = phase === "bfs" ? FRONTIER_RUNNER.bfs.steps[bfsStep] : phase === "dijkstra" ? FRONTIER_RUNNER.dijkstra.steps[dijkstraStep] : null
  const graph = phase === "dijkstra" || phase === "done" ? FRONTIER_RUNNER.dijkstra : FRONTIER_RUNNER.bfs
  const progress = phase === "bfs" ? bfsStep : phase === "dijkstra" ? FRONTIER_RUNNER.bfs.steps.length + dijkstraStep : FRONTIER_RUNNER.bfs.steps.length + FRONTIER_RUNNER.dijkstra.steps.length
  const total = FRONTIER_RUNNER.bfs.steps.length + FRONTIER_RUNNER.dijkstra.steps.length

  const updateFeedback = (tone: FeedbackTone, message: string, label: string) => {
    setFeedbackTone(tone)
    setFeedback(message)
    setFeedbackLabel(label)
  }

  const selectNode = (id: string) => {
    if (!step) return
    setAnswer(id)
    if (id !== step.correct) {
      triggerGameFeedback("wrong")
      setMistakes(value => value + 1)
      updateFeedback("wrong", phase === "bfs" ? "The queue has an order. Finish the nearest layer before jumping ahead." : "The frontier is ordered by total cost, not by arrival or label.", "The route is not safe yet.")
      return
    }
    if (mode === "predict") {
      triggerGameFeedback("correct")
      setMode("ride")
      setAnswer(null)
      updateFeedback("correct", "Prediction locked. Now ride that node and change the frontier.", "Prediction accepted.")
      return
    }

    triggerGameFeedback("correct")
    setMotionKey(value => value + 1)
    setBikeNode(id)
    updateFeedback("correct", step.explanation, "Frontier changed.")
    setAnswer(null)
    setMode("predict")

    if (phase === "bfs") {
      if (bfsStep + 1 >= FRONTIER_RUNNER.bfs.steps.length) {
        setPhase("dijkstra")
        setBikeNode("S")
        updateFeedback("correct", "BFS complete. Now the roads have costs, so layer order is no longer enough.", "New rule unlocked.")
      } else {
        setBfsStep(value => value + 1)
      }
    } else if (dijkstraStep + 1 >= FRONTIER_RUNNER.dijkstra.steps.length) {
      triggerGameFeedback("complete")
      setPhase("done")
      recordGameRun(FRONTIER_RUNNER.id, mistakes)
    } else {
      setDijkstraStep(value => value + 1)
    }
  }

  const restart = () => {
    setPhase("bfs")
    setMode("predict")
    setBfsStep(0)
    setDijkstraStep(0)
    setBikeNode("A")
    setAnswer(null)
    setFeedback(null)
    setFeedbackLabel(null)
    setFeedbackTone(null)
    setMistakes(0)
    setMotionKey(0)
  }

  if (phase === "done") {
    return <main className="game-session frontier-session">
      <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>Route complete</span><GameSoundToggle /></div>
      <div className="game-meter"><span style={{ width: "100%" }} /></div>
      <section className="game-finished">
        <span className="discovery-kicker">✦ Frontier unlocked through play</span>
        <h1 className="stage-title">You learned when the next move is safe.</h1>
        <p className="narrative">BFS used layers. Dijkstra used cost. The graph stayed recognizable, but the frontier's meaning changed when roads gained weights.</p>
        <div className="game-result"><span>Nodes settled</span><b>{total}</b><span>Mistakes this run</span><b>{mistakes}</b></div>
        <div className="concept-map">
          <span>What you just trained</span>
          <div><b>01</b><strong>Frontier</strong><small>The boundary between known and unknown work.</small></div>
          <div><b>02</b><strong>Layer order</strong><small>BFS settles unweighted distance one layer at a time.</small></div>
          <div><b>03</b><strong>Relaxation</strong><small>New evidence can improve a route already waiting.</small></div>
          <div><b>04</b><strong>Cost order</strong><small>Dijkstra settles the cheapest known total route.</small></div>
        </div>
        <div className="game-actions"><button className="btn-primary" onClick={restart}>Ride again →</button><Link href="/topic/graphs" className="btn-ghost as-link">Transfer to Graphs →</Link></div>
      </section>
    </main>
  }

  if (!step) return null
  const isBfs = phase === "bfs"
  return <main className="game-session frontier-session">
    <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>{isBfs ? "Layer route" : "Weighted route"}</span><GameSoundToggle /></div>
    <div className="game-meter"><span style={{ width: `${(progress / total) * 100}%` }} /></div>
    <section className="game-act">
      <span className="stage-kicker">{isBfs ? mode === "predict" ? "Predict the layer" : "Ride the queue" : mode === "predict" ? "Predict the cost" : "Ride the cheapest"}</span>
      <h1 className="stage-title">{step.prompt}</h1>
      <p className="narrative">{step.instruction}</p>
      <FrontierRunnerScene mode={isBfs ? "bfs" : "dijkstra"} nodes={graph.nodes} edges={graph.edges} visited={step.visited} frontier={step.frontier} distances={step.distances} bikeNode={bikeNode} motionKey={motionKey} onSelectNode={selectNode} />
      <div className="frontier-route-status"><span>{isBfs ? "Distance" : "Known cost"}</span><b>{isBfs ? `${step.distances[step.correct]} edges` : `${formatDistance(step.distances[step.correct])} fuel`}</b><span>Frontier</span><b>{step.frontier.join(" · ")}</b></div>
      <div className="game-choice-box frontier-choice-box">
        {step.choices.map(id => <button key={id} className={`game-choice ${answer === id ? "selected" : ""}`} onClick={() => selectNode(id)}>{mode === "predict" ? "It will settle " : "Ride to "}<b>{id}</b>{!isBfs && <small>known cost {formatDistance(step.distances[id])}</small>}</button>)}
      </div>
      {feedback && <div className={`game-feedback ${feedbackTone || "correct"}`} aria-live="polite"><b>{feedbackLabel}</b><p>{feedback}</p></div>}
    </section>
  </main>
}
