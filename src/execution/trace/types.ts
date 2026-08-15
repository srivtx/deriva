// Core types for the Trace system (05 §2)
// Language-agnostic by design

export type FrameId = string

export interface TraceValue {
  type: "int" | "float" | "str" | "bool" | "none" | "list" | "dict" | "node" | "tuple"
  value: unknown
  id?: string  // for shared references (trees, linked lists)
}

export type TraceEvent =
  | { t: "call";    frame: FrameId; fn: string; args: Record<string, TraceValue>; depth: number }
  | { t: "return";  frame: FrameId; value: TraceValue }
  | { t: "line";    frame: FrameId; lineno: number }
  | { t: "assign";  frame: FrameId; name: string; value: TraceValue }
  | { t: "structure"; op: StructureOp }
  | { t: "compare"; a: TraceValue; b: TraceValue; result: boolean }
  | { t: "error";   message: string; frame: FrameId }

export type StructureOp =
  | { kind: "tree.visit"; nodeId: string }
  | { kind: "tree.return-tuple"; nodeId: string; value: TraceValue }
  | { kind: "list.move"; ptr: string; toId: string }
  | { kind: "heap.swap"; i: number; j: number }
  | { kind: "dp.write"; cell: [number, number] | [number]; value: TraceValue }
  | { kind: "bt.choose"; choice: TraceValue }
  | { kind: "bt.unchoose"; choice: TraceValue }
  | { kind: "graph.enqueue"; nodeId: string }
  | { kind: "graph.visit"; nodeId: string }
  | { kind: "callstack.push"; frame: FrameId; fn: string }
  | { kind: "callstack.pop"; frame: FrameId }
  // ── AI/ML semantic events (docs/13 Step 4) — emitted by lab harness code.
  // Snapshots only; visualizers stay pure functions of (trace, cursor).
  | { kind: "data.accept"; rowId: number }
  | { kind: "data.reject"; rowId: number; reason: string }
  | { kind: "data.split"; rowId: number; split: string }
  | { kind: "data.version"; version: string }
  | { kind: "feature.write"; name: string; value: unknown }
  | { kind: "model.score"; rowId: number; score: number }
  | { kind: "loss.update"; value: number }
  | { kind: "gradient.update"; parameter: string; value: number }
  | { kind: "request.start"; requestId: string }
  | { kind: "request.end"; requestId: string; status: number; latencyMs: number }
  | { kind: "failure.detected"; category: string }

export interface Trace {
  version: 1
  language: "python"
  source: string
  input: unknown
  events: TraceEvent[]
  budget: { maxEvents: number; truncated: boolean }
}

export interface TraceBudget {
  maxEvents: number
  truncated: boolean
}

// Cursor state for replay engine
export interface TraceCursor {
  position: number  // index into events[]
  direction: "forward" | "backward" | "paused"
}

// Pure fold: events up to cursor → panel model
export type Fold<E, M> = (events: TraceEvent[], cursor: number) => M
