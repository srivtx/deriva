"use client"

import { useStageMachine, StageNames, StageName } from "./stage-machine"
import { StageNameToNumber } from "./stage-machine"

// Stage display names and descriptions
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

export function StageRail() {
  const { currentStage, stages, enterStage } = useStageMachine()

  return (
    <nav style={{
      width: 220,
      borderRight: "1px solid var(--line)",
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      height: "100%",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", margin: 0 }}>
          The Journey
        </h3>
      </div>

      {StageNames.map((stage) => {
        const gate = stages[stage]
        const meta = StageMeta[stage]
        const isActive = currentStage === stage
        const isCompleted = gate.completed
        const isLocked = gate.locked
        const stageNum = StageNameToNumber[stage]

        return (
          <button
            key={stage}
            onClick={() => !isLocked && enterStage(stage)}
            disabled={isLocked}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius)",
              border: "none",
              background: isActive ? "var(--accent-soft)" : "transparent",
              color: isLocked ? "var(--viz-untouched)" : isActive ? "var(--accent)" : "var(--ink)",
              cursor: isLocked ? "default" : "pointer",
              textAlign: "left",
              fontSize: "0.9rem",
              width: "100%",
              opacity: isLocked ? 0.5 : 1,
            }}
          >
            {/* Status indicator */}
            <span style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: `2px solid ${isCompleted ? "var(--viz-settled)" : isActive ? "var(--accent)" : "var(--line)"}`,
              background: isCompleted ? "var(--viz-settled)" : isActive ? "var(--accent)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              color: "#fff",
              flexShrink: 0,
            }}>
              {isCompleted ? "✓" : stageNum}
            </span>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: isActive ? 600 : 400 }}>{meta.label}</div>
              {isActive && (
                <div style={{ fontSize: "0.75rem", color: "var(--ink-soft)", marginTop: 2 }}>
                  {meta.short}
                </div>
              )}
            </div>
          </button>
        )
      })}

      {/* Pattern strip placeholder */}
      <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", margin: "0 0 0.5rem" }}>
          Patterns Earned
        </h3>
        <div style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
          (none yet)
        </div>
      </div>
    </nav>
  )
}
