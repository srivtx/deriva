"use client"

import { useState } from "react"

const SETS: Record<string, string> = {
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lower: "abcdefghijkmnopqrstuvwxyz",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
}

export default function PasswordTool() {
  const [length, setLength] = useState(20)
  const [sets, setSets] = useState({ upper: true, lower: true, digits: true, symbols: true })
  const [password, setPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const pool = Object.keys(SETS).filter(key => sets[key as keyof typeof sets]).map(key => SETS[key]).join("")
  const bits = pool ? Math.round(length * Math.log2(pool.length)) : 0
  const strength = !pool ? "enable at least one set" : bits < 45 ? `${bits} bits — weak` : bits < 70 ? `${bits} bits — okay` : bits < 100 ? `${bits} bits — strong` : `${bits} bits — very strong`

  const generate = () => {
    if (!pool) return
    const bytes = new Uint32Array(length)
    crypto.getRandomValues(bytes)
    setPassword(Array.from(bytes, byte => pool[byte % pool.length]).join(""))
    setCopied(false)
  }

  return (
    <div className="tool-body">
      <div className="password-output" aria-live="polite">{password || "tap generate"}</div>
      <div className="tool-input-row tool-center-row">
        <button type="button" className="super-primary" onClick={generate}>Generate</button>
        <button type="button" className="super-ghost" onClick={async () => { try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}}} disabled={!password}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
      <label className="tool-slider-row">
        <span>Length: <b>{length}</b></span>
        <input type="range" min={8} max={64} value={length} onChange={event => setLength(Number(event.target.value))} aria-label="Password length" />
      </label>
      <div className="segmented" role="group" aria-label="Character sets">
        {(Object.keys(SETS) as (keyof typeof sets)[]).map(key => (
          <button key={key} type="button" className={sets[key] ? "selected" : ""} onClick={() => setSets(prev => ({ ...prev, [key]: !prev[key] }))}>{key}</button>
        ))}
      </div>
      <p className="playground-elapsed">{strength} · generated locally with crypto.getRandomValues — never sent anywhere.</p>
    </div>
  )
}
