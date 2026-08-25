"use client"

import { useState } from "react"

export default function JsonTool() {
  const [input, setInput] = useState('{"topic":"trees","problems":50,"stages":["reflex","mastery"],"verified":true}')
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const process = (mode: "format" | "minify") => {
    try {
      const parsed = JSON.parse(input)
      setOutput(mode === "format" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "invalid JSON")
      setOutput("")
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="tool-body">
      <textarea
        className="notebook-editor-text json-input"
        value={input}
        onChange={event => { setInput(event.target.value); setError(null) }}
        placeholder="Paste JSON…"
        aria-label="JSON input"
      />
      <div className="tool-input-row tool-center-row">
        <button type="button" className="super-primary" onClick={() => process("format")}>Format</button>
        <button type="button" className="super-ghost" onClick={() => process("minify")}>Minify</button>
        <button type="button" className="super-ghost" onClick={copy} disabled={!output}>{copied ? "Copied ✓" : "Copy result"}</button>
      </div>
      {error && <p className="tool-error">Invalid JSON: {error}</p>}
      {!error && output && <pre className="out json-output">{output}</pre>}
    </div>
  )
}
