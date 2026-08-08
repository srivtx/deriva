"use client"

// Stage 8 — Reflect: explain why it worked, then NAME the pattern in the
// student's own words (F10). Their Stage-5 contract is quoted back at them —
// they said this before they could code it. The deposit is the artifact.

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  design?: StageArtifacts["design"]
  saved?: StageArtifacts["reflect"]
  onComplete: (a: StageArtifacts["reflect"]) => void
  onDraft: (a: StageArtifacts["reflect"]) => void
}

export function ReflectStage({ lesson, design, saved, onComplete, onDraft }: Props) {
  const r = lesson.stages.reflect
  const [ownWords, setOwnWords] = useState(saved?.ownWords ?? "")
  const ready = ownWords.trim().length >= 12

  return (
    <StageShell stage="reflect" title="Name what you did" move={lesson.stageMoves.reflect}>
      {design && (
        <div className="contract-recap">
          <span className="experiment-kicker">You said this in Stage 5 — before you could code it</span>
           <p><code>{design.name}({design.param})</code>: base case at the floor, step that shrinks, and a complexity hypothesis checked against the trace.</p>
        </div>
      )}

      <div className="stage-prose">
        {r.prompts.map((p, i) => (
          <div key={i} className="reflect-prompt">
            <span className="reflect-num">{i + 1}</span>
            <p className="narrative">{p}</p>
          </div>
        ))}
      </div>

      <div className="pattern-deposit">
        <p className="design-prompt">
          The curriculum calls this move <b>{r.pattern.name}</b>. Now claim it:
          in your own words — what did you learn to trust?
        </p>
        <textarea
          className="ownwords"
          value={ownWords}
           onChange={e => { setOwnWords(e.target.value); onDraft({ ownWords: e.target.value }) }}
          placeholder="e.g. I don't have to check the small stuff — if the function works at all, it works on the smaller input…"
          aria-label="The pattern in your own words"
        />
        {ownWords.trim().length > 0 && !ready && (
          <p className="experiment-hint">One full sentence — future-you will read this.</p>
        )}
      </div>

      <StageCTA>
        <PrimaryButton disabled={!ready} onClick={() => onComplete({ ownWords: ownWords.trim() })}>
          {ready ? `Deposit “${r.pattern.name}” →` : "Write one sentence in your own words"}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
