"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { loadPreferences, savePreferences, applyPreferences } from "@/persistence/preferences"
import { NOTHING_DOTS } from "@/data/icon-packs"
import { NAV_ITEMS } from "@/data/nav-items"

type Size = 7 | 12 | 16
type Frame = boolean[][]

const SIZES: Size[] = [7, 12, 16]
const MAX_UNDO = 60
const MAX_FRAMES = 8

const DOT_SWATCHES = ["#F4F3EF", "#E02020", "#2F8F5B", "#E04A00", "#88C0D0", "#7C5CD6", "#FFC53D"]
const BG_SWATCHES = ["#0A0A0B", "#14171B", "#FFFFFF", "#E9E7DE", "transparent"]

function blank(size: number): Frame {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false))
}

function fromStrings(rows: string[]): Frame {
  return rows.map(row => row.split("").map(cell => cell === "#"))
}

function toStrings(frame: Frame): string[] {
  return frame.map(row => row.map(cell => (cell ? "#" : ".")).join(""))
}

// ── Glyph-Toy light pattern generators ──────────────────────────────
function patternComet(size: number, count: number): Frame[] {
  const frames: Frame[] = []
  const trail = Math.max(2, Math.floor(size / 3))
  for (let step = 0; step < count; step++) {
    const frame = blank(size)
    for (let i = 0; i <= trail; i++) {
      const x = (step - i + count * size) % size
      for (let y = 0; y < size; y++) frame[y][x] = true
    }
    frames.push(frame)
  }
  return frames
}

function patternPulse(size: number, count: number): Frame[] {
  return Array.from({ length: count }, (_, step) => {
    const ring = step % 3
    const frame = blank(size)
    frame.forEach((row, y) => row.forEach((_, x) => {
      const d = Math.max(Math.abs(x - (size - 1) / 2), Math.abs(y - (size - 1) / 2))
      if (Math.round(d) === ring) frame[y][x] = true
    }))
    return frame
  })
}

function patternRain(size: number, count: number): Frame[] {
  return Array.from({ length: count }, (_, step) => {
    const frame = blank(size)
    let seed = step * 7 + 13
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
    for (let x = 0; x < size; x++) {
      if (rand() > 0.55) frame[(step + x) % size][x] = true
      if (rand() > 0.75) frame[(step + x + 1) % size][x] = true
    }
    return frame
  })
}

function patternSpiral(size: number, count: number): Frame[] {
  return Array.from({ length: count }, (_, step) => {
    const frame = blank(size)
    const c = (size - 1) / 2
    frame.forEach((row, y) => row.forEach((_, x) => {
      const angle = Math.atan2(y - c, x - c)
      const dist = Math.hypot(x - c, y - c)
      const sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 4)
      if ((sector + step) % 4 === 0 && dist > size * 0.18) row[x] = true
    }))
    return frame
  })
}

