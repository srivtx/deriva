// Executable workspace for a Build Everything project. A project only gets
// this surface after its problem contract and tests have been authored.

import Link from "next/link"
import { notFound } from "next/navigation"
import { getBuildEverythingProject } from "@/curriculum/topics/ai-ml/build-everything"
import type { BuildEverythingImplementation, BuildEverythingProject } from "@/curriculum/schema/build-everything"
import { BuildEverythingWorkbench } from "@/learning/stages/ai/build-everything-workbench"

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function BuildEverythingWorkbenchPage({ params }: Props) {
  const { projectId } = await params
  const project = getBuildEverythingProject(projectId)
  if (!project) notFound()

  if (!project.implementation) {
    return (
      <div className="lab-page build-everything-workbench-page">
        <Link href={`/ai-ml/build-everything/${project.id}`} className="practice-lab-back">← {project.code} brief</Link>
        <div className="build-everything-not-ready">
          <span className="experiment-kicker">Workspace not authored yet</span>
          <h1 className="lab-title">{project.title}</h1>
          <p className="narrative">This project is mapped with theory, five build moves, verification, and an artifact target. Its executable problem statement, starter code, and hidden tests are being authored next.</p>
          <p className="chain-note">Nothing is marked complete until the contract can run in the same sandbox as A1.</p>
          <Link href={`/ai-ml/build-everything/${project.id}`} className="btn-primary as-link">Read the project brief →</Link>
        </div>
      </div>
    )
  }

  const authoredProject = project as BuildEverythingProject & { implementation: BuildEverythingImplementation }
  return (
    <div className="lab-page build-everything-workbench-page">
      <BuildEverythingWorkbench project={authoredProject} />
    </div>
  )
}
