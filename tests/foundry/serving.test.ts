// Foundry · Station 04 — the serving-floor simulator.
// Each mission's workload is tuned so exactly the intended lesson lands.

import { describe, expect, it } from "vitest"
import {
  DTYPE_MB_PER_TOKEN,
  WORKLOAD_BATCHING,
  WORKLOAD_CRISIS,
  WORKLOAD_FIT,
  WORKLOAD_PAGING,
  simulateServing,
} from "../../src/foundry/engine-serving"

const POOL_FIT = 512
const POOL_BATCHING = 2048
const POOL_PAGING = 160
const POOL_CRISIS = 512

describe("mission 1 — fit the cache (dtype trades memory for concurrency)", () => {
  it("fp16 KV does not fit: requests time out waiting for memory", () => {
    const result = simulateServing({ kvPoolMB: POOL_FIT, dtype: "fp16", slots: 8, paging: false, continuous: true }, WORKLOAD_FIT)
    expect(result.metrics.dropped).toBeGreaterThanOrEqual(1)
    expect(result.metrics.dropReasons.timeout ?? 0).toBeGreaterThanOrEqual(1)
  })

  it("q8 still leaves requests waiting on memory", () => {
    const result = simulateServing({ kvPoolMB: POOL_FIT, dtype: "q8", slots: 8, paging: false, continuous: true }, WORKLOAD_FIT)
    expect(result.metrics.dropped).toBeGreaterThanOrEqual(1)
  })

  it("q4 fits all eight concurrent streams: zero drops, instant first tokens", () => {
    const result = simulateServing({ kvPoolMB: POOL_FIT, dtype: "q4", slots: 8, paging: false, continuous: true }, WORKLOAD_FIT)
    expect(result.metrics.dropped).toBe(0)
    expect(result.metrics.served).toBe(WORKLOAD_FIT.arrivals.length)
    expect(result.metrics.p99TTFT).toBeLessThanOrEqual(10)
  })
})

describe("mission 2 — static vs continuous batching", () => {
  const base = { kvPoolMB: POOL_BATCHING, dtype: "q4" as const, slots: 6, paging: true }

  it("static batching makes every later request wait for the stragglers", () => {
    const result = simulateServing({ ...base, continuous: false }, WORKLOAD_BATCHING)
    expect(result.metrics.dropped).toBe(0)
    expect(result.metrics.p99TTFT).toBeGreaterThan(100)
  })

  it("continuous batching admits as slots free: tiny TTFT, same requests", () => {
    const result = simulateServing({ ...base, continuous: true }, WORKLOAD_BATCHING)
    expect(result.metrics.dropped).toBe(0)
    expect(result.metrics.served).toBe(WORKLOAD_BATCHING.arrivals.length)
    expect(result.metrics.p99TTFT).toBeLessThan(20)
  })

  it("the static p99 TTFT is an order of magnitude worse", () => {
    const a = simulateServing({ ...base, continuous: false }, WORKLOAD_BATCHING).metrics
    const b = simulateServing({ ...base, continuous: true }, WORKLOAD_BATCHING).metrics
    expect(a.p99TTFT).toBeGreaterThan(b.p99TTFT * 5)
  })
})

describe("mission 3 — contiguous vs paged KV allocation", () => {
  it("contiguous reservation wastes the reserved-but-undecoded window", () => {
    const result = simulateServing({ kvPoolMB: POOL_PAGING, dtype: "q4", slots: 4, paging: false, continuous: true }, WORKLOAD_PAGING)
    expect(result.metrics.kvWastePeakMB).toBeGreaterThan(DTYPE_MB_PER_TOKEN.q4 * 80)
  })

  it("paging allocates by the page: waste collapses to page granularity", () => {
    const contiguous = simulateServing({ kvPoolMB: POOL_PAGING, dtype: "q4", slots: 4, paging: false, continuous: true }, WORKLOAD_PAGING).metrics
    const paged = simulateServing({ kvPoolMB: POOL_PAGING, dtype: "q4", slots: 4, paging: true, continuous: true }, WORKLOAD_PAGING).metrics
    expect(paged.kvWastePeakMB).toBeLessThan(contiguous.kvWastePeakMB / 2)
    expect(paged.served).toBeGreaterThanOrEqual(contiguous.served)
  })
})

describe("mission 4 — the SLA crisis", () => {
  it("fp16 + static + contiguous fails the crisis hard", () => {
    const result = simulateServing({ kvPoolMB: POOL_CRISIS, dtype: "fp16", slots: 4, paging: false, continuous: false }, WORKLOAD_CRISIS)
    expect(result.metrics.dropped).toBeGreaterThan(0)
  })

  it("q4 + continuous + paging + wide slots holds the SLA", () => {
    const result = simulateServing({ kvPoolMB: POOL_CRISIS, dtype: "q4", slots: 8, paging: true, continuous: true }, WORKLOAD_CRISIS)
    expect(result.metrics.dropped).toBe(0)
    expect(result.metrics.served).toBe(WORKLOAD_CRISIS.arrivals.length)
    expect(result.metrics.p99TTFT).toBeLessThanOrEqual(200)
  })
})

describe("simulator invariants", () => {
  it("every outcome is either served or dropped, never both, never neither", () => {
    const result = simulateServing({ kvPoolMB: POOL_FIT, dtype: "q8", slots: 6, paging: true, continuous: true }, WORKLOAD_CRISIS)
    expect(result.outcomes.length).toBe(WORKLOAD_CRISIS.arrivals.length)
    for (const outcome of result.outcomes) {
      expect(outcome.dropped === null ? outcome.done !== null : outcome.done !== undefined).toBe(true)
    }
  })

  it("the KV pool is never over-allocated in any tick", () => {
    const result = simulateServing({ kvPoolMB: POOL_FIT, dtype: "q8", slots: 8, paging: true, continuous: true }, WORKLOAD_CRISIS)
    for (const snapshot of result.trace) expect(snapshot.kvAllocMB).toBeLessThanOrEqual(POOL_FIT + 1e-9)
  })

  it("is fully deterministic", () => {
    const run = () => simulateServing({ kvPoolMB: POOL_CRISIS, dtype: "q4", slots: 8, paging: true, continuous: true }, WORKLOAD_CRISIS)
    expect(run().metrics).toEqual(run().metrics)
  })
})
