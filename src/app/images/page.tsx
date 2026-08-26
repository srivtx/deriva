"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Format = "image/png" | "image/jpeg" | "image/webp"

interface Crop { x: number; y: number; w: number; h: number }

export default function ImagesPage() {
  const [dropping, setDropping] = useState(false)
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
  const drag = useRef<{ mode: "new" | "move" | "resize"; ox: number; oy: number; start: Crop } | null>(null)
  const [imgError, setImgError] = useState("")

  const acceptFile = useCallback((f?: File | null) => {
    if (!f || !f.type.startsWith("image/")) return
    setFile(f)
    if (outUrl) { URL.revokeObjectURL(outUrl); setOutUrl("") }
    if (src) URL.revokeObjectURL(src)
    setSrc(URL.createObjectURL(f))
    setImgError("")
  }, [outUrl, src])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"))
      if (item) acceptFile(item.getAsFile())
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [acceptFile])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => acceptFile(e.target.files?.[0])

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

  const MIN_CROP = 16

  const pointerDown = (e: React.PointerEvent) => {
    if (!crop || !nat.w) return
    e.preventDefault()
    const p = toNatural(e.clientX, e.clientY)
    const inside = p.x >= crop.x && p.x <= crop.x + crop.w && p.y >= crop.y && p.y <= crop.y + crop.h
    const onGrip =
      p.x >= crop.x + crop.w - nat.w * 0.06 && p.y >= crop.y + crop.h - nat.h * 0.06 &&
      p.x <= crop.x + crop.w + nat.w * 0.02 && p.y <= crop.y + crop.h + nat.w * 0.02
    drag.current = onGrip
      ? { mode: "resize", ox: crop.x, oy: crop.y, start: crop }
      : inside
        ? { mode: "move", ox: p.x - crop.x, oy: p.y - crop.y, start: crop }
        : { mode: "new", ox: p.x, oy: p.y, start: { x: p.x, y: p.y, w: 0, h: 0 } }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const clampCrop = (c: Crop): Crop => ({
    x: Math.max(0, Math.min(c.x, nat.w - MIN_CROP)),
    y: Math.max(0, Math.min(c.y, nat.h - MIN_CROP)),
    w: Math.max(MIN_CROP, Math.min(c.w, nat.w - Math.max(0, c.x))),
    h: Math.max(MIN_CROP, Math.min(c.h, nat.h - Math.max(0, c.y))),
  })

  const pointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    e.preventDefault()
    const p = toNatural(e.clientX, e.clientY)
    const d = drag.current
    if (d.mode === "new") {
      const x = Math.min(d.ox, p.x), y = Math.min(d.oy, p.y)
      setCrop(clampCrop({ x, y, w: Math.abs(p.x - d.ox), h: Math.abs(p.y - d.oy) }))
    } else if (d.mode === "move") {
      setCrop({ ...d.start, x: Math.max(0, Math.min(p.x - d.ox, nat.w - d.start.w)), y: Math.max(0, Math.min(p.y - d.oy, nat.h - d.start.h)) })
    } else {
      setCrop(clampCrop({ x: d.start.x, y: d.start.y, w: Math.max(MIN_CROP, p.x - d.start.x), h: Math.max(MIN_CROP, p.y - d.start.y) }))
    }
  }

  const pointerUp = () => { drag.current = null }

  const resetCrop = () => setCrop({ x: 0, y: 0, w: nat.w, h: nat.h })

  const process = () => {
    if (!imgRef.current || !crop) return
    if (crop.w < 8 || crop.h < 8) { setImgError("Crop is too small — drag a larger region."); return }
    setImgError("")
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

      <div
        className={`images-upload${dropping ? " dropping" : ""}`}
        onDragOver={e => { e.preventDefault(); setDropping(true) }}
        onDragLeave={() => setDropping(false)}
        onDrop={e => { e.preventDefault(); setDropping(false); acceptFile(e.dataTransfer.files?.[0]) }}
        onClick={() => document.getElementById("images-file-input")?.click()}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter") document.getElementById("images-file-input")?.click() }}
      >
        <input id="images-file-input" type="file" accept="image/*" onChange={onFile} hidden />
        <span className="images-upload-plus">＋</span>
        <span className="images-upload-text">
          {file ? file.name : "Drop an image · paste from clipboard · click to browse"}
        </span>
      </div>

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
              <img ref={imgRef} src={src} alt="preview" onLoad={measure} onError={() => setImgError("Couldn't load that image — try a PNG/JPG/WebP.")} draggable={false} />
              <div
                className="images-stage-hit"
                onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
              >
                {crop && nat.w > 0 && (
                  <div
                    className="images-crop"
                    style={{ left: `${(crop.x / nat.w) * 100}%`, top: `${(crop.y / nat.h) * 100}%`, width: `${(crop.w / nat.w) * 100}%`, height: `${(crop.h / nat.h) * 100}%` }}
                  >
                    <span className="images-crop-size">{Math.round(crop.w)}×{Math.round(crop.h)}</span>
                    <span className="images-grip" aria-hidden />
                  </div>
                )}
              </div>
            </div>
            {imgError && <p className="qr-error">{imgError}</p>}
            <p className="images-hint">Drag anywhere to draw a crop · drag inside to move · corner grip to resize.</p>
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
        .images-upload { display: flex; align-items: center; gap: 14px; padding: 18px 16px; border: 2px dashed var(--line); border-radius: var(--radius); background: var(--paper-raised); cursor: pointer; transition: border-color var(--dur-fast), background var(--dur-fast); }
        .images-upload:hover, .images-upload.dropping { border-color: var(--accent); background: var(--accent-soft, var(--paper-raised)); }
        .images-upload input { display: none; }
        .images-upload-plus { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 2px solid var(--ink); border-radius: 8px; font: 800 16px var(--font-mono); color: var(--ink); flex-shrink: 0; }
        .images-upload-text { color: var(--ink-soft); font: 600 12px var(--font-ui); letter-spacing: .02em; overflow-wrap: anywhere; }

        .images-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; align-items: end; margin: 18px 0; padding: 16px; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-raised); }
        .super-field span { font: 700 9px var(--font-ui) !important; letter-spacing: .14em; text-transform: uppercase; }
        .segmented button { text-transform: uppercase; font-weight: 800; letter-spacing: .06em; }
        .images-control-actions { display: flex; gap: 8px; align-items: end; }
        .images-control-actions .super-primary { text-transform: uppercase; letter-spacing: .08em; font-weight: 800; }

        .images-stage { margin-top: 8px; }
        .images-canvas-wrap { position: relative; width: fit-content; max-width: 100%; margin: 0 auto; line-height: 0; border: 2px solid var(--ink); border-radius: var(--radius); overflow: hidden; touch-action: none; background: #fff; }
        .images-canvas-wrap img { display: block; max-width: 100%; max-height: 58vh; width: auto; height: auto; margin: 0 auto; user-select: none; -webkit-user-drag: none; }
        .images-stage-hit { position: absolute; inset: 0; touch-action: none; cursor: crosshair; }

        .images-crop { position: absolute; border: 2px solid var(--accent); box-shadow: 0 0 0 9999px rgba(12,12,16,.45); cursor: move; box-sizing: border-box; display: flex; align-items: flex-end; justify-content: flex-end; background-image: linear-gradient(to right, transparent calc(33.3% - .5px), rgba(255,255,255,.35) 33.3%, transparent calc(33.3% + .5px)), linear-gradient(to right, transparent calc(66.6% - .5px), rgba(255,255,255,.35) 66.6%, transparent calc(66.6% + .5px)), linear-gradient(to bottom, transparent calc(33.3% - .5px), rgba(255,255,255,.35) 33.3%, transparent calc(33.3% + .5px)), linear-gradient(to bottom, transparent calc(66.6% - .5px), rgba(255,255,255,.35) 66.6%, transparent calc(66.6% + .5px)); }
        .images-grip { position: absolute; right: -2px; bottom: -2px; width: 20px; height: 20px; background: var(--accent); border: 2px solid #fff; border-radius: 4px; cursor: nwse-resize; box-shadow: none; }
        .images-crop-size { font: 800 11px var(--font-mono); color: var(--paper-raised); background: var(--accent); padding: 3px 7px; border-radius: 6px; margin: 5px; }
        .images-hint { color: var(--ink-soft); font: 600 11px var(--font-ui); letter-spacing: .04em; margin: 10px 0 0; text-align: center; }

        .images-result { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 16px; padding: 16px; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-raised); }
        .images-result-stats { display: flex; gap: 26px; flex-wrap: wrap; }
        .images-result-stats div { display: grid; gap: 2px; }
        .images-result-stats span { color: var(--ink-soft); font: 700 9px var(--font-ui); letter-spacing: .14em; text-transform: uppercase; }
        .images-result-stats strong { font: 800 20px "Doto", var(--font-mono); letter-spacing: .02em; }
        .images-saved { color: var(--accent); }
        @media (max-width: 480px) { .images-result { flex-direction: column; align-items: stretch; } .images-result .super-primary { justify-content: center; } }
      `}</style>
    </main>
  )
}
