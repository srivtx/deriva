// Curriculum registry — auto-discovers topic folders
// In v0: static imports. In v1+: dynamic import() with manifest.

import type { LessonModule } from "./schema/lesson"

// Placeholder — lesss are authored into this registry as they are created.
export const lessonRegistry: Record<string, () => Promise<{ default: LessonModule }>> = {}

export function registerLesson(id: string, loader: () => Promise<{ default: LessonModule }>) {
  lessonRegistry[id] = loader
}

export async function getLesson(id: string): Promise<LessonModule | undefined> {
  const loader = lessonRegistry[id]
  if (!loader) return undefined
  const mod = await loader()
  return mod.default
}

export function listLessonsByTopic(topic: string): string[] {
  return Object.keys(lessonRegistry).filter(id => id.startsWith(topic + "/"))
}
