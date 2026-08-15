// Project level progress — local-first (system-ai/ml-projects-plan.md §Persistence).
// The ONLY module for systems-project state allowed to touch localStorage (06 rule 4).
// The map derives 0/5–5/5 from this state; a level is complete only when tests,
// artifact fields, reflection, and the exit gate pass.

export type LevelStage = "spec" | "design" | "workbench" | "artifact"
export type PaneId = "spec" | "tests" | "code" | "output"

export interface ArtifactValues {
  [fieldName: string]: string
}

export interface ProjectLevelProgress {
  status: "new" | "started" | "tests-passing" | "complete"
  stage: LevelStage
  pane: PaneId
  editorDraft: string
  designPassed: boolean
  hintDepth: number
  solutionRevealed: boolean
  attempts: number
  testsPassing: boolean
  traceCursor: number
  artifactValues: ArtifactValues
  reflection: string
  exitGatePassed: boolean
  lastOpened?: string
}

const KEY = "deriva-project-level-v1"

type Store = Record<string, ProjectLevelProgress> // key: `${projectId}/${levelId}`

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

function writeStore(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function levelKey(projectId: string, levelId: string): string {
  return `${projectId}/${levelId}`
}

export function loadLevelProgress(projectId: string, levelId: string): ProjectLevelProgress | undefined {
  return readStore()[levelKey(projectId, levelId)]
}

export function saveLevelProgress(projectId: string, levelId: string, progress: ProjectLevelProgress) {
  const store = readStore()
  store[levelKey(projectId, levelId)] = progress
  writeStore(store)
}

export function loadProjectLevels(projectId: string): Record<string, ProjectLevelProgress> {
  const store = readStore()
  const out: Record<string, ProjectLevelProgress> = {}
  for (const [key, value] of Object.entries(store)) {
    if (key.startsWith(`${projectId}/`)) out[key.split("/")[1]!] = value
  }
  return out
}

export function loadLastOpenedProject(): string | null {
  if (typeof window === "undefined") return null
  try { return localStorage.getItem("deriva-project-last-opened") } catch { return null }
}

export function saveLastOpenedProject(projectId: string) {
  try { localStorage.setItem("deriva-project-last-opened", projectId) } catch {}
}
