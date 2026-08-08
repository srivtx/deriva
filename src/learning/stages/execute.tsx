"use client"

// Stage 7 — Execute: the student's OWN code, traced and replayed (PRD §5).
// The viz is a pure function of (trace, cursor); the sandbox already ran.
// Watching to the end is the gate — the unwinding IS the lesson.

import { useEffect, useMemo, useRef, useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton } from "./shell"
import { runTraced, type TraceRun } from "@/execution/pyodide-client"
import { foldCallStack } from "@/viz/replay/folds"
import { CallStackPanel } from "@/viz/panels/call-stack"
import { Transport } from "@/viz/replay/transport"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  implement?: StageArtifacts["implement"]
  onComplete: (a: StageArtifacts["execute"]) => void
}

export function ExecuteStage({ lesson, implement, onComplete }: Props) {
  const ex = lesson.stages.execute
  const n = (ex.traceInput as { n: number }).n
  const code = implement?.code ?? lesson.stages.implement.solution

  const [run, setRun] = useState<TraceRun | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setRun(null)
    setLoadError(null)
    runTraced(code, lesson.stages.implement.entryPoint, n, ex.budget, { signal: controller.signal })
      .then(r => { if (!controller.signal.aborted) setRun(r) })
      .catch(e => { if (!controller.signal.aborted) setLoadError(String(e)) })
    return () => controller.abort()
  }, [code, lesson, n, ex.budget])

  const total = run?.trace.events.length ?? 0
  const model = useMemo(
    () => foldCallStack(run?.trace.events ?? [], cursor),
    [run, cursor]
  )
  const atEnd = total > 0 && cursor >= total

  // Play loop
  useEffect(() => {
    if (!playing) { if (timer.current) clearInterval(timer.current); return }
    timer.current = setInterval(() => {
      setCursor(c => {
        if (c >= total) { setPlaying(false); return c }
        return c + 1
      })
    }, 750)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, total])

  return (
    <StageShell stage="execute" title="Watch your code think" move={lesson.stageMoves.execute}>
      <div className="stage-split workbench-first">
        <div className="workbench">
          {!run && !loadError && <div className="trace-loading">Winding up your code…</div>}
          {loadError && <div className="test-error"><code>{loadError}</code></div>}
          {run && (
            <>
              <CallStackPanel model={model} />
              <p className="trace-caption" aria-live="polite">{model.caption}</p>
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
            This is YOUR function, running on n = {n}. Watch the stack grow — each frame
            is one act of trust — then watch it unwind. Count what comes back up: answers,
            not questions. Nobody re-checks anybody.
          </p>
          {atEnd && (
            <div className="discovery-ceremony">
              <span className="discovery-kicker">✦ {model.calls} calls, {model.returns} returns</span>
              <p className="narrative">
                The chain went all the way down to the floor you designed — and every level
                got its answer back, added one number, and handed it up. That is the entire
                mechanism behind every recursive algorithm you will ever write.
              </p>
            </div>
          )}
        </div>
      </div>

      <StageCTA>
        <PrimaryButton disabled={!atEnd} onClick={() => onComplete({ watchedToEnd: true })}>
          {atEnd ? "I watched trust travel → Reflect" : "Watch to the end (▶ or step →)"}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
