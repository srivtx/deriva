// /ai-ml/patterns — the named patterns the AI/ML track deposits (docs/13).
// Derived from the question bank so it never drifts from authored data.

import Link from "next/link"
import { aiQuestions } from "@/curriculum/topics/ai-ml/questions"
import { aiMlTopic } from "@/curriculum/topics/ai-ml/topic"

export default function AiPatternsPage() {
  const byPattern = new Map<string, number>()
  for (const question of aiQuestions) {
    byPattern.set(question.pattern, (byPattern.get(question.pattern) ?? 0) + 1)
  }
  const patterns = [...byPattern.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="lab-page ai-patterns-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>Patterns</span></span>
        <h1 className="lab-title">The AI/ML pattern journal</h1>
        <p className="narrative">
          Every question trains one named pattern. Earn them by practicing; the artifact
          chain is what connects them.
        </p>
      </header>

      <section className="ai-hub-section">
        <span className="experiment-kicker">Artifact chain — the track's spine</span>
        <div className="artifact-chain-strip">
          {aiMlTopic.artifactChain.map((artifact, i, all) => (
            <span key={artifact} className="chain-link">
              <span className={`chain-node${i === 0 ? " done" : ""}`}>{artifact}</span>
              {i < all.length - 1 && <span className="chain-arrow">→</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="ai-hub-section">
        <span className="experiment-kicker">{patterns.length} named patterns across the bank</span>
        <div className="ai-pattern-grid">
          {patterns.map(([name, count]) => (
            <div key={name} className="ai-hub-card">
              <b>{name}</b>
              <span className="ai-continue-sub">{count} question{count === 1 ? "" : "s"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ai-hub-section">
        <span className="experiment-kicker">Practice a pattern directly</span>
        <div className="ai-hub-grid">
          {["Dataset contract", "Leakage", "Baseline honesty", "Calibration", "Grounded answer"].map(name => {
            const first = aiQuestions.find(question => question.pattern === name)
            if (!first) return null
            return (
              <Link key={name} href={`/ai-ml/question/${first.id}`} className="ai-hub-card">
                <b>{name}</b>
                <span className="ai-continue-sub">start with {first.id} →</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
