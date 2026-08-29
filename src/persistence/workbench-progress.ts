// Resume state for the focused workbenches. The route owns rendering;
// this module owns the durable current item and completion list.

export type WorkbenchKind = "design" | "lld" | "db" | "ultron"

export interface WorkbenchProgress {
  currentId: number
  completed: number[]
}

const CONFIG: Record<WorkbenchKind, { key: string; legacyCompletedKey: string }> = {
  design: { key: "deriva-design-progress-v1", legacyCompletedKey: "deriva-design-completed" },
  lld: { key: "deriva-lld-progress-v1", legacyCompletedKey: "deriva-lld-completed" },
  db: { key: "deriva-db-progress-v1", legacyCompletedKey: "deriva-db-completed" },
  ultron: { key: "deriva-ultron-progress-v1", legacyCompletedKey: "deriva-ultron-completed" },
}

function emptyProgress(): WorkbenchProgress {
  return { currentId: 1, completed: [] }
}

export function loadWorkbenchProgress(kind: WorkbenchKind): WorkbenchProgress {
  if (typeof window === "undefined") return emptyProgress()
  const config = CONFIG[kind]
  try {
    const raw = JSON.parse(localStorage.getItem(config.key) || "null") as Partial<WorkbenchProgress> | null
    const legacy = JSON.parse(localStorage.getItem(config.legacyCompletedKey) || "[]") as unknown
    const completed = Array.isArray(raw?.completed)
      ? raw.completed.filter(value => Number.isInteger(Number(value))).map(Number)
      : Array.isArray(legacy)
        ? legacy.filter(value => Number.isInteger(Number(value))).map(Number)
        : []
    return {
      currentId: Number.isInteger(Number(raw?.currentId)) && Number(raw?.currentId) > 0 ? Number(raw?.currentId) : 1,
      completed: [...new Set(completed)],
    }
  } catch {
    return emptyProgress()
  }
}

export function saveWorkbenchProgress(kind: WorkbenchKind, progress: WorkbenchProgress) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CONFIG[kind].key, JSON.stringify({
      currentId: progress.currentId,
      completed: [...new Set(progress.completed)],
    }))
  } catch {}
}
