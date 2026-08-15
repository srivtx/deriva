// ai-ml/00-data-contract fixtures (docs/13 Step 3)
// Deterministic, fixed seed, small enough for mobile/browser replay.
// 30 rows: 22 valid · 2 exact duplicates · 2 missing labels · 2 malformed ·
// 1 empty text · 1 train/test leak (already reserved for the held-out set).
// Plus an 8-row held-out evaluation set.

export type TicketLabel = "bug" | "question" | "feature"

export interface TicketRow {
  id: string
  text?: string | number
  label: TicketLabel | null
  author?: string
  in_eval?: boolean
}

export const ticketRows: TicketRow[] = [
  // ── 22 valid rows (bug 12 · question 6 · feature 4 — deliberate imbalance) ──
  { id: "r01", text: "The dashboard shows 0 for yesterday's revenue until I refresh twice.", label: "bug", author: "ana" },
  { id: "r02", text: "Export to PDF breaks when the report title contains an apostrophe.", label: "bug", author: "brian" },
  { id: "r03", text: "Search returns duplicates when the query has a trailing space.", label: "bug", author: "chen" },
  { id: "r04", text: "The timer keeps running after I close the recording dialog.", label: "bug", author: "dana" },
  { id: "r05", text: "Notifications arrive about 40 minutes after the event actually happens.", label: "bug", author: "ana" },
  { id: "r06", text: "The mobile app crashes when a photo is uploaded over a slow network.", label: "bug", author: "brian" },
  { id: "r07", text: "Currency conversion shows the wrong total after daylight saving changes.", label: "bug", author: "chen" },
  { id: "r08", text: "The chart tooltip sticks to the screen after the pointer leaves the chart.", label: "bug", author: "dana" },
  { id: "r09", text: "Deleting a project does not remove its uploads from storage.", label: "bug", author: "ana" },
  { id: "r10", text: "The weekly report email is sent twice when the job retries once.", label: "bug", author: "brian" },
  { id: "r11", text: "Sorting by column name is case sensitive, which surprises users.", label: "bug", author: "chen" },
  { id: "r12", text: "The app logs out when the system clock jumps forward by more than an hour.", label: "bug", author: "dana" },
  { id: "r13", text: "How do I share a read-only link with a client?", label: "question", author: "ana" },
  { id: "r14", text: "Can I export the activity log to Excel?", label: "question", author: "brian" },
  { id: "r15", text: "What happens to my drafts when I downgrade the plan?", label: "question", author: "chen" },
  { id: "r16", text: "Is there a way to undo a bulk edit?", label: "question", author: "dana" },
  { id: "r17", text: "Does the API support webhooks for failed imports?", label: "question", author: "ana" },
  { id: "r18", text: "How long does the free trial last after the discount code?", label: "question", author: "brian" },
  { id: "r19", text: "Add a dark mode toggle for the editor.", label: "feature", author: "chen" },
  { id: "r20", text: "Let me pin important conversations to the top.", label: "feature", author: "dana" },
  { id: "r21", text: "Add a monthly summary email with top activity.", label: "feature", author: "ana" },
  { id: "r22", text: "Allow custom tags on reports.", label: "feature", author: "brian" },

  // ── 2 exact duplicates (first occurrence wins) ──
  { id: "r23", text: "Notifications arrive about 40 minutes after the event actually happens.", label: "bug", author: "ana" },
  { id: "r24", text: "Sorting by column name is case sensitive, which surprises users.", label: "bug", author: "chen" },

  // ── 2 missing labels ──
  { id: "r25", text: "The integration guide does not mention the new endpoint.", label: null, author: "brian" },
  { id: "r26", text: "Can billing be split across two cards?", label: null, author: "dana" },

  // ── 2 malformed records ──
  { id: "r27", label: "bug" },                       // missing text field
  { id: "r28", text: 123456, label: "question", author: "chen" }, // non-string text

  // ── 1 empty text ──
  { id: "r29", text: "   ", label: "bug", author: "dana" },

  // ── 1 train/test leak: already reserved for the held-out set ──
  { id: "eval-104", text: "The export to CSV silently drops rows with emoji in the description field.", label: "bug", author: "chen", in_eval: true },
]

// Held-out evaluation set — the leak row (eval-104) appears in BOTH.
export const heldOutEvalRows: TicketRow[] = [
  { id: "eval-101", text: "Pagination resets to page one after applying a filter.", label: "bug", author: "ana" },
  { id: "eval-102", text: "Can I restrict editors to a single folder?", label: "question", author: "brian" },
  { id: "eval-103", text: "Add keyboard shortcuts for the most common actions.", label: "feature", author: "chen" },
  { id: "eval-104", text: "The export to CSV silently drops rows with emoji in the description field.", label: "bug", author: "chen" },
  { id: "eval-105", text: "The PDF export renders code blocks with the wrong colors.", label: "bug", author: "dana" },
  { id: "eval-106", text: "What is the retention window for audit logs?", label: "question", author: "ana" },
  { id: "eval-107", text: "Allow exporting the schedule as a calendar file.", label: "feature", author: "brian" },
  { id: "eval-108", text: "Two-factor codes are rejected right after the minute boundary.", label: "bug", author: "dana" },
]

// The contract lesson 0.1 teaches (also the sandbox's ruleset).
export const dataContract = {
  requiredFields: ["id", "text", "label"],
  duplicatePolicy: "first occurrence wins; later exact duplicates are rejected",
  missingValuePolicy: "rows without a label are rejected before training",
  splitPolicy: "rows already reserved for the held-out set are rejected from training",
}

export const fixtureSummary = {
  total: ticketRows.length,
  valid: 22,
  duplicates: 2,
  missingLabels: 2,
  malformed: 3,          // missing text (r27) · non-string text (r28) · empty text (r29)
  leak: 1,
  acceptedUnderContract: 22,
  rejectedUnderContract: 8,
}
