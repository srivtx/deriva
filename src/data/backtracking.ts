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

export const STAGES_BACKTRACKING = [
  { id: 0, name: "Enumeration Reflex", desc: "ALL possibilities" },
  { id: 1, name: "Decision Tree", desc: "include/exclude per element" },
  { id: 2, name: "Choose-Explore-Unchoose", desc: "state restoration" },
  { id: 3, name: "Pruning", desc: "kill hopeless branches" },
  { id: 4, name: "Naive", desc: "generate then filter" },
  { id: 5, name: "Optimization", desc: "prune during construction" },
  { id: 6, name: "Mastery", desc: "constraint systems" },
]

export const PROBLEMS_BACKTRACKING: Problem[] = [
  {
    id: 1, stage: 0, title: "Subsets by Hand", pattern: "enumeration", skill: "list all subsets of small set",
    statement: "Given the set {a, b, c}, write a function that returns all possible subsets. Think through every subset from size 0 to size 3.",
    examples: [
      { input: "elements = ['a','b','c']", output: "[ [], ['a'], ['b'], ['c'], ['a','b'], ['a','c'], ['b','c'], ['a','b','c'] ]", explain: "2^3 = 8 subsets" }
    ],
    why: "Before automating enumeration, you must feel what it means to list ALL possibilities. Subsets are the simplest combinatorial object: each element is either IN or OUT. This intuition is the root of every backtracking tree.",
    starterCode: "def subsets_of_set(elements):\n    # Return all subsets of the given list\n    pass",
    hints: [
      "For each element, you have 2 choices: include it or skip it. That's 2x2x2 = 8 total.",
    "Start with the empty subset []. For each element, clone all existing subsets and add the element to the clones.",
    "Think: subsets of ['a','b'] = [[], ['a'], ['b'], ['a','b']]. Then add 'c' to each."
    ],
    solution: "def subsets_of_set(elements):\n    result = [[]]\n    for x in elements:\n        result += [s + [x] for s in result]\n    return result",
    walkthrough: "Start with [[]] — the empty subset is always a subset. For each element, take every subset we've built so far and create a NEW version that includes this element. After 'a': [[], ['a']]. After 'b': [[], ['a'], ['b'], ['a','b']]. After 'c': all 8. This iterative expansion IS the decision tree unfolded.",
    testCode: "result = subsets_of_set(['a','b','c'])\nexpected = [[], ['a'], ['b'], ['c'], ['a','b'], ['a','c'], ['b','c'], ['a','b','c']]\nassert sorted([tuple(sorted(s)) for s in result]) == sorted([tuple(sorted(s)) for s in expected])\nassert len(result) == 8\nprint('All tests passed!')"
  }
,
  {
    id: 2, stage: 0, title: "Count Subsets Formula", pattern: "enumeration", skill: "2^n intuition",
    statement: "Given a set of size n, how many subsets does it have? Write a function that computes this count.",
    examples: [
      { input: "n = 0", output: "1", explain: "empty set has 1 subset: itself" },
    { input: "n = 3", output: "8" },
    { input: "n = 10", output: "1024" }
    ],
    why: "Before building decision trees, know the SIZE of the tree. Each element doubles the solution count. This explains why naive exhaustive search is 2^n — the branching factor is 2, the depth is n.",
    starterCode: "def count_subsets(n):\n    pass",
    hints: [
      "Each element can be either included or excluded — 2 independent choices per element.",
    "With n elements, that's 2 x 2 x ... x 2 (n times).",
    "return 2 ** n"
    ],
    solution: "def count_subsets(n):\n    return 2 ** n",
    walkthrough: "For each element: in or out. Two independent choices per element = 2^n total. This is why the backtracking tree for subsets has 2^n leaves. Understanding the SIZE of the search space is the first step to respecting complexity.",
    testCode: "assert count_subsets(0) == 1\nassert count_subsets(1) == 2\nassert count_subsets(3) == 8\nassert count_subsets(10) == 1024\nassert count_subsets(20) == 1048576\nprint('All tests passed!')"
  }
,
  {
    id: 3, stage: 0, title: "Permutations by Hand", pattern: "enumeration", skill: "list all orderings",
    statement: "Write a function that returns all permutations of ['a', 'b', 'c']. A permutation is an ordering where every element appears exactly once.",
    examples: [
      { input: "items = ['a','b','c']", output: "[ ['a','b','c'], ['a','c','b'], ['b','a','c'], ['b','c','a'], ['c','a','b'], ['c','b','a'] ]", explain: "3! = 6 permutations" }
    ],
    why: "Permutations are the other fundamental combinatorial object. Unlike subsets (IN/OUT), permutations require ORDER — every element is used exactly once. This 'I can pick any remaining element next' intuition drives the path+used pattern.",
    starterCode: "def permutations_of_list(items):\n    pass",
    hints: [
      "There are 3 choices for position 1, then 2 for position 2, then 1 for position 3 = 6 total.",
    "Use a recursive helper: pick one element, permute the rest, then prepend.",
    "Building the recursion yourself is the whole point — don't use itertools!"
    ],
    solution: "def permutations_of_list(items):\n    if len(items) <= 1:\n        return [items[:]]\n    result = []\n    for i, item in enumerate(items):\n        rest = items[:i] + items[i+1:]\n        for perm in permutations_of_list(rest):\n            result.append([item] + perm)\n    return result",
    walkthrough: "Pick first element (3 choices). For each choice, recursively permute the remaining 2 elements. That recursive call picks from 2, then the last call picks from 1. The recursion depth equals n, branching shrinks from n to n-1 to ... to 1. This is n! total. Pattern: pick one, recurse on rest, combine.",
    testCode: "result = permutations_of_list(['a','b','c'])\nexpected = [['a','b','c'], ['a','c','b'], ['b','a','c'], ['b','c','a'], ['c','a','b'], ['c','b','a']]\nassert sorted([tuple(p) for p in result]) == sorted([tuple(p) for p in expected])\nassert len(result) == 6\nprint('All tests passed!')"
  }
,
  {
    id: 4, stage: 0, title: "Count Permutations", pattern: "enumeration", skill: "n! intuition",
    statement: "Given n distinct items, how many permutations exist? Write a function that returns n! (0! = 1).",
    examples: [
      { input: "n = 3", output: "6" },
    { input: "n = 5", output: "120" },
    { input: "n = 0", output: "1", explain: "0! = 1 by definition" }
    ],
    why: "n choices for first position x (n-1) for second x ... x 1 = n!. The factorial explains why permutation backtracking is n! — depth n, branching starts at n and shrinks.",
    starterCode: "def count_permutations(n):\n    pass",
    hints: [
      "n! = n x (n-1) x (n-2) x ... x 1.",
    "0! is defined as 1.",
    "Use a loop or recursion."
    ],
    solution: "def count_permutations(n):\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result",
    walkthrough: "Same lesson as P2 but for permutations. n! grows MUCH faster than 2^n after n~4. Factorial search spaces demand pruning (Stage 3-6). Knowing the size of your search space makes you respect why optimization matters.",
    testCode: "assert count_permutations(0) == 1\nassert count_permutations(1) == 1\nassert count_permutations(3) == 6\nassert count_permutations(5) == 120\nassert count_permutations(8) == 40320\nprint('All tests passed!')"
  }
,
  {
    id: 5, stage: 0, title: "Combinations by Hand", pattern: "enumeration", skill: "choose k from n",
    statement: "Return all ways to choose 2 elements from ['a','b','c','d']. Order doesn't matter in combinations.",
    examples: [
      { input: "items=['a','b','c','d'], k=2", output: "[ ['a','b'], ['a','c'], ['a','d'], ['b','c'], ['b','d'], ['c','d'] ]", explain: "C(4,2) = 6" }
    ],
    why: "Combinations are subsets of fixed size. Unlike subsets (any size) or permutations (order matters), combinations add BOTH constraints: fixed size AND order ignored. This is the foundation of nCr backtracking.",
    starterCode: "def combinations_of_list(items, k):\n    pass",
    hints: [
      "You need to pick exactly 2 elements. For each element, decide: include or skip.",
    "If you include too many, stop. If you skip too many, you can't reach k.",
    "C(n,k) = n! / (k! x (n-k)!). For n=4,k=2: 4!/(2!x2!) = 24/4 = 6."
    ],
    solution: "def combinations_of_list(items, k):\n    def dfs(start, path):\n        if len(path) == k:\n            result.append(path[:])\n            return\n        for i in range(start, len(items)):\n            path.append(items[i])\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Pick a starting element. Then pick the next from REMAINING elements (index > current). This enforces order irrelevance: once you skip an element, you never pick it later. The start index controls the shrinking choice set. Depth = k, branching shrinks as start moves forward.",
    testCode: "result = combinations_of_list(['a','b','c','d'], 2)\nexpected = [['a','b'], ['a','c'], ['a','d'], ['b','c'], ['b','d'], ['c','d']]\nassert sorted([tuple(sorted(c)) for c in result]) == sorted([tuple(c) for c in expected])\nassert len(result) == 6\nprint('All tests passed!')"
  }
,
  {
    id: 6, stage: 0, title: "Enumerate Binary Strings", pattern: "enumeration", skill: "decision tree for length n",
    statement: "Return all binary strings of length n. Each position is 0 or 1.",
    examples: [
      { input: "n = 2", output: "['00', '01', '10', '11']" },
    { input: "n = 3", output: "['000', '001', '010', '011', '100', '101', '110', '111']", explain: "2^3 = 8" }
    ],
    why: "The simplest decision tree: n positions, each has 2 choices (0 or 1). This is isomorphic to subsets (each position is an element, 1=include, 0=exclude). Binary strings ARE subsets in disguise.",
    starterCode: "def binary_strings(n):\n    pass",
    hints: [
      "Build the string one character at a time. At each position, try '0' and '1'.",
    "When the string reaches length n, add it to results.",
    "This is the exact same pattern as subsets but with characters instead of lists."
    ],
    solution: "def binary_strings(n):\n    def dfs(path):\n        if len(path) == n:\n            result.append(''.join(path))\n            return\n        path.append('0')\n        dfs(path)\n        path.pop()\n        path.append('1')\n        dfs(path)\n        path.pop()\n    result = []\n    dfs([])\n    return result",
    walkthrough: "Choose-Explore-Unchoose in its simplest form. At each position: choose '0', explore the rest, unchoose '0'. Then choose '1', explore, unchoose. The path grows to length n. This two-branch recursion is the universal template for 'each position has choices'.",
    testCode: "assert sorted(binary_strings(2)) == sorted(['00','01','10','11'])\nassert len(binary_strings(3)) == 8\nassert len(binary_strings(5)) == 32\nassert '00000' in binary_strings(5)\nassert '11111' in binary_strings(5)\nprint('All tests passed!')"
  }
,
  {
    id: 7, stage: 1, title: "Subsets via Include/Exclude", pattern: "decision tree", skill: "two-branch recursion per element",
    statement: "Given a list of distinct integers, return all possible subsets. Use the include/exclude decision tree: for each element, make TWO recursive calls — one including it, one excluding it.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }
    ],
    why: "The canonical backtracking problem. Each element creates a binary choice: include or not. The decision tree has depth n and exactly 2^n leaves. This is the mental model for ALL subset problems.",
    starterCode: "def subsets(nums):\n    def dfs(i, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Base case: when i == len(nums), we've decided for every element — add path to result.",
    "Exclude branch: dfs(i+1, path) — move to next without adding.",
    "Include branch: dfs(i+1, path + [nums[i]]) — move to next WITH this element."
    ],
    solution: "def subsets(nums):\n    def dfs(i, path):\n        if i == len(nums):\n            result.append(path[:])\n            return\n        dfs(i + 1, path)\n        path.append(nums[i])\n        dfs(i + 1, path)\n        path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "At index i, decide about nums[i]. Exclude: recurse without adding. Include: add nums[i], recurse, then pop to restore state (unchoose). The path grows and shrinks. At leaf (i == n), a complete decision is captured. Every internal node has exactly 2 children — this is a full binary tree of depth n.",
    testCode: "r = subsets([1,2,3])\nexpected = [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(sorted(s)) for s in expected])\nassert len(r) == 8\nassert subsets([]) == [[]]\nprint('All tests passed!')"
  }
