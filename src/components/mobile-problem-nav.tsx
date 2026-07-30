"use client"

interface Stage { id: number; name: string }
interface NavProblem { id: number; stage: number; title: string }

export default function MobileProblemNav({
  stages, problems, currentId, done, onSelect,
}: {
  stages: Stage[]
  problems: NavProblem[]
  currentId: number
  done: Set<number>
  onSelect: (id: number) => void
}) {
  return (
    <div className="mobile-nav" style={{ marginBottom: 14 }}>
      <select
        value={currentId}
        onChange={e => onSelect(Number(e.target.value))}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 14,
          background: "var(--paper-raised)", border: "1px solid var(--line)",
          borderRadius: "var(--radius)", color: "var(--ink)", fontFamily: "var(--font-ui)",
        }}
      >
        {stages.map(stage => (
          <optgroup key={stage.id} label={`${stage.id}. ${stage.name}`}>
            {problems.filter(p => p.stage === stage.id).map(p => (
              <option key={p.id} value={p.id}>
                {done.has(p.id) ? "✓ " : ""}{p.id}. {p.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
