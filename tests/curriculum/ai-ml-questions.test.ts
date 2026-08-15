// AI/ML question bank tests (docs/13 §Product navigation and question bank).
// The bank is complete only when every question is typed, fixture-backed,
// rubric-scored, hint-supported, connected to a lab, chained to a next
// question, and reachable.

import { describe, it, expect } from "vitest"
import { AiQuestionSchema } from "../../src/curriculum/schema/question"
import { aiQuestions, aiQuestionTracks } from "../../src/curriculum/topics/ai-ml/questions"
import { plannedLabs } from "../../src/curriculum/topics/ai-ml/topic"

describe("the 180-question bank", () => {
  it("has exactly 180 questions and 8 tracks", () => {
    expect(aiQuestions).toHaveLength(180)
    expect(aiQuestionTracks).toHaveLength(8)
  })

  it("every question validates against the typed contract", () => {
    for (const question of aiQuestions) {
      expect(() => AiQuestionSchema.parse(question)).not.toThrow()
    }
  })

  it("every question carries a fixture, rubric, and hints", () => {
    for (const question of aiQuestions) {
      expect(question.contextFixture, `${question.id} fixture`).toBeDefined()
      expect(question.rubric.length).toBeGreaterThanOrEqual(2)
      expect(question.hints.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("every question names an expected artifact or trace observation", () => {
    for (const question of aiQuestions) {
      const hasArtifact = typeof question.expectedArtifact === "string" && question.expectedArtifact.length > 0
      const hasTrace = typeof question.expectedTraceObservation === "string" && question.expectedTraceObservation.length > 0
      expect(hasArtifact || hasTrace, `${question.id} needs an expected result`).toBe(true)
    }
  })

  it("has the planned family sizes", () => {
    const count = (track: string) => aiQuestions.filter(question => question.track === track).length
    expect(count("math")).toBe(30)
    expect(count("data")).toBe(15)
    expect(count("classical")).toBe(20)
    expect(count("experiments")).toBe(20)
    expect(count("deep")).toBe(30)
    expect(count("retrieval")).toBe(20)
    expect(count("rag")).toBe(20)
    expect(count("backend")).toBe(25)
  })

  it("uses every question kind at least once", () => {
    const kinds = new Set(aiQuestions.map(question => question.kind))
    for (const kind of ["derivation", "prediction", "construction", "implementation", "debugging", "counterexample", "comparison", "operations", "communication", "transfer"] as const) {
      expect(kinds.has(kind), `missing kind ${kind}`).toBe(true)
    }
  })

  it("every question links to a known lab (authored or planned)", () => {
    const knownSlugs = new Set<string>()
    for (const key of Object.keys(plannedLabs)) knownSlugs.add(key.split("/").pop()!)
    for (const question of aiQuestions) {
      const slug = question.lessonId.split("/").pop()!
      expect(knownSlugs.has(slug) || slug === "what-counts-as-training-data", `${question.id} → ${question.lessonId}`).toBe(true)
    }
  })
})

describe("the question chain", () => {
  it("forms one long chain from MATH-001 to OPS-001, visiting every question exactly once", () => {
    const byId = new Map(aiQuestions.map(question => [question.id, question]))
    const visited = new Set<string>()
    let current = byId.get("MATH-001")!
    let steps = 0
    const order: string[] = []

    while (current) {
      expect(visited.has(current.id), `chain revisited ${current.id}`).toBe(false)
      visited.add(current.id)
      order.push(current.id)
      steps++
      current = current.nextQuestionId ? byId.get(current.nextQuestionId)! : null as never
      if (!current) break
    }

    expect(steps).toBe(180)
    expect(order[0]).toBe("MATH-001")
    expect(order[179]).toBe("OPS-001")
    expect(visited.size).toBe(180)
  })

  it("walks the chain in the bank's numbered order", () => {
    const byId = new Map(aiQuestions.map(question => [question.id, question]))
    const walked: string[] = []
    let current: ReturnType<typeof byId.get> = byId.get("MATH-001")
    while (current) {
      walked.push(current.id)
      current = current.nextQuestionId ? byId.get(current.nextQuestionId) : undefined
    }
    expect(walked).toEqual(aiQuestions.map(question => question.id))
  })
})
