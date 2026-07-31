"use client"

// The stage rail — the product's compass (09 §2). Desktop: vertical rail with
// pattern strip. Phone: horizontal gate-aware stepper under the app bar.
// Locked stages explain themselves; nothing is a dead end.

import { useState } from "react"
import { useStageMachine, StageNames, StageName, StageNameToNumber } from "./stage-machine"
import { gateRequirement } from "./gates"

const StageMeta: Record<StageName, { label: string; short: string }> = {
  understand:  { label: "Understand",   short: "Read & predict" },
  play:        { label: "Play",         short: "Touch the data" },
  reason:      { label: "Reason",       short: "Socratic questions" },
  discover:    { label: "Discover",     short: "Invent the idea" },
  design:      { label: "Design",       short: "Spec the algorithm" },
  implement:   { label: "Implement",    short: "Write the code" },
  execute:     { label: "Execute",      short: "Watch it run" },
  reflect:     { label: "Reflect",      short: "Why it worked" },
  generalize:  { label: "Generalize",   short: "Where it appears" },
}

function GateIcon({ locked, completed, active, viaProbe, num }: {
  locked: boolean; completed: boolean; active: boolean; viaProbe: boolean; num: number
}) {
  return (
    <span className={`gate-icon ${completed ? "completed" : active ? "active" : locked ? "locked" : ""}`}>
      {completed ? (viaProbe ? "⏭" : "✓") : num}
    </span>
  )
}

// ── Desktop rail ──
export function StageRail({ patternName }: { patternName?: string }) {
  const { currentStage, stages, enterStage } = useStageMachine()

  return (
    <nav className="stage-rail" aria-label="The nine-stage journey">
      <h3 className="rail-heading">The Journey</h3>
      {StageNames.map((stage) => {
        const gate = stages[stage]
        const meta = StageMeta[stage]
        const isActive = currentStage === stage
        return (
          <button
            key={stage}
            className={`rail-item ${isActive ? "active" : ""}`}
            onClick={() => !gate.locked && enterStage(stage)}
            disabled={gate.locked}
            title={gate.locked ? gateRequirement(stage) : undefined}
          >
            <GateIcon locked={gate.locked} completed={gate.completed} active={isActive} viaProbe={gate.viaProbe} num={StageNameToNumber[stage]} />
            <span className="rail-label">
              <span className="rail-name">{meta.label}</span>
              {isActive && <span className="rail-short">{meta.short}</span>}
              {gate.locked && <span className="rail-gate">{gateRequirement(stage)}</span>}
            </span>
          </button>
        )
      })}
      <div className="rail-patterns">
        <h3 className="rail-heading">Pattern</h3>
        <div className="rail-pattern-strip">
          {patternName ? <span className="pattern-chip">{patternName}</span> : <span className="rail-none">earned at Stage 8</span>}
        </div>
      </div>
    </nav>
  )
}

// ── Phone stepper — horizontal, gate-aware (12 §Scope) ──
export function StageStepper() {
  const { currentStage, stages, enterStage } = useStageMachine()
  const [gateMsg, setGateMsg] = useState<string | null>(null)
  const completedCount = StageNames.filter(s => stages[s].completed).length

  const tap = (stage: StageName) => {
    const gate = stages[stage]
    if (gate.locked) {
      setGateMsg(gateRequirement(stage))
      return
    }
    setGateMsg(null)
    enterStage(stage)
  }

  return (
    <div className="stage-stepper-wrap">
      <div className="stage-stepper" role="navigation" aria-label="Lesson stages">
        {StageNames.map((stage, i) => {
          const gate = stages[stage]
          const isActive = currentStage === stage
          return (
            <div key={stage} className="stepper-cell">
              {i > 0 && <span className={`stepper-connector ${gate.completed || isActive ? "done" : ""}`} />}
              <button
                className={`stepper-dot ${isActive ? "active" : ""} ${gate.completed ? "completed" : ""} ${gate.locked ? "locked" : ""}`}
                onClick={() => tap(stage)}
                aria-label={`${StageMeta[stage].label}${gate.locked ? " — locked" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {gate.completed ? (gate.viaProbe ? "⏭" : "✓") : StageNameToNumber[stage]}
              </button>
              <span className={`stepper-label ${isActive ? "active" : ""}`}>{StageMeta[stage].label}</span>
            </div>
          )
        })}
      </div>
      <div className="stepper-status">
        {gateMsg
          ? <span className="stepper-gate">🔒 {gateMsg}</span>
          : <span>{completedCount} of 9 stages complete</span>}
      </div>
    </div>
  )
}
