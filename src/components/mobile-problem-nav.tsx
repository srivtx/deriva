"use client"

import { useState } from "react"

interface Stage { id: number; name: string }
interface NavProblem { id: number; stage: number; title: string }

export function MobileTopicPicker({
  topics, currentId, onSelect,
}: {
  topics: { id: string; name: string; problems: { length: number } }[]
  currentId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = topics.find(topic => topic.id === currentId)

  return (
    <div className="mobile-picker">
      <button className="mobile-picker-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span className="mobile-picker-kicker">Topic</span>
        <span className="mobile-picker-value">{current?.name}</span>
        <span className="mobile-picker-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="mobile-sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Choose a topic" onClick={event => event.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-heading"><div><span className="mobile-sheet-kicker">Curriculum</span><h2>Choose a topic</h2></div><button className="mobile-sheet-close" onClick={() => setOpen(false)} aria-label="Close topic picker">×</button></div>
            <div className="mobile-sheet-list">
              {topics.map(topic => (
                <button key={topic.id} className={`mobile-sheet-row${topic.id === currentId ? " selected" : ""}`} onClick={() => { onSelect(topic.id); setOpen(false) }}>
                  <span>{topic.name}</span><span>{topic.problems.length} problems</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default function MobileProblemNav({
  stages, problems, currentId, done, onSelect,
}: {
  stages: Stage[]
  problems: NavProblem[]
  currentId: number
  done: Set<number>
  onSelect: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const current = problems.find(problem => problem.id === currentId)

  return (
    <div className="mobile-picker">
      <button className="mobile-picker-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span className="mobile-picker-kicker">Problem</span>
        <span className="mobile-picker-value">{currentId}. {current?.title}</span>
        <span className="mobile-picker-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="mobile-sheet-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Choose a problem" onClick={event => event.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <div className="mobile-sheet-heading"><div><span className="mobile-sheet-kicker">Practice queue</span><h2>Choose a problem</h2></div><button className="mobile-sheet-close" onClick={() => setOpen(false)} aria-label="Close problem picker">×</button></div>
            <div className="mobile-sheet-list">
              {stages.map(stage => (
                <div key={stage.id} className="mobile-sheet-group">
                  <span>{stage.id}. {stage.name}</span>
                  {problems.filter(problem => problem.stage === stage.id).map(problem => (
                    <button key={problem.id} className={`mobile-sheet-row${problem.id === currentId ? " selected" : ""}`} onClick={() => { onSelect(problem.id); setOpen(false) }}>
                      <span><b>{done.has(problem.id) ? "✓" : problem.id}</b>{problem.title}</span><span>{done.has(problem.id) ? "Done" : ""}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
