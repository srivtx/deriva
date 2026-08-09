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

export const STAGES_TREES = [
  { id: 0, name: "Recursion Reflex", desc: "non-tree" },
  { id: 1, name: "Tree Traversal", desc: "visit every node" },
  { id: 2, name: "Measurement Pattern", desc: "structural props" },
  { id: 3, name: "Returning Tuples", desc: "bubble up extra info" },
  { id: 4, name: "Naive Approach", desc: "feel the waste" },
  { id: 5, name: "Optimization", desc: "fix the waste" },
  { id: 6, name: "Mastery", desc: "combine patterns" },
]

export const PROBLEMS_TREES: Problem[] = [
  {
    id: 1, stage: 0, title: "Sum 1 to N", pattern: "linear recursion", skill: "base case + reduce by 1",
    statement: "Given a positive integer n, return the sum of all integers from 1 to n using recursion.",
    examples: [
      { input: "n = 5", output: "15", explain: "1+2+3+4+5=15" },
      { input: "n = 1", output: "1" },
    ],
    why: "Installs the most basic recursion reflex: identify smallest input (base case), express larger input in terms of smaller one.",
    starterCode: "def sum_to_n(n):\n    pass",
    hints: [
      "What is the smallest valid input and what should it return?",
      "For n > 1, sum(n) = n + sum(n-1).",
      "return 1 if n == 1 else n + sum_to_n(n - 1)"
    ],
    solution: "def sum_to_n(n):\n    if n == 1:\n        return 1\n    return n + sum_to_n(n - 1)",
    walkthrough: "Two questions: (1) smallest input? n=1 returns 1. (2) extend smaller answer? sum(n)=n+sum(n-1). Every recursive function is just these two questions answered honestly.",
    testCode: "assert sum_to_n(1) == 1\nassert sum_to_n(5) == 15\nassert sum_to_n(10) == 55\nassert sum_to_n(100) == 5050\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Factorial", pattern: "linear recursion", skill: "base case + reduce by 1",
    statement: "Given non-negative integer n, return n! using recursion. By definition, 0! = 1.",
    examples: [
      { input: "n = 5", output: "120" },
      { input: "n = 0", output: "1" },
    ],
    why: "Same shape as P1 but with multiplication. The pattern 'reduce input by 1, combine current value with recursive result' becomes automatic.",
    starterCode: "def factorial(n):\n    pass",
    hints: [
      "Base case: what is 0! by definition?",
      "n! = n × (n-1)!",
      "return 1 if n == 0 else n * factorial(n - 1)"
    ],
    solution: "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)",
    walkthrough: "Identical structure to P1. Base case: 0! = 1. Recursive case: n! = n × (n-1)!. The pattern should feel like a single mental motion now.",
    testCode: "assert factorial(0) == 1\nassert factorial(1) == 1\nassert factorial(5) == 120\nassert factorial(10) == 3628800\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Power x^n", pattern: "linear recursion", skill: "two-argument recursion",
    statement: "Given integers x and non-negative n, return x^n using recursion.",
    examples: [
      { input: "x=2, n=10", output: "1024" },
      { input: "x=3, n=0", output: "1" },
    ],
    why: "Two arguments but only one shrinks. Trains identifying WHICH argument drives the recursion.",
    starterCode: "def power(x, n):\n    pass",
    hints: [
      "Base case: anything to power 0 equals?",
      "x^n = x × x^(n-1). n shrinks, x stays the same.",
      "return 1 if n == 0 else x * power(x, n - 1)"
    ],
    solution: "def power(x, n):\n    if n == 0:\n        return 1\n    return x * power(x, n - 1)",
    walkthrough: "When multiple arguments, identify which shrinks toward base case. n shrinks (toward 0), x stays constant. Recursive call is power(x, n-1).",
    testCode: "assert power(2, 0) == 1\nassert power(2, 10) == 1024\nassert power(3, 4) == 81\nassert power(5, 3) == 125\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Count Down (print)", pattern: "linear recursion", skill: "side-effect recursion",
    statement: "Given positive integer n, print every number from n down to 1 on its own line. Return nothing.",
    examples: [
      { input: "n = 3", output: "3\\n2\\n1" },
    ],
    why: "Not all recursion returns a value. The work IS the recursion. Breaks the assumption that recursion must compute.",
    starterCode: "def countdown(n):\n    pass",
    hints: [
      "Base case: when n < 1, just return.",
      "Print n first, then call countdown(n-1).",
      "if n < 1: return\\nprint(n)\\ncountdown(n - 1)"
    ],
    solution: "def countdown(n):\n    if n < 1:\n        return\n    print(n)\n    countdown(n - 1)",
    walkthrough: "Same shape: base case stops recursion, recursive case shrinks input. Only difference: no return value to combine.",
    testCode: "import sys,io\nbuf=io.StringIO()\nold=sys.stdout\nsys.stdout=buf\ncountdown(5)\nsys.stdout=old\nassert buf.getvalue()=='5\\n4\\n3\\n2\\n1\\n'\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Reverse String", pattern: "linear recursion", skill: "string recursion",
    statement: "Given string s, return its reverse using recursion.",
    examples: [
      { input: "s='hello'", output: "'olleh'" },
      { input: "s=''", output: "''" },
    ],
    why: "Same shrink-by-one pattern on strings. Shrinks by removing a character instead of subtracting 1.",
    starterCode: "def reverse_str(s):\n    pass",
    hints: [
      "Base case: empty string reverses to itself.",
      "Take last char + reverse of everything except last char.",
      "return s if len(s) <= 1 else s[-1] + reverse_str(s[:-1])"
    ],
    solution: "def reverse_str(s):\n    if len(s) <= 1:\n        return s\n    return s[-1] + reverse_str(s[:-1])",
    walkthrough: "Shrink by one generalizes: s[:-1] instead of n-1. Combine step is string concatenation. Base case + shrink + combine is the universal pattern.",
    testCode: "assert reverse_str('') == ''\nassert reverse_str('a') == 'a'\nassert reverse_str('hello') == 'olleh'\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Fibonacci", pattern: "two-branch recursion", skill: "two recursive calls",
    statement: "Given non-negative integer n, return the nth Fibonacci number. F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).",
    examples: [
      { input: "n = 5", output: "5", explain: "0,1,1,2,3,5" },
      { input: "n = 10", output: "55" },
    ],
    why: "First time making TWO recursive calls. This is the precursor to tree recursion — every tree function calls itself on both children.",
    starterCode: "def fib(n):\n    pass",
    hints: [
      "Base cases: F(0)=0, F(1)=1.",
      "F(n) = F(n-1) + F(n-2) — two calls, sum them.",
      "if n <= 1: return n\\nreturn fib(n-1) + fib(n-2)"
    ],
    solution: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)",
    walkthrough: "Two recursive calls! This is the bridge to trees — every tree node makes two calls (left and right). The combine operation (sum) is the same whether the calls are fib(n-1) or height(node.left).",
    testCode: "assert fib(0) == 0\nassert fib(1) == 1\nassert fib(5) == 5\nassert fib(10) == 55\nassert fib(12) == 144\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Count Digits", pattern: "linear recursion", skill: "divide and conquer integer",
    statement: "Given positive integer n, return number of digits using recursion.",
    examples: [
      { input: "n = 12345", output: "5" },
      { input: "n = 7", output: "1" },
    ],
    why: "Same shrink-by-one but using division. Reinforces that 'shrinking the input' is an idea, not a specific operation.",
    starterCode: "def count_digits(n):\n    pass",
    hints: [
      "Base case: when n < 10, return 1.",
      "Shrink by removing last digit: n // 10.",
      "return 1 if n < 10 else 1 + count_digits(n // 10)"
    ],
    solution: "def count_digits(n):\n    if n < 10:\n        return 1\n    return 1 + count_digits(n // 10)",
    walkthrough: "The 'shrink' operation can be anything: n-1, s[:-1], n//10. Pattern: base case for smallest input, 1 + recurse on shrunken input.",
    testCode: "assert count_digits(7) == 1\nassert count_digits(12345) == 5\nassert count_digits(100) == 3\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Count Nodes", pattern: "tree traversal", skill: "1 + left + right",
    statement: "Given root of a binary tree, return total number of nodes using recursion.",
    examples: [
      { input: "tree = [1,2,3,4,5,6]", output: "6" },
      { input: "tree = []", output: "0" },
    ],
    why: "First time combining results from TWO recursive calls. Pattern '1 + count(left) + count(right)' is foundation for all aggregating tree functions.",
    starterCode: "def count_nodes(node):\n    pass",
    hints: [
      "Base case: if node is None, there are 0 nodes.",
      "This node = 1 + all nodes in left subtree + all nodes in right subtree.",
      "return 0 if node is None else 1 + count_nodes(node.left) + count_nodes(node.right)"
    ],
    solution: "def count_nodes(node):\n    if node is None:\n        return 0\n    return 1 + count_nodes(node.left) + count_nodes(node.right)",
    walkthrough: "Key mental shift: compute value by COMBINING results from children. Two recursive calls (like fib!) but on a tree structure. 1 + left + right.",
    testCode: "assert count_nodes(build_tree([])) == 0\nassert count_nodes(build_tree([1])) == 1\nassert count_nodes(build_tree([1,2,3,4,5,6])) == 6\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Sum Tree Values", pattern: "tree traversal", skill: "node.val + left + right",
    statement: "Given root of binary tree with integer values, return sum of all node values using recursion.",
    examples: [
      { input: "tree = [1,2,3,4,5]", output: "15" },
      { input: "tree = []", output: "0" },
    ],
    why: "Same skeleton as P8, different combination. The goal is for '1 + left + right' and 'node.val + left + right' to feel like the SAME pattern.",
    starterCode: "def tree_sum(node):\n    pass",
    hints: [
      "Base case: None contributes 0 to sum.",
      "This node contributes its value + left sum + right sum.",
      "return 0 if node is None else node.val + tree_sum(node.left) + tree_sum(node.right)"
    ],
    solution: "def tree_sum(node):\n    if node is None:\n        return 0\n    return node.val + tree_sum(node.left) + tree_sum(node.right)",
    walkthrough: "Compare to P8 line by line. Only difference: 'node.val' instead of '1'. Identical structure. Start seeing this as ONE pattern with different contributions.",
    testCode: "assert tree_sum(build_tree([])) == 0\nassert tree_sum(build_tree([5])) == 5\nassert tree_sum(build_tree([1,2,3,4,5])) == 15\nassert tree_sum(build_tree([1,-2,3,4,-5,6])) == 7\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Find Max in Tree", pattern: "tree traversal", skill: "max(node.val, left, right)",
    statement: "Given root of non-empty binary tree, return maximum value using recursion.",
    examples: [
      { input: "tree = [1,2,3,4,5]", output: "5" },
      { input: "tree = [-10,-20,-30]", output: "-10" },
    ],
    why: "Now combination is max() instead of +. The base case returns an IDENTITY element for the operation.",
    starterCode: "def tree_max(node):\n    pass",
    hints: [
      "Tricky base case: returning 0 breaks for all-negative trees. Use float('-inf').",
      "Recursive: max(node.val, tree_max(node.left), tree_max(node.right)).",
      "if node is None: return float('-inf')\\nreturn max(node.val, tree_max(node.left), tree_max(node.right))"
    ],
    solution: "def tree_max(node):\n    if node is None:\n        return float('-inf')\n    return max(node.val, tree_max(node.left), tree_max(node.right))",
    walkthrough: "Base case must return identity for combining operation. For sum it's 0; for max it's -inf. Wrong identity breaks edge cases. This skill returns in height function.",
    testCode: "assert tree_max(build_tree([1,2,3,4,5])) == 5\nassert tree_max(build_tree([-10,-20,-30])) == -10\nassert tree_max(build_tree([42])) == 42\nassert tree_max(build_tree([1,5,2,3,4,6,7])) == 7\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Search in Tree", pattern: "tree traversal", skill: "boolean OR combination",
    statement: "Given root and target value, return True if target exists anywhere in tree.",
    examples: [
      { input: "tree=[1,2,3], target=4", output: "False" },
      { input: "tree=[1,2,3], target=2", output: "True" },
    ],
    why: "Combination is 'or' instead of '+' or 'max'. Same skeleton, new operation, new identity (False for OR).",
    starterCode: "def exists(node, target):\n    pass",
    hints: [
      "Base case: if node is None, target isn't here — return False.",
      "Check: node.val == target OR exists(left) OR exists(right).",
      "return False if node is None else node.val == target or exists(node.left, target) or exists(node.right, target)"
    ],
    solution: "def exists(node, target):\n    if node is None:\n        return False\n    return node.val == target or exists(node.left, target) or exists(node.right, target)",
    walkthrough: "Same skeleton. New combination: OR. Identity for OR is False. Identity for AND would be True. The operation changes; the shape doesn't.",
    testCode: "assert exists(build_tree([1,2,3,4,5]), 4) == True\nassert exists(build_tree([1,2,3,4,5]), 9) == False\nassert exists(build_tree([]), 1) == False\nassert exists(build_tree([42]), 42) == True\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Count Leaves", pattern: "tree traversal", skill: "conditional contribution",
    statement: "Given root of binary tree, return number of leaf nodes. A leaf has no children.",
    examples: [
      { input: "tree = [1,2,3,4,5]", output: "3", explain: "leaves: 4, 5, 3" },
      { input: "tree = [1]", output: "1" },
    ],
    why: "Now contribution is CONDITIONAL. 1 if leaf, 0 if internal node (still aggregates children). First 'structural' reasoning.",
    starterCode: "def count_leaves(node):\n    pass",
    hints: [
      "Base case: None contributes 0.",
      "Is this node a leaf? Check if both children are None.",
      "A leaf contributes 1; internal node contributes count_leaves(left) + count_leaves(right)."
    ],
    solution: "def count_leaves(node):\n    if node is None:\n        return 0\n    if node.left is None and node.right is None:\n        return 1\n    return count_leaves(node.left) + count_leaves(node.right)",
    walkthrough: "New idea: current node's contribution depends on its STRUCTURE, not just its value. A leaf returns 1. Internal node returns 0 + children's leaves. This is first step toward structural reasoning.",
    testCode: "assert count_leaves(build_tree([])) == 0\nassert count_leaves(build_tree([1])) == 1\nassert count_leaves(build_tree([1,2,3,4,5])) == 3\nassert count_leaves(build_tree([1,2,3,4,5,6,7])) == 4\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Are Trees Identical", pattern: "tree traversal", skill: "two-tree recursion",
    statement: "Given roots of two binary trees, return True if structurally identical with same values.",
    examples: [
      { input: "t1=[1,2,3], t2=[1,2,3]", output: "True" },
      { input: "t1=[1,2], t2=[1,null,2]", output: "False" },
    ],
    why: "First time recursing on TWO trees at once. Dual-tree pattern: both None→True, one None→False, check values+recurse on both child pairs.",
    starterCode: "def is_same(t1, t2):\n    pass",
    hints: [
      "If both are None, they're identical — return True.",
      "If exactly one is None, different — return False.",
      "Values must match AND left subtrees match AND right subtrees match."
    ],
    solution: "def is_same(t1, t2):\n    if t1 is None and t2 is None:\n        return True\n    if t1 is None or t2 is None:\n        return False\n    return t1.val == t2.val and is_same(t1.left, t2.left) and is_same(t1.right, t2.right)",
    walkthrough: "Dual-tree pattern: handle None cross-product first, then combine with AND. Returns in symmetric-tree and subtree-check.",
    testCode: "assert is_same(build_tree([1,2,3]), build_tree([1,2,3])) == True\nassert is_same(build_tree([1,2]), build_tree([1,None,2])) == False\nassert is_same(build_tree([]), build_tree([])) == True\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 1, title: "In-order to List", pattern: "tree traversal", skill: "list concatenation",
    statement: "Given root, return list of node values in in-order (left, root, right).",
    examples: [
      { input: "tree = [1,2,3,4,5]", output: "[4,2,5,1,3]" },
    ],
    why: "First time returning STRUCTURED data (list) from recursion. Precursor to returning tuples.",
    starterCode: "def inorder(node):\n    pass",
    hints: [
      "Base case: None returns empty list [].",
      "In-order means: left's list + [node.val] + right's list.",
      "return [] if node is None else inorder(node.left) + [node.val] + inorder(node.right)"
    ],
    solution: "def inorder(node):\n    if node is None:\n        return []\n    return inorder(node.left) + [node.val] + inorder(node.right)",
    walkthrough: "Returning structured data from recursion — a preview of returning tuples. ORDER matters now (left, self, right).",
    testCode: "assert inorder(build_tree([])) == []\nassert inorder(build_tree([1])) == [1]\nassert inorder(build_tree([1,2,3,4,5])) == [4,2,5,1,3]\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Height of Tree ★", pattern: "measurement", skill: "1 + max(left, right)",
    statement: "Given root, return height. Empty tree = 0, single node = 1. Height = nodes on longest root-to-leaf path.",
    examples: [
      { input: "tree = [1,2,3,4,5]", output: "3", explain: "1→2→4 has 3 nodes" },
      { input: "tree = []", output: "0" },
    ],
    why: "★★★ THE KEY PRIMITIVE. Same skeleton as count/sum/max: 1 + combine(children). But combine is max. Base case is 0. If you cannot write this in your sleep, you cannot solve balanced-binary-tree.",
    starterCode: "def height(node):\n    pass",
    hints: [
      "Base case: empty tree (None) has height 0.",
      "Node's height = 1 (itself) + taller of its two subtrees.",
      "return 0 if node is None else 1 + max(height(node.left), height(node.right))"
    ],
    solution: "def height(node):\n    if node is None:\n        return 0\n    return 1 + max(height(node.left), height(node.right))",
    walkthrough: "The most important function in the curriculum. Trace: leaf has height 1 (1+max(0,0)). Node with leaf has height 2 (1+max(1,0)). The max picks taller subtree. 1+ adds this node. Must feel automatic before proceeding.",
     testCode: "assert height(build_tree([])) == 0\nassert height(build_tree([1])) == 1\nassert height(build_tree([1,2,3,4,5])) == 3\nassert height(build_tree([1,None,2,None,None,3])) == 3\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Minimum Depth", pattern: "measurement", skill: "min with leaf trap",
    statement: "Return minimum depth — nodes on SHORTEST root-to-leaf path. A path must end at a LEAF.",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "2", explain: "1→3 has 2 nodes" },
      { input: "tree=[1,null,2]", output: "2", explain: "only 1→2 path, not 1→null" },
    ],
    why: "Same shape as P15 but min instead of max — with a trap: None child contributes 0 making min always 0. A leaf must have NO children; a missing child is not a path.",
    starterCode: "def min_depth(node):\n    pass",
    hints: [
      "Base case: None has depth 0, but a leaf (no children) returns 1.",
      "If one child is None, you MUST go through the other child.",
      "Handle cases: both None→1, one None→1+min_depth(other), both exist→1+min(min_depth(left),min_depth(right))."
    ],
    solution: "def min_depth(node):\n    if node is None:\n        return 0\n    if node.left is None and node.right is None:\n        return 1\n    if node.left is None:\n        return 1 + min_depth(node.right)\n    if node.right is None:\n        return 1 + min_depth(node.left)\n    return 1 + min(min_depth(node.left), min_depth(node.right))",
    walkthrough: "The trap: naive min would always return 0 because min_depth(None)=0. A leaf is where left AND right are None. This 'measurement edge case' is exactly what makes balanced checks tricky.",
     testCode: "assert min_depth(build_tree([])) == 0\nassert min_depth(build_tree([1])) == 1\nassert min_depth(build_tree([1,2,3,4,5])) == 2\nassert min_depth(build_tree([1,None,2,None,None,3])) == 3\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Path Sum Check", pattern: "measurement", skill: "carry running sum downward",
    statement: "Given root and target sum, return True if any root-to-leaf path sums to target.",
    examples: [
      { input: "tree=[5,4,8,11,null,13,4,7,2,null,null,null,1], target=22", output: "True", explain: "5→4→11→2=22" },
      { input: "tree=[1,2,3], target=5", output: "False" },
    ],
    why: "First time passing information DOWN the recursion. The running sum is accumulated as we descend. Contrast with P15 where info flows UP.",
    starterCode: "def has_path_sum(node, target):\n    def dfs(node, current_sum):\n        pass\n    return dfs(node, 0)",
    hints: [
      "Use a helper function. At each node, add node.val to running total.",
      "At a leaf, check if running total equals target.",
      "Recurse left and right with updated total. Return OR of both results."
    ],
    solution: "def has_path_sum(node, target):\n    def dfs(node, cur):\n        if node is None:\n            return False\n        cur += node.val\n        if node.left is None and node.right is None:\n            return cur == target\n        return dfs(node.left, cur) or dfs(node.right, cur)\n    return dfs(node, 0)",
    walkthrough: "New pattern: information flowing DOWNWARD. The helper takes a running total. Each recursive call passes the updated total. At a leaf, compare accumulated total with target. This 'carry a value down' pattern is essential.",
    testCode: "assert has_path_sum(build_tree([5,4,8,11,None,13,4,7,2,None,None,None,1]), 22) == True\nassert has_path_sum(build_tree([1,2,3]), 5) == False\nassert has_path_sum(build_tree([1,2]), 3) == True\nassert has_path_sum(build_tree([]), 0) == False\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Node Level Finder", pattern: "measurement", skill: "return sentinel for not-found",
    statement: "Return the level (root=0) of node with given value. Return -1 if not found.",
    examples: [
      { input: "tree=[3,5,1,6,2], target=5", output: "1" },
      { input: "tree=[3,5,1,6,2], target=9", output: "-1" },
    ],
    why: "Trains the 'return -1 for not found' sentinel pattern. Used in LCA to check if a target exists in a subtree.",
    starterCode: "def find_level(node, target, level=0):\n    pass",
    hints: [
      "Base case: None returns -1 (not found).",
      "If node.val == target, return current level.",
      "Search left first. If found (result != -1), return it. Otherwise search right."
    ],
    solution: "def find_level(node, target, level=0):\n    if node is None:\n        return -1\n    if node.val == target:\n        return level\n    left = find_level(node.left, target, level + 1)\n    if left != -1:\n        return left\n    return find_level(node.right, target, level + 1)",
    walkthrough: "Sentinel pattern: -1 means 'not here'. Found? Return level. Not found left? Try right. If neither found, -1 propagates up. This is the foundation of LCA checking.",
    testCode: "assert find_level(build_tree([3,5,1,6,2]), 5) == 1\nassert find_level(build_tree([3,5,1,6,2]), 9) == -1\nassert find_level(build_tree([3,5,1,6,2]), 3) == 0\nassert find_level(build_tree([]), 1) == -1\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Are All Values Equal (Unival)", pattern: "measurement", skill: "structural AND check",
    statement: "Return True if all nodes in the tree have the same value. Empty tree returns True.",
    examples: [
      { input: "tree=[1,1,1,1,1]", output: "True" },
      { input: "tree=[2,2,2,5,2]", output: "False" },
    ],
    why: "Combines P11 (boolean OR) and structural reasoning. Check: this node equals children AND subtrees are unival.",
    starterCode: "def is_unival(node):\n    pass",
    hints: [
      "Base case: None (empty tree) is vacuously unival — return True.",
      "Check left child: if exists, must match node.val. Same for right.",
      "And both subtrees must be unival themselves."
    ],
    solution: "def is_unival(node):\n    if node is None:\n        return True\n    if node.left and node.left.val != node.val:\n        return False\n    if node.right and node.right.val != node.val:\n        return False\n    return is_unival(node.left) and is_unival(node.right)",
    walkthrough: "Structural AND: check this node's consistency with children, AND that children are themselves consistent. Empty cases are True (vacuously). This pattern of local check + recursive AND is fundamental.",
    testCode: "assert is_unival(build_tree([1,1,1,1,1])) == True\nassert is_unival(build_tree([2,2,2,5,2])) == False\nassert is_unival(build_tree([])) == True\nassert is_unival(build_tree([42])) == True\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Count Full Nodes", pattern: "measurement", skill: "conditional structural count",
    statement: "Return number of full nodes (nodes with both left AND right children).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "2", explain: "nodes 1 and 2 have two children" },
      { input: "tree=[1,2]", output: "0" },
    ],
    why: "Combines P12 (conditional leaf count) with structural check. 1 if full, else 0 (still aggregate children).",
    starterCode: "def count_full(node):\n    pass",
    hints: [
      "Base case: None is 0.",
      "Is this node full? left exists AND right exists.",
      "If full: 1 + count_full(left) + count_full(right). If not: 0 + count_full(left) + count_full(right)."
    ],
    solution: "def count_full(node):\n    if node is None:\n        return 0\n    is_full = 1 if (node.left and node.right) else 0\n    return is_full + count_full(node.left) + count_full(node.right)",
    walkthrough: "Same skeleton as count leaves. The conditional contribution pattern generalizes: contribution = f(node.structure), always recurse on children.",
    testCode: "assert count_full(build_tree([1,2,3,4,5])) == 2\nassert count_full(build_tree([1,2])) == 0\nassert count_full(build_tree([1,2,3])) == 1\nassert count_full(build_tree([])) == 0\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 3, title: "Height + Count in One Pass", pattern: "returning tuples", skill: "return (h, count)",
    statement: "Return BOTH height and total node count in a single recursive function as a tuple (height, count).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "(3, 5)", explain: "height=3, count=5" },
    ],
    why: "CONNECTION: P15 (height) + P8 (count) ran as SEPARATE traversals. Now combine them — one DFS returning a pair. First tuple: both values bubble up together.",
    starterCode: "def height_and_count(node):\n    pass",
    hints: [
      "Base case: None returns (0, 0) — height 0, count 0.",
      "Get (left_h, left_c) and (right_h, right_c) from children.",
      "Return (1 + max(left_h, right_h), 1 + left_c + right_c)."
    ],
    solution: "def height_and_count(node):\n    if node is None:\n        return (0, 0)\n    left_h, left_c = height_and_count(node.left)\n    right_h, right_c = height_and_count(node.right)\n    return (1 + max(left_h, right_h), 1 + left_c + right_c)",
    walkthrough: "The pattern: unpack child results as named variables, compute this node's contribution, re-pack into tuple. This is 'post-order with tuple return' — the pattern that solves LeetCode 110 in O(n).",
    testCode: "assert height_and_count(build_tree([])) == (0, 0)\nassert height_and_count(build_tree([1])) == (1, 1)\nassert height_and_count(build_tree([1,2,3,4,5])) == (3, 5)\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 3, title: "Min + Max in One Pass", pattern: "returning tuples", skill: "return (min, max)",
    statement: "Return BOTH minimum and maximum values in one DFS as tuple (min_val, max_val). Tree is non-empty.",
    examples: [
      { input: "tree=[5,2,8,1,3]", output: "(1, 8)" },
    ],
    why: "Same tuple pattern as P21 but with min/max. Different combine logic, identical skeleton.",
    starterCode: "def min_and_max(node):\n    pass",
    hints: [
      "Base case: non-empty tree means we can return (node.val, node.val) for leaf.",
      "Actually, handle None with sentinel: (float('inf'), float('-inf')).",
      "For this node: min(node.val, left_min, right_min), max(node.val, left_max, right_max)."
    ],
    solution: "def min_and_max(node):\n    if node is None:\n        return (float('inf'), float('-inf'))\n    lmin, lmax = min_and_max(node.left)\n    rmin, rmax = min_and_max(node.right)\n    return (min(node.val, lmin, rmin), max(node.val, lmax, rmax))",
    walkthrough: "Same tuple skeleton as P21. The combine logic changes — min for the first slot, max for the second. The pattern 'base returns identity, unpack children, combine, re-pack' is universal.",
    testCode: "assert min_and_max(build_tree([5,2,8,1,3])) == (1, 8)\nassert min_and_max(build_tree([42])) == (42, 42)\nassert min_and_max(build_tree([-5,-2,-8])) == (-8, -2)\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Height + Is-Balanced ★★", pattern: "returning tuples", skill: "(height, balanced)",
    statement: "Return (height, is_balanced) in one pass. A tree is balanced if left/right heights differ by ≤1 at EVERY node.",
    examples: [
      { input: "tree=[3,9,20,null,null,15,7]", output: "(3, True)", explain: "every node balanced" },
      { input: "tree=[1,2,2,3,3,null,null,4,4]", output: "(4, False)" },
    ],
    why: "★★★ DIRECT PRECURSOR to LeetCode 110. Same tuple pattern as P21 but second slot carries boolean. The combination: balanced = left_child_balanced AND right_child_balanced AND abs(lh-rh) ≤ 1.",
    starterCode: "def check_balanced(node):\n    pass",
    hints: [
      "Base case: None returns (0, True).",
      "Get (lh, lb) and (rh, rb). This node's height = 1 + max(lh, rh).",
      "This node is balanced if lb AND rb AND abs(lh - rh) <= 1."
    ],
    solution: "def check_balanced(node):\n    if node is None:\n        return (0, True)\n    lh, lb = check_balanced(node.left)\n    rh, rb = check_balanced(node.right)\n    h = 1 + max(lh, rh)\n    b = lb and rb and abs(lh - rh) <= 1\n    return (h, b)",
    walkthrough: "THE pattern. Four lines: base returns (0, True), unpack children, compute height (1+max), compute balanced (AND + ≤1 check). This is the one-pass solution. Every node returns both 'what I know about my subtree' and 'am I okay here'.",
    testCode: "assert check_balanced(build_tree([3,9,20,None,None,15,7])) == (3, True)\nassert check_balanced(build_tree([1,2,2,3,3,None,None,4,4])) == (4, False)\nassert check_balanced(build_tree([])) == (0, True)\nassert check_balanced(build_tree([1])) == (1, True)\nassert check_balanced(build_tree([1,2,None,3])) == (3, False)\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Height + Diameter", pattern: "returning tuples", skill: "carry answer + metadata",
    statement: "Return (height, diameter) in one pass. Diameter is longest path between any two nodes (measured in edges).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "(3, 3)", explain: "height=3, diameter=3 (path 4→2→1→3)" },
    ],
    why: "CONNECTION: P21 carried (height, count) — both were local. Now diameter is GLOBAL (not just this subtree). The tuple carries a local value (height) AND a global answer (diameter so far). Critical distinction.",
    starterCode: "def get_diameter(node):\n    pass",
    hints: [
      "Base case: None returns (0, 0) — height 0, diameter 0.",
      "For this node, potential diameter through this node = lh + rh (edges via this node).",
      "Overall diameter = max(lh + rh, left_diameter, right_diameter). Height = 1 + max(lh, rh)."
    ],
    solution: "def get_diameter(node):\n    if node is None:\n        return (0, 0)\n    lh, ld = get_diameter(node.left)\n    rh, rd = get_diameter(node.right)\n    h = 1 + max(lh, rh)\n    d = max(lh + rh, ld, rd)\n    return (h, d)",
    walkthrough: "The tuple carries TWO kinds of info: local (height, bubbled up for parent) and global (diameter, the best answer seen anywhere in this subtree). This local-vs-global distinction is the key insight. Height is for the parent. Diameter is the answer.",
    testCode: "assert get_diameter(build_tree([1,2,3,4,5])) == (3, 3)\nassert get_diameter(build_tree([1,2])) == (2, 1)\nassert get_diameter(build_tree([])) == (0, 0)\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Largest + 2nd Largest", pattern: "returning tuples", skill: "bubble up sorted pair",
    statement: "Return (largest, second_largest) value in non-empty tree. Use one pass.",
    examples: [
      { input: "tree=[5,2,8,1,3]", output: "(8, 5)" },
      { input: "tree=[10,5,15]", output: "(15, 10)" },
    ],
    why: "Tuple slot carries ORDERED data. Need to merge two sorted pairs from children with current node value. Merge logic is the new skill.",
    starterCode: "def top_two(node):\n    pass",
    hints: [
      "Base case: None can return (float('-inf'), float('-inf')).",
      "Collect: [node.val, left_largest, left_second, right_largest, right_second].",
      "Sort descending, take first two."
    ],
    solution: "def top_two(node):\n    if node is None:\n        return (float('-inf'), float('-inf'))\n    a1, a2 = top_two(node.left)\n    b1, b2 = top_two(node.right)\n    nums = [node.val, a1, a2, b1, b2]\n    nums.sort(reverse=True)\n    return (nums[0], nums[1])",
    walkthrough: "Extended tuple merging: child tuples carry sorted pairs. Merge child results with node value. Sort and pick top two. The tuple now carries ORDERED information — each slot has meaning.",
    testCode: "assert top_two(build_tree([5,2,8,1,3])) == (8, 5)\nassert top_two(build_tree([10,5,15])) == (15, 10)\nassert top_two(build_tree([42])) == (42, float('-inf'))\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Height + Is-Perfect", pattern: "returning tuples", skill: "structural tuple check",
    statement: "Return (height, is_perfect). A perfect tree has all levels completely filled (2^h - 1 nodes).",
    examples: [
      { input: "tree=[1,2,3]", output: "(2, True)" },
      { input: "tree=[1,2,3,4]", output: "(3, False)" },
    ],
    why: "Same tuple pattern as P23 but different boolean check. Perfect requires: both subtrees perfect AND same height.",
    starterCode: "def check_perfect(node):\n    pass",
    hints: [
      "Base case: None returns (0, True).",
      "Get (lh, lp) and (rh, rp). This node's height = 1 + max(lh, rh).",
      "Perfect: lp AND rp AND lh == rh (both subtrees must be perfect at same height)."
    ],
    solution: "def check_perfect(node):\n    if node is None:\n        return (0, True)\n    lh, lp = check_perfect(node.left)\n    rh, rp = check_perfect(node.right)\n    return (1 + max(lh, rh), lp and rp and lh == rh)",
    walkthrough: "Same skeleton as P23. Line-by-line: base (0, True), unpack children, height 1+max, boolean = children conditions AND extra structural rule. The pattern is FIXED. Only the boolean rule changes between balanced, perfect, complete, full.",
    testCode: "assert check_perfect(build_tree([1,2,3])) == (2, True)\nassert check_perfect(build_tree([1,2,3,4])) == (3, False)\nassert check_perfect(build_tree([])) == (0, True)\nassert check_perfect(build_tree([1,2,3,4,5,6,7])) == (3, True)\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Sum + Average", pattern: "returning tuples", skill: "post-computation from tuple",
    statement: "Return (total_sum, count) in one pass. Then compute and print the average. Tree may be empty (average = 0).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "(15, 5)\\naverage: 3.0" },
    ],
    why: "Tuple carries RAW data (sum, count). Average is computed AFTER the traversal. Teaches that the tuple carries what traversal discovers; post-processing computes derived values.",
    starterCode: "def sum_and_count(node):\n    pass",
    hints: [
      "Base case: None returns (0, 0).",
      "Tuple: (node.val + left_sum + right_sum, 1 + left_count + right_count).",
      "Print average after calling function: avg = total/count if count > 0."
    ],
    solution: "def sum_and_count(node):\n    if node is None:\n        return (0, 0)\n    ls, lc = sum_and_count(node.left)\n    rs, rc = sum_and_count(node.right)\n    return (node.val + ls + rs, 1 + lc + rc)",
    walkthrough: "Tuple carries raw data from traversal. Average is derived AFTER. Pattern: traversal produces raw data as tuple; post-processing derives answers.",
    testCode: "def compute_avg(tree):\n    s, c = sum_and_count(build_tree(tree))\n    if c == 0:\n        avg = 0\n    else:\n        avg = s / c\n    print(f'average: {avg}')\n    return (s, c)\n\nimport sys,io\nbuf=io.StringIO()\nold=sys.stdout\nsys.stdout=buf\ncompute_avg([1,2,3,4,5])\nsys.stdout=old\nassert '3.0' in buf.getvalue()\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 4, title: "Diameter via Separate Heights (Naive)", pattern: "naive", skill: "feel O(n²) recomputation",
    statement: "Compute diameter by calling a separate height function at every node. This is deliberately O(n²).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "3" },
    ],
    why: "CONNECTION: You know height (P15) and diameter (P24). Now combine them naively: for each node, compute left height + right height. Then recurse for max. Watch the repeated work in the trace.",
    starterCode: "def height(node):\n    if node is None:\n        return 0\n    return 1 + max(height(node.left), height(node.right))\n\ndef diameter_naive(node):\n    pass",
    hints: [
      "At each node: compute left height + right height (path through this node).",
      "Also compute diameter of left and right subtrees.",
      "Return max(path_through_here, left_diameter, right_diameter)."
    ],
    solution: "def diameter_naive(node):\n    if node is None:\n        return 0\n    left_h = height(node.left)\n    right_h = height(node.right)\n    through = left_h + right_h\n    left_d = diameter_naive(node.left)\n    right_d = diameter_naive(node.right)\n    return max(through, left_d, right_d)",
    walkthrough: "This works correctly! But every node calls height() which itself traverses the subtree. So each node's subtree height is computed over and over. For a balanced tree: O(n log n). For skewed: O(n²). This is the waste P24 (one-pass) eliminates.",
    testCode: "assert diameter_naive(build_tree([1,2,3,4,5])) == 3\nassert diameter_naive(build_tree([1,2])) == 1\nassert diameter_naive(build_tree([])) == 0\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 4, title: "Is-Balanced via Separate Heights (Naive)", pattern: "naive", skill: "feel the waste before optimization",
    statement: "Check if tree is balanced by calling a separate height function at every node. This is O(n²).",
    examples: [
      { input: "tree=[3,9,20,null,null,15,7]", output: "True" },
      { input: "tree=[1,2,2,3,3,null,null,4,4]", output: "False" },
    ],
    why: "CONNECTION: P23 does this in O(n) with tuples. Now do it naively — call height per node. This IS what most people write. Then P31 fixes it. The contrast creates the 'aha.'",
    starterCode: "def height(node):\n    if node is None: return 0\n    return 1 + max(height(node.left), height(node.right))\n\ndef is_balanced_naive(node):\n    pass",
    hints: [
      "At each node: get left height and right height.",
      "Check if abs(left_h - right_h) <= 1.",
      "And both left and right subtrees are balanced."
    ],
    solution: "def is_balanced_naive(node):\n    if node is None:\n        return True\n    left_h = height(node.left)\n    right_h = height(node.right)\n    if abs(left_h - right_h) > 1:\n        return False\n    return is_balanced_naive(node.left) and is_balanced_naive(node.right)",
    walkthrough: "Correct but wasteful. Each node calls height(), which traverses its entire subtree. Most nodes near the bottom are walked many times. This is the naive approach the tuple optimization (P31) fixes. Feel the redundancy — each node's height is computed separately for every ancestor.",
    testCode: "assert is_balanced_naive(build_tree([3,9,20,None,None,15,7])) == True\nassert is_balanced_naive(build_tree([1,2,2,3,3,None,None,4,4])) == False\nassert is_balanced_naive(build_tree([])) == True\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Max Sum Root-to-Leaf (Naive)", pattern: "naive", skill: "feel wasted downward-path recomputation",
    statement: "Return the maximum sum from root to any leaf. Do it by generating all root-to-leaf paths and computing their sums — then taking the max. O(n²) approach.",
    examples: [
      { input: "tree=[5,4,8,11,None,13,4,7,2,None,None,None,1]", output: "27", explain: "path 5→4→11→7 = 27" },
      { input: "tree=[1,2,3]", output: "4", explain: "1+3=4" },
    ],
    why: "Same waste pattern as P28/P29. Collect all paths first (O(n²) memory and time), then compute. You're about to see how one-pass downward accumulation eliminates all that work.",
    starterCode: "def max_path_sum_naive(node):\n    def all_paths(node, path, paths):\n        pass\n    paths = []\n    all_paths(node, [], paths)\n    return max(sum(p) for p in paths) if paths else 0",
    hints: [
      "Helper: append node.val to path. If leaf, add path copy to paths list. Otherwise recurse left and right.",
      "After collecting all paths, compute sum(p) for each and take max.",
      "This is O(n²) — each path is stored separately, and each node appears in potentially many paths."
    ],
    solution: "def max_path_sum_naive(node):\n    def all_paths(node, path, paths):\n        if node is None:\n            return\n        path.append(node.val)\n        if node.left is None and node.right is None:\n            paths.append(list(path))\n        else:\n            all_paths(node.left, path, paths)\n            all_paths(node.right, path, paths)\n        path.pop()\n    paths = []\n    all_paths(node, [], paths)\n    return max(sum(p) for p in paths) if paths else 0",
    walkthrough: "Classic brute-force: enumerate all root-to-leaf paths, then score them. The waste: each node's value is copied into every path below it. If the tree is deep, intermediate nodes get copied many times. This sets up the contrast with P31-P34's one-pass approach.",
    testCode: "t = build_tree([5,4,8,11,None,13,4,7,2,None,None,None,1])\nassert max_path_sum_naive(t) == 27\nassert max_path_sum_naive(build_tree([1,2,3])) == 4\nassert max_path_sum_naive(build_tree([1])) == 1\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Sum Root-to-Leaf Numbers (Naive)", pattern: "naive", skill: "path-as-number pattern, brute force",
    statement: "Each root-to-leaf path represents a number (concatenate digits). Return total sum of all path-numbers. Do it by collecting all paths first, then converting.",
    examples: [
      { input: "tree=[1,2,3]", output: "25", explain: "12 + 13 = 25" },
      { input: "tree=[4,9,0,5,1]", output: "1026", explain: "495 + 491 + 40 = 1026" },
    ],
    why: "SAME skeleton as P30 — collect all paths, then process. The operation changes (concatenate→number→sum) but the wasteful collection pattern is identical. One more rep before we eliminate it.",
    starterCode: "def sum_numbers_naive(node):\n    def all_paths(node, path, paths):\n        pass\n    paths = []\n    all_paths(node, [], paths)\n    total = 0\n    for path in paths:\n        num = int(''.join(str(x) for x in path))\n        total += num\n    return total",
    hints: [
      "Copy the all_paths helper from P30 verbatim.",
      "For each collected path, join digits into string, convert to int, add to total.",
      "The helper is identical to P30. Only post-processing changes."
    ],
    solution: "def sum_numbers_naive(node):\n    def all_paths(node, path, paths):\n        if node is None:\n            return\n        path.append(node.val)\n        if node.left is None and node.right is None:\n            paths.append(list(path))\n        else:\n            all_paths(node.left, path, paths)\n            all_paths(node.right, path, paths)\n        path.pop()\n    paths = []\n    all_paths(node, [], paths)\n    total = 0\n    for path in paths:\n        num = int(''.join(str(x) for x in path))\n        total += num\n    return total",
    walkthrough: "Identical helper to P30. The only new idea is post-processing: convert path-list to number via string join. Same wasteful structure — each path stores all its nodes separately. The optimized version (P32) will accumulate the number as we descend.",
    testCode: "assert sum_numbers_naive(build_tree([1,2,3])) == 25\nassert sum_numbers_naive(build_tree([4,9,0,5,1])) == 1026\nassert sum_numbers_naive(build_tree([0,1])) == 1\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 5, title: "Sum Root-to-Leaf Numbers (Optimized)", pattern: "optimization", skill: "carry number downward, accumulate at leaf",
    statement: "Same problem as P31 but in one pass O(n). Carry the number built so far as a parameter. At leaf, add to a totals list.",
    examples: [
      { input: "tree=[1,2,3]", output: "25" },
      { input: "tree=[4,9,0,5,1]", output: "1026" },
    ],
    why: "CONNECTION: P31 collected all paths first. This eliminates the path list entirely. num_so_far = num_so_far * 10 + node.val. The pattern 'carry state downward, accumulate at leaf' is reusable.",
    starterCode: "def sum_numbers(node):\n    def dfs(node, num):\n        pass\n    return dfs(node, 0)",
    hints: [
      "num_so_far = num_so_far * 10 + node.val. At leaf: add num_so_far to total. Not at leaf: recurse with updated num.",
      "Use nonlocal or a list to accumulate total across recursive calls.",
      "One pass, O(n). No path storage needed."
    ],
    solution: "def sum_numbers(node):\n    total = [0]\n    def dfs(node, num):\n        if node is None:\n            return\n        num = num * 10 + node.val\n        if node.left is None and node.right is None:\n            total[0] += num\n            return\n        dfs(node.left, num)\n        dfs(node.right, num)\n    dfs(node, 0)\n    return total[0]",
    walkthrough: "Instead of collecting paths then processing, accumulate the number DURING traversal. num = num*10 + node.val. At leaf, add to total. The 'carry accumulated state downward' pattern eliminates O(n²) path storage. Same skeleton as P33 (good nodes) — carry info from parent to child.",
    testCode: "assert sum_numbers(build_tree([1,2,3])) == 25\nassert sum_numbers(build_tree([4,9,0,5,1])) == 1026\nassert sum_numbers(build_tree([0,1])) == 1\nassert sum_numbers(build_tree([])) == 0\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 5, title: "One-Pass Diameter (Optimized)", pattern: "optimization", skill: "tuples absorb recomputation",
    statement: "Compute diameter in O(n) using a single recursive function returning (height, diameter).",
    examples: [
      { input: "tree=[1,2,3,4,5]", output: "3", explain: "one pass, O(n)" },
    ],
    why: "CONNECTION: P28 was O(n²). This fixes it. Instead of calling height separately at each node, the recursive function returns BOTH height and diameter in one pass. Height flows up for parent; diameter carries the global answer.",
    starterCode: "def diameter_optimized(node):\n    def dfs(node):\n        pass\n    return dfs(node)[1]",
    hints: [
      "Helper returns (height, max_diameter_so_far).",
      "Base case: None returns (0, 0).",
      "h = 1 + max(lh, rh). d = max(lh + rh, ld, rd). Return (h, d)."
    ],
    solution: "def diameter_optimized(node):\n    def dfs(node):\n        if node is None:\n            return (0, 0)\n        lh, ld = dfs(node.left)\n        rh, rd = dfs(node.right)\n        h = 1 + max(lh, rh)\n        d = max(lh + rh, ld, rd)\n        return (h, d)\n    return dfs(node)[1]",
    walkthrough: "The fix: instead of calling height() separately per node (O(n²)), the DFS returns both height and diameter together (O(n)). Same tuple pattern from P24, now the solution to P28's waste. This is the optimization pattern: 'return everything the parent needs in one pass.'",
    testCode: "assert diameter_optimized(build_tree([1,2,3,4,5])) == 3\nassert diameter_optimized(build_tree([1,2])) == 1\nassert diameter_optimized(build_tree([])) == 0\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 5, title: "One-Pass Balanced (Optimized) = LeetCode 110", pattern: "optimization", skill: "THE interview problem",
    statement: "Determine if a binary tree is height-balanced in O(n). A height-balanced tree has left/right subtree heights differing by ≤1 at every node. This is LeetCode 110.",
    examples: [
      { input: "tree=[3,9,20,null,null,15,7]", output: "True" },
      { input: "tree=[1,2,2,3,3,null,null,4,4]", output: "False" },
    ],
    why: "★★★ ARRIVAL. P29 was O(n²). P23 gave the tuple pattern. Now combine: return (height, balanced) in one pass. The 'aha': the redundant height calls in P29 are exactly the information the tuple from P23 already carries. The optimization emerges naturally.",
    starterCode: "def is_balanced(node):\n    def dfs(node):\n        pass\n    return dfs(node)[1]",
    hints: [
      "Helper returns (height, is_balanced). Base: (0, True).",
      "Get (lh, lb) and (rh, rb). This node's height = 1 + max(lh, rh).",
      "Balanced = lb AND rb AND abs(lh - rh) <= 1."
    ],
    solution: "def is_balanced(node):\n    def dfs(node):\n        if node is None:\n            return (0, True)\n        lh, lb = dfs(node.left)\n        rh, rb = dfs(node.right)\n        return (1 + max(lh, rh), lb and rb and abs(lh - rh) <= 1)\n    return dfs(node)[1]",
    walkthrough: "You arrived at LeetCode 110. Not by memorizing 'balanced = ...' — but because P15 taught you height, P23 taught you (height, bool) tuples, P29 made you FEEL the waste, and now the optimization is just combining those tools. The tuple carries height (for parent) AND balanced (the answer). One pass. O(n).",
    testCode: "assert is_balanced(build_tree([3,9,20,None,None,15,7])) == True\nassert is_balanced(build_tree([1,2,2,3,3,None,None,4,4])) == False\nassert is_balanced(build_tree([])) == True\nassert is_balanced(build_tree([1,2,None,3])) == False\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 5, title: "Max Path Sum (Root-to-Node)", pattern: "optimization", skill: "carry max upward",
    statement: "Return maximum sum of values along ANY root-to-node path. Node values can be negative.",
    examples: [
      { input: "tree=[1,2,3]", output: "4", explain: "1→3 = 4" },
      { input: "tree=[-10,5,6]", output: "6", explain: "1→6 = 11? No: -10→6 = -4, best is just node 6" },
    ],
    why: "Same skeleton as height but sum instead of max. The carry-upward pattern: this node's best path = node.val + max(best_left_path, best_right_path, 0). The 'max with 0' handles negatives.",
    starterCode: "def max_path_to_node(node):\n    pass",
    hints: [
      "Base case: None returns 0.",
      "At each node: best extension = max(0, best left path, best right path).",
      "Return node.val + best_extension."
    ],
    solution: "def max_path_to_node(node):\n    if node is None:\n        return 0\n    left_best = max_path_to_node(node.left)\n    right_best = max_path_to_node(node.right)\n    return node.val + max(0, left_best, right_best)",
    walkthrough: "Same DFS skeleton. Key insight: child paths that are negative contribute nothing (max with 0). This node's best = its value + best non-negative child extension. The 1+ becomes node.val+; max becomes selecting best child.",
     testCode: "assert max_path_to_node(build_tree([1,2,3])) == 4\nassert max_path_to_node(build_tree([-10,5,6])) == -4\nassert max_path_to_node(build_tree([5,4,8,11,None,13,4,7,2,None,None,None,1])) == 27\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 5, title: "Count Good Nodes", pattern: "optimization", skill: "carry max-seen downward",
    statement: "Count 'good' nodes: a node is good if its value ≥ max value seen on the path from root. Return count.",
    examples: [
      { input: "tree=[3,1,4,3,null,1,5]", output: "4", explain: "nodes 3,3,4,5 are good" },
    ],
    why: "Switch direction: info flows DOWNWARD (max seen so far). The recursion passes a running max to children. Contrasts with the upward-flow tuple pattern.",
    starterCode: "def good_nodes(node):\n    def dfs(node, max_seen):\n        pass\n    return dfs(node, float('-inf'))",
    hints: [
      "Helper takes (node, max_seen_so_far). Base: None returns 0.",
      "Is this node good? node.val >= max_seen.",
      "Update max_seen = max(max_seen, node.val) for children call."
    ],
    solution: "def good_nodes(node):\n    def dfs(node, max_seen):\n        if node is None:\n            return 0\n        good = 1 if node.val >= max_seen else 0\n        new_max = max(max_seen, node.val)\n        return good + dfs(node.left, new_max) + dfs(node.right, new_max)\n    return dfs(node, float('-inf'))",
    walkthrough: "Information flows DOWN. The helper carries max_seen_so_far. Each node compares itself against the max seen on the path from root. The count flows UP (return value), the constraint flows DOWN (parameter). Both channels used simultaneously.",
    testCode: "assert good_nodes(build_tree([3,1,4,3,None,1,5])) == 4\nassert good_nodes(build_tree([3,3,None,4,2])) == 3\nassert good_nodes(build_tree([1])) == 1\nassert good_nodes(build_tree([])) == 0\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Max Any-to-Any Path Sum (LeetCode 124)", pattern: "optimization", skill: "open vs closed path tuple",
    statement: "Return maximum path sum between ANY two nodes. Path can start and end anywhere. Values can be negative.",
    examples: [
      { input: "tree=[1,2,3]", output: "6", explain: "2→1→3 = 6" },
      { input: "tree=[-10,9,20,null,null,15,7]", output: "42", explain: "15→20→7 = 42" },
    ],
    why: "★★★ The crown jewel. Tuple carries: (max_open_path_from_here, max_closed_path_in_subtree). Open path = usable by parent (single branch). Closed path = answer path (may use both branches). This is P24 (diameter) generalized to weighted nodes.",
    starterCode: "def max_path_sum(node):\n    def dfs(node):\n        pass\n    return dfs(node)[1]",
    hints: [
      "Helper returns (max_open, max_overall). Open = best single-branch path from this node upward.",
      "Base: None returns (0, float('-inf')).",
      "Open = node.val + max(0, left_open, right_open). Overall = max(open, left_overall, right_overall, node.val + max(0,left_open) + max(0,right_open))."
    ],
    solution: "def max_path_sum(node):\n    def dfs(node):\n        if node is None:\n            return (0, float('-inf'))\n        lo, lm = dfs(node.left)\n        ro, rm = dfs(node.right)\n        open_path = node.val + max(0, lo, ro)\n        closed_here = node.val + max(0, lo) + max(0, ro)\n        overall = max(open_path, closed_here, lm, rm)\n        return (open_path, overall)\n    return dfs(node)[1]",
    walkthrough: "The open-vs-closed distinction: 'open_path' is the best SINGLE branch from this node upward (usable by parent). 'closed_here' uses BOTH branches (a complete path, answer candidate). Overall max across subtree. Same tuple pattern. New distinction: what goes in each slot.",
    testCode: "assert max_path_sum(build_tree([1,2,3])) == 6\nassert max_path_sum(build_tree([-10,9,20,None,None,15,7])) == 42\nassert max_path_sum(build_tree([-3])) == -3\nassert max_path_sum(build_tree([2,-1])) == 2\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 6, title: "LCA (Lowest Common Ancestor)", pattern: "mastery", skill: "two-target search + compose",
    statement: "Given root and two node values p and q, return the LCA — deepest node that is ancestor of both.",
    examples: [
      { input: "tree=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=1", output: "3" },
      { input: "tree=[3,5,1,6,2,0,8,null,null,7,4], p=5, q=4", output: "5" },
    ],
    why: "Composes P11 (search), P13 (two-tree recursion), and P18 (sentinel return). Search for p and q. If both found in different subtrees, THIS is the LCA. If both in one subtree, return that subtree's LCA.",
    starterCode: "def lca(node, p, q):\n    pass",
    hints: [
      "Base: None returns None (didn't find either). If node.val == p or q, return node.",
      "Search left and right. If both non-None, this node is LCA.",
      "If only one side found, return that side (bubble up)."
    ],
    solution: "def lca(node, p, q):\n    if node is None or node.val == p or node.val == q:\n        return node\n    left = lca(node.left, p, q)\n    right = lca(node.right, p, q)\n    if left and right:\n        return node\n    return left or right",
    walkthrough: "Four lines. Base: found p/q or hit None. Recurse both sides. If both non-None: this IS the LCA. Otherwise, bubble up whichever side found something. Composes: search + two-recursion + sentinel propagation.",
    testCode: "t = build_tree([3,5,1,6,2,0,8,None,None,7,4])\nassert lca(t, 5, 1).val == 3\nassert lca(t, 5, 4).val == 5\nassert lca(build_tree([1,2]), 1, 2).val == 1\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 6, title: "Symmetric Tree", pattern: "mastery", skill: "mirror-image two-tree recursion",
    statement: "Return True if the tree is symmetric around its center (mirror of itself).",
    examples: [
      { input: "tree=[1,2,2,3,4,4,3]", output: "True" },
      { input: "tree=[1,2,2,null,3,null,3]", output: "False" },
    ],
    why: "Variation of P13 (identical trees) but checking MIRROR instead of clone. Compare left.left with right.right and left.right with right.left.",
    starterCode: "def is_symmetric(node):\n    def mirror(t1, t2):\n        pass\n    if node is None: return True\n    return mirror(node.left, node.right)",
    hints: [
      "Helper checks if t1 is mirror of t2. Base: both None→True, one None→False.",
      "Values must match BUT compare t1.left with t2.right AND t1.right with t2.left.",
      "Pattern: cross-compare instead of parallel-compare."
    ],
    solution: "def is_symmetric(node):\n    def mirror(t1, t2):\n        if t1 is None and t2 is None:\n            return True\n        if t1 is None or t2 is None:\n            return False\n        return t1.val == t2.val and mirror(t1.left, t2.right) and mirror(t1.right, t2.left)\n    if node is None:\n        return True\n    return mirror(node.left, node.right)",
    walkthrough: "Same skeleton as P13 (two-tree) but the recursive calls CROSS: t1.left vs t2.right. This one-line difference is the entire insight. The pattern 'compare two trees' supports identity checks AND mirror checks.",
    testCode: "assert is_symmetric(build_tree([1,2,2,3,4,4,3])) == True\nassert is_symmetric(build_tree([1,2,2,None,3,None,3])) == False\nassert is_symmetric(build_tree([])) == True\nassert is_symmetric(build_tree([1])) == True\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 6, title: "Invert Binary Tree", pattern: "mastery", skill: "swap + recurse",
    statement: "Given root, invert the tree (mirror it) and return the new root. Swap left and right children recursively.",
    examples: [
      { input: "tree=[4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
    ],
    why: "Simply swap children then recurse. Uses preorder skeleton from P8. The swap happens FIRST (before recursion reaches children).",
    starterCode: "def invert_tree(node):\n    pass",
    hints: [
      "Base case: None returns None.",
      "Swap left and right children.",
      "Recurse on both children (the now-swapped ones). Return this node."
    ],
    solution: "def invert_tree(node):\n    if node is None:\n        return None\n    node.left, node.right = node.right, node.left\n    invert_tree(node.left)\n    invert_tree(node.right)\n    return node",
    walkthrough: "Preorder: swap at this node, then recurse. The 'work at this node' is simply swapping pointers. Same traversal skeleton. Different operation at each node.",
    testCode: "def tree_to_list(node):\n    if node is None: return []\n    result=[]\n    q=[node]\n    while q:\n        n=q.pop(0)\n        result.append(n.val)\n        if n.left: q.append(n.left)\n        if n.right: q.append(n.right)\n    return result\n\nt = invert_tree(build_tree([4,2,7,1,3,6,9]))\nvals = tree_to_list(t)\nassert vals == [4,7,2,9,6,3,1], f'Got {vals}'\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 6, title: "Merge Two Trees", pattern: "mastery", skill: "two-tree merge + sum",
    statement: "Given roots of two trees, merge them: overlapping nodes sum values, non-null nodes become the result.",
    examples: [
      { input: "t1=[1,3,2,5], t2=[2,1,3,null,4,null,7]", output: "[3,4,5,5,4,null,7]" },
    ],
    why: "Composes P9 (sum) + P13 (two-tree). At each position: if both exist, sum values; if one exists, use it; if neither, None.",
    starterCode: "def merge_trees(t1, t2):\n    pass",
    hints: [
      "Base: if both None, return None.",
      "If only one exists, return that node.",
      "If both exist: new node = sum of values, recurse on left children and right children."
    ],
    solution: "def merge_trees(t1, t2):\n    if t1 is None:\n        return t2\n    if t2 is None:\n        return t1\n    t1.val += t2.val\n    t1.left = merge_trees(t1.left, t2.left)\n    t1.right = merge_trees(t1.right, t2.right)\n    return t1",
    walkthrough: "Two-tree pattern: handle None cases first (either can be None), then combine. Merge modifies t1 in-place. Same skeleton as P13 but the combine is 'sum' instead of 'compare'.",
    testCode: "m = merge_trees(build_tree([1,3,2,5]), build_tree([2,1,3,None,4,None,7]))\nassert m.val == 3\nassert m.left.val == 4\nassert m.right.val == 5\nassert m.left.left.val == 5\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 6, title: "Subtree Check", pattern: "mastery", skill: "is-same + is-subtree",
    statement: "Given roots s and t, return True if t is a subtree of s (identical structure and values at some node).",
    examples: [
      { input: "s=[3,4,5,1,2], t=[4,1,2]", output: "True" },
      { input: "s=[3,4,5,1,2,null,null,null,null,0], t=[4,1,2]", output: "False" },
    ],
    why: "Composes P13 (identical trees) + P11 (search). At each node: check if t is identical to this subtree. If not, check left and right.",
    starterCode: "def is_subtree(s, t):\n    def is_same(n1, n2):\n        pass\n    pass",
    hints: [
      "Use is_same from P13 as helper.",
      "If s is None: t is not a subtree (unless t is also None).",
      "Check: is_same(s, t) OR is_subtree(s.left, t) OR is_subtree(s.right, t)."
    ],
    solution: "def is_subtree(s, t):\n    def is_same(n1, n2):\n        if n1 is None and n2 is None:\n            return True\n        if n1 is None or n2 is None:\n            return False\n        return n1.val == n2.val and is_same(n1.left, n2.left) and is_same(n1.right, n2.right)\n    if s is None:\n        return False\n    if is_same(s, t):\n        return True\n    return is_subtree(s.left, t) or is_subtree(s.right, t)",
    walkthrough: "Composes: P13 (is_same) as a helper + P11 (OR recursion) to search. At each node of s, check if t starts here. If not, search left and right. Reuse, don't rewrite.",
    testCode: "assert is_subtree(build_tree([3,4,5,1,2]), build_tree([4,1,2])) == True\nassert is_subtree(build_tree([3,4,5,1,2,None,None,None,None,0]), build_tree([4,1,2])) == False\nassert is_subtree(build_tree([]), build_tree([])) == False\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 6, title: "Deepest Leaves Sum", pattern: "mastery", skill: "(depth, sum) tuple + global",
    statement: "Return sum of values of the deepest leaves. If multiple levels are deepest, sum all leaves at max depth.",
    examples: [
      { input: "tree=[1,2,3,4,5,null,6,7,null,null,null,null,8]", output: "15", explain: "deepest leaves: 7 and 8" },
    ],
    why: "Tuple carries (max_depth_in_subtree, sum_at_that_depth). At root, compare left/right max_depths to decide which sum to use.",
    starterCode: "def deepest_leaves_sum(node):\n    def dfs(node, depth):\n        pass\n    return dfs(node, 0)[1]",
    hints: [
      "Helper returns (max_depth_reached, sum_at_that_depth). Base: None returns (0, 0).",
      "At leaf: return (depth, node.val). At internal: compare left/right max depths.",
      "If left deeper: return left. If right deeper: return right. If equal: return (depth, left_sum + right_sum)."
    ],
    solution: "def deepest_leaves_sum(node):\n    def dfs(node, d):\n        if node is None:\n            return (0, 0)\n        if node.left is None and node.right is None:\n            return (d, node.val)\n        ld, ls = dfs(node.left, d + 1)\n        rd, rs = dfs(node.right, d + 1)\n        if ld > rd:\n            return (ld, ls)\n        elif rd > ld:\n            return (rd, rs)\n        else:\n            return (ld, ls + rs)\n    return dfs(node, 0)[1]",
    walkthrough: "Tuple carries (depth, sum). At each node, compare children's max depths. The deeper one's data wins. If equal depth, merge sums. This 'compare child tuples and merge' pattern generalizes P21-P27.",
     testCode: "t=build_tree([1,2,3,4,5,6,6,7,None,None,None,None,8])\nassert deepest_leaves_sum(t) == 15\nassert deepest_leaves_sum(build_tree([6,7,8,2,7,1,3,9,None,1,4,None,None,None,5])) == 19\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Sum of Left Leaves", pattern: "mastery", skill: "conditional + is-left flag",
    statement: "Return sum of all LEFT leaves. A left leaf is a leaf that is the left child of its parent.",
    examples: [
      { input: "tree=[3,9,20,null,null,15,7]", output: "24", explain: "9 + 15 = 24 (left leaves)" },
    ],
    why: "Need to know at each node whether IT is a left child. Pass a flag downward. Composes P12 (conditional leaf) + P17 (carry info down).",
    starterCode: "def sum_left_leaves(node):\n    def dfs(node, is_left):\n        pass\n    return dfs(node, False)",
    hints: [
      "Helper takes (node, is_left). Base: None returns 0.",
      "If leaf AND is_left: return node.val.",
      "If leaf but NOT is_left: return 0 (right leaf, don't count). Internal: recurse with is_left=True for left, False for right."
    ],
    solution: "def sum_left_leaves(node):\n    def dfs(node, is_left):\n        if node is None:\n            return 0\n        if node.left is None and node.right is None:\n            return node.val if is_left else 0\n        return dfs(node.left, True) + dfs(node.right, False)\n    return dfs(node, False)",
    walkthrough: "Information flows DOWN (is_left flag) while sum flows UP. The flag tells each node its relationship to its parent. Only left-side leaves contribute. Pattern: flag passes context down, aggregation flows up.",
    testCode: "assert sum_left_leaves(build_tree([3,9,20,None,None,15,7])) == 24\nassert sum_left_leaves(build_tree([1])) == 0  # single root, not a left child\nassert sum_left_leaves(build_tree([1,2,3,4,5])) == 4\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Most Frequent Subtree Sum", pattern: "mastery", skill: "tuple + hashmap aggregation",
    statement: "Return the most frequent subtree sum. Subtree sum = sum of all nodes in subtree. Break ties arbitrarily.",
    examples: [
      { input: "tree=[5,2,-3]", output: "[2, -3, 4]", explain: "subtree sums: 2, -3, 4 — all appear once" },
      { input: "tree=[5,2,-5]", output: "[2]", explain: "sums: 2, -5, 2 — 2 appears twice" },
    ],
    why: "Composes P9 (sum) + external hashmap. DFS returns (sum_at_subtree) and writes to a global frequency map. Post-traversal find max frequency.",
    starterCode: "def find_frequent_tree_sum(node):\n    freq = {}\n    def dfs(node):\n        pass\n    dfs(node)\n    pass  # find max frequency and return values",
    hints: [
      "DFS returns subtree sum. Uses same pattern as P9: node.val + left + right.",
      "After computing sum, add to frequency dict.",
      "After traversal, find max frequency, return all sums with that frequency."
    ],
    solution: "def find_frequent_tree_sum(node):\n    freq = {}\n    def dfs(node):\n        if node is None:\n            return 0\n        total = node.val + dfs(node.left) + dfs(node.right)\n        freq[total] = freq.get(total, 0) + 1\n        return total\n    dfs(node)\n    if not freq:\n        return []\n    max_f = max(freq.values())\n    return [s for s, f in freq.items() if f == max_f]\n    return result",
    walkthrough: "DFS returns the sum (upward flow). But ALSO writes to external hashmap (side effect). After traversal, analyze the map. Pattern: traversal produces raw data; post-processing derives the answer.",
    testCode: "r = find_frequent_tree_sum(build_tree([5,2,-3]))\nassert sorted(r) == [-3, 2, 4]\nr2 = find_frequent_tree_sum(build_tree([5,2,-5]))\nassert sorted(r2) == [2]\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Distance Between Two Nodes", pattern: "mastery", skill: "LCA + depth = distance",
    statement: "Return number of edges between two nodes with given values. Use LCA: dist(a,b) = depth(a) + depth(b) - 2*depth(lca).",
    examples: [
      { input: "tree=[3,5,1,6,2,0,8], a=5, b=0", output: "3" },
    ],
    why: "Composes P35 (LCA) + P15 (height/depth). Distance is a property of the LCA. depth(a) + depth(b) - 2*depth(lca). The LCA is the hinge.",
    starterCode: "def distance(node, a, b):\n    # Find LCA first, then compute depth of each from LCA\n    def find_lca(node, a, b):\n        pass\n    def depth_from(node, target, d=0):\n        pass\n    pass",
    hints: [
      "Find LCA using same logic as P35.",
      "Compute depth of a from LCA and depth of b from LCA.",
      "Return depth_a + depth_b."
    ],
    solution: "def distance(node, a, b):\n    def lca(node, a, b):\n        if node is None or node.val == a or node.val == b:\n            return node\n        left = lca(node.left, a, b)\n        right = lca(node.right, a, b)\n        if left and right:\n            return node\n        return left or right\n    def dist(node, target, d):\n        if node is None:\n            return -1\n        if node.val == target:\n            return d\n        left = dist(node.left, target, d + 1)\n        if left != -1:\n            return left\n        return dist(node.right, target, d + 1)\n    ancestor = lca(node, a, b)\n    if ancestor is None:\n        return -1\n    return dist(ancestor, a, 0) + dist(ancestor, b, 0)",
    walkthrough: "Compose: P35 (LCA) as helper + P18 (find-level) variant. The insight: distance between two nodes in a tree = their distance from their LCA summed. LCA is found via two-side search; distance is found via depth computation.",
    testCode: "t = build_tree([3,5,1,6,2,0,8,None,None,7,4])\nassert distance(t, 5, 0) == 3\nassert distance(t, 5, 7) == 2\nassert distance(t, 3, 3) == 0\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Longest ZigZag Path", pattern: "mastery", skill: "direction-state tuple",
    statement: "Return longest ZigZag path length. A ZigZag alternates left→right→left or right→left→right. Start anywhere.",
    examples: [
      { input: "tree=[1,null,1,1,1,null,null,1,1,null,1,null,null,null,1]", output: "3" },
    ],
    why: "Tuple carries (zig, zag) — best paths ending here coming from left (zag) or right (zig). Direction toggle: left child extends parent's right-direction path.",
    starterCode: "def longest_zigzag(node):\n    def dfs(node):\n        pass\n    return dfs(node)[2] if node else 0",
    hints: [
      "Helper returns (zig, zag, best_overall). zig = best path ending here from a 'went right' step.",
      "Going left: this node extends parent's 'zag' path -> new zig. Going right: extends 'zig' -> new zag.",
      "Best overall tracks max across all nodes."
    ],
    solution: "def longest_zigzag(node):\n    def dfs(node):\n        if node is None:\n            return (0, 0, 0)\n        lz, lo, lb = dfs(node.left)\n        rz, ro, rb = dfs(node.right)\n        zig = lo + 1\n        zag = rz + 1\n        best = max(zig, zag, lb, rb)\n        return (zig, zag, best)\n    return dfs(node)[2]",
    walkthrough: "Tuple: (zig, zag, best). When going LEFT from a node, we pass the 'zag' value (parent came from opposite direction) +1. The direction toggles at each step. Same tuple pattern, new slot meanings.",
    testCode: "t = build_tree([1,None,2,3,4,None,None,5,None,None,6])\nassert longest_zigzag(t) >= 0\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "All Nodes at Distance K", pattern: "mastery", skill: "parent map + BFS from target",
    statement: "Return list of all node values at distance K from target node. Can move up or down the tree.",
    examples: [
      { input: "tree=[3,5,1,6,2,0,8,null,null,7,4], target=5, k=2", output: "[7,4,1]" },
    ],
    why: "Breaks the tree pattern: need to move UP too. Build a parent map (DFS) then BFS from target. Crosses between Trees and Graphs topics.",
    starterCode: "def distance_k(node, target_val, k):\n    # Step 1: DFS to build parent map and find target\n    # Step 2: BFS from target to find nodes at distance k\n    pass",
    hints: [
      "DFS to build parent map: dict mapping node -> parent. Also find target node by value.",
      "BFS from target: queue holds (node, distance). Track visited.",
      "When distance == k, collect node values. BFS goes to left, right, AND parent."
    ],
    solution: "def distance_k(node, target_val, k):\n    parent = {}\n    target_node = None\n    def dfs(node, par):\n        nonlocal target_node\n        if node is None:\n            return\n        parent[node] = par\n        if node.val == target_val:\n            target_node = node\n        dfs(node.left, node)\n        dfs(node.right, node)\n    dfs(node, None)\n    if target_node is None:\n        return []\n    result = []\n    visited = set()\n    q = [(target_node, 0)]\n    visited.add(target_node)\n    while q:\n        cur, dist = q.pop(0)\n        if dist == k:\n            result.append(cur.val)\n            continue\n        for nei in [cur.left, cur.right, parent.get(cur)]:\n            if nei and nei not in visited:\n                visited.add(nei)\n                q.append((nei, dist + 1))\n    return result",
    walkthrough: "Crosses boundaries: DFS for parent map (tree traversal), BFS for distance search (graph BFS). The tree becomes a graph by adding parent edges. Composes: DFS + BFS + visited set.",
    testCode: "t = build_tree([3,5,1,6,2,0,8,None,None,7,4])\nr = distance_k(t, 5, 2)\nassert sorted(r) == sorted([7,4,1])\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Flatten Tree to Linked List", pattern: "mastery", skill: "preorder relink",
    statement: "Flatten tree into a right-leaning linked list using the right pointers. Left pointers become None.",
    examples: [
      { input: "tree=[1,2,5,3,4,null,6]", output: "[1,null,2,null,3,null,4,null,5,null,6]" },
    ],
    why: "Morph tree into list. Post-order: flatten left, save right tail, attach left to right of node, append right tail. Composes pointer manipulation.",
    starterCode: "def flatten(node):\n    pass",
    hints: [
      "Recurse: flatten left, flatten right.",
      "Save right child. Move flattened left to right pointer.",
      "Walk to end of new right chain, attach saved right child."
    ],
    solution: "def flatten(node):\n    if node is None:\n        return\n    flatten(node.left)\n    flatten(node.right)\n    right_saved = node.right\n    node.right = node.left\n    node.left = None\n    cur = node\n    while cur.right:\n        cur = cur.right\n    cur.right = right_saved",
    walkthrough: "Post-order: flatten children first, then rewire. Left becomes right. Walk to end of the new right chain. Attach original right. Uses traversal (DFS) + pointer surgery.",
    testCode: "t = build_tree([1,2,5,3,4,None,6])\nflatten(t)\ncur = t\nvals = []\nwhile cur:\n    vals.append(cur.val)\n    assert cur.left is None\n    cur = cur.right\nassert vals == [1,2,3,4,5,6]\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Trim BST", pattern: "mastery", skill: "range pruning by recursion",
    statement: "Given root and [low, high], trim the BST so all nodes are in range. Return new root.",
    examples: [
      { input: "tree=[1,0,2], low=1, high=2", output: "[1,null,2]" },
      { input: "tree=[3,0,4,null,2,null,null,1], low=1, high=3", output: "[3,2,null,1]" },
    ],
    why: "Uses BST property: if node too small, discard left (and node). Return trim of right. If too big, discard right. Return trim of left.",
    starterCode: "def trim_bst(node, low, high):\n    pass",
    hints: [
      "Base case: None returns None.",
      "If node.val < low: this node and its left are too small. Return trim_bst(node.right, low, high).",
      "If node.val > high: this node and its right are too big. Return trim_bst(node.left, low, high). Otherwise: trim both children, return node."
    ],
    solution: "def trim_bst(node, low, high):\n    if node is None:\n        return None\n    if node.val < low:\n        return trim_bst(node.right, low, high)\n    if node.val > high:\n        return trim_bst(node.left, low, high)\n    node.left = trim_bst(node.left, low, high)\n    node.right = trim_bst(node.right, low, high)\n    return node",
    walkthrough: "BST property enables pruning: if node is out of range, entire subtree on one side is also out. Recursive pruning by range. Reassign left/right to trimmed versions.",
    testCode: "t = trim_bst(build_tree([1,0,2]), 1, 2)\nassert t.val == 1\nassert t.left is None\nassert t.right.val == 2\nt2 = trim_bst(build_tree([3,0,4,None,2,None,None,1]), 1, 3)\nassert t2.val == 3\nassert t2.right is None\nassert t2.left.val == 2\nprint('All tests passed!')"
  },
]

// Helper: build tree from level-order array for testing
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

def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))
`
