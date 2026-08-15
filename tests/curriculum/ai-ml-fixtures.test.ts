// AI/ML fixture determinism (docs/13 Step 3) — fixed rows must reproduce
// identical results, and the sandbox contract must agree with the summary.

import { describe, it, expect } from "vitest"
import {
  ticketRows,
  heldOutEvalRows,
  fixtureSummary,
} from "../../src/curriculum/topics/ai-ml/00-data-contract/fixtures"
import { evaluateSandbox, sandboxCounts } from "../../src/learning/stages/ai/dataset-sandbox"

describe("ai-ml/00-data-contract fixtures", () => {
  it("are deterministic — reading twice yields identical rows", () => {
    expect(JSON.parse(JSON.stringify(ticketRows))).toEqual(ticketRows)
    expect(JSON.parse(JSON.stringify(heldOutEvalRows))).toEqual(heldOutEvalRows)
  })

  it("have the planned size and shape", () => {
    expect(ticketRows).toHaveLength(30)
    expect(heldOutEvalRows).toHaveLength(8)
  })

  it("contain exactly one train/test leak, and it matches the held-out set", () => {
    const leaks = ticketRows.filter(r => r.in_eval === true)
    expect(leaks).toHaveLength(1)
    const leak = leaks[0]!
    const evalMatch = heldOutEvalRows.find(r => r.id === leak.id)
    expect(evalMatch).toBeDefined()
    expect(evalMatch!.text).toBe(leak.text)
    expect(evalMatch!.label).toBe(leak.label)
  })

  it("carry a deliberate class imbalance (bug-heavy) on the clean rows", () => {
    const seen = new Set<string>()
    const clean = ticketRows.filter(r => {
      if (typeof r.text !== "string" || r.text.trim() === "" || r.label === null || r.in_eval === true) return false
      const key = `${r.text.trim().toLowerCase()}·${r.label}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    expect(clean).toHaveLength(22)
    const byLabel = clean.reduce<Record<string, number>>((acc, r) => {
      acc[r.label!] = (acc[r.label!] ?? 0) + 1
      return acc
    }, {})
    expect(byLabel.bug).toBe(12)
    expect(byLabel.question).toBe(6)
    expect(byLabel.feature).toBe(4)
  })

  it("the sandbox contract reproduces the documented summary (22 accepted / 8 rejected)", () => {
    const verdicts = evaluateSandbox(ticketRows, { unlabeled: [], markedDuplicate: [] })
    const counts = sandboxCounts(verdicts)
    expect(counts.accepted).toBe(fixtureSummary.acceptedUnderContract)
    expect(counts.rejected).toBe(fixtureSummary.rejectedUnderContract)

    const byReason: Record<string, number> = {}
    for (const v of verdicts) {
      if (v.reason) byReason[v.reason] = (byReason[v.reason] ?? 0) + 1
    }
    expect(byReason.duplicate).toBe(2)
    expect(byReason["missing-label"]).toBe(2)
    expect(byReason.malformed).toBe(3)
    expect(byReason["reserved"]).toBe(1)
  })

  it("first occurrence wins, deterministically", () => {
    const verdicts = evaluateSandbox(ticketRows, { unlabeled: [], markedDuplicate: [] })
    const firstDuplicate = verdicts.find(v => v.rowId === 4)   // r05
    const secondDuplicate = verdicts.find(v => v.rowId === 22) // r23 = copy of r05
    expect(firstDuplicate!.decision).toBe("accepted")
    expect(secondDuplicate!.decision).toBe("rejected")
    expect(secondDuplicate!.reason).toBe("duplicate")
  })

  it("learner edits are reflected deterministically", () => {
    const unlabeled = evaluateSandbox(ticketRows, { unlabeled: [0], markedDuplicate: [] })
    expect(unlabeled[0]!.decision).toBe("rejected")
    expect(unlabeled[0]!.reason).toBe("missing-label")
    const marked = evaluateSandbox(ticketRows, { unlabeled: [], markedDuplicate: [9] })
    expect(marked[9]!.decision).toBe("rejected")
    expect(marked[9]!.reason).toBe("duplicate")
  })
})
