// Native Web Audio Synthesizer for ProbCraft
// Zero external asset downloads, zero network latency, instant audio feedback.

class ProbCraftAudioEngine {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  private initContext() {
    if (typeof window === "undefined") return
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val
    if (!val && this.ctx) {
      this.ctx.suspend().catch(() => {})
    } else if (val && this.ctx) {
      this.ctx.resume().catch(() => {})
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  // Soft footstep thud when walking
  public playStep() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime

    osc.type = "sine"
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.06)
  }

  // Stone/block mine crunch
  public playMine() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  // Gold or diamond chunk discovery chime
  public playDing(highPitch = false) {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    const freq = highPitch ? 1046.5 : 880 // C6 or A5
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  }

  // Chest creak open / close
  public playChest() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.linearRampToValueAtTime(320, now + 0.15)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.18)
  }

  // Portal swoosh / teleportation
  public playPortal() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.4)

    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.5)
  }

  // Harmonic Win Fanfare (C5 -> E5 -> G5 -> C6)
  public playFanfare() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5]
    const now = this.ctx.currentTime

    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const start = now + idx * 0.12

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.2, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(start)
      osc.stop(start + 0.4)
    })
  }

  // Trap / Miss Tone (Minor second low dissonance)
  public playTrapBuzzer() {
    if (!this.enabled) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    ;[185, 196].forEach(freq => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.3)
    })
  }
}

export const probAudio = new ProbCraftAudioEngine()
