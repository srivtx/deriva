# 01 — Product Requirements Document

**Product:** Deriva
**Tagline:** *Derive the algorithm. Don't memorize it.*
**Status:** v0 — personal daily-practice platform → v1 — public platform
**Date:** 2026-07-30

---

## 1. The Problem

Every major DSA resource optimizes for the wrong outcome:

| Existing tool | What it optimizes for | What it produces |
|---|---|---|
| LeetCode | Volume + contest metrics | Pattern matchers who freeze on novel problems |
| NeetCode | Efficient coverage of known questions | A memorized map that fails off-road |
| AlgoMonster | Template acquisition | Students who ask "which template?" instead of "what is the structure of this problem?" |
| Visualgo | Watching algorithms | Passive spectatorship — seeing ≠ deriving |
| Textbooks (CLRS) | Rigor | Completeness without scaffolding; no interactivity |

The gap: **no platform makes the student derive the algorithm.** They all deliver the
solution (video, template, animation, or editorial) and then test recall. The student's
inner experience is "I was told another trick." The experience we engineer is
"I invented the method — the hint system only asked me questions."

## 2. Product Thesis

> **Deriva is a discovery engine disguised as a practice platform.**
> The curriculum is the product; the software is a Socratic tutor + instrument panel
> that makes derivation unavoidable and memorization unrewarding.

An interactive university textbook fused with a software IDE, where:

- The **textbook** tells a story — each lesson creates the *need* for the next.
- The **IDE** only appears after the algorithm has been designed — code is the
  *transcription* of a discovery, never the medium of discovery.
- The **visualizer** executes the *student's own code* — proof that their reasoning
  was correct, not a demo of someone else's.

## 3. Audience

**v0 (now):** One user — the founder — for daily DSA practice. This is a feature, not a
limitation: the best curriculum editors are built against a real student with skin in
the game. Every design decision must survive contact with daily use.

**v1 (public):**
- Self-taught developers preparing for technical interviews who feel LeetCode is a slot machine.
- CS students who passed their algorithms course but can't *produce* algorithms under pressure.
- Engineers returning to fundamentals who want depth, not drills.

**Explicitly not the audience:** competitive programmers (they need speed tooling, not
discovery pacing) and "30 days to FAANG" cram customers (our method is deliberately slow).

## 4. Product Principles (binding constraints)

1. **Concepts → Reasoning → Patterns → Implementation.** Never inverted. Code is last.
2. **Discovery over delivery.** The platform asks; the student answers. Hints are
   questions, never statements. Solutions stay hidden unless explicitly requested —
   and requesting one is recorded as a learning signal, not a sin.
3. **One thinking-move per stage.** If a stage teaches two ideas, it is split.
4. **Naive before optimal** whenever the contrast produces the "aha." Pain is a
   teaching instrument.
5. **The trace is the product.** Every visualization animates the student's own
   execution, replayed deterministically. We never animate a canned demo.
6. **Conceptual understanding beats feature count.** Any conflict resolves in favor
   of understanding. When in doubt, cut the feature.
7. **Inevitability test.** Each lesson must make the next lesson's idea feel
   *necessary*. If a lesson can be skipped without narrative damage, it earns no place.
8. **Patterns are the residue.** Students should leave remembering the *pattern*,
   not the problem. Every lesson ends by naming its reusable idea.

## 5. The Core Loop (per problem)

Every problem in Deriva is a 9-stage guided experience. The stages are enforced in
order; the code editor physically does not exist on screen before Stage 6.

| # | Stage | Student does | Platform does |
|---|-------|--------------|----------------|
| 1 | **Understand** | Reads problem, interacts with worked examples, *predicts* outputs | Interactive examples, prediction checkpoints, zero code |
| 2 | **Play** | Manipulates data: clicks nodes, drags pointers, mutates inputs | A live sandbox of the exact data structure; free experimentation |
| 3 | **Reason** | Answers Socratic questions ("What does this node know?", "Can one value solve it?") | Asks; never tells. Answers are constructed by the student from constrained choices |
| 4 | **Discover** | Invents the return value, the state, the traversal | Constrained construction UI (slot-machine of options), not free text — discovery with guardrails |
| 5 | **Design** | Writes the algorithm contract: signature, state, transitions, traversal, complexity | Structured design form; platform checks the *design* against the problem, still no code |
| 6 | **Implement** | Writes Python in the editor | Progressive hints (each a question), hidden solutions, tests run against the design contract |
| 7 | **Execute** | Scrubs through an animation of *their own code*: call stack, structures, pointers | Full execution trace → deterministic replay with step forward/back |
| 8 | **Reflect** | Explains why naive failed, why the optimized works | Guided reflection; extracts the named pattern |
| 9 | **Generalize** | Sees 2–3 problems where the same pattern reappears | Cross-links across the curriculum; schedules spaced revisits |

