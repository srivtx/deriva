import { describe, expect, it } from "vitest"
import {
  QWEN3_NO_THINK_SUFFIX,
  buildExactChatML,
  buildPrompt,
  cleanFinal,
  cleanVisible,
  estimateTokens,
  planHistory,
  visibleDelta,
} from "../text"

const T_OPEN = "<think>"
const T_CLOSE = "</think>"

describe("buildPrompt", () => {
  it("wraps messages in ChatML with a trailing assistant header", () => {
    const p = buildPrompt([
      { role: "system", content: "be terse" },
      { role: "user", content: "hi" },
    ])
    expect(p).toBe(
      "\n<|im_start|>system\nbe terse<|im_end|>\n<|im_start|>user\nhi<|im_end|>\n<|im_start|>assistant\n",
    )
  })

  it("appends the assistant suffix when given", () => {
    const p = buildPrompt([{ role: "user", content: "q" }], "extra")
    expect(p.endsWith("assistant\nextra")).toBe(true)
  })

  it("QWEN3_NO_THINK_SUFFIX is exactly the official empty think block", () => {
    expect(QWEN3_NO_THINK_SUFFIX).toBe(`${T_OPEN}\n\n${T_CLOSE}\n\n`)
    expect(QWEN3_NO_THINK_SUFFIX.length).toBe(T_OPEN.length + 2 + T_CLOSE.length + 2)
  })
})

describe("cleanVisible (streaming-safe)", () => {
  it("removes special tokens", () => {
    expect(cleanVisible("hi<|im_end|> there")).toBe("hi there")
  })

  it("hides an UNCLOSED think block entirely (no reasoning leak)", () => {
    expect(cleanVisible(`${T_OPEN}\nlet me think about lists`)).toBe("")
    expect(cleanVisible(`before${T_OPEN}\nreasoning...`)).toBe("before")
  })

  it("removes a CLOSED think block", () => {
    const s = `${T_OPEN}\nhidden reasoning${T_CLOSE}\n\nThe answer is 4.`
    expect(cleanVisible(s)).toBe("\n\nThe answer is 4.")
  })

  it("handles multiple closed blocks", () => {
    const s = `${T_OPEN}a${T_CLOSE}one ${T_OPEN}b${T_CLOSE}two`
    expect(cleanVisible(s)).toBe("one two")
  })

  it("holds back a partial opening tag", () => {
    expect(cleanVisible("answer: 42<")).toBe("answer: 42")
    expect(cleanVisible("answer: 42<t")).toBe("answer: 42")
    expect(cleanVisible("answer: 42<thi")).toBe("answer: 42")
    expect(cleanVisible("answer: 42<think")).toBe("answer: 42")
  })

  it("holds back a partial closing tag mid-think", () => {
    // we are inside think; a partial close must not leak any think content
    const s = `${T_OPEN}secret${T_CLOSE.slice(0, 5)}`
    expect(cleanVisible(s)).toBe("")
  })

  it("holds back a partial special token", () => {
    expect(cleanVisible("ok <|im_en")).toBe("ok ")
  })

  it("holds back a split multibyte character", () => {
    expect(cleanVisible("café\uFFFD")).toBe("café")
  })

  it("passes plain text through", () => {
    expect(cleanVisible("plain text, 2 < 3 and a < b")).toBe("plain text, 2 < 3 and a < b")
  })
})

describe("visibleDelta", () => {
  it("emits only new safe text", () => {
    const emitted = "The answer"
    const soFar = "The answer is 42."
    expect(visibleDelta(soFar, emitted)).toBe(" is 42.")
  })

  it("emits nothing while inside a think block", () => {
    const emitted = "Hel"
    const soFar = `Hel${T_OPEN}internal steps`
    expect(visibleDelta(soFar, emitted)).toBe("")
  })

  it("emits nothing when the tail is a partial tag", () => {
    expect(visibleDelta("done", "done")).toBe("")
    expect(visibleDelta("done<", "done")).toBe("")
  })

  it("streaming a think-then-answer generation never leaks the think", () => {
    let full = ""
    let shown = ""
    const steps = [
      `${T_OPEN}\nstep 1: recall defs`,
      `${T_OPEN}\nstep 1: recall defs\nstep 2: apply`,
      `${T_OPEN}\nstep 1: recall defs\nstep 2: apply${T_CLOSE}\n\n`,
      `${T_OPEN}\nstep 1: recall defs\nstep 2: apply${T_CLOSE}\n\nThe answer is 4.`,
    ]
    for (const step of steps) {
      full = step
      const piece = visibleDelta(full, shown)
      shown += piece
    }
    expect(shown).toBe("\n\nThe answer is 4.")
  })
})

