"use client"

// Call-stack panel — pure render of CallStackModel (09 §6 grammar):
// blue = active (on the stack), green = settled (returned).
// The student's frames are the protagonist — labels carry their arg values.

import type { CallStackModel } from "@/viz/replay/folds"

export function CallStackPanel({ model }: { model: CallStackModel }) {
  const { stack, calls, returns } = model
  const deepest = stack.length

  return (
    <div className="callstack-panel" role="img" aria-label={`Call stack: ${deepest} frames. ${model.caption}`}>
      <div className="callstack-frames">
        {stack.length === 0 && (
          <div className="callstack-empty">
            {returns > 0 ? "The chain unwound completely — every trust was repaid." : "The stack is empty. Press play."}
          </div>
        )}
        {[...stack].reverse().map((f, i) => {
          const isTop = i === 0
          return (
            <div
              key={f.frame}
              className={`callstack-frame ${isTop ? "top" : ""}`}
              style={{ marginLeft: `${(deepest - 1 - i) * 0}px` }}
            >
              <span className="callstack-fn">{f.fn}</span>
              <span className="callstack-arg">n = {f.arg ?? "?"}</span>
              {isTop && <span className="callstack-waiting">waiting…</span>}
            </div>
          )
        })}
      </div>
      <div className="callstack-meta">
        <span><b>{calls}</b> calls</span>
        <span><b>{returns}</b> returns</span>
        <span>depth <b>{deepest}</b></span>
      </div>
    </div>
  )
}