,
  {
    id: 8, stage: 1, title: "Subsets Iterative", pattern: "decision tree", skill: "build incrementally",
    statement: "Generate all subsets of distinct integers iteratively, without recursion. Start with [[]], then for each number, extend all existing subsets.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }
    ],
    why: "The iterative approach reveals that backtracking is just 'for each decision point, extend all partial solutions so far.' Recursion is an implementation detail; the IDEA is expansion.",
    starterCode: "def subsets_iterative(nums):\n    pass",
    hints: [
      "Start with result = [[]].",
    "For each number, take every subset in result and create a NEW subset that includes this number.",
    "result += [s + [n] for s in result]"
    ],
    solution: "def subsets_iterative(nums):\n    result = [[]]\n    for n in nums:\n        result += [s + [n] for s in result]\n    return result",
    walkthrough: "Same as P1 but explicit. The key insight: the recursion tree is just a way of organizing the 'for each element, extend all partial solutions' expansion. Iterative = breadth-first across the tree. Recursive = depth-first. Same 2^n solutions, different traversal order.",
    testCode: "r = subsets_iterative([1,2,3])\nexpected = [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(sorted(s)) for s in expected])\nassert len(r) == 8\nprint('All tests passed!')"
  }
,
  {
    id: 9, stage: 1, title: "Subsets of Distinct Nums", pattern: "decision tree", skill: "systematic include/exclude with for-loop",
    statement: "Return all subsets of distinct integers using path-building: at each index, choose which element to include next. Add every path (not just leaves) to result.",
    examples: [
      { input: "nums = [5,7]", output: "[[],[5],[7],[5,7]]" },
    { input: "nums = [1,2,3,4]", output: "16 subsets" }
    ],
    why: "Same as P7 but with for-loop: 'at each level, pick which element goes next.' Every node is appended, not just leaves. The start index prevents duplicates from different orderings.",
    starterCode: "def subsets_distinct(nums):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Use start index to track which elements are still available.",
    "For i from start to end: pick nums[i], dfs(i+1, path+[nums[i]]).",
    "Always add current path to result BEFORE recursing — this captures all subset sizes."
    ],
    solution: "def subsets_distinct(nums):\n    def dfs(start, path):\n        result.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Different recursion shape from P7. Instead of two recursive calls (include/exclude), we use a for-loop. The path grows incrementally. Every node is appended. The start index ensures we never repeat an element and enforces order (no duplicates from different orderings).",
    testCode: "r = subsets_distinct([1,2,3])\nexpected = [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(sorted(s)) for s in expected])\nassert len(subsets_distinct([1,2,3,4])) == 16\nprint('All tests passed!')"
  }
,
  {
    id: 10, stage: 1, title: "Subsets of Any List", pattern: "decision tree", skill: "general subset generation",
    statement: "Given a list of ANY items (strings, ints, etc.), return all subsets. The pattern is identical regardless of element type.",
    examples: [
      { input: "items = ['x','y','z']", output: "[[],['x'],['y'],['x','y'],['z'],['x','z'],['y','z'],['x','y','z']]" }
    ],
    why: "Decouples the subset algorithm from element type. The decision tree operates on INDICES, not values. This is why sort works for deduplication — it rearranges indices without changing the algorithm.",
    starterCode: "def subsets_any(items):\n    def dfs(i, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Same pattern as P7: at each index i, include or exclude items[i].",
    "The element type doesn't matter — we work with indices.",
    "Base case: i == len(items). Always add current path."
    ],
    solution: "def subsets_any(items):\n    def dfs(i, path):\n        if i == len(items):\n            result.append(path[:])\n            return\n        dfs(i + 1, path)\n        path.append(items[i])\n        dfs(i + 1, path)\n        path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Identical structure to P7. The algorithm doesn't care about element values — only indices matter. This is why when we need deduplication (P30, P37), we sort first and check adjacency. The algorithm sees indices; sorting rearranges which index gets which value.",
    testCode: "r = subsets_any(['x','y','z'])\nassert len(r) == 8\nassert [] in r\nassert ['x','y','z'] in r\nr2 = subsets_any([42, -7, 0])\nassert len(r2) == 8\nprint('All tests passed!')"
  }
,
  {
    id: 11, stage: 1, title: "Permutations via Swap", pattern: "decision tree", skill: "in-place swap recursion",
    statement: "Return all permutations of distinct integers. Use the swap method: for each position, swap the element with every element after it, recurse, swap back.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }
    ],
    why: "The swap-based algorithm avoids building a separate path array. It rearranges IN PLACE, swapping elements to explore different orderings. Memory-efficient and elegant.",
    starterCode: "def permute_swap(nums):\n    def dfs(start):\n        pass\n    result = []\n    dfs(0)\n    return result",
    hints: [
      "Base case: when start == len(nums), we have a complete permutation.",
    "For i from start to end: swap nums[start] with nums[i], recurse on start+1, swap back.",
    "The swap-back restores the original order for the next iteration (unchoose)."
    ],
    solution: "def permute_swap(nums):\n    def dfs(start):\n        if start == len(nums):\n            result.append(nums[:])\n            return\n        for i in range(start, len(nums)):\n            nums[start], nums[i] = nums[i], nums[start]\n            dfs(start + 1)\n            nums[start], nums[i] = nums[i], nums[start]\n    result = []\n    dfs(0)\n    return result",
    walkthrough: "At position start, choose which element goes there by swapping. After swap, position start is fixed, recurse on start+1. Swap-back (unchoose) restores array for next iteration. Depth = n. At each level, branching = remaining positions. Total: n! leaves. No extra path array needed.",
    testCode: "r = permute_swap([1,2,3])\nexpected = [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]\nassert sorted([tuple(p) for p in r]) == sorted([tuple(p) for p in expected])\nassert len(r) == 6\nassert len(permute_swap([1,2,3,4])) == 24\nprint('All tests passed!')"
  }
,
  {
    id: 12, stage: 1, title: "Permutations via Path + Used", pattern: "decision tree", skill: "used-set tracking",
    statement: "Return all permutations of distinct integers using a 'used' boolean array to track which elements are already in the current path.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }
    ],
    why: "Alternative to swap. Keeps a used[] array. For each position, try every element not yet used. This pattern generalizes to any 'pick without replacement' problem.",
    starterCode: "def permute_used(nums):\n    def dfs(path):\n        pass\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return result",
    hints: [
      "Maintain a used[i] boolean for each element.",
    "In dfs: for each unused element, mark used, add to path, recurse, unmark, pop path.",
    "Base case: path length == n."
    ],
    solution: "def permute_used(nums):\n    def dfs(path):\n        if len(path) == len(nums):\n            result.append(path[:])\n            return\n        for i in range(len(nums)):\n            if not used[i]:\n                used[i] = True\n                path.append(nums[i])\n                dfs(path)\n                path.pop()\n                used[i] = False\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return result",
    walkthrough: "At each level, iterate over ALL elements, skip those already used. The used[] array tracks global state. After recursing, unchoose: pop from path AND unmark used[i]. This dual-state CEU pattern returns in EVERY backtracking problem.",
    testCode: "r = permute_used([1,2,3])\nexpected = [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]\nassert sorted([tuple(p) for p in r]) == sorted([tuple(p) for p in expected])\nassert len(r) == 6\nprint('All tests passed!')"
  }
,
  {
    id: 13, stage: 1, title: "Combinations nCr", pattern: "decision tree", skill: "choose k from n elements",
    statement: "Given n and k, return all combinations of k numbers chosen from 1..n. Use the 'pick from remaining' pattern.",
    examples: [
      { input: "n=4, k=2", output: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]", explain: "C(4,2) = 6" }
    ],
    why: "Combinations = subsets of fixed size k. The start index enforces order (never pick earlier element). The len(path)==k base case stops at the right size. This is P5 generalized to code.",
    starterCode: "def combine(n, k):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(1, [])\n    return result",
    hints: [
      "Pick numbers from 'start' to n — avoids duplicates from different orderings.",
    "When path reaches length k, add it and return.",
    "For each i from start to n: add i, dfs(i+1), pop i."
    ],
    solution: "def combine(n, k):\n    def dfs(start, path):\n        if len(path) == k:\n            result.append(path[:])\n            return\n        for i in range(start, n + 1):\n            path.append(i)\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(1, [])\n    return result",
    walkthrough: "Two constraints: (1) exactly k elements, (2) order ignored. The start index handles constraint 2 — we only pick from indices >= start, so {1,2} is generated but {2,1} is not. The len(path)==k base case handles constraint 1. Together: choose k from n without regard to order.",
    testCode: "r = combine(4, 2)\nexpected = [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]\nassert sorted([tuple(sorted(c)) for c in r]) == sorted([tuple(c) for c in expected])\nassert len(combine(5, 3)) == 10\nassert len(combine(10, 3)) == 120\nprint('All tests passed!')"
  }
,
  {
    id: 14, stage: 1, title: "Letter Combinations of Phone", pattern: "decision tree", skill: "cartesian product DFS",
    statement: "Given digits 2-9, return all possible letter combinations. Mapping: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz.",
    examples: [
      { input: "digits = '23'", output: "['ad','ae','af','bd','be','bf','cd','ce','cf']", explain: "3x3 = 9 combinations" },
    { input: "digits = ''", output: "[]" }
    ],
    why: "First problem where each decision point has DIFFERENT choices (3 or 4 letters). Branching factor varies per depth. But pattern is same: for each position, iterate over its choices, recurse.",
    starterCode: "def letter_combinations(digits):\n    if not digits:\n        return []\n    mapping = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}\n    def dfs(i, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "At index i, iterate over all letters for digits[i].",
    "When i == len(digits), join path and add to result.",
    "Same choose-explore-unchoose pattern but with variable branching per level."
    ],
    solution: "def letter_combinations(digits):\n    if not digits:\n        return []\n    mapping = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}\n    def dfs(i, path):\n        if i == len(digits):\n            result.append(''.join(path))\n            return\n        for ch in mapping[digits[i]]:\n            path.append(ch)\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Depth = number of digits. At each level, branching = 3 or 4. The CEU pattern is identical: iterate choices, append to path, recurse to next position, pop. The branching factor isn't constant, but the pattern doesn't care.",
    testCode: "r = letter_combinations('23')\nexpected = ['ad','ae','af','bd','be','bf','cd','ce','cf']\nassert sorted(r) == sorted(expected)\nassert letter_combinations('') == []\nassert len(letter_combinations('2')) == 3\nassert len(letter_combinations('79')) == 16\nprint('All tests passed!')"
  }
,
  {
    id: 15, stage: 2, title: "The Choose-Explore-Unchoose Framework", pattern: "CEU", skill: "explicit state restoration",
    statement: "Generate all binary strings of length n using the EXACT three-step CEU pattern: (1) make a choice, (2) explore consequences, (3) undo the choice.",
    examples: [
      { input: "n = 2", output: "['00', '01', '10', '11']" }
    ],
    why: "Makes the CEU cycle EXPLICIT as a traceable framework. Every backtracking algorithm from here forward is a variation of this three-step loop. If you can see the undo, you understand backtracking.",
    starterCode: "def binary_ceu(n):\n    def dfs(path, depth):\n        pass\n    result = []\n    dfs([], 0)\n    return result",
    hints: [
      "Step 1 (choose): path.append(char), Step 2 (explore): dfs(path), Step 3 (unchoose): path.pop().",
    "Write the pop() immediately after the recursive call — same indentation.",
    "When depth == n, copy the path and return."
    ],
    solution: "def binary_ceu(n):\n    def dfs(path, depth):\n        if depth == n:\n            result.append(''.join(path))\n            return\n        path.append('0')\n        dfs(path, depth + 1)\n        path.pop()\n        path.append('1')\n        dfs(path, depth + 1)\n        path.pop()\n    result = []\n    dfs([], 0)\n    return result",
    walkthrough: "Every recursive call is bracketed by append() and pop(). The append is 'choose', the recursive call is 'explore', the pop is 'unchoose'. These three steps always appear together. The undo is what makes backtracking work: after exploring what happens with '0', we must remove '0' before trying '1'.",
    testCode: "r = binary_ceu(2)\nassert sorted(r) == sorted(['00','01','10','11'])\nassert len(binary_ceu(3)) == 8\nprint('All tests passed!')"
  }
