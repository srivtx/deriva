// Foundry · Station 01 — BPE tokenizer engine.

import { describe, expect, it } from "vitest"
import { BPE_CORPUS, encodeBPE, encodeWord, preTokenize, tokenCost, trainBPE } from "../../src/foundry/engine-bpe"

describe("preTokenize", () => {
  it("keeps GPT-2 style leading spaces attached to words", () => {
    expect(preTokenize("the model, works")).toEqual(["the", " model", ",", " works"])
  })

  it("stands punctuation alone", () => {
    expect(preTokenize("a.b")).toEqual(["a", ".", "b"])
  })
})

describe("trainBPE", () => {
  it("learns the classic merges on a toy corpus", () => {
    const model = trainBPE("low low low lower", 8)
    expect(model.merges.map(merge => merge.pair)).toEqual([["l", "o"], ["lo", "w"]])
  })

  it("is deterministic across runs", () => {
    const a = trainBPE(BPE_CORPUS, 150)
    const b = trainBPE(BPE_CORPUS, 150)
    expect(a.merges).toEqual(b.merges)
  })

  it("only learns merges that repeat", () => {
    const model = trainBPE(BPE_CORPUS, 150)
    for (const merge of model.merges) expect(merge.count).toBeGreaterThanOrEqual(2)
  })

  it("respects the vocabulary target", () => {
    const model = trainBPE(BPE_CORPUS, 150)
    expect(model.vocab.length).toBeGreaterThanOrEqual(140)
    expect(model.vocab.length).toBeLessThanOrEqual(150)
  })
})

describe("encodeBPE", () => {
  const model = trainBPE(BPE_CORPUS, 150)

  it("reuses learned merges and never invents pieces", () => {
    const encoding = encodeBPE("the model reads the tokens", model)
    for (const id of encoding.ids) expect(id).toBeGreaterThanOrEqual(0)
    expect(encoding.pieces.length).toBeLessThan(encoding.pieces.join("").length)
  })

  it("splits rare words into more pieces than common ones", () => {
    const common = encodeBPE("the model reads the tokens", model)
    const rare = encodeBPE("obfuscation quartermaster", model)
    const commonRatio = common.pieces.length / common.pieces.join("").length
    const rareRatio = rare.pieces.length / rare.pieces.join("").length
    expect(rareRatio).toBeGreaterThan(commonRatio)
  })

  it("honors a merge-rank budget (the merge walker)", () => {
    const full = encodeWord(" tokens", model)
    const early = encodeWord(" tokens", model, 3)
    expect(early.length).toBeGreaterThanOrEqual(full.length)
  })
})

describe("tokenCost", () => {
  it("prices a million-token request at the list price", () => {
    expect(tokenCost(1_000_000, 3)).toBe(3)
    expect(tokenCost(500_000, 2)).toBe(1)
  })
})
