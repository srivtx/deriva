// Mock interview session — timed problem with hints locked, self-scored debrief.

const ACTIVE_KEY = "deriva-interview-v1"
const HISTORY_KEY = "deriva-interview-history-v1"

export type ActiveInterview = {
  topicId: string
  problemId: number
  problemTitle: string
  difficulty: string
  startedAt: number
  durationMs: number
  solvedAt: number | null
}

export type InterviewDebrief = {
  id: string
  problemTitle: string
  difficulty: string
  finishedAt: number
  durationMs: number
  solved: boolean
  scores: { correctness: number; complexity: number; communication: number }
  note: string
}

export function getActiveInterview(): ActiveInterview | null {
  if (typeof window === "undefined") return null
  try {
    const raw = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null") as Partial<ActiveInterview> | null
    if (!raw || typeof raw.startedAt !== "number" || typeof raw.problemId !== "number") return null
    return {
      topicId: raw.topicId ?? "trees",
      problemId: raw.problemId,
      problemTitle: raw.problemTitle ?? "Problem",
      difficulty: raw.difficulty ?? "Medium",
      startedAt: raw.startedAt,
      durationMs: raw.durationMs ?? 25 * 60_000,
      solvedAt: typeof raw.solvedAt === "number" ? raw.solvedAt : null,
    }
  } catch {
    return null
  }
}

export function startInterview(session: Omit<ActiveInterview, "solvedAt">) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...session, solvedAt: null })) } catch {}
}

export function recordInterviewSolved(problemId: number) {
  const session = getActiveInterview()
  if (!session || session.problemId !== problemId || session.solvedAt) return
  session.solvedAt = Date.now()
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(session)) } catch {}
}

export function endInterview(debrief: Omit<InterviewDebrief, "id" | "finishedAt">) {
  const result: InterviewDebrief = { ...debrief, id: `interview-${Date.now()}`, finishedAt: Date.now() }
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as InterviewDebrief[]
    localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...history].slice(0, 20)))
    localStorage.removeItem(ACTIVE_KEY)
  } catch {}
  return result
}

export function cancelInterview() {
  try { localStorage.removeItem(ACTIVE_KEY) } catch {}
}

export function interviewHistory(): InterviewDebrief[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as InterviewDebrief[]
    return raw.filter(entry => typeof entry.finishedAt === "number")
  } catch {
    return []
  }
}
