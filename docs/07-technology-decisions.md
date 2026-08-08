# 07 — Technology Decisions

Every decision below: **choice · alternatives · rationale · trade-offs accepted.**
Optimization targets, in order: simplicity → educational quality → developer experience →
future scalability. Deployment target: Vercel free tier (see 05 §5).

---

## D1. Application framework — **Next.js (App Router) + TypeScript**

| Alternatives | Why not |
|---|---|
| Vite SPA | Simplest possible, but we lose file-based routing, static generation of ~130 lesson routes, image/font optimization, and the zero-config Vercel path. The content pipeline (per-lesson routes) wants SSG. |
| Astro | Best-in-class for content sites; weaker for highly stateful app-like screens (the lesson experience is one giant stateful surface). Islands would fragment the 9-stage flow. |
| Remix/SvelteKit | Fine tools; smaller ecosystems, no advantage for this shape, and Vercel is Next's native habitat. |

**Rationale:** static-first rendering of curriculum routes + one dynamic client surface per
lesson; TypeScript because the curriculum *is data* and schema-checking content is a core
mechanism (03 C1).
**Trade-offs accepted:** App Router complexity; some React Server Component mental overhead
for what is mostly a client app. Contained by the rule "routes compose, features are client
components."

## D2. Language runtime for student code — **Pyodide (CPython WASM) in a Web Worker**

| Alternatives | Why not |
|---|---|
| JavaScript execution in-page | Zero cost and native instrumentation, but the user chose Python (closest-to-pseudocode; DSA-teaching standard). |
| Server-side execution (Judge0, custom) | Violates "avoid backend computation"; latency, cost, abuse surface, and it breaks offline practice. |
| Brython / Skulpt | Faster to load but incomplete/approximate Python — tracer fidelity (`sys.settrace`) is the product; we need real CPython semantics. |

**Rationale:** real Python, real trace events, browser sandbox, offline-capable, zero
backend. Worker isolation gives us hard-kill infinite-loop protection with a frozen-UI
cost of zero.
**Trade-offs accepted:** ~10MB WASM payload (mitigated: self-hosted, lazy-loaded at first
Stage 6, service-worker cached, never on the Stage 1–5 critical path); ~2–4s first load
per session.

## D3. Execution instrumentation — **`sys.settrace` → immutable event log (Python Tutor model)**

| Alternatives | Why not |
|---|---|
| Live stepping debugger (pause/resume via generator hooks) | Cannot scrub backward; couples viz to execution lifetime; fragile. |
| AST rewriting to instrument operations | Powerful but brittle and hard to audit; settrace + semantic harness events (05 §2) covers both channels with standard machinery. |
| Snapshot-everything (full heap per step) | Memory blowup; we snapshot *watched values* + emit semantic ops instead. |

**Rationale:** the trace-as-product architecture (05 §0) — determinism, replay,
testability, one renderer for student and reference code. Philip Guo's Python Tutor is
the existence proof that this model teaches well at scale.
**Trade-offs accepted:** tracing overhead (~5–20× slowdown) — irrelevant at lesson input
sizes; event budget enforced.

## D4. Code editor — **CodeMirror 6**

| Alternatives | Why not |
|---|---|
| Monaco | VS Code power we don't need; ~3MB+; awkward mobile UX; harder to do *pedagogical* editing (guided read-only regions, inline Socratic annotations). |
| Plain textarea | Insult to a Stage-6 IDE promise: no highlighting, no indentation help. |

**Rationale:** CM6's decoration/range-set model is *built* for guided regions and inline
annotations (the Stage 6 "fill-in-the-blank IDE" is a first-class feature); modular,
lean (~400KB with Python mode), mobile-tolerable.
**Trade-offs accepted:** less out-of-box chrome than Monaco; we build the little we need.

## D5. Visualization stack — **SVG + d3-hierarchy (layout only), no canvas, no GSAP initially**

| Alternatives | Why not |
|---|---|
| Canvas/WebGL (Pixi, three.js) | Performance we don't need at ≤ hundreds of nodes; loses DOM hit-testing, accessibility, and CSS transitions. |
| Full d3 (selections, transitions) | Fights React's ownership of the DOM; we take d3's *layout math* (tree/tidy) and let React render. |
| GSAP | Excellent timelines, but our animation is cursor-driven (scrub = re-render at t), which is a state-derivation problem, not a tween problem. Web Animations API / CSS transitions on state change suffice. |

**Rationale:** SVG nodes are inspectable, clickable (Stage 2 sandbox reuses the same
renderers), screen-reader-annotatable (09 §8), and diff-friendly in golden tests.
Motion = CSS transitions triggered by model diffs; the replay engine supplies time.
**Trade-offs accepted:** hand-rolled transition discipline; revisit only if a future
panel (e.g., huge graph) outgrows SVG.

## D6. Client state — **Zustand (+ Immer for trace folds)**

| Alternatives | Why not |
|---|---|
| Redux Toolkit | Ceremony disproportionate to two stores (stage machine, cursor). |
| Context + useReducer | Fine until cursor updates at 60fps during scrub — needs a store with selective subscriptions. |
| Jotai/Recoil | Atom models are elegant but our state is two cohesive machines, not a graph of derived atoms. |

**Rationale:** minimal API, selective subscriptions for scrub performance, no provider
nesting, trivially testable outside React.

