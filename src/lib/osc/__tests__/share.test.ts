import { describe, it, expect } from "vitest"
import { encodeShare, decodeShare, type ShareState } from "../share"
import { emptyPattern } from "../engine"

const base: ShareState = {
  bpm: 128,
  wave: "sawtooth",
  cutoff: 1400,
  delayMix: 0.22,
  swing: 0,
  gate: 0.85,
  song: false,
  active: 0,
  patterns: [emptyPattern(), emptyPattern(), emptyPattern(), emptyPattern()],
}

describe("osc share codec", () => {
  it("round-trips an empty state losslessly", () => {
    const out = decodeShare(encodeShare(base))!
    expect(out.bpm).toBe(128)
    expect(out.wave).toBe("sawtooth")
    expect(out.patterns.flat(2).every(c => c === 0)).toBe(true)
  })

  it("round-trips accents, params and every pattern slot", () => {
    const s: ShareState = {
      ...base,
      bpm: 174,
      wave: "square",
      cutoff: 3200,
      delayMix: 0.4,
      swing: 0.34,
      gate: 0.5,
      song: true,
      active: 2,
      patterns: [emptyPattern(), emptyPattern(), emptyPattern(), emptyPattern()],
    }
    s.patterns[1][3][5] = 2
    s.patterns[1][7][15] = 1
    s.patterns[2][0][0] = 2
    s.patterns[3][5][9] = 1
    const out = decodeShare(encodeShare(s))!
    expect(out).toEqual(s)
  })

  it("produces URL-safe output", () => {
    const code = encodeShare(base)
    expect(code).not.toMatch(/[+/=]/)
  })

  it("returns null for garbage instead of throwing", () => {
    expect(decodeShare("not-a-code")).toBeNull()
    expect(decodeShare("")).toBeNull()
    expect(decodeShare("aGVsbG8=")).toBeNull() // valid b64, invalid payload
  })

  it("clamps hostile values into safe ranges", () => {
    const code = encodeShare({ ...base, bpm: 999, cutoff: 99999, delayMix: 5 })
    const out = decodeShare(code)!
    expect(out.bpm).toBeLessThanOrEqual(200)
    expect(out.cutoff).toBeLessThanOrEqual(6000)
    expect(out.delayMix).toBeLessThanOrEqual(0.6)
  })
})
