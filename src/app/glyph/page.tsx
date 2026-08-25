"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { loadPreferences, savePreferences, applyPreferences } from "@/persistence/preferences"
import { NOTHING_DOTS } from "@/data/icon-packs"
import { NAV_ITEMS } from "@/data/nav-items"

type Size = 7 | 12 | 16

const SIZES: Size[] = [7, 12, 16]
const MAX_UNDO = 60

const DOT_SWATCHES = ["#F4F3EF", "#E02020", "#2F8F5B", "#E04A00", "#88C0D0", "#7C5CD6", "#FFC53D"]
const BG_SWATCHES = ["#0A0A0B", "#14171B", "#FFFFFF", "#E9E7DE", "transparent"]

function blank(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false))
}

function fromStrings(rows: string[]): boolean[][] {
  return rows.map(row => row.split("").map(cell => cell === "#"))
}

function toStrings(rows: boolean[][]): string[] {
  return rows.map(row => row.map(cell => (cell ? "#" : ".")).join(""))
}

export default function GlyphPage() {
  const [size, setSize] = useState<Size>(7)
  const [rows, setRows] = useState<boolean[][]>(() => fromStrings(NOTHING_DOTS.home))
  const [tool, setTool] = useState<"draw" | "erase">("draw")
  const [dotColor, setDotColor] = useState("#F4F3EF")
  const [bgColor, setBgColor] = useState("#0A0A0B")
  const [glow, setGlow] = useState(45)
  const [dotScale, setDotScale] = useState(82)
  const [roundness, setRoundness] = useState(100)
  const [exportScale, setExportScale] = useState(12)
  const [history, setHistory] = useState<boolean[][][]>([])
  const [slotMessage, setSlotMessage] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const painting = useRef(false)

  const pushHistory = useCallback((current: boolean[][]) => {
    setHistory(stack => [...stack.slice(-MAX_UNDO + 1), current.map(row => [...row])])
  }, [])

  const mutate = useCallback((next: (rows: boolean[][]) => boolean[][]) => {
    setRows(current => {
      pushHistory(current)
      return next(current)
    })
  }, [pushHistory])

  const undo = useCallback(() => {
    setHistory(stack => {
      if (!stack.length) return stack
      setRows(stack[stack.length - 1])
      return stack.slice(0, -1)
    })
  }, [])

  const paint = useCallback((y: number, x: number) => {
    setRows(current => current.map((row, ry) => row.map((cell, rx) => (ry === y && rx === x ? tool === "draw" : cell))))
  }, [tool])

  const resize = useCallback((nextSize: Size) => {
    setSize(nextSize)
    setRows(current => {
      pushHistory(current)
      const next = blank(nextSize)
      for (let y = 0; y < Math.min(nextSize, current.length); y++) {
        for (let x = 0; x < Math.min(nextSize, current.length); x++) next[y][x] = current[y][x]
      }
      return next
    })
  }, [pushHistory])

  const invert = () => mutate(rows => rows.map(row => row.map(cell => !cell)))
  const clearAll = () => mutate(rows => blank(rows.length))
  const fillAll = () => mutate(rows => rows.map(row => row.map(() => true)))
  const mirrorH = () => mutate(rows => rows.map(row => [...row].reverse()))
  const mirrorV = () => mutate(rows => [...rows].reverse())
  const rotate = () => mutate(rows => rows[0].map((_, x) => rows.map(row => row[x]).reverse()))
  const shift = (dy: number, dx: number) =>
    mutate(rows => rows.map((row, y) => row.map((_, x) => {
      const sy = (y - dy + rows.length) % rows.length
      const sx = (x - dx + rows.length) % rows.length
      return rows[sy][sx]
    })))

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText) as { size?: number; dots?: string[] }
      if (!Array.isArray(parsed.dots) || !parsed.dots.every(row => /^[.#]+$/.test(row))) throw new Error("bad")
      const side = parsed.dots.length
      if (side !== 7 && side !== 12 && side !== 16) throw new Error("size")
      setSize(side as Size)
      setRows(fromStrings(parsed.dots))
      setSlotMessage(`Imported ${side}×${side} glyph.`)
      setImportOpen(false)
    } catch {
      setSlotMessage("That JSON isn't a Deriva glyph — expected { size, dots: [\"#....\", …] }")
    }
  }

  const saveToPersonalPack = (slotId: string) => {
    if (size !== 7) {
      setSlotMessage("Personal pack glyphs are 7×7 — switch the canvas to 7 first.")
      return
    }
    const preferences = loadPreferences()
    const next = { ...preferences, personalDots: { ...preferences.personalDots, [slotId]: toStrings(rows).join("/") } }
    savePreferences(next)
    applyPreferences(next)
    setSlotMessage(`Saved to ${NAV_ITEMS.find(item => item.id === slotId)?.label ?? slotId}. Switch your icon pack to Personal to see it live.`)
  }

  const svgMarkup = useMemo(() => {
    const pad = 24
    const view = size * 100 + pad * 2
    const cells = toStrings(rows).flatMap((row, y) =>
      row.split("").map((cell, x) => ({ cell, cx: pad + x * 100 + 50, cy: pad + y * 100 + 50 })),
    )
    const dots = cells.filter(({ cell }) => cell).map(({ cx, cy }) =>
      roundness >= 50
        ? `<circle cx="${cx}" cy="${cy}" r="${(dotScale / 2) * 0.92}" fill="${dotColor}"/>`
        : `<rect x="${cx - dotScale / 2}" y="${cy - dotScale / 2}" width="${dotScale}" height="${dotScale}" rx="${(dotScale * (50 - roundness)) / 50}" fill="${dotColor}"/>`,
    )
    const bg = bgColor === "transparent" ? "" : `<rect width="${view}" height="${view}" fill="${bgColor}"/>`
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${view}" height="${view}" viewBox="0 0 ${view} ${view}">${bg}${dots.join("")}</svg>`
  }, [rows, size, dotColor, bgColor, glow, dotScale, roundness])

  const downloadPng = () => {
    const canvas = document.createElement("canvas")
    const px = size * exportScale * 10
    canvas.width = px
    canvas.height = px
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, px, px)
    }
    ctx.fillStyle = dotColor
    ctx.shadowColor = glow > 0 ? dotColor : "transparent"
    ctx.shadowBlur = (glow / 100) * exportScale * 6
    const step = px / size
    const dot = (dotScale / 100) * step
    rows.forEach((row, y) => row.forEach((cell, x) => {
      if (!cell) return
      const cx = x * step + step / 2
      const cy = y * step + step / 2
      ctx.beginPath()
      if (roundness >= 50) {
        ctx.arc(cx, cy, dot / 2 * 0.92, 0, Math.PI * 2)
      } else {
        const r = (dot * (50 - roundness)) / 50
        ctx.roundRect(cx - dot / 2, cy - dot / 2, dot, dot, r)
      }
      ctx.fill()
    }))
    const link = document.createElement("a")
    link.download = `deriva-glyph-${size}x${size}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const downloadSvg = () => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" })
    const link = document.createElement("a")
    link.download = `deriva-glyph-${size}x${size}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const downloadJson = () => {
    const payload = JSON.stringify({ v: 1, size, dots: toStrings(rows) }, null, 2)
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
            </div>
            <div className="chip-row" role="group" aria-label="Transforms">
              <button type="button" className="app-chip" onClick={mirrorH}>⇋ Flip H</button>
              <button type="button" className="app-chip" onClick={mirrorV}>⇅ Flip V</button>
              <button type="button" className="app-chip" onClick={rotate}>⟳ Rotate</button>
              <button type="button" className="app-chip" onClick={() => shift(0, -1)}>←</button>
              <button type="button" className="app-chip" onClick={() => shift(-1, 0)}>↑</button>
              <button type="button" className="app-chip" onClick={() => shift(1, 0)}>↓</button>
              <button type="button" className="app-chip" onClick={() => shift(0, 1)}>→</button>
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
            {rows.map((row, y) => (
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

          <div className="glyph-previews">
            <span>Live previews</span>
            <div className="glyph-preview-strip" aria-hidden="true">
              {[22, 30, 44].map(px => (
                <span key={px} className="glyph-preview-tile dark">
                  {toStrings(rows).map((row, y) => row.split("").map((cellChar, x) => cellChar === "#" ? (
                    <b key={`${px}-${y}-${x}`} style={{
                      position: "absolute",
                      left: `${(x / size) * 100}%`,
                      top: `${(y / size) * 100}%`,
                      width: `${(dotScale / 100 / size) * 100}%`,
                      height: `${(dotScale / 100 / size) * 100}%`,
                      background: dotColor,
                      borderRadius: `${roundness}%`,
                      boxShadow: `0 0 ${(glow / 100) * 8}px ${dotColor}`,
                    }} />
                  ) : null))}
                </span>
              ))}
              <span className="glyph-preview-tile light" style={{ ["--preview-dot" as string]: dotColor }}>
                {toStrings(rows).map((row, y) => row.split("").map((cellChar, x) => cellChar === "#" ? (
                  <b key={`l-${y}-${x}`} style={{
                    position: "absolute",
                    left: `${(x / size) * 100}%`,
                    top: `${(y / size) * 100}%`,
                    width: `${(dotScale / 100 / size) * 100}%`,
                    height: `${(dotScale / 100 / size) * 100}%`,
                    background: dotColor,
                    borderRadius: `${roundness}%`,
                  }} />
                ) : null))}
              </span>
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
          <label className="glyph-field"><span>PNG resolution · ×{exportScale * 10}px per tile</span>
            <select value={exportScale} onChange={event => setExportScale(Number(event.target.value))}>
              {[4, 8, 12, 20].map(scale => <option key={scale} value={scale}>{scale * 10}px tiles</option>)}
            </select>
          </label>
          <div className="glyph-export-row">
            <button type="button" className="super-primary" onClick={downloadPng}>PNG</button>
            <button type="button" className="btn-ghost" onClick={downloadSvg}>SVG</button>
            <button type="button" className="btn-ghost" onClick={downloadJson}>JSON</button>
            <button type="button" className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(svgMarkup); setSlotMessage("SVG markup copied.") }}>Copy SVG</button>
          </div>

          <h2>Use it</h2>
          <p className="settings-hint">Save any 7×7 glyph straight into your Personal icon pack.</p>
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
              <textarea className="settings-field-input" rows={3} value={importText} onChange={event => setImportText(event.target.value)} placeholder='{"v":1,"size":7,"dots":["#....","#..."]}' spellCheck={false} />
              <button type="button" className="btn-ghost" onClick={importJson}>Load glyph</button>
            </div>
          )}
          {slotMessage && <small className="glyph-message">{slotMessage}</small>}
        </aside>
      </div>
    </main>
  )
}