,
  {
    id: 16, stage: 2, title: "All Paths Root to Leaf", pattern: "CEU", skill: "tree-based backtracking",
    statement: "Given a binary tree, return ALL root-to-leaf paths as strings separated by '->'. Apply CEU: at each node, choose the node, explore children, unchoose.",
    examples: [
      { input: "tree = [1,2,3,null,5]", output: "['1->2->5', '1->3']" },
    { input: "tree = [1]", output: "['1']" }
    ],
    why: "Backtracking on a TREE is the most natural CEU application. Each node is a choice point. The tree IS the decision space. The recursion follows the tree structure exactly.",
    starterCode: "def all_paths(root):\n    def dfs(node, path):\n        pass\n    result = []\n    dfs(root, [])\n    return result",
    hints: [
      "Choose: append node.val to path.",
    "Explore: dfs(node.left, path), then dfs(node.right, path).",
    "Unchoose: path.pop() after exploring BOTH children."
    ],
    solution: "def all_paths(root):\n    def dfs(node, path):\n        if node is None:\n            return\n        path.append(str(node.val))\n        if node.left is None and node.right is None:\n            result.append('->'.join(path))\n        else:\n            dfs(node.left, path)\n            dfs(node.right, path)\n        path.pop()\n    result = []\n    dfs(root, [])\n    return result",
    walkthrough: "Choose the node (append). If leaf, capture path. Otherwise, explore both children. After both return, unchoose (pop). The pop happens exactly once per node visited, restoring the path for sibling exploration. Without pop, the path would accumulate nodes from all subtrees.",
    testCode: "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef build_tree(arr):\n    if not arr: return None\n    nodes = [TreeNode(v) if v is not None else None for v in arr]\n    for i, n in enumerate(nodes):\n        if n:\n            li = 2*i+1\n            ri = 2*i+2\n            if li < len(nodes): n.left = nodes[li]\n            if ri < len(nodes): n.right = nodes[ri]\n    return nodes[0]\n\nt = build_tree([1,2,3,None,5])\nr = all_paths(t)\nassert sorted(r) == sorted(['1->2->5', '1->3'])\nassert all_paths(build_tree([1])) == ['1']\nprint('All tests passed!')"
  }
,
  {
    id: 17, stage: 2, title: "Generate Parentheses", pattern: "CEU", skill: "constraint-aware CEU",
    statement: "Given n pairs, generate all combinations of well-formed parentheses. Valid: never close more than you've opened, end with n open and n close.",
    examples: [
      { input: "n = 3", output: "['((()))','(()())','(())()','()(())','()()()']" },
    { input: "n = 1", output: "['()']" }
    ],
    why: "THE classic backtracking problem. CEU with a twist: choices are not equally available at every node. You can only add '(' if open < n, and ')' if close < open. This availability check is the seed of pruning.",
    starterCode: "def generate_parentheses(n):\n    def dfs(path, open_count, close_count):\n        pass\n    result = []\n    dfs([], 0, 0)\n    return result",
    hints: [
      "Track two counters: open_count and close_count. Base: when both == n, add to result.",
    "You may add '(' if open_count < n. You may add ')' if close_count < open_count.",
    "Choose: append '(' or ')'. Explore: recurse with updated counts. Unchoose: pop."
    ],
    solution: "def generate_parentheses(n):\n    def dfs(path, open_count, close_count):\n        if len(path) == 2 * n:\n            result.append(''.join(path))\n            return\n        if open_count < n:\n            path.append('(')\n            dfs(path, open_count + 1, close_count)\n            path.pop()\n        if close_count < open_count:\n            path.append(')')\n            dfs(path, open_count, close_count + 1)\n            path.pop()\n    result = []\n    dfs([], 0, 0)\n    return result",
    walkthrough: "At each step, two OPTIONAL choices. We can only choose '(' if we haven't used all n. We can only choose ')' if it would close a previously opened paren. These constraints eliminate invalid states before we reach them — this is pruning, formalized in Stage 3. CEU: choose (if allowed), explore, unchoose.",
    testCode: "r = generate_parentheses(3)\nexpected = ['((()))','(()())','(())()','()(())','()()()']\nassert sorted(r) == sorted(expected)\nassert generate_parentheses(1) == ['()']\nassert len(generate_parentheses(4)) == 14\nprint('All tests passed!')"
  }
,
  {
    id: 18, stage: 2, title: "Binary Strings via CEU", pattern: "CEU", skill: "CEU for fixed-length strings",
    statement: "Generate all binary strings of length n using the for-loop CEU pattern: for each position, try '0' then '1', with explicit choose/unchoose.",
    examples: [
      { input: "n = 2", output: "['00','01','10','11']" }
    ],
    why: "Same as P6/P15 but now framed as the CEU pattern. Repetition with a FRAMEWORK name cements the pattern as a tool, not just code.",
    starterCode: "def binary_gen(n):\n    def dfs(path):\n        pass\n    result = []\n    dfs([])\n    return result",
    hints: [
      "Use a for-loop over ['0','1'] at each depth.",
    "Choose: path.append(c). Explore: dfs(path). Unchoose: path.pop().",
    "When len(path) == n, capture and return."
    ],
    solution: "def binary_gen(n):\n    def dfs(path):\n        if len(path) == n:\n            result.append(''.join(path))\n            return\n        for c in ['0', '1']:\n            path.append(c)\n            dfs(path)\n            path.pop()\n    result = []\n    dfs([])\n    return result",
    walkthrough: "The for-loop version of CEU: for each choice at this level, choose (append), explore (recurse), unchoose (pop). This single for-loop with an append/pop sandwich is the most common backtracking pattern. All subsequent problems use this exact structure.",
    testCode: "assert sorted(binary_gen(2)) == sorted(['00','01','10','11'])\nassert len(binary_gen(4)) == 16\nassert len(binary_gen(1)) == 2\nprint('All tests passed!')"
  }
,
  {
    id: 19, stage: 2, title: "All Subsets of a String", pattern: "CEU", skill: "CEU on string characters",
    statement: "Given a string of distinct characters, return all subsets (as strings). Apply CEU: at each index, decide include or exclude the character.",
    examples: [
      { input: "s = 'abc'", output: "['','a','b','ab','c','ac','bc','abc']" }
    ],
    why: "The include/exclude pattern from P7 now framed as CEU. At each index, TWO choices: include (choose+explore+unchoose) OR skip (just recurse, no undo needed).",
    starterCode: "def subsets_str(s):\n    def dfs(i, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "At index i: option 1 — skip s[i], just dfs(i+1, path). Option 2 — include s[i], dfs, then pop.",
    "Base case: i == len(s). Add ''.join(path) to result.",
    "The skip branch doesn't modify path, so it needs no unchoose."
    ],
    solution: "def subsets_str(s):\n    def dfs(i, path):\n        if i == len(s):\n            result.append(''.join(path))\n            return\n        dfs(i + 1, path)\n        path.append(s[i])\n        dfs(i + 1, path)\n        path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Two-branch CEU: the EXCLUDE branch just recurses (no path change, no undo needed). The INCLUDE branch does the full choose-append-recurse-pop. At leaf (i == n), all 2^n combinations are captured. This is P7 with strings instead of lists.",
    testCode: "r = subsets_str('abc')\nexpected = ['','a','b','ab','c','ac','bc','abc']\nassert sorted(r) == sorted(expected)\nassert subsets_str('') == ['']\nassert len(subsets_str('abcd')) == 16\nprint('All tests passed!')"
  }
,
  {
    id: 20, stage: 2, title: "All Permutations of a String", pattern: "CEU", skill: "CEU with used-tracking",
    statement: "Given a string of distinct characters, return all permutations. Apply CEU with a used[] boolean array.",
    examples: [
      { input: "s = 'abc'", output: "['abc','acb','bac','bca','cab','cba']" }
    ],
    why: "Same as P12 but on strings. The used[] array is the state that CEU modifies: choose marks used[i]=True, unchoose marks used[i]=False. Both path AND used array must be restored.",
    starterCode: "def permute_str(s):\n    def dfs(path):\n        pass\n    result = []\n    used = [False] * len(s)\n    dfs([])\n    return result",
    hints: [
      "Maintain path (list of chars) and used[] (boolean array).",
    "For each index i: if not used[i], mark True, append s[i], recurse, pop, used[i]=False.",
    "When len(path) == len(s), join and add to result."
    ],
    solution: "def permute_str(s):\n    def dfs(path):\n        if len(path) == len(s):\n            result.append(''.join(path))\n            return\n        for i in range(len(s)):\n            if not used[i]:\n                used[i] = True\n                path.append(s[i])\n                dfs(path)\n                path.pop()\n                used[i] = False\n    result = []\n    used = [False] * len(s)\n    dfs([])\n    return result",
    walkthrough: "CEU with TWO state variables: path (append/pop) and used[] (True/False). Both must be undone after the recursive call. This dual-state restoration is critical for N-Queens, Sudoku, etc. which maintain multiple state trackers.",
    testCode: "r = permute_str('abc')\nexpected = ['abc','acb','bac','bca','cab','cba']\nassert sorted(r) == sorted(expected)\nassert len(permute_str('abcd')) == 24\nassert permute_str('') == ['']\nprint('All tests passed!')"
  }
,
  {
    id: 21, stage: 2, title: "All Combinations of K from N", pattern: "CEU", skill: "CEU with size constraint",
    statement: "Given n and k, return all combinations of k numbers from 1..n. Apply CEU with start-index: at each level, pick a number, then only pick larger numbers.",
    examples: [
      { input: "n=4, k=2", output: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]" }
    ],
    why: "Same as P13 but explicitly framed as CEU. The start index prevents duplicates from reversed orderings. Path via append/pop; start via parameter value.",
    starterCode: "def combine_nk(n, k):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(1, [])\n    return result",
    hints: [
      "Choose: for i in range(start, n+1), append i to path.",
    "Explore: dfs(i+1, path) — start becomes i+1.",
    "Unchoose: path.pop() after the recursive call."
    ],
    solution: "def combine_nk(n, k):\n    def dfs(start, path):\n        if len(path) == k:\n            result.append(path[:])\n            return\n        for i in range(start, n + 1):\n            path.append(i)\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(1, [])\n    return result",
    walkthrough: "CEU with a parameter that changes each recursion level: start advances to i+1, ensuring we never pick a smaller number after a larger one. This guarantees each combination generated exactly once. Path managed by append/pop; start managed by parameter value.",
    testCode: "r = combine_nk(4, 2)\nexpected = [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]\nassert sorted([tuple(c) for c in r]) == sorted([tuple(c) for c in expected])\nassert len(combine_nk(5, 3)) == 10\nassert combine_nk(3, 3) == [[1,2,3]]\nprint('All tests passed!')"
  }
