"use client"

// Stage shell — the shared surface grammar for all nine stages (09 §3).
// One screen = one stage = one thinking-move, named visibly (A1).
// Primary action pinned above the bottom tab bar + safe area on phones (12 §Scope).

import { useState, type ReactNode } from "react"
import { StageNameToNumber, type StageName } from "../flow/stage-machine"
import { stageVerb } from "../flow/gates"
import type { Probe } from "@/curriculum/schema/lesson"

export function StageShell({
  stage, title, move, children,
}: {
  stage: StageName
  title: string
  move: string
  children: ReactNode
}) {
  return (
    <div className={`stage-shell stage-${stage}`}>
      <header className="stage-head">
        <div className="stage-head-meta">
          <span className="stage-kicker">Stage {StageNameToNumber[stage]} of 9 · {stageVerb(stage)}</span>
          <span className="stage-head-tag">{stage === "generalize" ? "transfer checkpoint" : "one focused move"}</span>
        </div>
        <h1 className="stage-title">{title}</h1>
        <p className="stage-move">Today&rsquo;s one move: <b>{move}</b></p>
      </header>
      {children}
    </div>
  )
}

// Pinned primary action — above the tab bar and safe area on phones.
export function StageCTA({ children }: { children: ReactNode }) {
  return <div className="stage-cta">{children}</div>
}

export function PrimaryButton({ onClick, disabled, children }: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function GhostButton({ onClick, disabled, children }: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button className="btn-ghost" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// Option row — big thumb-sized tap target, no native controls.
export function OptionRow({ selected, state, onClick, children }: {
  selected: boolean
  state?: "correct" | "wrong" | null
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      className={`opt-card${selected ? " selected" : ""}${state === "correct" ? " correct" : ""}${state === "wrong" ? " wrong" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {children}
    </button>
  )
}

// "Test me out" — the respectful escape route (03 B1). Pass → stage completed
// viaProbe. Fail → routed back into the stage without shame.
export function ProbeCard({ probe, onPass }: { probe: Probe; onPass: () => void }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  if (!open) {
    return (
      <div className="probe-card">
        <button className="probe-trigger" onClick={() => setOpen(true)}>
          Already own this move? <b>Test me out →</b>
        </button>
      </div>
    )
  }

  const choose = (value: string) => {
    setPicked(value)
    if (value === probe.correct) {
      onPass()
    } else {
      setFailed(true)
    }
  }

  return (
    <div className="probe-card open">
      {!failed ? (
        <>
          <span className="probe-kicker">Mastery probe — one question, no coaching</span>
          <p className="probe-question">{probe.question}</p>
          <div className="probe-options">
            {probe.options.map(o => (
              <OptionRow key={o.value} selected={picked === o.value} onClick={() => choose(o.value)}>
                {o.label}
              </OptionRow>
            ))}
          </div>
          <button className="probe-cancel" onClick={() => setOpen(false)}>Back to the stage</button>
        </>
      ) : (
        <>
          <p className="probe-question">Not quite — which is genuinely good news.</p>
          <p className="probe-note">This stage exists to install exactly that move. Walk it once; the probe will still be here.</p>
          <button className="probe-cancel" onClick={() => { setOpen(false); setFailed(false); setPicked(null) }}>
            Back to the stage →
          </button>
        </>
      )}
    </div>
  )
}
