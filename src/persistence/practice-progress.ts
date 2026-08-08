// Daily practice position — local-first, one remembered problem per topic.

const KEY = "deriva-practice-position-v1"

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
