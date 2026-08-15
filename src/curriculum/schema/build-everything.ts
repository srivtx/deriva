// Build Everything curriculum contract.
// This is the source-mapped, first-principles AI/ML lane. It is intentionally
// separate from SystemsProject: the latter is the executable five-level system
// workbench, while this lane preserves the supplied 37-project progression and
// its project-by-project build brief until each workspace is authored.

import { z } from "zod"

export const BuildEverythingTierSchema = z.enum(["atomic", "combination", "system", "frontier", "extension", "modern"])
export type BuildEverythingTier = z.infer<typeof BuildEverythingTierSchema>

const BuildStepSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1).max(5),
  title: z.string(),
  kind: z.enum(["derive", "build", "verify", "break", "ship"]),
  prompt: z.string(),
  deliverable: z.string(),
})

const BuildQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(2),
  correct: z.string(),
  explanation: z.string(),
})

const BuildTestSchema = z.object({
  name: z.string(),
  call: z.string(),
  expect: z.unknown(),
  invariant: z.string(),
})

const BuildHintSchema = z.object({
  level: z.number().int().min(1).max(4),
  type: z.enum(["question", "assertion"]),
  text: z.string(),
})

const BuildArtifactSchema = z.object({
  title: z.string(),
  fields: z.array(z.object({ name: z.string(), label: z.string() })).min(1),
  reflectionQuestion: z.string(),
})

// An implementation is deliberately optional: the PDF has 37 mapped projects,
// but a project only becomes a real Deriva lab once its contract and tests are
// authored. This keeps the map honest while allowing a vertical slice to ship.
export const BuildEverythingImplementationSchema = z.object({
  entryPoint: z.string(),
  problemStatement: z.string(),
  requiredApi: z.string(),
  behavior: z.array(z.string()).min(2),
  constraints: z.array(z.string()),
  examples: z.array(z.object({ id: z.string(), given: z.string(), result: z.string() })).min(1),
  designQuestion: BuildQuestionSchema,
  starter: z.string(),
  visibleTests: z.array(BuildTestSchema).min(2),
  hiddenTests: z.array(BuildTestSchema).min(2),
  hints: z.array(BuildHintSchema).min(4),
  solution: z.string(),
  artifact: BuildArtifactSchema,
  exitGate: BuildQuestionSchema,
}).refine(value => {
  const hints = [...value.hints].sort((a, b) => a.level - b.level)
  const firstAssertion = hints.findIndex(h => h.type === "assertion")
  const questionsBefore = hints
    .slice(0, firstAssertion === -1 ? hints.length : firstAssertion)
    .filter(h => h.type === "question").length
  return questionsBefore >= 3
}, { message: "Build Everything rule: hint ladder needs ≥3 question-levels before any assertion" })

export const BuildEverythingProjectSchema = z.object({
  id: z.string(),
  code: z.string(),
  order: z.number().int().min(1).max(63),
  tier: BuildEverythingTierSchema,
  title: z.string(),
  lines: z.number().int().positive(),
  durationMinutes: z.number().int().positive(),
  coolFactor: z.string(),
  // Source-mapped projects carry their PDF page. Deriva extensions use 0.
  sourcePage: z.number().int().min(0),
  sourceReuse: z.string(),
  dependencies: z.array(z.string()),
  externalDependencies: z.array(z.string()).default([]),
  thinkingMove: z.string().min(3).max(80).refine(
    value => value.trim().split(/\s+/).length <= 8,
    { message: "Build Everything rule: thinking moves must be eight words or fewer" },
  ),
  theory: z.string(),
  build: z.string(),
  verify: z.string(),
  experiment: z.string(),
  artifact: z.string(),
  steps: z.array(BuildStepSchema).length(5),
  implementation: BuildEverythingImplementationSchema.optional(),
})

export type BuildEverythingProject = z.infer<typeof BuildEverythingProjectSchema>
export type BuildEverythingStep = z.infer<typeof BuildStepSchema>
export type BuildEverythingImplementation = z.infer<typeof BuildEverythingImplementationSchema>

export function defineBuildEverythingProject(input: unknown): BuildEverythingProject {
  return BuildEverythingProjectSchema.parse(input)
}
