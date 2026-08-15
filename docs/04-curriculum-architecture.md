# 04 — Curriculum Architecture

This is the flagship document. It defines the **spine grammar** (the reusable seven-beat
arc every topic follows), the **global narrative** (how 14 topics tell one story), and the
**stage-by-stage design of every topic** — each stage named by its single thinking-move
(Rule A1), each problem existing for exactly one purpose (Rule A5).

Problems are described by *educational purpose and archetype*, never as a curated list of
interview questions. Canonical problems are named only as anchors where they are the
cleanest known vehicle for a move.

---

## 1. The Spine Grammar

```
Beat 0  REFLEX        The meta-skill the topic secretly depends on, isolated and trained.
Beat 1  MECHANIC      The topic's "verb": how you move through / manipulate the structure.
Beat 2  PAYLOAD       The simplest useful information the mechanic can carry.
Beat 3  LEAP          The representational insight that defines the topic.
Beat 4  NAIVE         The natural wasteful solution — taught on purpose, waste visualized.
Beat 5  OPTIMIZATION  The Leap resolves the Naive pain. The "aha."
Beat 6  MASTERY       Composition of beats 0–5. No new concepts. Transfer.
```

Rules: A2 (order), A3 (naive-first), A4 (mastery composes) from 03 apply to every spine.
Topics may repeat beats 4–5 (DP does, deliberately) or merge beats (Trie merges 2–3).

## 2. The Global Narrative (curriculum as story)

The topics are sequenced so that each one's final Mastery moment opens the next one's
Reflex (Rule C3). Dependency edges that matter:

```
TREES ──────────────┬──► ADVANCED TREES (tuples bloom into open/closed paths)
   │                └──► BACKTRACKING (recursion reflex → decision trees)
   │                └──► DP (tree recursion with overlap → memoization)
   └──► BST (traversal + the ordering invariant)
            └──► TRIE (invariant per character; tree of strings)
LINKED LISTS ───────┬──► MATH (Floyd's cycle detection returns in disguise)
                    └──► INTERVALS? no — via Greedy (order thinking)
HEAP ───────────────┬──► ADVANCED GRAPHS (Dijkstra = BFS + heap)
                    └──► GREEDY (greedy choice often needs a heap to execute)
BACKTRACKING ───────┬──► DP (decision tree with overlap = memoization)
                    └──► GRAPHS (DFS on implicit graphs)
GRAPHS ─────────────┬──► ADVANCED GRAPHS (weights break BFS)
                    └──► DP (state-space as DAG; longest path = DP)
GREEDY ◄─────────────── INTERVALS (the purest greedy playground)
BIT MANIPULATION ─────► MATH (numbers as structure; both close earlier loops)
```

**Ordering for study:** Trees → Linked Lists → BST → Trie → Heap → Advanced Trees →
Backtracking → Graphs → DP → Greedy → Intervals → Advanced Graphs → Bit Manipulation →
Math. (DP after Graphs: memoized DAG-traversal is the deepest entry point into DP.
Advanced Graphs after Dijkstra-prerequisites are installed by Heap + Greedy.)

