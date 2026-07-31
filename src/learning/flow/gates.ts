// Gates — transition rules + the "test me out" mastery probe (03 B1)
// Skipping must be earned: one mastery-level question per stage, pass → the
// stage is completed viaProbe (logged); fail → routed back without shame.

import type { LessonModule, Probe } from "@/curriculum/schema/lesson"
import type { StageName } from "./stage-machine"

// What a locked stage demands — shown on the stepper/rail, never a dead end.
export function gateRequirement(stage: StageName): string {
  switch (stage) {
    case "play": return "Finish Understand's prediction"
    case "reason": return "Touch the sandbox first"
    case "discover": return "Answer the Socratic questions"
    case "design": return "Build your contract in Discover"
    case "implement": return "Pass the Design contract"
    case "execute": return "Make the tests pass"
    case "reflect": return "Watch your code run"
    case "generalize": return "Deposit your pattern"
    default: return ""
  }
}

// A one-line verb for the stage surface kicker.
export function stageVerb(stage: StageName): string {
  switch (stage) {
    case "understand": return "predict"
    case "play": return "touch"
    case "reason": return "answer"
    case "discover": return "construct"
    case "design": return "specify"
    case "implement": return "write"
    case "execute": return "watch"
    case "reflect": return "explain"
    case "generalize": return "connect"
  }
}

export function probeFor(lesson: LessonModule, stage: StageName): Probe | undefined {
  return lesson.probes[stage]
}

export function checkProbe(probe: Probe, answer: string): boolean {
  return probe.correct === answer
}
