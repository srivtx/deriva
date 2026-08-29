"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

// ffmpeg.wasm, single-threaded core (no SharedArrayBuffer / COOP-COEP needed).
// The class worker is bundled to a self-contained same-origin file at
// public/ffmpeg/ffmpeg-worker.js — the library's default `new Worker(new
// URL("./worker.js", import.meta.url))` path is what Turbopack mangles in
// production, so we always route through classWorkerURL instead.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm"
type Op = "convert" | "compress" | "trim" | "audio" | "gif" | "resize"
type Kind = "video" | "audio"
type EngineState = "idle" | "loading" | "ready" | "error"

interface Output {
  url: string
  name: string
  size: number
  kind: Kind | "image"
  mime: string
}

let engineSingleton: FFmpeg | null = null
let enginePromise: Promise<FFmpeg> | null = null
let lastLogLines: string[] = []
let progressSink: ((p: number) => void) | null = null

async function loadEngine(onLoadPct: (p: number) => void): Promise<FFmpeg> {
  if (engineSingleton) return engineSingleton
  if (!enginePromise) {
    enginePromise = (async () => {
      const ff = new FFmpeg()
      ff.on("log", ({ message }) => {
        lastLogLines = [...lastLogLines.slice(-15), message]
      })
      ff.on("progress", ({ progress }) => {
        const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
        progressSink?.(p)
      })
      await ff.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm", true, (e) => {
          if (e.total > 0) onLoadPct(e.received / e.total)
        }),
        classWorkerURL: `${window.location.origin}/ffmpeg/ffmpeg-worker.js`,
      })
      engineSingleton = ff
      return ff
    })()
    enginePromise.catch(() => { enginePromise = null })
  }
  return enginePromise
}

const OPS: { id: Op; label: string }[] = [
  { id: "convert", label: "Convert" },
  { id: "compress", label: "Compress" },
  { id: "trim", label: "Trim" },
  { id: "audio", label: "Audio" },
  { id: "gif", label: "GIF" },
  { id: "resize", label: "Resize" },
]

