"use client"

import { useEffect, useState } from "react"
import { BREAK_MS, defaultFocusState, focusRemainingMs, FOCUS_MS, loadFocusState, saveFocusState, type FocusMode, type FocusState } from "@/persistence/focus"

export default function FocusTool() {
  const [state, setState] = useState<FocusState>(() => defaultFocusState())
  const [remaining, setRemaining] = useState(FOCUS_MS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadFocusState()
    setState(loaded)
    setRemaining(focusRemainingMs(loaded))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!state.running) return
    const timer = setInterval(() => {
      const current = loadFocusState()
      const left = focusRemainingMs(current)
      setRemaining(left)
      if (left <= 0) {
        if ("vibrate" in navigator) navigator.vibrate([30, 60, 30])
        const nextMode: FocusMode = current.mode === "focus" ? "break" : "focus"
        const finished: FocusState = {
          mode: nextMode,
          running: false,
          deadline: null,
          remainingMs: nextMode === "focus" ? FOCUS_MS : BREAK_MS,
          sessions: current.mode === "focus" ? current.sessions + 1 : current.sessions,
        }
        saveFocusState(finished)
        setState(finished)
        setRemaining(finished.remainingMs)
      }
    }, 250)
    return () => clearInterval(timer)
  }, [state.running])

  const update = (next: FocusState) => {
    saveFocusState(next)
    setState(next)
    setRemaining(focusRemainingMs(next))
  }

  const toggle = () => {
    if (state.running) {
      update({ ...state, running: false, remainingMs: focusRemainingMs(state), deadline: null })
    } else {
      update({ ...state, running: true, deadline: Date.now() + (remaining || (state.mode === "focus" ? FOCUS_MS : BREAK_MS)) })
    }
  }

  const reset = () => update({ ...state, running: false, deadline: null, remainingMs: state.mode === "focus" ? FOCUS_MS : BREAK_MS })

  const switchMode = (mode: FocusMode) => update({ ...state, mode, running: false, deadline: null, remainingMs: mode === "focus" ? FOCUS_MS : BREAK_MS })

  const total = state.mode === "focus" ? FOCUS_MS : BREAK_MS
  const progress = total > 0 ? 1 - remaining / total : 0
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const R = 86
  const C = 2 * Math.PI * R

  return (
    <div className="tool-body tool-center">
      <div className="segmented" role="group" aria-label="Timer mode">
        <button type="button" className={state.mode === "focus" ? "selected" : ""} onClick={() => switchMode("focus")}>Focus 25</button>
        <button type="button" className={state.mode === "break" ? "selected" : ""} onClick={() => switchMode("break")}>Break 5</button>
      </div>
      <div className="focus-ring" role="timer" aria-label={`${state.mode} timer`}>
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
          <small>{state.running ? state.mode === "focus" ? "deep work" : "recover" : "paused"}</small>
        </div>
      </div>
      <div className="tool-input-row tool-center-row">
        <button type="button" className="super-primary" onClick={toggle}>{state.running ? "Pause" : remaining === total || remaining === 0 ? "Start" : "Resume"}</button>
        <button type="button" className="super-ghost" onClick={reset}>Reset</button>
      </div>
      <p className="playground-elapsed">{state.sessions} focus session{state.sessions === 1 ? "" : "s"} completed — the timer keeps running on every screen via the floating chip.</p>
      {hydrated && state.running && <p className="playground-elapsed">Running since deadline {new Date(state.deadline ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.</p>}
    </div>
  )
}
