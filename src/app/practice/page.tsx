"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import MobileProblemNav, { MobileTopicPicker } from "@/components/mobile-problem-nav"

export default function PracticePage() {
  const [topicId, setTopicId] = useState("trees")
  const [hydrated, setHydrated] = useState(false)
  const [currentId, setCurrentId] = useState(1)
  const [completed, setCompleted] = useState<Record<string, number[]>>({})
  const [savedCode, setSavedCode] = useState<Record<string, Record<number, string>>>({})
  const [hintLevel, setHintLevel] = useState<Record<string, Record<number, number>>>({})
  const [revealed, setRevealed] = useState<Record<string, Record<number, boolean>>>({})
  const [output, setOutput] = useState("")
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [pyLoading, setPyLoading] = useState(false)
  const pyRef = useRef<any>(null)

  const topic = TOPICS[topicId] || TOPIC_LIST[0]
  const problem = topic.problems.find(p => p.id === currentId) || topic.problems[0]
  const tCompleted = new Set(completed[topicId] || [])
  const tCode = savedCode[topicId] || {}
  const tHints = hintLevel[topicId] || {}
  const tRevealed = revealed[topicId] || {}
  const currentHint = tHints[currentId] || 0
  const currentRevealed = tRevealed[currentId] || false
  const currentCode = tCode[currentId] || problem.starterCode

  useEffect(() => {
    try {
      // Read ?topic= param from URL
      const params = new URLSearchParams(window.location.search)
      const topicParam = params.get("topic")
      if (topicParam && TOPICS[topicParam]) {
        setTopicId(topicParam)
        setCurrentId(TOPICS[topicParam].problems[0].id)
      } else {
        const stored = localStorage.getItem("deriva-topic-v1")
        if (stored && TOPICS[stored]) {
          setTopicId(stored)
          setCurrentId(TOPICS[stored].problems[0].id)
        }
      }
      const c = localStorage.getItem("deriva-completed-v2");
      if (c) setCompleted(JSON.parse(c));
      const s = localStorage.getItem("deriva-code-v2");
      if (s) setSavedCode(JSON.parse(s));
      const h = localStorage.getItem("deriva-hints-v2");
      if (h) setHintLevel(JSON.parse(h));
      setHydrated(true)
    } catch {}
  }, [])

  useEffect(() => { setHydrated(true) }, [])
  useEffect(() => { localStorage.setItem("deriva-completed-v2", JSON.stringify(Object.fromEntries(Object.entries(completed).map(([k,v]) => [k, [...new Set(v)]])))) }, [completed])
  useEffect(() => { localStorage.setItem("deriva-code-v2", JSON.stringify(savedCode)) }, [savedCode])
  useEffect(() => { localStorage.setItem("deriva-hints-v2", JSON.stringify(hintLevel)) }, [hintLevel])
  useEffect(() => { localStorage.setItem("deriva-topic-v1", topicId) }, [topicId])

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
      if (topic.buildCode) py.runPython(topic.buildCode)
      py.runPython(`import sys,io\n__deriva_out=io.StringIO()\nsys.stdout=__deriva_out\nsys.stderr=__deriva_out`)
      py.runPython(currentCode)
      py.runPython(problem.testCode)
      const out = py.runPython("__deriva_out.getvalue()")
      setOutput(out || "No output.")
      if (out.includes("All tests passed!")) {
        setCompleted(prev => {
          const cur = new Set(prev[topicId] || []); cur.add(currentId)
          return { ...prev, [topicId]: [...cur] }
        })
      }
    } catch (e: any) { setOutput("Error: " + e.message) }
    setRunning(false)
  }

  const navigate = (dir: 1 | -1) => {
    const idx = topic.problems.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < topic.problems.length) { setCurrentId(topic.problems[next].id); setOutput("") }
  }

  const switchTopic = (id: string) => {
    setTopicId(id); setCurrentId(TOPICS[id].problems[0].id); setOutput("")
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigate(-1)
      if (e.key === "ArrowRight") navigate(1)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode() }
    }
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h)
  }, [currentId, currentCode, topicId, pyReady])

  const done = (completed[topicId] || []).length
  const total = topic.problems.length
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <div className="practice-wrap">
      <nav className="sidebar">
        <div className="topic-select">
          <select value={topicId} onChange={e => switchTopic(e.target.value)} className="topic-dropdown">
            {TOPIC_LIST.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.problems.length})</option>
            ))}
          </select>
        </div>
        {topic.stages.map(stage => {
          const sp = topic.problems.filter(p => p.stage === stage.id)
          return (
            <div key={stage.id} className="stage-group">
              <div className="stage-head">{stage.name} <span className="stage-desc">{stage.desc}</span></div>
              {sp.map(p => (
                <button key={p.id} onClick={() => { setCurrentId(p.id); setOutput("") }}
                  className={`prob-row${currentId === p.id ? " active" : ""}${tCompleted.has(p.id) ? " done" : ""}`}>
                  <span className="dot">{tCompleted.has(p.id) ? "✓" : p.id}</span>
                  <span className="prob-name">{p.title}</span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <main className="main">
        <div className="mobile-only mobile-context">
          <MobileTopicPicker topics={TOPIC_LIST} currentId={topicId} onSelect={switchTopic} />
          <MobileProblemNav
            stages={topic.stages}
            problems={topic.problems}
            currentId={currentId}
            done={tCompleted}
            onSelect={(id) => { setCurrentId(id); setOutput("") }}
          />
        </div>
        <header className="prob-header">
          <span className="prob-num" aria-label={`Problem ${currentId}`}>{currentId}</span>
          <div style={{ flex: 1 }}>
            <h2 className="prob-h2">{problem.title}</h2>
            <div className="problem-tags" style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span className="tag tp">{problem.pattern}</span>
              <span className="tag ts">{problem.skill}</span>
            </div>
          </div>
          <div className="problem-pager" style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate(-1)} disabled={currentId <= topic.problems[0].id} className="btn" aria-label="Previous problem">←</button>
            <button onClick={() => navigate(1)} disabled={currentId >= topic.problems[topic.problems.length-1].id} className="btn" aria-label="Next problem">→</button>
          </div>
        </header>

        <div className="pbar"><div className="pbar-track"><div className="pbar-fill" style={{ width: pct+"%" }} /></div><span className="pbar-label">{done}/{total} complete</span></div>

        <div className="card">
          <h3 className="card-h3">Problem</h3>
          <p className="stmt">{problem.statement}</p>
          <div className="ex-grid">
            {problem.examples.map((ex, i) => (
              <div key={i} className="ex-box"><strong>Example {i+1}:</strong> Input: {ex.input}<br/>Output: {ex.output}{ex.explain && <><br/><span className="mu">{ex.explain}</span></>}</div>
            ))}
          </div>
        </div>

        <div className="why"><span className="why-lbl">Why this matters</span>{problem.why}</div>

        <div className="ed-wrap">
          <div className="ed-bar"><span className="ed-lang">Python</span><span className="ed-file">solution.py</span>{pyLoading && <span className="loading">Loading Pyodide...</span>}{pyReady && <span className="ready">Ready</span>}</div>
          <textarea value={currentCode} onChange={e => { setSavedCode({ ...savedCode, [topicId]: { ...tCode, [currentId]: e.target.value } }) }} className="ed" spellCheck={false} />
        </div>

        <div className="acts" aria-label="Code actions">
          <button onClick={runCode} disabled={running} className="btn btn-p primary-run">{running ? "Running..." : "▶ Run Code"}</button>
          <button onClick={() => { const h = { ...tHints, [currentId]: Math.min(currentHint+1, 3) }; setHintLevel({ ...hintLevel, [topicId]: h }) }} disabled={currentHint>=3} className="btn">Hint ({currentHint}/3)</button>
          <button onClick={() => { const r = { ...tRevealed, [currentId]: !currentRevealed }; setRevealed({ ...revealed, [topicId]: r }) }} className={`btn${currentRevealed?" btn-s":""}`}>{currentRevealed?"Hide":"Show"} Solution</button>
          <button onClick={() => { setSavedCode({ ...savedCode, [topicId]: { ...tCode, [currentId]: problem.starterCode } }); setOutput("") }} className="btn">Reset</button>
        </div>

        {output && <pre className="out">{output}</pre>}

        {tCompleted.has(currentId) && (
          <aside className="completion-card" aria-label="Learning checkpoint">
            <span className="completion-mark">✓</span>
            <div>
              <span className="completion-kicker">Learning checkpoint</span>
              <strong>Keep the pattern, not the answer.</strong>
              <p>You used <em>{problem.pattern}</em>. On the next problem, look for the same reasoning move under a different surface.</p>
            </div>
            {currentId < topic.problems[topic.problems.length - 1].id && <button className="completion-next" onClick={() => navigate(1)}>Next →</button>}
          </aside>
        )}

        {currentHint > 0 && (
          <div className="card" style={{ marginTop: 14 }}>
            <h3 className="card-h3">Hints</h3>
            {problem.hints.slice(0, currentHint).map((h, i) => (
              <div key={i} className="hint-row"><span className="hint-b">{i+1}</span> {h}</div>
            ))}
          </div>
        )}

        {currentRevealed && (
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
        .practice-wrap { display: grid; grid-template-columns: 260px 1fr; height: calc(100vh - 52px); background: var(--paper); color: var(--ink); overflow: hidden; font-family: var(--font-ui); }
        .sidebar { border-right: 1px solid var(--line); background: var(--paper-raised); overflow-y: auto; padding: 0; }
        .topic-select { padding: 12px; border-bottom: 1px solid var(--line); }
        .topic-dropdown { width: 100%; padding: 8px 10px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); font-size: 13px; color: var(--ink); font-family: var(--font-ui); cursor: pointer; }
        .stage-group { margin-bottom: 4px; }
        .stage-head { padding: 8px 16px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--ink-soft); display: flex; align-items: baseline; gap: 6px; }
        .stage-desc { font-size: 9px; font-weight: 400; opacity: 0.6; }
        .prob-row { padding: 5px 16px 5px 24px; cursor: pointer; display: flex; align-items: center; gap: 8px; border: none; background: none; width: 100%; text-align: left; font-size: 13px; color: var(--ink-soft); border-left: 3px solid transparent; transition: 0.1s; }
        .prob-row:hover { background: var(--accent-soft); color: var(--ink); }
        .prob-row.active { color: var(--accent); background: var(--accent-soft); border-left-color: var(--accent); font-weight: 500; }
        .prob-row.done { color: var(--viz-settled); }
        .dot { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid var(--line); display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; color: var(--ink-soft); }
        .prob-row.done .dot { background: var(--viz-settled); border-color: var(--viz-settled); color: #fff; }
        .prob-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .main { overflow-y: auto; padding: 24px clamp(20px, 4vw, 48px) 60px; }
        .prob-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .prob-num { font-size: 28px; font-family: var(--font-mono); font-weight: 800; color: var(--accent); }
        .prob-h2 { margin: 0; font-size: 22px; font-family: var(--font-narrative); }
        .tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-family: var(--font-mono); }
        .tp { color: var(--accent); background: var(--accent-soft); border: 1px solid var(--accent); }
        .ts { color: var(--viz-settled); background: var(--success-soft); border: 1px solid var(--success-line); }

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
        .btn { background: var(--paper-raised); color: var(--ink); border: 1px solid var(--line); min-height: 40px; padding: 8px 16px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: var(--font-ui); }
        .btn:hover:not(:disabled) { border-color: var(--accent); }
        .btn:disabled { opacity: 0.4; cursor: default; }
        .btn-p { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
        .btn-p:hover:not(:disabled) { opacity: 0.9; }
        .btn-s { background: var(--success-soft); color: var(--viz-settled); border-color: var(--success-line); }

        .out { background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; min-height: 50px; max-height: 250px; overflow-y: auto; white-space: pre-wrap; margin-bottom: 14px; }
        .completion-card { display: grid; grid-template-columns: auto 1fr auto; gap: var(--sp-3); align-items: start; padding: var(--sp-4); margin-bottom: var(--sp-4); border: 1px solid var(--success-line); border-radius: var(--radius); background: var(--success-soft); font-family: var(--font-ui); }
        .completion-mark { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--viz-settled); color: var(--paper-raised); font-weight: 800; }
        .completion-kicker { display: block; margin-bottom: 2px; color: var(--viz-settled); font: 700 10px var(--font-ui); letter-spacing: .08em; text-transform: uppercase; }
        .completion-card strong { display: block; font-family: var(--font-narrative); font-size: 18px; }
        .completion-card p { margin: 4px 0 0; color: var(--ink-soft); font: 14px/1.45 var(--font-narrative); }
        .completion-next { min-height: 36px; padding: 6px 10px; border: 1px solid var(--success-line); border-radius: var(--radius); background: var(--paper-raised); color: var(--viz-settled); font: 700 12px var(--font-ui); }

        .hint-row { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; font-size: 13px; }
        .hint-b { background: var(--accent); color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }

        .sol { background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 12px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 1.7; overflow-x: auto; white-space: pre; }
        .wlk { font-size: 14px; line-height: 1.8; font-family: var(--font-narrative); }
        .kbd { text-align: center; color: var(--ink-soft); font-size: 11px; margin-top: 16px; font-family: var(--font-mono); }

        @media (max-width: 800px) {
          .practice-wrap { display: block; height: auto; min-height: calc(100dvh - 56px - env(safe-area-inset-top)); overflow: visible; }
          .sidebar { display: none; }
          .main { overflow: visible; padding: var(--sp-4) var(--sp-4) calc(144px + env(safe-area-inset-bottom)); }
          .mobile-only { display: block; }
          .mobile-context { display: grid; grid-template-columns: 1fr; gap: var(--sp-2); margin-bottom: var(--sp-4); }
          .prob-header { align-items: flex-start; gap: var(--sp-3); margin-bottom: var(--sp-3); }
          .prob-num { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 50%; background: var(--accent-soft); font-size: 16px; }
          .prob-h2 { font-size: 22px; line-height: 1.15; }
          .problem-tags { flex-wrap: wrap; }
          .problem-pager { width: 100%; padding-left: 46px; }
          .problem-pager .btn { flex: 1; }
          .pbar { margin-bottom: var(--sp-4); }
          .pbar-label { min-width: 72px; text-align: right; font-size: 11px; }
          .card { padding: var(--sp-4); margin-bottom: var(--sp-3); }
          .stmt { margin: 0; font-size: 18px; line-height: 1.55; }
          .ex-box { padding: var(--sp-3); overflow-wrap: anywhere; }
          .why { padding: var(--sp-4); font-size: 16px; line-height: 1.55; }
          .ed { min-height: 280px; max-height: none; padding: var(--sp-3); font-size: 13px; line-height: 1.6; }
          .acts { position: sticky; bottom: 0; z-index: 10; margin: var(--sp-3) calc(var(--sp-4) * -1) 0; padding: var(--sp-2) var(--sp-4) calc(var(--sp-2) + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--paper-raised) 94%, transparent); border-top: 1px solid var(--line); box-shadow: 0 -8px 20px rgb(26 29 33 / .05); }
          .acts .btn { min-height: 44px; padding-inline: 12px; }
          .primary-run { flex: 1 1 100%; font-size: 14px; }
          .acts .btn:not(.primary-run) { flex: 1 1 calc(33.333% - 6px); font-size: 12px; }
          .out { margin-top: var(--sp-4); overflow-wrap: anywhere; }
          .completion-card { grid-template-columns: auto 1fr; }
          .completion-next { grid-column: 2; justify-self: start; }
          .kbd { display: none; }
        }
        @media (min-width: 801px) {
          .mobile-only { display: none; }
        }
      `}</style>
    </div>
  )
}
