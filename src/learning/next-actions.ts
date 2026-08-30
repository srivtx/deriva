// One derived queue powers Home and the notification inbox. It reads progress
// through persistence modules and never writes or touches browser storage.

import { TOPICS, TOPIC_LIST } from "../data"
import { PATTERN_DIRECTORY, PATTERN_LEARNING_PATH } from "../data/patterns"
import { PROBLEMS_DESIGN } from "../data/system-design"
import { PROBLEMS_LLD } from "../data/lld"
import { PROBLEMS_DB } from "../data/db"
import { PROBLEMS_ULTRON } from "../data/ultron"
import { PROBLEMS_PDB } from "../data/pdb"
import { loadPatternDeskProgress } from "../persistence/pattern-desk-progress"
import { loadPatternMastery } from "../persistence/pattern-mastery"
import { loadPracticeCompletion, loadPracticePositions, loadPracticeTopic } from "../persistence/practice-progress"
import { loadWorkbenchProgress, type WorkbenchKind } from "../persistence/workbench-progress"

export type NextActionKind = "practice" | "patterns" | "design" | "lld" | "db" | "ultron" | "pdb"

export interface NextAction {
  id: NextActionKind
  kind: NextActionKind
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  progress?: { completed: number; total: number }
}

function workbenchAction(kind: WorkbenchKind, hrefBase: string, label: string, problems: { id: number; title: string }[]): NextAction {
  const saved = loadWorkbenchProgress(kind)
  const currentId = problems.some(problem => problem.id === saved.currentId) ? saved.currentId : problems[0].id
  const current = problems.find(problem => problem.id === currentId) || problems[0]
  const completed = saved.completed.filter(id => problems.some(problem => problem.id === id)).length
  const kindLabel = kind === "design" ? "design" : kind === "db" ? "SQL" : kind === "ultron" ? "AI/ML" : kind === "pdb" ? "debugging" : "object design"
  return {
    id: kind,
    kind,
    eyebrow: label,
    title: current.title,
    description: `${kindLabel} problem ${current.id} · ${completed}/${problems.length} complete`,
    cta: completed > 0 ? "Continue" : "Start",
    href: `${hrefBase}?problem=${current.id}`,
    progress: { completed, total: problems.length },
  }
}

export function getNextActions(): NextAction[] {
  const completion = loadPracticeCompletion()
  const positions = loadPracticePositions()
  const topicId = loadPracticeTopic()
  const topic = (topicId && TOPICS[topicId]) || TOPIC_LIST[0]
  const savedProblemId = positions[topic.id]
  const problem = topic.problems.find(item => item.id === savedProblemId) || topic.problems[0]
  const completed = (completion[topic.id] || []).length

  const mastery = loadPatternMastery()
  const desk = loadPatternDeskProgress()
  const nextPath = PATTERN_LEARNING_PATH.find(step => {
    const topic = TOPICS[step.topicId]
    return topic && (completion[step.topicId] || []).length < topic.problems.length
  }) || PATTERN_LEARNING_PATH[PATTERN_LEARNING_PATH.length - 1]
  const pathPatternId = [...nextPath.newPatternIds, ...nextPath.revisitPatternIds]
    .find(id => PATTERN_DIRECTORY.some(pattern => pattern.id === id))
  const targetPatternId = [desk.currentPatternId, mastery.missed[0], pathPatternId]
    .find(id => !!id && PATTERN_DIRECTORY.some(pattern => pattern.id === id)) || PATTERN_DIRECTORY[0].id
  const targetPattern = PATTERN_DIRECTORY.find(pattern => pattern.id === targetPatternId) || PATTERN_DIRECTORY[0]

  return [
    {
      id: "practice",
      kind: "practice",
      eyebrow: "Resume DSA",
      title: topic.name,
      description: `Problem ${problem.id} · ${problem.title} · ${completed}/${topic.problems.length} complete`,
      cta: "Open practice",
      href: `/practice?topic=${topic.id}&problem=${problem.id}`,
      progress: { completed, total: topic.problems.length },
    },
    {
      id: "patterns",
      kind: "patterns",
      eyebrow: "Pattern Desk",
      title: targetPattern.name,
      description: desk.currentPatternId === targetPattern.id
        ? "Resume the last pattern you opened."
        : mastery.missed.includes(targetPattern.id)
          ? "A missed cue is waiting for one calm review."
          : "The next mental move in the recommended route.",
      cta: "Open Pattern Desk",
      href: `/patterns#${targetPattern.id}`,
    },
    workbenchAction("design", "/design", "Resume HLD", PROBLEMS_DESIGN),
    workbenchAction("lld", "/lld", "Resume LLD", PROBLEMS_LLD),
    workbenchAction("db", "/db", "Resume SQL", PROBLEMS_DB),
    workbenchAction("ultron", "/ultron", "Resume AI/ML", PROBLEMS_ULTRON),
    workbenchAction("pdb", "/pdb", "Resume Debugging", PROBLEMS_PDB),
  ]
}
