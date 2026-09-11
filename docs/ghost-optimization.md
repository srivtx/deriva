# Ghost — Optimization Research Notes

Branch: `ghost/faster-smarter` (v14–v17) · `ghost/tutor-loop` (v18)
Scope: why Ghost was slow, what the facts are, what changed, and what the
next levers are. Everything below was verified against the vendored runtime
(`public/ghost/vendor/wllama`) and the HuggingFace file API unless noted.

## 0b. v18 — the tutor loop (branch `ghost/tutor-loop`)

The chat was fire-and-forget: dead-end answers, typo'd questions wasting a
whole turn, replies hard-cut at the 288-token cap with no continuation, and
a blind `history.slice(-8)` that could still blow the 2048-token context
(llama.cpp truncates from the LEFT — it silently eats the system prompt
first: the same "weird reply" class as the v17 turbo bug). This pass adds
the missing turn lifecycle. All facts below were verified by Node mirror
experiments (`scripts/tutor_loop_mirror.js`) and browser E2E
(`scripts/tutor_e2e.js`, 27/27).

### R9 · wllama replays verbatim unless sampling moves — regenerate needs two levers
wllama seeds its sampler chain from the context seed (randomized ONCE at
loadModel: `seed: config.seed || Math.floor(Math.random() * 1e5)`) and
`createCompletionImpl` re-runs `samplingInit(config)` on EVERY call. Probe
result (same prompt, CPU): base temperature twice → **byte-identical
reply**; temperature +0.15 → diverges; +0.45 → diverges more. So
regenerate climbs a two-lever ladder — temperature +0.2/attempt (capped
+0.45) AND repetition penalty 1.15→1.23…1.45 — plus a cold re-prefill
(`useCache:false`) for clean sampler state. A single small temp bump is not
reliable (E2E once observed an identical 123-char replay at temp 0.6).

### R10 · Cap-death continuation is exact-ChatML on GPU, warm-cache on CPU
`transformers.js` has no `continue_final_message` (checked the 4.2.0
pipeline source), so mid-turn continuation cannot be expressed through the
messages array. The GPU path feeds the pipeline an exact ChatML STRING:
`buildExactChatML()` (new in text.ts) renders **byte-identical** to
`apply_chat_template` for both families — verified in Node (LFM2 306 B,
Qwen3 310 B, including the `enable_thinking:false` tail) — with
`add_special_tokens:false` so the LFM2 tokenizer does not double the
`<|startoftext|>` BOS that is already inside the string. The CPU path
appends the partial raw text to the previous prompt string and lets
wllama's KV prefix matching reprocess only the junction. Merged replies
verified seamless in-browser: a 10-token forced cap continued into a
coherent 848-char 12-point checklist stopping at a real `<|im_end|>`.

### R11 · The empty-suffix decode guard
wllama hands llama.cpp the NON-CACHED suffix as its decode batch
(`computeNonCachedTokens` → `decode(tokens)`). When a prompt is already
fully cached (regenerate after rollback, or a continuation whose junction
re-tokenizes identically) that batch is empty — undefined behavior at best.
`cpuGenerate` probes `tokenize()` + `getCachedTokens()` first and falls
back to a cold re-prefill when the suffix would be empty. Wllama has its
own inner fallback too ("Failed to rollback KV cache, clearing it instead"
in dev.log at exact-cache-length boundaries) — correctness holds either
way; the guard just avoids the slow path.

### R12 · Token-aware context windowing replaces slice(-8)
`planHistory()` (text.ts, unit-tested) keeps the LATEST turns that fit a
1024-token history budget, never drops below the last 4 messages, and
discloses trimming to the model via a system-prompt note. Counts come from
`engine.countTokens()` — exact via `wllama.tokenize()` (CPU) or
`tokenizer.encode()` (GPU, `add_special_tokens:false`) — falling back to
~3.6 chars/token when no tokenizer is loaded. Also recorded:
`TextStreamer.callback_function` fires per decoded WORD, not per token;
exact GPU counts need `token_callback_function` (the v18 finish-reason
detector uses it — CPU counts onNewToken, which is already exact).

### Also in v18
- **finishReason** (`stop|length|aborted`) on every chat result; "length"
  auto-continues once seamlessly, then offers an honest Continue chip
  (bounded at 3 manual clicks).
