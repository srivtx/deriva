# 06 — Folder Structure

Monorepo of one app (no workspaces — YAGNI at this scale). Next.js App Router, all code
under `src/`. The tree below is annotated with the *reason* each directory exists.

```
deriva/
├── docs/                              # This planning suite (01–10). The constitution.
├── public/
│   ├── pyodide/                       # Self-hosted WASM runtime (lazy-loaded; offline-capable)
│   └── fonts/                         # Self-hosted subsets (no third-party font fetch)
├── src/
│   ├── app/                           # Routes only. Zero logic — pages compose features.
│   │   ├── page.tsx                   #   / — curriculum map (the story, visualized)
│   │   ├── learn/[topic]/[lesson]/    #   the 9-stage lesson experience (the product)
│   │   ├── lab/                       #   AI/ML lab lessons (docs/13) — separate from DSA
│   │   │   ├── page.tsx               #   lab map + artifact chain
│   │   │   └── [slug]/page.tsx        #   a single lab through the same 9-stage flow
│   │   ├── ai-ml/                     #   AI/ML hub + 180-question bank (docs/13 §nav)
│   │   │   ├── page.tsx               #   hub: continue, tracks, labs, queue, projects, patterns
│   │   │   ├── build-everything/       #   37 PDF projects + production + modern extensions
│   │   │   │   ├── page.tsx            #   source tiers, production extensions, live progress
│   │   │   │   └── [projectId]/page.tsx#   five-step contract + workspace CTA
│   │   │   │       └── workbench/page.tsx# executable contract when authored
│   │   │   ├── track/[trackId]/       #   question track with status/kind filters
│   │   │   ├── lab/[lessonId]/        #   lab page: artifact, questions, start/resume
│   │   │   ├── question/[questionId]/ #   typed question player (fixture→answer→rubric→next)
│   │   │   ├── projects/              #   Systems Projects (system-ai/ml-projects-plan.md)
│   │   │   │   ├── page.tsx           #   15-card project map with 0/5–5/5 progress
│   │   │   │   ├── [projectId]/       #   brief, five levels, artifact chain
│   │   │   │   │   └── level/[levelId]/ # level workbench: spec→design gate→code→artifact
│   │   │   │   └── …/level/[levelId]/artifact/ # saved artifact + reflection + next decision
│   │   │   ├── projects/page.tsx      #   (legacy) — superseded by the project map
│   │   │   └── patterns/page.tsx      #   pattern journal derived from the question bank
│   │   ├── patterns/                  #   pattern directory, quiz, and earned journal
│   │   ├── practice/                  #   daily queue (v0: simple; v1: spaced)
│   │   └── layout.tsx                 #   design-system shell, fonts, theme
│   │
│   ├── curriculum/                    # ★ THE PRODUCT. Content as validated data.
│   │   ├── schema/                    #   zod: LessonModule, SocraticNode, TraceConfig…
│   │   │   └── question.ts            #   typed question contract (docs/13 §bank): fixture,
│   │   │                               #   rubric, hints, pattern, nextQuestionId
│   │   ├── schema/project.ts          #   Systems Projects contract: five levels, spec,
│   │   │                               #   design gate, tests, artifact, drill, exit gate
│   │   ├── patterns/                  #   the 36 named patterns (04 §4) as data
│   │   ├── topics/
│   │   │   ├── trees/
│   │   │   │   ├── topic.ts           #   spine metadata, narrative, door-opener
│   │   │   │   ├── 00-recursion-reflex/
│   │   │   │   │   ├── lesson.ts      #   stages: ladders, contracts, tests, harness
│   │   │   │   │   ├── prose.mdx      #   narrative blocks (imported by lesson.ts)
│   │   │   │   │   └── solution.py    #   reference solution (CI-executed)
│   │   │   │   └── …/                 #   one folder per lesson
│   │   │   ├── linked-lists/ … math/  #   14 DSA topics total
│   │   │   └── ai-ml/                 #   AI/ML systems track (docs/13) — separate
│   │   │       ├── topic.ts           #   spine metadata for the five lab kinds
│   │   │       ├── build-everything.ts#   63-project curriculum + executable registry
│   │   │       ├── build-everything-implementations.ts # dependency-free lab contracts
│   │   │       ├── build-everything-extensions.ts # production/data/safety/privacy extensions
│   │   │       ├── build-everything-modern.ts # MCP/agents/inference/compiler extensions
│   │   │       ├── 00-data-contract/  #   lesson + deterministic JSON fixtures
│   │   │       ├── questions/         #   the 180-question bank, one file per family
│   │   │       │   ├── index.ts       #   registry: parse-all + track map + chain
│   │   │       │   └── questions-*.ts #   math/data/classical/experiments/deep/
│   │   │       │                       #   retrieval/rag/backend families
│   │   │       ├── projects/          #   Systems Projects ladder (system-ai plan)
│   │   │       │   ├── index.ts       #   registry: 15 projects, parse-all
│   │   │       │   ├── project-01-data-contract.ts # Project 1, L1–L5 authored slice
│   │   │       │   └── project-01-fixtures.ts      # per-level trace fixtures + wrappers
│   │   │       └── …/                 #   one lesson per module (A–F)
│   ├── learning/stages/ai/build-everything-workbench.tsx # A1 executable workspace
│   └── persistence/build-everything-progress.ts          # local-first workspace state
│   │   └── index.ts                   #   registry: dependency graph, build-time checks
│   │
│   ├── learning/                      # ★ The 9-stage engine (pedagogy as software)
│   │   ├── flow/
│   │   │   ├── stage-machine.ts       #   zustand store: stage, gates, artifacts
│   │   │   ├── gates.ts               #   transition validators + "test me out" probes
│   │   │   └── stage-rail.tsx         #   compass rail (desktop) + stepper (phone)
│   │   ├── stages/                    #   ★ the nine stage surfaces (docs/12 reference)
│   │   │   ├── shell.tsx              #   shared grammar: kicker, move chip, pinned CTA, ProbeCard
│   │   │   ├── understand.tsx … generalize.tsx
│   │   │   └── ai/                    #   AI/ML lab surfaces (docs/13) — DSA surfaces untouched
│   │   │       ├── ai-page.tsx        #   lab orchestrator (same machine, lab-native Play/Execute)
│   │   │       ├── dataset-sandbox.ts #   pure contract rules for the Play sandbox
│   │   │       ├── dataset-play.tsx   #   Stage 2: edit rows, watch counts
│   │   │       ├── dataset-execute.tsx#   Stage 7: runAiTrace + dataset panel
│   │   │       └── artifact-card.tsx  #   durable artifact + system constraints
│   │   ├── socratic/
│   │   │   └── (lives in stages/reason.tsx — one question at a time, pump-before-tell)
│   │   ├── contract/
│   │   │   └── (lives in stages/design.tsx — signature/base/step/complexity checker)
│   │   ├── reflect/
│   │       └── (lives in stages/reflect.tsx — pattern deposit, own words)
│   │   └── next-actions.ts             #   one derived resume queue for Home + inbox
│   │
│   ├── execution/                     # ★ Sandbox + trace (05 §2, §4.2)
│   │   ├── pyodide-client.ts          #   safe facade: runTests + runTraced through the worker
│   │   ├── bridge/
│   │   │   ├── worker-client.ts       #   postMessage protocol, warm pool, respawn
│   │   │   └── sandbox.worker.ts      #   Pyodide bootstrap, budget, terminate policy
│   │   ├── trace/
│   │   │   ├── types.ts               #   Trace, TraceEvent, StructureOp (language-agnostic)
│   │   │   ├── tracer.py              #   sys.settrace implementation + semantic ops
│   │   │   └── budget.ts              #   event caps, truncation markers
│   │   └── harness/
│   │       ├── builders.py            #   input→structure builders (tree/list/graph…)
│   │       └── runner.py              #   harness protocol: build→call student fn→emit
│   │
│   ├── viz/                           # ★ Pure renderers of (trace, cursor) — 05 §4.3
│   │   ├── replay/
│   │   │   ├── cursor-store.ts        #   scrub/step/replay; the single source of time
│   │   │   └── folds.ts               #   pure reducers: events→panel models (Vitest-able)
│   │   ├── grammar/                   #   shared visual language (colors, motion — 09 §6)
│   │   ├── panels/
│   │   │   ├── call-stack.tsx         #   frames, args, return values (low channel)
│   │   │   ├── dataset.tsx            #   AI/ML: rows → accepted/rejected at the cursor
│   │   │   ├── tree.tsx               #   SVG + d3-hierarchy layout
│   │   │   ├── linked-list.tsx        #   boxes-and-arrows, pointer labels
│   │   │   ├── array-pointers.tsx     #   index strip + named pointer chips
│   │   │   ├── heap.tsx               #   array + tree dual view, swap arcs
│   │   │   ├── grid.tsx               #   cells, frontier, visited wash
│   │   │   ├── graph.tsx              #   node-link, layered layouts
│   │   │   ├── dp-table.tsx           #   table fill, dependency arrows, cell reads
│   │   │   └── decision-tree.tsx      #   backtracking tree, pruned-branch fade
│   │   └── sandbox/                   #   Stage 2 manipulables (click/drag/edit structures)
│   │
│   ├── editor/                        #   CodeMirror 6 setup
│   │   ├── cm.ts                      #   extensions, keymap, theme (paper/ink)
│   │   ├── guided-regions.ts          #   read-only boilerplate + fill regions (optional)
│   │   └── hints/                     #   inline hint UI bound to hint-ladder
│   │
│   ├── persistence/                   # ★ Local-first data (08) — ONLY dir touching localStorage
│   │   ├── preferences.ts             #   theme / motion / text-scale prefs
│   │   ├── lesson-progress.ts         #   9-stage progress, artifacts, pattern journal
│   │   ├── practice-progress.ts       #   last-open problem per DSA topic
│   │   ├── ai-question-progress.ts    #   AI question status, drafts, attempts, review dates
│   │   ├── project-progress.ts        #   project level: stage, pane, draft, artifact, gates
│   │   ├── app-notifications.ts       #   derived next-move inbox + read state
│   │   ├── pattern-mastery.ts         #   recognized and missed pattern signals
│   │   ├── pattern-desk-progress.ts   #   last-open pattern card
│   │   ├── workbench-progress.ts      #   current problem + completion for HLD/LLD
│   │   ├── theory-notes.ts            #   personal explanations per problem
│   │   ├── db.ts                      #   Dexie schema + versioned migrations (planned)
│   │   ├── repos/
│   │   │   ├── progress-repo.ts       #   stage completion, attempts, mastery probes
│   │   │   ├── draft-repo.ts          #   code drafts per lesson
│   │   │   ├── journal-repo.ts        #   patterns, reflections
│   │   │   └── trace-repo.ts          #   saved traces (recent N per lesson, capped)
│   │   ├── export.ts                  #   full-profile JSON export/import
│   │   └── sync/                      #   v1 seam: Supabase adapter (empty in v0, typed)
│   │
│   ├── notifications/                    # Browser notification delivery; no progress storage
│   │   └── desktop-reminder.ts           #   leave reminder + service-worker handoff
│   │
│   ├── design-system/                 #   tokens + primitives (09)
│   │   ├── tokens.css                 #   color/space/type/motion tokens
│   │   ├── primitives/                #   Button, Card, Rail, Tooltip… (Radix-based)
│   │   └── stage-rail.tsx             #   ★ the 9-stage journey rail (core nav metaphor)
│   │
│   └── lib/
│       ├── result.ts                  #   Result<T,E> — no thrown errors across layers
│       └── ids.ts                     #   branded id types (LessonId, PatternId…)
│
├── tests/
│   ├── curriculum/                    #   schema + rules checks (A1/A2/A5/B1…, AI-1…AI-4)
│   ├── viz/                           #   golden traces → folds → panel models
│   └── execution/                     #   tracer unit tests (run under CPython in CI)
│
├── AGENTS.md                          #   project conventions for AI agents
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Boundary rules (enforced by eslint `import/no-restricted-paths`)

1. `app/` imports from features; features never import from `app/`.
2. `viz/` may not import from `execution/` — it receives `Trace` via props. (The viz
   layer must stay provably pure: golden-trace tests render without any sandbox.)
3. `curriculum/` imports nothing from `learning/`, `viz/`, or `execution/` — it is data.
   (Content authors can never couple lessons to UI internals.)
4. `persistence/` is the only directory allowed to touch `indexedDB`/`localStorage`.
5. Circular dependencies fail the build (`madge` in CI).

## Why this shape

- **The three starred directories (`curriculum`, `learning`, `execution` + `viz`) mirror
  the product thesis**: content, pedagogy, and instrumentation are separate careers in
  this codebase, with `Trace` and `LessonModule` as the only treaties between them.
- **A new topic is a new folder, nothing else.** Adding a topic touches only
  `curriculum/topics/<name>/` — the registry auto-discovers. This is the
  author-at-3am-friendly property the roadmap depends on.
- **The v1 seam is one directory.** `persistence/sync/` is the only place multi-user
  ever enters; nothing else knows the difference.
