// Station 03 — Attention Lens.
// A single attention head with the covers off. Embeddings are computed the
// classic way — windowed co-occurrence counts over a corpus (LSA-style) —
// then mixed with real sinusoidal positional encodings. Q, K and V are the
// identity projection (an untrained frozen head), so the geometry you read
// IS the mechanism: score = q·k / sqrt(d), softmax row, weighted sum of V.

export type Embedding = number[]

export type AttentionTrace = {
  tokens: string[]
  inputs: Embedding[]
  scores: number[][]
  weights: number[][]
  outputs: Embedding[]
}

const STOP = new Set(["the", "a", "and", "of", "to", "is", "was", "it", "in", "on", "with", "for"])

export function tokenizeCorpus(corpus: string): string[] {
  return corpus
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(token => token.length > 0 && !STOP.has(token))
}

// Windowed co-occurrence embeddings: dimension v of a word's vector counts
// how often it appears near the v-th most frequent corpus word. This is the
// honest ancestor of every dense embedding you will meet in production.
export function buildEmbeddings(corpus: string, d: number): Map<string, Embedding> {
  const tokens = tokenizeCorpus(corpus)
  const freq = new Map<string, number>()
  for (const token of tokens) freq.set(token, (freq.get(token) ?? 0) + 1)
  const contextWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, d)
    .map(([word]) => word)
  const contextIndex = new Map(contextWords.map((word, i) => [word, i]))

  const vectors = new Map<string, number[]>()
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if ((freq.get(token) ?? 0) < 2) continue
    const vector = vectors.get(token) ?? new Array<number>(d).fill(0)
    for (let delta = -2; delta <= 2; delta++) {
      if (delta === 0) continue
      const neighbor = tokens[i + delta]
      if (neighbor === undefined) continue
      const dim = contextIndex.get(neighbor)
      if (dim !== undefined) vector[dim] += 1
    }
    vectors.set(token, vector)
  }

  const normalized = new Map<string, Embedding>()
  for (const [word, vector] of vectors) {
    const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1
    normalized.set(word, vector.map(v => v / norm))
  }
  return normalized
}

// Real sinusoidal positional encoding (Vaswani et al. 2017), L2-normalized
// so semantic and positional signals contribute comparable magnitude.
export function positionalEncoding(pos: number, d: number): Embedding {
  const out = new Array<number>(d).fill(0)
  for (let i = 0; i < d / 2; i++) {
    const wavelength = Math.pow(10000, (2 * i) / d)
    out[2 * i] = Math.sin(pos / wavelength)
    out[2 * i + 1] = Math.cos(pos / wavelength)
  }
  const norm = Math.sqrt(out.reduce((acc, v) => acc + v * v, 0)) || 1
  return out.map(v => v / norm)
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

function softmaxRow(row: number[]): number[] {
  const max = Math.max(...row)
  const exps = row.map(v => Math.exp(v - max))
  const sum = exps.reduce((acc, v) => acc + v, 0)
  return exps.map(v => v / sum)
}

export function selfAttention(
  tokens: string[],
  embeddings: Map<string, Embedding>,
  options: { scale?: boolean } = {},
): AttentionTrace {
  const d = 8
  const scale = options.scale !== false
  const inputs = tokens.map((token, pos) => {
    const semantic = embeddings.get(token.toLowerCase()) ?? new Array<number>(d).fill(0)
    const positional = positionalEncoding(pos, d)
    return semantic.map((v, i) => v + positional[i])
  })

  const scores = inputs.map(qi => inputs.map(kj => dot(qi, kj) * (scale ? 1 / Math.sqrt(d) : 1)))
  const weights = scores.map(row => softmaxRow(row))
  const outputs = inputs.map((_, i) =>
    inputs[0].map((__, dim) => weights[i].reduce((acc, w, j) => acc + w * inputs[j][dim], 0)),
  )
  return { tokens, inputs, scores, weights, outputs }
}

export type ArcStats = { weight: number; rank: number; shareOfMax: number }

export function attentionOn(trace: AttentionTrace, queryIndex: number, targetIndex: number): ArcStats {
  const row = trace.weights[queryIndex]
  const weight = row[targetIndex]
  const sorted = [...row].sort((a, b) => b - a)
  return {
    weight,
    rank: sorted.findIndex(v => v === weight) + 1,
    shareOfMax: weight / sorted[0],
  }
}

// Attention mass on a set of tokens — how much of the query's focus lands on
// the information that matters. Distractors dilute it; repeating the key
// fact at the end restores it. This is the measurable form of the
// "keep critical instructions at the edges" production rule.
export function attentionMassOn(trace: AttentionTrace, queryIndex: number, targetIndices: number[]): number {
  const row = trace.weights[queryIndex]
  return targetIndices.reduce((acc, index) => (index === queryIndex ? acc : acc + (row[index] ?? 0)), 0)
}

export function topTargets(trace: AttentionTrace, queryIndex: number, n: number): { index: number; weight: number }[] {
  const row = trace.weights[queryIndex]
  return row
    .map((weight, index) => ({ index, weight }))
    .filter(item => item.index !== queryIndex)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n)
}

