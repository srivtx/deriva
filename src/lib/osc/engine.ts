"use client"

// OSC-1 audio engine — sample-accurate step sequencer + offline WAV render
// + spectrum tap for the visualizer.
// Timing law: live notes are scheduled against AudioContext.currentTime via a
// look-ahead scheduler; exports render through OfflineAudioContext with the
// identical chain, so "play" and "export" produce the same audio.

export const STEPS = 16
export const PITCHES = 8

// A minor pentatonic, two octaves, top row = highest note.
const MIDI = [74, 72, 69, 67, 64, 62, 60, 57]
export const NOTE_NAMES = ["D5", "C5", "A4", "G4", "E4", "D4", "C4", "A3"]
export const freqFor = (row: number) => 440 * Math.pow(2, (MIDI[row] - 69) / 12)

export type Wave = "sine" | "triangle" | "sawtooth" | "square"
// Cell values: 0 off · 1 normal · 2 accented (louder)
export type Pattern = number[][]

export function emptyPattern(): Pattern {
  return Array.from({ length: PITCHES }, () => Array<number>(STEPS).fill(0))
}

const LOOKAHEAD = 0.12
const TICK_MS = 25

type ScheduledStep = { step: number; time: number }

interface Chain {
  filter: BiquadFilterNode
  master: GainNode
  delay: DelayNode
  feedback: GainNode
  wet: GainNode
}

class OscEngine {
  private ctx: AudioContext | null = null
  private chain: Chain | null = null
  private analyser: AnalyserNode | null = null
  private freqData: Uint8Array<ArrayBuffer> | null = null

  playing = false
  bpm = 128
  wave: Wave = "sawtooth"
  cutoff = 1400
  delayMix = 0.22
  swing = 0        // 0..0.5 — delays every other 16th for groove
  gate = 0.85      // 0.15..1 — note length multiplier
  songMode = false // chain A→B→C→D, one bar each

  patterns: Pattern[] = [emptyPattern(), emptyPattern(), emptyPattern(), emptyPattern()]
  active = 0

  private step = 0
  private absStep = 0
  private nextTime = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private scheduled: ScheduledStep[] = []

  /* ---------- graph ---------- */

  private buildChain(ctx: BaseAudioContext, dest: AudioNode): Chain {
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = this.cutoff
    filter.Q.value = 6

    const master = ctx.createGain()
    master.gain.value = 0.8

    const delay = ctx.createDelay(1.5)
    delay.delayTime.value = (60 / this.bpm / 4) * 3 // dotted eighth
    const feedback = ctx.createGain()
    feedback.gain.value = 0.35
    const wet = ctx.createGain()
    wet.gain.value = this.delayMix

    filter.connect(master)
    master.connect(dest)
    filter.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(dest)

    return { filter, master, delay, feedback, wet }
  }

