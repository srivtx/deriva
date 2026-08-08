// Pattern mastery signals from retrieval practice. A miss creates a review
// card; a later correct answer clears that pattern from the review queue.

export interface PatternMastery {
  recognized: string[]
  missed: string[]
  transferred: string[]
}

const KEY = "deriva-pattern-mastery-v1"

const EMPTY: PatternMastery = { recognized: [], missed: [], transferred: [] }

export function loadPatternMastery(): PatternMastery {
  if (typeof window === "undefined") return EMPTY
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<PatternMastery>
    return {
      recognized: Array.isArray(raw.recognized) ? raw.recognized.filter(item => typeof item === "string") : [],
      missed: Array.isArray(raw.missed) ? raw.missed.filter(item => typeof item === "string") : [],
      transferred: Array.isArray(raw.transferred) ? raw.transferred.filter(item => typeof item === "string") : [],
    }
  } catch {
    return EMPTY
  }
}

export function recordPatternAnswer(patternId: string, correct: boolean) {
  const current = loadPatternMastery()
  const recognized = new Set(current.recognized)
  const missed = new Set(current.missed)
  if (correct) {
    recognized.add(patternId)
    missed.delete(patternId)
  } else {
    missed.add(patternId)
  }
  try { localStorage.setItem(KEY, JSON.stringify({ ...current, recognized: [...recognized], missed: [...missed] })) } catch {}
}

export function recordPatternTransfer(patternId: string) {
  const current = loadPatternMastery()
  const transferred = new Set(current.transferred)
  transferred.add(patternId)
  try { localStorage.setItem(KEY, JSON.stringify({ ...current, transferred: [...transferred] })) } catch {}
}
