// Build Everything workbench progress. This is the only module in this lane
// that touches localStorage; curriculum and execution remain pure boundaries.

import type { BuildEverythingImplementation } from "@/curriculum/schema/build-everything"

export type BuildEverythingStage = "spec" | "design" | "workbench" | "artifact"
export type BuildEverythingPane = "spec" | "tests" | "code" | "output"

export interface BuildEverythingProgress {
  stage: BuildEverythingStage
  pane: BuildEverythingPane
  editorDraft: string
  designPassed: boolean
  hintDepth: number
  solutionRevealed: boolean
  attempts: number
  testsPassing: boolean
  artifactValues: Record<string, string>
  reflection: string
  exitGatePassed: boolean
  lastOpened: string
}

const KEY = "deriva-build-everything-v1"
type Store = Record<string, BuildEverythingProgress>

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => isStoredProgress(value)))
  } catch { return {} }
}

function isStoredProgress(value: unknown): value is BuildEverythingProgress {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<BuildEverythingProgress>
  return (candidate.stage === "spec" || candidate.stage === "design" || candidate.stage === "workbench" || candidate.stage === "artifact")
    && (candidate.pane === "spec" || candidate.pane === "tests" || candidate.pane === "code" || candidate.pane === "output")
    && typeof candidate.editorDraft === "string"
    && typeof candidate.designPassed === "boolean"
    && typeof candidate.hintDepth === "number"
    && typeof candidate.solutionRevealed === "boolean"
    && typeof candidate.attempts === "number"
    && typeof candidate.testsPassing === "boolean"
    && !!candidate.artifactValues && typeof candidate.artifactValues === "object"
    && typeof candidate.reflection === "string"
    && typeof candidate.exitGatePassed === "boolean"
    && typeof candidate.lastOpened === "string"
}

function writeStore(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function loadBuildEverythingProgress(projectId: string): BuildEverythingProgress | undefined {
  return readStore()[projectId]
}

export function loadAllBuildEverythingProgress(): Record<string, BuildEverythingProgress> {
  return readStore()
}

export function saveBuildEverythingProgress(projectId: string, progress: BuildEverythingProgress) {
  const store = readStore()
  store[projectId] = progress
  writeStore(store)
}

export function newBuildEverythingProgress(implementation: BuildEverythingImplementation): BuildEverythingProgress {
  return {
    stage: "workbench",
    pane: "code",
    editorDraft: implementation.starter,
    designPassed: false,
    hintDepth: 0,
    solutionRevealed: false,
    attempts: 0,
    testsPassing: false,
    artifactValues: {},
    reflection: "",
    exitGatePassed: false,
    lastOpened: new Date().toISOString(),
  }
}
