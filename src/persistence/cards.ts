// Spaced-retrieval persistence for Pattern Cards (docs/08 local-first).
// Leitner-style box progression with streak tracking.

export type CardRating = "again" | "hard" | "good" | "easy"

export interface CardProgress {
  cardId: string
  box: number // 1 to 5
  streak: number
  totalReviews: number
  lastReviewedAt: number
  nextDueAt: number
  mastered: boolean
}

export interface CardsStats {
  totalReviewedToday: number
  masteredCount: number
  streakDays: number
}

const CARDS_STORAGE_KEY = "deriva-cards-progress-v1"
const CARDS_DAILY_KEY = "deriva-cards-daily-v1"

let memoryCardsStore: Record<string, CardProgress> = {}

export function loadCardsProgress(): Record<string, CardProgress> {
  if (typeof window === "undefined") return memoryCardsStore
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CardProgress>
  } catch {
    return {}
  }
}

export function saveCardsProgress(progress: Record<string, CardProgress>): void {
  if (typeof window === "undefined") {
    memoryCardsStore = progress
    return
  }
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(progress))
  } catch {}
}

export function recordCardReview(cardId: string, rating: CardRating): CardProgress {
  const all = loadCardsProgress()
  const prev = all[cardId] || {
    cardId,
    box: 1,
    streak: 0,
    totalReviews: 0,
    lastReviewedAt: 0,
    nextDueAt: 0,
    mastered: false,
  }

  const now = Date.now()
  const DAY_MS = 24 * 60 * 60 * 1000

  let nextBox = prev.box
  let nextStreak = prev.streak
  let intervalDays = 1

  if (rating === "again") {
    nextBox = 1
    nextStreak = 0
    intervalDays = 0 // Due immediately / in current session
  } else if (rating === "hard") {
    nextBox = Math.max(1, prev.box)
    nextStreak = prev.streak + 1
    intervalDays = 1
  } else if (rating === "good") {
    nextBox = Math.min(5, prev.box + 1)
    nextStreak = prev.streak + 1
    intervalDays = Math.max(2, nextBox * 2)
  } else if (rating === "easy") {
    nextBox = Math.min(5, prev.box + 2)
    nextStreak = prev.streak + 2
    intervalDays = Math.max(4, nextBox * 3)
  }

  const isMastered = nextBox >= 4 || nextStreak >= 3

  const updated: CardProgress = {
    cardId,
    box: nextBox,
    streak: nextStreak,
    totalReviews: prev.totalReviews + 1,
    lastReviewedAt: now,
    nextDueAt: now + intervalDays * DAY_MS,
    mastered: isMastered,
  }

  all[cardId] = updated
  saveCardsProgress(all)
  bumpDailyCardCount()

  return updated
}

let memoryDailyCount = 0

function bumpDailyCardCount(): void {
  if (typeof window === "undefined") {
    memoryDailyCount++
    return
  }
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(CARDS_DAILY_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[today] = (data[today] || 0) + 1
    localStorage.setItem(CARDS_DAILY_KEY, JSON.stringify(data))
  } catch {}
}

export function loadTodayReviewedCount(): number {
  if (typeof window === "undefined") return memoryDailyCount
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(CARDS_DAILY_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw)
    return Number(data[today] || 0)
  } catch {
    return 0
  }
}

export function resetAllCardProgress(): void {
  if (typeof window === "undefined") {
    memoryCardsStore = {}
    memoryDailyCount = 0
    return
  }
  try {
    localStorage.removeItem(CARDS_STORAGE_KEY)
    localStorage.removeItem(CARDS_DAILY_KEY)
  } catch {}
}
