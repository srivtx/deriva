// Daily practice position — local-first, one remembered problem per topic.

const KEY = "deriva-practice-position-v1"
const TOPIC_KEY = "deriva-topic-v1"
const COMPLETED_KEY = "deriva-completed-v2"

export type PracticePositions = Record<string, number>

export function loadPracticePositions(): PracticePositions {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(raw)
        .map(([topicId, value]) => [topicId, Number(value)] as const)
        .filter(([, value]) => Number.isInteger(value) && value > 0),
    )
  } catch {
    return {}
  }
}

export function savePracticePosition(topicId: string, problemId: number) {
  const positions = loadPracticePositions()
  positions[topicId] = problemId
  try { localStorage.setItem(KEY, JSON.stringify(positions)) } catch {}
}

export function loadPracticeTopic(): string | undefined {
  if (typeof window === "undefined") return undefined
  try { return localStorage.getItem(TOPIC_KEY) || undefined } catch { return undefined }
}

export function loadPracticeCompletion(): Record<string, number[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = JSON.parse(localStorage.getItem(COMPLETED_KEY) || "{}") as Record<string, unknown>
    return Object.fromEntries(Object.entries(raw).map(([topicId, values]) => [
      topicId,
      Array.isArray(values) ? values.filter(value => Number.isInteger(Number(value))).map(Number) : [],
    ]))
  } catch {
    return {}
  }
}
