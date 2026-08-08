"use client"

// Stage 3 — Reason: the Socratic ladder. One question visible at a time.
// Wrong answers get a pump (a narrower question), never the answer (B3).
// The platform asks; the student constructs.

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, OptionRow, ProbeCard } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["reason"]
  onComplete: (a: StageArtifacts["reason"]) => void
  onDraft: (a: StageArtifacts["reason"]) => void
  onProbePass: () => void
}

export function ReasonStage({ lesson, saved, onComplete, onDraft, onProbePass }: Props) {
  const nodes = lesson.stages.reason.socraticLadder
  const [index, setIndex] = useState(saved?.index ?? Object.keys(saved?.answers ?? {}).length)
  const [picked, setPicked] = useState<string | null>(saved?.picked ?? null)
  const [misses, setMisses] = useState(saved?.misses ?? 0)
  const [answers, setAnswers] = useState<Record<string, string>>(saved?.answers ?? {})

  const node = nodes[index]
  const isCorrect = picked !== null && !!node && picked === node.correct
  const done = index >= nodes.length

  const choose = (value: string) => {
    if (isCorrect) return
    setPicked(value)
    if (value === node.correct) {
      const nextAnswers = { ...answers, [node.id]: value }
      setAnswers(nextAnswers)
      onDraft({ answers: nextAnswers, misses, index, picked: value })
    } else {
      const nextMisses = misses + 1
      setMisses(nextMisses)
      onDraft({ answers, misses: nextMisses, index, picked: value })
    }
  }

  const next = () => {
    const nextIndex = index + 1
    setPicked(null)
    setIndex(nextIndex)
    onDraft({ answers, misses, index: nextIndex, picked: null })
  }

  return (
    <StageShell stage="reason" title="Think it through" move={lesson.stageMoves.reason}>
      {!done ? (
        <div className="socratic-card">
          <span className="experiment-kicker">Question {index + 1} of {nodes.length}</span>
          <p className="socratic-question narrative">{node.question}</p>
          <div className="probe-options">
            {node.options.map(o => (
              <OptionRow
                key={o.value}
                selected={picked === o.value}
                state={picked === o.value ? (o.value === node.correct ? "correct" : "wrong") : null}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </OptionRow>
            ))}
          </div>
          {picked !== null && (
            <div className={`socratic-feedback ${isCorrect ? "correct" : "wrong"}`} aria-live="polite">
              <p>{isCorrect ? node.feedback.correct : node.feedback.wrong}</p>
              {isCorrect && (
                <PrimaryButton onClick={next}>
                  {index + 1 < nodes.length ? "Next question →" : "The idea is yours →"}
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="experiment-reveal">
          <p><b>You built the whole argument:</b> use the smaller answer without re-checking it, make every ask smaller, and give the chain a floor. All that&rsquo;s left is to say it precisely.</p>
        </div>
      )}

      <ProbeCard probe={lesson.probes.reason!} onPass={onProbePass} />

      <StageCTA>
        <PrimaryButton
          disabled={!done}
          onClick={() => onComplete({ answers, misses })}
        >
          {done ? "I can state it → Discover" : `Question ${Math.min(index + 1, nodes.length)} of ${nodes.length}`}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
