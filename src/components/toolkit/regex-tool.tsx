"use client"

import { useState } from "react"

export default function RegexTool() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b")
  const [flags, setFlags] = useState("gi")
  const [text, setText] = useState("Reach us at team@deriva.dev or hello@world.io — old mail admin@legacy.com is dead.")

  let error: string | null = null
  let matches: { text: string; index: number; groups: string[] }[] = []
  let highlighted: (string | { match: string })[] = [text]

  try {
    const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g")
    let match: RegExpExecArray | null
    const found: typeof matches = []
    while ((match = regex.exec(text)) !== null) {
      found.push({ text: match[0], index: match.index, groups: match.slice(1).map(g => g ?? "—") })
      if (match[0] === "") regex.lastIndex++
      if (found.length > 200) break
    }
    matches = found
    const parts: (string | { match: string })[] = []
    let cursor = 0
    for (const m of found) {
      parts.push(text.slice(cursor, m.index))
      parts.push({ match: m.text })
      cursor = m.index + m.text.length
    }
    parts.push(text.slice(cursor))
    highlighted = parts
  } catch (err) {
    error = err instanceof Error ? err.message : "invalid pattern"
  }

  return (
    <div className="tool-body">
      <div className="tool-input-row">
        <input value={pattern} onChange={event => setPattern(event.target.value)} placeholder="pattern" aria-label="Regular expression" className={error ? "invalid" : ""} />
        <input value={flags} onChange={event => setFlags(event.target.value)} placeholder="flags" aria-label="Flags" className="regex-flags" />
      </div>
      <textarea
        className="notebook-editor-text"
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder="Test text…"
        aria-label="Test text"
      />
      {error && <p className="tool-error">{error}</p>}
      {!error && (
        <>
          <p className="playground-elapsed">{matches.length} match{matches.length === 1 ? "" : "es"}</p>
          <div className="regex-preview">
            {highlighted.map((part, i) =>
              typeof part === "string"
                ? <span key={i}>{part}</span>
                : <mark key={i}>{part.match}</mark>
            )}
          </div>
          {matches.some(m => m.groups.length > 0) && (
            <ul className="regex-groups">
              {matches.slice(0, 20).map((m, i) => (
                m.groups.length > 0 && <li key={i}><b>{m.text}</b><span>{m.groups.map((g, gi) => `$${gi + 1}=${g}`).join("  ")}</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
