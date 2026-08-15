// Dataset sandbox rules (ai-ml/00-data-contract Play stage).
// Pure and deterministic: the same decisions the lesson's contract teaches,
// executed over learner edits. Visualizers and tests never re-run model code.

import type { TicketRow } from "@/curriculum/topics/ai-ml/00-data-contract/fixtures"

export type SandboxDecision = "accepted" | "rejected" | "untouched"

export interface SandboxState {
  unlabeled: number[]     // row indexes the learner unlabeled
  markedDuplicate: number[] // row indexes the learner forced to duplicate
}

export interface RowVerdict {
  rowId: number
  decision: SandboxDecision
  reason?: string
}

export function evaluateSandbox(rows: TicketRow[], state: SandboxState): RowVerdict[] {
  const unlabeled = new Set(state.unlabeled)
  const marked = new Set(state.markedDuplicate)
  const seen = new Set<string>()
  const verdicts: RowVerdict[] = []

  rows.forEach((row, rowId) => {
    const text = row.text
    const label = unlabeled.has(rowId) ? null : row.label
    if (typeof text !== "string" || text.trim() === "") {
      verdicts.push({ rowId, decision: "rejected", reason: "malformed" })
      return
    }
    if (label === null) {
      verdicts.push({ rowId, decision: "rejected", reason: "missing-label" })
      return
    }
    if (row.in_eval) {
      verdicts.push({ rowId, decision: "rejected", reason: "reserved" })
      return
    }
    const key = `${text.trim().toLowerCase()}·${label}`
    if (marked.has(rowId) || seen.has(key)) {
      verdicts.push({ rowId, decision: "rejected", reason: "duplicate" })
      return
    }
    seen.add(key)
    verdicts.push({ rowId, decision: "accepted" })
  })

  return verdicts
}

export function sandboxCounts(verdicts: RowVerdict[]) {
  const accepted = verdicts.filter(v => v.decision === "accepted").length
  const rejected = verdicts.filter(v => v.decision === "rejected").length
  return { accepted, rejected, untouched: verdicts.length - accepted - rejected }
}
