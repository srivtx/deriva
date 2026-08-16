"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH } from "@/data/patterns"
import { loadLessonProgress, type LessonProgress } from "@/persistence/lesson-progress"
import { loadPracticeCompletion } from "@/persistence/practice-progress"
import { loadPatternMastery } from "@/persistence/pattern-mastery"
import { getNextActions, type NextAction } from "@/learning/next-actions"
import { loadPreferences, type Preferences } from "@/persistence/preferences"

type HomeMomentum = { practiceDone: number; practiceTotal: number; pathDone: number }
type MasteryMomentum = { recognized: number; transferred: number; review: number }

const TOPIC_STYLES = [
  { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", dot: "var(--accent)" },
  { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", dot: "var(--viz-settled)" },
  { bg: "#fefce8", border: "#fde68a", accent: "#ca8a04", dot: "#ca8a04" },
  { bg: "#fdf2f8", border: "#fbcfe8", accent: "#db2777", dot: "#db2777" },
  { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed", dot: "#7c3aed" },
  { bg: "#ecfeff", border: "#a5f3fc", accent: "#0891b2", dot: "#0891b2" },
  { bg: "#fff7ed", border: "#fed7aa", accent: "#ea580c", dot: "#ea580c" },
  { bg: "#f1f5f9", border: "#cbd5e1", accent: "#475569", dot: "#475569" },
  { bg: "#fef2f2", border: "#fecaca", accent: "#dc2626", dot: "#dc2626" },
  { bg: "#f0f9ff", border: "#bae6fd", accent: "#0369a1", dot: "#0369a1" },
  { bg: "#faf5ff", border: "#e9d5ff", accent: "#9333ea", dot: "#9333ea" },
  { bg: "#fffbeb", border: "#fde68a", accent: "#b45309", dot: "#b45309" },
  { bg: "#ecfdf5", border: "#a7f3d0", accent: "#047857", dot: "#047857" },
  { bg: "#fff1f2", border: "#fecdd3", accent: "#be123c", dot: "#be123c" },
] as const

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false)
  const [guidedProgress, setGuidedProgress] = useState<LessonProgress | undefined>()
  const [momentum, setMomentum] = useState<HomeMomentum>()
  const [masteryMomentum, setMasteryMomentum] = useState<MasteryMomentum>()
  const [practiceAction, setPracticeAction] = useState<NextAction>()
  const [preferences, setPreferences] = useState<Preferences>()

  useEffect(() => {
    setGuidedProgress(loadLessonProgress("trees/00-recursion-reflex/sum-1-to-n"))
    const allCompletion = loadPracticeCompletion()
    const practiceDone = Object.values(allCompletion).reduce((sum, values) => sum + values.length, 0)
    const practiceTotal = TOPIC_LIST.reduce((sum, item) => sum + item.problems.length, 0)
    const pathDone = PATTERN_LEARNING_PATH.filter(step => (allCompletion[step.topicId] || []).length >= (TOPICS[step.topicId]?.problems.length || 1)).length
    setPracticeAction(getNextActions().find(action => action.kind === "practice"))
    setPreferences(loadPreferences())
    const mastery = loadPatternMastery()
    setMasteryMomentum({
      recognized: PATTERN_DIRECTORY.filter(pattern => mastery.recognized.includes(pattern.id)).length,
      transferred: PATTERN_DIRECTORY.filter(pattern => mastery.transferred.includes(pattern.id)).length,
      review: PATTERN_DIRECTORY.filter(pattern => mastery.missed.includes(pattern.id)).length,
    })
    setMomentum({ practiceDone, practiceTotal, pathDone })
    setHydrated(true)
  }, [])

  if (!hydrated) return <div className="page-loading" role="status">Loading your learning path…</div>

  const guidedHref = "/learn/trees/sum-1-to-n"
  const guidedStage = guidedProgress?.currentStage || "understand"
  const guidedStages = ["understand", "play", "reason", "discover", "design", "implement", "execute", "reflect", "generalize"]
  const guidedIndex = guidedStages.indexOf(guidedStage)
  const guidedDone = guidedProgress?.stages.generalize?.completed
  const practiceHref = practiceAction?.href || "/practice?topic=trees&problem=1"

  return (
    <div className="home-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-ui)" }}>
      <header className="landing-header" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 48px) clamp(20px, 4vw, 32px)", borderBottom: "1px solid var(--line)", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="home-eyebrow" aria-label="Daily practice session">
          <span className="home-eyebrow-index">01</span>
           <span>{preferences?.brandName ?? "Deriva"} / Daily practice</span>
          <span>10 minute session</span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontFamily: "var(--font-narrative)", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
          Make one algorithm<br/>
          <span style={{ color: "var(--accent)" }}>feel inevitable.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", maxWidth: 600, fontSize: 17, lineHeight: 1.6, fontFamily: "var(--font-narrative)" }}>
           {preferences?.tagline ?? "Derive the algorithm."} Start with one small reasoning win before taking on a hard problem. Build the idea first, then choose whether to practice or recall the move.
        </p>
        <div className="landing-actions" style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
           <Link href={guidedHref} className="landing-primary-action" style={{ padding: "12px 28px", background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             Begin today&rsquo;s session →
           </Link>
           <Link href={practiceHref} className="landing-drill-action" style={{ padding: "12px 28px", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             I already know the idea →
           </Link>
        </div>
      </header>

      <main className="landing-main" style={{ flex: 1, padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 48px) 60px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <section className="today-session" aria-labelledby="today-heading">
          <div className="today-session-head">
            <div>
              <span className="discovery-kicker">Today&rsquo;s session</span>
              <h2 id="today-heading">The Recursion Reflex</h2>
            </div>
            <span className="today-session-time">10 minutes</span>
          </div>
          <p className="today-session-copy">
            {guidedDone
              ? "The pattern is earned. Revisit it once, then prove you can spot the same leap in a tree."
              : guidedProgress
                ? `You are at Stage ${guidedIndex + 1} of 9. ${guidedStage === "understand" ? "Make one prediction to get moving." : "Your next small move is ready."}`
                : "Predict an output, touch a live example, and derive the recursive contract before writing code."}
          </p>
          <div className="today-session-proof"><span>First win</span><b>Make one correct prediction</b><span>Then</span><b>Turn it into a reusable pattern</b></div>
          <div className="today-session-actions">
            <Link href={guidedHref} className="today-session-primary">{guidedProgress ? "Continue the derivation" : "Start the derivation"} →</Link>
            <Link href={practiceHref} className="today-session-secondary">Practice code <span>5 min</span></Link>
            <Link href="/patterns/quiz" className="today-session-secondary">Recall a pattern <span>2 min</span></Link>
          </div>
          <div className="continue-derivation-rail" role="progressbar" aria-valuemin={0} aria-valuemax={9} aria-valuenow={Math.max(guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0), 0)} aria-label={`${Math.max(guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0), 0)} of 9 stages complete`}>
            <span style={{ width: `${guidedDone ? 100 : Math.max(5, ((guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0)) / 9) * 100)}%` }} />
          </div>
          <span className="today-session-progress">{guidedDone ? "9 of 9 stages complete. Transfer is next." : `${Math.max(guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0), 0)} of 9 stages complete`}</span>
        </section>

        <section className="stuck-callout" aria-labelledby="stuck-heading">
          <div><span className="discovery-kicker">No shame route</span><h2 id="stuck-heading">Stuck is part of the lesson.</h2></div>
          <p>Use a smaller example, ask for the next question, or switch to code practice. You can always return to the derivation without losing your work.</p>
          <div><Link href={guidedHref}>Try the next question →</Link><Link href={practiceHref}>See the code run →</Link></div>
        </section>

        {momentum && <section className="home-momentum compact-momentum" aria-labelledby="momentum-heading">
          <div className="home-momentum-head"><div><span className="discovery-kicker">Your evidence</span><h2 id="momentum-heading">What you can do now.</h2></div><span className="home-momentum-total">{momentum.practiceDone} problems solved</span></div>
          <div className="mastery-momentum" aria-label="Pattern mastery momentum">
            <div><span>Patterns recognized</span><b>{masteryMomentum?.recognized ?? 0}/{PATTERN_DIRECTORY.length}</b></div>
            <div><span>Transfer proof</span><b>{masteryMomentum?.transferred ?? 0} completed</b></div>
            <div><span>Review cues</span><b>{masteryMomentum?.review ? `${masteryMomentum.review} waiting` : "Clear"}</b></div>
          </div>
        </section>}

        <details className="curriculum-explore">
          <summary><span>Explore the curriculum</span><small>AI/ML, DSA, HLD, LLD, games, and pattern tools</small></summary>
          <div className="explore-actions">
            <Link href="/ai-ml" className="explore-link"><b>AI/ML Systems</b><span>Labs + 180 practice questions</span></Link>
            <Link href="/patterns" className="explore-link"><b>Pattern Journal</b><span>Recognize the thinking moves</span></Link>
            <Link href="/expedition" className="explore-link"><b>Expedition</b><span>Retrieve, break, and transfer an idea</span></Link>
            <Link href="/games" className="explore-link"><b>Game Mode</b><span>Practice invariants through play</span></Link>
            <Link href="/design" className="explore-link"><b>System Design</b><span>45 architecture problems</span></Link>
            <Link href="/lld" className="explore-link"><b>Low-Level Design</b><span>35 object design problems</span></Link>
          </div>
          <h3>DSA Topics</h3>
          <div className="topic-grid">
            {TOPIC_LIST.map((topic, i) => {
              const s = TOPIC_STYLES[i % TOPIC_STYLES.length]
              return <Link key={topic.id} href={`/topic/${topic.id}`} className="topic-card" style={{ background: s.bg, border: `1px solid ${s.border}`, color: "var(--ink)" }}>
                <span className="topic-card-title"><b style={{ background: s.accent }} /><strong>{topic.name}</strong><em>{topic.problems.length}</em></span>
                <span className="topic-card-stages">{topic.stages.map(stage => stage.name).join(" · ")}</span>
              </Link>
            })}
          </div>
        </details>
      </main>

      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--line)", color: "var(--ink-soft)", fontSize: 12 }}>
         <div style={{ maxWidth: 1100, margin: "0 auto" }}>{preferences?.brandName ?? "Deriva"} runs locally in your browser. Nothing is uploaded.</div>
      </footer>

      <style>{`
        a.topic-card { transition: transform 0.2s, box-shadow 0.2s; }
        a.topic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  )
}
