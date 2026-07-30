"use client"

import { StageRail } from "@/learning/flow/stage-rail"
import { useStageMachine } from "@/learning/flow/stage-machine"
import { StageName } from "@/learning/flow/stage-machine"

// Placeholder stage components — to be built incrementally
function StageContent({ stage }: { stage: StageName }) {
  const { completeStage } = useStageMachine()

  return (
    <div style={{ padding: "2rem", maxWidth: 720 }}>
      <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem", fontWeight: 400 }}>
        Stage: {stage}
      </h2>
      <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
        This stage is being built. Click "Complete" to advance.
      </p>
      <button
        onClick={() => completeStage(stage)}
        style={{
          marginTop: "2rem",
          padding: "0.6rem 1.5rem",
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Complete Stage →
      </button>
    </div>
  )
}

export default function LessonPage({
  params,
}: {
  params: { topic: string; lesson: string }
}) {
  const { currentStage } = useStageMachine()

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Stage Rail — left nav */}
      <StageRail />

      {/* Main content area — textbook/workbench split */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <StageContent stage={currentStage} />
      </div>
    </div>
  )
}
