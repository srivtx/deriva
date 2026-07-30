# 05 — System Architecture

## 0. The Load-Bearing Idea: The Trace Is The Product

Every execution in Deriva — reference solution or student code — produces an **immutable,
serializable event trace**. Every visualization is a **pure function of (trace, cursor)**.

```
student code ──► sandbox (Pyodide worker) ──► TRACE (append-only event log)
                                                      │
                                    ┌─────────────────┼──────────────────┐
                                    ▼                 ▼                  ▼
                              tree viz          stack viz           test results
                              (pure render)     (pure render)       (pure eval)
```

This single decision buys:
- **Scrub & step-back** — impossible with live-stepping debuggers; trivial with a log.
- **Determinism** — animations replay identically; bugs are reproducible; tests are golden-file simple ("given this trace, the viz shows this").
- **One renderer for all code** — the student's code and the reference solution animate through the same pipeline. The platform never shows a canned demo (PRD Principle 5).
- **Cheap correctness** — the visualizer never executes anything; it cannot be crashed by student code.
- **Future features for free** — "compare my trace with the optimal trace" (Stage 8), trace-diffing, and sharing are all read-only operations over logs.

## 1. System Overview

```
┌─────────────────────────────── BUILD TIME (Vercel CI) ──────────────────────────────┐
│  curriculum/ (typed lesson modules + MDX prose)                                      │
│      └─► zod validation (Rules A1–B5 checklist, mechanically checkable parts)        │
│      └─► static generation: one route per lesson, zero runtime content fetching      │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                    │ static assets
┌─────────────────────────────── RUN TIME (100% client-side) ─────────────────────────┐
│                                                                                      │
│  ┌─────────────┐   stage events   ┌──────────────────────┐                          │
│  │  LESSON UI  │ ◄──────────────► │  LEARNING ENGINE      │  9-stage state machine  │
│  │  (React)    │                  │  (zustand store)      │  per lesson instance    │
│  └──────┬──────┘                  └──────────┬───────────┘                          │
│         │ code                               │ trace request                        │
│         ▼                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   postMessage             │
│  │  EXECUTION BRIDGE (main thread, thin)                │ ◄───────────────┐         │
│  └──────────────────────────────────────────────────────┘                 │         │
│                                                                           │         │
│  ┌─── WEB WORKER: SANDBOX ────────────────────────────────────┐            │         │
│  │  Pyodide (CPython WASM)                                    │            │         │
│  │   └─► tracer (sys.settrace) ──► event budget ──► TRACE ────┼────────────┘         │
│  │   └─► hard kill: worker.terminate() on timeout/loop        │                      │
│  └────────────────────────────────────────────────────────────┘                      │
│                                                                                      │
│  ┌─── VIZ LAYER ──────────────┐   ┌─── PERSISTENCE (local-first) ───────────────┐   │
│  │ trace replay engine        │   │ IndexedDB (Dexie): drafts, traces, progress │   │
│  │ cursor store               │   │ localStorage: prefs only                    │   │
│  │ structure renderers (SVG)  │   │ export/import: JSON file                    │   │
│  └────────────────────────────┘   └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**There is no backend in v0.** The Vercel deployment is a static site with a service
worker for asset caching. This is not a compromise — it is the correct architecture for
the requirements (see §5).

## 2. The Trace Format (the most important schema in the system)

Language-agnostic by design (admits a JS tracer later without rework, per the "Both
later" option we chose not to take but refuse to close the door on).

```ts
type Trace = {
  version: 1
  language: "python"
  source: string                 // the code that produced this trace
  input: unknown                 // lesson-defined input
  events: TraceEvent[]           // append-only, bounded by eventBudget
  budget: { maxEvents: number; truncated: boolean }
}

type TraceEvent =
  | { t: "call";    frame: FrameId; fn: string; args: Record<string, Value>; depth: number }
  | { t: "return";  frame: FrameId; value: Value }
  | { t: "line";    frame: FrameId; lineno: number }
  | { t: "assign";  frame: FrameId; name: string; value: Value }        // watched locals
  | { t: "structure"; op: StructureOp }                                  // semantic ops, see below
  | { t: "compare"; a: Value; b: Value; result: boolean }                // instrumented comparisons
  | { t: "error";   message: string; frame: FrameId }

// The tracer is optionally semantic: lesson harnesses annotate structure operations
// so viz can render intent, not infer it.
type StructureOp =
  | { kind: "tree.visit";  node: NodeId }
  | { kind: "list.move";   ptr: string; to: NodeId }
  | { kind: "heap.swap";   i: number; j: number }
  | { kind: "dp.write";    cell: [number, number] | [number]; value: Value }
  | { kind: "bt.choose";   choice: Value } | { kind: "bt.unchoose"; choice: Value }
  | { kind: "graph.enqueue"; node: NodeId } // ... etc per structure family
