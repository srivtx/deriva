"use client"

// FOUNDRY · Station 06 — Agent Loop.
// A ReAct executor with real guards. Four scenarios: the clean loop, the
// retry spiral, the drowning context, and the poisoned file.

import { useEffect, useMemo, useRef, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { loadStationProgress, recordMissionCleared, recordStationRun } from "@/foundry/progress"
import { AGENT_SCENARIOS, DEFAULT_AGENT_CONFIG, runAgent, type AgentConfig, type AgentEvent, type AgentRun } from "@/foundry/engine-agent"

const STATION = FOUNDRIES[5]

type Locks = { maxRetries: boolean; obsTruncate: boolean; guard: boolean; fallback: boolean }

function TerminalLine({ event }: { event: AgentEvent }) {
  if (event.kind === "thought") {
    return (
      <div className="foundry-terminal-line think">
        <b>THINK</b>
        <span>{event.text}</span>
        <code>{event.tokens}t</code>
      </div>
    )
  }
  if (event.kind === "action") {
    return (
      <div className="foundry-terminal-line act">
        <b>{event.tool.toUpperCase()}</b>
        <span>{event.arg}</span>
        <code>{event.tokens}t</code>
      </div>
    )
  }
  if (event.kind === "observation") {
    return (
      <div className={`foundry-terminal-line obs ${event.quarantined ? "quarantined" : ""}`}>
        <b>{event.quarantined ? "OBS ⚠" : "OBS"}</b>
        <span>{event.text.length > 220 ? `${event.text.slice(0, 220)}…` : event.text}</span>
        <code>{event.tokens}t{event.truncated > 0 ? ` (−${event.truncated})` : ""}</code>
      </div>
    )
  }
  if (event.kind === "note") {
    return (
      <div className="foundry-terminal-line note">
        <b>NOTE</b>
        <span>{event.text}</span>
      </div>
    )
  }
  return (
    <div className={`foundry-terminal-line done ${event.success ? "ok" : "fail"}`}>
      <b>{event.success ? "DONE ✓" : "DONE ✕"}</b>
      <span>{event.reason}</span>
      <code>step {event.steps} · {event.contextUsed}t</code>
    </div>
  )
}

function AgentRunner({
  scenarioId,
  locks,
  intro,
  onSolved,
  onFirstFail,
}: {
  scenarioId: string
  locks: Locks
  intro: string
  onSolved: () => void
  onFirstFail: () => void
}) {
  const scenario = AGENT_SCENARIOS.find(entry => entry.id === scenarioId)!
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG)
  const [run, setRun] = useState<AgentRun | null>(null)
  const [visible, setVisible] = useState(0)
  const [failedOnce, setFailedOnce] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!run || visible >= run.events.length) return
    const timer = setTimeout(() => setVisible(v => v + 1), 420)
    return () => clearTimeout(timer)
  }, [run, visible])

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight })
  }, [visible])

  const start = () => {
    triggerGameFeedback("move")
    const outcome = runAgent(scenario, config)
    setRun(outcome)
    setVisible(1)
    if (outcome.success) triggerGameFeedback("correct")
    else if (!failedOnce) {
      triggerGameFeedback("wrong")
      setFailedOnce(true)
      onFirstFail()
    }
  }

  const finished = run !== null && visible >= run.events.length
  const contextUsed = run
    ? 20 + Math.ceil(scenario.task.length / 4) + run.events.slice(0, visible).reduce((acc, event) => acc + ("tokens" in event ? event.tokens : 0), 0)
    : 0

  return (
    <section className="game-act">
      <span className="stage-kicker">{scenario.title}</span>
      <h1 className="stage-title">{scenario.task}</h1>
      <p className="narrative">{intro}</p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>guardrails</span><b>context limit {scenario.contextLimit} tokens · max {scenario.maxSteps} steps</b></div>
        <div className="foundry-control-grid">
          <div className="foundry-control">
            <span className="foundry-dial-label">retry cap <b>{config.maxRetries}</b></span>
            <input type="range" min={0} max={6} step={1} value={config.maxRetries} disabled={locks.maxRetries} aria-label="max retries" onChange={event => setConfig(c => ({ ...c, maxRetries: Number(event.target.value) }))} />
          </div>
          <div className="foundry-control">
            <span className="foundry-dial-label">obs truncation <b>{config.obsTruncateTokens === 0 ? "off" : `${config.obsTruncateTokens}t`}</b></span>
            <input type="range" min={0} max={400} step={50} value={config.obsTruncateTokens} disabled={locks.obsTruncate} aria-label="observation truncation" onChange={event => setConfig(c => ({ ...c, obsTruncateTokens: Number(event.target.value) }))} />
          </div>
          <div className="foundry-control">
            <span className="foundry-dial-label">injection guard</span>
            <div className="foundry-segmented">
              <button className={!config.guardInjection ? "on" : ""} disabled={locks.guard} onClick={() => setConfig(c => ({ ...c, guardInjection: false }))}>off</button>
              <button className={config.guardInjection ? "on" : ""} disabled={locks.guard} onClick={() => setConfig(c => ({ ...c, guardInjection: true }))}>quarantine</button>
            </div>
          </div>
          <div className="foundry-control">
            <span className="foundry-dial-label">fallback on retry-cap</span>
            <div className="foundry-segmented">
              <button className={!config.fallbackOnRetry ? "on" : ""} disabled={locks.fallback} onClick={() => setConfig(c => ({ ...c, fallbackOnRetry: false }))}>keep trying</button>
              <button className={config.fallbackOnRetry ? "on" : ""} disabled={locks.fallback} onClick={() => setConfig(c => ({ ...c, fallbackOnRetry: true }))}>switch plan</button>
            </div>
          </div>
        </div>
        <div className="foundry-kv-gauge">
          <span className="foundry-dial-label">context <b>{contextUsed} / {scenario.contextLimit}</b></span>
          <div className="foundry-kv-track"><span style={{ width: `${Math.min(100, (contextUsed / scenario.contextLimit) * 100)}%`, background: contextUsed > scenario.contextLimit ? "var(--viz-pruned)" : "var(--viz-settled)" }} /></div>
        </div>
      </div>
      <div className="foundry-step-controls">
        <button className="btn-primary" onClick={start}>{run ? "Run the loop again →" : "Run the loop →"}</button>
        {run !== null && !finished && <button className="btn-ghost" onClick={() => setVisible(run.events.length)}>skip to verdict</button>}
      </div>
      {run !== null && (
        <div className="foundry-terminal" ref={terminalRef}>
          {run.events.slice(0, visible).map((event, index) => (
            <TerminalLine key={index} event={event} />
          ))}
        </div>
      )}
      {finished && run !== null && (
        <div className={`game-feedback ${run.success ? "correct" : "wrong"}`}>
          <b>{run.success ? `Solved in ${run.steps} steps, ${run.finalContext} tokens.` : `Run died: ${run.reason}.`}</b>
          <p>
            {run.success
              ? "Read the trace once more — every THINK is a decision, every OBS is a token cost. That loop is the whole agent."
              : "The terminal tells you exactly which guardrail was missing. Adjust the panel and run it again."}
          </p>
          {run.success && <button className="btn-primary" onClick={onSolved}>Next scenario →</button>}
        </div>
      )}
    </section>
  )
}

