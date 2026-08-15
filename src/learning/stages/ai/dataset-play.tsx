"use client"

// Stage 2 — Play (AI labs): the dataset sandbox (docs/13 §0.1).
// The learner edits rows — removes labels, marks duplicates, finds the reserved
// row — and watches the contract counts change before any rule is stated (B2).
// One experiment prompt at a time; the sandbox never says "contract".

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, GhostButton, ProbeCard } from "../shell"
import type { StageArtifacts } from "../../flow/stage-machine"
import { ticketRows } from "@/curriculum/topics/ai-ml/00-data-contract/fixtures"
import { evaluateSandbox, sandboxCounts, type SandboxState } from "./dataset-sandbox"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["play"]
  onComplete: (a: StageArtifacts["play"]) => void
  onDraft: (a: StageArtifacts["play"]) => void
  onProbePass: () => void
}

export function DatasetPlayStage({ lesson, saved, onComplete, onDraft, onProbePass }: Props) {
  const s = lesson.stages.play
  const experiments = s.experiments

  const [unlabeled, setUnlabeled] = useState<number[]>(saved?.peeled ? [] : [])
  const [marked, setMarked] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [expIndex, setExpIndex] = useState(saved?.expIndex ?? 0)
  const [revealed, setRevealed] = useState(saved?.revealed ?? false)

  const verdicts = evaluateSandbox(ticketRows, { unlabeled, markedDuplicate: marked })
  const counts = sandboxCounts(verdicts)
  const experiment = experiments[expIndex]
  const done = expIndex >= experiments.length

  const met =
    expIndex === 0 ? unlabeled.length > 0 :
    expIndex === 1 ? marked.length > 0 :
    expIndex === 2 ? selected !== null && ticketRows[selected]?.in_eval === true :
    false

  const saveDraft = (patch: Partial<StageArtifacts["play"]> = {}) => onDraft({
    experimentsDone: experiments.slice(0, expIndex).map(e => e.id),
    expIndex, revealed, ...patch,
  })

  const toggle = (fn: (i: number) => boolean, setter: (next: number[]) => void, i: number) => {
    setter(fn(i) ? [] : [i])
    saveDraft()
  }

  const toggleUnlabel = (i: number) => {
    if (i === selected) return
    const already = unlabeled.includes(i)
    setUnlabeled(already ? [] : [i])
    setMarked([])
    saveDraft()
  }
  const toggleDuplicate = (i: number) => {
    const already = marked.includes(i)
    setMarked(already ? [] : [i])
    setUnlabeled([])
    saveDraft()
  }

  const nextExperiment = () => {
    setRevealed(false)
    setExpIndex(expIndex + 1)
    saveDraft({ expIndex: expIndex + 1, revealed: false })
  }

  return (
    <StageShell stage="play" title="Touch the data" move={lesson.stageMoves.play}>
      <div className="stage-split workbench-first">
        <div className="workbench">
          <div className="dataset-sandbox">
            <div className="dataset-counts" aria-live="polite">
              <span className="ds-count ok">{counts.accepted} accepted</span>
              <span className="ds-count bad">{counts.rejected} rejected</span>
              <span className="ds-count muted">{counts.untouched} untouched</span>
            </div>

            <ol className="dataset-rows sandbox" aria-label="Ticket rows to edit">
              {ticketRows.map((row, i) => {
                const verdict = verdicts[i]
                const isSelected = selected === i
                return (
                  <li
                    key={row.id}
                    className={`dataset-row ${isSelected ? "selected" : ""} ${verdict.decision === "accepted" ? "accepted" : verdict.decision === "rejected" ? "rejected" : ""}`}
                  >
                    <button className="ds-row-tap" onClick={() => { setSelected(i); saveDraft() }} aria-pressed={isSelected}>
                      <code className="ds-row-id">{row.id}</code>
                      <span className="ds-row-text">{typeof row.text === "string" ? row.text : "—"}</span>
                      {row.in_eval && <span className="ds-row-reserved">reserved</span>}
                      {unlabeled.includes(i) && <span className="ds-row-edit">label removed</span>}
                      {marked.includes(i) && <span className="ds-row-edit">marked duplicate</span>}
                      <span className={`ds-row-verdict ${verdict.decision === "accepted" ? "ok" : verdict.decision === "rejected" ? "bad" : "muted"}`}>
                        {verdict.decision === "accepted" ? "accepted" : verdict.decision === "rejected" ? verdict.reason : "untouched"}
                      </span>
                    </button>
                    {isSelected && !row.in_eval && (
                      <div className="ds-row-actions">
                        <GhostButton onClick={() => toggleUnlabel(i)}>
                          {unlabeled.includes(i) ? "Restore the label" : "Remove the label"}
                        </GhostButton>
                        <GhostButton onClick={() => toggleDuplicate(i)}>
                          {marked.includes(i) ? "Unmark duplicate" : "Mark as exact duplicate"}
                        </GhostButton>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div className="textbook">
          <p className="narrative">{s.sandbox.prompt}</p>

          {!done && experiment && (
            <div className="experiment-card">
              <span className="experiment-kicker">Experiment {expIndex + 1} of {experiments.length}</span>
              <p className="experiment-prompt">{experiment.prompt}</p>
              {met && !revealed && (
                <GhostButton onClick={() => { setRevealed(true); saveDraft({ revealed: true }) }}>I did it — what did I just see?</GhostButton>
              )}
              {!met && <p className="experiment-hint">Use the row buttons above. The answer appears only after your hands find it.</p>}
              {revealed && (
                <div className="experiment-reveal">
                  <p>{experiment.reveal}</p>
                  <GhostButton onClick={nextExperiment}>
                    {expIndex + 1 < experiments.length ? "Next experiment →" : "I felt it →"}
                  </GhostButton>
                </div>
              )}
            </div>
          )}

          {done && (
            <div className="experiment-reveal">
              <p><b>You just ran a dataset contract by hand.</b> Labels decide, duplicates resolve, and the reserved row never trains. Nobody taught you that word — your hands already know it.</p>
            </div>
          )}
        </div>
      </div>

      <ProbeCard probe={lesson.probes.play!} onPass={onProbePass} />

      <StageCTA>
        <PrimaryButton disabled={!done} onClick={() => onComplete({
          experimentsDone: experiments.map(e => e.id), expIndex, revealed,
        })}>
          {done ? "My hands get it → Reason" : `Finish experiment ${Math.min(expIndex + 1, experiments.length)} of ${experiments.length}`}
        </PrimaryButton>
      </StageCTA>
    </StageShell>
  )
}