- **Edit-last-question** re-runs from the corrected turn; **share/export**
  via Web Share API with clipboard + check-morph fallback.
- **PWA**: already covered app-wide by `manifest.webmanifest` + icons +
  apple-web-app metadata (verified) — Ghost inherits installability; no
  duplicate manifest was added.
- **`window.__ghost`** field-debug handle (engine + model picker) for
  console triage of future field reports.
- Chat optics: GPU t/s now uses exact token counts (was word-callbacks).

## 0a. v17 — the turbo pass (field-report triage #2)

Preview-site feedback on v16: *"switched to turbo, it says it downloads its
own copy, but no progress shows"* and *"replies come out as a weird
hallucinated transcript"* — a real answer followed by invented user turns
("ssup", "what are you doing"), assistant turns echoing the system prompt
("Under 50 words."), and stray "copy" fragments. Root causes (all fixed,
all verified — Node mirror tests + browser E2E):

### R6 · The turbo prompt was malformed — the "weird replies" bug
v15/v16 fed transformers.js a hand-built raw ChatML string. The
`TextGenerationPipeline` tokenizes plain strings with
`add_special_tokens=false`, so the prompt reached the model **without its
BOS token** (`<|startoftext|>` for LFM2) and with a stray leading newline.
That derailed the model into system-prompt echo and multi-turn
hallucination. A/B experiment (Node, CPU device, identical sampling,
`scripts/turbo_repro.js`):

