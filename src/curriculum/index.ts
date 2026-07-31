// Curriculum registry — static imports; every module self-validates via
// defineLesson() at module scope, so an invalid lesson fails `pnpm build` (C1).

import type { LessonModule } from "./schema/lesson"
import sum1toN from "./topics/trees/00-recursion-reflex/sum-1-to-n"

const lessons: LessonModule[] = [sum1toN]

const byId = new Map(lessons.map(l => [l.id as string, l]))
const byRoute = new Map(lessons.map(l => [`${l.topic}/${l.routeSlug}`, l]))

export function listLessons(): LessonModule[] {
  return lessons
}

export function getLessonByRoute(topic: string, slug: string): LessonModule | undefined {
  return byRoute.get(`${topic}/${slug}`)
}

export function getLessonById(id: string): LessonModule | undefined {
  return byId.get(id)
}
