"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { STACK_CLIMBER } from "@/games/stack-climber"
import { loadGameProgress, recordGameRun } from "@/persistence/game-progress"
import StackClimberScene from "@/components/stack-climber-scene"
import PatternGame from "@/components/pattern-game"
import GameSoundToggle from "@/components/game-sound-toggle"
import { triggerGameFeedback } from "@/games/feedback"

type Phase = "contract" | "descend" | "base" | "return" | "done"
type DecisionMode = "predict" | "act"
type FeedbackTone = "correct" | "wrong"

export default function StackClimberPage() {
  const params = useParams()
  const [phase, setPhase] = useState<Phase>("contract")
  const [mode, setMode] = useState<DecisionMode>("predict")
  const [current, setCurrent] = useState(STACK_CLIMBER.start)
  const [stack, setStack] = useState<number[]>([STACK_CLIMBER.start])
  const [returnN, setReturnN] = useState(2)
  const [answer, setAnswer] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [playedBefore, setPlayedBefore] = useState(false)
  const [motion, setMotion] = useState<"descend" | "return" | "base" | null>(null)
  const [motionKey, setMotionKey] = useState(0)

  useEffect(() => {
    if (params.game === STACK_CLIMBER.id) setPlayedBefore(!!loadGameProgress(STACK_CLIMBER.id))
  }, [params.game])

  /*
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".stack-card", { x: 70, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .38, stagger: .07, ease: "power3.out", overwrite: "auto" })
      gsap.fromTo(".base-marker", { scale: .7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .45, ease: "back.out(1.7)", overwrite: "auto" })
      gsap.fromTo(".return-pulse", { y: 18, scale: .7, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .5, ease: "back.out(1.7)", overwrite: "auto" })
    })
    return () => media.revert()
  }, { scope: board, dependencies: [phase, stack.length, returnN, feedback] })
  */

  if (params.game !== STACK_CLIMBER.id) {
    return <PatternGame gameId={params.game as string} />
  }

  const chooseContract = (value: string) => {
    setAnswer(value)
    if (value === "sum") {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setFeedback("Good contract. Every frame promises one sum, even before we know how it gets there.")
      setPhase("descend")
      setMode("predict")
      setAnswer(null)
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(mistakes + 1)
      setFeedback("The function should promise a value, not a mechanism or a picture of the stack.")
    }
  }

  const predictNext = (value: number) => {
    setAnswer(String(value))
    if (value === current - 1) {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setFeedback("Prediction locked. Now perform the smaller call.")
      setMode("act")
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(mistakes + 1)
      setFeedback("A recursive call should move toward the base case, not stay put or grow.")
    }
  }

  const chooseNext = (value: number) => {
    setAnswer(String(value))
    if (value === current - 1) {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setMotion("descend")
      setMotionKey(key => key + 1)
      setFeedback("The problem got smaller. Keep going.")
       if (current - 1 === 1) {
         setCurrent(1)
         setStack(items => [...items, 1])
         setPhase("base")
         setMode("predict")
       }
       else {
         setCurrent(current - 1)
         setStack(items => [...items, current - 1])
         setMode("predict")
       }
       setAnswer(null)
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(value === current ? mistakes + 1 : mistakes + 1)
      setFeedback("That call does not move toward an answer. Choose the smaller copy.")
    }
  }

  const predictBase = (value: string) => {
    setAnswer(value)
    if (value === "stop") {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setFeedback("Prediction locked. Now choose the stopping rule.")
      setMode("act")
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(mistakes + 1)
      setFeedback("The smallest problem needs a definite answer, not an endless chain.")
    }
  }

  const chooseBase = (value: string) => {
    setAnswer(value)
    if (value === "stop") {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setMotion("base")
      setMotionKey(key => key + 1)
      setFeedback("Base case found. Now climb: each frame is waiting for one returned value.")
      setPhase("return")
      setMode("predict")
      setAnswer(null)
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(value ? mistakes + 1 : mistakes)
      setFeedback("A recursive chain needs a definite floor, not a feeling.")
    }
  }

  const predictReturn = (value: number) => {
    setAnswer(String(value))
    const expected = returnN + (returnN - 1)
    if (value === expected) {
      triggerGameFeedback("correct")
      setFeedbackTone("correct")
      setFeedback("Prediction locked. Now send that answer to the waiting frame.")
      setMode("act")
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(mistakes + 1)
      setFeedback("Combine the current number with the answer from the smaller frame.")
    }
  }

  const chooseReturn = (value: number) => {
    setAnswer(String(value))
    const expected = returnN + (returnN - 1)
    if (value === expected) {
      triggerGameFeedback(returnN === STACK_CLIMBER.start ? "complete" : "correct")
      setFeedbackTone("correct")
      setMotion("return")
      setMotionKey(key => key + 1)
      setFeedback(`sum_to(${returnN}) returns ${expected}. One answer climbed back up.`)
      if (returnN === STACK_CLIMBER.start) {
        setPhase("done")
        recordGameRun(STACK_CLIMBER.id, mistakes)
      } else {
        setReturnN(value => value + 1)
        setStack(items => items.slice(0, -1))
        setMode("predict")
        setAnswer(null)
      }
    } else {
      triggerGameFeedback("wrong")
      setFeedbackTone("wrong")
      setMistakes(mistakes + 1)
      setFeedback("Use the current number plus the answer from the smaller frame.")
    }
  }

  const restart = () => {
    setPhase("contract")
    setMode("predict")
    setCurrent(STACK_CLIMBER.start)
    setStack([STACK_CLIMBER.start])
    setReturnN(2)
    setAnswer(null)
    setFeedback(null)
    setFeedbackTone(null)
    setMistakes(0)
    setMotion(null)
    setMotionKey(0)
  }

  const progress = phase === "contract" ? 0 : phase === "descend" ? stack.length - 1 : phase === "base" ? STACK_CLIMBER.start - 1 : phase === "return" ? STACK_CLIMBER.start + returnN - 2 : 2 * STACK_CLIMBER.start
  const total = STACK_CLIMBER.start * 2

  return (
    <main className="game-session">
       <div className="game-session-top"><Link href="/games" className="expedition-back">← Game Mode</Link><span>{playedBefore ? "Replay" : "First run"}</span><GameSoundToggle /></div>
      <div className="game-meter"><span style={{ width: `${Math.min(100, (progress / total) * 100)}%` }} /></div>

      {phase === "done" ? (
        <section className="game-finished">
          <span className="discovery-kicker">✦ Concept unlocked through play</span>
          <h1 className="stage-title">You climbed the stack.</h1>
          <p className="narrative">You descended by making the problem smaller, found the floor, and returned answers upward. That shape is recursion before it is syntax.</p>
          <div className="game-result"><span>Mistakes this run</span><b>{mistakes}</b><span>Next recognition</span><b>Look for this shape in a tree.</b></div>
          <div className="concept-map">
            <span>What you just trained</span>
            <div><b>01</b><strong>Contract</strong><small>What does the function promise?</small></div>
            <div><b>02</b><strong>Descent</strong><small>Every call moves toward a smaller problem.</small></div>
            <div><b>03</b><strong>Base case</strong><small>One state answers itself.</small></div>
            <div><b>04</b><strong>Call stack</strong><small>Frames wait instead of re-solving.</small></div>
            <div><b>05</b><strong>Return flow</strong><small>Answers climb back and combine.</small></div>
            <div><b>06</b><strong>Transfer</strong><small>The same shape appears in trees.</small></div>
          </div>
          <div className="game-actions"><button className="btn-primary" onClick={restart}>Play again →</button><Link href="/expedition/recursive-leap-of-faith" className="btn-ghost as-link">Take it to the Expedition</Link></div>
        </section>
      ) : (
        <section className="game-act">
           <span className="stage-kicker">{phase === "contract" ? "Make the contract" : phase === "descend" ? mode === "predict" ? "Predict the descent" : "Descend" : phase === "base" ? mode === "predict" ? "Predict the floor" : "Find the floor" : mode === "predict" ? "Predict the return" : "Climb"}</span>
           <h1 className="stage-title">{phase === "contract" ? "What does sum_to(n) promise?" : phase === "descend" ? `${mode === "predict" ? "Predict: " : "What should "}sum_to(${current}) call?` : phase === "base" ? `${mode === "predict" ? "Predict: " : "The call stack is waiting."}${mode === "predict" ? "what happens at n = 1?" : ""}` : `${mode === "predict" ? "Predict: " : "What returns from "}sum_to(${returnN})?`}</h1>
           <p className="narrative">{phase === "contract" ? "Before the first call moves, define the value every frame is responsible for returning." : phase === "descend" ? mode === "predict" ? "Think first. Which call moves one step closer to the base case?" : "Now make the call you predicted and watch a new frame appear." : phase === "base" ? mode === "predict" ? "Think first. Can the smallest problem answer itself?" : "One frame can answer itself. Choose the stopping rule." : mode === "predict" ? "Think first. Combine the current number with the answer waiting below." : "Now send the smaller answer back to the waiting frame."}</p>

          <StackClimberScene depth={stack.length} phase={phase} motionKey={motionKey} />
          <div className="stack-visual" aria-label={`Call stack with ${stack.length} frames`}>
            {motion && <span key={motionKey} className={`game-motion ${motion}`} aria-hidden="true" />}
            {[...stack].reverse().map((n, index) => <div className={`stack-card ${index === 0 ? "active" : ""}`} key={`${n}-${index}-${motionKey}`}><code>sum_to({n})</code><span>{index === 0 && phase !== "return" ? "current" : index === 0 ? "answer needed" : "waiting"}</span></div>)}
            {phase === "base" && <div className="base-marker">Base case lives here</div>}
            {phase === "return" && <div className="stack-return-lane"><span className="stack-return-dot" /> answers are climbing upward</div>}
          </div>

           <div className="game-choice-box">
             {phase === "contract" && STACK_CLIMBER.contractChoices.map(choice => <button key={choice.value} className={`game-choice ${answer === choice.value ? "selected" : ""}`} onClick={() => chooseContract(choice.value)}>{choice.label}</button>)}
             {phase === "descend" && STACK_CLIMBER.nextChoices(current).map(value => <button key={value} className={`game-choice ${answer === String(value) ? "selected" : ""}`} onClick={() => mode === "predict" ? predictNext(value) : chooseNext(value)}>{mode === "predict" ? "It will call " : "Call "}<b>sum_to({value})</b></button>)}
             {phase === "base" && STACK_CLIMBER.baseChoices.map(choice => <button key={choice.value} className={`game-choice ${answer === choice.value ? "selected" : ""}`} onClick={() => mode === "predict" ? predictBase(choice.value) : chooseBase(choice.value)}>{mode === "predict" ? "It will: " : "Choose: "}{choice.label}</button>)}
             {phase === "return" && STACK_CLIMBER.returnChoices(returnN).map(value => <button key={value} className={`game-choice ${answer === String(value) ? "selected" : ""}`} onClick={() => mode === "predict" ? predictReturn(value) : chooseReturn(value)}>{mode === "predict" ? "It will return " : "Return "}<b>{value}</b></button>)}
           </div>

           {feedback && <div className={`game-feedback ${feedbackTone || "correct"}`} aria-live="polite"><span className={phase === "return" ? "return-pulse" : ""}>{feedback}</span></div>}
        </section>
      )}
    </main>
  )
}
