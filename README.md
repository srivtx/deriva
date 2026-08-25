<div align="center">

<img src="public/readme-banner.svg" alt="Deriva" width="100%" />

**Derive the algorithm. Don't memorize it.**

An interactive platform for learning data structures & algorithms through
first-principles derivation — with an offline AI tutor, a dot-matrix studio,
and a full appearance system inspired by Nothing and Teenage Engineering.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20TWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest%20109%20passing-6DA55F?style=flat-square)

</div>

---

## What it does

Most platforms train pattern-matching. Deriva trains **derivation**: every problem walks a nine-stage flow — concept → reasoning → patterns → implementation — where each stage teaches exactly one thinking move and naive solutions come before optimized ones whenever the contrast teaches something. Everything else orbits that idea:

- **Runs the whole learning loop locally.** Daily challenge, spaced review queue, ICPC ladder, pattern quizzes, algorithm visualizations — all client-side, installable, offline-capable. Progress is a pure function of `(trace, cursor)`; every visualization renders from a typed execution trace.
- **Ghost — an AI tutor that lives in your phone.** A quantized Qwen 2.5-0.5B running in-browser via llama.cpp/WASM (wllama). Opt-in ~400 MB download into OPFS, then fully offline forever. Hint-mode by philosophy: Socratic nudges, never solutions. Streaming chat, live tok/s gauge, eject anytime.
- **Glyph Studio.** Draw dot-matrix light on 7/12/16 grids — animation frames, onion skinning, glow/material controls, Glyph-Toy pattern generators (Comet/Pulse/Rain/Spiral). Export PNG, animated SVG (SMIL), JSON. Save glyphs as a personal icon pack rendered across the entire shell.
- **An appearance system with real depth.** 14 themes × accents × 5 type voices × density × shape × texture × 4 icon-pack languages (Classic strokes / Nothing dot-bitmaps / OP-1 thin-line / Personal). Runtime luminance computes `--on-accent` so text stays readable under any theme × accent × custom color combination. Share your exact look as a QR code.
- **Self-heals stale deploys.** Chunk failures from old in-memory apps trigger a one-shot cache purge + reload. On-device error ring-buffer surfaces in Settings → System. Curated logos mutate React-owned `<head>` nodes in place — never remove them.

## Quick start

```bash
git clone https://github.com/srivtx/deriva.git
cd deriva
pnpm install
pnpm dev
# → http://localhost:3000
```

Open `/ghost`, tap SUMMON GHOST once on Wi-Fi, then kill your connection and keep learning.

## Architecture

```
src/
├── app/                          # Next.js App Router — one route per app
│   ├── page.tsx                  # home
│   ├── practice/                 # drill mode (9-stage derivations)
│   ├── patterns/                 # thinking moves + quizzes
│   ├── daily/ · review/ · icpc/  # spaced repetition + contest ladder
│   ├── atlas/                    # algorithm visualizations
│   ├── observatory/              # progress, honestly visualized
│   ├── ghost/page.tsx            # offline AI tutor (chat UI)
│   ├── glyph/page.tsx            # dot-matrix studio
│   ├── focus/page.tsx            # rotary timer, shell re-tint
│   └── settings/                 # appearance control room + search
├── components/
│   ├── app-shell.tsx             # nav, More menu, mode prefixes, titles
│   ├── pwa-branding.tsx          # manifest/favicon pipeline (href mutation only)
│   ├── pack-icon.tsx             # renders all 4 icon-pack languages
│   └── command-center.tsx        # ⌘K
├── data/                         # typed curriculum + registries
│   ├── nav-items.ts              # bottom-nav slots
│   ├── nav-icons.ts              # per-slot variant resolution
│   ├── icon-packs.ts             # NOTHING_DOTS · TEENAGE_PATHS maps
│   ├── logo-marks.ts             # cipher/dot-D/line-D marks
│   └── share-code.ts             # appearance QR codec
├── persistence/                  # device-local state
│   └── preferences.ts            # normalize() → applyPreferences() → CSS vars
├── lib/
│   ├── ghost/engine.ts           # wllama worker client (lazy spawn)
│   ├── recovery.ts               # chunk-failure self-healing
│   └── diagnostics.ts            # error ring buffer → Settings → System
└── app/globals.css               # 14 themes, --on-accent engine, all app styles
public/
├── sw.js                         # network-first HTML · cache-first assets · v21
└── ghost/ghost-worker.js         # wllama module worker (CDN ESM, opt-in spawn)
android/deriva-twa/               # TWA: classic | nothing | opone launcher flavors
docs/                             # the constitution — read 01 → 06 before contributing
```

