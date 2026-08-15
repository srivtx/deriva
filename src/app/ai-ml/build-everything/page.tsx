"use client"

// /ai-ml/build-everything — the source sequence plus Deriva's production
// extensions. Progress is local-first and never changes the static curriculum.

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  buildEverythingFeaturedPath,
  buildEverythingProjects,
  buildEverythingTiers,
} from "@/curriculum/topics/ai-ml/build-everything"
import { loadAllBuildEverythingProgress, type BuildEverythingProgress } from "@/persistence/build-everything-progress"

export default function BuildEverythingPage() {
  const [progress, setProgress] = useState<Record<string, BuildEverythingProgress>>({})

  useEffect(() => {
    setProgress(loadAllBuildEverythingProgress())
  }, [])

  const completedCount = buildEverythingProjects.filter(project => progress[project.id]?.exitGatePassed).length
  const startedCount = buildEverythingProjects.filter(project => {
    const saved = progress[project.id]
    return Boolean(saved && (saved.attempts > 0 || saved.exitGatePassed || saved.editorDraft !== project.implementation?.starter))
  }).length

  return (
    <div className="lab-page build-everything-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>Build Everything · 37 projects</span></span>
        <h1 className="lab-title">From a gradient step to a DeepSeek replica.</h1>
        <p className="narrative">
          A first-principles AI/ML path mapped from the supplied Build Everything book:
          type the mechanism, run it, break one assumption, and carry the artifact into
          the next build.
        </p>
      </header>

      <section className="build-everything-progress-strip" aria-label="Build Everything progress">
        <div><span className="experiment-kicker">Your build ledger</span><b>{completedCount}/{buildEverythingProjects.length} artifacts complete</b></div>
        <div className="build-everything-progress-meter" aria-hidden="true"><span style={{ width: `${buildEverythingProjects.length ? (completedCount / buildEverythingProjects.length) * 100 : 0}%` }} /></div>
        <span className="chain-note">{startedCount ? `${startedCount} started · local progress saved on this device` : "Start any project; code is always available immediately."}</span>
      </section>

      <section className="build-everything-featured">
        <span className="experiment-kicker">Recommended first arc</span>
        <div className="build-everything-featured-row">
          {buildEverythingFeaturedPath.map((code, index) => {
            const project = buildEverythingProjects.find(item => item.code === code)!
            return (
              <span key={code} className="build-everything-featured-item">
                <Link href={`/ai-ml/build-everything/${project.id}`}>
                  <b>{code}</b> {project.title}
                </Link>
                {index < buildEverythingFeaturedPath.length - 1 && <span className="build-everything-arrow">→</span>}
              </span>
            )
          })}
        </div>
        <p className="chain-note">The book foregrounds this arc; the full atomic tier fills in the supporting mechanisms.</p>
      </section>

      <div className="build-everything-tier-list">
        {buildEverythingTiers.map(tier => {
          const projects = buildEverythingProjects.filter(project => project.tier === tier.id)
          return (
            <section key={tier.id} className="build-everything-tier">
              <div className="build-everything-tier-head">
                <div>
                  <span className="experiment-kicker">{tier.label}</span>
                  <p className="chain-note">{tier.description}</p>
                </div>
                <span className="project-progress">{projects.length} projects</span>
              </div>
              <div className="build-everything-grid">
                {projects.map(project => {
                  const saved = progress[project.id]
                  const complete = Boolean(saved?.exitGatePassed)
                  const started = Boolean(saved && (saved.attempts > 0 || saved.editorDraft !== project.implementation?.starter))
                  return (
                  <Link key={project.id} href={`/ai-ml/build-everything/${project.id}`} className={`build-everything-card${complete ? " complete" : started ? " started" : ""}`}>
                    <div className="build-everything-card-top">
                      <span className="build-everything-code">{project.code}</span>
                      <span className="build-everything-lines">{project.lines} lines · {formatDuration(project.durationMinutes)}</span>
                    </div>
                    <b>{project.title}</b>
                    <span className="build-everything-cool">{project.coolFactor}</span>
                    <span className="build-everything-move">one move: {project.thinkingMove}</span>
                    <span className="build-everything-card-foot"><span>{complete ? "✓ Artifact complete" : started ? "In progress · resume anytime" : project.implementation ? "Problem + editor + tests ready" : "Brief mapped · workspace next"}</span> · {project.dependencies.length ? `after ${project.dependencies.map(dep => dep.toUpperCase()).join(", ")}` : "starting point"} →</span>
                  </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <section className="artifact-chain build-everything-rules">
        <span className="experiment-kicker">How to use this lane</span>
        <div className="build-everything-rule-grid">
          <div><b>Type every line</b><span>No copy-paste; make the mechanism yours.</span></div>
          <div><b>Run every project</b><span>Compare output and debug the mismatch.</span></div>
          <div><b>Break one assumption</b><span>Change one cause and record the effect.</span></div>
          <div><b>Carry the artifact</b><span>Each build is a dependency for the next.</span></div>
        </div>
      </section>
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `~${hours} hr` : `~${hours.toFixed(1)} hr`
}
