// Game progress is intentionally isolated from practice and Expedition progress.

export type GameProgress = {
  plays: number
  cleanRuns: number
  bestMistakes: number | null
  lastPlayed: string
}

const KEY = "deriva-games-v1"

function read(): Record<string, GameProgress> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

export function loadGameProgress(id: string): GameProgress | undefined {
  return read()[id]
}

export function recordGameRun(id: string, mistakes: number) {
  const store = read()
  const previous = store[id]
  store[id] = {
    plays: (previous?.plays || 0) + 1,
    cleanRuns: (previous?.cleanRuns || 0) + (mistakes === 0 ? 1 : 0),
    bestMistakes: previous?.bestMistakes === null || previous?.bestMistakes === undefined
      ? mistakes
      : Math.min(previous.bestMistakes, mistakes),
    lastPlayed: new Date().toISOString(),
  }
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}
