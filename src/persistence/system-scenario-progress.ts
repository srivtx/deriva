// Systems Atelier scenario progress — local-first persistence
// (system-ai/systems-atelier-plan.md §Persistence). The ONLY module for
// scenario state allowed to touch localStorage (06 rule 4).
// Run logs live in memory; only bounded metric summaries are persisted.

export type ScenarioStatus = "new" | "gates-passed" | "naive-done" | "fixed-done" | "complete"

export interface ScenarioRunSummary {
  p50: number
  p95: number
  p99: number
  max: number
  errorRate: number
  timeoutCount: number
  maxAttempts: number
  gatesPassed: number
  gatesTotal: number
}

export interface ScenarioProgress {
  status: ScenarioStatus
  designPicked: string[]
  designPassed: boolean
  naiveRunDone: boolean
  fixedRunDone: boolean
  draft: string
  naiveSummary?: ScenarioRunSummary
  fixedSummary?: ScenarioRunSummary
  artifactValues: Record<string, string>
  reflection: string
  lastOpened?: string // ISO date
}

const KEY = "deriva-systems-scenario-v1"

type Store = Record<string, ScenarioProgress>

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

function writeStore(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function loadScenarioProgress(scenarioId: string): ScenarioProgress | undefined {
  return readStore()[scenarioId]
}

export function saveScenarioProgress(scenarioId: string, progress: ScenarioProgress) {
  const store = readStore()
  store[scenarioId] = progress
  writeStore(store)
}

export function loadAllScenarioProgress(): Record<string, ScenarioProgress> {
  return readStore()
}
