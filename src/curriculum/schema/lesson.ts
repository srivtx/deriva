// Curriculum schema — the constitutional law (03, 05 §3)
// Every lesson is validated against this at build time via defineLesson().
// Mechanically checkable rules: A1 (move ≤8 words), B1 (9 stages complete),
// B3 (≥3 question-hints before assertion), C2 (pattern attached),
// A3 (naive/optimized contrast: applies or documented exception).

import { z } from "zod"

// ── Branded IDs ──
export const LessonId = z.string().brand("LessonId")
export const TopicId = z.enum([
  "trees", "linked-lists", "bst", "trie", "heap", "advanced-trees",
  "backtracking", "graphs", "dp", "greedy", "intervals",
  "advanced-graphs", "bit-manipulation", "math"
])
export const PatternId = z.string().brand("PatternId")

// ── Spine beats ──
export const SpineBeat = z.enum([
  "reflex", "mechanic", "payload", "leap", "naive", "optimization", "mastery"
])

// ── The nine stages, in constitutional order (03 B1) ──
export const StageNames = [
  "understand", "play", "reason", "discover", "design",
  "implement", "execute", "reflect", "generalize"
] as const
export const StageNameEnum = z.enum(StageNames)
export type LessonStageName = z.infer<typeof StageNameEnum>

// A1: one thinking-move per stage, nameable in ≤8 words (≈ ≤50 chars)
const ThinkingMove = z.string().min(3).max(50)

// ── Prose blocks (typed data, not MDX, until the pipeline needs MDX) ──
export const ProseBlockSchema = z.object({
  heading: z.string().optional(),
  body: z.string(),
})
export type ProseBlock = z.infer<typeof ProseBlockSchema>

// ── Mastery probe ("test me out" escape route, 03 B1) ──
export const ProbeSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(2),
  correct: z.string(),
  explanation: z.string(), // shown after pass — skipping must still teach
})
export type Probe = z.infer<typeof ProbeSchema>

// ── Stage 1: Understand ──
export const PredictionSchema = z.object({
  prompt: z.string(),
  kind: z.enum(["numeric", "choice"]),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  correct: z.string(),
  explanation: z.string(),
})

export const InteractiveExampleSchema = z.object({
  id: z.string(),
  given: z.string(),   // e.g. "sum_to(5)"
  result: z.string(),  // e.g. "15"
})

export const UnderstandStageSchema = z.object({
  prose: z.array(ProseBlockSchema).min(1),
  examples: z.array(InteractiveExampleSchema).min(1),
  prediction: PredictionSchema,
})

// ── Stage 2: Play ──
export const SandboxConfigSchema = z.object({
  type: z.enum(["peel-strip", "tree", "linked-list", "array", "heap", "grid", "graph"]),
  initial: z.unknown(),
  prompt: z.string(),
})

export const PlayStageSchema = z.object({
  sandbox: SandboxConfigSchema,
  experiments: z.array(z.object({
    id: z.string(),
    prompt: z.string(),
    reveal: z.string(), // crisp restatement AFTER the student felt it (B2)
  })).min(1),
})

// ── Stage 3: Reason (Socratic ladder — questions only, never asserts) ──
export const SocraticNodeSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(2),
  correct: z.string(),
  feedback: z.object({
    correct: z.string(), // names what the student just did
    wrong: z.string(),   // a pump: re-asks, never tells (B3)
  }),
})
export type SocraticNode = z.infer<typeof SocraticNodeSchema>

export const ReasonStageSchema = z.object({
  socraticLadder: z.array(SocraticNodeSchema).min(2),
})

// ── Stage 4: Discover (constrained answer builder, B5/B6) ──
export const ArtifactSlotSchema = z.object({
  name: z.string(),
  label: z.string(),   // the sentence frame with a blank, e.g. "sum_to(n) = n + ___"
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(2),
  correct: z.string(),
})

export const DiscoverStageSchema = z.object({
  artifact: z.object({
    type: z.literal("contract-builder"),
    prompt: z.string(),
    slots: z.array(ArtifactSlotSchema).min(1),
    crystallized: z.string(), // the platform's crisp restatement once built (B2 order)
  }),
})

// ── Stage 5: Design (the gate to code — 12 §Gates) ──
const ChoiceField = z.object({
  prompt: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(2),
  correct: z.string(),
  wrongFeedback: z.string(), // Socratic: points at the flaw, never the answer
})

