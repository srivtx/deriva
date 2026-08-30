import type { PdbProblem } from "./pdb"

// ── PDB G: stage 16 — The Slow March (correct but too slow) ─────────────────
// These drills pass every value test and fail on TIME. The harness asserts a
// 3.0s budget on a large input; the brute force takes ~3s in CPython and
// ~4-10s in Pyodide, the one-pass fix takes milliseconds. No pdb entry: the
// debugger cannot help you count operations.

const BUDGET_MSG = "took {dt:.1f}s — budget 3.0s. The answer is right; the algorithm is the bug."

export const PROBLEMS_PDB_G: PdbProblem[] = [
  {
    id: 62, stage: 16, title: "The Pair Hunt", pattern: "brute-pairs", skill: "count complements, not pairs", file: "pairs.py", bugCount: 1,
    statement: "pairs.py counts index pairs summing to a target. The value tests pass — but the large-input test reports 'correct answer, budget exceeded.'\n\nNothing is wrong with the arithmetic. Count how many additions the double loop performs, then count how many the problem actually needs.",
    examples: [
      { input: "count_pairs([1, 2, 3, 4], 5)", output: "2", explain: "(1,4) and (2,3)" },
      { input: "count_pairs([2, 2, 2], 4)", output: "3", explain: "all three index pairs" },
    ],
    why: "The double loop does n(n-1)/2 additions — 32 million at n=8000. Every inner scan asks the same question: 'how many numbers equal target - x have I already seen?' A dict answers that in O(1), making the whole pass O(n). Performance debugging is recognizing that the redundant work has a shape — here, repeated membership questions — and replacing it with a structure.",
    starterCode: "def count_pairs(nums, target):\n    \"\"\"Number of i < j pairs with nums[i] + nums[j] == target.\"\"\"\n    count = 0\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                count += 1\n    return count\n",
    hints: [
      "For each x, which earlier elements complete a pair with it — and can a dict remember them?",
      "One pass: count += seen.get(target - x, 0), then record x. Why does order make this correct?",
      "The inner loop only ever asks 'have I seen target - x?'. A dict of counts answers it instantly.",
    ],
    solution: "def count_pairs(nums, target):\n    \"\"\"Number of i < j pairs with nums[i] + nums[j] == target.\"\"\"\n    seen = {}\n    count = 0\n    for x in nums:\n        count += seen.get(target - x, 0)\n        seen[x] = seen.get(x, 0) + 1\n    return count\n",
    walkthrough: "The double loop performs n(n-1)/2 = 32M additions for n=8000 — the budget test measured it. But the inner loop's entire job is one question: how many target - x values appeared before index i? A dict of seen counts answers in constant time: for each x, add seen[target - x], then record x. Same count (the value tests still pass), 32M operations replaced by 8000 dict lookups. The transcript's budget message is the whole bug report.",
    testCode: `import time
from random import Random

check_call('count_pairs([1, 2, 3, 4], 5)', lambda: count_pairs([1, 2, 3, 4], 5), 2)
check_call('count_pairs([2, 2, 2], 4)', lambda: count_pairs([2, 2, 2], 4), 3)
check_call('empty input', lambda: count_pairs([], 5), 0)
rng = Random(7)
big = [rng.randint(0, 200) for _ in range(8000)]
t0 = time.perf_counter()
got = count_pairs(big, 200)
dt = time.perf_counter() - t0
check('large input within budget', dt < 3.0, "${BUDGET_MSG}".replace("{dt:.1f}", f"{dt:.1f}") + " Count complements in ONE pass with a dict.")
check_call('large input correct', lambda: got, 158448)
finish()`,
  },
  {
    id: 63, stage: 16, title: "The Slow Dedupe", pattern: "list-membership-scan", skill: "sets answer membership in O(1)", file: "dedupe.py", bugCount: 1,
    statement: "dedupe.py removes duplicates, preserving first-seen order. Value tests pass; the large-input test fails on budget: 240k items, 5000 distinct values.\n\nThe output is right. Ask how many comparisons each x not in seen performs.",
    examples: [
      { input: "dedupe([3, 1, 3, 2, 1])", output: "[3, 1, 2]", explain: "first occurrence order kept" },
      { input: "dedupe([])", output: "[]", explain: "empty in, empty out" },
    ],
    why: "x not in seen on a LIST is a linear scan — and seen grows to 5000 entries, so each of the 240k items scans thousands of elements: ~600M comparisons. A set hashes: membership is O(1) on average, and insertion order can be kept by still appending to out. The list was doing a set's job with a scan's price.",
    starterCode: "def dedupe(items):\n    \"\"\"Unique values, first-seen order preserved.\"\"\"\n    seen = []\n    out = []\n    for x in items:\n        if x not in seen:\n            seen.append(x)\n            out.append(x)\n    return out\n",
    hints: [
      "What does `x not in seen` cost when seen holds thousands of entries?",
      "Which structure answers 'have I seen x?' without scanning?",
      "Keep out for the order; make seen a set for the membership.",
    ],
    solution: "def dedupe(items):\n    \"\"\"Unique values, first-seen order preserved.\"\"\"\n    seen = set()\n    out = []\n    for x in items:\n        if x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out\n",
    walkthrough: "The budget message measured the truth: each membership test scans seen linearly, and seen reaches 5000 entries — roughly 200M comparisons across the run. The set does the same job by hashing: O(1) average per test. out still preserves first-seen order, so the output is byte-identical; only the cost collapsed. Membership questions want sets, not lists.",
    testCode: `import time
from random import Random

check_call('dedupe([3, 1, 3, 2, 1])', lambda: dedupe([3, 1, 3, 2, 1]), [3, 1, 2])
check_call('empty input', lambda: dedupe([]), [])
rng = Random(11)
big = [rng.randint(0, 5000) for _ in range(240000)]
t0 = time.perf_counter()
out = dedupe(big)
dt = time.perf_counter() - t0
check('large input within budget', dt < 3.0, "${BUDGET_MSG}".replace("{dt:.1f}", f"{dt:.1f}") + " Membership scans are linear — hand 'seen' to a set.")
check_call('large input: correct count', lambda: len(out), 5001)
check_call('large input: order preserved', lambda: out[:5], [3705, 4585, 3814, 3701, 4160])
finish()`,
  },
  {
    id: 64, stage: 16, title: "The Recursive Spiral", pattern: "naive-recursion", skill: "never re-derive what you can remember", file: "fib.py", bugCount: 1,
    statement: "fib.py computes Fibonacci numbers. Value tests pass; fib(38) blows the 3s budget by recomputing the same subtrees millions of times.\n\nDraw the call tree for fib(5) and count how many times fib(2) runs. Now imagine n=38.",
    examples: [
      { input: "fib(10)", output: "55", explain: "correct, fast" },
      { input: "fib(38)", output: "39088169", explain: "correct — and the budget test says too slow" },
    ],
    why: "Naive recursion re-derives overlapping subproblems: the call tree has ~fib(n) nodes, exponential in n. The two classic fixes are the same insight at different altitudes: memoize (cache by argument) or iterate (two variables carry the whole state). Both replace an exponential tree with a linear chain.",
    starterCode: "def fib(n):\n    \"\"\"nth Fibonacci number: fib(0)=0, fib(1)=1.\"\"\"\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n",
    hints: [
      "In the call tree of fib(6), how many times does fib(3) get computed from scratch?",
      "The recursion carries only two numbers of real state. Which?",
      "Iterate: a, b = 0, 1; n times: a, b = b, a + b. Then return a.",
    ],
    solution: "def fib(n):\n    \"\"\"nth Fibonacci number: fib(0)=0, fib(1)=1.\"\"\"\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n",
    walkthrough: "fib(38) via naive recursion spawns ~200 million function calls — the tree recomputes fib(2) tens of millions of times. The entire state needed is two adjacent values, so the iterative form walks a linear chain: 38 additions. (functools.lru_cache on the recursive version is the same fix expressed as memoization.) Exponential trees collapse when you notice the overlapping subproblems.",
    testCode: `import time

check_call('fib(0)', lambda: fib(0), 0)
check_call('fib(1)', lambda: fib(1), 1)
check_call('fib(10)', lambda: fib(10), 55)
t0 = time.perf_counter()
got = fib(38)
dt = time.perf_counter() - t0
check('fib(38) within budget', dt < 3.0, "${BUDGET_MSG}".replace("{dt:.1f}", f"{dt:.1f}") + " The call tree recomputes the same subtrees — memoize or iterate.")
check_call('fib(38) correct', lambda: got, 39088169)
finish()`,
  },
  {
    id: 65, stage: 16, title: "The Brute Ridge", pattern: "brute-subarray", skill: "running sums already know the answer", file: "terrain.py", bugCount: 1,
    statement: "terrain.py finds the maximum contiguous subarray sum. Value tests pass; the 8000-element input exceeds the budget with its every-window double loop.\n\nThe fix is famous: as you walk, what does the best run ENDING HERE look like?",
    examples: [
      { input: "max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])", output: "6", explain: "the run 4,-1,2,1" },
      { input: "max_subarray([-3, -1, -2])", output: "-1", explain: "all negative: the least bad single element" },
    ],
    why: "The double loop re-sums every window from scratch: n(n+1)/2 additions. Kadane's insight: the best run ending at position i is max(x, best_ending_at_i-1 + x) — a running decision between extending the previous run and restarting. One pass, one variable. The redundancy was re-adding prefixes the running sum already knew.",
    starterCode: "def max_subarray(vals):\n    \"\"\"Largest possible sum of a contiguous run.\"\"\"\n    best = vals[0]\n    for i in range(len(vals)):\n        run = 0\n        for j in range(i, len(vals)):\n            run += vals[j]\n            best = max(best, run)\n    return best\n",
    hints: [
      "The inner loop re-adds vals[i..j] for every i. What does a running total already know about vals[..j]?",
      "At each element the best run ending here is either just x, or the previous run extended by x. Which?",
      "Kadane: run = max(x, run + x); best = max(best, run).",
    ],
    solution: "def max_subarray(vals):\n    \"\"\"Largest possible sum of a contiguous run.\"\"\"\n    best = run = vals[0]\n    for x in vals[1:]:\n        run = max(x, run + x)\n        best = max(best, run)\n    return best\n",
    walkthrough: "The brute force performs ~32M additions at n=8000 — every window re-summed from its own start. Kadane's pass asks one question per element: extend the running best (run + x) or restart (x)? max picks; best remembers the peak. Same answers on every value test, 32M operations replaced by 8000 comparisons. The pattern generalizes: when an inner loop rebuilds a sum from scratch, the running sum already knew.",
    testCode: `import time
from random import Random

check_call('classic mixed terrain', lambda: max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6)
check_call('all negative', lambda: max_subarray([-3, -1, -2]), -1)
check_call('single element', lambda: max_subarray([7]), 7)
rng = Random(13)
big = [rng.randint(-100, 100) for _ in range(8000)]
t0 = time.perf_counter()
got = max_subarray(big)
dt = time.perf_counter() - t0
check('large input within budget', dt < 3.0, "${BUDGET_MSG}".replace("{dt:.1f}", f"{dt:.1f}") + " A running sum already knows what the inner loop re-adds — Kadane it.")
check_call('large input correct', lambda: got, 3458)
finish()`,
  },
]
