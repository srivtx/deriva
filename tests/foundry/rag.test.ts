// Foundry · Station 05 — BM25, hashing vectors, chunking, hygiene.

import { describe, expect, it } from "vitest"
import {
  BENCH_CORPUS,
  LIMITS_QUERY,
  MANUAL_DOCUMENT,
  MANUAL_KEY_SENTENCE,
  MANUAL_QUERY,
  buildBM25,
  bm25Scores,
  chunkContainsSentence,
  chunkDocument,
  expandQuery,
  hashEmbed,
  hygieneFilter,
  cosine,
  vectorScores,
} from "../../src/foundry/engine-rag"

describe("bm25Scores", () => {
  const index = buildBM25(BENCH_CORPUS)

  it("keyword stuffing outranks the true answer — the trap is real", () => {
    const ranked = bm25Scores(LIMITS_QUERY, index)
    expect(ranked[0].id).toBe("stuffed")
  })

  it("corpus hygiene removes the stuffed chunk and lets the truth win", () => {
    const cleaned = hygieneFilter(BENCH_CORPUS)
    expect(cleaned.map(chunk => chunk.id)).not.toContain("stuffed")
    const ranked = bm25Scores(LIMITS_QUERY, buildBM25(cleaned))
    expect(ranked[0].id).toBe("truth-memory")
  })

  it("scores are deterministic", () => {
    expect(bm25Scores(LIMITS_QUERY, index)).toEqual(bm25Scores(LIMITS_QUERY, index))
  })
})

describe("hashEmbed + cosine", () => {
  it("unit norm, shared vocabulary means high cosine", () => {
    const a = hashEmbed("cache memory limits")
    const norm = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0))
    expect(norm).toBeCloseTo(1, 5)
    expect(cosine(a, hashEmbed("cache memory limits again"))).toBeGreaterThan(0.3)
    expect(cosine(a, hashEmbed("rotating signed short-lived keys"))).toBeLessThan(0.2)
  })

  it("is blind to synonyms — ram and memory hash apart (the honest failure)", () => {
    const ram = hashEmbed("ram")
    const memory = hashEmbed("memory")
    expect(cosine(ram, memory)).toBeLessThan(0.3)
  })

  it("vector retrieval is ALSO fooled by stuffing", () => {
    const ranked = vectorScores(LIMITS_QUERY, BENCH_CORPUS)
    expect(ranked[0].id).toBe("stuffed")
  })
})

describe("expandQuery", () => {
  it("maps ram to memory", () => {
    expect(expandQuery("how much ram")).toBe("how much ram memory")
  })
})

describe("chunkDocument", () => {
  it("cuts the key sentence in half at size 30 / overlap 0", () => {
    const chunks = chunkDocument(MANUAL_DOCUMENT, 30, 0)
    expect(chunks.length).toBeGreaterThanOrEqual(3)
    expect(chunks.some(chunk => chunkContainsSentence(chunk, MANUAL_KEY_SENTENCE))).toBe(false)
  })

  it("keeps the key sentence whole at size 60 / overlap 20, and retrieval finds it", () => {
    const chunks = chunkDocument(MANUAL_DOCUMENT, 60, 20)
    const withSentence = chunks.filter(chunk => chunkContainsSentence(chunk, MANUAL_KEY_SENTENCE))
    expect(withSentence.length).toBeGreaterThanOrEqual(1)
    const ranked = bm25Scores(MANUAL_QUERY, buildBM25(chunks))
    expect(ranked[0].score).toBeGreaterThan(0)
    expect(chunkContainsSentence(ranked[0], MANUAL_KEY_SENTENCE)).toBe(true)
  })

  it("overlap makes chunk windows advance by size minus overlap", () => {
    const chunks = chunkDocument("one two three four five six seven eight nine ten", 4, 2)
    expect(chunks[0].text).toBe("one two three four")
    expect(chunks[1].text).toBe("three four five six")
  })
})
