// Daily challenge — one deterministic problem per calendar day, same for everyone.

import { TOPIC_LIST, type Problem } from "@/data"

const KEY = "deriva-daily-v1"

export type DailyRecord = {
  problemId: number
  topicId: string
  solvedAt: number
}

export type DailyHistory = Record<string, DailyRecord>

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function hashString(value: string): number {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export const DAILY_POOL: { topicId: string; topicName: string; problem: Problem }[] = TOPIC_LIST.flatMap(topic =>
  topic.problems.map(problem => ({ topicId: topic.id, topicName: topic.name, problem })),
)

export function dailyPickForDate(dateKey: string): { topicId: string; topicName: string; problem: Problem } {
  return DAILY_POOL[hashString(dateKey) % DAILY_POOL.length]
}

export function loadDailyHistory(): DailyHistory {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, unknown>
    const out: DailyHistory = {}
    for (const [dateKey, value] of Object.entries(raw)) {
      const record = value as Partial<DailyRecord>
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && typeof record.problemId === "number" && typeof record.topicId === "string" && typeof record.solvedAt === "number") {
        out[dateKey] = { problemId: record.problemId, topicId: record.topicId, solvedAt: record.solvedAt }
      }
    }
    return out
  } catch {
    return {}
  }
}

export function markDailySolved(dateKey: string, topicId: string, problemId: number) {
  const history = loadDailyHistory()
  if (history[dateKey]) return
  history[dateKey] = { topicId, problemId, solvedAt: Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(history)) } catch {}
}

export function currentStreak(history: DailyHistory): number {
  let streak = 0
  const cursor = new Date()
  if (!history[todayKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  while (history[todayKey(cursor)]) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