export const DesignContractSchema = z.object({
  signature: z.object({
    prompt: z.string(),
    defaultName: z.string(),
    defaultParam: z.string(),
  }),
  baseCase: ChoiceField,
  recursiveStep: ChoiceField,
  complexity: ChoiceField.extend({ derivation: z.string() }), // B4: derived, then stated
})

export const DesignStageSchema = z.object({
  contract: DesignContractSchema,
})

// ── Stage 6: Implement ──
export const HintSchema = z.object({
  level: z.number().min(1).max(4),
  type: z.enum(["question", "assertion"]),
  text: z.string(),
})

export const TestCaseSchema = z.object({
  call: z.string(),   // e.g. "sum_to(5)"
  expect: z.unknown(),
})

export const ImplementStageSchema = z.object({
  entryPoint: z.string(),   // student function name, used by the tracer
  starter: z.string(),
  tests: z.array(TestCaseSchema).min(2),
  hints: z.array(HintSchema).min(4),
  solution: z.string(),
})

// ── Stage 7: Execute ──
export const ExecuteStageSchema = z.object({
  traceInput: z.record(z.string(), z.unknown()), // e.g. { n: 6 }
  budget: z.number().default(5000),
  vizPanels: z.array(z.enum(["call-stack"])).min(1),
})

// ── Stage 8: Reflect ──
export const ReflectStageSchema = z.object({
  prompts: z.array(z.string()).min(2),
  pattern: z.object({
    id: PatternId,
    name: z.string(),         // C2: curriculum-global name
    definition: z.string(),   // platform's crisp statement (after student's own words)
  }),
})

// ── Stage 9: Generalize ──
export const GeneralizeStageSchema = z.object({
  related: z.array(z.object({
    title: z.string(),
    why: z.string(),   // the same pattern under alien surface features (C4)
    href: z.string(),
  })).min(2),
  revisitInDays: z.array(z.number()).optional(),
})

// ── Full Lesson Module ──
export const LessonModuleSchema = z.object({
  id: LessonId,
  routeSlug: z.string(),      // URL segment: /learn/[topic]/[routeSlug]
  title: z.string(),
  topic: TopicId,
  beat: SpineBeat,
  thinkingMove: ThinkingMove, // the lesson's single move — A1
  purpose: z.string(),        // the one educational purpose — A5
  dependencies: z.array(LessonId).default([]),

  // One thinking-move per stage, each named in ≤8 words (12 §Acceptance)
  stageMoves: z.record(StageNameEnum, ThinkingMove),

  // A3: naive/optimized contrast applies, or the exception is documented
  naiveOptimizedContrast: z.union([
    z.object({ status: z.literal("applies") }),
    z.object({ status: z.literal("exception"), reason: z.string().min(20) }),
  ]),

  // Mastery probes for every stage before Implement (B1 escape route)
  probes: z.partialRecord(StageNameEnum, ProbeSchema),

  stages: z.object({
    understand: UnderstandStageSchema,
    play: PlayStageSchema,
    reason: ReasonStageSchema,
    discover: DiscoverStageSchema,
    design: DesignStageSchema,
    implement: ImplementStageSchema,
    execute: ExecuteStageSchema,
    reflect: ReflectStageSchema,
    generalize: GeneralizeStageSchema,
  }),
})
  // B3: at least three question-levels before any assertion
  .refine((l) => {
    const hints = [...l.stages.implement.hints].sort((a, b) => a.level - b.level)
    const firstAssertion = hints.findIndex(h => h.type === "assertion")
    const questionsBefore = hints.slice(0, firstAssertion === -1 ? hints.length : firstAssertion)
      .filter(h => h.type === "question").length
    return questionsBefore >= 3
  }, { message: "Rule B3: hint ladder needs ≥3 question-levels before any assertion" })
  // Probes must exist for every stage up to and including Design
  .refine((l) => {
    return (["understand", "play", "reason", "discover", "design"] as const)
      .every(s => l.probes[s] !== undefined)
  }, { message: "Rule B1: mastery probes required for stages 1–5 (escape route)" })

export type LessonModule = z.infer<typeof LessonModuleSchema>

// ── defineLesson: parse at module scope → curriculum errors are build errors ──
export function defineLesson(input: unknown): LessonModule {
  return LessonModuleSchema.parse(input)
}