,
  {
    id: 22, stage: 3, title: "Subsets with Target Sum", pattern: "pruning", skill: "prune if sum exceeds target",
    statement: "Given positive integers and target, return all subsets whose sum EQUALS target. Prune: if current sum exceeds target, stop exploring — adding more positives only worsens it.",
    examples: [
      { input: "nums=[2,3,6,7], target=7", output: "[[7]]" },
    { input: "nums=[1,2,3,4,5], target=5", output: "[[1,4],[2,3],[5]]" }
    ],
    why: "Introduces PRUNING: if current sum EXCEEDS target, kill this branch immediately. Pruning transforms backtracking from 'try everything' to 'try only promising branches'.",
    starterCode: "def subset_sum(nums, target):\n    def dfs(start, path, current_sum):\n        pass\n    result = []\n    dfs(0, [], 0)\n    return result",
    hints: [
      "Track current_sum. If > target, RETURN immediately.",
    "If == target, capture path (keep exploring — more may also hit target).",
    "Standard CEU: append, dfs(j+1, path, sum+nums[j]), pop. Same as P19 with sum tracker."
    ],
    solution: "def subset_sum(nums, target):\n    def dfs(start, path, current_sum):\n        if current_sum == target:\n            result.append(path[:])\n            return\n        if current_sum > target:\n            return\n        for j in range(start, len(nums)):\n            path.append(nums[j])\n            dfs(j + 1, path, current_sum + nums[j])\n            path.pop()\n    result = []\n    dfs(0, [], 0)\n    return result",
    walkthrough: "The prune check (if current_sum > target: return) happens BEFORE the recursive call. Since all numbers are positive, exceeding target makes further additions only worse. CEU structure unchanged — just added an early exit gate.",
    testCode: "r = subset_sum([1,2,3,4,5], 5)\nexpected = [[1,4],[2,3],[5]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(s) for s in expected])\nassert subset_sum([2,3,6,7], 7) == [[7]]\nassert subset_sum([], 0) == [[]]\nprint('All tests passed!')"
  }
,
  {
    id: 23, stage: 3, title: "Combination Sum (Reuse)", pattern: "pruning", skill: "unlimited reuse + sum pruning",
    statement: "Given distinct positive integers and target, return unique combinations summing to target. Each number can be used UNLIMITED times.",
    examples: [
      { input: "candidates=[2,3,6,7], target=7", output: "[[2,2,3],[7]]" },
    { input: "candidates=[2,3,5], target=8", output: "[[2,2,2,2],[2,3,3],[3,5]]" }
    ],
    why: "Key twist from P22: SAME element can be reused. Recursive call passes i (not i+1) — we can pick same element again. Combined with sum pruning.",
    starterCode: "def combination_sum(candidates, target):\n    def dfs(i, path, total):\n        pass\n    result = []\n    dfs(0, [], 0)\n    return result",
    hints: [
      "Only difference from P22: dfs(i, ...) instead of dfs(i+1, ...) when you WANT to reuse.",
    "You also need skip branch: dfs(i+1, path, total) to move past this element.",
    "Prune: if total > target, return. If total == target, capture."
    ],
    solution: "def combination_sum(candidates, target):\n    def dfs(i, path, total):\n        if total == target:\n            result.append(path[:])\n            return\n        if total > target or i == len(candidates):\n            return\n        path.append(candidates[i])\n        dfs(i, path, total + candidates[i])\n        path.pop()\n        dfs(i + 1, path, total)\n    result = []\n    dfs(0, [], 0)\n    return result",
    walkthrough: "Two-branch CEU with reuse: INCLUDE calls dfs(i, ...) — giving another chance to use this element. EXCLUDE calls dfs(i+1, ...) — skipping this element forever. Combined with sum pruning. This is the include/skip pattern from subsets adapted for reuse.",
    testCode: "r = combination_sum([2,3,6,7], 7)\nexpected = [[2,2,3],[7]]\nassert sorted([tuple(c) for c in r]) == sorted([tuple(c) for c in expected])\nr2 = combination_sum([2,3,5], 8)\nexpected2 = [[2,2,2,2],[2,3,3],[3,5]]\nassert sorted([tuple(c) for c in r2]) == sorted([tuple(c) for c in expected2])\nprint('All tests passed!')"
  }
,
  {
    id: 24, stage: 3, title: "Combination Sum II (Each Once)", pattern: "pruning", skill: "no reuse + sum prune + dedupe",
    statement: "Given candidates (may have duplicates) and target, return unique combinations summing to target. Each number used ONCE per combination.",
    examples: [
      { input: "candidates=[10,1,2,7,6,1,5], target=8", output: "[[1,1,6],[1,2,5],[1,7],[2,6]]" },
    { input: "candidates=[2,5,2,1,2], target=5", output: "[[1,2,2],[5]]" }
    ],
    why: "Same as P23 but NO reuse AND may have duplicate values. Two pruning strategies combine: sum exceeds target, AND skip duplicates at same level. Bridge to Stage 5 deduplication.",
    starterCode: "def combination_sum2(candidates, target):\n    candidates.sort()\n    def dfs(start, path, total):\n        pass\n    result = []\n    dfs(0, [], 0)\n    return result",
    hints: [
      "Sort first. Skip duplicates at same recursion level: if i > start and candidates[i]==candidates[i-1], continue.",
    "Each number used once: dfs(i+1, path, total+candidates[i]).",
    "Prune: if total > target, return immediately."
    ],
    solution: "def combination_sum2(candidates, target):\n    candidates.sort()\n    def dfs(start, path, total):\n        if total == target:\n            result.append(path[:])\n            return\n        if total > target:\n            return\n        for i in range(start, len(candidates)):\n            if i > start and candidates[i] == candidates[i - 1]:\n                continue\n            path.append(candidates[i])\n            dfs(i + 1, path, total + candidates[i])\n            path.pop()\n    result = []\n    dfs(0, [], 0)\n    return result",
    walkthrough: "Two pruning strategies combine: (1) sum prune — stop if total > target, (2) duplicate prune — at SAME recursion level, skip duplicate values. Sort enables both: sum prune works because sorted numbers, duplicate skip works because duplicates are adjacent.",
    testCode: "r = combination_sum2([10,1,2,7,6,1,5], 8)\nexpected = [[1,1,6],[1,2,5],[1,7],[2,6]]\nassert sorted([tuple(sorted(c)) for c in r]) == sorted([tuple(c) for c in expected])\nr2 = combination_sum2([2,5,2,1,2], 5)\nexpected2 = [[1,2,2],[5]]\nassert sorted([tuple(sorted(c)) for c in r2]) == sorted([tuple(c) for c in expected2])\nprint('All tests passed!')"
  }
,
  {
    id: 25, stage: 3, title: "Palindrome Partitioning", pattern: "pruning", skill: "prune non-palindromes",
    statement: "Given string s, partition it such that EVERY substring is a palindrome. Return all possible palindrome partitionings.",
    examples: [
      { input: "s = 'aab'", output: "[['a','a','b'], ['aa','b']]" },
    { input: "s = 'a'", output: "[['a']]" }
    ],
    why: "Introduces CONTENT-BASED pruning (not just sum/quantity). Before recursing, check if substring is palindrome. If not, DON'T explore that branch.",
    starterCode: "def partition(s):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Use a helper is_palindrome(s, l, r) that checks if s[l:r+1] is a palindrome.",
    "At index start, consider every end index as potential partition point.",
    "ONLY recurse if s[start:end+1] is a palindrome. The prune happens BEFORE the recursive call."
    ],
    solution: "def partition(s):\n    def is_pal(st, l, r):\n        while l < r:\n            if st[l] != st[r]:\n                return False\n            l += 1\n            r -= 1\n        return True\n    def dfs(start, path):\n        if start == len(s):\n            result.append(path[:])\n            return\n        for end in range(start, len(s)):\n            if is_pal(s, start, end):\n                path.append(s[start:end+1])\n                dfs(end + 1, path)\n                path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "At position start, try every split point end. BEFORE recursing, check: is s[start:end+1] a palindrome? If not, skip that end point entirely. The palindrome check is the PRUNE: bad partitions rejected immediately. 'Validate before recurse' is the essence of pruning.",
    testCode: "r = partition('aab')\nexpected = [['a','a','b'], ['aa','b']]\nassert sorted([tuple(p) for p in r]) == sorted([tuple(p) for p in expected])\nassert partition('a') == [['a']]\nassert len(partition('aaa')) == 4\nprint('All tests passed!')"
  }
,
  {
    id: 26, stage: 3, title: "Word Break", pattern: "pruning", skill: "prune invalid prefixes",
    statement: "Given string s and dictionary, partition s into dictionary words. Return one valid segmentation (or empty list).",
    examples: [
      { input: "s='leetcode', wordDict=['leet','code']", output: "['leet','code']" },
    { input: "s='catsandog', wordDict=['cats','dog','sand','and','cat']", output: "[]" }
    ],
    why: "Same partition structure as P25, but prune condition is dictionary membership. Every split point tested against dictionary before recursing. 'Prune' = any validation before going deeper.",
    starterCode: "def word_break(s, wordDict):\n    word_set = set(wordDict)\n    result = None\n    def dfs(start, path):\n        pass\n    dfs(0, [])\n    return result if result is not None else []",
    hints: [
      "Convert wordDict to a set for O(1) lookup.",
    "At index start, try every end point. If s[start:end+1] is in word_set, recurse.",
    "Base: if start == len(s), found valid segmentation. Short-circuit when found."
    ],
    solution: "def word_break(s, wordDict):\n    word_set = set(wordDict)\n    result = None\n    def dfs(start, path):\n        nonlocal result\n        if result is not None:\n            return\n        if start == len(s):\n            result = path[:]\n            return\n        for end in range(start, len(s)):\n            word = s[start:end+1]\n            if word in word_set:\n                path.append(word)\n                dfs(end + 1, path)\n                path.pop()\n    dfs(0, [])\n    return result if result is not None else []",
    walkthrough: "Same template as P25. Prune: dictionary membership. Only recurse if current substring is a known word. Short-circuit when first solution found. Structure: partition at valid split points. Prune = check before recurse.",
    testCode: "assert word_break('leetcode', ['leet','code']) == ['leet','code']\nassert word_break('applepenapple', ['apple','pen']) == ['apple','pen','apple']\nassert word_break('catsandog', ['cats','dog','sand','and','cat']) == []\nprint('All tests passed!')"
  }
,
  {
    id: 27, stage: 3, title: "Factor Combinations", pattern: "pruning", skill: "factor tree with bounds prune",
    statement: "Return all factor combinations of integer n (exclude 1 and n). Factors >= 2, multiply to n.",
    examples: [
      { input: "n = 12", output: "[[2,6],[2,2,3],[3,4]]" },
    { input: "n = 32", output: "[[2,16],[2,2,8],[2,2,2,4],[2,2,2,2,2],[2,4,4],[4,8]]" }
    ],
    why: "Pruning by factor bounds: only try f up to sqrt(n). Each factor >= previous to avoid duplicates. Remaining quotient must be >= current factor.",
    starterCode: "def get_factors(n):\n    def dfs(start, remaining, path):\n        pass\n    result = []\n    dfs(2, n, [])\n    return result",
    hints: [
      "Start factor from 'start' (at least 2). For f from start to int(sqrt(remaining)):",
    "If remaining % f == 0: f is valid. Add f, recurse with remaining//f, start=f.",
    "Also capture [f, remaining//f] as a complete factorization."
    ],
    solution: "def get_factors(n):\n    def dfs(start, remaining, path):\n        while start * start <= remaining:\n            if remaining % start == 0:\n                result.append(path + [start, remaining // start])\n                path.append(start)\n                dfs(start, remaining // start, path)\n                path.pop()\n            start += 1\n    result = []\n    dfs(2, n, [])\n    return result",
    walkthrough: "Three pruning ideas: (1) Only try f up to sqrt(n) — beyond, factors symmetric. (2) Start each level at previous factor to avoid permutations. (3) Only recurse if remaining % f == 0. The sqrt bound is the key prune.",
    testCode: "r = get_factors(12)\nexpected = [[2,6],[2,2,3],[3,4]]\nassert sorted([tuple(f) for f in r]) == sorted([tuple(f) for f in expected])\nr2 = get_factors(32)\nexpected2 = [[2,16],[2,2,8],[2,2,2,4],[2,2,2,2,2],[2,4,4],[4,8]]\nassert sorted([tuple(f) for f in r2]) == sorted([tuple(f) for f in expected2])\nprint('All tests passed!')"
  }
