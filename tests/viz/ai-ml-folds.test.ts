// AI/ML fold tests (docs/13 Step 4) — folds are pure: (trace, cursor) → model.
// Data folds reconstruct the dataset summary; request folds preserve
// start/end order and latency. No browser, no Pyodide.

import { describe, it, expect } from "vitest"
import { foldDataset, foldRequests } from "../../src/viz/replay/folds"
import type { TraceEvent } from "../../src/execution/trace/types"

const datasetTrace: TraceEvent[] = [
  { t: "structure", op: { kind: "data.accept", rowId: 0 } },
  { t: "structure", op: { kind: "data.reject", rowId: 1, reason: "missing-label" } },
  { t: "structure", op: { kind: "data.accept", rowId: 2 } },
  { t: "structure", op: { kind: "data.reject", rowId: 3, reason: "duplicate" } },
  { t: "call", frame: "f1", fn: "validate_dataset", args: {}, depth: 0 },
  { t: "structure", op: { kind: "data.reject", rowId: 4, reason: "reserved" } },
  { t: "return", frame: "f1", value: { type: "list", value: [] } },
]

describe("foldDataset", () => {
  it("is correct at every cursor", () => {
    const cursor0 = foldDataset(datasetTrace, 0)
    expect(cursor0.accepted).toEqual([])
    expect(cursor0.rejected).toEqual([])

    const cursor1 = foldDataset(datasetTrace, 1)
    expect(cursor1.accepted).toEqual([0])
    expect(cursor1.rejected).toEqual([])

    const cursor2 = foldDataset(datasetTrace, 2)
    expect(cursor2.accepted).toEqual([0])
    expect(cursor2.rejected).toEqual([{ rowId: 1, reason: "missing-label" }])

    const cursor4 = foldDataset(datasetTrace, 4)
    expect(cursor4.accepted).toEqual([0, 2])
    expect(cursor4.rejected).toEqual([
      { rowId: 1, reason: "missing-label" },
      { rowId: 3, reason: "duplicate" },
    ])
  })

  it("ignores non-semantic events and reconstructs the summary", () => {
    const full = foldDataset(datasetTrace, datasetTrace.length)
    expect(full.accepted).toEqual([0, 2])
    expect(full.byReason).toEqual({ "missing-label": 1, duplicate: 1, reserved: 1 })
    expect(full.caption).toContain("2 accepted, 3 rejected")
  })

  it("the last event drives the narration", () => {
    const full = foldDataset(datasetTrace, datasetTrace.length)
    expect(full.caption).toContain("row 4 rejected")
  })
})

const requestTrace: TraceEvent[] = [
  { t: "structure", op: { kind: "request.start", requestId: "req-1" } },
  { t: "structure", op: { kind: "request.start", requestId: "req-2" } },
  { t: "structure", op: { kind: "request.end", requestId: "req-2", status: 200, latencyMs: 12 } },
  { t: "structure", op: { kind: "request.end", requestId: "req-1", status: 500, latencyMs: 98 } },
]

describe("foldRequests", () => {
  it("preserves start order and latency through completion", () => {
    const mid = foldRequests(requestTrace, 3)
    expect(mid.map(r => r.requestId)).toEqual(["req-1", "req-2"])
    expect(mid[0]).toMatchObject({ started: true, ended: false })
    expect(mid[1]).toMatchObject({ started: true, ended: true, status: 200, latencyMs: 12 })

    const full = foldRequests(requestTrace, 4)
    expect(full[0]).toMatchObject({ ended: true, status: 500, latencyMs: 98 })
    expect(full[1]).toMatchObject({ ended: true, status: 200, latencyMs: 12 })
  })

  it("keeps an in-flight request open until its end event", () => {
    const early = foldRequests(requestTrace, 2)
    expect(early[0]).toMatchObject({ started: true, ended: false })
    expect(early[0].status).toBeUndefined()
    expect(early[0].latencyMs).toBeUndefined()
  })
})
