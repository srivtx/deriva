// Stage machine — the 9-stage state flow (01 §5, 03 B1)
// One store per active lesson instance.

import { create } from "zustand"
import { z } from "zod"

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
  understand?: { predictions: Record<string, unknown> }
  play?: { experiments: Record<string, unknown> }
  reason?: { answers: Record<string, string[]> }
  discover?: { artifact: Record<string, string> }
  design?: { contract: Record<string, unknown> }
  implement?: { code: string; hintLevel: number }
  execute?: { trace: unknown; cursor: number }
  reflect?: { notes: string }
  generalize?: { confirmed: boolean }
}

export interface StageGate {
  stage: StageName
  locked: boolean
  completed: boolean
  artifacts: StageArtifacts[StageName]
}

export interface StageMachineState {
  currentStage: StageName
  stages: Record<StageName, StageGate>
  canAdvance: boolean
  isCompleted: boolean

  // Actions
  enterStage: (stage: StageName) => void
  completeStage: (stage: StageName, artifacts?: StageArtifacts[StageName]) => void
  unlockStage: (stage: StageName) => void
  setArtifact: (stage: StageName, artifacts: StageArtifacts[StageName]) => void
  reset: () => void
}

const initialStages = (): Record<StageName, StageGate> => {
  const stages = {} as Record<StageName, StageGate>
  for (const name of StageNames) {
    stages[name] = {
      stage: name,
      locked: name !== "understand", // only first stage unlocked
      completed: false,
      artifacts: undefined,
    }
  }
  return stages
}

export const useStageMachine = create<StageMachineState>((set, get) => ({
  currentStage: "understand",
  stages: initialStages(),
  canAdvance: false,
  isCompleted: false,

  enterStage: (stage) => {
    const { stages } = get()
    if (stages[stage].locked) return
    set({ currentStage: stage })
  },

  completeStage: (stage, artifacts) => {
    const { stages } = get()
    const nextIndex = StageNames.indexOf(stage) + 1
    const updates: Partial<StageMachineState> = {
      stages: { ...stages, [stage]: { ...stages[stage], completed: true, artifacts } },
    }
    // Unlock next stage
    if (nextIndex < StageNames.length) {
      const nextStage = StageNames[nextIndex]
      updates.stages = {
        ...(updates.stages || stages),
        [stage]: { ...stages[stage], completed: true, artifacts },
        [nextStage]: { ...stages[nextStage], locked: false },
      }
    }
    // If last stage, mark completed
    if (stage === "generalize") {
      updates.isCompleted = true
    }
    set(updates as StageMachineState)
  },

  unlockStage: (stage) => {
    const { stages } = get()
    set({
      stages: { ...stages, [stage]: { ...stages[stage], locked: false } },
    })
  },

  setArtifact: (stage, artifacts) => {
    const { stages } = get()
    set({
      stages: { ...stages, [stage]: { ...stages[stage], artifacts } },
    })
  },

  reset: () => set({
    currentStage: "understand",
    stages: initialStages(),
    canAdvance: false,
    isCompleted: false,
  }),
}))
