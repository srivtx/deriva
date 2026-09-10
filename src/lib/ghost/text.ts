/* Ghost prompt building + output cleaning — pure functions, no browser deps.
 *
 * Why this module exists (the v15 pass):
 * · Qwen3's official NON-THINKING recipe appends an EMPTY think block after
 *   the assistant header. Verified byte-for-byte against Qwen/Qwen3-0.6B's
 *   chat_template (tokenizer_config.json):
 *
 *       {%- if add_generation_prompt %}
 *           {{- '<|im_start|>assistant\n' }}
 *           {%- if enable_thinking is defined and enable_thinking is false %}
 *               {{- '<think>\n\n</think>\n\n' }}
 *           {%- endif %}
 *       {%- endif %}
 *
 *   The v14 engine shipped only "\n\n" — the think block was never opened or
 *   closed, so Qwen3 entered thinking mode on EVERY reply: it burned up to
 *   nPredict hidden reasoning tokens (3x the answer latency), the raw
 *   reasoning leaked into the stream, and replies often died at the token
 *   cap mid-think. This was the root cause of "0.6 qwen is very slow".
 * · Cleaning used to run per-STREAM-PIECE, which cannot remove a think
 *   block that spans many pieces (its tags sit in different pieces). The
 *   cleaner here runs over the FULL text so far and emits a visible slice
 *   that is safe to diff against what was already shown.
 */

export interface PromptMessage {
  role: string
  content: string
}

/** Qwen3 non-thinking contract — appended after `<|im_start|>assistant\n` */
export const QWEN3_NO_THINK_SUFFIX = "<think>\n\n</think>\n\n"

export const THINK_OPEN = "<think>"
export const THINK_CLOSE = "</think>"

/** ChatML special tokens — LFM2 uses a ChatML-like template (Liquid docs),
 *  Qwen3 uses ChatML; both speak `<|im_start|>…<|im_end|>`. */
const SPECIAL_TOKEN_RE = /<\|[a-zA-Z0-9_.-]+\|>/g

const CLOSED_THINK_RE = /<think>[\s\S]*?<\/think>/g
const CLOSED_THINKING_RE = /<thinking>[\s\S]*?<\/thinking>/g
const STRAY_THINK_TAG_RE = /<\/?(?:think|thinking)>/g

/** tails that may still grow into a control tag are held back until the
 *  next piece arrives, so the UI never flashes half a tag. */
const HOLD_TAGS = [THINK_OPEN, THINK_CLOSE]
const MAX_HOLD = THINK_CLOSE.length // 8

function holdbackTail(s: string): string {
  if (!s) return s
  // split multi-byte character at the piece boundary (decoded to U+FFFD)
  if (s.endsWith("\uFFFD")) return s.slice(0, -1)
  // partial "<|…|" special token still in flight
  const partial = /<\|[a-zA-Z0-9_.-]*$/.exec(s)
  if (partial) return s.slice(0, -partial[0].length)
  // partial "<think" / "</thin" — longest possible tail first
  for (let len = Math.min(MAX_HOLD - 1, s.length); len >= 1; len--) {
    const tail = s.slice(-len)
    if (HOLD_TAGS.some(t => t.startsWith(tail))) return s.slice(0, -len)
  }
  return s
}

function stripClosedBlocks(s: string): string {
  return s.replace(CLOSED_THINK_RE, "").replace(CLOSED_THINKING_RE, "")
}

function stripUnclosedThink(s: string): string {
  const open = s.lastIndexOf(THINK_OPEN)
  if (open >= 0) return s.slice(0, open)
  return s
}

/** Clean the FULL text so far for display while streaming.
 *  Result is safe to diff: whatever it returns only ever grows (per input
 *  prefix) — closed think blocks disappear entirely, an OPEN think block
 *  hides everything after it, partial control tags are held back. */
export function cleanVisible(raw: string): string {
  let s = raw.replace(SPECIAL_TOKEN_RE, "")
  s = stripClosedBlocks(s)
  s = stripUnclosedThink(s)
  s = s.replace(STRAY_THINK_TAG_RE, "")
  return holdbackTail(s)
}

