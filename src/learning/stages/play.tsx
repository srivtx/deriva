"use client"

// Stage 2 — Play: the peel-strip sandbox. The student physically peels numbers
// off the strip and FEELS sum(5) = 5 + sum(4) before anyone states it (B2).
// One experiment prompt at a time; the sandbox never says "recursion".

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, GhostButton, ProbeCard } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["play"]
  onComplete: (a: StageArtifacts["play"]) => void
  onProbePass: () => void
}

export function PlayStage({ lesson, saved, onComplete, onProbePass }: Props) {
  const s = lesson.stages.play
  const n = (s.sandbox.initial as { n: number }).n
  const total = (n * (n + 1)) / 2

  const [peeled, setPeeled] = useState(0)                 // how many numbers peeled off the end
  const [expIndex, setExpIndex] = useState(saved?.experimentsDone?.length ?? 0)
  const [revealed, setRevealed] = useState(false)

  const strip = Array.from({ length: n - peeled }, (_, i) => i + 1)
  const holding = Array.from({ length: peeled }, (_, i) => n - peeled + 1 + i)
  const stripSum = strip.reduce((a, b) => a + b, 0)
  const floorReached = strip.length <= 1
  const experiment = s.experiments[expIndex]
  const done = expIndex >= s.experiments.length

  // Each experiment's reveal unlocks by touching, not reading (B2)
  const [maxPeeled, setMaxPeeled] = useState(0)
  const met =
    expIndex === 0 ? peeled >= 1 :
    expIndex === 1 ? floorReached :
    expIndex === 2 ? maxPeeled > 0 && peeled === 0 : // build all the way back
    false

  const peel = () => { if (!floorReached) { const p = peeled + 1; setPeeled(p); setMaxPeeled(m => Math.max(m, p)) } }
  const unpeel = () => { if (peeled > 0) setPeeled(peeled - 1) }

  const nextExperiment = () => {
    setRevealed(false)
    setExpIndex(i => i + 1)
  }

  return (
    <StageShell stage="play" title="Touch the problem" move={lesson.stageMoves.play}>
      {/* Workbench first on phones (09 §3): sandbox renders before prose via CSS order */}
      <div className="stage-split workbench-first">
        <div className="workbench">
          <div className="peel-sandbox">
            <div className="peel-equation" aria-live="polite">
              <span className="peel-total">{total}</span>
              <span className="peel-eq">=</span>
              {holding.map(h => (
                <span key={h} className="peel-held-num">{h} +</span>
              ))}
              <span className={`peel-stripsum ${floorReached ? "floor" : ""}`}>
                {floorReached ? stripSum : `(${strip.join("+")}) = ${stripSum}`}
              </span>
            </div>

            <div className="peel-strip" role="group" aria-label="Number strip">
              {strip.map(v => (
                <div key={v} className={`peel-block ${floorReached ? "floor" : ""}`}>{v}</div>
              ))}
              {strip.length === 0 && <div className="peel-block floor">—</div>}
            </div>

            <div className="peel-holding" aria-label="Numbers you are holding">
              {holding.length > 0 && <span className="peel-holding-label">holding:</span>}
              {holding.map(h => <div key={h} className="peel-block held">{h}</div>)}
            </div>

            <div className="peel-controls">
              <button className="peel-btn" onClick={peel} disabled={floorReached}>
                Peel the last number →
              </button>
              <button className="peel-btn secondary" onClick={unpeel} disabled={peeled === 0}>
                ← Put it back
              </button>
            </div>
            {floorReached && peeled > 0 && (
              <p className="peel-floor-note">The strip is down to {stripSum}. It answers itself — no peeling needed.</p>
            )}
          </div>
        </div>

        <div className="textbook">
          <p className="narrative">{s.sandbox.prompt}</p>

          {!done && experiment && (
            <div className="experiment-card">
              <span className="experiment-kicker">Experiment {expIndex + 1} of {s.experiments.length}</span>
              <p className="experiment-prompt">{experiment.prompt}</p>
              {met && !revealed && (
                <GhostButton onClick={() => setRevealed(true)}>I did it — what did I just see?</GhostButton>
              )}
              {!met && <p className="experiment-hint">Use the peel buttons above. The answer appears only after your hands find it.</p>}
              {revealed && (
                <div className="experiment-reveal">
                  <p>{experiment.reveal}</p>
                  <GhostButton onClick={nextExperiment}>
                    {expIndex + 1 < s.experiments.length ? "Next experiment →" : "I felt it →"}
                  </GhostButton>
                </div>
              )}
            </div>
          )}

          {done && (
            <div className="experiment-reveal">
              <p><b>You just ran a recursion by hand.</b> Peel down trusting each smaller strip; build back adding only what you held. Nobody taught you that word — your hands already know it.</p>
            </div>
          )}
        </div>
      </div>

      <ProbeCard probe={lesson.probes.play!} onPass={onProbePass} />

      <StageCTA>
        <PrimaryButton disabled={!done} onClick={() => onComplete({ experimentsDone: s.experiments.map(e => e.id) })}>
          {done ? "My hands get it → Reason" : `Finish experiment ${Math.min(expIndex + 1, s.experiments.length)} of ${s.experiments.length}`}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
