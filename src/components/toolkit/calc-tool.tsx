"use client"

import { useState } from "react"

function evaluate(input: string): number {
  const s = input.replace(/\s+/g, "")
  let pos = 0
  const peek = () => s[pos]

  function applyFn(name: string, v: number): number {
    switch (name) {
      case "sqrt": return Math.sqrt(v)
      case "sin": return Math.sin(v)
      case "cos": return Math.cos(v)
      case "tan": return Math.tan(v)
      case "log": return Math.log10(v)
      case "ln": return Math.log(v)
      default: return Math.abs(v)
    }
  }

  function applyPostfix(v: number): number {
    if (s[pos] === "!") {
      pos++
      let out = 1
      for (let i = 2; i <= Math.floor(v); i++) out *= i
      return out
    }
    return v
  }

  function parseExpression(): number {
    let value = parseTerm()
    while (peek() === "+" || peek() === "-") {
      const op = s[pos++]
      const right = parseTerm()
      value = op === "+" ? value + right : value - right
    }
    return value
  }

  function parseTerm(): number {
    let value = parsePower()
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = s[pos++]
      const right = parsePower()
      value = op === "*" ? value * right : op === "/" ? value / right : value % right
    }
    return value
  }

  function parsePower(): number {
    const base = parseUnary()
    if (peek() === "^") {
      pos++
      return Math.pow(base, parsePower())
    }
    return base
  }

  function parseUnary(): number {
    if (peek() === "-") { pos++; return -parseUnary() }
    if (peek() === "+") { pos++; return parseUnary() }
    return parsePrimary()
  }

  function parsePrimary(): number {
    if (peek() === "(") {
      pos++
      const value = parseExpression()
      if (s[pos] !== ")") throw new Error("missing )")
      pos++
      return applyPostfix(value)
    }
    const fn = /^(sqrt|sin|cos|tan|log|ln|abs)\(/.exec(s.slice(pos))
    if (fn) {
      pos += fn[0].length
      const value = parseExpression()
      if (s[pos] !== ")") throw new Error("missing )")
      pos++
      return applyPostfix(applyFn(fn[1], value))
    }
    if (s.startsWith("pi", pos)) { pos += 2; return applyPostfix(Math.PI) }
    if (s.startsWith("e", pos) && !/[0-9.]/.test(s[pos + 1] ?? "")) { pos += 1; return applyPostfix(Math.E) }
    const num = /^\d+(\.\d+)?/.exec(s.slice(pos))
    if (!num) throw new Error("unexpected input")
    pos += num[0].length
    return applyPostfix(parseFloat(num[0]))
  }

  const result = parseExpression()
  if (pos < s.length) throw new Error("unexpected trailing input")
  return result
}

export default function CalcTool() {
  const [expression, setExpression] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = (expr: string) => {
    setExpression(expr)
    if (!expr.trim()) { setResult(null); setError(null); return }
    try {
      const value = evaluate(expr)
      if (!Number.isFinite(value)) throw new Error("not a finite number")
      setResult(String(Math.round(value * 1e10) / 1e10))
      setError(null)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : "invalid expression")
    }
  }

  const pad = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "^", "%", "+"]

  return (
    <div className="tool-body">
      <div className="calc-display" aria-live="polite">
        <span className="calc-expression">{expression || "type an expression…"}</span>
        {error ? <strong className="calc-error">{error}</strong> : result != null && <strong className="calc-result">= {result}</strong>}
      </div>
      <input
        className="notebook-search"
        value={expression}
        onChange={event => run(event.target.value)}
        placeholder="sqrt(2)^4 + 5! / 12"
        aria-label="Expression"
      />
      <div className="calc-pad">
        {pad.map(key => (
          <button key={key} type="button" className="calc-key" onClick={() => run(expression + key)}>{key}</button>
        ))}
        <button type="button" className="calc-key calc-wide" onClick={() => run(expression.slice(0, -1))}>⌫</button>
        <button type="button" className="calc-key calc-wide" onClick={() => run("")}>AC</button>
      </div>
      <p className="playground-elapsed">Supports + − × ÷ % ^ ! ( ) sqrt sin cos tan log ln abs pi e — evaluated by a real parser, never eval().</p>
    </div>
  )
}
