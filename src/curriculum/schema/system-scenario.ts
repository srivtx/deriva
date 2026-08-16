// Systems Atelier scenario contract (system-ai/systems-atelier-plan.md §Typed
// scenario model). Curriculum-only zod data — never imports React, execution,
// or UI code. Parse-all at module scope: an incomplete scenario fails the build.

import { z } from "zod"

export const ScenarioDesignGate = z.object({
  question: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).min(2),
  correct: z.string(),
  explanation: z.string(),
})

// Structured system gates — evaluated against the run's real metrics, never
// against prose. `metric` picks a derived number; `op` and `value` bound it.
export const SystemGate = z.object({
  metric: z.enum(["p50Ms", "p95Ms", "p99Ms", "errorRate", "cacheHitRatio", "maxAttemptsPerRequest", "timeoutCount", "circuitOpenCount", "admissionRejectCount"]),
  op: z.enum(["<=", ">="]),
  value: z.number(),
  name: z.string(),
  invariant: z.string(), // why this property matters — shown with gate failures
})

export const ComponentContract = z.object({
  id: z.string(),
  role: z.enum(["root", "upstream", "worker"]),
  exposes: z.string(), // api signature text the learner designs against
  api: z.object({
    version: z.string().min(1),
    requestFields: z.array(z.string()).min(1),
    responseFields: z.array(z.string()).min(1),
  }),
  latency: z.object({
    p50: z.number().min(1),
    p99: z.number().min(1).refine(value => value > 0, { message: "latency p99 must be positive" }),
  }).refine(spec => spec.p99 >= spec.p50, { message: "p99 must be ≥ p50" }),
  failureRate: z.number().min(0).max(1),
  failureWindow: z.object({
    from: z.number(),
    until: z.number(),
    rate: z.number().min(0).max(1),
  }).optional(),
})

export const ScenarioHandler = z.object({
  name: z.string(),
  signature: z.string(),
  purpose: z.string(),
})

export const ScenarioArtifact = z.object({
  title: z.string(),
  fields: z.array(z.object({ name: z.string(), label: z.string(), required: z.boolean().default(true) })).min(1),
  reflectionQuestion: z.string(),
})

export const SystemScenarioSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1),
  title: z.string(),
  thinkingMove: z.string().min(3).max(80).refine(
    value => value.trim().split(/\s+/).length <= 8,
    { message: "Scenario rule: thinking moves must be eight words or fewer" },
  ),
  pitch: z.string(),
  realSystem: z.string(),
  loadShape: z.object({
    seed: z.number().int(),
    baseRate: z.number().min(0.1),
    burst: z.object({ at: z.number(), until: z.number(), rate: z.number().min(0.1) }).optional(),
    simSeconds: z.number().min(5).max(300),
    maxRequests: z.number().int().min(20).max(2000).optional(),
  }),
  components: z.array(ComponentContract).min(2),
  designGates: z.array(ScenarioDesignGate).min(4),
  handlers: z.array(ScenarioHandler).min(2),
  naiveCode: z.string(), // the deliberately broken policy run — offered first (Rule A3)
  starter: z.string(),   // didactic skeleton for the fixed run
  contractDrillCode: z.string(), // deliberately break A↔B version/shape compatibility
  systemGates: z.array(SystemGate).min(2),
  artifact: ScenarioArtifact,
  relatedQuestionIds: z.array(z.string()).default([]),
  relatedLessonIds: z.array(z.string()).default([]),
})
  // every component is reachable from the root through a declared handler
  .refine(scenario => {
    const roots = scenario.components.filter(component => component.role === "root")
    return roots.length === 1
  }, { message: "Scenario rule: exactly one root component" })
  .refine(scenario => {
    const handlerNames = new Set(scenario.handlers.map(handler => handler.name))
    return scenario.components.every(component => handlerNames.has(component.id))
  }, { message: "Scenario rule: every component must have a learner handler named after it" })

export type SystemScenario = z.infer<typeof SystemScenarioSchema>

export function defineScenario(input: unknown): SystemScenario {
  return SystemScenarioSchema.parse(input)
}