## D7. Styling & components — **Tailwind CSS + design tokens + Radix primitives**

| Alternatives | Why not |
|---|---|
| MUI/Chakra | Their component opinions fight a bespoke design language (09); runtime theme cost. |
| CSS Modules | Respectable but slower to iterate; token system becomes hand-rolled. |
| Unstyled everything | Radix already solved accessible behavior (focus, keyboard, aria) — we buy behavior, keep appearance. |

**Rationale:** Tailwind for velocity constrained by a strict token layer (09 §4) so the
system doesn't dissolve into arbitrary values; Radix for interaction correctness.

## D8. Content format — **Typed lesson modules (TS) + MDX prose + Zod validation**

| Alternatives | Why not |
|---|---|
| Pure MDX per lesson | Prose-first makes the 9-stage structure uncheckable — exactly the failure mode Rule C1 exists to prevent. |
| Headless CMS (Sanity/Contentful) | Service dependency, cost, and review-by-click instead of review-by-diff. Curriculum must live in git with PR review (the preview deploy IS the review environment, 05 §5). |
| YAML/JSON lesson files | Loses type safety and MDX embedding; TS modules give both, validated by Zod at build. |

**Rationale:** curriculum integrity = build integrity. Rules A1/A2/A5/B1/B3/C2 are zod
refinements; a lesson missing a hint-ladder level *fails CI*.

## D9. Testing — **Vitest (unit/golden) now; Playwright when the flow stabilizes (M2)**

| Alternatives | Why not |
|---|---|
| Jest | Vitest is faster, ESM-native, same API. |
| Playwright from day one | E2E over a moving UI is a tax; golden-trace viz tests catch deeper bugs cheaper. Added at M2 for the 9-stage flow. |

**Rationale:** the highest-value tests are (a) curriculum rule checks, (b) tracer unit
tests (run in CI under real CPython), (c) golden-trace → fold → panel-model tests that
verify visualizations with no browser at all (enabled by 06 boundary rule 2).

## D10. Persistence — **IndexedDB via Dexie (local-first), Supabase seam for v1**

Full treatment in 08. Summary: Dexie migrations mirror a future Postgres schema;
`localStorage` only for prefs; JSON export/import from day one.

## D11. Ancillary decisions

| Decision | Choice | Why |
|---|---|---|
| Fonts | Self-hosted subsets: Newsreader (narrative serif), Inter (UI), JetBrains Mono (code) | No third-party fetch; offline; the textbook/IDE duality is typographic (09 §5) |
| Lint/format | ESLint + Prettier + `eslint-plugin-boundaries` (or import restrictions) | Enforce 06 boundary rules mechanically |
| Dependency audit | `madge` (circulars), `depcheck` in CI | Keep the graph honest |
| Package manager | pnpm | Fast, strict node_modules (catches phantom deps) |
| Analytics (v0) | **None** | Single-user; learning signals live in the journal (hint depth, reveals) — measured for pedagogy, not surveillance. v1: privacy-respecting, self-hosted or Plausible-class |
| Env/secrets | None needed in v0 | No backend, no keys — a security property, not an oversight |

## Decision record format going forward

Any decision that *revisits or adds* to this document must be appended as `D12+` with
the same four-part structure and a link to the roadmap milestone that motivated it.
This document is append-mostly: reversals require naming the trade-off that changed.

## D12. v0 execution runs main-thread; worker bridge remains the seam (M0, 2026-07-31)

_Superseded by D13 for the current execution path; retained as the historical rationale for the initial vertical slice._

**Decision:** the reference nine-stage lesson (`trees/00-recursion-reflex/sum-1-to-n`)
and `/practice` execute Pyodide on the main thread via `src/execution/pyodide-client.ts`,
loading from CDN. The Web Worker bridge (`src/execution/bridge/`) stays as the designed
seam, documented in 05 §4.2.

**Context:** the reference lesson's pedagogical weight is in stages 1–5; trace inputs
are tiny (n ≤ 8, ≤500 events) so main-thread blocking is imperceptible. A worker
rewrite would have doubled the reference lesson's delivery time without changing the
learning flow being validated.

**Consequences:** trace budgets stay small by curriculum rule (lessons declare inputs
that keep traces under budget); infinite loops are caught by the event budget +
RecursionError, not by worker kill. Migration path: swap `pyodide-client` internals for
`worker-client` when (a) trace budgets grow past ~5k events, or (b) a second topic
ships. Vitest added as the test runner (tests/curriculum, tests/viz) per D9's intent.

## D13. Python execution moves behind the worker bridge (M0, 2026-08-08)

**Decision:** `src/execution/pyodide-client.ts` is now a safe facade over
`src/execution/bridge/worker-client.ts`. Test runs and trace runs receive request IDs,
hard 15-second timeouts, abort signals, and worker termination on cancellation or failure.

**Context:** the main-thread path made an infinite loop or oversized student input capable
of freezing the application. The product requirement prioritizes a responsive UI and a
killable sandbox over preserving the first implementation's shortcut.

**Consequences:** Pyodide still loads from the CDN until the offline asset milestone lands;
the worker protocol is now the only execution seam. The next execution work is self-hosting
Pyodide, disabling network loaders, and extending the trace beyond call/return events.
