// AI/ML question progress — local-first persistence (docs/13 §surfacing rules).
// The ONLY module for question state allowed to touch localStorage (06 rule 4).
// Tracks per-question status, drafts, attempts, hints, and review schedule.

export type QuestionStatus = "new" | "started" | "attempted" | "done"

export interface QuestionProgress {
  status: QuestionStatus
  answer?: string
  attempts: number
  hintsRevealed: number
  rubricOpened: boolean
  expectedOpened: boolean
  lastOpened?: string // ISO date
  nextReview?: string // ISO date when due for review
}

const KEY = "deriva-ai-question-v1"

type Store = Record<string, QuestionProgress>

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

function writeStore(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function loadQuestionProgress(questionId: string): QuestionProgress | undefined {
  return readStore()[questionId]
}

export function saveQuestionProgress(questionId: string, progress: QuestionProgress) {
  const store = readStore()
  store[questionId] = progress
  writeStore(store)
}

export function loadAllQuestionProgress(): Record<string, QuestionProgress> {
  return readStore()
}