,
  {
    id: 28, stage: 3, title: "Restore IP Addresses", pattern: "pruning", skill: "segment validation + 4-parts constraint",
    statement: "Given string of digits, return all valid IP addresses by inserting 3 dots. Each segment: 0-255, no leading zeros unless '0'.",
    examples: [
      { input: "s = '25525511135'", output: "['255.255.11.135','255.255.111.35']" },
    { input: "s = '0000'", output: "['0.0.0.0']" }
    ],
    why: "Combines P25 (partition into valid segments) with numeric validation. Multiple prune rules: segment length (1-3), value <= 255, no leading zeros, exactly 4 segments total.",
    starterCode: "def restore_ip(s):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "At each position, try segment lengths 1, 2, or 3.",
    "Validate: (a) no leading zero unless '0', (b) value <= 255.",
    "Prune: if remaining chars > remaining_segments*3 or < remaining_segments, impossible."
    ],
    solution: "def restore_ip(s):\n    def dfs(start, path):\n        if len(path) == 4:\n            if start == len(s):\n                result.append('.'.join(path))\n            return\n        for length in range(1, 4):\n            if start + length > len(s):\n                break\n            segment = s[start:start+length]\n            if len(segment) > 1 and segment[0] == '0':\n                continue\n            if int(segment) > 255:\n                continue\n            remaining = len(s) - (start + length)\n            remaining_segs = 3 - len(path)\n            if remaining > remaining_segs * 3 or remaining < remaining_segs:\n                continue\n            path.append(segment)\n            dfs(start + length, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "Four prune checks per segment: (1) length bound, (2) no leading zero, (3) value <= 255, (4) remaining chars fit within remaining segments. Only when ALL pass do we recurse. Multi-constraint pruning is the hallmark of real backtracking.",
    testCode: "r = restore_ip('25525511135')\nexpected = ['255.255.11.135','255.255.111.35']\nassert sorted(r) == sorted(expected)\nassert restore_ip('0000') == ['0.0.0.0']\nassert len(restore_ip('101023')) == 5\nassert restore_ip('') == []\nprint('All tests passed!')"
  }
,
  {
    id: 29, stage: 4, title: "Permutations II — Naive Dedupe", pattern: "naive", skill: "generate all then filter with set",
    statement: "Given integers (may have duplicates), return all UNIQUE permutations. NAIVE: generate all n! permutations including duplicates, then deduplicate with set().",
    examples: [
      { input: "nums = [1,1,2]", output: "[[1,1,2],[1,2,1],[2,1,1]]" }
    ],
    why: "CONNECTION to P12. Generate ALL permutations including duplicates, then filter with set(). For [1,1,2]: 6 generated, only 3 unique — 50% waste. Stage 5 fixes this.",
    starterCode: "def permute_unique_naive(nums):\n    def dfs(path):\n        pass\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return result",
    hints: [
      "Use standard permutation DFS from P12.",
    "After generating ALL permutations, create a set of tuples, convert back.",
    "For [1,1,2], generate 6 but keep 3. 50% wasted work."
    ],
    solution: "def permute_unique_naive(nums):\n    def dfs(path):\n        if len(path) == len(nums):\n            result.append(tuple(path))\n            return\n        for i in range(len(nums)):\n            if not used[i]:\n                used[i] = True\n                path.append(nums[i])\n                dfs(path)\n                path.pop()\n                used[i] = False\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return [list(t) for t in set(result)]",
    walkthrough: "Same DFS as P12, but collect as tuples and deduplicate with set() at end. We explored all 6 branches for [1,1,2], generated 6 leaves, threw away 3. With many duplicates, waste is enormous. P36 avoids generating duplicates entirely.",
    testCode: "r = permute_unique_naive([1,1,2])\nexpected = [[1,1,2],[1,2,1],[2,1,1]]\nassert sorted([tuple(p) for p in r]) == sorted([tuple(p) for p in expected])\nassert len(r) == 3\nprint('All tests passed!')"
  }
,
  {
    id: 30, stage: 4, title: "Subsets II — Naive Dedupe", pattern: "naive", skill: "generate all subsets then set-filter",
    statement: "Given list with duplicates, return UNIQUE subsets. NAIVE: generate all 2^n subsets (with duplicates), then deduplicate with set().",
    examples: [
      { input: "nums = [1,2,2]", output: "[[],[1],[1,2],[1,2,2],[2],[2,2]]" }
    ],
    why: "CONNECTION to P9. For [1,2,2], generate 8 subsets but only 6 unique. The naive version generates duplicates from identical values at different indices. Waste = computing paths we know will be duplicates.",
    starterCode: "def subsets_dup_naive(nums):\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Use standard subset DFS from P9.",
    "Collect all subsets as tuples, use set() to deduplicate.",
    "For [2,2,2,2,2]: 2^5=32 leaves but only 6 unique. 81% waste!"
    ],
    solution: "def subsets_dup_naive(nums):\n    def dfs(start, path):\n        result.append(tuple(path))\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return [list(t) for t in set(result)]",
    walkthrough: "Same DFS as P9, collect as tuples, dedupe at end. Two identical {1,2} subsets generated from two different 2's at different indices. Set filters them post-hoc. P37 avoids generating these redundant branches by skipping duplicate values at each recursion level.",
    testCode: "r = subsets_dup_naive([1,2,2])\nexpected = [[],[1],[1,2],[1,2,2],[2],[2,2]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(s) for s in expected])\nassert len(r) == 6\nprint('All tests passed!')"
  }
,
  {
    id: 31, stage: 4, title: "Combination Sum II — Naive Filter", pattern: "naive", skill: "generate all then filter",
    statement: "Given candidates with duplicates and target, NAIVE: generate all combinations summing to target, then deduplicate. WITHOUT the duplicate-skip optimization.",
    examples: [
      { input: "candidates=[10,1,2,7,6,1,5], target=8", output: "[[1,1,6],[1,2,5],[1,7],[2,6]]" }
    ],
    why: "CONNECTION to P24. This is P24 WITHOUT the i > start duplicate check. Generate duplicate combinations and filter afterward. The waste is what P38's optimization avoids.",
    starterCode: "def combination_sum2_naive(candidates, target):\n    def dfs(i, path, total):\n        pass\n    result = []\n    dfs(0, [], 0)\n    return result",
    hints: [
      "Use standard DFS: for each i, pick or skip. Collect results as sorted tuples.",
    "After DFS, use set() to deduplicate.",
    "Compare to P24 — what line is MISSING here?"
    ],
    solution: "def combination_sum2_naive(candidates, target):\n    def dfs(i, path, total):\n        if total == target:\n            result.append(tuple(sorted(path)))\n            return\n        if total > target or i == len(candidates):\n            return\n        path.append(candidates[i])\n        dfs(i + 1, path, total + candidates[i])\n        path.pop()\n        dfs(i + 1, path, total)\n    result = []\n    dfs(0, [], 0)\n    return [list(t) for t in set(result)]",
    walkthrough: "Compare to P24 line by line. MISSING: the if i > start and ...==...: continue check. Without it, duplicates generate identical combinations. Sort each combination and use set() to filter. P38 adds the missing line to avoid the waste.",
    testCode: "r = combination_sum2_naive([10,1,2,7,6,1,5], 8)\nexpected = [[1,1,6],[1,2,5],[1,7],[2,6]]\nassert sorted([tuple(c) for c in r]) == sorted([tuple(c) for c in expected])\nassert len(r) == 4\nprint('All tests passed!')"
  }
,
  {
    id: 32, stage: 4, title: "N-Queens — Naive Generate All", pattern: "naive", skill: "generate all n! then validate",
    statement: "Place n queens on nxn so no two attack. NAIVE: generate all n! column permutations, then check each board for diagonal conflicts.",
    examples: [
      { input: "n = 4", output: "2 solutions" }
    ],
    why: "Naive: generate all n! column permutations, then check diagonals. 8! = 40320 manageable. n=12 gives 479M — absurd. Pruning (P39) avoids generating hopeless boards.",
    starterCode: "def n_queens_naive(n):\n    def is_valid(board):\n        pass\n    pass",
    hints: [
      "Represent board as permutation of columns (one per row).",
    "Diagonal conflict: abs(row_i - row_j) == abs(cols[i] - cols[j]).",
    "Generate all n! via swap (P11). Validate each. Format valid ones."
    ],
    solution: "def n_queens_naive(n):\n    def is_valid(cols):\n        for i in range(n):\n            for j in range(i + 1, n):\n                if abs(i - j) == abs(cols[i] - cols[j]):\n                    return False\n        return True\n    def permute(pos):\n        if pos == n:\n            all_cols.append(cols[:])\n            return\n        for i in range(pos, n):\n            cols[pos], cols[i] = cols[i], cols[pos]\n            permute(pos + 1)\n            cols[pos], cols[i] = cols[i], cols[pos]\n    all_cols = []\n    cols = list(range(n))\n    permute(0)\n    solutions = []\n    for c in all_cols:\n        if is_valid(c):\n            board = ['.' * i + 'Q' + '.' * (n - 1 - i) for i in c]\n            solutions.append(board)\n    return solutions",
    walkthrough: "Generate all n! column permutations (P11 swap). Then validate each: check diagonal conflicts. For n=4: 24 perms, 2 valid. For n=8: 40320 perms, 92 valid. 99.8% of generated boards are invalid! P39 prunes during construction.",
    testCode: "assert len(n_queens_naive(4)) == 2\nassert len(n_queens_naive(5)) == 10\nassert len(n_queens_naive(1)) == 1\nprint('All tests passed!')"
  }
,
  {
    id: 33, stage: 4, title: "Sudoku — Naive (Thought Experiment)", pattern: "naive", skill: "understand why naive is impossible",
    statement: "Understand that generating ALL possible filled Sudoku grids is impossible (~6.67x10^21). This is a THOUGHT EXPERIMENT — explain why naive generation fails.",
    examples: [
      { input: "9x9 empty grid", output: "~6.67x10^21 possible filled grids" }
    ],
    why: "Contrast: N-Queens (P32) was 8! ~ 4x10^4 — doable. Sudoku naive: ~6.67x10^21 — physically impossible. Backtracking is not 'try everything' — it's 'try everything SMARTLY with pruning.'",
    starterCode: "# Thought experiment — no code needed\n# Why can't we generate all filled Sudoku grids?\npass",
    hints: [
      "Each cell can be 1-9. That's 9^81 ~ 2x10^77 ignoring constraints.",
    "Even with constraints, it's ~6.67x10^21 — physically impossible.",
    "This is WHY we need pruning. Brute force cannot work. Backtracking WITH constraints can."
    ],
    solution: "# No code solution — this is a thought experiment.\n# Search space is 10^21+, impossible to enumerate.\n# Pruning (stage 5/6) makes it solvable by building incrementally\n# and checking constraints at every step, not at the end.",
    walkthrough: "N-Queens naive (P32): 8! ~ 4x10^4 — doable. Sudoku naive: 6.67x10^21 — physically impossible. This is the fundamental motivation for pruning: some search spaces are too vast to generate-then-filter. You MUST prune during construction. Stages 5-6 build this ability.",
    testCode: "# The key insight: prune during construction, not after\nassert True\nprint('All tests passed!')"
  }
,
  {
    id: 34, stage: 4, title: "Word Search — Naive Generate", pattern: "naive", skill: "generate all board paths then match",
    statement: "Given mxn board and word, return True if word exists. NAIVE: generate ALL possible paths of length len(word), then check if any spells the word.",
    examples: [
      { input: "board=[['A','B'],['C','D']], word='AB'", output: "True" }
    ],
    why: "Grid search naive: at each step, up to 4 directions. For word length L on MxN board: up to MxNx4^L paths. Most paths don't match. P41 prunes: only follow if char matches.",
    starterCode: "def exist_naive(board, word):\n    def dfs(r, c, path, visited):\n        pass\n    pass",
    hints: [
      "DFS from every cell. Build all possible paths of length len(word).",
    "Track visited cells. At each step, up to 4 directions.",
    "Collect all strings formed, then check if word is among them."
    ],
    solution: "def exist_naive(board, word):\n    def dfs(r, c, path, visited):\n        if len(path) == len(word):\n            result.append(''.join(path))\n            return\n        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < R and 0 <= nc < C and (nr, nc) not in visited:\n                visited.add((nr, nc))\n                path.append(board[nr][nc])\n                dfs(nr, nc, path, visited)\n                path.pop()\n                visited.remove((nr, nc))\n    R, C = len(board), len(board[0])\n    result = []\n    for r in range(R):\n        for c in range(C):\n            visited = {(r, c)}\n            dfs(r, c, [board[r][c]], visited)\n    return word in result",
    walkthrough: "Generate ALL paths of length L from every starting cell. Only AFTER building each complete path do we check if it matches. Waste: most paths diverge at step 1 or 2, but we still explore all L steps. P41 prunes: only proceed if board[nr][nc] == word[len(path)].",
    testCode: "board = [['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nassert exist_naive(board, 'ABCCED') == True\nassert exist_naive(board, 'SEE') == True\nassert exist_naive(board, 'ABCB') == False\nprint('All tests passed!')"
  }
