// Project 1 trace fixtures (system-ai/ml-projects-plan.md §Fixtures).
// Deterministic payloads for the level trace runs. Each fixture optionally
// carries a wrapper that adapts the payload to the learner's public API so the
// worker can call entry(payload) exactly once.

import { ticketRows, heldOutEvalRows } from "../00-data-contract/fixtures"

export interface ProjectTraceFixture {
  fixtureId: string
  payload: unknown
  wrapper?: string // python; {entryPoint} is replaced with the learner's entry
}

export const projectOneFixtures: Record<string, ProjectTraceFixture> = {
  "tickets-30-l1": {
    fixtureId: "tickets-30-l1",
    payload: {
      row: ticketRows.find(row => row.in_eval)!,
      reserved_ids: heldOutEvalRows.map(row => row.id),
    },
    wrapper: `def __deriva_trace_entry(payload):
    return {entryPoint}(payload["row"], reserved_ids=set(payload["reserved_ids"]))
`,
  },
  "tickets-30-l2": {
    fixtureId: "tickets-30-l2",
    payload: [
      ticketRows.find(row => row.id === "r05")!,
      ticketRows.find(row => row.id === "r23")!,
      ticketRows.find(row => row.id === "r11")!,
      ticketRows.find(row => row.id === "r24")!,
    ],
  },
  "tickets-30-l3": {
    fixtureId: "tickets-30-l3",
    payload: {
      rows: ticketRows.slice(0, 12).map(row => ({ id: row.id, author: row.author, label: row.label })),
      ratios: [0.7, 0.15, 0.15],
      group_key: "author",
      seed: 42,
    },
    wrapper: `def __deriva_trace_entry(payload):
    return {entryPoint}(payload["rows"], payload["ratios"], payload["group_key"], payload["seed"])
`,
  },
  "tickets-30-l4": {
    fixtureId: "tickets-30-l4",
    payload: {
      state: { cursor: 0, committed: {} },
      batch: [
        { id: "n-1", text: "Dashboard shows 0 for yesterday.", label: "bug" },
        { id: "n-2", text: "Export breaks on apostrophes.", label: "bug" },
        { id: "n-3" },
        { id: "n-1", text: "Dashboard shows 0 for yesterday.", label: "bug" },
      ],
    },
    wrapper: `def __deriva_trace_entry(payload):
    return {entryPoint}(payload["state"], payload["batch"])
`,
  },
  "tickets-30-l5": {
    fixtureId: "tickets-30-l5",
    payload: {
      manifest: { schema_version: "v1", required: ["id", "text", "label"], batch_ids: ["b-1", "b-2"] },
      batches: [
        { batch_id: "b-1", rows: [{ id: "a", text: "  hi  ", label: "bug" }, { id: "b", text: "bye", label: "question" }] },
        { batch_id: "b-2", rows: [{ id: "c", text: "dark mode please", label: "feature" }] },
      ],
    },
    wrapper: `def __deriva_trace_entry(payload):
    return {entryPoint}(payload["manifest"], payload["batches"])
`,
  },
}
