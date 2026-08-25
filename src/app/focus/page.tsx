"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

const STORE_KEY = "deriva-focus-session-v1"
const MIN_MINUTES = 5
const MAX_MINUTES = 90

type Session = { endsAt: number; durationMs: number; pausedRemaining: number | null }

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (typeof parsed.endsAt !== "number" || typeof parsed.durationMs !== "number") return null
    if (!parsed.pausedRemaining && parsed.endsAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function format(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export default function FocusPage() {
  const [minutes, setMinutes] = useState(25)
  const [session, setSession] = useState<Session | null>(null)
  const [remaining, setRemaining] = useState(0)
  const dialRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const stored = loadSession()
    if (stored) setSession(stored)
  }, [])

  useEffect(() => {
    if (!session) return
    localStorage.setItem(STORE_KEY, JSON.stringify(session))
    document.documentElement.dataset.focus = session.pausedRemaining != null ? "paused" : "on"
    return () => {
      delete document.documentElement.dataset.focus
    }
  }, [session])

  useEffect(() => {
    if (!session || session.pausedRemaining != null) {
      if (session?.pausedRemaining != null) setRemaining(session.pausedRemaining)
      return
    }
    const tick = () => {
      const left = session.endsAt - Date.now()
      setRemaining(left)
      if (left <= 0) {
        setSession(null)
        localStorage.removeItem(STORE_KEY)
        if ("vibrate" in navigator) navigator.vibrate([120, 60, 120])
      }
    }
    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [session])

  const start = useCallback((mins: number) => {
    setSession({ endsAt: Date.now() + mins * 60_000, durationMs: mins * 60_000, pausedRemaining: null })
  }, [])

  const running = session != null && session.pausedRemaining == null
  const paused = session?.pausedRemaining != null
  const progress = useMemo(() => {
    if (!session) return 0
    const total = session.pausedRemaining ?? session.durationMs
    const left = session.pausedRemaining ?? Math.max(0, session.endsAt - Date.now())
    return 1 - left / Math.max(1, total)
  }, [session, remaining])

  const setFromPointer = useCallback((event: React.PointerEvent) => {
    if (running) return
    const rect = dialRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    const raw = MIN_MINUTES + (angle / 360) * (MAX_MINUTES - MIN_MINUTES)
    setMinutes(Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(raw / 5) * 5)))
  }, [running])

  const ticks = useMemo(() => Array.from({ length: 18 }, (_, i) => i), [])
  const display = session ? format(session.pausedRemaining ?? remaining) : format(minutes * 60_000)

  return (
    <main className="focus-page">
      <div className="focus-shell">
        <span className="experiment-kicker">FOCUS DIAL</span>
        <h1>One clock. One derivation.</h1>
        <p className="settings-hint">Turn the dial to set a session. While it runs, Deriva warms its accent so everything else steps back.</p>

        <div className="focus-dial-wrap">
          <svg
            ref={dialRef}
            className={`focus-dial${running ? " locked" : ""}`}
            viewBox="0 0 240 240"
            onPointerDown={setFromPointer}
            onPointerMove={event => { if (event.buttons === 1) setFromPointer(event) }}
            role="slider"
            aria-label="Focus minutes"
            aria-valuemin={MIN_MINUTES}
            aria-valuemax={MAX_MINUTES}
            aria-valuenow={minutes}
          >
            <circle cx="120" cy="120" r="112" className="focus-dial-face" />
            {ticks.map(i => {
              const angle = (i / 18) * Math.PI * 2 - Math.PI / 2
              const inner = i % 3 === 0 ? 92 : 98
              return (
                <line
                  key={i}
                  x1={120 + Math.cos(angle) * inner} y1={120 + Math.sin(angle) * inner}
                  x2={120 + Math.cos(angle) * 104} y2={120 + Math.sin(angle) * 104}
                  className="focus-dial-tick"
                />
              )
            })}
            <circle cx="120" cy="120" r="84" className="focus-dial-track" />
            <circle
              cx="120" cy="120" r="84"
              className="focus-dial-progress"
              strokeDasharray={`${2 * Math.PI * 84}`}
              strokeDashoffset={`${2 * Math.PI * 84 * (1 - (session ? progress : (minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)))}`}
              transform="rotate(-90 120 120)"
            />
            {!running && (() => {
              const angle = ((minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * Math.PI * 2 - Math.PI / 2
              return (
                <g>
                  <line x1={120 + Math.cos(angle) * 70} y1={120 + Math.sin(angle) * 70} x2={120 + Math.cos(angle) * 88} y2={120 + Math.sin(angle) * 88} className="focus-dial-hand" />
                  <circle cx={120 + Math.cos(angle) * 88} cy={120 + Math.sin(angle) * 88} r="6" className="focus-dial-knob" />
                </g>
              )
            })()}
          </svg>
          <div className={`focus-readout${session ? "" : " setting"}`} aria-live="polite">
            {display}
          </div>
        </div>

        <div className="focus-actions">
          {!session && <button type="button" className="super-primary" onClick={() => start(minutes)}>Start {minutes} min</button>}
          {running && (
            <button type="button" className="super-primary" onClick={() => setSession({ ...session!, pausedRemaining: Math.max(0, session!.endsAt - Date.now()) })}>
              Pause
            </button>
          )}
          {paused && (
            <button type="button" className="super-primary" onClick={() => setSession({ ...session!, endsAt: Date.now() + session!.pausedRemaining!, pausedRemaining: null })}>
              Resume
            </button>
          )}
          {session && <button type="button" className="btn-ghost" onClick={() => { setSession(null); localStorage.removeItem(STORE_KEY) }}>Reset</button>}
          <Link href="/" className="btn-ghost">Back to work</Link>
        </div>
      </div>
    </main>
  )
}
