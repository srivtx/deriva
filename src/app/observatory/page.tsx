"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TOPIC_LIST } from "@/data"
import { PATTERN_DIRECTORY, type PatternDefinition, type PatternFamily } from "@/data/patterns"
import { loadLessonProgress, type LessonProgress } from "@/persistence/lesson-progress"
import { loadPatternMastery, type PatternMastery } from "@/persistence/pattern-mastery"
import { loadPracticeCompletion } from "@/persistence/practice-progress"
import { loadAllScenarioProgress, type ScenarioProgress } from "@/persistence/system-scenario-progress"
import { systemScenarios } from "@/curriculum/topics/ai-ml/systems"

type PatternFilter = "all" | "recognized" | "review" | "transfer"

const FAMILIES: PatternFamily[] = ["Foundations", "Structures", "Graphs", "Choices", "State", "Compression", "Proof"]

export default function ObservatoryPage() {
  const [hydrated, setHydrated] = useState(false)
  const [lesson, setLesson] = useState<LessonProgress>()
  const [mastery, setMastery] = useState<PatternMastery>({ recognized: [], missed: [], transferred: [] })
  const [completion, setCompletion] = useState<Record<string, number[]>>({})
  const [scenarioProgress, setScenarioProgress] = useState<Record<string, ScenarioProgress>>({})
  const [filter, setFilter] = useState<PatternFilter>("all")
  const [family, setFamily] = useState<PatternFamily | "all">("all")
  const [selectedId, setSelectedId] = useState<string>("recursive-leap-of-faith")

  useEffect(() => {
    setLesson(loadLessonProgress("trees/00-recursion-reflex/sum-1-to-n"))
    setMastery(loadPatternMastery())
    setCompletion(loadPracticeCompletion())
    setScenarioProgress(loadAllScenarioProgress())
    setHydrated(true)
  }, [])

  const dsaDone = Object.values(completion).reduce((sum, values) => sum + values.length, 0)
  const selected = PATTERN_DIRECTORY.find(pattern => pattern.id === selectedId) ?? PATTERN_DIRECTORY[0]!
  const filteredPatterns = useMemo(() => PATTERN_DIRECTORY.filter(pattern => {
    if (family !== "all" && pattern.family !== family) return false
    if (filter === "recognized") return mastery.recognized.includes(pattern.id)
    if (filter === "review") return mastery.missed.includes(pattern.id)
    if (filter === "transfer") return mastery.transferred.includes(pattern.id)
    return true
  }), [family, filter, mastery])

  const currentStage = lesson?.currentStage ?? "understand"
  const stageIndex = ["understand", "play", "reason", "discover", "design", "implement", "execute", "reflect", "generalize"].indexOf(currentStage)
  const systemsStarted = Object.values(scenarioProgress).filter(progress => progress.status !== "new").length
  const systemsComplete = Object.values(scenarioProgress).filter(progress => progress.status === "complete").length

  if (!hydrated) return <div className="page-loading" role="status">Reading your observatory…</div>

  return (
    <main className="observatory-page">
      <header className="observatory-hero">
        <div>
          <span className="home-eyebrow"><span>Learning Observatory</span><span>your evidence, in motion</span></span>
          <h1>See what is becoming yours.</h1>
          <p>The Observatory turns scattered practice into a navigable landscape: one next move, patterns that need air, and systems you have learned to operate.</p>
        </div>
        <div className="observatory-hero-signal"><span>signal</span><strong>{dsaDone + mastery.transferred.length}</strong><small>evidence points</small></div>
      </header>

      <section className="observatory-now" aria-labelledby="now-heading">
        <div className="observatory-now-copy"><span className="discovery-kicker">Your next useful move</span><h2 id="now-heading">{lesson?.stages.generalize?.completed ? "Transfer the pattern to a new surface." : "Continue the Recursive Leap of Faith."}</h2><p>{lesson ? `You are at Stage ${stageIndex + 1} of 9: ${currentStage}. The next action is small on purpose.` : "Start with the reference derivation. The Observatory will remember the seam."}</p><Link className="observatory-primary" href="/learn/trees/sum-1-to-n">{lesson ? "Continue the derivation" : "Start the derivation"} →</Link></div>
        <div className="observatory-stage-map" aria-label={`${Math.max(stageIndex + 1, 0)} of 9 stages reached`}>{["U", "P", "R", "D", "D", "I", "E", "R", "G"].map((label, index) => <span key={`${label}-${index}`} className={index < stageIndex ? "done" : index === stageIndex ? "current" : ""}>{label}</span>)}</div>
      </section>

      <div className="observatory-grid">
        <section className="observatory-panel pattern-observatory" aria-labelledby="patterns-heading">
          <div className="observatory-panel-head"><div><span className="discovery-kicker">Pattern constellation</span><h2 id="patterns-heading">Your thinking moves</h2></div><Link href="/patterns">Open journal →</Link></div>
          <div className="observatory-stats"><div><b>{mastery.recognized.length}</b><span>recognized</span></div><div><b>{mastery.transferred.length}</b><span>transferred</span></div><div><b>{mastery.missed.length}</b><span>review cues</span></div></div>
          <div className="observatory-filters"><div>{(["all", "recognized", "review", "transfer"] as PatternFilter[]).map(item => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><select value={family} onChange={event => setFamily(event.target.value as PatternFamily | "all")} aria-label="Filter patterns by family"><option value="all">All families</option>{FAMILIES.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="pattern-constellation" role="list" aria-label="Pattern cards">{filteredPatterns.slice(0, 12).map(pattern => <button type="button" role="listitem" key={pattern.id} className={`constellation-node${selected.id === pattern.id ? " selected" : ""}${mastery.transferred.includes(pattern.id) ? " transferred" : mastery.recognized.includes(pattern.id) ? " recognized" : mastery.missed.includes(pattern.id) ? " review" : " untouched"}`} onClick={() => setSelectedId(pattern.id)}><span>{pattern.name}</span><small>{pattern.family}</small></button>)}</div>
          {filteredPatterns.length === 0 && <p className="observatory-empty">No patterns are in this view yet. Change the filter or complete one retrieval question.</p>}
          <PatternDetail pattern={selected} mastery={mastery} />
        </section>

        <section className="observatory-panel system-observatory" aria-labelledby="systems-heading">
          <div className="observatory-panel-head"><div><span className="discovery-kicker">Systems Atelier</span><h2 id="systems-heading">Operate the world</h2></div><Link href="/ai-ml/systems">Open map →</Link></div>
          <p className="observatory-panel-intro">Your systems work is a chain, not a checklist. Each incident makes the next control necessary.</p>
          <div className="system-weather">{systemScenarios.slice(0, 5).map(scenario => { const progress = scenarioProgress[scenario.id]; const active = progress && progress.status !== "new"; return <Link key={scenario.id} href={`/ai-ml/systems/${scenario.id}`} className={`system-weather-row${active ? " active" : ""}`}><span className="system-weather-id">S{scenario.number}</span><span><strong>{scenario.title}</strong><small>{scenario.thinkingMove}</small></span><i>{progress?.status === "complete" ? "complete" : active ? "in motion" : "ready"}</i></Link> })}</div>
          <div className="system-observatory-footer"><span>{systemsStarted}/{systemScenarios.length} systems started</span><b>{systemsComplete} complete</b></div>
        </section>
      </div>

      <section className="observatory-panel topic-observatory" aria-labelledby="topics-heading">
        <div className="observatory-panel-head"><div><span className="discovery-kicker">Curriculum terrain</span><h2 id="topics-heading">Where the work is accumulating</h2></div><Link href="/dashboard">Detailed progress →</Link></div>
        <div className="topic-observatory-grid">{TOPIC_LIST.slice(0, 14).map(topic => { const done = (completion[topic.id] || []).length; const pct = Math.round((done / topic.problems.length) * 100); return <Link key={topic.id} href={`/topic/${topic.id}`} className="topic-observatory-card"><span><strong>{topic.name}</strong><small>{done}/{topic.problems.length}</small></span><div><i style={{ width: `${pct}%` }} /></div></Link> })}</div>
      </section>
    </main>
  )
}

function PatternDetail({ pattern, mastery }: { pattern: PatternDefinition; mastery: PatternMastery }) {
  const state = mastery.transferred.includes(pattern.id) ? "transferred" : mastery.recognized.includes(pattern.id) ? "recognized" : mastery.missed.includes(pattern.id) ? "review" : "not visited"
  return <aside className="pattern-detail"><span className="discovery-kicker">{pattern.family} · {state}</span><h3>{pattern.name}</h3><p>{pattern.move}</p><small>Watch out: {pattern.watchOut}</small><div>{pattern.examples.slice(0, 3).map(example => <span key={example}>{example}</span>)}</div></aside>
}
