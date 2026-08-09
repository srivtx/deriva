export interface Problem {
  id: number
  stage: number
  title: string
  pattern: string
  skill: string
  statement: string
  examples: { input: string; output: string; explain?: string }[]
  why: string
  starterCode: string
  hints: string[]
  solution: string
  walkthrough: string
  testCode: string
}

export const STAGES_DP = [
  { id: 0, name: "Overlap Reflex", desc: "wasted recomputation" },
  { id: 1, name: "Memoization", desc: "function keeps a journal" },
  { id: 2, name: "State Design", desc: "amnesia test" },
  { id: 3, name: "Tabulation", desc: "flip recursion" },
  { id: 4, name: "Sequence DP (Naive)", desc: "take/skip recursion" },
  { id: 5, name: "Sequence DP (Optimized)", desc: "ending-at-i trick" },
  { id: 6, name: "Mastery", desc: "compose all DP patterns" },
]

export const PROBLEMS_DP: Problem[] = [
  // ═══════════════════════════════════════════════════════════
  // STAGE 0 — Overlap Reflex (6 problems)
  // Repeated mental model: linear recursion skeleton (n → n-1)
  // One new idea: branching recursion creates duplicate work
  // ═══════════════════════════════════════════════════════════
  {
    id: 1, stage: 0, title: "Naive Fibonacci", pattern: "tree recursion", skill: "feel duplicate work",
    statement: "Given a non-negative integer n, return the nth Fibonacci number using plain recursion. F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2) for n>1. This IS deliberately the naive version. Count how many times F(2) gets computed when you call F(5).",
    examples: [
      { input: "n = 5", output: "5", explain: "0,1,1,2,3,5 — but F(2) is called 3 times!" },
      { input: "n = 0", output: "0" },
    ],
    why: "The first DP reflex: watch the same answer get recomputed over and over. Fibonacci is the canonical example because the waste is visible even at n=5. This problem plants the question memoization answers.",
    starterCode: "def fib(n):\n    pass",
    hints: [
      "What are the two base cases?",
      "For n > 1, F(n) = F(n-1) + F(n-2). Two recursive calls, sum them.",
      "Draw the call tree for F(5). How many nodes show 'F(2)'?"
    ],
    solution: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)",
    walkthrough: "F(5) calls F(4) and F(3). F(4) calls F(3) and F(2). F(3) is called TWICE — once from F(5) and once from F(4). F(2) is called THREE times. The recurrence tree is exponential: O(2^n). Every overlapping subproblem is recomputed from scratch. The question memoziation answers: 'what if we wrote down the answer the first time?'",
    testCode: "assert fib(0) == 0\nassert fib(1) == 1\nassert fib(5) == 5\nassert fib(10) == 55\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Naive Tribonacci", pattern: "tree recursion", skill: "extend to three branches",
    statement: "Tribonacci numbers: T(0)=0, T(1)=1, T(2)=1, T(n)=T(n-1)+T(n-2)+T(n-3) for n>2. Write a naive recursive solution. Think: how much worse is the waste than Fibonacci?",
    examples: [
      { input: "n = 4", output: "4", explain: "T(4)=T(3)+T(2)+T(1)=2+1+1=4" },
      { input: "n = 6", output: "13" },
    ],
    why: "Same pattern as P1 but with THREE recursive calls per node. The waste multiplies even faster — O(3^n). This makes the need for memoization viscerally obvious: the function is doing exponentially more work for each extra branch.",
    starterCode: "def tribonacci(n):\n    pass",
    hints: [
      "Three base cases: n==0 → 0, n==1 → 1, n==2 → 1.",
      "T(n) = T(n-1) + T(n-2) + T(n-3).",
      "For n=10, how many T(3) calls happen? Don't compute — feel the explosion."
    ],
    solution: "def tribonacci(n):\n    if n == 0:\n        return 0\n    if n <= 2:\n        return 1\n    return tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3)",
    walkthrough: "Same skeleton as P1 but with three recursive branches. The recurrence T(n)=T(n-1)+T(n-2)+T(n-3) creates a 3-way tree. T(3) is called from T(4), T(5), T(6)... each multiple times. Three branches means the tree grows even faster than Fibonacci's two. The pattern: 'overlapping subproblems' is the same — only the branching factor changed.",
    testCode: "assert tribonacci(0) == 0\nassert tribonacci(1) == 1\nassert tribonacci(2) == 1\nassert tribonacci(4) == 4\nassert tribonacci(6) == 13\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Naive Climbing Stairs", pattern: "tree recursion", skill: "map problem to fib recurrence",
    statement: "You are climbing a staircase of n steps. Each step you can climb 1 or 2 steps. Return the number of distinct ways to reach the top using naive recursion. Base: stairs(0)=1 (already at top), stairs(1)=1.",
    examples: [
      { input: "n = 3", output: "3", explain: "1+1+1, 1+2, 2+1 — three ways" },
      { input: "n = 5", output: "8" },
    ],
    why: "First surface-feature change. The recurrence IS Fibonacci but the story is stairs. Teach: the DP pattern is in the RECURRENCE STRUCTURE, not the domain. Same waste as P1 happens here.",
    starterCode: "def climb_stairs(n):\n    pass",
    hints: [
      "From step n, you can come from step n-1 (take 1 step) or step n-2 (take 2 steps).",
      "Ways to reach step n = ways to reach step n-1 + ways to reach step n-2.",
      "Base: how many ways to reach step 0? (Hint: 1 — you're already there.)"
    ],
    solution: "def climb_stairs(n):\n    if n <= 1:\n        return 1\n    return climb_stairs(n - 1) + climb_stairs(n - 2)",
    walkthrough: "The recurrence is identical to Fibonacci: F(n)=F(n-1)+F(n-2). Only base cases differ (1,1 vs 0,1). The waste is identical — O(2^n) — because the call tree has the same shape. Lesson: different surface stories produce identical recurrence trees. DP recognizes the TREE structure, not the story.",
    testCode: "assert climb_stairs(0) == 1\nassert climb_stairs(1) == 1\nassert climb_stairs(3) == 3\nassert climb_stairs(5) == 8\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Count Ways to Step N (1/2/3)", pattern: "tree recursion", skill: "three-branch recurrence from story",
    statement: "Now you can climb 1, 2, or 3 steps at a time. Return number of distinct ways to reach step n using naive recursion. stairs(0)=1.",
    examples: [
      { input: "n = 3", output: "4", explain: "1+1+1, 1+2, 2+1, 3 — four ways" },
      { input: "n = 4", output: "7" },
    ],
    why: "Extends P3 to three branches — the stair version of P2. Same waste explosion pattern. The recurrence is stairs(n)=stairs(n-1)+stairs(n-2)+stairs(n-3). Three branches, exponential waste.",
    starterCode: "def climb_stairs_3(n):\n    pass",
    hints: [
      "From n, you can arrive from n-1, n-2, or n-3.",
      "Ways(n) = ways(n-1) + ways(n-2) + ways(n-3).",
      "Handle n<0: return 0 (can't overshoot below step 0). Base n=0 → 1."
    ],
    solution: "def climb_stairs_3(n):\n    if n < 0:\n        return 0\n    if n == 0:\n        return 1\n    return climb_stairs_3(n - 1) + climb_stairs_3(n - 2) + climb_stairs_3(n - 3)",
    walkthrough: "Same shape as P2 (tribonacci) but with the stair problem story. Three recursive calls per node. Same O(3^n) waste. The recurrence emerged from the problem structure ('I can take 1, 2, or 3 steps') — this is the DP designer's first move: translate rules into recurrences.",
    testCode: "assert climb_stairs_3(0) == 1\nassert climb_stairs_3(1) == 1\nassert climb_stairs_3(3) == 4\nassert climb_stairs_3(4) == 7\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Duplicate Call Counter", pattern: "tree recursion analysis", skill: "instrument recursion to see waste",
    statement: "Write a wrapper that counts exactly how many total recursive calls fib(n) makes (including the initial call). Use global or nonlocal state. Return the call count. fib(0) and fib(1) each count as 1 call.",
    examples: [
      { input: "n = 5", output: "15", explain: "F(5) makes 15 total calls including itself" },
      { input: "n = 10", output: "177" },
    ],
    why: "Make the waste QUANTITATIVE. Instead of reasoning about it, COUNT it. The number 15 for n=5 (vs 5 for a linear approach) and 177 for n=10 makes the exponential explosion concrete.",
    starterCode: "def fib_call_count(n):\n    pass",
    hints: [
      "Use a nonlocal counter that increments on every call.",
      "Same recursion as P1 — just add the counting.",
      "Return the counter after the recursion finishes."
    ],
    solution: "def fib_call_count(n):\n    count = 0\n    def fib(n):\n        nonlocal count\n        count += 1\n        if n <= 1:\n            return n\n        return fib(n - 1) + fib(n - 2)\n    fib(n)\n    return count",
    walkthrough: "Count the waste. fib(5) = 15 calls. fib(10) = 177 calls. fib(20) ≈ 21891 calls. The count grows with the Fibonacci numbers themselves — exponential. Every overlapping subproblem is a NEW call. The counter makes the waste undeniable: if we could remember F(3) the first time, we'd save 13 of those 15 calls for n=5.",
    testCode: "assert fib_call_count(0) == 1\nassert fib_call_count(1) == 1\nassert fib_call_count(5) == 15\nassert fib_call_count(10) == 177\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Staircase: Step-Size Array (Naive)", pattern: "tree recursion", skill: "generalized step recurrence",
    statement: "Given an array steps[] of allowed step sizes and target n, return number of distinct ways to reach n using naive recursion. stairs(0)=1. steps=[1,2], n=4 → 5 ways.",
    examples: [
      { input: "steps=[1,2], n=4", output: "5", explain: "1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2" },
      { input: "steps=[1,3,5], n=5", output: "5" },
    ],
    why: "Generalizes P3/P4: the branching factor is now data-driven (len(steps)). The recurrence is ways(n) = sum(ways(n - s) for s in steps if s <= n). The waste pattern is the same — just parameterized.",
    starterCode: "def count_ways(steps, n):\n    pass",
    hints: [
      "Base case: n == 0 → 1 (reached the top). n < 0 → 0 (invalid).",
      "For each allowed step size s, recurse on n - s.",
      "Sum the results of all branches."
    ],
    solution: "def count_ways(steps, n):\n    if n < 0:\n        return 0\n    if n == 0:\n        return 1\n    total = 0\n    for s in steps:\n        total += count_ways(steps, n - s)\n    return total",
    walkthrough: "The recurrence pattern is now general: ways(n) = sum(ways(n - s) for each step size s). Same waste: count_ways(n-2) is called from count_ways(n) via step 2, AND from count_ways(n-1) via step 1...then from count_ways(n-3)... Overlap depends on step sizes but exists whenever multiple paths reach the same sub-n.",
    testCode: "assert count_ways([1, 2], 4) == 5\nassert count_ways([1, 2], 5) == 8\nassert count_ways([1, 3, 5], 5) == 5\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 1 — Memoization (5 problems)
  // Repeated mental model: same recurrences as Stage 0
  // One new idea: cache results in a dict; check before recursing
  // ═══════════════════════════════════════════════════════════
  {
    id: 7, stage: 1, title: "Fibonacci with Memoization", pattern: "top-down DP", skill: "cache → O(n)",
    statement: "Rewrite Fibonacci from P1 using memoization. Store computed F(k) in a dictionary. Before recursing, check the cache. If k is in the cache, return it immediately. What's the complexity now?",
    examples: [
      { input: "n = 35", output: "9227465", explain: "O(n) instead of O(2^n)" },
      { input: "n = 0", output: "0" },
    ],
    why: "The cure for Stage 0's waste. The memo dictionary is the 'journal' the function keeps. Each subproblem is computed exactly once. The call count goes from exponential to linear. This is the most important DP primitive.",
    starterCode: "def fib_memo(n):\n    memo = {}\n    def f(k):\n        pass\n    return f(n)",
    hints: [
      "Create a dict memo = {}. Helper function f(k) checks if k in memo first.",
      "Base cases: memo[0]=0, memo[1]=1 (or compute inline).",
      "Before each recursive call, check memo. After computing, store in memo."
    ],
    solution: "def fib_memo(n):\n    memo = {0: 0, 1: 1}\n    def f(k):\n        if k in memo:\n            return memo[k]\n        memo[k] = f(k - 1) + f(k - 2)\n        return memo[k]\n    return f(n)",
    walkthrough: "Three-line addition to P1: (1) check memo before recursing, (2) store result before returning. The recursion tree collapses from a full binary tree into a PATH — each k from n down to 0 is visited exactly once. O(n) time, O(n) space. The memo is the 'journal': 'I've seen k before, here's the answer.'",
    testCode: "assert fib_memo(0) == 0\nassert fib_memo(1) == 1\nassert fib_memo(5) == 5\nassert fib_memo(35) == 9227465\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Tribonacci with Memo", pattern: "top-down DP", skill: "same pattern, three branches",
    statement: "Memoize Tribonacci from P2. Three branches instead of two — but the memo makes it O(n) regardless. Prove: compute T(50) which naive would never finish.",
    examples: [
      { input: "n = 4", output: "4" },
      { input: "n = 37", output: "3122171529233" },
    ],
    why: "Demonstrate that the memo pattern doesn't care about branching factor. Two branches, three branches, k branches — with memo, each n is computed once. The O(3^n) → O(n) transformation is even more dramatic here.",
    starterCode: "def tribonacci_memo(n):\n    memo = {}\n    def t(k):\n        pass\n    return t(n)",
    hints: [
      "Pre-populate memo with base cases: 0→0, 1→1, 2→1.",
      "Same check: if k in memo, return memo[k].",
      "Memo[k] = t(k-1) + t(k-2) + t(k-3). Return memo[k]."
    ],
    solution: "def tribonacci_memo(n):\n    memo = {0: 0, 1: 1, 2: 1}\n    def t(k):\n        if k in memo:\n            return memo[k]\n        memo[k] = t(k - 1) + t(k - 2) + t(k - 3)\n        return memo[k]\n    return t(n)",
    walkthrough: "Identical memo pattern as P7. Only the recurrence changes (3 terms instead of 2). The skeleton: check memo, compute via recurrence, store, return. This is the universal top-down DP template. The branching factor barely matters — with memo, each k is visited once regardless of how many children it has.",
     testCode: "assert tribonacci_memo(0) == 0\nassert tribonacci_memo(1) == 1\nassert tribonacci_memo(2) == 1\nassert tribonacci_memo(4) == 4\nassert tribonacci_memo(37) == 2082876103\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Climbing Stairs with Memo", pattern: "top-down DP", skill: "map story recurrence + memo",
    statement: "Memoize the climbing stairs problem from P3. Now you can compute ways(100) instantly. Base: stairs(0)=1, stairs(1)=1.",
    examples: [
      { input: "n = 38", output: "63245986" },
      { input: "n = 4", output: "5" },
    ],
    why: "Reinforce: the memo pattern doesn't depend on the story. Same three lines — check, store, return — applied to the stair problem recurrence. Same O(n) complexity.",
    starterCode: "def climb_stairs_memo(n):\n    memo = {}\n    def ways(k):\n        pass\n    return ways(n)",
    hints: [
      "Base cases: memo[0]=1, memo[1]=1.",
      "Check memo first. If not there: ways(k) = ways(k-1) + ways(k-2).",
      "Store in memo before returning."
    ],
    solution: "def climb_stairs_memo(n):\n    memo = {0: 1, 1: 1}\n    def ways(k):\n        if k in memo:\n            return memo[k]\n        memo[k] = ways(k - 1) + ways(k - 2)\n        return memo[k]\n    return ways(n)",
    walkthrough: "Exactly the memo pattern from P7, applied to the stair recurrence from P3. The recurrence comes from the problem domain; the memo comes from the DP pattern. Together: top-down DP. The solution is the story (recurrence) + the journal (memo).",
    testCode: "assert climb_stairs_memo(0) == 1\nassert climb_stairs_memo(1) == 1\nassert climb_stairs_memo(4) == 5\nassert climb_stairs_memo(38) == 63245986\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Min Cost Climbing Stairs (Memo)", pattern: "top-down DP", skill: "min recurrence + memo",
    statement: "Given array cost where cost[i] is the cost of step i. You can start at step 0 or 1. Return minimum cost to reach the top (just past the last step). Each step you can climb 1 or 2 steps, paying that step's cost. Use memoization.",
    examples: [
      { input: "cost=[10,15,20]", output: "15", explain: "start at 1→pay 15, climb 2 to top. total=15" },
      { input: "cost=[1,100,1,1,1,100,1,1,100,1]", output: "6" },
    ],
    why: "First time the recurrence uses MIN instead of SUM. The combine operation changes but the memo skeleton is identical. DP recurrences use min/max/sum — the memo pattern doesn't care.",
    starterCode: "def min_cost_stairs(cost):\n    memo = {}\n    def mc(i):\n        pass\n    return mc(len(cost))",
    hints: [
      "Let mc(i) = min cost to reach step i. Base: mc(0)=0, mc(1)=0 (start free at 0 or 1).",
      "To reach step i: either from i-1 (pay cost[i-1]) or from i-2 (pay cost[i-2]).",
      "mc(i) = min(mc(i-1) + cost[i-1], mc(i-2) + cost[i-2]). Memoize."
    ],
    solution: "def min_cost_stairs(cost):\n    memo = {0: 0, 1: 0}\n    def mc(i):\n        if i in memo:\n            return memo[i]\n        memo[i] = min(mc(i - 1) + cost[i - 1], mc(i - 2) + cost[i - 2])\n        return memo[i]\n    return mc(len(cost))",
    walkthrough: "Same memo skeleton. New combine: min instead of sum. The recurrence now compares two paths and picks the cheaper one. The memo stores mc(i) — the best answer for subproblem i. The DP designer's job: define what the function returns (min cost to reach step i) and express it in terms of smaller subproblems.",
    testCode: "assert min_cost_stairs([10, 15, 20]) == 15\nassert min_cost_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]) == 6\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Count Ways with Obstacles (Memo)", pattern: "top-down DP", skill: "conditional recurrence + memo",
    statement: "You are at position 0 on a number line. You can jump 1 or 2 positions forward. Given a set of 'blocked' positions you cannot land on, return number of ways to reach position n. Use memoization.",
    examples: [
      { input: "n=5, blocked={3}", output: "5", explain: "ways to 5 avoiding position 3: methods that skip 3" },
      { input: "n=4, blocked={2}", output: "2" },
    ],
    why: "Memo pattern + constraint. The recurrence has an IF: if a position is blocked, ways=0. Shows that DP recurrences can incorporate domain constraints without changing the memo skeleton.",
    starterCode: "def count_ways_obstacles(n, blocked):\n    blocked_set = set(blocked)\n    memo = {}\n    def ways(pos):\n        pass\n    return ways(n)",
    hints: [
      "Base: pos == 0 → 1. pos < 0 → 0. pos in blocked_set → 0 (can't land here).",
      "ways(pos) = ways(pos-1) + ways(pos-2).",
      "Check memo before computing. Store after computing."
    ],
    solution: "def count_ways_obstacles(n, blocked):\n    blocked_set = set(blocked)\n    memo = {0: 1}\n    def ways(pos):\n        if pos < 0:\n            return 0\n        if pos in blocked_set:\n            return 0\n        if pos in memo:\n            return memo[pos]\n        memo[pos] = ways(pos - 1) + ways(pos - 2)\n        return memo[pos]\n    return ways(n)",
    walkthrough: "Same memo skeleton. The recurrence now has a gate: 'if blocked, answer is 0.' This pattern — recurrences with domain constraints — is fundamental. DP recurrences aren't pure math; they encode the problem's RULES. The memo still ensures each pos is computed once.",
     testCode: "assert count_ways_obstacles(5, [3]) == 2\nassert count_ways_obstacles(4, [2]) == 2\nassert count_ways_obstacles(3, []) == 3\nassert count_ways_obstacles(2, [1]) == 1\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 2 — State Design (6 problems)
  // Repeated mental model: top-down memo skeleton
  // One new idea: DESIGN the function signature and what the memo stores
  // ═══════════════════════════════════════════════════════════
  {
    id: 12, stage: 2, title: "Design State: Climb Stairs (Amnesia Test)", pattern: "state design", skill: "define what f(i) means",
    statement: "The 'amnesia test': if you woke up mid-computation and only saw the memo key '5' and its stored value, what must that value represent? For the climb-stairs problem, define exactly what ways(k) returns, then implement with memoization.",
    examples: [
      { input: "n = 5", output: "8" },
    ],
    why: "The core DP design question: 'what does the memo store?' If you can't answer this in one sentence, you haven't designed the state. Every DP problem reduces to this question. f(k) = 'number of distinct ways to reach step k from step 0'. That IS the state design.",
    starterCode: "def climb_stairs_state(n):\n    # State: ways(k) = number of ways to reach step k\n    memo = {}\n    def ways(k):\n        pass\n    return ways(n)",
    hints: [
      "The memo key IS the subproblem. What IS subproblem k?",
      "State: ways(k) = number of distinct ways to climb from step 0 to step k.",
      "Recurrence: ways(k) = ways(k-1) + ways(k-2). Base: ways(0)=1."
    ],
    solution: "def climb_stairs_state(n):\n    memo = {0: 1}\n    def ways(k):\n        if k < 0:\n            return 0\n        if k in memo:\n            return memo[k]\n        memo[k] = ways(k - 1) + ways(k - 2)\n        return memo[k]\n    return ways(n)",
    walkthrough: "State design = answering 'what does f(k) return?' Write it in one English sentence before any code. 'f(k) = number of distinct ways to reach step k.' The recurrence follows from that definition: you can arrive at k from k-1 or k-2. The state IS the definition. The code is just the definition made executable.",
    testCode: "assert climb_stairs_state(0) == 1\nassert climb_stairs_state(3) == 3\nassert climb_stairs_state(5) == 8\nassert climb_stairs_state(10) == 89\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Design State: House Robber", pattern: "state design", skill: "define state when choices exclude neighbors",
    statement: "Given array nums of house values, you cannot rob adjacent houses. Design the state: define what rob(i) returns. Then implement with memo. Hint: rob(i) is the max money you can steal from houses 0..i.",
    examples: [
      { input: "nums=[2,7,9,3,1]", output: "12", explain: "rob 2+9+1=12 (skip 7 and 3)" },
      { input: "nums=[1,2,3,1]", output: "4", explain: "rob 1+3=4" },
    ],
    why: "State design with exclusions. rob(i) = 'max money from first i houses'. The recurrence must handle 'do I take house i or skip it?' — if take, must skip i-1. The state definition determines the recurrence shape.",
    starterCode: "def rob(nums):\n    memo = {}\n    def rob_from(i):\n        pass\n    return rob_from(len(nums) - 1) if nums else 0",
    hints: [
      "State: rob_from(i) = max money you can steal from houses 0..i.",
      "At house i: either rob it → nums[i] + rob_from(i-2), or skip it → rob_from(i-1).",
      "Take the max of those two choices. Base: i < 0 → 0."
    ],
    solution: "def rob(nums):\n    if not nums:\n        return 0\n    memo = {}\n    def rob_from(i):\n        if i < 0:\n            return 0\n        if i in memo:\n            return memo[i]\n        take = nums[i] + rob_from(i - 2)\n        skip = rob_from(i - 1)\n        memo[i] = max(take, skip)\n        return memo[i]\n    return rob_from(len(nums) - 1)",
    walkthrough: "State: rob_from(i) = max from houses 0..i. Two choices at each house: TAKE (adds nums[i], skip i-1) or SKIP (just rob_from(i-1)). The max of two branches. This 'either take this element or skip it' recurrence is the fundamental building block of sequence DP.",
    testCode: "assert rob([2, 7, 9, 3, 1]) == 12\nassert rob([1, 2, 3, 1]) == 4\nassert rob([2, 1, 1, 2]) == 4\nassert rob([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Design State: Min Path Sum", pattern: "state design", skill: "2D state (i, j) coordinate",
    statement: "Given an m×n grid of non-negative numbers, start at top-left (0,0), end at bottom-right (m-1,n-1). You can only move right or down. Design the state: what does f(i,j) return? Then implement with memo.",
    examples: [
      { input: "grid=[[1,3,1],[1,5,1],[4,2,1]]", output: "7", explain: "1→3→1→1→1 = 7" },
    ],
    why: "State design goes 2D. f(i, j) = 'min path sum from (0,0) to (i,j).' The state is defined by TWO parameters. Most DP problems are 1D or 2D — the state design question is 'what values uniquely identify the subproblem?'",
    starterCode: "def min_path_sum(grid):\n    memo = {}\n    def f(i, j):\n        pass\n    return f(len(grid) - 1, len(grid[0]) - 1)",
    hints: [
      "State: f(i,j) = min sum from (0,0) to (i,j). Base: f(0,0) = grid[0][0].",
      "You can only come from above (i-1,j) or left (i,j-1).",
      "f(i,j) = grid[i][j] + min(f(i-1,j), f(i,j-1)). Handle out-of-bounds with float('inf')."
    ],
    solution: "def min_path_sum(grid):\n    if not grid or not grid[0]:\n        return 0\n    m, n = len(grid), len(grid[0])\n    memo = {}\n    def f(i, j):\n        if i == 0 and j == 0:\n            return grid[0][0]\n        if i < 0 or j < 0:\n            return float('inf')\n        if (i, j) in memo:\n            return memo[(i, j)]\n        memo[(i, j)] = grid[i][j] + min(f(i - 1, j), f(i, j - 1))\n        return memo[(i, j)]\n    return f(m - 1, n - 1)",
    walkthrough: "State uses tuple (i,j) as memo key — this is the 2D generalization. f(i,j) is defined by 'what is the minimum to reach cell (i,j)?' The recurrence: cell value + min(path from above, path from left). Boundary: cells outside grid return ∞ so they're never chosen. The state definition drives everything else.",
    testCode: "assert min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 7\nassert min_path_sum([[1, 2, 3], [4, 5, 6]]) == 12\nassert min_path_sum([[1]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Design State: Decode Ways", pattern: "state design", skill: "string index state + conditional branches",
    statement: "Message containing letters A-Z is encoded to numbers: 'A'→1, 'B'→2, ..., 'Z'→26. Given string s of digits, return number of ways to decode it. Design the state: what does f(i) return?",
    examples: [
      { input: "s='12'", output: "2", explain: "'AB' (1,2) or 'L' (12)" },
      { input: "s='226'", output: "3", explain: "'BBF' (2,2,6), 'BZ' (2,26), 'VF' (22,6)" },
    ],
    why: "State design with string index. f(i) = 'number of ways to decode s[i:]'. The recurrence has conditional branches: take 1 digit (if not '0') OR take 2 digits (if 10-26). The 'if' gates are part of the state design.",
    starterCode: "def num_decodings(s):\n    memo = {}\n    def f(i):\n        pass\n    return f(0)",
    hints: [
      "State: f(i) = number of ways to decode substring s[i:].",
      "At position i: can take 1 digit (if s[i] != '0') + can take 2 digits (if s[i:i+2] in 10..26).",
      "Base: i == len(s) → 1 (empty string, one way). s[i] == '0' → 0 (can't start with 0)."
    ],
    solution: "def num_decodings(s):\n    n = len(s)\n    memo = {n: 1}\n    def f(i):\n        if i in memo:\n            return memo[i]\n        if s[i] == '0':\n            memo[i] = 0\n            return 0\n        ways = f(i + 1)\n        if i + 1 < n and 10 <= int(s[i:i + 2]) <= 26:\n            ways += f(i + 2)\n        memo[i] = ways\n        return ways\n    return f(0)",
    walkthrough: "State: f(i) decodes s[i:]. Two branches: take 1 digit (if not '0'), take 2 digits (if 10-26). Both branches consume some prefix and recurse on the remainder. The 'if' conditions define which branches exist. State design = defining the subproblem + enumerating the valid transitions from it.",
    testCode: "assert num_decodings('12') == 2\nassert num_decodings('226') == 3\nassert num_decodings('06') == 0\nassert num_decodings('11106') == 2\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Design State: Coin Change", pattern: "state design", skill: "unbounded choice + min recurrence",
    statement: "Given coin denominations coins[] and target amount, return MINIMUM number of coins needed to make amount. Return -1 if impossible. Design the state: what does f(a) return?",
    examples: [
      { input: "coins=[1,2,5], amount=11", output: "3", explain: "5+5+1 = 3 coins" },
      { input: "coins=[2], amount=3", output: "-1", explain: "cannot make 3 with only 2s" },
    ],
    why: "State design with unbounded choices. f(a) = 'min coins to make amount a.' Each coin can be used multiple times — recurrence stays on the same coin index. The 'unbounded' vs '0/1' distinction is captured entirely in the state transition.",
    starterCode: "def coin_change(coins, amount):\n    memo = {}\n    def f(a):\n        pass\n    return f(amount)",
    hints: [
      "State: f(a) = minimum coins needed to make amount a. Base: f(0) = 0 (no coins for 0).",
      "For each coin c <= a: f(a) = min(f(a), 1 + f(a - c)). Try all coins.",
      "If no combination works, f(a) stays at infinity. Return -1 if f(amount) is inf."
    ],
    solution: "def coin_change(coins, amount):\n    memo = {0: 0}\n    def f(a):\n        if a < 0:\n            return float('inf')\n        if a in memo:\n            return memo[a]\n        best = float('inf')\n        for c in coins:\n            best = min(best, 1 + f(a - c))\n        memo[a] = best\n        return best\n    result = f(amount)\n    return -1 if result == float('inf') else result",
    walkthrough: "State: f(a) = min coins for amount a. At each a, try EVERY coin as the last coin used. f(a) = 1 + min(f(a-c) for all c). This 'try all choices' loop is the unbounded-knapsack recurrence. The state is one-dimensional (amount only) because coins can be reused — the coin index doesn't constrain future choices.",
    testCode: "assert coin_change([1, 2, 5], 11) == 3\nassert coin_change([2], 3) == -1\nassert coin_change([1], 0) == 0\nassert coin_change([186, 419, 83, 408], 6249)  # should return quickly with memo\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Design State: Longest Increasing Subsequence", pattern: "state design", skill: "index + prev constraint state",
    statement: "Given array nums, return length of the longest strictly increasing subsequence (LIS). Design the state: what does f(i) return? What about f(i, prev)? You'll need to track the 'last picked' element somehow.",
    examples: [
      { input: "nums=[10,9,2,5,3,7,101,18]", output: "4", explain: "[2,5,7,101] or [2,3,7,101]" },
      { input: "nums=[7,7,7,7]", output: "1" },
    ],
    why: "State design with a constraint: can only pick element if it's larger than the previous pick. This requires EITHER a second state dimension (prev_index) OR a different framing. The struggle to design the right state is the whole point.",
    starterCode: "def lis_naive(nums):\n    memo = {}\n    def f(i, prev):\n        pass\n    return f(0, float('-inf'))",
    hints: [
      "Try: f(i, prev_val) = LIS from index i onward, given last picked value is prev_val.",
      "At index i: skip nums[i] OR if nums[i] > prev_val, take it and recurse with nums[i] as new prev.",
      "This is a 2D recursion. Base: i == len(nums) → 0."
    ],
    solution: "def lis_naive(nums):\n    memo = {}\n    def f(i, prev_val):\n        if i == len(nums):\n            return 0\n        key = (i, prev_val)\n        if key in memo:\n            return memo[key]\n        skip = f(i + 1, prev_val)\n        take = 0\n        if nums[i] > prev_val:\n            take = 1 + f(i + 1, nums[i])\n        memo[key] = max(skip, take)\n        return memo[key]\n    return f(0, float('-inf'))",
    walkthrough: "State is 2D: (i, prev_val). Two choices at each index: SKIP this element, or TAKE it (only if it's larger than prev_val). This is the TAKE/SKIP pattern from P13 but with a conditional gate. The prev_val parameter chains the constraint forward. Recognizing that we need prev_val IS the state design insight.",
    testCode: "assert lis_naive([10, 9, 2, 5, 3, 7, 101, 18]) == 4\nassert lis_naive([7, 7, 7, 7]) == 1\nassert lis_naive([0, 1, 0, 3, 2, 3]) == 4\nassert lis_naive([]) == 0\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 3 — Tabulation (5 problems)
  // Repeated mental model: same recurrences from Stages 0-2
  // One new idea: flip the recursion — build from base cases UP
  // ═══════════════════════════════════════════════════════════
  {
    id: 18, stage: 3, title: "Fibonacci Tabulation", pattern: "bottom-up DP", skill: "array from 0..n",
    statement: "Rewrite Fibonacci using bottom-up tabulation. Create an array dp[0..n], fill dp[0]=0, dp[1]=1, then iterate i=2..n: dp[i] = dp[i-1] + dp[i-2]. Return dp[n]. No recursion at all.",
    examples: [
      { input: "n = 10", output: "55" },
      { input: "n = 50", output: "12586269025" },
    ],
    why: "Tabulation IS the recurrence, just evaluated in order. The dp table is the memo dict flipped: instead of asking 'what do I need?' (recursion), you ask 'what can I fill next?' (iteration). Same recurrence, different direction of computation.",
    starterCode: "def fib_tab(n):\n    pass",
    hints: [
      "Create dp array of size n+1. Set dp[0]=0, dp[1]=1.",
      "For i from 2 to n: dp[i] = dp[i-1] + dp[i-2].",
      "Return dp[n]."
    ],
    solution: "def fib_tab(n):\n    if n <= 1:\n        return n\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]",
    walkthrough: "Tabulation = flip the direction. Memo: 'f(5) needs f(4) and f(3), recurse down, cache on the way back up.' Tab: 'start at f(0) and f(1), compute f(2), then f(3)...until f(n).' The recurrence is identical — dp[i] = dp[i-1] + dp[i-2]. Only the evaluation ORDER changed. Tabulation is the recurrence in a for-loop.",
    testCode: "assert fib_tab(0) == 0\nassert fib_tab(1) == 1\nassert fib_tab(10) == 55\nassert fib_tab(50) == 12586269025\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Climbing Stairs Tabulation", pattern: "bottom-up DP", skill: "same recurrence, bottom-up direction",
    statement: "Convert the climb-stairs recurrence from P9 to tabulation. dp[i] = number of ways to reach step i. dp[0]=1, dp[1]=1. Fill dp[2..n] using dp[i]=dp[i-1]+dp[i-2].",
    examples: [
      { input: "n = 5", output: "8" },
      { input: "n = 45", output: "1836311903" },
    ],
    why: "Demonstrate the mechanical translation: top-down memo → bottom-up table. The recurrence doesn't change. The story doesn't change. Only the evaluation ORDER changes. This is a fluency drill.",
    starterCode: "def climb_stairs_tab(n):\n    pass",
    hints: [
      "dp[0] = 1, dp[1] = 1. Handle n=0 specially.",
      "For i in 2..n: dp[i] = dp[i-1] + dp[i-2].",
      "Return dp[n]."
    ],
    solution: "def climb_stairs_tab(n):\n    if n <= 1:\n        return 1\n    dp = [0] * (n + 1)\n    dp[0] = dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]",
    walkthrough: "Mechanical translation: the memo dict becomes a pre-sized array. The recursive call f(n-1) becomes dp[i-1]. The base cases memo[0]=1, memo[1]=1 become dp[0]=1, dp[1]=1. The for-loop fills the array left-to-right. Same answer, no recursion stack, O(n) time, O(n) space.",
    testCode: "assert climb_stairs_tab(0) == 1\nassert climb_stairs_tab(1) == 1\nassert climb_stairs_tab(5) == 8\nassert climb_stairs_tab(45) == 1836311903\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Min Cost Stairs Tabulation", pattern: "bottom-up DP", skill: "min recurrence in bottom-up",
    statement: "Convert the min-cost-climbing-stairs from P10 to tabulation. dp[i] = min cost to reach step i. dp[0]=dp[1]=0. For i=2..n: dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2]). Return dp[n].",
    examples: [
      { input: "cost=[10,15,20]", output: "15" },
      { input: "cost=[1,100,1,1,1,100,1,1,100,1]", output: "6" },
    ],
    why: "Reinforce that min recurrences tabulate the same way as sum recurrences. The combine operation (min vs +) doesn't change the tabulation skeleton.",
    starterCode: "def min_cost_stairs_tab(cost):\n    pass",
    hints: [
      "n = len(cost). dp size n+1. dp[0]=dp[1]=0.",
      "For i=2..n: dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2]).",
      "Return dp[n]."
    ],
    solution: "def min_cost_stairs_tab(cost):\n    n = len(cost)\n    dp = [0] * (n + 1)\n    for i in range(2, n + 1):\n        dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])\n    return dp[n]",
    walkthrough: "Same tabulation skeleton. Same recurrence from P10. The loop fills dp[2], dp[3], ..., dp[n]. Each dp[i] depends on dp[i-1] and dp[i-2] — which are already computed because we fill left-to-right. This is the key constraint of tabulation: the loop order must respect the dependency graph.",
    testCode: "assert min_cost_stairs_tab([10, 15, 20]) == 15\nassert min_cost_stairs_tab([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]) == 6\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 3, title: "Triangle Path Sum (Tab)", pattern: "bottom-up DP", skill: "2D tabulation from bottom row",
    statement: "Given a triangle array (like Pascal's triangle shape), find min path sum from top to bottom. Each step can go to adjacent number in the next row. Use bottom-up tabulation starting from the last row.",
    examples: [
      { input: "triangle=[[2],[3,4],[6,5,7],[4,1,8,3]]", output: "11", explain: "2→3→5→1 = 11" },
    ],
    why: "First 2D tabulation. Introduces the 'fill from bottom row' direction. Unlike 1D where we fill left-to-right, 2D requires choosing which row to start from. The dependency flows upward: each cell depends on the row below it.",
    starterCode: "def min_triangle_path(triangle):\n    pass",
    hints: [
      "Start with bottom row as initial dp. Then work upward row-by-row.",
      "For cell (r, c): dp[r][c] = triangle[r][c] + min(dp[r+1][c], dp[r+1][c+1]).",
      "After processing all rows, dp[0][0] is the answer."
    ],
    solution: "def min_triangle_path(triangle):\n    n = len(triangle)\n    dp = triangle[-1][:]\n    for r in range(n - 2, -1, -1):\n        for c in range(len(triangle[r])):\n            dp[c] = triangle[r][c] + min(dp[c], dp[c + 1])\n    return dp[0]",
    walkthrough: "2D tabulation direction: bottom-to-top. Start with last row as dp. For each cell above: value + min(two cells below). Because each cell only needs the row below it, we can reuse a single row array (space optimization preview). The key insight: dependencies flow upward, so iterate rows in reverse. This upward-fill pattern returns in unique-paths and edit-distance.",
    testCode: "assert min_triangle_path([[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]]) == 11\nassert min_triangle_path([[-10]]) == -10\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 3, title: "Unique Paths Tabulation", pattern: "bottom-up DP", skill: "2D table fill (row-by-row)",
    statement: "Given m×n grid, start top-left, end bottom-right. Only move right or down. Return number of unique paths. Fill a 2D dp table where dp[i][j] = paths to (i,j). dp[0][0]=1. dp[i][j] = dp[i-1][j] + dp[i][j-1].",
    examples: [
      { input: "m=3, n=7", output: "28" },
      { input: "m=3, n=3", output: "6" },
    ],
    why: "The canonical 2D table fill. Each cell depends on the cell above and the cell to the left. So fill row-by-row, left-to-right within each row. This TWO-SOURCE dependency pattern is universal in grid DP.",
    starterCode: "def unique_paths(m, n):\n    pass",
    hints: [
      "Create m×n dp table. dp[0][0] = 1.",
      "For each cell (i,j): if i>0, add dp[i-1][j]; if j>0, add dp[i][j-1].",
      "Return dp[m-1][n-1]."
    ],
    solution: "def unique_paths(m, n):\n    dp = [[0] * n for _ in range(m)]\n    dp[0][0] = 1\n    for i in range(m):\n        for j in range(n):\n            if i > 0:\n                dp[i][j] += dp[i - 1][j]\n            if j > 0:\n                dp[i][j] += dp[i][j - 1]\n    return dp[m - 1][n - 1]",
    walkthrough: "2D table fill. Order: for i in 0..m-1, for j in 0..n-1. This ensures dp[i-1][j] and dp[i][j-1] are already computed when we reach (i,j). The recurrence: paths to (i,j) = paths from above + paths from left. This two-source fill pattern is the basis for all grid DP — min path sum, max path sum, edit distance, LCS.",
    testCode: "assert unique_paths(3, 7) == 28\nassert unique_paths(3, 3) == 6\nassert unique_paths(1, 1) == 1\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 4 — Sequence DP Naive (6 problems)
  // Repeated mental model: take/skip recurrence from P13/P17
  // One new idea: state the recurrence, implement top-down, FEEL the O(2^n) waste
  // ═══════════════════════════════════════════════════════════
  {
    id: 23, stage: 4, title: "House Robber (Naive Recursion)", pattern: "take/skip DP", skill: "feel exponential waste on sequence",
    statement: "Implement House Robber from P13 but deliberately WITHOUT memoization. Let the O(2^n) be visible. rob(i) = max money from first i houses. rob(i) = max(nums[i] + rob(i-2), rob(i-1)). How does the call count grow?",
    examples: [
      { input: "nums=[2,7,9,3,1]", output: "12" },
      { input: "nums=[1,2,3,1]", output: "4" },
    ],
    why: "CONNECTION: P13 gave the memo solution. Now REMOVE the memo. Watch the exponential explosion return. The 'naive before optimal' sequence makes the optimization feel necessary. Same lesson trees taught: feel the waste, then eliminate it.",
    starterCode: "def rob_naive(nums):\n    def r(i):\n        pass\n    return r(len(nums) - 1) if nums else 0",
    hints: [
      "No memo dict. Pure recursion from P13 but without caching.",
      "At house i: take = nums[i] + r(i-2), skip = r(i-1). Return max.",
      "Base: i < 0 → 0. Watch: for 30 houses, this never finishes."
    ],
    solution: "def rob_naive(nums):\n    if not nums:\n        return 0\n    def r(i):\n        if i < 0:\n            return 0\n        take = nums[i] + r(i - 2)\n        skip = r(i - 1)\n        return max(take, skip)\n    return r(len(nums) - 1)",
    walkthrough: "Correct but O(2^n). Each house triggers TWO recursive calls. r(i-1) calls r(i-2) and r(i-3). r(i-2) is called from BOTH r(i) (via take) AND r(i-1) (via skip). Overlap explosion. The memo in P13 condensed this into O(n). Stage 5 will show the optimized bottom-up with two variables.",
    testCode: "assert rob_naive([2, 7, 9, 3, 1]) == 12\nassert rob_naive([1, 2, 3, 1]) == 4\nassert rob_naive([2, 1, 1, 2]) == 4\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "LIS (Naive Take/Skip Recursion)", pattern: "take/skip DP", skill: "2D naive: (i, prev) state",
    statement: "Implement LIS using the naive take/skip recursion from P17 but WITHOUT memo. f(i, prev) = LIS from index i given last-taken value is prev. Feel the 2D explosion — this is O(2^n) with large constants.",
    examples: [
      { input: "nums=[10,9,2,5,3,7,101,18]", output: "4" },
      { input: "nums=[1,2,3,4,5]", output: "5" },
    ],
    why: "2D naive without memo. The state has two parameters (i, prev) so the overlap is even denser than 1D. This wastes both time AND the student's patience — which is exactly the purpose of the Naive stage.",
    starterCode: "def lis_naive_nomemo(nums):\n    def f(i, prev):\n        pass\n    return f(0, float('-inf')) if nums else 0",
    hints: [
      "No memo. f(i, prev) = max(f(i+1, prev), 1 + f(i+1, nums[i]) if nums[i] > prev).",
      "Base: i == len(nums) → 0.",
      "For n=20, this is already >1M calls. The waste is massive."
    ],
    solution: "def lis_naive_nomemo(nums):\n    if not nums:\n        return 0\n    def f(i, prev):\n        if i == len(nums):\n            return 0\n        skip = f(i + 1, prev)\n        take = 0\n        if nums[i] > prev:\n            take = 1 + f(i + 1, nums[i])\n        return max(skip, take)\n    return f(0, float('-inf'))",
    walkthrough: "2D recursion without memo. Each position has two choices, but the prev parameter explodes the state space: f(1, 10) and f(1, 9) are separate calls even though i is the same. Same subproblem (same i, same prev) is hit via many paths. The memo in P17 was crucial — without it, this is exponential and impractical beyond n≈25.",
    testCode: "assert lis_naive_nomemo([10, 9, 2, 5, 3, 7, 101, 18]) == 4\nassert lis_naive_nomemo([1, 2, 3, 4, 5]) == 5\nassert lis_naive_nomemo([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "Decode Ways (Naive Recursion)", pattern: "sequence DP", skill: "string exhaustion via recursion",
    statement: "Implement decode-ways from P15 without memo. f(i) = ways to decode s[i:]. Two branches: take 1 digit, take 2 digits (if valid). The overlap is subtler here — but present whenever the same suffix is reachable via different paths.",
    examples: [
      { input: "s='12'", output: "2" },
      { input: "s='226'", output: "3" },
    ],
    why: "Demonstrate that even single-parameter recurrences can have overlap. f(3) might be reached by taking '2' then '26' OR by taking '22' then '6'. Same subproblem, different paths. This is waste.",
    starterCode: "def decode_ways_naive(s):\n    def ways(i):\n        pass\n    return ways(0)",
    hints: [
      "No memo. ways(i): if s[i]=='0' → 0. Otherwise ways(i+1) + (ways(i+2) if s[i:i+2] in 10..26).",
      "Base: i == len(s) → 1.",
      "Trace for s='111': ways(0) calls ways(1) and ways(2). ways(1) also calls ways(2). OVERLAP."
    ],
    solution: "def decode_ways_naive(s):\n    n = len(s)\n    def ways(i):\n        if i == n:\n            return 1\n        if s[i] == '0':\n            return 0\n        result = ways(i + 1)\n        if i + 1 < n and 10 <= int(s[i:i + 2]) <= 26:\n            result += ways(i + 2)\n        return result\n    return ways(0)",
    walkthrough: "Even 1D recurrences can overlap. For '111': ways(0)→ways(1) and ways(2); ways(1)→ways(2). ways(2) is called TWICE. For longer strings with many 1s/2s, the overlap multiplies. The waste is real even when the state is simple — overlap depends on whether MULTIPLE PATHS lead to the same subproblem.",
    testCode: "assert decode_ways_naive('12') == 2\nassert decode_ways_naive('226') == 3\nassert decode_ways_naive('06') == 0\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 4, title: "Max Subarray Sum (Naive Recursion)", pattern: "subarray DP", skill: "O(n²) naive: try all subarrays",
    statement: "Given array nums, find max sum of CONTIGUOUS subarray. Write a naive recursive function brute(i) that returns max subarray sum for subarrays STARTING at i. Call for all i=0..n-1. O(n²) with no memo.",
    examples: [
      { input: "nums=[-2,1,-3,4,-1,2,1,-5,4]", output: "6", explain: "[4,-1,2,1] = 6" },
      { input: "nums=[5,4,-1,7,8]", output: "23", explain: "whole array = 23" },
    ],
    why: "Deliberate waste: for each start index i, recursively compute max subarray starting at i. No caching. The waste is that ending-at-j computations are repeated for every i < j. This sets up Kadane's insight: track best ending at i.",
    starterCode: "def max_subarray_naive(nums):\n    def from(i, cur_sum):\n        pass\n    best = float('-inf')\n    for i in range(len(nums)):\n        best = max(best, from(i, nums[i]))\n    return best",
    hints: [
      "Helper from(i, cur_sum): at each step, either extend subarray (add nums[i+1]) or stop.",
      "Or simpler: for each start i, iterate j from i..n-1 accumulating sum, track max.",
      "Either way: O(n²). The waste is in recomputing suffixes."
    ],
    solution: "def max_subarray_naive(nums):\n    best = float('-inf')\n    for i in range(len(nums)):\n        cur = 0\n        for j in range(i, len(nums)):\n            cur += nums[j]\n            best = max(best, cur)\n    return best",
    walkthrough: "O(n²) brute force: for each start position, accumulate sums for all end positions. The suffix sums starting at j are recomputed for every i < j. Kadane's algorithm (Stage 5) fixes this by asking: 'what is the best sum ENDING at position i?' — a single question whose answer builds on the answer for i-1.",
    testCode: "assert max_subarray_naive([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6\nassert max_subarray_naive([5, 4, -1, 7, 8]) == 23\nassert max_subarray_naive([-1]) == -1\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 4, title: "Max Product Subarray (Naive)", pattern: "subarray DP", skill: "O(n²) product version",
    statement: "Given array nums, find max PRODUCT of contiguous subarray. Use O(n²) brute force (try all start/end pairs). Note: negatives make this tricky — a negative × negative = positive. But brute force still works (slowly).",
    examples: [
      { input: "nums=[2,3,-2,4]", output: "6", explain: "[2,3] = 6" },
      { input: "nums=[-2,0,-1]", output: "0" },
    ],
    why: "Same O(n²) waste pattern as P26. For product, the trickiness (negatives flipping sign) makes the optimized solution more interesting — but the naive solution doesn't care. Just multiply everything. This contrast sets up the 'track both min and max' insight in Stage 5.",
    starterCode: "def max_product_naive(nums):\n    pass",
    hints: [
      "For each start i: compute product for all j from i to end. Track max.",
      "O(n²) double loop. Multiply as you go.",
      "Works but slow. What information are we recomputing?"
    ],
    solution: "def max_product_naive(nums):\n    best = float('-inf')\n    for i in range(len(nums)):\n        cur = 1\n        for j in range(i, len(nums)):\n            cur *= nums[j]\n            best = max(best, cur)\n    return best",
    walkthrough: "Same O(n²) as P26. For each start i, accumulate product for all end positions j. The waste: product from i to j is recomputed from scratch even though product from i to j-1 was already computed. The optimized solution (Stage 5) will maintain running min and max products ending at each position.",
    testCode: "assert max_product_naive([2, 3, -2, 4]) == 6\nassert max_product_naive([-2, 0, -1]) == 0\nassert max_product_naive([-2, 3, -4]) == 24\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 4, title: "Jump Game (Naive Recursion)", pattern: "reachability DP", skill: "branch per jump length",
    statement: "Given array nums where nums[i] is max jump length from position i, return True if you can reach the last index starting from 0. Use naive recursion: at each i, try every possible jump length 1..nums[i].",
    examples: [
      { input: "nums=[2,3,1,1,4]", output: "True" },
      { input: "nums=[3,2,1,0,4]", output: "False" },
    ],
    why: "Naive branching: at each position, try every possible jump. The branching factor is data-driven (nums[i]). Without memo, this explores an exponential number of paths — many reaching the same index via different routes.",
    starterCode: "def can_jump_naive(nums):\n    def can_reach(i):\n        pass\n    return can_reach(0)",
    hints: [
      "Helper can_reach(i): if i >= last index, return True.",
      "For jump lengths 1..nums[i]: if can_reach(i+jump), return True.",
      "Without memo, same index can be visited via many paths. Exponential waste."
    ],
    solution: "def can_jump_naive(nums):\n    n = len(nums)\n    def can_reach(i):\n        if i >= n - 1:\n            return True\n        for jump in range(1, nums[i] + 1):\n            if can_reach(i + jump):\n                return True\n        return False\n    return can_reach(0)",
    walkthrough: "Naive recursion: at index i, branch for every possible jump length. Many paths converge on the same indices. Without memo, dfs(i) may be called repeatedly for the same i via different jump sequences. The waste: O(n * max_jump^n) worst case. Stage 5 optimizes to O(n) with a greedy/reachability insight.",
    testCode: "assert can_jump_naive([2, 3, 1, 1, 4]) == True\nassert can_jump_naive([3, 2, 1, 0, 4]) == False\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 5 — Sequence DP Optimized (6 problems)
  // Repeated mental model: recurrences from Stage 4
  // One new idea: ending-at-i trick — define state as 'best ending at position i'
  // ═══════════════════════════════════════════════════════════
  {
    id: 29, stage: 5, title: "House Robber (Optimized 2-State)", pattern: "sequence DP (2-state)", skill: "O(1) space with two variables",
    statement: "Optimize House Robber: use bottom-up with just TWO variables (prev1, prev2). prev1 = rob(i-1), prev2 = rob(i-2). Loop through houses once. This is O(n) time, O(1) space.",
    examples: [
      { input: "nums=[2,7,9,3,1]", output: "12" },
      { input: "nums=[1,2,3,1]", output: "4" },
    ],
    why: "CONNECTION: P23 was O(2^n) naive. P13 was O(n) memo. This is O(n) O(1). The recurrence rob(i) = max(nums[i] + rob(i-2), rob(i-1)) only needs the LAST TWO values. The dp table collapses into two variables.",
    starterCode: "def rob_opt(nums):\n    pass",
    hints: [
      "If nums is empty, return 0.",
      "Prev2 = 0 (rob(i-2)), prev1 = nums[0] (rob(0)).",
      "For i=1..n-1: cur = max(nums[i] + prev2, prev1). Then shift: prev2=prev1, prev1=cur."
    ],
    solution: "def rob_opt(nums):\n    if not nums:\n        return 0\n    if len(nums) == 1:\n        return nums[0]\n    prev2 = 0\n    prev1 = nums[0]\n    for i in range(1, len(nums)):\n        cur = max(nums[i] + prev2, prev1)\n        prev2 = prev1\n        prev1 = cur\n    return prev1",
    walkthrough: "Space optimization: the recurrence dp[i] = max(nums[i] + dp[i-2], dp[i-1]) only needs dp[i-1] and dp[i-2]. We don't need the entire dp array — just the last two values, sliding forward. This is the 'two-variable' pattern: identify how far back the recurrence looks, keep only that many variables. Fibonacci uses two variables; tribonacci uses three.",
    testCode: "assert rob_opt([2, 7, 9, 3, 1]) == 12\nassert rob_opt([1, 2, 3, 1]) == 4\nassert rob_opt([2, 1, 1, 2]) == 4\nassert rob_opt([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "LIS with Ending-at-i (O(n²))", pattern: "ending-at-i DP", skill: "dp[i] = longest ending AT i",
    statement: "Optimize LIS: instead of take/skip (O(2^n)), define dp[i] = length of longest increasing subsequence ENDING at index i. dp[i] = 1 + max(dp[j] for j < i where nums[j] < nums[i]). Return max(dp).",
    examples: [
      { input: "nums=[10,9,2,5,3,7,101,18]", output: "4" },
      { input: "nums=[0,1,0,3,2,3]", output: "4" },
    ],
    why: "THE 'ending-at-i' trick. Instead of take/skip at each index, define the state as 'what's the best subsequence that ENDS here?' This reduces the state from 2D (i, prev) to 1D (i only). Then scan backward to extend previous sequences.",
    starterCode: "def lis_opt(nums):\n    pass",
    hints: [
      "If nums is empty, return 0. dp[i] = 1 initially (each element alone is a subsequence).",
      "For i=1..n-1: check all j < i. If nums[j] < nums[i], dp[i] = max(dp[i], 1 + dp[j]).",
      "Return max(dp)."
    ],
    solution: "def lis_opt(nums):\n    if not nums:\n        return 0\n    n = len(nums)\n    dp = [1] * n\n    for i in range(n):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                dp[i] = max(dp[i], 1 + dp[j])\n    return max(dp)",
    walkthrough: "The 'ending-at-i' state redesign: dp[i] = best LIS that ends with nums[i]. To compute dp[i], scan all j < i: if nums[j] < nums[i], we can extend the subsequence ending at j. dp[i] = 1 + max(dp[j] | j < i, nums[j] < nums[i]). This is the canonical O(n²) LIS. The state collapsed from 2D to 1D by anchoring the 'end' — this is the fundamental DP state-design trick.",
    testCode: "assert lis_opt([10, 9, 2, 5, 3, 7, 101, 18]) == 4\nassert lis_opt([0, 1, 0, 3, 2, 3]) == 4\nassert lis_opt([7, 7, 7, 7]) == 1\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 5, title: "Decode Ways O(n)", pattern: "sequence DP (1D)", skill: "tabulation with two-lookback",
    statement: "Implement Decode Ways as O(n) tabulation. dp[i] = ways to decode s[i:]. dp[n]=1. For i=n-1..0: dp[i] = dp[i+1] (if s[i]!='0') + dp[i+2] (if s[i:i+2] in 10..26). Return dp[0].",
    examples: [
      { input: "s='12'", output: "2" },
      { input: "s='226'", output: "3" },
    ],
    why: "O(n) tabulation version of P25. Fill dp from right to left (base case at the right end). The recurrence only looks ahead 2 positions — can space-optimize to two variables.",
    starterCode: "def decode_ways_opt(s):\n    pass",
    hints: [
      "dp array of size n+1. dp[n] = 1 (empty suffix).",
      "Iterate i from n-1 down to 0. If s[i]=='0', dp[i]=0.",
      "Otherwise: dp[i] = dp[i+1] + (dp[i+2] if s[i:i+2] in 10..26 else 0)."
    ],
    solution: "def decode_ways_opt(s):\n    n = len(s)\n    dp = [0] * (n + 1)\n    dp[n] = 1\n    for i in range(n - 1, -1, -1):\n        if s[i] == '0':\n            dp[i] = 0\n        else:\n            dp[i] = dp[i + 1]\n            if i + 1 < n and 10 <= int(s[i:i + 2]) <= 26:\n                dp[i] += dp[i + 2]\n    return dp[0]",
    walkthrough: "Fill direction: RIGHT to LEFT. Base at the right (empty suffix = 1 way). Then each position builds on suffixes to its right. This right-to-left fill is common when recurrences reference i+1, i+2. Space optimization: keep dp[i+2] and dp[i+1] in two variables, slide left.",
    testCode: "assert decode_ways_opt('12') == 2\nassert decode_ways_opt('226') == 3\nassert decode_ways_opt('06') == 0\nassert decode_ways_opt('11106') == 2\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 5, title: "Max Subarray (Kadane's Algorithm)", pattern: "ending-at-i DP", skill: "dp[i] = best ending AT i",
    statement: "Kadane's algorithm: dp[i] = max subarray sum ENDING at position i. dp[i] = max(nums[i], dp[i-1] + nums[i]). Because the best subarray ending at i either extends the previous subarray or starts fresh. Return max(dp). Space-optimize to one variable.",
    examples: [
      { input: "nums=[-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "nums=[5,4,-1,7,8]", output: "23" },
    ],
    why: "THE ending-at-i trick in its purest form. dp[i] = best subarray ENDING at i. This one-line recurrence is the opposite of P26's O(n²) brute force. The insight: the best ending at i is either nums[i] alone OR extended from the best ending at i-1.",
    starterCode: "def max_subarray(nums):\n    pass",
    hints: [
      "cur = nums[0], best = nums[0].",
      "For i=1..n-1: cur = max(nums[i], cur + nums[i]). best = max(best, cur).",
      "The recurrence: extend if cur+nums[i] > nums[i], else start fresh."
    ],
    solution: "def max_subarray(nums):\n    cur = best = nums[0]\n    for i in range(1, len(nums)):\n        cur = max(nums[i], cur + nums[i])\n        best = max(best, cur)\n    return best",
    walkthrough: "The ending-at-i trick: dp[i] = best subarray ending at position i. Two choices: extend previous subarray (cur + nums[i]) OR start a new one (nums[i] alone). Pick the better. Track global max across all ending positions. O(n) time, O(1) space. This is Kadane's — the algorithm that launched a thousand DP insights.",
    testCode: "assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6\nassert max_subarray([5, 4, -1, 7, 8]) == 23\nassert max_subarray([-1]) == -1\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 5, title: "Jump Game (Greedy O(n))", pattern: "reachability DP", skill: "track max_reachable",
    statement: "Optimize Jump Game: instead of branching recursion (P28), maintain max_reachable index. Iterate through array: if i > max_reachable, return False. Otherwise, update max_reachable = max(max_reachable, i + nums[i]). O(n) one pass.",
    examples: [
      { input: "nums=[2,3,1,1,4]", output: "True" },
      { input: "nums=[3,2,1,0,4]", output: "False" },
    ],
    why: "Not all DP requires a table. This is a reachability DP that collapses to a single variable: the farthest index you can reach so far. The optimization eliminates the dp array by observing it's monotonic.",
    starterCode: "def can_jump(nums):\n    pass",
    hints: [
      "Track reach = 0 (farthest reachable index).",
      "For i=0..n-1: if i > reach, return False. reach = max(reach, i + nums[i]).",
      "If we get through the loop without returning False, return True."
    ],
    solution: "def can_jump(nums):\n    reach = 0\n    for i in range(len(nums)):\n        if i > reach:\n            return False\n        reach = max(reach, i + nums[i])\n    return True",
    walkthrough: "The observation: reachability is monotonic. If you can reach index i, you can reach all indices before i. So we only need one variable: farthest reachable so far. At each position, if we're past our reach, we're stuck. Otherwise, extend reach. O(n) time, O(1) space. The DP recurrence collapsed into a greedy update.",
    testCode: "assert can_jump([2, 3, 1, 1, 4]) == True\nassert can_jump([3, 2, 1, 0, 4]) == False\nassert can_jump([0]) == True\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 5, title: "Max Product Subarray", pattern: "ending-at-i DP (dual)", skill: "track min AND max ending at i",
    statement: "Max product subarray — optimized. At each position, track BOTH max product ending here AND min product ending here (because a negative × min could become the new max). cur_max = max(nums[i], cur_max * nums[i], cur_min * nums[i]). Same for cur_min.",
    examples: [
      { input: "nums=[2,3,-2,4]", output: "6" },
      { input: "nums=[-2,0,-1]", output: "0" },
    ],
    why: "The ending-at-i trick with a twist: track TWO values (max and min) because multiplication with negatives can flip the sign. This is the 'dual-state' variant of ending-at-i. Same pattern as Kadane (P32) but with an extra variable.",
    starterCode: "def max_product(nums):\n    pass",
    hints: [
      "cur_max = cur_min = best = nums[0].",
      "For i=1..n-1: temp = cur_max (needed because cur_max changes). new_max = max(nums[i], cur_max*nums[i], cur_min*nums[i]). new_min = min(nums[i], temp*nums[i], cur_min*nums[i]).",
      "Update best = max(best, new_max)."
    ],
    solution: "def max_product(nums):\n    cur_max = cur_min = best = nums[0]\n    for i in range(1, len(nums)):\n        temp = cur_max\n        cur_max = max(nums[i], cur_max * nums[i], cur_min * nums[i])\n        cur_min = min(nums[i], temp * nums[i], cur_min * nums[i])\n        best = max(best, cur_max)\n    return best",
    walkthrough: "Kadane's for product requires tracking the MINIMUM ending at i too, because a negative number times the minimum negative becomes a large positive. At each step: new_max = max(nums[i], cur_max*nums[i], cur_min*nums[i]). Same for min. The 'dual-state ending-at-i' pattern: when the operation isn't monotonic (product with negatives), track BOTH extremes.",
    testCode: "assert max_product([2, 3, -2, 4]) == 6\nassert max_product([-2, 0, -1]) == 0\nassert max_product([-2, 3, -4]) == 24\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 6 — Mastery: Grid & String DP Naive
  // Repeated mental model: 2D recursion (like P14 min-path)
  // One new idea: two-sequence recurrence — i vs j progressing independently
  // ═══════════════════════════════════════════════════════════
  {
    id: 35, stage: 6, title: "Unique Paths (Naive Recursion)", pattern: "2D grid DP", skill: "feel 2D recursion waste",
    statement: "Implement unique-paths from P22 using PURE recursion (no memo, no table). f(i,j) = paths from (0,0) to (i,j). f(i,j) = f(i-1,j) + f(i,j-1). f(0,0)=1. Watch the combinatorial explosion — this is O(2^(m+n)).",
    examples: [
      { input: "m=3, n=3", output: "6" },
      { input: "m=3, n=7", output: "28" },
    ],
    why: "2D naive recursion. Same structure as Fibonacci — two recursive calls per cell — but in 2D. The waste is identical: same (i,j) reached via multiple paths. This sets up the tabulation fix in Stage 7.",
    starterCode: "def unique_paths_naive(m, n):\n    def f(i, j):\n        pass\n    return f(m - 1, n - 1)",
    hints: [
      "f(i,j): paths from (0,0) to (i,j). Base: (0,0) → 1. Out of bounds → 0.",
      "f(i,j) = f(i-1, j) + f(i, j-1).",
      "Without memo: f(2,2) is called many times. Exponential."
    ],
    solution: "def unique_paths_naive(m, n):\n    def f(i, j):\n        if i == 0 and j == 0:\n            return 1\n        if i < 0 or j < 0:\n            return 0\n        return f(i - 1, j) + f(i, j - 1)\n    return f(m - 1, n - 1)",
    walkthrough: "2D equivalent of Fibonacci. Each cell (i,j) calls f(i-1,j) and f(i,j-1). Many paths converge on the same cell — f(2,3) is called from f(3,3) AND from f(2,4). The recurrence tree is a grid of overlapping calls. O(2^(m+n)) time. This is the waste that 2D tabulation eliminates in Stage 7.",
    testCode: "assert unique_paths_naive(3, 3) == 6\nassert unique_paths_naive(3, 7) == 28\nassert unique_paths_naive(1, 1) == 1\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 6, title: "Min Path Sum (Naive Recursion)", pattern: "2D grid DP", skill: "exponential waste on min-path",
    statement: "Implement min-path-sum from P14 using pure recursion (no memo). f(i,j) = grid[i][j] + min(f(i-1,j), f(i,j-1)). Same waste pattern as P35 — feel it before the optimization.",
    examples: [
      { input: "grid=[[1,3,1],[1,5,1],[4,2,1]]", output: "7" },
    ],
    why: "2D naive with min instead of sum. Same exponential waste. The recurrence is structurally identical to P35 — only the combine operation (min vs +) differs. Same lesson: feel the 2D blowup before Stage 7 fixes it.",
    starterCode: "def min_path_sum_naive(grid):\n    def f(i, j):\n        pass\n    return f(len(grid) - 1, len(grid[0]) - 1)",
    hints: [
      "f(i,j): min sum from (0,0) to (i,j). Base: (0,0) → grid[0][0].",
      "f(i,j) = grid[i][j] + min(f(i-1,j), f(i,j-1)). Handle bounds with float('inf').",
      "No memo — same cell called many times."
    ],
    solution: "def min_path_sum_naive(grid):\n    if not grid or not grid[0]:\n        return 0\n    m, n = len(grid), len(grid[0])\n    def f(i, j):\n        if i == 0 and j == 0:\n            return grid[0][0]\n        if i < 0 or j < 0:\n            return float('inf')\n        return grid[i][j] + min(f(i - 1, j), f(i, j - 1))\n    return f(m - 1, n - 1)",
    walkthrough: "Same 2D recursion as P35. Each cell branches to the cell above and left. Overlap: f(2,3) is needed by both f(3,3) and f(2,4). Exponential calls. The memo in P14 fixed this; the tabulation in Stage 7 will fix it bottom-up. The waste pattern is identical across ALL 2D recurrences — only the grid shape and combine operation change.",
    testCode: "assert min_path_sum_naive([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 7\nassert min_path_sum_naive([[1, 2], [1, 1]]) == 3\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 6, title: "Edit Distance (Naive Recursion)", pattern: "two-string DP", skill: "three-branch recursion on two indices",
    statement: "Given strings word1 and word2, return minimum number of operations (insert, delete, replace) to convert word1 to word2. Write naive recursion: f(i,j) = edit distance for word1[i:] and word2[j:]. Three branches per call.",
    examples: [
      { input: "word1='horse', word2='ros'", output: "3", explain: "horse→rorse→rose→ros (3 ops)" },
      { input: "word1='intention', word2='execution'", output: "5" },
    ],
    why: "The canonical two-string DP problem. Three recursive branches (insert, delete, replace). The state is (i,j) — the suffix starts. Similar to 2D grid but the branching is RICHER. The waste: same (i,j) reached via different edit sequences.",
    starterCode: "def edit_distance_naive(w1, w2):\n    def f(i, j):\n        pass\n    return f(0, 0)",
    hints: [
      "f(i,j) = min ops for w1[i:] → w2[j:]. Base: if i==len(w1) → len(w2)-j (insert rest). If j==len(w2) → len(w1)-i (delete rest).",
      "If w1[i]==w2[j]: f(i,j) = f(i+1, j+1). Else: min of delete (1+f(i+1,j)), insert (1+f(i,j+1)), replace (1+f(i+1,j+1)).",
      "Three branches. O(3^(m+n)) without memo."
    ],
    solution: "def edit_distance_naive(w1, w2):\n    def f(i, j):\n        if i == len(w1):\n            return len(w2) - j\n        if j == len(w2):\n            return len(w1) - i\n        if w1[i] == w2[j]:\n            return f(i + 1, j + 1)\n        delete = 1 + f(i + 1, j)\n        insert = 1 + f(i, j + 1)\n        replace = 1 + f(i + 1, j + 1)\n        return min(delete, insert, replace)\n    return f(0, 0)",
    walkthrough: "Two-string DP with three branches. State: (i,j) = position in each string. Three operations: delete w1[i] (advance i), insert w2[j] into w1 (advance j), replace w1[i] with w2[j] (advance both). When characters match, no cost — advance both. O(3^(m+n)) without memo. This is the problem that made DP famous (Wagner-Fischer).",
    testCode: "assert edit_distance_naive('horse', 'ros') == 3\nassert edit_distance_naive('intention', 'execution') == 5\nassert edit_distance_naive('', 'abc') == 3\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 6, title: "LCS (Naive Recursion)", pattern: "two-string DP", skill: "match/skip recursion on two indices",
    statement: "Longest Common Subsequence. Given s1, s2, return length of LCS. Write naive recursion: f(i,j) = LCS of s1[i:] and s2[j:]. If s1[i]==s2[j]: 1+f(i+1,j+1). Else: max(f(i+1,j), f(i,j+1)).",
    examples: [
      { input: "s1='abcde', s2='ace'", output: "3", explain: "'ace'" },
      { input: "s1='abc', s2='def'", output: "0" },
    ],
    why: "Another canonical two-string DP. The recurrence is simpler than edit distance (2 branches vs 3), but the waste is identical: same (i,j) reached via many match/skip sequences. O(2^(m+n)).",
    starterCode: "def lcs_naive(s1, s2):\n    def f(i, j):\n        pass\n    return f(0, 0)",
    hints: [
      "f(i,j) = LCS of s1[i:] and s2[j:]. Base: either i==len(s1) or j==len(s2) → 0.",
      "If chars match: 1 + f(i+1, j+1). Else: max(f(i+1, j), f(i, j+1)).",
      "Two branches. Exponential without memo."
    ],
    solution: "def lcs_naive(s1, s2):\n    def f(i, j):\n        if i == len(s1) or j == len(s2):\n            return 0\n        if s1[i] == s2[j]:\n            return 1 + f(i + 1, j + 1)\n        return max(f(i + 1, j), f(i, j + 1))\n    return f(0, 0)",
    walkthrough: "Two-string DP with two branches. State: (i,j). Match → consume both (1+). No match → skip one character from EITHER string. The two-branch structure is simpler than edit distance but the overlap is the same: f(2,3) is reached via (skip s1[1], skip s2[2]) and via (match then skip s2)... many paths, same cell.",
    testCode: "assert lcs_naive('abcde', 'ace') == 3\nassert lcs_naive('abc', 'def') == 0\nassert lcs_naive('abc', 'abc') == 3\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 6, title: "Longest Palindromic Subsequence (Naive)", pattern: "interval DP", skill: "two-pointer recursion on single string",
    statement: "Given string s, return length of longest palindromic subsequence. Use naive recursion: f(i,j) = LPS of s[i..j] (inclusive). If s[i]==s[j]: 2+f(i+1,j-1). Else: max(f(i+1,j), f(i,j-1)). Base: i>j→0, i==j→1.",
    examples: [
      { input: "s='bbbab'", output: "4", explain: "'bbbb' is the LPS" },
      { input: "s='cbbd'", output: "2", explain: "'bb'" },
    ],
    why: "Interval DP — two pointers on the SAME string moving inward. The recurrence structure is identical to LCS (match/skip) but the indices represent a shrinking interval rather than two separate strings.",
    starterCode: "def lps_naive(s):\n    def f(i, j):\n        pass\n    return f(0, len(s) - 1) if s else 0",
    hints: [
      "f(i,j) = LPS length in s[i..j]. Base: i>j→0, i==j→1.",
      "If s[i]==s[j]: 2 + f(i+1, j-1). Else: max(f(i+1, j), f(i, j-1)).",
      "This is LCS applied to a string and its reverse — same recurrence structure."
    ],
    solution: "def lps_naive(s):\n    if not s:\n        return 0\n    def f(i, j):\n        if i > j:\n            return 0\n        if i == j:\n            return 1\n        if s[i] == s[j]:\n            return 2 + f(i + 1, j - 1)\n        return max(f(i + 1, j), f(i, j - 1))\n    return f(0, len(s) - 1)",
    walkthrough: "Interval DP: two pointers i, j moving inward on the same string. State: f(i,j) = LPS in substring s[i..j]. Match: both ends equal → 2 + inner LPS. No match: skip left end OR skip right end. This is structurally identical to LCS (s with its reverse). Same O(2^n) waste. Tabulation in Stage 7 will fill a half-table.",
    testCode: "assert lps_naive('bbbab') == 4\nassert lps_naive('cbbd') == 2\nassert lps_naive('a') == 1\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 6 — Mastery: Grid & String DP Optimized
  // Repeated mental model: 2D recurrences from above
  // One new idea: table as product — fill dp[i][j] bottom-up, row by row
  // ═══════════════════════════════════════════════════════════
  {
    id: 40, stage: 6, title: "Unique Paths Tabulation O(mn)", pattern: "2D table fill", skill: "fill dp[i][j] from top-left",
    statement: "Convert P35 to tabulation. dp[i][j] = paths to (i,j). Fill row-by-row: dp[i][j] = dp[i-1][j] + dp[i][j-1]. Can also space-optimize to O(n): each row only needs the row above.",
    examples: [
      { input: "m=3, n=7", output: "28" },
      { input: "m=3, n=3", output: "6" },
    ],
    why: "2D tabulation is a direct translation of the 2D recurrence. Fill in dependency order: top-left to bottom-right. The waste from P35 (exponential recomputation) is now eliminated — each cell computed once.",
    starterCode: "def unique_paths_tab(m, n):\n    pass",
    hints: [
      "Create m×n dp table, all 0. dp[0][0] = 1.",
      "For i=0..m-1, j=0..n-1: if i>0 add dp[i-1][j]; if j>0 add dp[i][j-1].",
      "Return dp[m-1][n-1]."
    ],
    solution: "def unique_paths_tab(m, n):\n    dp = [[0] * n for _ in range(m)]\n    dp[0][0] = 1\n    for i in range(m):\n        for j in range(n):\n            if i > 0:\n                dp[i][j] += dp[i - 1][j]\n            if j > 0:\n                dp[i][j] += dp[i][j - 1]\n    return dp[m - 1][n - 1]",
    walkthrough: "Tabulation = the recurrence in a nested for-loop. Fill dp[i][j] = dp[i-1][j] + dp[i][j-1] in order that respects dependencies (i increasing, j increasing). Same recurrence as P35. Same answer. O(mn) time. This is the 2D version of P18 (fib tabulation) — identical pattern, one more dimension.",
    testCode: "assert unique_paths_tab(3, 7) == 28\nassert unique_paths_tab(3, 3) == 6\nassert unique_paths_tab(1, 1) == 1\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 6, title: "Min Path Sum Tabulation", pattern: "2D table fill", skill: "min recurrence in 2D table",
    statement: "Convert P36 to tabulation. dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]). Fill row-by-row. Handle first row/column specially (only one source).",
    examples: [
      { input: "grid=[[1,3,1],[1,5,1],[4,2,1]]", output: "7" },
    ],
    why: "Same 2D fill skeleton as P40. Only the recurrence changed (sum→min, path count→path cost). The fill order is identical.",
    starterCode: "def min_path_sum_tab(grid):\n    pass",
    hints: [
      "Copy grid[0][0] as dp[0][0]. First row: dp[0][j] = dp[0][j-1]+grid[0][j].",
      "First column: dp[i][0] = dp[i-1][0]+grid[i][0].",
      "Rest: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])."
    ],
    solution: "def min_path_sum_tab(grid):\n    if not grid or not grid[0]:\n        return 0\n    m, n = len(grid), len(grid[0])\n    dp = [[0] * n for _ in range(m)]\n    dp[0][0] = grid[0][0]\n    for j in range(1, n):\n        dp[0][j] = dp[0][j - 1] + grid[0][j]\n    for i in range(1, m):\n        dp[i][0] = dp[i - 1][0] + grid[i][0]\n    for i in range(1, m):\n        for j in range(1, n):\n            dp[i][j] = grid[i][j] + min(dp[i - 1][j], dp[i][j - 1])\n    return dp[m - 1][n - 1]",
    walkthrough: "2D tabulation with edge handling. First row and column have only one way to reach them (from left / from above). Filled first, then inner cells have two sources. Same fill order as P40. The recurrence is the defining choice — the tabulation skeleton is universal.",
    testCode: "assert min_path_sum_tab([[1, 3, 1], [1, 5, 1], [4, 2, 1]]) == 7\nassert min_path_sum_tab([[1, 2, 3], [4, 5, 6]]) == 12\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 6, title: "Edit Distance Tabulation", pattern: "two-string DP tabulation", skill: "2D table for string pair",
    statement: "Convert P37 to tabulation. dp[i][j] = edit distance for word1[i:] and word2[j:]. Fill dp from bottom-right to top-left (suffixes get longer). Or equivalently, dp[i][j] for prefixes word1[:i] and word2[:j].",
    examples: [
      { input: "w1='horse', w2='ros'", output: "3" },
      { input: "w1='intention', w2='execution'", output: "5" },
    ],
    why: "The canonical (m+1)×(n+1) DP table. Each cell depends on three neighbors (left, up, diagonal). This 'three-dependency 2D table' is the most important shape in string DP.",
    starterCode: "def edit_distance_tab(w1, w2):\n    pass",
    hints: [
      "dp[i][j] = edit distance for w1[:i] → w2[:j]. Size (m+1)×(n+1).",
      "Base: dp[i][0] = i (delete all), dp[0][j] = j (insert all).",
      "If w1[i-1]==w2[j-1]: dp[i][j] = dp[i-1][j-1]. Else: min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1."
    ],
    solution: "def edit_distance_tab(w1, w2):\n    m, n = len(w1), len(w2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if w1[i - 1] == w2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n    return dp[m][n]",
    walkthrough: "The (m+1)×(n+1) DP table. Base: padding row/column (empty string vs prefix). Each cell (i,j) looks at three neighbors: left (insert), up (delete), diagonal (replace/match). Fill row-by-row, top-left to bottom-right. This is THE two-string template — LCS, edit distance, wildcard matching all follow this exact shape.",
    testCode: "assert edit_distance_tab('horse', 'ros') == 3\nassert edit_distance_tab('intention', 'execution') == 5\nassert edit_distance_tab('', 'abc') == 3\nassert edit_distance_tab('abc', '') == 3\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 6, title: "LCS Tabulation", pattern: "two-string DP tabulation", skill: "same table shape, simpler recurrence",
    statement: "Convert P38 to tabulation. dp[i][j] = LCS of w1[:i] and w2[:j]. If w1[i-1]==w2[j-1]: dp[i][j] = 1 + dp[i-1][j-1]. Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1]).",
    examples: [
      { input: "s1='abcde', s2='ace'", output: "3" },
      { input: "s1='abc', s2='def'", output: "0" },
    ],
    why: "Same table shape as P42 but simpler recurrence — only two branches (no insert/delete/replace, just match/skip). The table is the system — once you understand the (m+1)×(n+1) grid, any two-string recurrence maps to it.",
    starterCode: "def lcs_tab(s1, s2):\n    pass",
    hints: [
      "dp (m+1)×(n+1) all zeros. dp[0][*] and dp[*][0] are 0 (empty string).",
      "If equal: dp[i][j] = 1 + dp[i-1][j-1]. Else: max(dp[i-1][j], dp[i][j-1]).",
      "Return dp[m][n]."
    ],
    solution: "def lcs_tab(s1, s2):\n    m, n = len(s1), len(s2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if s1[i - 1] == s2[j - 1]:\n                dp[i][j] = 1 + dp[i - 1][j - 1]\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]",
    walkthrough: "Same table shape as P42. Same fill order. Simpler recurrence: match → 1+diagonal; no-match → max(left, up). The dp table IS the product: a structured grid where every cell represents a subproblem. Two-string DP always produces this grid — the recurrence defines what each cell contains, the table defines the computation order.",
    testCode: "assert lcs_tab('abcde', 'ace') == 3\nassert lcs_tab('abc', 'def') == 0\nassert lcs_tab('abc', 'abc') == 3\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Edit Distance O(min(m,n)) Space", pattern: "space-optimized DP", skill: "two-row rolling table",
    statement: "Space-optimize Edit Distance: instead of (m+1)×(n+1) grid, use only TWO rows (current + previous). Because each cell only depends on the row above and the current row. O(min(m,n)) space.",
    examples: [
      { input: "w1='horse', w2='ros'", output: "3" },
    ],
    why: "The 'two-row' space optimization pattern. Most 2D DP tables where dp[i][j] only depends on dp[i-1][*] and dp[i][*] can be compressed to two rows. This is the same trick as the two-variable Fibonacci optimization, scaled to 2D.",
    starterCode: "def edit_distance_opt(w1, w2):\n    # Use shorter string as columns to minimize space\n    pass",
    hints: [
      "Ensure w1 is the shorter string (swap if needed) to minimize row width.",
      "prev = list(range(len(w2)+1)). cur = [0] * (len(w2)+1).",
      "For each char in w1: cur[0] = prev[0] + 1. Fill cur[1..] using prev and cur. Then prev = cur."
    ],
    solution: "def edit_distance_opt(w1, w2):\n    if len(w1) > len(w2):\n        w1, w2 = w2, w1\n    m, n = len(w1), len(w2)\n    prev = list(range(n + 1))\n    cur = [0] * (n + 1)\n    for i in range(1, m + 1):\n        cur[0] = i\n        for j in range(1, n + 1):\n            if w1[i - 1] == w2[j - 1]:\n                cur[j] = prev[j - 1]\n            else:\n                cur[j] = 1 + min(prev[j], cur[j - 1], prev[j - 1])\n        prev, cur = cur, prev\n    return prev[n]",
    walkthrough: "Space optimization: only two rows needed because dp[i][j] depends on prev[j] (row i-1), prev[j-1] (row i-1, col j-1), and cur[j-1] (row i, col j-1). Keep prev row and current row. Swap after each iteration. This pattern works for most 2D DP tables — minimum space = min(m, n) + 1.",
    testCode: "assert edit_distance_opt('horse', 'ros') == 3\nassert edit_distance_opt('intention', 'execution') == 5\nassert edit_distance_opt('', 'abc') == 3\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════
  // STAGE 6 — Mastery: State Machines + Knapsack + Graph DP
  // Repeated mental model: all DP patterns from stages 0-5
  // One new idea: NONE — composes state machines, knapsack, DFS+DP
  // ═══════════════════════════════════════════════════════════
  {
    id: 45, stage: 6, title: "Coin Change (Unbounded Knapsack)", pattern: "unbounded knapsack", skill: "compose coin-choice loop + tabulation",
    statement: "Given coins[] and target amount, return MINIMUM coins needed. Unbounded (each coin can be used multiple times). Implement bottom-up: dp[a] = min coins for amount a. dp[a] = min(1 + dp[a - c] for c in coins if c <= a). Base dp[0] = 0.",
    examples: [
      { input: "coins=[1,2,5], amount=11", output: "3" },
      { input: "coins=[2], amount=3", output: "-1" },
    ],
    why: "Combines the coin-choice recurrence from P16 with bottom-up tabulation from Stage 3. The unbounded constraint is encoded in the recurrence: dp[a] loops over ALL coins each time — coins can be reused because we don't advance a coin index.",
    starterCode: "def coin_change_tab(coins, amount):\n    pass",
    hints: [
      "dp[0..amount], initialized to amount+1 (sentinel for impossible). dp[0] = 0.",
      "For a=1..amount: for each coin c <= a: dp[a] = min(dp[a], 1 + dp[a-c]).",
      "Return -1 if dp[amount] > amount (still sentinel)."
    ],
    solution: "def coin_change_tab(coins, amount):\n    dp = [amount + 1] * (amount + 1)\n    dp[0] = 0\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a:\n                dp[a] = min(dp[a], 1 + dp[a - c])\n    return dp[amount] if dp[amount] <= amount else -1",
    walkthrough: "Unbounded knapsack = the coin-choice loop from P16 (top-down) dropped into bottom-up from Stage 3. dp[a] depends on dp[a-c] for all coins — these are already computed because we iterate 'a' upward and 'c' backward. The loop order (amount outer, coins inner) ensures each dp[a-c] exists. Unbounded: coins can repeat because we always loop over ALL coins at each amount.",
    testCode: "assert coin_change_tab([1, 2, 5], 11) == 3\nassert coin_change_tab([2], 3) == -1\nassert coin_change_tab([1], 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "01 Knapsack", pattern: "0/1 knapsack", skill: "item-loop outer, capacity inner (can't reuse)",
    statement: "Given weights[] and values[] and capacity W, return max value achievable. Each item can be used AT MOST ONCE (0/1). Implement tabulation: dp[i][w] = max value using first i items with capacity w. dp[i][w] = max(exclude: dp[i-1][w], include: val[i-1] + dp[i-1][w-wt[i-1]]).",
    examples: [
      { input: "values=[60,100,120], weights=[10,20,30], W=50", output: "220", explain: "items 2 and 3: 100+120=220" },
    ],
    why: "The knapsack problem — the ur-DP pattern. The recurrence distinguishes 0/1 from unbounded: dp[i][w] references dp[i-1][*] (cannot reuse the same item) vs dp[i][*] (unbounded). The loop order also differs: items outer, capacity inner.",
    starterCode: "def knapsack_01(values, weights, W):\n    pass",
    hints: [
      "dp[i][w] for i=0..n, w=0..W. dp[0][*]=0.",
      "For each item i: for w=0..W: exclude = dp[i-1][w]. If weights[i-1]<=w: include = values[i-1] + dp[i-1][w-weights[i-1]].",
      "dp[i][w] = max(exclude, include). Return dp[n][W]."
    ],
    solution: "def knapsack_01(values, weights, W):\n    n = len(values)\n    dp = [[0] * (W + 1) for _ in range(n + 1)]\n    for i in range(1, n + 1):\n        for w in range(W + 1):\n            exclude = dp[i - 1][w]\n            if weights[i - 1] <= w:\n                include = values[i - 1] + dp[i - 1][w - weights[i - 1]]\n                dp[i][w] = max(exclude, include)\n            else:\n                dp[i][w] = exclude\n    return dp[n][W]",
    walkthrough: "0/1 knapsack: items outer, capacity inner. Each item considered once. The recurrence dp[i][w] = max(exclude: dp[i-1][w], include: value + dp[i-1][w-weight]) — the include branch references dp[i-1] (previous row), not dp[i] (current row). This is what prevents reuse. Compare with P45: unbounded uses dp[a] referencing dp[a-c] (same 'row'). The 0/1 vs unbounded distinction is encoded entirely in WHICH row the recurrence references.",
    testCode: "assert knapsack_01([60, 100, 120], [10, 20, 30], 50) == 220\nassert knapsack_01([10, 20, 30], [1, 2, 3], 0) == 0\nassert knapsack_01([40], [5], 3) == 0\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Partition Equal Subset Sum", pattern: "0/1 knapsack variant", skill: "recognize knapsack under surface features",
    statement: "Given array nums of positive integers, return True if you can partition it into two subsets with equal sum. Equivalent: can you pick items to reach total = sum(nums)/2? This IS 0/1 knapsack with value=weight=nums[i] and capacity=total/2.",
    examples: [
      { input: "nums=[1,5,11,5]", output: "True", explain: "can partition into [1,5,5] and [11] — both sum to 11" },
      { input: "nums=[1,2,3,5]", output: "False" },
    ],
    why: "Surface feature shift: same 0/1 knapsack recurrence as P46 but the problem is about PARTITION. Recognizing the knapsack structure under a new story IS the mastery skill. dp[i][w] = True if sum w achievable with first i items.",
    starterCode: "def can_partition(nums):\n    pass",
    hints: [
      "total = sum(nums). If odd, return False. target = total // 2.",
      "dp[i][w] = True if sum w is achievable with first i items. dp[0][0] = True.",
      "Recurrence: dp[i][w] = dp[i-1][w] OR (dp[i-1][w-nums[i-1]] if nums[i-1] <= w)."
    ],
    solution: "def can_partition(nums):\n    total = sum(nums)\n    if total % 2 != 0:\n        return False\n    target = total // 2\n    n = len(nums)\n    dp = [[False] * (target + 1) for _ in range(n + 1)]\n    dp[0][0] = True\n    for i in range(1, n + 1):\n        for w in range(target + 1):\n            dp[i][w] = dp[i - 1][w]\n            if nums[i - 1] <= w:\n                dp[i][w] = dp[i][w] or dp[i - 1][w - nums[i - 1]]\n    return dp[n][target]",
    walkthrough: "Surface: partition array into two equal-sum subsets. Deep structure: 0/1 knapsack with value=weight=nums[i], capacity=target, goal='reach exactly target'. The recurrence is identical to P46 but with OR instead of max. dp[i][w] = dp[i-1][w] OR dp[i-1][w-num]. Mastery = seeing the knapsack skeleton inside the partition body.",
    testCode: "assert can_partition([1, 5, 11, 5]) == True\nassert can_partition([1, 2, 3, 5]) == False\nassert can_partition([2, 2, 3, 5]) == False\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Buy/Sell Stock with Cooldown (State Machine)", pattern: "state machine DP", skill: "three states + transition rules",
    statement: "Given prices[], you may buy/sell with 1-day cooldown after selling. Return max profit. Design THREE states: held (own stock), sold (just sold today), reset (no stock, not cooling). Transitions: reset→held (buy), held→reset (nothing), held→sold (sell), sold→reset (cooldown), reset→reset (rest).",
    examples: [
      { input: "prices=[1,2,3,0,2]", output: "3", explain: "buy day1(1), sell day2(2)=+1, cooldown day3, buy day4(0), sell day5(2)=+2. total=3" },
    ],
    why: "State machine DP composes the take/skip recurrence with finite automata theory. Instead of dp[i] = ..., we have dp[i][state]. The transition rules ARE the recurrence. Multiple states update simultaneously, referencing each other.",
    starterCode: "def max_profit_cooldown(prices):\n    pass",
    hints: [
      "held = -prices[0], sold = 0, reset = 0 initially.",
      "Each day: new_held = max(held, reset - prices[i]). new_sold = held + prices[i]. new_reset = max(reset, sold).",
      "After all days, max(reset, sold) is the answer (can't end with stocks)."
    ],
    solution: "def max_profit_cooldown(prices):\n    if not prices:\n        return 0\n    held = -prices[0]\n    sold = 0\n    reset = 0\n    for i in range(1, len(prices)):\n        new_held = max(held, reset - prices[i])\n        new_sold = held + prices[i]\n        new_reset = max(reset, sold)\n        held, sold, reset = new_held, new_sold, new_reset\n    return max(reset, sold)",
    walkthrough: "State machine DP: three states with transition rules. held: max(keep holding, buy from reset). sold: sell from held state. reset: max(stay in reset, cooldown from sold). Each day updates all three states independently — the recurrences reference each other but never skip days. This is DP with an automata flavor: states are nodes, transitions are edges, recurrence is the update rule.",
    testCode: "assert max_profit_cooldown([1, 2, 3, 0, 2]) == 3\nassert max_profit_cooldown([1]) == 0\nassert max_profit_cooldown([1, 2, 4]) == 3\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Buy/Sell Stock at Most K Transactions", pattern: "state machine DP + dimension", skill: "3D DP: day × transaction × state",
    statement: "Given prices[] and integer k, return max profit with at most k transactions. A transaction is buy+sell. Design: dp[i][t][holding] where i=day, t=transactions used, holding=0/1 (no stock/holding stock). Or use 2D space-optimized version.",
    examples: [
      { input: "k=2, prices=[3,2,6,5,0,3]", output: "7", explain: "buy 2 sell 6 (+4), buy 0 sell 3 (+3) = 7" },
      { input: "k=2, prices=[1,2,3,4,5]", output: "4", explain: "buy 1 sell 5 (+4)" },
    ],
    why: "Composes state machine (P48) with the knapsack dimension (P46): dp[i][t][h] — a 3D DP. The state machine tracks holding/not; the transaction count limits how many times we can buy. Two dimensions of state interacting.",
    starterCode: "def max_profit_k(prices, k):\n    pass",
    hints: [
      "If k >= len(prices)//2, this degenerates to unlimited transactions — solve greedily.",
      "dp[i][t][0] = max(do nothing, sell: dp[i-1][t][1] + prices[i]). dp[i][t][1] = max(do nothing, buy: dp[i-1][t-1][0] - prices[i]).",
      "Space-optimize: keep dp[t][0] and dp[t][1] arrays. Iterate days, update transaction counts."
    ],
    solution: "def max_profit_k(prices, k):\n    if not prices or k == 0:\n        return 0\n    n = len(prices)\n    if k >= n // 2:\n        profit = 0\n        for i in range(1, n):\n            if prices[i] > prices[i - 1]:\n                profit += prices[i] - prices[i - 1]\n        return profit\n    dp_buy = [-float('inf')] * (k + 1)\n    dp_sell = [0] * (k + 1)\n    for p in prices:\n        for t in range(1, k + 1):\n            dp_buy[t] = max(dp_buy[t], dp_sell[t - 1] - p)\n            dp_sell[t] = max(dp_sell[t], dp_buy[t] + p)\n    return dp_sell[k]",
    walkthrough: "3D DP collapsed to 2D space: dp_buy[t] = max profit after using t transactions and HOLDING stock. dp_sell[t] = max profit after using t transactions and NOT holding. At each price: buy[t] = max(keep holding, buy from previous sell[t-1]). sell[t] = max(sell, sell from buy[t]). The 't' dimension limits the knapsack; the buy/sell alternation is the state machine.",
    testCode: "assert max_profit_k([3, 2, 6, 5, 0, 3], 2) == 7\nassert max_profit_k([1, 2, 3, 4, 5], 2) == 4\nassert max_profit_k([1], 2) == 0\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Longest Increasing Path in Matrix (DP + DFS)", pattern: "DP on DAG (DFS + memo)", skill: "2D grid DFS with memo as DP",
    statement: "Given m×n matrix, find longest strictly increasing path. You can move up/down/left/right to larger values. Write DFS with memo: f(i,j) = 1 + max(f(ni,nj) for valid neighbors with larger value). This IS DP on a DAG — the memo IS the DP table.",
    examples: [
      { input: "matrix=[[9,9,4],[6,6,8],[2,1,1]]", output: "4", explain: "1→2→6→9" },
      { input: "matrix=[[3,4,5],[3,2,6],[2,2,1]]", output: "4", explain: "3→4→5→6 or similar" },
    ],
    why: "DP on an implicit DAG. Each cell has directed edges to larger neighbors (acyclic by definition — you can only move to LARGER values). DFS with memo explores the DAG. The memo IS the dp table — same pattern as Stage 1 but on a graph structure.",
    starterCode: "def longest_increasing_path(matrix):\n    pass",
    hints: [
      "DFS(i, j) returns longest path starting from (i, j). Memoize results.",
      "For each neighbor: if in bounds and value > matrix[i][j], 1 + DFS(ni, nj).",
      "Track max across all starting positions."
    ],
    solution: "def longest_increasing_path(matrix):\n    if not matrix or not matrix[0]:\n        return 0\n    m, n = len(matrix), len(matrix[0])\n    memo = {}\n    dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]\n    def dfs(i, j):\n        if (i, j) in memo:\n            return memo[(i, j)]\n        best = 1\n        for di, dj in dirs:\n            ni, nj = i + di, j + dj\n            if 0 <= ni < m and 0 <= nj < n and matrix[ni][nj] > matrix[i][j]:\n                best = max(best, 1 + dfs(ni, nj))\n        memo[(i, j)] = best\n        return best\n    result = 0\n    for i in range(m):\n        for j in range(n):\n            result = max(result, dfs(i, j))\n    return result",
    walkthrough: "DFS + memo = DP on a DAG. The matrix is a DAG when edges only point to larger values (no cycles possible). memo[(i,j)] = longest path starting here. DFS explores the DAG depth-first; memo prevents recomputation. This unifies graph traversal (DFS) with DP (memo). The dp 'table' is the memo dict; the 'recurrence' is 1 + max(DFS neighbors). DP can happen on graphs, not just arrays.",
    testCode: "m1 = [[9, 9, 4], [6, 6, 8], [2, 1, 1]]\nassert longest_increasing_path(m1) == 4\nm2 = [[3, 4, 5], [3, 2, 6], [2, 2, 1]]\nassert longest_increasing_path(m2) == 4\nassert longest_increasing_path([[1]]) == 1\nprint('All tests passed!')"
  },
]