,
  {
    id: 35, stage: 4, title: "Subsets of Multiset — Naive", pattern: "naive", skill: "generate 2^n then dedupe",
    statement: "Given list with duplicates, return unique subsets. NAIVE: generate all 2^n subsets, then deduplicate with set().",
    examples: [
      { input: "nums = [1,2,2,3]", output: "unique subsets" }
    ],
    why: "Like P30 but explicit waste count. For [2,2,2,2,2]: 2^5=32 leaves, only 6 unique — 81% waste. Makes P37 optimization feel necessary.",
    starterCode: "def subsets_multiset_naive(nums):\n    def dfs(i, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Standard include/exclude DFS. Collect paths as tuples.",
    "Use set() to deduplicate. Count generated vs unique.",
    "For [2,2,2,2,2], generate 32 branches but only 6 unique subsets."
    ],
    solution: "def subsets_multiset_naive(nums):\n    def dfs(i, path):\n        if i == len(nums):\n            result.append(tuple(sorted(path)))\n            return\n        dfs(i + 1, path)\n        path.append(nums[i])\n        dfs(i + 1, path)\n        path.pop()\n    result = []\n    dfs(0, [])\n    return [list(t) for t in set(result)]",
    walkthrough: "The more duplicates, the worse the waste. Each duplicate creates branches differing only in WHICH copy of the duplicate they pick — producing identical results. The set filters post-hoc. P37 avoids generating these redundant branches entirely.",
    testCode: "r = subsets_multiset_naive([1,2,2])\nassert len(r) == 6\nr2 = subsets_multiset_naive([2,2,2])\nassert len(r2) == 4\nprint('All tests passed!')"
  }
,
  {
    id: 36, stage: 5, title: "Permutations II — Sort + Skip Same Level", pattern: "optimization", skill: "deduplicate during construction",
    statement: "Given list with duplicates, return ALL unique permutations. OPTIMIZED: sort, then at each recursion level skip duplicate values at the SAME position.",
    examples: [
      { input: "nums = [1,1,2]", output: "[[1,1,2],[1,2,1],[2,1,1]]" },
    { input: "nums = [1,2,3]", output: "6 unique permutations" }
    ],
    why: "CONNECTION: P29 generated all then filtered — wasteful. This skips duplicate values at each recursion level. When you pick first '1', explore all paths. Second '1' at same level: skip — its paths already covered.",
    starterCode: "def permute_unique(nums):\n    nums.sort()\n    def dfs(path):\n        pass\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return result",
    hints: [
      "Sort first so duplicates are adjacent.",
    "Skip: if i > 0 and nums[i] == nums[i-1] and not used[i-1], continue.",
    "Why not used[i-1]? Previous duplicate NOT used means we already finished exploring that value at this level."
    ],
    solution: "def permute_unique(nums):\n    nums.sort()\n    def dfs(path):\n        if len(path) == len(nums):\n            result.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i]:\n                continue\n            if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:\n                continue\n            used[i] = True\n            path.append(nums[i])\n            dfs(path)\n            path.pop()\n            used[i] = False\n    result = []\n    used = [False] * len(nums)\n    dfs([])\n    return result",
    walkthrough: "Key line: if i>0 and nums[i]==nums[i-1] and not used[i-1]: continue. When we see a duplicate at same level AND previous identical value NOT used (completed subtree for that value at this position), skip. Avoids generating duplicate permutations before they reach leaf level. No post-processing set needed.",
    testCode: "r = permute_unique([1,1,2])\nexpected = [[1,1,2],[1,2,1],[2,1,1]]\nassert sorted([tuple(p) for p in r]) == sorted([tuple(p) for p in expected])\nassert len(r) == 3\nassert len(permute_unique([2,2,1,1])) == 6\nprint('All tests passed!')"
  }
,
  {
    id: 37, stage: 5, title: "Subsets II — Sort + Skip Duplicates", pattern: "optimization", skill: "skip adjacent equals at same level",
    statement: "Given list with duplicates, return UNIQUE subsets. OPTIMIZED: sort, then at each recursion level skip element if equal to one just processed.",
    examples: [
      { input: "nums = [1,2,2]", output: "[[],[1],[1,2],[1,2,2],[2],[2,2]]" }
    ],
    why: "CONNECTION: P30 generated all then deduped. This sort+skip: after exploring subsets including first '2', skip second '2' at same level — any subset starting with second '2' is identical.",
    starterCode: "def subsets_dup_opt(nums):\n    nums.sort()\n    def dfs(start, path):\n        pass\n    result = []\n    dfs(0, [])\n    return result",
    hints: [
      "Sort first. At for-loop level, after dfs returns check:",
    "If i > start and nums[i] == nums[i-1]: continue.",
    "Works because if nums[i]==nums[i-1], all subsets starting with nums[i] already generated when exploring nums[i-1]."
    ],
    solution: "def subsets_dup_opt(nums):\n    nums.sort()\n    def dfs(start, path):\n        result.append(path[:])\n        for i in range(start, len(nums)):\n            if i > start and nums[i] == nums[i - 1]:\n                continue\n            path.append(nums[i])\n            dfs(i + 1, path)\n            path.pop()\n    result = []\n    dfs(0, [])\n    return result",
    walkthrough: "The for-loop iterates over choices at this level. After popping from dfs(i+1), check: next element same value? If so, skip — paths starting from it identical to what we just explored. Sort ensures duplicates adjacent. O(2^n) but with fewer actual recursive calls.",
    testCode: "r = subsets_dup_opt([1,2,2])\nexpected = [[],[1],[1,2],[1,2,2],[2],[2,2]]\nassert sorted([tuple(sorted(s)) for s in r]) == sorted([tuple(s) for s in expected])\nassert len(r) == 6\nr2 = subsets_dup_opt([4,4,4,1,4])\nassert len(r2) == len(set(tuple(sorted(s)) for s in r2))\nprint('All tests passed!')"
  }
,
  {
    id: 38, stage: 5, title: "Combination Sum II — Sort + Early Stop", pattern: "optimization", skill: "duplicate skip + break loop",
    statement: "Given candidates with duplicates and target, OPTIMIZED: sort, then (1) skip duplicates at same level, (2) break if current exceeds remaining target.",
    examples: [
      { input: "candidates=[10,1,2,7,6,1,5], target=8", output: "[[1,1,6],[1,2,5],[1,7],[2,6]]" }
    ],
    why: "CONNECTION: P31 generated all then filtered. Two optimizations: (1) duplicate skip from P37, (2) early break: sorted means all later >= current, so if exceeds target, rest useless.",
    starterCode: "def combination_sum2_opt(candidates, target):\n    candidates.sort()\n    def dfs(start, path, total):\n        pass\n    result = []\n    dfs(0, [], 0)\n    return result",
    hints: [
      "Sort first. In DFS loop:",
    "(1) if i > start and candidates[i]==candidates[i-1]: continue.",
    "(2) if total+candidates[i] > target: break (all subsequent larger)."
    ],
    solution: "def combination_sum2_opt(candidates, target):\n    candidates.sort()\n    def dfs(start, path, total):\n        if total == target:\n            result.append(path[:])\n            return\n        for i in range(start, len(candidates)):\n            if i > start and candidates[i] == candidates[i - 1]:\n                continue\n            if total + candidates[i] > target:\n                break\n            path.append(candidates[i])\n            dfs(i + 1, path, total + candidates[i])\n            path.pop()\n    result = []\n    dfs(0, [], 0)\n    return result",
    walkthrough: "Two optimization lines: (1) duplicate skip, (2) early break. These eliminate entire subtrees: duplicate branches and impossible branches. The sort enables both optimizations.",
    testCode: "r = combination_sum2_opt([10,1,2,7,6,1,5], 8)\nexpected = [[1,1,6],[1,2,5],[1,7],[2,6]]\nassert sorted([tuple(sorted(c)) for c in r]) == sorted([tuple(c) for c in expected])\nr2 = combination_sum2_opt([2,5,2,1,2], 5)\nexpected2 = [[1,2,2],[5]]\nassert sorted([tuple(sorted(c)) for c in r2]) == sorted([tuple(c) for c in expected2])\nprint('All tests passed!')"
  }
,
  {
    id: 39, stage: 5, title: "N-Queens — Prune via Col/Diag Sets", pattern: "optimization", skill: "constraint propagation during placement",
    statement: "Place n queens on nxn so no two attack. OPTIMIZED: track occupied columns/diagonals in sets. Only try columns that are available — prune the rest.",
    examples: [
      { input: "n = 4", output: "2 solutions" },
    { input: "n = 8", output: "92 solutions" }
    ],
    why: "CONNECTION: P32 generated all n! then checked — 99.8% wasted. This maintains cols, diag1, diag2 sets. Before placing queen, check if col/diagonals free. If not, skip. Reduces search from n! to valid placements only.",
    starterCode: "def n_queens_opt(n):\n    def dfs(row):\n        pass\n    pass",
    hints: [
      "Place row by row. Track: col set, diag1 (row+col), diag2 (row-col).",
    "For each column: if col in no sets, place queen, add to sets, recurse, remove.",
    "diag1=row+col (same sum = same / diagonal). diag2=row-col (same diff = same \\ diagonal)."
    ],
    solution: "def n_queens_opt(n):\n    def dfs(row):\n        if row == n:\n            board = ['.' * c + 'Q' + '.' * (n - 1 - c) for c in placement]\n            solutions.append(board)\n            return\n        for col in range(n):\n            if col in cols or (row + col) in diag1 or (row - col) in diag2:\n                continue\n            placement.append(col)\n            cols.add(col)\n            diag1.add(row + col)\n            diag2.add(row - col)\n            dfs(row + 1)\n            cols.remove(col)\n            diag1.remove(row + col)\n            diag2.remove(row - col)\n            placement.pop()\n    solutions = []\n    placement = []\n    cols = set()\n    diag1 = set()\n    diag2 = set()\n    dfs(0)\n    return solutions",
    walkthrough: "CEU on THREE state variables: placement, cols, diag1, diag2. Before placing: check sets — O(1) validation instead of O(n^2) post-hoc. The prune: if col taken, skip. If diagonal attacked, skip. Row-by-row guarantees no row conflicts. Sets make diagonal checks O(1).",
    testCode: "assert len(n_queens_opt(4)) == 2\nassert len(n_queens_opt(8)) == 92\nassert len(n_queens_opt(1)) == 1\nprint('All tests passed!')"
  }
