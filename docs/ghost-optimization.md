# Ghost — Optimization Research Notes

Branch: `ghost/faster-smarter`
Scope: why Ghost was slow, what the facts are, what changed, and what the
next levers are. Everything below was verified against the vendored runtime
(`public/ghost/vendor/wllama`) and the HuggingFace file API unless noted.

## 1. Why it was slow — the facts

### F1 · Every turn re-prefilled the entire conversation
`createCompletion()` was called **without `useCache: true`**. In wllama's
implementation that branch runs `kvClear()` and then re-decodes the *whole*
prompt — system message + up to 8 history messages + the new message — every
single turn. At mobile WASM prefill rates this is seconds of dead time before
the first token, and it grows with conversation length.

Fix: pass `useCache: true`. wllama's `computeNonCachedTokens()` finds the
longest cached-token prefix (`nKeep`), rolls the cache back to it, and decodes
only the tail — typically just the new user message (~10–40 tokens). Verified
safe when the system prompt flips between Socratic/Answer modes (the prefix
match simply degrades gracefully).

### F2 · The KV cache was unquantized f16
The 2024-era config loaded models with default KV cache types. Quantizing the
KV cache to `q8_0` halves the KV memory and its bandwidth. On a
memory-bandwidth-bound WASM decode loop that is a direct token/s win, and it
halves the per-context headroom cost of `n_ctx 2048`.

### F3 · No thread pinning and default batch
`n_threads` was never set (wllama default is `hardwareConcurrency / 2`);
`n_batch` was never set. Threads are now clamped to 2–6 (the sweet spot for
big.LITTLE phones *and* desktops — decode is bandwidth-bound, not core-bound),
and `n_batch` is 256: prompts are short once F1 is fixed, so a small ubatch
halves the compute buffer with zero prefill cost.

### F4 · The WebGPU path was unreachable dead code
`gpuOptIn()` read a localStorage flag that **no UI ever wrote** — the GPU
backend could never, in practice, be enabled by any user. Transformers.js +
ONNX Runtime WebGPU decode at ~60 tok/s on a desktop GPU vs ~30 tok/s for
multithreaded WASM, so the fastest runtime the app shipped was the one nobody
could turn on.

Fix: backend is now **auto** — WebGPU whenever `navigator.gpu` answers with
an adapter, CPU otherwise — with a three-way override (AUTO/GPU/CPU) in the
settings sheet, and **automatic CPU demotion** if the GPU pipeline fails at
load or at first generation.

### F5 · The models were two generations old
SmolLM2 shipped Nov 2024. In the same size class today:

| Model | File (Q4_K_M) | Notes |
|---|---|---|
| SmolLM2 135M (old default) | 101 MB | weakest; attention-only |
| SmolLM2 360M | 258 MB | attention-only, 36 layers, fat KV cache |
| **LFM 2.5 350M (new default)** | **219 MB** | hybrid conv+GQA, 28T tokens pretraining, edge-native |
| **Qwen 3 0.6B (new LITE)** | 378 MB | strongest reasoner in class |

LFM 2.5's hybrid architecture is the interesting one for phones: only **6 of
its 24 blocks grow a KV cache** (the other 16 are recurrent/conv). Measured
on load in the vendored wllama: **KV cache = 12.75 MiB total (K 6.38 q8_0 +
V 6.38 q8_0) at n_ctx 2048** — a SmolLM2-360M at the same context needs an
order of magnitude more KV memory. Less KV memory = less bandwidth = more
tokens per second on phones, and much more room before `kv_cache_full`.

Both new models are ChatML-compatible (`<|im_start|>…<|im_end|>`), so the
hand-built template survives. Qwen 3 additionally gets its official
non-thinking contract (an empty think-block after the assistant tag), which
skips the reasoning wall and roughly halves first-answer latency; any stray
think-blocks are stripped defensively.

### F6 · iOS constraints (platform facts)
- iOS Safari does not support COEP `credentialless` → no SharedArrayBuffer →
  **single-threaded** WASM on iOS regardless of cores. (The conv-heavy LFM2.5
  is the best mitigation for exactly this case.)
