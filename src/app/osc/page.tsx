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

const SAVE_KEY = "deriva-osc-state"
type Saved = { patterns: Pattern[]; bpm: number; wave: Wave; cutoff: number; delayMix: number; active: number }

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
  const [playhead, setPlayhead] = useState(-1)
  const [bpm, setBpmState] = useState(initial.current?.bpm ?? 128)
  const [wave, setWaveState] = useState<Wave>(initial.current?.wave ?? "sawtooth")
  const [cutoff, setCutoffState] = useState(initial.current?.cutoff ?? 1400)
  const [delayMix, setDelayState] = useState(initial.current?.delayMix ?? 0.22)

  // Hydrate engine from saved state once.
  useEffect(() => {
    const s = initial.current
    if (!s) return
    oscEngine.patterns = s.patterns.map(p => p.map(r => Array.isArray(r) ? [...r] : []))
    oscEngine.active = s.active ?? 0
    oscEngine.setBpm(s.bpm)
    oscEngine.setWave(s.wave)
    oscEngine.setCutoff(s.cutoff)
    oscEngine.setDelayMix(s.delayMix)
    rerender()
  }, [rerender])

  // Autosave (debounced).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          patterns: oscEngine.patterns,
          bpm: oscEngine.bpm,
          wave: oscEngine.wave,
          cutoff: oscEngine.cutoff,
          delayMix: oscEngine.delayMix,
          active: oscEngine.active,
        }))
      } catch {}
    }, 400)
    return () => clearTimeout(id)
  })

  // Playhead follows the audio clock.
  useEffect(() => {
    if (!playing) { setPlayhead(-1); return }
    let raf = 0
    let last = -2
    const loop = () => {
      const s = oscEngine.displayStep()
      if (s !== last) { last = s; setPlayhead(s) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    document.title = "OSC-1 · Deriva"
  }, [])

  const togglePlay = useCallback(async () => {
    await oscEngine.toggle()
    setPlaying(oscEngine.playing)
    navigator.vibrate?.(8)
  }, [])

  const toggleCell = useCallback((row: number, step: number) => {
    const col = oscEngine.patterns[oscEngine.active]
    col[row][step] = !col[row][step]
    if (col[row][step]) {
      oscEngine.preview(row)
      navigator.vibrate?.(4)
    }
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
    <div className="app-content">
      <div className="osc-app">
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
                className={`osc-led${oscEngine.active === i ? " on" : ""}`}
                onClick={() => selectPattern(i)}
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

        {/* grid */}
        <div className="osc-grid-wrap">
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
                    data-on={grid[row]?.[step] ? "1" : "0"}
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
          <button type="button" className="osc-minibtn" onClick={clearPattern}>CLEAR PATTERN</button>
        </div>

        <p className="osc-hint">TAP CELLS TO PLACE NOTES · A-MINOR PENTATONIC · PATTERNS AUTO-SAVE</p>
      </div>
    </div>
  )
}