describe("cleanFinal", () => {
  it("strips closed think blocks and trims", () => {
    expect(cleanFinal(`${T_OPEN}why${T_CLOSE}\n\n  Answer. `)).toBe("Answer.")
  })

  it("drops an unclosed think block (died mid-reasoning)", () => {
    expect(cleanFinal(`prefix ${T_OPEN}unfinished reasoning`)).toBe("prefix")
  })

  it("strips stray tags and replacement chars", () => {
    expect(cleanFinal(`a${T_CLOSE}b\uFFFDc`)).toBe("abc")
  })

  it("strips special tokens", () => {
    expect(cleanFinal("<|im_start|>x<|im_end|>")).toBe("x")
  })
})

/* ── v18 tutor-loop additions ──────────────────────────────────────────── */

describe("buildExactChatML", () => {
  const msgs = [
    { role: "system", content: "be terse" },
    { role: "user", content: "why sorted?" },
    { role: "assistant", content: "order lets one comparison halve the range." },
    { role: "user", content: "and unsorted?" },
  ]

  it("lfm2: startoftext BOS + every message closed + assistant header", () => {
    const p = buildExactChatML(msgs, "", "lfm2")
    expect(p).toBe(
      "<|startoftext|>" +
        "<|im_start|>system\nbe terse<|im_end|>\n" +
        "<|im_start|>user\nwhy sorted?<|im_end|>\n" +
        "<|im_start|>assistant\norder lets one comparison halve the range.<|im_end|>\n" +
        "<|im_start|>user\nand unsorted?<|im_end|>\n" +
        "<|im_start|>assistant\n",
    )
  })

  it("qwen3: no BOS, think suffix rides after the assistant header", () => {
    const p = buildExactChatML(msgs, QWEN3_NO_THINK_SUFFIX, "qwen3")
    expect(p.startsWith("<|im_start|>system")).toBe(true)
    expect(p.endsWith(`<|im_start|>assistant\n${T_OPEN}\n\n${T_CLOSE}\n\n`)).toBe(true)
  })

  it("no BOS duplication when family is omitted", () => {
    expect(buildExactChatML([{ role: "user", content: "q" }]).startsWith("<|im_start|>")).toBe(true)
  })
})

describe("estimateTokens", () => {
  it("is a positive, roughly chars/3.6 estimate", () => {
    const s = "explain binary search in plain words"
    expect(estimateTokens(s)).toBe(Math.ceil(s.length / 3.6))
    expect(estimateTokens("")).toBe(0)
    expect(estimateTokens("abcdefgh")).toBeGreaterThanOrEqual(2)
  })
})

describe("planHistory", () => {
  const mk = (n: number, text = "x".repeat(36)) => {
    const list = [] as { role: string; content: string }[]
    for (let i = 0; i < n; i++) list.push({ role: i % 2 ? "assistant" : "user", content: text })
    return list
  }
  // ~36 chars → ~10 tokens per message

  it("keeps everything when the total fits the budget", () => {
    const h = mk(6)
    const plan = planHistory(h, [10, 10, 10, 10, 10, 10], 1024)
    expect(plan.keep).toHaveLength(6)
    expect(plan.dropped).toBe(0)
    expect(plan.note).toBe("")
  })

  it("drops oldest first when over budget and reports it honestly", () => {
    const h = mk(10)
    const counts = h.map(() => 100) // 1000 tokens total, budget 300
    const plan = planHistory(h, counts, 300)
    // minKeep=4 is the floor: 6 dropped, the last 4 kept (still over budget —
    // the tutor always remembers the immediate exchange)
    expect(plan.dropped).toBe(6)
    expect(plan.keep).toHaveLength(4)
    expect(plan.keep.length + plan.dropped).toBe(10)
    expect(plan.note).toContain("trimmed")
    // the KEPT suffix must be the LATEST turns
    expect(plan.keep[plan.keep.length - 1]).toBe(h[9])
    expect(plan.keep[0]).toBe(h[plan.dropped])
  })

  it("never drops below the last 4 messages even if over budget", () => {
    const h = mk(4)
    const plan = planHistory(h, [500, 500, 500, 500], 100)
    expect(plan.keep).toHaveLength(4)
    expect(plan.dropped).toBe(0)
    expect(plan.note).toBe("")
  })

  it("tolerates a short counts array", () => {
    const h = mk(3)
    const plan = planHistory(h, [10, 10], 1024)
    expect(plan.keep).toHaveLength(2)
    expect(plan.dropped).toBe(0)
  })
})
