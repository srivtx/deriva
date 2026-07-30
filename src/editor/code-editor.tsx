"use client"

import { useState } from "react"

interface CodeEditorProps {
  initialCode: string
  onRun: (code: string) => void
  onHint: () => void
  hintLevel: number
  maxHints: number
}

export function CodeEditor({ initialCode, onRun, onHint, hintLevel, maxHints }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: "100%",
          minHeight: 300,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "14px",
          padding: "1rem",
          background: "var(--paper-raised)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-raised)",
          resize: "vertical",
        }}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          onClick={() => onRun(code)}
          style={{
            padding: "0.6rem 1.5rem",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Run Code
        </button>

        <button
          onClick={onHint}
          disabled={hintLevel >= maxHints}
          style={{
            padding: "0.6rem 1.5rem",
            background: "transparent",
            color: "var(--ink-soft)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            cursor: hintLevel >= maxHints ? "default" : "pointer",
            opacity: hintLevel >= maxHints ? 0.5 : 1,
          }}
        >
          Hint ({hintLevel}/{maxHints})
        </button>
      </div>
    </div>
  )
}
