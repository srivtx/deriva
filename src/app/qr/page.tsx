"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import jsQR from "jsqr"

type Tab = "generate" | "scan"

export default function QrPage() {
  const [tab, setTab] = useState<Tab>("generate")
  const [text, setText] = useState("https://deriva.srivtx.xyz")
  const [size, setSize] = useState(256)
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M")
  const [dataUrl, setDataUrl] = useState("")
  const [genError, setGenError] = useState("")

  const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window
  const [scanResult, setScanResult] = useState("")
  const [scanNote, setScanNote] = useState("")
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const scanningRef = useRef(false)

  // Live regeneration — the code always reflects what you typed.
  useEffect(() => {
    let cancelled = false
    const id = setTimeout(async () => {
      setGenError("")
      if (!text.trim()) { setDataUrl(""); return }
      try {
        const url = await QRCode.toDataURL(text, { width: size, errorCorrectionLevel: level, margin: 2 })
        if (!cancelled) setDataUrl(url)
      } catch { if (!cancelled) { setDataUrl(""); setGenError("Couldn't generate that.") } }
    }, 250)
    return () => { cancelled = true; clearTimeout(id) }
  }, [text, size, level])

  useEffect(() => () => stopScan(), [])

  const stopScan = () => {
    scanningRef.current = false
    setScanning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  /** Universal decode: BarcodeDetector when present, jsQR everywhere else. */
  const decodeCanvas = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    if (hasDetector) {
      try {
        const Detector = (window as any).BarcodeDetector
        const codes = await new Detector({ formats: ["qr_code"] }).detect(canvas)
        if (codes.length) return codes[0].rawValue
      } catch {}
    }
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const found = jsQR(data.data, data.width, data.height, { inversionAttempts: "dontInvert" })
    return found?.data ?? null
  }

  const detectFromFile = async (file: File) => {
    setScanResult(""); setScanNote("")
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas")
        const maxDim = 1280
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        canvas.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0, canvas.width, canvas.height)
        const found = await decodeCanvas(canvas)
        setScanResult(found ?? "")
        setScanNote(found ? "" : "No QR code found in that image.")
      } catch {
        setScanNote("Couldn't read that image.")
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => { setScanNote("Couldn't read that image."); URL.revokeObjectURL(url) }
    img.src = url
  }

  const startCamera = async () => {
    setScanNote(""); setScanResult("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanNote("No camera access in this browser — scan from an image instead.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      scanningRef.current = true
      setScanning(true)

      const loop = async () => {
        if (!scanningRef.current) return
        const v = videoRef.current
        const canvas = canvasRef.current
        if (v && canvas && v.videoWidth > 0) {
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          canvas.getContext("2d", { willReadFrequently: true })!.drawImage(v, 0, 0)
          try {
            const found = await decodeCanvas(canvas)
            if (found) {
              setScanResult(found)
              navigator.vibrate?.(12)
              stopScan()
              return
            }
          } catch {}
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch {
      setScanNote("Camera unavailable or permission denied — scan from an image instead.")
      scanningRef.current = false
      setScanning(false)
    }
  }

  const isUrl = /^https?:\/\//i.test(scanResult)
  const copyResult = async () => {
    if (scanResult) { try { await navigator.clipboard.writeText(scanResult); setScanNote("Copied") } catch {} }
  }

  return (
    <main className="super-page qr-page">
      <header className="app-hero">
        <span className="super-kicker">QR TOOLS</span>
        <h1>Generate & scan QR codes</h1>
        <p>Make a code for any link or text, or point your camera at one to read it.</p>
      </header>

      <div className="qr-tabs" role="group">
        <button type="button" className={`qr-tab${tab === "generate" ? " active" : ""}`} onClick={() => { stopScan(); setTab("generate") }}>Generate</button>
        <button type="button" className={`qr-tab${tab === "scan" ? " active" : ""}`} onClick={() => setTab("scan")}>Scan</button>
      </div>

      {tab === "generate" && (
        <div className="qr-gen">
          <label className="super-field"><span>Content</span>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Text or URL" />
          </label>
          <div className="qr-gen-row">
            <label className="super-field"><span>Size · {size}px</span>
              <input type="range" min={128} max={512} step={32} value={size} onChange={e => setSize(+e.target.value)} />
            </label>
            <div className="super-field"><span>Correction</span>
              <div className="segmented" role="group" aria-label="Error correction level">
                {(["L", "M", "Q", "H"] as const).map(option => (
                  <button key={option} type="button" className={level === option ? "selected" : ""} onClick={() => setLevel(option)}>{option}</button>
                ))}
              </div>
            </div>
          </div>
          {genError && <p className="qr-error">{genError}</p>}
          {dataUrl && (
            <div className="qr-output">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt="QR code" />
              <a className="super-primary" href={dataUrl} download="qrcode.png">Download PNG</a>
            </div>
          )}
        </div>
      )}

      {tab === "scan" && (
        <div className="qr-scan">
          <p className="qr-note">Works on every browser{hasDetector ? "" : " · using built-in jsQR decoder"}.</p>
          <div className="qr-scan-actions">
            {!scanning && <button type="button" className="super-primary" onClick={startCamera}>Use camera</button>}
            <label className="super-ghost qr-file">Scan from image
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && detectFromFile(e.target.files[0])} hidden />
            </label>
            {scanning && <button type="button" className="super-ghost" onClick={stopScan}>Stop</button>}
          </div>
          {scanNote && <p className="qr-error">{scanNote}</p>}
          <video ref={videoRef} className="qr-video" playsInline muted hidden={!scanning} />
          <canvas ref={canvasRef} hidden />
          {scanResult && (
            <div className="qr-result">
              <span className="super-kicker">DETECTED</span>
              <code>{scanResult}</code>
              <div className="qr-result-actions">
                {isUrl && <a className="super-ghost" href={scanResult} target="_blank" rel="noreferrer">Open</a>}
                <button type="button" className="super-ghost" onClick={copyResult}>Copy</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .qr-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .qr-tab { min-height: 40px; padding: 0 18px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-raised); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .qr-tab.active { border-color: var(--accent); background: var(--accent); color: var(--paper-raised); }
        .qr-gen-row { display: grid; grid-template-columns: 1fr 140px; gap: 12px; align-items: end; }
        .qr-error { color: var(--viz-pruned); font: 600 13px var(--font-ui); }
        .qr-note { color: var(--ink-soft); font: 600 12px var(--font-ui); margin-bottom: 10px; }
        .qr-output { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 16px; }
        .qr-output img { width: ${Math.min(size, 320)}px; max-width: 100%; border-radius: 12px; border: 1px solid var(--line); background: #fff; padding: 10px; }
        .qr-scan-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .qr-file { display: inline-flex; align-items: center; min-height: 38px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .qr-video { width: 100%; max-width: 420px; border-radius: 12px; border: 1px solid var(--line); }
        .qr-result { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; padding: 14px; border: 1px solid var(--accent); border-radius: 12px; background: var(--paper-raised); }
        .qr-result code { flex: 1; min-width: 160px; overflow-wrap: anywhere; font: 13px var(--font-mono); color: var(--accent); }
        .qr-result-actions { display: flex; gap: 8px; }
        @media (max-width: 480px) { .qr-gen-row { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  )
}
