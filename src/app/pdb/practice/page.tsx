"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { STAGES_PDB, PROBLEMS_PDB } from "@/data/pdb"
import MobileProblemNav from "@/components/mobile-problem-nav"
import { loadWorkbenchProgress, saveWorkbenchProgress } from "@/persistence/workbench-progress"
import { loadTheoryNote, saveTheoryNote } from "@/persistence/theory-notes"
import { runScript, warmPython } from "@/execution/pyodide-client"

// Shared check harness — prepended to every Run by the worker (the `setup` slot).
// Drills call check()/check_call() then finish(); finish() prints the verdict
// and the literal string "All tests passed!" (the completion signal).
const PDB_HARNESS = `
import numpy as np

__RESULTS = []

def check(name, cond, msg=""):
    __RESULTS.append((bool(cond), str(name), str(msg)))

def __deriva_eq(got, expected):
    if isinstance(got, tuple) and isinstance(expected, tuple):
        return len(got) == len(expected) and all(__deriva_eq(a, b) for a, b in zip(got, expected))
    try:
        return bool(np.allclose(got, expected))
    except Exception:
        pass
    try:
        return bool(got == expected)
    except Exception:
        return False

def check_call(name, fn, expected, msg=""):
    try:
        got = fn()
    except Exception as e:
        check(name, False, f"raised {type(e).__name__}: {e}")
        return
    ok = __deriva_eq(got, expected)
    if not ok and not msg:
        msg = f"expected {expected!r}, got {got!r}"
    check(name, ok, msg)

def finish():
    total = len(__RESULTS)
    failed = [t for t in __RESULTS if not t[0]]
    for ok, name, msg in __RESULTS:
        print(("PASS  " if ok else "FAIL  ") + name)
        if not ok and msg:
            print("      " + msg)
    print()
    if failed:
        print(f"{len(failed)}/{total} tests failed - read the FIRST one, fix, run again.")
    else:
        print("All tests passed!")
    __RESULTS.clear()
`

// Scripted pdb: a REAL pdb session inside the worker. The learner's current
// editor code is re-exec'd under filename "<drill>" (so l/ll can show source),
// then pdb.runcall drives the problem's entry expression through the typed
// command list, capturing the full transcript.
function buildDebuggerHarness(src: string, entry: string, commands: string[]) {
  return `import pdb, bdb, io, sys, linecache

class __ScriptedPdb(pdb.Pdb):
    def __init__(self, commands):
        pdb.Pdb.__init__(self, nosigint=True,
                         stdin=io.StringIO("\\n".join(commands) + "\\n"),
                         stdout=io.StringIO())
        self.use_rawinput = False
        self._input_end = len(self.stdin.getvalue())

    def interaction(self, frame, traceback):
        # Out of typed commands: resume the program instead of stalling.
        if self.stdin.tell() >= self._input_end:
            self.set_continue()
            return
        pdb.Pdb.interaction(self, frame, traceback)

__SRC = ${JSON.stringify(src)}
__ENTRY = ${JSON.stringify(entry)}
__CMDS = ["b " + __ENTRY.split("(")[0], "c"] + ${JSON.stringify(commands)} + ["c"]

linecache.cache["<drill>"] = (len(__SRC), None, [l + "\\n" for l in __SRC.splitlines()], "<drill>")
exec(compile(__SRC, "<drill>", "exec"), globals())
exec(compile("def __debuggee__():\\n    return " + __ENTRY, "<drill>", "exec"), globals())

print("--- scripted pdb: step into " + __ENTRY.split("(")[0] + " ---")
print("n next | s step-into | c continue | p/pp expr | w where | u/d frame | l list | args | r return | q quit")
print()
__dbg = __ScriptedPdb(__CMDS)
try:
    __result = __dbg.runcall(__debuggee__)
    __dbg.stdout.write("\\n-> __debuggee__ returned: " + repr(__result) + "\\n")
except bdb.BdbQuit:
    __dbg.stdout.write("\\n-> debugger quit (q)\\n")
except BaseException as __e:
    __dbg.stdout.write("\\n-> session ended with " + type(__e).__name__ + ": " + str(__e) + "\\n")
__dbg.stdout.seek(0)
print(__dbg.stdout.read())
`
}