/** Clean the final, complete generation. Also drops an unclosed think
 *  block (generation died inside reasoning) and stray replacement chars. */
export function cleanFinal(raw: string): string {
  let s = raw.replace(SPECIAL_TOKEN_RE, "")
  s = stripClosedBlocks(s)
  s = stripUnclosedThink(s)
  s = s.replace(STRAY_THINK_TAG_RE, "")
  s = s.replace(/\uFFFD/g, "")
  return s.trim()
}

/** Build the ChatML prompt. Mirrors what both tokenizers expect:
 *  LFM2 (`<|startoftext|><|im_start|>system …<|im_end|>…`) and Qwen3. */
export function buildPrompt(
  messages: PromptMessage[],
  assistantSuffix?: string,
): string {
  const body = messages
    .map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
    .join("\n")
  return `\n${body}\n<|im_start|>assistant\n${assistantSuffix ?? ""}`
}

/** Diff helper: given what was already emitted, return the next safe
 *  visible delta ("" when nothing new is safe to show yet). */
export function visibleDelta(fullSoFar: string, alreadyEmitted: string): string {
  const visible = cleanVisible(fullSoFar)
  if (visible.length > alreadyEmitted.length && visible.startsWith(alreadyEmitted)) {
    return visible.slice(alreadyEmitted.length)
  }
  return ""
}

/* ── v18 tutor-loop additions ────────────────────────────────────────────── */

/** Byte-exact ChatML renderer — the same bytes apply_chat_template produces
 *  for both families (verified byte-for-byte in Node against the official
 *  templates, incl. Qwen3's enable_thinking:false tail; see
 *  scripts/tutor_loop_mirror.js). The GPU continuation path needs it because
 *  mid-turn continuation ("finish the sentence you were cut off on") cannot
 *  be expressed through the messages array — the template would close the
 *  partial assistant turn and open a new one. LFM2's template renders the
 *  BOS itself, so it is part of the string; Qwen3 has no BOS. */
export function buildExactChatML(
  messages: PromptMessage[],
  assistantSuffix?: string,
  family?: "lfm2" | "qwen3",
): string {
  let s = family === "lfm2" ? "<|startoftext|>" : ""
  for (const m of messages) s += `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`
  return s + `<|im_start|>assistant\n${assistantSuffix ?? ""}`
}

/** Rough token estimate used before a tokenizer is available (engine cold).
 *  ~3.6 chars/token holds well for English + code on these vocabularies. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6)
}

export interface HistoryPlan {
  /** the suffix of `history` to keep */
  keep: PromptMessage[]
  /** how many leading messages were dropped */
  dropped: number
  /** honest note appended to the system prompt when trimming happened */
  note: string
}

/** Token-aware context windowing. The blind `slice(-8)` of v15–v17 could
 *  still blow the 2048-token context with long turns — and llama.cpp
 *  truncates from the LEFT, silently eating the system prompt first (the
 *  same "weird reply" class as the v17 turbo bug). This keeps the LATEST
 *  turns that fit `budgetTokens`, never drops below the last `minKeep`
 *  messages, and reports exactly what was dropped. */
export function planHistory(
  history: PromptMessage[],
  counts: number[],
  budgetTokens: number,
  minKeep = 4,
): HistoryPlan {
  const n = Math.min(history.length, counts.length)
  let total = 0
  for (let i = 0; i < n; i++) total += Math.max(1, counts[i])
  if (total <= budgetTokens || n <= minKeep) {
    return { keep: history.slice(0, n), dropped: 0, note: "" }
  }
  let start = 0
  let sum = total
  while (start < n - minKeep && sum > budgetTokens) {
    sum -= Math.max(1, counts[start])
    start += 1
  }
  return {
    keep: history.slice(start),
    dropped: start,
    note: " (Older turns were trimmed to fit the context.)",
  }
}