// Saturation detector for the scaling mission: how one-hot are the rows?
export function saturation(trace: AttentionTrace): number {
  let maxSum = 0
  for (const row of trace.weights) maxSum += Math.max(...row)
  return maxSum / trace.weights.length
}

export const ATTENTION_CORPUS = [
  "the robot picked the wrench because the wrench was heavy",
  "the robot picked the box because the box was light",
  "the wrench was heavy and the box was light",
  "the robot lifted the heavy wrench and the light box",
  "the model reads the context and the tokens carry meaning",
  "the tokens carry meaning when the model reads them",
  "the context window holds the tokens the model can see",
  "the keys and the values are stored near the cache",
  "the cache stores the keys near the values",
  "the keys open the cache and the cache saves the keys",
  "the values near the cache are read by the attention",
  "the values are read from the cache",
  "the keys match the values in the cache",
  "keep this key because the key unlocks the launch code",
  "the launch code is kept in the notes with the key",
  "the notes keep the key and the code for the launch",
  "the launch code is kept in the notes",
  "the filler words still appear later maybe again under over both each while",
  "later again still maybe while under over both each the filler words appear",
  "what is the code the code is the launch code",
  "recall the code now because the code matters",
].join("\n")

// Mission contexts (authored so the lessons land deterministically).
export const COREFERENCE_SENTENCE = "The robot picked the wrench because it was heavy"

// The smear mission: query = last "cache", target = "keys".
// cache and keys share context dimensions (values), so their embeddings are
// genuinely similar — attention can find the pair when it is near.
export const SMEAR_BASE = [
  "the", "cache", "stores", "the", "keys", "near", "the", "values",
  "so", "what", "is", "in", "the", "cache",
]

export const SMEAR_FILLERS = [
  "later", "again", "still", "maybe", "while", "under", "over", "both",
]

export const SMEAR_RECOVERED = [
  "the", "cache", "stores", "the", "keys", "near", "the", "values",
  ...SMEAR_FILLERS,
  "so", "what", "is", "in", "the", "cache",
  "the", "cache", "saves", "the", "keys",
]

// Control: same length as RECOVERED, but the appended tokens are neutral
// fillers instead of the repeated key fact — isolating the repetition effect.
export const SMEAR_CONTROL = [
  "the", "cache", "stores", "the", "keys", "near", "the", "values",
  ...SMEAR_FILLERS,
  "so", "what", "is", "in", "the", "cache",
  ...SMEAR_FILLERS.slice(0, 5),
]

export function smearQueryIndex(tokens: string[]): number {
  return tokens.lastIndexOf("cache")
}

export function smearTargetIndex(tokens: string[]): number {
  return tokens.lastIndexOf("keys")
}
