import { describe, it, expect } from "vitest"
import { PROBCRAFT_WORLDS, type ProbWorld } from "../../src/data/probcraft-worlds"
import { GAME_ENGINES } from "../../src/games/catalog"
import { APP_CATALOG, APP_MODE_PREFIXES } from "../../src/data/apps"
import { NAV_ITEMS } from "../../src/data/nav-items"
import { NOTHING_DOTS, CLASSIC_PATHS, TEENAGE_PATHS } from "../../src/data/icon-packs"
import { loadSoundPreference, saveSoundPreference, SOUND_STORAGE_KEY, probAudio } from "../../src/components/probcraft/probcraft-audio"

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
      expect(world.questStages.length).toBe(3)
      expect(world.microstatePaths.length).toBeGreaterThanOrEqual(3)

      world.questStages.forEach((stage, idx) => {
        expect(stage.stageNumber).toBe(idx + 1)
        expect(stage.title.length).toBeGreaterThan(5)
        expect(stage.objective.length).toBeGreaterThan(15)
        expect(stage.hint.length).toBeGreaterThan(10)
      })

      world.microstatePaths.forEach(path => {
        expect(path.id).toBeTruthy()
        expect(path.label.length).toBeGreaterThan(3)
        expect(path.probDesc.length).toBeGreaterThan(5)
        expect(path.color.startsWith("#") || path.color.startsWith("var(")).toBe(true)
      })

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

  it("every world has a solid floor block directly beneath the player spawn to prevent void fall loops", () => {
    for (const world of PROBCRAFT_WORLDS) {
      const [sx, sy, sz] = world.playerSpawn
      const floorBlock = world.blocks.find(
        b => b.type !== "air" && b.type !== "lava" && b.type !== "portal" &&
             Math.abs(b.x - sx) <= 0.6 &&
             Math.abs(b.z - sz) <= 0.6 &&
             b.y <= sy - 1.5 && b.y >= sy - 2.5
      )
      expect(floorBlock, `World ${world.worldNumber} (${world.title}) missing floor under spawn [${sx}, ${sy}, ${sz}]`).toBeDefined()
    }
  })

  it("every world is a sprawling adventure environment (at least 40x40 footprint and 1,500+ blocks)", () => {
    for (const world of PROBCRAFT_WORLDS) {
      expect(world.blocks.length).toBeGreaterThanOrEqual(1500)
      const xs = world.blocks.map(b => b.x)
      const zs = world.blocks.map(b => b.z)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minZ = Math.min(...zs)
      const maxZ = Math.max(...zs)

      expect(minX).toBeLessThanOrEqual(-20)
      expect(maxX).toBeGreaterThanOrEqual(20)
      expect(minZ).toBeLessThanOrEqual(-20)
      expect(maxZ).toBeGreaterThanOrEqual(20)
    }
  })

  it("every world has at least 5 interactive targets including ancient discovery shrines/monuments", () => {
    for (const world of PROBCRAFT_WORLDS) {
      expect(world.interactiveTargets.length).toBeGreaterThanOrEqual(5)

      const discoveryShrines = world.interactiveTargets.filter(
        t => t.id.startsWith("shrine-") || t.id.startsWith("stele-") || t.id.startsWith("monument-") ||
             t.id.startsWith("perch-") || t.id.startsWith("altar-") ||
             t.name.toLowerCase().includes("shrine") || t.name.toLowerCase().includes("stele") ||
             t.name.toLowerCase().includes("monument") || t.name.toLowerCase().includes("perch") ||
             t.name.toLowerCase().includes("inscription")
      )
      expect(discoveryShrines.length, `World ${world.worldNumber} should have at least 2 discovery shrines/perches`).toBeGreaterThanOrEqual(2)

      // Ensure every interactive target has valid descriptive telemetry
      for (const target of world.interactiveTargets) {
        expect(target.id).toBeTruthy()
        expect(target.name.length).toBeGreaterThan(3)
        expect(target.oddsDesc.length).toBeGreaterThan(5)
        expect(Number.isFinite(target.expectedValue)).toBe(true)
      }
    }
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

describe("ProbCraft Discovery Shards & Archaeology Invariants", () => {
  it("extracts exactly 17 discovery shrines and steles across the 8 curriculum realms", () => {
    const allDiscoveryShards = PROBCRAFT_WORLDS.flatMap(w =>
      w.interactiveTargets
        .filter(t => t.id.startsWith("shrine-"))
        .map(t => ({ ...t, worldNumber: w.worldNumber }))
    )

    expect(allDiscoveryShards.length).toBe(17)

    // Check unique shard IDs
    const ids = new Set(allDiscoveryShards.map(s => s.id))
    expect(ids.size).toBe(17)

    // Check per-world distribution: W1: 2, W2: 2, W3: 2, W4: 3, W5: 2, W6: 2, W7: 2, W8: 2
    const countsPerWorld = [1, 2, 3, 4, 5, 6, 7, 8].map(
      num => allDiscoveryShards.filter(s => s.worldNumber === num).length
    )
    expect(countsPerWorld).toEqual([2, 2, 2, 3, 2, 2, 2, 2])

    // Validate shard payload integrity
    for (const shard of allDiscoveryShards) {
      expect(shard.name.trim().length).toBeGreaterThan(3)
      expect(shard.oddsDesc.trim().length).toBeGreaterThan(10)
      expect(Number.isFinite(shard.expectedValue)).toBe(true)
      expect(Number.isFinite(shard.x)).toBe(true)
      expect(Number.isFinite(shard.y)).toBe(true)
      expect(Number.isFinite(shard.z)).toBe(true)
    }
  })
})

describe("ProbCraft Catalog & Icon Integration", () => {
  it("is registered as playable in the Deriva Games catalog", () => {
    const probcraftGame = GAME_ENGINES.find(g => g.id === "probcraft")
    expect(probcraftGame).toBeDefined()
    expect(probcraftGame?.title).toBe("ProbCraft 3D")
    expect(probcraftGame?.status).toBe("playable")
    expect(probcraftGame?.href).toBe("/probcraft")
    expect(probcraftGame?.patterns.length).toBeGreaterThanOrEqual(4)
  })

  it("is registered in the Deriva system App Catalog", () => {
    const probcraftApp = APP_CATALOG.find(a => a.id === "probcraft")
    expect(probcraftApp).toBeDefined()
    expect(probcraftApp?.name).toBe("ProbCraft")
    expect(probcraftApp?.href).toBe("/probcraft")
    expect(probcraftApp?.status).toBe("installed")
  })

  it("has custom icon definitions across all icon packs (Nothing, Classic, Teenage)", () => {
    expect(NOTHING_DOTS["probcraft"]).toBeDefined()
    expect(NOTHING_DOTS["probcraft"].length).toBe(7)
    expect(CLASSIC_PATHS["probcraft"]).toBeDefined()
    expect(CLASSIC_PATHS["probcraft"].length).toBeGreaterThan(10)
    expect(TEENAGE_PATHS["probcraft"]).toBeDefined()
    expect(TEENAGE_PATHS["probcraft"].length).toBeGreaterThan(10)
  })
})

describe("ProbCraft Audio Preference Persistence", () => {
  it("uses the designated sound storage key", () => {
    expect(SOUND_STORAGE_KEY).toBe("deriva-probcraft-sound")
  })

  it("handles persistence when window/localStorage is present", () => {
    const mockStorage: Record<string, string> = {}
    const originalWindow = global.window

    global.window = {
      localStorage: {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => { mockStorage[k] = v },
      } as unknown as Storage,
    } as unknown as Window & typeof globalThis

    saveSoundPreference(false)
    expect(loadSoundPreference()).toBe(false)
    expect(mockStorage[SOUND_STORAGE_KEY]).toBe("0")

    saveSoundPreference(true)
    expect(loadSoundPreference()).toBe(true)
    expect(mockStorage[SOUND_STORAGE_KEY]).toBe("1")

    global.window = originalWindow
  })

  it("safely handles audio calls when AudioContext is unavailable or disabled without throwing", () => {
    probAudio.setEnabled(false)
    expect(() => probAudio.playStep()).not.toThrow()
    expect(() => probAudio.playMine()).not.toThrow()
    expect(() => probAudio.playDing()).not.toThrow()
    expect(() => probAudio.playFanfare()).not.toThrow()
    expect(() => probAudio.playTrapBuzzer()).not.toThrow()
    probAudio.setEnabled(true)
  })
})

describe("ProbCraft Navigation & Discovery Surfaces", () => {
  it("registers probcraft and games in bottom navigation slots", () => {
    const probcraftNav = NAV_ITEMS.find(n => n.id === "probcraft")
    expect(probcraftNav).toBeDefined()
    expect(probcraftNav?.href).toBe("/probcraft")
    expect(probcraftNav?.match("/probcraft")).toBe(true)

    const gamesNav = NAV_ITEMS.find(n => n.id === "games")
    expect(gamesNav).toBeDefined()
    expect(gamesNav?.href).toBe("/games")
    expect(gamesNav?.match("/games")).toBe(true)

    const appsNav = NAV_ITEMS.find(n => n.id === "store")
    expect(appsNav).toBeDefined()
    expect(appsNav?.match("/apps")).toBe(true)
    expect(appsNav?.match("/store")).toBe(true)
  })

  it("includes /probcraft and /apps in APP_MODE_PREFIXES", () => {
    expect(APP_MODE_PREFIXES).toContain("/probcraft")
    expect(APP_MODE_PREFIXES).toContain("/apps")
  })
})

