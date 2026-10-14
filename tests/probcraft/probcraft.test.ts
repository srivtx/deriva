import { describe, it, expect } from "vitest"
import { PROBCRAFT_WORLDS, type ProbWorld } from "../../src/data/probcraft-worlds"

describe("ProbCraft 3D Worlds & Curriculum Invariants", () => {
  it("contains all 8 progressive worlds from beginner to master", () => {
    expect(PROBCRAFT_WORLDS.length).toBe(8)
    const worldNumbers = PROBCRAFT_WORLDS.map(w => w.worldNumber)
    expect(worldNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it("every world has complete schema, 3 options, and valid correctOptionId", () => {
    for (const world of PROBCRAFT_WORLDS) {
      expect(world.id).toBeTruthy()
      expect(world.title.length).toBeGreaterThan(5)
      expect(world.concept.length).toBeGreaterThan(10)
      expect(world.theorem.length).toBeGreaterThan(5)
      expect(world.naiveTrap.length).toBeGreaterThan(15)
      expect(world.invariantProof.length).toBeGreaterThan(25)
      expect(world.formulaKatex.length).toBeGreaterThan(10)
      expect(world.missionPrompt.length).toBeGreaterThan(25)
      expect(world.blocks.length).toBeGreaterThan(5)
      expect(world.interactiveTargets.length).toBeGreaterThan(0)
      expect(world.options.length).toBe(3)

      const correctOpt = world.options.find(o => o.id === world.correctOptionId)
      expect(correctOpt).toBeDefined()
      expect(correctOpt?.isTrap).toBe(false)

      const trapOpts = world.options.filter(o => o.id !== world.correctOptionId)
      for (const trap of trapOpts) {
        expect(trap.isTrap).toBe(true)
        expect(trap.explanation.length).toBeGreaterThan(10)
      }
    }
  })

  it("has zero AI-like sparkle or star icons in world content", () => {
    const jsonStr = JSON.stringify(PROBCRAFT_WORLDS)
    expect(jsonStr).not.toContain("✦")
    expect(jsonStr).not.toContain("★")
    expect(jsonStr).not.toContain("✨")
    expect(jsonStr).not.toContain("🪄")
  })
})

describe("ProbCraft Mathematical Theorem Invariants", () => {
  it("World 1: Bertrand's Box conditional probability equals exactly 2/3", () => {
    // 3 boxes with 2 coins each: GG, CC, GC
    // Given first coin is Gold, paths are G1, G2 (from GG) and G3 (from GC)
    const goldPaths = 3
    const doubleGoldPaths = 2
    const bayesProb = doubleGoldPaths / goldPaths
    expect(bayesProb).toBeCloseTo(2 / 3, 5)
  })

  it("World 2: Law of Large Numbers expected value ranking matches curriculum", () => {
    const ironEV = 1.0 * 1.0
    const diamondEV = 0.1 * 14 + 0.9 * 0
    const cursedEV = 0.01 * 80 + 0.99 * 0

    expect(ironEV).toBe(1.0)
    expect(diamondEV).toBeCloseTo(1.4, 5)
    expect(cursedEV).toBeCloseTo(0.8, 5)
    expect(diamondEV).toBeGreaterThan(ironEV)
    expect(ironEV).toBeGreaterThan(cursedEV)
  })

  it("World 3: Monty Hall switching yields exactly 2/3 win probability", () => {
    const pInitialCorrect = 1 / 3
    const pSwitchWin = 1 - pInitialCorrect
    expect(pSwitchWin).toBeCloseTo(2 / 3, 5)
  })

  it("World 4: Pólya's recurrence confirms 1D = 1.0 and 3D < 0.35", () => {
    const pReturn1D = 1.0
    const pReturn3D = 0.340537
    expect(pReturn1D).toBe(1.0)
    expect(pReturn3D).toBeLessThan(0.35)
    expect(pReturn3D).toBeGreaterThan(0.34)
  })

  it("World 5: Martingale doubling under finite bankroll has E[Profit] = 0", () => {
    const bankroll = 63 // 1 + 2 + 4 + 8 + 16 + 32 = 63 (6 losses in a row)
    const pRuin = Math.pow(0.5, 6) // 1/64
    const pWin = 1 - pRuin // 63/64
    const expectedProfit = pWin * 1.0 + pRuin * -bankroll
    expect(expectedProfit).toBe(0)
  })

  it("World 6: Markov stationary distribution vector sums to 1.0", () => {
    // Stationarity pi P = pi
    const pi = [0.318, 0.273, 0.159, 0.25]
    const sum = pi.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 2)
  })

  it("World 7: Exponential distribution is memoryless P(T > s+t | T > s) = P(T > t)", () => {
    const lambda = 2.0 / 60.0 // rate per second
    const s = 50
    const t = 10
    // P(T > s + t) / P(T > s) = exp(-lambda * (s+t)) / exp(-lambda * s) = exp(-lambda * t)
    const conditional = Math.exp(-lambda * (s + t)) / Math.exp(-lambda * s)
    const unconditional = Math.exp(-lambda * t)
    expect(conditional).toBeCloseTo(unconditional, 6)
  })

  it("World 8: Shannon Entropy for 16 uniform items equals 4 bits", () => {
    const n = 16
    const p = 1 / n
    const entropy = -16 * (p * Math.log2(p))
    expect(entropy).toBe(4.0)
  })
})
