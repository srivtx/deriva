import { PITCHES, STEPS, type Pattern, type Wave, emptyPattern } from "./engine"

// OSC-1 share codes: the whole instrument state as a compact, URL-safe
// string. Pure functions — fully unit-tested (see __tests__/share.test.ts).

export interface ShareState {
  bpm: number
  wave: Wave
  cutoff: number
  delayMix: number
  swing: number
  gate: number
  song: boolean
  active: number
  patterns: Pattern[] // 4 × 8 × 16, values 0|1|2
}

const WAVES: Wave[] = ["sine", "triangle", "sawtooth", "square"]
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function encodeShare(state: ShareState): string {
  const payload = {
    v: 1,
    b: clamp(Math.round(state.bpm), 60, 200),
    w: Math.max(0, WAVES.indexOf(state.wave)),
    c: Math.round(clamp(state.cutoff, 180, 6000)),
    d: Math.round(clamp(state.delayMix, 0, 0.6) * 100),
    s: Math.round(clamp(state.swing, 0, 0.5) * 100),
    g: Math.round(clamp(state.gate, 0.15, 1) * 100),
    m: state.song ? 1 : 0,
    a: clamp(state.active, 0, 3),
    p: state.patterns.map(pat =>
      pat.map(row => parseInt(row.map(c => (c === 2 ? "2" : c ? "1" : "0")).join(""), 3).toString(36)),
    ),
  }
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function decodeShare(code: string): ShareState | null {
  try {
    const b64 = code.trim().replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(escape(atob(b64)))
    const raw = JSON.parse(json) as {
      v?: number; b?: number; w?: number; c?: number; d?: number; s?: number
      g?: number; m?: number; a?: number; p?: unknown
    }
    if (raw.v !== 1 || !Array.isArray(raw.p) || raw.p.length !== 4) return null

    const patterns: Pattern[] = []
    for (let pi = 0; pi < 4; pi++) {
      const pat = raw.p[pi]
      if (!Array.isArray(pat) || pat.length !== PITCHES) return null
      const out = emptyPattern()
      for (let row = 0; row < PITCHES; row++) {
        const chunk = String(pat[row] ?? "0")
        const trits = parseInt(chunk, 36).toString(3).padStart(STEPS, "0")
        for (let s = 0; s < STEPS; s++) {
          const t = trits[s]
          out[row][s] = t === "2" ? 2 : t === "1" ? 1 : 0
        }
      }
      patterns.push(out)
    }

    return {
      bpm: clamp(Math.round(Number(raw.b) || 128), 60, 200),
      wave: WAVES[clamp(Number(raw.w) || 0, 0, 3)],
      cutoff: clamp(Math.round(Number(raw.c) || 1400), 180, 6000),
      delayMix: clamp((Number(raw.d) || 22) / 100, 0, 0.6),
      swing: clamp((Number(raw.s) || 0) / 100, 0, 0.5),
      gate: clamp((Number(raw.g) || 85) / 100, 0.15, 1),
      song: raw.m === 1,
      active: clamp(Number(raw.a) || 0, 0, 3),
      patterns,
    }
  } catch {
    return null
  }
}
