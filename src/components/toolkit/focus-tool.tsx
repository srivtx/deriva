"use client"

import { useEffect, useRef, useState } from "react"

const FOCUS_MS = 25 * 60_000
const BREAK_MS = 5 * 60_000

export default function FocusTool() {
  const [mode, setMode] = useState<"focus" | "break">("focus")
  const [remaining, setRemaining] = useState(FOCUS_MS)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const deadlineRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    deadlineRef.current = Date.now() + remaining
    const timer = setInterval(() => {
      const left = deadlineRef.current - Date.now()
      if (left <= 0) {
        clearInterval(timer)
        if ("vibrate" in navigator) navigator.vibrate([30, 60, 30])
        const nextMode = mode === "focus" ? "break" : "focus"
        setMode(nextMode)
        setRemaining(nextMode === "focus" ? FOCUS_MS : BREAK_MS)
        if (mode === "focus") setSessions(count => count + 1)
        setRunning(false)
        return
      }
      setRemaining(left)
    }, 250)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const toggle = () => setRunning(value => !value)

  const reset = () => {
    setRunning(false)
    setRemaining(mode === "focus" ? FOCUS_MS : BREAK_MS)
  }

  const switchMode = (next: "focus" | "break") => {
    setRunning(false)
    setMode(next)
    setRemaining(next === "focus" ? FOCUS_MS : BREAK_MS)
  }

  const total = mode === "focus" ? FOCUS_MS : BREAK_MS
  const progress = 1 - remaining / total
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const R = 86
  const C = 2 * Math.PI * R

  return (
    <div className="tool-body tool-center">
      <div className="segmented" role="group" aria-label="Timer mode">
        <button type="button" className={mode === "focus" ? "selected" : ""} onClick={() => switchMode("focus")}>Focus 25</button>
        <button type="button" className={mode === "break" ? "selected" : ""} onClick={() => switchMode("break")}>Break 5</button>
      </div>
      <div className="focus-ring" role="timer" aria-label={`${mode} timer`}>
        <svg viewBox="0 0 200 200" width="220" height="220" aria-hidden="true">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
          <circle
            cx="100" cy="100" r={R} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset .3s linear" }}
          />
        </svg>
        <div className="focus-time">
          <strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
          <small>{mode === "focus" ? "deep work" : "recover"}</small>
        </div>
      </div>
      <div className="tool-input-row tool-center-row">
        <button type="button" className="super-primary" onClick={toggle}>{running ? "Pause" : remaining === total ? "Start" : "Resume"}</button>
        <button type="button" className="super-ghost" onClick={reset}>Reset</button>
      </div>
      <p className="playground-elapsed">{sessions} focus session{sessions === 1 ? "" : "s"} completed today{running ? " — the clock keeps running if you leave this tab." : "."}</p>
    </div>
  )
}
