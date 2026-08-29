"use client"

import { useState, useEffect, useRef } from "react"
import { STAGES_DB, PROBLEMS_DB } from "@/data/db"
import MobileProblemNav from "@/components/mobile-problem-nav"
import { loadWorkbenchProgress, saveWorkbenchProgress } from "@/persistence/workbench-progress"
import { loadTheoryNote, saveTheoryNote } from "@/persistence/theory-notes"
import { runScript, warmPython } from "@/execution/pyodide-client"

export default function DBPracticePage() {
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

  const problem = PROBLEMS_DB.find(p => p.id === currentId) || PROBLEMS_DB[0]
  const doneSet = new Set(completed)
  const hints = hintLevel[currentId] || 0
  const isRevealed = revealed[currentId] || false
  const currentCode = savedCode[currentId] || problem.starterCode

  useEffect(() => () => executionRef.current?.abort(), [])

  // Warm the sandbox (Pyodide + the sqlite3 package) while the user reads the
  // problem — the first Run should execute, not download.
  useEffect(() => { warmPython(true) }, [])

  useEffect(() => {
    const saved = loadWorkbenchProgress("db")
    const requested = Number(new URLSearchParams(window.location.search).get("problem"))
    const nextId = PROBLEMS_DB.some(problem => problem.id === requested)
      ? requested
      : PROBLEMS_DB.some(problem => problem.id === saved.currentId)
        ? saved.currentId
        : PROBLEMS_DB[0].id
    setCurrentId(nextId)
    setCompleted(saved.completed.filter(id => PROBLEMS_DB.some(problem => problem.id === id)))
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    saveWorkbenchProgress("db", { currentId, completed })
  }, [completed, currentId, hydrated])
  useEffect(() => {
    if (!hydrated) return
    setTheoryNote(loadTheoryNote(`db:${currentId}`))
  }, [currentId, hydrated])

  useEffect(() => {
    try {
      const s = localStorage.getItem("deriva-db-code")
      if (s) setSavedCode(JSON.parse(s))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem("deriva-db-code", JSON.stringify(savedCode)) }, [savedCode])

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
    const idx = PROBLEMS_DB.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < PROBLEMS_DB.length) { setCurrentId(PROBLEMS_DB[next].id); setOutput("") }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode() }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [currentId, currentCode])

  const pct = Math.round((completed.length / PROBLEMS_DB.length) * 100)
  const nextProblem = PROBLEMS_DB[PROBLEMS_DB.findIndex(item => item.id === currentId) + 1]

  return (
    <div className="db-wrap">
      <nav className="sidebar">
        {STAGES_DB.map(stage => {
          const sp = PROBLEMS_DB.filter(p => p.stage === stage.id)
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
            stages={STAGES_DB}
            problems={PROBLEMS_DB}
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
            <button onClick={() => navigate(1)} disabled={currentId >= PROBLEMS_DB.length} className="btn">→</button>
          </div>
        </header>

        <div className="pbar"><div className="pbar-track"><div className="pbar-fill" style={{ width: pct+"%" }} /></div><span className="pbar-label">{completed.length}/{PROBLEMS_DB.length}</span></div>

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
          <textarea value={theoryNote} onChange={event => { setTheoryNote(event.target.value); saveTheoryNote(`db:${currentId}`, event.target.value) }} placeholder="Name the rule, the gotcha, or the shape you want to recall under pressure…" aria-label="Your theory note for this database problem" />
          <span className="theory-hint">A sentence in your own words survives longer than a re-read query.</span>
        </div>

        <div className="ed-wrap">
           <div className="ed-bar"><span className="ed-lang">SQL over SQLite</span><span className="ed-file">query.py</span><span className="ready">Worker sandbox</span></div>
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
          <div><span className="completion-kicker">Learning checkpoint</span><strong>Keep the move, not the query.</strong><p>You practiced <em>{problem.pattern}</em>. The next question should reuse the shape under different tables.</p></div>
          {nextProblem ? <button className="completion-next" onClick={() => navigate(1)}>Next query →</button> : <a href="/db" className="completion-next">DB Ladder →</a>}
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
        .db-wrap { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 48px); background: var(--paper); color: var(--ink); overflow: hidden; font-family: var(--font-ui); }
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
          .db-wrap { display: block; height: auto; overflow: visible; }
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

// Shared mini-worlds: single source of truth for schema + seed data.
// Every problem's starter calls one of these builders; tests rely on
// these exact rows, so treat them as frozen curriculum constants.
const DEPS = `
import sqlite3

def shop_db():
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, signed_up TEXT)")
    con.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total REAL, status TEXT, placed_at TEXT, delivered_at TEXT)")
    con.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL)")
    con.executemany("INSERT INTO customers VALUES (?,?,?,?)", [
        (1,'Ana','Pune','2023-11-02'),(2,'Bilal','Delhi','2023-12-14'),
        (3,'Chen','Mumbai','2024-01-09'),(4,'Diya','Pune','2024-02-11'),
        (5,'Eshan','Goa','2024-03-20')])
    con.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?)", [
        (1,1,400,'shipped','2024-01-05','2024-01-09'),
        (2,1,420,'shipped','2024-01-20',None),
        (3,2,150,'shipped','2024-02-03','2024-02-05'),
        (4,2,180,'pending','2024-02-14',None),
        (5,3,250,'shipped','2024-03-01','2024-03-04'),
        (6,4,500,'pending','2024-03-15',None)])
    con.executemany("INSERT INTO products VALUES (?,?,?,?)", [
        (1,'Wireless Earbuds','audio',4999),(2,'Bluetooth Speaker','audio',2999),
        (3,'Smart Band','wearable',3499),(4,'Wired Earphones','audio',899),
        (5,'Fitness Watch','wearable',12999),(6,'USB-C Cable','accessories',499)])
    con.execute("CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, qty INTEGER, unit_price REAL)")
    con.executemany("INSERT INTO order_items VALUES (?,?,?,?,?)", [
        (1,1,4,1,250),(2,1,6,2,75),
        (3,2,1,1,420),
        (4,3,6,1,150),
        (5,4,4,1,180),
        (6,5,2,1,250),
        (7,6,3,1,350),(8,6,6,1,150)])
    con.execute("CREATE TABLE daily_revenue (day TEXT PRIMARY KEY, revenue REAL)")
    con.executemany("INSERT INTO daily_revenue VALUES (?,?)", [
        ('2024-04-01',300),('2024-04-02',450),('2024-04-03',250),
        ('2024-04-04',600),('2024-04-05',200),('2024-04-06',500)])
    return con

def staff_db():
    con = sqlite3.connect(":memory:")
    con.execute("CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER, salary REAL)")
    con.executemany("INSERT INTO employees VALUES (?,?,?,?)", [
        (1,'Meera',None,200000),
        (2,'Arjun',1,120000),
        (3,'Kavya',1,120000),
        (4,'Rohit',2,80000),
        (5,'Sara',2,80000),
        (6,'Vikram',3,90000)])
    return con
`
