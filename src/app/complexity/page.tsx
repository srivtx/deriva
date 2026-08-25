"use client"

import { useEffect, useRef, useState } from "react"
import { runScript } from "@/execution/pyodide-client"

type Experiment = {
  id: string
  title: string
  story: string
  labelA: string
  labelB: string
  sizes: number[]
  code: string
}

const CUSTOM_STARTER = `# Write your own experiment.
# Define fa(n) — and optionally fb(n) — doing work of size n.

def fa(n):
    data = list(range(n))
    total = 0
    for x in data:
        total += x
    return total

def fb(n):
    return sum(range(n))`

const EXPERIMENTS: Experiment[] = [
  {
    id: "list-vs-set",
    title: "List scan vs set lookup",
    story: "Same question — 'is x in here?' — two structures. One pays a price on every query, the other barely notices size.",
    labelA: "list `in` (O(n))",
    labelB: "set `in` (O(1))",
    sizes: [400, 800, 1600, 3200, 6400, 12800],
    code: `def fa(n):
    data = list(range(n))
    return (n + 1) in data

def fb(n):
    data = set(range(n))
    return (n + 1) in data`,
  },
  {
    id: "bubble-vs-builtin",
    title: "Bubble sort vs built-in sort",
    story: "The naive double loop against Timsort. Watch the quadratic line leave the chart while n log n stays flat-ish.",
    labelA: "bubble sort (O(n²))",
    labelB: "sorted() (O(n log n))",
    sizes: [100, 200, 400, 800, 1600],
    code: `def fa(n):
    data = list(range(n, 0, -1))
    for i in range(n):
        for j in range(n - 1 - i):
            if data[j] > data[j + 1]:
                data[j], data[j + 1] = data[j + 1], data[j]

def fb(n):
    data = list(range(n, 0, -1))
    data.sort()`,
  },
  {
    id: "fib",
    title: "Naive fib vs memo fib",
    story: "The same recurrence, one recomputes everything. Each +2 on n roughly quadruples the naive time — exponential in plain sight.",
    labelA: "naive recursion (O(φⁿ))",
    labelB: "lru_cache (O(n))",
    sizes: [20, 22, 24, 26, 28],
    code: `from functools import lru_cache

def fa(n):
    if n <= 1:
        return n
    return fa(n - 1) + fa(n - 2)

@lru_cache(maxsize=None)
def fb(n):
    if n <= 1:
        return n
    return fb(n - 1) + fb(n - 2)`,
  },
  {
    id: "concat-vs-join",
    title: "String concat vs join",
    story: "Every += builds a brand-new string. The join builds once. A classic hidden quadratic.",
    labelA: "s += x (O(n²))",
    labelB: "''.join (O(n))",
    sizes: [500, 1000, 2000, 4000, 8000],
    code: `def fa(n):
    s = ""
    for _ in range(n):
        s += "x"
    return s

def fb(n):
    return "".join("x" for _ in range(n))`,
  },
]

type Row = [number, number, number]

function classify(rows: Row[], pick: 1 | 2): string {
  const ratios: number[] = []
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1][pick]
    const curr = rows[i][pick]
    if (prev > 2 && curr > 2) ratios.push(curr / prev)
  }
  if (!ratios.length) return "not enough signal — try larger sizes"
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
  if (avg < 1.3) return "flat — constant time O(1)"
  if (avg < 1.8) return "slow growth — logarithmic-ish O(log n)"
  if (avg < 2.6) return "doubles with n — linear O(n)"
  if (avg < 3.5) return "a bit worse than linear — likely O(n log n)"
  return "much worse than doubling — quadratic O(n²) or beyond"
}

function buildHarness(code: string, sizes: number[]): string {
  return `${code}

import json, time

sizes = ${JSON.stringify(sizes)}
results = []
for n in sizes:
    row = [n]
    start = time.perf_counter()
    fa(n)
    row.append(round((time.perf_counter() - start) * 1000, 2))
    start = time.perf_counter()
    fb(n)
    row.append(round((time.perf_counter() - start) * 1000, 2))
    results.append(row)
    if row[1] > 600 or row[2] > 600:
        break
print("TIMING " + json.dumps(results))`
}

function parseTimings(output: string): Row[] | null {
  const line = output.split("\n").find(l => l.startsWith("TIMING "))
  if (!line) return null
  try {
    const parsed = JSON.parse(line.slice(7)) as unknown[]
    const rows = parsed.filter(r => Array.isArray(r) && r.length >= 3) as Row[]
    return rows.length ? rows : null
  } catch {
    return null
  }
}

