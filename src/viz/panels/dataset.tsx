"use client"

// Dataset panel — pure renderer of (trace, cursor) via foldDataset (05 §4.3).
// Each row shows its verdict at the cursor: accepted (settled), rejected with
// reason (pruned), or untouched (grey). A text summary rides along (09 §8).

import type { TicketRow } from "@/curriculum/topics/ai-ml/00-data-contract/fixtures"
import type { DatasetFoldModel } from "@/viz/replay/folds"

interface Props {
  rows: TicketRow[]
  fold: DatasetFoldModel
}

export function DatasetPanel({ rows, fold }: Props) {
  const acceptedSet = new Set(fold.accepted)
  const rejectedById = new Map(fold.rejected.map(r => [r.rowId, r.reason]))
  const rejectedCount = fold.rejected.length
  const untouched = rows.length - acceptedSet.size - rejectedCount

  const reasonOrder = Object.entries(fold.byReason).sort((a, b) => b[1] - a[1])

  return (
    <div className="dataset-panel">
      <div className="dataset-summary" aria-live="polite">
        <span className="ds-count ok">{acceptedSet.size} accepted</span>
        <span className="ds-count bad">{rejectedCount} rejected</span>
        <span className="ds-count muted">{untouched} untouched</span>
      </div>

      {reasonOrder.length > 0 && (
        <div className="ds-reasons">
          {reasonOrder.map(([reason, count]) => (
            <span key={reason} className="ds-reason-chip">{reason} ×{count}</span>
          ))}
        </div>
      )}

      <ol className="dataset-rows" aria-label="Dataset rows and their verdicts">
        {rows.map((row, i) => {
          const reason = rejectedById.get(i)
          const accepted = acceptedSet.has(i)
          return (
            <li key={row.id} className={`dataset-row ${accepted ? "accepted" : reason ? "rejected" : "untouched"}`}>
              <code className="ds-row-id">{row.id}</code>
              <span className="ds-row-text">{typeof row.text === "string" ? row.text : "—"}</span>
              {row.in_eval && <span className="ds-row-reserved">reserved</span>}
              {accepted && <span className="ds-row-verdict ok">accepted</span>}
              {reason && <span className="ds-row-verdict bad">{reason}</span>}
              {!accepted && !reason && <span className="ds-row-verdict muted">waiting</span>}
            </li>
          )
        })}
      </ol>

      <p className="trace-caption" aria-live="polite">{fold.caption}</p>
    </div>
  )
}
