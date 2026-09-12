// Foundry · Station 03 — the frozen attention head.

import { describe, expect, it } from "vitest"
import {
  ATTENTION_CORPUS,
  COREFERENCE_SENTENCE,
  SMEAR_BASE,
  SMEAR_CONTROL,
  SMEAR_FILLERS,
  SMEAR_RECOVERED,
  attentionMassOn,
  attentionOn,
  buildEmbeddings,
  positionalEncoding,
  saturation,
  selfAttention,
  smearQueryIndex,
  smearTargetIndex,
  topTargets,
} from "../../src/foundry/engine-attention"

const embeddings = buildEmbeddings(ATTENTION_CORPUS, 8)

describe("buildEmbeddings", () => {
  it("produces unit-norm vectors for frequent words", () => {
    for (const word of ["wrench", "code", "cache"]) {
      const vector = embeddings.get(word)
      expect(vector).toBeDefined()
      const norm = Math.sqrt((vector ?? []).reduce((acc, v) => acc + v * v, 0))
      expect(norm).toBeCloseTo(1, 5)
    }
  })

  it("gives related words more similar vectors than unrelated ones", () => {
    const cos = (a?: number[]) => {
      const b = embeddings.get("cache") ?? []
      let sum = 0
      ;(a ?? []).forEach((v, i) => (sum += v * b[i]))
      return sum
    }
    expect(cos(embeddings.get("keys"))).toBeGreaterThan(cos(embeddings.get("robot")))
  })
})

describe("positionalEncoding", () => {
  it("differs by position and stays unit norm", () => {
    const a = positionalEncoding(0, 8)
    const b = positionalEncoding(5, 8)
    expect(a).not.toEqual(b)
    expect(Math.sqrt(a.reduce((acc, v) => acc + v * v, 0))).toBeCloseTo(1, 5)
  })
})

describe("selfAttention", () => {
  const tokens = COREFERENCE_SENTENCE.split(" ")
  const trace = selfAttention(tokens, embeddings)

  it("every softmax row sums to 1", () => {
    for (const row of trace.weights) expect(row.reduce((acc, w) => acc + w, 0)).toBeCloseTo(1)
  })

  it("weights are probabilities in (0,1)", () => {
    for (const row of trace.weights) for (const w of row) {
      expect(w).toBeGreaterThan(0)
      expect(w).toBeLessThan(1)
    }
  })

  it("self-attention is non-trivial (the diagonal is not always max)", () => {
    const rowMaxIndices = trace.weights.map(row => row.indexOf(Math.max(...row)))
    expect(new Set(rowMaxIndices).size).toBeGreaterThan(1)
  })

  it("topTargets excludes the query token itself", () => {
    const targets = topTargets(trace, 6, 3)
    expect(targets).toHaveLength(3)
    expect(targets.every(target => target.index !== 6)).toBe(true)
    expect(targets[0].weight).toBeGreaterThanOrEqual(targets[1].weight)
  })

  it("1/sqrt(d) scaling reduces softmax saturation", () => {
    const unscaled = selfAttention(tokens, embeddings, { scale: false })
    expect(saturation(unscaled)).toBeGreaterThan(saturation(trace))
  })
})

describe("the smear-and-recover lesson (Lost in the Middle)", () => {
  const smeared = [...SMEAR_BASE.slice(0, 8), ...SMEAR_FILLERS, ...SMEAR_BASE.slice(8)]
  const mass = (tokens: string[], includeTail = false) => {
    const trace = selfAttention(tokens, embeddings)
    const query = smearQueryIndex(tokens)
    const info = tokens.map((_, i) => i).filter(i => i < 8 || (includeTail && i >= 22))
    return attentionMassOn(trace, query, info)
  }

  it("fillers dilute attention on the key fact", () => {
    expect(mass(smeared)).toBeLessThan(mass(SMEAR_BASE))
  })

  it("padding the context with noise dilutes it further (the control)", () => {
    expect(mass(SMEAR_CONTROL)).toBeLessThan(mass(smeared))
  })

  it("repeating the key fact at the end restores attention mass", () => {
    const control = mass(SMEAR_CONTROL)
    const recovered = mass(SMEAR_RECOVERED, true)
    expect(recovered).toBeGreaterThan(control + 0.1)
    expect(recovered).toBeGreaterThan(mass(smeared))
  })

  it("the target token itself climbs back toward the top when repeated", () => {
    const smearedTrace = selfAttention(smeared, embeddings)
    const before = attentionOn(smearedTrace, smearQueryIndex(smeared), smearTargetIndex(smeared)).rank
    const recoveredTrace = selfAttention(SMEAR_RECOVERED, embeddings)
    const after = attentionOn(recoveredTrace, smearQueryIndex(SMEAR_RECOVERED), smearTargetIndex(SMEAR_RECOVERED)).rank
    expect(after).toBeLessThan(before)
  })
})