**Stage weight varies by lesson.** A Reflex lesson lives mostly in stages 1–2. A Mastery
lesson compresses 1–5 and dwells in 6–7. The flow is sacred; the dwell time is not.

## 6. Functional Requirements

### v0 (personal platform)

- **F1. Curriculum engine** — lessons defined as typed, validated data (not prose files);
  the 9-stage flow is a state machine over that data.
- **F2. Interactive structure sandbox** — clickable/draggable trees, linked lists,
  arrays, graphs, heaps, grids (Stage 2).
- **F3. Socratic prompt engine** — branching guided questions with
  student-constructed answers (Stage 3–4).
- **F4. Design contract checker** — validates the student's declared signature/state/
  traversal against the lesson's model answer before unlocking the editor (Stage 5).
- **F5. Python execution sandbox** — Pyodide in a Web Worker; timeouts; memory caps;
  killable on infinite loops without freezing the UI (Stage 6).
- **F6. Execution tracer** — records calls, returns, line events, and structure
  snapshots into an immutable **trace**; the visualizer is a pure function of
  (trace, cursor) — enabling scrub, replay, step-back (Stage 7).
- **F7. Structure visualizers** — tree, linked list, array/pointers, heap, grid,
  graph, DP table, decision tree (Stage 7; built incrementally per the roadmap).
- **F8. Hint & solution policy engine** — hints are graded questions; solutions
  hidden by default; reveals logged (Stage 6).
- **F9. Progress persistence** — local-first (IndexedDB), per-lesson stage
  completion, drafts, hint reveals, reflection notes; export/import as JSON.
- **F10. Reflection & pattern journal** — every completed lesson deposits a named
  pattern into a personal pattern library (Stages 8–9).

### v1 (public platform — deferred, but not designed away)

- F11. Auth + cloud sync (Supabase).
- F12. Public pattern library / sharing.
- F13. Spaced-repetition scheduling derived from hint-reveal and reflection data.

### Non-goals (explicitly out of scope)

- ❌ Contests, leaderboards, streaks-as-addiction.
- ❌ Discussion forums (a moderation burden that teaches nothing).
- ❌ Company-tagged question lists ("Google asks this") — antithetical to the philosophy.
- ❌ Multi-language execution in v0 (Python only; the trace format is designed to admit
  a JS tracer later without rework).
- ❌ AI-generated explanations as a primary teaching channel. The Socratic engine is
  authored content; an LLM may *later* power adaptive follow-ups, never replace the authored path.

## 7. Success Metrics

For a single-user v0, metrics are qualitative instruments, not growth KPIs:

| Metric | Target | What it tells us |
|---|---|---|
| **Discovery rate** | ≥70% of problems reach Stage 6 without revealing a solution | The Socratic scaffolding works |
| **Hint depth** | Median hint level used ≤ 2 of 4 | Stages 1–5 carry their weight |
| **Naive-first compliance** | Student writes the naive version first on optimization lessons ≥60% of time | The contrast pedagogy is landing |
| **Daily return** | 5+ days/week usage by the founder | The platform survives real practice |
| **Aha log** | Reflection notes mention "why it works" without prompting | Transfer is happening |

v1 adds: completion rate per stage (funnel), pattern-recall on revisit, time-to-derive
on second exposure to a pattern.

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Authoring a 9-stage lesson is 10× the work of writing a LeetCode-style editorial | **High** | Authoring tooling + lesson schema make structure explicit; M0 builds exactly one topic (Trees) end-to-end to price the true cost before scaling |
| Students game the Socratic stages (click through to reach code) | Medium | Stage gates require *constructed* answers, not clicks; but provide a respectful "I know this — test me" escape that asks one mastery question instead of the full path |
| Pyodide tracing is too slow for large inputs | Medium | Trace caps (event budget), input-size limits per lesson, trace sampling fallback |
| Scope creep toward "LeetCode with extra steps" | **High** | Non-goals are contractual; every feature request must name the thinking-move it serves |
| Single-user design rots before multi-user arrives | Low | Persistence schema is user-namespaced from day one (see 08) |

## 9. What "Done" Looks Like for v0

The founder can do daily practice where, for every problem: the editor appears only
after a designed algorithm exists; the animation plays *their* code; and the platform
deposits a named pattern into the journal. The Trees topic is the proof; the remaining
13 topics are the scaling of a proven machine.
