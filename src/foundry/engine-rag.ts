// Station 05 — Retrieval Bench.
// A RAG pipeline with every classic failure authored in: BM25 scoring (the
// real Robertson-Zaragoza formula), feature-hashing vector embeddings with
// cosine similarity (the hashing trick — real, untrained, and blind to
// synonyms on purpose), word-count chunking with overlap, and a small
// query-expansion rewrite so the vocabulary-mismatch lesson has a fix.

export type Chunk = { id: string; text: string }

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "is", "are", "was", "were", "in", "on",
  "for", "with", "how", "much", "does", "do", "you", "it", "its", "this", "that",
  "can", "be", "at", "by", "from", "as", "what",
])

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9'+]+/)
    .filter(token => token.length > 1 && !STOPWORDS.has(token))
}

// ── BM25 (Robertson & Zaragoza 2009) ──

export type BM25Index = {
  chunks: Chunk[]
  docTokens: string[][]
  df: Map<string, number>
  avgdl: number
}

export function buildBM25(chunks: Chunk[]): BM25Index {
  const docTokens = chunks.map(chunk => tokenizeText(chunk.text))
  const df = new Map<string, number>()
  for (const tokens of docTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1)
  }
  const avgdl = docTokens.reduce((acc, tokens) => acc + tokens.length, 0) / Math.max(1, docTokens.length)
  return { chunks, docTokens, df, avgdl }
}

export function bm25Scores(query: string, index: BM25Index, k1 = 1.5, b = 0.75): { id: string; score: number; text: string }[] {
  const terms = tokenizeText(query)
  const N = index.chunks.length
  return index.chunks
    .map((chunk, i) => {
      const tokens = index.docTokens[i]
      const counts = new Map<string, number>()
      for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1)
      let score = 0
      for (const term of terms) {
        const tf = counts.get(term) ?? 0
        if (tf === 0) continue
        const df = index.df.get(term) ?? 0
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * tokens.length) / index.avgdl)))
      }
      return { id: chunk.id, score, text: chunk.text }
    })
    .sort((a, b2) => b2.score - a.score || (a.id < b2.id ? -1 : 1))
}

// ── Feature-hashing embeddings + cosine (the hashing trick) ──

function fnv1a(token: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function hashEmbed(text: string, dims = 32): number[] {
  const vector = new Array<number>(dims).fill(0)
  for (const token of tokenizeText(text)) {
    const hash = fnv1a(token)
    const dim = hash % dims
    const sign = (hash >>> 16) & 1 ? 1 : -1
    vector[dim] += sign
  }
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0))
  return norm === 0 ? vector : vector.map(v => v / norm)
}

export function cosine(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function vectorScores(query: string, chunks: Chunk[]): { id: string; score: number; text: string }[] {
  const queryVector = hashEmbed(query)
  return chunks
    .map(chunk => ({ id: chunk.id, score: cosine(queryVector, hashEmbed(chunk.text)), text: chunk.text }))
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1))
}

// ── Chunking (word-count windows with overlap) ──

export function chunkDocument(text: string, sizeWords: number, overlapWords: number): Chunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: Chunk[] = []
  const step = Math.max(1, sizeWords - overlapWords)
  for (let start = 0; start < words.length; start += step) {
    const slice = words.slice(start, start + sizeWords)
    if (slice.length === 0) break
    chunks.push({ id: `c${chunks.length + 1}`, text: slice.join(" ") })
    if (start + sizeWords >= words.length) break
  }
  return chunks
}

export function chunkContainsSentence(chunk: Chunk, sentence: string): boolean {
  return chunk.text.toLowerCase().includes(sentence.toLowerCase())
}

// ── Corpus hygiene (the production answer to keyword stuffing) ──
// Rankers can be gamed; real retrieval quality is defended at the corpus.
// This filter drops chunks where a single term repeats more than `maxRepeat`
// times — the classic spam heuristic.
export function hygieneFilter(chunks: Chunk[], maxRepeat = 5): Chunk[] {
  return chunks.filter(chunk => {
    const counts = new Map<string, number>()
    for (const token of tokenizeText(chunk.text)) counts.set(token, (counts.get(token) ?? 0) + 1)
    for (const count of counts.values()) if (count > maxRepeat) return false
    return true
  })
}

// ── Query expansion (the production fix for vocabulary mismatch) ──

export const SYNONYM_MAP: Record<string, string[]> = {
  ram: ["memory"],
  memory: ["ram"],
  gpu: ["card", "accelerator"],
  quick: ["fast"],
  big: ["large"],
}

export function expandQuery(query: string): string {
  const tokens = query.toLowerCase().split(/\s+/)
  const expanded = tokens.flatMap(token => [token, ...(SYNONYM_MAP[token] ?? [])])
  return [...new Set(expanded)].join(" ")
}

// ── The bench corpus: a fictional server manual with authored failure modes ──

export const BENCH_CORPUS: Chunk[] = [
  {
    id: "truth-memory",
    text:
      "The inference server allocates a KV cache memory pool of 4 GB per GPU. The memory pool is shared by all concurrent requests, and when it is exhausted the server preempts the longest-running request.",
  },
  {
    id: "stuffed",
    text:
      "cache memory cache memory cache memory cache memory cache memory limits limit limits — the cache memory limits page lists cache memory limits for cache memory limits administrators.",
  },
  {
    id: "truth-quota",
    text:
      "The daily token quota is 1.2 million tokens per workspace. When the quota is reached the gateway returns code 429 until the next UTC midnight.",
  },
  {
    id: "irrelevant-auth",
    text: "Authentication uses short-lived tokens signed with a rotating key. Tokens expire after fifteen minutes and must be refreshed through the session endpoint.",
  },
  {
    id: "truth-latency",
    text: "The median time to first token is 220 milliseconds from the nearest region. Cold starts after a scale-to-zero event add up to four seconds.",
  },
  {
    id: "irrelevant-billing",
    text: "Billing is computed monthly from metered usage. Invoices separate input tokens from output tokens because output tokens are priced at three times the input rate.",
  },
]

export const BENCH_QUERY = "how much ram does the server need"
export const LIMITS_QUERY = "what are the cache memory limits"

export const MANUAL_DOCUMENT =
  "The inference server boots in three stages: config load, model load, and warmup. " +
  "During config load the server reads the deployment manifest and validates every required field. " +
  "Model load streams the quantized weights into GPU memory with pinned host buffers. " +
  "Warmup issues two dummy requests so the first real request does not pay the compilation cost. " +
  "The daily token quota is 1.2 million tokens per workspace. " +
  "When the quota is reached the gateway returns code 429 until the next UTC midnight. " +
  "Quota resets are atomic and visible to all gateway replicas within one second. " +
  "Administrators can raise the quota for a workspace through the internal console. " +
  "Every quota change is written to the audit log with the acting identity. " +
  "The audit log is retained for ninety days and is exportable as newline-delimited JSON."

export const MANUAL_QUERY = "what is the daily token quota"

export const MANUAL_KEY_SENTENCE = "The daily token quota is 1.2 million tokens per workspace."
