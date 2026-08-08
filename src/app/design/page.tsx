"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { STAGES_DESIGN, PROBLEMS_DESIGN, DesignProblem } from "@/data/system-design"
import MobileProblemNav from "@/components/mobile-problem-nav"
import {
  ReactFlow, Background, Controls, addEdge, useNodesState, useEdgesState,
  Handle, Position, type Node, type Edge, type Connection, type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// ─── Component palette ───
const COMPONENTS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  client: { label: "Client", icon: "◉", color: "#475569", bg: "#f1f5f9" },
  lb:     { label: "Load Balancer", icon: "⚖", color: "#7c3aed", bg: "#f5f3ff" },
  server: { label: "App Server", icon: "▣", color: "#2563eb", bg: "#eff6ff" },
  cache:  { label: "Cache (Redis)", icon: "⚡", color: "#dc2626", bg: "#fef2f2" },
  db:     { label: "Database", icon: "◫", color: "#16a34a", bg: "#f0fdf4" },
  queue:  { label: "Queue", icon: "≡", color: "#ca8a04", bg: "#fefce8" },
  worker: { label: "Worker", icon: "⚙", color: "#9333ea", bg: "#faf5ff" },
  cdn:    { label: "CDN Edge", icon: "◎", color: "#0891b2", bg: "#ecfeff" },
}

function ComponentNode({ data }: NodeProps) {
  const c = COMPONENTS[data.kind as string] || COMPONENTS.server
  return (
    <div style={{
      padding: "10px 16px", borderRadius: 10, border: `2px solid ${c.color}`,
      background: c.bg, color: c.color, fontWeight: 700, fontSize: 13,
      fontFamily: "var(--font-ui)", minWidth: 110, textAlign: "center",
    }}>
      <Handle type="target" position={Position.Left} style={{ background: c.color }} />
      <div style={{ fontSize: 18 }}>{c.icon}</div>
      <div>{data.label as string}</div>
      <Handle type="source" position={Position.Right} style={{ background: c.color }} />
    </div>
  )
}

const nodeTypes = { comp: ComponentNode }

function solutionNodes(problem: DesignProblem): { nodes: Node[]; edges: Edge[] } {
  const kinds = problem.requiredNodes || []
  const nodes: Node[] = kinds.map((kind, i) => ({
    id: `sol-${kind}-${i}`,
    type: "comp",
    position: { x: 60 + i * 160, y: 120 + (i % 2) * 60 },
    data: { kind, label: COMPONENTS[kind]?.label || kind },
  }))
  const idOf = (kind: string, occurrence: number) => {
    const matches = kinds.map((k, i) => ({ k, id: `sol-${k}-${i}` })).filter(m => m.k === kind)
    return matches[Math.min(occurrence, matches.length - 1)]?.id
  }
  const seen: Record<string, number> = {}
  const edges: Edge[] = (problem.requiredEdges || []).map(([src, tgt], i) => {
    const sOcc = seen[src] || 0; seen[src] = sOcc + 1
    const source = idOf(src, sOcc) || `sol-${src}-0`
    const target = idOf(tgt, 0) || `sol-${tgt}-0`
    return { id: `sol-e-${i}`, source, target, animated: true, style: { stroke: "#94a3b8" } }
  })
  return { nodes, edges }
}

