// Typed question contract (docs/13 §Product navigation and question bank).
// Every question must carry a fixture, rubric, hints, and a next question;
// incomplete questions fail the build, like lessons (C1).

import { z } from "zod"

export const AiQuestionKind = z.enum([
  "derivation", "prediction", "construction", "implementation",
  "debugging", "counterexample", "comparison", "operations",
  "communication", "transfer",
])
export type AiQuestionKindType = z.infer<typeof AiQuestionKind>

export const AiQuestionSchema = z.object({
  id: z.string(),                    // "MATH-001" … "OPS-001"
  track: z.string(),                 // family id: math | data | classical | experiments | deep | retrieval | rag | backend
  lessonId: z.string(),              // related lab (planned or authored)
  kind: AiQuestionKind,
  prompt: z.string(),
  contextFixture: z.unknown(),       // deterministic fixture — required
  // exactly one of these must be present
  expectedArtifact: z.string().optional(),
  expectedTraceObservation: z.string().optional(),
  rubric: z.array(z.string()).min(2),// scored checkpoints
  hints: z.array(z.string()).min(2), // question-first, like the lesson ladder
  pattern: z.string(),               // named pattern the question trains (C2)
  prerequisites: z.array(z.string()),// question ids or lab ids
  nextQuestionId: z.string(),        // "" on the final question of the chain
  reviewIntervals: z.array(z.number()).min(1).default([1, 7, 30]),
})
  .refine(q => q.expectedArtifact !== undefined || q.expectedTraceObservation !== undefined, {
    message: "Every question needs an expectedArtifact or an expectedTraceObservation",
  })
  .refine(q => q.rubric.length >= 2, {
    message: "A rubric needs at least two checkpoints to score against",
  })
  .refine(q => q.hints.length >= 2, {
    message: "A question without hints is incomplete",
  })

export type AiQuestion = z.infer<typeof AiQuestionSchema>

export function defineQuestion(input: unknown): AiQuestion {
  return AiQuestionSchema.parse(input)
}
