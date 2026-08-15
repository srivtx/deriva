"use client"

// /ai-ml/projects/[projectId]/level/[levelId] — the level workbench route.

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getProjectById, getProjectLevel } from "@/curriculum/topics/ai-ml/projects"
import { ProjectLevelWorkbench } from "@/learning/stages/ai/project-level"

export default function ProjectLevelPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const levelId = params.levelId as string

  const project = getProjectById(projectId)
  const level = project ? getProjectLevel(project, levelId) : undefined

  if (!project || !level) {
    return (
      <div className="lesson-missing">
        <h2>Level not found</h2>
        <Link href="/ai-ml/projects">← Back to the project map</Link>
      </div>
    )
  }

  if (level.status !== "authored") {
    return (
      <div className="lesson-missing">
        <h2>{level.title} is coming next</h2>
        <p className="narrative">The level card is real; its content lands in a later phase of the plan.</p>
        <Link href={`/ai-ml/projects/${projectId}`}>← Back to the project brief</Link>
      </div>
    )
  }

  const idx = project.levels.findIndex(l => l.id === level.id)
  const previousLevel = project.levels[idx - 1]
  const nextLevel = project.levels[idx + 1]

  return (
    <div className="lab-page project-level-page">
      <ProjectLevelWorkbench
        projectId={projectId}
        level={level}
        levels={project.levels.map(item => ({
          id: item.id,
          number: item.number,
          title: item.title,
          available: item.status === "authored",
        }))}
        previousLevelId={previousLevel?.id}
        nextLevelId={nextLevel?.id}
        onComplete={() => router.push(`/ai-ml/projects/${projectId}/level/${level.id}/artifact`)}
      />
    </div>
  )
}
