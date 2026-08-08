"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TOPICS, TOPIC_LIST } from "@/data"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH } from "@/data/patterns"
import Logo from "@/components/logo"
import GameModeButton from "@/components/game-mode-button"
import PatternModeButton from "@/components/pattern-mode-button"
import { loadLessonProgress, type LessonProgress } from "@/persistence/lesson-progress"
import { loadPracticeCompletion } from "@/persistence/practice-progress"
import { loadPatternMastery } from "@/persistence/pattern-mastery"
import { getNextActions, type NextAction } from "@/learning/next-actions"

type HomeMomentum = { practiceDone: number; practiceTotal: number; pathDone: number }
type MasteryMomentum = { recognized: number; transferred: number; review: number }

const TOPIC_STYLES = [
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
  { bg: "var(--paper-raised)", border: "var(--line)", accent: "var(--accent)", dot: "var(--accent)" },
] as const

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false)
  const [guidedProgress, setGuidedProgress] = useState<LessonProgress | undefined>()
  const [momentum, setMomentum] = useState<HomeMomentum>()
  const [nextActions, setNextActions] = useState<NextAction[]>([])
  const [masteryMomentum, setMasteryMomentum] = useState<MasteryMomentum>()

  useEffect(() => {
    setGuidedProgress(loadLessonProgress("trees/00-recursion-reflex/sum-1-to-n"))
    const allCompletion = loadPracticeCompletion()
    const practiceDone = Object.values(allCompletion).reduce((sum, values) => sum + values.length, 0)
    const practiceTotal = TOPIC_LIST.reduce((sum, item) => sum + item.problems.length, 0)
    const pathDone = PATTERN_LEARNING_PATH.filter(step => (allCompletion[step.topicId] || []).length >= (TOPICS[step.topicId]?.problems.length || 1)).length
    setNextActions(getNextActions())
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-ui)" }}>
      <header className="landing-header" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 48px) clamp(20px, 4vw, 32px)", borderBottom: "1px solid var(--line)", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="landing-brandline" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Logo size={44} />
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--ink-soft)" }}>
            Deriva · Learn DSA from first principles
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontFamily: "var(--font-narrative)", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
          Derive the algorithm.<br/>
          <span style={{ color: "var(--accent)" }}>Don't memorize it.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", maxWidth: 600, fontSize: 17, lineHeight: 1.6, fontFamily: "var(--font-narrative)" }}>
           DSA (700 problems) · System Design HLD (45) · LLD (35). Every topic follows a nine-stage derivation —
          each stage adds exactly one new mental model. In-browser Python. No install. Just think.
        </p>
        <div className="landing-actions" style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
           <Link href={guidedHref} style={{ padding: "12px 28px", background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             Start guided learning →
           </Link>
           <Link href="/practice" className="landing-secondary-action" style={{ padding: "12px 28px", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             Drill problems →
           </Link>
           <Link href="/design" className="landing-secondary-action" style={{ padding: "12px 28px", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             System Design (HLD) →
           </Link>
            <Link href="/lld" className="landing-secondary-action" style={{ padding: "12px 28px", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
             Low-Level Design →
           </Link>
           <PatternModeButton />
           <GameModeButton />
         </div>
      </header>

      <main className="landing-main" style={{ flex: 1, padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 48px) 60px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <Link href={guidedHref} className="continue-derivation" style={{
          display: "block", marginBottom: 32, padding: "20px 24px", border: "1px solid var(--accent)",
          borderRadius: "var(--radius)", background: "var(--accent-soft)", color: "var(--ink)", textDecoration: "none",
        }}>
          <div className="continue-derivation-head" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
            <span style={{ color: "var(--accent)", fontSize: 10, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase" }}>
              {guidedDone ? "Pattern earned · revisit" : guidedProgress ? "Your unfinished derivation" : "Start with one idea"}
            </span>
            <span style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}>Open lesson →</span>
          </div>
          <h2 style={{ margin: "8px 0 4px", fontFamily: "var(--font-narrative)", fontSize: 24 }}>
            The Recursion Reflex
          </h2>
          <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5 }}>
            {guidedDone
              ? "You named the leap. Revisit it before it fades, then transfer it to a tree."
              : guidedProgress
                ? `You are at Stage ${guidedIndex + 1} of 9: ${guidedStage}. The next move is still waiting for you.`
                : "A 10-minute guided derivation. No editor until you have invented the contract."}
          </p>
           <div className="continue-derivation-rail" role="progressbar" aria-valuemin={0} aria-valuemax={9} aria-valuenow={Math.max(guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0), 0)} aria-label={`${Math.max(guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0), 0)} of 9 stages complete`}>
            <span style={{ width: `${guidedDone ? 100 : Math.max(5, ((guidedIndex + (guidedProgress?.stages[guidedStage as keyof LessonProgress["stages"]]?.completed ? 1 : 0)) / 9) * 100)}%` }} />
          </div>
        </Link>

        {momentum && <section className="home-momentum" aria-labelledby="momentum-heading">
          <div className="home-momentum-head"><div><span className="discovery-kicker">Your momentum</span><h2 id="momentum-heading">One coherent finish path.</h2></div><span className="home-momentum-total">{momentum.practiceDone}/{momentum.practiceTotal} DSA problems</span></div>
          <div className="home-momentum-grid">
            {nextActions.map((action, index) => {
              const cardTone = index === 0 ? "primary" : action.kind === "patterns" ? "path" : action.kind
              return <Link key={action.id} href={action.href} className={`home-momentum-card ${cardTone}`}>
                <span className="home-momentum-label">{action.eyebrow}</span>
                <b>{action.title}</b>
                <span>{action.description}</span>
                <strong>{action.progress ? `${action.progress.completed}/${action.progress.total} complete · ` : ""}{action.cta} →</strong>
              </Link>
            })}
          </div>
          <div className="home-finish-line"><div><span>Finish line</span><b>{momentum.pathDone}/14 stops complete</b></div><div className="home-finish-track"><span style={{ width: `${(momentum.pathDone / PATTERN_LEARNING_PATH.length) * 100}%` }} /></div></div>
          {masteryMomentum && <div className="mastery-momentum" aria-label="Pattern mastery momentum">
            <div><span>Pattern momentum</span><b>{masteryMomentum.recognized}/{PATTERN_DIRECTORY.length} recognized</b></div>
            <div><span>Transfer proof</span><b>{masteryMomentum.transferred} transferred</b></div>
            <div><span>Next revisit</span><b>{masteryMomentum.review ? `${masteryMomentum.review} cues waiting` : "No misses waiting"}</b></div>
          </div>}
        </section>}

        <Link href="/expedition" className="expedition-callout">
          <span className="discovery-kicker">New · Pattern journeys</span>
          <b>Go deeper than the problem bank</b>
          <span>Retrieve an idea, break it, transfer it, and leave with your own theory.</span>
          <strong>Enter the Expedition →</strong>
        </Link>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", marginBottom: 32 }}>
          <Link href="/design" className="topic-card" style={{
             background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
            padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none", color: "var(--ink)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
               <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>System Design (HLD)</h2>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>45</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
              Requirements → API → capacity math → components → naive → optimized → full designs. Interactive architecture canvas (React Flow).
            </p>
          </Link>
          <Link href="/lld" className="topic-card" style={{
             background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
            padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none", color: "var(--ink)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
               <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>Low-Level Design (OOP)</h2>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>35</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
              Entities → responsibilities → relationships → state machines → god classes → patterns → full designs (parking lot, LRU cache, splitwise).
            </p>
          </Link>
        </div>
         <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--ink-soft)", marginBottom: 16 }}>DSA Topics — 700 Problems</h3>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {TOPIC_LIST.map((topic, i) => {
            const s = TOPIC_STYLES[i % TOPIC_STYLES.length]
            const stageNames = topic.stages.map(st => st.name)
            return (
              <Link key={topic.id} href={`/topic/${topic.id}`}
                className="topic-card"
                style={{
                  background: s.bg, border: `1px solid ${s.border}`, borderRadius: "var(--radius)",
                  padding: "24px 28px", display: "flex", flexDirection: "column", textDecoration: "none",
                  color: "var(--ink)", transition: "all 0.2s", cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.accent, flexShrink: 0 }} />
                  <h2 style={{ fontSize: 16, fontFamily: "var(--font-narrative)", fontWeight: 700, margin: 0 }}>{topic.name}</h2>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{topic.problems.length}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {stageNames.map((name, j) => (
                    <span key={j} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 10,
                       background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--line)",
                      fontFamily: "var(--font-mono)",
                    }}>{name}</span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--line)", color: "var(--ink-soft)", fontSize: 12 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>Deriva — All code runs locally in your browser. Nothing is uploaded.</div>
      </footer>

      <style>{`
        a.topic-card { transition: transform 0.2s, box-shadow 0.2s; }
        a.topic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      `}</style>
    </div>
  )
}
