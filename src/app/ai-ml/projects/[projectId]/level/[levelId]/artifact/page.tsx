"use client"

// /ai-ml/projects/[projectId]/level/[levelId]/artifact — the saved artifact:
// evidence, reflection, and the next-level decision (plan §Routes).

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getProjectById, getProjectLevel } from "@/curriculum/topics/ai-ml/projects"
import { loadLevelProgress, type ProjectLevelProgress } from "@/persistence/project-progress"

export default function ArtifactPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const levelId = params.levelId as string

  const project = getProjectById(projectId)
  const level = project ? getProjectLevel(project, levelId) : undefined
  const [progress, setProgress] = useState<ProjectLevelProgress | undefined>(undefined)

  useEffect(() => {
    setProgress(loadLevelProgress(projectId, levelId))
  }, [projectId, levelId])

  if (!project || !level || level.status !== "authored") {
    return (
      <div className="lesson-missing">
        <h2>Artifact not found</h2>
        <Link href="/ai-ml/projects">← Back to the project map</Link>
      </div>
    )
  }

  const idx = project.levels.findIndex(l => l.id === level.id)
  const nextLevel = project.levels[idx + 1]
  const complete = progress?.status === "complete"

  return (
    <div className="lab-page ai-artifact-page">
      <header className="landing-header">
        <span className="home-eyebrow">
          <span>{project.title} / L{level.number} · {level.title}</span>
        </span>
        <h1 className="lab-title">{level.artifact.title}</h1>
      </header>

      {!complete && (
        <div className="lab-coming-next">
          <p className="narrative">This artifact is saved only when the level is complete — tests, fields, reflection, and gate.</p>
          <Link href={`/ai-ml/projects/${projectId}/level/${levelId}`} className="btn-primary as-link">Back to the level →</Link>
        </div>
      )}

      {complete && (
        <>
          <section className="ai-hub-section">
            <span className="experiment-kicker">Artifact evidence</span>
            <div className="artifact-card">
              {level.artifact.fields.map(field => (
                <div key={field.name} className="artifact-item">
                  <b>{field.label}</b>
                  <p className="chain-note">{progress?.artifactValues[field.name] || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ai-hub-section">
            <span className="experiment-kicker">Reflection</span>
            <p className="narrative">{progress?.reflection || "—"}</p>
          </section>

          <section className="ai-hub-section">
            <span className="experiment-kicker">Outputs carried forward</span>
            <div className="artifact-fields">
              {level.artifact.outputs.map(output => (
                <span key={output} className="artifact-field-chip">{output}</span>
              ))}
            </div>
          </section>

          <div className="level-actions">
            {nextLevel
              ? <Link href={`/ai-ml/projects/${projectId}/level/${nextLevel.id}`} className="btn-primary as-link">Next level: {nextLevel.title} →</Link>
              : <Link href={`/ai-ml/projects/${projectId}`} className="btn-primary as-link">Project complete — back to the brief →</Link>}
            <Link href={`/ai-ml/projects/${projectId}/level/${levelId}`} className="btn-ghost as-link">Review the level</Link>
          </div>
        </>
      )}
    </div>
  )
}
