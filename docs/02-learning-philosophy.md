# 02 — Learning Philosophy

**Teach Concepts → Reasoning → Patterns → Implementation. Never start from code.
Never reveal algorithms. The student derives the solution.**

This document explains *why* the method works, reverse-engineers the existing Trees
curriculum, and defines the tests every piece of content must pass.

---

## 1. The Core Claim

Algorithms are **compressible knowledge**. Merge sort is not 40 lines to memorize; it is
one observation ("two sorted halves merge in linear time") plus one divide step. A student
who stores the observation can regenerate the algorithm on demand, adapt it to variants,
and recognize when it applies. A student who stores the 40 lines can do none of that.

Deriva therefore treats every algorithm as the *answer to a question the student has been
led to ask*. The curriculum's job is to make the question arise naturally. When it does,
the algorithm feels **inevitable** — and inevitability is the feeling we optimize for.

## 2. Reverse-Engineering the Trees Curriculum

The reference implementation:

> **0 Recursion Reflex · 1 Tree Traversal · 2 Measurement Pattern · 3 Returning Tuples ·
> 4 Naive Thinking · 5 Optimization · 6 Mastery**

Why does this work? Decompose it:

| Stage | Hidden design move | The thinking-skill it isolates |
|---|---|---|
| **0 Recursion Reflex** | **Prerequisite isolation.** The real barrier to tree algorithms is not trees — it's distrust of recursion. So recursion is trained *before* trees, on problems small enough that the recursive leap of faith is cheap. | "Define what the function returns; trust it works on the subproblem." |
| **1 Tree Traversal** | **Mechanic before meaning.** Traversal is the *verb* of trees. Every future algorithm is revealed to be traversal + payload. | "DFS/BFS are the skeleton; everything else hangs on them." |
| **2 Measurement Pattern** | **First payload.** Height/size/depth: a single scalar flowing *upward* through recursion. Minimal conceptual weight, maximal structural insight. | "Information flows from children to parent via return values." |
| **3 Returning Tuples** | **The representational leap — taught on a small problem before it's needed.** One value is sometimes not enough; return several. This is taught *before* its killer application so it becomes a tool the student already owns. | "You design the return type. It can carry anything." |
| **4 Naive Thinking** | **Deliberate pain.** Diameter by recomputing height at every node: correct, natural, O(n²). The student *feels* the redundant work because the platform shows them the repeated subtree computations. | "Where exactly is the waste?" |
| **5 Optimization** | **Contrast resolution.** The redundant recomputation is *exactly* what tuples eliminate. Stage 3's tool, applied to Stage 4's pain → one-pass diameter. The optimization is *discovered*, and it retroactively justifies Stage 3. | "Cache what you recompute — in the return value." |
| **6 Mastery** | **Composition, not novelty.** LCA-with-tuples, max-path-sum: problems that combine traversal + measurement + tuples. Zero new concepts — proof that the student now owns a *design space*. | "New tree problems are parameter choices in a space I know." |

### The extracted grammar

Generalizing, every topic spine follows the same seven-beat arc:

```
0 REFLEX        Isolate the meta-skill the topic secretly depends on.
1 MECHANIC      The "verb": traversal, pointer movement, relaxation, choice.
2 PAYLOAD       The simplest useful information carried by the mechanic.
3 LEAP          The representational insight that defines the topic
                (tuples, fast/slow pointers, monotonic stack, state index...).
4 NAIVE         The natural, wasteful solution — taught on purpose.
5 OPTIMIZATION  Resolve the pain using the Leap. The "aha" stage.
6 MASTERY       Compose 1–5. No new concepts. Transfer across surface features.
```

Beats can repeat or split (DP needs two Naive/Optimization cycles), but the ordering
logic never changes: **reflex before mechanic, mechanic before leap, pain before cure,
composition last.**

### Why this beats Easy/Medium/Hard

Difficulty tiers sort problems by *how likely you are to fail* — information useless for
teaching. The spine sorts by **conceptual dependency**: each stage is unreachable without
the previous one's mental model. A "hard" problem in stage 6 is easy *if you own stages
0–5* — which is precisely the lesson we want encoded in the student's bones.

## 5. Slow Conceptual Scaffolding (progressive reinforcement)

> *Repeat the THINKING, not the problem.*

A defining characteristic of Deriva: students never learn a concept once and move on.
Every important mental model is encountered **multiple times in increasingly challenging
contexts**. Each repetition adds **exactly one new idea**. The student thinks:
*"I've seen this before — now I'm using it in a deeper way."*

### The Trees example (reference implementation)

| Beat | Problems | What repeats | What's new |
|---|---|---|---|
| Recursion Reflex | Sum 1→N, Factorial, Power, Reverse String | Recursion skeleton | Nothing — pure fluency |
| Tree Traversal | Count Nodes, Sum Values, Max Value, Search, Count Leaves | DFS traversal (identical) | Only the objective changes |
| Measurement Pattern | Height, Min Depth, Path Sum, Node Level | DFS (again) | Returning a scalar up the recursion |
| Returning Tuples | Height+Count, Min+Max, Sum+Count, Diameter+Height, Balanced+Height | DFS + returning values (familiar) | Returning *multiple* values |
| Naive | Diameter via recompute | DFS + tuples | Intentionally wasteful — feel the pain |
| Optimization | One-pass diameter | DFS + tuples | Tuples absorb the waste |

