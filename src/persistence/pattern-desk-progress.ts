// The Pattern Desk remembers the last pattern the learner opened.

const KEY = "deriva-pattern-desk-progress-v1"

export interface PatternDeskProgress {
  currentPatternId?: string
}

export function loadPatternDeskProgress(): PatternDeskProgress {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<PatternDeskProgress> | null
    return typeof raw?.currentPatternId === "string" ? { currentPatternId: raw.currentPatternId } : {}
  } catch {
    return {}
  }
}

export function savePatternDeskPosition(currentPatternId: string) {
  try { localStorage.setItem(KEY, JSON.stringify({ currentPatternId })) } catch {}
}
