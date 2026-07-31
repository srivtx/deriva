// Golden-trace fold tests — the viz layer is pure: (trace, cursor) → model.
// No browser, no Pyodide. (05 §4.3, 06 boundary rule 2)

import { describe, it, expect } from "vitest"
import { foldCallStack } from "../../src/viz/replay/folds"
import type { TraceEvent } from "../../src/execution/trace/types"

// sum_to(3) traced: 3 calls down, 3 returns up
const goldenTrace: TraceEvent[] = [
  { t: "call", frame: "f1", fn: "sum_to", args: { n: { type: "int", value: 3 } }, depth: 0 },
  { t: "call", frame: "f2", fn: "sum_to", args: { n: { type: "int", value: 2 } }, depth: 1 },
  { t: "call", frame: "f3", fn: "sum_to", args: { n: { type: "int", value: 1 } }, depth: 2 },
  { t: "return", frame: "f3", value: { type: "int", value: 1 } },
  { t: "return", frame: "f2", value: { type: "int", value: 3 } },
  { t: "return", frame: "f1", value: { type: "int", value: 6 } },
]

describe("foldCallStack", () => {
  it("empty cursor → empty stack, zero counters", () => {
    const m = foldCallStack(goldenTrace, 0)
    expect(m.stack).toHaveLength(0)
    expect(m.calls).toBe(0)
    expect(m.returns).toBe(0)
  })

  it("mid-descent → stack grows with args in order", () => {
    const m = foldCallStack(goldenTrace, 2)
    expect(m.stack.map(f => f.arg)).toEqual([3, 2])
    expect(m.calls).toBe(2)
    expect(m.returns).toBe(0)
    expect(m.stack[1].status).toBe("active")
  })

  it("at the floor → three frames deep", () => {
    const m = foldCallStack(goldenTrace, 3)
    expect(m.stack).toHaveLength(3)
    expect(m.stack[2].arg).toBe(1)
  })

  it("after first return → frame popped, value captured in caption", () => {
    const m = foldCallStack(goldenTrace, 4)
    expect(m.stack).toHaveLength(2)
    expect(m.returns).toBe(1)
    expect(m.caption).toContain("returned 1")
  })

  it("full trace → empty stack, all counters settled, done caption", () => {
    const m = foldCallStack(goldenTrace, 6)
    expect(m.stack).toHaveLength(0)
    expect(m.calls).toBe(3)
    expect(m.returns).toBe(3)
    expect(m.caption).toContain("Done")
  })

  it("scrubbing is deterministic — same cursor, same model", () => {
    const a = foldCallStack(goldenTrace, 4)
    const b = foldCallStack(goldenTrace, 4)
    expect(a).toEqual(b)
  })
})
