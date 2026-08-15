"use client"

// Artifact card (docs/13 Step 5) — the durable artifact every AI lab produces,
// plus the system constraints the lab runs under. Data-driven; phone-friendly.

import type { AiLab } from "@/curriculum/schema/lesson"

export function ArtifactCard({ ai }: { ai: AiLab }) {
  return (
    <div className="artifact-card">
      <span className="artifact-kicker">{ai.kind}</span>
      {ai.artifacts.map(a => (
        <div key={a.title} className="artifact-item">
          <b>{a.title}</b>
          <span className="artifact-kind">{a.kind}</span>
          <div className="artifact-fields">
            {a.requiredFields.map(f => <span key={f} className="artifact-field-chip">{f}</span>)}
          </div>
        </div>
      ))}
      {ai.constraints.length > 0 && (
        <div className="artifact-constraints">
          <span className="artifact-kicker">System constraints</span>
          {ai.constraints.map(c => (
            <div key={c.label} className="constraint-row">
              <b>{c.label}</b>
              <span>{c.value}</span>
              <p>{c.whyItMatters}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
