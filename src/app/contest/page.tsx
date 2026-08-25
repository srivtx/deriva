"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PROBLEMS_ICPC, STAGES_ICPC } from "@/data/icpc"
import { abandonContest, contestHistory, finishContest, getActiveContest, recordContestSolve, startContest, type ActiveContest, type ContestResult } from "@/persistence/contest"
import { loadPracticeCompletion } from "@/persistence/practice-progress"

const DURATIONS = [
  { label: "Sprint · 45 min", ms: 45 * 60_000 },
  { label: "Regional · 90 min", ms: 90 * 60_000 },
]

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function pickProblems(stageId: number | "mixed", completed: Record<string, number[]>): { id: number; label: string }[] {
  const solvedIcpc = new Set(completed.icpc || [])
  const pool = stageId === "mixed"
    ? PROBLEMS_ICPC.filter(p => !solvedIcpc.has(p.id))
    : PROBLEMS_ICPC.filter(p => p.stage === stageId && !solvedIcpc.has(p.id))
  const source = pool.length >= 3 ? pool : PROBLEMS_ICPC.filter(p => p.stage === stageId || stageId === "mixed")
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map(p => ({ id: p.id, label: `${p.title} · ${p.difficulty}` }))
}

export default function ContestPage() {
  const [contest, setContest] = useState<ActiveContest | null>(null)
  const [history, setHistory] = useState<ContestResult[]>([])
  const [result, setResult] = useState<ContestResult | null>(null)
  const [stageId, setStageId] = useState<number | "mixed">(0)
  const [durationMs, setDurationMs] = useState(DURATIONS[1].ms)
  const [now, setNow] = useState(Date.now())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setContest(getActiveContest())
    setHistory(contestHistory())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!contest) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [contest])

  const remaining = contest ? contest.durationMs - (now - contest.startedAt) : 0
  const timeUp = contest ? remaining <= 0 : false
  const allSolved = contest ? contest.problemIds.every(id => contest.solvedAt[id]) : false
  const solvedCount = contest ? contest.problemIds.filter(id => contest.solvedAt[id]).length : 0

  const begin = () => {
    const problems = pickProblems(stageId, loadPracticeCompletion())
    const label = stageId === "mixed" ? "Mixed set" : STAGES_ICPC[stageId]?.name ?? "Contest"
    startContest({ stageId, label, startedAt: Date.now(), durationMs, problemIds: problems.map(p => p.id) })
    setContest(getActiveContest())
    setNow(Date.now())
  }

  const wrapUp = () => {
    if (!contest) return
    const finished = finishContest(contest)
    setResult(finished)
    setContest(null)
    setHistory(contestHistory())
  }

  const quit = () => {
    abandonContest()
    setContest(null)
  }

  const stageLabel = useMemo(() => (stageId === "mixed" ? "Mixed set" : STAGES_ICPC[stageId]?.name ?? ""), [stageId])

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">CONTEST SIMULATOR / ICPC</span>
          <h1>Three problems. One clock. Real pressure.</h1>
          <p>Pick a ladder section, get three unsolved problems and a live timer. Solves are detected the moment tests pass — penalty time is real.</p>
        </div>
        <div className="contest-history-signal" aria-label="Contests finished">
          <span>RUNS</span>
          <strong>{hydrated ? history.length : 0}</strong>
          <small>scoreboard below</small>
        </div>
      </section>

      {hydrated && !contest && !result && (
        <section className="contest-setup">
          <label className="super-field">
            <span>Section</span>
            <select value={String(stageId)} onChange={event => setStageId(event.target.value === "mixed" ? "mixed" : Number(event.target.value))}>
              <option value="mixed">Mixed — anything on the ladder</option>
              {STAGES_ICPC.map(stage => <option key={stage.id} value={stage.id}>{String(stage.id).padStart(2, "0")} · {stage.name}</option>)}
            </select>
          </label>
          <div className="super-field">
            <span>Duration</span>
            <div className="segmented" role="group" aria-label="Contest duration">
              {DURATIONS.map(option => (
                <button key={option.ms} type="button" className={durationMs === option.ms ? "selected" : ""} onClick={() => setDurationMs(option.ms)}>{option.label}</button>
              ))}
            </div>
          </div>
          <button type="button" className="super-primary" onClick={begin}>Start contest <span aria-hidden="true">-&gt;</span></button>
          <p className="contest-note">Three unsolved problems are drawn from {stageLabel || "the ladder"}. You solve them in the drill room — this page keeps the clock.</p>
        </section>
      )}

      {contest && (
        <section className={`contest-live${timeUp ? " up" : ""}`}>
          <div className="contest-clock" role="timer" aria-label="Time remaining">
            <span>{timeUp ? "TIME" : "REMAINING"}</span>
            <strong>{clock(remaining)}</strong>
          </div>
          <div className="contest-status">{solvedCount}/{contest.problemIds.length} solved</div>
          <ol className="contest-problems">
            {contest.problemIds.map(id => {
              const problem = PROBLEMS_ICPC.find(p => p.id === id)
              const solvedAt = contest.solvedAt[id]
              return (
                <li key={id} className={solvedAt ? "solved" : ""}>
                  <Link href={`/practice?topic=icpc&problem=${id}`}>
                    <span className="contest-problem-mark">{solvedAt ? "✓" : id}</span>
                    <span className="contest-problem-name">{problem?.title ?? `Problem ${id}`}</span>
                    <span className="contest-problem-time">{solvedAt ? clock(solvedAt - contest.startedAt) : "open"}</span>
                  </Link>
                </li>
              )
            })}
          </ol>
          <div className="contest-live-actions">
            <Link className="super-primary" href={`/practice?topic=icpc&problem=${contest.problemIds.find(id => !contest.solvedAt[id]) ?? contest.problemIds[0]}`}>Solve in drill room <span aria-hidden="true">-&gt;</span></Link>
            {(timeUp || allSolved) && <button type="button" className="super-primary" onClick={wrapUp}>See scoreboard</button>}
            <button type="button" className="super-ghost" onClick={quit}>Abandon</button>
          </div>
          <p className="contest-note">Keep this page open or come back — the clock runs on wall time.</p>
        </section>
      )}

      {result && (
        <section className="contest-result" aria-label="Contest scoreboard">
          <span className="super-kicker">SCOREBOARD / {result.label.toUpperCase()}</span>
          <div className="contest-score">
            <div><span>Solved</span><strong>{result.solvedCount}/{result.total}</strong></div>
            <div><span>Total penalty</span><strong>{clock(result.penaltyMs)}</strong></div>
          </div>
          <ol className="contest-solve-list">
            {result.solves.map(solve => (
              <li key={solve.problemId}>
                <span>{PROBLEMS_ICPC.find(p => p.id === solve.problemId)?.title ?? solve.problemId}</span>
                <em>{clock(solve.elapsedMs)}</em>
              </li>
            ))}
            {result.solves.length === 0 && <li className="none">No solves this run — the ladder will be gentler tomorrow.</li>}
          </ol>
          <div className="contest-live-actions">
            <button type="button" className="super-primary" onClick={() => setResult(null)}>New contest <span aria-hidden="true">-&gt;</span></button>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="contest-history" aria-label="Past contests">
          <span className="super-kicker">PAST RUNS</span>
          <ul>
            {history.map(entry => (
              <li key={entry.id}>
                <span>{entry.label}</span>
                <em>{entry.solvedCount}/{entry.total} · {clock(entry.penaltyMs)}</em>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