function TimingChart({ rows, labelA, labelB }: { rows: Row[]; labelA: string; labelB: string }) {
  const W = 320
  const H = 190
  const padX = 34
  const padY = 18
  const maxMs = Math.max(...rows.map(r => Math.max(r[1], r[2])), 1)
  const px = (i: number) => padX + (i / (rows.length - 1 || 1)) * (W - padX - 10)
  const py = (ms: number) => H - padY - (ms / maxMs) * (H - padY * 2)
  const line = (pick: 1 | 2) => rows.map((r, i) => `${px(i)},${py(r[pick])}`).join(" ")
  return (
    <div className="complexity-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Runtime vs input size chart">
        {[0, 0.5, 1].map(t => (
          <g key={t}>
            <line x1={padX} x2={W - 10} y1={py(maxMs * t)} y2={py(maxMs * t)} className="complexity-gridline" />
            <text x={padX - 4} y={py(maxMs * t) + 2.5} className="complexity-axis" textAnchor="end">{Math.round(maxMs * t)}</text>
          </g>
        ))}
        {rows.map((r, i) => (
          <text key={r[0]} x={px(i)} y={H - 5} className="complexity-axis" textAnchor="middle">{r[0]}</text>
        ))}
        <polyline points={line(1)} className="complexity-line line-a" />
        <polyline points={line(2)} className="complexity-line line-b" />
        {rows.map((r, i) => (
          <g key={r[0]}>
            <circle cx={px(i)} cy={py(r[1])} r={3} className="complexity-dot dot-a" />
            <circle cx={px(i)} cy={py(r[2])} r={3} className="complexity-dot dot-b" />
          </g>
        ))}
        <text x={padX} y={9} className="complexity-axis">ms</text>
        <text x={W - 10} y={H - padY + 12} className="complexity-axis" textAnchor="end">n</text>
      </svg>
      <div className="complexity-legend">
        <span><i className="legend-dot dot-a" /> {labelA}: {classify(rows, 1)}</span>
        <span><i className="legend-dot dot-b" /> {labelB}: {classify(rows, 2)}</span>
      </div>
    </div>
  )
}

export default function ComplexityLabPage() {
  const [experimentId, setExperimentId] = useState(EXPERIMENTS[0].id)
  const [customMode, setCustomMode] = useState(false)
  const [code, setCode] = useState(EXPERIMENTS[0].code)
  const [output, setOutput] = useState("")
  const [rows, setRows] = useState<Row[] | null>(null)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const experiment = EXPERIMENTS.find(entry => entry.id === experimentId) ?? EXPERIMENTS[0]

  useEffect(() => {
    if (!customMode) setCode(experiment.code)
  }, [customMode, experiment])

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault()
      const target = event.currentTarget
      const start = target.selectionStart
      setCode(code.slice(0, start) + "    " + code.slice(target.selectionEnd))
      requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 4 })
    }
  }

  const run = async () => {
    setRunning(true)
    setRows(null)
    setOutput("Timing in the worker…")
    const started = performance.now()
    try {
      const result = await runScript(buildHarness(code, customMode ? [200, 400, 800, 1600, 3200, 6400] : experiment.sizes), "", "")
      if (result.error) {
        setOutput(`Error: ${result.error}`)
        return
      }
      const parsed = parseTimings(result.output)
      if (!parsed) {
        setOutput(result.output || "No timing data — make sure fa(n) and fb(n) are defined.")
        return
      }
      setRows(parsed)
      setOutput(result.output.split("\n").filter(l => !l.startsWith("TIMING ")).join("\n").trim())
    } catch (error) {
      setOutput("Error: " + (error instanceof Error ? error.message : "run failed"))
    } finally {
      setElapsed(performance.now() - started)
      setRunning(false)
    }
  }

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">COMPLEXITY LAB / EMPIRICAL BIG-O</span>
          <h1>Don&apos;t memorize Big-O. Measure it.</h1>
          <p>Pick a duel — or write your own fa(n) and fb(n) — and the lab times real executions at growing sizes, plots the curve, and calls the growth class.</p>
        </div>
      </section>

      <section className="super-field" aria-label="Experiment picker">
        <span>Experiment</span>
        <div className="complexity-picker">
          {EXPERIMENTS.map(entry => (
            <button key={entry.id} type="button" className={`super-ghost${!customMode && experimentId === entry.id ? " active-example" : ""}`} onClick={() => { setCustomMode(false); setExperimentId(entry.id); setRows(null); setOutput(""); setElapsed(null) }}>{entry.title}</button>
          ))}
          <button type="button" className={`super-ghost${customMode ? " active-example" : ""}`} onClick={() => { setCustomMode(true); setCode(CUSTOM_STARTER); setRows(null); setOutput(""); setElapsed(null) }}>Custom</button>
        </div>
      </section>

      <section className="complexity-story">
        <strong>{customMode ? "Your own duel" : experiment.title}</strong>
        <p>{customMode ? "Define fa(n) — and optionally fb(n) — doing work of size n. The lab times both at 200 through 6400 and plots the race." : experiment.story}</p>
      </section>

      <div className="ed-wrap">
        <div className="ed-bar"><span className="ed-lang">Python</span><span className="ed-file">{customMode ? "my-experiment.py" : `${experiment.id}.py`}</span><span className="ready">fa(n) + fb(n)</span></div>
        <textarea ref={textRef} value={code} onChange={event => setCode(event.target.value)} onKeyDown={onKeyDown} className="ed complexity-ed" spellCheck={false} aria-label="Experiment code" />
      </div>

      <div className="acts" aria-label="Lab actions">
        <button type="button" onClick={run} disabled={running} className="btn btn-p primary-run">{running ? "Measuring..." : "▶ Measure"}</button>
        {!customMode && <button type="button" onClick={() => setCode(experiment.code)} className="btn">Reset code</button>}
      </div>

      {running && <div className="run-shimmer" aria-hidden="true" />}

      {rows && <TimingChart rows={rows} labelA={customMode ? "fa(n)" : experiment.labelA} labelB={customMode ? "fb(n)" : experiment.labelB} />}

      {output && <pre className="out">{output}</pre>}
      {elapsed != null && !running && <p className="playground-elapsed">measured in {(elapsed / 1000).toFixed(2)}s — timings are real worker executions; tiny sizes are noisy, trust the trend.</p>}
    </main>
  )
}
