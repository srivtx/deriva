"use client"

// /ai-ml/systems — the Systems Atelier ladder (system-ai/systems-atelier-plan.md
// §Routes). Eight scenarios, one interaction phenomenon each. Cards show the
// thinking move, the naive/fixed run state, and gate progress.

import { useEffect, useState } from "react"
import Link from "next/link"
import { systemScenarios } from "@/curriculum/topics/ai-ml/systems"
import { loadAllScenarioProgress, type ScenarioStatus } from "@/persistence/system-scenario-progress"

const STAGE_LABEL: Record<ScenarioStatus, string> = {
  "new": "Not started",
  "gates-passed": "Gates passed",
  "naive-done": "Naive run done",
  "fixed-done": "Gates passed",
  "complete": "Complete",
}

export default function SystemsPage() {
  const [progress, setProgress] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    const out: Record<string, Record<string, string>> = {}
    for (const scenario of systemScenarios) {
      const saved = loadAllScenarioProgress()[scenario.id]
      if (saved) {
        out[scenario.id] = {
          status: saved.status,
          gatesPassed: saved.fixedSummary ? `${saved.fixedSummary.gatesPassed}/${saved.fixedSummary.gatesTotal}` : saved.naiveSummary ? "0/…" : "",
          p99: saved.fixedSummary ? `${saved.fixedSummary.p99}ms` : saved.naiveSummary ? `${saved.naiveSummary.p99}ms` : "",
        }
      }
    }
    setProgress(out)
  }, [])

  return (
    <div className="lab-page ai-systems-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>Systems Atelier</span></span>
        <h1 className="lab-title">Build systems. Watch them interact.</h1>
        <p className="narrative">
          Beta slice: two scenarios, one interaction phenomenon each. You write the component
          handlers and the policies — timeouts, retries, caches, workers. The platform
          supplies the load and the failure. The naive policy runs first, always, because
          the collapse is the lesson.
        </p>
      </header>

      <div className="project-map">
        {systemScenarios.map(scenario => {
          const saved = progress[scenario.id]
          const done = saved?.status === "complete" || saved?.status === "fixed-done"
          return (
            <article key={scenario.id} className="project-card">
              <div className="project-card-head">
                <span className="lab-kicker">S{scenario.number} · {scenario.thinkingMove}</span>
                <span className="project-progress">{saved ? STAGE_LABEL[saved.status as ScenarioStatus] : "Not started"}</span>
              </div>
              <Link href={`/ai-ml/systems/${scenario.id}`} className="project-card-title">{scenario.title}</Link>
              <p className="project-card-pitch">{scenario.pitch}</p>
              <ol className="project-level-rows brief">
                <li className={`project-level-row ${done ? "done" : "ready"}`}>
                  <span className="project-level-num">move</span>
                  <span className="project-level-title"><small>{scenario.thinkingMove}</small></span>
                  <span className="project-level-status">{saved?.gatesPassed ? `${saved.gatesPassed} gates` : "design gates first"}</span>
                  <span className="project-level-chevron">›</span>
                </li>
              </ol>
              {saved?.p99 && <span className="project-resume">Fixed run p99: {saved.p99}</span>}
            </article>
          )
        })}
      </div>

      <section className="artifact-chain">
        <span className="experiment-kicker">Planned horizon · S1–S8</span>
        <p className="chain-note">
          queueing in a latency tail → synchronous coupling → retry storms → caching and the
          herd → backpressure → partitioning → replication and staleness → the incident.
          Every scenario reuses the same transport: only your policies change between the
          naive run and the fixed run.
        </p>
      </section>
    </div>
  )
}
