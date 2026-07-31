// Stage machine — the 9-stage state flow (01 §5, 03 B1)
// One store per active lesson instance. Stages unlock strictly in order;
// the only bypass is a passed mastery probe (viaProbe), logged in artifacts.

import { create } from "zustand"

export const StageNames = [
  "understand", "play", "reason", "discover", "design",
  "implement", "execute", "reflect", "generalize"
] as const

export type StageName = typeof StageNames[number]
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const StageNameToNumber: Record<StageName, StageNumber> = {
  understand: 1, play: 2, reason: 3, discover: 4, design: 5,
  implement: 6, execute: 7, reflect: 8, generalize: 9,
}

// Per-stage artifacts the student constructs
export interface StageArtifacts {
  understand?: { prediction: string; wasRight: boolean }
  play?: { experimentsDone: string[] }
  reason?: { answers: Record<string, string>; misses: number }
  discover?: { slots: Record<string, string>; attempts: number }
  design?: { name: string; param: string; baseCase: string; recursiveStep: string; complexity: string }
  implement?: { code: string; hintLevel: number; solutionRevealed: boolean; testsPassed: number }
  execute?: { watchedToEnd: boolean }
  reflect?: { ownWords: string }
  generalize?: { confirmed: boolean }
}

export interface StageGate {
  stage: StageName
  locked: boolean
  completed: boolean
  viaProbe: boolean
  artifacts?: StageArtifacts[StageName]
}

export interface HydratedStage {
  completed: boolean
  viaProbe: boolean
  artifacts?: StageArtifacts[StageName]
}

export interface StageMachineState {
  lessonKey: string | null
  currentStage: StageName
  stages: Record<StageName, StageGate>
  isCompleted: boolean

  init: (lessonKey: string, saved?: { currentStage: StageName; stages: Partial<Record<StageName, HydratedStage>> }) => void
  enterStage: (stage: StageName) => void
  completeStage: (stage: StageName, artifacts?: StageArtifacts[StageName], viaProbe?: boolean) => void
  setArtifact: (stage: StageName, artifacts: StageArtifacts[StageName]) => void
  reset: () => void
}

const initialStages = (): Record<StageName, StageGate> => {
  const stages = {} as Record<StageName, StageGate>
  for (const name of StageNames) {
    stages[name] = { stage: name, locked: name !== "understand", completed: false, viaProbe: false }
  }
  return stages
}

export const useStageMachine = create<StageMachineState>((set, get) => ({
  lessonKey: null,
  currentStage: "understand",
  stages: initialStages(),
  isCompleted: false,

  init: (lessonKey, saved) => {
    if (get().lessonKey === lessonKey) return // already hydrated for this lesson
    const stages = initialStages()
    if (saved) {
      let furthestUnlocked = false
      for (let i = 0; i < StageNames.length; i++) {
        const name = StageNames[i]
        const s = saved.stages[name]
        if (s?.completed) {
          stages[name] = { ...stages[name], completed: true, viaProbe: !!s.viaProbe, artifacts: s.artifacts, locked: false }
        } else if (!furthestUnlocked) {
          stages[name] = { ...stages[name], locked: false } // first incomplete = current frontier
          furthestUnlocked = true
        }
      }
    }
    const current = saved?.currentStage && !stages[saved.currentStage].locked
      ? saved.currentStage
      : StageNames.find(n => !stages[n].locked && !stages[n].completed) || "understand"
    set({ lessonKey, stages, currentStage: current, isCompleted: stages.generalize.completed })
  },

  enterStage: (stage) => {
    const { stages } = get()
    if (stages[stage].locked) return
    set({ currentStage: stage })
  },

  completeStage: (stage, artifacts, viaProbe = false) => {
    const { stages } = get()
    const nextIndex = StageNames.indexOf(stage) + 1
    const next = { ...stages, [stage]: { ...stages[stage], completed: true, viaProbe, artifacts: artifacts ?? stages[stage].artifacts } }
    if (nextIndex < StageNames.length) {
      const nextStage = StageNames[nextIndex]
      next[nextStage] = { ...next[nextStage], locked: false }
    }
    set({ stages: next, isCompleted: stage === "generalize" ? true : get().isCompleted })
  },

  setArtifact: (stage, artifacts) => {
    const { stages } = get()
    set({ stages: { ...stages, [stage]: { ...stages[stage], artifacts } } })
  },

  reset: () => set({ lessonKey: null, currentStage: "understand", stages: initialStages(), isCompleted: false }),
}))
