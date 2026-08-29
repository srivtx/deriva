import type { OneProblem } from "./one"

export const PROBLEMS_ONE_F: OneProblem[] = [
  {
    id: 86, stage: 15, title: "Unique Paths", pattern: "2-D grid DP", skill: "two input dimensions, one table", difficulty: "Easy",
    statement: "A robot starts top-left of an m×n grid and moves only right or down. Return the number of distinct paths to the bottom-right.",
    examples: [
      { input: "m = 3, n = 7", output: "28" },
      { input: "m = 3, n = 2", output: "3", explain: "right-right-down in some order: RRD, RDR, DRR" },
    ],
    why: "The table grows a dimension: paths(m, n) = paths(m-1, n) + paths(m, n-1) — arrive from above or from the left, cases disjoint and exhaustive. Same ritual as stage 14, one more axis; the boundary row/column (all 1s) replaces the base case. When you can write a grid DP's cell meaning in one sentence, the code is a formality.",
    starterCode: "def unique_paths(m, n):\n    pass",
    hints: [
      "dp[i][j] = number of ways to reach cell (i, j).",
      "First row and first column: exactly 1 way (straight line).",
      "Interior: dp[i][j] = dp[i-1][j] + dp[i][j-1]."
    ],
    solution: "def unique_paths(m, n):\n    dp = [[1] * n for _ in range(m)]\n    for i in range(1, m):\n        for j in range(1, n):\n            dp[i][j] = dp[i - 1][j] + dp[i][j - 1]\n    return dp[m - 1][n - 1]",
    walkthrough: "The initialization-as-boundary trick (whole first row/column = 1) is worth noticing: base cases become part of the table instead of if-statements. Combinatorially the answer is C(m+n-2, m-1) — but the DP derives it without any formula, which is why DP generalizes to grids with obstacles where the formula dies.",
    testCode: "assert unique_paths(3, 7) == 28\nassert unique_paths(3, 2) == 3\nassert unique_paths(1, 1) == 1\nassert unique_paths(2, 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 87, stage: 15, title: "Knapsack", pattern: "0/1 knapsack", skill: "capacity as a state", difficulty: "Medium",
    statement: "Items have weights and values; take each item at most once, maximize total value within capacity. Return the best value.",
    examples: [
      { input: "weights = [1, 3, 4, 5], values = [1, 4, 5, 7], capacity = 7", output: "9", explain: "items of weight 3 and 4 → value 9" },
      { input: "weights = [5], values = [10], capacity = 3", output: "0" },
    ],
    why: "The capacity is the second state axis — best(i, cap) considers item i: skip, or take (cap - weight_i). The 0/1 twist is iteration ORDER: capacities must sweep DOWNWARD so the 'take' branch reads the row before item i (each item used once). Change one loop direction and unbounded knapsack falls out — the most instructive one-character difference in DP.",
    starterCode: "def knapsack(weights, values, capacity):\n    pass",
    hints: [
      "dp[c] = best value with capacity c, updated item by item.",
      "For each item, iterate c from capacity DOWN to weight: dp[c] = max(dp[c], value + dp[c - weight]).",
      "Downward order guarantees dp[c - weight] is still the previous item's row."
    ],
    solution: "def knapsack(weights, values, capacity):\n    dp = [0] * (capacity + 1)\n    for w, v in zip(weights, values):\n        for c in range(capacity, w - 1, -1):\n            if v + dp[c - w] > dp[c]:\n                dp[c] = v + dp[c - w]\n    return dp[capacity]",
    walkthrough: "One row per item, rolling to 1-D. The descending scan is the entire 0/1 discipline: it forbids the item from pairing with itself. House robber (stage 14) was knapsack with capacity = adjacency; coin change is knapsack with reuse — three problems, one table, different orders.",
    testCode: "assert knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7) == 9\nassert knapsack([5], [10], 3) == 0\nassert knapsack([], [], 10) == 0\nassert knapsack([2, 2, 2], [3, 3, 3], 4) == 6\nprint('All tests passed!')"
  },
  {
    id: 88, stage: 15, title: "Longest Common Subsequence", pattern: "two-string DP", skill: "match or skip, both sides", difficulty: "Medium",
    statement: "Return the length of the longest subsequence shared by two strings (order preserved, gaps allowed in both).",
    examples: [
      { input: "a = 'abcde', b = 'ace'", output: "3" },
      { input: "a = 'abc', b = 'def'", output: "0" },
    ],
    why: "Two indexes, one cell: when the tails match, consume both (1 + dp of the rest); when they differ, drop one or the other and take the better. The four-quadrant table of string DP — LCS, edit distance, diff tools, and bioinformatics alignment are all this exact recurrence with a different score function.",
    starterCode: "def lcs(a, b):\n    pass",
    hints: [
      "dp[i][j] = LCS length of a[:i] and b[:j]; row 0 / column 0 are 0.",
      "a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1] + 1.",
      "Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])."
    ],
    solution: "def lcs(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]",
    walkthrough: "The match branch is safe to take greedily INSIDE the DP because matching the current tails can always be extended to an optimal solution (an exchange argument). The skip branches cover all other alignments. O(m·n) states, O(1) per state — the two-string DP shape to memorize.",
    testCode: "assert lcs('abcde', 'ace') == 3\nassert lcs('abc', 'abc') == 3\nassert lcs('abc', 'def') == 0\nassert lcs('aggtab', 'gxtxayb') == 4\nprint('All tests passed!')"
  },
  {
    id: 89, stage: 15, title: "Edit Distance", pattern: "two-string DP, three moves", skill: "cost-weighted alignment", difficulty: "Hard",
    statement: "Return the minimum number of insertions, deletions, and substitutions to turn word a into word b.",
    examples: [
      { input: "a = 'horse', b = 'ros'", output: "3", explain: "horse -> rorse (sub) -> rose (del) -> ros (del)" },
      { input: "a = 'intention', b = 'execution'", output: "5" },
    ],
    why: "LCS with a cost function: match costs 0, every other move costs 1. The three-branch min is the recurrence of alignment; changing the costs turns it into similarity scoring, spell-check, and DNA alignment. Stage 15's two-string table completes here — same skeleton, one more branch.",
    starterCode: "def edit_distance(a, b):\n    pass",
    hints: [
      "dp[i][j] = cost to convert a[:i] into b[:j].",
      "Base: dp[i][0] = i (delete all), dp[0][j] = j (insert all).",
      "Chars equal: dp[i-1][j-1]. Else: 1 + min(dp[i-1][j] delete, dp[i][j-1] insert, dp[i-1][j-1] substitute)."
    ],
    solution: "def edit_distance(a, b):\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n            else:\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n    return dp[m][n]",
    walkthrough: "'horse' → 'ros' walks the table: the diagonal is substitution, left is insert, up is delete — three ways to fix a tail mismatch, min over all. Equal characters take the free diagonal, which is what makes the whole table an alignment. This table is the algorithm behind every diff view you have ever looked at.",
    testCode: "assert edit_distance('horse', 'ros') == 3\nassert edit_distance('intention', 'execution') == 5\nassert edit_distance('', 'abc') == 3\nassert edit_distance('same', 'same') == 0\nprint('All tests passed!')"
  },
  {
    id: 90, stage: 15, title: "Tree Robbery", pattern: "tree DP, robbed or safe", skill: "state = decision at the node", difficulty: "Hard",
    statement: "A binary tree of houses (values = loot). You cannot rob two directly-linked houses. Return the maximum loot.",
    examples: [
      { input: "tree = [3, 2, 3, None, 3, None, 1]", output: "7", explain: "3 + 3 + 1 — skip the connected pairs" },
      { input: "tree = [3, 4, 5, 1, 3, None, 1]", output: "9", explain: "4 + 5 (siblings are fine)" },
    ],
    why: "Stage 14's take-or-skip climbs into a tree: each node returns a PAIR (robbed, safe) — its best if robbed, its best if not. Parent combines children per the adjacency rule. The state grew from one number to a decision tuple; that 'return both branches' trick is the standard shape of every constrained tree DP.",
    starterCode: "def rob_tree(root):\n    pass",
    hints: [
      "None returns (0, 0).",
      "robbed = val + left.safe + right.safe.",
      "safe = max over children of (robbed, safe) each — skipping a node frees BOTH children independently."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef rob_tree(root):\n    def visit(node):\n        if not node:\n            return (0, 0)\n        lr, ls = visit(node.left)\n        rr, rs = visit(node.right)\n        robbed = node.val + ls + rs\n        safe = max(lr, ls) + max(rr, rs)\n        return (robbed, safe)\n    return max(visit(root))",
    walkthrough: "safe = max(lr, ls) + max(rr, rs): when a node is skipped, its two subtrees are completely independent — take the better option from each. robbed forces children safe. The example's 9 comes from robbing two SIBLINGS (4 and 5) — legal, since only parent-child edges are forbidden, a subtlety the pair-state handles without any special case.",
    testCode: "assert rob_tree(make_tree([3, 2, 3, None, 3, None, 1])) == 7\nassert rob_tree(make_tree([3, 4, 5, 1, 3, None, 1])) == 9\nassert rob_tree(make_tree([1])) == 1\nassert rob_tree(make_tree([2, 1])) == 2\nprint('All tests passed!')"
  },
  {
    id: 91, stage: 15, title: "Assignment Optimum", pattern: "bitmask DP", skill: "the used set is the state", difficulty: "Hard",
    statement: "n people, n tasks, cost[i][j] = what person i charges for task j. Assign every person one distinct task at minimum total cost. n <= 15.",
    examples: [
      { input: "cost = [[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8], [7, 6, 9, 4]]", output: "13", explain: "person 1->task 1, person 2->task 0, person 3->task 2, person 4->task 3" },
      { input: "cost = [[1, 2], [3, 4]]", output: "5" },
    ],
    why: "The final DP state expansion: when the input's structure is a SET (which tasks are taken), the state must be the set — packed as a bitmask. dp[mask] = min cost of assigning the first popcount(mask) people to the tasks in mask. Exponential states (2ⁿ) instead of factorial permutations (n!) — the same trick that powers stage 8's pruning, now exact. Hungarian's algorithm exists for large n; bitmask DP is what you write at n <= 20.",
    starterCode: "def min_assignment(cost):\n    pass",
    hints: [
      "dp[mask] = best cost assigning people 0..popcount(mask)-1 exactly to tasks in mask.",
      "Transition: the next person is popcount(mask); for each free task t in mask's complement, dp[mask | 1 << t] = min(..., dp[mask] + cost[person][t]).",
      "dp[0] = 0; answer is dp[(1 << n) - 1]."
    ],
    solution: "def min_assignment(cost):\n    n = len(cost)\n    full = 1 << n\n    INF = float('inf')\n    dp = [INF] * full\n    dp[0] = 0\n    for mask in range(full):\n        if dp[mask] == INF:\n            continue\n        person = bin(mask).count('1')\n        if person == n:\n            continue\n        for task in range(n):\n            if not mask & (1 << task):\n                nxt = mask | (1 << task)\n                candidate = dp[mask] + cost[person][task]\n                if candidate < dp[nxt]:\n                    dp[nxt] = candidate\n    return dp[full - 1]",
    walkthrough: "Person order is fixed (popcount), so every assignment is generated exactly once — no permutation enumeration, no duplicate work. 2ⁿ · n work for n = 15: ~500k operations versus 15! ≈ 1.3 trillion. The mask IS the memo; iterating masks in increasing order guarantees dp[mask] is final before expansion (adding bits only grows the integer).",
    testCode: "assert min_assignment([[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8], [7, 6, 9, 4]]) == 13\nassert min_assignment([[1, 2], [3, 4]]) == 5\nassert min_assignment([[7]]) == 7\nprint('All tests passed!')"
  },
  {
    id: 92, stage: 16, title: "Implement Trie", pattern: "prefix tree", skill: "shared prefixes as paths", difficulty: "Medium",
    statement: "Implement a trie with insert(word), search(word) (exact), and starts_with(prefix). All three O(length).",
    examples: [
      { input: "insert 'apple'; search 'apple' / 'app' / starts_with 'app'", output: "True / False / True" },
      { input: "insert 'app'; search 'app'", output: "True" },
    ],
    why: "The trie stores a SET of words as a tree of characters — common prefixes share paths, lookups cost the word length regardless of dictionary size. Autocomplete, spell-check, IP routing, and the XOR trick two problems ahead all run on this node shape. Notice what it buys over a hash set: ordered prefix queries.",
    starterCode: "class Trie:\n    def __init__(self):\n        pass",
    hints: [
      "Each node: dict children + boolean end.",
      "insert walks/creates children per character, sets end at the tail.",
      "search = walk then check end; starts_with = walk, no end check."
    ],
    solution: "class Trie:\n    def __init__(self):\n        self.children = {}\n        self.end = False\n    def insert(self, word):\n        node = self\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = Trie()\n            node = node.children[ch]\n        node.end = True\n    def _walk(self, s):\n        node = self\n        for ch in s:\n            if ch not in node.children:\n                return None\n            node = node.children[ch]\n        return node\n    def search(self, word):\n        node = self._walk(word)\n        return node is not None and node.end\n    def starts_with(self, prefix):\n        return self._walk(prefix) is not None",
    walkthrough: "The dict-of-children trie: flexible alphabets, no wasted arrays. The distinction that matters: 'app' being a PREFIX of 'apple' does not make it a WORD — end flags exactly where words stop. One walk helper powers both queries; the walk is O(len) because descending one level per character is the whole point.",
    testCode: "t = Trie()\nt.insert('apple')\nassert t.search('apple') == True\nassert t.search('app') == False\nassert t.starts_with('app') == True\nt.insert('app')\nassert t.search('app') == True\nassert t.starts_with('b') == False\nprint('All tests passed!')"
  },
  {
    id: 93, stage: 16, title: "Max XOR Pair", pattern: "binary trie over bits", skill: "greedy bit-by-bit against the trie", difficulty: "Medium",
    statement: "Return the maximum XOR of any two elements of a list.",
    examples: [
      { input: "nums = [3, 10, 5, 25, 2, 8]", output: "28", explain: "5 ^ 25" },
      { input: "nums = [2, 4]", output: "6" },
    ],
    why: "The binary trie is the prefix tree wearing bits: insert each number MSB-first. For each query number, walk the trie AGAINST it — at each bit, take the child bit that maximizes the XOR (opposite bit if present). Greedy bit-by-bit works because high bits dominate: O(32n) beats O(n²) by orders of magnitude at n = 10⁵. Same structure as problem 92, new alphabet, new greedy — pattern transfer made explicit.",
    starterCode: "def max_xor_pair(nums):\n    pass",
    hints: [
      "Insert each number into a trie of 32 levels (bit 31 down to 0).",
      "Query for x: at each level, prefer the child with bit NOT equal to x's bit.",
      "Accumulate the XOR as you descend; track the global max."
    ],
    solution: "def max_xor_pair(nums):\n    if len(nums) < 2:\n        return 0\n    root = {}\n    def insert(x):\n        node = root\n        for i in range(30, -1, -1):\n            bit = (x >> i) & 1\n            node = node.setdefault(bit, {})\n    def query(x):\n        node = root\n        best = 0\n        for i in range(30, -1, -1):\n            bit = (x >> i) & 1\n            want = 1 - bit\n            if want in node:\n                best |= 1 << i\n                node = node[want]\n            else:\n                node = node[bit]\n        return best\n    for x in nums:\n        insert(x)\n    best = 0\n    for x in nums:\n        candidate = query(x)\n        if candidate > best:\n            best = candidate\n    return best",
    walkthrough: "Inserting ALL numbers before querying lets a number pair against earlier ones (the self-pair contributes 0 anyway). The greedy: at bit i, an opposite bit earns 2^i — worth more than all lower bits combined, so it is always correct to grab when available. 30 bits covers values up to ~10⁹.",
    testCode: "assert max_xor_pair([3, 10, 5, 25, 2, 8]) == 28\nassert max_xor_pair([2, 4]) == 6\nassert max_xor_pair([0]) == 0\nassert max_xor_pair([8, 10, 2]) == 10\nprint('All tests passed!')"
  },
  {
    id: 94, stage: 16, title: "KMP Search", pattern: "failure function", skill: "never re-read the text", difficulty: "Hard",
    statement: "Return all starting indices where pattern occurs in text. No built-in find — implement KMP with the failure (prefix) function.",
    examples: [
      { input: "text = 'aabaabaaa', pattern = 'aab'", output: "[0, 3]" },
      { input: "text = 'aaaa', pattern = 'aa'", output: "[0, 1, 2]" },
    ],
    why: "Naive matching re-reads the text after every mismatch — O(n·m). KMP's failure function precomputes, for each prefix of the pattern, its longest proper prefix-that-is-also-suffix; on mismatch the pattern SLIDES to that border instead of the text moving backward. The text pointer never retreats — that single invariant is why it is O(n + m) and why the idea generalizes to Z-function, Manacher, and suffix automata.",
    starterCode: "def kmp_search(text, pattern):\n    pass",
    hints: [
      "fail[i] = length of the longest proper prefix of pattern[:i] that is also its suffix.",
      "Build fail with the same two-pointer logic as the search itself (pattern vs pattern).",
      "Search: on mismatch, j = fail[j - 1]; on full match, record i - j + ... and slide j = fail[j - 1]."
    ],
    solution: "def kmp_search(text, pattern):\n    m = len(pattern)\n    if m == 0:\n        return []\n    fail = [0] * m\n    k = 0\n    for i in range(1, m):\n        while k > 0 and pattern[i] != pattern[k]:\n            k = fail[k - 1]\n        if pattern[i] == pattern[k]:\n            k += 1\n        fail[i] = k\n    hits = []\n    j = 0\n    for i, ch in enumerate(text):\n        while j > 0 and ch != pattern[j]:\n            j = fail[j - 1]\n        if ch == pattern[j]:\n            j += 1\n        if j == m:\n            hits.append(i - m + 1)\n            j = fail[j - 1]\n    return hits",
    walkthrough: "fail encodes 'after a mismatch at position i, how much of my work is still usable' — the longest border. In 'aab': fail = [0, 1, 0]. The while-loop fallback (j = fail[j-1] repeatedly) can total at most 2n steps across the whole search — amortized, like the stacks of stage 6. Overlapping matches ('aaaa'/'aa') work because the slide uses the border, not a +1.",
    testCode: "assert kmp_search('aabaabaaa', 'aab') == [0, 3]\nassert kmp_search('aaaa', 'aa') == [0, 1, 2]\nassert kmp_search('abc', 'x') == []\nassert kmp_search('hello', 'hello') == [0]\nprint('All tests passed!')"
  },
  {
    id: 95, stage: 16, title: "Segment Tree", pattern: "range queries with updates", skill: "divide the array into a tree", difficulty: "Hard",
    statement: "Implement a segment tree for range SUM queries with point updates: class SegTree(values) with update(i, v) (set) and query(l, r) (inclusive sum). Both O(log n).",
    examples: [
      { input: "vals = [1, 3, 5, 7, 9, 11]; query(1, 3); update(1, 10); query(1, 3)", output: "15, then 25" },
      { input: "vals = [2, 4]; query(0, 1)", output: "6" },
    ],
    why: "Prefix sums (stage 5) answer range sums free — until an update lands and the whole prefix rebuilds. The segment tree splits the array into halves recursively; each node stores its segment's sum, so any range is O(log n) nodes and any update touches O(log n) ancestors. This is the workhorse structure of every contest problem that mixes queries and updates.",
    starterCode: "class SegTree:\n    def __init__(self, values):\n        pass",
    hints: [
      "Recursive build: node covers [lo, hi]; leaf stores the value; internal stores sum of children.",
      "query(l, r): if the node's segment is fully inside, return its sum; if disjoint, return 0; else recurse both children.",
      "update(i, v): descend to the leaf, set it, and re-sum on the way back up."
    ],
    solution: "class SegTree:\n    def __init__(self, values):\n        self.n = len(values)\n        self.tree = [0] * (4 * max(1, self.n))\n        if self.n:\n            self._build(values, 1, 0, self.n - 1)\n    def _build(self, values, node, lo, hi):\n        if lo == hi:\n            self.tree[node] = values[lo]\n            return\n        mid = (lo + hi) // 2\n        self._build(values, 2 * node, lo, mid)\n        self._build(values, 2 * node + 1, mid + 1, hi)\n        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]\n    def update(self, i, v):\n        self._update(1, 0, self.n - 1, i, v)\n    def _update(self, node, lo, hi, i, v):\n        if lo == hi:\n            self.tree[node] = v\n            return\n        mid = (lo + hi) // 2\n        if i <= mid:\n            self._update(2 * node, lo, mid, i, v)\n        else:\n            self._update(2 * node + 1, mid + 1, hi, i, v)\n        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]\n    def query(self, l, r):\n        return self._query(1, 0, self.n - 1, l, r)\n    def _query(self, node, lo, hi, l, r):\n        if r < lo or hi < l:\n            return 0\n        if l <= lo and hi <= r:\n            return self.tree[node]\n        mid = (lo + hi) // 2\n        return self._query(2 * node, lo, mid, l, r) + self._query(2 * node + 1, mid + 1, hi, l, r)",
    walkthrough: "The three-case query (disjoint / contained / partial) is the entire structure: partial splits into children, contained answers from the stored sum. Updates recompute only the root-to-leaf path. Array-of-size-4n with 2i/2i+1 child indexing avoids pointer nodes entirely. Range min, max, count — same tree, different merge.",
    testCode: "s = SegTree([1, 3, 5, 7, 9, 11])\nassert s.query(1, 3) == 15\ns.update(1, 10)\nassert s.query(1, 3) == 22\nassert s.query(0, 5) == 43\nassert s.query(2, 2) == 5\ns2 = SegTree([2, 4])\nassert s2.query(0, 1) == 6\ns2.update(0, 0)\nassert s2.query(0, 1) == 4\nprint('All tests passed!')"
  },
  {
    id: 96, stage: 16, title: "Fenwick Tree", pattern: "binary indexed tree", skill: "prefix sums with bit magic", difficulty: "Medium",
    statement: "Implement a Fenwick (Binary Indexed) Tree over an array of zeros with add(i, delta) and prefix(i) = sum of indices 0..i inclusive. Both O(log n).",
    examples: [
      { input: "n = 5; add(0, 1), add(1, 3), add(2, 5), add(3, 7), add(4, 9); prefix(3)", output: "16" },
      { input: "then add(2, 5) (delta!); prefix(2)", output: "14" },
    ],
    why: "The Fenwick tree is the segment tree's minimalist cousin: index i's node covers the range ending at i with length i & -i (lowest set bit). One array, no recursion, prefix queries by stripping low bits downward, updates by adding them upward. Same O(log n) promises as problem 95 with a third of the code — when the operation is an invertible sum, this is the tool.",
    starterCode: "class Fenwick:\n    def __init__(self, n):\n        pass",
    hints: [
      "1-indexed internally: tree has n + 1 slots.",
      "add: for i += 1; i <= n; i += i & -i: tree[i] += delta.",
      "prefix: for i += 1; i > 0; i -= i & -i: total += tree[i]."
    ],
    solution: "class Fenwick:\n    def __init__(self, n):\n        self.n = n\n        self.tree = [0] * (n + 1)\n    def add(self, i, delta):\n        i += 1\n        while i <= self.n:\n            self.tree[i] += delta\n            i += i & -i\n    def prefix(self, i):\n        i += 1\n        total = 0\n        while i > 0:\n            total += self.tree[i]\n            i -= i & -i\n        return total",
    walkthrough: "i & -i isolates the lowest set bit — the range length this node is responsible for. prefix walks the binary representation of the index, collecting disjoint blocks; add climbs to every node whose block contains the position. Same problem as 95, radically simpler constant factor: the sign of a mature engineer is knowing which structure a problem actually needs.",
    testCode: "f = Fenwick(5)\nf.add(0, 1)\nf.add(1, 3)\nf.add(2, 5)\nf.add(3, 7)\nf.add(4, 9)\nassert f.prefix(3) == 16\nassert f.prefix(4) == 25\nf.add(2, 5)\nassert f.prefix(2) == 14\nassert f.prefix(4) == 30\nprint('All tests passed!')"
  },
  {
    id: 97, stage: 17, title: "Augmenting Paths", pattern: "Edmonds-Karp max flow", skill: "push until no path survives", difficulty: "Hard",
    statement: "Compute the maximum flow from s to t in a directed capacity graph: capacities = {(u, v): cap}. Repeatedly find any s→t path with spare capacity in the RESIDUAL graph and push the path's bottleneck; return the total flow.",
    examples: [
      { input: "nodes 0..5; caps: 0->1:16, 0->2:13, 1->3:12, 2->1:4, 2->4:14, 3->2:9, 3->5:20, 4->3:7, 4->5:4; s=0, t=5", output: "23" },
      { input: "caps: 0->1:5, 1->2:3; s=0, t=2", output: "3" },
    ],
    why: "The founding insight of flow theory: sending flow backward must be allowed — the residual graph's reverse edges mean 'undo'. Push augmenting paths until the sink is unreachable: the sum is provably maximal (max-flow/min-cut, problem 99). Edmonds-Karp = this loop with BFS paths: O(V·E²), honest and sufficient for small graphs — the correct FIRST flow algorithm.",
    starterCode: "def max_flow(caps, s, t):\n    pass",
    hints: [
      "residual[u][v] starts at capacity; residual[v][u] starts at 0 — reverse edges ARE the undo mechanism.",
      "BFS the residual for any s→t path (parent pointers); bottleneck = min residual along it.",
      "Push: decrease forward residuals, increase reverse residuals; repeat until BFS finds nothing."
    ],
    solution: "from collections import deque\n\ndef max_flow(caps, s, t):\n    residual = {}\n    for (u, v), c in caps.items():\n        residual.setdefault(u, {})[v] = residual.get(u, {}).get(v, 0) + c\n        residual.setdefault(v, {})[u] = residual.get(v, {}).get(u, 0)\n    flow = 0\n    while True:\n        parent = {s: None}\n        queue = deque([s])\n        while queue and t not in parent:\n            u = queue.popleft()\n            for v, r in residual.get(u, {}).items():\n                if r > 0 and v not in parent:\n                    parent[v] = u\n                    queue.append(v)\n        if t not in parent:\n            return flow\n        bottleneck = float('inf')\n        v = t\n        while parent[v] is not None:\n            u = parent[v]\n            bottleneck = min(bottleneck, residual[u][v])\n            v = u\n        v = t\n        while parent[v] is not None:\n            u = parent[v]\n            residual[u][v] -= bottleneck\n            residual[v][u] += bottleneck\n            v = u\n        flow += bottleneck",
    walkthrough: "The reverse edge is the idea worth internalizing: pushing f along u→v creates capacity f on v→u, letting a later path reroute earlier decisions. The classic 6-node network yields 23 — two augmenting paths through 4 with bottleneck 7 and 4, plus 12 through the top lane. Termination is guaranteed by integer capacities; BFS path choice makes the count of augmentations polynomial.",
    testCode: "caps = {(0, 1): 16, (0, 2): 13, (1, 3): 12, (2, 1): 4, (2, 4): 14, (3, 2): 9, (3, 5): 20, (4, 3): 7, (4, 5): 4}\nassert max_flow(caps, 0, 5) == 23\nassert max_flow({(0, 1): 5, (1, 2): 3}, 0, 2) == 3\nassert max_flow({(0, 1): 10}, 1, 0) == 0\nassert max_flow({}, 0, 1) == 0\nprint('All tests passed!')"
  },
  {
    id: 98, stage: 17, title: "Bipartite Matching", pattern: "Kuhn's algorithm", skill: "matching as flow", difficulty: "Hard",
    statement: "People each list tasks they can do; each person takes at most one task, each task goes to one person. Return the maximum number of people matched.",
    examples: [
      { input: "prefs = [[1, 2], [1], [2, 3], [3]]", output: "3", explain: "P0->1, P2->2, P3->3; P1 loses task 1" },
      { input: "prefs = [[0], [0], [0]]", output: "1" },
    ],
    why: "Bipartite matching IS max flow on a disguised network (source → people → tasks → sink, all capacities 1) — but Kuhn's algorithm is its distilled form: try to place each person; if their task is taken, ASK THE OWNER to move (recursively). One boolean 'visited per round' prevents loops. The augmenting path idea from problem 97, spoken in matching language.",
    starterCode: "def max_matching(prefs):\n    pass",
    hints: [
      "match_task[t] = the person currently holding task t (or -1).",
      "try(p): for each task t in prefs[p]: if t unvisited this round: mark, and if match_task[t] == -1 or try(match_task[t]): match and return True.",
      "Run try(p) for every person; count successes."
    ],
    solution: "def max_matching(prefs):\n    match_task = {}\n    def try_assign(p, visited):\n        for t in prefs[p]:\n            if t in visited:\n                continue\n            visited.add(t)\n            if t not in match_task or try_assign(match_task[t], visited):\n                match_task[t] = p\n                return True\n        return False\n    count = 0\n    for p in range(len(prefs)):\n        if try_assign(p, set()):\n            count += 1\n    return count",
    walkthrough: "try(match_task[t]) is the augmenting path in miniature: the displaced person re-runs its own options, potentially displacing someone else — the recursion unwinds as a chain of handoffs. The per-round visited set of TASKS is what bounds the work: O(V·E) overall. Check the example by hand: P0 takes 1; P1 fails (1 taken, owner P0 has no alternative); P2 takes 2; P3 takes 3 → 3.",
    testCode: "assert max_matching([[1, 2], [1], [2, 3], [3]]) == 3\nassert max_matching([[0], [0], [0]]) == 1\nassert max_matching([[0, 1], [0, 1]]) == 2\nassert max_matching([[]]) == 0\nprint('All tests passed!')"
  },
  {
    id: 99, stage: 17, title: "Min Cut Equals Flow", pattern: "max-flow min-cut verification", skill: "read the cut off the residual", difficulty: "Hard",
    statement: "Given a flow network, compute BOTH the max flow and a minimum s-t cut (the set of nodes reachable from s in the final residual graph). Return (flow, sorted reachable set). The cut capacity should equal the flow — and the test checks it.",
    examples: [
      { input: "the 6-node network of problem 97", output: "(23, [0, 1, 2, 4])" },
      { input: "caps: 0->1:3, 1->2:2; s=0, t=2", output: "(2, [0, 1])" },
    ],
    why: "The theorem, made concrete: when no augmenting path remains, S = nodes reachable from s in the residual; every edge S→T is saturated and every edge T→S is empty, so the cut's capacity is exactly the flow — and no cut can be smaller (any cut bounds any flow). Max-flow/min-cut is the engine behind project selection, image segmentation, and sports elimination — this problem makes you PROVE it on your own output.",
    starterCode: "def min_cut(caps, s, t):\n    pass",
    hints: [
      "Run your Edmonds-Karp from problem 97 to get the flow and the final residual.",
      "BFS the residual from s over edges with residual > 0 — that set is S.",
      "Return (flow, sorted(S)); the test recomputes the cut capacity and asserts equality."
    ],
    solution: "from collections import deque\n\ndef min_cut(caps, s, t):\n    residual = {}\n    for (u, v), c in caps.items():\n        residual.setdefault(u, {})[v] = residual.get(u, {}).get(v, 0) + c\n        residual.setdefault(v, {})[u] = residual.get(v, {}).get(u, 0)\n    flow = 0\n    while True:\n        parent = {s: None}\n        queue = deque([s])\n        while queue and t not in parent:\n            u = queue.popleft()\n            for v, r in residual.get(u, {}).items():\n                if r > 0 and v not in parent:\n                    parent[v] = u\n                    queue.append(v)\n        if t not in parent:\n            break\n        bottleneck = float('inf')\n        v = t\n        while parent[v] is not None:\n            u = parent[v]\n            bottleneck = min(bottleneck, residual[u][v])\n            v = u\n        v = t\n        while parent[v] is not None:\n            u = parent[v]\n            residual[u][v] -= bottleneck\n            residual[v][u] += bottleneck\n            v = u\n        flow += bottleneck\n    reachable = {s}\n    queue = deque([s])\n    while queue:\n        u = queue.popleft()\n        for v, r in residual.get(u, {}).items():\n            if r > 0 and v not in reachable:\n                reachable.add(v)\n                queue.append(v)\n    return (flow, sorted(reachable))",
    walkthrough: "The final BFS finds exactly the source side of a minimum cut: any residual edge leaving it would extend an augmenting path, contradiction — so it is saturated, and its capacity sums to the flow pushed. The test independently computes the cut capacity across (S, complement): flow == cut, theorem witnessed. This is the payoff of the whole stage: a duality you can hold in your hands.",
    testCode: "caps = {(0, 1): 16, (0, 2): 13, (1, 3): 12, (2, 1): 4, (2, 4): 14, (3, 2): 9, (3, 5): 20, (4, 3): 7, (4, 5): 4}\nflow, side = min_cut(caps, 0, 5)\nassert flow == 23\nassert side == [0, 1, 2, 4]\ncapacity = sum(c for (u, v), c in caps.items() if u in set(side) and v not in set(side))\nassert capacity == flow\nflow2, side2 = min_cut({(0, 1): 3, (1, 2): 2}, 0, 2)\nassert flow2 == 2 and side2 == [0, 1]\ncap2 = sum(c for (u, v), c in {(0, 1): 3, (1, 2): 2}.items() if u in set(side2) and v not in set(side2))\nassert cap2 == flow2\nprint('All tests passed!')"
  },
  {
    id: 100, stage: 17, title: "The Level Graph", pattern: "Dinic's algorithm", skill: "blocking flows, layered", difficulty: "Hard",
    statement: "The final boss: implement Dinic's max flow — BFS builds a LEVEL graph (distance from s), then DFS sends a BLOCKING FLOW along level-increasing edges only; repeat until the sink is unreachable. Verify it on the classic network.",
    examples: [
      { input: "the 6-node network (answer 23)", output: "23" },
      { input: "caps: 0->1:5, 1->2:3; s=0, t=2", output: "3" },
    ],
    why: "Dinic is Edmonds-Karp with one structural upgrade: the level graph lets each phase cancel MANY augmenting paths at once (a blocking flow), giving O(V²·E) and surviving graphs where BFS-per-path would crawl. It is the last algorithm on this ladder not because it is hardest to write — it is a DFS you already know plus a distance array — but because writing it proves you can compose every idea since stage 0: amortization, invariants, greedy proofs, and layered thinking. One hundred problems form the spine of this ladder — the mastery extensions follow. This is the top of the spine.",
    starterCode: "def dinic(caps, s, t):\n    pass",
    hints: [
      "BFS levels: level[s] = 0; only traverse residual > 0 edges; level[v] = level[u] + 1.",
      "DFS blocking flow: from u, only advance to v with level[v] == level[u] + 1 and residual > 0; accumulate path minima; retreat by returning 0 when a node has no admissible edge left.",
      "Repeat (BFS + blocking flow) while t is reachable."
    ],
    solution: "from collections import deque\n\ndef dinic(caps, s, t):\n    residual = {}\n    for (u, v), c in caps.items():\n        residual.setdefault(u, {})[v] = residual.get(u, {}).get(v, 0) + c\n        residual.setdefault(v, {})[u] = residual.get(v, {}).get(u, 0)\n    def bfs_levels():\n        level = {s: 0}\n        queue = deque([s])\n        while queue:\n            u = queue.popleft()\n            for v, r in residual.get(u, {}).items():\n                if r > 0 and v not in level:\n                    level[v] = level[u] + 1\n                    queue.append(v)\n        return level if t in level else None\n    def send(u, pushed, level, it):\n        if u == t:\n            return pushed\n        while it[u] < len(adj_order[u]):\n            v = adj_order[u][it[u]]\n            r = residual[u].get(v, 0)\n            if r > 0 and level.get(v, -1) == level[u] + 1:\n                got = send(v, min(pushed, r), level, it)\n                if got > 0:\n                    residual[u][v] -= got\n                    residual[v][u] = residual[v].get(u, 0) + got\n                    return got\n            it[u] += 1\n        return 0\n    adj_order = {}\n    for u, v in list(caps) + [(v, u) for (u, v) in caps]:\n        adj_order.setdefault(u, [])\n        if v not in adj_order[u]:\n            adj_order[u].append(v)\n    flow = 0\n    while True:\n        level = bfs_levels()\n        if level is None:\n            return flow\n        it = {u: 0 for u in adj_order}\n        while True:\n            pushed = send(s, float('inf'), level, it)\n            if pushed == 0:\n                break\n            flow += pushed",
    walkthrough: "Each phase: levels partition nodes into layers; the DFS pushes flow only forward along layers, and the iterator `it` never revisits dead edges — so one phase is a blocking flow in O(V·E). The number of phases is O(V) (each phase increases the sink's shortest-path distance). Same residual mechanics as problem 97; the level graph is the only addition — and it buys an entire complexity class.",
    testCode: "caps = {(0, 1): 16, (0, 2): 13, (1, 3): 12, (2, 1): 4, (2, 4): 14, (3, 2): 9, (3, 5): 20, (4, 3): 7, (4, 5): 4}\nassert dinic(caps, 0, 5) == 23\nassert dinic({(0, 1): 5, (1, 2): 3}, 0, 2) == 3\nassert dinic({(0, 1): 10}, 1, 0) == 0\nassert dinic({}, 0, 1) == 0\nprint('All tests passed!')"
  },
]
