# 10 — Development Roadmap

> **Status 2026-07-31:** the docs/12 reference lesson is delivered — one complete,
> phone-first nine-stage lesson (`/learn/trees/sum-1-to-n`): typed + zod-validated
> lesson module, stage machine with gates + mastery-probe escape, peel-strip
> discovery sandbox, contract builder, design-contract gate, worker-isolated Pyodide execution
> with sys.settrace replay, pattern deposit (*Recursive Leap of Faith*), pattern
> journal at `/patterns`, curriculum-rule tests (A1/A3/B1/B3/C2) + golden-trace
> fold tests. Remaining M0 gaps: self-hosted execution assets, tree sandbox,
> Dexie persistence, porting the rest of Trees into lesson modules.

**Strategy: one vertical slice proves the thesis; then scale the machine.**
We never build "all infrastructure, then all content" (the slice validates nothing until
the end) nor "all Trees UI, then all topics' UI" (re-learning viz lessons 14 times).
Each milestone ships something *usable for daily practice* and ends with an explicit
go/no-go gate.

---

## M0 — Foundations + The Trees Vertical Slice
*Goal: the full 9-stage flow works end-to-end for exactly one topic. This is the
riskiest milestone and deliberately contains the entire product in miniature.*

**Build:**
- Repo scaffold: Next.js + TS + Tailwind/tokens + Vitest + boundary linting (06 rules).
- Curriculum schema (zod) + registry + build-time rule checks (A1/A2/A5/B1/B3/C2).
- Stage machine + StageRail + per-stage shells (all 9, even if some are simple for now).
- Execution: Pyodide worker bridge, tracer (`call/return/line/assign` + tree semantic
  ops), event budget, terminate/respawn.
- Viz: replay engine (cursor store + folds), **tree panel, call-stack panel**,
  transport, narrated captions.
- Stage 2 tree sandbox (click nodes, edit values, drag structure).
- Socratic ladder runner + constructed-answer UI + hint ladder + design-contract checker
  (v1: structural matching).
- Persistence: Dexie schema, progress/drafts/events/journal repos, export/import.
- **Content: port the existing Trees curriculum** (7 stages, 10–12 problems) into lesson
  modules, passing the 03 §D checklist per lesson.
- CI: lesson solutions executed against tests; golden-trace viz tests.

**Exit criteria (the thesis test):**
1. The founder completes Trees daily practice for 5 consecutive days.
2. Metrics (PRD §7) are computable from the events table and show discovery rate ≥70%
   on first pass.
3. A Stage-7 screen matches 09 §9's promise: student code animates with tuples + naive
   trace comparison.
4. Pyodide never blocks Stage 1–5 (lazy load verified); infinite loop in student code
   never freezes UI (worker kill verified).

**Go/no-go:** if the 9-stage flow feels like bureaucracy rather than discovery in real
use, we revise the *flow* now — before 13 more topics depend on it.

---

## M1 — Execution Everywhere: Linked Lists + the pointer family
*Goal: generalize the trace/viz machine beyond trees; prove a second topic costs a
fraction of the first.*

**Build:** linked-list panel (boxes-and-arrows, traveling pointer chips), array-pointers
panel; list sandbox; pointer semantic ops; **Linked Lists topic authored** (7 stages).
**Exit:** second topic authored in ≤ 50% of the hours Trees took (the machine, not
heroics, does the work); pointer grammar (purple chips) reads consistently across panels.

## M2 — Ordering structures: BST + Trie; Playwright arrives
*Goal: invariant-driven structures; the "trap" tooling (build-the-wrong-validator,
counterexample builder).*

**Build:** BST range-highlight viz (downward constraints), trie panel (radial/layered),
counterexample builder component, grid panel (Trie mastery needs it); Playwright E2E of
the 9-stage flow on 3 representative lessons; **BST + Trie topics authored**.
**Exit:** the BST validation trap lesson measurably works (students who built the wrong
validator answer Stage-8 transfer probe correctly); E2E suite green in CI.

