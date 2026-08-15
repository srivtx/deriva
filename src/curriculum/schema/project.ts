// Systems Projects contract (system-ai/ml-projects-plan.md).
// Curriculum-only zod data — never imports React, execution, or UI code.
// Build-time validation rejects incomplete or incoherent project levels.

import { z } from "zod"

// ── Level capabilities — drive required contract fields ──
export const LevelKind = z.enum([
  "core", "data", "evaluation", "model", "retrieval", "service", "ops", "deep", "capstone",
])

const ThinkingMove = z.string().min(3).max(80).refine(
  value => value.trim().split(/\s+/).length <= 8,
  { message: "Project rule: thinking moves must be eight words or fewer" },
)

const DesignQuestion = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(2),
  correct: z.string(),
  explanation: z.string(),
})

const ExitGate = DesignQuestion // completion requires a correct engineering answer, not a checkbox

const VisibleTest = z.object({
  name: z.string(),
  call: z.string(),      // e.g. "list(validate_row({'id': 'a', 'text': 'hi', 'label': 'bug'}))"
  expect: z.unknown(),
  invariant: z.string(), // why this test exists — shown with failures
})

const HiddenTest = VisibleTest

const Hint = z.object({
  level: z.number().min(1).max(4),
  type: z.enum(["question", "assertion"]),
  text: z.string(),
})

export const ArtifactField = z.object({
  name: z.string(),
  label: z.string(),
  required: z.boolean().default(true),
})

export const LevelArtifact = z.object({
  title: z.string(),
  fields: z.array(ArtifactField).min(1),
  reflectionQuestion: z.string(),
  outputs: z.array(z.string()), // artifact names produced by this level
})

export const EvaluationRequirement = z.object({
  baseline: z.string(),
  metrics: z.array(z.string()).min(1),
})

export const ServiceRequirement = z.object({
  validation: z.string(),
  failureBehavior: z.string(),
})

// ── A level is either planned (metadata only) or fully authored ──
export const PlannedLevelSchema = z.object({
  status: z.literal("planned"),
  id: z.string(),
  number: z.number().min(1).max(5),
  title: z.string(),
  durationMinutes: z.number().int().min(1),
  thinkingMove: ThinkingMove,
})

export const AuthoredLevelSchema = z.object({
  status: z.literal("authored"),
  id: z.string(),
  number: z.number().min(1).max(5),
  title: z.string(),
  durationMinutes: z.number().int().min(1),
  thinkingMove: ThinkingMove,
  purpose: z.string(),
  dependencies: z.array(z.string()).default([]),
  relatedQuestionIds: z.array(z.string()).default([]),
  relatedLessonIds: z.array(z.string()).default([]),
  kind: LevelKind,
  spec: z.object({
    brief: z.string(),
    requiredApi: z.string(),   // python code block
    behavior: z.array(z.string()).min(2),
    constraints: z.array(z.string()),
    examples: z.array(z.object({ id: z.string(), given: z.string(), result: z.string() })).min(1),
  }),
  designQuestion: DesignQuestion, // the pre-code gate: editor stays locked until this passes
  implementation: z.object({
    entryPoint: z.string(),
    starter: z.string(),
    visibleTests: z.array(VisibleTest).min(2),
    hiddenTestCases: z.array(HiddenTest).min(2),
    hints: z.array(Hint).min(4),
    solution: z.string(),
  }),
  fixtureId: z.string(),          // versioned fixture reference
  trace: z.object({
    fixtureId: z.string(),
    budget: z.number().int().min(100),
  }),
  artifact: LevelArtifact,
  failureDrill: z.object({
    prompt: z.string(),
    expectedObservation: z.string(),
  }),
  exitGate: ExitGate,
  evaluation: EvaluationRequirement.optional(), // required for model/retrieval kinds
  service: ServiceRequirement.optional(),       // required for service kinds
})
  // B3-style: three questions before any assertion in the hint ladder
  .refine(level => {
    const hints = [...level.implementation.hints].sort((a, b) => a.level - b.level)
    const firstAssertion = hints.findIndex(h => h.type === "assertion")
    const questionsBefore = hints
      .slice(0, firstAssertion === -1 ? hints.length : firstAssertion)
      .filter(h => h.type === "question").length
    return questionsBefore >= 3
  }, { message: "Project rule: hint ladder needs ≥3 question-levels before any assertion" })
  // model/retrieval levels need a baseline and metric
  .refine(level => (level.kind !== "model" && level.kind !== "retrieval") || level.evaluation !== undefined, {
    message: "Project rule: model/retrieval levels must declare a baseline and metrics",
  })
  // service levels need validation and failure behavior
  .refine(level => level.kind !== "service" || level.service !== undefined, {
    message: "Project rule: service levels must declare validation and failure behavior",
  })

export const SystemsProjectLevelSchema = z.discriminatedUnion("status", [
  PlannedLevelSchema,
  AuthoredLevelSchema,
])
export type SystemsProjectLevel = z.infer<typeof SystemsProjectLevelSchema>
export type AuthoredLevel = z.infer<typeof AuthoredLevelSchema>

export const SystemsProjectSchema = z.object({
  id: z.string(),          // "document-intelligence"
  number: z.number().int().min(1),
  family: z.string(),      // "Data systems"
  title: z.string(),
  pitch: z.string(),       // real-system pitch on the card
  userStory: z.string(),
  prerequisites: z.array(z.string()).default([]),
  artifactInputs: z.array(z.string()).default([]),   // artifacts loaded from earlier projects
  levels: z.array(SystemsProjectLevelSchema).length(5),
})
  // a project is either fully authored or fully planned — never mixed
  .refine(project => {
    const statuses = new Set(project.levels.map(level => level.status))
    return statuses.size === 1
  }, { message: "Project rule: a project is fully authored or fully planned, never mixed" })
  // L2–L5 dependencies must be artifacts produced by an earlier level of the project
  .refine(project => {
    if (project.levels[0]!.status !== "authored") return true
    const produced = new Set<string>()
    for (const level of project.levels) {
      if (level.status !== "authored") continue
      for (const dep of level.dependencies) {
        if (level.number > 1 && !produced.has(dep)) {
          return false // every dependency must be produced by an earlier level
        }
      }
      for (const out of level.artifact.outputs) produced.add(out)
    }
    return true
  }, { message: "Project rule: every level dependency must be produced by an earlier level" })

export type SystemsProject = z.infer<typeof SystemsProjectSchema>

export function defineProject(input: unknown): SystemsProject {
  return SystemsProjectSchema.parse(input)
}