,
  {
    id: 40, stage: 5, title: "Sudoku Solver — Prune Rows/Cols/Boxes", pattern: "optimization", skill: "constraint sets for 9x9 board",
    statement: "Solve partially filled 9x9 Sudoku. OPTIMIZED: maintain row, col, box constraint sets. Only try digits that satisfy ALL three constraints.",
    examples: [
      { input: "board = [[5,3,.],[6,.,.],[.,9,8],...]", output: "filled valid board" }
    ],
    why: "CONNECTION: P33 showed naive impossible. This makes it tractable: each empty cell has <=9 choices, but 3 constraint sets prune most. Typical 50 empties: without pruning 9^50, with pruning near-linear.",
    starterCode: "def solve_sudoku(board):\n    pass",
    hints: [
      "Precompute rows[9], cols[9], boxes[9] sets from board. box = (r//3)*3 + c//3.",
    "Find next empty cell. For '1'-'9': if digit not in sets, place.",
    "Place digit, update sets, recurse. If fails, remove digit, restore sets (unchoose)."
    ],
    solution: "def solve_sudoku(board):\n    rows = [set() for _ in range(9)]\n    cols = [set() for _ in range(9)]\n    boxes = [set() for _ in range(9)]\n    empties = []\n    for r in range(9):\n        for c in range(9):\n            if board[r][c] != '.':\n                d = board[r][c]\n                rows[r].add(d)\n                cols[c].add(d)\n                boxes[(r//3)*3 + c//3].add(d)\n            else:\n                empties.append((r, c))\n    def dfs(idx):\n        if idx == len(empties):\n            return True\n        r, c = empties[idx]\n        bx = (r // 3) * 3 + c // 3\n        for d in '123456789':\n            if d not in rows[r] and d not in cols[c] and d not in boxes[bx]:\n                board[r][c] = d\n                rows[r].add(d)\n                cols[c].add(d)\n                boxes[bx].add(d)\n                if dfs(idx + 1):\n                    return True\n                rows[r].remove(d)\n                cols[c].remove(d)\n                boxes[bx].remove(d)\n                board[r][c] = '.'\n        return False\n    dfs(0)\n    return board",
    walkthrough: "Three constraint sets are the pruner. Before trying a digit: O(1) check against all three. CEU modifies FOUR things: board, rows, cols, boxes — all restored on backtrack. P39's set-pruning pattern applied to 9x9.",
    testCode: "board = [['5','3','.','.','7','.','.','.','.'],['6','.','.','1','9','5','.','.','.'],['.','9','8','.','.','.','.','6','.'],['8','.','.','.','6','.','.','.','3'],['4','.','.','8','.','3','.','.','1'],['7','.','.','.','2','.','.','.','6'],['.','6','.','.','.','.','2','8','.'],['.','.','.','4','1','9','.','.','5'],['.','.','.','.','8','.','.','7','9']]\nsolved = solve_sudoku([row[:] for row in board])\nfor r in range(9):\n    for c in range(9):\n        assert solved[r][c] != '.'\n    assert len(set(solved[r])) == 9\nprint('All tests passed!')"
  }
,
  {
    id: 41, stage: 5, title: "Word Search — Prune Char Mismatch", pattern: "optimization", skill: "prune on character mismatch",
    statement: "Given mxn board and word, return True if word exists. OPTIMIZED: at each DFS step, check board[r][c]==word[idx] BEFORE recursing. If mismatch, return immediately.",
    examples: [
      { input: "board=[['A','B'],['C','D']], word='AB'", output: "True" },
    { input: "board=[['A','B'],['C','D']], word='ABCD'", output: "False" }
    ],
    why: "CONNECTION: P34 explored ALL paths then checked. This prunes: at each cell, check if char matches. If not, don't enter DFS. This single check eliminates >90% of branches. Prune at the GATE, not the leaf.",
    starterCode: "def exist(board, word):\n    def dfs(r, c, idx):\n        pass\n    pass",
    hints: [
      "First check in DFS: board[r][c]==word[idx]? If not, return False.",
    "If idx==len(word)-1 AND match, word found.",
    "Mark cell visited (#), explore 4 directions, restore cell."
    ],
     solution: "def exist(board, word):\n    def dfs(r, c, idx):\n        if idx == len(word):\n            return True\n        if r < 0 or r >= R or c < 0 or c >= C or board[r][c] != word[idx]:\n            return False\n        temp = board[r][c]\n        board[r][c] = '#'\n        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:\n            if dfs(r + dr, c + dc, idx + 1):\n                board[r][c] = temp\n                return True\n        board[r][c] = temp\n        return False\n    R, C = len(board), len(board[0])\n    for r in range(R):\n        for c in range(C):\n            if dfs(r, c, 0):\n                return True\n    return False",
    walkthrough: "The prune is the FIRST check: if board[r][c]!=word[idx]: return False. This stops exploration of paths that don't match character by character. For word='XYZW' and board[0][0]='A', we don't even enter DFS from that cell. Each step requires character match. Simplest and most effective prune.",
    testCode: "board = [['A','B','C','E'],['S','F','C','S'],['A','D','E','E']]\nassert exist(board, 'ABCCED') == True\nassert exist(board, 'SEE') == True\nassert exist(board, 'ABCB') == False\nassert exist([['a']], 'a') == True\nprint('All tests passed!')"
  }
,
  {
    id: 42, stage: 5, title: "Letter Tile Possibilities", pattern: "optimization", skill: "count+dfs with frequency map",
    statement: "Given string of letter tiles (may have duplicates), return number of possible non-empty sequences. Just COUNT, don't list them.",
    examples: [
      { input: "tiles='AAB'", output: "8", explain: "A,B,AA,AB,BA,AAB,ABA,BAA" },
    { input: "tiles='AAABBC'", output: "188" },
    { input: "tiles='V'", output: "1" }
    ],
    why: "Optimization via frequency counting instead of permutation generation. Use char-count map to avoid duplicate branches. At each level, try each available character. The count deduplicates naturally.",
    starterCode: "def num_tile_possibilities(tiles):\n    from collections import Counter\n    freq = Counter(tiles)\n    def dfs():\n        pass\n    return dfs()",
    hints: [
      "Use frequency counter (dict char->count) instead of sorting+used array.",
    "In dfs: for each char with count>0, decrement, count 1+dfs(), increment (unchoose).",
    "The counter naturally deduplicates — iterate over unique chars, not indices."
    ],
    solution: "def num_tile_possibilities(tiles):\n    from collections import Counter\n    freq = Counter(tiles)\n    def dfs():\n        total = 0\n        for ch in freq:\n            if freq[ch] > 0:\n                freq[ch] -= 1\n                total += 1 + dfs()\n                freq[ch] += 1\n        return total\n    return dfs()",
    walkthrough: "Frequency map approach: at each level, try each UNIQUE character with remaining tiles. Decrement count (choose), add 1 + dfs() (longer sequences), increment (unchoose). The counter prevents duplicates because we iterate over characters, not indices. Counts without generating all permutations.",
    testCode: "assert num_tile_possibilities('AAB') == 8\nassert num_tile_possibilities('AAABBC') == 188\nassert num_tile_possibilities('V') == 1\nassert num_tile_possibilities('ABC') == 15\nprint('All tests passed!')"
  }
,
  {
    id: 43, stage: 6, title: "N-Queens — All Solutions", pattern: "mastery", skill: "full constraint system with output formatting",
    statement: "Place n queens on nxn, return ALL board configurations as list of strings ('.' empty, 'Q' queen). LeetCode 51.",
    examples: [
      { input: "n=4", output: "[['.Q..','...Q','Q...','..Q.'],['..Q.','Q...','...Q','.Q..']]" },
    { input: "n=1", output: "[['Q']]" }
    ],
    why: "Composes P39's constraint set pruning with full solution collection and formatting. Complete LeetCode 51. Tests all skills: constraint tracking, CEU, output formatting.",
    starterCode: "def solve_n_queens(n):\n    def dfs(row):\n        pass\n    solutions = []\n    placement = []\n    cols = set()\n    diag1 = set()\n    diag2 = set()\n    dfs(0)\n    return solutions",
    hints: [
      "Place row by row. Check col/diag1/diag2 sets.",
    "diag1=row+col (/ diag). diag2=row-col (\\ diag).",
    "When row==n: format placement into board strings, add to solutions."
    ],
    solution: "def solve_n_queens(n):\n    def dfs(row):\n        if row == n:\n            board = []\n            for c in placement:\n                board.append('.' * c + 'Q' + '.' * (n - 1 - c))\n            solutions.append(board)\n            return\n        for col in range(n):\n            if col in cols or (row + col) in diag1 or (row - col) in diag2:\n                continue\n            placement.append(col)\n            cols.add(col)\n            diag1.add(row + col)\n            diag2.add(row - col)\n            dfs(row + 1)\n            cols.remove(col)\n            diag1.remove(row + col)\n            diag2.remove(row - col)\n            placement.pop()\n    solutions = []\n    placement = []\n    cols = set()\n    diag1 = set()\n    diag2 = set()\n    dfs(0)\n    return solutions",
    walkthrough: "P39 polished into LeetCode-ready solution. CEU touches FOUR state variables: placement, cols, diag1, diag2. At row n, format column positions into board. The diagonal trick (row+col for /, row-col for \\) is the key insight.",
    testCode: "r = solve_n_queens(4)\nassert len(r) == 2\nexpected = [['.Q..','...Q','Q...','..Q.'], ['..Q.','Q...','...Q','.Q..']]\nfor sol in r:\n    assert sol in expected\nassert solve_n_queens(1) == [['Q']]\nassert len(solve_n_queens(8)) == 92\nprint('All tests passed!')"
  }
,
  {
    id: 44, stage: 6, title: "Sudoku Solver Full", pattern: "mastery", skill: "full constraint propagation",
    statement: "Write complete Sudoku solver. Given 9x9 board with '1'-'9' or '.', fill in-place. LeetCode 37.",
    examples: [
      { input: "standard Sudoku puzzle", output: "fully filled valid board" }
    ],
    why: "CONNECTION: P40 gave the structure. This is the polished LeetCode 37. Composes: constraint sets (rows/cols/boxes), CEU on four state variables, backtrack on failure, early return on success.",
    starterCode: "def solveSudoku(board):\n    pass",
    hints: [
      "Precompute rows, cols, boxes sets from given board.",
    "Find empty cell, iterate '1'-'9'. Check all 3 sets.",
    "Place temporarily, recurse. If success return True. If failure restore."
    ],
    solution: "def solveSudoku(board):\n    rows = [set() for _ in range(9)]\n    cols = [set() for _ in range(9)]\n    boxes = [set() for _ in range(9)]\n    for r in range(9):\n        for c in range(9):\n            if board[r][c] != '.':\n                d = board[r][c]\n                rows[r].add(d)\n                cols[c].add(d)\n                boxes[(r//3)*3 + c//3].add(d)\n    def dfs():\n        for r in range(9):\n            for c in range(9):\n                if board[r][c] == '.':\n                    bx = (r // 3) * 3 + c // 3\n                    for d in '123456789':\n                        if d not in rows[r] and d not in cols[c] and d not in boxes[bx]:\n                            board[r][c] = d\n                            rows[r].add(d)\n                            cols[c].add(d)\n                            boxes[bx].add(d)\n                            if dfs():\n                                return True\n                            rows[r].remove(d)\n                            cols[c].remove(d)\n                            boxes[bx].remove(d)\n                            board[r][c] = '.'\n                    return False\n        return True\n    dfs()\n    return board",
    walkthrough: "Find first empty cell (double loop). For each digit 1-9: check three constraint sets. If valid: place, update sets, recurse. If recursion succeeds — propagate True up. If fails — restore board+sets and try next digit. Constraint sets make each check O(1).",
    testCode: "board = [['5','3','.','.','7','.','.','.','.'],['6','.','.','1','9','5','.','.','.'],['.','9','8','.','.','.','.','6','.'],['8','.','.','.','6','.','.','.','3'],['4','.','.','8','.','3','.','.','1'],['7','.','.','.','2','.','.','.','6'],['.','6','.','.','.','.','2','8','.'],['.','.','.','4','1','9','.','.','5'],['.','.','.','.','8','.','.','7','9']]\nsolved = solveSudoku([row[:] for row in board])\nfor r in range(9):\n    for c in range(9):\n        assert solved[r][c] != '.'\n        assert 1 <= int(solved[r][c]) <= 9\n    assert len(set(solved[r])) == 9\nprint('All tests passed!')"
  }