```

Design notes:
- **Two channels, one stream.** Low-level events (`call/return/line/assign`) come free
  from `sys.settrace`. Semantic events (`structure`) are emitted by *lesson harness code*
  (the wrapper that builds the tree from the input and calls the student's function).
  Visualizers consume whichever channel they need: the call-stack panel uses the low
  channel; the tree panel uses the semantic channel.
- **Values are snapshots, not references** (Python Tutor's object-render model): small
  immutable JSON trees with ids for shared structure. Bounded depth/size; overflow marked.
- **Event budget** (default 5,000 events) with `truncated: true` fallback — lessons
  declare input sizes that keep traces well under budget. This is the mitigation for
  "Pyodide tracing is slow" (PRD §8): we don't trace big inputs, because *pedagogy never
  needs big inputs* — you cannot watch 10,000 nodes and learn more than watching 10.

## 3. The Lesson Module (curriculum as data)

```ts
type LessonModule = {
  id: string                      // "trees/05-optimization/diameter"
  topic: TopicId
  beat: SpineBeat                 // reflex|mechanic|payload|leap|naive|optimization|mastery
  thinkingMove: string            // ≤8 words — Rule A1, build-checked
  purpose: string                 // the one educational purpose — Rule A5, required
  dependencies: LessonId[]        // Rule A2 chain, build-checked for acyclicity
  stages: {
    understand: { prose: MdxRef; examples: InteractiveExample[]; predictions: Prediction[] }
    play:       { sandbox: SandboxConfig; experiments: Experiment[] }
    reason:     { socraticLadder: SocraticNode[] }       // branching Q graph, answers constructed
    discover:   { artifact: ArtifactBuilder }            // e.g. ReturnTypeBuilder w/ option slots
    design:     { contract: DesignContract }             // signature, state, traversal, complexity
    implement:  { starter: string; harness: string; tests: TestCase[]; hints: HintLadder[]; solution: string }
    execute:    { traceConfig: TraceConfig; vizPanels: VizPanelId[] }
    reflect:    { prompts: string[]; pattern: PatternId } // Rule C2
    generalize: { related: LessonId[]; revisitInDays?: number[] }
  }
}
```

Everything mechanically checkable in Rules 03 (stage completeness, thinking-move length,
dependency chain, hint ladder depth, pattern attachment) is a **zod refinement that fails
the build**. The curriculum cannot silently rot.

## 4. Runtime Layers

### 4.1 Learning Engine (stage state machine)
- One zustand store per active lesson: `stage`, per-stage artifacts (constructed answers,
  design contract, code draft), hint state, completion.
- Stage gates: transitions validated (e.g., `design→implement` requires a contract that
  passes the *contract checker* — structural match against the lesson's model contract,
  with targeted Socratic feedback on mismatch, never "wrong, look here").
- "Test me out" escape (Rule B1): a gate can be skipped by answering its mastery probe;
  attempts logged.

### 4.2 Execution Bridge & Sandbox
- **Pyodide in a dedicated Web Worker**, lazy-loaded on first Stage 6 (the ~10MB WASM is
  never on the critical path of Stages 1–5).
- Protocol: `run(code, harness, input, budget) → Trace` over postMessage; structured
  clone keeps it cheap.
- **Infinite-loop policy:** tracer counts events; over budget → raise inside Python
  (clean Trace with `truncated`). Wall-clock timeout → `worker.terminate()` + respawn
  (the UI never freezes; this is why the worker, not a synchronous in-page run).
- **Warm pool:** one worker kept warm after first load; respawn on terminate.

### 4.3 Viz Layer
- **Replay engine:** owns `cursor: number` into the trace; stepping = cursor ±; scrubbing
  = cursor jump. Panels subscribe to cursor and re-derive state **purely**.
- **Structure renderers** (SVG + d3-hierarchy for layout only): tree, linked-list,
  array/pointers, heap, grid, graph, dp-table, decision-tree. Shared visual grammar
  (colors/motion per 09 §6).
- **State derivation:** each panel declares which event types it folds into its model
  (e.g., call-stack folds call/return; tree panel folds structure/visit). Folds are pure
  reducers — testable in Vitest without a browser.

### 4.4 Content Pipeline (build time)
- Lesson modules are TypeScript (typed) + MDX imports (prose) → validated by zod →
  statically generated routes. No runtime content service, no CMS.
- Solutions/harnesses are **executed in CI** (Node-side Pyodide or CPython via subprocess)
  against their tests: a broken lesson fails the build, not the student.

## 5. Vercel Free-Tier Fit (constraints → design responses)

| Constraint | Response |
|---|---|
| Serverless functions: hobby limits, cold starts | **Zero functions in v0.** Execution is client-side (Pyodide). Nothing per-user is computed server-side. |
| Bandwidth 100GB/mo | Pyodide WASM self-hosted from `/public` (not CDN) + service worker cache → loaded once ever, lazy. MDX/content is static and small. Budget: first visit ~12MB (mostly Pyodide), repeat visits <100KB. |
| No persistent server state | Local-first persistence (08). Cloud sync deferred to v1 (Supabase) with a schema designed for it now. |
| Build minutes | Curriculum executes its own tests in CI; caching keeps builds modest. Fine at this scale. |
| Preview deploys per branch | Curriculum authoring workflow: branch per topic, preview = the review environment for the 03 §D checklist. |

## 6. Non-Functional Budgets

- **TTI for any Stage 1–5 screen:** < 1.5s on mid mobile (no Pyodide in the path).
- **Stage 6 first edit→run:** Pyodide warm load ≤ 4s once per session, then < 300ms/run
  for lesson-scale inputs.
- **Trace replay:** 60fps scrub on 5k-event traces (pure reducers + memoized folds).
- **Offline:** after first full load, the platform works offline (service worker).
  Daily practice must survive a plane.

## 7. Security & Safety

- Student code runs only in the browser sandbox (WASM worker): no filesystem, no network
  (Pyodide initialized with no loaders), hard CPU/memory ceilings via budget + terminate.
- No `eval` on the main thread. Trace data is JSON-only across the worker boundary.
- v1 note: user-generated reflections are stored, never rendered as raw HTML (React
  escaping + sanitized MDX only).

## 8. What We Explicitly Did Not Build (and why)

- **No backend execution service** — cost, latency, abuse surface, and zero pedagogical
  benefit. Browser WASM is the right sandbox.
- **No realtime/collaboration** — v1 concern; the trace log is already the right
  substrate if it ever arrives.
- **No plugin/LLM tutor** — the Socratic engine is authored content (PRD non-goal). The
  ladder data model (`SocraticNode`) leaves room for an adaptive follow-up generator
  later, behind the same UI contract.
