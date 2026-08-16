// Systems Atelier fold tests (system-ai/systems-atelier-plan.md §Observation).
// Pure reducers over hand-built event logs: metrics math, nesting, gate
// evaluation, and determinism — no browser, no worker.

import { describe, it, expect } from "vitest"
import type { TraceEvent } from "../../src/execution/trace/types"
import { evaluateSystemGates, foldSimulation, type SimulationMetrics } from "../../src/viz/replay/folds"

function structure(ops: unknown[]): TraceEvent[] {
  return ops.map(op => ({ t: "structure", op }) as unknown as TraceEvent)
}

function runOf(op: unknown, at: number, component: string, requestId: string) {
  return { kind: op, at, component, requestId }
}

describe("foldSimulation", () => {
  it("computes percentiles, error rate, and hops from a hand-built log", () => {
    const events = structure([
      // two requests; r-1 fast, r-2 slow with an upstream hop
      { kind: "load.arrival", at: 0, requestId: "r-001" },
      { kind: "request.start", at: 0, component: "inference", requestId: "r-001" },
      { kind: "request.end", at: 0, status: 200, latencyMs: 10, requestId: "r-001" },
      { kind: "load.arrival", at: 100, requestId: "r-002" },
      { kind: "request.start", at: 100, component: "inference", requestId: "r-002" },
      { kind: "request.start", at: 100, component: "features", requestId: "r-002" },
      { kind: "request.end", at: 100, status: 200, latencyMs: 80, requestId: "r-002" },
      { kind: "request.end", at: 100, status: 200, latencyMs: 90, requestId: "r-002" },
    ])

    const fold = foldSimulation(events, events.length)
    expect(fold.requests).toHaveLength(2)
    expect(fold.metrics.latencyMs.p50).toBe(10) // nearest-rank estimator over [10, 90]
    expect(fold.metrics.latencyMs.max).toBe(90)
    expect(fold.metrics.errorRate).toBe(0)

    const second = fold.requests.find(request => request.requestId === "r-002")!
    expect(second.hops).toHaveLength(2) // root + upstream hop, nested
    expect(second.hops[1]!.component).toBe("features")
    expect(second.hops[1]!.depth).toBe(1)

    const inference = fold.metrics.components["inference"]!
    expect(inference.requests).toBe(2)
    const features = fold.metrics.components["features"]!
    expect(features.latencyMs.p50).toBe(80)
  })

  it("keeps API boundary events distinct from transport spans", () => {
    const events = structure([
      { kind: "load.arrival", at: 0, requestId: "r-001" },
      { kind: "request.start", at: 0, requestId: "r-001", spanId: "r-001:root", component: "inference", parentId: null },
      { kind: "request.start", at: 5, requestId: "r-001", spanId: "r-001:call-1", component: "features", parentId: "r-001:root" },
      { kind: "api.request", at: 5, requestId: "r-001", spanId: "r-001:call-1", target: "features", version: "v2" },
      { kind: "contract.reject", at: 5, requestId: "r-001", spanId: "r-001:call-1", target: "features", side: "request", reason: "expected version v3, got v2" },
      { kind: "api.response", at: 5, requestId: "r-001", spanId: "r-001:call-1", target: "features", version: "v3", status: 409 },
      { kind: "request.end", at: 5, requestId: "r-001", spanId: "r-001:call-1", status: 409, latencyMs: 0 },
      { kind: "request.end", at: 5, requestId: "r-001", spanId: "r-001:root", status: 502, latencyMs: 5 },
    ])
    const fold = foldSimulation(events, events.length)
    expect(fold.metrics.apiCalls).toBe(1)
    expect(fold.metrics.contractRejects).toBe(1)
    expect(fold.requests[0]!.hops.map(hop => hop.spanId)).toEqual(["r-001:root", "r-001:call-1"])
    expect(fold.requests[0]!.hops[1]!.parentId).toBe("r-001:root")
  })

  it("counts timeouts, failures, and attempts", () => {
    const events = structure([
      { kind: "load.arrival", at: 0, requestId: "r-001" },
      { kind: "request.start", at: 0, component: "a", requestId: "r-001" },
      { kind: "request.start", at: 0, component: "b", requestId: "r-001" },
      { kind: "request.end", at: 0, status: 504, latencyMs: 150, requestId: "r-001" },
      { kind: "retry.attempt", at: 150, requestId: "r-001", target: "b", attempt: 2 },
      { kind: "request.end", at: 0, status: 504, latencyMs: 151, requestId: "r-001" },
      { kind: "load.arrival", at: 500, requestId: "r-002" },
      { kind: "request.start", at: 500, component: "a", requestId: "r-002" },
      { kind: "request.end", at: 500, status: 200, latencyMs: 5, requestId: "r-002" },
      { kind: "cache.hit", at: 500, key: "k" },
      { kind: "cache.miss", at: 501, key: "k2" },
    ])

    const fold = foldSimulation(events, events.length)
    expect(fold.metrics.timeoutCount).toBe(1)
    expect(fold.metrics.maxAttemptsPerRequest).toBe(2)
    expect(fold.metrics.cache.hitRatio).toBe(0.5)
    expect(fold.metrics.components["b"]!.retries).toBe(1)
    expect(fold.metrics.errorRate).toBe(0.5)
  })

  it("tracks queue depth to its max", () => {
    const events = structure([
      { kind: "queue.enqueue", at: 0, queue: "orders", item: "a" },
      { kind: "queue.enqueue", at: 1, queue: "orders", item: "b" },
      { kind: "queue.enqueue", at: 2, queue: "orders", item: "c" },
      { kind: "queue.dequeue", at: 3, queue: "orders", item: "a" },
    ])
    const fold = foldSimulation(events, events.length)
    expect(fold.metrics.queueDepthMax).toBe(3)
    expect(fold.metrics.queueDepthByQueue["orders"]).toBe(3)
    expect(fold.series[0]!.queueDepth).toBe(3)
  })

  it("is a pure, deterministic function of (events, cursor)", () => {
    const events = structure([
      { kind: "load.arrival", at: 0, requestId: "r-001" },
      { kind: "request.start", at: 0, component: "a", requestId: "r-001" },
      { kind: "request.end", at: 0, status: 200, latencyMs: 7, requestId: "r-001" },
    ])
    const first = foldSimulation(events, events.length)
    const second = foldSimulation(events, events.length)
    expect(second).toEqual(first)
    // cursor-capped: nothing before the cursor is folded
    const partial = foldSimulation(events, 2)
    expect(partial.requests).toHaveLength(0)
  })

  it("marks failed and truncated runs ineligible for gates", () => {
    const failed = foldSimulation([], 0, { error: "syntax error" })
    const truncated = foldSimulation([], 0, { truncated: true })
    expect(failed.status).toBe("error")
    expect(failed.eligible).toBe(false)
    expect(truncated.status).toBe("truncated")
    expect(truncated.eligible).toBe(false)
    const results = evaluateSystemGates([
      { metric: "p99Ms", op: "<=", value: 100, name: "tail", invariant: "x".repeat(30) },
    ], failed.metrics, failed.eligible)
    expect(results[0]!.passed).toBe(false)
    expect(results[0]!.reason).toBe("run is not complete")
  })
})

