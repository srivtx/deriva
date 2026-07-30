"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { STAGES_LLD, PROBLEMS_LLD } from "@/data/lld"
import MobileProblemNav from "@/components/mobile-problem-nav"

export default function LLDPage() {
  const [currentId, setCurrentId] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])
  const [savedCode, setSavedCode] = useState<Record<number, string>>({})
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [pyLoading, setPyLoading] = useState(false)
  const pyRef = useRef<any>(null)

  const problem = PROBLEMS_LLD.find(p => p.id === currentId) || PROBLEMS_LLD[0]
  const doneSet = new Set(completed)
  const hints = hintLevel[currentId] || 0
  const isRevealed = revealed[currentId] || false
  const currentCode = savedCode[currentId] || problem.starterCode

  useEffect(() => {
    try {
      const c = localStorage.getItem("deriva-lld-completed")
      if (c) setCompleted(JSON.parse(c))
      const s = localStorage.getItem("deriva-lld-code")
      if (s) setSavedCode(JSON.parse(s))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem("deriva-lld-completed", JSON.stringify(completed)) }, [completed])
  useEffect(() => { localStorage.setItem("deriva-lld-code", JSON.stringify(savedCode)) }, [savedCode])

  const initPyodide = useCallback(async () => {
    if (pyRef.current) return true
    if (pyLoading) return false
    setPyLoading(true)
    try {
      if (!(window as any).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load Pyodide"))
          document.head.appendChild(script)
        })
      }
      const py = await (window as any).loadPyodide()
      pyRef.current = py
      setPyReady(true)
      return true
    } catch (e) {
      setOutput("Error loading Pyodide: " + (e as Error).message)
      return false
    } finally { setPyLoading(false) }
  }, [pyLoading])

  const runCode = async () => {
    setRunning(true); setOutput("Running...")
    const ready = await initPyodide()
    if (!ready) { setRunning(false); return }
    try {
      const py = pyRef.current
      // Inject prior-stage dependencies so later problems compose
      py.runPython(`import sys,io\n__lld_out=io.StringIO()\nsys.stdout=__lld_out\nsys.stderr=__lld_out`)
      // Preload entity classes from earlier stages that solutions reference
      py.runPython(DEPS)
      py.runPython(currentCode)
      py.runPython(problem.testCode)
      const out = py.runPython("__lld_out.getvalue()")
      setOutput(out || "No output.")
      if (out.includes("All tests passed!")) {
        setCompleted(prev => prev.includes(currentId) ? prev : [...prev, currentId])
      }
    } catch (e: any) { setOutput("Error: " + e.message) }
    setRunning(false)
  }

  const navigate = (dir: 1 | -1) => {
    const idx = PROBLEMS_LLD.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < PROBLEMS_LLD.length) { setCurrentId(PROBLEMS_LLD[next].id); setOutput("") }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode() }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [currentId, currentCode, pyReady])

  const pct = Math.round((completed.length / PROBLEMS_LLD.length) * 100)

  return (
    <div className="lld-wrap">
      <nav className="sidebar">
        {STAGES_LLD.map(stage => {
          const sp = PROBLEMS_LLD.filter(p => p.stage === stage.id)
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
            stages={STAGES_LLD}
            problems={PROBLEMS_LLD}
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
            <button onClick={() => navigate(1)} disabled={currentId >= PROBLEMS_LLD.length} className="btn">→</button>
          </div>
        </header>

        <div className="pbar"><div className="pbar-track"><div className="pbar-fill" style={{ width: pct+"%" }} /></div><span className="pbar-label">{completed.length}/{PROBLEMS_LLD.length}</span></div>

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

        <div className="ed-wrap">
          <div className="ed-bar"><span className="ed-lang">Python</span><span className="ed-file">design.py</span>{pyLoading && <span className="loading">Loading Pyodide...</span>}{pyReady && <span className="ready">Ready</span>}</div>
          <textarea value={currentCode} onChange={e => setSavedCode({ ...savedCode, [currentId]: e.target.value })} className="ed" spellCheck={false} />
        </div>

        <div className="acts">
          <button onClick={runCode} disabled={running} className="btn btn-p">{running ? "Running..." : "▶ Run Tests"}</button>
          <button onClick={() => setHintLevel({ ...hintLevel, [currentId]: Math.min(hints+1, 3) })} disabled={hints>=3} className="btn">Hint ({hints}/3)</button>
          <button onClick={() => setRevealed({ ...revealed, [currentId]: !isRevealed })} className={`btn${isRevealed?" btn-s":""}`}>{isRevealed?"Hide":"Show"} Solution</button>
          <button onClick={() => { setSavedCode({ ...savedCode, [currentId]: problem.starterCode }); setOutput("") }} className="btn">Reset</button>
        </div>

        {output && <pre className="out">{output}</pre>}

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
            <h3 className="card-h3">Solution</h3>
            <pre className="sol">{problem.solution}</pre>
            <h3 className="card-h3" style={{ marginTop: 16 }}>Walkthrough</h3>
            <div className="wlk">{problem.walkthrough}</div>
          </div>
        )}

        <div className="kbd">← → navigate &nbsp; ⌘+Enter run</div>
      </main>

      <style>{`
        .lld-wrap { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 48px); background: var(--paper); color: var(--ink); overflow: hidden; font-family: var(--font-ui); }
        .sidebar { border-right: 1px solid var(--line); background: var(--paper-raised); overflow-y: auto; }
        .stage-head { padding: 8px 16px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-soft); display: flex; align-items: baseline; gap: 6px; }
        .stage-desc { font-size: 9px; font-weight: 400; opacity: 0.6; }
        .prob-row { padding: 5px 16px 5px 24px; cursor: pointer; display: flex; align-items: center; gap: 8px; border: none; background: none; width: 100%; text-align: left; font-size: 13px; color: var(--ink-soft); border-left: 3px solid transparent; transition: 0.1s; }
        .prob-row:hover { background: var(--accent-soft); color: var(--ink); }
        .prob-row.active { color: var(--accent); background: var(--accent-soft); border-left-color: var(--accent); font-weight: 500; }
        .prob-row.done { color: var(--viz-settled); }
        .dot { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; color: var(--ink-soft); }
        .prob-row.done .dot { background: var(--viz-settled); border-color: var(--viz-settled); color: #fff; }
        .prob-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .main { overflow-y: auto; padding: 24px 32px 60px; }
        .prob-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .prob-num { font-size: 28px; font-family: var(--font-mono); font-weight: 800; color: var(--accent); }
        .prob-h2 { margin: 0; font-size: 22px; font-family: var(--font-narrative); }
        .tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-family: var(--font-mono); }
        .tp { color: var(--accent); background: var(--accent-soft); border: 1px solid var(--accent); }
        .ts { color: var(--viz-settled); background: #e8f5ed; border: 1px solid var(--viz-settled); }
        .pbar { display: flex; align-items: center; margin-bottom: 20px; }
        .pbar-track { flex: 1; height: 6px; background: var(--line); border-radius: 3px; overflow: hidden; }
        .pbar-fill { height: 100%; background: var(--accent); transition: width 0.4s; }
        .pbar-label { font-size: 12px; color: var(--ink-soft); font-family: var(--font-mono); margin-left: 10px; }
        .card { background: var(--paper-raised); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 14px; box-shadow: var(--shadow-raised); }
        .card-h3 { margin: 0 0 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-soft); }
        .stmt { font-size: 15px; line-height: 1.7; font-family: var(--font-narrative); }
        .ex-grid { margin-top: 12px; display: grid; gap: 8px; }
        .ex-box { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; }
        .mu { color: var(--ink-soft); }
        .why { background: var(--accent-soft); border: 1px solid var(--accent); border-radius: var(--radius); padding: 14px; margin-bottom: 14px; font-size: 14px; line-height: 1.7; font-family: var(--font-narrative); }
        .why-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); display: block; margin-bottom: 4px; }
        .ed-wrap { border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-raised); }
        .ed-bar { background: var(--paper); padding: 6px 12px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 8px; font-size: 11px; }
        .ed-lang { color: var(--accent); font-weight: 600; }
        .ed-file { color: var(--ink-soft); font-family: var(--font-mono); font-size: 11px; }
        .loading { color: var(--accent); font-size: 11px; }
        .ready { color: var(--viz-settled); font-size: 11px; }
        .ed { width: 100%; min-height: 220px; max-height: 450px; background: var(--paper); color: var(--ink); border: none; outline: none; resize: vertical; padding: 12px 16px; font-family: var(--font-mono); font-size: 14px; line-height: 1.65; tab-size: 4; white-space: pre; overflow: auto; }
        .acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; margin-bottom: 14px; }
        .btn { background: var(--paper-raised); color: var(--ink); border: 1px solid var(--line); padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font-ui); }
        .btn:hover:not(:disabled) { border-color: var(--accent); }
        .btn:disabled { opacity: 0.4; cursor: default; }
        .btn-p { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
        .btn-s { background: #e8f5ed; color: var(--viz-settled); border-color: var(--viz-settled); }
        .out { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; min-height: 50px; max-height: 250px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 14px; }
        .hint-row { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; font-size: 13px; }
        .hint-b { background: var(--accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
        .sol { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; overflow-x: auto; white-space: pre; }
        .wlk { font-size: 14px; line-height: 1.8; font-family: var(--font-narrative); }
        .kbd { text-align: center; color: var(--ink-soft); font-size: 11px; margin-top: 16px; font-family: var(--font-mono); }
        @media (max-width: 800px) {
          .lld-wrap { grid-template-columns: 1fr; }
          .sidebar { display: none; }
          .main { padding: 14px 14px 60px; }
          .mobile-only { display: block; }
          .prob-num { font-size: 22px; }
          .prob-h2 { font-size: 18px; }
          .ed { min-height: 180px; font-size: 13px; }
        }
        @media (min-width: 801px) {
          .mobile-only { display: none; }
        }
      `}</style>
    </div>
  )
}

