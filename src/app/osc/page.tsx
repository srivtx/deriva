"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  oscEngine,
  STEPS,
  PITCHES,
  NOTE_NAMES,
  type Pattern,
  type Wave,
  emptyPattern,
} from "@/lib/osc/engine"
import { encodeShare, decodeShare } from "@/lib/osc/share"

const SAVE_KEY = "deriva-osc-state"
type Face = "dot" | "moss" | "ember" | "ultra"
type Saved = { patterns: Pattern[]; bpm: number; wave: Wave; cutoff: number; delayMix: number; active: number; face?: Face; swing?: number; gate?: number; song?: boolean }

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Saved
    if (!Array.isArray(s.patterns) || s.patterns.length !== 4) return null
    return s
  } catch { return null }
}

export default function OscPage() {
  const initial = useRef<Saved | null>(null)
  if (typeof window !== "undefined" && initial.current === null) initial.current = load()

  const [, force] = useState(0)
  const rerender = useCallback(() => force(n => n + 1), [])
  const [playing, setPlaying] = useState(false)

  // Engine is the source of truth — playback survives navigation, so the
  // transport must reflect reality on mount and while the page is open.
  useEffect(() => {
    const sync = () => setPlaying(oscEngine.playing)
    sync()
    const id = setInterval(sync, 300)
    return () => clearInterval(id)
  }, [])
  const [playhead, setPlayhead] = useState(-1)
  const [bpm, setBpmState] = useState(initial.current?.bpm ?? 128)
  const [wave, setWaveState] = useState<Wave>(initial.current?.wave ?? "sawtooth")
  const [cutoff, setCutoffState] = useState(initial.current?.cutoff ?? 1400)
  const [delayMix, setDelayState] = useState(initial.current?.delayMix ?? 0.22)
  const [face, setFaceState] = useState<Face>(initial.current?.face ?? "dot")
  const [swing, setSwingState] = useState(initial.current?.swing ?? 0)
  const [gateLen, setGateState] = useState(initial.current?.gate ?? 0.85)
  const [song, setSongState] = useState(initial.current?.song ?? false)
  const [mode, setModeState] = useState<"seq" | "live">("seq")
  const [visual, setVisual] = useState(false)
  const [rendering, setRendering] = useState(false)
  const visRef = useRef<HTMLCanvasElement>(null)
  const smoothRef = useRef<Float32Array>(new Float32Array(16))
  const hiColorRef = useRef("#2F8F5B")
  useEffect(() => {
    const el = document.querySelector(".osc-app")
    const v = el ? getComputedStyle(el).getPropertyValue("--osc-hi").trim() : ""
    hiColorRef.current = v || "#2F8F5B"
  }, [face])

  // Hydrate engine from saved state once.
  useEffect(() => {
    const s = initial.current
    if (!s) return
    oscEngine.patterns = s.patterns.map(p => p.map(r => Array.isArray(r) ? r.map(c => typeof c === "number" ? c : c ? 1 : 0) : []))
    oscEngine.active = s.active ?? 0
    oscEngine.setBpm(s.bpm)
    oscEngine.setWave(s.wave)
    oscEngine.setCutoff(s.cutoff)
    oscEngine.setDelayMix(s.delayMix)
    oscEngine.setSwing(s.swing ?? 0)
    oscEngine.setGate(s.gate ?? 0.85)
    oscEngine.setSongMode(s.song ?? false)
    rerender()
  }, [rerender])

  // Autosave: interval-based (never per-frame), plus flush on hide/unmount.
  const saveRef = useRef<() => void>(() => {})
  useEffect(() => {
    saveRef.current = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          patterns: oscEngine.patterns,
          bpm: oscEngine.bpm,
          wave: oscEngine.wave,
          cutoff: oscEngine.cutoff,
          delayMix: oscEngine.delayMix,
          active: oscEngine.active,
          face,
          swing: oscEngine.swing,
          gate: oscEngine.gate,
          song: oscEngine.songMode,
        }))
      } catch {}
    }
    const id = setInterval(saveRef.current, 900)
    const onHide = () => { if (document.visibilityState === "hidden") saveRef.current() }
    document.addEventListener("visibilitychange", onHide)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); saveRef.current() }
  }, [face])

  // Playhead follows the audio clock.
  useEffect(() => {
    if (!playing) { setPlayhead(-1); return }
    let raf = 0
    let last = -2
    let lastSlot = -2
    const loop = () => {
      const s = oscEngine.displayStep()
      if (s !== last) { last = s; setPlayhead(s) }
      if (oscEngine.songMode) {
        const slot = oscEngine.displaySlot()
        if (slot !== lastSlot) { lastSlot = slot; force(n => n + 1) }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    document.title = "OSC-1 · Deriva"
  }, [])

  // Dot-matrix spectrum: 16 columns x 6 dots, log-mapped bands, smoothed.
  useEffect(() => {
    if (!visual) return
    let raf = 0
    const draw = () => {
      const cv = visRef.current
      if (cv) {
        const ctx2d = cv.getContext("2d")
        if (ctx2d) {
          const dpr = Math.min(2, window.devicePixelRatio || 1)
          const w = cv.clientWidth || 320, h = cv.clientHeight || 96
          if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr) }
          ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx2d.clearRect(0, 0, w, h)
          const levels = oscEngine.levels(16)
          const sm = smoothRef.current
          const hi = hiColorRef.current
          const rows = 6
          const colW = w / 16
          const dotW = Math.min(colW - 3, 14)
          const rowH = h / rows
          const dotH = Math.min(dotW, rowH - 2)
          for (let c = 0; c < 16; c++) {
            sm[c] = sm[c] * 0.72 + levels[c] * 0.28
            const lit = Math.round(sm[c] * rows)
            for (let rIdx = 0; rIdx < rows; rIdx++) {
              const on = rIdx < lit
              ctx2d.globalAlpha = on ? 0.35 + 0.65 * (rIdx / rows) : 0.12
              ctx2d.fillStyle = on ? hi : "#9a9aa4"
              const x = c * colW + (colW - dotW) / 2
              const y = h - (rIdx + 1) * rowH + (rowH - dotH) / 2
              ctx2d.beginPath()
              ctx2d.roundRect(x, y, dotW, dotH, 2)
              ctx2d.fill()
            }
          }
          ctx2d.globalAlpha = 1
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [visual])

  const togglePlay = useCallback(async () => {
    await oscEngine.toggle()
    setPlaying(oscEngine.playing)
    navigator.vibrate?.(8)
  }, [])

  const exportWav = useCallback(async () => {
    setRendering(true)
    try {
      const blob = await oscEngine.renderWav(oscEngine.songMode ? 4 : 2)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `deriva-osc-${oscEngine.bpm}bpm.wav`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } finally {
      setRendering(false)
    }
  }, [])

  // Three states: off -> normal -> accented (louder) -> off.
  const toggleCell = useCallback((row: number, step: number) => {
    const col = oscEngine.patterns[oscEngine.active]
    const cur = col[row][step] ?? 0
    col[row][step] = cur === 0 ? 1 : cur === 1 ? 2 : 0
    if (col[row][step]) {
      oscEngine.preview(row)
      navigator.vibrate?.(4)
    }
    rerender()
  }, [rerender])

  // Hold a pattern LED for ~550ms: copy the active pattern into the next slot.
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ledHoldStart = useCallback((slot: number) => {
    holdRef.current = setTimeout(() => {
      holdRef.current = null
      const next = (slot + 1) % 4
      oscEngine.patterns[next] = oscEngine.patterns[slot].map(r => [...r])
      navigator.vibrate?.([10, 40, 10])
      rerender()
    }, 550)
  }, [rerender])
  const ledHoldCancel = useCallback(() => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null }
  }, [])

  const [shareNote, setShareNote] = useState("")
  const doShare = useCallback(() => {
    const code = encodeShare({
      bpm: oscEngine.bpm, wave: oscEngine.wave, cutoff: oscEngine.cutoff,
      delayMix: oscEngine.delayMix, swing: oscEngine.swing, gate: oscEngine.gate,
      song: oscEngine.songMode, active: oscEngine.active, patterns: oscEngine.patterns,
    })
    navigator.clipboard?.writeText(code).then(
      () => setShareNote("SHARE CODE COPIED — PASTE IT TO A FRIEND"),
      () => setShareNote(code),
    )
    rerender()
  }, [rerender])
  const doImport = useCallback(() => {
    const code = window.prompt("Paste an OSC-1 share code:")
    if (!code) return
    const s = decodeShare(code)
    if (!s) { setShareNote("INVALID SHARE CODE"); return }
    oscEngine.patterns = s.patterns
    oscEngine.active = s.active
    oscEngine.setBpm(s.bpm); oscEngine.setWave(s.wave); oscEngine.setCutoff(s.cutoff)
    oscEngine.setDelayMix(s.delayMix); oscEngine.setSwing(s.swing); oscEngine.setGate(s.gate)
    oscEngine.setSongMode(s.song)
    setBpmState(s.bpm); setWaveState(s.wave); setCutoffState(s.cutoff)
    setDelayState(s.delayMix); setSwingState(s.swing); setGateState(s.gate); setSongState(s.song)
    setShareNote("IMPORTED")
    rerender()
  }, [rerender])

  const selectPattern = useCallback((i: number) => {
    oscEngine.setActivePattern(i)
    navigator.vibrate?.(4)
    rerender()
  }, [rerender])

  const clearPattern = useCallback(() => {
    oscEngine.patterns[oscEngine.active] = emptyPattern()
    rerender()
  }, [rerender])

  const grid = oscEngine.patterns[oscEngine.active]

  return (
    <div className="osc-scroll">
      <div className="osc-app" data-face={face}>
        <header className="osc-head">
          <span className="osc-brand">OSC&#8209;1</span>
          <span className="osc-sub">POCKET SYNTHESIZER</span>
        </header>

        {/* transport */}
        <div className="osc-transport">
          <button
            type="button"
            aria-label={playing ? "Stop" : "Play"}
            className={`osc-play${playing ? " on" : ""}`}
            onClick={togglePlay}
          >
            {playing ? "■" : "▶"}
          </button>
          <div className="osc-pattern-leds">
            {[0, 1, 2, 3].map(i => (
              <button
                key={i}
                type="button"
                title="Tap to select · hold to copy this pattern into the next slot"
                className={`osc-led${(playing && oscEngine.songMode ? oscEngine.displaySlot() : oscEngine.active) === i ? " on" : ""}`}
                onPointerDown={() => ledHoldStart(i)}
                onPointerUp={() => { ledHoldCancel(); selectPattern(i) }}
                onPointerLeave={ledHoldCancel}
              >
                {"ABCD"[i]}
              </button>
            ))}
          </div>
          <div className="osc-bpm">
            <button type="button" className="osc-nudge" onClick={() => { oscEngine.setBpm(oscEngine.bpm - 2); setBpmState(oscEngine.bpm) }}>−</button>
            <span className="osc-readout">{String(bpm).padStart(3, "0")}</span>
            <button type="button" className="osc-nudge" onClick={() => { oscEngine.setBpm(oscEngine.bpm + 2); setBpmState(oscEngine.bpm) }}>+</button>
          </div>
        </div>

        {/* mode */}
        <div className="osc-mode">
          <button type="button" className={`osc-mode-seg${mode === "seq" ? " on" : ""}`} onClick={() => { setModeState("seq"); navigator.vibrate?.(4) }}>SEQUENCER</button>
          <button type="button" className={`osc-mode-seg${mode === "live" ? " on" : ""}`} onClick={() => { setModeState("live"); navigator.vibrate?.(4) }}>LIVE PADS</button>
        </div>

        {mode === "live" && (
          <div className="osc-pads">
            {NOTE_NAMES.map((n, row) => (
              <button key={row} type="button" className="osc-pad"
                onPointerDown={() => { oscEngine.preview(row); navigator.vibrate?.(6) }}
              >{n}</button>
            ))}
          </div>
        )}

        {/* grid */}
        <div className="osc-grid-wrap" hidden={mode === "live"}>
          <div className="osc-grid" role="grid" aria-label="Sequencer grid">
            {Array.from({ length: PITCHES }).map((_, row) => (
              <div key={row} className="osc-row">
                <span className="osc-note">{NOTE_NAMES[row]}</span>
                {Array.from({ length: STEPS }).map((_, step) => (
                  <button
                    key={step}
                    type="button"
                    aria-label={`${NOTE_NAMES[row]} step ${step + 1}`}
                    data-step={step}
                    data-on={(grid[row]?.[step] ?? 0) > 0 ? "1" : "0"}
                    data-accent={grid[row]?.[step] === 2 ? "1" : "0"}
                    data-head={playhead === step ? "1" : "0"}
                    data-bar={step % 4 === 0 ? "1" : "0"}
                    className="osc-cell"
                    onClick={() => toggleCell(row, step)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {visual && (
          <div className="osc-vis-box">
            <canvas ref={visRef} className="osc-vis" />
            <span className="osc-vis-label">SPECTRUM</span>
          </div>
        )}

        {/* controls */}
        <div className="osc-controls">
          <div className="osc-wave">
            {(["sine", "triangle", "sawtooth", "square"] as Wave[]).map(w => (
              <button
                key={w}
                type="button"
                className={`osc-seg${wave === w ? " on" : ""}`}
                onClick={() => { oscEngine.setWave(w); setWaveState(w); navigator.vibrate?.(4) }}
              >
                {{ sine: "SIN", triangle: "TRI", sawtooth: "SAW", square: "SQR" }[w]}
              </button>
            ))}
          </div>
          <label className="osc-knob">
            <span>CUTOFF</span>
            <input
              type="range" min={180} max={6000} step={10} value={cutoff}
              onChange={e => { const v = Number(e.target.value); oscEngine.setCutoff(v); setCutoffState(v) }}
            />
          </label>
          <label className="osc-knob">
            <span>DELAY</span>
            <input
              type="range" min={0} max={0.6} step={0.01} value={delayMix}
              onChange={e => { const v = Number(e.target.value); oscEngine.setDelayMix(v); setDelayState(v) }}
            />
          </label>
          <div className="osc-rowbtns">
            <button type="button" className={`osc-minibtn${visual ? " live" : ""}`} onClick={() => setVisual(v => !v)}>VISUAL</button>
            <button type="button" className="osc-minibtn" disabled={rendering} onClick={exportWav}>{rendering ? "RENDERING…" : "EXPORT WAV"}</button>
                        <button type="button" className={`osc-minibtn${song ? " live" : ""}`} onClick={() => { oscEngine.setSongMode(!oscEngine.songMode); setSongState(oscEngine.songMode); navigator.vibrate?.(4); rerender() }}>SONG {song ? "ON" : "OFF"}</button>
            <button type="button" className="osc-minibtn" onClick={clearPattern}>CLEAR PATTERN</button>
            <button type="button" className="osc-minibtn" onClick={doShare}>SHARE</button>
            <button type="button" className="osc-minibtn" onClick={doImport}>IMPORT</button>
          </div>
          {shareNote && <p className="qr-error">{shareNote}</p>}
          <div className="osc-knob"><span>SWING</span>
            <input type="range" min={0} max={0.5} step={0.02} value={swing} title="Delays every second (off-beat) step — place notes on odd steps to hear it"
              onChange={e => { const v = Number(e.target.value); oscEngine.setSwing(v); setSwingState(v) }} />
          </div>
          <div className="osc-knob"><span>GATE</span>
            <input type="range" min={0.15} max={1} step={0.05} value={gateLen}
              onChange={e => { const v = Number(e.target.value); oscEngine.setGate(v); setGateState(v) }} />
          </div>
          <div className="osc-faces">
            <span className="osc-faces-label">FACE</span>
            {([["dot","DOT"],["moss","MOSS"],["ember","EMBER"],["ultra","ULTRA"]] as const).map(([id,label]) => (
              <button key={id} type="button" className={`osc-face-chip${face === id ? " on" : ""}`} data-face={id}
                onClick={() => { setFaceState(id as Face); navigator.vibrate?.(4) }}>{label}</button>
            ))}
          </div>
        </div>

        <p className="osc-hint">SWING SHIFTS OFF-BEAT STEPS · GATE STRETCHES NOTE LENGTH · PATTERNS AUTO-SAVE</p>
      </div>
    </div>
  )
}
