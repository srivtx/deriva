// Station 01 — Token Bench.
// A real byte-pair-encoding tokenizer: GPT-2-style pre-tokenization, iterative
// merge learning with deterministic tie-breaks, and rank-ordered encoding.
// Pure functions only — the page renders, this module thinks.

export type BPEMerge = { pair: [string, string]; merged: string; count: number; rank: number }

export type BPEModel = {
  vocab: string[]
  idOf: Map<string, number>
  merges: BPEMerge[]
  rankOf: Map<string, number>
  baseVocab: number
}

export type BPEEncoding = {
  pieces: string[]
  ids: number[]
  words: { word: string; pieces: string[] }[]
}

// Simplified GPT-2 pre-tokenization: letters/digits accumulate into words,
// a space attaches to the *following* word (GPT-2 keeps " word" as one unit),
// punctuation stands alone.
export function preTokenize(text: string): string[] {
  const tokens: string[] = []
  let word = ""
  let pendingSpace = false

  const flush = () => {
    if (word) tokens.push(word)
    word = ""
  }

  for (const ch of text) {
    if (/[a-zA-Z0-9']/.test(ch)) {
      if (!word && pendingSpace) word = " "
      word += ch
      pendingSpace = false
    } else if (ch === " " || ch === "\n" || ch === "\t") {
      flush()
      pendingSpace = true
    } else {
      flush()
      tokens.push(ch)
      pendingSpace = false
    }
  }
  flush()
  return tokens
}

function mergeEverywhere(symbols: string[], a: string, b: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < symbols.length) {
    if (i < symbols.length - 1 && symbols[i] === a && symbols[i + 1] === b) {
      out.push(a + b)
      i += 2
    } else {
      out.push(symbols[i])
      i += 1
    }
  }
  return out
}

export function trainBPE(corpus: string, targetVocab: number): BPEModel {
  const freq = new Map<string, number>()
  for (const word of preTokenize(corpus)) freq.set(word, (freq.get(word) ?? 0) + 1)

  const words = [...freq.entries()].map(([word, count]) => ({ symbols: Array.from(word), count }))
  const vocab = new Set<string>()
  for (const { symbols } of words) for (const s of symbols) vocab.add(s)
  const baseVocab = vocab.size

  const merges: BPEMerge[] = []
  const rankOf = new Map<string, number>()

  while (vocab.size < targetVocab) {
    const pairCounts = new Map<string, number>()
    for (const { symbols, count } of words) {
      for (let i = 0; i < symbols.length - 1; i++) {
        const key = `${symbols[i]}\0${symbols[i + 1]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + count)
      }
    }
    // Only merges that repeat can be learned; ties break lexicographically
    // so training is fully deterministic.
    let bestKey: string | null = null
    let bestCount = 1
    for (const [key, count] of pairCounts) {
      if (count > bestCount || (count === bestCount && bestKey !== null && key < bestKey)) {
        bestKey = key
        bestCount = count
      }
    }
    if (bestKey === null) break

    const [a, b] = bestKey.split("\0")
    const merged = a + b
    for (const word of words) word.symbols = mergeEverywhere(word.symbols, a, b)
    vocab.add(merged)
    rankOf.set(bestKey, merges.length)
    merges.push({ pair: [a, b], merged, count: bestCount, rank: merges.length })
  }

  const vocabList = [...vocab]
  const idOf = new Map(vocabList.map((sym, i) => [sym, i]))
  return { vocab: vocabList, idOf, merges, rankOf, baseVocab }
}

// Encode one word, honoring only merges learned before `rankLimit`.
// The merge-walker mission uses this to replay history.
export function encodeWord(word: string, model: BPEModel, rankLimit = model.merges.length): string[] {
  let symbols = Array.from(word)
  let guard = 0
  while (guard++ < 200) {
    let bestRank = Infinity
    let bestIndex = -1
    for (let i = 0; i < symbols.length - 1; i++) {
      const rank = model.rankOf.get(`${symbols[i]}\0${symbols[i + 1]}`)
      if (rank !== undefined && rank < rankLimit && rank < bestRank) {
        bestRank = rank
        bestIndex = i
      }
    }
    if (bestIndex === -1) break
    symbols = mergeEverywhere(symbols, symbols[bestIndex], symbols[bestIndex + 1])
  }
  return symbols
}

export function encodeBPE(text: string, model: BPEModel): BPEEncoding {
  const words: { word: string; pieces: string[] }[] = []
  const pieces: string[] = []
  for (const word of preTokenize(text)) {
    const wordPieces = encodeWord(word, model)
    words.push({ word, pieces: wordPieces })
    pieces.push(...wordPieces)
  }
  const ids = pieces.map(piece => model.idOf.get(piece) ?? -1)
  return { pieces, ids, words }
}

export function tokenCount(encoding: BPEEncoding): number {
  return encoding.pieces.length
}

export function tokenCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion
}

export const BPE_CORPUS = [
  "the model reads the tokens and writes the tokens",
  "the model reads the context and predicts the next token",
  "the cache stores the keys and the values for the tokens",
  "the context window fills with tokens as the model reads",
  "the tokens are the words the model can see",
  "the price of the tokens is the price of the request",
  "the model predicts the next token from the context",
  "the keys and the values are stored in the cache",
  "the model sees the tokens and the tokens carry the meaning",
  "the request is priced per token and the tokens are counted",
  "the values in the cache are reused when the tokens repeat",
  "the context is the window the model can attend to",
  "the next token is sampled from the distribution",
  "the distribution is shaped by the temperature and the top p",
  "the model is served on the gpu and the cache is on the memory",
  "the memory bandwidth is the limit of the decode step",
  "the batch is filled with requests and the requests carry tokens",
  "the tokens are counted and the price is computed",
  "the words are split into tokens and the tokens are split into bytes",
  "the bytes are merged into tokens when the pair repeats",
  "the pair that repeats the most is merged first",
  "the merge is learned from the corpus and stored in the vocab",
  "the vocab is the list of tokens the model can read",
  "the model reads the vocab and the vocab holds the tokens",
  "the quantized model keeps fewer bytes per weight",
  "the weights are quantized and the cache is quantized too",
  "the attention heads read the keys and the values",
  "the attention weights show which tokens matter",
].join("\n")
