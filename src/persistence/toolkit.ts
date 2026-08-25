// Everyday toolkit state — tasks and daily habits, local-first.

const TASKS_KEY = "deriva-tasks-v1"
const HABITS_KEY = "deriva-habits-v1"

export type Task = { id: string; text: string; done: boolean; createdAt: number }

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]") as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .filter(item => item && typeof item === "object")
      .map(item => item as Record<string, unknown>)
      .filter(item => typeof item.id === "string" && typeof item.text === "string")
      .map(item => ({ id: item.id as string, text: item.text as string, done: item.done === true, createdAt: typeof item.createdAt === "number" ? item.createdAt : 0 }))
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) } catch {}
}

export type Habit = { id: string; name: string; days: Record<string, boolean> }

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function lastNDays(n: number): string[] {
  const out: string[] = []
  const cursor = new Date()
  for (let i = 0; i < n; i++) {
    out.unshift(dayKey(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return out
}

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(HABITS_KEY) || "[]") as unknown
    if (!Array.isArray(raw)) return []
    return raw
      .filter(item => item && typeof item === "object")
      .map(item => item as Record<string, unknown>)
      .filter(item => typeof item.id === "string" && typeof item.name === "string")
      .map(item => ({ id: item.id as string, name: item.name as string, days: typeof item.days === "object" && item.days !== null ? item.days as Record<string, boolean> : {} }))
  } catch {
    return []
  }
}

export function saveHabits(habits: Habit[]) {
  try { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)) } catch {}
}
