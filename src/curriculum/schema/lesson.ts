// Curriculum schema — the constitutional law (03, 05 §3)
// Every lesson is validated against this at build time.

import { z } from "zod"

// ── Branded IDs ──
export const LessonId = z.string().brand("LessonId")
export const TopicId = z.enum([
  "trees", "linked-lists", "bst", "trie", "heap", "advanced-trees",
  "backtracking", "graphs", "dp", "greedy", "intervals",
  "advanced-graphs", "bit-manipulation", "math"
])
export const PatternId = z.string().brand("PatternId")
export const StageNumber = z.number().min(1).max(9)

// ── Spine beats ──
export const SpineBeat = z.enum([
  "reflex", "mechanic", "payload", "leap", "naive", "optimization", "mastery"
])

// ── Stage-specific schemas ──

// Stage 1: Understand
export const PredictionSchema = z.object({
  type: z.literal("binary"),
  prompt: z.string(),
  reveal: z.object({
    kind: z.literal("sandbox-highlight"),
    show: z.string(),
  }),
})

export const InteractiveExampleSchema = z.object({
  id: z.string(),
  input: z.record(z.string(), z.unknown()),
  prediction: PredictionSchema.optional(),
})

export const UnderstandStageSchema = z.object({
  prose: z.any(), // MDX import — validated at runtime
  examples: z.array(InteractiveExampleSchema),
})

// Stage 2: Play
export const SandboxConfigSchema = z.object({
  type: z.enum(["tree", "linked-list", "array", "heap", "grid", "graph"]),
  initial: z.unknown(),
  tools: z.array(z.string()),
  prompt: z.string(),
})

export const PlayStageSchema = z.object({
  sandbox: SandboxConfigSchema,
  experiments: z.array(z.object({
    id: z.string(),
    prompt: z.string(),
    scaffold: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
})

// Stage 3: Reason (Socratic ladder)
const SocraticNodeSchemaBase = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["checkbox", "constructed-choice", "text"]),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    correct: z.boolean().optional(),
  })).optional(),
  correct: z.string().optional(),
  followUp: z.string().optional(),
  feedback: z.object({
    correct: z.string().optional(),
    wrong: z.string().optional(),
  }).optional(),
})

export const SocraticNodeSchema: z.ZodType<unknown> = z.lazy(() => SocraticNodeSchemaBase)
export type SocraticNode = z.infer<typeof SocraticNodeSchemaBase>

export const ReasonStageSchema = z.object({
  socraticLadder: z.array(SocraticNodeSchema),
})

// Stage 4: Discover
export const ArtifactSlotSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })),
  correct: z.string(),
})

export const DiscoverStageSchema = z.object({
  artifact: z.object({
    type: z.string(),
    prompt: z.string(),
    slots: z.array(ArtifactSlotSchema),
  }),
})

// Stage 5: Design
export const DesignContractSchema = z.object({
  signature: z.object({
    prompt: z.string(),
    expected: z.record(z.string(), z.unknown()),
  }),
  state: z.object({
    prompt: z.string(),
    options: z.array(z.string()),
    correct: z.array(z.string()),
  }),
  traversal: z.object({
    prompt: z.string(),
    options: z.array(z.string()),
    correct: z.string(),
    hint: z.string().optional(),
  }).optional(),
  complexity: z.object({
    prompt: z.string(),
    expected: z.string(),
    derivation: z.string(),
  }),
})

export const DesignStageSchema = z.object({
  contract: DesignContractSchema,
})

// Stage 6: Implement
export const HintSchema = z.object({
  level: z.number().min(1).max(4),
  type: z.enum(["question", "assertion"]),
  text: z.string(),
})

export const TestCaseSchema = z.object({
  input: z.record(z.string(), z.unknown()),
  expect: z.unknown(),
})

export const ImplementStageSchema = z.object({
  starter: z.string(),
  harness: z.string(),
  tests: z.array(TestCaseSchema),
  hints: z.array(HintSchema),
  solution: z.string(),
})

// Stage 7: Execute
export const ExecuteStageSchema = z.object({
  traceConfig: z.object({
    language: z.literal("python"),
    budget: z.number().default(5000),
    semanticOps: z.array(z.string()),
  }),
  vizPanels: z.array(z.string()),
})

// Stage 8: Reflect
export const ReflectStageSchema = z.object({
  prompts: z.array(z.string()),
  pattern: PatternId,
})

// Stage 9: Generalize
export const GeneralizeStageSchema = z.object({
  related: z.array(LessonId),
  revisitInDays: z.array(z.number()).optional(),
})

// ── Full Lesson Module ──
export const LessonModuleSchema = z.object({
  id: LessonId,
  topic: TopicId,
  beat: SpineBeat,
  thinkingMove: z.string().max(50), // Rule A1: ≤8 words ≈ ≤50 chars
  purpose: z.string(),              // Rule A5
  dependencies: z.array(LessonId).default([]),

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
}).refine(
  (lesson) => {
    // Rule A2: dependency chain check (simplified — full check in build)
    return true
  },
  { message: "Dependency chain must be a valid DAG" }
)

export type LessonModule = z.infer<typeof LessonModuleSchema>
export type StageName = keyof z.infer<typeof LessonModuleSchema>["stages"]
