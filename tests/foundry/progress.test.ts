// Foundry · progress persistence — the checkpoint math must never double-award.
// localStorage is stubbed because the engines under test read it at call time.

import { beforeEach, describe, expect, it, vi } from "vitest"

const backing = new Map<string, string>()

vi.stubGlobal("window", {})
vi.stubGlobal("localStorage", {
  getItem: (key: string) => backing.get(key) ?? null,
  setItem: (key: string, value: string) => void backing.set(key, value),
})

const { foundryRank, recordMissionCleared, recordStationRun } = await import("../../src/foundry/progress")
const { FOUNDRY_MISSION_XP, FOUNDRY_STATION_BONUS } = await import("../../src/foundry/catalog")

const STATION = { id: "tokenizer", missions: 4 } // real station shape from the catalog

beforeEach(() => backing.clear())

describe("mission checkpoints", () => {
  it("records partial progress without counting a run", () => {
    recordMissionCleared(STATION.id, 1)
    recordMissionCleared(STATION.id, 2)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    expect(stored[STATION.id].missionsCleared).toBe(2)
    expect(stored[STATION.id].runs).toBe(0)
    expect(stored[STATION.id].xp).toBe(2 * FOUNDRY_MISSION_XP)
  })

  it("is idempotent — replaying the same mission awards nothing", () => {
    recordMissionCleared(STATION.id, 1)
    recordMissionCleared(STATION.id, 1)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    expect(stored[STATION.id].xp).toBe(FOUNDRY_MISSION_XP)
  })

  it("never records the final mission — recordStationRun owns the full clear", () => {
    recordMissionCleared(STATION.id, STATION.missions)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    expect(stored[STATION.id]).toBeUndefined()
  })
})

describe("full-clear accounting across checkpoints", () => {
  it("checkpoints + final run award each mission exactly once, plus one bonus", () => {
    for (let mission = 1; mission < STATION.missions; mission += 1) recordMissionCleared(STATION.id, mission)
    recordStationRun(STATION.id, STATION.missions, 3)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    expect(stored[STATION.id].missionsCleared).toBe(STATION.missions)
    expect(stored[STATION.id].runs).toBe(1)
    expect(stored[STATION.id].bestMistakes).toBe(3)
    expect(stored[STATION.id].xp).toBe(STATION.missions * FOUNDRY_MISSION_XP + FOUNDRY_STATION_BONUS)
  })

  it("a second full replay adds a run but no further mission XP or bonus", () => {
    for (let mission = 1; mission < STATION.missions; mission += 1) recordMissionCleared(STATION.id, mission)
    recordStationRun(STATION.id, STATION.missions, 3)
    recordStationRun(STATION.id, STATION.missions, 5)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    const fullClearXp = STATION.missions * FOUNDRY_MISSION_XP + FOUNDRY_STATION_BONUS
    expect(stored[STATION.id].runs).toBe(2)
    expect(stored[STATION.id].xp).toBe(fullClearXp)
    expect(stored[STATION.id].bestMistakes).toBe(3)
  })

  it("resuming then finishing only pays for the remaining missions", () => {
    recordMissionCleared(STATION.id, 1)
    recordMissionCleared(STATION.id, 2)
    recordStationRun(STATION.id, STATION.missions, 0)
    const stored = JSON.parse(backing.get("deriva-foundry-v1") || "{}")
    expect(stored[STATION.id].xp).toBe(STATION.missions * FOUNDRY_MISSION_XP + FOUNDRY_STATION_BONUS)
  })
})

describe("workshop ranks", () => {
  it("promotes along the ladder and caps at the top rank", () => {
    expect(foundryRank(1)).toBe("Apprentice")
    expect(foundryRank(3)).toBe("Operator")
    expect(foundryRank(5)).toBe("Engineer")
    expect(foundryRank(8)).toBe("Foreman")
    expect(foundryRank(11)).toBe("Master of the Forge")
    expect(foundryRank(99)).toBe("Master of the Forge")
    expect(foundryRank(0)).toBe("Apprentice")
  })
})
