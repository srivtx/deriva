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

export const STAGES_ADVANCED_TREES = [
  { id: 0, name: "Path Reflex", desc: "root-to-node as object" },
  { id: 1, name: "Ancestors & Distance", desc: "depth equalization" },
  { id: 2, name: "Serialization", desc: "tree as string" },
  { id: 3, name: "Views & Boundaries", desc: "from the side" },
  { id: 4, name: "Naive", desc: "enumerate all paths" },
  { id: 5, name: "Optimization", desc: "prefix-on-path" },
  { id: 6, name: "Mastery", desc: "tuples bloom" },
]

export const PROBLEMS_ADVANCED_TREES: Problem[] = [
  // ── STAGE 0: Path Reflex ──
  {
    id: 1, stage: 0, title: "Binary Tree Paths as Strings", pattern: "root-to-leaf path", skill: "accumulate path during DFS",
    statement: "Given the root of a binary tree, return all root-to-leaf paths as strings. Each path is formatted as '1->2->5'.",
    examples: [
      { input: "root = [1,2,3,null,5]", output: "['1->2->5', '1->3']" },
      { input: "root = [1]", output: "['1']" },
    ],
    why: "A path is the most fundamental object in a tree — it connects root to a leaf. Learning to accumulate it as you descend is the entry point to every path-based tree problem.",
    starterCode: "def binary_tree_paths(root):\n    result = []\n    def dfs(node, path):\n        pass\n    dfs(root, '')\n    return result",
    hints: [
      "When you reach a leaf (no left or right child), the current path is complete — add it to results.",
      "As you go down, append '->' + str(node.val) to the path. Pass the extended path to children.",
      "At the root, start with str(root.val) not with a leading '->'."
    ],
    solution: "def binary_tree_paths(root):\n    if not root:\n        return []\n    result = []\n    def dfs(node, path):\n        if not node.left and not node.right:\n            result.append(path)\n            return\n        if node.left:\n            dfs(node.left, path + '->' + str(node.left.val))\n        if node.right:\n            dfs(node.right, path + '->' + str(node.right.val))\n    dfs(root, str(root.val))\n    return result",
    walkthrough: "Descend from root. At each node, extend the path string with the current value. When you hit a leaf (no children), append the path to results. Backtracking is automatic because each recursive call gets its own copy of the path string (immutable).",
    testCode: "t1 = build_tree([1,2,3,None,5])\nassert set(binary_tree_paths(t1)) == set(['1->2->5', '1->3'])\nt2 = build_tree([1])\nassert binary_tree_paths(t2) == ['1']\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "List All Root-to-Leaf Paths", pattern: "root-to-leaf path", skill: "path as list of node values",
    statement: "Given root of a binary tree, return all root-to-leaf paths as lists of node values. E.g., tree [1,2,3,null,5] returns [[1,2,5],[1,3]].",
    examples: [
      { input: "root = [1,2,3,null,5]", output: "[[1,2,5],[1,3]]" },
      { input: "root = [1,2,3]", output: "[[1,2],[1,3]]" },
    ],
    why: "Same skeleton as P1 but the path is a mutable list — which means you must undo your choice when backtracking. This introduces the explicit append/pop pattern.",
    starterCode: "def all_paths(root):\n    result = []\n    def dfs(node, path):\n        pass\n    dfs(root, [])\n    return result",
    hints: [
      "Append node.val to path before descending. After both children return, pop the last element.",
      "At a leaf (no children), add a COPY of the current path to results (result.append(path[:])).",
      "Why copy? Because path is a mutable list — it WILL be modified during backtracking."
    ],
    solution: "def all_paths(root):\n    result = []\n    if not root:\n        return result\n    def dfs(node, path):\n        path.append(node.val)\n        if not node.left and not node.right:\n            result.append(path[:])\n        else:\n            if node.left:\n                dfs(node.left, path)\n            if node.right:\n                dfs(node.right, path)\n        path.pop()\n    dfs(root, [])\n    return result",
    walkthrough: "Pre-order descend: append current node, then visit children. When a leaf is reached, snapshot the path with path[:] (immutable copy). Then pop current node to undo the choice — preparing the path for siblings. The undo step is what makes DFS with a mutable path work.",
    testCode: "t = build_tree([1,2,3,None,5])\npaths = all_paths(t)\nassert len(paths) == 2\nassert [1,2,5] in paths\nassert [1,3] in paths\nt2 = build_tree([1])\nassert all_paths(t2) == [[1]]\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Find Path to Target Node", pattern: "root-to-node path search", skill: "early termination with path tracking",
    statement: "Given root and a target value, return the path from root to the target node as a list. Return [] if target not found. All node values are unique.",
    examples: [
      { input: "root = [1,2,3,4,5], target = 5", output: "[1,2,5]" },
      { input: "root = [1,2,3], target = 3", output: "[1,3]" },
      { input: "root = [1,2,3], target = 9", output: "[]" },
    ],
    why: "Same path-accumulation skeleton, but now you stop early when target found. Introduces the 'did child find it?' return pattern: each recursive call reports whether it found the target.",
    starterCode: "def find_path(root, target):\n    path = []\n    def dfs(node):\n        pass\n    dfs(root)\n    return path",
    hints: [
      "Base case: if node is None, return False (not found). If node.val == target, append and return True.",
      "Recurse left: if left returns True, append current node BEFORE returning True (propagate up).",
      "Only append when target is found in a subtree — you want the path from target back up to root, them reverse."
    ],
    solution: "def find_path(root, target):\n    if not root:\n        return []\n    path = []\n    def dfs(node):\n        if node is None:\n            return False\n        if node.val == target:\n            path.append(node.val)\n            return True\n        if dfs(node.left) or dfs(node.right):\n            path.append(node.val)\n            return True\n        return False\n    dfs(root)\n    return path[::-1]",
    walkthrough: "Search downward. When target found, append its value and return True upward. Each ancestor seeing True from a child appends itself, building the path bottom-up. Reverse at the end for root-to-target order. If target never found, path stays empty.",
    testCode: "t = build_tree([1,2,3,4,5])\nassert find_path(t, 5) == [1,2,5]\nassert find_path(t, 9) == []\nt2 = build_tree([1,2,3])\nassert find_path(t2, 3) == [1,3]\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Common Ancestor Path", pattern: "path intersection", skill: "find longest common prefix of two paths",
    statement: "Given root and two target values p,q (both exist), return the path from root to their lowest common ancestor. Return as a list of node values.",
    examples: [
      { input: "root = [3,5,1,6,2,0,8], p = 5, q = 1", output: "[3]" },
      { input: "root = [3,5,1,6,2,0,8], p = 5, q = 4", output: "[3,5]", explain: "p=5, q=4: both descended from 5" },
    ],
    why: "Composes P3 (find path to node) across two targets. The LCA path is the longest common prefix of the two root-to-target paths.",
    starterCode: "def common_ancestor_path(root, p, q):\n    def find_path(node, target):\n        pass\n    path_p = find_path(root, p)\n    path_q = find_path(root, q)\n    pass",
    hints: [
      "First, write find_path(root, target) to get the list of nodes from root to target (reuse P3).",
      "Now you have path_p and path_q. The common ancestor path is their longest common prefix — iterate while equal.",
      "Stop at the first index where path_p[i] != path_q[i]. Return path_p[0:i]."
    ],
    solution: "def common_ancestor_path(root, p, q):\n    def find_path(node, target):\n        path = []\n        def dfs(n):\n            if n is None:\n                return False\n            if n.val == target:\n                path.append(n.val)\n                return True\n            if dfs(n.left) or dfs(n.right):\n                path.append(n.val)\n                return True\n            return False\n        dfs(node)\n        return path[::-1]\n    path_p = find_path(root, p)\n    path_q = find_path(root, q)\n    i = 0\n    while i < len(path_p) and i < len(path_q) and path_p[i] == path_q[i]:\n        i += 1\n    return path_p[:i]",
    walkthrough: "Get both paths from root to p and q. The common ancestor path is simply the longest prefix they share. Walk forward while path_p[i] == path_q[i]. When they diverge, the nodes before the split point form the path from root to LCA.",
    testCode: "t = build_tree([3,5,1,6,2,0,8])\nlca_path = common_ancestor_path(t, 5, 1)\nassert lca_path == [3]\nlca_path2 = common_ancestor_path(t, 5, 6)\nassert lca_path2 == [3,5]\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Path Length (Depth)", pattern: "count edges on path", skill: "depth as number of edges from root",
    statement: "Given root of a binary tree, return the depth (number of edges on the longest root-to-leaf path). An empty tree has depth -1.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "2", explain: "longest path: 3->20->15" },
      { input: "root = [1,null,2]", output: "1" },
      { input: "root = None", output: "-1" },
    ],
    why: "Depth is the simplest structural measurement of a tree — the number of edges from root to deepest leaf. It's the foundation of every tree measurement problem.",
    starterCode: "def max_depth(root):\n    def dfs(node):\n        pass\n    return dfs(root)",
    hints: [
      "Base case: None returns -1. A leaf node returns 0.",
      "Depth of a node = 1 + max(left depth, right depth).",
      "Track the maximum number of edges when traversing from root to leaf."
    ],
    solution: "def max_depth(root):\n    if root is None:\n        return -1\n    left_depth = max_depth(root.left)\n    right_depth = max_depth(root.right)\n    return 1 + max(left_depth, right_depth)",
    walkthrough: "For each node: ask children for their depths (edges from them to deepest leaf below). Take the max of left and right, add 1 for the edge connecting this node to that deepest child. None returns -1 so that a leaf (with two None children) gets depth 0.",
    testCode: "t = build_tree([3,9,20,None,None,15,7])\nassert max_depth(t) == 2\nassert max_depth(build_tree([1,None,2])) == 1\nassert max_depth(None) == -1\nprint('All tests passed!')"
  },

  {
    id: 6, stage: 0, title: "Path Maximum Value", pattern: "max along root-to-leaf path", skill: "track running maximum during DFS",
    statement: "Given root of a binary tree, return the maximum node value along each root-to-leaf path. Return as a list, one value per path.",
    examples: [
      { input: "root = [5,3,8,1,4,null,9]", output: "[5,8,9]", explain: "path 5->3->1 max=5; 5->3->4 max=5; 5->8->9 max=9" },
      { input: "root = [1,2,3]", output: "[1,2,3]" },
    ],
    why: "Same path-accumulation skeleton, now tracking max instead of sum. The pattern generalizes: during DFS, you carry any aggregate (sum, product, max, min) down the path. At each leaf, the aggregate is the path's answer.",
    starterCode: "def path_max_value(root):\n    result = []\n    def dfs(node, cur_max):\n        pass\n    dfs(root, root.val)\n    return result",
    hints: [
      "cur_max = max(cur_max, node.val) at each step. Pass the updated max down to children.",
      "At a leaf (no children): append cur_max to result.",
      "If node is None, simply return — nothing to do."
    ],
    solution: "def path_max_value(root):\n    if not root:\n        return []\n    result = []\n    def dfs(node, cur_max):\n        if node is None:\n            return\n        cur_max = max(cur_max, node.val)\n        if not node.left and not node.right:\n            result.append(cur_max)\n        else:\n            dfs(node.left, cur_max)\n            dfs(node.right, cur_max)\n    dfs(root, root.val)\n    return result",
    walkthrough: "Preorder DFS. At each node, update the running max = max(so-far, current-value). At a leaf, the running max is the path's max — record it. No backtracking needed since max is an immutable value — each recursive call gets its own copy. O(n).",
     testCode: "t = build_tree([5,3,8,1,4,None,9])\nassert path_max_value(t) == [5, 5, 9]\nt2 = build_tree([1,2,3])\nassert path_max_value(t2) == [2, 3]\nassert path_max_value(build_tree([7])) == [7]\nprint('All tests passed!')",
  },
  {
    id: 7, stage: 0, title: "Path Value Equality Check", pattern: "all-path sum equality", skill: "compute all path sums, check if all equal",
    statement: "Given root, return True if every root-to-leaf path has the SAME sum of node values. Return False otherwise.",
    examples: [
      { input: "root = [5,4,1,null,1,null,4]", output: "True", explain: "5+4+1=10 and 5+1+4=10" },
      { input: "root = [1,2,3]", output: "False", explain: "1+2=3 but 1+3=4" },
    ],
    why: "Path sums are a natural extension of the path-as-object idea. This problem asks: are all path sums equal? It's a validation check that composes path accumulation and set comparison — reusable in Stage 5's prefix-sum context.",
    starterCode: "def all_paths_equal_sum(root):\n    path_sums = set()\n    def dfs(node, current_sum):\n        pass\n    dfs(root, 0)\n    return len(path_sums) == 1",
    hints: [
      "Use a set to collect sums. At each leaf, add current_sum + node.val to the set.",
      "After DFS, if len(set) == 1, all paths have the same sum.",
      "Handle empty tree: return True (vacuously true — no paths)."
    ],
    solution: "def all_paths_equal_sum(root):\n    if not root:\n        return True\n    path_sums = set()\n    def dfs(node, current_sum):\n        if node is None:\n            return\n        current_sum += node.val\n        if not node.left and not node.right:\n            path_sums.add(current_sum)\n        else:\n            dfs(node.left, current_sum)\n            dfs(node.right, current_sum)\n    dfs(root, 0)\n    return len(path_sums) == 1",
    walkthrough: "DFS accumulates sum. At each leaf, add the path sum to a set. After traversal, if the set has exactly 1 entry, all paths have equal sum. Early termination is possible: if set size becomes > 1, you can stop. O(n).",
    testCode: "t = build_tree([5,4,1,None,1,None,4])\nassert all_paths_equal_sum(t) == True\nt2 = build_tree([1,2,3])\nassert all_paths_equal_sum(t2) == False\nassert all_paths_equal_sum(None) == True\nprint('All tests passed!')",
  },
  // ── STAGE 1: Ancestors & Distance ──
  {
    id: 8, stage: 1, title: "Lowest Common Ancestor — General Tree", pattern: "depth equalization", skill: "equalize depths, then walk up together",
    statement: "Given root of a binary tree and two distinct nodes p,q (both exist), return their lowest common ancestor. Use the brute-force path method: find both paths, then find the last common node.",
    examples: [
      { input: "root = [3,5,1,6,2,0,8], p.val = 5, q.val = 1", output: "3" },
      { input: "root = [3,5,1,6,2,0,8], p.val = 5, q.val = 4", output: "5", explain: "p=5, q child of 4, LCA is 5" },
    ],
    why: "LCA is the most fundamental ancestor problem. Two approaches exist: (1) find paths, compare; (2) DFS with tuple return. We start with (1) because it reuses the path reflex from Stage 0.",
    starterCode: "def lowest_common_ancestor(root, p, q):\n    def find_path(node, target, path):\n        pass\n    path_p = []\n    find_path(root, p, path_p)\n    path_q = []\n    find_path(root, q, path_q)\n    pass",
    hints: [
      "Build find_path(node, target, path) that appends nodes as it searches. Return True when target is found.",
      "Once you have path_p and path_q, iterate while they share the same node at same index.",
      "The last common node before paths diverge is the LCA."
    ],
    solution: "def lowest_common_ancestor(root, p, q):\n    def find_path(node, target, path):\n        if node is None:\n            return False\n        path.append(node)\n        if node.val == target.val:\n            return True\n        if find_path(node.left, target, path) or find_path(node.right, target, path):\n            return True\n        path.pop()\n        return False\n    path_p, path_q = [], []\n    find_path(root, p, path_p)\n    find_path(root, q, path_q)\n    lca = root\n    for i in range(min(len(path_p), len(path_q))):\n        if path_p[i].val == path_q[i].val:\n            lca = path_p[i]\n        else:\n            break\n    return lca",
    walkthrough: "Find both root-to-node paths using the append/pop pattern from Stage 0. Walk forward while nodes match. The last match is the LCA. This is the 'path comparison' approach — clear and reuses prior skills perfectly.",
    testCode: "t = build_tree([3,5,1,6,2,0,8])\nnode_5 = find_node_ref(t, 5)\nnode_1 = find_node_ref(t, 1)\nassert lowest_common_ancestor(t, node_5, node_1).val == 3\nnode_6 = find_node_ref(t, 6)\nassert lowest_common_ancestor(t, node_5, node_6).val == 5\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "LCA with Parent Pointers", pattern: "ancestor set intersection", skill: "walk up and check set membership",
    statement: "Given two nodes p,q in a tree where each node has a parent pointer. Return their LCA. Climb p's ancestors into a set, then climb q until you find one in the set.",
    examples: [
      { input: "nodes 5 and 1 from [3,5,1,...]", output: "3 (the LCA)" },
      { input: "nodes 5 and 2 from [3,5,1,6,2,...]", output: "5" },
    ],
    why: "When parent pointers exist, LCA becomes purely iterative — no recursion needed. The insight: if you collect all ancestors of p, q's LCA is the first ancestor of q that appears in that set.",
    starterCode: "def lca_with_parent(p, q):\n    ancestors = set()\n    pass",
    hints: [
      "Climb from p upward via parent pointers, adding each to a set, until you hit None.",
      "Now climb from q upward. The first ancestor that is already in the set is the LCA.",
      "This is O(h) time and O(h) space — the set stores p's ancestors which is at most the height."
    ],
    solution: "def lca_with_parent(p, q):\n    ancestors = set()\n    cur = p\n    while cur:\n        ancestors.add(cur)\n        cur = cur.parent\n    cur = q\n    while cur:\n        if cur in ancestors:\n            return cur\n        cur = cur.parent\n    return None",
    walkthrough: "Walk p upward, adding each ancestor to a set. Then walk q upward; the first node already in the set is the LCA. O(h) time, O(h) space. Simpler than the two-pointer depth-equalization approach.",
    testCode: "class PNode:\n    def __init__(self, val, parent=None):\n        self.val = val\n        self.parent = parent\nn3 = PNode(3)\nn5 = PNode(5, n3)\nn1 = PNode(1, n3)\nassert lca_with_parent(n5, n1).val == 3\nn6 = PNode(6, n5)\nassert lca_with_parent(n6, n1).val == 3\nassert lca_with_parent(n6, n5).val == 5\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Distance Between Two Nodes", pattern: "LCA + depth arithmetic", skill: "dist = depth(a) + depth(b) - 2*depth(lca)",
    statement: "Given root and two nodes p,q in the tree, return the number of edges between p and q (shortest path). Formula: depth(p) + depth(q) - 2*depth(LCA(p,q)).",
    examples: [
      { input: "root = [3,5,1,6,2,0,8], p.val = 5, q.val = 0", output: "3", explain: "path: 5->3->1->0 = 3 edges" },
      { input: "root = [1,2], p.val = 1, q.val = 2", output: "1" },
    ],
    why: "Distance in a tree equals the path from p up to LCA plus path from LCA down to q. Since depth counts edges from root, the distance formula falls out of depth arithmetic.",
    starterCode: "def node_distance(root, p, q):\n    def depth(node, target, level):\n        pass\n    pass",
    hints: [
      "First compute depth(p) and depth(q) from root. Then find LCA. Then use the formula.",
      "depth(node, target, level): if node == target, return level. Else recurse. Return -1 if not found.",
      "dist = depth_p + depth_q - 2 * depth_lca."
    ],
    solution: "def node_distance(root, p, q):\n    def find_depth(node, target, d):\n        if node is None:\n            return -1\n        if node.val == target.val:\n            return d\n        left = find_depth(node.left, target, d + 1)\n        if left != -1:\n            return left\n        return find_depth(node.right, target, d + 1)\n    def find_lca(node, p, q):\n        if node is None:\n            return None\n        if node.val == p.val or node.val == q.val:\n            return node\n        left = find_lca(node.left, p, q)\n        right = find_lca(node.right, p, q)\n        if left and right:\n            return node\n        return left if left else right\n    lca = find_lca(root, p, q)\n    depth_p = find_depth(root, p, 0)\n    depth_q = find_depth(root, q, 0)\n    depth_lca = find_depth(root, lca, 0)\n    return depth_p + depth_q - 2 * depth_lca",
    walkthrough: "Distance = (edges from p up to LCA) + (edges from LCA down to q). From root's perspective: depth(p) = edges root→p. The edges from p to LCA is depth(p) - depth(LCA). Same for q. Summing: depth(p) - depth(LCA) + depth(q) - depth(LCA) = depth(p) + depth(q) - 2*depth(LCA).",
    testCode: "t = build_tree([3,5,1,6,2,0,8])\nn5 = find_node_ref(t, 5)\nn0 = find_node_ref(t, 0)\nassert node_distance(t, n5, n0) == 3\nn2 = find_node_ref(t, 2)\nassert node_distance(t, n5, n2) == 1\nn6 = find_node_ref(t, 6)\nassert node_distance(t, n6, n2) == 2\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Cousin Check", pattern: "same depth, different parent", skill: "compute depth and parent, then compare",
    statement: "Given root and two nodes p,q, return True if they are cousins (same depth but different parents). Return False otherwise.",
    examples: [
      { input: "root = [1,2,3,4], p.val = 4, q.val = 5", output: "False", explain: "if 5 doesn't exist, not a cousin" },
      { input: "root = [1,2,3,null,4,null,5], p.val = 4, q.val = 5", output: "True" },
      { input: "root = [1,2,3,null,4], p.val = 2, q.val = 3", output: "False", explain: "same depth but siblings, not cousins" },
    ],
    why: "Cousins = same depth AND different parent. This combines depth measurement (P5) with parent tracking — a clean extension of the path reflex.",
    starterCode: "def is_cousins(root, p_val, q_val):\n    def dfs(node, parent, depth):\n        pass\n    return False",
    hints: [
      "DFS: when you find p_val, record its depth and parent. Same for q_val.",
      "Cousins: depth_p == depth_q AND parent_p != parent_q.",
      "Stop early if you've found both nodes."
    ],
    solution: "def is_cousins(root, p_val, q_val):\n    info_p = [None, None]\n    info_q = [None, None]\n    def dfs(node, parent, depth):\n        if node is None:\n            return\n        if node.val == p_val:\n            info_p[0], info_p[1] = depth, parent\n        if node.val == q_val:\n            info_q[0], info_q[1] = depth, parent\n        if info_p[0] is not None and info_q[0] is not None:\n            return\n        dfs(node.left, node, depth + 1)\n        dfs(node.right, node, depth + 1)\n    dfs(root, None, 0)\n    if info_p[0] is None or info_q[0] is None:\n        return False\n    return info_p[0] == info_q[0] and info_p[1] != info_q[1]",
    walkthrough: "Single DFS pass. When p is found, record (depth, parent). Same for q. Early exit when both found. Check: depths equal? parents different? Both must be true for cousins.",
    testCode: "t = build_tree([1,2,3,None,4,None,5])\nassert is_cousins(t, 4, 5) == True\nt2 = build_tree([1,2,3,None,4])\nassert is_cousins(t2, 2, 3) == False\nassert is_cousins(t2, 2, 4) == False\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Node Depth", pattern: "depth-first count level", skill: "pass depth down during DFS",
    statement: "Given root and a target value, return the depth (0-indexed from root) of target. Return -1 if target not found.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7], target = 15", output: "2" },
      { input: "root = [1,2,3], target = 1", output: "0" },
      { input: "root = [1,2,3], target = 9", output: "-1" },
    ],
    why: "Depth is a node attribute discovered during traversal. Pass level down; when you land on target, return the level. This reinforces the 'carry information downward' pattern.",
    starterCode: "def node_depth(root, target):\n    def dfs(node, level):\n        pass\n    return dfs(root, 0)",
    hints: [
      "Base: node is None → return -1. node.val == target → return level.",
      "Recurse left: if left returns >= 0, propagate up. Otherwise recurse right.",
      "The level increments by 1 each recursive call."
    ],
    solution: "def node_depth(root, target):\n    def dfs(node, level):\n        if node is None:\n            return -1\n        if node.val == target:\n            return level\n        left = dfs(node.left, level + 1)\n        if left != -1:\n            return left\n        return dfs(node.right, level + 1)\n    return dfs(root, 0)",
    walkthrough: "Simple DFS: carry level downward, incrementing at each step. If target found, return level. If not in left, try right. If not in either, return -1. The level parameter is passed down, not computed bottom-up.",
    testCode: "t = build_tree([3,9,20,None,None,15,7])\nassert node_depth(t, 15) == 2\nassert node_depth(t, 3) == 0\nassert node_depth(t, 9) == 1\nassert node_depth(t, 99) == -1\nprint('All tests passed!')"
  },

  {
    id: 13, stage: 1, title: "K-th Ancestor via Binary Lifting", pattern: "binary lifting precomputation", skill: "precompute up[node][j] = 2^j-th ancestor, then answer queries in O(log h)",
    statement: "Given root (tree up to 10^4 nodes), preprocess so you can answer queries of the form 'what is the k-th ancestor of node v?'. If k exceeds depth, return None. Build up[node][j] table using up[v][0]=parent and up[v][j]=up[up[v][j-1]][j-1].",
    examples: [
      { input: "tree [3,5,1,6,2,0,8], query kthAncestor(node=6, k=1)", output: "5", explain: "parent of 6 is 5" },
      { input: "query kthAncestor(node=6, k=2)", output: "3", explain: "grandparent of 6 is 3" },
    ],
    why: "Binary lifting turns ancestor queries from O(k) per query to O(log h) after O(n log n) preprocessing. This is fundamental to any tree problem requiring ancestor jumps (LCA, distance, tree paths). Memory: O(n log n).",
    starterCode: "class TreeAncestor:\n    def __init__(self, n, parent):\n        self.up = [[-1] * 15 for _ in range(n)]\n        pass\n    def get_kth_ancestor(self, node, k):\n        pass",
    hints: [
      "Preprocess: up[v][0] = parent[v]. Then for j from 1..LOG: up[v][j] = up[up[v][j-1]][j-1] if up[v][j-1] != -1.",
      "Query: iterate over bits of k. For each set bit j, node = up[node][j]. If node becomes -1, return None.",
      "The LOG value (15) covers n <= 10^4. For general n, use int(log2(n)) + 1."
    ],
    solution: "class TreeAncestor:\n    def __init__(self, n, parent):\n        LOG = 15\n        self.up = [[-1] * LOG for _ in range(n)]\n        for v in range(n):\n            self.up[v][0] = parent[v]\n        for j in range(1, LOG):\n            for v in range(n):\n                if self.up[v][j-1] != -1:\n                    self.up[v][j] = self.up[self.up[v][j-1]][j-1]\n    def get_kth_ancestor(self, node, k):\n        j = 0\n        while k > 0:\n            if k & 1:\n                node = self.up[node][j]\n                if node == -1:\n                    return None\n            k >>= 1\n            j += 1\n        return node",
    walkthrough: "Precomputation: up[v][0]=parent. Then for each power j, up[v][j] = up[ up[v][j-1] ][j-1] — the 'jump twice the half-jump' pattern. Query: decompose k into binary bits. For each set bit j (2^j), jump to up[node][j]. Building: O(n log n). Query: O(log k).",
    testCode: "parent = [-1, 0, 1, 2, 3]\nta = TreeAncestor(5, parent)\nassert ta.get_kth_ancestor(4, 1) == 3\nassert ta.get_kth_ancestor(4, 2) == 2\nassert ta.get_kth_ancestor(4, 4) == 0\nassert ta.get_kth_ancestor(4, 5) is None\nprint('All tests passed!')",
  },
  {
    id: 14, stage: 1, title: "Collect All Ancestors Per Node", pattern: "ancestor set via DFS", skill: "for each node, accumulate list of ancestors from root to parent",
    statement: "Given root, for every node in the tree, return a list of its ancestors (all nodes from root down to, but not including, the node itself). The node's own value is not in the list. Return a dict mapping node value -> ancestor list.",
    examples: [
      { input: "root = [1,2,3,4,5]", output: "{1:[], 2:[1], 3:[1], 4:[1,2], 5:[1,2]}" },
      { input: "root = [5]", output: "{5:[]}" },
    ],
    why: "Ancestors are a fundamental tree concept (Stage 1). Pass an ancestor list downward during DFS; each node inherits its parent's ancestors plus the parent. This is the precursor to LCA, distance, and path queries.",
    starterCode: "def collect_ancestors(root):\n    ancestors = {}\n    def dfs(node, parent_ancestors):\n        pass\n    dfs(root, [])\n    return ancestors",
    hints: [
      "DFS: for the current node, record parent_ancestors as its ancestor list.",
      "For each child, pass parent_ancestors + [node.val] as the child's ancestor list.",
      "The root has an empty ancestor list. Base case: None returns."
    ],
    solution: "def collect_ancestors(root):\n    ancestors = {}\n    def dfs(node, parent_ancestors):\n        if node is None:\n            return\n        ancestors[node.val] = parent_ancestors[:]\n        new_ancestors = parent_ancestors + [node.val]\n        dfs(node.left, new_ancestors)\n        dfs(node.right, new_ancestors)\n    dfs(root, [])\n    return ancestors",
    walkthrough: "Top-down DFS. Each node gets its parent's ancestor list as its own. Then it creates a new list with itself appended for its children. The root gets []. This is O(nh) if lists are copied naively but teaches the concept before binary lifting optimization (Stage 6).",
    testCode: "t = build_tree([1,2,3,4,5])\nres = collect_ancestors(t)\nassert res[1] == []\nassert res[2] == [1]\nassert res[4] == [1, 2]\nt2 = build_tree([5])\nassert collect_ancestors(t2)[5] == []\nprint('All tests passed!')",
  },
  // ── STAGE 2: Serialization ──
  {
    id: 15, stage: 2, title: "Serialize to Preorder String", pattern: "preorder encoding", skill: "encode tree as comma-separated preorder with None markers",
    statement: "Serialize a binary tree to a string using preorder traversal. Use 'N' for None nodes. Separate values with commas. E.g., [1,2,3] -> '1,2,N,N,3,N,N'.",
    examples: [
      { input: "root = [1,2,3,null,null,4,5]", output: "'1,2,N,N,3,4,N,N,5,N,N'" },
      { input: "root = None", output: "'N'" },
    ],
    why: "Serialization turns a tree into a linear structure — opening the door to storage, transmission, and debugging. Preorder with markers is lossless: you can reconstruct the exact tree.",
    starterCode: "def serialize_preorder(root):\n    result = []\n    def preorder(node):\n        pass\n    preorder(root)\n    return ','.join(result)",
    hints: [
      "Preorder: visit node, then left, then right. Append str(node.val) or 'N' for None.",
      "Use a list to accumulate values, then join with commas at the end.",
      "'N' markers are essential — without them, you can't distinguish between different tree shapes."
    ],
    solution: "def serialize_preorder(root):\n    result = []\n    def preorder(node):\n        if node is None:\n            result.append('N')\n            return\n        result.append(str(node.val))\n        preorder(node.left)\n        preorder(node.right)\n    preorder(root)\n    return ','.join(result)",
    walkthrough: "Preorder DFS: visit current node (append its value), then left subtree, then right. None nodes become 'N'. The 'N' markers preserve structure — they tell the deserializer where subtrees end.",
    testCode: "t = build_tree([1,2,3,None,None,4,5])\nassert serialize_preorder(t) == '1,2,N,N,3,4,N,N,5,N,N'\nassert serialize_preorder(None) == 'N'\nt2 = build_tree([1,2,3])\nassert serialize_preorder(t2) == '1,2,N,N,3,N,N'\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Deserialize from Preorder String", pattern: "index pointer consuming", skill: "rebuild tree by consuming tokens in preorder",
    statement: "Given a serialized preorder string (format from P11), reconstruct the binary tree. Use an index pointer to consume tokens one by one.",
    examples: [
      { input: "data = '1,2,N,N,3,4,N,N,5,N,N'", output: "tree [1,2,3,null,null,4,5]" },
      { input: "data = 'N'", output: "None" },
    ],
    why: "Deserialization is the inverse: consume tokens in preorder and rebuild. The index pointer tracks where you are. 'N' tells you 'this subtree ends here' — exactly the same signal from P11.",
    starterCode: "def deserialize_preorder(data):\n    if not data:\n        return None\n    tokens = data.split(',')\n    idx = [0]\n    def build():\n        pass\n    return build()",
    hints: [
      "tokens[idx] determines what to build. If 'N', advance idx and return None.",
      "If not 'N', create TreeNode(int(tokens[idx])), advance, then set left = build(), right = build().",
      "The index is shared via a list [0] so all recursive calls use the same pointer."
    ],
    solution: "def deserialize_preorder(data):\n    if not data:\n        return None\n    tokens = data.split(',')\n    idx = [0]\n    def build():\n        if idx[0] >= len(tokens) or tokens[idx[0]] == 'N':\n            idx[0] += 1\n            return None\n        node = TreeNode(int(tokens[idx[0]]))\n        idx[0] += 1\n        node.left = build()\n        node.right = build()\n        return node\n    return build()",
    walkthrough: "Each token is either a number (create node, consume, recurse left then right) or 'N' (return None, consume). Because the input IS in preorder, the build order naturally matches. The shared index pointer advances through tokens, ensuring each token is consumed exactly once.",
    testCode: "data = '1,2,N,N,3,4,N,N,5,N,N'\nt = deserialize_preorder(data)\nassert t.val == 1\nassert t.left.val == 2\nassert t.right.val == 3\nassert t.right.left.val == 4\nassert t.right.right.val == 5\nassert deserialize_preorder('N') is None\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Serialize BFS (Level Order)", pattern: "level-order encoding", skill: "encode tree using queue traversal with None markers",
    statement: "Serialize a binary tree to a string using BFS level-order. Use 'N' for None. Separate with commas. Trailing 'N's at the deepest level may be trimmed.",
    examples: [
      { input: "root = [1,2,3,null,null,4,5]", output: "'1,2,3,N,N,4,5'" },
      { input: "root = [1,null,2]", output: "'1,N,2'" },
    ],
    why: "BFS serialization gives the standard LeetCode array representation. Each level is encoded left to right. This is the format used by build_tree — understanding it closes the build/serialize loop.",
    starterCode: "def serialize_bfs(root):\n    if not root:\n        return ''\n    result = []\n    queue = [root]\n    pass",
    hints: [
      "Use a queue. Dequeue node, if None append 'N', else append str(node.val) and enqueue both children.",
      "Don't enqueue children of None nodes — they're already marked as 'N'.",
      "To trim trailing N's: after collection, pop from the end while result[-1] == 'N'."
    ],
    solution: "def serialize_bfs(root):\n    if not root:\n        return ''\n    result = []\n    queue = [root]\n    while queue:\n        node = queue.pop(0)\n        if node is None:\n            result.append('N')\n        else:\n            result.append(str(node.val))\n            queue.append(node.left)\n            queue.append(node.right)\n    while result and result[-1] == 'N':\n        result.pop()\n    return ','.join(result)",
    walkthrough: "BFS with a queue. Pop node: if None, append 'N'; if real, enqueue both children (even if None — they may have siblings). After the queue empties, strip trailing 'N's since they represent no real nodes at the deepest level. This matches the LeetCode array representation.",
    testCode: "t = build_tree([1,2,3,None,None,4,5])\nassert serialize_bfs(t) == '1,2,3,N,N,4,5'\nt2 = build_tree([1,None,2])\nassert serialize_bfs(t2) == '1,N,2'\nassert serialize_bfs(None) == ''\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Encode Compact (No Markers)", pattern: "preorder with size prefix", skill: "store size then preorder traversal without null markers",
    statement: "Encode a tree compactly: first store the number of nodes, then the preorder traversal (only real nodes, no 'N'). Can you reconstruct without markers?",
    examples: [
      { input: "root = [1,2,3]", output: "'3,1,2,3'" },
      { input: "root = [1,null,2]", output: "'2,1,2'" },
    ],
    why: "If every node stores its own subtree size, reconstruction is possible without explicit markers. This reveals the dual role of 'N' markers — they encode subtree boundaries. Size info encodes the same information differently.",
    starterCode: "def encode_compact(root):\n    def dfs(node):\n        pass\n    return ''",
    hints: [
      "Preorder traverse. Count total nodes first. Then: str(count) + ',' + actual preorder values.",
      "Deserialize: read count N, then take the next N values as preorder. But this only works for COMPLETE trees — think about why.",
      "For arbitrary trees: need subtree sizes per node, not just total count."
    ],
    solution: "def encode_compact(root):\n    def count(node):\n        if node is None:\n            return 0\n        return 1 + count(node.left) + count(node.right)\n    def preorder(node):\n        result = []\n        def dfs(n):\n            if n is None:\n                return\n            result.append(str(n.val))\n            dfs(n.left)\n            dfs(n.right)\n        dfs(node)\n        return ','.join(result)\n    total = count(root)\n    vals = preorder(root)\n    return str(total) + ',' + vals",
    walkthrough: "Store total node count as the first element, then preorder values (no markers). Reconstructing: read count N, take next N values. For complete preorder: first N values = preorder of the tree. But for arbitrary trees, you need per-subtree sizes — this problem reveals why 'N' markers are more general.",
    testCode: "t = build_tree([1,2,3])\nassert encode_compact(t) == '3,1,2,3'\nt2 = build_tree([1,None,2])\nassert encode_compact(t2) == '2,1,2'\nassert encode_compact(None) == '0,'\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Verify Serialize-Deserialize Roundtrip", pattern: "roundtrip check", skill: "serialize then deserialize, verify trees identical",
    statement: "Write a function that takes a tree, serializes it to preorder, deserializes back, and verifies the two trees are identical. Return True if roundtrip preserves the tree.",
    examples: [
      { input: "root = [1,2,3,null,null,4,5]", output: "True" },
      { input: "root = None", output: "True" },
    ],
    why: "A tree is identical if its preorder AND inorder sequences match. This problem composes P11+P12 and adds a tree equality check. Roundtrip verification is the proof that serialization is lossless.",
    starterCode: "def verify_roundtrip(root):\n    def serialize(node):\n        pass\n    def deserialize(data):\n        pass\n    def trees_equal(a, b):\n        pass\n    return False",
    hints: [
      "Reuse P11 (serialize_preorder) and P12 (deserialize_preorder).",
      "Two trees are equal if: both None, OR both non-None with same val AND left subtrees equal AND right subtrees equal.",
      "Serialize root, deserialize to get new_root, then compare root and new_root recursively."
    ],
    solution: "def verify_roundtrip(root):\n    def serialize(node):\n        result = []\n        def dfs(n):\n            if n is None:\n                result.append('N')\n                return\n            result.append(str(n.val))\n            dfs(n.left)\n            dfs(n.right)\n        dfs(node)\n        return ','.join(result)\n    def deserialize(data):\n        tokens = data.split(',')\n        idx = [0]\n        def build():\n            if tokens[idx[0]] == 'N':\n                idx[0] += 1\n                return None\n            node = TreeNode(int(tokens[idx[0]]))\n            idx[0] += 1\n            node.left = build()\n            node.right = build()\n            return node\n        return build()\n    def trees_equal(a, b):\n        if a is None and b is None:\n            return True\n        if a is None or b is None:\n            return False\n        return a.val == b.val and trees_equal(a.left, b.left) and trees_equal(a.right, b.right)\n    return trees_equal(root, deserialize(serialize(root)))",
    walkthrough: "Serialize the tree to a string. Deserialize back to a new tree. Recursively compare root with new_root: both None? equal. One None? not equal. Values match AND both subtrees match? equal. If roundtrip succeeds, the tree is faithfully encoded.",
    testCode: "t = build_tree([1,2,3,None,None,4,5])\nassert verify_roundtrip(t) == True\nassert verify_roundtrip(None) == True\nt2 = build_tree([5,3,8,1,4,None,9])\nassert verify_roundtrip(t2) == True\nprint('All tests passed!')"
  },

  {
    id: 20, stage: 2, title: "Serialize to Postorder String", pattern: "postorder encoding with markers", skill: "encode tree as comma-separated postorder with 'N' for None",
    statement: "Serialize a binary tree using POSTORDER traversal (left, right, node). Use 'N' for None nodes. Separate values with commas. E.g., [1,2,3] -> 'N,N,2,N,N,3,1'.",
    examples: [
      { input: "root = [1,2,3]", output: "'N,N,2,N,N,3,1'" },
      { input: "root = [1,null,2]", output: "'N,N,N,2,1'" },
    ],
    why: "Postorder serialization is the dual of preorder (P11). The marker 'N' still preserves structure. Postorder is useful for expression trees (evaluate operands before operator) and for certain recursive structures. Same token-consumption pattern as P12.",
    starterCode: "def serialize_postorder(root):\n    result = []\n    def postorder(node):\n        pass\n    postorder(root)\n    return ','.join(result)",
    hints: [
      "Postorder: first recurse left, then right, then process current node. Append 'N' for None.",
      "Use a result list, join with commas at the end.",
      "The structure: left subtree, right subtree, then root — the reverse of preorder's root-first."
    ],
    solution: "def serialize_postorder(root):\n    result = []\n    def postorder(node):\n        if node is None:\n            result.append('N')\n            return\n        postorder(node.left)\n        postorder(node.right)\n        result.append(str(node.val))\n    postorder(root)\n    return ','.join(result)",
    walkthrough: "Postorder DFS: left, right, root. None nodes become 'N'. The root is the LAST token (unlike preorder where root is first). Reconstruction works identically to P12 but consuming tokens from the right end — or by reversing the traversal order.",
    testCode: "t = build_tree([1,2,3])\nassert serialize_postorder(t) == 'N,N,2,N,N,3,1'\nt2 = build_tree([1,None,2])\nassert serialize_postorder(t2) == 'N,N,N,2,1'\nassert serialize_postorder(None) == 'N'\nprint('All tests passed!')",
  },
  {
    id: 21, stage: 2, title: "Tree Merkle Hash", pattern: "bottom-up hash aggregation", skill: "compute a deterministic hash for each subtree; detect identical subtrees",
    statement: "Given root, compute a string hash for each subtree. Hash = '(' + left_hash + str(node.val) + right_hash + ')'. Two subtrees are identical iff their hashes are equal. Return a dict of hash -> first node value.",
    examples: [
      { input: "root = [1,2,2,3,null,3]", output: "identical subtrees: nodes 2 and 2" },
      { input: "root = [1,2,3]", output: "no identical subtrees" },
    ],
    why: "Merkle hashing — a compact fingerprint for each subtree. Serialization (Stage 2) builds hashes bottom-up. If two hashes match, the subtrees are structurally identical. Used in Git, blockchain, and tree differencing.",
    starterCode: "def merkle_hash(root):\n    hash_map = {}\n    def dfs(node):\n        pass\n    dfs(root)\n    return hash_map",
    hints: [
      "dfs returns a hash string for the subtree. Base: None returns 'N'.",
      "Hash = '(' + left_hash + str(node.val) + right_hash + ')'. Record in hash_map.",
      "Tuples work too: (left_hash, node.val, right_hash) — more Pythonic and hashable."
    ],
    solution: "def merkle_hash(root):\n    hash_map = {}\n    def dfs(node):\n        if node is None:\n            return 'N'\n        left = dfs(node.left)\n        right = dfs(node.right)\n        h = '(' + left + str(node.val) + right + ')'\n        if h not in hash_map:\n            hash_map[h] = node.val\n        return h\n    dfs(root)\n    return hash_map",
    walkthrough: "Bottom-up hash: each subtree's identity is serialized as (left_hash, value, right_hash). Same structure + same values = same hash. Store the first node value for each unique hash. O(n) time. This is the tree equivalent of string hashing (Rabin-Karp).",
    testCode: "t = build_tree([1,2,2,3,None,3])\n# Tree has identical subtrees rooted at nodes 2\nres = merkle_hash(t)\nassert len(res) >= 1\nt2 = build_tree([1])\nassert merkle_hash(t2) is not None\nprint('All tests passed!')",
  },
  // ── STAGE 3: Views & Boundaries ──
  {
    id: 22, stage: 3, title: "Right Side View", pattern: "BFS last node per level", skill: "level-order, keep last node per level",
    statement: "Given root, return the values visible from the right side (the rightmost node at each depth). Return list from top to bottom.",
    examples: [
      { input: "root = [1,2,3,null,5,null,4]", output: "[1,3,4]" },
      { input: "root = [1,null,3]", output: "[1,3]" },
    ],
    why: "The right side view is the rightmost node at each level. BFS naturally visits level by level — the last node dequeued at each level is the rightmost.",
    starterCode: "def right_side_view(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    pass",
    hints: [
      "BFS: process level by level. Track the last node in each level before moving to the next.",
      "Use nested loop: for _ in range(len(queue)): process all nodes at current level.",
      "After processing a level, the last node seen is the rightmost — append its value to result."
    ],
    solution: "def right_side_view(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    while queue:\n        level_size = len(queue)\n        for i in range(level_size):\n            node = queue.pop(0)\n            if i == level_size - 1:\n                result.append(node.val)\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n    return result",
    walkthrough: "BFS: each iteration of the outer loop processes one level. Inner loop: for each node in current level, enqueue children. When i == level_size - 1, we're at the last node of this level — the rightmost visible node — append to result.",
    testCode: "t = build_tree([1,2,3,None,5,None,4])\nassert right_side_view(t) == [1,3,4]\nt2 = build_tree([1,None,3])\nassert right_side_view(t2) == [1,3]\nassert right_side_view(None) == []\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Left Side View", pattern: "BFS first node per level", skill: "keep first node of each level",
    statement: "Given root, return values visible from the left side (first node at each depth). Return list from top to bottom.",
    examples: [
      { input: "root = [1,2,3,null,5,null,4]", output: "[1,2,5]" },
      { input: "root = [1,null,3]", output: "[1,3]" },
    ],
    why: "Mirror of P16. Same skeleton: the only difference is you capture the FIRST node of each level instead of the LAST. Reinforcement of the level-processing pattern.",
    starterCode: "def left_side_view(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    pass",
    hints: [
      "Same BFS level-processing as right side view. Only difference: capture the FIRST node instead of last.",
      "At the start of each level: the node at queue[0] (before dequeuing) is the leftmost.",
      "Or: capture when i == 0 inside the level loop."
    ],
    solution: "def left_side_view(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    while queue:\n        level_size = len(queue)\n        for i in range(level_size):\n            node = queue.pop(0)\n            if i == 0:\n                result.append(node.val)\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n    return result",
    walkthrough: "Same BFS as P16. The only change: append when i==0 (first node of the level) instead of i == level_size - 1 (last node). Same skeleton, opposite edge of the level. Automaticity on level-processing frees attention for the one-line difference.",
    testCode: "t = build_tree([1,2,3,None,5,None,4])\nassert left_side_view(t) == [1,2,5]\nt2 = build_tree([1,None,3])\nassert left_side_view(t2) == [1,3]\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Top View", pattern: "column-first DFS", skill: "record first node at each horizontal distance (column)",
    statement: "Given root, return the top view — the first node visible from above at each horizontal position. Horizontal distance: root=0, left child=-1, right child=+1.",
    examples: [
      { input: "root = [1,2,3,4,5,6,7]", output: "[4,2,1,3,7]", explain: "columns -2,-1,0,1,2" },
      { input: "root = [1,2,3,null,4,null,5]", output: "[2,1,3,5]" },
    ],
    why: "Top view requires a column coordinate system (horizontal distance). The first node encountered at each column is the top view. Uses BFS with column tracking — the horizontal analog of level processing.",
    starterCode: "def top_view(root):\n    if not root:\n        return []\n    col_map = {}\n    queue = [(root, 0)]\n    pass",
    hints: [
      "BFS: each queue element is (node, column). Root at column 0, left child at col-1, right at col+1.",
      "For each (node, col): if col not in col_map, record it. This is the first node at that column (and since BFS goes top-to-bottom, it's the topmost).",
      "Sort columns ascending and return values in column order."
    ],
    solution: "def top_view(root):\n    if not root:\n        return []\n    col_map = {}\n    queue = [(root, 0)]\n    while queue:\n        node, col = queue.pop(0)\n        if col not in col_map:\n            col_map[col] = node.val\n        if node.left:\n            queue.append((node.left, col - 1))\n        if node.right:\n            queue.append((node.right, col + 1))\n    return [col_map[c] for c in sorted(col_map.keys())]",
    walkthrough: "Assign each node a column index: root=0, left=-1 per level, right=+1 per level. BFS ensures top-to-bottom order. For each column, the first node visited is the topmost. Record only on first visit. Sort columns for left-to-right output.",
    testCode: "t = build_tree([1,2,3,4,5,6,7])\nassert top_view(t) == [4,2,1,3,7]\nt2 = build_tree([1,2,3,None,4,None,5])\nassert top_view(t2) == [2,1,3,5]\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Bottom View", pattern: "column-last BFS", skill: "keep last node at each column (BFS last overwrite)",
    statement: "Given root, return the bottom view — the last node visible from below at each horizontal position. Overwrite column map in BFS: the last node at each column is the bottommost.",
    examples: [
      { input: "root = [20,8,22,5,3,null,25,null,null,10,14]", output: "[5,10,3,14,25]" },
      { input: "root = [1,2,3]", output: "[2,1,3]" },
    ],
    why: "Mirror of P18. Same BFS + column tracking. The one difference: always OVERWRITE the column map (don't check if col not in map). The LAST node at each column wins — which is the bottommost due to BFS order.",
    starterCode: "def bottom_view(root):\n    if not root:\n        return []\n    col_map = {}\n    queue = [(root, 0)]\n    pass",
    hints: [
      "Same as top view but always overwrite col_map[col] = node.val regardless of whether col was already seen.",
      "BFS guarantees that later nodes at same column are deeper — the last write is the bottommost.",
      "After BFS, sort by column and return values."
    ],
    solution: "def bottom_view(root):\n    if not root:\n        return []\n    col_map = {}\n    queue = [(root, 0)]\n    while queue:\n        node, col = queue.pop(0)\n        col_map[col] = node.val\n        if node.left:\n            queue.append((node.left, col - 1))\n        if node.right:\n            queue.append((node.right, col + 1))\n    return [col_map[c] for c in sorted(col_map.keys())]",
    walkthrough: "BFS + columns. The only change from top view: always overwrite col_map[col] instead of checking 'if col not in col_map'. Since BFS processes top-to-bottom, later writes at the same column are deeper nodes — so the final value at each column is the bottommost.",
    testCode: "t = build_tree([20,8,22,5,3,None,25,None,None,10,14])\nassert bottom_view(t) == [5,10,3,14,25]\nt2 = build_tree([1,2,3])\nassert bottom_view(t2) == [2,1,3]\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Boundary Traversal", pattern: "counterclockwise perimeter", skill: "left boundary + leaves + right boundary (reversed)",
    statement: "Given root, return its boundary (counterclockwise): left boundary (excluding leaves), leaves left-to-right, right boundary (excluding leaves) reversed bottom-up.",
    examples: [
      { input: "root = [1,2,3,4,5,6,null,null,null,7,8,9,10]", output: "[1,2,4,7,8,9,10,6,3]" },
      { input: "root = [1,null,2,3,4]", output: "[1,3,4,2]" },
    ],
    why: "Boundary traversal combines three patterns: left boundary (go left, else go right), bottom leaves (DFS collect leaves), right boundary (go right, else go left). The composition requires careful ordering.",
    starterCode: "def boundary_traversal(root):\n    if not root:\n        return []\n    result = [root.val]\n    def left_boundary(node):\n        pass\n    def leaves(node):\n        pass\n    def right_boundary(node):\n        pass\n    return result",
    hints: [
      "Left boundary: start from root.left. Go left if exists, else go right. Add node.val EXCEPT at leaves.",
      "Leaves: DFS, collect any node with no children (left-to-right).",
      "Right boundary: start from root.right. Go right if exists, else go left. Collect into a list, reverse at end. Skip leaves."
    ],
    solution: "def boundary_traversal(root):\n    if not root:\n        return []\n    result = [root.val]\n    def left_boundary(node):\n        if node is None or (node.left is None and node.right is None):\n            return\n        result.append(node.val)\n        if node.left:\n            left_boundary(node.left)\n        else:\n            left_boundary(node.right)\n    def leaves(node):\n        if node is None:\n            return\n        if node.left is None and node.right is None:\n            result.append(node.val)\n        else:\n            leaves(node.left)\n            leaves(node.right)\n    def right_boundary(node):\n        if node is None or (node.left is None and node.right is None):\n            return\n        if node.right:\n            right_boundary(node.right)\n        else:\n            right_boundary(node.left)\n        result.append(node.val)\n    left_boundary(root.left)\n    leaves(root.left)\n    leaves(root.right)\n    right_boundary(root.right)\n    return result",
    walkthrough: "Three phases: (1) Left boundary from root.left, going left (or right if no left), excluding leaves. (2) All leaves left-to-right via DFS on both children. (3) Right boundary from root.right, going right (or left), collecting in reverse — append AFTER the recursive call so values come out bottom-up. Exclude root from sub-boundaries to avoid duplicates.",
     testCode: "t = build_tree([1,2,3,4,5,6,None,None,None,7,8,9,10])\nassert boundary_traversal(t) == [1,2,4,7,8,9,10,6,3]\nt2 = build_tree([1,None,2,None,None,3,4])\nassert boundary_traversal(t2) == [1,3,4,2]\nprint('All tests passed!')"
  },

  {
    id: 27, stage: 3, title: "Vertical Order Traversal", pattern: "column-major BFS with row tiebreaker", skill: "group nodes by (column, row); sort by column then row; for same position, sort by value",
    statement: "Given root, return the vertical order traversal. Nodes are positioned by (row, column): root=(0,0), left=(r+1,c-1), right=(r+1,c+1). Group by column. Within each column group, sort by row (ascending) then value (ascending).",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "[[9],[3,15],[20],[7]]", explain: "col -1: [9]; col 0: [3,15]; col 1: [20]; col 2: [7]" },
      { input: "root = [1,2,3,4,5,6,7]", output: "[[4],[2],[1,5,6],[3],[7]]", explain: "same col/row pairs sorted by value" },
    ],
    why: "Extends top/bottom view (P18/P19) by keeping ALL nodes per column, not just first/last. Introduces multi-key sorting: column, then row, then value. This level of detail is necessary for problems where you need full column content.",
    starterCode: "def vertical_order(root):\n    if not root:\n        return []\n    col_map = {}\n    queue = [(root, 0, 0)]\n    pass",
    hints: [
      "BFS: each queue element is (node, row, col). For each node, record (row, col, val) in a list.",
      "Sort the list by (col, row, val). Group by column.",
      "Return list of lists — one sublist per column, in left-to-right column order."
    ],
    solution: "def vertical_order(root):\n    if not root:\n        return []\n    nodes = []\n    queue = [(root, 0, 0)]\n    while queue:\n        node, row, col = queue.pop(0)\n        nodes.append((col, row, node.val))\n        if node.left:\n            queue.append((node.left, row+1, col-1))\n        if node.right:\n            queue.append((node.right, row+1, col+1))\n    nodes.sort()\n    result = []\n    cur_col = nodes[0][0]\n    cur_group = []\n    for col, row, val in nodes:\n        if col != cur_col:\n            result.append(cur_group)\n            cur_group = []\n            cur_col = col\n        cur_group.append(val)\n    result.append(cur_group)\n    return result",
    walkthrough: "BFS assigns (row, col) to each node. Collect all triplets, sort by (col, row, val). Group consecutive entries with the same column. BFS ensures correct row ordering for nodes at the same depth. O(n log n) due to sort. For strict O(n), use a dict mapping col -> list and sort each column individually.",
    testCode: "t = build_tree([3,9,20,None,None,15,7])\nassert vertical_order(t) == [[9],[3,15],[20],[7]]\nt2 = build_tree([1,2,3,4,5,6,7])\nassert vertical_order(t2) == [[4],[2],[1,5,6],[3],[7]]\nprint('All tests passed!')",
  },
  {
    id: 28, stage: 3, title: "Outer Boundary Nodes", pattern: "leftmost + rightmost per level", skill: "collect first and last non-null node at each BFS level",
    statement: "Given root, return the 'outer boundary': for each level, collect the leftmost AND rightmost non-null node. If a level has only one node, it appears once. Return a flat list from top to bottom.",
    examples: [
      { input: "root = [1,2,3,null,5,null,4]", output: "[1,2,3,5,4]", explain: "level 0: [1]; level 1: [2,3]; level 2: [5,4]" },
      { input: "root = [1,null,2,null,3]", output: "[1,2,3]" },
    ],
    why: "Combines left view (P17, first per level) and right view (P16, last per level). The outer boundary = first and last per level. If level has 1 node, it's both first and last — but you only capture it once. BFS level processing unifies both views.",
    starterCode: "def outer_boundary(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    pass",
    hints: [
      "BFS level by level. At each level, record the first and last node. If level size == 1, record only once.",
      "Use nested loop: for i in range(len(queue)). i == 0: leftmost; i == level_size-1: rightmost.",
      "If level_size == 1, only append once (avoid duplicate)."
    ],
    solution: "def outer_boundary(root):\n    if not root:\n        return []\n    result = []\n    queue = [root]\n    while queue:\n        level_size = len(queue)\n        for i in range(level_size):\n            node = queue.pop(0)\n            if i == 0:\n                result.append(node.val)\n            elif i == level_size - 1 and level_size > 1:\n                result.append(node.val)\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n    return result",
    walkthrough: "BFS level processing. At each level: first node (i==0) is always added. Last node (i==level_size-1) is added only if level_size > 1 (to avoid duplicating when there's 1 node). Enqueue children normally. O(n).",
     testCode: "t = build_tree([1,2,3,None,5,None,4])\nassert outer_boundary(t) == [1,2,3,5,4]\nt2 = build_tree([1,None,2,None,None,None,3])\nassert outer_boundary(t2) == [1,2,3]\nprint('All tests passed!')",
  },
  // ── STAGE 4: Naive ──
  {
    id: 29, stage: 4, title: "Path Sum III — Naive (All Paths)", pattern: "enumerate all downward paths", skill: "from every node, DFS all downward paths",
    statement: "Given root and targetSum, count all downward paths (not necessarily root-to-leaf) where sum of node values equals targetSum. Naive: from EACH node, DFS all paths and check sums. O(n²).",
    examples: [
      { input: "root = [10,5,-3,3,2,null,11,3,-2,null,1], target = 8", output: "3", explain: "paths: 5->3, 5->2->1, -3->11" },
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,5,1], target = 22", output: "3" },
    ],
    why: "The naive approach enumerates all n² paths: from each node, DFS all downward subpaths. This makes the O(n²) work visible — vital to feel before the prefix-sum optimization in Stage 5.",
    starterCode: "def path_sum_naive(root, target_sum):\n    def dfs_from(node, current_sum):\n        pass\n    def traverse(node):\n        pass\n    pass",
    hints: [
      "Outer traverse: visit every node as a starting point. Inner dfs_from: enumerate all paths downward from that starting node.",
      "dfs_from(node, current_sum): if current_sum + node.val == target, count++. Then recurse left and right with updated sum.",
      "traverse(node): run dfs_from on node, then traverse left, traverse right. Track a global count."
    ],
    solution: "def path_sum_naive(root, target_sum):\n    count = [0]\n    def dfs_from(node, current_sum):\n        if node is None:\n            return\n        current_sum += node.val\n        if current_sum == target_sum:\n            count[0] += 1\n        dfs_from(node.left, current_sum)\n        dfs_from(node.right, current_sum)\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, 0)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return count[0]",
    walkthrough: "Two nested traversals. Outer traverse visits every node as a potential path-start. For each start node, dfs_from enumerates ALL downward subpaths by accumulating sum. This touches O(n²) paths — heavy but exhaustive. The waste: most paths are redundant subpaths of longer paths.",
    testCode: "t = build_tree([10,5,-3,3,2,None,11,3,-2,None,1])\nassert path_sum_naive(t, 8) == 3\nt2 = build_tree([5,4,8,11,None,13,4,7,2,None,None,5,1])\nassert path_sum_naive(t2, 22) == 3\nassert path_sum_naive(None, 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Count Paths with Sum (All Start Points)", pattern: "counting with early-exit", skill: "count all downward paths that match target, O(n²) naive",
    statement: "Given root and targetSum, count paths that START at a given node and go downward summing to target. Use the DFS-from-each-node pattern. Return total count.",
    examples: [
      { input: "root = [1,2,3], target = 2", output: "1", explain: "path [2]" },
      { input: "root = [1,2,3], target = 3", output: "2", explain: "[3] and [1,2] = 3" },
    ],
    why: "Variation of P21. Counting the number of paths (not printing them) sharpens the 'accumulate sum in DFS' pattern. Same O(n²) — reinforces the felt waste before optimization.",
    starterCode: "def count_paths_with_sum(root, target_sum):\n    count = [0]\n    def dfs_from(node, current):\n        pass\n    def traverse(node):\n        pass\n    return count[0]",
    hints: [
      "Same structure as P21: outer traverse picks start node, inner dfs_from accumulates.",
      "Increments count every time current sum hits target — even if there's more path below.",
      "Paths continue even past a match — e.g., target=3 in [1,2,3]: node 2 gives sum 3 (count++), continue to sum 6."
    ],
    solution: "def count_paths_with_sum(root, target_sum):\n    count = [0]\n    def dfs_from(node, current):\n        if node is None:\n            return\n        current += node.val\n        if current == target_sum:\n            count[0] += 1\n        dfs_from(node.left, current)\n        dfs_from(node.right, current)\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, 0)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return count[0]",
    walkthrough: "Same skeleton as P21. From each start node, DFS sums along all downward paths. Count increments each time accumulated sum equals target — not just at leaf. Paths extend past matches, so a single start node can yield multiple matches (e.g., target=0 with alternating +1/-1).",
    testCode: "t = build_tree([1,2,3])\nassert count_paths_with_sum(t, 2) == 1\nassert count_paths_with_sum(t, 3) == 2\nt2 = build_tree([1,-2,-3,1,3,-2,None,-1])\nassert count_paths_with_sum(t2, -1) == 4\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Max Path Product", pattern: "product along path", skill: "max product on downward paths, O(n²)",
    statement: "Given root with positive integer values, find the maximum product on any downward path (not just root-to-leaf). Naive: enumerate all O(n²) paths.",
    examples: [
      { input: "root = [1,2,3], target = None", output: "3", explain: "path [3] yields product 3" },
      { input: "root = [2,3,4]", output: "12", explain: "path [3,4] -> 3*4=12" },
      { input: "root = [0,1,2]", output: "2", explain: "0*anything=0, best non-zero is 2" },
    ],
    why: "Switch from sum to product. The pattern is identical — enumerate from each node, accumulate product downward. This teaches that the DFS-from-each-node pattern works for any associative accumulation.",
    starterCode: "def max_path_product(root):\n    max_prod = [float('-inf')]\n    def dfs_from(node, current):\n        pass\n    def traverse(node):\n        pass\n    return max_prod[0]",
    hints: [
      "Same as P21 but use multiplication instead of addition. Track max_product globally.",
      "dfs_from: current *= node.val. Update max if current > max_product.",
      "What's the product of an empty path? Use 1 as starting product so first node's value is the product of a one-node path."
    ],
    solution: "def max_path_product(root):\n    max_prod = [float('-inf')]\n    def dfs_from(node, current):\n        if node is None:\n            return\n        current *= node.val\n        if current > max_prod[0]:\n            max_prod[0] = current\n        dfs_from(node.left, current)\n        dfs_from(node.right, current)\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, 1)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return max_prod[0]",
    walkthrough: "Identical to P21 with * replacing +. Start product = 1 (identity for multiplication). Each node multiplies its value into the running product. Track maximum globally. The pattern works for ANY associative accumulation — sum, product, min, max. Reuse is the point.",
     testCode: "t = build_tree([2,3,4])\nassert max_path_product(t) == 8\nt2 = build_tree([0,1,2])\nassert max_path_product(t2) == 2\nt3 = build_tree([1])\nassert max_path_product(t3) == 1\nassert max_path_product(None) == float('-inf')\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Print All Paths with Sum K", pattern: "print all matching paths", skill: "collect paths (not just count) with sum k, O(n²)",
    statement: "Given root and k, print all downward paths (root-to-any-descendant) whose sum equals k. Each path as a list of values. Naive: enumerate all paths.",
    examples: [
      { input: "root = [1,2,3], k = 3", output: "[[1,2],[3]]" },
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,5,1], k = 22", output: "[[5,4,11,2],[5,8,4,5]]" },
    ],
    why: "Extends P21 from counting to collecting. The append/pop pattern from Stage 0 returns: accumulate path list alongside sum. When sum == k, snapshot the path.",
    starterCode: "def print_paths_with_sum(root, k):\n    result = []\n    def dfs_from(node, path, current_sum):\n        pass\n    def traverse(node):\n        pass\n    traverse(root)\n    return result",
    hints: [
      "dfs_from: append node.val to path, add to current_sum. If sum == k, append path[:] to result.",
      "After visiting children, pop the last element from path (undo for backtracking).",
      "Outer traverse visits every starting node. For each, call dfs_from with fresh path=[] and sum=0."
    ],
    solution: "def print_paths_with_sum(root, k):\n    result = []\n    def dfs_from(node, path, current_sum):\n        if node is None:\n            return\n        path.append(node.val)\n        current_sum += node.val\n        if current_sum == k:\n            result.append(path[:])\n        dfs_from(node.left, path, current_sum)\n        dfs_from(node.right, path, current_sum)\n        path.pop()\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, [], 0)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return result",
    walkthrough: "Combine P21 (enumerate from each node) with P2 (path accumulation via append/pop). Outer traverse picks start node. Inner dfs_from accumulates path values and sum. When sum == k, snapshot path. Pop on backtrack is essential since path is mutable.",
     testCode: "t = build_tree([5,4,8,11,None,13,4,7,2,None,None,None,None,5,1])\nres = print_paths_with_sum(t, 22)\nassert len(res) == 2\nassert [5,4,11,2] in res\nassert [5,8,4,5] in res\nt2 = build_tree([1,2,3])\nres2 = print_paths_with_sum(t2, 3)\nassert [1,2] in res2\nassert [3] in res2\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Longest Path with Sum K", pattern: "max-length path with target sum", skill: "track max length alongside sum, O(n²)",
    statement: "Given root and k, return the length (number of nodes) of the longest downward path whose sum equals k. Return 0 if none. Naive: enumerate all paths.",
    examples: [
      { input: "root = [1,2,3], k = 3", output: "2", explain: "path [1,2] length 2" },
      { input: "root = [5,5,5], k = 10", output: "2" },
      { input: "root = [1], k = 2", output: "0" },
    ],
    why: "Variation on P21: track max path length instead of count. The DFS-from-each-node pattern again. Length = number of nodes on the path.",
    starterCode: "def longest_path_sum_k(root, k):\n    max_len = [0]\n    def dfs_from(node, current_sum, length):\n        pass\n    def traverse(node):\n        pass\n    return max_len[0]",
    hints: [
      "dfs_from: add node.val to current_sum, increment length. If current_sum == k, update max_len.",
      "Recurse left and right with same updated sum and length.",
      "Outer traverse picks start nodes. Call dfs_from with sum=0, length=0 from each."
    ],
    solution: "def longest_path_sum_k(root, k):\n    max_len = [0]\n    def dfs_from(node, current_sum, length):\n        if node is None:\n            return\n        current_sum += node.val\n        length += 1\n        if current_sum == k and length > max_len[0]:\n            max_len[0] = length\n        dfs_from(node.left, current_sum, length)\n        dfs_from(node.right, current_sum, length)\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, 0, 0)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return max_len[0]",
    walkthrough: "Same O(n²) skeleton. Accumulate sum AND path length simultaneously in dfs_from. When sum == k, update global max length. This is the last of the 'enumerate all downward paths' series — each problem varies what you track (count, product, paths, max length) while keeping the same DFS skeleton.",
    testCode: "t = build_tree([1,2,3])\nassert longest_path_sum_k(t, 3) == 2\nt2 = build_tree([5,5,5])\nassert longest_path_sum_k(t2, 10) == 2\nt3 = build_tree([1])\nassert longest_path_sum_k(t3, 2) == 0\nprint('All tests passed!')"
  },

  {
    id: 34, stage: 4, title: "Count Subtrees with Sum K (Naive)", pattern: "check every subtree individually", skill: "for each node, compute subtree sum; count if equals k. O(n²) naive — recompute each subtree.",
    statement: "Given root and k, count subtrees whose sum of all nodes equals k. Naive: for each node, compute its subtree sum from scratch, O(n²). The tree may have up to 100 nodes.",
    examples: [
      { input: "root = [5,2,-3], k = 4", output: "1", explain: "subtree [5,2,-3] sum = 4" },
      { input: "root = [5,2,3], k = 5", output: "2", explain: "node 5 alone (sum 5), subtree [2,None,None] = 2? No — nodes 2 (sum 2) and 5 (sum 5). Wait: subtree [5,2,3] = 10, [5]=5, [2]=2, [3]=3. Count=1?" },
    ],
    why: "Naive subtree counting reveals the inefficiency: you recompute sums for overlapping subtrees. Each node's subtree sum is repeatedly calculated. The O(n) optimization (P30) computes each subtree sum once bottom-up. Feeling the waste is the point.",
    starterCode: "def count_subtrees_naive(root, k):\n    count = [0]\n    def subtree_sum(node):\n        pass\n    def traverse(node):\n        pass\n    traverse(root)\n    return count[0]",
    hints: [
      "subtree_sum(node): if None return 0. Return node.val + subtree_sum(left) + subtree_sum(right).",
      "traverse visits every node, calls subtree_sum on it. If sum == k, count++.",
      "This is O(n²) because subtree_sum at a node re-sums its entire subtree, and traverse calls it on every node."
    ],
    solution: "def count_subtrees_naive(root, k):\n    count = [0]\n    def subtree_sum(node):\n        if node is None:\n            return 0\n        return node.val + subtree_sum(node.left) + subtree_sum(node.right)\n    def traverse(node):\n        if node is None:\n            return\n        if subtree_sum(node) == k:\n            count[0] += 1\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return count[0]",
    walkthrough: "Outer traverse visits each node, inner subtree_sum recomputes the entire subtree sum. For a node at depth d, its subtree is summed (h-d) separate times — once for each ancestor that calls traverse. Total work: O(n²). The optimization (Stage 5/6) computes all subtree sums in one bottom-up pass.",
     testCode: "t = build_tree([5,2,-3])\nassert count_subtrees_naive(t, 4) == 1\nt2 = build_tree([5,2,3])\nassert count_subtrees_naive(t2, 5) == 0\nprint('All tests passed!')",
  },
  {
    id: 35, stage: 4, title: "Max XOR Path Value (Naive)", pattern: "enumerate all paths, compute XOR", skill: "enumerate all downward paths, track max XOR. O(n²) naive.",
    statement: "Given root with positive integer values, find the maximum XOR value of any downward path (not necessarily root-to-leaf). XOR of a path = node1 ^ node2 ^ ... ^ nodek. Naive: enumerate all paths.",
    examples: [
      { input: "root = [2,3,4]", output: "7", explain: "path [3,4]: 3^4=7" },
      { input: "root = [1,2,3]", output: "3", explain: "paths: [1]=1, [2]=2, [3]=3, [1,2]=3, [1,3]=2. Max=3" },
    ],
    why: "Switch accumulation from sum to XOR. The same O(n²) pattern works because XOR is associative (like sum and product). The prefix-XOR optimization (analogous to P26) uses a Trie for O(n log U). This problem sets up that contrast.",
    starterCode: "def max_xor_path_naive(root):\n    max_xor = [0]\n    def dfs_from(node, current_xor):\n        pass\n    def traverse(node):\n        pass\n    return max_xor[0]",
    hints: [
      "dfs_from(node, cur): cur ^= node.val. Update max_xor if cur > it. Recurse left and right.",
      "Outer traverse visits every starting node. Call dfs_from with cur=0 from each.",
      "XOR is its own inverse: a ^ a = 0. This property enables the O(n) Trie optimization."
    ],
    solution: "def max_xor_path_naive(root):\n    max_xor = [0]\n    def dfs_from(node, current_xor):\n        if node is None:\n            return\n        current_xor ^= node.val\n        if current_xor > max_xor[0]:\n            max_xor[0] = current_xor\n        dfs_from(node.left, current_xor)\n        dfs_from(node.right, current_xor)\n    def traverse(node):\n        if node is None:\n            return\n        dfs_from(node, 0)\n        traverse(node.left)\n        traverse(node.right)\n    traverse(root)\n    return max_xor[0]",
    walkthrough: "Same O(n²) skeleton as P21/P23. Enumerate all downward paths, compute XOR. Update global max. XOR's properties (associative, self-inverse) make it a natural candidate for prefix optimization (like P26's prefix sum). O(n²) time, O(1) extra space (ignoring recursion stack).",
     testCode: "t = build_tree([2,3,4])\nassert max_xor_path_naive(t) == 6\nt2 = build_tree([1,2,3])\nassert max_xor_path_naive(t2) == 3\nt3 = build_tree([8])\nassert max_xor_path_naive(t3) == 8\nprint('All tests passed!')",
  },
  // ── STAGE 5: Optimization ──
  {
    id: 36, stage: 5, title: "Path Sum III — Prefix Sum on Path (O(n))", pattern: "prefix sum hashmap on DFS path", skill: "maintain prefix sum counts during DFS, O(n)",
    statement: "Given root and targetSum, count downward paths summing to target in O(n). During single DFS, maintain a hashmap: prefix_sum -> count. At node, check if (current_sum - targetSum) exists in map.",
    examples: [
      { input: "root = [10,5,-3,3,2,null,11,3,-2,null,1], target = 8", output: "3" },
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,5,1], target = 22", output: "3" },
    ],
    why: "The inefficiency of P21 is redundant path enumeration. One DFS with a prefix-sum hashmap replaces O(n²) with O(n). The key insight: path(i..j) = prefix[j] - prefix[i-1] — the exact same prefix-sum trick from arrays, now on a DFS path.",
    starterCode: "def path_sum_optimized(root, target_sum):\n    count = [0]\n    prefix_map = {0: 1}\n    def dfs(node, current_sum):\n        pass\n    dfs(root, 0)\n    return count[0]",
    hints: [
      "Maintain prefix_map: prefix_sum -> count of times this sum has appeared above the current node.",
      "At each node: current_sum += node.val. Check if (current_sum - target_sum) in prefix_map — that count is the number of paths ending at this node with the target sum.",
      "Before returning from DFS, decrement prefix_map[current_sum] to remove the current node's contribution — backtracking the map."
    ],
    solution: "def path_sum_optimized(root, target_sum):\n    count = [0]\n    prefix_map = {0: 1}\n    def dfs(node, current_sum):\n        if node is None:\n            return\n        current_sum += node.val\n        if current_sum - target_sum in prefix_map:\n            count[0] += prefix_map[current_sum - target_sum]\n        prefix_map[current_sum] = prefix_map.get(current_sum, 0) + 1\n        dfs(node.left, current_sum)\n        dfs(node.right, current_sum)\n        prefix_map[current_sum] -= 1\n    dfs(root, 0)\n    return count[0]",
    walkthrough: "Single DFS. At each node, compute the running prefix sum from root. The key: any subpath from an ancestor to this node has sum = prefix[current] - prefix[ancestor_just_above]. So we need prefix[ancestor] where prefix[ancestor] = current_sum - target_sum. The map tracks all prefix sums seen ABOVE current node. Backtrack the map (decrement) when leaving a node to prevent counting paths that cross between subtrees.",
    testCode: "t = build_tree([10,5,-3,3,2,None,11,3,-2,None,1])\nassert path_sum_optimized(t, 8) == 3\nt2 = build_tree([5,4,8,11,None,13,4,7,2,None,None,5,1])\nassert path_sum_optimized(t2, 22) == 3\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Count Subpaths with Prefix Sum (O(n))", pattern: "prefix sum count on path", skill: "count all paths with sum in [low, high] using prefix map",
    statement: "Given root and range [low, high], count downward paths whose sum falls in [low, high]. Use prefix sum map: at each node, count prefix sums in range [current_sum - high, current_sum - low].",
    examples: [
      { input: "root = [10,5,1,2,-3], low = 6, high = 15", output: "3" },
      { input: "root = [1,2,3], low = 1, high = 3", output: "4" },
    ],
    why: "Extends P26. Instead of checking one target, check a range. For each ancestor prefix p, need: low <= current - p <= high, i.e., p in [current - high, current - low]. Iterate or use a sorted map (BST).",
    starterCode: "def count_subpaths_range(root, low, high):\n    prefix_map = {0: 1}\n    count = [0]\n    def dfs(node, current_sum):\n        pass\n    dfs(root, 0)\n    return count[0]",
    hints: [
      "At each node: need p = current_sum - some value in [low, high]. So p is in [current_sum - high, current_sum - low].",
      "For each possible p in that range, if p in prefix_map, add prefix_map[p] to count.",
      "Range could be large — iterate over prefix_map keys or use a sorted structure. For small ranges, simple iteration works."
    ],
    solution: "def count_subpaths_range(root, low, high):\n    prefix_map = {0: 1}\n    count = [0]\n    def dfs(node, current_sum):\n        if node is None:\n            return\n        current_sum += node.val\n        for p in range(current_sum - high, current_sum - low + 1):\n            if p in prefix_map:\n                count[0] += prefix_map[p]\n        prefix_map[current_sum] = prefix_map.get(current_sum, 0) + 1\n        dfs(node.left, current_sum)\n        dfs(node.right, current_sum)\n        prefix_map[current_sum] -= 1\n    dfs(root, 0)\n    return count[0]",
    walkthrough: "Same framework as P26. The prefix relationship: for a path to have sum s in [low, high], the ancestor prefix p must satisfy low <= current - p <= high, which rearranges to p in [current - high, current - low]. For each qualifying p, add its frequency from the map. Works best when the range is small; for large ranges, a balanced BST on prefix sums would be needed.",
     testCode: "t = build_tree([10,5,1,2,-3])\nassert count_subpaths_range(t, 6, 15) == 5\nt2 = build_tree([1,2,3])\nassert count_subpaths_range(t2, 1, 3) == 4\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Longest Path with Same Value (O(n))", pattern: "same-value DFS with length tracking", skill: "DFS returning (same_val_length, same_val_length_not_splitting)",
    statement: "Given root, return the length of the longest downward path where all nodes have the SAME value. The path may or may NOT pass through root. O(n).",
    examples: [
      { input: "root = [5,4,5,1,1,5]", output: "2", explain: "longest same-value path: two nodes of value 5" },
      { input: "root = [1,4,5,4,4,5]", output: "2" },
    ],
    why: "Similar to max path sum but with same-value constraint. At each node, children report their same-value lengths. If child.val == node.val, extend. Track max across the tree.",
    starterCode: "def longest_univalue_path(root):\n    max_len = [0]\n    def dfs(node):\n        pass\n    dfs(root)\n    return max_len[0]",
    hints: [
      "dfs returns the longest UNIDIRECTIONAL path starting from this node going downward with same value.",
      "If child.val == node.val, child's returned length is usable. Extend: left_len = dfs(left) + 1 if val matches, else 0.",
      "The split path at node = left_len + right_len (if both children match). Update max. Return max(left_len, right_len)."
    ],
    solution: "def longest_univalue_path(root):\n    max_len = [0]\n    def dfs(node):\n        if node is None:\n            return 0\n        left_len = dfs(node.left)\n        right_len = dfs(node.right)\n        left_extend = left_len + 1 if node.left and node.left.val == node.val else 0\n        right_extend = right_len + 1 if node.right and node.right.val == node.val else 0\n        max_len[0] = max(max_len[0], left_extend + right_extend)\n        return max(left_extend, right_extend)\n    dfs(root)\n    return max_len[0]",
    walkthrough: "DFS returns the longest same-value path DOWNWARD from each node (uni-directional, no fork). At each node: check if each child matches value. If yes, extend by 1 from child's result. The split path (left + right extension) could be longer — update global max. Return the best child extension upward. O(n) with bottom-up DFS.",
    testCode: "t = build_tree([5,4,5,1,1,5])\nassert longest_univalue_path(t) == 2\nt2 = build_tree([1,4,5,4,4,5])\nassert longest_univalue_path(t2) == 2\nt3 = build_tree([1,1,1])\nassert longest_univalue_path(t3) == 2\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Binary Tree Maximum Path Sum (O(n))", pattern: "tuple return with max_split and max_linear", skill: "DFS returns (max_straight, max_split), O(n)",
    statement: "Given root (values can be negative), return the maximum possible sum of ANY path (not necessarily through root). Path must be connected. O(n).",
    examples: [
      { input: "root = [1,2,3]", output: "6", explain: "path 2->1->3" },
      { input: "root = [-10,9,20,null,null,15,7]", output: "42", explain: "15->20->7" },
    ],
    why: "This is THE benchmark 'returning tuples' problem. Each node asks children for two numbers: (1) max straight path down, (2) max any-path in subtree. The computation at each node composes these.",
    starterCode: "def max_path_sum(root):\n    def dfs(node):\n        pass\n    return dfs(root)[1]",
    hints: [
      "Helper returns (max_straight, max_any). max_straight = max path starting at node and going straight down.",
      "max_straight through node = node.val + max(0, left_straight) + max(0, right_straight) — but this is a split path; don't return it upward.",
      "Return upward: max_straight = node.val + max(0, left_straight, right_straight). max_any in subtree = max(node's split path, left_any, right_any)."
    ],
    solution: "def max_path_sum(root):\n    def dfs(node):\n        if node is None:\n            return (0, float('-inf'))\n        left_straight, left_any = dfs(node.left)\n        right_straight, right_any = dfs(node.right)\n        straight = node.val + max(0, left_straight, right_straight)\n        split = node.val + max(0, left_straight) + max(0, right_straight)\n        any_path = max(split, left_any, right_any)\n        return (straight, any_path)\n    result = dfs(root)\n    return result[1]",
    walkthrough: "Each node returns (max_straight_down, max_any_in_subtree). Straight path: extend the best of left/right (add only if positive). Split path: take best from both sides. max_any = max(split, left_any, right_any). Base: None returns (0, -inf). At root: answer is result[1]. O(n) single-pass.",
    testCode: "t = build_tree([1,2,3])\nassert max_path_sum(t) == 6\nt2 = build_tree([-10,9,20,None,None,15,7])\nassert max_path_sum(t2) == 42\nt3 = build_tree([-3])\nassert max_path_sum(t3) == -3\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Most Frequent Subtree Sum (O(n))", pattern: "bottom-up sum with frequency map", skill: "DFS compute subtree sum, track frequency, O(n)",
    statement: "Given root, return all subtree sums that appear most frequently. Subtree sum = sum of all nodes in that subtree. O(n).",
    examples: [
      { input: "root = [5,2,-3]", output: "[2,-3,4]", explain: "sums 2,-3,4 each appear once" },
      { input: "root = [5,2,-5]", output: "[2]", explain: "sums 2,-5,2 -> most freq = 2" },
    ],
    why: "Bottom-up computation: subtree sum = node.val + left_sum + right_sum. Track in hashmap. This assembles prior patterns (measurement + hashmap tracking) in a single O(n) DFS.",
    starterCode: "def find_frequent_tree_sum(root):\n    freq = {}\n    def dfs(node):\n        pass\n    dfs(root)\n    return []",
    hints: [
      "dfs returns the sum of the subtree rooted at node. Base: None returns 0.",
      "subtree_sum = node.val + dfs(left) + dfs(right). Increment freq[subtree_sum].",
      "After DFS, find max frequency. Return all sums with that frequency."
    ],
    solution: "def find_frequent_tree_sum(root):\n    if not root:\n        return []\n    freq = {}\n    def dfs(node):\n        if node is None:\n            return 0\n        total = node.val + dfs(node.left) + dfs(node.right)\n        freq[total] = freq.get(total, 0) + 1\n        return total\n    dfs(root)\n    max_freq = max(freq.values())\n    return [s for s, f in freq.items() if f == max_freq]",
    walkthrough: "Bottom-up: each subtree sum is local value + left sum + right sum. Record each sum's frequency in a hashmap. After traversal, find max frequency and return all sums with that frequency. Simple composition: P5 (measurement) + frequency tracking.",
    testCode: "t = build_tree([5,2,-3])\nres = find_frequent_tree_sum(t)\nassert set(res) == set([2,-3,4])\nt2 = build_tree([5,2,-5])\nassert find_frequent_tree_sum(t2) == [2]\nt3 = build_tree([1])\nassert find_frequent_tree_sum(t3) == [1]\nprint('All tests passed!')"
  },

  {
    id: 41, stage: 5, title: "Binary Indexed Tree — Point Update & Prefix Query", pattern: "Fenwick tree array manipulation", skill: "build BIT from array; update single index; query prefix sum. O(log n) per operation.",
    statement: "Implement a Fenwick Tree (Binary Indexed Tree) supporting: (1) add value at index i, (2) query sum of arr[0..i]. BIT size n+1 (1-indexed). Update: i += i & -i. Query: i -= i & -i.",
    examples: [
      { input: "arr=[1,3,5,7,9,11]; update(3, +6) at index 2; query(0,5)", output: "sum after update" },
    ],
    why: "Fenwick Tree is the most space-efficient data structure for prefix sums with point updates — O(n) space, O(log n) time. It's simpler than segment tree (one array, bitwise operations). The core trick: each index i stores sum of a range of length (i & -i).",
    starterCode: "class FenwickTree:\n    def __init__(self, arr):\n        n = len(arr)\n        self.bit = [0] * (n + 1)\n        pass\n    def update(self, idx, delta):\n        pass\n    def query(self, idx):\n        pass\n    def range_sum(self, left, right):\n        pass",
    hints: [
      "Init: for each i (1..n), update idx i with arr[i-1]. Or build directly: bit[i] += arr[i-1]; j = i + (i & -i); if j <= n, bit[j] += bit[i].",
      "Update: while idx <= n: bit[idx] += delta; idx += idx & -idx.",
      "Query prefix sum to idx: while idx > 0: total += bit[idx]; idx -= idx & -idx. Range sum = query(right) - query(left-1)."
    ],
     solution: "class FenwickTree:\n    def __init__(self, arr):\n        self.n = len(arr)\n        self.bit = [0] * (self.n + 1)\n        for i in range(self.n):\n            self.update(i + 1, arr[i])\n    def update(self, idx, delta):\n        while idx <= self.n:\n            self.bit[idx] += delta\n            idx += idx & -idx\n    def query(self, idx):\n        total = 0\n        while idx > 0:\n            total += self.bit[idx]\n            idx -= idx & -idx\n        return total\n    def range_sum(self, left, right):\n        return self.query(right + 1) - self.query(left)",
    walkthrough: "BIT uses 1-indexed array. Each index i is responsible for a range of length LSB(i) = i & -i. Update: propagate delta to all indices that cover the updated position (i += i & -i). Query: aggregate contributions by stripping the lowest set bit (i -= i & -i). Both O(log n).",
    testCode: "arr = [1, 3, 5, 7, 9, 11]\nft = FenwickTree(arr)\nassert ft.query(3) == 9\nassert ft.range_sum(2, 5) == 32\nft.update(3, 6)\nassert ft.query(3) == 15\nprint('All tests passed!')",
  },
  {
    id: 42, stage: 5, title: "Static Range Minimum Query (Sparse Table)", pattern: "Sparse Table for RMQ", skill: "precompute min for intervals of length 2^j; answer queries in O(1)",
    statement: "Given an array arr, preprocess so range-min queries [l, r] can be answered in O(1). Build Sparse Table: st[i][j] = min of range [i, i+2^j-1]. Query: k = floor(log2(r-l+1)); answer = min(st[l][k], st[r-2^k+1][k]).",
    examples: [
      { input: "arr=[2,5,1,4,7,3]; query(1,4)", output: "1", explain: "min(5,1,4,7) = 1" },
      { input: "arr=[2,5,1,4,7,3]; query(0,5)", output: "1" },
    ],
    why: "RMQ is the foundational range-query problem. Sparse Table achieves O(1) query after O(n log n) preprocessing — it's the simplest static RMQ structure. The idempotent property of min (min(a,a)=a) allows overlapping intervals.",
    starterCode: "class SparseTable:\n    def __init__(self, arr):\n        import math\n        self.n = len(arr)\n        self.log = [0] * (self.n + 1)\n        pass\n    def query(self, left, right):\n        pass",
    hints: [
      "Precompute log2 values: log[i] = log[i//2] + 1. Then: K = log[n] + 1. st[i][0] = arr[i].",
      "For j from 1..K: st[i][j] = min(st[i][j-1], st[i + (1<<(j-1))][j-1]).",
      "Query: k = log[r-l+1]; return min(st[l][k], st[r-(1<<k)+1][k]). These two intervals overlap but cover [l,r]."
    ],
    solution: "class SparseTable:\n    import math\n    def __init__(self, arr):\n        self.n = len(arr)\n        self.log = [0] * (self.n + 1)\n        for i in range(2, self.n + 1):\n            self.log[i] = self.log[i // 2] + 1\n        K = self.log[self.n] + 1\n        self.st = [[0] * K for _ in range(self.n)]\n        for i in range(self.n):\n            self.st[i][0] = arr[i]\n        for j in range(1, K):\n            step = 1 << (j - 1)\n            for i in range(self.n - (1 << j) + 1):\n                self.st[i][j] = min(self.st[i][j-1], self.st[i + step][j-1])\n    def query(self, left, right):\n        k = self.log[right - left + 1]\n        return min(self.st[left][k], self.st[right - (1 << k) + 1][k])",
    walkthrough: "Sparse Table = 2D array st[i][j] = min of range[i, i+2^j-1]. Build: each larger interval = min of two half-sized intervals (overlapping left and right halves). Query: find largest power-of-2 k <= len; answer = min(st[l][k], st[r-2^k+1][k]). These two intervals overlap but cover [l,r] exactly. Works only for idempotent functions (min, max, gcd). O(1) query.",
    testCode: "arr = [2, 5, 1, 4, 7, 3]\nst = SparseTable(arr)\nassert st.query(0, 5) == 1\nassert st.query(1, 4) == 1\nassert st.query(0, 0) == 2\nassert st.query(4, 5) == 3\nprint('All tests passed!')",
  },
  // ── STAGE 6: Mastery ──
  {
    id: 43, stage: 6, title: "Diameter of Binary Tree (Edges)", pattern: "max of (left_depth + right_depth) at each node", skill: "global max of split-width during depth DFS",
    statement: "Given root, return the diameter: the number of edges on the longest path between ANY two nodes. Diameter = max(left_depth + right_depth) across all nodes.",
    examples: [
      { input: "root = [1,2,3,4,5]", output: "3", explain: "path 4->2->1->3 (3 edges)" },
      { input: "root = [1,2]", output: "1" },
    ],
    why: "Diameter composes P5 (depth) with the split-path tracking pattern from P29. The longest path between any two nodes passes through their LCA — at each node, the split is left_depth + right_depth.",
    starterCode: "def diameter_of_binary_tree(root):\n    max_diam = [0]\n    def dfs(node):\n        pass\n    dfs(root)\n    return max_diam[0]",
    hints: [
      "dfs returns the DEPTH (edges from node to deepest leaf below). Base: None returns -1.",
      "At each node: left_depth = dfs(left), right_depth = dfs(right). The path through this node = left_depth + right_depth + 2 (edges: node to left deepest + node to right deepest).",
      "Update max_diam with the split count. Return upward: 1 + max(left_depth, right_depth)."
    ],
    solution: "def diameter_of_binary_tree(root):\n    max_diam = [0]\n    def dfs(node):\n        if node is None:\n            return -1\n        left_depth = dfs(node.left)\n        right_depth = dfs(node.right)\n        split = left_depth + right_depth + 2\n        max_diam[0] = max(max_diam[0], split)\n        return 1 + max(left_depth, right_depth)\n    dfs(root)\n    return max_diam[0]",
    walkthrough: "At each node, ask children for their depths (edges to deepest leaf). The longest path going THROUGH this node = (left depth from here) + (right depth from here). Update global max. Return max depth upward. Compose: depth measurement (P5) + split tracking (P29). O(n).",
    testCode: "t = build_tree([1,2,3,4,5])\nassert diameter_of_binary_tree(t) == 3\nt2 = build_tree([1,2])\nassert diameter_of_binary_tree(t2) == 1\nt3 = build_tree([1])\nassert diameter_of_binary_tree(t3) == 0\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Longest ZigZag Path", pattern: "direction-aware DFS", skill: "track current direction and zigzag length during DFS",
    statement: "Given root, return the length of the longest zigzag path. A zigzag alternates left-right. Start from any node (first move can be left or right, length 0 before first move). Path goes downward only.",
    examples: [
      { input: "root = [1,null,1,1,1,null,null,1,1,null,1,null,null,null,1]", output: "3" },
      { input: "root = [1,1,1,null,1,null,null,1,1,null,1]", output: "4" },
    ],
    why: "Compose: DFS (P5 template) + direction tracking. At each node, you need two scores: longest zigzag if you go left vs right. The direction parameter tells DFS whether the previous move was left or right.",
    starterCode: "def longest_zigzag(root):\n    max_zig = [0]\n    def dfs(node, direction, length):\n        pass\n    dfs(root, None, 0)\n    return max_zig[0]",
    hints: [
      "direction: 'left' means you just came from left, so now you must go right. 'right' means go left. None (root) means go either.",
      "If direction matches the child, reset to 1. If opposite, increment length + 1.",
      "At each node, update max_zig. Recurse into children with appropriate direction and length."
    ],
    solution: "def longest_zigzag(root):\n    max_zig = [0]\n    def dfs(node, go_left, length):\n        if node is None:\n            return\n        max_zig[0] = max(max_zig[0], length)\n        if go_left:\n            dfs(node.left, False, length + 1)\n            dfs(node.right, True, 1)\n        else:\n            dfs(node.right, True, length + 1)\n            dfs(node.left, False, 1)\n    dfs(root, True, 0)\n    dfs(root, False, 0)\n    return max_zig[0]",
    walkthrough: "Every node starts two recursive paths: one pretending it was reached via a left move (so next must be right), one via right (next must be left). Length accumulates on alternation, resets to 1 on same-direction moves. Two calls from root (go_left=True and go_left=False) cover both starting directions. O(n).",
     testCode: "def build_zigzag_tree():\n    n1 = TreeNode(1)\n    n2 = TreeNode(1); n3 = TreeNode(1)\n    n1.right = n2\n    n2.left = n3\n    n4 = TreeNode(1); n5 = TreeNode(1)\n    n3.left = n4; n3.right = n5\n    n6 = TreeNode(1)\n    n5.right = n6\n    return n1\nassert longest_zigzag(build_zigzag_tree()) == 3\nn1 = TreeNode(1); n2 = TreeNode(1); n3 = TreeNode(1); n4 = TreeNode(1); n5 = TreeNode(1)\nn1.left = n2; n2.right = n3; n3.left = n4; n4.right = n5\nassert longest_zigzag(n1) == 4\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Maximum Average Subtree", pattern: "tuple (sum, count) per subtree", skill: "bottom-up sum+count, compute avg, track max",
    statement: "Given root, return the maximum average value of any subtree. Average = sum of subtree values / number of nodes in subtree.",
    examples: [
      { input: "root = [5,6,1]", output: "6.0", explain: "subtree [6] avg=6.0; subtree [6,1] avg=3.5; whole tree avg=4.0" },
      { input: "root = [1,null,2]", output: "2.0" },
    ],
    why: "Compose: returning tuples (P29) with measurement (P5). Each subtree returns (sum, count). Average = sum / count. Track global max. Purely bottom-up compute.",
    starterCode: "def maximum_average_subtree(root):\n    max_avg = [float('-inf')]\n    def dfs(node):\n        pass\n    dfs(root)\n    return max_avg[0]",
    hints: [
      "dfs returns (sum_of_subtree, node_count). Base: None returns (0, 0).",
      "At node: sum = node.val + left_sum + right_sum. count = 1 + left_count + right_count.",
      "Compute avg = sum / count. Update max_avg. Return (sum, count)."
    ],
    solution: "def maximum_average_subtree(root):\n    max_avg = [float('-inf')]\n    def dfs(node):\n        if node is None:\n            return (0, 0)\n        left_sum, left_cnt = dfs(node.left)\n        right_sum, right_cnt = dfs(node.right)\n        total_sum = node.val + left_sum + right_sum\n        total_cnt = 1 + left_cnt + right_cnt\n        avg = total_sum / total_cnt\n        if avg > max_avg[0]:\n            max_avg[0] = avg\n        return (total_sum, total_cnt)\n    dfs(root)\n    return max_avg[0]",
    walkthrough: "Bottom-up: children return (sum, count). Node aggregates: sum = left_sum + right_sum + node.val, count = 1 + left_count + right_count. Average = sum / count. Track max globally. Compose: measurement (P5) + returning tuples (Stage 2 of Trees). O(n).",
    testCode: "t = build_tree([5,6,1])\nassert maximum_average_subtree(t) == 6.0\nt2 = build_tree([1,None,2])\nassert maximum_average_subtree(t2) == 2.0\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Subtree with All Deepest Nodes", pattern: "depth + LCA hybrid", skill: "return (depth, node) pair; compare depths of children",
    statement: "Given root, return the smallest subtree that contains all the deepest nodes. If both children have same max depth, current node is the LCA of deepest nodes.",
    examples: [
      { input: "root = [3,5,1,6,2,0,8,null,null,7,4]", output: "[2,7,4]", explain: "node 2 is LCA of deepest nodes 7,4" },
      { input: "root = [1]", output: "[1]" },
    ],
    why: "Compose: depth measurement (P5) + LCA logic (P6). Each subtree returns (depth, candidate_node). If left_depth == right_depth, current node is the LCA of deepest nodes.",
    starterCode: "def subtree_with_all_deepest(root):\n    def dfs(node):\n        pass\n    return dfs(root)[1]",
    hints: [
      "dfs returns (depth, node). depth = max depth of subtree; node = the smallest subtree containing deepest nodes in this subtree.",
      "If left_depth > right_depth, deepest nodes are in left — return (left_depth + 1, left_node).",
      "If left_depth == right_depth, this node is LCA of deepest nodes — return (left_depth + 1, current node)."
    ],
    solution: "def subtree_with_all_deepest(root):\n    def dfs(node):\n        if node is None:\n            return (0, None)\n        left_depth, left_node = dfs(node.left)\n        right_depth, right_node = dfs(node.right)\n        if left_depth > right_depth:\n            return (left_depth + 1, left_node)\n        elif right_depth > left_depth:\n            return (right_depth + 1, right_node)\n        else:\n            return (left_depth + 1, node)\n    return dfs(root)[1]",
    walkthrough: "Each subtree returns (max_depth, candidate_LCA). If one side is deeper, deepest nodes are on that side — propagate its candidate up. If both sides have equal max depth, current node is the LCA of deepest nodes — it's the candidate. Compose: depth (P5) + ancestor decision (P6). O(n).",
    testCode: "t = build_tree([3,5,1,6,2,0,8,None,None,7,4])\nresult = subtree_with_all_deepest(t)\nassert result.val == 2\nt2 = build_tree([1])\nassert subtree_with_all_deepest(t2).val == 1\nt3 = build_tree([0,1,3,None,2])\nassert subtree_with_all_deepest(t3).val == 2\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Max Path Sum — Any-to-Any with Open/Closed Tuple", pattern: "open/closed state tuple", skill: "state machine: path open (can extend) or closed (max found)",
    statement: "Given root (values may be negative), return max path sum of any connected path. Use open/closed state: 'open' means path can still be extended; 'closed' means maximum found (may not extend further). Return closed.",
    examples: [
      { input: "root = [-10,9,20,null,null,15,7]", output: "42" },
      { input: "root = [2,-1]", output: "2" },
    ],
    why: "Alternative frame for P29 using open/closed state. 'Open' = max sum of a path that can extend upward; 'Closed' = max sum of any path (that may be a V-shape and thus cannot extend). Equivalent to straight/split framing.",
    starterCode: "def max_path_sum_any_to_any(root):\n    def dfs(node):\n        pass\n    return dfs(root)[1]",
    hints: [
      "dfs returns (open, closed). open = max sum of a downward path starting at node (can extend). closed = max sum of any path in subtree.",
      "open = node.val + max(0, left_open, right_open). If all children negative, open = node.val alone.",
      "closed = max(closed_left, closed_right, node.val + max(0, left_open) + max(0, right_open)). The third term is the V-shaped path through node."
    ],
    solution: "def max_path_sum_any_to_any(root):\n    def dfs(node):\n        if node is None:\n            return (0, float('-inf'))\n        left_open, left_closed = dfs(node.left)\n        right_open, right_closed = dfs(node.right)\n        open_path = node.val + max(0, left_open, right_open)\n        v_path = node.val + max(0, left_open) + max(0, right_open)\n        closed = max(v_path, left_closed, right_closed)\n        return (open_path, closed)\n    return dfs(root)[1]",
    walkthrough: "Open/Closed state machine. 'Open': a straight-line path starting at node, extendable upward. Take best child (or none if all negative). 'Closed': max of (a) best closed in left, (b) best closed in right, (c) V-path through node using the open values from both children. Return closed at root. O(n). Equivalent to P29's (straight, any).",
    testCode: "t = build_tree([-10,9,20,None,None,15,7])\nassert max_path_sum_any_to_any(t) == 42\nt2 = build_tree([2,-1])\nassert max_path_sum_any_to_any(t2) == 2\nt3 = build_tree([-3])\nassert max_path_sum_any_to_any(t3) == -3\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Check AVL Balance Property", pattern: "balance factor verification", skill: "verify that for every node, |height(left) - height(right)| <= 1",
    statement: "Given root, return True if the tree is AVL-balanced (for every node, height difference between left and right subtrees is at most 1). Height of None is -1.",
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "True" },
      { input: "root = [1,2,3,4,null,null,5]", output: "False", explain: "node 1: left height=2, right height=1 -> diff=1 OK; node 2: left=1, right=-1 -> diff=2, NOT balanced" },
    ],
    why: "AVL trees enforce |balance| <= 1 at every node to guarantee O(log n) height. Verifying this property composes depth (P5), global flag tracking (P31), and tuple return (P29). If ANY node is unbalanced, the whole tree is not AVL.",
    starterCode: "def is_avl_balanced(root):\n    def dfs(node):\n        pass\n    return dfs(root)[0]",
    hints: [
      "dfs returns (is_balanced, height). Base: None returns (True, -1).",
      "At node: if either child unbalanced, propagate False. Check |left_h - right_h| <= 1.",
      "Return (children_balanced and node_balanced, 1 + max(left_h, right_h))."
    ],
    solution: "def is_avl_balanced(root):\n    def dfs(node):\n        if node is None:\n            return (True, -1)\n        left_ok, left_h = dfs(node.left)\n        right_ok, right_h = dfs(node.right)\n        if not left_ok or not right_ok:\n            return (False, 0)\n        if abs(left_h - right_h) > 1:\n            return (False, 0)\n        return (True, 1 + max(left_h, right_h))\n    return dfs(root)[0]",
    walkthrough: "Bottom-up: each subtree returns (is_balanced, height). None = (True, -1). If any child is unbalanced, propagate False. At current node: check |left_h - right_h| <= 1. If yes, (True, 1+max(h)). This composes: depth measurement (P5) + boolean propagation (tuple return from P29) + global check. O(n).",
     testCode: "t = build_tree([3,9,20,None,None,15,7])\nassert is_avl_balanced(t) == True\nt2 = build_tree([1,2,3,4,None,None,None,5])\nassert is_avl_balanced(t2) == False\nt3 = build_tree([1])\nassert is_avl_balanced(t3) == True\nprint('All tests passed!')",
  },
  {
    id: 49, stage: 6, title: "Segment Tree — Build and Range Sum", pattern: "recursive segment tree construction", skill: "build segment tree array; query range sum; point update. O(log n) per operation.",
    statement: "Implement a Segment Tree for an array arr: (1) build from array, (2) query sum of range [l, r], (3) point update at index i. The tree is a full binary tree stored in an array of size 4n. Build recursively: node covers [l, r]; if l==r, tree[node]=arr[l]; else mid, build left+right, tree[node]=left+right.",
    examples: [
      { input: "arr=[1,3,5,7,9,11]; query(1,3); update(2, 10); query(1,3)", output: "query(1,3): 15; after update: 20" },
    ],
    why: "Segment Tree is the most general range-query data structure. Unlike BIT (which only handles prefix sums), segment tree handles ANY associative operation (sum, min, max, gcd) and supports range UPDATES with lazy propagation. This is the foundation for advanced range-query problems.",
    starterCode: "class SegmentTree:\n    def __init__(self, arr):\n        self.n = len(arr)\n        self.tree = [0] * (4 * self.n)\n        pass\n    def build(self, node, left, right):\n        pass\n    def query(self, node, left, right, ql, qr):\n        pass\n    def update(self, node, left, right, idx, val):\n        pass",
    hints: [
      "build: if left==right, tree[node]=arr[left]. Else mid, build left(2*node) and right(2*node+1) subranges; tree[node]=tree[2*node]+tree[2*node+1].",
      "query: if [ql,qr] completely covers [left,right], return tree[node]. If disjoint, return 0. Else query both halves.",
      "update: if left==right, tree[node]=val. Else update affected child, recompute tree[node] from children."
    ],
    solution: "class SegmentTree:\n    def __init__(self, arr):\n        self.n = len(arr)\n        self.tree = [0] * (4 * self.n)\n        self.build(1, 0, self.n - 1, arr)\n    def build(self, node, left, right, arr):\n        if left == right:\n            self.tree[node] = arr[left]\n            return\n        mid = (left + right) // 2\n        self.build(node * 2, left, mid, arr)\n        self.build(node * 2 + 1, mid + 1, right, arr)\n        self.tree[node] = self.tree[node * 2] + self.tree[node * 2 + 1]\n    def query(self, node, left, right, ql, qr):\n        if ql > right or qr < left:\n            return 0\n        if ql <= left and right <= qr:\n            return self.tree[node]\n        mid = (left + right) // 2\n        return self.query(node * 2, left, mid, ql, qr) + self.query(node * 2 + 1, mid + 1, right, ql, qr)\n    def update(self, node, left, right, idx, val):\n        if left == right:\n            self.tree[node] = val\n            return\n        mid = (left + right) // 2\n        if idx <= mid:\n            self.update(node * 2, left, mid, idx, val)\n        else:\n            self.update(node * 2 + 1, mid + 1, right, idx, val)\n        self.tree[node] = self.tree[node * 2] + self.tree[node * 2 + 1]",
    walkthrough: "Segment tree = binary tree where each node stores the aggregate of a contiguous range. Root = entire array. Left child = left half, right child = right half. Query: recursively descend; if a node's range is fully inside query, return its value (lazy shortcut). If disjoint, return identity. Update: traverse to leaf, update, recompute ancestors. O(log n) per op.",
    testCode: "arr = [1, 3, 5, 7, 9, 11]\nst = SegmentTree(arr)\nassert st.query(1, 0, 5, 1, 3) == 15\nst.update(1, 0, 5, 2, 10)\nassert st.query(1, 0, 5, 1, 3) == 20\nprint('All tests passed!')",
  },
  {
    id: 50, stage: 6, title: "Cartesian Tree — Build from Inorder", pattern: "min-heap on inorder array", skill: "build a Cartesian tree where inorder = given array and parent < children (min-heap property)",
    statement: "Given an array arr of distinct integers, build its Cartesian tree: a binary tree where (1) inorder traversal yields arr, and (2) it satisfies the min-heap property (parent < children). Build in O(n) using a stack: maintain the rightmost path.",
    examples: [
      { input: "arr = [3,2,1,6,0,5]", output: "root.val=0; inorder=[3,2,1,6,0,5]" },
      { input: "arr = [5,3,4,1,2]", output: "root.val=1; inorder=[5,3,4,1,2]" },
    ],
    why: "Cartesian Tree composes tree construction (Stage 0) with heap ordering (a new invariant). The O(n) stack-based construction is an elegant algorithm: maintain the rightmost path. Each new node pops smaller nodes from the stack and makes the last popped node its left child.",
    starterCode: "def build_cartesian_tree(arr):\n    if not arr:\n        return None\n    stack = []\n    pass",
    hints: [
      "Iterate through arr. For each value, create a new node. Pop stack while stack[-1].val > value; the last popped node becomes the new node's left child.",
      "If stack is non-empty after popping, stack[-1].right = new_node. Always push new_node.",
      "After processing all elements, the root is stack[0] (the first element pushed — which is the smallest overall)."
    ],
    solution: "def build_cartesian_tree(arr):\n    if not arr:\n        return None\n    stack = []\n    for val in arr:\n        node = TreeNode(val)\n        last_popped = None\n        while stack and stack[-1].val > val:\n            last_popped = stack.pop()\n        node.left = last_popped\n        if stack:\n            stack[-1].right = node\n        stack.append(node)\n    return stack[0]",
    walkthrough: "Maintain stack = rightmost path (in increasing order, since it's a min-heap). For each new value: pop all larger nodes (they become left children of the new node — the largest popped is the immediate left child). If stack still has nodes, the new node becomes the right child of the top. Always push. Final stack[0] is the root (smallest element). O(n).",
    testCode: "def inorder(node, result):\n    if node is None:\n        return\n    inorder(node.left, result)\n    result.append(node.val)\n    inorder(node.right, result)\narr = [3, 2, 1, 6, 0, 5]\nroot = build_cartesian_tree(arr)\nres = []\ninorder(root, res)\nassert res == arr\nassert root.val == 0\nprint('All tests passed!')",
  },
]

export function find_node_ref(root: any, target: number): any {
  return null
}

export const buildTreeCode = `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(arr):
    if not arr:
        return None
    nodes = [TreeNode(val) if val is not None else None for val in arr]
    for i, node in enumerate(nodes):
        if node is not None:
            left_idx = 2 * i + 1
            right_idx = 2 * i + 2
            if left_idx < len(nodes):
                node.left = nodes[left_idx]
            if right_idx < len(nodes):
                node.right = nodes[right_idx]
    return nodes[0] if nodes else None

def find_node_ref(root, target):
    if root is None:
        return None
    if root.val == target:
        return root
    left = find_node_ref(root.left, target)
    if left:
        return left
    return find_node_ref(root.right, target)
`
