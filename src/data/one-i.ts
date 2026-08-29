import type { OneProblem } from "./one"

export const PROBLEMS_ONE_I: OneProblem[] = [
  {
    id: 125, stage: 22, title: "Insert Into BST", pattern: "ordered walk down", skill: "the tree decides the path", difficulty: "Easy",
    statement: "Insert a value into a binary search tree (no balancing required — standard insertion) and return the root.",
    examples: [
      { input: "tree = [4, 2, 7, 1, 3], insert 5", output: "inorder becomes [1, 2, 3, 4, 5, 7]" },
      { input: "tree = [], insert 5", output: "inorder [5]" },
    ],
    why: "BST insertion is a binary search (stage 4) that CREATES what it fails to find: at each node, go left or right by comparison, and the first empty slot is the answer. Inorder of the result stays sorted — that one assert checks the whole structure. O(h) where h is the height: balanced trees pay log n, degenerate ones pay n, which is exactly why balancing exists.",
    starterCode: "def insert_bst(root, val):\n    pass",
    hints: [
      "If root is None, return a new TreeNode(val) — this is where the recursion 'creates'.",
      "val < root.val: root.left = insert into left; else right.",
      "Always return root so parents reattach correctly."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)\n\ndef insert_bst(root, val):\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert_bst(root.left, val)\n    else:\n        root.right = insert_bst(root.right, val)\n    return root",
    walkthrough: "The recursive form makes the 'reattach' discipline explicit: every call returns the (possibly new) subtree root, and the parent's assignment catches it. For [4,2,7,1,3] inserting 5: 4 → right(7) → left(None) → new node. The inorder assert proves both placement and BST validity in one line.",
    testCode: "assert inorder(insert_bst(make_tree([4, 2, 7, 1, 3]), 5)) == [1, 2, 3, 4, 5, 7]\nassert inorder(insert_bst(None, 5)) == [5]\nassert inorder(insert_bst(make_tree([2, 1]), 3)) == [1, 2, 3]\nprint('All tests passed!')"
  },
  {
    id: 126, stage: 22, title: "Range Sum BST", pattern: "pruned recursion", skill: "skip whole subtrees", difficulty: "Easy",
    statement: "Return the sum of all node values in a BST within the inclusive range [low, high] — without visiting every node.",
    examples: [
      { input: "tree = [10, 5, 15, 3, 7, None, 18], low = 7, high = 15", output: "32", explain: "10 + 15 + 7" },
      { input: "tree = [10, 5, 15, 3, 7, 13, 18, 1, None, 6], low = 6, high = 10", output: "23" },
    ],
    why: "Stage 9's validate-BST passed bounds DOWN; here the bounds PRUNE: if node.val < low, its entire left subtree is out of range — skip it. Ordering turns a full traversal into one that visits only the frontier between low and high. 'The BST property tells me a whole subtree is irrelevant' is the same elimination logic as binary search, expressed in a tree.",
    starterCode: "def range_sum(root, low, high):\n    pass",
    hints: [
      "None contributes 0.",
      "If node.val < high, the right subtree may contain in-range values — recurse into it.",
      "Mirror for the left; add node.val when in range."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef range_sum(root, low, high):\n    if not root:\n        return 0\n    total = 0\n    if low <= root.val <= high:\n        total += root.val\n    if root.val > low:\n        total += range_sum(root.left, low, high)\n    if root.val < high:\n        total += range_sum(root.right, low, high)\n    return total",
    walkthrough: "The two guards are where the speed lives: root.val > low means left values could still be >= low (recurse); otherwise the whole left side is < low — dead. Visited nodes form a band of width (high − low) through the tree. On a balanced BST this is O(log n + k) for k in-range nodes.",
    testCode: "assert range_sum(make_tree([10, 5, 15, 3, 7, None, 18]), 7, 15) == 32\nassert range_sum(make_tree([10, 5, 15, 3, 7, 13, 18, 1, None, 6]), 6, 10) == 23\nassert range_sum(make_tree([1]), 5, 9) == 0\nprint('All tests passed!')"
  },
  {
    id: 127, stage: 22, title: "Kth Smallest In BST", pattern: "iterative inorder", skill: "stop the traversal early", difficulty: "Medium",
    statement: "Return the k-th smallest value in a BST. Do it with an explicit stack and STOP the traversal as soon as you have the answer — no full inorder list.",
    examples: [
      { input: "tree = [5, 3, 6, 2, 4, None, None, 1], k = 3", output: "3" },
      { input: "tree = [3, 1, 4, None, 2], k = 1", output: "1" },
    ],
    why: "Inorder IS sorted order (stage 9) — the question is only how to pause it. The explicit stack converts recursion into an iterable: push lefts, pop one, yield, step right. 'Traversal as a resumable process' is the concept behind generators, iterators, and every lazy pipeline; for huge trees, stopping at the k-th pop is the entire win.",
    starterCode: "def kth_smallest(root, k):\n    pass",
    hints: [
      "Stack; node = root. Loop: while node, push node and go left.",
      "Pop — that is the next inorder value. Decrement k; at 0, return it.",
      "Then node = popped.right and repeat."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef kth_smallest(root, k):\n    stack = []\n    node = root\n    while stack or node:\n        while node:\n            stack.append(node)\n            node = node.left\n        node = stack.pop()\n        k -= 1\n        if k == 0:\n            return node.val\n        node = node.right\n    return None",
    walkthrough: "The stack holds the path of 'lefts not yet finished' — exactly the recursion's call frames, made visible. Each pop emits the next value in sorted order; k counts them down and the return fires mid-traversal. O(h + k) instead of O(n): the lazy pattern, in a loop you can trace by hand.",
    testCode: "assert kth_smallest(make_tree([5, 3, 6, 2, 4, None, None, 1]), 3) == 3\nassert kth_smallest(make_tree([3, 1, 4, None, 2]), 1) == 1\nassert kth_smallest(make_tree([2, 1, 3]), 3) == 3\nprint('All tests passed!')"
  },
  {
    id: 128, stage: 22, title: "Right Side View", pattern: "level order, last survivor", skill: "BFS with a per-level take", difficulty: "Medium",
    statement: "Return the values of the nodes you would see looking at a binary tree from the right side — the rightmost node of every level.",
    examples: [
      { input: "tree = [1, 2, 3, None, 5, None, 4]", output: "[1, 3, 4]", explain: "2 hides 5; 3 hides 4 from the right" },
      { input: "tree = [1, None, 3]", output: "[1, 3]" },
    ],
    why: "Stage 9's level-order BFS already groups by depth — the view is just the LAST element of each level's list. Extracting one more answer from a traversal you already own (rather than writing a new algorithm) is the compounding this ladder keeps teaching: notice what your existing tools already compute.",
    starterCode: "def right_side_view(root):\n    pass",
    hints: [
      "BFS level by level (as in problem 53).",
      "After building each level list, take its last element.",
      "Left-to-right child order inside the queue is what makes 'last' mean 'rightmost'."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef right_side_view(root):\n    if not root:\n        return []\n    out = []\n    queue = [root]\n    while queue:\n        out.append(queue[-1].val)\n        nxt = []\n        for node in queue:\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        queue = nxt\n    return out",
    walkthrough: "The single added line is out.append(queue[-1].val) before expanding — the level's last enqueued node is its rightmost by construction. DFS-with-depth would work too (track max depth seen, overwrite on ties going right-first) but BFS states the invariant most directly: one level, one visible node.",
    testCode: "assert right_side_view(make_tree([1, 2, 3, None, 5, None, 4])) == [1, 3, 4]\nassert right_side_view(make_tree([1, None, 3])) == [1, 3]\nassert right_side_view(make_tree([])) == []\nassert right_side_view(make_tree([1, 2])) == [1, 2]\nprint('All tests passed!')"
  },
  {
    id: 129, stage: 22, title: "BST From Preorder", pattern: "bounds-driven construction", skill: "build with the same ranges that validate", difficulty: "Medium",
    statement: "Given the preorder traversal of a BST, reconstruct the tree. Return the root's value and verify via inorder.",
    examples: [
      { input: "preorder = [8, 5, 1, 7, 10, 12]", output: "root 8, inorder [1, 5, 7, 8, 10, 12]" },
      { input: "preorder = [50, 30, 70]", output: "root 50, inorder [30, 50, 70]" },
    ],
    why: "Preorder hands you roots in order; the BST property assigns each its subtree. The bounds trick from validate-BST (problem 55) does the assignment: a value belongs to the current subtree iff it fits the (lo, hi) window. Validate and construct are the same recursion with the polarity flipped — passing constraints down either CHECKS or BUILDS.",
    starterCode: "def bst_from_preorder(preorder):\n    pass",
    hints: [
      "Use an index pointer into the list, shared across recursive calls.",
      "build(lo, hi): if the next value is outside [lo, hi), it belongs to an ancestor — return None.",
      "Otherwise consume it as the root, then build left with (lo, val) and right with (val, hi)."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)\n\ndef bst_from_preorder(preorder):\n    idx = [0]\n    def build(lo, hi):\n        if idx[0] >= len(preorder):\n            return None\n        val = preorder[idx[0]]\n        if not (lo < val < hi):\n            return None\n        idx[0] += 1\n        node = TreeNode(val)\n        node.left = build(lo, val)\n        node.right = build(val, hi)\n        return node\n    return build(float('-inf'), float('inf'))",
    walkthrough: "For [8, 5, 1, 7, 10, 12]: 8 roots; left window (−∞, 8) takes 5, then (−∞, 5) takes 1, then 7 fails (−∞, 5)? No — 7 belongs to (5, 8): after 1 returns None (7 > 5? 1 < 5 ok, 7 fails (−∞,5) → unwinds), 5's right window (5, 8) takes 7. The index pointer makes consumption irreversible — each value is placed exactly once: O(n).",
    testCode: "root = bst_from_preorder([8, 5, 1, 7, 10, 12])\nassert root.val == 8\nassert inorder(root) == [1, 5, 7, 8, 10, 12]\nroot2 = bst_from_preorder([50, 30, 70])\nassert root2.val == 50\nassert inorder(root2) == [30, 50, 70]\nassert bst_from_preorder([]) is None\nprint('All tests passed!')"
  },
  {
    id: 130, stage: 22, title: "Serialize And Deserialize", pattern: "preorder with markers", skill: "flatten a shape into a sequence", difficulty: "Hard",
    statement: "Design serialize(root) -> string and deserialize(data) -> root for a binary tree, round-trip exact. '#' marks nulls.",
    examples: [
      { input: "tree = [1, 2, 3, None, None, 4, 5]", output: "serialize -> '1,2,#,#,3,4,#,#,5,#,#'; deserialize round-trips exactly" },
      { input: "tree = None", output: "'#' and back to None" },
    ],
    why: "A traversal alone is ambiguous — two trees share the same inorder — but preorder WITH explicit null markers is unique: every shape gets a distinct string. Deserialization replays the tokens with an iterator, recursion consuming exactly what it needs. This 'sequence ⟷ structure with a distinguished grammar' is the idea behind JSON trees, expression parsing, and every file format that stores a hierarchy.",
    starterCode: "def serialize(root):\n    pass",
    hints: [
      "serialize: preorder walk — node contributes 'val', None contributes '#', joined by commas.",
      "deserialize: split on commas; consume tokens with a shared index/iterator.",
      "build(): take the next token; '#' (or exhaustion) returns None; else make the node and recurse left then right."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)\n\ndef serialize(root):\n    out = []\n    def walk(node):\n        if not node:\n            out.append('#')\n            return\n        out.append(str(node.val))\n        walk(node.left)\n        walk(node.right)\n    walk(root)\n    return ','.join(out)\n\ndef deserialize(data):\n    tokens = data.split(',') if data else []\n    idx = [0]\n    def build():\n        if idx[0] >= len(tokens) or tokens[idx[0]] == '#':\n            idx[0] += 1\n            return None\n        node = TreeNode(int(tokens[idx[0]]))\n        idx[0] += 1\n        node.left = build()\n        node.right = build()\n        return node\n    return build()",
    walkthrough: "'1,2,#,#,3,4,#,#,5,#,#' — the markers pin the shape: 1's left is leaf 2 (two #s), 1's right is 3 with children 4, 5. Recursion + shared token index = the parser pattern: build() reads precisely one node's worth of grammar per call. Round-trip equality of inorder plus root identity is the test; the markers are what make ambiguity impossible.",
    testCode: "t = make_tree([1, 2, 3, None, None, 4, 5])\ns = serialize(t)\nassert s == '1,2,#,#,3,4,#,#,5,#,#'\nr = deserialize(s)\nassert inorder(r) == inorder(t) == [2, 1, 4, 3, 5]\nassert deserialize(serialize(None)) is None\nt2 = make_tree([2, 1, 3])\nassert inorder(deserialize(serialize(t2))) == [1, 2, 3]\nprint('All tests passed!')"
  },
  {
    id: 131, stage: 23, title: "Min Cost Climbing", pattern: "DP with a free start", skill: "the roll, with two entry points", difficulty: "Easy",
    statement: "You start on step 0 or 1 (free) and climb 1 or 2 steps; leaving step i costs cost[i]. Reach past the last step at minimum total cost.",
    examples: [
      { input: "cost = [10, 15, 20]", output: "15", explain: "start on 1 (free), pay 15, jump two past the end" },
      { input: "cost = [1, 100, 1, 1, 1, 100, 1, 1, 100, 1]", output: "6" },
    ],
    why: "House-robber's roll (stage 14) with the payment relocated: best(i) = cost to STAND on step i, computed as min(best(i-1) + cost[i-1], best(i-2) + cost[i-2]) — you pay a step when you LEAP FROM it. Same two-variable roll, new payment timing. Seeing the same skeleton re-price its moves is exactly how DP intuition compounds.",
    starterCode: "def min_cost(cost):\n    pass",
    hints: [
      "best(i) = min(best(i-1) + cost[i-1], best(i-2) + cost[i-2]) — the price is paid on departure.",
      "best(0) = best(1) = 0 — both starting positions are free.",
      "The top is past the last step: answer = min(best at each of the last two steps + their leap costs), i.e. continue the recurrence one final time."
    ],
    solution: "def min_cost(cost):\n    prev2 = 0\n    prev1 = 0\n    for i in range(2, len(cost) + 1):\n        prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])\n    return prev1",
    walkthrough: "prev1 holds 'cheapest way to be standing on step i'; the loop walks i from 2 to n, each step choosing between leaping from i-1 or i-2. After the loop prev1 IS the top's cost (one more recurrence round past the last index). Second example: the walk rides the cheap 1s and pays 100 once → 6. Two states, because the recurrence looks back exactly two.",
    testCode: "assert min_cost([10, 15, 20]) == 15\nassert min_cost([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]) == 6\nassert min_cost([5, 10]) == 5\nassert min_cost([1, 2]) == 1\nprint('All tests passed!')"
  },
  {
    id: 132, stage: 23, title: "Partition Equal Subset", pattern: "subset-sum reachability", skill: "knapsack as a boolean set", difficulty: "Medium",
    statement: "Return True if the array can be split into two groups with equal sums.",
    examples: [
      { input: "nums = [1, 5, 11, 5]", output: "True", explain: "[11] and [1, 5, 5]" },
      { input: "nums = [1, 2, 3, 5]", output: "False" },
    ],
    why: "Equal split ⟺ some subset sums to total/2 — stage 15's knapsack with values stripped out: the DP cell is a BOOLEAN 'is this sum reachable?'. Each item ORs its weight-shifted reachability into the set. Same descending loop as 0/1 knapsack, same reason (use each item once); the value dimension was never the point — reachability is.",
    starterCode: "def can_partition(nums):\n    pass",
    hints: [
      "If total is odd, return False immediately.",
      "target = total // 2; reachable = {0} as a boolean array of size target + 1.",
      "For each num, sweep s from target DOWN to num: reachable[s] |= reachable[s - num]."
    ],
    solution: "def can_partition(nums):\n    total = sum(nums)\n    if total % 2:\n        return False\n    target = total // 2\n    reachable = [False] * (target + 1)\n    reachable[0] = True\n    for num in nums:\n        for s in range(target, num - 1, -1):\n            if reachable[s - num]:\n                reachable[s] = True\n    return reachable[target]",
    walkthrough: "After processing each item, reachable[s] = 'some subset of items so far sums to s'. The descending sweep guarantees s − num was computed WITHOUT the current item (0/1 discipline from problem 87). O(n·target) time, one boolean row of memory — the knapsack skeleton with the values deleted.",
    testCode: "assert can_partition([1, 5, 11, 5]) == True\nassert can_partition([1, 2, 3, 5]) == False\nassert can_partition([2, 2, 2]) == False\nassert can_partition([3, 3]) == True\nprint('All tests passed!')"
  },
  {
    id: 133, stage: 23, title: "House Robber II", pattern: "circular decomposition", skill: "break the ring into two lines", difficulty: "Medium",
    statement: "Same loot rule as stage 14's robber, but the houses stand in a CIRCLE — the first and last are adjacent. Return the maximum loot.",
    examples: [
      { input: "loot = [2, 3, 2]", output: "3", explain: "cannot take both 2s" },
      { input: "loot = [1, 2, 3, 1]", output: "4" },
    ],
    why: "The circle creates exactly one new conflict: houses 0 and n−1. Case split: either 0 is unused (solve the LINE 1..n−1) or n−1 is unused (solve the LINE 0..n−2) — one of the two must hold, and each case is the linear robber you already own. Reducing a ring to two overlapping lines is THE standard circular-array move; it recurs in maximum circular subarray and circular buffers.",
    starterCode: "def rob_circle(loot):\n    pass",
    hints: [
      "Reimplement (or reuse) the linear robber on a sublist.",
      "Answer = max(rob(loot[:-1]), rob(loot[1:])).",
      "A single house has no adjacency — return it directly."
    ],
    solution: "def rob_circle(loot):\n    if len(loot) == 1:\n        return loot[0]\n    def rob(line):\n        prev2 = 0\n        prev1 = 0\n        for x in line:\n            prev2, prev1 = prev1, max(prev1, prev2 + x)\n        return prev1\n    return max(rob(loot[:-1]), rob(loot[1:]))",
    walkthrough: "[2, 3, 2]: rob([2, 3]) = 3, rob([3, 2]) = 3 → 3 — the ring's pinch forces dropping one 2. The two lines cover every legal selection: any valid circular plan skips 0 or n−1 (they are adjacent, can't both be robbed), so it lives entirely inside one of the lines. Two linear passes, zero new DP.",
    testCode: "assert rob_circle([2, 3, 2]) == 3\nassert rob_circle([1, 2, 3, 1]) == 4\nassert rob_circle([1]) == 1\nassert rob_circle([5, 5, 5, 5]) == 10\nprint('All tests passed!')"
  },
  {
    id: 134, stage: 23, title: "Maximal Square", pattern: "grid DP with neighbor min", skill: "the corner votes", difficulty: "Medium",
    statement: "Given a binary matrix (as '0'/'1' strings), return the area of the largest square of 1s.",
    examples: [
      { input: "m = [['1','0','1','0','0'], ['1','0','1','1','1'], ['1','1','1','1','1'], ['1','0','0','1','0']]", output: "4", explain: "a 2×2 square" },
      { input: "m = [['0', '1'], ['1', '1']]", output: "1" },
    ],
    why: "Unique-paths (stage 15) summed neighbors; this takes their MIN: square side at (i, j) = 1 + min(side above, side left, side upper-left) — a square extends only as far as its WEAKEST corner arm. One operator swap (min instead of +) turns path counting into shape detection; the upper-left term is what prevents L-shapes, and noticing why is the insight.",
    starterCode: "def maximal_square(m):\n    pass",
    hints: [
      "dp[i][j] = side of the largest all-1s square whose BOTTOM-RIGHT corner is (i, j).",
      "Cell '0' → dp 0. Cell '1' → 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).",
      "Answer = max side squared."
    ],
    solution: "def maximal_square(m):\n    if not m or not m[0]:\n        return 0\n    rows, cols = len(m), len(m[0])\n    dp = [[0] * (cols + 1) for _ in range(rows + 1)]\n    best = 0\n    for i in range(1, rows + 1):\n        for j in range(1, cols + 1):\n            if m[i - 1][j - 1] == '1':\n                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])\n                if dp[i][j] > best:\n                    best = dp[i][j]\n    return best * best",
    walkthrough: "The padded border (extra zero row/column) absorbs edge cases exactly like the 2-D prefix sums of stage 5. The min-of-three is a proven lemma: if all three neighbors support side k, cell (i, j) extends to k + 1 — and any shortfall in any arm caps it. Area = side² because the square, not the count of squares, is wanted.",
    testCode: "assert maximal_square([['1', '0', '1', '0', '0'], ['1', '0', '1', '1', '1'], ['1', '1', '1', '1', '1'], ['1', '0', '0', '1', '0']]) == 4\nassert maximal_square([['0', '1'], ['1', '1']]) == 1\nassert maximal_square([['0']]) == 0\nassert maximal_square([['1']]) == 1\nprint('All tests passed!')"
  },
  {
    id: 135, stage: 23, title: "Burst Balloons", pattern: "interval DP, last to burst", skill: "reverse the destruction order", difficulty: "Hard",
    statement: "Burst balloons to maximize coins: bursting balloon i (between open neighbors l and r) yields nums[l] * nums[i] * nums[r]. Return the maximum total.",
    examples: [
      { input: "nums = [3, 1, 5, 8]", output: "167" },
      { input: "nums = [1, 5]", output: "10" },
    ],
    why: "Simulating bursts forward fails — after a burst, former neighbors change and the subproblems entangle. The reversal: think about the balloon burst LAST in an interval. Then its neighbors are FIXED (the interval's bounds), and the two sides are independent subproblems — dp(l, r) = max over last-k of dp(l, k) + nums[l]*nums[k]*nums[r] + dp(k, r). 'Solve the destruction backwards so the last act is decided first' is the master trick of interval DP, and stage 8's palindrome partitioning was this exact interval structure in backtracking form.",
    starterCode: "def max_coins(nums):\n    pass",
    hints: [
      "Pad the array with virtual balloons of value 1 at both ends.",
      "dp[l][r] = best coins from bursting everything STRICTLY between l and r.",
      "For each interval length, try every k as the LAST burst: dp[l][k] + nums[l]*nums[k]*nums[r] + dp[k][r]."
    ],
    solution: "def max_coins(nums):\n    if not nums:\n        return 0\n    vals = [1] + list(nums) + [1]\n    n = len(vals)\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n):\n        for l in range(0, n - length):\n            r = l + length\n            for k in range(l + 1, r):\n                gain = vals[l] * vals[k] * vals[r] + dp[l][k] + dp[k][r]\n                if gain > dp[l][r]:\n                    dp[l][r] = gain\n    return dp[0][n - 1]",
    walkthrough: "[3, 1, 5, 8] padded to [1, 3, 1, 5, 8, 1]: the optimal last burst is 1 (the original), splitting into left {3} and right {5, 8} — dp works out to 3·1·1 + 3 + 160 = 167. Iterating by interval LENGTH (not position) guarantees subintervals are solved before the intervals that contain them — the interval-DP fill order, worth memorizing as deeply as the recurrence.",
    testCode: "assert max_coins([3, 1, 5, 8]) == 167\nassert max_coins([1, 5]) == 10\nassert max_coins([]) == 0\nassert max_coins([7]) == 7\nprint('All tests passed!')"
  },
  {
    id: 136, stage: 23, title: "Regex Matching", pattern: "two-string DP with a wildcard", skill: "the star reaches back", difficulty: "Hard",
    statement: "Implement regex matching with '.' (any single character) and '*' (zero or more of the PRECEDING element). The match must cover the entire string.",
    examples: [
      { input: "s = 'aa', p = 'a'", output: "False" },
      { input: "s = 'aa', p = 'a*'", output: "True" },
      { input: "s = 'aab', p = 'c*a*b'", output: "True", explain: "c* matches nothing, a* matches 'aa'" },
    ],
    why: "Edit distance's table (stage 15) with one extra move: when the pattern ends in x*, the star either matches ZERO characters (drop x* from the pattern) or absorbs one more character (if it matches, stay ON the star). That 'stay' transition is a self-reference — the DP cell reads its own row — and it is precisely what makes backtracking exponential here but linear in the table.",
    starterCode: "def is_match(s, p):\n    pass",
    hints: [
      "dp[i][j] = does s[:i] match p[:j]? dp[0][0] = True.",
      "Plain chars and '.': dp[i][j] = dp[i-1][j-1] when s[i-1] matches p[j-1].",
      "p[j-1] == '*': dp[i][j] = dp[i][j-2] (star matches empty) OR (match(s[i-1], p[j-2]) and dp[i-1][j]) (absorb one more)."
    ],
    solution: "def is_match(s, p):\n    m, n = len(s), len(p)\n    dp = [[False] * (n + 1) for _ in range(m + 1)]\n    dp[0][0] = True\n    for j in range(2, n + 1):\n        if p[j - 1] == '*':\n            dp[0][j] = dp[0][j - 2]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if p[j - 1] == '*':\n                dp[i][j] = dp[i][j - 2]\n                if not dp[i][j] and (p[j - 2] == '.' or p[j - 2] == s[i - 1]):\n                    dp[i][j] = dp[i - 1][j]\n            elif p[j - 1] == '.' or p[j - 1] == s[i - 1]:\n                dp[i][j] = dp[i - 1][j - 1]\n    return dp[m][n]",
    walkthrough: "'aab' vs 'c*a*b': the row-0 pass kills leading x* pairs (c* can match empty → dp[0][2] = True). In the main table, a* first tries dp[i][j-2] (drop the star), then absorbs 'a' while STAYING on the star — dp[i-1][j] reads the cell one row up, same pattern position. That backward self-reference is the entire difficulty of the problem, tamed by the table.",
    testCode: "assert is_match('aa', 'a') == False\nassert is_match('aa', 'a*') == True\nassert is_match('ab', '.*') == True\nassert is_match('aab', 'c*a*b') == True\nassert is_match('mississippi', 'mis*is*p*.') == False\nassert is_match('ab', '.*c') == False\nprint('All tests passed!')"
  },
]
