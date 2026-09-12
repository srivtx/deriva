# Changelog

## v1.7.0 — Foundry (2026-09-12)

### New
- **Foundry, the AI production workshop** (`/foundry`): a standalone Studio app (a peer of Ghost) where every station is a real engine you operate to learn a production AI-engineering skill. 22 missions across six stations, XP/level progression persisted locally, per-station best-mistake tracking, and full catalog/icon-pack/command-center integration (hammer glyph authored for all four icon languages).
- **Token Bench** — a real byte-pair-encoding trainer: train merges on a corpus step by step, watch the vocabulary grow, then budget prompts and price them by the token. Grounded in Sennrich et al. 2016 and the GPT tokenizer lineage.
- **Sampling Deck** — an n-gram language model with its probabilities exposed: temperature, top-k and nucleus truncation reshape the distribution live; entropy meters and degeneration drills teach what each dial really does (Holtzman et al. 2020).
- **Attention Lens** — one attention head with the covers off: Q·K/√d scoring, softmax weights, sinusoidal positions, attention arcs you predict before the reveal, plus a Lost-in-the-Middle context bug to fix (Vaswani et al. 2017; Liu et al.).
- **Serving Floor** — a discrete-event inference-server simulator: KV cache priced by dtype (fp16/q8/q4), 64-token prefill chunks, memory-bound decode batches, static vs continuous batching, contiguous vs paged allocation with OOM preemption and queue timeouts, TTFT/latency/throughput metrics replayed as a live trace (Kwon et al. 2023; Yu et al. 2022).
- **Retrieval Bench** — a RAG pipeline that fails the way real ones fail: keyword stuffing outranking truth in BM25, chunk boundaries cutting the answer in half, and a final context you compose under a token budget (Robertson & Zaragoza 2009; Lewis et al. 2020).
- **Agent Loop** — a deterministic ReAct executor you can break: runaway retries, observation bloat blowing the context window, prompt injection hiding in a tool result; set the guardrails, run the loop, read the trace (Yao et al. 2022; OWASP LLM Top 10).
- **Engine test suite**: 70 vitest cases covering all six engines (merge order, softmax/nucleus math, attention normalization, server invariants and determinism, retrieval failure modes, guardrail behavior).

### Fixed
- Completed the Retrieval Bench page truncated mid-write in the prior session (unterminated string literal cascading parse errors).
- Serving engine typing: admission now carries stamped arrival ids; drop-reason accounting narrows correctly.

## v1.6.0 — Studio expansion (2026-08-26)

### New
- **OSC-1, a pocket synthesizer** (`/osc`): 16-step × 8-voice dot-matrix sequencer with sample-accurate audio-clock scheduling, A-minor pentatonic grid, wave/cutoff/delay voice, swing + gate controls, song-chain mode (A→B→C→D), four faceplates (DOT/MOSS/EMBER/ULTRA), haptics and autosave. Full shell integration: catalog, drawer, command center, home tiles, icon packs.
- **QR tools rebuilt**: universal scanning via jsQR (works on all browsers; BarcodeDetector fast-path where available), live code regeneration while typing, Open-link for detected URLs.
- **Image tools fixed**: crop can be drawn anywhere on the image (was trapped inside the old box), corner-grip resize, rule-of-thirds overlay with outside dimming, drag & drop + clipboard-paste upload.

### Fixed
- QR scanner fatal stale-closure that aborted detection on its first frame.
- Image crop pointer handlers trapped inside the crop box; degenerate-crop outputs; object-URL leaks.

### Changed
- README rebuilt around the moss logo with corrected Ghost facts (SmolLM2 brains, multithreaded WASM).

## v1.5.1 — Ghost (2026-08-26)

### New
- **Ghost, the offline AI tutor** (`/ghost`): SmolLM2 Nano (101 MB, default) and Lite (258 MB) brains running on-device via llama.cpp/WASM — one opt-in download, offline forever, Socratic hints-only persona.
- **Brain storage manager**: per-model install/switch/delete with verified frees, legacy-cache sweep, clear-everything bottom sheet.
- **Conversation sessions**: auto-titled history, reopen, delete, new chat; stop button; single thinking indicator with live tok/s.
- **Studio drawer section** in the home app library and App Center (Ghost + Glyph Studio tiles) with icons authored for all four icon-pack languages.

### Fixed
- Phone scroll correctness: message pane is the sole scroller; instant stick-to-bottom that never fights your finger; jump-to-latest pill.
- Curated-logo head-node safety, stale-deploy self-healing and contrast engine carried from 1.5.0 remain intact.

## v1.6.0-ghost.0 — Ghost (pre-release, feature branch)

The offline AI tutor as a first-class app: SmolLM2 Nano/Lite brains downloaded on explicit consent, stored in OPFS with verified deletes, Socratic-only persona, streaming chat with conversation history.

- Ghost app (`/ghost`): brain picker, bottom-sheet settings, per-model GET/RESTORE/USE/DELETE, leftover sweep, clear-everything
- Streaming inference via wllama 3.6 (llama.cpp → WASM SIMD) in a dedicated module worker; zero main-bundle cost until summoned
- Conversation sessions: auto-titled history, reopen, delete, new-chat; entrance motion, iOS-safe input sizing
- Scroll engine: instant stick-to-bottom during token streams, scroll-event suppression, jump-to-latest pill
- Home drawer + App Center Studio section; four icon-pack languages for Ghost/Glyph tiles

## v1.5.0 — Lucent Lab (2026-08-25)

### New
- **Glyph Studio** (`/glyph`): standalone dot-matrix editor — 7/12/16 grids, drag draw/erase, undo, transforms (flip/rotate/shift), onion skinning, multi-frame animation (8 frames, 2–12 fps), Glyph-Toy light patterns (Comet/Pulse/Rain/Spiral), color/glow/scale/roundness controls; export PNG / animated SVG / JSON (+ import); save 7×7 glyphs into your Personal pack.
- **Personal icon pack** — draw your own 7×7 nav glyphs in-app.
- **Focus Dial** (`/focus`) — Braun-style rotary timer that re-tints the whole shell while running.
- **Appearance share codes** — QR/paste-code carries your full look between devices safely.
- **Settings search** — every section is indexed; plus reordered sections and anchor TOC.
- **NEW badges** on recently added themes, voices, packs and atmospheres (all atmospheres now unlocked).

### Fixed
- Curated logos (Nothing/OP-1) no longer break navigation: React-19-owned `<head>` nodes are mutated in place instead of removed; manifest icons rasterized to real PNGs for installability.
- Stale-deploy self-healing: chunk failures after deploys purge caches and reload once — no more blank routes or dead clicks.
- Contrast engine: `--on-accent` computed from live accent luminance across all themes/custom colors; NEW badge legibility everywhere.
- Mobile logo rounding, overlay dead-clicks on route change, stuck nav drags.

### Performance
- Logo uploads ~17× smaller (256px JPEG), preferences parse cache, memoized hot components, debounced manifest rebuilds, `content-visibility` on settings sections.

### Internals
- Android TWA icon flavors: classic / nothing / opone.
- Service worker v20; error ring-buffer surfaced in Settings → System.
