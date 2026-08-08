// Curriculum rules tests — the constitution, mechanically enforced (03 §E).
// Schema validation itself happens at import (defineLesson); these tests pin
// the pedagogy rules that make a lesson a Deriva lesson.

import { describe, it, expect } from "vitest"
import { LessonModuleSchema, PredictionSchema, StageNames } from "../../src/curriculum/schema/lesson"
import { listLessons } from "../../src/curriculum"

const lessons = listLessons()

describe("curriculum registry", () => {
  it("has at least the reference lesson", () => {
    expect(lessons.length).toBeGreaterThanOrEqual(1)
  })

  it("every lesson validates against the schema (C1)", () => {
    for (const l of lessons) {
      expect(() => LessonModuleSchema.parse(l)).not.toThrow()
    }
  })
})

describe("Rule B1 — the 9-stage flow is complete", () => {
  it.each(lessons.map(l => [l.id, l] as const))("%s has all nine stages", (_id, l) => {
    for (const s of StageNames) {
      expect(l.stages[s], `missing stage ${s}`).toBeDefined()
    }
  })

  it.each(lessons.map(l => [l.id, l] as const))("%s has probes for stages 1–5", (_id, l) => {
    for (const s of ["understand", "play", "reason", "discover", "design"] as const) {
      expect(l.probes[s], `missing mastery probe for ${s}`).toBeDefined()
      expect(l.probes[s]!.options.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe("Stage 1 prediction integrity", () => {
  it("requires choices when a prediction is choice-based", () => {
    expect(() => PredictionSchema.parse({
      prompt: "Pick one",
      kind: "choice",
      correct: "a",
      explanation: "Because a is correct",
    })).toThrow()
  })
})

describe("Rule A1 — one thinking-move per stage, ≤8 words", () => {
  it.each(lessons.map(l => [l.id, l] as const))("%s names every stage move in ≤8 words", (_id, l) => {
    for (const s of StageNames) {
      const move = l.stageMoves[s]
      expect(move, `missing stageMove for ${s}`).toBeDefined()
      const words = move.trim().split(/\s+/).length
      expect(words, `"${move}" is ${words} words`).toBeLessThanOrEqual(8)
    }
    expect(l.thinkingMove.trim().split(/\s+/).length).toBeLessThanOrEqual(8)
  })
})

describe("Rule B3 — hints are questions before assertions", () => {
  it.each(lessons.map(l => [l.id, l] as const))("%s has ≥3 question-hints before any assertion", (_id, l) => {
    const hints = [...l.stages.implement.hints].sort((a, b) => a.level - b.level)
    const firstAssertion = hints.findIndex(h => h.type === "assertion")
    const questionsBefore = hints
      .slice(0, firstAssertion === -1 ? hints.length : firstAssertion)
      .filter(h => h.type === "question")
    expect(questionsBefore.length).toBeGreaterThanOrEqual(3)
  })
})

describe("Rule A3 — naive/optimized contrast is applies-or-documented", () => {
  it.each(lessons.map(l => [l.id, l] as const))("%s records the contrast decision", (_id, l) => {
    const c = l.naiveOptimizedContrast
    if (c.status === "exception") {
      expect(c.reason.length).toBeGreaterThanOrEqual(20)
    }
  })
})

describe("Rule C2 — a named pattern is attached", () => {
  it.each(lessons.map(l => [l.id, l] as const))("%s deposits a named pattern", (_id, l) => {
    expect(l.stages.reflect.pattern.id.length).toBeGreaterThan(0)
    expect(l.stages.reflect.pattern.name.length).toBeGreaterThan(3)
    expect(l.stages.generalize.related.length).toBeGreaterThanOrEqual(2)
  })
})