The recursion pattern becomes **automatic** before it's ever combined with trees.
The traversal pattern becomes automatic before measurement is introduced.
Measurement becomes automatic before tuples are introduced.
The student is never solving a problem where >10% is new.

### The general rule (applies to all 14 topics)

1. **Isolate the thinking-move first** — give it 3–5 problems where *only that move* varies.
2. **Reuse the move in the next beat** — the traversal doesn't change when measurement is added; the traversal doesn't change when tuples are added.
3. **Each repetition adds exactly one new idea** — if a problem introduces two new moves, split it.
4. **The student should think "I already know 90% of this"** — that 90% is the point. The remaining 10% is the only thing being taught.
5. **Never repeat a problem. Repeat the THINKING.**

### Contrast with LeetCode / NeetCode

LeetCode maximizes *problem count*. Deriva maximizes *repetition of mental models*.
LeetCode gives you 5 tree problems that each use different traversals. Deriva gives you
5 tree problems that use the *same* traversal with different payloads — so the traversal
becomes automatic and the payload is the only thing you think about.

### How this changes curriculum authoring

When designing a topic spine, the author must explicitly list:
- The **repeated mental model** for each beat
- The **one new idea** added by that beat
- The **3–5 problems** that isolate that one idea with a familiar skeleton

This is now Rule A7 in 03.

## 6. What "Understanding" Means Operationally

Every design rule in this platform traces to an established effect. We cite these not as
decoration but as **accountability**: if a design choice contradicts the evidence, the
choice loses.

| Principle | Source | How Deriva operationalizes it |
|---|---|---|
| **Generation effect** — self-generated answers are remembered far better than read ones | Slamecka & Graf (1978) | Stages 3–5 make the student *construct* return values, state, and traversal before any code exists. The editor is locked until generation has happened. |
| **Contrasting cases** — comparing naive vs. optimal reveals the deep structure that single examples hide | Schwartz & Bransford (1999) | The Naive → Optimization beat is mandatory whenever contrast exists. Stage 8 forces the comparison explicitly. |
| **Desirable difficulty** — effortful retrieval beats fluency | Bjork (1994) | Hints are questions, not statements; solutions hidden by default; "test me out" escapes require demonstrating mastery. |
| **Cognitive load theory** — novices drown when intrinsic + extraneous load combine | Sweller (1988) | One thinking-move per stage. Syntax load is deferred to Stage 6 (after the idea exists). Visualizations carry the extraneous load that prose would dump on working memory. |
| **Socratic tutoring / scaffolding** — guided questions outperform direct instruction for transfer | Graesser et al. (AutoTutor studies) | Stage 3's question ladder ("What does this node know? Can one value solve it? Can two?") mirrors expert tutoring moves: pump → prompt → hint → only then, assertion. |
| **Worked-example effect, inverted** — novices learn from examples, but *generating* the example is stronger once basics exist | Renkl & Atkinson | Stages 1–2 are interactive worked examples; Stages 4–6 convert them into student-generated solutions. |
| **Transfer-appropriate processing** — skill shows up where it was encoded | Morris et al. (1977) | Stage 9 deliberately re-presents the pattern under alien surface features (Floyd's cycle detection reappearing inside a "Math" problem). |
| **Spaced retrieval** | Cepeda et al. (2006) | Pattern journal + revisit scheduling (v1); v0 journals patterns so revisits have something to attach to. |

### The two things we refuse to do — and why

1. **We never show the algorithm before the student designs one.**
   Premature explanation converts a generation task into a recognition task, and the
   generation effect is the entire product.
2. **We never use difficulty as an organizing axis.**
   Difficulty is a property of the *gap between the student and the problem*. The spine
   minimizes that gap one thinking-move at a time; "Easy/Medium/Hard" merely measures it.

## 4. The Inevitability Test (the master quality bar)

Before any lesson ships, answer:

> *A student who has completed everything before this lesson — do they feel the next idea
> is **necessary** before we show it to them?*

Three failure modes the test catches:

- **Orphan lesson** — the lesson doesn't depend on prior ideas and nothing later depends
  on it. Cut it or bridge it.
- **Leap lesson** — it requires an idea never installed. Add a Reflex stage or resequence.
- **Flat lesson** — the student can complete it by pattern-matching the previous lesson's
  surface. It teaches no new thinking-move. Cut it (rule: every problem exists for
  exactly one educational purpose).

## 5. What "Understanding" Means Operationally

We can't measure enlightenment, but we can require *behaviors that only understanding
produces*. A student understands a pattern when they can, without hints:

1. **Predict** the trace of the algorithm on a novel input (Stage 1/7 skill).
2. **State the invariant** it maintains (Stage 5 skill).
3. **Derive the complexity** from the visualization, not from memory (Stage 8 skill).
4. **Recognize the pattern** under new surface features (Stage 9 skill).
5. **Explain why the naive version fails** — the single strongest transfer signal (Stage 8).

These five behaviors are the platform's definition of done per pattern. Every lesson
instruments at least three of them.
