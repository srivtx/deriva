"use client"

// /ai-ml/projects — the project map (system-ai/ml-projects-plan.md §Target
// experience). Every card: family, pitch, progress 0/5–5/5, five level rows,
// dependency ordering, one-column mobile.

import { useEffect, useState } from "react"
import Link from "next/link"
import { systemsProjects } from "@/curriculum/topics/ai-ml/projects"
import { loadProjectLevels } from "@/persistence/project-progress"

function statusClass(status: string, authored: boolean, available: boolean): string {
  if (status === "complete") return "done"
  if (status === "tests-passing" || status === "started") return "current"
  if (!authored) return "planned"
  return available ? "ready" : "locked"
}

export default function ProjectsPage() {
  const [progressByProject, setProgressByProject] = useState<Record<string, Record<string, { status: string }>>>({})

  useEffect(() => {
    const out: Record<string, Record<string, { status: string }>> = {}
    for (const project of systemsProjects) {
      out[project.id] = loadProjectLevels(project.id)
    }
    setProgressByProject(out)
  }, [])

  return (
    <div className="lab-page ai-projects-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>Systems Projects</span></span>
        <h1 className="lab-title">Build the pipeline. Ship the system.</h1>
        <p className="narrative">
          Fifteen cumulative builds. Every project has exactly five levels — define the
          contract, preserve an invariant, measure behavior, bound a failure, and make an
          operational decision.
        </p>
      </header>

      <div className="project-map">
        {systemsProjects.map(project => {
          const progress = progressByProject[project.id] ?? {}
          const done = project.levels.filter(level => progress[level.id]?.status === "complete").length
          const currentLevel = project.levels.find(level => {
            const s = progress[level.id]?.status
            return s === "started" || s === "tests-passing"
          })
          return (
            <article key={project.id} className="project-card">
              <div className="project-card-head">
                <span className="lab-kicker">{project.family} · {project.levels.length} levels</span>
                <span className="project-progress">{done}/{project.levels.length}</span>
              </div>
              <Link href={`/ai-ml/projects/${project.id}`} className="project-card-title">{project.title}</Link>
              <p className="project-card-pitch">{project.pitch}</p>
              <ol className="project-level-rows">
                {project.levels.map(level => {
                  const status = progress[level.id]?.status ?? "new"
                  const previous = project.levels[level.number - 2]
                  const available = level.status === "authored" && (level.number === 1 || progress[previous?.id ?? ""]?.status === "complete")
                  const rowContent = (
                    <>
                      <span className="project-level-num">L{level.number}</span>
                      <span className="project-level-title">{level.title}</span>
                      <span className="project-level-time">~{level.durationMinutes} min</span>
                      <span className="project-level-chevron">›</span>
                    </>
                  )
                  return (
                    <li key={level.id} className={`project-level-row ${statusClass(status, level.status === "authored", available)}`}>
                      {available
                        ? <Link href={`/ai-ml/projects/${project.id}/level/${level.id}`} className="project-level-link">{rowContent}</Link>
                        : rowContent}
                    </li>
                  )
                })}
              </ol>
              {currentLevel && (
                <span className="project-resume">Resume: {currentLevel.title} →</span>
              )}
            </article>
          )
        })}
      </div>

      <section className="artifact-chain">
        <span className="experiment-kicker">The artifact chain across projects</span>
        <p className="chain-note">
          dataset card → release → feature contract → baseline report → model artifact →
          experiment table → error taxonomy → API contract → queue policy → retrieval index →
          grounded-answer eval → registry record → SLO report → final design review.
          Every project loads the previous artifacts by ID — keep, revise, or reject, with a
          persisted explanation.
        </p>
      </section>
    </div>
  )
}
