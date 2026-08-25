"use client"

import { useState } from "react"
import { runScript } from "@/execution/pyodide-client"

const EXAMPLES: { name: string; code: string }[] = [
  {
    name: "Hello, trace",
    code: "def greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Deriva'))\nprint('sum:', sum(range(101)))",
  },
  {
    name: "Watch a loop",
    code: "total = 0\nfor i in range(1, 11):\n    total += i * i\n    print(f'i={i:2}  total={total}')",
  },
  {
    name: "Binary search, live",
    code: "def isqrt(n):\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * mid <= n:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo\n\nfor n in [0, 1, 17, 99, 10**12]:\n    print(f'isqrt({n}) = {isqrt(n)}')",
  },
]

export default function PlaygroundPage() {
  const [code, setCode] = useState(EXAMPLES[0].code)
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setOutput("Running in the worker sandbox…")
    try {
      const result = await runScript(code, "print('session ok')", "", {})
      setOutput(result.error ? `Error: ${result.error}` : result.output)
    } catch (error) {
      setOutput("Error: " + (error instanceof Error ? error.message : "run failed"))
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">PLAYGROUND / FREE SANDBOX</span>
          <h1>No problem attached. Just run it.</h1>
          <p>Python in the same protected worker as drill mode — print freely, break things, watch loops go. Nothing here is graded.</p>
        </div>
      </section>

      <section className="playground-examples" aria-label="Example snippets">
        <span className="super-kicker">LOAD AN EXAMPLE</span>
        <div className="playground-example-row">
          {EXAMPLES.map(example => (
            <button key={example.name} type="button" className="super-ghost" onClick={() => { setCode(example.code); setOutput("") }}>{example.name}</button>
          ))}
        </div>
      </section>

      <div className="ed-wrap">
        <div className="ed-bar"><span className="ed-lang">Python</span><span className="ed-file">playground.py</span><span className="ready">Worker sandbox</span></div>
        <textarea value={code} onChange={event => setCode(event.target.value)} className="ed playground-ed" spellCheck={false} aria-label="Python code" />
      </div>

      <div className="acts" aria-label="Playground actions">
        <button type="button" onClick={run} disabled={running} className="btn btn-p primary-run">{running ? "Running..." : "▶ Run"}</button>
        <button type="button" onClick={() => { setCode(""); setOutput("") }} className="btn">Clear</button>
      </div>

      {output && <pre className="out">{output}</pre>}
    </main>
  )
}
