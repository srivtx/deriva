// /ai-ml/build-everything/[projectId] — one Build Everything project as a
// five-move build contract. The first 37 are PDF-mapped; the extension tier is
// Deriva-authored production curriculum beyond the source sequence.

import Link from "next/link"
import { notFound } from "next/navigation"
import {
  buildEverythingProjects,
  getBuildEverythingProject,
} from "@/curriculum/topics/ai-ml/build-everything"

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function BuildEverythingProjectPage({ params }: Props) {
  const { projectId } = await params
  const project = getBuildEverythingProject(projectId)
  if (!project) notFound()

  const previous = buildEverythingProjects.find(item => item.order === project.order - 1)
  const next = buildEverythingProjects.find(item => item.order === project.order + 1)

  return (
    <div className="lab-page build-everything-project-page">
      <header className="build-everything-project-header">
        <Link href="/ai-ml/build-everything" className="practice-lab-back">← Build Everything</Link>
        <div className="build-everything-project-kicker">
          <span className="build-everything-code">{project.code}</span>
          <span>{tierLabel(project.tier)}</span>
          <span>{project.lines} lines · {formatDuration(project.durationMinutes)}</span>
        </div>
        <h1 className="lab-title">{project.title}</h1>
        <p className="build-everything-cool large">{project.coolFactor}</p>
        <p className="narrative">one move: <b>{project.thinkingMove}</b></p>
      </header>

      <div className="build-everything-project-meta">
        <section className="build-everything-panel">
          <span className="experiment-kicker">Theory</span>
          <p className="narrative">{project.theory}</p>
        </section>
        <section className="build-everything-panel">
          <span className="experiment-kicker">Reuses</span>
          <p className="chain-note">{project.sourceReuse}</p>
          {project.dependencies.length > 0 && (
            <div className="build-everything-dependencies">
              {project.dependencies.map(dependency => (
                <span key={dependency} className="artifact-field-chip">{dependency.toUpperCase()}</span>
              ))}
            </div>
          )}
          {project.externalDependencies.length > 0 && <p className="chain-note">External concepts: {project.externalDependencies.join(", ")}</p>}
        </section>
      </div>

      <section className={`build-everything-workspace-cta${project.implementation ? " ready" : ""}`}>
        <div>
          <span className="experiment-kicker">{project.implementation ? "Executable workspace" : "Mapped project"}</span>
          <p className="narrative">
            {project.implementation
              ? "Open the code pane immediately, then use the Spec tab, optional design question, tests, and artifact when you want them."
              : "This brief is complete, but the coding contract is not authored yet. It will get the same problem → editor → tests → artifact flow as A1."}
          </p>
        </div>
        {project.implementation
          ? <Link href={`/ai-ml/build-everything/${project.id}/workbench`} className="btn-primary as-link">Open coding workspace →</Link>
          : <span className="build-everything-workspace-status">Workspace being authored</span>}
      </section>

      <section className="build-everything-steps-section">
        <div className="build-everything-section-head">
          <div>
            <span className="experiment-kicker">The build, step by step</span>
            <p className="chain-note">Finish each move before carrying the artifact forward.</p>
          </div>
          <span className="project-progress">5 moves</span>
        </div>
        <ol className="build-everything-steps">
          {project.steps.map(step => (
            <li key={step.id} className={`build-everything-step ${step.kind}`}>
              <span className="build-everything-step-number">{step.number}</span>
              <div className="build-everything-step-main">
                <span className="build-everything-step-kind">{step.kind}</span>
                <h2>{step.title}</h2>
                <p>{step.prompt}</p>
                <span className="build-everything-deliverable">Deliverable: {step.deliverable}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="build-everything-panel build-everything-verification">
        <span className="experiment-kicker">Verification target</span>
        <p className="narrative">{project.verify}</p>
        <div className="build-everything-experiment">
          <span className="experiment-kicker">Try this</span>
          <p>{project.experiment}</p>
        </div>
        <div className="build-everything-artifact">
          <span className="experiment-kicker">Artifact to carry forward</span>
          <p>{project.artifact}</p>
        </div>
      </section>

      <nav className="build-everything-project-nav" aria-label="Build Everything project navigation">
        {previous ? <Link href={`/ai-ml/build-everything/${previous.id}`} className="btn-ghost as-link">← {previous.code} {previous.title}</Link> : <span />}
        <span className="chain-note">Project {project.order} of {buildEverythingProjects.length}</span>
        {next ? <Link href={`/ai-ml/build-everything/${next.id}`} className="btn-primary as-link">{next.code} {next.title} →</Link> : <Link href="/ai-ml/build-everything" className="btn-primary as-link">Back to the map →</Link>}
      </nav>

      <p className="build-everything-source">{project.sourcePage > 0 ? `Mapped from the supplied Build Everything PDF, source page ${project.sourcePage}.` : "Deriva-authored extension beyond the supplied PDF."} The five moves are Deriva’s implementation contract for this project.</p>
    </div>
  )
}

function tierLabel(tier: string): string {
  return ({ atomic: "Tier 0 · Atomic", combination: "Tier 1 · Combination", system: "Tier 2 · Real system", frontier: "Tier 3 · Frontier", extension: "Deriva extension · Trustworthy AI" } as Record<string, string>)[tier] ?? tier
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const hours = minutes / 60
  return Number.isInteger(hours) ? `~${hours} hr` : `~${hours.toFixed(1)} hr`
}
