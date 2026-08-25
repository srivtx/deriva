"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"

type Tab = "generate" | "scan"

export default function QrPage() {
  const [tab, setTab] = useState<Tab>("generate")
  const [text, setText] = useState("https://deriva.srivtx.xyz")
  const [size, setSize] = useState(256)
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M")
  const [dataUrl, setDataUrl] = useState("")
  const [genError, setGenError] = useState("")

  const [supported, setSupported] = useState(false)
  const [scanResult, setScanResult] = useState("")
  const [scanning, setScanning] = useState(false)
  const [camError, setCamError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "BarcodeDetector" in window)
    return () => stopScan()
  }, [])

  const generate = async () => {
    setGenError("")
    if (!text.trim()) { setGenError("Enter some text or a link."); return }
    try {
      const url = await QRCode.toDataURL(text, { width: size, errorCorrectionLevel: level, margin: 2 })
      setDataUrl(url)
    } catch { setGenError("Couldn't generate that.") }
  }

  useEffect(() => { generate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopScan = () => {
    setScanning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const detectFromFile = async (file: File) => {
    setScanResult("")
    const img = new Image()
    img.onload = async () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      canvas.getContext("2d")!.drawImage(img, 0, 0)
      try {
        const Detector = (window as any).BarcodeDetector
        const codes = await new Detector().detect(canvas)
        setScanResult(codes[0]?.rawValue ?? "No QR code found in image.")
      } catch { setScanResult("Scanning not supported in this browser.") }
    }
    img.src = URL.createObjectURL(file)
  }

  const startCamera = async () => {
    setCamError(""); setScanResult("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      setScanning(true)
      const Detector = (window as any).BarcodeDetector
      const detector = new Detector()
      const loop = async () => {
        if (!scanning) return
        const canvas = canvasRef.current!
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        if (canvas.width > 0) {
          canvas.getContext("2d")!.drawImage(video, 0, 0)
          try {
            const codes = await detector.detect(canvas)
            if (codes.length) { setScanResult(codes[0].rawValue); stopScan(); return }
          } catch {}
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      setCamError("Camera unavailable. You can still scan from an image.")
      setScanning(false)
    }
  }

  const copyResult = async () => {
    if (scanResult) { try { await navigator.clipboard.writeText(scanResult); setCamError("Copied") } catch {} }
  }

  return (
    <main className="super-page qr-page">
      <span className="super-kicker">QR TOOLS</span>
      <h1 className="qr-title">Generate & scan QR codes</h1>

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
            <label className="super-field"><span>Correction</span>
              <select value={level} onChange={e => setLevel(e.target.value as any)}>
                <option value="L">L</option><option value="M">M</option><option value="Q">Q</option><option value="H">H</option>
              </select>
            </label>
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
          {!supported && <p className="qr-error">QR scanning isn&apos;t supported in this browser. Try the latest Chrome/Edge on Android.</p>}
          <div className="qr-scan-actions">
            <button type="button" className="super-primary" onClick={startCamera} disabled={!supported || scanning}>Use camera</button>
            <label className="super-ghost qr-file">Scan from image
              <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && detectFromFile(e.target.files[0])} hidden />
            </label>
            {scanning && <button type="button" className="super-ghost" onClick={stopScan}>Stop</button>}
          </div>
          {camError && <p className="qr-error">{camError}</p>}
          <video ref={videoRef} className="qr-video" playsInline muted hidden={!scanning} />
          <canvas ref={canvasRef} hidden />
          {scanResult && (
            <div className="qr-result">
              <span className="super-kicker">DETECTED</span>
              <code>{scanResult}</code>
              <button type="button" className="super-ghost" onClick={copyResult}>Copy</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .qr-title { margin: 6px 0 14px; font: 700 clamp(24px, 5vw, 36px)/1.02 var(--font-narrative); letter-spacing: -.03em; }
        .qr-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .qr-tab { min-height: 40px; padding: 0 18px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-raised); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .qr-tab.active { border-color: var(--accent); background: var(--accent); color: var(--paper-raised); }
        .qr-gen-row { display: grid; grid-template-columns: 1fr 140px; gap: 12px; align-items: end; }
        .qr-error { color: var(--viz-pruned); font: 600 13px var(--font-ui); }
        .qr-output { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 16px; }
        .qr-output img { width: 256px; max-width: 100%; border-radius: 12px; border: 1px solid var(--line); background: #fff; padding: 10px; }
        .qr-scan-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .qr-file { display: inline-flex; align-items: center; min-height: 38px; padding: 0 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); color: var(--ink-soft); font: 600 13px var(--font-ui); cursor: pointer; }
        .qr-video { width: 100%; max-width: 420px; border-radius: 12px; border: 1px solid var(--line); }
        .qr-result { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 14px; padding: 14px; border: 1px solid var(--accent); border-radius: 12px; background: var(--paper-raised); }
        .qr-result code { flex: 1; min-width: 0; overflow-wrap: anywhere; font: 13px var(--font-mono); color: var(--accent); }
        @media (max-width: 480px) { .qr-gen-row { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  )
}
