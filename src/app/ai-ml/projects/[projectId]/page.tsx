"use client"

// /ai-ml/projects/[projectId] — project brief: user story, five levels with
// dependency ordering, artifact chain, and Start/Resume.

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getProjectById } from "@/curriculum/topics/ai-ml/projects"
import { loadProjectLevels } from "@/persistence/project-progress"

export default function ProjectBriefPage() {
  const params = useParams()
  const project = useMemo(() => getProjectById(params.projectId as string), [params.projectId])

  const [progress, setProgress] = useState<Record<string, { status: string }>>({})

  useEffect(() => {
    setProgress(project ? loadProjectLevels(project.id) : {})
  }, [project])

  if (!project) {
    return (
      <div className="lesson-missing">
        <h2>Project not found</h2>
        <Link href="/ai-ml/projects">← Back to the project map</Link>
      </div>
    )
  }

  const doneCount = project.levels.filter(level => progress[level.id]?.status === "complete").length

  return (
    <div className="lab-page ai-project-brief">
      <header className="landing-header">
        <span className="home-eyebrow">
          <span>Project {project.number} · {project.family}</span>
          <span className="project-progress">{doneCount}/{project.levels.length} complete</span>
        </span>
        <h1 className="lab-title">{project.title}</h1>
        <p className="narrative">{project.userStory}</p>
        {project.prerequisites.length > 0 && (
          <p className="chain-note">requires artifacts from: {project.prerequisites.join(", ")}</p>
        )}
      </header>

      <ol className="project-level-rows brief">
        {project.levels.map(level => {
          const status = progress[level.id]?.status ?? "new"
          const prevDone = level.number === 1 || (progress[project.levels[level.number - 2]!.id]?.status === "complete")
          const href = status === "complete" || status === "started" || status === "tests-passing"
            ? `/ai-ml/projects/${project.id}/level/${level.id}`
            : prevDone || level.number === 1
              ? `/ai-ml/projects/${project.id}/level/${level.id}`
              : undefined
          const rowContent = (
            <>
              <span className="project-level-num">L{level.number}</span>
              <span className="project-level-title">
                {level.title}
                <small>{level.thinkingMove} · ~{level.durationMinutes} min</small>
              </span>
              <span className="project-level-status">
                {status === "complete" ? "complete ✓" : status === "started" || status === "tests-passing" ? "resume →" : prevDone || level.number === 1 ? "start →" : "locked"}
              </span>
            </>
          )
          return (
            <li key={level.id} className={`project-level-row ${status === "complete" ? "done" : status === "started" || status === "tests-passing" ? "current" : prevDone || level.number === 1 ? "" : "locked"}`}>
              {href ? <Link href={href} className="project-level-link">{rowContent}</Link> : rowContent}
            </li>
          )
        })}
      </ol>

      <section className="artifact-chain">
        <span className="experiment-kicker">Artifacts this project produces</span>
        {project.levels[0]!.status === "authored"
          ? project.levels.map(level => (
              <div key={level.id} className="artifact-item">
                <b>L{level.number} · {level.title}</b>
                {level.status === "authored" && <span className="artifact-kind">outputs: {level.artifact.outputs.join(", ")}</span>}
              </div>
            ))
          : <p className="chain-note">Levels are authored next in the plan — the card is real, the content lands in a later phase.</p>}
      </section>
    </div>
  )
}
