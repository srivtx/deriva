// Executable levels for Systems Projects 2–15.
//
// The source-mapped Build Everything lane already contains deterministic,
// dependency-free Python contracts. This adapter turns those contracts into
// the five-level systems workbench shape: every card gets a real editor,
// visible/hidden tests, a hint ladder, an artifact handoff, and a trace fixture.
// Keeping the adapter data-only means curriculum validation still happens at
// module load and the workbench continues to use the single Pyodide runner.

import type { AuthoredLevel, SystemsProjectLevel } from "../../../schema/project"
import { buildEverythingProjectByCode } from "../build-everything"
import type { BuildEverythingImplementation } from "../../../schema/build-everything"
import type { ProjectTraceFixture } from "./project-01-fixtures"

export const systemProjectFixtures: Record<string, ProjectTraceFixture> = {}

const CODES: Record<string, string[]> = {
  "metrics-lab": ["X3", "X3", "X12", "X5", "X3"],
  "classifier-lab": ["A3", "B2", "D2", "A1", "A4"],
  "experiment-lab": ["X2", "X2", "X12", "X7", "X6"],
  "data-pipeline": ["X1", "X4", "X5", "F1", "X5"],
  "inference-api": ["Y5", "F3", "S1", "Y13", "Y14"],
  "async-ingestion": ["Y4", "Y4", "Y6", "Y4", "Y14"],
  "lexical-search": ["F1", "F2", "C1", "X5", "X8"],
  "vector-search": ["E3", "E3", "F2", "X4", "X8"],
  "hybrid-ranker": ["F2", "X3", "X8", "X12", "X6"],
  "grounded-answer": ["M6", "X8", "Y5", "X9", "S3"],
  "tensor-autograd": ["M1", "A2", "M1", "B1", "A4"],
  "mini-transformer": ["C1", "C3", "C2", "C4", "M2"],
  "production-platform": ["X6", "X6", "Y4", "X7", "Y12"],
  "knowledge-system": ["F1", "A4", "S3", "Y4", "CAP3"],
}

function kindFor(projectId: string, number: number): AuthoredLevel["kind"] {
  if (projectId === "metrics-lab" || projectId === "experiment-lab") return "evaluation"
  if (projectId === "classifier-lab" || projectId === "mini-transformer") return number >= 3 ? "model" : "core"
  if (projectId === "data-pipeline" || projectId === "lexical-search") return "data"
  if (projectId === "vector-search" || projectId === "hybrid-ranker") return "retrieval"
  if (projectId === "grounded-answer") return number === 5 ? "service" : "retrieval"
  if (projectId === "inference-api" || projectId === "async-ingestion") return "service"
  if (projectId === "production-platform") return number === 5 ? "service" : "ops"
  if (projectId === "tensor-autograd") return "deep"
  if (projectId === "knowledge-system") return number === 5 ? "capstone" : number >= 3 ? "service" : "core"
  return "core"
}

