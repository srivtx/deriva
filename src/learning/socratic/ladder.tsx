"use client"

import { useState } from "react"
import type { SocraticNode } from "@/curriculum/schema/lesson"

interface SocraticLadderProps {
  nodes: SocraticNode[]
  onAnswer: (nodeId: string, answer: string | string[]) => void
}

export function SocraticLadder({ nodes, onAnswer }: SocraticLadderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [showFeedback, setShowFeedback] = useState(false)

  const currentNode = nodes[currentIndex]

  if (!currentNode) return <div>No questions.</div>

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentNode.id]: value }
    setAnswers(newAnswers)
    setShowFeedback(true)
    onAnswer(currentNode.id, value)
  }

  const nextQuestion = () => {
    setShowFeedback(false)
    if (currentNode.followUp && answers[currentNode.id]) {
      const nextIdx = nodes.findIndex(n => n.id === currentNode.followUp)
      if (nextIdx >= 0) setCurrentIndex(nextIdx)
    } else if (currentIndex < nodes.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{
        padding: "1.5rem",
        background: "var(--paper-raised)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-raised)",
      }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "1rem" }}>
          Question {currentIndex + 1} of {nodes.length}
        </h3>

        <p style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: "1.2rem", lineHeight: 1.6 }}>
          {currentNode.question}
        </p>

        {/* Options */}
        {currentNode.options && (
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {currentNode.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                style={{
                  padding: "0.75rem 1rem",
                  textAlign: "left",
                  background: answers[currentNode.id] === opt.value
                    ? "var(--accent-soft)"
                    : "var(--paper)",
                  border: `1px solid ${answers[currentNode.id] === opt.value ? "var(--accent)" : "var(--line)"}`,
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && currentNode.feedback && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "var(--accent-soft)",
            borderRadius: "var(--radius)",
            fontSize: "0.95rem",
          }}>
            {answers[currentNode.id] === currentNode.correct
              ? currentNode.feedback.correct
              : currentNode.feedback.wrong}
          </div>
        )}

        {/* Next button */}
        {showFeedback && (
          <button
            onClick={nextQuestion}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.5rem",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            {currentIndex < nodes.length - 1 ? "Next →" : "Done"}
          </button>
        )}
      </div>
    </div>
  )
}
