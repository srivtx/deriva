// Systems Atelier contract tests (system-ai/systems-atelier-plan.md §Typed
// scenario model). Build-time rules: thinking moves ≤8 words, exactly one root,
// one handler per component, sane load shapes, structured gates.

import { describe, it, expect } from "vitest"
import { SystemScenarioSchema } from "../../src/curriculum/schema/system-scenario"
import { systemScenarios, toRuntimeSpec } from "../../src/curriculum/topics/ai-ml/systems"

describe("the scenario ladder", () => {
  it("registers the coupling pair (S1, S2)", () => {
    expect(systemScenarios.length).toBe(2)
    expect(systemScenarios.map(scenario => scenario.number)).toEqual([1, 2])
  })

  it("every scenario validates against the schema", () => {
    for (const scenario of systemScenarios) {
      expect(() => SystemScenarioSchema.parse(scenario)).not.toThrow()
    }
  })

  it("thinking moves stay at eight words or fewer", () => {
    for (const scenario of systemScenarios) {
      const words = scenario.thinkingMove.trim().split(/\s+/).length
      expect(words, `${scenario.id}: "${scenario.thinkingMove}"`).toBeLessThanOrEqual(8)
    }
  })

  it("every scenario has exactly one root component and one handler per component", () => {
    for (const scenario of systemScenarios) {
      const roots = scenario.components.filter(component => component.role === "root")
      expect(roots).toHaveLength(1)
      const handlerNames = new Set(scenario.handlers.map(handler => handler.name))
      for (const component of scenario.components) {
        expect(handlerNames.has(component.id), `${scenario.id}: handler for ${component.id}`).toBe(true)
      }
    }
  })

  it("latency p99 ≥ p50, failure rates bounded, gates structured", () => {
    for (const scenario of systemScenarios) {
      for (const component of scenario.components) {
        expect(component.latency.p99).toBeGreaterThanOrEqual(component.latency.p50)
        expect(component.api.version.length).toBeGreaterThan(0)
        expect(component.api.requestFields.length).toBeGreaterThan(0)
        expect(component.api.responseFields.length).toBeGreaterThan(0)
        expect(component.failureRate).toBeGreaterThanOrEqual(0)
        expect(component.failureRate).toBeLessThanOrEqual(1)
      }
      expect(scenario.systemGates.length).toBeGreaterThanOrEqual(2)
      expect(scenario.designGates.length).toBeGreaterThanOrEqual(4)
      for (const gate of scenario.systemGates) {
        expect(gate.invariant.length).toBeGreaterThan(20)
      }
    }
  })

  it("the naive run and the starter are executable Python shapes", () => {
    for (const scenario of systemScenarios) {
      expect(scenario.naiveCode).toContain("def ")
      expect(scenario.starter).toContain("def ")
      expect(scenario.contractDrillCode).toContain("api_version=\"v2\"")
      for (const handler of scenario.handlers) {
        expect(scenario.starter).toContain(`def ${handler.name}(`)
      }
    }
  })

  it("toRuntimeSpec maps the curriculum shape to the worker contract", () => {
    const spec = toRuntimeSpec(systemScenarios[1]!)
    expect(spec.seed).toBe(systemScenarios[1]!.loadShape.seed)
    expect(spec.rootComponent).toBe("inference")
    expect(spec.components.map(component => component.id)).toEqual(["inference", "features"])
    expect(spec.components.every(component => component.handler === component.id)).toBe(true)
    expect(spec.loadShape.baseRate).toBeGreaterThan(0)
  })
})
