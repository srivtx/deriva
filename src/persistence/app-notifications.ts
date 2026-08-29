// Derived notification inbox. Notifications point to the next useful action;
// they never lock routes or interrupt a lesson.

import { PATTERN_LEARNING_PATH } from "../data/patterns"
import { getNextActions } from "../learning/next-actions"
import { loadPatternQuizProgress } from "./pattern-quiz"
import { loadPatternMastery } from "./pattern-mastery"

export type AppNotification = {
  id: string
  title: string
  body: string
  href: string
  kind: "practice" | "patterns" | "design" | "lld" | "db" | "ultron" | "quiz" | "review"
}

const READ_KEY = "deriva-notifications-read-v1"

export function loadAppNotifications(): AppNotification[] {
  const nextActions = getNextActions()
  const quiz = loadPatternQuizProgress()
  const mastery = loadPatternMastery()
  const reviewId = mastery.missed[0]
  const reviewPattern = PATTERN_LEARNING_PATH.flatMap(step => [...step.newPatternIds, ...step.revisitPatternIds]).find(id => id === reviewId)

  return [
    ...nextActions.map(action => ({
      id: `next:${action.id}`,
      title: `${action.eyebrow}: ${action.title}`,
      body: action.description,
      href: action.href,
      kind: action.kind,
    })),
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
