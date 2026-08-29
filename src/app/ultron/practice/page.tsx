"use client"

import { useState, useEffect, useRef } from "react"
import { STAGES_ULTRON, PROBLEMS_ULTRON } from "@/data/ultron"
import MobileProblemNav from "@/components/mobile-problem-nav"
import { loadWorkbenchProgress, saveWorkbenchProgress } from "@/persistence/workbench-progress"
import { loadTheoryNote, saveTheoryNote } from "@/persistence/theory-notes"
import { runScript, warmPython } from "@/execution/pyodide-client"

export default function UltronPracticePage() {
  const [currentId, setCurrentId] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [theoryNote, setTheoryNote] = useState("")
  const [savedCode, setSavedCode] = useState<Record<number, string>>({})
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const executionRef = useRef<AbortController | null>(null)

  const problem = PROBLEMS_ULTRON.find(p => p.id === currentId) || PROBLEMS_ULTRON[0]
  const doneSet = new Set(completed)
  const hints = hintLevel[currentId] || 0
  const isRevealed = revealed[currentId] || false
  const currentCode = savedCode[currentId] || problem.starterCode

  useEffect(() => () => executionRef.current?.abort(), [])

  // Warm the sandbox (NumPy ships inside Pyodide — no extra package load).
  useEffect(() => { warmPython(false, true) }, [])

  useEffect(() => {
    const saved = loadWorkbenchProgress("ultron")
    const requested = Number(new URLSearchParams(window.location.search).get("problem"))
    const nextId = PROBLEMS_ULTRON.some(problem => problem.id === requested)
      ? requested
      : PROBLEMS_ULTRON.some(problem => problem.id === saved.currentId)
        ? saved.currentId
        : PROBLEMS_ULTRON[0].id
    setCurrentId(nextId)
    setCompleted(saved.completed.filter(id => PROBLEMS_ULTRON.some(problem => problem.id === id)))
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    saveWorkbenchProgress("ultron", { currentId, completed })
  }, [completed, currentId, hydrated])
  useEffect(() => {
    if (!hydrated) return
    setTheoryNote(loadTheoryNote(`ultron:${currentId}`))
  }, [currentId, hydrated])

  useEffect(() => {
    try {
      const s = localStorage.getItem("deriva-ultron-code")
      if (s) setSavedCode(JSON.parse(s))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem("deriva-ultron-code", JSON.stringify(savedCode)) }, [savedCode])

  const runCode = async () => {
    setRunning(true); setOutput("Running in a protected worker…")
    const controller = new AbortController()
    executionRef.current?.abort()
    executionRef.current = controller
    try {
      const result = await runScript(currentCode, problem.testCode, DEPS, { signal: controller.signal })
      if (result.error) setOutput(`Error: ${result.error}`)
      else setOutput(result.output)
      if (!result.error && result.output.includes("All tests passed!")) {
        setCompleted(prev => prev.includes(currentId) ? prev : [...prev, currentId])
      }
    } catch (e: any) {
      if (!controller.signal.aborted) setOutput("Error: " + e.message)
    } finally {
      if (executionRef.current === controller) executionRef.current = null
      setRunning(false)
    }
  }

  const navigate = (dir: 1 | -1) => {
    const idx = PROBLEMS_ULTRON.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < PROBLEMS_ULTRON.length) { setCurrentId(PROBLEMS_ULTRON[next].id); setOutput("") }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode() }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [currentId, currentCode])

  const pct = Math.round((completed.length / PROBLEMS_ULTRON.length) * 100)
  const nextProblem = PROBLEMS_ULTRON[PROBLEMS_ULTRON.findIndex(item => item.id === currentId) + 1]

  return (
    <div className="ultron-wrap">
      <nav className="sidebar">
        {STAGES_ULTRON.map(stage => {
          const sp = PROBLEMS_ULTRON.filter(p => p.stage === stage.id)
          return (
            <div key={stage.id}>
              <div className="stage-head">{stage.name} <span className="stage-desc">{stage.desc}</span></div>
              {sp.map(p => (
                <button key={p.id} onClick={() => { setCurrentId(p.id); setOutput("") }}
                  className={`prob-row${currentId === p.id ? " active" : ""}${doneSet.has(p.id) ? " done" : ""}`}>
                  <span className="dot">{doneSet.has(p.id) ? "✓" : p.id}</span>
                  <span className="prob-name">{p.title}</span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <main className="main">
        <div className="mobile-only">
          <MobileProblemNav
            stages={STAGES_ULTRON}
            problems={PROBLEMS_ULTRON}
            currentId={currentId}
            done={doneSet}
            onSelect={(id) => { setCurrentId(id); setOutput("") }}
          />
        </div>
        <header className="prob-header">
          <span className="prob-num">{currentId}</span>
          <div style={{ flex: 1 }}>
            <h2 className="prob-h2">{problem.title}</h2>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span className="tag tp">{problem.pattern}</span>
              <span className="tag ts">{problem.skill}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate(-1)} disabled={currentId <= 1} className="btn">←</button>
            <button onClick={() => navigate(1)} disabled={currentId >= PROBLEMS_ULTRON.length} className="btn">→</button>
          </div>
        </header>

        <div className="pbar"><div className="pbar-track"><div className="pbar-fill" style={{ width: pct+"%" }} /></div><span className="pbar-label">{completed.length}/{PROBLEMS_ULTRON.length}</span></div>

        <div className="card">
          <h3 className="card-h3">Problem</h3>
          <p className="stmt">{problem.statement}</p>
          <div className="ex-grid">
            {problem.examples.map((ex, i) => (
              <div key={i} className="ex-box"><strong>Example {i+1}:</strong> {ex.input} → {ex.output}{ex.explain && <><br/><span className="mu">{ex.explain}</span></>}</div>
            ))}
          </div>
        </div>

        <div className="why"><span className="why-lbl">Why this matters</span>{problem.why}</div>

        <div className="theory-card">
          <div><span className="theory-kicker">Your theory book</span><h3>What will you remember about this move?</h3></div>
          <textarea value={theoryNote} onChange={event => { setTheoryNote(event.target.value); saveTheoryNote(`ultron:${currentId}`, event.target.value) }} placeholder="Name the rule, the gotcha, or the shape you want to recall under pressure…" aria-label="Your theory note for this AI/ML problem" />
          <span className="theory-hint">A sentence in your own words survives longer than a re-read formula.</span>
        </div>

        <div className="ed-wrap">
           <div className="ed-bar"><span className="ed-lang">Python + NumPy</span><span className="ed-file">drill.py</span><span className="ready">Worker sandbox</span></div>
          <textarea value={currentCode} onChange={e => setSavedCode({ ...savedCode, [currentId]: e.target.value })} className="ed" spellCheck={false} />
        </div>

        <div className="acts">
          <button onClick={runCode} disabled={running} className="btn btn-p">{running ? "Running..." : "▶ Run Tests"}</button>
          <button onClick={() => setHintLevel({ ...hintLevel, [currentId]: Math.min(hints+1, 3) })} disabled={hints>=3} className="btn">Hint ({hints}/3)</button>
          <button onClick={() => setRevealed({ ...revealed, [currentId]: !isRevealed })} className={`btn${isRevealed?" btn-s":""}`}>{isRevealed?"Hide":"Show"} Solution</button>
          <button onClick={() => { setSavedCode({ ...savedCode, [currentId]: problem.starterCode }); setOutput("") }} className="btn">Reset</button>
        </div>

        {output && <pre className="out">{output}</pre>}

        {doneSet.has(currentId) && <aside className="learning-checkpoint" aria-label="Learning checkpoint">
          <span className="completion-mark">✓</span>
          <div><span className="completion-kicker">Learning checkpoint</span><strong>Keep the move, not the numbers.</strong><p>You practiced <em>{problem.pattern}</em>. The next drill should reuse the shape under different data.</p></div>
          {nextProblem ? <button className="completion-next" onClick={() => navigate(1)}>Next drill →</button> : <a href="/ultron" className="completion-next">Ultron Ladder →</a>}
        </aside>}

        {hints > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <h3 className="card-h3">Hints</h3>
            {problem.hints.slice(0, hints).map((h, i) => (
              <div key={i} className="hint-row"><span className="hint-b">{i+1}</span> {h}</div>
            ))}
          </div>
        )}

        {isRevealed && (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="solution-head">
              <h3 className="card-h3">Solution</h3>
              <button
                className="btn btn-load"
                onClick={() => {
                  setSavedCode({ ...savedCode, [currentId]: problem.solution })
                  setOutput("Solution loaded into the editor — run it, then rewrite it from memory.")
                }}
                aria-label="Load solution into the editor"
              >Load into editor</button>
            </div>
            <pre className="sol">{problem.solution}</pre>
            <h3 className="card-h3" style={{ marginTop: 16 }}>Walkthrough</h3>
            <div className="wlk">{problem.walkthrough}</div>
          </div>
        )}

        <div className="kbd">← → navigate &nbsp; ⌘+Enter run</div>
      </main>

      <style>{`
        .ultron-wrap { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 48px); background: var(--paper); color: var(--ink); overflow: hidden; font-family: var(--font-ui); }
        .sidebar { overflow-y: auto; padding: 16px 12px; border-right: 1px solid var(--line); }
        .stage-head { margin: 14px 4px 6px; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
        .stage-desc { color: var(--ink-soft); font-weight: 500; letter-spacing: 0; text-transform: none; margin-left: 4px; }
        .prob-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 8px; border: none; border-radius: 8px; background: none; color: var(--ink); font-size: 12px; text-align: left; cursor: pointer; }
        .prob-row:hover { background: var(--paper-raised); }
        .prob-row.active { background: var(--accent-soft); }
        .prob-row.done .prob-name { color: var(--viz-settled); }
        .dot { display: grid; width: 20px; height: 20px; flex: 0 0 auto; place-items: center; border: 1px solid var(--line); border-radius: 50%; font-size: 9px; font-weight: 700; color: var(--ink-soft); }
        .prob-row.done .dot { background: var(--viz-settled); border-color: var(--viz-settled); color: var(--paper-raised); }
        .prob-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .main { overflow-y: auto; padding: 20px 24px 60px; }
        .prob-header { display: flex; align-items: center; gap: 12px; }
        .prob-num { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); border-radius: 10px; background: var(--accent-soft); color: var(--accent); font: 700 14px var(--font-mono); }
        .prob-h2 { margin: 0; font: 700 22px var(--font-narrative); letter-spacing: -.01em; }
        .tag { padding: 2px 8px; border-radius: 999px; font: 700 10px var(--font-mono); }
        .tp { background: var(--accent-soft); color: var(--accent); }
        .ts { background: var(--paper-raised); color: var(--ink-soft); border: 1px solid var(--line); }
        .pbar { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
        .pbar-track { flex: 1; height: 6px; border-radius: 999px; background: var(--line); overflow: hidden; }
        .pbar-fill { height: 100%; border-radius: inherit; background: var(--accent); transition: width var(--dur-slow) var(--ease-standard); }
        .pbar-label { font: 700 11px var(--font-mono); color: var(--ink-soft); }
        .card { padding: 16px 18px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 2px); background: var(--paper-raised); box-shadow: var(--shadow-raised); margin-bottom: 14px; }
        .card-h3 { margin: 0 0 10px; font: 700 12px var(--font-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--accent); }
        .stmt { margin: 0; font-size: 14px; line-height: 1.65; white-space: pre-wrap; }
        .ex-grid { display: grid; gap: 8px; margin-top: 12px; }
        .ex-box { padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); font: 12px/1.6 var(--font-mono); }
        .mu { color: var(--ink-soft); }
        .why { display: flex; gap: 10px; align-items: baseline; padding: 12px 16px; margin-bottom: 14px; border-left: 3px solid var(--accent); border-radius: 6px; background: var(--accent-soft); font-size: 13px; line-height: 1.6; }
        .why-lbl { flex: 0 0 auto; font: 800 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
        .theory-card { padding: 14px 16px; margin-bottom: 14px; border: 1px solid var(--line); border-radius: calc(var(--radius) + 2px); background: var(--paper-raised); }
        .theory-card h3 { margin: 2px 0 8px; font: 700 14px var(--font-narrative); }
        .theory-kicker { font: 800 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
        .theory-card textarea { width: 100%; min-height: 56px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink); font: 13px/1.5 var(--font-ui); resize: vertical; }
        .theory-hint { display: block; margin-top: 6px; color: var(--ink-soft); font-size: 11px; }
        .ed-wrap { border: 1px solid var(--line); border-radius: calc(var(--radius) + 2px); overflow: hidden; background: var(--paper); margin-bottom: 10px; }
        .ed-bar { display: flex; gap: 12px; padding: 8px 14px; border-bottom: 1px solid var(--line); background: var(--paper-raised); font: 700 10px var(--font-ui); letter-spacing: .06em; }
        .ed-lang { color: var(--accent); }
        .ed-file, .ready { color: var(--ink-soft); font-weight: 500; }
        .ready { margin-left: auto; }
        .ed { width: 100%; min-height: 220px; max-height: 450px; background: var(--paper); color: var(--ink); border: none; outline: none; resize: vertical; padding: 12px 16px; font-family: var(--font-mono); font-size: 14px; line-height: 1.65; tab-size: 4; white-space: pre; overflow: auto; }
        .acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; margin-bottom: 14px; }
        .btn { background: var(--paper-raised); color: var(--ink); border: 1px solid var(--line); padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font-ui); }
        .btn:hover:not(:disabled) { border-color: var(--accent); }
        .btn:disabled { opacity: 0.4; cursor: default; }
        .btn-p { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
        .btn-s { background: var(--success-soft); color: var(--viz-settled); border-color: var(--success-line); }
        .solution-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .btn-load { min-height: 32px; padding: 5px 12px; font-size: 11px; font-weight: 700; border: 1px solid var(--accent); color: var(--accent); background: var(--paper-raised); }
        .btn-load:hover { background: var(--accent); color: #fff; }
        .out { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; min-height: 50px; max-height: 250px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 14px; }
        .hint-row { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; font-size: 13px; }
        .hint-b { background: var(--accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
        .sol { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; overflow-x: auto; white-space: pre; }
        .wlk { font-size: 13px; line-height: 1.7; color: var(--ink); white-space: pre-wrap; }
        .kbd { margin-top: 18px; color: var(--ink-soft); font: 11px var(--font-mono); }
        .learning-checkpoint { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1px solid var(--success-line); border-radius: calc(var(--radius) + 2px); background: var(--success-soft); }
        .completion-mark { display: grid; width: 26px; height: 26px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--viz-settled); color: var(--paper-raised); font-weight: 800; }
        .completion-kicker { display: block; font: 800 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--viz-settled); }
        .learning-checkpoint strong { font: 700 14px var(--font-narrative); }
        .learning-checkpoint p { margin: 4px 0 0; font-size: 12px; color: var(--ink-soft); }
        .completion-next { margin-left: auto; flex: 0 0 auto; align-self: center; padding: 8px 14px; border: 1px solid var(--success-line); border-radius: 999px; background: var(--paper-raised); color: var(--ink); font: 700 12px var(--font-ui); cursor: pointer; text-decoration: none; }
        .completion-next:hover { border-color: var(--viz-settled); }
        @media (max-width: 800px) {
          .ultron-wrap { display: block; height: auto; overflow: visible; }
          .sidebar { display: none; }
          .main { padding: 12px 14px 40px; }
          .prob-h2 { font-size: 18px; }
          .prob-header > div:last-child .btn { flex: 1; min-height: 44px; }
        }
        @media (max-width: 640px) {
          .ex-grid { grid-template-columns: 1fr; }
          .acts .btn { min-height: 46px; }
          .acts .btn-p { grid-column: 1 / -1; }
        }
        @media (min-width: 801px) {
          .mobile-only { display: none; }
        }
      `}</style>
    </div>
  )
}

// Shared frozen worlds: single source of truth for every dataset the ladder
// touches. All values are literals (or a version-stable RandomState stream),
// so tests assert the same numbers in Pyodide and in local verification.
const DEPS = `
import numpy as np

def line_world():
    x = np.array([-2.4, -2.1, -1.7, -1.3, -0.9, -0.5, -0.2, 0.1, 0.5, 0.9,
                   1.2, 1.6, 2.0, 2.3, 2.7, 3.1, 3.4, -1.9, -0.1, 0.7,
                   1.4, 2.5, -1.5, 1.9])
    noise = np.array([ 0.31, -0.22, 0.15, -0.28, 0.09, 0.24, -0.18, 0.12, -0.25,
                       0.20, -0.14, 0.27, -0.21, 0.11, -0.30, 0.16, -0.09, 0.23,
                       -0.17, 0.29, -0.26, 0.13, 0.19, -0.24])
    y = 3.0 * x + 2.0 + noise
    return x, y

def valley_world():
    x = np.array([-0.1, 0.08, -0.06, 0.1, -0.09, 0.05, -0.04, 0.07, -0.1,
                  0.09, -0.05, 0.06])
    noise = np.array([0.04, -0.03, 0.05, -0.04, 0.02, -0.05, 0.03, -0.02,
                      0.04, -0.03, 0.02, -0.03])
    y = 30.0 * x + 2.0 + noise
    return x, y

def quad_world():
    x_tr = np.linspace(-1.0, 1.0, 9)
    noise_tr = np.array([0.12, -0.09, 0.15, -0.11, 0.08, -0.14, 0.10, -0.07, 0.13])
    y_tr = 0.8 * x_tr ** 2 - 0.5 * x_tr + 1.0 + noise_tr
    x_te = np.array([-0.9, -0.35, 0.15, 0.6, 0.95])
    noise_te = np.array([-0.10, 0.14, -0.08, 0.12, -0.13])
    y_te = 0.8 * x_te ** 2 - 0.5 * x_te + 1.0 + noise_te
    return x_tr, y_tr, x_te, y_te

def exam_world():
    X = np.array([[1.0, 4.0], [2.0, 3.0], [3.0, 2.0], [1.0, 5.0], [2.0, 2.0],
                  [4.0, 3.0], [3.0, 7.0], [4.0, 5.0], [5.0, 4.0], [4.0, 7.0],
                  [5.0, 6.0], [6.0, 5.0]])
    y = np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0])
    return X, y

def spam_world():
    scores = np.array([0.98, 0.68, 0.55, 0.93, 0.52, 0.91, 0.31, 0.14, 0.08,
                       0.22, 0.05, 0.02])
    y = np.array([1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0])
    return scores, y

def house_world():
    beds = np.array([1, 2, 2, 3, 3, 3, 4, 4])
    age = np.array([35, 12, 40, 5, 28, 15, 8, 22])
    price = np.array([61500.0, 98500.0, 102300.0, 141200.0, 137800.0, 143400.0,
                      179900.0, 182600.0])
    return beds, age, price

def cluster_world():
    P = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0],
                  [10.0, 10.0], [10.0, 11.0], [11.0, 10.0]])
    return P

def tree_world():
    x = np.array([1, 2, 3, 4, 5, 6, 7, 8])
    t = np.array([0, 0, 1, 0, 1, 1, 1, 1])
    return x, t

def fraud_world():
    rs = np.random.RandomState(7)
    n = 200
    amount = 80.0 + rs.rand(n) * 500.0
    hour = 6.0 + rs.rand(n) * 17.0
    device = (rs.rand(n) < 0.25).astype(float)
    y = np.zeros(n)
    fraud_idx = rs.choice(n, 10, replace=False)
    amount[fraud_idx] = 900.0 + rs.rand(10) * 700.0
    hour[fraud_idx] = rs.rand(10) * 5.0
    device[fraud_idx] = 1.0
    y[fraud_idx] = 1.0
    X = np.column_stack([amount, hour, device])
    return X, y

def net_world():
    X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
    y4 = np.array([0.0, 1.0, 1.0, 0.0])
    return X, y4

def net_init():
    W1 = np.zeros((2, 4))
    b1 = np.array([0.1, -0.1, 0.05, 0.0])
    W2 = np.array([[0.4], [-0.4], [0.5], [-0.5]])
    b2 = np.array([0.0])
    return W1, b1, W2, b2
`
