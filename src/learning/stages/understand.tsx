"use client"

// Stage 1 — Understand: read, interact with examples, COMMIT to a prediction
// before any answer exists (generation effect + curiosity gap, 02 §6).
// The reveal lands only after commitment — prediction is a lock, not a quiz.

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, OptionRow, ProbeCard, GhostButton } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["understand"]
  onComplete: (a: StageArtifacts["understand"]) => void
  onDraft: (a: StageArtifacts["understand"]) => void
  onProbePass: () => void
}

export function UnderstandStage({ lesson, saved, onComplete, onDraft, onProbePass }: Props) {
  const s = lesson.stages.understand
  const [picked, setPicked] = useState<string | null>(saved?.prediction ?? null)
  const [locked, setLocked] = useState(saved?.locked ?? !!saved)
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set(saved?.revealedExamples ?? []))
  const correct = locked && picked === s.prediction.correct

  return (
    <StageShell stage="understand" title={lesson.title} move={lesson.stageMoves.understand}>
      <div className="stage-prose">
        {s.prose.map((b, i) => (
          <section key={i}>
            {b.heading && <h2 className="prose-heading">{b.heading}</h2>}
            <p className="narrative">{b.body}</p>
          </section>
        ))}
      </div>

       <div className="example-strip" aria-label="Worked examples">
         {s.examples.map(ex => (
           <button key={ex.id} type="button" className="example-chip" onClick={() => setRevealedExamples(current => {
             const next = new Set(current)
             if (next.has(ex.id)) next.delete(ex.id)
             else next.add(ex.id)
             onDraft({ prediction: picked || "", wasRight: picked === s.prediction.correct, locked, revealedExamples: [...next] })
             return next
           })} aria-expanded={revealedExamples.has(ex.id)}>
             <code>{ex.given}</code>
             <span>→</span>
             <code className="example-result">{revealedExamples.has(ex.id) ? ex.result : "?"}</code>
           </button>
         ))}
       </div>

      <div className="prediction-card">
        <p className="prediction-prompt">{s.prediction.prompt}</p>
        <div className="probe-options">
          {s.prediction.options!.map(o => (
            <OptionRow
              key={o.value}
              selected={picked === o.value}
              state={locked && picked === o.value ? (correct ? "correct" : "wrong") : null}
              onClick={() => { if (!locked) { setPicked(o.value); onDraft({ prediction: o.value, wasRight: o.value === s.prediction.correct, locked: false }) } }}
            >
              {o.label}
            </OptionRow>
          ))}
        </div>
        {!locked ? (
           <GhostButton disabled={!picked} onClick={() => { setLocked(true); onDraft({ prediction: picked!, wasRight: picked === s.prediction.correct, locked: true }) }}>
            Lock it in — no take-backs
          </GhostButton>
        ) : (
          <div className={`prediction-reveal ${correct ? "correct" : "wrong"}`}>
            <b>{correct ? "Correct — trust that instinct." : `Not this time — it's ${s.prediction.correct}.`}</b>
            <p>{s.prediction.explanation}</p>
          </div>
        )}
      </div>

      <ProbeCard probe={lesson.probes.understand!} onPass={onProbePass} />

      <StageCTA>
        <PrimaryButton disabled={!locked} onClick={() => onComplete({ prediction: picked!, wasRight: !!correct })}>
          {locked ? "I committed — let's touch the problem →" : "Commit to a prediction first"}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
