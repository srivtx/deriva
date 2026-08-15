"use client"

// Stage 4 — Discover: the constrained answer builder (B5/B6). The student
// fills three blanks from pruned options — discovery with guardrails.
// The platform never states the contract first; the student constructs it.

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, ProbeCard } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["discover"]
  onComplete: (a: StageArtifacts["discover"]) => void
  onDraft: (a: StageArtifacts["discover"]) => void
  onProbePass: () => void
}

export function DiscoverStage({ lesson, saved, onComplete, onDraft, onProbePass }: Props) {
  const artifact = lesson.stages.discover.artifact
  const [slots, setSlots] = useState<Record<string, string>>(saved?.slots ?? {})
  const [attempts, setAttempts] = useState(saved?.attempts ?? 0)
  const [checked, setChecked] = useState(saved?.checked ?? false)
  const [passed, setPassed] = useState(saved?.passed ?? false)

  const allFilled = artifact.slots.every(sl => slots[sl.name])
  const wrongSlots = checked ? artifact.slots.filter(sl => slots[sl.name] !== sl.correct) : []

  const check = () => {
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setChecked(true)
    if (artifact.slots.every(sl => slots[sl.name] === sl.correct)) {
      setPassed(true)
    }
    onDraft({ slots, attempts: nextAttempts, checked: true, passed: artifact.slots.every(sl => slots[sl.name] === sl.correct) })
  }

  return (
    <StageShell stage="discover" title="Invent the contract" move={lesson.stageMoves.discover}>
      <p className="narrative">{artifact.prompt}</p>

      <div className="slot-builder">
        {artifact.slots.map(sl => {
          const wrong = checked && slots[sl.name] !== sl.correct
          return (
            <div key={sl.name} className={`slot-group ${wrong ? "wrong" : ""}`}>
              <p className="slot-label">
                {sl.label.split("___").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <code className={`slot-blank ${slots[sl.name] ? "filled" : ""}`}>
                        {slots[sl.name]
                          ? sl.options.find(o => o.value === slots[sl.name])?.label
                          : "? ? ?"}
                      </code>
                    )}
                  </span>
                ))}
              </p>
              <div className="slot-options">
                {sl.options.map(o => (
                  <button
                    key={o.value}
                    className={`slot-chip ${slots[sl.name] === o.value ? "selected" : ""}`}
                   onClick={() => { if (!passed) { const nextSlots = { ...slots, [sl.name]: o.value }; setSlots(nextSlots); setChecked(false); onDraft({ slots: nextSlots, attempts, checked: false, passed: false }) } }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {checked && !passed && (
        <div className="socratic-feedback wrong" aria-live="polite">
          <p>
            {artifact.wrongFeedback ?? (
              <>A blank breaks the contract. Ask of each one: <i>does it make the problem smaller? does the chain ever stop?</i></>
            )}
          </p>
        </div>
      )}

      {passed && (
        <div className="discovery-ceremony" aria-live="polite">
          <span className="discovery-kicker">✦ You derived it</span>
          <p className="narrative">{artifact.crystallized}</p>
        </div>
      )}

      {!passed && (
        <StageCTA>
          <PrimaryButton disabled={!allFilled} onClick={check}>
            {allFilled ? "Check my contract" : "Fill all three blanks"}
          </PrimaryButton>
        </StageCTA>
      )}
      {passed && (
        <StageCTA>
          <PrimaryButton onClick={() => onComplete({ slots, attempts })}>
            Lock it in → Design
          </PrimaryButton>
        </StageCTA>
      )}

      <ProbeCard probe={lesson.probes.discover!} onPass={onProbePass} />
    </StageShell>
  )
}