function DesignCanvas({ problem, onPass }: { problem: DesignProblem; onPass: () => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [feedback, setFeedback] = useState("")
  const [counter, setCounter] = useState(0)

  useEffect(() => { setNodes([]); setEdges([]); setFeedback("") }, [problem.id, setNodes, setEdges])

  const onConnect = useCallback((c: Connection) => setEdges(eds => addEdge({ ...c, animated: true }, eds)), [setEdges])

  const addNode = (kind: string) => {
    const id = `n-${problem.id}-${counter}`
    setCounter(c => c + 1)
    setNodes(ns => [...ns, {
      id, type: "comp",
      position: { x: 80 + Math.random() * 300, y: 60 + Math.random() * 200 },
      data: { kind, label: COMPONENTS[kind].label },
    }])
  }

  const checkDesign = () => {
    const req = problem.requiredNodes || []
    const reqE = problem.requiredEdges || []
    const nodeKinds = nodes.map(n => n.data.kind as string)
    const missing = req.filter(k => !nodeKinds.includes(k))
    const kindOf = (id: string) => nodes.find(n => n.id === id)?.data.kind as string
    const edgePairs = edges.map(e => [kindOf(e.source), kindOf(e.target)] as [string, string])
    const missingE = reqE.filter(([s, t]) => !edgePairs.some(([es, et]) => es === s && et === t))
    if (missing.length === 0 && missingE.length === 0) {
      setFeedback("✓ Design complete — all required components and connections present.")
      onPass()
    } else {
      const parts: string[] = []
      if (missing.length) parts.push(`Missing components: ${missing.map(m => COMPONENTS[m].label).join(", ")}`)
      if (missingE.length) parts.push(`Missing connections: ${missingE.map(([s, t]) => `${COMPONENTS[s].label} → ${COMPONENTS[t].label}`).join("; ")}`)
      setFeedback(parts.join("\n"))
    }
  }

  const showSolution = () => {
    const { nodes: sn, edges: se } = solutionNodes(problem)
    setNodes(sn); setEdges(se)
    setFeedback("Reference design loaded. Study the layout, then rebuild it yourself.")
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginBottom: 10, paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {Object.entries(COMPONENTS).map(([kind, c]) => (
          <button key={kind} onClick={() => addNode(kind)} style={{
            padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${c.color}`,
            background: c.bg, color: c.color, fontSize: 12, fontWeight: 600, cursor: "pointer",
            flexShrink: 0, whiteSpace: "nowrap",
          }}>{c.icon} {c.label}</button>
        ))}
      </div>
      <div style={{ height: "min(380px, 55vh)", border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "#fafafa", touchAction: "none" }}>
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}
          minZoom={0.3} maxZoom={1.5}
        >
          <Background gap={20} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={checkDesign} style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Check Design</button>
        <button onClick={showSolution} style={{ padding: "8px 18px", background: "var(--paper-raised)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Show Reference</button>
        <button onClick={() => { setNodes([]); setEdges([]); setFeedback("") }} style={{ padding: "8px 18px", background: "var(--paper-raised)", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>Clear</button>
      </div>
      {feedback && <pre style={{ marginTop: 10, padding: 12, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius)", fontSize: 13, whiteSpace: "pre-wrap", fontFamily: "var(--font-ui)" }}>{feedback}</pre>}
    </div>
  )
}

function Checklist({ problem, onPass }: { problem: DesignProblem; onPass: () => void }) {
  const items = useMemo(() => (problem.checklist || []).map((c, i) => ({ ...c, idx: i })), [problem])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [result, setResult] = useState("")
  useEffect(() => { setChecked(new Set()); setResult("") }, [problem.id])

  const verify = () => {
    const wrong: string[] = []
    items.forEach(c => {
      const isChecked = checked.has(c.idx)
      if (c.required && !isChecked) wrong.push(`Should be checked: "${c.item}"`)
      if (!c.required && isChecked) wrong.push(`Should NOT be checked: "${c.item}"`)
    })
    if (wrong.length === 0) { setResult("✓ Perfect — your scoping matches the reference."); onPass() }
    else setResult(wrong.join("\n"))
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {items.map(c => (
          <label key={c.idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={checked.has(c.idx)} onChange={e => {
              const next = new Set(checked)
              if (e.target.checked) next.add(c.idx); else next.delete(c.idx)
              setChecked(next)
            }} style={{ marginTop: 2 }} />
            <span>{c.item}</span>
          </label>
        ))}
      </div>
      <button onClick={verify} style={{ padding: "8px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Check Answer</button>
      {result && <pre style={{ marginTop: 10, padding: 12, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius)", fontSize: 13, whiteSpace: "pre-wrap", fontFamily: "var(--font-ui)" }}>{result}</pre>}
    </div>
  )
}

function Estimation({ problem, onPass }: { problem: DesignProblem; onPass: () => void }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { setRevealed(false) }, [problem.id])
  const est = problem.estimation
  if (!est) return null
  return (
    <div>
      <div style={{ padding: 16, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent)", marginBottom: 6 }}>Estimate</div>
        <div style={{ fontSize: 15, fontFamily: "var(--font-narrative)" }}>{est.prompt}</div>
      </div>
      <button onClick={() => { setRevealed(!revealed); if (!revealed) onPass() }} style={{ padding: "8px 18px", background: revealed ? "#e8f5ed" : "var(--accent)", color: revealed ? "var(--viz-settled)" : "#fff", border: revealed ? "1px solid var(--viz-settled)" : "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        {revealed ? "Hide Answer" : "Reveal Answer"}
      </button>
      {revealed && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ padding: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--radius)", fontSize: 14, lineHeight: 1.6 }}>{est.answer}</div>
          <div style={{ padding: 12, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--radius)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-soft)" }}>{est.formula}</div>
        </div>
      )}
    </div>
  )
}

export default function DesignPage() {
  const [currentId, setCurrentId] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])
  const [hintLevel, setHintLevel] = useState<Record<number, number>>({})
  const [showWalkthrough, setShowWalkthrough] = useState<Record<number, boolean>>({})

  const problem = PROBLEMS_DESIGN.find(p => p.id === currentId) || PROBLEMS_DESIGN[0]
  const hints = hintLevel[currentId] || 0
  const walk = showWalkthrough[currentId] || false

  useEffect(() => {
    try {
      const c = localStorage.getItem("deriva-design-completed")
      if (c) setCompleted(JSON.parse(c))
    } catch {}
  }, [])
  useEffect(() => { localStorage.setItem("deriva-design-completed", JSON.stringify(completed)) }, [completed])

  const markDone = useCallback(() => {
    setCompleted(prev => prev.includes(currentId) ? prev : [...prev, currentId])
  }, [currentId])

  const doneSet = new Set(completed)
  const pct = Math.round((completed.length / PROBLEMS_DESIGN.length) * 100)

  const navigate = (dir: 1 | -1) => {
    const idx = PROBLEMS_DESIGN.findIndex(p => p.id === currentId)
    const next = idx + dir
    if (next >= 0 && next < PROBLEMS_DESIGN.length) setCurrentId(PROBLEMS_DESIGN[next].id)
  }

  return (
    <div className="design-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - 52px)", background: "var(--paper)", overflow: "hidden", fontFamily: "var(--font-ui)" }}>
      <nav className="design-sidebar" style={{ borderRight: "1px solid var(--line)", background: "var(--paper-raised)", overflowY: "auto" }}>
        {STAGES_DESIGN.map(stage => {
          const sp = PROBLEMS_DESIGN.filter(p => p.stage === stage.id)
          return (
            <div key={stage.id}>
              <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-soft)" }}>
                {stage.name} <span style={{ fontWeight: 400, opacity: 0.6 }}>· {stage.desc}</span>
              </div>
              {sp.map(p => (
                <button key={p.id} onClick={() => setCurrentId(p.id)}
                  style={{
                    padding: "5px 16px 5px 24px", display: "flex", alignItems: "center", gap: 8, border: "none",
                    background: currentId === p.id ? "var(--accent-soft)" : "none", width: "100%", textAlign: "left",
                    fontSize: 13, color: doneSet.has(p.id) ? "var(--viz-settled)" : currentId === p.id ? "var(--accent)" : "var(--ink-soft)",
                    borderLeft: currentId === p.id ? "3px solid var(--accent)" : "3px solid transparent", cursor: "pointer",
                    fontWeight: currentId === p.id ? 500 : 400,
                  }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, flexShrink: 0, border: `1.5px solid ${doneSet.has(p.id) ? "var(--viz-settled)" : "var(--line)"}`,
                    background: doneSet.has(p.id) ? "var(--viz-settled)" : "transparent", color: doneSet.has(p.id) ? "#fff" : "var(--ink-soft)",
                  }}>{doneSet.has(p.id) ? "✓" : p.id}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <main className="design-main" style={{ overflowY: "auto", padding: "24px 32px 60px" }}>
        <div className="mobile-only">
          <MobileProblemNav
            stages={STAGES_DESIGN}
            problems={PROBLEMS_DESIGN}
            currentId={currentId}
            done={doneSet}
            onSelect={(id) => setCurrentId(id)}
          />
        </div>
        <div className="design-problem-header" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 28, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent)" }}>{currentId}</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontFamily: "var(--font-narrative)" }}>{problem.title}</h2>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>{problem.pattern}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontFamily: "var(--font-mono)", color: "var(--viz-settled)", background: "#e8f5ed", border: "1px solid var(--viz-settled)" }}>{problem.kind}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => navigate(-1)} disabled={currentId <= 1} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)", borderRadius: "var(--radius)", cursor: "pointer" }}>←</button>
            <button onClick={() => navigate(1)} disabled={currentId >= PROBLEMS_DESIGN.length} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "var(--paper-raised)", borderRadius: "var(--radius)", cursor: "pointer" }}>→</button>
          </div>
        </div>

        <div className="design-progress" style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div style={{ flex: 1, height: 6, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s" }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: 10 }}>{completed.length}/{PROBLEMS_DESIGN.length}</span>
        </div>

        <div className="design-problem-card" style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-soft)" }}>Problem</h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, fontFamily: "var(--font-narrative)", margin: 0 }}>{problem.statement}</p>
        </div>

        <div className="design-why-card" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "var(--radius)", padding: 14, marginBottom: 14, fontSize: 14, lineHeight: 1.7, fontFamily: "var(--font-narrative)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--accent)", display: "block", marginBottom: 4 }}>Why this matters</span>
          {problem.why}
        </div>

        <div className="design-workbench" style={{ marginBottom: 14 }}>
          {problem.kind === "canvas" && <DesignCanvas problem={problem} onPass={markDone} />}
          {problem.kind === "requirements" && problem.checklist && <Checklist problem={problem} onPass={markDone} />}
          {problem.kind === "estimation" && <Estimation problem={problem} onPass={markDone} />}
          {problem.kind === "critique" && problem.checklist && <Checklist problem={problem} onPass={markDone} />}
          {problem.kind === "critique" && problem.estimation && <Estimation problem={problem} onPass={markDone} />}
        </div>

        <div className="design-actions" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setHintLevel({ ...hintLevel, [currentId]: Math.min(hints + 1, problem.hints.length) })}
            disabled={hints >= problem.hints.length}
            style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "var(--paper-raised)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>
            Hint ({hints}/{problem.hints.length})
          </button>
          <button onClick={() => setShowWalkthrough({ ...showWalkthrough, [currentId]: !walk })}
            style={{ padding: "8px 16px", border: "1px solid var(--line)", background: walk ? "#e8f5ed" : "var(--paper-raised)", borderRadius: "var(--radius)", fontSize: 13, cursor: "pointer" }}>
            {walk ? "Hide" : "Show"} Walkthrough
          </button>
        </div>

        {hints > 0 && (
          <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 14 }}>
            {problem.hints.slice(0, hints).map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, fontSize: 13 }}>
                <span style={{ background: "var(--accent)", color: "#fff", width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                {h}
              </div>
            ))}
          </div>
        )}

        {walk && (
          <div style={{ background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "16px 20px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-soft)" }}>Walkthrough</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8, fontFamily: "var(--font-narrative)", margin: 0 }}>{problem.walkthrough}</p>
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 800px) {
          .design-grid { grid-template-columns: 1fr !important; }
          .design-sidebar { display: none; }
           .design-main { padding: 14px 14px calc(132px + env(safe-area-inset-bottom)) !important; }
           .design-problem-header { padding: 14px; border: 1px solid var(--line); border-radius: 18px; background: var(--paper-raised); box-shadow: var(--shadow-raised); }
           .design-problem-header > div:last-child { width: 100%; padding-left: 0; }
           .design-problem-header > div:last-child button { flex: 1; min-height: 44px; }
           .design-progress { margin-bottom: 14px !important; }
           .design-problem-card, .design-why-card { border-radius: 18px !important; padding: 16px !important; }
           .design-workbench { padding: 12px; border: 1px solid var(--line); border-radius: 18px; background: var(--paper-raised); }
           .design-actions { position: static; display: grid !important; grid-template-columns: 1fr 1fr; margin: 0 0 14px; padding: 0; background: transparent; border: none; box-shadow: none; backdrop-filter: none; }
           .design-actions button { min-height: 46px; }
          .mobile-only { display: block; }
        }
        @media (min-width: 801px) {
          .mobile-only { display: none; }
        }
      `}</style>
    </div>
  )
}
