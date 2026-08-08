// Derived notification inbox. Notifications point to the next useful action;
// they never lock routes or interrupt a lesson.

import { TOPICS, TOPIC_LIST } from "../data"
import { PATTERN_LEARNING_PATH } from "../data/patterns"
import { loadPatternQuizProgress } from "./pattern-quiz"
import { loadPatternMastery } from "./pattern-mastery"
import { loadPracticeCompletion, loadPracticePositions, loadPracticeTopic } from "./practice-progress"

export type AppNotification = {
  id: string
  title: string
  body: string
  href: string
  kind: "path" | "practice" | "quiz" | "review"
}

const READ_KEY = "deriva-notifications-read-v1"

export function loadAppNotifications(): AppNotification[] {
  const positions = loadPracticePositions()
  const completion = loadPracticeCompletion()
  const topicId = loadPracticeTopic() || TOPIC_LIST[0].id
  const topic = TOPICS[topicId] || TOPIC_LIST[0]
  const problemId = topic.problems.some(problem => problem.id === positions[topic.id]) ? positions[topic.id] : topic.problems[0].id
  const problem = topic.problems.find(item => item.id === problemId) || topic.problems[0]
  const nextPath = PATTERN_LEARNING_PATH.find(step => (completion[step.topicId] || []).length < (TOPICS[step.topicId]?.problems.length || 1))
  const quiz = loadPatternQuizProgress()
  const mastery = loadPatternMastery()
  const reviewId = mastery.missed[0]
  const reviewPattern = PATTERN_LEARNING_PATH.flatMap(step => [...step.newPatternIds, ...step.revisitPatternIds]).find(id => id === reviewId)

  return [
    ...(nextPath ? [{
      id: `path:${nextPath.topicId}`,
      title: `Next on the path: ${nextPath.topicName}`,
      body: `${nextPath.title}. Nothing is locked; this is simply the most useful next move.`,
      href: `/patterns#${nextPath.newPatternIds[0] || nextPath.topicId}`,
      kind: "path" as const,
    }] : []),
    {
      id: `practice:${topic.id}:${problem.id}`,
      title: `Resume ${topic.name}`,
      body: `Problem ${problem.id}: ${problem.title}`,
      href: `/practice?topic=${topic.id}&problem=${problem.id}`,
      kind: "practice" as const,
    },
    ...(!quiz.completed ? [{
      id: "quiz:continue",
      title: quiz.answered ? "Continue Pattern Quiz" : "Start your first Pattern Quiz block",
      body: quiz.answered ? `${quiz.answered} of 35 questions answered. Your next block is ready.` : "Five questions is one complete session.",
      href: "/patterns/quiz",
      kind: "quiz" as const,
    }] : []),
    ...(reviewPattern ? [{
      id: `review:${reviewPattern}`,
      title: "Review one missed pattern",
      body: "A short revisit now will make the next recognition question easier.",
      href: `/patterns#${reviewPattern}`,
      kind: "review" as const,
    }] : []),
  ]
}

export function loadReadNotificationIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY) || "[]")
    return Array.isArray(raw) ? raw.filter(item => typeof item === "string") : []
  } catch {
    return []
  }
}

export function markNotificationRead(id: string) {
  const read = new Set(loadReadNotificationIds())
  read.add(id)
  try { localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-50))) } catch {}
}

export function markAllNotificationsRead(ids: string[]) {
  const read = new Set(loadReadNotificationIds())
  ids.forEach(id => read.add(id))
  try { localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-50))) } catch {}
}
