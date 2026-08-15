// Replay folds — pure reducers: (events, cursor) → panel model (05 §4.3)
// No React, no execution — golden-trace testable in Vitest without a browser.

import type { TraceEvent } from "@/execution/trace/types"

export interface StackFrameModel {
  frame: string
  fn: string
  arg: number | null
  depth: number
  status: "active" | "settled"
  returnValue?: number | null
}

export interface CallStackModel {
  stack: StackFrameModel[]      // bottom → top (top = currently executing)
  calls: number
  returns: number
  caption: string               // narrated line — also the screen-reader track (09 §6)
}

function num(v: unknown): number | null {
  if (typeof v === "number") return v
  if (v && typeof v === "object" && "value" in (v as Record<string, unknown>)) {
    const inner = (v as { value: unknown }).value
    return typeof inner === "number" ? inner : null
  }
  return null
}

export function foldCallStack(events: TraceEvent[], cursor: number): CallStackModel {
  const stack: StackFrameModel[] = []
  const byFrame = new Map<string, StackFrameModel>()
  let calls = 0
  let returns = 0
  let caption = "Ready."

  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t === "call") {
      calls++
      const arg = num(e.args?.n)
      const model: StackFrameModel = { frame: e.frame, fn: e.fn, arg, depth: e.depth, status: "active" }
      stack.push(model)
      byFrame.set(e.frame, model)
      caption = `${e.fn}(${arg ?? "?"}) called — waiting on ${e.fn}(${(arg ?? 1) - 1})…`
    } else if (e.t === "return") {
      returns++
      const value = num(e.value)
      // Pop the topmost active frame (the one returning)
      const top = stack[stack.length - 1]
      if (top) {
        top.status = "settled"
        top.returnValue = value
        caption = `${top.fn}(${top.arg ?? "?"}) returned ${value ?? "?"}`
        stack.pop()
        if (stack.length === 0) caption += " — the chain is empty. Done."
      } else {
        caption = `returned ${value ?? "?"}`
      }
    }
  }
  return { stack, calls, returns, caption }
}

// ── AI/ML folds (docs/13 Step 4) — pure reducers over semantic events ──

export interface DatasetFoldModel {
  accepted: number[]                  // row indexes accepted so far
  rejected: { rowId: number; reason: string }[]
  byReason: Record<string, number>
  caption: string                     // narrated line — also the a11y track
}

export function foldDataset(events: TraceEvent[], cursor: number): DatasetFoldModel {
  const accepted: number[] = []
  const rejected: { rowId: number; reason: string }[] = []
  const byReason: Record<string, number> = {}
  let caption = "Ready — validation hasn't run yet."

  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    if (e.op.kind === "data.accept") {
      accepted.push(e.op.rowId)
      caption = `row ${e.op.rowId} accepted — label present, not a duplicate, not reserved`
    } else if (e.op.kind === "data.reject") {
      rejected.push({ rowId: e.op.rowId, reason: e.op.reason })
      byReason[e.op.reason] = (byReason[e.op.reason] ?? 0) + 1
      caption = `row ${e.op.rowId} rejected — ${e.op.reason}`
    }
  }
  return {
    accepted,
    rejected,
    byReason,
    caption: end === 0 ? caption : `${caption} · ${accepted.length} accepted, ${rejected.length} rejected`,
  }
}

export interface RequestFoldItem {
  requestId: string
  started: boolean
  ended: boolean
  status?: number
  latencyMs?: number
}

// Request lifecycle fold: start/end order and latency are preserved; an item
// is in-flight until its end event appears.
export function foldRequests(events: TraceEvent[], cursor: number): RequestFoldItem[] {
  const byId = new Map<string, RequestFoldItem>()
  const order: string[] = []
  const end = Math.min(cursor, events.length)
  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    if (e.op.kind === "request.start") {
      if (!byId.has(e.op.requestId)) order.push(e.op.requestId)
      byId.set(e.op.requestId, { requestId: e.op.requestId, started: true, ended: false })
    } else if (e.op.kind === "request.end") {
      const item = byId.get(e.op.requestId)
      if (item) {
        item.ended = true
        item.status = e.op.status
        item.latencyMs = e.op.latencyMs
      } else {
        byId.set(e.op.requestId, { requestId: e.op.requestId, started: false, ended: true, status: e.op.status, latencyMs: e.op.latencyMs })
        order.push(e.op.requestId)
      }
    }
  }
  return order.map(id => byId.get(id)!)
}

// Systems-project trace fold (system-ai/ml-projects-plan.md §Fixtures/traces).
// Pure: buckets semantic events by kind, narrates the last one at the cursor.
export interface ProjectTraceFold {
  counts: Record<string, number>
  byReason: Record<string, number>
  caption: string
}

export function foldProjectEvents(events: TraceEvent[], cursor: number): ProjectTraceFold {
  const counts: Record<string, number> = {}
  const byReason: Record<string, number> = {}
  let caption = "Ready — no run yet."
  const end = Math.min(cursor, events.length)

  for (let i = 0; i < end; i++) {
    const e = events[i]
    if (e.t !== "structure") continue
    const kind = e.op.kind
    counts[kind] = (counts[kind] ?? 0) + 1
    if ("reason" in e.op && e.op.reason) {
      byReason[e.op.reason] = (byReason[e.op.reason] ?? 0) + 1
    }
    if (kind === "data.accept") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} accepted`
    } else if (kind === "data.reject") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} rejected: ${(e.op as { reason: string }).reason}`
    } else if (kind === "data.split") {
      caption = `step ${i} · row ${(e.op as { rowId: number }).rowId} → ${(e.op as { split: string }).split}`
    } else if (kind === "data.version") {
      caption = `step ${i} · release version ${(e.op as { version: string }).version}`
    } else {
      caption = `step ${i} · ${kind}`
    }
  }
  return { counts, byReason, caption: end === 0 ? caption : `${caption} · ${end} events seen` }
}