  private ensureGraph() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.chain = this.buildChain(this.ctx, this.ctx.destination)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.chain.filter.connect(this.analyser) // parallel tap — no audio change
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount)
    }
  }

  private voiceOn(target: Chain, row: number, time: number, vel = 0.62) {
    const ctx = target.filter.context as AudioContext
    const sixteenth = 60 / this.bpm / 4
    const gate = Math.max(0.06, sixteenth * this.gate)
    const peak = 0.28 * vel

    // Sustain through the gate, release at its edge — otherwise natural decay
    // masks the GATE control entirely.
    const release = Math.min(0.09, gate * 0.35)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.005)
    env.gain.setValueAtTime(peak, time + Math.max(0.006, gate - release))
    env.gain.exponentialRampToValueAtTime(0.0008, time + gate)

    const osc = ctx.createOscillator()
    osc.type = this.wave
    osc.frequency.value = freqFor(row)
    osc.connect(env)
    env.connect(target.filter)
    osc.start(time)
    osc.stop(time + gate + 0.06)
    osc.onended = () => { env.disconnect(); try { osc.disconnect() } catch {} }
  }

  /* ---------- sequencer ---------- */

  private patternForAbs(): number {
    return this.songMode ? (Math.floor(this.absStep / STEPS) % 4) : this.active
  }

  private scheduleColumn(step: number, time: number) {
    const col = this.patterns[this.patternForAbs()]
    if (!this.chain) return
    for (let row = 0; row < PITCHES; row++) {
      const v = col[row]?.[step] ?? 0
      if (v) this.voiceOn(this.chain, row, time, v === 2 ? 1 : 0.62)
    }
  }

  private tick = () => {
    if (!this.ctx || !this.playing) return
    const sixteenth = 60 / this.bpm / 4
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      const swingOffset = this.step % 2 === 1 ? this.swing * sixteenth * 0.5 : 0
      this.scheduleColumn(this.step, this.nextTime + swingOffset)
      this.scheduled.push({ step: this.step, time: this.nextTime + swingOffset })
      if (this.scheduled.length > 32) this.scheduled.splice(0, 16)
      this.nextTime += sixteenth
      this.step = (this.step + 1) % STEPS
      this.absStep += 1
    }
  }

  async start() {
    this.ensureGraph()
    if (!this.ctx) return
    if (this.ctx.state === "suspended") await this.ctx.resume()
    if (this.playing) return
    this.playing = true
    this.step = 0
    this.absStep = 0
    this.scheduled = []
    this.nextTime = this.ctx.currentTime + 0.08
    this.timer = setInterval(this.tick, TICK_MS)
    this.tick()
  }

  stop() {
    this.playing = false
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.scheduled = []
  }

  toggle(): Promise<void> {
    return this.playing ? Promise.resolve(this.stop()) : this.start()
  }

  /** Step the playhead visual should show right now (audio-clock derived). */
  displayStep(): number {
    if (!this.ctx || !this.playing) return -1
    const now = this.ctx.currentTime
    let shown = -1
    for (const s of this.scheduled) {
      if (s.time <= now) shown = s.step
      else break
    }
    return shown
  }

  preview(row: number) {
    this.ensureGraph()
    if (!this.ctx || !this.chain) return
    if (this.ctx.state === "suspended") void this.ctx.resume()
    this.voiceOn(this.chain, row, this.ctx.currentTime + 0.01, 1)
  }

  /* ---------- spectrum ---------- */

  /** Normalized band levels (0..1), logarithmically mapped over the FFT. */
  levels(bands: number): Float32Array {
    const out = new Float32Array(bands)
    if (!this.analyser || !this.freqData) return out
    this.analyser.getByteFrequencyData(this.freqData)
    const n = this.freqData.length
    for (let b = 0; b < bands; b++) {
      // Log mapping gives bass more visual space; cap at ~70% of Nyquist.
      const idx = Math.min(n - 1, Math.floor(Math.pow((b + 0.5) / bands, 1.7) * n * 0.7))
      out[b] = Math.pow(this.freqData[idx] / 255, 1.2)
    }
    return out
  }

  /* ---------- controls ---------- */

  setWave(w: Wave) { this.wave = w }
  setCutoff(hz: number) {
    this.cutoff = hz
    if (this.chain) this.chain.filter.frequency.setTargetAtTime(hz, this.ctx?.currentTime ?? 0, 0.02)
  }
  setDelayMix(v: number) {
    this.delayMix = v
    if (this.chain) this.chain.wet.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.02)
  }
  private syncDelayTime(chain?: Chain) {
    const d = chain ?? this.chain
    if (d) d.delay.delayTime.value = (60 / this.bpm / 4) * 3
  }
  setBpm(v: number) {
    this.bpm = Math.min(200, Math.max(60, Math.round(v)))
    this.syncDelayTime()
  }
  setActivePattern(i: number) {
    this.active = Math.max(0, Math.min(3, i))
  }
  setSwing(v: number) { this.swing = Math.max(0, Math.min(0.5, v)) }
  setGate(v: number) { this.gate = Math.max(0.15, Math.min(1, v)) }
  setSongMode(on: boolean) { this.songMode = on }

  /** Which pattern slot is sounding right now (song chains A→B→C→D). */
  displaySlot(): number {
    if (!this.ctx || !this.playing || !this.songMode) return this.active
    const now = this.ctx.currentTime
    let shown = this.active
    for (let i = this.scheduled.length - 1; i >= 0; i--) {
      if (this.scheduled[i].time <= now) {
        const raw = Math.floor((this.absStep - 1 - (this.scheduled.length - 1 - i)) / STEPS)
        shown = ((raw % 4) + 4) % 4
        break
      }
    }
    return shown
  }

  /* ---------- offline WAV export ---------- */

  /**
   * Renders `loops` bars of the current setup (song chains included) through
   * an OfflineAudioContext using the identical signal chain, then encodes
   * 16-bit PCM WAV. Returns the blob ready for download.
   */
  async renderWav(loops = 2): Promise<Blob> {
    const sr = 44100
    const sixteenth = 60 / this.bpm / 4
    const bar = sixteenth * STEPS
    const duration = loops * bar + 0.6 // tail for delay/decay rings out
    const off = new OfflineAudioContext(1, Math.ceil(duration * sr), sr)
    const chain = this.buildChain(off, off.destination)

    let t = 0.05
    for (let l = 0; l < loops; l++) {
      for (let s = 0; s < STEPS; s++) {
        const patIdx = this.songMode ? l % 4 : this.active
        const col = this.patterns[patIdx]
        const swingOffset = s % 2 === 1 ? this.swing * sixteenth * 0.5 : 0
        const time = t + s * sixteenth + swingOffset
        for (let row = 0; row < PITCHES; row++) {
          if (col[row]?.[s]) this.voiceOn(chain as unknown as Chain & { filter: BiquadFilterNode }, row, time)
        }
      }
      t += bar
    }

    const rendered = await off.startRendering()

    // ── 16-bit PCM WAV encoder (44-byte RIFF header) ──
    const samples = rendered.getChannelData(0)
    const dataSize = samples.length * 2
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    const writeStr = (off2: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off2 + i, s.charCodeAt(i)) }
    writeStr(0, "RIFF")
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, "WAVE")
    writeStr(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)   // PCM
    view.setUint16(22, 1, true)   // mono
    view.setUint32(24, sr, true)
    view.setUint32(28, sr * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, "data")
    view.setUint32(40, dataSize, true)
    let off3 = 44
    for (let i = 0; i < samples.length; i++, off3 += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(off3, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return new Blob([buffer], { type: "audio/wav" })
  }
}

export const oscEngine = new OscEngine()
