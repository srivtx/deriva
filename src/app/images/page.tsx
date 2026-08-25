"use client"

import { useRef, useState } from "react"

type Format = "image/png" | "image/jpeg" | "image/webp"

interface Crop { x: number; y: number; w: number; h: number }

export default function ImagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [src, setSrc] = useState("")
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState<Crop | null>(null)
  const [format, setFormat] = useState<Format>("image/webp")
  const [quality, setQuality] = useState(0.85)
  const [maxDim, setMaxDim] = useState(0)
  const [outUrl, setOutUrl] = useState("")
  const [outSize, setOutSize] = useState(0)
  const [outDims, setOutDims] = useState({ w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ mode: "new" | "move"; ox: number; oy: number; start: Crop } | null>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setOutUrl("")
    if (src) URL.revokeObjectURL(src)
    setSrc(URL.createObjectURL(f))
  }

  const measure = () => {
    const img = imgRef.current
    if (!img) return
    setNat({ w: img.naturalWidth, h: img.naturalHeight })
    setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })
  }

  const toNatural = (clientX: number, clientY: number) => {
    const r = imgRef.current!.getBoundingClientRect()
    return { x: ((clientX - r.left) / r.width) * nat.w, y: ((clientY - r.top) / r.height) * nat.h }
  }

  const pointerDown = (e: React.PointerEvent) => {
    if (!crop) return
    e.preventDefault()
    const p = toNatural(e.clientX, e.clientY)
    const inside = p.x >= crop.x && p.x <= crop.x + crop.w && p.y >= crop.y && p.y <= crop.y + crop.h
    drag.current = inside
      ? { mode: "move", ox: p.x - crop.x, oy: p.y - crop.y, start: crop }
      : { mode: "new", ox: p.x, oy: p.y, start: { x: p.x, y: p.y, w: 0, h: 0 } }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  const pointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = toNatural(e.clientX, e.clientY)
    const d = drag.current
    if (d.mode === "new") {
      const x = Math.min(d.ox, p.x), y = Math.min(d.oy, p.y)
      setCrop({ x: Math.max(0, x), y: Math.max(0, y), w: Math.min(nat.w - x, Math.abs(p.x - d.ox)), h: Math.min(nat.h - y, Math.abs(p.y - d.oy)) })
    } else {
      setCrop({ x: Math.max(0, Math.min(p.x - d.ox, nat.w - d.start.w)), y: Math.max(0, Math.min(p.y - d.oy, nat.h - d.start.h)), w: d.start.w, h: d.start.h })
    }
  }

  const pointerUp = () => { drag.current = null }

  const resetCrop = () => setCrop({ x: 0, y: 0, w: nat.w, h: nat.h })

  const process = () => {
    if (!imgRef.current || !crop) return
    const scale = maxDim > 0 ? Math.min(1, maxDim / Math.max(crop.w, crop.h)) : 1
    const dw = Math.max(1, Math.round(crop.w * scale))
    const dh = Math.max(1, Math.round(crop.h * scale))
    const canvas = document.createElement("canvas")
    canvas.width = dw; canvas.height = dh
    const ctx = canvas.getContext("2d")!
    if (format === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, dw, dh) }
    ctx.drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, dw, dh)
    canvas.toBlob(blob => {
      if (!blob) return
      if (outUrl) URL.revokeObjectURL(outUrl)
      setOutUrl(URL.createObjectURL(blob)); setOutSize(blob.size); setOutDims({ w: dw, h: dh })
    }, format, quality)
  }

  const fmtSize = (n: number) => n > 1_000_000 ? `${(n / 1_000_000).toFixed(2)} MB` : `${(n / 1000).toFixed(0)} KB`
  const savings = file && outSize ? Math.round((1 - outSize / file.size) * 100) : 0

  return (
    <main className="super-page images-page">
      <header className="app-hero">
        <span className="super-kicker">IMAGE TOOLS</span>
        <h1>Compress · resize · convert · crop</h1>
        <p>Everything runs in your browser. Your photo never leaves the device.</p>
      </header>

      <label className="images-upload">
        <input type="file" accept="image/*" onChange={onFile} />
        <span>{file ? file.name : "Choose an image…"}</span>
      </label>

      {src && (
        <>
          <div className="images-controls">
            <div className="super-field"><span>Format</span>
              <div className="segmented" role="group" aria-label="Output format">
                {([["image/webp", "WebP"], ["image/jpeg", "JPEG"], ["image/png", "PNG"]] as const).map(([value, label]) => (
                  <button key={value} type="button" className={format === value ? "selected" : ""} onClick={() => setFormat(value)}>{label}</button>
                ))}
              </div>
            </div>
            {format !== "image/png" && (
              <label className="super-field"><span>Quality · {Math.round(quality * 100)}%</span>
                <input type="range" min={0.1} max={1} step={0.05} value={quality} onChange={e => setQuality(+e.target.value)} />
              </label>
            )}
            <label className="super-field"><span>Max side · {maxDim === 0 ? "original" : `${maxDim}px`}</span>
              <input type="range" min={0} max={2000} step={100} value={maxDim} onChange={e => setMaxDim(+e.target.value)} />
            </label>
            <div className="images-control-actions">
              <button type="button" className="super-ghost" onClick={resetCrop}>Reset crop</button>
              <button type="button" className="super-primary" onClick={process}>Process</button>
            </div>
          </div>

          <div className="images-stage">
            <div className="images-canvas-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={src} alt="preview" onLoad={measure} draggable={false} />
              {crop && nat.w > 0 && (
                <div
                  className="images-crop"
                  style={{ left: `${(crop.x / nat.w) * 100}%`, top: `${(crop.y / nat.h) * 100}%`, width: `${(crop.w / nat.w) * 100}%`, height: `${(crop.h / nat.h) * 100}%` }}
                  onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
                >
                  <span className="images-crop-size">{Math.round(crop.w)}×{Math.round(crop.h)}</span>
                </div>
              )}
            </div>
            <p className="images-hint">Drag on the image to select a crop region. Move the box to reposition.</p>
          </div>

          {outUrl && (
            <section className="images-result">
              <div className="images-result-stats">
                <div><span>Original</span><strong>{fmtSize(file!.size)}</strong></div>
                <div><span>Output</span><strong>{fmtSize(outSize)} · {outDims.w}×{outDims.h}</strong></div>
                <div><span>Saved</span><strong className="images-saved">{savings > 0 ? `${savings}%` : "—"}</strong></div>
              </div>
              <a className="super-primary" href={outUrl} download={`deriva-${format.split("/")[1]}.${format.split("/")[1] === "jpeg" ? "jpg" : format.split("/")[1]}`}>Download</a>
            </section>
          )}
        </>
      )}

      <style>{`
        .images-upload { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px dashed var(--line); border-radius: 12px; background: var(--paper-raised); cursor: pointer; color: var(--ink-soft); font: 600 13px var(--font-ui); }
        .images-upload input { display: none; }
        .images-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: end; margin: 16px 0; }
        .images-control-actions { display: flex; gap: 8px; align-items: end; }
        .images-stage { margin-top: 8px; }
        .images-canvas-wrap { position: relative; width: fit-content; max-width: 100%; margin: 0 auto; line-height: 0; border-radius: 12px; overflow: hidden; touch-action: none; background: #fff; }
        .images-canvas-wrap img { display: block; max-width: 100%; max-height: 60vh; width: auto; height: auto; margin: 0 auto; user-select: none; -webkit-user-drag: none; }
        .images-crop { position: absolute; border: 2px solid var(--accent); background: rgba(47,143,91,0.12); cursor: move; box-sizing: border-box; display: flex; align-items: flex-end; justify-content: flex-end; }
        .images-crop-size { font: 700 10px var(--font-mono); color: #fff; background: var(--accent); padding: 2px 6px; border-radius: 6px; margin: 4px; }
        .images-hint { color: var(--ink-soft); font: 12px var(--font-ui); margin: 8px 0 0; }
        .images-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 16px; padding: 16px; border: 1px solid var(--accent); border-radius: calc(var(--radius) + 6px); background: var(--paper-raised); }
        .images-result-stats { display: flex; gap: 20px; flex-wrap: wrap; }
        .images-result-stats div { display: grid; }
        .images-result-stats span { color: var(--ink-soft); font: 700 9px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; }
        .images-result-stats strong { font: 700 16px var(--font-mono); }
        .images-saved { color: var(--viz-settled); }
        @media (max-width: 480px) { .images-result { flex-direction: column; align-items: stretch; } .images-result .super-primary { justify-content: center; } }
      `}</style>
    </main>
  )
}
