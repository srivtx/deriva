// Foundry progress — isolated from game/practice progress, same pattern.
// XP: 50 per newly cleared mission, +100 the first time a station is fully
// cleared. Kept in localStorage under a Foundry-specific key.

import { FOUNDRY_MISSION_XP, FOUNDRY_STATION_BONUS, FOUNDRIES, foundryTotalMissions } from "@/foundry/catalog"

export type StationProgress = {
  missionsCleared: number
  bestMistakes: number | null
  runs: number
  xp: number
  lastPlayed: string
}

const KEY = "deriva-foundry-v1"

function read(): Record<string, StationProgress> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, StationProgress>
  } catch {
    return {}
  }
}

export function loadStationProgress(stationId: string): StationProgress | undefined {
  return read()[stationId]
}

export function loadAllFoundryProgress(): Record<string, StationProgress> {
  return read()
}

export function recordStationRun(stationId: string, missionsCleared: number, mistakes: number): StationProgress {
  const store = read()
  const previous = store[stationId]
  const cleared = Math.max(previous?.missionsCleared ?? 0, missionsCleared)
  const newlyCleared = Math.max(0, missionsCleared - (previous?.missionsCleared ?? 0))
  const station = FOUNDRIES.find(entry => entry.id === stationId)
  const firstFullClear = station ? cleared >= station.missions && (previous?.missionsCleared ?? 0) < station.missions : false
  const xp =
    (previous?.xp ?? 0) + newlyCleared * FOUNDRY_MISSION_XP + (firstFullClear ? FOUNDRY_STATION_BONUS : 0)

  const next: StationProgress = {
    missionsCleared: cleared,
    bestMistakes: previous?.bestMistakes === null || previous?.bestMistakes === undefined
      ? mistakes
      : Math.min(previous.bestMistakes, mistakes),
    runs: (previous?.runs ?? 0) + 1,
    xp,
    lastPlayed: new Date().toISOString(),
  }
  store[stationId] = next
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage unavailable — progress simply is not persisted */
  }
  return next
}

export function foundryTotals(): { xp: number; missionsCleared: number; stationsCleared: number } {
  const store = read()
  let xp = 0
  let missionsCleared = 0
  let stationsCleared = 0
  for (const station of FOUNDRIES) {
    const entry = store[station.id]
    if (!entry) continue
    xp += entry.xp
    missionsCleared += Math.min(entry.missionsCleared, station.missions)
    if (entry.missionsCleared >= station.missions) stationsCleared += 1
  }
  return { xp, missionsCleared, stationsCleared }
}

export function foundryLevel(xp: number): { level: number; intoLevel: number; levelSpan: number } {
  const span = 200
  const level = Math.floor(xp / span) + 1
  return { level, intoLevel: xp % span, levelSpan: span }
}

export const FOUNDRY_TOTAL_MISSIONS = foundryTotalMissions()
