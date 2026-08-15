"use client"

// Stage 5 — Design: the contract checker (F4). Signature, base case, recursive
// step, complexity — all must pass before the editor exists (12 §Gates).
// Mismatches get Socratic feedback that points at the flaw, never the answer.

import { useState } from "react"
import type { LessonModule } from "@/curriculum/schema/lesson"
import { StageShell, StageCTA, PrimaryButton, OptionRow, ProbeCard } from "./shell"
import type { StageArtifacts } from "../flow/stage-machine"

interface Props {
  lesson: LessonModule
  saved?: StageArtifacts["design"]
  onComplete: (a: StageArtifacts["design"]) => void
  onDraft: (a: StageArtifacts["design"]) => void
  onProbePass: () => void
}

type FieldKey = "baseCase" | "recursiveStep" | "complexity"

export function DesignStage({ lesson, saved, onComplete, onDraft, onProbePass }: Props) {
  const c = lesson.stages.design.contract
  const [name, setName] = useState(saved?.name ?? c.signature.defaultName)
  const [param, setParam] = useState(saved?.param ?? c.signature.defaultParam)
  const [choices, setChoices] = useState<Record<FieldKey, string | null>>({
    baseCase: saved?.baseCase ?? null,
    recursiveStep: saved?.recursiveStep ?? null,
    complexity: saved?.complexity ?? null,
  })
  const [checked, setChecked] = useState(saved?.checked ?? false)
  const [passed, setPassed] = useState(saved?.passed ?? false)

  const nameOk = /^[a-z_][a-z0-9_]*$/.test(name.trim())
  const paramOk = /^[a-z_][a-z0-9_]*$/.test(param.trim())
  const fields: { key: FieldKey; data: typeof c.baseCase }[] = [
    { key: "baseCase", data: c.baseCase },
    { key: "recursiveStep", data: c.recursiveStep },
    { key: "complexity", data: c.complexity },
  ]
  const allChosen = fields.every(f => choices[f.key]) && nameOk && paramOk
  const allCorrect = fields.every(f => choices[f.key] === f.data.correct) && nameOk && paramOk
  const saveDraft = (patch: Partial<StageArtifacts["design"]> = {}) => onDraft({
    name, param, baseCase: choices.baseCase || "", recursiveStep: choices.recursiveStep || "", complexity: choices.complexity || "", checked, passed, ...patch,
  })

  const lock = () => {
    setChecked(true)
    if (allCorrect) setPassed(true)
    saveDraft({ checked: true, passed: allCorrect })
  }

  const renderField = (f: { key: FieldKey; data: typeof c.baseCase }) => {
    const wrong = checked && choices[f.key] !== f.data.correct
    const right = checked && choices[f.key] === f.data.correct
    return (
      <div key={f.key} className={`design-field ${wrong ? "wrong" : right ? "correct" : ""}`}>
        <p className="design-prompt">{f.data.prompt}</p>
        <div className="probe-options">
          {f.data.options.map(o => (
            <OptionRow
              key={o.value}
              selected={choices[f.key] === o.value}
              state={checked && choices[f.key] === o.value ? (o.value === f.data.correct ? "correct" : "wrong") : null}
               onClick={() => { if (!passed) { const nextChoices = { ...choices, [f.key]: o.value }; setChoices(nextChoices); setChecked(false); saveDraft({ baseCase: nextChoices.baseCase || "", recursiveStep: nextChoices.recursiveStep || "", complexity: nextChoices.complexity || "", checked: false, passed: false }) } }}
            >
              <code>{o.label}</code>
            </OptionRow>
          ))}
        </div>
        {wrong && <p className="design-wrong-feedback">{f.data.wrongFeedback}</p>}
        {right && f.key === "complexity" && (
          <p className="design-derivation">Commit this as a hypothesis. Execute will count the actual trace before the lesson names the cost.</p>
        )}
      </div>
    )
  }

  return (
    <StageShell stage="design" title="Commit the contract" move={lesson.stageMoves.design}>
      <p className="narrative">
        One step left between you and the editor: say exactly what your function promises.
        This is the last screen without code — after this, code is just transcription.
      </p>

      <div className="design-field">
        <p className="design-prompt">{c.signature.prompt}</p>
        <div className="signature-form">
          <code>def&nbsp;</code>
           <input value={name} onChange={e => { setName(e.target.value); saveDraft({ name: e.target.value }) }} disabled={passed} aria-label="Function name" />
          <code>(</code>
           <input value={param} onChange={e => { setParam(e.target.value); saveDraft({ param: e.target.value }) }} disabled={passed} aria-label="Parameter name" className="param-input" />
           <code>{c.signature.returns ? `) → ${c.signature.returns}` : ") → number"}</code>
        </div>
        {checked && (!nameOk || !paramOk) && (
          <p className="design-wrong-feedback">Python names: lowercase letters, digits, underscores; start with a letter.</p>
        )}
      </div>

      {fields.map(renderField)}

      {passed && (
        <div className="discovery-ceremony" aria-live="polite">
          <span className="discovery-kicker">✦ Contract locked</span>
          <p className="narrative">
            <code>{name.trim()}({param.trim()})</code> — you specified the promise before writing a line.
            The editor was never locked <i>against</i> you; it was waiting <i>for</i> this.
          </p>
        </div>
      )}

      <ProbeCard probe={lesson.probes.design!} onPass={onProbePass} />

      <StageCTA>
        {!passed ? (
          <PrimaryButton disabled={!allChosen} onClick={lock}>
            {allChosen ? "Lock my contract" : "Answer every part of the contract"}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => onComplete({
            name: name.trim(), param: param.trim(),
            baseCase: choices.baseCase!, recursiveStep: choices.recursiveStep!, complexity: choices.complexity!, checked: true, passed: true,
          })}>
            The editor is yours → Implement
          </PrimaryButton>
        )}
      </StageCTA>
    </StageShell>
  )
}
