export interface CalEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
  time?: string // HH:MM
  note?: string
  remind?: boolean
}

const KEY = "deriva-events-v1"

export function loadEvents(): CalEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as CalEvent[] } catch { return [] }
}

export function saveEvents(list: CalEvent[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export function newId(): string {
  return `c${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
