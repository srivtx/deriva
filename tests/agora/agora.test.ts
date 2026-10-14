import { describe, it, expect } from "vitest"
import { AGORA_CHALLENGES, AGORA_TRACKS } from "../../src/data/agora"
import {
  loadAgoraProgress,
  recordAgoraAttempt,
  updateAgoraAudioPrefs,
} from "../../src/persistence/agora"

describe("Agora Oral Defense Linear Curriculum & Invariants", () => {
  it("contains all 3 required tracks: quant, systems, distributed", () => {
    const trackIds = AGORA_TRACKS.map(t => t.id)
    expect(trackIds).toContain("quant")
    expect(trackIds).toContain("systems")
    expect(trackIds).toContain("distributed")
  })

  it("contains exactly 14 sequentially numbered stages across 3 levels", () => {
    expect(AGORA_CHALLENGES.length).toBe(14)

    for (let i = 0; i < AGORA_CHALLENGES.length; i++) {
      const c = AGORA_CHALLENGES[i]
      expect(c.stageNumber).toBe(i + 1)
      expect([1, 2, 3]).toContain(c.levelNumber)
      expect(c.levelName).toBeTruthy()
      expect(c.conceptBridge.length).toBeGreaterThan(25)
    }
  })

  it("every challenge has valid schema, options, and audioScripts", () => {
    for (const c of AGORA_CHALLENGES) {
      expect(c.id).toBeTruthy()
      expect(c.title).toBeTruthy()
      expect(c.company).toBeTruthy()
      expect(c.prompt).toBeTruthy()

      // Audio script completeness
      expect(c.audioScript.setup.length).toBeGreaterThan(20)
      expect(c.audioScript.question.length).toBeGreaterThan(10)
      expect(c.audioScript.trap.length).toBeGreaterThan(20)
      expect(c.audioScript.derivation.length).toBeGreaterThan(20)

      // Options completeness
      expect(c.options.length).toBeGreaterThanOrEqual(3)
      const correctOpt = c.options.find(o => o.id === c.correctOptionId)
      expect(correctOpt).toBeDefined()
      expect(correctOpt?.isTrap).toBe(false)

      const trapOpts = c.options.filter(o => o.isTrap)
      expect(trapOpts.length).toBeGreaterThanOrEqual(1)

      // Invariant and Whiteboard
      expect(c.invariantTitle).toBeTruthy()
      expect(c.invariantDerivation.length).toBeGreaterThan(30)
      expect(c.whiteboardNotes.length).toBeGreaterThanOrEqual(2)
      expect(c.interviewTakeaway).toBeTruthy()

      // Chalkboard
      expect(c.chalkboard.title).toBeTruthy()
      expect(c.chalkboard.highlightMetric).toBeTruthy()
    }
  })

  it("has zero AI-like sparkle or star icons in challenge data", () => {
    const jsonStr = JSON.stringify(AGORA_CHALLENGES)
    expect(jsonStr).not.toContain("✦")
    expect(jsonStr).not.toContain("★")
    expect(jsonStr).not.toContain("✨")
    expect(jsonStr).not.toContain("🪄")
  })

  it("quant level covers Bertrand Box, Adverse Selection, Penney Game, 100 Prisoners, and Martingale", () => {
    const quantChallenges = AGORA_CHALLENGES.filter(c => c.trackId === "quant")
    expect(quantChallenges.length).toBe(5)
    const titles = quantChallenges.map(c => c.title)
    expect(titles.some(t => t.includes("Bertrand"))).toBe(true)
    expect(titles.some(t => t.includes("Adverse Selection"))).toBe(true)
    expect(titles.some(t => t.includes("Penney"))).toBe(true)
    expect(titles.some(t => t.includes("100 Prisoners"))).toBe(true)
    expect(titles.some(t => t.includes("Martingale"))).toBe(true)
  })

  it("systems level covers SIMD, Branch Prediction, False Sharing, Ring Buffer, and Memory Fences", () => {
    const sysChallenges = AGORA_CHALLENGES.filter(c => c.trackId === "systems")
    expect(sysChallenges.length).toBe(5)
    const titles = sysChallenges.map(c => c.title)
    expect(titles.some(t => t.includes("SIMD") || t.includes("AoS"))).toBe(true)
    expect(titles.some(t => t.includes("Branch Predictor"))).toBe(true)
    expect(titles.some(t => t.includes("False Sharing"))).toBe(true)
    expect(titles.some(t => t.includes("Ring Buffer"))).toBe(true)
    expect(titles.some(t => t.includes("Memory Fences") || t.includes("TSO"))).toBe(true)
  })

  it("distributed level covers Vector Clocks, Raft Quorum, Consistent Hashing, and CRDTs", () => {
    const distChallenges = AGORA_CHALLENGES.filter(c => c.trackId === "distributed")
    expect(distChallenges.length).toBe(4)
    const titles = distChallenges.map(c => c.title)
    expect(titles.some(t => t.includes("Vector Clocks"))).toBe(true)
    expect(titles.some(t => t.includes("Raft"))).toBe(true)
    expect(titles.some(t => t.includes("Consistent Hashing"))).toBe(true)
    expect(titles.some(t => t.includes("CRDT"))).toBe(true)
  })
})

describe("Agora Persistence Layer", () => {
  it("initializes with default values without crashing", () => {
    const progress = loadAgoraProgress()
    expect(progress).toBeDefined()
    expect(progress.completedIds).toBeInstanceOf(Array)
    expect(progress.audioPrefs.speechRate).toBeDefined()
  })

  it("records attempts and tracks completion", () => {
    const res = recordAgoraAttempt("100-prisoners-cycle", "opt-cycle", true, false)
    expect(res.completedIds).toContain("100-prisoners-cycle")
    expect(res.attempts["100-prisoners-cycle"].correct).toBe(true)
  })

  it("updates audio preferences cleanly", () => {
    const prefs = updateAgoraAudioPrefs({ speechRate: 1.2, autoAdvanceCommute: true })
    expect(prefs.speechRate).toBe(1.2)
    expect(prefs.autoAdvanceCommute).toBe(true)
  })
})
