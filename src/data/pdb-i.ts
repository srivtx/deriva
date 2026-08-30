import type { PdbProblem } from "./pdb"

// ── PDB I: stages 19-20 — The Algorithm's Heart · The Statistician's Trap ───

export const PROBLEMS_PDB_I: PdbProblem[] = [
  // ══ STAGE 19 — The Algorithm's Heart ══
  {
    id: 74, stage: 19, title: "The One-Pass Lie", pattern: "bellman-ford-passes", skill: "relaxation needs n-1 passes", file: "routing.py", bugCount: 1,
    statement: "routing.py runs Bellman-Ford for shortest paths. CI: 'distances beyond the first edge of the list come back as unreachable — even though paths exist.'\n\nThe relaxation is correct. The loop around it is missing. Watch dist after a single pass.",
    examples: [
      { input: "shortest(4, [(2, 3, 5), (1, 2, 5), (0, 1, 5)], 0)", output: "[0, 5, 10, 15]", explain: "the chain 0->1->2->3 must propagate" },
      { input: "shortest(3, [(0, 1, 1), (0, 2, 3)], 0)", output: "[0, 1, 3]", explain: "direct edges need no propagation" },
    ],
    why: "One relaxation pass only propagates information one edge-position forward through the edge LIST — not through the graph. A shortest path can have up to n-1 edges, and each pass extends known distances by at least one edge; that is WHY the algorithm loops n-1 times. One pass is not a faster Bellman-Ford; it is a different, broken algorithm.",
    starterCode: "def shortest(n, edges, src):\n    \"\"\"Bellman-Ford distances from src; unreachable -> None.\"\"\"\n    dist = [None] * n\n    dist[src] = 0\n    for u, v, w in edges:\n        if dist[u] is not None and (dist[v] is None or dist[u] + w < dist[v]):\n            dist[v] = dist[u] + w\n    return dist\n",
    hints: [
      "p dist after the first pass with the chained edges — which nodes know their distance?",
      "How many edges can a shortest path have? How many passes does that demand?",
      "Wrap the relaxation in `for _ in range(n - 1):`.",
    ],
    solution: "def shortest(n, edges, src):\n    \"\"\"Bellman-Ford distances from src; unreachable -> None.\"\"\"\n    dist = [None] * n\n    dist[src] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if dist[u] is not None and (dist[v] is None or dist[u] + w < dist[v]):\n                dist[v] = dist[u] + w\n    return dist\n",
    walkthrough: "The transcript's first pass: p dist shows [0, 5, None, None] — the edge (0,1,5) sits LAST in the list, so its discovery came too late to feed (1,2) and (2,3) this round. One pass propagates through edge-list position, not graph topology. n-1 passes guarantee the frontier extends at least one graph-edge per pass, reaching any simple path. The loop wrapper is the algorithm.",
    testCode: "check_call('chained edges propagate', lambda: shortest(4, [(2, 3, 5), (1, 2, 5), (0, 1, 5)], 0), [0, 5, 10, 15])\ncheck_call('direct edges need no propagation', lambda: shortest(3, [(0, 1, 1), (0, 2, 3)], 0), [0, 1, 3])\ncheck_call('unreachable stays None', lambda: shortest(2, [(0, 1, 7)], 1), [None, 0])\ncheck_call('a later shortcut wins', lambda: shortest(3, [(0, 1, 10), (0, 2, 1), (2, 1, 2)], 0), [0, 3, 1])\nfinish()",
    entry: "shortest(4, [(2, 3, 5), (1, 2, 5), (0, 1, 5)], 0)",
    pdbLoad: ["args", "n", "n", "p dist", "c"],
  },
  {
    id: 75, stage: 19, title: "The Shallow Find", pattern: "union-find-one-step", skill: "find follows the chain to the root", file: "clusters.py", bugCount: 1,
    statement: "clusters.py counts connected components as unions arrive. CI: 'after chaining 0-1 and 1-2, it reports two components instead of one.'\n\nThe find() inside is a suspect: how far up the parent chain does it actually walk?",
    examples: [
      { input: "components(3, [(0, 1), (1, 2)])", output: "1", explain: "all three end up connected" },
      { input: "components(4, [(0, 1), (1, 2), (2, 3)])", output: "1", explain: "a four-node chain is one component" },
    ],
    why: "parent[x] is a STEP, not a ROOT: after parent[0]=1 and parent[1]=2, node 0's root is 2 but a one-step find returns 1. Union-find's correctness rests on find following the chain until parent[x] == x; anything shorter merges nodes under the wrong representative and invents components.",
    starterCode: "def components(n, unions):\n    \"\"\"Number of connected components after applying all unions.\"\"\"\n    parent = list(range(n))\n\n    def find(x):\n        return x if parent[x] == x else parent[x]\n\n    for a, b in unions:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n    return len({find(i) for i in range(n)})\n",
    hints: [
      "After both unions, p parent — then check what find(0) returns vs where the chain actually ends.",
      "parent[0] is 1 — but parent[1] is 2. Is 1 the root of anything?",
      "find must loop while parent[x] != x.",
    ],
    solution: "def components(n, unions):\n    \"\"\"Number of connected components after applying all unions.\"\"\"\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            x = parent[x]\n        return x\n\n    for a, b in unions:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n    return len({find(i) for i in range(n)})\n",
    walkthrough: "p parent after the unions prints [1, 2, 2] — node 0 points at 1, node 1 at 2. The one-step find(0) answers 1, but following the chain: 0 -> 1 -> 2, the root is 2. The final set {find(i)} therefore held {1, 2} — two 'components' where one tree exists. The while-loop find walks to the true root, and the count collapses to 1.",
    testCode: "check_call('three-node chain is one component', lambda: components(3, [(0, 1), (1, 2)]), 1)\ncheck_call('four-node chain is one component', lambda: components(4, [(0, 1), (1, 2), (2, 3)]), 1)\ncheck_call('no unions, all separate', lambda: components(4, []), 4)\ncheck_call('two clusters plus a loner', lambda: components(5, [(0, 1), (3, 4)]), 3)\nfinish()",
    entry: "components(3, [(0, 1), (1, 2)])",
    pdbLoad: ["args", "n", "n", "n", "p parent", "c"],
  },
  {
    id: 76, stage: 19, title: "The Half-Sifted Heap", pattern: "sift-without-cascade", skill: "a sift continues until it settles", file: "heapsort.py", bugCount: 1,
    statement: "heapsort.py sorts via a max-heap. CI: 'outputs are ALMOST sorted — small values linger in wrong places.'\n\nThe sift() helper swaps once and quits. Watch where the displaced element lands.",
    examples: [
      { input: "heap_sort([3, 1, 4, 1, 5])", output: "[1, 1, 3, 4, 5]", explain: "fully sorted" },
      { input: "heap_sort([5, 4, 3, 2, 1])", output: "[1, 2, 3, 4, 5]", explain: "reverse order must sort too" },
    ],
    why: "A sift-down must continue while a child is larger: swapping the parent with its biggest child may STILL leave the moved-down value smaller than one of ITS children. One swap per call builds a heap that is a heap only in the top two levels — and heapsort's extraction then mixes half-built heaps into a nearly-sorted array.",
    starterCode: "def heap_sort(vals):\n    \"\"\"Ascending sort via a max-heap.\"\"\"\n    data = list(vals)\n\n    def sift(i, size):\n        l, r = 2 * i + 1, 2 * i + 2\n        if l < size and data[l] > data[i]:\n            data[i], data[l] = data[l], data[i]\n        if r < size and data[r] > data[i]:\n            data[i], data[r] = data[r], data[i]\n\n    n = len(data)\n    for i in range(n // 2 - 1, -1, -1):\n        sift(i, n)\n    for end in range(n - 1, 0, -1):\n        data[0], data[end] = data[end], data[0]\n        sift(0, end)\n    return data\n",
    hints: [
      "After one swap in sift, the element you pushed down may still be smaller than a grandchild. Who pushes it further?",
      "A sift is finished only when both children are smaller — or there are none. Which loop shape expresses that?",
      "while True: pick the biggest of parent/left/right; if it is the parent, stop; else swap and continue below.",
    ],
    solution: "def heap_sort(vals):\n    \"\"\"Ascending sort via a max-heap.\"\"\"\n    data = list(vals)\n\n    def sift(i, size):\n        while True:\n            big, l, r = i, 2 * i + 1, 2 * i + 2\n            if l < size and data[l] > data[big]:\n                big = l\n            if r < size and data[r] > data[big]:\n                big = r\n            if big == i:\n                return\n            data[i], data[big] = data[big], data[i]\n            i = big\n\n    n = len(data)\n    for i in range(n // 2 - 1, -1, -1):\n        sift(i, n)\n    for end in range(n - 1, 0, -1):\n        data[0], data[end] = data[end], data[0]\n        sift(0, end)\n    return data\n",
    walkthrough: "Trace sift(0) on a two-level tree where the root's LEFT child is biggest but the right child is bigger still: one swap puts the large-left value at the root, then the second if compares the right child against the ROOT's new value — the displaced element never descends. The cascade version picks the largest of the three, swaps, and repeats from the child's position: a sift ends only when the heap property holds at every level it touched.",
    testCode: "check_call('mixed input sorts', lambda: heap_sort([3, 1, 4, 1, 5]), [1, 1, 3, 4, 5])\ncheck_call('subtle ordering sorts', lambda: heap_sort([1, 2, 3, 5, 6, 4]), [1, 2, 3, 4, 5, 6])\ncheck_call('another subtle ordering', lambda: heap_sort([1, 2, 4, 6, 5, 3]), [1, 2, 3, 4, 5, 6])\ncheck_call('reverse input sorts', lambda: heap_sort([5, 4, 3, 2, 1]), [1, 2, 3, 4, 5])\ncheck_call('two elements', lambda: heap_sort([2, 1]), [1, 2])\ncheck_call('empty input', lambda: heap_sort([]), [])\nfinish()",
    entry: "heap_sort([3, 1, 4, 1, 5])",
    pdbLoad: ["args", "n", "n", "n", "p data", "c"],
  },
  {
    id: 77, stage: 19, title: "The Amnesiac Memo", pattern: "incomplete-memo-key", skill: "the key must capture all the state", file: "treasury.py", bugCount: 1,
    statement: "treasury.py counts ways to make change. CI: 'the counts are wrong for multi-coin cases, right for single-coin ones.'\n\nThe memo is LYING — returning cached answers for questions that were never asked. Inspect its keys.",
    examples: [
      { input: "ways(5, [1, 2, 3])", output: "5", explain: "5x1, 1+1+1+2, 1+2+2, 1+1+3, 2+3" },
      { input: "ways(4, [2, 3])", output: "1", explain: "2+2" },
    ],
    why: "The recursion's state is (rem, idx): same remainder at a different coin index is a DIFFERENT subproblem. A memo keyed on rem alone returns a cached count computed while allowed to use coins[3..] for a question about coins[0..] — cache hits for questions nobody asked. Memo keys must be the FULL state, or the cache poisons the search.",
    starterCode: "def ways(amount, coins):\n    \"\"\"Number of ways to make `amount` (each coin reusable, coin order fixed).\"\"\"\n    memo = {}\n\n    def go(rem, idx):\n        if rem == 0:\n            return 1\n        if rem < 0 or idx == len(coins):\n            return 0\n        key = rem\n        if key in memo:\n            return memo[key]\n        memo[key] = go(rem - coins[idx], idx) + go(rem, idx + 1)\n        return memo[key]\n\n    return go(amount, 0)\n",
    hints: [
      "p sorted(memo.items()) after the run — do keys remember which idx they were computed at?",
      "What are the two arguments of go()? Which one is missing from the key?",
      "key = (rem, idx) — the cache must answer THIS subproblem, not a lookalike.",
    ],
    solution: "def ways(amount, coins):\n    \"\"\"Number of ways to make `amount` (each coin reusable, coin order fixed).\"\"\"\n    memo = {}\n\n    def go(rem, idx):\n        if rem == 0:\n            return 1\n        if rem < 0 or idx == len(coins):\n            return 0\n        key = (rem, idx)\n        if key in memo:\n            return memo[key]\n        memo[key] = go(rem - coins[idx], idx) + go(rem, idx + 1)\n        return memo[key]\n\n    return go(amount, 0)\n",
    walkthrough: "p sorted(memo.items()) shows entries like (2, 3) — a remainder of 2 cached from a state deep in the coin list. Later, go(2, 0) hits that key and receives a count computed under completely different coin availability. The recursion's identity is the PAIR (rem, idx); a key of rem alone conflates distinct subproblems and the memo poisons itself. Tuple the key, and single-coin cases stay right while the multi-coin ones join them.",
    testCode: "check_call('ways(5, [1, 2, 3])', lambda: ways(5, [1, 2, 3]), 5)\ncheck_call('ways(4, [2, 3])', lambda: ways(4, [2, 3]), 1)\ncheck_call('ways(0, [1, 2])', lambda: ways(0, [1, 2]), 1)\ncheck_call('impossible amount', lambda: ways(3, [5]), 0)\nfinish()",
    entry: "ways(5, [1, 2, 3])",
    pdbLoad: ["args", "n", "n", "n", "p sorted(memo.items())", "c"],
  },

  // ══ STAGE 20 — The Statistician's Trap ══
  {
    id: 78, stage: 20, title: "The Bessel Choice", pattern: "n-vs-n-1", skill: "which variance did the spec order", file: "spread.py", bugCount: 1,
    statement: "spread.py reports variance for an analytics dashboard. The spec says SAMPLE variance (ddof=1). CI: 'every number is plausible and every number is wrong.'\n\nThe formula divides by n. Read the spec's denominator again.",
    examples: [
      { input: "variance([2, 4, 4, 4, 5, 5, 7, 9])", output: "4.5714...", explain: "32 / 7 — sample variance" },
      { input: "variance([1, 2, 3, 4])", output: "1.6667", explain: "5 / 3 — not 5 / 4" },
    ],
    why: "Population variance divides by n; sample variance divides by n-1 (Bessel's correction) because the sample mean already absorbed one degree of freedom. Both are 'the variance' in casual speech — which is why the bug is plausible. The spec's word SAMPLE is the whole bug report; a single denominator changes.",
    starterCode: "def variance(xs):\n    \"\"\"Sample variance (ddof=1); 0.0 for fewer than two values.\"\"\"\n    if len(xs) < 2:\n        return 0.0\n    m = sum(xs) / len(xs)\n    return sum((x - m) ** 2 for x in xs) / len(xs)\n",
    hints: [
      "For [1, 2, 3, 4]: the squared deviations sum to 5. What does the spec divide by?",
      "The spec says SAMPLE variance. Which denominator implements that?",
      "Divide by len(xs) - 1 — and keep the n < 2 guard.",
    ],
    solution: "def variance(xs):\n    \"\"\"Sample variance (ddof=1); 0.0 for fewer than two values.\"\"\"\n    if len(xs) < 2:\n        return 0.0\n    m = sum(xs) / len(xs)\n    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)\n",
    walkthrough: "p sum((x - m) ** 2 for x in xs) prints 5.0 for [1, 2, 3, 4] — correct. The bug is purely the divisor: 5/4 is the population answer, 5/3 the sample answer the spec ordered. Same code shape, one denominator apart, and every dashboard number shifts. When statistics look plausible but fail, audit the formula's conventions before the data.",
    testCode: "check_call('sample variance of the textbook set', lambda: round(variance([2, 4, 4, 4, 5, 5, 7, 9]), 4), 4.5714)\ncheck_call('sample variance of 1..4', lambda: round(variance([1, 2, 3, 4]), 4), 1.6667)\ncheck_call('identical values, zero spread', lambda: round(variance([3, 3, 3]), 4), 0.0)\ntry:\n    got = variance([5])\n    check('single value -> 0.0', got == 0.0, f'got {got!r}')\nexcept ZeroDivisionError:\n    check('single value -> 0.0', False, 'ZeroDivisionError — keep the n < 2 guard')\nfinish()",
    entry: "variance([1, 2, 3, 4])",
    pdbLoad: ["args", "n", "n", "p m", "p len(xs)", "p len(xs) - 1", "c"],
  },
  {
    id: 79, stage: 20, title: "The Vanishing Spread", pattern: "catastrophic-cancellation", skill: "subtract the mean before squaring", file: "sensor.py", bugCount: 1,
    statement: "sensor.py measures jitter: the variance of readings near 1e9 whose true spread is about 1. CI: 'jitter reports 0.0 for every sensor — even visibly noisy ones.'\n\nThe one-pass formula E[X^2] - E[X]^2 is mathematically equal and numerically ruined. Print its two halves.",
    examples: [
      { input: "jitter([1e9, 1e9 + 1, 1e9 + 2])", output: "0.6667", explain: "true spread — not 0.0" },
      { input: "jitter([2.0, 4.0, 6.0])", output: "2.6667", explain: "small values: the one-pass formula survives" },
    ],
    why: "x*x for x near 1e9 is ~1e18; float64 carries ~16 significant digits, so those squares are quantized in steps of ~100. Subtracting two nearly-equal ~1e18 numbers (E[X^2] and mean^2) cancels every real digit and leaves only the quantization dust — often exactly 0.0. Computing sum((x - mean)^2) squares numbers near ZERO, where precision lives.",
    starterCode: "def jitter(samples):\n    \"\"\"Population variance of the readings (values ~1e9, spread ~1).\"\"\"\n    n = len(samples)\n    mean = sum(samples) / n\n    return sum(x * x for x in samples) / n - mean * mean\n",
    hints: [
      "p sum(x * x for x in samples) / n and p mean * mean — how far apart are they, and how big?",
      "Subtracting two nearly equal huge numbers keeps only the quantization dust. Where can the subtraction happen BEFORE the squaring?",
      "Two-pass: mean first, then sum((x - mean) ** 2) / n.",
    ],
    solution: "def jitter(samples):\n    \"\"\"Population variance of the readings (values ~1e9, spread ~1).\"\"\"\n    n = len(samples)\n    mean = sum(samples) / n\n    return sum((x - mean) ** 2 for x in samples) / n\n",
    walkthrough: "The transcript prints both halves as ~1e18 — and their difference as 0.0. The signal (spread ~1) lived in digit 19 of numbers holding 16; cancellation annihilated it. Centering first — (x - mean) — squares values near zero like -1, 0, 1, where float64 has full precision, and the true variance 2/3 reappears. Mathematically equal, numerically opposite: that is catastrophic cancellation.",
    testCode: "check_call('jitter of a 1e9 sensor', lambda: round(jitter([1e9, 1e9 + 1, 1e9 + 2]), 4), 0.6667)\ncheck_call('small values survive either way', lambda: round(jitter([2.0, 4.0, 6.0]), 4), 2.6667)\ncheck_call('no spread, no jitter', lambda: round(jitter([1e9, 1e9, 1e9]), 4), 0.0)\nfinish()",
    entry: "jitter([1e9, 1e9 + 1, 1e9 + 2])",
    pdbLoad: ["args", "n", "n", "p mean", "p sum(x * x for x in samples) / n - mean * mean", "c"],
  },
  {
    id: 80, stage: 20, title: "The Weighted Wheel", pattern: "sampler-cumulative", skill: "compare r to the running total", file: "wheel.py", bugCount: 1,
    statement: "wheel.py spins a weighted prize wheel: with weights [5, 3, 2], item 1 should win 30% of the time. Over 20000 seeded spins it wins ZERO times.\n\nWatch one spin: what is r compared against — and against what SHOULD it be compared?",
    examples: [
      { input: "spin([5, 3, 2], 20000, 42)", output: "counts ~ [10000, 6000, 4000]", explain: "proportional to the weights" },
      { input: "spin([1], 3, 0)", output: "[0, 0, 0]", explain: "one item always wins" },
    ],
    why: "Weighted sampling compares r against the CUMULATIVE weight: acc grows 5, 8, 10 and r lands in exactly one slice. Comparing r against each weight directly asks 'is r < 5 AND r < 3 AND r < 2' — only the first slice can ever win once r exceeds the later weights. The distribution collapses onto item 0.",
    starterCode: "from random import Random\n\n\ndef spin(weights, k, seed):\n    \"\"\"k spins of a wheel where item i wins with probability weights[i]/sum(weights).\"\"\"\n    rng = Random(seed)\n    total = sum(weights)\n    picks = []\n    for _ in range(k):\n        r = rng.random() * total\n        for i, w in enumerate(weights):\n            if r < w:\n                picks.append(i)\n                break\n    return picks\n",
    hints: [
      "p r in the transcript: after item 0 (weight 5) fails to catch it, what are the chances r < 3?",
      "The slices of the wheel are cumulative: [0..5), [5..8), [8..10). What must the comparison accumulate?",
      "acc += w before each comparison; break on r < acc.",
    ],
    solution: "from random import Random\n\n\ndef spin(weights, k, seed):\n    \"\"\"k spins of a wheel where item i wins with probability weights[i]/sum(weights).\"\"\"\n    rng = Random(seed)\n    total = sum(weights)\n    picks = []\n    for _ in range(k):\n        r = rng.random() * total\n        acc = 0.0\n        for i, w in enumerate(weights):\n            acc += w\n            if r < acc:\n                picks.append(i)\n                break\n        else:\n            picks.append(len(weights) - 1)\n    return picks\n",
    walkthrough: "p r prints a number like 8.4: item 0's check (8.4 < 5?) fails, item 1's check asks 8.4 < 3 — impossible once r passed item 0. Only r values under 5 ever pick anything, and they always pick item 0: a 50/50/0 wheel pretending to be 50/30/20. Accumulating acc (5, 8, 10) slices the wheel correctly — 8.4 lands in [5, 8) -> item 1. The seeded 20000-spin counts then match the weights.",
    testCode: "check_call('single item always wins', lambda: spin([1], 3, 0), [0, 0, 0])\ncheck_call('every spin lands somewhere', lambda: len(spin([2, 2], 100, 1)), 100)\nspins = spin([5, 3, 2], 20000, 42)\ncounts = [spins.count(i) for i in range(3)]\ncheck('item 0 wins ~50%', 9000 <= counts[0] <= 11000, f'item 0 won {counts[0]}/20000')\ncheck('item 1 wins ~30%', 5400 <= counts[1] <= 6600, f'item 1 won {counts[1]}/20000')\ncheck('item 2 wins ~20%', 3600 <= counts[2] <= 4400, f'item 2 won {counts[2]}/20000')\nfinish()",
    entry: "spin([5, 3, 2], 4, 42)",
    pdbLoad: ["args", "n", "n", "n", "n", "n", "p r", "c"],
  },
  {
    id: 81, stage: 20, title: "The Leaky Ruler", pattern: "train-test-leakage", skill: "the test set is scaled by the train set", file: "scaling.py", bugCount: 1,
    statement: "scaling.py z-scores features for a model. The spec: the TEST set must be scaled with the TRAINING mean and std — the model must not see test statistics. CI: 'the scaled test set does not match the reference values, and a single-point test set even crashes.'\n\nWhose statistics does the code actually use?",
    examples: [
      { input: "scale([10, 12, 14, 16, 18], [11, 15])", output: "[-1.0607, 0.3536]", explain: "train mean 14, train std 2.8284" },
      { input: "scale([4, 6], [7])", output: "[2.0]", explain: "train std 1.0 — the test point has no std of its own" },
    ],
    why: "Fitting the scaler on the test set is leakage: the transformed values (and any model built on them) ingest information from data that must remain unseen — and a one-point test set even divides by its own std of zero. The training statistics are the ONLY ruler allowed; the fix computes mean/std from train and applies them to test.",
    starterCode: "def scale(train, test):\n    \"\"\"Z-score the TEST set using the TRAINING statistics — no leakage.\"\"\"\n    mean = sum(test) / len(test)\n    std = (sum((x - mean) ** 2 for x in test) / len(test)) ** 0.5\n    return [round((x - mean) / std, 4) for x in test]\n",
    hints: [
      "p mean and p std in the transcript — are those the test set's own numbers?",
      "The spec says train statistics. Which list should the mean and std come from?",
      "Compute mean and std from train; apply them to every test point.",
    ],
    solution: "def scale(train, test):\n    \"\"\"Z-score the TEST set using the TRAINING statistics — no leakage.\"\"\"\n    mean = sum(train) / len(train)\n    std = (sum((x - mean) ** 2 for x in train) / len(train)) ** 0.5\n    return [round((x - mean) / std, 4) for x in test]\n",
    walkthrough: "The transcript: p mean prints 13 and p std prints 2.0 — the TEST set's own statistics ([11, 15]), not the training set's 14 and 2.8284. The scaled output therefore encodes test-set information (leakage), and the single-point test case divides by its own std of zero. Computing the ruler from train and laying it over test fixes both: [-1.0607, 0.3536] matches the reference, and [7] scales to [2.0] without a zero denominator.",
    testCode: "check_call('test scaled by train stats', lambda: scale([10, 12, 14, 16, 18], [11, 15]), [-1.0607, 0.3536])\ncheck_call('asymmetric train set', lambda: scale([0, 10], [-10, 30]), [-3.0, 5.0])\ntry:\n    got = scale([4, 6], [7])\n    check('single-point test set', got == [2.0], f'got {got!r}')\nexcept ZeroDivisionError:\n    check('single-point test set', False, 'the test set std is 0 — use the training std')\nfinish()",
    entry: "scale([10, 12, 14, 16, 18], [11, 15])",
    pdbLoad: ["args", "n", "p mean", "n", "p std", "c"],
  },
]
