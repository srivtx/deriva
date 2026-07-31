// Lesson progress — local-first persistence (08). The ONLY module in the
// lesson engine allowed to touch localStorage (06 boundary rule 4).

import type { StageName, StageArtifacts } from "@/learning/flow/stage-machine"

export interface StageProgress {
  completed: boolean
  viaProbe: boolean
  artifacts?: StageArtifacts[StageName]
}

export interface PatternDeposit {
  patternId: string
  name: string
  ownWords: string
  lessonId: string
  earnedAt: string // ISO date
}

export interface LessonProgress {
  currentStage: StageName
  stages: Partial<Record<StageName, StageProgress>>
  probeAttempts: number
  patternDeposit?: PatternDeposit
  finishedAt?: string
}

const KEY = "deriva-lesson-v1"

type Store = Record<string, LessonProgress>

function readStore(): Store {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") } catch { return {} }
}

function writeStore(store: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

export function loadLessonProgress(lessonId: string): LessonProgress | undefined {
  return readStore()[lessonId]
}

export function saveLessonProgress(lessonId: string, progress: LessonProgress) {
  const store = readStore()
  store[lessonId] = progress
  writeStore(store)
}

export function recordProbeAttempt(lessonId: string) {
  const store = readStore()
  const p = store[lessonId]
  if (p) { p.probeAttempts = (p.probeAttempts || 0) + 1; writeStore(store) }
}

// ── Pattern journal (F10) — deposits from every lesson, curriculum-global ──

export function listPatternDeposits(): PatternDeposit[] {
  const store = readStore()
  return Object.values(store)
    .map(p => p.patternDeposit)
    .filter((d): d is PatternDeposit => !!d)
    .sort((a, b) => a.earnedAt.localeCompare(b.earnedAt))
}

// Discovery-rate signal (PRD §7): did the student reach Implement without
// revealing the solution? Logged per lesson, never punished.
export function lessonDiscoveryStats(lessonId: string): { solutionRevealed: boolean; hintLevel: number; probeAttempts: number } | undefined {
  const p = readStore()[lessonId]
  if (!p) return undefined
  const impl = p.stages.implement?.artifacts as StageArtifacts["implement"]
  return {
    solutionRevealed: !!impl?.solutionRevealed,
    hintLevel: impl?.hintLevel ?? 0,
    probeAttempts: p.probeAttempts ?? 0,
  }
}
