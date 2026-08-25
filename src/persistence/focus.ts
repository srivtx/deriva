// Focus timer state — wall-clock based so the timer survives navigation.

const KEY = "deriva-focus-v1"

export type FocusMode = "focus" | "break"

export type FocusState = {
  mode: FocusMode
  running: boolean
  deadline: number | null
  remainingMs: number
  sessions: number
}

export const FOCUS_MS = 25 * 60_000
export const BREAK_MS = 5 * 60_000

export function defaultFocusState(mode: FocusMode = "focus"): FocusState {
  return { mode, running: false, deadline: null, remainingMs: mode === "focus" ? FOCUS_MS : BREAK_MS, sessions: 0 }
}

export function loadFocusState(): FocusState {
  if (typeof window === "undefined") return defaultFocusState()
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<FocusState> | null
    if (!raw || typeof raw.remainingMs !== "number") return defaultFocusState()
    return {
      mode: raw.mode === "break" ? "break" : "focus",
      running: raw.running === true,
      deadline: typeof raw.deadline === "number" ? raw.deadline : null,
      remainingMs: Math.max(0, raw.remainingMs),
      sessions: typeof raw.sessions === "number" ? raw.sessions : 0,
    }
  } catch {
    return defaultFocusState()
  }
}

export function saveFocusState(state: FocusState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function focusRemainingMs(state: FocusState, now = Date.now()): number {
  if (state.running && state.deadline != null) return Math.max(0, state.deadline - now)
  return Math.max(0, state.remainingMs)
}
