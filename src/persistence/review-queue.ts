// Spaced review for named patterns — SM-2-lite, calm intervals, local-only.

import { loadPatternMastery } from "./pattern-mastery"

const KEY = "deriva-review-v1"
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

export type ReviewGrade = "again" | "hard" | "good" | "easy"

export type ReviewCard = {
  patternId: string
  interval: number
  dueAt: number
  reps: number
  lapses: number
}

export type ReviewQueue = Record<string, ReviewCard>

function loadQueue(): ReviewQueue {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, unknown>
    const out: ReviewQueue = {}
    for (const [patternId, value] of Object.entries(raw)) {
      const card = value as Partial<ReviewCard>
      if (typeof card.patternId === "string" && typeof card.interval === "number" && typeof card.dueAt === "number") {
        out[patternId] = {
          patternId,
          interval: Math.max(card.interval, 0),
          dueAt: card.dueAt,
          reps: card.reps ?? 0,
          lapses: card.lapses ?? 0,
        }
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveQueue(queue: ReviewQueue) {
  try { localStorage.setItem(KEY, JSON.stringify(queue)) } catch {}
}

export function enqueuePattern(patternId: string) {
  const queue = loadQueue()
  if (queue[patternId]) return
  queue[patternId] = { patternId, interval: DAY, dueAt: Date.now(), reps: 0, lapses: 0 }
  saveQueue(queue)
}

export function enqueuePatterns(patternIds: string[]) {
  patternIds.forEach(enqueuePattern)
}

export function allCards(): ReviewCard[] {
  return Object.values(loadQueue()).sort((a, b) => a.dueAt - b.dueAt)
}

export function dueCards(now = Date.now()): ReviewCard[] {
  return allCards().filter(card => card.dueAt <= now)
}

export function gradeCard(patternId: string, grade: ReviewGrade, now = Date.now()) {
  const queue = loadQueue()
  const card = queue[patternId] || { patternId, interval: DAY, dueAt: now, reps: 0, lapses: 0 }
  if (grade === "again") {
    card.lapses += 1
    card.reps = 0
    card.interval = 10 * MINUTE
  } else if (grade === "hard") {
    card.interval = Math.max(card.interval, DAY) * 1.2
    card.reps += 1
  } else if (grade === "good") {
    card.interval = card.reps === 0 ? DAY : Math.max(card.interval, DAY) * 2
    card.reps += 1
  } else {
    card.interval = card.reps === 0 ? 2 * DAY : Math.max(card.interval, DAY) * 2.5
    card.reps += 1
  }
  card.dueAt = now + card.interval
  queue[patternId] = card
  saveQueue(queue)
}

export function removeCard(patternId: string) {
  const queue = loadQueue()
  delete queue[patternId]
  saveQueue(queue)
}

export function seedQueueFromMastery() {
  const mastery = loadPatternMastery()
  enqueuePatterns([...mastery.recognized, ...mastery.missed])
}
