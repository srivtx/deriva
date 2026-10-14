"use client"

import { useEffect, useState } from "react"
import { runScript } from "@/execution/pyodide-client"
import { PythonEditor } from "@/editor/python-editor"
import { extractErrorLine } from "@/editor/indent"

const STORAGE_KEY = "deriva-playground-code-v1"

const EXAMPLES: { name: string; code: string }[] = [
  { name: "Hello", code: "def greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Deriva'))\nprint('sum 1..100 =', sum(range(101)))" },
  { name: "Loop table", code: "total = 0\nfor i in range(1, 11):\n    total += i * i\n    print(f'i={i:2}  total={total}')" },
  { name: "Stack", code: "class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, x):\n        self.items.append(x)\n    def pop(self):\n        return self.items.pop()\n\ns = Stack()\nfor x in [1, 2, 3]:\n    s.push(x)\nwhile s.items:\n    print(s.pop())" },
  { name: "Binary search", code: "def binary_search(a, target):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == target:\n            return mid\n        if a[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n\na = [1, 3, 5, 7, 9, 11]\nprint(binary_search(a, 9), binary_search(a, 4))" },
  { name: "Merge sorted", code: "def merge(a, b):\n    out, i, j = [], 0, 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            out.append(a[i]); i += 1\n        else:\n            out.append(b[j]); j += 1\n    return out + a[i:] + b[j:]\n\nprint(merge([1, 3, 5], [2, 4, 6]))" },
  { name: "BFS graph", code: "from collections import deque\n\nadj = {0: [1, 2], 1: [3], 2: [3], 3: [4], 4: []}\n\ndef bfs(src):\n    dist = {src: 0}\n    q = deque([src])\n    while q:\n        node = q.popleft()\n        for nxt in adj[node]:\n            if nxt not in dist:\n                dist[nxt] = dist[node] + 1\n                q.append(nxt)\n    return dist\n\nprint(bfs(0))" },
  { name: "Word count", code: "text = 'the quick brown fox jumps over the lazy dog the end'\ncounts = {}\nfor word in text.split():\n    counts[word] = counts.get(word, 0) + 1\nfor word in sorted(counts, key=counts.get, reverse=True)[:5]:\n    print(f'{word:6} {counts[word]}')" },
]

export default function PlaygroundPage() {
  const [code, setCode] = useState(EXAMPLES[0].code)
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setCode(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) { try { localStorage.setItem(STORAGE_KEY, code) } catch {} }
  }, [code, hydrated])

  const run = async () => {
    setRunning(true)
    setOutput("")
    setElapsed(null)
    const started = performance.now()
    try {
      const result = await runScript(code, "", "")
      setOutput(result.error ? `Error: ${result.error}` : result.output || "(no output — add a print)")
    } catch (error) {
      setOutput("Error: " + (error instanceof Error ? error.message : "run failed"))
    } finally {
      setElapsed(performance.now() - started)
      setRunning(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  const download = () => {
    const blob = new Blob([code], { type: "text/x-python" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "playground.py"
    link.click()
    URL.revokeObjectURL(url)
  }

  const isFailure = !!output && (output.startsWith("Error:") || output.includes("Traceback") || output.includes("Error"))
  const errorLine = isFailure ? extractErrorLine(output, 0) : null

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">PLAYGROUND / FREE SANDBOX</span>
          <h1>No problem attached. Just run it.</h1>
          <p>Python in the same protected worker as drill mode — print freely, break things, keep what you write. Your code saves automatically on this device.</p>
        </div>
      </section>

      <section className="playground-examples" aria-label="Example snippets">
        <span className="super-kicker">LOAD AN EXAMPLE</span>
        <div className="playground-example-row">
          {EXAMPLES.map(example => (
            <button key={example.name} type="button" className={`super-ghost${code === example.code ? " active-example" : ""}`} onClick={() => { setCode(example.code); setOutput(""); setElapsed(null) }}>{example.name}</button>
          ))}
        </div>
      </section>

      <PythonEditor
        value={code}
        onChange={setCode}
        onRun={run}
        onReset={() => { setCode(""); setOutput(""); setElapsed(null) }}
        filename="playground.py"
        language="Python 3.12"
        errorLine={errorLine}
        minHeight={320}
      />

      <div className="acts" aria-label="Playground actions">
        <button type="button" onClick={run} disabled={running} className="btn btn-p primary-run">{running ? "Running..." : "▶ Run"} <kbd className="shortcut-kbd">⌘↵</kbd></button>
        <button type="button" onClick={copy} className="btn">{copied ? "Copied ✓" : "Copy"}</button>
        <button type="button" onClick={download} className="btn">Download</button>
        <button type="button" onClick={() => { setCode(""); setOutput(""); setElapsed(null) }} className="btn">Clear</button>
      </div>

      {running && <div className="run-shimmer" aria-hidden="true" />}
      {(output || elapsed != null) && (
        <div className="playground-output-head">
          <span className="super-kicker">OUTPUT</span>
          {elapsed != null && <span className="playground-elapsed">{(elapsed / 1000).toFixed(2)}s in the worker</span>}
        </div>
      )}
      {output && <pre className="out">{output}</pre>}
    </main>
  )
}