const SCENARIOS: { id: string; intro: string; locks: Locks }[] = [
  {
    id: "happy-path",
    locks: { maxRetries: true, obsTruncate: true, guard: true, fallback: true },
    intro:
      "Thought → Action → Observation, around and around until submit. The brain here is scripted — that is honest — but the loop, the tool world, and the token accounting are the real mechanics. Run it and read the trace like a production engineer reads logs.",
  },
  {
    id: "runaway",
    locks: { maxRetries: false, obsTruncate: true, guard: true, fallback: false },
    intro:
      "The check keeps failing on port 8080, and this agent's one idea is to run it again. Uncapped, it burns the entire step budget in a retry spiral. Cap the retries and let the engine signal the policy to switch plans — bounded retries plus a fallback strategy.",
  },
  {
    id: "bloat",
    locks: { maxRetries: true, obsTruncate: false, guard: true, fallback: true },
    intro:
      "server.log is 5,500 characters of routine noise with the one ERROR line at the very end. Raw, it costs ~1,400 tokens — nearly double the context window. Turn on observation truncation (head + tail) and watch the agent stay afloat and still find the quota line.",
  },
  {
    id: "injection",
    locks: { maxRetries: true, obsTruncate: true, guard: false, fallback: true },
    intro:
      "notes.md contains a launch code — and one line that starts with SYSTEM OVERRIDE. Unguarded, the agent obeys whatever text it just read and submits the wrong answer. Turn on the injection guard: the engine inspects every observation before the policy sees it.",
  },
]

export default function AgentLoopPage() {
  const [mission, setMission] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)
  const scenario = SCENARIOS[mission - 1]

  // Resume where the last session left off; fully cleared stations replay from the top.
  useEffect(() => {
    const saved = loadStationProgress(STATION.id)
    if (saved && saved.missionsCleared > 0 && saved.missionsCleared < STATION.missions) setMission(saved.missionsCleared + 1)
  }, [])

  const complete = () => {
    triggerGameFeedback("complete")
    recordStationRun(STATION.id, STATION.missions, mistakes)
    setFinished(true)
  }

  if (finished) {
    return (
      <FoundryShell station={STATION} mission={STATION.missions}>
        <FoundryCompletion
          station={STATION}
          stats={[
            { label: "Scenarios solved", value: STATION.missions },
            { label: "Mistakes this run", value: mistakes },
            { label: "Guardrails mastered", value: "retry cap · truncation · quarantine" },
          ]}
          concepts={[
            { title: "The loop is the agent", description: "Thought, action, observation — and a stop condition. Everything else is detail." },
            { title: "Bounded retries + fallback", description: "Fail fast with a diagnosis instead of burning the step budget in a spiral." },
            { title: "Context is an enforced budget", description: "Tool output is the enemy — truncate to head+tail or the window drowns." },
            { title: "Observations are attack surface", description: "Quarantine injected instructions before they reach the policy." },
          ]}
          onRestart={() => {
            setMission(1)
            setMistakes(0)
            setFinished(false)
          }}
        />
      </FoundryShell>
    )
  }

  return (
    <FoundryShell station={STATION} mission={mission}>
      <AgentRunner
        scenarioId={scenario.id}
        intro={scenario.intro}
        locks={scenario.locks}
        onSolved={() => {
          if (mission === STATION.missions) complete()
          else {
            recordMissionCleared(STATION.id, mission)
            setMission(m => m + 1)
          }
        }}
        onFirstFail={() => setMistakes(m => m + 1)}
      />
    </FoundryShell>
  )
}