,
  {
    id: 45, stage: 6, title: "Word Search II — Trie + DFS", pattern: "mastery", skill: "trie-guided multi-word search",
    statement: "Given mxn board and list of words, return all words found (adjacent cells). OPTIMIZE: build Trie, DFS with trie-guided pruning. LeetCode 212.",
    examples: [
      { input: "board=[['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], words=['oath','pea','eat','rain']", output: "['eat','oath']" },
    { input: "board=[['a','b'],['c','d']], words=['abcb']", output: "[]" }
    ],
    why: "THE crown jewel. Composes P41 (word search) with Trie for multi-word search. Trie merges all words into one search: DFS the board once, following trie nodes. If no word starts with prefix, prune.",
    starterCode: "def find_words(board, words):\n    pass",
    hints: [
      "Build Trie from words. Each node has children dict and optional word.",
    "DFS board: at each cell, check if char exists in current trie node's children.",
    "If node.word exists, add to result (nullify to avoid duplicates)."
    ],
    solution: "def find_words(board, words):\n    class TrieNode:\n        def __init__(self):\n            self.children = {}\n            self.word = None\n    root = TrieNode()\n    for w in words:\n        node = root\n        for ch in w:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.word = w\n    def dfs(r, c, node):\n        ch = board[r][c]\n        if ch not in node.children:\n            return\n        node = node.children[ch]\n        if node.word:\n            result.append(node.word)\n            node.word = None\n        temp = board[r][c]\n        board[r][c] = '#'\n        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < R and 0 <= nc < C and board[nr][nc] != '#':\n                dfs(nr, nc, node)\n        board[r][c] = temp\n    R, C = len(board), len(board[0])\n    result = []\n    for r in range(R):\n        for c in range(C):\n            dfs(r, c, root)\n    return result",
    walkthrough: "Trie merges all words into a single prefix tree. DFS follows trie nodes: at each cell, only proceed if board[r][c] exists in current trie node's children. This prunes ALL words simultaneously. When trie node has word, capture and nullify. P41 scaled to multiple words.",
    testCode: "board = [['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']]\nwords = ['oath','pea','eat','rain']\nr = find_words([row[:] for row in board], words)\nassert sorted(r) == sorted(['eat','oath'])\nassert find_words([['a','b'],['c','d']], ['abcb']) == []\nassert find_words([['a']], ['a']) == ['a']\nprint('All tests passed!')"
  }
,
  {
    id: 46, stage: 6, title: "Combination Sum III", pattern: "mastery", skill: "k numbers summing to n (1-9, once each)",
    statement: "Find all combinations of k numbers from 1-9 (each at most once) summing to n. LeetCode 216.",
    examples: [
      { input: "k=3, n=7", output: "[[1,2,4]]" },
    { input: "k=3, n=9", output: "[[1,2,6],[1,3,5],[2,3,4]]" },
    { input: "k=4, n=1", output: "[]" }
    ],
    why: "Composes P13 (combinations) + P22 (target sum) + P38 (early break). Three constraints: exactly k numbers, sum=n, numbers 1-9 once. The intersection is the knapsack pattern.",
    starterCode: "def combination_sum3(k, n):\n    def dfs(start, path, total):\n        pass\n    result = []\n    dfs(1, [], 0)\n    return result",
    hints: [
      "Use start to enforce increasing order.",
    "Prune 1: len(path)==k check total==n. Prune 2: total>n or start>9 return.",
    "Prune 3: if total+i>n break (sorted, all larger numbers also too big)."
    ],
    solution: "def combination_sum3(k, n):\n    def dfs(start, path, total):\n        if len(path) == k:\n            if total == n:\n                result.append(path[:])\n            return\n        if total > n or start > 9:\n            return\n        for i in range(start, 10):\n            if total + i > n:\n                break\n            path.append(i)\n            dfs(i + 1, path, total + i)\n            path.pop()\n    result = []\n    dfs(1, [], 0)\n    return result",
    walkthrough: "Three prune conditions combine: (1) size prune — stop at k, (2) sum prune — exceed n, (3) domain prune — numbers 1-9 only. Early break uses sorted nature. Composes P13's start index, P22's sum prune, P38's early break.",
    testCode: "assert combination_sum3(3, 7) == [[1,2,4]]\nr = combination_sum3(3, 9)\nexpected = [[1,2,6],[1,3,5],[2,3,4]]\nassert sorted([tuple(c) for c in r]) == sorted([tuple(c) for c in expected])\nassert combination_sum3(4, 1) == []\nassert len(combination_sum3(3, 15)) > 0\nprint('All tests passed!')"
  }
,
  {
    id: 47, stage: 6, title: "Beautiful Arrangement", pattern: "mastery", skill: "permutation with divisibility constraint",
    statement: "Count beautiful arrangements of 1..n: for every i (1-indexed), perm[i]%i==0 OR i%perm[i]==0. LeetCode 526.",
    examples: [
      { input: "n=2", output: "2", explain: "[1,2] and [2,1]" },
    { input: "n=3", output: "3" },
    { input: "n=1", output: "1" }
    ],
    why: "Composes P12 (permutations with used[]) with divisibility constraint at EACH position. The prune: only place num at pos i if divisibility holds. For n=15, 24679 of 1.3x10^12 permutations valid — constraint check makes this solvable.",
    starterCode: "def count_arrangement(n):\n    def dfs(pos):\n        pass\n    used = [False] * (n + 1)\n    return dfs(1)",
    hints: [
      "Build permutation from pos 1 to n. At each position, try unused numbers.",
    "Prune: only place num if num%pos==0 or pos%num==0.",
    "Return count of valid complete permutations."
    ],
    solution: "def count_arrangement(n):\n    def dfs(pos):\n        if pos > n:\n            return 1\n        total = 0\n        for num in range(1, n + 1):\n            if not used[num] and (num % pos == 0 or pos % num == 0):\n                used[num] = True\n                total += dfs(pos + 1)\n                used[num] = False\n        return total\n    used = [False] * (n + 1)\n    return dfs(1)",
    walkthrough: "At position pos (1-indexed), iterate over numbers 1..n. Two checks: (1) unused (P12), (2) divisibility. Only if BOTH pass recurse. For n=15, only 24679 of 1.3x10^12 permutations are valid. The constraint check eliminates enormous branches early.",
    testCode: "assert count_arrangement(1) == 1\nassert count_arrangement(2) == 2\nassert count_arrangement(3) == 3\nassert count_arrangement(5) == 10\nassert count_arrangement(10) == 700\nprint('All tests passed!')"
  }
,
  {
    id: 48, stage: 6, title: "Matchsticks to Square", pattern: "mastery", skill: "partition into equal-sum subsets",
    statement: "Given matchstick lengths, return True if you can form a square using ALL sticks (each exactly once). 4 equal sides. LeetCode 473.",
    examples: [
      { input: "matchsticks=[1,1,2,2,2]", output: "True" },
    { input: "matchsticks=[3,3,3,3,4]", output: "False" }
    ],
    why: "Composes P22 (subset sum) extended to 4 equal-sum partitions. Each stick goes to one of 4 buckets. Prunes: sum%4==0, no bucket exceeds target, sort descending to fail fast.",
    starterCode: "def makesquare(matchsticks):\n    pass",
    hints: [
      "Target side = sum//4. Must be exact division.",
    "Sort descending — larger sticks first means earlier failure.",
    "DFS: for each stick, try placing in each of 4 sides. Prune if bucket exceeds target."
    ],
    solution: "def makesquare(matchsticks):\n    total = sum(matchsticks)\n    if total % 4 != 0:\n        return False\n    target = total // 4\n    matchsticks.sort(reverse=True)\n    if matchsticks[0] > target:\n        return False\n    sides = [0] * 4\n    def dfs(idx):\n        if idx == len(matchsticks):\n            return sides[0] == sides[1] == sides[2] == target\n        stick = matchsticks[idx]\n        for i in range(4):\n            if sides[i] + stick <= target:\n                if i > 0 and sides[i] == sides[i - 1]:\n                    continue\n                sides[i] += stick\n                if dfs(idx + 1):\n                    return True\n                sides[i] -= stick\n        return False\n    return dfs(0)",
    walkthrough: "Partition problem: assign each stick to one of 4 buckets. Prune aggressively: (1) total divisible by 4, (2) sort descending, (3) skip equal-capacity buckets, (4) overflow check. CEU: add to bucket (choose), recurse (explore), remove (unchoose). Four buckets instead of one path.",
    testCode: "assert makesquare([1,1,2,2,2]) == True\nassert makesquare([3,3,3,3,4]) == False\nassert makesquare([5,5,5,5,4,4,4,4,3,3,3,3]) == True\nassert makesquare([1,1,1,1]) == True\nprint('All tests passed!')"
  }
,
  {
    id: 49, stage: 6, title: "Flip Game II", pattern: "mastery", skill: "game-theory backtracking (minimax)",
    statement: "Given string of '+' and '-', two players flip '++' to '--'. Player who cannot move loses. Return True if first player can guarantee win. LeetCode 294.",
    examples: [
      { input: "s='++++'", output: "True" },
    { input: "s='+++++'", output: "False" }
    ],
    why: "Backtracking in game theory: at each state, try all possible moves. If ANY move leaves opponent in losing state, THIS state is winning. Minimax principle applied to backtracking.",
    starterCode: "def can_win(s):\n    pass",
    hints: [
      "For each '++', flip to '--' and recurse.",
    "If opponent CANNOT win from resulting state, then I CAN win from here.",
    "Use memoization to cache results (DP on top of backtracking)."
    ],
    solution: "def can_win(s):\n    memo = {}\n    def dfs(state):\n        if state in memo:\n            return memo[state]\n        for i in range(len(state) - 1):\n            if state[i:i+2] == '++':\n                next_state = state[:i] + '--' + state[i+2:]\n                if not dfs(next_state):\n                    memo[state] = True\n                    return True\n        memo[state] = False\n        return False\n    return dfs(s)",
    walkthrough: "Game backtracking: for each valid move (flip '++' to '--'), recursively evaluate if opponent can win from new state. If ANY move leaves opponent in losing state, THIS state is winning. Memoization caches results — bridge from backtracking to DP. String is immutable so no explicit unchoose needed.",
    testCode: "assert can_win('++++') == True\nassert can_win('+++++') == False\nassert can_win('+') == False\nassert can_win('++') == True\nprint('All tests passed!')"
  }
,
  {
    id: 50, stage: 6, title: "Remove Invalid Parentheses", pattern: "mastery", skill: "BFS with minimal removal count",
    statement: "Given string of '(' ')' plus letters, remove minimum parentheses to make it valid. Return ALL unique valid results. LeetCode 301.",
    examples: [
      { input: "s='()())()'", output: "['()()()','(())()']" },
    { input: "s='(a)())()'", output: "['(a)()()','(a())()']" },
    { input: "s=')('", output: "['']" }
    ],
    why: "THE final boss. Find minimum removals, then generate all valid strings with exactly that many deletions. Composes: P17 (parentheses validity) + P36 (deduplication) + pruning (count minimum first, explore within budget).",
    starterCode: "def remove_invalid_parentheses(s):\n    pass",
    hints: [
      "BFS from original string: at each level try removing one paren.",
    "Use helper is_valid(st): track open count, check never negative and ends at 0.",
    "When any valid string found at a level, return all valid at that level (minimum removals)."
    ],
    solution: "def remove_invalid_parentheses(s):\n    def is_valid(st):\n        count = 0\n        for ch in st:\n            if ch == '(':\n                count += 1\n            elif ch == ')':\n                count -= 1\n                if count < 0:\n                    return False\n        return count == 0\n    level = {s}\n    while level:\n        valid = [st for st in level if is_valid(st)]\n        if valid:\n            return valid\n        next_level = set()\n        for st in level:\n            for i in range(len(st)):\n                if st[i] in '()':\n                    next_level.add(st[:i] + st[i+1:])\n        level = next_level\n    return ['']",
    walkthrough: "BFS by removal count: start with original string (level 0). At each level, check if any string is valid. If found, return all valid at that level (minimum removals). If not, generate next level by removing ONE more parenthesis from each string. Set deduplicates. BFS guarantees minimum removals.",
    testCode: "r = remove_invalid_parentheses('()())()')\nassert sorted(r) == sorted(['()()()','(())()'])\nr2 = remove_invalid_parentheses('(a)())()')\nassert sorted(r2) == sorted(['(a)()()','(a())()'])\nr3 = remove_invalid_parentheses(')(')\nassert r3 == ['']\nprint('All tests passed!')"
  }
]
