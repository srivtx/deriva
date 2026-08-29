import type { OneProblem } from "./one"

export const PROBLEMS_ONE_D: OneProblem[] = [
  {
    id: 52, stage: 9, title: "Inorder Traversal", pattern: "tree recursion", skill: "trust the recursive leap", difficulty: "Easy",
    statement: "Return the values of a binary tree in inorder (left, root, right). Trees arrive as level-order lists with None holes: [3, 9, 20, None, None, 15, 7].",
    examples: [
      { input: "tree = [3, 9, 20, None, None, 15, 7]", output: "[9, 3, 15, 20, 7]" },
      { input: "tree = [1]", output: "[1]" },
    ],
    why: "The first tree recursion: the left subtree's full answer, then this node, then the right subtree's. Nothing else is written — no loop, no stack — because the shape of the data IS the shape of the algorithm. Traversal order is now a dial you can turn (pre/post/in) forever.",
    starterCode: "def inorder(root):\n    pass",
    hints: [
      "Base case: None returns [].",
      "Recurse left + [root.val] + recurse right.",
      "The helpers build the tree from the level-order list for you."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef inorder(root):\n    if not root:\n        return []\n    return inorder(root.left) + [root.val] + inorder(root.right)",
    walkthrough: "inorder is a claim about subtrees, so the recursive calls do all structural work. The make_tree helper consumes a level-order list: each node takes the next two children — Nones are preserved as placeholders so geometry stays correct.",
    testCode: "assert inorder(make_tree([3, 9, 20, None, None, 15, 7])) == [9, 3, 15, 20, 7]\nassert inorder(make_tree([1])) == [1]\nassert inorder(make_tree([1, 2, 3, 4])) == [4, 2, 1, 3]\nprint('All tests passed!')"
  },
  {
    id: 53, stage: 9, title: "Level Order", pattern: "BFS with a queue", skill: "level by level", difficulty: "Easy",
    statement: "Return a binary tree's values level by level: a list of lists, one per depth.",
    examples: [
      { input: "tree = [3, 9, 20, None, None, 15, 7]", output: "[[3], [9, 20], [15, 7]]" },
      { input: "tree = [1, 2]", output: "[[1], [2]]" },
    ],
    why: "Breadth-first search on a tree: the queue holds exactly one level at a time, and snapshotting its size per round converts a flat queue into levels. This same loop finds shortest paths in unweighted graphs in stage 11 — the tree is just the graph with no cycles.",
    starterCode: "def level_order(root):\n    pass",
    hints: [
      "Queue starts with the root; loop while the queue is non-empty.",
      "Each round: snapshot n = len(queue), pop n nodes, collect their values, push their children.",
      "Skip None children."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef level_order(root):\n    if not root:\n        return []\n    out = []\n    queue = [root]\n    while queue:\n        level = []\n        nxt = []\n        for node in queue:\n            level.append(node.val)\n            if node.left:\n                nxt.append(node.left)\n            if node.right:\n                nxt.append(node.right)\n        out.append(level)\n        queue = nxt\n    return out",
    walkthrough: "Each iteration processes one complete level — the level list is built as the next queue is assembled. BFS's defining property is already visible: nodes are visited in nondecreasing depth order, which is why the first time you see a node in a graph, that path is shortest.",
    testCode: "assert level_order(make_tree([3, 9, 20, None, None, 15, 7])) == [[3], [9, 20], [15, 7]]\nassert level_order(make_tree([1, 2])) == [[1], [2]]\nassert level_order(make_tree([])) == []\nprint('All tests passed!')"
  },
  {
    id: 54, stage: 9, title: "Tree Diameter", pattern: "post-order accumulation", skill: "answer at the root, info up the tree", difficulty: "Medium",
    statement: "The diameter is the number of edges on the longest path between any two nodes. Return the diameter of a binary tree.",
    examples: [
      { input: "tree = [1, 2, 3, 4, 5]", output: "3", explain: "4 -> 2 -> 1 -> 3" },
      { input: "tree = [1, 2]", output: "1" },
    ],
    why: "The first 'global answer from local returns' pattern: the subtree returns its HEIGHT (one number), while the parent candidate — left height + right height — updates a best recorded outside the recursion. What to return and what to track are different quantities; splitting them unlocks most tree problems.",
    starterCode: "def diameter(root):\n    pass",
    hints: [
      "Define height(node): 0 for None, else 1 + max(height(left), height(right)).",
      "Inside the same recursion, the candidate path through this node is height(left) + height(right).",
      "Keep a nonlocal best; return only the height."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef diameter(root):\n    best = 0\n    def height(node):\n        nonlocal best\n        if not node:\n            return 0\n        lh = height(node.left)\n        rh = height(node.right)\n        if lh + rh > best:\n            best = lh + rh\n        return 1 + max(lh, rh)\n    height(root)\n    return best",
    walkthrough: "Every path bends through its highest node, so checking lh + rh at each node covers all paths — a complete proof in one line. The function returns the value the PARENT needs (height) while the global captures the answer WE need (diameter): that dual contract is the whole pattern.",
    testCode: "assert diameter(make_tree([1, 2, 3, 4, 5])) == 3\nassert diameter(make_tree([1, 2])) == 1\nassert diameter(make_tree([1])) == 0\nassert diameter(make_tree([1, 2, 3, 4, 5, None, None, 6])) == 4\nprint('All tests passed!')"
  },
  {
    id: 55, stage: 9, title: "Validate BST", pattern: "range-constrained recursion", skill: "pass down the bounds", difficulty: "Medium",
    statement: "Return True if a binary tree is a valid binary search tree — every left subtree's values less than the node, every right subtree's greater. Checking parent-child pairs is NOT enough.",
    examples: [
      { input: "tree = [5, 1, 4, None, None, 3, 6]", output: "False", explain: "4's left child 3 is fine locally, but 3 must also exceed the root 5 — it does not" },
      { input: "tree = [2, 1, 3]", output: "True" },
    ],
    why: "The classic wrong answer is comparing each node to its children. The fix — carry an (lo, hi) allowed range down the recursion — teaches that constraints accumulate along paths, not along edges. Passing context downward is the mirror image of stage 9's diameter, which accumulated answers upward.",
    starterCode: "def is_bst(root):\n    pass",
    hints: [
      "Recurse with bounds: check(root, lo, hi).",
      "Root must satisfy lo < val < hi; recurse left with (lo, val) and right with (val, hi).",
      "Start with (-infinity, +infinity)."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef is_bst(root):\n    def check(node, lo, hi):\n        if not node:\n            return True\n        if not (lo < node.val < hi):\n            return False\n        return check(node.left, lo, node.val) and check(node.right, node.val, hi)\n    return check(root, float('-inf'), float('inf'))",
    walkthrough: "Each node inherits every ancestor's constraint: a right-right grandchild must exceed both its parent and grandparent. The (lo, hi) pair compresses all of that into two numbers. Alternatively: an inorder traversal of a BST is sorted — two theories, one property.",
    testCode: "assert is_bst(make_tree([2, 1, 3])) == True\nassert is_bst(make_tree([5, 1, 4, None, None, 3, 6])) == False\nassert is_bst(make_tree([10, 5, 15, None, None, 6, 20])) == False\nassert is_bst(make_tree([1])) == True\nprint('All tests passed!')"
  },
  {
    id: 56, stage: 9, title: "Lowest Common Ancestor", pattern: "recursive split search", skill: "the answer is where the paths diverge", difficulty: "Medium",
    statement: "Given a binary tree (unique values) and two node values p and q, return the value of their lowest common ancestor — the deepest node that has both in its subtree.",
    examples: [
      { input: "tree = [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4], p = 5, q = 1", output: "3" },
      { input: "same tree, p = 5, q = 4", output: "5", explain: "an ancestor may be one of the two nodes" },
    ],
    why: "The recursion asks each subtree a yes/no-ish question and the logic writes itself: both targets left → recurse left; both right → recurse right; split (or found one here) → this node is the LCA. Reading the case analysis out loud before coding is the skill — the code is four lines.",
    starterCode: "def lca(root, p, q):\n    pass",
    hints: [
      "None returns None. If root.val equals p or q, return root — a node can be its own ancestor.",
      "Recurse left and right, keeping both results.",
      "Both non-None → this root splits the targets and is the answer; one non-None → pass it up."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef lca(root, p, q):\n    if not root or root.val == p or root.val == q:\n        return root\n    left = lca(root.left, p, q)\n    right = lca(root.right, p, q)\n    if left and right:\n        return root\n    return left if left else right",
    walkthrough: "The None-propagation carries 'target found in my subtree' information upward in the return value itself — no parent pointers, no paths stored. When both sides report finds, the current node is the divergence point. Whole algorithm: O(n), no aux data structure.",
    testCode: "t = make_tree([3, 5, 1, 6, 2, 0, 8, None, None, 7, 4])\nassert lca(t, 5, 1).val == 3\nassert lca(t, 5, 4).val == 5\nassert lca(t, 7, 4).val == 2\nassert lca(t, 0, 8).val == 1\nprint('All tests passed!')"
  },
  {
    id: 57, stage: 9, title: "Max Path Sum", pattern: "post-order with negative pruning", skill: "return one leg, keep the bend", difficulty: "Hard",
    statement: "A path is any sequence of connected nodes (each used once), moving parent-to-child or child-to-parent — it must bend through at most one 'peak' node. Return the maximum path sum; values may be negative.",
    examples: [
      { input: "tree = [-10, 9, 20, None, None, 15, 7]", output: "42", explain: "15 -> 20 -> 7" },
      { input: "tree = [2, -1]", output: "2" },
    ],
    why: "Diameter's pattern (problem 54) with a twist that makes it hard: a leg with negative gain should be dropped — 'extend through me' and 'the best path bending here' are now different numbers, and the answer can't go below a single node. Same recursion contract, sharper algebra.",
    starterCode: "def max_path_sum(root):\n    pass",
    hints: [
      "gain(node) = node.val + max(0, gain(left), gain(right)) — negative legs contribute 0.",
      "The bend candidate at node: val + max(0, gain(left)) + max(0, gain(right)).",
      "Track the best bend globally; return the gain."
    ],
    solution: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef make_tree(values):\n    if not values:\n        return None\n    nodes = [TreeNode(v) if v is not None else None for v in values]\n    kids = nodes[1:]\n    for i, node in enumerate(nodes):\n        if node is None:\n            continue\n        if kids:\n            node.left = kids.pop(0)\n        if kids:\n            node.right = kids.pop(0)\n    return nodes[0]\n\ndef max_path_sum(root):\n    best = float('-inf')\n    def gain(node):\n        nonlocal best\n        if not node:\n            return 0\n        lg = max(0, gain(node.left))\n        rg = max(0, gain(node.right))\n        bend = node.val + lg + rg\n        if bend > best:\n            best = bend\n        return node.val + max(lg, rg)\n    gain(root)\n    return best",
    walkthrough: "gain clips negative legs — a path is allowed to start anywhere, so a losing subtree is simply not entered. The bend uses both legs (at most one each side); the return uses only one, because the parent can extend the path through just one child. Three lines of algebra distinguish this from problem 54 — compare them side by side.",
    testCode: "assert max_path_sum(make_tree([-10, 9, 20, None, None, 15, 7])) == 42\nassert max_path_sum(make_tree([2, -1])) == 2\nassert max_path_sum(make_tree([1, 2, 3])) == 6\nassert max_path_sum(make_tree([-3])) == -3\nprint('All tests passed!')"
  },
  {
    id: 58, stage: 10, title: "Kth Largest", pattern: "heap of size k", skill: "keep only the winners", difficulty: "Easy",
    statement: "Return the k-th largest element of a list. Solve it with a heap holding at most k elements at all times.",
    examples: [
      { input: "nums = [3, 2, 1, 5, 6, 4], k = 2", output: "5" },
      { input: "nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4", output: "4" },
    ],
    why: "Sorting is O(n log n); the heap-of-size-k is O(n log k) — the min-heap holds the k largest seen so far, and any newcomer smaller than the heap's min can be ignored instantly. 'Maintain the k best, evict the rest' is the streaming pattern behind top-k, nearest neighbors, and sliding-window extrema.",
    starterCode: "def kth_largest(nums, k):\n    pass",
    hints: [
      "import heapq; heapq is a min-heap.",
      "Push each number; when the heap exceeds k elements, heappop (drops the smallest).",
      "The heap's root is now the k-th largest."
    ],
    solution: "import heapq\n\ndef kth_largest(nums, k):\n    heap = []\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]",
    walkthrough: "The invariant: heap contains the k largest of everything processed. A newcomer either joins the elite or gets evicted immediately — so the root is the worst of the elite, the k-th largest. Note the asymmetry: for k-th LARGEST you keep a MIN-heap — the opposite feels right and is wrong.",
    testCode: "assert kth_largest([3, 2, 1, 5, 6, 4], 2) == 5\nassert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4\nassert kth_largest([1], 1) == 1\nassert kth_largest([7, 7, 7], 2) == 7\nprint('All tests passed!')"
  },
  {
    id: 59, stage: 10, title: "Top K Frequent", pattern: "counter + heap", skill: "compose the toolbox", difficulty: "Medium",
    statement: "Return the k most frequent elements of a list, sorted ascending.",
    examples: [
      { input: "nums = [1, 1, 1, 2, 2, 3], k = 2", output: "[1, 2]" },
      { input: "nums = [4, 4, 4, 6, 6, 7], k = 1", output: "[4]" },
    ],
    why: "No single structure answers this — it is a pipeline: count (hash map, stage 2), then select top-k (heap, stage 10). Composing two tools into one O(n log k) algorithm is the moment pattern knowledge starts compounding; nearly every 'medium' interview problem is such a pipeline.",
    starterCode: "def top_k_frequent(nums, k):\n    pass",
    hints: [
      "Counter(nums) gives value -> frequency.",
      "heapq.nsmallest(k, counts, key=frequency) — or push (-freq, value) pairs into a heap and pop k times.",
      "Sort the k winners before returning."
    ],
    solution: "import heapq\n\ndef top_k_frequent(nums, k):\n    counts = {}\n    for x in nums:\n        counts[x] = counts.get(x, 0) + 1\n    best = heapq.nsmallest(k, counts, key=lambda v: (-counts[v], v))\n    return sorted(best)",
    walkthrough: "The heap orders by (-frequency, value): higher frequency first, ties broken by value for determinism. n counts + k selections = O(n + k log n). The composition insight: hash map for aggregation, heap for selection — name the phases and the code is boring.",
    testCode: "assert top_k_frequent([1, 1, 1, 2, 2, 3], 2) == [1, 2]\nassert top_k_frequent([4, 4, 4, 6, 6, 7], 1) == [4]\nassert top_k_frequent([1], 1) == [1]\nassert top_k_frequent([3, 1, 2, 3, 1, 2], 3) == [1, 2, 3]\nprint('All tests passed!')"
  },
  {
    id: 60, stage: 10, title: "Reorganize String", pattern: "greedy with max-heap", skill: "always spend the biggest pile", difficulty: "Medium",
    statement: "Rearrange a string's characters so no two adjacent are equal. Return any valid arrangement, or '' if impossible.",
    examples: [
      { input: "s = 'aab'", output: "'aba' (or any valid rearrangement)" },
      { input: "s = 'aaab'", output: "''", explain: "three a's cannot separate two gaps" },
    ],
    why: "The feasibility test is pure counting (max count > (n+1)//2 → impossible), and the algorithm is pure greed: always place the most-abundant remaining character that differs from the last placed. A max-heap (negated counts in Python's min-heap) makes 'most abundant' O(log n). Greedy + heap: the pairing behind task scheduling, file merging, and Huffman.",
    starterCode: "def reorganize(s):\n    pass",
    hints: [
      "Count characters; if max count > (len(s) + 1) // 2, return '' immediately.",
      "Push (-count, char) into a heap; each step pop the best candidate that differs from the last placed character.",
      "If the heap top equals the last placed char, pop a second one, place it, push the first back."
    ],
    solution: "import heapq\n\ndef reorganize(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    if max(counts.values()) > (len(s) + 1) // 2:\n        return ''\n    heap = [(-c, ch) for ch, c in counts.items()]\n    heapq.heapify(heap)\n    out = []\n    while len(heap) > 1:\n        c1, ch1 = heapq.heappop(heap)\n        c2, ch2 = heapq.heappop(heap)\n        out.append(ch1)\n        out.append(ch2)\n        if c1 + 1 < 0:\n            heapq.heappush(heap, (c1 + 1, ch1))\n        if c2 + 1 < 0:\n            heapq.heappush(heap, (c2 + 1, ch2))\n    if heap:\n        out.append(heap[0][1])\n    return ''.join(out)",
    walkthrough: "Pairing the two most abundant chars each round keeps counts balanced — the greedy that makes 'no two adjacent equal' achievable exactly when the counting test passes. The (c + 1 < 0) idiom is how you decrement in a negated min-heap. Property tests check validity rather than one exact string: many arrangements are correct.",
    testCode: "r = reorganize('aab')\nassert sorted(r) == ['a', 'a', 'b'] and r[0] != r[1] and r[1] != r[2]\nassert reorganize('aaab') == ''\nr2 = reorganize('aabb')\nassert sorted(r2) == ['a', 'a', 'b', 'b'] and r2[0] != r2[1] and r2[1] != r2[2] and r2[2] != r2[3]\nassert reorganize('a') == 'a'\nprint('All tests passed!')"
  },
  {
    id: 61, stage: 10, title: "Running Median", pattern: "two heaps", skill: "split the order in half", difficulty: "Hard",
    statement: "Design a structure that accepts numbers one at a time and reports the median of everything seen so far after each insert — in O(log n) per insert. Implement class MedianFinder with add_num(x) and find_median() (float).",
    examples: [
      { input: "add 1, 2, 3, 4, 5 — medians after each", output: "1.0, 1.5, 2.0, 2.5, 3.0" },
      { input: "add 5, find_median", output: "5.0" },
    ],
    why: "The median is the middle of a sorted stream — you never need the full order, just the boundary between the lower half and upper half. Two heaps hold the halves: a max-heap below (as negated min-heap), a min-heap above, sizes never differing by more than one. The median is always at the seam. This 'order at the boundary only' insight is the deepest idea in this stage.",
    starterCode: "class MedianFinder:\n    def __init__(self):\n        pass",
    hints: [
      "lo = max-heap of the smaller half (store negatives); hi = min-heap of the larger half.",
      "On add: push into lo, then move lo's largest to hi; if hi grew bigger than lo, move hi's smallest back.",
      "Median: if sizes equal, average the two tops; else lo's top (remember: negated)."
    ],
    solution: "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        self.lo = []\n        self.hi = []\n    def add_num(self, x):\n        heapq.heappush(self.lo, -x)\n        heapq.heappush(self.hi, -heapq.heappop(self.lo))\n        if len(self.hi) > len(self.lo):\n            heapq.heappush(self.lo, -heapq.heappop(self.hi))\n    def find_median(self):\n        if len(self.lo) > len(self.hi):\n            return float(-self.lo[0])\n        return (-self.lo[0] + self.hi[0]) / 2",
    walkthrough: "The rebalance ritual (push lo, transplant to hi, repay if hi overweight) maintains both invariants at once: every element of lo <= every element of hi, and len(lo) - len(hi) ∈ {0, 1}. The median is then one or two reads with zero searching. Two heaps = a sorted array with only the middle maintained.",
    testCode: "m = MedianFinder()\nm.add_num(1)\nassert m.find_median() == 1.0\nm.add_num(2)\nassert m.find_median() == 1.5\nm.add_num(3)\nassert m.find_median() == 2.0\nm.add_num(4)\nassert m.find_median() == 2.5\nm.add_num(5)\nassert m.find_median() == 3.0\nm2 = MedianFinder()\nm2.add_num(5)\nassert m2.find_median() == 5.0\nprint('All tests passed!')"
  },
  {
    id: 62, stage: 10, title: "Merge K Lists", pattern: "heap of heads", skill: "k-way merge", difficulty: "Hard",
    statement: "Given k sorted linked lists, merge them into one sorted list. Use a heap of the current head of each list.",
    examples: [
      { input: "[1->4->5, 1->3->4, 2->6]", output: "[1, 1, 2, 3, 4, 4, 5, 6]" },
      { input: "[], []", output: "[]" },
    ],
    why: "Two-way merging (problem 42) extends to k-way by always asking 'who is smallest among the k fronts?' — a question the heap answers in O(log k). Total O(n log k) versus O(nk) for naive scanning. External sorting, log-structured storage, and Dijkstra all run on this exact loop.",
    starterCode: "def merge_k(lists):\n    pass",
    hints: [
      "Push (head.val, list_index, head) for each non-empty list.",
      "Pop the smallest; attach its node to the output tail; push its .next if it exists.",
      "The list_index tie-breaks equal values and keeps tuple comparison well-defined."
    ],
    solution: "import heapq\n\nclass ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef to_pylist(head):\n    out = []\n    while head:\n        out.append(head.val)\n        head = head.next\n    return out\n\ndef merge_k(lists):\n    heap = []\n    for i, head in enumerate(lists):\n        if head:\n            heapq.heappush(heap, (head.val, i, head))\n    dummy = ListNode(0)\n    tail = dummy\n    while heap:\n        val, i, node = heapq.heappop(heap)\n        tail.next = node\n        tail = node\n        if node.next:\n            heapq.heappush(heap, (node.next.val, i, node.next))\n    return dummy.next",
    walkthrough: "The heap holds one candidate per list — exactly the information 'which front is smallest' needs. Each of the n nodes enters and leaves the heap once: O(n log k). The dummy head (problem 42 again) assembles the output without special cases.",
    testCode: "a = make_list([1, 4, 5])\nb = make_list([1, 3, 4])\nc = make_list([2, 6])\nassert to_pylist(merge_k([a, b, c])) == [1, 1, 2, 3, 4, 4, 5, 6]\nassert to_pylist(merge_k([])) == []\nassert to_pylist(merge_k([None, make_list([7])])) == [7]\nprint('All tests passed!')"
  },
  {
    id: 63, stage: 11, title: "Build The Graph", pattern: "adjacency list + BFS", skill: "edges are not the graph", difficulty: "Easy",
    statement: "Given edges as (u, v) pairs (undirected), build an adjacency list, then return the sorted list of all nodes reachable from src.",
    examples: [
      { input: "edges = [(0, 1), (1, 2), (3, 4)], src = 0", output: "[0, 1, 2]" },
      { input: "edges = [(0, 1)], src = 5", output: "[5]", explain: "5 exists alone" },
    ],
    why: "The edge list is a fact sheet, not the graph — the adjacency list is the graph, organized the way algorithms traverse it. Building it (u→v AND v→u for undirected) plus one BFS answers reachability; every graph problem in this ladder starts with this exact ritual.",
    starterCode: "def reachable(edges, src):\n    pass",
    hints: [
      "adj = {}; for u, v: adj.setdefault(u, []).append(v) and the reverse.",
      "Make sure src is a key even with no edges.",
      "BFS from src with a visited set; sort the visited set for the answer."
    ],
    solution: "def reachable(edges, src):\n    adj = {}\n    def link(u, v):\n        adj.setdefault(u, []).append(v)\n    for u, v in edges:\n        link(u, v)\n        link(v, u)\n    adj.setdefault(src, [])\n    seen = {src}\n    queue = [src]\n    while queue:\n        node = queue.pop(0)\n        for nxt in adj[node]:\n            if nxt not in seen:\n                seen.add(nxt)\n                queue.append(nxt)\n    return sorted(seen)",
    walkthrough: "The visited set is what makes BFS linear: each node enters the queue once, each edge is read twice (once per direction). Reachability is 'the visited set at the end' — the first of many graph answers that are literally just that set.",
    testCode: "assert reachable([(0, 1), (1, 2), (3, 4)], 0) == [0, 1, 2]\nassert reachable([(0, 1)], 5) == [5]\nassert reachable([], 9) == [9]\nassert reachable([(1, 2), (2, 3), (3, 1)], 1) == [1, 2, 3]\nprint('All tests passed!')"
  },
  {
    id: 64, stage: 11, title: "Number Of Islands", pattern: "grid flood fill", skill: "the grid is a graph", difficulty: "Medium",
    statement: "A grid of '1' (land) and '0' (water) cells — an island is a group of lands connected horizontally or vertically. Count the islands.",
    examples: [
      { input: "grid = [['1','1','0'], ['1','0','0'], ['0','0','1']]", output: "2" },
      { input: "grid = [['1','1','1','1','0'], ['1','1','0','1','0'], ['1','1','0','0','0'], ['0','0','0','0','0']]", output: "1" },
    ],
    why: "The grid is an implicit graph: cells are nodes, adjacency is up/down/left/right. Flood fill (BFS/DFS from each unvisited land) counts components — stage 13's union-find will solve the same problem differently, and comparing the two is the point. Sinking visited land in place is the classic O(1)-memory trick.",
    starterCode: "def count_islands(grid):\n    pass",
    hints: [
      "Scan every cell; when you find a '1', that is a new island — count it and flood-fill it away.",
      "The fill: BFS/DFS over four directions, turning each visited '1' into '0' (or track a visited set).",
      "Mutating the grid is safe here — or copy it first if purity matters."
    ],
    solution: "def count_islands(grid):\n    if not grid:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    def sink(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':\n            return\n        grid[r][c] = '0'\n        sink(r + 1, c)\n        sink(r - 1, c)\n        sink(r, c + 1)\n        sink(r, c - 1)\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == '1':\n                count += 1\n                sink(r, c)\n    return count",
    walkthrough: "Each land cell is visited exactly once across all fills: O(rows × cols). Sinking marks visited without a set — the mutation IS the memory. Note the double role of the scan: it finds new islands AND guarantees no island is counted twice (its cells are already water by the time the scan arrives).",
    testCode: "g1 = [['1', '1', '0'], ['1', '0', '0'], ['0', '0', '1']]\nassert count_islands(g1) == 2\ng2 = [['1', '1', '1', '1', '0'], ['1', '1', '0', '1', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '0', '0', '0']]\nassert count_islands(g2) == 1\nassert count_islands([['0']]) == 0\nprint('All tests passed!')"
  },
  {
    id: 65, stage: 11, title: "Clone Graph", pattern: "traversal with a memo", skill: "the visited map does double duty", difficulty: "Medium",
    statement: "Deep-copy an undirected graph given as a starting node with neighbors lists. Nodes have unique vals. The clone must share NO nodes with the original.",
    examples: [
      { input: "graph: 1 - 2, 2 - 3, 3 - 1 (start at 1)", output: "a fully separate copy with the same shape" },
      { input: "single node, no neighbors", output: "a copy of that node" },
    ],
    why: "Cloning fights an unusual enemy: cycles. A naive copy recurses forever; the memo (original -> copy) is both the visited set AND the output being built. One map answers 'did I already copy this?' and 'where is my copy?' — when one structure serves two roles, the algorithm is usually elegant.",
    starterCode: "def clone_graph(node):\n    pass",
    hints: [
      "memo = {} maps original node -> its clone.",
      "Recursive helper: if node in memo, return the clone; else create the clone FIRST, then fill its neighbors by recursing.",
      "Creating the clone before recursing on neighbors is what breaks the cycle."
    ],
    solution: "class GNode:\n    def __init__(self, val, neighbors=None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\ndef clone_graph(node):\n    if not node:\n        return None\n    memo = {}\n    def copy(n):\n        if n in memo:\n            return memo[n]\n        clone = GNode(n.val)\n        memo[n] = clone\n        for nb in n.neighbors:\n            clone.neighbors.append(copy(nb))\n        return clone\n    return copy(node)",
    walkthrough: "Registering the clone in memo before recursing means the cycle 1→2→3→1 hits memo on the way back instead of recursing infinitely. The test verifies structural equality plus that no original node object appears in the clone — deep copy means deep.",
    testCode: "def graph_vals(start):\n    seen = {}\n    order = []\n    stack = [start]\n    while stack:\n        n = stack.pop()\n        if id(n) in seen:\n            continue\n        seen[id(n)] = sorted(nb.val for nb in n.neighbors)\n        order.append((n.val, sorted(nb.val for nb in n.neighbors)))\n        stack.extend(n.neighbors)\n    return sorted(order)\n\nn1, n2, n3 = GNode(1), GNode(2), GNode(3)\nn1.neighbors = [n2, n3]\nn2.neighbors = [n1, n3]\nn3.neighbors = [n1, n2]\nclone = clone_graph(n1)\nassert graph_vals(clone) == [(1, [2, 3]), (2, [1, 3]), (3, [1, 2])]\nall_clone = {clone, clone.neighbors[0], clone.neighbors[1]}\nall_orig = {n1, n2, n3}\nassert not (all_clone & all_orig)\nassert clone_graph(None) is None\nprint('All tests passed!')"
  },
  {
    id: 66, stage: 11, title: "Course Order", pattern: "Kahn's topological sort", skill: "peel the zero in-degrees", difficulty: "Medium",
    statement: "Given numCourses and prerequisite pairs [a, b] (b before a), return one valid course order taking all courses, or [] if impossible (cycle). Use the deterministic order: among ready courses, pick the smallest index first.",
    examples: [
      { input: "n = 4, prereq = [[1, 0], [2, 0], [3, 1], [3, 2]]", output: "[0, 1, 2, 3]" },
      { input: "n = 2, prereq = [[1, 0], [0, 1]]", output: "[]" },
    ],
    why: "Topological order = processing order where every dependency comes first. Kahn's algorithm is the dependency graph as a flow: in-degree counts, zeros are 'ready now', completing a course decrements its dependents. Cycle detection falls out for free (leftover nodes with nonzero in-degree). Sorting, build systems, and spreadsheets all run on this.",
    starterCode: "def course_order(n, prereq):\n    pass",
    hints: [
      "Build adjacency (b -> dependents) and an in-degree count per course.",
      "Seed a queue with all in-degree-0 courses — smallest index first for determinism.",
      "Pop, append to order, decrement each dependent's in-degree; when one hits 0, enqueue it. len(order) < n means a cycle."
    ],
    solution: "from collections import deque\n\ndef course_order(n, prereq):\n    adj = {i: [] for i in range(n)}\n    indeg = [0] * n\n    for a, b in prereq:\n        adj[b].append(a)\n        indeg[a] += 1\n    ready = deque(sorted(i for i in range(n) if indeg[i] == 0))\n    order = []\n    while ready:\n        c = ready.popleft()\n        order.append(c)\n        for nxt in adj[c]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                ready.append(nxt)\n    return order if len(order) == n else []",
    walkthrough: "In-degree is 'how many prerequisites remain' — the queue naturally drains in a valid order. The final length check is the cycle detector: a cycle's members never reach zero, so they never enqueue. Determinism comes from sorted seeding + FIFO order.",
    testCode: "assert course_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]) == [0, 1, 2, 3]\nassert course_order(2, [[1, 0], [0, 1]]) == []\nassert course_order(1, []) == [0]\nassert course_order(3, [[0, 1], [1, 2]]) == [2, 1, 0]\nprint('All tests passed!')"
  },
  {
    id: 67, stage: 11, title: "Is Bipartite", pattern: "two-coloring BFS", skill: "parity as a property", difficulty: "Medium",
    statement: "Given a graph's adjacency list, return True if its nodes can be split into two groups so that every edge crosses between groups (equivalently: 2-colorable, equivalently: no odd cycle).",
    examples: [
      { input: "adj = {0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [0, 2]}", output: "True" },
      { input: "adj = {0: [1, 2, 3], 1: [0], 2: [0], 3: [0]}", output: "True", explain: "a star: center in one group, all leaves in the other" },
    ],
    why: "BFS layer parity IS the coloring: neighbors must differ, so color each node by its distance parity and any same-color edge exposes an odd cycle. This converts a global structural question into a local check during a standard traversal — the kind of reframing that makes graph theory usable.",
    starterCode: "def is_bipartite(adj):\n    pass",
    hints: [
      "color = {}; BFS from every uncolored node (the graph may be disconnected).",
      "Color the start 0; each neighbor gets the opposite color; a neighbor already colored the SAME as current means fail.",
      "All nodes processed with no conflict → True."
    ],
    solution: "from collections import deque\n\ndef is_bipartite(adj):\n    color = {}\n    for start in adj:\n        if start in color:\n            continue\n        color[start] = 0\n        queue = deque([start])\n        while queue:\n            node = queue.popleft()\n            for nb in adj[node]:\n                if nb not in color:\n                    color[nb] = 1 - color[node]\n                    queue.append(nb)\n                elif color[nb] == color[node]:\n                    return False\n    return True",
    walkthrough: "The outer loop handles disconnected components; the inner BFS colors by parity. The conflict check runs during traversal — no separate validation pass. Odd cycles (triangles, 5-cycles) are exactly what cannot alternate colors, which is why this answers the odd-cycle question too.",
    testCode: "assert is_bipartite({0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [0, 2]}) == True\nassert is_bipartite({0: [1, 2, 3], 1: [0], 2: [0], 3: [0]}) == True\nassert is_bipartite({0: [1, 2], 1: [0, 2], 2: [0, 1]}) == False\nassert is_bipartite({}) == True\nassert is_bipartite({0: [1], 1: [0], 2: [3], 3: [2]}) == True\nprint('All tests passed!')"
  },
  {
    id: 68, stage: 11, title: "Word Ladder", pattern: "BFS on implicit graph", skill: "neighbors computed, not given", difficulty: "Hard",
    statement: "From beginWord to endWord, changing one letter at a time, each intermediate word must be in the word list. Return the length of the shortest sequence (counting both endpoints), or 0 if impossible.",
    examples: [
      { input: "begin = 'hit', end = 'cog', list = ['hot', 'dot', 'dog', 'lot', 'log', 'cog']", output: "5", explain: "hit -> hot -> dot -> dog -> cog" },
      { input: "begin = 'hit', end = 'cog', list = ['hot', 'dot', 'dog', 'lot', 'log']", output: "0" },
    ],
    why: "The graph is invisible: nodes are words, edges are one-letter differences — materialized on the fly with the wildcard bucket trick (*it, h*t, hi*). BFS then just runs. Modeling the problem so a standard algorithm applies — rather than writing a custom search — is the highest-leverage skill in graph problems.",
    starterCode: "def word_ladder(begin, end, words):\n    pass",
    hints: [
      "Bucket every word by pattern: 'hot' -> '*ot', 'h*t', 'ho*' — words sharing a bucket are adjacent.",
      "BFS from begin, one level per transformation; count levels until you reach end.",
      "If end is never dequeued, return 0."
    ],
    solution: "from collections import deque\n\ndef word_ladder(begin, end, words):\n    wordset = set(words) | {begin}\n    if end not in wordset:\n        return 0\n    buckets = {}\n    for w in wordset:\n        for i in range(len(w)):\n            buckets.setdefault(w[:i] + '*' + w[i + 1:], []).append(w)\n    dist = {begin: 1}\n    queue = deque([begin])\n    while queue:\n        w = queue.popleft()\n        if w == end:\n            return dist[w]\n        for i in range(len(w)):\n            for nb in buckets.get(w[:i] + '*' + w[i + 1:], []):\n                if nb not in dist:\n                    dist[nb] = dist[w] + 1\n                    queue.append(nb)\n    return 0",
    walkthrough: "Building buckets costs O(words × letters) once; during BFS, one wildcard lookup fetches all neighbors without comparing every pair of words. dist doubles as the visited set (BFS gives shortest distances on first visit — unweighted edges). The answer counts nodes: hit(1) hot(2) dot(3) dog(4) cog(5).",
    testCode: "assert word_ladder('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']) == 5\nassert word_ladder('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']) == 0\nassert word_ladder('a', 'c', ['a', 'b', 'c']) == 2\nprint('All tests passed!')"
  },
]
