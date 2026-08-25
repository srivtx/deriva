// Lightweight in-device error telemetry: keeps the last few runtime errors in
// localStorage so recurring glitches can be diagnosed from Settings → System
// without any external reporting.

const KEY = "deriva-error-log"
const MAX = 6

export type LoggedError = { at: number; message: string; source: string }

export function readErrorLog(): LoggedError[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as LoggedError[]) : []
  } catch {
    return []
  }
}

function record(message: string, source: string) {
  try {
    const log = readErrorLog()
    log.unshift({ at: Date.now(), message: message.slice(0, 240), source })
    localStorage.setItem(KEY, JSON.stringify(log.slice(0, MAX)))
  } catch {}
}

export function installDiagnostics() {
  if (typeof window === "undefined") return
  window.addEventListener("error", event => {
    const target = event.target as HTMLElement | null
    if (target && target !== window as unknown as HTMLElement && "src" in target) return
    record(event.message ?? "unknown script error", `${event.filename?.split("/").pop() ?? "?"}:${event.lineno ?? 0}`)
  })
  window.addEventListener("unhandledrejection", event => {
    record(String(event.reason ?? "unhandled rejection"), "promise")
  })
}
