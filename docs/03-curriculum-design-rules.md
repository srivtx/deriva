# 03 — Curriculum Design Rules

These are the **constitutional laws** of Deriva content. They apply to every topic, every
stage, every problem. They are phrased to be *enforceable*: each rule has a rationale, a
violation signature, and a test. When a rule and a feature conflict, the rule wins
(PRD Principle 6).

---

## A. Structural Rules

### A1. One thinking-move per stage
A stage teaches exactly one new way of thinking — never two, never zero.
- **Violation signature:** a stage whose explanation needs the word "also."
- **Test:** name the move in ≤8 words ("return multiple values," "eliminate half the
  world per step"). If you need a conjunction, split the stage.

### A2. Reflex before mechanic, mechanic before leap, pain before cure, composition last
The seven-beat spine (Reflex → Mechanic → Payload → Leap → Naive → Optimization →
Mastery) may repeat beats but never inverts them.
- **Rationale:** each beat is cognitively unreachable without the prior one (see 02 §2).
- **Test:** for each stage, list the prior stages it consumes. The dependency graph must
  be a chain (optionally with bridge edges), never a skip.

### A3. Naive precedes optimal whenever a contrast exists
If a problem admits a natural wasteful solution and a clever one, the student writes the
wasteful one first and *watches its waste in the tracer* before the clever one is
introduced.
- **Exception:** if the naive solution is so unnatural that inventing it teaches nothing
  (e.g., "check all 2ⁿ subsets" for a sum problem where iteration is obvious), skip the
  beat. The rule exists for insight, not ritual.
- **Test:** the Optimization stage's "aha" must name *exactly the work the Naive stage
  made visible*.

### A4. Mastery composes; it never introduces
Mastery stages combine previously taught moves. Zero new concepts.
- **Violation signature:** a Mastery lesson whose solution uses a technique not taught in
  stages 0–5 of its topic or an earlier topic.
- **Rationale:** mastery is the transfer demonstration, not new content.

### A5. Every problem exists for exactly one educational purpose
Each problem maps to one thinking-move. Two problems teaching the same move → cut one
(the one with the weaker interactive affordances loses).
- **Corollary:** the curriculum is finite and small by design. Deriva will ship with
  ~120–160 problems total, not 3,000. Density of insight per problem is the KPI.

### A6. Bridge problems are first-class
A problem whose *primary* purpose is connecting two topics (trie+backtracking on a grid;
Floyd's cycle detection inside a math problem) is explicitly labeled a **bridge** and is
placed at the *end* of the earlier topic or the *Reflex* of the later one.
- **Rationale:** transfer is the goal; bridges are where transfer is taught, not hoped for.

## B. Pedagogical Rules

### B1. The 9-stage question flow is never skipped
Understand → Play → Reason → Discover → Design → Implement → Execute → Reflect →
Generalize. Every problem, every time.
- **Flexibility clause:** stage *weight* varies. A Reflex lesson may spend 80% of its
  life in stages 1–3 and implement in three lines. A Mastery lesson compresses 1–5 to a
  recap and dwells in 6–7.
- **Escape hatch (respectful):** "Test me out" — a student may skip ahead by answering
  one mastery-level question (predict this trace / state this invariant). Failure routes
  them back without shame. Skipping must be *earned*, never clicked through.

### B2. Insights are discovered in interaction before stated in prose
No prose paragraph may assert a fact the student could have *felt* in the sandbox first.
- **Violation signature:** "Notice that the answer is always at the root…" appearing
  before the student has dragged nodes and seen it.
- **Order:** interaction → student's own words (constructed answer) → platform's crisp
  restatement → named pattern.

### B3. Hints are questions; statements are the last resort
Hint ladder per stuck point: (1) pump — re-ask the focusing question; (2) prompt —
narrow the search space; (3) leading question; (4) assertion with justification.
Levels 1–3 are questions. Level 4 is logged as a learning signal.

### B4. Complexity is always derived from the visualization, never asserted
The student counts work in the trace (nodes visited, states computed, branches pruned)
and the big-O falls out of the counting.
- **Violation signature:** "This is O(n log n)" appearing anywhere before the student has
  watched an execution and counted.

### A7. Slow conceptual scaffolding — repeat the thinking, not the problem
Every beat must explicitly reuse the prior beat's mental model. The student should
recognize the skeleton and only learn the delta.
- **Violation signature:** a problem where >10% of the cognitive work is new.
- **Requirement:** each beat lists its *repeated mental model* and its *one new idea*.
- **Requirement:** 3–5 problems per beat that vary only the payload/objective, not the skeleton.
- **Rationale:** fluency before complexity. Automaticity on the skeleton frees working
  memory for the new idea (cognitive load theory, 02 §3 + §5).

### A8. The 90% Rule
The student should think "I already know 90% of this problem" when entering any stage
≥2. If they don't, the prior stage failed to make the skeleton automatic.
- **Test:** can the student write the skeleton code from the prior beat without hints?
  If not, add more repetition problems to that beat before advancing.

### B6. Progressive disclosure within a beat
Return values, state variables, traversal order, pruning conditions — these are
*constructed* by the student from a small set of candidate options (and an "invent your
own" escape), never presented. Discovery with guardrails: the search space is pruned to
keep generation effortful but successful (cf. generation effect + cognitive load, 02 §3).

## C. Content Form Rules

### C1. Lessons are data, not prose
Every lesson is a typed, schema-validated module (see 05 §3). Prose lives inside it, but
the 9-stage flow, Socratic ladders, trace configs, and contracts are structured fields.
- **Rationale:** structure makes rules A1–B5 *checkable at build time*; prose makes them
  vibes.

### C2. Every stage names its pattern
Stages 8–9 must attach a **named, reusable pattern** ("Returning Tuples," "Elimination
Frontier," "Decision Tree Pruning") to the student's pattern journal. Names are
curriculum-global and consistent — the pattern library is the real course outline.

### C3. Each topic ends by opening a door
The final Mastery stage of a topic contains one moment of *deliberate foreshadowing*:
a problem that the current tools solve awkwardly, whose elegant solution is the next
topic's Reflex.
- **Example:** Trees ends with serialize/deserialize; Advanced Trees opens with paths as
  first-class strings. Linked Lists ends with cycle detection; Math later *reuses* it.

### C4. Surface features vary; deep structure repeats
Within a stage, examples and problems must vary in surface story (currency, schedules,
DNA, grids) while keeping the thinking-move constant — the standard recipe for transfer.

### C5. Real code, minimal syntax load
Python throughout (reads like the idea). Lessons may not use language cleverness
(comprehension golf, operator tricks) that adds extraneous load. Names are didactic
(`left_height`, not `lh`).

## D. The Pre-Ship Checklist (run per lesson)

1. The stage's single thinking-move is named in ≤8 words. *(A1)*
2. Its dependency chain inside the topic is listed and is a chain. *(A2)*
3. If a naive solution exists, it's taught first and its waste is visualized. *(A3)*
4. No technique appears that wasn't taught earlier. *(A4)*
5. The problem's one educational purpose is written in the lesson file. *(A5)*
6. All 9 stages exist; stage weights are declared. *(B1)*
7. Every asserted insight is preceded by an interaction that produces it. *(B2)*
8. Hint ladders are ≥3 question-levels deep before any assertion. *(B3)*
9. Complexity is derived by counting in the trace. *(B4)*
10. Discover-stage answers are student-constructed from constrained options. *(B5)*
11. A named pattern is attached for the journal. *(C2)*
12. The Inevitability Test passes (02 §4): does the prior material make this lesson feel
    necessary? Does this lesson make the next feel necessary?

## E. Governance

- Rules are enforced by (a) the lesson schema at build time where mechanically checkable
  (C1, B1-completeness, A5's purpose field), and (b) the checklist in review for the rest.
- Changing a rule requires editing this document and re-running the checklist against the
  *entire existing curriculum*. Rules are cheap to follow and expensive to change — by
  design.
