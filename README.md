<div align="center">

<img src="public/icons/icon-moss.svg" alt="Deriva" width="96" />

# DERIVA

**Derive the algorithm. Don't memorize it.**

An interactive platform for learning data structures & algorithms through
first-principles derivation — with an offline AI tutor, a dot-matrix studio,
and a full appearance system. Everything runs on your device.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20TWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest%20109%20passing-6DA55F?style=flat-square)

</div>

---

## The idea

Most platforms train pattern-matching. Deriva trains **derivation**: every
problem walks a nine-stage flow — concept → reasoning → patterns →
implementation — where each stage teaches exactly one thinking move, and naive
solutions come before optimized ones whenever the contrast teaches something.
Everything else in the product orbits that idea.

## What's inside

### Ghost — an AI tutor that lives in your phone
A quantized SmolLM2 brain (101 MB or 258 MB, your pick) running fully in your
browser over multithreaded WASM — no server, no API key, no telemetry. Download
once on Wi-Fi into private on-device storage, then it works with the network
off forever. Socratic by philosophy: hints and guiding questions, solutions
when you demand them. Streaming replies, live tok/s gauge, session history,
and self-healing model storage that verifies file integrity before every wake.

### OSC-1 — a pocket synthesizer
A 16-step, 8-voice dot-matrix sequencer with sample-accurate timing (notes are
scheduled against the audio clock, never timers). Wave shaping, resonant
filter, dotted-eighth delay, swing and gate controls, four pattern slots plus
song-chain mode — all in A-minor pentatonic so every combination sounds
musical. Four faceplates, haptic feedback, autosave, zero dependencies.

### Glyph Studio
Draw dot-matrix light on 7/12/16 grids — animation frames, onion skinning,
glow and material controls, pattern generators. Export PNG, animated SVG, or
JSON — or save glyphs as a personal icon pack rendered across the entire shell.

### The learning loop
Daily challenge, spaced review queue, ICPC ladder, pattern quizzes, algorithm
visualizations — all client-side, installable, offline-capable. Every
visualization is a pure function of `(trace, cursor)` and renders from typed,
zod-validated execution traces.

### An appearance system with real depth
14 themes × accents × 5 type voices × density × shape × texture × 4 icon-pack
languages. Runtime luminance computes `--on-accent` so text stays readable
under any combination. Share your exact look as a QR code.

## Quick start

```bash
git clone https://github.com/srivtx/deriva.git
cd deriva
pnpm install
pnpm dev
# → http://localhost:3000
```

Open `/ghost`, tap SUMMON GHOST once on Wi-Fi, then kill your connection and
keep learning. Open `/osc` and make some noise.

## Privacy

There is no backend. Learning progress lives in IndexedDB/localStorage, model
weights live in private OPFS storage, and nothing about you ever leaves the
device.

## Conventions

- Curriculum content is typed, zod-validated data — curriculum errors are build errors
- Design tokens in `src/design-system` are the only allowed colors
- Tech decisions are recorded as D-entries in `docs/07-technology-decisions.md`