## M3 — Heap + Advanced Trees: dual views and path thinking
*Goal: the heap array/tree dual view (the curriculum's hardest single panel) and
path-as-array hybrid viz.*

**Build:** heap panel (swap arcs, heapify counting overlay), path/prefix viz, heapify
O(n) counting animation; **Heap + Advanced Trees authored**.
**Exit:** students derive heapify's O(n) from the counting overlay without hint level 4
(target: median hint depth ≤ 2 on that stage).

## M4 — The flagship renderers: Backtracking + Graphs
*Goal: decision-tree viz (choose/unchoose/prune with murdered-branch fade) and graph
panel (grid-as-graph, BFS layering, the scripted infinite-loop crash of Graphs-0).*

**Build:** decision-tree panel, graph panel + layouts, grid sandbox v2, BFS/DFS
dual-from-one-skeleton harness; **Backtracking + Graphs authored**.
**Exit:** the Graphs-0 crash moment (visited-set birth) is reliably experienced
(events show ≥80% of students hit the loop before the guard question); pruning stage
shows counted-work comparison in the reflect screen.

## M5 — DP + Greedy + Intervals: state made visible
*Goal: DP-table panel (fill order, dependency arrows, amber memo cells) and the
state-design trainer; sweep-line viz.*

**Build:** dp-table panel, state-design interactive (the amnesia test), naive-recursion
call-tree with duplicate-subtree highlighting, sweep-line panel; **DP (9 stages) +
Greedy + Intervals authored**.
**Exit:** on the DP topic, ≥60% of students design a correct state before any hint
(events: `probe.passed` at Discover); naive-vs-memo call counters land in Stage 8
reflections unprompted in the founder's journal notes.

## M6 — Advanced Graphs + Bits + Math: closing the loops
*Goal: weighted graphs, relaxation tracing, bit playground, iterate-a-function sandbox;
the reunion moments (Floyd in Math) land.*

**Build:** weighted-graph panel (frontier keys), union-find forest viz, bit panel
(8/32-bit rows, live ops), sequence-plot sandbox; **Advanced Graphs + Bit Manipulation +
Math authored**. Curriculum complete: ~93 stages, ~110–130 problems, 36 patterns.
**Exit:** full-curriculum walkthrough passes the Inevitability Test end-to-end; every
pattern in 04 §4 is earned in the journal at least once by the founder.

## M7 — Depth features (post-curriculum, pre-public)
- **Trace comparison** (student naive vs student optimal, side-by-side) — already
  architected (05 §0), now a first-class Stage-8 surface.
- **Spaced practice queue** from journal + event ledger (revisit scheduling).
- **Pattern library** public view; per-pattern "where it reappears" graph.
- Accessibility audit + performance audit against 05 §6 budgets.

## M8 — Public readiness (v1)
- Supabase auth + sync adapter (the seam from 08 §5), export→cloud migration.
- Landing page that *is* a demo: the 09 §9 screen, playable.
- Privacy-respecting analytics; content license; community guidelines (still no forums).

---

## Cross-Cutting Rules of the Road

1. **Content and machinery ship together in every milestone.** No milestone is "infra
   only" after M0.
2. **Every viz panel ships with golden-trace tests** before the topic that needs it is
   authored. Panels are cheap to test; topics authored against broken panels are not.
3. **The 03 §D checklist runs per lesson, in the PR that adds the lesson.** Vercel
   preview deploy = the review environment (05 §5).
4. **Metrics reviewed at every milestone gate** (discovery rate, hint depth, naive-first
   compliance). A metric that degrades as we scale topics is a curriculum bug, not a
   user bug.
5. **Scope discipline:** anything not naming a thinking-move (PRD §4.6) goes to the
   parking lot, including good ideas.

## Risk Register (rolling)

| Risk | Watch item | Contingency |
|---|---|---|
| Lesson authoring too slow to finish 14 topics | M1 exit metric (≤50% of Trees hours) | Cut problem counts per topic (A5 already minimizes); never cut stages |
| Pyodide trace perf on DP tables | M5 spike early: trace a 20×20 table | Event sampling; semantic-channel-only traces for heavy panels |
| 9-stage flow fatigue on short lessons | M0 gate: founder daily use | Stage *weighting* (PRD §5 flexibility clause) — compress stages per lesson type |
| Socratic ladders feel scripted/finite | Qualitative: founder journal | Deepen ladder branching on the 5 highest-traffic lessons; leave room for the v1 adaptive follow-up seam (05 §8) |
| Solo-maintainer burnout | Weekly time budget | The roadmap's granularity makes stopping/resuming safe; docs 01–09 are the resume instructions |

## Definition of Done (any milestone)

Code merged, tests green, docs updated (AGENTS.md + any doc its work touched), metrics
instrumented, and the milestone's exit criteria demonstrated — not asserted.