### Data flow

```
Typed curriculum (zod schemas)          HuggingFace GGUF (Q4_K_M)
        ↓ build fails on bad data               ↓ one-time stream
Derivation stages → execution trace     CacheManager → OPFS
        ↓                                       ↓
Viewers render f(trace, cursor)         ghost-worker.js: llama.cpp → WASM SIMD
timeline · trees · profiles                     ↓
                                        token stream → chat UI → tok/s gauge
Preferences → normalize() → applyPreferences()
        ↓
CSS variables (--theme · --accent · --on-accent computed from live luminance)
        ↓
every component, every icon pack, every theme — automatically
```

Two abstractions carry everything: **the trace** (add a new problem type and every view understands it) and **the preference pipeline** (add a new theme and contrast, icons, QR share and the boot script handle it).

## Adding a new theme

```css
/* src/app/globals.css */
:root[data-theme="mytheme"] {
  --paper: #101014;
  --paper-raised: #17171c;
  --ink: #eef0ea;
  --ink-soft: #9a9aa2;
  --line: #26262c;
  --accent: #5b8def;
}
```

That's it. `--on-accent` is computed from luminance at runtime, the accent picker picks it up, QR share codes encode it, the boot script applies it before first paint.

## Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript 5 strict — no `any` in committed code
- **Styling:** hand-rolled CSS design system, everything driven by CSS variables (no Tailwind dependency for theming)
- **State:** local component state + `localStorage` through a strict `normalize()` pipeline — stored shapes are never trusted
- **Local AI:** wllama 3.6 (llama.cpp compiled to WASM SIMD), GGUF models cached in OPFS, inference in a dedicated module worker spawned only after explicit user consent
- **PWA:** service worker (network-first HTML, cache-first immutable assets), TWA Android builds via Gradle product flavors
- **Tests:** vitest, 109 passing — curriculum data is validated at build time, so content errors are build errors

## Development

```bash
pnpm install
pnpm dev          # dev server
pnpm typecheck    # tsc --noEmit (strict)
pnpm test         # vitest
pnpm build        # production build — fails on any schema violation
```

### Conventions

- **Server components by default** — `'use client'` only when state/effects/browser APIs are required
- **React owns `<head>`** — branding code mutates existing link hrefs in place; removing React-managed nodes breaks hydration
- **Every color through CSS variables** — hardcoded hex in components is a bug; contrast comes from `--on-accent`, never guessed
- **Stored preferences are hostile input** — always round-trip through `normalize()`
- **Bump the SW cache version on every deploy** — stale workers are the root of all blank-route evil

## Performance

| Metric | Value |
|---|---|
| Theme application | before first paint (boot script, no flash ever) |
| Logo payload | ~20 KB JPEG (256px, was ~350 KB PNG) |
| Ghost cold start | seconds (model cached); 10–40 tok/s on recent phones |
| Ghost network usage after setup | zero — airplane-mode safe |
| Stale-deploy recovery | one automatic purge + reload, then never again |

## Deployment

Deploys to Vercel with zero config (`vercel`). Production serves from `main`; feature branches get preview URLs. The Android TWA builds from `android/deriva-twa` with three launcher-icon flavors:

```bash
./gradlew bundleClassicRelease   # classic cipher icon
./gradlew bundleNothingRelease   # Nothing dot-D
./gradlew bundleOponeRelease     # OP-1 line-D
```

## Documentation

The [`docs/`](docs) suite is the constitution. Start at [`01-product-requirements.md`](docs/01-product-requirements.md); UI/appearance law lives in [`09-ui-ux-design-system.md`](docs/09-ui-ux-design-system.md). Changes touching documented behavior update the doc in the same commit.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) and [GitHub Releases](../../releases). Current: **v1.5.0 — Lucent Lab**.

---

<div align="center">
<sub>Built for one user first. Preferences stay on the device and never change the learning path.</sub>
</div>
