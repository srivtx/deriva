import Link from "next/link"
import { listLessons } from "@/curriculum"
import { aiMlTopic } from "@/curriculum/topics/ai-ml/topic"

export default function LabIndexPage() {
  const labs = listLessons().filter(l => l.topic === "ai-ml")

  return (
    <div className="lab-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>AI/ML Systems</span></span>
        <h1 className="lab-title">{aiMlTopic.tagline}</h1>
        <p className="narrative">
          Not a tutorial track — an engineering investigation. Each lab produces a durable
          artifact, and every artifact is load-bearing for the next lab.
        </p>
      </header>

      <section className="lab-list" aria-label="Available labs">
        {labs.map(lab => (
          <Link key={lab.id} href={`/lab/${lab.routeSlug}`} className="lab-card">
            <span className="lab-kicker">{lab.ai?.kind} · {lab.beat}</span>
            <b>{lab.title}</b>
            <p>{lab.purpose}</p>
            <span className="lab-move">one move: {lab.thinkingMove}</span>
            {lab.ai && (
              <div className="artifact-fields">
                {lab.ai.artifacts.map(a => (
                  <span key={a.title} className="artifact-field-chip">{a.title}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </section>

      <section className="artifact-chain" aria-label="The artifact chain">
        <span className="experiment-kicker">The artifact chain every lab builds toward</span>
        <div className="artifact-chain-strip">
          {aiMlTopic.artifactChain.map((artifact, i, all) => (
            <span key={artifact} className="chain-link">
              <span className={i === 0 ? "chain-node done" : "chain-node"}>{artifact}</span>
              {i < all.length - 1 && <span className="chain-arrow">→</span>}
            </span>
          ))}
        </div>
        <p className="chain-note">Labs 0.2 onward land one by one; each loads the previous artifact and asks you to keep, revise, or reject it.</p>
      </section>
    </div>
  )
}
