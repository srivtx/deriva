"use client"

// Stage 7 — Execute (AI labs): the student's OWN validator, run against the
// real fixture in the browser worker. data.accept / data.reject events replay
// as a pure dataset panel; watching to the end is the gate.

import { useEffect, useMemo, useRef, useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton } from "../shell"
import { runAiTraced, type TraceRun } from "@/execution/pyodide-client"
import { foldDataset } from "@/viz/replay/folds"
import { DatasetPanel } from "@/viz/panels/dataset"
import { Transport } from "@/viz/replay/transport"
import type { StageArtifacts } from "../../flow/stage-machine"
import { ticketRows } from "@/curriculum/topics/ai-ml/00-data-contract/fixtures"

interface Props {
  lesson: LessonModule
  implement?: StageArtifacts["implement"]
  onComplete: (a: StageArtifacts["execute"]) => void
}

export function DatasetExecuteStage({ lesson, implement, onComplete }: Props) {
  const ex = lesson.stages.execute
  const code = implement?.code ?? lesson.stages.implement.solution

  const [run, setRun] = useState<TraceRun | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [runNonce, setRunNonce] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setRun(null)
    setLoadError(null)
    runAiTraced(code, lesson.stages.implement.entryPoint, ticketRows, ex.budget, { signal: controller.signal })
      .then(r => { if (!controller.signal.aborted) setRun(r) })
      .catch(e => { if (!controller.signal.aborted) setLoadError(String(e)) })
    return () => controller.abort()
  }, [code, lesson, ex.budget, runNonce])

  const total = run?.trace.events.length ?? 0
  const model = useMemo(
    () => foldDataset(run?.trace.events ?? [], cursor),
    [run, cursor],
  )
  const atEnd = total > 0 && cursor >= total

  useEffect(() => {
    if (!playing) { if (timer.current) clearInterval(timer.current); return }
    timer.current = setInterval(() => {
      setCursor(c => {
        if (c >= total) { setPlaying(false); return c }
        return c + 1
      })
    }, 350)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, total])

  return (
    <StageShell stage="execute" title="Watch your contract judge the rows" move={lesson.stageMoves.execute}>
      <div className="stage-split workbench-first">
        <div className="workbench">
          {!run && !loadError && <div className="trace-loading">Running your validator over the 30 rows…</div>}
          {loadError && (
            <div className="test-error">
              <code>{loadError}</code>
              <button className="btn-ghost" onClick={() => setRunNonce(value => value + 1)}>Try the trace again</button>
            </div>
          )}
          {run && (
            <>
              <DatasetPanel rows={ticketRows} fold={model} />
              <Transport
                cursor={cursor}
                total={total}
                playing={playing}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onStep={(d) => { setPlaying(false); setCursor(c => Math.max(0, Math.min(total, c + d))) }}
                onScrub={(c) => { setPlaying(false); setCursor(c) }}
              />
              {run.error && <div className="test-error"><code>{run.error}</code></div>}
              {run.trace.budget.truncated && <p className="trace-note">Trace truncated at {ex.budget} events.</p>}
            </>
          )}
        </div>

        <div className="textbook">
          <p className="narrative">
            This is YOUR function, running on the 30 real tickets. Watch each row land in
            accepted or rejected — and notice the reason every rejection carries. A correct
            contract settles at <b>22 accepted, 8 rejected</b> — anything else is a clause
            you designed that the data disagrees with.
          </p>
          {atEnd && (
            <div className="discovery-ceremony">
              <span className="discovery-kicker">✦ {model.accepted.length} accepted, {model.rejected.length} rejected</span>
              <p className="narrative">
                The duplicate lost to its first occurrence. The unlabeled rows never trained.
                And the reserved row — the one that would have leaked the exam — was stopped
                before any model existed. That is the contract doing its only job.
              </p>
              <div className="trace-evidence">
                <span className="experiment-kicker">Trace evidence</span>
                {Object.entries(model.byReason).map(([reason, count]) => (
                  <p key={reason}><b>{count}</b> rejected as <code>{reason}</code></p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <StageCTA>
        <PrimaryButton disabled={!atEnd} onClick={() => onComplete({ watchedToEnd: true })}>
          {atEnd ? "I watched the contract judge → Reflect" : "Watch to the end (▶ or step →)"}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
