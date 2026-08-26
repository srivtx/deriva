"use client"

// OSC-1 audio engine — sample-accurate step sequencer.
// Timing law: all note scheduling happens against AudioContext.currentTime via
// a look-ahead scheduler (never setInterval musical time). The UI reads a
// display queue so visuals never drift the audio clock.

export const STEPS = 16
export const PITCHES = 8

// A minor pentatonic, two octaves, top row = highest note.
const MIDI = [74, 72, 69, 67, 64, 62, 60, 57]
export const NOTE_NAMES = ["D5", "C5", "A4", "G4", "E4", "D4", "C4", "A3"]
export const freqFor = (row: number) => 440 * Math.pow(2, (MIDI[row] - 69) / 12)

export type Wave = "sine" | "triangle" | "sawtooth" | "square"
export type Pattern = boolean[][]

export function emptyPattern(): Pattern {
  return Array.from({ length: PITCHES }, () => Array(STEPS).fill(false))
}

const LOOKAHEAD = 0.12
const TICK_MS = 25

type ScheduledStep = { step: number; time: number }

class OscEngine {
  private ctx: AudioContext | null = null
  private filter: BiquadFilterNode | null = null
  private delay: DelayNode | null = null
  private feedback: GainNode | null = null
  private wet: GainNode | null = null
  private master: GainNode | null = null

  playing = false
  bpm = 128
  swing = 0        // 0..0.5 — delays every other 16th for groove
  gate = 0.85      // 0.15..1 — note length multiplier
  songMode = false // chain A→B→C→D, one bar each
  wave: Wave = "sawtooth"
  cutoff = 1400
  delayMix = 0.22

  patterns: Pattern[] = [emptyPattern(), emptyPattern(), emptyPattern(), emptyPattern()]
  active = 0

  private step = 0
  private absStep = 0
  private nextTime = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private scheduled: ScheduledStep[] = []

  /* ---------- graph ---------- */

  private ensureGraph() {
    if (!this.ctx || !this.filter) {
      this.ctx = new AudioContext()
      const ctx = this.ctx
      this.master = ctx.createGain()
      this.master.gain.value = 0.8
      this.filter = ctx.createBiquadFilter()
      this.filter.type = "lowpass"
      this.filter.frequency.value = this.cutoff
      this.filter.Q.value = 6
      this.delay = ctx.createDelay(1.5)
      this.delay.delayTime.value = (60 / this.bpm / 4) * 3 // dotted eighth
      this.feedback = ctx.createGain()
      this.feedback.gain.value = 0.35
      this.wet = ctx.createGain()
      this.wet.gain.value = this.delayMix
      this.filter.connect(this.master)
      this.master.connect(ctx.destination)
      this.filter.connect(this.delay)
      this.delay.connect(this.feedback)
      this.feedback.connect(this.delay)
      this.delay.connect(this.wet)
      this.wet.connect(ctx.destination)
    }
  }

  private noteOn(row: number, time: number) {
    if (!this.ctx || !this.filter) return
    const ctx = this.ctx
    const gate = Math.max(0.06, ((60 / this.bpm) / 4) * this.gate)
    const peak = 0.28

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, time)
    env.gain.linearRampToValueAtTime(peak, time + 0.005)
    env.gain.exponentialRampToValueAtTime(0.0008, time + gate)

    const osc = ctx.createOscillator()
    osc.type = this.wave
    osc.frequency.value = freqFor(row)
    osc.connect(env)
    env.connect(this.filter)
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
    for (let row = 0; row < PITCHES; row++) {
      if (col[row]?.[step]) this.noteOn(row, time)
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
    if (!this.ctx) return
    if (this.ctx.state === "suspended") void this.ctx.resume()
    this.noteOn(row, this.ctx.currentTime + 0.01)
  }

  /* ---------- controls ---------- */

  setWave(w: Wave) { this.wave = w }
  setCutoff(hz: number) {
    this.cutoff = hz
    if (this.filter) this.filter.frequency.setTargetAtTime(hz, this.ctx?.currentTime ?? 0, 0.02)
  }
  setDelayMix(v: number) {
    this.delayMix = v
    if (this.wet) this.wet.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.02)
  }
  setDelayTimeByBpm() {
    if (this.delay) this.delay.delayTime.value = (60 / this.bpm / 4) * 3
  }
  setBpm(v: number) {
    this.bpm = Math.min(200, Math.max(60, Math.round(v)))
    this.setDelayTimeByBpm()
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
        shown = Math.floor((this.absStep - 1 - (this.scheduled.length - 1 - i)) / STEPS) % 4
        break
      }
    }
    return shown
  }
}

export const oscEngine = new OscEngine()