| prompt strategy | result |
| --- | --- |
| raw string (v16 shape) | `"Understand"` / literally `"Under 50 words."` — the field-report garbage |
| messages array → official `chat_template` | clean socratic reply, stopped at `<\|im_end\|>` |
| raw string, no repetition penalty | still garbage (penalty was NOT the cause) |
| raw string + explicit `eos_token_id` | still garbage (eos ids can't save a bad prompt) |

Fix: the GPU path now passes the **messages array** and lets each model's
own chat template render it. The CPU path keeps the hand-built ChatML
prompt — llama.cpp adds the BOS itself and is format-tolerant (verified
E2E). One prompt-building module was the wrong shared abstraction; the
shared thing is the *messages*.

For Qwen3 the non-thinking contract rides through
`tokenizer_encode_kwargs: { enable_thinking: false }` — the template then
appends the empty think block itself (verified against the repo's
`tokenizer_config.json`; Qwen3-0.6B-ONNX thinking default burned 239
tokens/51 s in the lab harness vs 49 tokens direct).

### R7 · Turbo generation could outrun its stop tokens
Generation on the GPU path now carries an `InterruptableStoppingCriteria`
plus a marker watcher: the stream runs with `skip_special_tokens: false`
(the display cleaner strips control tokens anyway) and the moment the raw
stream shows a turn-end marker (`<|im_end|>` / `<|im_start|>` /
`<|startoftext|>`) generation is interrupted — a stop guarantee that does
not depend on the repo's `generation_config.eos_token_id` being right.
The STOP button and the 120 s timeout now interrupt GPU generation too
(previously stop() only aborted the wllama worker; on GPU it silently did
nothing).

### R8 · The silent turbo download — "no progress or downloading thing"
Sequence of the bug: GGUF already cached → `deriva-ghost-ready=1` → boot
jumps straight to the chat → first message → `chat()` →
`ensurePipeline()` **without any progress callback** → ~200 MB of ONNX
weights download behind the "thinking" chip. On slow links the 120 s chat
timeout could even fire mid-download.

Fixes:
- `load()` now forwards download events, so a turbo fetch renders in the
  boot/loading UI with a real progress bar.
- `chat()` **never builds pipelines** — if the pipe is missing it runs CPU
  for that turn. This kills the silent-download class entirely.
- In-chat: a slim `ghost-gpu-fetch` strip (bar + MB/%/ETA) renders under
  the chatbar while weights stream, wherever the user is.
- Aggregate-progress honesty: transformers.js' `progress_total` total only
  includes files whose download has *started*, so `loaded/total` jumps
  backwards as new files register. The bar now stays indeterminate until a
  weight file (>24 MB) registers, then reports a monotonic fraction,
  EMA-smoothed speed and ETA, and a "compiling GPU engine…" phase once the
  weights land but the pipeline is still building.
- Events carry `cancellable: false` on the turbo path (transformers.js
  can't abort mid-download) — the UI stops offering a CANCEL button that
  cannot cancel anything, and says "GPU copy streams through the engine —
  keep this tab open" instead.

### Verification (v17)
- `scripts/turbo_engine_mirror.js` — LFM2 GPU-path mirror: 8/8 PASS
  (clean reply, turn-end stop, no sysprompt echo, token budget, no control
  tokens leaked, STOP interrupt ends generation at ~8 tokens).
- `scripts/turbo_engine_mirror_qwen.js` — Qwen3 mirror: 6/6 PASS (same,
  plus no think leak with `enable_thinking:false`).
- `scripts/turbo_e2e.js` — browser E2E of the exact field scenario (fake
  WebGPU adapter injected before page scripts, turbo pref, GGUF cached):
  progress strip rendered live 31%→100% monotonic with MB counters,
  demote-to-CPU logged on pipeline failure, final reply clean — single
  turn, no echo, no control tokens. CPU-path regression (download phases,
  chat, kv q8 chatbar) re-run PASS.
- Full evidence: `research/turbo-weird-replies.json`.

### API facts recorded along the way (transformers.js 4.2.0)
- `progress_total` fires only while files actively stream; cached files
  emit nothing (a fully-cached turbo model shows no fetch at all — by
  design).
- `generate()` accepts `stopping_criteria` and `eos_token_id` kwargs and
  the pipeline forwards them; `InterruptableStoppingCriteria` is exported
  from the package root.
- `min_p` is NOT implemented in v4.2 — the GPU path omits it (CPU wllama
  keeps it).
- `TextStreamer` with `skip_special_tokens: false` emits special-token
  text as atomic pieces (flush-then-emit), which is what makes the marker
  watcher reliable.

---

## 0. v15 — the correctness pass (field-report triage)

Preview-site feedback on v14: "download is glitchy", "the settings icon
looks like a light/dark toggle", "0.6 qwen is very slow on M2 and phone".
Root causes (all fixed, all E2E-verified in-browser):

### R1 · Qwen 3 was THINKING on every reply (the "slow" bug)
v14 shipped `assistantSuffix: "\n\n"`. Qwen3's official non-thinking
contract — re-verified byte-for-byte against `Qwen/Qwen3-0.6B`'s
`chat_template` — appends an **empty think block** after the assistant
header: `<think>\n\n</think>\n\n`. The "\n\n" suffix neither opened nor closed
the block, so the model entered thinking mode on every reply: up to
nPredict hidden reasoning tokens (≈3× latency), replies dying at the token
cap mid-reasoning, and raw reasoning leaking into the stream. With the
correct suffix (now `QWEN3_NO_THINK_SUFFIX` in `src/lib/ghost/text.ts`)
Qwen 3 answers directly — verified: first streamed tokens are the answer
itself.

### R2 · Piece-wise cleaning could not hide a think block
The stream cleaner ran per-token-piece, so a think block spanning many
pieces (its tags sit in different pieces) always leaked. Cleaning now runs
over the full text so far (wllama hands us `currentText`), an unclosed
think block hides everything after it, partially-received control tags
(`<thi`, `<|im_en`) are held back, and split multi-byte characters are
buffered instead of flashing `\uFFFD`. Pure functions + 20 unit tests in
`src/lib/ghost/` (`text.ts` + `__tests__/text.test.ts`).

### R3 · The glitchy download
- v14's GPU path listened to transformers.js per-file `progress` events —
  the bar **reset to 0% with each file**. Fixed by listening to the
  aggregate `progress_total` event (present in transformers.js 4.2.0,
  verified in the vendored source).
- The CPU path setState-d on every ~64 KB chunk with no throttle, plus a
  fake 2% minimum width. Now: throttled (~3/s), honest 0–100%, phases
  (`connect → fetch → verify → store`), live MB/s + ETA, ARIA values.
- The whole file was buffered in memory as a `Blob` (378 MB on phones) —
  now it streams **directly into OPFS** (`.part` file).
- **Cancel** (AbortController) and **resume** (HTTP `Range: bytes=N-` off
  the kept `.part`, HF CDN answers 206) are new. Verified E2E: cancel at
  16% → "resumed from 63 MB" → completes → loads.
- A model is trusted only when the final file exists with GGUF magic + a
  matching meta size; a killed download leaves only the `.part`.

### R4 · The sun that looked like a theme toggle
The settings icon was a circle with eight detached rays — literally a sun
glyph. It is now a cog: outer ring + hub + teeth that reach the ring.

### R5 · Auto-WebGPU was the wrong default
Field evidence + measurement: transformers.js ≈62–66 tok/s vs wllama
≈58–60 tok/s on the same desktop (parity, not 2×), while the GPU path
downloads a *second* set of ONNX weights (multi-file = the glitchy
progress), doubles storage, and is fragile on phones (ORT/WebGPU
variability, memory). New policy: **CPU wllama is the default everywhere**;
WebGPU survives as an explicit **TURBO** toggle in settings (with a
q4f16 → q4 dtype ladder and automatic CPU demotion on failure).
Legacy `"auto"` pref migrates to `"cpu"`. *(v17 note: the
"string-prompt execution so both backends share one prompt" idea was
itself the R6 bug — see §0a; the two backends now each get the prompt
shape their runtime expects: messages array on GPU, ChatML string on
CPU.)*

### Also in v15
- The generation timeout now aborts the worker instead of racing a reject
  and leaving it hot.
- Live progress during replies: elapsed seconds until the first token
  ("first reply warms the engine"), then live tok/s; chatbar shows the
  last reply's t/s.
- Model picker copy is honest about device fit ("happy on any phone" /
  "best on desktop, patient on phone").

---

## 1. Why it was slow — the facts (v14 baseline)

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

## 5. v20 storage pass — why Vercel showed 9 GB of deployment storage

Root cause (measured, not guessed): `public/` was 82 MB, and Next.js copies
`public/` verbatim into **every** deployment's output. At ~110 deployments
(main pushes + preview branches over the project's life) that is ~9 GB of
accumulated deployment storage on Vercel — the meter sums the files kept for
ALL deployments, not just the latest.

The payload was dominated by four vendored ONNX Runtime wasm builds in
`public/ghost/vendor/onnx/` (77 MB total). Only two are ever fetched:

- `ort-wasm-simd-threaded.jsep.{mjs,wasm}` — the WebGPU/JSEP build the Turbo
  pipeline (`device: "webgpu"`) resolves.
- `ort-wasm-simd-threaded.{mjs,wasm}` — the plain wasm build ORT can resolve
  when `wasmPaths` is a directory string and the non-JSEP build is selected.

The other two are provably dead and were removed (−38.2 MB per deployment):

- `ort-wasm-simd-threaded.asyncify.{mjs,wasm}` — only fetched when
  `env.wasm.proxy === true`; transformers.js v4.2.0 explicitly sets
  `ONNX_ENV.wasm.proxy = false` (verified in its dist source).
- `ort-wasm-simd-threaded.jspi.{mjs,wasm}` — only fetched when JSPI is
  explicitly enabled; nothing in the codebase touches it.

Verification before cutting: grep over src/, public/sw.js, scripts/, tests/,
harness/, docs/ shows the only references to the vendor dir are the engine's
`wasmPaths = "/ghost/vendor/onnx/"` string and sw.js's runtime cache-first
handler (it caches whatever is actually fetched — no precache manifest, so
missing files cannot break offline installs).

`public/` is now 45 MB (jsep 26.1 + plain 12.9 + wllama 5.6 + apk 1.2), a 45%
cut per deployment. The plain wasm pair (12.9 MB) is kept on purpose: it is
the fallback ORT may resolve on non-JSEP configurations; deleting it saves
more but risks breaking Turbo on edge devices — re-evaluate only with a real
WebGPU E2E in place.

Reclaiming the already-accrued 9 GB (repo changes only stop future growth):
delete old deployments on Vercel — dashboard → project → Deployments →
multi-select old Preview + Production deployments (keep the latest
production) → Delete; or `npx vercel rm <deployment-url>` per deployment
after `npx vercel link`. Storage frees as deployments are removed.

Post-mortem on `.vercelignore`: it was added in the same pass and made every
Git deployment fail fast (<90s, before compile) even though the local
`next build` was green — Vercel's Git integration does not tolerate it
here. It was removed (4db7573) and the deployment went green immediately;
Git deployments clone the full repo anyway, so the file bought nothing.
