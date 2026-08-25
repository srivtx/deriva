"use client"

import { useEffect, useRef, useState } from "react"

const COLORS = ["#111827", "#2F8F5B", "#2E5AAC", "#B55335", "#DB2777", "#B07C24", "#ffffff"]

export default function WhiteboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [color, setColor] = useState("#111827")
  const [size, setSize] = useState(4)
  const [canUndo, setCanUndo] = useState(false)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const undoStack = useRef<ImageData[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")!
    ctx.scale(ratio, ratio)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctxRef.current = ctx
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const start = (e: React.PointerEvent) => {
    e.preventDefault()
    const ctx = ctxRef.current!
    const p = pos(e)
    undoStack.current.push(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height))
    if (undoStack.current.length > 25) undoStack.current.shift()
    setCanUndo(true)
    drawing.current = true
    last.current = p
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = ctxRef.current!
    const p = pos(e)
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color
    ctx.lineWidth = tool === "eraser" ? size * 3 : size
    ctx.beginPath()
    ctx.moveTo(last.current!.x, last.current!.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const end = () => { drawing.current = false; last.current = null }

  const undo = () => {
    const ctx = ctxRef.current!
    const img = undoStack.current.pop()
    if (img) { ctx.putImageData(img, 0, 0); setCanUndo(undoStack.current.length > 0) }
  }

  const clear = () => {
    const ctx = ctxRef.current!
    const canvas = canvasRef.current!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    undoStack.current = []
    setCanUndo(false)
  }

  const save = () => {
    const url = canvasRef.current!.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url; a.download = "whiteboard.png"; a.click()
  }

  return (
    <main className="super-page whiteboard-page">
      <span className="super-kicker">WHITEBOARD</span>
      <h1 className="wb-title">Sketch & share ideas</h1>

      <div className="wb-toolbar">
        <div className="wb-tools">
          <button type="button" className={`wb-tool${tool === "pen" ? " active" : ""}`} onClick={() => setTool("pen")}>✏ Pen</button>
          <button type="button" className={`wb-tool${tool === "eraser" ? " active" : ""}`} onClick={() => setTool("eraser")}>⌫ Eraser</button>
        </div>
        <div className="wb-swatches">
          {COLORS.map(c => (
            <button key={c} type="button" aria-label={`color ${c}`} className={`wb-swatch${color === c && tool === "pen" ? " active" : ""}`} style={{ background: c }} onClick={() => { setColor(c); setTool("pen") }} />
          ))}
        </div>
        <label className="wb-size">Size
          <input type="range" min={1} max={24} value={size} onChange={e => setSize(+e.target.value)} />
        </label>
        <div className="wb-actions">
          <button type="button" className="super-ghost" onClick={undo} disabled={!canUndo}>Undo</button>
          <button type="button" className="super-ghost" onClick={clear}>Clear</button>
          <button type="button" className="super-primary" onClick={save}>Save PNG</button>
        </div>
      </div>

      <div className="wb-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="wb-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>

      <style>{`
        .wb-title { margin: 6px 0 14px; font: 700 clamp(24px, 5vw, 36px)/1.02 var(--font-narrative); letter-spacing: -.03em; }
        .wb-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
        .wb-tools, .wb-actions { display: flex; gap: 8px; }
        .wb-tool { min-height: 38px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-raised); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .wb-tool.active { border-color: var(--accent); background: var(--accent); color: var(--paper-raised); }
        .wb-swatches { display: flex; gap: 6px; }
        .wb-swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--line); cursor: pointer; }
        .wb-swatch.active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--paper-raised), 0 0 0 4px var(--accent); }
        .wb-size { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font: 600 12px var(--font-ui); }
        .wb-canvas-wrap { border: 1px solid var(--line); border-radius: calc(var(--radius) + 6px); overflow: hidden; background: #fff; }
        .wb-canvas { display: block; width: 100%; height: 56vh; min-height: 320px; touch-action: none; cursor: crosshair; }
        @media (max-width: 480px) { .wb-actions .super-primary { flex: 1; justify-content: center; } }
      `}</style>
    </main>
  )
}