export default function GlyphPage() {
  const [size, setSize] = useState<Size>(7)
  const [frames, setFrames] = useState<Frame[]>(() => [fromStrings(NOTHING_DOTS.home)])
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [fps, setFps] = useState(5)
  const [onion, setOnion] = useState(false)
  const [tool, setTool] = useState<"draw" | "erase">("draw")
  const [dotColor, setDotColor] = useState("#F4F3EF")
  const [bgColor, setBgColor] = useState("#0A0A0B")
  const [glow, setGlow] = useState(45)
  const [dotScale, setDotScale] = useState(82)
  const [roundness, setRoundness] = useState(100)
  const [exportScale, setExportScale] = useState(12)
  const [history, setHistory] = useState<Frame[][]>([])
  const [slotMessage, setSlotMessage] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const painting = useRef(false)

  const frame = frames[Math.min(frameIndex, frames.length - 1)]

  useEffect(() => {
    if (!playing || frames.length < 2) return
    const interval = setInterval(() => setFrameIndex(index => (index + 1) % frames.length), Math.round(1000 / fps))
    return () => clearInterval(interval)
  }, [playing, fps, frames.length])

  const pushHistory = useCallback((currentFrames: Frame[]) => {
    setHistory(stack => [...stack.slice(-MAX_UNDO + 1), currentFrames.map(f => f.map(r => [...r]))])
  }, [])

  const mutate = useCallback((next: (frame: Frame, all: Frame[]) => Frame) => {
    setFrames(currentFrames => {
      pushHistory(currentFrames)
      const index = Math.min(frameIndex, currentFrames.length - 1)
      return currentFrames.map((f, i) => (i === index ? next(f, currentFrames) : f))
    })
  }, [frameIndex, pushHistory])

  const undo = useCallback(() => {
    setHistory(stack => {
      if (!stack.length) return stack
      setFrames(stack[stack.length - 1])
      setFrameIndex(index => Math.min(index, stack[stack.length - 1].length - 1))
      return stack.slice(0, -1)
    })
  }, [])

  const paint = useCallback((y: number, x: number) => {
    mutate(current => current.map((row, ry) => row.map((cell, rx) => (ry === y && rx === x ? tool === "draw" : cell))))
  }, [mutate, tool])

  const resize = useCallback((nextSize: Size) => {
    setSize(nextSize)
    setFrames(current => {
      pushHistory(current)
      return current.map(f => {
        const next = blank(nextSize)
        for (let y = 0; y < Math.min(nextSize, f.length); y++) {
          for (let x = 0; x < Math.min(nextSize, f.length); x++) next[y][x] = f[y][x]
        }
        return next
      })
    })
    setFrameIndex(0)
  }, [pushHistory])

  const invert = () => mutate(current => current.map(row => row.map(cell => !cell)))
  const clearAll = () => mutate(current => blank(current.length))
  const fillAll = () => mutate(current => current.map(row => row.map(() => true)))
  const mirrorH = () => mutate(current => current.map(row => [...row].reverse()))
  const mirrorV = () => mutate(current => [...current].reverse())
  const rotate = () => mutate(current => current[0].map((_, x) => current.map(row => row[x]).reverse()))
  const shiftBy = (dy: number, dx: number) =>
    mutate(current => current.map((row, y) => row.map((_, x) => {
      const sy = (y - dy + current.length) % current.length
      const sx = (x - dx + current.length) % current.length
      return current[sy][sx]
    })))

  const addFrame = (copyCurrent: boolean) => {
    if (frames.length >= MAX_FRAMES) {
      setSlotMessage(`Up to ${MAX_FRAMES} frames — that is plenty of blink.`)
      return
    }
    pushHistory(frames)
    setFrames(current => {
      const clone = copyCurrent ? current[frameIndex].map(row => [...row]) : blank(size)
      return [...current.slice(0, frameIndex + 1), clone, ...current.slice(frameIndex + 1)]
    })
    setFrameIndex(index => index + 1)
  }

  const deleteFrame = () => {
    if (frames.length === 1) {
      setSlotMessage("Keep at least one frame — clear it instead.")
      return
    }
    pushHistory(frames)
    setFrames(current => current.filter((_, i) => i !== frameIndex))
    setFrameIndex(index => Math.max(0, index - 1))
  }

  const applyPattern = (generator: (size: number, count: number) => Frame[], name: string) => {
    const count = Math.min(MAX_FRAMES, Math.max(4, size * 2))
    pushHistory(frames)
    setFrames(generator(size, count))
    setFrameIndex(0)
    setPlaying(true)
    setSlotMessage(`${name} pattern loaded — ${count} frames playing.`)
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText) as { size?: number; dots?: string[]; frames?: { dots: string[] }[] }
      const valid = (rows: unknown): rows is string[] =>
        Array.isArray(rows) && rows.every(row => typeof row === "string" && /^[.#]+$/.test(row))
      let side: number
      let nextFrames: Frame[]
      if (Array.isArray(parsed.frames) && parsed.frames.length && valid(parsed.frames[0].dots)) {
        side = parsed.frames[0].dots.length
        nextFrames = parsed.frames.map(f => fromStrings(f.dots))
      } else if (valid(parsed.dots)) {
        side = parsed.dots.length
        nextFrames = [fromStrings(parsed.dots)]
      } else throw new Error("bad")
      if (side !== 7 && side !== 12 && side !== 16) throw new Error("size")
      setSize(side as Size)
      setFrames(nextFrames.slice(0, MAX_FRAMES))
      setFrameIndex(0)
      setSlotMessage(`Imported ${side}×${side}${nextFrames.length > 1 ? `, ${nextFrames.length} frames` : ""}.`)
      setImportOpen(false)
    } catch {
      setSlotMessage("That JSON isn't a Deriva glyph — expected { dots: [...] } or { frames: [{dots}] }.")
    }
  }

  const saveToPersonalPack = (slotId: string) => {
    if (size !== 7) {
      setSlotMessage("Personal pack glyphs are 7×7 — switch the canvas to 7 first.")
      return
    }
    const preferences = loadPreferences()
    const next = { ...preferences, personalDots: { ...preferences.personalDots, [slotId]: toStrings(frame).join("/") } }
    savePreferences(next)
    applyPreferences(next)
    setSlotMessage(`Saved to ${NAV_ITEMS.find(item => item.id === slotId)?.label ?? slotId}. Switch your icon pack to Personal to see it live.`)
  }

  const svgMarkup = useMemo(() => buildSvg(frames, size, dotColor, bgColor, dotScale, roundness, playing ? fps : 0), [frames, size, dotColor, bgColor, dotScale, roundness, playing, fps])

  const downloadPng = () => {
    const canvas = document.createElement("canvas")
    const px = size * exportScale * 10
    canvas.width = px
    canvas.height = px
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    drawFrame(ctx, frame, px, dotColor, bgColor === "transparent" ? null : bgColor, glow, dotScale, roundness)
    const link = document.createElement("a")
    link.download = `deriva-glyph-${size}x${size}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const downloadSvg = () => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" })
    const link = document.createElement("a")
    link.download = `deriva-glyph-${size}x${size}${frames.length > 1 ? "-animated" : ""}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadJson = () => {
    const payload = JSON.stringify(
      frames.length > 1
        ? { v: 2, size, fps, frames: frames.map(f => ({ dots: toStrings(f) })) }
        : { v: 1, size, dots: toStrings(frame) },
      null, 2,
    )
    const blob = new Blob([payload], { type: "application/json" })
    const link = document.createElement("a")
    link.download = `deriva-glyph-${size}x${size}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <main className="glyph-app">
      <header className="glyph-head">
        <div>
          <span className="experiment-kicker">GLYPH STUDIO</span>
          <h1>Draw light.</h1>
        </div>
        <Link href="/settings#icons-heading" className="btn-ghost">Icon packs</Link>
      </header>

      <div className="glyph-layout">
        <section className="glyph-canvas-col">
          <div className="glyph-toolbar">
            <div className="chip-row" role="group" aria-label="Canvas size">
              {SIZES.map(s => (
                <button key={s} type="button" className={`app-chip${size === s ? " active" : ""}`} onClick={() => resize(s)}>{s}×{s}</button>
              ))}
            </div>
            <div className="chip-row" role="group" aria-label="Tool">
              <button type="button" className={`app-chip${tool === "draw" ? " active" : ""}`} onClick={() => setTool("draw")}>● Draw</button>
              <button type="button" className={`app-chip${tool === "erase" ? " active" : ""}`} onClick={() => setTool("erase")}>○ Erase</button>
              <button type="button" className="app-chip" onClick={undo} disabled={!history.length}>↩ Undo</button>
              <button type="button" className={`app-chip${onion ? " active" : ""}`} onClick={() => setOnion(on => !on)} title="Ghost the previous frame while drawing">◍ Onion</button>
            </div>
            <div className="chip-row" role="group" aria-label="Transforms">
              <button type="button" className="app-chip" onClick={mirrorH}>⇋ Flip H</button>
              <button type="button" className="app-chip" onClick={mirrorV}>⇅ Flip V</button>
              <button type="button" className="app-chip" onClick={rotate}>⟳ Rotate</button>
              <button type="button" className="app-chip" onClick={() => shiftBy(0, -1)}>←</button>
              <button type="button" className="app-chip" onClick={() => shiftBy(-1, 0)}>↑</button>
              <button type="button" className="app-chip" onClick={() => shiftBy(1, 0)}>↓</button>
              <button type="button" className="app-chip" onClick={() => shiftBy(0, 1)}>→</button>
              <button type="button" className="app-chip" onClick={fillAll}>■ Fill</button>
              <button type="button" className="app-chip" onClick={invert}>◑ Invert</button>
              <button type="button" className="app-chip" onClick={clearAll}>✕ Clear</button>
            </div>
          </div>

          <div
            className="glyph-canvas"
            style={{ background: bgColor === "transparent" ? "var(--paper)" : bgColor }}
            onPointerDown={() => { painting.current = true }}
            onPointerUp={() => { painting.current = false }}
            onPointerLeave={() => { painting.current = false }}
          >
            {onion && frameIndex > 0 && (
              <div className="glyph-canvas-row-stack onion-layer" aria-hidden="true">
                {frames[frameIndex - 1].map((row, y) => (
                  <div key={`o-${y}`} className="glyph-canvas-row">
                    {row.map((cell, x) => (
                      <span key={`o-${y}-${x}`} className={`glyph-pixel${cell ? " on" : ""}`} style={{ background: cell ? dotColor : "transparent", borderRadius: `${roundness}%`, transform: `scale(${cell ? dotScale / 100 : 1})`, opacity: .22 }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
            {frame.map((row, y) => (
              <div key={y} className="glyph-canvas-row">
                {row.map((cell, x) => (
                  <button
                    key={x}
                    type="button"
                    className={`glyph-pixel${cell ? " on" : ""}`}
                    style={{
                      background: cell ? dotColor : "transparent",
                      borderRadius: `${roundness}%`,
                      transform: `scale(${cell ? dotScale / 100 : 1})`,
                      boxShadow: cell ? `0 0 ${(glow / 100) * 14}px ${dotColor}` : "none",
                    }}
                    aria-label={`pixel ${y},${x}`}
                    onPointerDown={() => paint(y, x)}
                    onPointerEnter={() => { if (painting.current) paint(y, x) }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="glyph-frames-bar">
            <span className="glyph-frames-label">Frames · {frames.length}/{MAX_FRAMES}</span>
            <div className="chip-row" role="group" aria-label="Light frames">
              {frames.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  className={`glyph-thumb${i === frameIndex ? " active" : ""}`}
                  style={{ background: bgColor === "transparent" ? "var(--paper)" : bgColor }}
                  onClick={() => { setFrameIndex(i); setPlaying(false) }}
                  aria-label={`Frame ${i + 1}`}
                >
                  {toStrings(f).flatMap((row, y) => row.split("").map((cell, x) => cell === "#" ? (
                    <b key={`${y}-${x}`} style={{
                      left: `${(x / size) * 100}%`,
                      top: `${(y / size) * 100}%`,
                      width: `${(dotScale / 100 / size) * 100}%`,
                      height: `${(dotScale / 100 / size) * 100}%`,
                      background: dotColor,
                      borderRadius: `${roundness}%`,
                    }} />
                  ) : null))}
                </button>
              ))}
              <button type="button" className="app-chip" onClick={() => addFrame(true)} disabled={playing}>＋ Copy</button>
              <button type="button" className="app-chip" onClick={() => addFrame(false)} disabled={playing}>＋ Blank</button>
              <button type="button" className="app-chip" onClick={deleteFrame} disabled={playing}>🗑</button>
            </div>
            <div className="chip-row" role="group" aria-label="Playback">
              <button type="button" className={`app-chip${playing ? " active" : ""}`} onClick={() => { if (frames.length > 1) setPlaying(play => !play); else setSlotMessage("Add a second frame to animate.") }}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
              <label className="glyph-inline-field"><input type="range" min={2} max={12} value={fps} onChange={event => setFps(Number(event.target.value))} /> {fps} fps</label>
            </div>
          </div>

          <div className="glyph-patterns">
            <span className="glyph-frames-label">Light patterns · Glyph-Toy generators</span>
            <div className="chip-row" role="group" aria-label="Generated light patterns">
              <button type="button" className="app-chip" onClick={() => applyPattern(patternComet, "Comet")}>☄ Comet</button>
              <button type="button" className="app-chip" onClick={() => applyPattern(patternPulse, "Pulse")}>◎ Pulse</button>
              <button type="button" className="app-chip" onClick={() => applyPattern(patternRain, "Rain")}>☂ Rain</button>
              <button type="button" className="app-chip" onClick={() => applyPattern(patternSpiral, "Spiral")}>✺ Spiral</button>
            </div>
          </div>
        </section>

        <aside className="glyph-panel">
          <h2>Light &amp; material</h2>
          <label className="glyph-field"><span>Dot color</span>
            <span className="swatch-row">
              {DOT_SWATCHES.map(color => (
                <button key={color} type="button" aria-label={color} className={`swatch${dotColor === color ? " selected" : ""}`} style={{ background: color }} onClick={() => setDotColor(color)} />
              ))}
              <input type="color" value={dotColor} onChange={event => setDotColor(event.target.value)} aria-label="Custom dot color" />
            </span>
          </label>
          <label className="glyph-field"><span>Surface</span>
            <span className="swatch-row">
              {BG_SWATCHES.map(color => (
                <button key={color} type="button" aria-label={color} className={`swatch${bgColor === color ? " selected" : ""}`} style={color === "transparent" ? { background: "repeating-conic-gradient(#bbb 0% 25%, #fff 0% 50%) 50%/10px 10px" } : { background: color }} onClick={() => setBgColor(color)} />
              ))}
              <input type="color" value={bgColor === "transparent" ? "#000000" : bgColor} onChange={event => setBgColor(event.target.value)} aria-label="Custom surface color" />
            </span>
          </label>
          <label className="glyph-field"><span>Glow · {glow}</span><input type="range" min={0} max={100} value={glow} onChange={event => setGlow(Number(event.target.value))} /></label>
          <label className="glyph-field"><span>Dot scale · {dotScale}%</span><input type="range" min={55} max={96} value={dotScale} onChange={event => setDotScale(Number(event.target.value))} /></label>
          <label className="glyph-field"><span>Square ↔ round · {roundness}%</span><input type="range" min={0} max={100} value={roundness} onChange={event => setRoundness(Number(event.target.value))} /></label>

          <h2>Export</h2>
          <p className="settings-hint">{frames.length > 1 ? `Multi-frame → SVG animates at ${fps} fps.` : "Single frame → PNG / SVG / JSON."}</p>
          <label className="glyph-field"><span>PNG resolution · ×{exportScale * 10}px per tile</span>
            <select value={exportScale} onChange={event => setExportScale(Number(event.target.value))}>
              {[4, 8, 12, 20].map(scale => <option key={scale} value={scale}>{scale * 10}px tiles</option>)}
            </select>
          </label>
          <div className="glyph-export-row">
            <button type="button" className="super-primary" onClick={downloadPng}>PNG</button>
            <button type="button" className="btn-ghost" onClick={downloadSvg}>{frames.length > 1 ? "Anim SVG" : "SVG"}</button>
            <button type="button" className="btn-ghost" onClick={downloadJson}>JSON</button>
            <button type="button" className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(svgMarkup); setSlotMessage("SVG markup copied.") }}>Copy SVG</button>
          </div>

          <h2>Use it</h2>
          <p className="settings-hint">Save any 7×7 frame into your Personal icon pack.</p>
          <select
            defaultValue=""
            onChange={event => { if (event.target.value) saveToPersonalPack(event.target.value); event.currentTarget.value = "" }}
            aria-label="Save glyph to navigation slot"
          >
            <option value="" disabled>Save to nav slot…</option>
            {NAV_ITEMS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <button type="button" className="btn-ghost" onClick={() => setImportOpen(open => !open)}>Import JSON</button>
          {importOpen && (
            <div style={{ display: "grid", gap: 8 }}>
              <textarea className="settings-field-input" rows={3} value={importText} onChange={event => setImportText(event.target.value)} placeholder='{"frames":[{"dots":["####.","#...."]}]} or {"dots":[…]}' spellCheck={false} />
              <button type="button" className="btn-ghost" onClick={importJson}>Load glyph</button>
            </div>
          )}
          {slotMessage && <small className="glyph-message">{slotMessage}</small>}
        </aside>
      </div>
    </main>
  )
}

// ── rendering helpers ───────────────────────────────────────────────

function drawFrame(ctx: CanvasRenderingContext2D, frameData: Frame, px: number, dotColor: string, bg: string | null, glow: number, dotScale: number, roundness: number) {
  const size = frameData.length
  ctx.clearRect(0, 0, px, px)
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, px, px)
  }
  ctx.fillStyle = dotColor
  ctx.shadowColor = glow > 0 ? dotColor : "transparent"
  ctx.shadowBlur = (glow / 100) * (px / size) * 0.6
  const step = px / size
  const dot = (dotScale / 100) * step
  frameData.forEach((row, y) => row.forEach((cell, x) => {
    if (!cell) return
    const cx = x * step + step / 2
    const cy = y * step + step / 2
    ctx.beginPath()
    if (roundness >= 50) {
      ctx.arc(cx, cy, (dot / 2) * 0.92, 0, Math.PI * 2)
    } else {
      ctx.roundRect(cx - dot / 2, cy - dot / 2, dot, dot, (dot * (50 - roundness)) / 50)
    }
    ctx.fill()
  }))
}

function buildSvg(framesData: Frame[], size: number, dotColor: string, bgColor: string, dotScale: number, roundness: number, fps: number): string {
  const pad = 24
  const view = size * 100 + pad * 2
  const bg = bgColor === "transparent" ? "" : `<rect width="${view}" height="${view}" fill="${bgColor}"/>`
  const animated = fps > 0 && framesData.length > 1
  const duration = framesData.length / (fps || 5)

  const groups = framesData.map((frameData, frameIdx) => {
    const dots = toStrings(frameData).flatMap((row, y) =>
      row.split("").map((cell, x) => ({ cell, cx: pad + x * 100 + 50, cy: pad + y * 100 + 50 })),
    )
    const shapes = dots.filter(({ cell }) => cell).map(({ cx, cy }) =>
      roundness >= 50
        ? `<circle cx="${cx}" cy="${cy}" r="${(dotScale / 2) * 0.92}" fill="${dotColor}"/>`
        : `<rect x="${cx - dotScale / 2}" y="${cy - dotScale / 2}" width="${dotScale}" height="${dotScale}" rx="${(dotScale * (50 - roundness)) / 50}" fill="${dotColor}"/>`,
    )
    if (!animated) return shapes.join("")
    const seg = 100 / framesData.length
    const valuesArr = framesData.map((_, k) => (k === frameIdx ? 1 : 0))
    valuesArr.push(valuesArr[0])
    const keyTimes = framesData.map((_, k) => ((k * seg) / 100).toFixed(3))
    keyTimes.push("1")
    return `<g>${shapes.join("")}<animate attributeName="opacity" values="${valuesArr.join(";")}" keyTimes="${keyTimes.join(";")}" dur="${duration}s" repeatCount="indefinite"/></g>`
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${view}" height="${view}" viewBox="0 0 ${view} ${view}">${bg}${groups.join("")}</svg>`
}