**Recurring characters** (patterns deliberately taught once, then *cast again* in new
topics — Stage 9's transfer engine):

| Pattern | Born in | Reappears in |
|---|---|---|
| Returning Tuples | Trees 3 | Advanced Trees 6, DP state design |
| Fast/Slow Pointers | Linked Lists 3 | Math (happy-number cycle), Arrays-as-functions |
| Elimination (binary search) | BST 0 | Math (sqrt), Advanced Graphs (binary-search the answer) |
| Prefix-on-Path | Advanced Trees 5 | DP (subarray sums), Intervals |
| Decision Tree + Pruning | Backtracking 2–3 | DP (overlap revelation), Graphs (implicit search) |
| Frontier Relaxation | Graphs (BFS layers) | Advanced Graphs (Dijkstra), Greedy |
| Visited/Canonical Form | Graphs 0 | Backtracking (used-set), DP (memo keys) |

## 3. Topic Spines

Each stage: **name — thinking-move (≤8 words) — purpose & vehicle.**

---

### TOPIC 0 · TREES *(reference implementation — exists)*

**Repeated mental model across beats:** DFS traversal (preorder skeleton: `if not root: return; visit(root); dfs(root.left); dfs(root.right)`)
**One new idea per beat:** progressively added to the skeleton.

0. **Recursion Reflex** — *trust the subproblem.* **Repeats:** none (this IS the first exposure). **New:** recursion skeleton on non-tree problems (sum 1→N, factorial, power, reverse string). Fluency target: student writes the skeleton without thinking.
1. **Tree Traversal** — *the skeleton walk.* **Repeats:** recursion skeleton (now trusted). **New:** tree structure (root/left/right). Problems: count nodes, sum values, max value, search, count leaves — **all use identical DFS, only the objective changes**. Traversal becomes automatic.
2. **Measurement Pattern** — *scalars flow upward.* **Repeats:** DFS traversal (automatic). **New:** returning a single value up the recursion. Problems: height, min depth, path sum, node level — **identical DFS, return changes**.
3. **Returning Tuples** — *the return type is yours to design.* **Repeats:** DFS + returning values (automatic). **New:** returning multiple values. Problems: height+count, min+max, sum+count, diameter+height, balanced+height — **identical DFS, return type expands**.
4. **Naive Thinking** — *feel the recomputation.* **Repeats:** DFS + tuples (automatic). **New:** intentionally wasteful approach. Diameter by height-at-every-node — the tracer shows repeated subtrees.
5. **Optimization** — *tuples absorb the waste.* **Repeats:** DFS + tuples (automatic). **New:** one-pass resolution. The optimization is discovered, not given.
6. **Mastery** — *compose.* **Repeats:** DFS + tuples + naive/opt (all automatic). **New:** combining ideas. LCA with tuples; max path sum preview.

---

### TOPIC 1 · LINKED LISTS

0. **Pointer Reflex** — *a reference is an arrow, not a copy.* Boxes-and-arrows sandbox:
   assignment moves arrows; mutation follows them. Students predict `a.next = b` effects
   before running. The meta-skill: distinguishing *repointing* from *copying*.
1. **The Runner** — *the while-loop walk.* Traversal, search, length. Mechanic beat:
   `cur = cur.next` as the single primitive of list life.
2. **Pointer Surgery** — *relinking is the whole game.* In-place reversal taught as the
   canonical surgery (three pointers: prev/cur/next — the student invents the *third*
   pointer by watching one pointer lose the rest of the list). Dummy/sentinel nodes
   discovered as the cure for "why is the head always a special case?"
3. **Fast & Slow (the Leap)** — *relative motion encodes position.* Middle of list:
   the student is asked "how can one pass find the middle?" and invents 2× speed.
   Cycle detection: why does a loop guarantee the runners meet? (The treadmill argument,
   felt in the sandbox.)
4. **Naive** — *extra memory as a crutch.* Cycle detection with a hash set; palindrome
   check with a stack. Works, but the memory column in the tracer grows with n.
5. **Optimization** — *O(1) space via structure.* Floyd's proof-by-animation; palindrome
   via reverse-second-half (composes beat 2 + 3 — deliberate).
6. **Mastery** — *compose.* Reverse k-group (surgery + runners + dummy, recursive
   framing from Trees 0 reused); merge two sorted lists with dummy; reorder list.
   **Door-opener:** "where else do hidden cycles live?" → Math's happy numbers.

---

### TOPIC 2 · BINARY SEARCH TREES

0. **The Elimination Reflex** — *each comparison deletes half the world.* Binary search
   on a sorted array, taught as *information destruction*: the student watches the
   candidate space halve per step. (Binary search has no home in the topic list; it
   lives here as the reflex BSTs are built from. Also trains "define the search space,
   shrink the search space" — the pattern reused in Math and Advanced Graphs.)
1. **The Ordering Invariant** — *structure that remembers comparisons.* Insert/search by
   following the invariant; the student discovers *where new values must land*.
2. **Validation & the Range Idea (the Leap)** — *information flows DOWNWARD.* The classic
   trap (checking each node against its children only) is sprung on purpose: the student
   builds the wrong validator, watches it pass a bad tree, then invents *passing legal
   ranges down the recursion*. Contrast with Trees 2 (tuples flow up) — same channel,
   opposite direction. This is the deepest single lesson in the topic.
3. **Inorder = Sorted (Payload)** — *the traversal the invariant buys you.* The student
   discovers that inorder on a BST emits sorted order, and that this is a *theorem about
   the invariant*, not a coincidence.
4. **Naive** — *dump to array.* Kth-smallest / range queries via full inorder into a
   list. Works; wastes time and space when k is small.
5. **Optimization** — *walk with early exit.* Inorder as a live iterator, stop at k;
   deletion derived case-by-case (the successor idea *earned* via inorder thinking, not
   memorized as three cases).
6. **Mastery** — *compose.* LCA in BST using ordering (contrast with the Trees-topic LCA
   — same problem, cheaper tool, why?); recover-the-swapped-nodes (inorder + anomaly
   detection). **Door-opener:** "what if the ordering key is *per-character*?" → Trie.

---

### TOPIC 3 · TRIE

0. **The Compression Reflex** — *shared beginnings stored once.* Given a word list, the
   student's task: "store this so prefixes are never repeated." Sorted arrays, hashing —
   each shown to fail a specific query (prefix scan, autocomplete). The trie is *invented*
   in the sandbox by drawing the shared structure.
1. **Node = Map + Flag (the Leap)** — *edges are letters; endpoints are marked.* Two
   insights, staged: children-as-map (why not array of 26? — sparsity), then the terminal
   flag (a node can be pass-through AND endpoint — "app" inside "apple").
2. **Insert & Search (Mechanic)** — *walk down, build as you go.* Straightforward once
   the structure exists — deliberately quick: the topic's weight is in beats 0–1.
3. **The Payload** — *nodes carry counts.* Prefix counting, autocomplete top-suggestions.
   The student discovers that a walk to the prefix node + subtree aggregation answers
   whole families of queries.
4. **Naive** — *scan everything.* "All words with prefix p" by filtering the list;
   wildcard match by regex over the list.
5. **Optimization** — *descend once, prune the rest.* Prefix queries in O(p + results);
   wildcard search as DFS over children with branching only on '.'. The decision-tree
   visualization here quietly pre-teaches Backtracking.
6. **Mastery (bridges)** — *compose across topics.* Word Search II on a grid
   (**bridge to Backtracking**: trie prunes a grid-DFS — the single best bridge problem
   in the curriculum); maximum XOR pair via binary trie (**bridge to Bit Manipulation**:
   numbers as 32-character strings over {0,1}).

---

### TOPIC 4 · HEAP

0. **The Repeated-Extreme Reflex** — *when you only ever need the max, sorting is
   overkill.* A simulation: a task queue that repeatedly asks "most urgent?" The student
   tries array-scan (O(n) per ask) and sorted-array (O(n) per insert) and feels both
   hurt. Need established before structure.
1. **Two Invariants, One Structure (the Leap)** — *shape + local order ⇒ global answer.*
   Complete tree in an array (the index arithmetic: parent = (i-1)//2 — discovered by
   numbering a drawn tree level by level). Heap property is *only local* (parent ≥ kids),
   yet the max is always at the root — the student proves it to themselves by trying to
   hide the max elsewhere.
2. **Bubble Up / Bubble Down (Mechanic)** — *restore the invariant locally.* Insert and
   pop as the two surgeries. Log depth felt by dragging values and counting swaps.
3. **Heapify** — *bottom-up beats n inserts.* Naive beat embedded here: building via n
   inserts is O(n log n); the student then discovers that heapifying from the leaves up
   is O(n) — and derives *why* by counting: most nodes are near the bottom with tiny
   fall distances. One of the three great complexity surprises in the curriculum.
4. **Naive** — *sort to find the kth.* Kth-largest by sorting; top-k by full sort.
5. **Optimization** — *the size-k inversion.* Keep a heap of exactly k: the heap holds
   the *candidates*, not the data. Then the two-heaps median (streaming): the student
   invents "two halves, two extremes, balance them" — a genuinely hard idea made
   reachable by beat 1's invariant framing.
6. **Mastery** — *compose.* Merge k sorted lists (heap of iterators); top-k frequent
   (counting + heap); task-scheduler-style greedy (**bridge to Greedy**: the heap is
   where greedy choices are *executed*). **Door-opener:** "a queue that always hands you
   the cheapest frontier" → Dijkstra in Advanced Graphs.

---

### TOPIC 5 · ADVANCED TREES

0. **Path Reflex** — *root-to-node paths are objects.* Paths as lists you can hold,
   compare, extend. All-paths enumeration (backtracking preview in tree clothing).
1. **Ancestors & Distance** — *depth equalization.* General LCA derived via depths
   (walk the deeper one up), then parent-pointer LCA — linked-list thinking transplanted
   into trees (explicit callback).
2. **Serialization** — *a tree as a string, reversibly.* Design space explored: why
   preorder alone fails, why nulls or delimiters fix it. Information-preservation as a
   design criterion — the student *designs an encoding*, an engineering thinking-move
   rare in DSA courses.
3. **Views & Boundaries** — *the tree from the side.* Vertical/top views: nodes indexed
   by (column, row); BFS + coordinate maps. Composes Graphs' layering before Graphs
   formally arrives (light bridge).
4. **Naive** — *enumerate every path.* Path-sum III style: all root-to-node paths,
   check each. O(n²) felt in the tracer.
5. **Optimization (the Leap)** — *prefix sums ON A PATH.* The hashmap-of-path-sums trick:
   the student already owns prefix sums (arrays) and paths (beat 0); the discovery is
   that a *root path behaves like an array* if you add and remove as you descend/ascend.
   Backtracking's choose-unchoose appears here in embryonic form — by design.
6. **Mastery** — *the tuples bloom.* Max path sum: the student must invent the
   *open path vs closed path* distinction (a path through a node can return upward as
   one branch, but its answer uses both) — Returning Tuples (Trees 3) generalizes to
   "return the usable part, aggregate the answer globally." Curriculum-closing callback:
   the Trees topic's seed flowers here.

---

### TOPIC 6 · BACKTRACKING

0. **The Enumeration Reflex** — *ALL, not best.* Counting vs optimizing mindset: list
   every subset of {1,2,3} by hand. The student notices they're already doing
   include/exclude per element — the decision structure is *theirs* before we name it.
1. **The Decision Tree (Mechanic)** — *each level is one choice.* Subsets visualized as
   a binary tree of include/exclude decisions. Paths from root to leaf = solutions.
   (Trees 1 traversal, transplanted: "we're DFS-ing a tree that doesn't exist yet.")
2. **Choose–Explore–Unchoose (the Leap)** — *build, recurse, restore.* Why undo?
   The student first copies the path at every call (works, wasteful — naive beat embedded
   in the mechanic), then discovers mutation + restoration. State restoration is THE
   insight of backtracking; the tracer makes the shared mutable path visible.
3. **Pruning** — *kill branches you can prove hopeless.* Constraint checking *before*
   recursing. The visualization grays out murdered subtrees; the student counts survivors
   vs the full 2ⁿ — complexity as counted work (Rule B4).
4. **Naive** — *generate then filter.* Permutations with duplicates: generate all n!,
   dedupe with a set. Pain: the tree is huge and full of twins.
5. **Optimization** — *prune during construction.* Sort + skip-duplicates-at-same-level
   (the student discovers *why sorting groups the twins* and why skipping works only at
   the same depth); early constraint checks (sum already exceeded).
6. **Mastery** — *constraint systems.* N-Queens (constraint sets per column/diagonal —
   the diagonal indexing insight row±col is *derived* by labeling a drawn board); word
   search on grid (composes Trie bridge); combination sum with reuse. **Door-opener:**
   "some decision trees revisit the SAME subproblem at different nodes — what if the tree
   is secretly a graph?" → DP and Graphs both claim this thread.

---

### TOPIC 7 · GRAPHS

0. **The Arbitrary-Structure Reflex** — *no root, no parent, possible cycles.* Contrast
   with trees explicitly: what's missing? The student tries tree-DFS on a cyclic graph
   and *loops forever in the sandbox* — the **visited set is born from a crash**, which
   is why students who learn it this way never forget it.
1. **Representation** — *design from the operations.* Adjacency list vs matrix derived
   from "what do we ask?" (neighbors-of vs are-connected). Grids as secret graphs.
2. **The Two Walks (Mechanic)** — *DFS dives, BFS spreads.* Same code, one line of
   difference (stack vs queue) — the student discovers this by implementing both from one
   skeleton. BFS layers discovered as *distance in unweighted graphs*: the first time a
   node is reached, it's reached by a shortest path — proven by the layer argument, felt
   by animation.
3. **Components & Implicit Graphs (Payload)** — *count the islands.* Flood fill; the
   insight that "problems without given graphs" (grids, word ladders' state space) are
   graph problems in disguise.
4. **Naive** — *recompute reachability.* "Is b reachable from a?" answered fresh for
   every pair; count-provinces by repeated full DFS.
5. **Optimization** — *one walk, many answers.* Component labeling in one pass;
   cycle detection via visited-state tri-color (white/gray/black — the student invents
   the third color by hitting "visited but I'm still inside it"); **topological sort**
   discovered two ways: Kahn's (indegree-0 sources: "which task has no prerequisites?
   do it and delete it" — elimination reflex returning) and DFS post-order reversal
   ( Trees' post-order, transplanted — the callback is explicit).
6. **Mastery** — *compose.* Clone graph (visited = old→new map); course schedule II
   (topo + cycle); word ladder (BFS on implicit graph — string mutations as edges).
   **Door-opener:** "BFS finds shortest paths… until edges have costs." → Advanced Graphs.

---

### TOPIC 8 · DYNAMIC PROGRAMMING

The heaviest topic: beats 4–5 repeat. The spine is re-tuned because DP's real barrier
is *state design*, not any single problem.

0. **The Overlap Reflex** — *the same question, asked twice.* Naive recursive fibonacci
   in the tracer: the call tree blooms, duplicate subtrees light up in the same color,
   the counter spins. The student *counts* how many times fib(3) is recomputed. Pain
   before any cure. (Trees 0 recursion + Backtracking 6's door-opener pay off here.)
1. **Memoization (Mechanic)** — *the function keeps a journal.* Cache on the naive
   recursion — minimal change, exponential rescue. The student discovers that the cache
   key is exactly the argument tuple: *the state is whatever the answer depends on*.
2. **The State Idea (the Leap)** — *what uniquely determines the answer from here?*
   Trained as a standalone skill on three micro-problems: the student designs states for
   climbing stairs, house robber, and min-cost path BEFORE writing any recurrence.
   The Socratic ladder: "You're standing at step i. You have amnesia. What's the minimum
   you must remember?" State design is THE move; everything else is mechanics.
3. **Tabulation** — *flip the direction.* Bottom-up tables: base cases as seeds,
   dependency arrows drawn on the table, fill order derived from the arrows (not given).
   The student sees memo recursion and table iteration are *the same DAG traversed two
   ways* — Graphs 5's topological order returns as "the order you fill a DP table."
4. **Naive I (sequences)** — *try both: take or skip.* House robber / LIS / decode-ways
   via raw recursion (decision trees from Backtracking, transplanted).
5. **Optimization I** — *the "ending at i" trick.* LIS: the student discovers the answer
   isn't dp(i) = "best in prefix" but "best ENDING at i" — a representational refinement
   that makes the recurrence computable. This single insight is worth the whole stage.
6. **Naive II (two sequences & grids)** — *align or advance?* Edit distance / LCS via
   recursion on two indices; unique paths with obstacles via recursion on (i,j).
7. **Optimization II** — *the table is the product of the two strings.* Grid filling;
   space compression (row rolling) derived by watching which table cells the recurrence
   actually reads.
8. **Mastery** — *state machines and bounded choices.* 0/1 knapsack (why 0/1 forces the
   item index into the state — the amnesia test again); best-time-to-buy-sell with
   cooldown (the student draws a 3-state machine: holding / can-buy / cooldown — DP as
   automaton, a genuinely different mental model, still beat-2's state idea);
   partition-equal-subset. **Door-opener:** "some problems let you commit irrevocably —
   no table needed." → Greedy.

---

### TOPIC 9 · GREEDY

0. **The Local-Choice Reflex** — *when is the best now-choice never regretted?*
   Coin change with canonical coins (works!) then a counterfeit system {1,3,4} targeting
   6 (greedy takes 4 → fails). The counterexample is the teacher: greedy is a *property
   to be verified*, not a default.
1. **Sorting as the Enabler (Mechanic)** — *greedy is a choice of ORDER.* Most greedy
   moves are "process in a clever order"; the cleverness is the sort key. Activity
   selection: the student tries earliest-start (fails on a trap instance they build),
   most-compatible, shortest — then earliest-finish. They *discover the key* by killing
   the alternatives.
2. **The Proof Habit (the Leap)** — *exchange arguments, lightly.* "Take any optimal
   solution; swap its first choice for the greedy one; it's no worse; repeat." Taught as
   a reusable two-step (exchange → induction) with visual aid, not formalism. Goal: the
   *reflex to ask* "why is this safe?", not proof-writing skill.
3. **Frontier Patterns (Payload)** — *the reachable set.* Jump game: not "simulate
   jumps" but "maintain the furthest reachable index" — the frontier abstraction. Gas
   station: the tank as a running balance; when it goes negative, the start can't be in
   the traversed segment — the elimination reflex again.
4. **Naive** — *DP where DP is overkill.* Jump game II by DP (they own DP now — let them
   spend it); activity selection by subset DP. Correct, O(n²), and *unnecessary*.
5. **Optimization** — *greedy replaces DP when commitment is safe.* Same problems solved
   in O(n log n)/O(n). Stage 8 forces the explicit comparison: what property killed the
   need to reconsider? (Answer: optimal substructure with a greedy-choice proof.)
6. **Mastery** — *two-step insights.* Task scheduler (greedy + heap — Heap 6 callback);
   partition labels (last-occurrence frontier); minimum arrows (intervals preview).
   **Door-opener:** "the purest greedy playground is intervals" → Intervals.

---

### TOPIC 10 · INTERVALS

*Deliberately late in the curriculum: it's a small topic whose every move is borrowed —
sorting (Greedy 1), elimination, sweep (a new mechanic), and it consolidates rather than
introduces. It is the curriculum's first 'short story'.*

0. **The Overlap Reflex** — *when do two intervals interfere?* The 6 possible orderings
   drawn, then collapsed to one test (a.start ≤ b.end AND b.start ≤ a.end). The
   simplification from 6 cases to 1 predicate is the reflex: *interval chaos is
   tamable*.
1. **Sort by Start (Mechanic)** — *the universal first move.* Once sorted, "any overlap
   at all?" collapses to checking ADJACENT pairs only — the student discovers why
   transitivity of non-overlap makes far pairs redundant.
2. **Merge (Payload)** — *absorb or emit.* Merge-intervals as a single scan with a
   running interval. The running-interval variable is a one-element state machine.
3. **Insert & Gaps** — *three zones.* Insert-interval: before / overlapping / after.
   The student derives the three-zone split by drawing, then sees merge (beat 2) is the
   same scan with a pre-wounded list.
4. **Naive** — *check every pair.* Meeting rooms II (min rooms) by pairwise overlap
   counting; interval intersection by nested loops.
5. **Optimization (the Leap)** — *the sweep line.* Split intervals into start/end events;
   a vertical line sweeps; active-count peaks = answer. Two implementations discovered:
   sorted events + counter, and heap-of-end-times. Sweep line is the one truly new
   mechanic and it's visual by nature — the platform's strongest affordance.
6. **Mastery** — *compose & close the loop.* Non-overlapping intervals = activity
   selection (Greedy 1 returns — the student should shout "I've seen this!"); employee
   free time (merge + gaps). **Door-opener:** "sweeping is ordering events in time —
   what else is secretly an ordering problem?" → already answered: everything since
   Greedy. The short story ends by reinforcing the main plot.

---

### TOPIC 11 · ADVANCED GRAPHS

0. **The Weighted Reflex** — *BFS layers break when edges have costs.* The student runs
   BFS on a weighted graph, watches it return a "shortest" path that's not cheapest, and
   must articulate *why the layer argument died* (arrival order ≠ cost order).
1. **The Greedy Frontier (the Leap)** — *always extend the cheapest unsettled node.*
   Dijkstra derived as BFS + heap (Heap 6's door-opener pays off). The settled set's
   safety proven via the exchange habit (Greedy 2): "could a later path beat the settled
   one? No — it would have to leave the frontier through something more expensive."
2. **Union-Find** — *connectivity as a changing question.* Born naive: components via
   labels and full relabeling (O(n) per union — felt in the tracer). Then representative
   trees (find = walk to root), then the two compressions: **path compression** invented
   by watching a tall skinny tree get walked repeatedly; **union by rank** by asking
   "which root should adopt which?" The amortized O(α(n)) is stated as "effectively
   constant" with the counting shown, not the proof — rigor budget spent where it teaches.
3. **Spanning Trees (Payload)** — *cheapest skeleton.* Kruskal = sort edges + union-find:
   the student discovers that adding cheapest non-cycle edges is safe via the cut property
   (exchange habit again). Prim mentioned as "Dijkstra's twin" — same frontier, different
   key — a deliberate exercise in seeing two algorithms as one idea.
4. **Naive** — *enumerate all paths.* Cheapest path by DFS over all simple paths:
   exponential, tracer caps the explosion visibly.
5. **Optimization II** — *relaxation repeated.* Bellman-Ford for negative edges: the
   n−1 rounds derived ("a shortest path uses ≤ n−1 edges; round k settles paths of ≤ k
   edges"); negative-cycle detection as "one more round that still changes something."
   Dijkstra's failure on negatives shown, not just asserted.
6. **Mastery** — *compose.* Network delay time (Dijkstra direct); swim in rising water
   (**binary search + BFS hybrid** — the Elimination reflex from BST 0 returns at the
   curriculum's far edge; students who see this connection own the curriculum);
   cheapest-with-k-stops (state-augmented graph: node = (city, stops) — DP's state idea
   inside a graph, the two deepest topics shaking hands).

---

### TOPIC 12 · BIT MANIPULATION

0. **The Binary Reflex** — *numbers are arrays of bits.* Truth tables as physics:
   AND masks, OR sets, XOR… the student plays with bit pairs until XOR's personality
   emerges (difference detector, parity accumulator).
1. **The Toolkit (Mechanic)** — *masks as stencils.* Get/set/clear/toggle bit i built up
   as compositions of shifts and masks. x & (x−1) discovered by experimenting: "what
   does subtracting 1 do to the bit pattern?" → it flips the lowest set bit and
   everything below → AND erases exactly one set bit. Kernighan's popcount falls out.
2. **XOR Algebra (the Leap)** — *parity as cancellation.* x^x=0, x^0=x, commutativity:
   XOR as a machine that cancels pairs. Single Number: the student is told only "every
   element appears twice except one; find it in O(1) space" and is pushed to invent
   fold-with-XOR by playing with small cases in the sandbox.
3. **Naive** — *loop 32 times per number.* Counting bits per number; reversing bits by
   string conversion. Works; the tracer shows the bit-loop tax.
4. **Optimization** — *DP on bits.* Counting-bits-for-a-range via "popcount(x) =
   popcount(x >> 1) + (x & 1)" — a tiny DP (bridge BACK to DP: the pattern recognized
   under alien surface features, Rule C4/Stage 9 in action).
5. **Bitmask Enumeration** — *subsets as integers.* A 3-element set's 8 subsets = 0..7:
   the student discovers bits as membership flags, then enumerates subsets by counting.
   **Bridge to Backtracking:** the decision tree, executed by a for-loop over integers.
6. **Mastery** — *generalize the algebra.* Single Number II (every element thrice):
   XOR fails — why? (It cancels PAIRS; we need mod-3 cancellation.) The student invents
   per-bit counting mod 3 — generalizing XOR-algebra to mod-k, the true pattern beneath
   the trick. Sum-of-two-integers without '+' (half-adder: XOR = sum-without-carries,
   AND<<1 = carries) — the curriculum's final "you reinvented the machine" moment.

---

### TOPIC 13 · MATH

*Last by design: it's where the curriculum's recurring characters hold a reunion.*

0. **The Pattern Reflex** — *small cases → table → conjecture.* The mathematical habit:
   compute f(1)..f(6) by hand, stare, hypothesize, verify on f(7). Trained on digit-sum
   cycles and power-of-two detection before any technique.
1. **Digit Mechanics (Mechanic)** — *place value is a stack.* Reverse-integer and
   palindrome-number WITHOUT strings: mod peels, multiply accumulates. Overflow discussed
   as a real engineering constraint, briefly.
2. **The GCD Story (the Leap)** — *Euclid's subtraction.* gcd(a,b): the student tries
   "test every divisor from min down" (naive embedded), then plays with
   "does d divide a AND b ⇒ does d divide a−b?" until gcd(a,b)=gcd(b,a mod b) *emerges*.
   One of the oldest algorithms alive, derived from divisibility's invariance under
   subtraction. The "algorithm as preserved invariant" idea — the curriculum's deepest
   recurring theme — is named here explicitly.
3. **Primes & Factors (Payload)** — *factors come in pairs.* Trial division to √n:
   the √n bound *derived* from pairing (if d > √n divides n, then n/d < √n also does —
   you'd have found it already). Sieve as systematic multiple-elimination.
4. **Naive** — *multiply n times.* pow(x, n) by repeated multiplication; integer sqrt by
   linear scan.
5. **Optimization** — *halve the exponent.* Fast exponentiation: x¹⁰ = (x⁵)² = x·(x²)²·…
   — the student discovers squaring by asking "I already computed x⁵, why compute it
   twice?" (Memoization reflex!) then sees the binary representation of n IS the
   algorithm (Bit Manipulation handshake). Integer sqrt by **binary search** —
   Elimination reflex (BST 0) returning; the student should recognize it instantly now.
6. **Mastery — the reunion.** Happy number: the sequence either reaches 1 or… what? The
   student simulates, hits a loop, and the platform asks "how do you detect a cycle in a
   sequence generated on demand?" — **Floyd's cycle detection** (Linked Lists 3) with
   the function-as-next-pointer insight: *any iterated function is a linked list in
   disguise.* Excel-sheet column title (base-26 with no zero digit — a twist that forces
   genuine understanding of place value). The final mastery note: "the list was never
   the point; the pointers were."

---

## 4. The Pattern Library (the real course outline)

Every named pattern deposited in the student's journal (Rule C2), in birth order:

1. Recursive Leap of Faith · 2. Traversal-as-Skeleton · 3. Upward Aggregation
4. Returning Tuples · 5. Downward Constraints · 6. Pointer Surgery ·
7. Relative-Motion Pointers (Fast/Slow) · 8. Sentinel Thinking · 9. Elimination
10. Invariant-Driven Structure · 11. Structure-as-Compression (Trie) ·
12. Local-Rules-Global-Answer (Heap) · 13. Path-as-Array + Prefix-on-Path ·
14. Decision Tree · 15. Choose-Explore-Unchoose · 16. Pruning · 17. Visited/Canonical Form
18. The Two Walks (DFS/BFS) · 19. Layer Argument (BFS = shortest unweighted) ·
20. Elimination-of-Sources (Kahn) · 21. Overlap → Memoization · 22. State Design (amnesia test)
23. "Ending at i" · 24. Table-as-Product · 25. Exchange Argument · 26. Frontier Maintenance
27. Sweep Line · 28. Greedy Frontier (Dijkstra) · 29. Representative Trees (Union-Find)
30. Relaxation Rounds · 31. Masks & Stencils · 32. Cancellation Algebra (XOR → mod-k)
33. Bit-as-Membership Enumeration · 34. Invariance-Preserving Reduction (Euclid) ·
35. Halve-the-Work (Squaring) · 36. Function-as-List (iterated-map cycles)

Thirty-six patterns ≈ the entire course. The problem count is an implementation detail;
the pattern count is the product.

## 5. Sizing & Authoring Budget

| Topic | Stages | Problems (target) | Authoring notes |
|---|---|---|---|
| Trees | 7 | 10–12 | Exists; needs porting to lesson schema |
| Linked Lists | 7 | 8–10 | Sandbox is simple (boxes+arrows) |
| BST | 7 | 8–10 | Stage 2 (Range idea) needs the "build the wrong validator" trap tooling |
| Trie | 7 | 6–8 | Mastery is bridge-heavy (grid, XOR) |
| Heap | 7 | 7–9 | Heapify O(n) counting needs a dedicated visualization |
| Advanced Trees | 7 | 7–9 | Prefix-on-path needs path-array hybrid viz |
| Backtracking | 7 | 8–10 | Decision-tree viz with pruning is the flagship renderer |
| Graphs | 7 | 9–11 | Grid-as-graph sandbox; infinite-loop crash moment is scripted |
| DP | 9 | 12–15 | Two naive/opt cycles; state-design trainer is a bespoke interactive |
| Greedy | 7 | 7–9 | Counterexample builder (students construct trap inputs) |
| Intervals | 7 | 5–6 | Short story; sweep-line viz |
| Advanced Graphs | 7 | 8–10 | Weighted-graph sandbox + relaxation tracer |
| Bit Manipulation | 7 | 6–8 | Bit-playground (8-bit rows, live ops) |
| Math | 7 | 6–8 | Simulation sandbox (iterate-a-function) |
| **Total** | **~93 stages** | **~110–130 problems** | ≈ the size of a dense university course |

## 6. The AI/ML Systems Track

The 14-topic DSA spine above is one curriculum. A second track — **AI/ML systems
engineering** — lives alongside it under the `ai-ml` topic (docs/13). It is a separate
spine with its own lab kinds (`data-lab | model-lab | experiment-lab | service-lab |
failure-lab`), its own artifact chain (dataset card → split policy → feature contract →
baseline → model → experiment → API contract → failure policy), and the same nine-stage
flow with the same order guarantee: implementation is always Stage 6, and a lab is never
accepted without its artifact, baseline, evaluation, or failure behavior. Schema rules
AI-1…AI-4 enforce this at build time. The two tracks share the stage engine, the trace
format, and the design system; they do not share the beat grammar.

## 7. Delivery Audit — What Must Exist Before This Is a Curriculum Product

The topic spines above are the **course design**. A problem bank with stage labels is
not yet the course. v0 must close the following delivery gaps in this order:

1. **Nine-stage lesson shell.** Each canonical problem must run through Understand →
   Play → Reason → Discover → Design → Implement → Execute → Reflect → Generalize.
   The code editor is absent until the Design artifact passes. This is the single most
   important product gap; it protects Concepts → Reasoning → Patterns → Implementation.
2. **One authored discovery interaction per beat.** A beat needs a sandbox, constrained
   construction, counterexample, or trace-counting interaction that lets the learner
   *feel* its claim before the prose names it. Generic hints and solution reveal buttons
   do not satisfy Rule B2.
3. **Naive/optimized paired evidence.** Wherever a naive solution exists, persist and
   replay both student traces side-by-side. Stage 8 asks the learner to name the exact
   repeated work that disappeared. This is the evidence for Rule A3, not a complexity
   label displayed after the fact.
4. **Pattern journal and retrieval loop.** Completing a lesson deposits one of the 36
   named patterns with the learner's own reflection. The next related lesson asks for a
   prediction or invariant before help is available; this turns Stage 9 from a link list
   into transfer practice.
5. **Mastery probes, not click-through.** A respectful "test me out" route may compact
   familiar material only after a trace prediction, invariant statement, or constructed
   return-type answer demonstrates ownership. Completion must never mean merely opening
   a card.

### Mobile authoring constraint

Every discovery interaction has a phone form: one task at a time, a reachable primary
action above the bottom navigation, and in-app sheets rather than browser-native menus.
The phone flow carries the same cognitive sequence as desktop; it may stack surfaces,
but it may not collapse stages or reveal implementation early.