- WebGPU shipped **enabled by default** in Safari 26 / iOS 26 (Sept 2025);
  devices on iOS 18/25.x have no WebGPU. Auto-backend handles both.

### F7 · Sampling
CPU path used `temp 0.6 / top_p 0.9` only. Added `min_p` (0.05) — better tail
control on tiny models than top_p alone — plus `penalty_last_n 64` for the
repeat penalty window, and per-model temperature profiles.

## 2. What changed on this branch

**Engine (`src/lib/ghost/engine.ts`)**
1. `useCache: true` on every completion (F1) — the single biggest latency fix.
2. Load-option ladder: `flash_attn + cache_type_k/v q8_0` first, plain config
   as silent fallback (F2). Diagnostics surface which one landed.
3. `n_threads` clamped 2–6, `n_batch 256` (F3).
4. New model lineup + migration: stored model ids that no longer exist fall
   back to the new default; old SmolLM2/Qwen2.5 files show up as "leftover"
   rows in the settings sheet and can be freed (F5).
5. Backend: auto → GPU-on-adapter, with manual override and automatic CPU
   demotion on pipeline/generation failure (F4). Legacy GPU opt-in key is
   honored.
6. Qwen 3 non-thinking suffix + defensive think-block stripping in the
   cleaner.
7. `GHOST_MAX_TOKENS` 288 (was 220), exported for the UI.

**UI (`src/app/ghost/page.tsx` + `globals.css`)**
- Markdown-lite renderer (no deps, no innerHTML): bold, italics, inline code,
  lists, headings, and fenced code blocks with a copy button — a DSA tutor
  needs readable code.
- Flat OpenAI-style assistant messages (no bubble), user messages as accent
  bubbles; copy affordance under each answer.
- Clean header: ghost identity + live model/backend/threads/kv-quant line,
  icon buttons (history / new / settings) instead of text chrome.
- Auto-growing textarea composer; Enter sends on pointer-fine devices, adds a
  newline on touch (the mobile-correct behavior); SVG send/stop icons.
- Thinking indicator: animated three-dot pulse with live tok/s.
- Haptic feedback (send/stop) via `navigator.vibrate` where supported.
- Empty state: greeting + suggestion chips instead of "Ping the void."
- Backend selector (AUTO/GPU/CPU) in the settings sheet.
- OOM-class failures now recycle the runtime and retry once from the cached
  blob instead of deleting the model and re-downloading it.
- `prefers-reduced-motion` respected for all new animations.

## 3. What was verified locally

- `tsc --noEmit` clean; vitest: 113 passing, 1 pre-existing failure on main
  (curriculum `patterns.test.ts`, unrelated to Ghost).
- Full E2E in a real browser: SUMMON → 219 MB download → model load with
  `flash_attn + q8_0 KV` (confirmed via diagnostics line and llama.cpp logs:
  `K (q8_0): 6.38 MiB, V (q8_0): 6.38 MiB`, 6 attention + 16 recurrent
  layers) → two-turn conversation with streaming → python code answer
  rendered in a copyable code block → settings sheet with backend radios.

## 4. Next levers (not done here)

- **WebLLM / MLC-WebGPU runtime**: benchmarks put MLC ~1.5–2× ahead of
  Transformers.js ONNX on WebGPU decode. The cost is a separate model
  format (MLC weights) and a heavier integration — worth it once the GPU
  path has real usage.
- **Speculative decoding** (draft = the 135M SmolLM2 as draft for the 0.6B
  Qwen): wllama does not expose it yet; watch upstream.
- **WebGPU-safe subsetting**: auto-GPU currently trusts the adapter; a
  device-class probe (adapter limits, `navigator.deviceMemory`) could avoid
  weak-GPU stalls on low-end Android.
- **Session storage → OPFS**: chat history lives in localStorage (20
  sessions × 60 messages cap); OPFS would remove the size ceiling.
- **i18n quality pass on the Socratic prompts** per model family — Qwen 3
  follows instructions noticeably better and can carry a stricter tutor
  contract.
