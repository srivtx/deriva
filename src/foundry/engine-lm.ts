// Station 02 — Sampling Deck.
// A word-level n-gram language model with its probability surface exposed,
// plus the real decoding stack: temperature (power / T renormalization),
// top-k truncation, nucleus (top-p) truncation, Shannon entropy, and a
// seeded RNG so every run is replayable. Pure functions only.

export type Dist = { token: string; p: number }

export type LM = {
  trigram: Map<string, Map<string, number>>
  bigram: Map<string, Map<string, number>>
  unigram: Map<string, number>
  total: number
}

export type SamplingParams = {
  temperature: number // 0 = greedy argmax
  topK: number // 0 or >= candidates = no cut
  topP: number // >= 0.999 = no cut
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function trainLM(corpus: string): LM {
  const trigram = new Map<string, Map<string, number>>()
  const bigram = new Map<string, Map<string, number>>()
  const unigram = new Map<string, number>()
  let total = 0

  for (const line of corpus.split("\n")) {
    const tokens = line.split(" ").filter(Boolean)
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      unigram.set(token, (unigram.get(token) ?? 0) + 1)
      total += 1
      if (i + 1 < tokens.length) {
        const next = tokens[i + 1]
        const bi = bigram.get(token) ?? new Map<string, number>()
        bi.set(next, (bi.get(next) ?? 0) + 1)
        bigram.set(token, bi)
      }
      if (i + 2 < tokens.length) {
        const key = `${tokens[i]} ${tokens[i + 1]}`
        const next = tokens[i + 2]
        const tri = trigram.get(key) ?? new Map<string, number>()
        tri.set(next, (tri.get(next) ?? 0) + 1)
        trigram.set(key, tri)
      }
    }
  }
  return { trigram, bigram, unigram, total }
}

export type BackoffLevel = "trigram" | "bigram" | "unigram"

// Backoff like a real n-gram LM: the longest context that has been seen
// wins — even when it is confidently one-hot (that IS an n-gram prediction).
export function nextDistribution(model: LM, w1: string, w2: string): { dist: Dist[]; level: BackoffLevel } {
  const tri = model.trigram.get(`${w1} ${w2}`)
  if (tri) {
    let count = 0
    for (const c of tri.values()) count += c
    return {
      dist: [...tri.entries()].map(([token, c]) => ({ token, p: c / count })).sort((a, b) => b.p - a.p || (a.token < b.token ? -1 : 1)),
      level: "trigram",
    }
  }
  const bi = model.bigram.get(w2)
  if (bi) {
    let count = 0
    for (const c of bi.values()) count += c
    return {
      dist: [...bi.entries()].map(([token, c]) => ({ token, p: c / count })).sort((a, b) => b.p - a.p || (a.token < b.token ? -1 : 1)),
      level: "bigram",
    }
  }
  return {
    dist: [...model.unigram.entries()].map(([token, c]) => ({ token, p: c / model.total })).sort((a, b) => b.p - a.p || (a.token < b.token ? -1 : 1)),
    level: "unigram",
  }
}

// Temperature as the softmax-on-logs equivalent: p^(1/T) renormalized.
// T -> 0 collapses to the argmax (one-hot); T = 1 is the model's own belief.
export function applyTemperature(dist: Dist[], temperature: number): Dist[] {
  if (temperature <= 0.01) {
    const top = dist.reduce((best, item) => (item.p > best.p ? item : best), dist[0])
    return [{ token: top.token, p: 1 }]
  }
  const weights = dist.map(item => ({ token: item.token, w: Math.pow(item.p, 1 / temperature) }))
  const sum = weights.reduce((acc, item) => acc + item.w, 0)
  return weights.map(item => ({ token: item.token, p: item.w / sum }))
}

export function applyTopK(dist: Dist[], k: number): Dist[] {
  if (k <= 0 || k >= dist.length) return dist
  const kept = dist.slice(0, k)
  const sum = kept.reduce((acc, item) => acc + item.p, 0)
  return kept.map(item => ({ token: item.token, p: item.p / sum }))
}

// Nucleus truncation (Holtzman et al. 2020): keep the smallest set of tokens
// whose cumulative mass reaches p — always at least one token survives.
export function applyTopP(dist: Dist[], p: number): Dist[] {
  if (p >= 0.999) return dist
  const kept: Dist[] = []
  let cumulative = 0
  for (const item of dist) {
    kept.push(item)
    cumulative += item.p
    if (cumulative >= p) break
  }
  const sum = kept.reduce((acc, item) => acc + item.p, 0)
  return kept.map(item => ({ token: item.token, p: item.p / sum }))
}

export function entropy(dist: Dist[]): number {
  return -dist.reduce((acc, item) => (item.p > 0 ? acc + item.p * Math.log2(item.p) : acc), 0)
}

export function sampleFrom(dist: Dist[], rng: () => number): string {
  let r = rng()
  for (const item of dist) {
    r -= item.p
    if (r <= 0) return item.token
  }
  return dist[dist.length - 1].token
}

export type PipelineResult = { dist: Dist[]; level: BackoffLevel; entropyBits: number }

// The full production decode path: model distribution -> temperature -> top-k -> top-p.
export function samplingPipeline(model: LM, w1: string, w2: string, params: SamplingParams): PipelineResult {
  const base = nextDistribution(model, w1, w2)
  const heated = applyTemperature(base.dist, params.temperature)
  const cut = applyTopP(applyTopK(heated, params.topK), params.topP)
  return { dist: cut, level: base.level, entropyBits: entropy(cut) }
}

export function generate(
  model: LM,
  seedTokens: string[],
  steps: number,
  params: SamplingParams,
  seed: number,
): string[] {
  const rng = mulberry32(seed)
  const out = [...seedTokens]
  for (let i = 0; i < steps; i++) {
    const w1 = out.length >= 2 ? out[out.length - 2] : ""
    const w2 = out[out.length - 1]
    const { dist } = samplingPipeline(model, w1, w2, params)
    out.push(sampleFrom(dist, rng))
  }
  return out.slice(seedTokens.length)
}

export const LM_CORPUS = [
  "the model reads the tokens",
  "the model reads the context",
  "the model reads the cache",
  "the model reads the vocab",
  "the model writes the tokens",
  "the model writes the context",
  "the model predicts the next token",
  "the model predicts the distribution",
  "the model predicts the answer",
  "the cache stores the keys",
  "the cache stores the values",
  "the cache stores the tokens",
  "the cache stores the pages",
  "the temperature shapes the distribution",
  "the temperature flattens the distribution",
  "the temperature sharpens the distribution",
  "the temperature changes the distribution",
  "the top p cuts the tail",
  "the top k keeps the head",
  "the nucleus keeps the mass",
  "the sampler picks the token",
  "the sampler picks the token",
  "the sampler picks the token",
  "the sampler picks the word",
  "the sampler picks the path",
  "the keys and the values feed the attention",
  "the attention reads the keys",
  "the attention reads the values",
  "the attention mixes the context",
  "the batch fills with requests",
  "the batch fills with tokens",
  "the requests carry the tokens",
  "the requests carry the context",
  "the gpu runs the model",
  "the gpu runs the batch",
  "the memory holds the cache",
  "the memory holds the weights",
  "the memory holds the keys",
  "the price counts the tokens",
  "the price counts the requests",
  "the answer comes from the context",
  "the answer comes from the cache",
  "the answer comes from the tokens",
].join("\n")
