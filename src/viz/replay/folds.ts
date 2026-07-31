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
