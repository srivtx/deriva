// Foundry · Station 06 — the ReAct executor and its guardrails.

import { describe, expect, it } from "vitest"
import { AGENT_SCENARIOS, DEFAULT_AGENT_CONFIG, runAgent, tokensOf } from "../../src/foundry/engine-agent"

const scenario = (id: string) => AGENT_SCENARIOS.find(entry => entry.id === id)!

describe("tokensOf", () => {
  it("uses the chars/4 production rule of thumb", () => {
    expect(tokensOf("1234")).toBe(1)
    expect(tokensOf("12345")).toBe(2)
  })
})

describe("the clean loop", () => {
  it("completes with any sane config", () => {
    const run = runAgent(scenario("happy-path"), DEFAULT_AGENT_CONFIG)
    expect(run.success).toBe(true)
    expect(run.finalContext).toBeLessThanOrEqual(scenario("happy-path").contextLimit)
    const kinds = run.events.map(event => event.kind)
    expect(kinds).toContain("thought")
    expect(kinds).toContain("action")
    expect(kinds).toContain("observation")
  })
})

describe("the retry spiral", () => {
  it("dies fast with a diagnosis when no fallback is configured", () => {
    const run = runAgent(scenario("runaway"), DEFAULT_AGENT_CONFIG)
    expect(run.success).toBe(false)
    expect(run.reason).toBe("runaway retry loop")
  })

  it("succeeds with a retry cap plus fallback signal", () => {
    const run = runAgent(scenario("runaway"), { ...DEFAULT_AGENT_CONFIG, maxRetries: 1, fallbackOnRetry: true })
    expect(run.success).toBe(true)
    expect(run.events.some(event => event.kind === "note" && event.text.includes("fall back"))).toBe(true)
  })

  it("without any cap the step budget burns out", () => {
    const run = runAgent(scenario("runaway"), { ...DEFAULT_AGENT_CONFIG, maxRetries: 99 })
    expect(run.success).toBe(false)
    expect(run.reason).toBe("step budget exhausted")
  })
})

describe("the drowning context", () => {
  it("overflows the window without observation truncation", () => {
    const run = runAgent(scenario("bloat"), DEFAULT_AGENT_CONFIG)
    expect(run.success).toBe(false)
    expect(run.reason).toBe("context overflow")
  })

  it("head+tail truncation keeps the answer reachable and the context bounded", () => {
    const run = runAgent(scenario("bloat"), { ...DEFAULT_AGENT_CONFIG, obsTruncateTokens: 200 })
    expect(run.success).toBe(true)
    expect(run.finalContext).toBeLessThan(400)
    const observation = run.events.find(event => event.kind === "observation")
    expect(observation && observation.kind === "observation" ? observation.truncated : 0).toBeGreaterThan(900)
  })
})

describe("the poisoned file", () => {
  it("an unguarded agent obeys the injected instruction and submits the wrong answer", () => {
    const run = runAgent(scenario("injection"), DEFAULT_AGENT_CONFIG)
    expect(run.success).toBe(false)
    const raw = run.events.find(event => event.kind === "observation" && event.text.includes("SYSTEM OVERRIDE"))
    expect(raw).toBeDefined()
  })

  it("the guard quarantines the payload and the task completes", () => {
    const run = runAgent(scenario("injection"), { ...DEFAULT_AGENT_CONFIG, guardInjection: true })
    expect(run.success).toBe(true)
    const quarantined = run.events.find(event => event.kind === "observation" && event.quarantined)
    expect(quarantined).toBeDefined()
    expect(run.events.some(event => event.kind === "note" && event.text.includes("quarantined"))).toBe(true)
  })
})

describe("determinism", () => {
  it("identical config produces identical traces", () => {
    const a = runAgent(scenario("runaway"), DEFAULT_AGENT_CONFIG)
    const b = runAgent(scenario("runaway"), DEFAULT_AGENT_CONFIG)
    expect(a.events).toEqual(b.events)
  })
})
