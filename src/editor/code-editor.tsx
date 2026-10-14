"use client"

import { useState } from "react"
import { PythonEditor } from "./python-editor"

export { PythonEditor }
export type { PythonEditorProps } from "./python-editor"

interface CodeEditorProps {
  initialCode: string
  onRun: (code: string) => void
  onHint?: () => void
  hintLevel?: number
  maxHints?: number
}

export function CodeEditor({ initialCode, onRun, onHint, hintLevel = 0, maxHints = 3 }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <PythonEditor
        value={code}
        onChange={setCode}
        onRun={() => onRun(code)}
        onReset={() => setCode(initialCode)}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          onClick={() => onRun(code)}
          style={{
            padding: "0.6rem 1.5rem",
            background: "var(--accent)",
            color: "var(--paper-raised)",
            border: "none",
            borderRadius: "var(--radius)",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Run Code
        </button>

        {onHint && (
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
        )}
      </div>
    </div>
  )
}