// Cross-stage dependencies: solutions from earlier problems that later problems compose
const DEPS = `
class ParkingSpot:
    def __init__(self, spot_id, floor, spot_type):
        self.spot_id = spot_id
        self.floor = floor
        self.spot_type = spot_type
        self.is_occupied = False
    def __repr__(self):
        status = 'occupied' if self.is_occupied else 'free'
        return f'ParkingSpot({self.spot_id}, floor={self.floor}, {self.spot_type}, {status})'

class Vehicle:
    def __init__(self, license_plate, vehicle_type):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Bike(Vehicle):
    def __init__(self, license_plate):
        super().__init__(license_plate, 'bike')

class Car(Vehicle):
    def __init__(self, license_plate):
        super().__init__(license_plate, 'car')

class Truck(Vehicle):
    def __init__(self, license_plate):
        super().__init__(license_plate, 'truck')

import time as _time

class Ticket:
    def __init__(self, ticket_id, license_plate, spot_id, entry_time=None):
        self.ticket_id = ticket_id
        self.license_plate = license_plate
        self.spot_id = spot_id
        self.entry_time = entry_time if entry_time is not None else _time.time()
    def hours_parked(self, now):
        return (now - self.entry_time) / 3600

class Book:
    def __init__(self, isbn, title, author):
        self.isbn = isbn
        self.title = title
        self.author = author

class BookCopy:
    def __init__(self, copy_id, book):
        self.copy_id = copy_id
        self.book = book
        self.status = 'available'

class Elevator:
    def __init__(self, eid):
        self.eid = eid
        self.current_floor = 0
        self.direction = 'idle'
        self.is_door_open = False
    def move_to(self, floor):
        if floor > self.current_floor:
            self.direction = 'up'
        elif floor < self.current_floor:
            self.direction = 'down'
        else:
            self.direction = 'idle'
        self.current_floor = floor

import math as _math

class FeeCalculator:
    RATES = {'bike': 10, 'car': 20, 'truck': 40}
    def calculate(self, hours, vehicle_type):
        if vehicle_type not in self.RATES:
            raise ValueError(f'Unknown vehicle type: {vehicle_type}')
        billed = max(1, _math.ceil(hours))
        return billed * self.RATES[vehicle_type]
`
