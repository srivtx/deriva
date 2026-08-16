// Systems Projects contract tests (system-ai/ml-projects-plan.md §Typed model).
// Build-time rules verified: five levels, full authored content, hint ladders,
// artifact chain acyclicity, capability requirements, mixed-status rejection.

import { describe, it, expect } from "vitest"
import { SystemsProjectSchema, AuthoredLevelSchema } from "../../src/curriculum/schema/project"
import { systemsProjects } from "../../src/curriculum/topics/ai-ml/projects"

describe("the project ladder", () => {
  it("registers all 15 projects", () => {
    expect(systemsProjects).toHaveLength(15)
    expect(systemsProjects.map(project => project.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  })

  it("every project has exactly five levels", () => {
    for (const project of systemsProjects) {
      expect(project.levels, `${project.id} levels`).toHaveLength(5)
      expect(project.levels.map(level => level.number)).toEqual([1, 2, 3, 4, 5])
    }
  })

  it("every project validates against the schema (C1)", () => {
    for (const project of systemsProjects) {
      expect(() => SystemsProjectSchema.parse(project)).not.toThrow()
    }
  })

  it("every project is fully authored (never mixed)", () => {
    for (const project of systemsProjects) {
      const statuses = new Set(project.levels.map(level => level.status))
      expect(statuses, `${project.id} uniform status`).toEqual(new Set(["authored"]))
    }
  })

  it("every level names its thinking move in ≤8 words", () => {
    for (const project of systemsProjects) {
      for (const level of project.levels) {
        const words = level.thinkingMove.trim().split(/\s+/).length
        expect(words, `${project.id}/${level.id}: "${level.thinkingMove}" is ${words} words`).toBeLessThanOrEqual(8)
      }
    }
  })

  it("every level carries a duration", () => {
    for (const project of systemsProjects) {
      for (const level of project.levels) {
        expect(level.durationMinutes, `${project.id}/${level.id}`).toBeGreaterThanOrEqual(5)
      }
    }
  })
})

describe("authored level content (all systems projects)", () => {

  it("every level has spec, design gate, implementation, trace, artifact, drill, and exit gate", () => {
    for (const project of systemsProjects) {
      for (const level of project.levels) {
        expect(level.status).toBe("authored")
        if (level.status !== "authored") continue
        expect(level.spec.brief.length).toBeGreaterThan(20)
        expect(level.spec.requiredApi).toContain("def ")
        expect(level.spec.behavior.length).toBeGreaterThanOrEqual(2)
        expect(level.designQuestion.options.length).toBeGreaterThanOrEqual(2)
        expect(level.implementation.entryPoint.length).toBeGreaterThan(0)
        expect(level.implementation.starter).toContain("def ")
        expect(level.implementation.visibleTests.length).toBeGreaterThanOrEqual(2)
        expect(level.implementation.hiddenTestCases.length).toBeGreaterThanOrEqual(2)
        expect(level.failureDrill.prompt.length).toBeGreaterThan(20)
        expect(level.exitGate.options.length).toBeGreaterThanOrEqual(2)
        expect(level.trace.budget).toBeGreaterThanOrEqual(100)
        expect(level.artifact.fields.length).toBeGreaterThanOrEqual(1)
        expect(level.artifact.outputs.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it("every hint ladder has ≥3 questions before any assertion (B3-style)", () => {
    for (const project of systemsProjects) {
      for (const level of project.levels) {
        if (level.status !== "authored") continue
        const hints = [...level.implementation.hints].sort((a, b) => a.level - b.level)
        const firstAssertion = hints.findIndex(h => h.type === "assertion")
        const questionsBefore = hints
          .slice(0, firstAssertion === -1 ? hints.length : firstAssertion)
          .filter(h => h.type === "question")
        expect(questionsBefore.length, `${project.id}/${level.id} hints`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it("the artifact chain is acyclic: dependencies come from earlier levels", () => {
    for (const project of systemsProjects) {
      const produced = new Set<string>()
      for (const level of project.levels) {
        if (level.status !== "authored") continue
        for (const dep of level.dependencies) {
          expect(produced.has(dep), `${project.id}/${level.id} depends on ${dep} which no earlier level produces`).toBe(true)
        }
        for (const output of level.artifact.outputs) produced.add(output)
      }
    }
    expect(systemsProjects[0]!.levels.some(level => level.status === "authored" && level.artifact.outputs.includes("dataset-release"))).toBe(true)
  })
})

describe("schema rejection rules", () => {
  const authored = systemsProjects[0]!
  const plannedOnly = systemsProjects[1]!

  it("rejects fewer than five levels", () => {
    expect(() => SystemsProjectSchema.parse({ ...authored, levels: authored.levels.slice(0, 4) })).toThrow()
  })

  it("rejects a mixed planned/authored project", () => {
    const mixed = { ...authored, levels: [authored.levels[0]!, ...plannedOnly.levels.slice(1)] }
    expect(() => SystemsProjectSchema.parse(mixed)).toThrow()
  })

  it("rejects an authored level without a public contract", () => {
    const broken = { ...authored, levels: authored.levels.map(level => level.status === "authored"
      ? { ...level, implementation: { ...level.implementation, starter: "print('hi')\n" } }
      : level) }
    expect(() => SystemsProjectSchema.parse(broken)).not.toThrow() // starter is free-form; entryPoint/API is the contract
  })

  it("rejects a model-kind level without a baseline and metric", () => {
    const level = authored.levels[0]!
    if (level.status !== "authored") return
    const modelLevel = { ...level, kind: "model" }
    expect(() => AuthoredLevelSchema.parse(modelLevel)).toThrow()
    expect(() => AuthoredLevelSchema.parse({ ...modelLevel, evaluation: { baseline: "majority", metrics: ["recall"] } })).not.toThrow()
  })

  it("rejects a service-kind level without validation and failure behavior", () => {
    const level = authored.levels[0]!
    if (level.status !== "authored") return
    const serviceLevel = { ...level, kind: "service" }
    expect(() => AuthoredLevelSchema.parse(serviceLevel)).toThrow()
    expect(() => AuthoredLevelSchema.parse({ ...serviceLevel, service: { validation: "typed request", failureBehavior: "structured errors" } })).not.toThrow()
  })

  it("rejects an L2 dependency no earlier level produces", () => {
    const levels = authored.levels.map(level => level.status === "authored" && level.number === 2
      ? { ...level, dependencies: ["does-not-exist"] }
      : level)
    expect(() => SystemsProjectSchema.parse({ ...authored, levels })).toThrow()
  })
})
