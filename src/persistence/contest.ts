// Contest simulator state — one active virtual contest, scored locally.

const ACTIVE_KEY = "deriva-contest-v1"
const HISTORY_KEY = "deriva-contest-history-v1"

export type ActiveContest = {
  stageId: number | "mixed"
  label: string
  startedAt: number
  durationMs: number
  problemIds: number[]
  solvedAt: Record<number, number>
}

export type ContestResult = {
  id: string
  label: string
  finishedAt: number
  durationMs: number
  solvedCount: number
  total: number
  penaltyMs: number
  solves: { problemId: number; elapsedMs: number }[]
}

export function getActiveContest(): ActiveContest | null {
  if (typeof window === "undefined") return null
  try {
    const raw = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null") as Partial<ActiveContest> | null
    if (!raw || typeof raw.startedAt !== "number" || !Array.isArray(raw.problemIds)) return null
    return {
      stageId: raw.stageId ?? "mixed",
      label: raw.label ?? "Contest",
      startedAt: raw.startedAt,
      durationMs: raw.durationMs ?? 90 * 60_000,
      problemIds: raw.problemIds,
      solvedAt: raw.solvedAt ?? {},
    }
  } catch {
    return null
  }
}

export function startContest(contest: Omit<ActiveContest, "solvedAt">) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...contest, solvedAt: {} })) } catch {}
}

export function recordContestSolve(problemId: number) {
  const contest = getActiveContest()
  if (!contest || contest.solvedAt[problemId]) return
  contest.solvedAt[problemId] = Date.now()
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify(contest)) } catch {}
}

export function abandonContest() {
  try { localStorage.removeItem(ACTIVE_KEY) } catch {}
}

export function finishContest(contest: ActiveContest): ContestResult {
  const solves = contest.problemIds
    .filter(id => contest.solvedAt[id])
    .map(id => ({ problemId: id, elapsedMs: contest.solvedAt[id] - contest.startedAt }))
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
  const result: ContestResult = {
    id: `contest-${contest.startedAt}`,
    label: contest.label,
    finishedAt: Date.now(),
    durationMs: contest.durationMs,
    solvedCount: solves.length,
    total: contest.problemIds.length,
    penaltyMs: solves.reduce((sum, solve) => sum + solve.elapsedMs, 0),
    solves,
  }
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as ContestResult[]
    localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...history].slice(0, 20)))
    localStorage.removeItem(ACTIVE_KEY)
  } catch {}
  return result
}

export function contestHistory(): ContestResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as ContestResult[]
    return raw.filter(entry => typeof entry.finishedAt === "number" && Array.isArray(entry.solves))
  } catch {
    return []
  }
}
