// Foundry · Station 02 — n-gram LM + the real decoding stack.

import { describe, expect, it } from "vitest"
import {
  LM_CORPUS,
  applyTemperature,
  applyTopK,
  applyTopP,
  entropy,
  generate,
  mulberry32,
  nextDistribution,
  samplingPipeline,
  trainLM,
} from "../../src/foundry/engine-lm"

const model = trainLM(LM_CORPUS)

describe("nextDistribution (backoff)", () => {
  it("hits the trigram when the two-word context was seen", () => {
    const { dist, level } = nextDistribution(model, "reads", "the")
    expect(level).toBe("trigram")
    expect(dist.map(item => item.token).sort()).toEqual(["cache", "context", "keys", "tokens", "values", "vocab"])
    for (const item of dist) expect(item.p).toBeCloseTo(1 / 6)
  })

  it("a confidently one-hot trigram context is still a trigram prediction", () => {
    const { dist, level } = nextDistribution(model, "cache", "stores")
    expect(level).toBe("trigram")
    expect(dist).toEqual([{ token: "the", p: 1 }])
  })

  it("falls back to the bigram, then the unigram", () => {
    expect(nextDistribution(model, "never", "the").level).toBe("bigram")
    expect(nextDistribution(model, "never", "never").level).toBe("unigram")
  })
})

describe("applyTemperature", () => {
  it("collapses to a one-hot argmax at temperature 0", () => {
    const dist = [{ token: "a", p: 0.4 }, { token: "b", p: 0.6 }]
    expect(applyTemperature(dist, 0)).toEqual([{ token: "b", p: 1 }])
  })

  it("is the identity at temperature 1 and flattens above it", () => {
    const dist = [{ token: "a", p: 0.9 }, { token: "b", p: 0.1 }]
    const t1 = applyTemperature(dist, 1)
    expect(t1[0].p).toBeCloseTo(0.9)
    const t4 = applyTemperature(dist, 4)
    expect(t4[0].p).toBeLessThan(t1[0].p)
  })
})

describe("truncation", () => {
  it("top-k keeps exactly k and renormalizes", () => {
    const dist = [{ token: "a", p: 0.5 }, { token: "b", p: 0.3 }, { token: "c", p: 0.2 }]
    const cut = applyTopK(dist, 2)
    expect(cut.map(item => item.token)).toEqual(["a", "b"])
    expect(cut.reduce((acc, item) => acc + item.p, 0)).toBeCloseTo(1)
  })

  it("top-p keeps the smallest nucleus that covers p", () => {
    const dist = [{ token: "a", p: 0.5 }, { token: "b", p: 0.3 }, { token: "c", p: 0.2 }]
    const cut = applyTopP(dist, 0.7)
    expect(cut.map(item => item.token)).toEqual(["a", "b"])
    expect(cut[0].p).toBeCloseTo(0.625)
    expect(cut[1].p).toBeCloseTo(0.375)
  })

  it("top-p always leaves at least one token alive", () => {
    const dist = [{ token: "a", p: 0.2 }, { token: "b", p: 0.2 }]
    expect(applyTopP(dist, 0.05)).toHaveLength(1)
  })
})

describe("entropy", () => {
  it("is 2 bits for a uniform four-way distribution", () => {
    expect(entropy([{ token: "a", p: 0.25 }, { token: "b", p: 0.25 }, { token: "c", p: 0.25 }, { token: "d", p: 0.25 }])).toBeCloseTo(2)
  })

  it("is 0 for a one-hot distribution", () => {
    expect(entropy([{ token: "a", p: 1 }])).toBeCloseTo(0)
  })
})

describe("generate", () => {
  const params = { temperature: 0.9, topK: 0, topP: 0.95 }

  it("is replayable: same seed, same tokens", () => {
    const a = generate(model, ["the", "model", "reads", "the"], 10, params, 42)
    const b = generate(model, ["the", "model", "reads", "the"], 10, params, 42)
    expect(a).toEqual(b)
  })

  it("greedy decoding is stable across seeds", () => {
    const greedy = { temperature: 0, topK: 0, topP: 1 }
    const a = generate(model, ["the", "model", "reads", "the"], 8, greedy, 1)
    const b = generate(model, ["the", "model", "reads", "the"], 8, greedy, 99)
    expect(a).toEqual(b)
    expect(a.length).toBe(8)
  })
})

describe("samplingPipeline", () => {
  it("applies temperature, then top-k, then top-p, and reports entropy", () => {
    const result = samplingPipeline(model, "reads", "the", { temperature: 1.8, topK: 3, topP: 0.9 })
    expect(result.level).toBe("trigram")
    expect(result.dist.length).toBeLessThanOrEqual(3)
    expect(result.dist.reduce((acc, item) => acc + item.p, 0)).toBeCloseTo(1)
    expect(result.entropyBits).toBeGreaterThan(0)
  })

  it("temperature 0 through the pipeline is one-hot with zero entropy", () => {
    const result = samplingPipeline(model, "reads", "the", { temperature: 0, topK: 0, topP: 1 })
    expect(result.dist).toHaveLength(1)
    expect(result.entropyBits).toBeCloseTo(0)
  })
})

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})