describe("evaluateSystemGates", () => {
  const metrics: SimulationMetrics = {
    arrivals: 100,
    completed: 100,
    apiCalls: 100,
    contractRejects: 0,
    errorRate: 0.12,
    latencyMs: { p50: 80, p95: 300, p99: 700, max: 900 },
    cache: { hits: 60, misses: 40, hitRatio: 0.6 },
    maxAttemptsPerRequest: 4,
    timeoutCount: 22,
    queueDepthMax: 10,
    queueDepthByQueue: {},
    components: {},
  }

  it("passes and fails gates against real numbers", () => {
    const gates = [
      { metric: "p99Ms", op: "<=", value: 500, name: "tail", invariant: "x".repeat(30) },
      { metric: "cacheHitRatio", op: ">=", value: 0.6, name: "cache", invariant: "x".repeat(30) },
      { metric: "timeoutCount", op: "<=", value: 20, name: "timeouts", invariant: "x".repeat(30) },
    ]
    const results = evaluateSystemGates(gates, metrics)
    expect(results.map(result => result.passed)).toEqual([false, true, false])
    expect(results[0]!.actual).toBe(700)
    expect(results[1]!.actual).toBe(0.6)
  })

  it("never evaluates free-form prose — metrics only", () => {
    const results = evaluateSystemGates([], metrics)
    expect(results).toEqual([])
  })
})