export default function MediaPage() {
  const [dropping, setDropping] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [kind, setKind] = useState<Kind>("video")
  const [src, setSrc] = useState("")
  const [meta, setMeta] = useState({ duration: 0, w: 0, h: 0 })

  const [engine, setEngine] = useState<EngineState>("idle")
  const [loadPct, setLoadPct] = useState(0)

  const [op, setOp] = useState<Op>("convert")
  const [convertTarget, setConvertTarget] = useState<"mp4" | "webm" | "mp3" | "wav">("mp4")
  const [crf, setCrf] = useState(26)
  const [audioRate, setAudioRate] = useState("128k")
  const [trimStart, setTrimStart] = useState("")
  const [trimEnd, setTrimEnd] = useState("")
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav">("mp3")
  const [gifFps, setGifFps] = useState(12)
  const [gifWidth, setGifWidth] = useState(480)
  const [resWidth, setResWidth] = useState(720)

  const [running, setRunning] = useState(false)
  const [pct, setPct] = useState(0)
  const [error, setError] = useState("")
  const [out, setOut] = useState<Output | null>(null)

  const outRef = useRef<Output | null>(null)
  const srcRef = useRef("")

  const acceptFile = useCallback((f?: File | null) => {
    if (!f) return
    const isVideo = f.type.startsWith("video/")
    const isAudio = f.type.startsWith("audio/")
    if (!isVideo && !isAudio) return
    setFile(f)
    setKind(isVideo ? "video" : "audio")
    setMeta({ duration: 0, w: 0, h: 0 })
    setOut(null); outRef.current = null
    setError("")
    setTrimStart(""); setTrimEnd("")
    setOp(isVideo ? "convert" : "compress")
    setConvertTarget(isVideo ? "mp4" : "mp3")
    if (srcRef.current) URL.revokeObjectURL(srcRef.current)
    const url = URL.createObjectURL(f)
    srcRef.current = url
    setSrc(url)
    if (!engineSingleton && !enginePromise) {
      setEngine("loading")
      loadEngine(setLoadPct).then(() => setEngine("ready")).catch(err => {
        setEngine("error")
        setError(engineFailMessage(err))
      })
    }
  }, [])

  useEffect(() => () => {
    if (outRef.current) URL.revokeObjectURL(outRef.current.url)
    if (srcRef.current) URL.revokeObjectURL(srcRef.current)
  }, [])

  const onMeta = (duration: number, w: number, h: number) => {
    setMeta({ duration, w, h })
    if (!trimEnd && duration > 0) setTrimEnd(duration.toFixed(2))
  }

  const fmtSize = (n: number) => n > 1_000_000 ? `${(n / 1_000_000).toFixed(2)} MB` : `${(n / 1000).toFixed(0)} KB`
  const fmtTime = (s: number) => {
    if (!Number.isFinite(s) || s <= 0) return "—"
    const m = Math.floor(s / 60), sec = Math.round(s % 60)
    return `${m}:${String(sec).padStart(2, "0")}`
  }

  const trimArgs = (): string[] => {
    const s = parseFloat(trimStart), e = parseFloat(trimEnd)
    const args: string[] = []
    if (Number.isFinite(s) && s > 0) args.push("-ss", String(s))
    if (Number.isFinite(e) && e > 0) args.push("-to", String(e))
    return args
  }

  interface Plan { args: string[]; outName: string; outKind: Kind | "image"; mime: string }
  const plan = (): Plan => {
    const input = `in.${(file!.name.split(".").pop() || "bin").toLowerCase()}`
    const cut = trimArgs()
    switch (op) {
      case "convert": {
        if (convertTarget === "mp4") return { args: [...cut, "-i", input, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", audioRate, "-movflags", "+faststart", "out.mp4"], outName: "out.mp4", outKind: "video", mime: "video/mp4" }
        if (convertTarget === "webm") return { args: [...cut, "-i", input, "-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis", "out.webm"], outName: "out.webm", outKind: "video", mime: "video/webm" }
        if (convertTarget === "mp3") return { args: [...cut, "-i", input, "-vn", "-c:a", "libmp3lame", "-q:a", "4", "out.mp3"], outName: "out.mp3", outKind: "audio", mime: "audio/mpeg" }
        return { args: [...cut, "-i", input, "-vn", "-c:a", "pcm_s16le", "out.wav"], outName: "out.wav", outKind: "audio", mime: "audio/wav" }
      }
      case "compress": {
        if (kind === "video") return { args: ["-i", input, "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-c:a", "aac", "-b:a", audioRate, "-movflags", "+faststart", "out.mp4"], outName: "out.mp4", outKind: "video", mime: "video/mp4" }
        return { args: ["-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", audioRate, "out.mp3"], outName: "out.mp3", outKind: "audio", mime: "audio/mpeg" }
      }
      case "trim": {
        if (kind === "video") return { args: [...cut, "-i", input, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", audioRate, "-movflags", "+faststart", "out.mp4"], outName: "out.mp4", outKind: "video", mime: "video/mp4" }
        return { args: [...cut, "-i", input, "-vn", "-c:a", "libmp3lame", "-q:a", "4", "out.mp3"], outName: "out.mp3", outKind: "audio", mime: "audio/mpeg" }
      }
      case "audio": {
        if (audioFormat === "mp3") return { args: ["-i", input, "-vn", "-c:a", "libmp3lame", "-q:a", "4", "out.mp3"], outName: "out.mp3", outKind: "audio", mime: "audio/mpeg" }
        return { args: ["-i", input, "-vn", "-c:a", "pcm_s16le", "out.wav"], outName: "out.wav", outKind: "audio", mime: "audio/wav" }
      }
      case "gif": {
        const vf = `fps=${gifFps},scale=${gifWidth}:-2:flags=lanczos`
        return {
          args: [
            "-i", input, "-vf", `${vf},palettegen`, "-y", "palette.png",
            ";;",
            ...cut, "-i", input, "-i", "palette.png", "-lavfi", `${vf}[x];[x][1:v]paletteuse`, "-y", "out.gif",
          ],
          outName: "out.gif", outKind: "image", mime: "image/gif",
        }
      }
      case "resize": {
        return { args: ["-i", input, "-vf", `scale=${resWidth}:-2`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", audioRate, "-movflags", "+faststart", "out.mp4"], outName: "out.mp4", outKind: "video", mime: "video/mp4" }
      }
    }
  }

  const changeOp = (id: Op) => {
    setOp(id)
    setError("")
    setPct(0)
    if (outRef.current) { URL.revokeObjectURL(outRef.current.url); outRef.current = null }
    setOut(null)
  }

  const validate = (): string => {
    if (!file) return ""
    if (op === "trim" || op === "gif") {
      const s = parseFloat(trimStart), e = parseFloat(trimEnd)
      if (op === "trim" && (!Number.isFinite(s) || !Number.isFinite(e))) return "Set both start and end."
      if (op === "trim" && s >= e) return "Start must be before end."
      if (op === "gif" && Number.isFinite(s) && Number.isFinite(e) && s >= e) return "Start must be before end."
    }
    if (op === "audio" && kind !== "video") return "Audio extraction works on a video — use Compress for audio files."
    if (op === "resize" && kind !== "video") return "Resize works on video — use Compress for audio."
    if (op === "gif" && kind !== "video") return "GIF works on video."
    return ""
  }

  const run = async () => {
    const problem = validate()
    if (problem) { setError(problem); return }
    if (!file || running) return
    setError("")
    setRunning(true)
    setPct(0)
    try {
      setEngine("loading")
      const ff = await loadEngine(setLoadPct)
      setEngine("ready")
      progressSink = setPct
      const p = plan()
      const input = `in.${(file.name.split(".").pop() || "bin").toLowerCase()}`
      const base = (file.name.replace(/\.[^.]+$/, "") || "media").slice(0, 40)
      await ff.writeFile(input, await fetchFile(file))
      try {
        if (p.outName === "out.gif") {
          const [pass1, pass2] = p.args.reduce<string[][]>((acc, a) => {
            if (a === ";;") acc.push([])
            else acc[acc.length - 1].push(a)
            return acc
          }, [[]])
          lastLogLines = []
          let code = await ff.exec(pass1)
          if (code !== 0) throw new Error(`palette pass failed (${code})`)
          code = await ff.exec(pass2)
          if (code !== 0) throw new Error(`GIF pass failed (${code})`)
        } else {
          lastLogLines = []
          const code = await ff.exec(p.args)
          if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`)
        }
        const data = await ff.readFile(p.outName)
        if (typeof data === "string") throw new Error("unexpected output")
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: p.mime })
        if (blob.size === 0) throw new Error("encoder produced an empty file — try a different format")
        if (outRef.current) URL.revokeObjectURL(outRef.current.url)
        const name = `${base}-deriva.${p.outName.split(".")[1]}`
        const made: Output = { url: URL.createObjectURL(blob), name, size: blob.size, kind: p.outKind, mime: p.mime }
        outRef.current = made
        setOut(made)
      } finally {
        try { await ff.deleteFile(input) } catch {}
        try { await ff.deleteFile(p.outName) } catch {}
        try { await ff.deleteFile("palette.png") } catch {}
      }
    } catch (err) {
      const detail = String(err instanceof Error ? err.message : err)
      const log = lastLogLines.slice(-4).join("\n")
      setError(detail + (log ? `\n${log}` : ""))
      progressSink = null
    } finally {
      setRunning(false)
      progressSink = null
    }
  }

  const savings = file && out ? Math.round((1 - out.size / file.size) * 100) : 0
  const engineLabel = engine === "ready" ? "engine ready" : engine === "loading" ? `loading engine ${Math.round(loadPct * 100)}%` : engine === "error" ? "engine failed" : "engine idle"

  return (
    <main className="super-page media-page">
      <header className="app-hero">
        <span className="super-kicker">MEDIA STUDIO</span>
        <h1>Cut · convert · compress</h1>
        <p>ffmpeg in your browser. Your files never leave the device.</p>
      </header>

      <div className="media-engine">
        <span className={`media-engine-dot ${engine}`} aria-hidden />
        <span className="media-engine-label">{engineLabel}</span>
        {engine === "idle" && (
          <button type="button" className="super-ghost" onClick={() => {
            setEngine("loading")
            loadEngine(setLoadPct).then(() => setEngine("ready")).catch(err => { setEngine("error"); setError(engineFailMessage(err)) })
          }}>Load engine</button>
        )}
        {engine === "loading" && <span className="media-engine-bar"><i style={{ width: `${Math.max(6, loadPct * 100)}%` }} /></span>}
      </div>

      <div
        className={`media-upload${dropping ? " dropping" : ""}`}
        onDragOver={e => { e.preventDefault(); setDropping(true) }}
        onDragLeave={() => setDropping(false)}
        onDrop={e => { e.preventDefault(); setDropping(false); acceptFile(e.dataTransfer.files?.[0]) }}
        onClick={() => document.getElementById("media-file-input")?.click()}
        role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter") document.getElementById("media-file-input")?.click() }}
      >
        <input id="media-file-input" type="file" accept="video/*,audio/*" onChange={e => acceptFile(e.target.files?.[0])} hidden />
        <span className="media-upload-plus">＋</span>
        <span className="media-upload-text">
          {file ? file.name : "Drop a video or audio file · click to browse"}
        </span>
      </div>

      {src && (
        <>
          <div className="media-preview">
            {kind === "video"
              ? <video src={src} controls preload="metadata" onLoadedMetadata={e => onMeta(e.currentTarget.duration, e.currentTarget.videoWidth, e.currentTarget.videoHeight)} />
              : <audio src={src} controls preload="metadata" onLoadedMetadata={e => onMeta(e.currentTarget.duration, 0, 0)} />}
            <p className="media-meta">
              {file && fmtSize(file.size)} · {fmtTime(meta.duration)}
              {meta.w > 0 && ` · ${meta.w}×${meta.h}`}
              {file && file.size > 300_000_000 && " · large file: in-browser work is slow past a few minutes of footage"}
            </p>
          </div>

          <div className="media-controls">
            <div className="super-field media-op-field"><span>Operation</span>
              <div className="segmented media-ops" role="group" aria-label="Operation">
                {OPS.filter(o => {
                  if (o.id === "audio") return kind === "video"
                  if (o.id === "gif" || o.id === "resize") return kind === "video"
                  return true
                }).map(o => (
                  <button key={o.id} type="button" className={op === o.id ? "selected" : ""} onClick={() => changeOp(o.id)}>{o.label}</button>
                ))}
              </div>
            </div>

            {op === "convert" && (
              <div className="super-field"><span>Target format</span>
                <div className="segmented" role="group" aria-label="Target format">
                  {(kind === "video"
                    ? [["mp4", "MP4"], ["webm", "WebM · slow"]] as const
                    : [["mp3", "MP3"], ["wav", "WAV"]] as const
                  ).map(([value, label]) => (
                    <button key={value} type="button" className={convertTarget === value ? "selected" : ""} onClick={() => setConvertTarget(value)}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {op === "compress" && (
              <>
                {kind === "video" && (
                  <label className="super-field"><span>Smaller ⟷ quality · CRF {crf}</span>
                    <input type="range" min={18} max={34} step={1} value={crf} onChange={e => setCrf(+e.target.value)} />
                  </label>
                )}
                <div className="super-field"><span>Audio bitrate</span>
                  <div className="segmented" role="group" aria-label="Audio bitrate">
                    {[["96k", "96"], ["128k", "128"], ["192k", "192"]].map(([value, label]) => (
                      <button key={value} type="button" className={audioRate === value ? "selected" : ""} onClick={() => setAudioRate(value)}>{label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(op === "trim" || op === "gif") && (
              <div className="super-field"><span>Clip range · seconds</span>
                <div className="media-range">
                  <input type="number" min={0} step={0.1} placeholder="start" value={trimStart} onChange={e => setTrimStart(e.target.value)} />
                  <span aria-hidden>→</span>
                  <input type="number" min={0} step={0.1} placeholder={`end${meta.duration ? ` (${meta.duration.toFixed(1)})` : ""}`} value={trimEnd} onChange={e => setTrimEnd(e.target.value)} />
                </div>
                {op === "gif" && <p className="media-field-hint">Empty = whole clip. GIF from the range you set.</p>}
              </div>
            )}

            {op === "audio" && (
              <div className="super-field"><span>Audio format</span>
                <div className="segmented" role="group" aria-label="Audio format">
                  <button type="button" className={audioFormat === "mp3" ? "selected" : ""} onClick={() => setAudioFormat("mp3")}>MP3</button>
                  <button type="button" className={audioFormat === "wav" ? "selected" : ""} onClick={() => setAudioFormat("wav")}>WAV</button>
                </div>
              </div>
            )}

            {op === "gif" && (
              <>
                <div className="super-field"><span>Frame rate</span>
                  <div className="segmented" role="group" aria-label="Frame rate">
                    {[8, 12, 16].map(v => (
                      <button key={v} type="button" className={gifFps === v ? "selected" : ""} onClick={() => setGifFps(v)}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className="super-field"><span>Width</span>
                  <div className="segmented" role="group" aria-label="Width">
                    {[320, 480, 640].map(v => (
                      <button key={v} type="button" className={gifWidth === v ? "selected" : ""} onClick={() => setGifWidth(v)}>{v}px</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {op === "resize" && (
              <div className="super-field"><span>Target width</span>
                <div className="segmented" role="group" aria-label="Target width">
                  {[480, 720, 1080].map(v => (
                    <button key={v} type="button" className={resWidth === v ? "selected" : ""} onClick={() => setResWidth(v)}>{v}px</button>
                  ))}
                </div>
              </div>
            )}

            <div className="media-actions">
              <button type="button" className="super-primary" disabled={running || engine === "loading" || !file} onClick={run}>
                {running ? "Working…" : engine === "loading" ? `Engine ${Math.round(loadPct * 100)}%` : "Run"}
              </button>
            </div>
          </div>

          {(running || pct > 0) && (
            <div className="media-progress" aria-live="polite">
              <span className="media-progress-bar"><i style={{ width: `${Math.round(pct * 100)}%` }} /></span>
              <span className="media-progress-pct">{running ? `${Math.round(pct * 100)}%` : "done"}</span>
            </div>
          )}

          {error && <pre className="media-error">{error}</pre>}

          {out && (
            <section className="media-result">
              <div className="media-result-preview">
                {out.kind === "video" && <video src={out.url} controls />}
                {out.kind === "audio" && <audio src={out.url} controls />}
                {out.kind === "image" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={out.url} alt="result" />}
              </div>
              <div className="media-result-stats">
                <div><span>Original</span><strong>{file ? fmtSize(file.size) : "—"}</strong></div>
                <div><span>Output · {out.kind === "image" ? "GIF" : out.name.split(".").pop()?.toUpperCase()}</span><strong>{fmtSize(out.size)}</strong></div>
                <div><span>Size change</span><strong className={savings > 0 ? "media-saved" : ""}>{savings > 0 ? `−${savings}%` : `${Math.abs(savings)}% bigger`}</strong></div>
                <a className="super-primary" href={out.url} download={out.name}>Download</a>
              </div>
            </section>
          )}
        </>
      )}
      {!src && (
        <p className="media-note">Everything runs locally with ffmpeg.wasm — the engine (~30&nbsp;MB) downloads once, then the browser caches it. No uploads, ever.</p>
      )}

      <style>{`
        .media-engine { display: flex; align-items: center; gap: 10px; margin: -6px 0 14px; color: var(--ink-soft); font: 700 10px var(--font-ui); letter-spacing: .12em; text-transform: uppercase; }
        .media-engine-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line); }
        .media-engine-dot.ready { background: var(--accent); }
        .media-engine-dot.loading { background: var(--ink-soft); animation: media-pulse 1.2s ease-in-out infinite; }
        .media-engine-dot.error { background: #b3261e; }
        .media-engine-bar { flex: 1; max-width: 220px; height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; }
        .media-engine-bar i { display: block; height: 100%; background: var(--accent); transition: width var(--dur-fast); }
        @keyframes media-pulse { 50% { opacity: .35; } }

        .media-upload { display: flex; align-items: center; gap: 14px; padding: 18px 16px; border: 2px dashed var(--line); border-radius: var(--radius); background: var(--paper-raised); cursor: pointer; transition: border-color var(--dur-fast), background var(--dur-fast); }
        .media-upload:hover, .media-upload.dropping { border-color: var(--accent); background: var(--accent-soft); }
        .media-upload-plus { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 2px solid var(--ink); border-radius: 8px; font: 800 16px var(--font-mono); color: var(--ink); flex-shrink: 0; }
        .media-upload-text { color: var(--ink-soft); font: 600 12px var(--font-ui); letter-spacing: .02em; overflow-wrap: anywhere; }

        .media-preview { margin: 16px 0 0; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-raised); padding: 12px; }
        .media-preview video { display: block; width: auto; max-width: 100%; max-height: 48vh; margin: 0 auto; border-radius: 6px; background: #000; }
        .media-preview audio { display: block; width: 100%; }
        .media-meta { margin: 8px 0 0; color: var(--ink-soft); font: 600 11px var(--font-mono); letter-spacing: .04em; }

        .media-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: end; margin: 16px 0; padding: 16px; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-raised); }
        .media-op-field { grid-column: 1 / -1; }
        .super-field span { font: 700 9px var(--font-ui) !important; letter-spacing: .14em; text-transform: uppercase; }
        .segmented button { text-transform: uppercase; font-weight: 800; letter-spacing: .06em; }
        .media-controls .segmented button { padding: 0 16px; white-space: nowrap; flex-shrink: 0; }
        .media-actions { display: flex; align-items: end; }
        .media-actions .super-primary { text-transform: uppercase; letter-spacing: .08em; font-weight: 800; }
        .media-actions .super-primary:disabled { opacity: .5; cursor: default; }
        .media-range { display: flex; align-items: center; gap: 8px; }
        .media-range input { width: 90px; padding: 8px 10px; border: 2px solid var(--line); border-radius: 8px; background: var(--paper); color: var(--ink); font: 700 13px var(--font-mono); }
        .media-range input:focus { outline: none; border-color: var(--accent); }
        .media-field-hint { margin: 6px 0 0; color: var(--ink-soft); font: 600 10px var(--font-ui); letter-spacing: .03em; }

        .media-progress { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; }
        .media-progress-bar { flex: 1; height: 8px; border-radius: 4px; background: var(--line); overflow: hidden; }
        .media-progress-bar i { display: block; height: 100%; background: var(--accent); transition: width var(--dur-fast); }
        .media-progress-pct { font: 800 12px var(--font-mono); color: var(--ink); min-width: 44px; text-align: right; }

        .media-error { margin: 0 0 14px; padding: 12px; border: 2px solid #b3261e; border-radius: var(--radius); background: var(--paper-raised); color: #b3261e; font: 600 11px var(--font-mono); white-space: pre-wrap; overflow-wrap: anywhere; }

        .media-result { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; margin-top: 4px; padding: 16px; border: 2px solid var(--ink); border-radius: var(--radius); background: var(--paper-raised); }
        .media-result-preview video, .media-result-preview img { display: block; width: auto; max-width: 100%; max-height: 46vh; margin: 0 auto; border-radius: 6px; background: #000; }
        .media-result-preview audio { display: block; width: 100%; }
        .media-result-stats { display: grid; gap: 12px; align-content: start; }
        .media-result-stats div { display: grid; gap: 2px; }
        .media-result-stats span { color: var(--ink-soft); font: 700 9px var(--font-ui); letter-spacing: .14em; text-transform: uppercase; }
        .media-result-stats strong { font: 800 20px "Doto", var(--font-mono); letter-spacing: .02em; }
        .media-result-stats .super-primary { justify-self: start; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; }
        .media-saved { color: var(--accent); }
        .media-note { margin-top: 18px; color: var(--ink-soft); font: 600 12px var(--font-ui); letter-spacing: .02em; text-align: center; }

        @media (max-width: 720px) {
          .media-op-field .segmented { overflow: visible; border-radius: var(--radius); flex-wrap: wrap; gap: 4px; }
          .media-op-field .segmented button { min-width: 0; }
          .media-op-field .segmented button.selected { border-radius: 999px; }
        }
        @media (max-width: 640px) { .media-result { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  )
}

function engineFailMessage(err: unknown): string {
  const detail = String(err instanceof Error ? err.message : err)
  return `The media engine failed to load (${detail}). If this repeats, an extension, antivirus, or network filter may be blocking the ffmpeg download from unpkg.com — try incognito to confirm.`
}
