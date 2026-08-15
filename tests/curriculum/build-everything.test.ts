import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import {
  BuildEverythingProjectSchema,
  type BuildEverythingTier,
} from "../../src/curriculum/schema/build-everything"
import {
  buildEverythingFeaturedPath,
  buildEverythingProjects,
  buildEverythingTiers,
} from "../../src/curriculum/topics/ai-ml/build-everything"

describe("Build Everything curriculum lane", () => {
  it("maps the 37 source projects plus production and modern extensions in order", () => {
    expect(buildEverythingProjects).toHaveLength(63)
    expect(buildEverythingProjects.map(project => project.order)).toEqual(
      Array.from({ length: 63 }, (_, index) => index + 1),
    )
    expect(new Set(buildEverythingProjects.map(project => project.code)).size).toBe(63)
  })

  it("preserves the four source tiers and the extension tier", () => {
    const counts = new Map<BuildEverythingTier, number>()
    for (const project of buildEverythingProjects) counts.set(project.tier, (counts.get(project.tier) ?? 0) + 1)
    expect(counts).toEqual(new Map<BuildEverythingTier, number>([
      ["atomic", 19],
      ["combination", 8],
      ["system", 7],
      ["frontier", 3],
      ["extension", 12],
      ["modern", 14],
    ]))
    expect(buildEverythingTiers.map(tier => tier.id)).toEqual(["atomic", "combination", "system", "frontier", "extension", "modern"])
  })

  it("gives every project five explicit build moves", () => {
    for (const project of buildEverythingProjects) {
      expect(() => BuildEverythingProjectSchema.parse(project), project.code).not.toThrow()
      expect(project.steps.map(step => step.number), project.code).toEqual([1, 2, 3, 4, 5])
      expect(project.steps.map(step => step.kind), project.code).toEqual(["derive", "build", "verify", "break", "ship"])
      expect(project.theory.length, project.code).toBeGreaterThan(20)
      expect(project.build.length, project.code).toBeGreaterThan(20)
      expect(project.artifact.length, project.code).toBeGreaterThan(10)
    }
  })

  it("keeps dependencies acyclic and points only backward", () => {
    const orderById = new Map(buildEverythingProjects.map(project => [project.id, project.order]))
    for (const project of buildEverythingProjects) {
      for (const dependency of project.dependencies) {
        expect(orderById.has(dependency), `${project.code} dependency ${dependency}`).toBe(true)
        expect(orderById.get(dependency)!, `${project.code} dependency order`).toBeLessThan(project.order)
      }
    }
  })

  it("keeps the book's featured foundation arc intact", () => {
    expect(buildEverythingFeaturedPath).toEqual(["A1", "A4", "C1", "M2"])
  })

  it("marks authored extensions separately from PDF source projects", () => {
    expect(buildEverythingProjects.slice(0, 37).every(project => project.sourcePage > 0)).toBe(true)
    expect(buildEverythingProjects.slice(37, 49).every(project => project.tier === "extension" && project.sourcePage === 0)).toBe(true)
    expect(buildEverythingProjects.slice(37, 49).map(project => project.code)).toEqual(["X1", "X2", "X3", "X4", "X5", "X6", "X7", "X8", "X9", "X10", "X11", "X12"])
  })

  it("marks modern engineering labs as the final authored tier", () => {
    expect(buildEverythingProjects.slice(49).every(project => project.tier === "modern" && project.sourcePage === 0)).toBe(true)
    expect(buildEverythingProjects.slice(49).map(project => project.code)).toEqual(["Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13", "Y14"])
  })

  it("only labels a project executable when its full coding contract exists", () => {
    const executable = buildEverythingProjects.filter(project => project.implementation)
    expect(executable).toHaveLength(63)
    expect(executable.map(project => project.code)).toEqual(buildEverythingProjects.map(project => project.code))
    for (const project of executable) {
      expect(project.implementation!.visibleTests.length, project.code).toBeGreaterThanOrEqual(2)
      expect(project.implementation!.hiddenTests.length, project.code).toBeGreaterThanOrEqual(2)
      expect(project.implementation!.starter.length, project.code).toBeGreaterThan(20)
      expect(project.implementation!.solution.length, project.code).toBeGreaterThan(20)
    }
  })

  it("executes every visible and hidden contract against its reference solution", () => {
    const cases = buildEverythingProjects.flatMap(project => {
      const implementation = project.implementation!
      return [...implementation.visibleTests, ...implementation.hiddenTests].map(test => ({
        project: project.code,
        code: implementation.solution,
        call: test.call,
        expect: test.expect,
      }))
    })
    const runner = `
import json, sys
cases = json.loads(sys.stdin.read())
failures = []
for case in cases:
    namespace = {}
    try:
        exec(case["code"], namespace)
        got = eval(case["call"], namespace)
        expected = case["expect"]
        if got != expected:
            failures.append({"project": case["project"], "call": case["call"], "got": got, "expected": expected})
    except Exception as error:
        failures.append({"project": case["project"], "call": case["call"], "error": f"{type(error).__name__}: {error}"})
print(json.dumps(failures))
sys.exit(1 if failures else 0)
`
    let output = "[]"
    try {
      output = execFileSync("python3", ["-c", runner], { input: JSON.stringify(cases), encoding: "utf8" }).trim()
    } catch (error) {
      const failure = error as { stdout?: string }
      output = failure.stdout?.trim() || String(error)
    }
    expect(JSON.parse(output), "reference solutions must satisfy every contract").toEqual([])
  })
})