export default function PdbPracticePage() {
  const [currentId, setCurrentId] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [theoryNote, setTheoryNote] = useState("")
  const [savedCode, setSavedCode] = useState<Record<number, string>>({})
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [pdbOpen, setPdbOpen] = useState(false)
  const [pdbCommands, setPdbCommands] = useState("")
  const executionRef = useRef<AbortController | null>(null)

  const problem = PROBLEMS_PDB.find(p => p.id === currentId) || PROBLEMS_PDB[0]
  const currentStage = STAGES_PDB[problem.stage]
  const doneSet = new Set(completed)
  const hints = hintLevel[currentId] || 0
  const isRevealed = revealed[currentId] || false
  const currentCode = savedCode[currentId] || problem.starterCode

  useEffect(() => () => executionRef.current?.abort(), [])

  // Warm the sandbox (NumPy ships inside Pyodide — no extra package load).
  useEffect(() => { warmPython(false, true) }, [])

  useEffect(() => {
    const saved = loadWorkbenchProgress("pdb")
    const requested = Number(new URLSearchParams(window.location.search).get("problem"))
    const nextId = PROBLEMS_PDB.some(problem => problem.id === requested)
      ? requested
      : PROBLEMS_PDB.some(problem => problem.id === saved.currentId)
        ? saved.currentId
        : PROBLEMS_PDB[0].id
    setCurrentId(nextId)
    setCompleted(saved.completed.filter(id => PROBLEMS_PDB.some(problem => problem.id === id)))
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    saveWorkbenchProgress("pdb", { currentId, completed })
  }, [completed, currentId, hydrated])
  useEffect(() => {
    if (!hydrated) return
    setTheoryNote(loadTheoryNote(`pdb:${currentId}`))
  }, [currentId, hydrated])
  useEffect(() => {
    if (!hydrated) return
    setPdbCommands((problem.pdbLoad || ["args", "c"]).join("\n"))
  }, [currentId, hydrated, problem])

  useEffect(() => {
    try {
      const s = localStorage.getItem("deriva-pdb-code")
      if (s) setSavedCode(JSON.parse(s))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem("deriva-pdb-code", JSON.stringify(savedCode)) }, [savedCode])

  const pdbCommandList = useMemo(
    () => pdbCommands.split("\n").map(c => c.trim()).filter(Boolean),
    [pdbCommands],
  )

  const runCode = async () => {
    setRunning(true); setOutput("Running in a protected worker…")
    const controller = new AbortController()
    executionRef.current?.abort()
    executionRef.current = controller
    try {
      const result = await runScript(currentCode, problem.testCode, PDB_HARNESS, { signal: controller.signal })
      if (result.error) setOutput(`Error: ${result.error}${result.output ? "\n\n" + result.output : ""}`)
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

  const runDebugger = async () => {
    if (!problem.entry) return
    setPdbOpen(true)
    setRunning(true)
    setOutput("Stepping through " + problem.file + " under pdb…")
    const controller = new AbortController()
    executionRef.current?.abort()
    executionRef.current = controller
    try {
      const harness = buildDebuggerHarness(currentCode, problem.entry, pdbCommandList)
      const result = await runScript(currentCode, harness, undefined, { signal: controller.signal })
      if (result.error) setOutput(result.error + (result.output ? "\n\n" + result.output : ""))
      else setOutput(result.output)
    } catch (e: any) {
      if (!controller.signal.aborted) setOutput("Error: " + e.message)
    } finally {
      if (executionRef.current === controller) executionRef.current = null
      setRunning(false)
    }
  }

  const navigate = (dir: 1 | -1) => {
    const idx = PROBLEMS_PDB.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < PROBLEMS_PDB.length) { setCurrentId(PROBLEMS_PDB[next].id); setOutput("") }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode() }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [currentId, currentCode])

  const pct = Math.round((completed.length / PROBLEMS_PDB.length) * 100)
  const nextProblem = PROBLEMS_PDB[PROBLEMS_PDB.findIndex(item => item.id === currentId) + 1]

  return (
    <div className="pdb-wrap">
      <nav className="sidebar">
        {STAGES_PDB.map(stage => {
          const sp = PROBLEMS_PDB.filter(p => p.stage === stage.id)
          return (
            <div key={stage.id}>
              <div className="stage-head">{stage.name} <span className="stage-desc">{stage.desc}</span></div>
              {sp.map(p => (
                <button key={p.id} onClick={() => { setCurrentId(p.id); setOutput("") }}
                  className={`prob-row${currentId === p.id ? " active" : ""}${doneSet.has(p.id) ? " done" : ""}`}>
                  <span className="dot">{doneSet.has(p.id) ? "✓" : p.id}</span>
                  <span className="prob-name">{p.title}</span>
                  {p.bugCount > 1 && <span className="bug-badge">{p.bugCount}</span>}
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <main className="main">
        <div className="mobile-only">
          <MobileProblemNav
            stages={STAGES_PDB}
            problems={PROBLEMS_PDB}
            currentId={currentId}
            done={doneSet}
            onSelect={(id) => { setCurrentId(id); setOutput("") }}
          />
        </div>
        <header className="prob-header">
          <span className="prob-num">{currentId}</span>
          <div style={{ flex: 1 }}>
            <h2 className="prob-h2">{problem.title}</h2>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span className="tag tp">{problem.pattern}</span>
              <span className="tag ts">{problem.skill}</span>
              <span className={`tag tb${problem.bugCount > 1 ? " hot" : ""}`}>
                CI: {problem.bugCount === 1 ? "1 root cause" : `${problem.bugCount} root causes`}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate(-1)} disabled={currentId <= 1} className="btn">←</button>
            <button onClick={() => navigate(1)} disabled={currentId >= PROBLEMS_PDB.length} className="btn">→</button>
          </div>
        </header>

        <div className="pbar"><div className="pbar-track"><div className="pbar-fill" style={{ width: pct+"%" }} /></div><span className="pbar-label">{completed.length}/{PROBLEMS_PDB.length}</span></div>

        <details className="stage-brief">
          <summary>Stage {String(problem.stage).padStart(2, "0")} — {currentStage.name} · <span className="stage-brief-hint">why this stage exists</span></summary>
          <p>{currentStage.creed}</p>
        </details>

        <div className="card">
          <h3 className="card-h3">The bug report</h3>
          <p className="stmt">{problem.statement}</p>
          <div className="ex-grid">
            {problem.examples.map((ex, i) => (
              <div key={i} className="ex-box"><strong>Contract {i+1}:</strong> {ex.input} → {ex.output}{ex.explain && <><br/><span className="mu">{ex.explain}</span></>}</div>
            ))}
          </div>
          {problem.diagram && (
            <div className="diagram-card">
              <span className="diagram-kicker">The sketch</span>
              <pre className="diagram">{problem.diagram}</pre>
            </div>
          )}
        </div>

        <div className="why"><span className="why-lbl">Why this matters</span>{problem.why}</div>

        <div className="theory-card">
          <div><span className="theory-kicker">Your theory book</span><h3>What will you remember about this move?</h3></div>
          <textarea value={theoryNote} onChange={event => { setTheoryNote(event.target.value); saveTheoryNote(`pdb:${currentId}`, event.target.value) }} placeholder="Name the rule, the gotcha, or the shape you want to recall under pressure…" aria-label="Your theory note for this debugging drill" />
          <span className="theory-hint">A sentence in your own words survives longer than a re-read formula.</span>
        </div>

        <div className="ed-wrap">
           <div className="ed-bar"><span className="ed-lang">Python + NumPy</span><span className="ed-file">{problem.file}</span><span className="ready">Worker sandbox</span></div>
          <textarea value={currentCode} onChange={e => setSavedCode({ ...savedCode, [currentId]: e.target.value })} className="ed" spellCheck={false} />
        </div>

        <div className="acts">
          <button onClick={runCode} disabled={running} className="btn btn-p">{running ? "Running..." : "▶ Run Tests"}</button>
          <button onClick={runDebugger} disabled={running || !problem.entry} className="btn btn-d" title="Run the problem's entry point under a scripted pdb">⌖ Debugger</button>
          <button onClick={() => setHintLevel({ ...hintLevel, [currentId]: Math.min(hints+1, 3) })} disabled={hints>=3} className="btn">Hint ({hints}/3)</button>
          <button onClick={() => setRevealed({ ...revealed, [currentId]: !isRevealed })} className={`btn${isRevealed?" btn-s":""}`}>{isRevealed?"Hide":"Show"} Solution</button>
          <button onClick={() => { setSavedCode({ ...savedCode, [currentId]: problem.starterCode }); setOutput("") }} className="btn">Reset</button>
        </div>

        <details className="pdb-panel" open={pdbOpen}>
          <summary onClick={(e) => { e.preventDefault(); setPdbOpen(o => !o) }}>
            Scripted pdb <span className="pdb-panel-hint">type commands, one per line — a real pdb session runs against your code</span>
          </summary>
          <div className="pdb-panel-body">
            <div className="pdb-cmds">
              <span className="pdb-cmds-label">(Pdb) commands — one per line</span>
              <textarea
                value={pdbCommands}
                onChange={e => setPdbCommands(e.target.value)}
                spellCheck={false}
                aria-label="pdb commands, one per line"
              />
              <div className="pdb-cheats">
                <code>n</code> next · <code>s</code> step in · <code>c</code> continue · <code>p x</code> print · <code>pp x</code> pretty · <code>w</code> stack · <code>u</code>/<code>d</code> frames · <code>l</code> source · <code>args</code> · <code>retval</code> · <code>q</code> quit
              </div>
            </div>
            <button onClick={runDebugger} disabled={running || !problem.entry} className="btn btn-d">⌖ Run session</button>
            {!problem.entry && <span className="pdb-note">This drill has no single entry point — use Run Tests and print debugging.</span>}
          </div>
        </details>

        {output && <pre className="out">{output}</pre>}

        {doneSet.has(currentId) && <aside className="learning-checkpoint" aria-label="Learning checkpoint">
          <span className="completion-mark">✓</span>
          <div><span className="completion-kicker">Learning checkpoint</span><strong>Keep the move, not the module.</strong><p>You fixed <em>{problem.pattern}</em>. The next broken module should fall to the same evidence-first sweep.</p></div>
          {nextProblem ? <button className="completion-next" onClick={() => navigate(1)}>Next drill →</button> : <a href="/pdb" className="completion-next">PDB Ladder →</a>}
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
                  setOutput("Fixed module loaded — run the tests, then close the file and reproduce the fix from memory.")
                }}
                aria-label="Load solution into the editor"
              >Load into editor</button>
            </div>
            <pre className="sol">{problem.solution}</pre>
            <h3 className="card-h3" style={{ marginTop: 16 }}>The investigation</h3>
            <div className="wlk">{problem.walkthrough}</div>
          </div>
        )}

        <div className="kbd">← → navigate &nbsp; ⌘+Enter run tests</div>
      </main>

      <style>{`
        .pdb-wrap { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 48px); background: var(--paper); color: var(--ink); overflow: hidden; font-family: var(--font-ui); }
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
        .bug-badge { margin-left: auto; padding: 1px 6px; border-radius: 999px; background: var(--danger-soft, var(--accent-soft)); color: var(--danger, var(--accent)); font: 700 9px var(--font-mono); }
        .main { overflow-y: auto; padding: 20px 24px 60px; }
        .prob-header { display: flex; align-items: center; gap: 12px; }
        .prob-num { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); border-radius: 10px; background: var(--accent-soft); color: var(--accent); font: 700 14px var(--font-mono); }
        .prob-h2 { margin: 0; font: 700 22px var(--font-narrative); letter-spacing: -.01em; }
        .tag { padding: 2px 8px; border-radius: 999px; font: 700 10px var(--font-mono); }
        .tp { background: var(--accent-soft); color: var(--accent); }
        .ts { background: var(--paper-raised); color: var(--ink-soft); border: 1px solid var(--line); }
        .tb { background: var(--paper-raised); color: var(--ink-soft); border: 1px solid var(--line); }
        .tb.hot { background: var(--accent-soft); color: var(--accent); border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); }
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
        .btn-d { border-color: var(--accent); color: var(--accent); font-weight: 700; }
        .btn-d:hover:not(:disabled) { background: var(--accent); color: #fff; }
        .btn-s { background: var(--success-soft); color: var(--viz-settled); border-color: var(--success-line); }
        .solution-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .btn-load { min-height: 32px; padding: 5px 12px; font-size: 11px; font-weight: 700; border: 1px solid var(--accent); color: var(--accent); background: var(--paper-raised); }
        .btn-load:hover { background: var(--accent); color: #fff; }
        .out { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; min-height: 50px; max-height: 320px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 14px; }
        .pdb-panel { margin: 0 0 14px; padding: 10px 16px; border: 1px dashed color-mix(in srgb, var(--accent) 45%, var(--line)); border-radius: var(--radius); background: var(--paper); }
        .pdb-panel summary { cursor: pointer; font: 700 12px var(--font-ui); color: var(--ink); }
        .pdb-panel-hint { font-weight: 500; color: var(--ink-soft); }
        .pdb-panel-body { display: flex; gap: 12px; align-items: stretch; margin-top: 10px; flex-wrap: wrap; }
        .pdb-cmds { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 6px; }
        .pdb-cmds-label { font: 700 10px var(--font-mono); color: var(--accent); }
        .pdb-cmds textarea { width: 100%; min-height: 88px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink); font: 13px/1.7 var(--font-mono); resize: vertical; }
        .pdb-cheats { font: 11px/1.8 var(--font-mono); color: var(--ink-soft); }
        .pdb-cheats code { padding: 0 5px; border: 1px solid var(--line); border-radius: 4px; background: var(--paper-raised); color: var(--ink); }
        .pdb-note { flex: 1 0 100%; color: var(--ink-soft); font-size: 11px; }
        .hint-row { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; font-size: 13px; }
        .hint-b { background: var(--accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
        .sol { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; overflow-x: auto; white-space: pre; }
        .wlk { font-size: 13px; line-height: 1.7; color: var(--ink); white-space: pre-wrap; }
        .stage-brief { margin: 0 0 14px; padding: 10px 16px; border: 1px dashed var(--line); border-radius: var(--radius); background: var(--paper); }
        .stage-brief summary { cursor: pointer; font: 700 12px var(--font-ui); color: var(--ink); }
        .stage-brief summary::marker { color: var(--accent); }
        .stage-brief-hint { font-weight: 500; color: var(--ink-soft); }
        .stage-brief p { margin: 10px 0 4px; font-size: 13px; line-height: 1.7; color: var(--ink-soft); white-space: pre-wrap; }
        .diagram-card { margin-top: 12px; padding: 12px 14px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); overflow-x: auto; }
        .diagram-kicker { display: block; margin-bottom: 6px; font: 800 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
        .diagram { margin: 0; font: 12.5px/1.45 var(--font-mono); color: var(--ink); white-space: pre; }
        .kbd { margin-top: 18px; color: var(--ink-soft); font: 11px var(--font-mono); }
        .learning-checkpoint { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border: 1px solid var(--success-line); border-radius: calc(var(--radius) + 2px); background: var(--success-soft); }
        .completion-mark { display: grid; width: 26px; height: 26px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--viz-settled); color: var(--paper-raised); font-weight: 800; }
        .completion-kicker { display: block; font: 800 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--viz-settled); }
        .learning-checkpoint strong { font: 700 14px var(--font-narrative); }
        .learning-checkpoint p { margin: 4px 0 0; font-size: 12px; color: var(--ink-soft); }
        .completion-next { margin-left: auto; flex: 0 0 auto; align-self: center; padding: 8px 14px; border: 1px solid var(--success-line); border-radius: 999px; background: var(--paper-raised); color: var(--ink); font: 700 12px var(--font-ui); cursor: pointer; text-decoration: none; }
        .completion-next:hover { border-color: var(--viz-settled); }
        @media (max-width: 800px) {
          .pdb-wrap { display: block; height: auto; overflow: visible; }
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