function invocationFor(entryPoint: string, call: string): string | null {
  const start = call.indexOf(`${entryPoint}(`)
  if (start < 0) return null
  const open = start + entryPoint.length
  let depth = 0
  let quote: string | null = null
  let escaped = false
  for (let index = open; index < call.length; index += 1) {
    const character = call[index]!
    if (quote) {
      if (escaped) escaped = false
      else if (character === "\\") escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (character === "'" || character === '"') {
      quote = character
      continue
    }
    if (character === "(") depth += 1
    if (character === ")") {
      depth -= 1
      if (depth === 0) return call.slice(start, index + 1)
    }
  }
  return null
}

function fixtureFor(levelId: string, implementation: BuildEverythingImplementation): string {
  const direct = implementation.visibleTests.find(test => invocationFor(implementation.entryPoint, test.call))
  const invocation = direct ? invocationFor(implementation.entryPoint, direct.call) : null
  const fixtureId = `systems-${levelId}`
  if (invocation) {
    systemProjectFixtures[fixtureId] = {
      fixtureId,
      payload: null,
      wrapper: `def __deriva_trace_entry(payload):\n    return ${invocation}\n`,
    }
  }
  return fixtureId
}

function authoredLevel(
  project: { id: string; number: number; title: string; userStory: string },
  level: { id: string; number: number; title: string; durationMinutes: number },
  code: string,
  previousOutput?: string,
): AuthoredLevel {
  const source = buildEverythingProjectByCode.get(code)
  if (!source?.implementation) throw new Error(`Missing Build Everything implementation for ${code}`)
  const implementation = source.implementation
  const fixtureId = fixtureFor(level.id, implementation)
  const kind = kindFor(project.id, level.number)
  const output = `${project.id}:${level.id}:artifact`
  const authored: AuthoredLevel = {
    status: "authored",
    id: level.id,
    number: level.number,
    title: level.title,
    durationMinutes: level.durationMinutes,
    thinkingMove: ["define the contract", "preserve an invariant", "measure behavior", "bound a failure", "make an operational decision"][level.number - 1]!,
    purpose: `${project.userStory} This level turns “${level.title}” into a small, testable mechanism that can be handed to the next level.`,
    dependencies: previousOutput ? [previousOutput] : [],
    relatedQuestionIds: [`AI-${project.number}-${level.number}`],
    relatedLessonIds: [`ai-ml/systems/${project.id}/${level.id}`],
    kind,
    spec: {
      brief: `${implementation.problemStatement} In the ${project.title} system, implement this level as a deterministic contract before composing it with the next service.`,
      requiredApi: implementation.requiredApi,
      behavior: implementation.behavior,
      constraints: implementation.constraints,
      examples: implementation.examples,
    },
    designQuestion: implementation.designQuestion,
    implementation: {
      entryPoint: implementation.entryPoint,
      starter: implementation.starter,
      visibleTests: implementation.visibleTests,
      hiddenTestCases: implementation.hiddenTests,
      hints: implementation.hints,
      solution: implementation.solution,
    },
    fixtureId,
    trace: { fixtureId, budget: 300 },
    artifact: {
      title: `${project.title} · ${level.title} handoff`,
      fields: [
        { name: "invariant", label: "Invariant preserved", required: true },
        { name: "failure_signal", label: "Failure signal observed", required: true },
        { name: "handoff", label: "What the next level can trust", required: true },
      ],
      reflectionQuestion: `What evidence makes ${level.title} safe to compose into ${project.title}?`,
      outputs: [output],
    },
    failureDrill: {
      prompt: `Break one assumption in ${level.title}. What should fail loudly instead of producing a plausible-looking result?`,
      expectedObservation: `${level.title} exposes a stable test failure or structured error, so the next level can distinguish bad input from a valid empty result.`,
    },
    exitGate: implementation.exitGate,
    ...(kind === "model" || kind === "retrieval"
      ? { evaluation: { baseline: "deterministic reference implementation", metrics: ["contract pass rate", "edge-case pass rate"] } }
      : {}),
    ...(kind === "service"
      ? { service: { validation: "typed inputs and bounded outputs", failureBehavior: "structured error with no partial side effect" } }
      : {}),
  }
  return authored
}

export function authoredLevelsForProject(
  project: { id: string; number: number; title: string; userStory: string },
  levels: { id: string; number: number; title: string; durationMinutes: number }[],
): AuthoredLevel[] {
  const codes = CODES[project.id]
  if (!codes || codes.length !== levels.length) throw new Error(`Missing systems-project code map for ${project.id}`)
  let previousOutput: string | undefined
  return levels.map((level, index) => {
    const authored = authoredLevel(project, level, codes[index]!, previousOutput)
    previousOutput = authored.artifact.outputs[0]
    return authored
  })
}

export function isAuthoredLevel(level: SystemsProjectLevel): level is AuthoredLevel {
  return level.status === "authored"
}
