// Pattern quiz progress — local-first and isolated from the page components.

export interface PatternQuizProgress {
  currentIndex: number
  score: number
  answered: number
  completed: boolean
}

const KEY = "deriva-pattern-quiz-v1"

const EMPTY_PROGRESS: PatternQuizProgress = {
  currentIndex: 0,
  score: 0,
  answered: 0,
  completed: false,
}

export function loadPatternQuizProgress(): PatternQuizProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<PatternQuizProgress> | null
    if (!raw) return EMPTY_PROGRESS
    return {
      currentIndex: Math.max(0, Number(raw.currentIndex) || 0),
      score: Math.max(0, Number(raw.score) || 0),
      answered: Math.max(0, Number(raw.answered) || 0),
      completed: raw.completed === true,
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function savePatternQuizProgress(progress: PatternQuizProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)) } catch {}
}

export function resetPatternQuizProgress() {
  try { localStorage.removeItem(KEY) } catch {}
}
