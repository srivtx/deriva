"use client"

// Stage 9 — Generalize: the pattern under alien surface features (C4, 02 §6
// transfer-appropriate processing). Ends the lesson with an open loop: the
// student leaves knowing exactly where the leap strikes next.

import Link from "next/link"
import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  reflect?: StageArtifacts["reflect"]
  saved?: StageArtifacts["generalize"]
  onComplete: (a: StageArtifacts["generalize"]) => void
  onDraft: (a: StageArtifacts["generalize"]) => void
}

export function GeneralizeStage({ lesson, reflect, saved, onComplete, onDraft }: Props) {
  const g = lesson.stages.generalize
  const pattern = lesson.stages.reflect.pattern
  const [selectedRelated, setSelectedRelated] = useState(saved?.selectedRelated ?? null)

  const chooseRelated = (title: string) => {
    setSelectedRelated(title)
    onDraft({ confirmed: false, selectedRelated: title })
  }

  return (
    <StageShell stage="generalize" title="Where the leap strikes next" move={lesson.stageMoves.generalize}>
      <div className="pattern-card earned">
        <span className="discovery-kicker">✦ Pattern earned</span>
        <h2 className="pattern-name">{pattern.name}</h2>
        <p className="narrative">{pattern.definition}</p>
        {reflect?.ownWords && (
          <blockquote className="ownwords-quote">“{reflect.ownWords}” — you</blockquote>
        )}
      </div>

      <p className="narrative">
        A pattern you own is one you recognize in disguise. These two problems are the
        same leap wearing different clothes — go prove it:
      </p>

      <div className="related-list" aria-label="Choose a transfer problem">
        {g.related.map((rel, i) => (
          <article key={i} className={`related-card${selectedRelated === rel.title ? " selected" : ""}`}>
            <button className="related-pick" onClick={() => chooseRelated(rel.title)} aria-pressed={selectedRelated === rel.title}>
              <b>{rel.title}</b>
              <p>{rel.why}</p>
            </button>
            <Link href={rel.href} className="related-go">Open transfer problem →</Link>
          </article>
        ))}
      </div>

      {g.revisitInDays && (
        <p className="trace-note">
          This pattern will resurface in your practice queue — spaced revisits in {g.revisitInDays.join(", ")} days.
        </p>
      )}

      <StageCTA>
        <PrimaryButton disabled={!selectedRelated} onClick={() => onComplete({ confirmed: true, selectedRelated: selectedRelated! })}>
          {selectedRelated ? "I can spot the leap — finish the lesson" : "Choose the transfer problem you will try"}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
