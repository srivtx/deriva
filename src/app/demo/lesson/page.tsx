"use client"

import { useState } from "react"
import { useStageMachine, StageName } from "@/learning/flow/stage-machine"
import { StageRail } from "@/learning/flow/stage-rail"
import { SocraticLadder } from "@/learning/socratic/ladder"
import { CodeEditor } from "@/editor/code-editor"
import { TreePanel, buildTree } from "@/viz/panels/tree"
import type { SocraticNode } from "@/curriculum/schema/lesson"

// Mock data for demo lesson (Trees 3: Returning Tuples)
const DEMO_SOCRATIC: SocraticNode[] = [
  {
    id: "r1",
    question: "When node 20 checks its left child (15) and right child (7), what does it know about each?",
    type: "checkbox",
    options: [
      { label: "Its height", value: "height", correct: true },
      { label: "Whether it is balanced", value: "balanced", correct: true },
      { label: "The original tree root", value: "root", correct: false },
    ],
    feedback: {
      correct: "Exactly — it knows both pieces. But can it return both?",
      wrong: "Think about what a recursive call actually gives back.",
    },
  },
  {
    id: "r2",
    question: "Can ONE return value carry both 'height' and 'balanced'?",
    type: "constructed-choice",
    options: [
      { label: "Yes — return a tuple (height, balanced)", value: "tuple" },
      { label: "Yes — return height; balanced is global state", value: "global" },
      { label: "No — we need two separate traversals", value: "separate" },
    ],
    correct: "tuple",
    followUp: "r3",
  },
]

export default function DemoLessonPage() {
  const { currentStage, completeStage, setArtifact } = useStageMachine()
  const [code, setCode] = useState("def check_balance(root):\n    # Your code here\n    pass")
  const [hintLevel, setHintLevel] = useState(0)

  const demoTree = buildTree([3, 9, 20, null, null, 15, 7])

  const renderStageContent = () => {
    switch (currentStage) {
      case "understand":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Understand: Balanced Trees
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Predict: Is this tree balanced?
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <TreePanel root={demoTree} width={400} height={250} />
            </div>
          </div>
        )

      case "play":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Play: Touch the Tree
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Click nodes and explore the tree structure.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <TreePanel root={demoTree} width={400} height={250} />
            </div>
          </div>
        )

      case "reason":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Reason: Socratic Questions
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
              Answer the guided questions to discover the solution.
            </p>
            <SocraticLadder
              nodes={DEMO_SOCRATIC as any}
              onAnswer={(id, answer) => {
                setArtifact("reason" as StageName, { answers: { [id]: Array.isArray(answer) ? answer : [answer] } } as any)
              }}
            />
          </div>
        )

      case "discover":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Discover: Design the Return Type
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Invent what the function should return.
            </p>
            <div style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--paper-raised)", borderRadius: "var(--radius)" }}>
              <p>Return type builder coming soon...</p>
            </div>
          </div>
        )

      case "design":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Design: Algorithm Contract
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Specify the signature, state, and traversal.
            </p>
          </div>
        )

      case "implement":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Implement: Write the Code
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
              Now write your solution.
            </p>
            <CodeEditor
              initialCode={code}
              onRun={(c) => { setCode(c); completeStage("implement") }}
              onHint={() => setHintLevel(h => h + 1)}
              hintLevel={hintLevel}
              maxHints={4}
            />
          </div>
        )

      case "execute":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Execute: Watch It Run
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Visualization of your code executing...
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <TreePanel root={demoTree} width={500} height={300} />
            </div>
          </div>
        )

      case "reflect":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Reflect: Why It Works
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              Explain why the tuple approach works and the single-value approach fails.
            </p>
          </div>
        )

      case "generalize":
        return (
          <div>
            <h2 style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.8rem" }}>
              Generalize: Where It Appears
            </h2>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.5rem" }}>
              This pattern (Returning Tuples) appears in Advanced Trees and DP.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <StageRail />
      <div style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        {renderStageContent()}
        <button
          onClick={() => completeStage(currentStage)}
          style={{
            marginTop: "2rem",
            padding: "0.6rem 1.5rem",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            cursor: "pointer",
          }}
        >
          Complete Stage →
        </button>
      </div>
    </div>
  )
}
