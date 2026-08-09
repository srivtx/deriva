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

export const STAGES_BST = [
  { id: 0, name: "Elimination Reflex", desc: "binary search on arrays" },
  { id: 1, name: "Ordering Invariant", desc: "BST property" },
  { id: 2, name: "The Range Idea", desc: "information flows down" },
  { id: 3, name: "Inorder = Sorted", desc: "the traversal the invariant buys" },
  { id: 4, name: "Naive", desc: "dump to array" },
  { id: 5, name: "Optimization", desc: "early exit" },
  { id: 6, name: "Mastery", desc: "compose" },
]

export const PROBLEMS_BST: Problem[] = [
  // ── STAGE 0: Elimination Reflex ──
  {
    id: 1, stage: 0, title: "Binary Search — Find Target", pattern: "binary search", skill: "eliminate half per step",
    statement: "Given a sorted array arr and a target integer, return the index of target if found, otherwise return -1. Use binary search — compare mid, eliminate half.",
    examples: [
      { input: "arr = [1,3,5,7,9], target = 5", output: "2" },
      { input: "arr = [2,4,6,8,10], target = 7", output: "-1" },
      { input: "arr = [1], target = 1", output: "0" },
    ],
    why: "Sorting is the invitation. Mid splits the world: target is either here, left, or right. Each check eliminates half the search space — the defining move of this entire topic.",
    starterCode: "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    pass",
    hints: [
      "What are the three possibilities when you compare arr[mid] to target?",
      "If arr[mid] == target, you're done. If target < arr[mid], eliminate the right half. Else eliminate the left half.",
      "while left <= right: mid = (left + right) // 2; compare and adjust pointers."
    ],
    solution: "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
    walkthrough: "Three questions per iteration: (1) did we land on target? return. (2) is target bigger? discard left half by moving left past mid. (3) is target smaller? discard right half by moving right before mid. The loop invariant: if target exists, it's in arr[left..right].",
    testCode: "assert binary_search([1,3,5,7,9], 5) == 2\nassert binary_search([2,4,6,8,10], 7) == -1\nassert binary_search([1], 1) == 0\nassert binary_search([1,2,3,4,5], 1) == 0\nassert binary_search([1,2,3,4,5], 5) == 4\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "First Occurrence", pattern: "binary search", skill: "continue left after finding",
    statement: "Given a sorted array arr with possible duplicates, return the index of the FIRST occurrence of target. Return -1 if not found.",
    examples: [
      { input: "arr = [1,2,2,2,3,4], target = 2", output: "1" },
      { input: "arr = [3,3,3,3], target = 3", output: "0" },
      { input: "arr = [1,4,9], target = 5", output: "-1" },
    ],
    why: "Same skeleton as P1. The single new idea: when you find target, don't return yet — the first occurrence could be further left. Narrow right to mid-1 and keep going.",
    starterCode: "def first_occurrence(arr, target):\n    left, right = 0, len(arr) - 1\n    result = -1\n    pass",
    hints: [
      "When arr[mid] == target, could there be an earlier occurrence? What should you do with the right boundary?",
      "Record mid as a candidate result, then set right = mid - 1 to keep searching left.",
      "The only change from P1: on equality, save result, continue left. Loop condition unchanged."
    ],
    solution: "def first_occurrence(arr, target):\n    left, right = 0, len(arr) - 1\n    result = -1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            result = mid\n            right = mid - 1\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return result",
    walkthrough: "Identical skeleton to P1 with one twist: instead of returning on equality, you save the position and continue the search leftward. The result variable tracks the best candidate so far. When the loop exhausts, the last saved candidate is the first occurrence.",
    testCode: "assert first_occurrence([1,2,2,2,3,4], 2) == 1\nassert first_occurrence([3,3,3,3], 3) == 0\nassert first_occurrence([1,4,9], 5) == -1\nassert first_occurrence([2,2,2], 2) == 0\nassert first_occurrence([1,2,3], 2) == 1\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Last Occurrence", pattern: "binary search", skill: "continue right after finding",
    statement: "Given a sorted array arr with possible duplicates, return the index of the LAST occurrence of target. Return -1 if not found.",
    examples: [
      { input: "arr = [1,2,2,2,3,4], target = 2", output: "3" },
      { input: "arr = [3,3,3,3], target = 3", output: "3" },
      { input: "arr = [1,4,9], target = 5", output: "-1" },
    ],
    why: "Mirror of P2. The mental model is identical — the only delta is which direction you continue searching after a match. Automaticity on the skeleton frees cognitive load for the one new decision.",
    starterCode: "def last_occurrence(arr, target):\n    left, right = 0, len(arr) - 1\n    result = -1\n    pass",
    hints: [
      "When arr[mid] == target, could there be a later occurrence? What boundary should you adjust?",
      "Record mid as a candidate, then set left = mid + 1 to keep searching right.",
      "Everything except the equality branch is identical to P1. The direction flips from left to right."
    ],
    solution: "def last_occurrence(arr, target):\n    left, right = 0, len(arr) - 1\n    result = -1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            result = mid\n            left = mid + 1\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return result",
    walkthrough: "Same frame, opposite direction. Instead of tightening right on match (looking left), tighten left (looking right). The skeleton is now automatic — the only cognitive work is 'which direction after a hit?'",
    testCode: "assert last_occurrence([1,2,2,2,3,4], 2) == 3\nassert last_occurrence([3,3,3,3], 3) == 3\nassert last_occurrence([1,4,9], 5) == -1\nassert last_occurrence([2,2,2], 2) == 2\nassert last_occurrence([1,2,3], 2) == 1\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Insert Position", pattern: "binary search", skill: "left pointer finds insertion index",
    statement: "Given a sorted array of distinct integers and a target, return the index where target would be inserted to maintain sorted order. Return the index if target already exists.",
    examples: [
      { input: "arr = [1,3,5,6], target = 5", output: "2" },
      { input: "arr = [1,3,5,6], target = 2", output: "1" },
      { input: "arr = [1,3,5,6], target = 7", output: "4" },
    ],
    why: "Eliminates the equality branch entirely. After the loop, left IS the insert position — whether target exists or not. The loop invariant guarantees it.",
    starterCode: "def insert_position(arr, target):\n    left, right = 0, len(arr) - 1\n    pass",
    hints: [
      "What does left represent after the loop terminates? Trace with a pen: search for 2 in [1,3,5].",
      "No equality check needed. If target <= arr[mid], go left. If target > arr[mid], go right.",
      "The loop invariant: all elements < target are before left. After loop, left is the answer."
    ],
    solution: "def insert_position(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return left",
    walkthrough: "No early return — run the full binary search. When the loop exits, left is the first index where arr[left] >= target. That's exactly where you'd insert. Trace: [1,3,5], target=2. left=0,right=2; mid=1, arr[1]=3, 3>=2, right=0; mid=0, arr[0]=1, 1<2, left=1; loop ends; left=1. 2 goes at index 1.",
    testCode: "assert insert_position([1,3,5,6], 5) == 2\nassert insert_position([1,3,5,6], 2) == 1\nassert insert_position([1,3,5,6], 7) == 4\nassert insert_position([1,3,5,6], 0) == 0\nassert insert_position([], 1) == 0\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Find Minimum in Rotated Sorted Array", pattern: "binary search", skill: "compare mid with rightmost",
    statement: "A sorted array was rotated at an unknown pivot. Given the rotated array of unique elements, find the minimum element in O(log n).",
    examples: [
      { input: "arr = [3,4,5,1,2]", output: "1" },
      { input: "arr = [4,5,6,7,0,1,2]", output: "0" },
      { input: "arr = [11,13,15,17]", output: "11", explain: "no rotation" },
    ],
    why: "Binary search on a broken sorting. The invariant shifts: compare mid with rightmost to determine which half contains the discontinuity — and therefore the minimum.",
    starterCode: "def find_min(arr):\n    left, right = 0, len(arr) - 1\n    pass",
    hints: [
      "Compare arr[mid] with arr[right]. What does arr[mid] > arr[right] tell you about where the fold is?",
      "If arr[mid] > arr[right], the min must be in the right half. Otherwise, min is in the left half (including mid).",
      "Stop when left == right. At each step: if arr[mid] > arr[right], left = mid + 1; else right = mid."
    ],
    solution: "def find_min(arr):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        mid = (left + right) // 2\n        if arr[mid] > arr[right]:\n            left = mid + 1\n        else:\n            right = mid\n    return arr[left]",
    walkthrough: "Compare mid against the right boundary, not the target. If arr[mid] > arr[right], the rotation 'fold' sits between mid and right — the minimum is to the right. If arr[mid] <= arr[right], the segment arr[mid..right] is sorted and the minimum is at or left of mid. The loop narrows to a single candidate.",
    testCode: "assert find_min([3,4,5,1,2]) == 1\nassert find_min([4,5,6,7,0,1,2]) == 0\nassert find_min([11,13,15,17]) == 11\nassert find_min([2,1]) == 1\nassert find_min([1]) == 1\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Search in Rotated Sorted Array", pattern: "binary search", skill: "detect sorted half, search it",
    statement: "A sorted array of unique elements was rotated at an unknown pivot. Return the index of target or -1. Must be O(log n).",
    examples: [
      { input: "arr = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "arr = [4,5,6,7,0,1,2], target = 3", output: "-1" },
    ],
    why: "Combines P5's 'find the sorted half' reflex with P1's elimination. At each step, determine which half is sorted and whether target lies inside it.",
    starterCode: "def search_rotated(arr, target):\n    left, right = 0, len(arr) - 1\n    pass",
    hints: [
      "First, identify which half is sorted by comparing arr[mid] to arr[left].",
      "If the left half is sorted: check if target is inside [arr[left], arr[mid]). If yes, search left; else search right.",
      "If the right half is sorted: check if target is inside (arr[mid], arr[right]]. If yes, search right; else search left."
    ],
    solution: "def search_rotated(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        if arr[left] <= arr[mid]:\n            if arr[left] <= target < arr[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:\n            if arr[mid] < target <= arr[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    return -1",
    walkthrough: "Two questions per iteration: (1) Which half is sorted? Compare arr[left] to arr[mid]. (2) Does target fall in the sorted half's range? If yes, discard the unsorted half. If no, discard the sorted half. The sorted half gives a clean range check; the unsorted half gives nothing, so eliminate it.",
    testCode: "assert search_rotated([4,5,6,7,0,1,2], 0) == 4\nassert search_rotated([4,5,6,7,0,1,2], 3) == -1\nassert search_rotated([1], 0) == -1\nassert search_rotated([3,1], 1) == 1\nassert search_rotated([5,1,2,3,4], 1) == 1\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Find Peak Element", pattern: "binary search", skill: "follow the uphill gradient",
    statement: "Given an array where arr[i] != arr[i+1] for all i, return the index of any peak — an element greater than both neighbors. Edges count as -infinity neighbors. Must be O(log n).",
    examples: [
      { input: "arr = [1,2,3,1]", output: "2", explain: "3 is a peak" },
      { input: "arr = [1,2,1,3,5,6,4]", output: "5 or 1", explain: "6 or 2 are peaks" },
    ],
    why: "Binary search on a gradient. Compare mid with its neighbor. The larger side MUST contain a peak. Follow the uphill direction — the invariant guarantees convergence.",
    starterCode: "def find_peak(arr):\n    left, right = 0, len(arr) - 1\n    pass",
    hints: [
      "Compare arr[mid] with arr[mid+1]. If arr[mid] > arr[mid+1], which direction is the gradient going?",
      "If arr[mid] > arr[mid+1], you're on a downward slope — peak is at or left of mid. Set right = mid.",
      "If arr[mid] < arr[mid+1], you're on an upward slope — peak is right of mid. Set left = mid + 1."
    ],
    solution: "def find_peak(arr):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        mid = (left + right) // 2\n        if arr[mid] > arr[mid + 1]:\n            right = mid\n        else:\n            left = mid + 1\n    return left",
    walkthrough: "No target value — the target is the *shape* of the data. At each step, compare arr[mid] to arr[mid+1]. If mid is on a down-slope (arr[mid] > arr[mid+1]), the peak is to the left. If on an up-slope, peak is to the right. Binary search on the derivative: following d(arr)/di to its zero-crossing.",
    testCode: "r = find_peak([1,2,3,1]); assert r == 2\nr = find_peak([1,2,1,3,5,6,4]); assert r in (1, 5)\nr = find_peak([1,2,3,4,5]); assert r == 4\nr = find_peak([5,4,3,2,1]); assert r == 0\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Insert into BST", pattern: "BST recursion", skill: "recurse left/right, attach",
    statement: "Given the root of a BST and a value, insert the value into the BST maintaining the BST property. Return the root. Assume no duplicates.",
    examples: [{ input: "tree = [4,2,7,1,3], val = 5", output: "[4,2,7,1,3,5]" }, { input: "tree = [], val = 5", output: "[5]" }],
    why: "Stage 0 taught elimination on arrays. This is elimination on a tree: at each node, compare val to node.val to decide left or right. The recursion mirrors the binary search branching.",
    starterCode: "def insert_into_bst(root, val):\n    pass",
    hints: ["What happens when you reach a None child? That's where the new node goes.", "If val < root.val, the insert happens in the left subtree. Reassign root.left to the result.", "Recurse: insert into the correct subtree. On the way up, return root (which may have had a child reassigned)."],
    solution: "def insert_into_bst(root, val):\n    if root is None:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert_into_bst(root.left, val)\n    else:\n        root.right = insert_into_bst(root.right, val)\n    return root",
    walkthrough: "The BST ordering converts an array binary search into a tree navigation. At None, you've found the insertion point — create a new node. Otherwise, the BST property tells you exactly which child to descend into.",
    testCode: "t = insert_into_bst(None, 5)\nassert t.val == 5\nt = insert_into_bst(t, 3)\nassert t.left.val == 3\nt = insert_into_bst(t, 8)\nassert t.right.val == 8\nt = insert_into_bst(build_tree([4,2,7,1,3]), 5)\nassert t.right.left.val == 5\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Search BST", pattern: "BST recursion", skill: "binary search on tree",
    statement: "Given the root of a BST and a target value, return the TreeNode if found. Return None if not found.",
    examples: [{ input: "tree = [4,2,7,1,3], target = 2", output: "TreeNode(2)" }, { input: "tree = [4,2,7,1,3], target = 5", output: "None" }],
    why: "Same binary decision as P8 (insert). The ordering invariant says: target < node.val means target can only be in the left subtree, and vice versa.",
    starterCode: "def search_bst(root, val):\n    pass",
    hints: ["What are the three possibilities when you compare val to root.val?", "If val == root.val, return root. If val < root.val, search left. Otherwise, search right.", "Base case: if root is None, val is not in the tree — return None."],
    solution: "def search_bst(root, val):\n    if root is None:\n        return None\n    if root.val == val:\n        return root\n    if val < root.val:\n        return search_bst(root.left, val)\n    return search_bst(root.right, val)",
    walkthrough: "Exactly the three-way decision from binary search, now in tree form. At each node: found it? return. Too small? go right. Too big? go left. The None base case means the value doesn't exist in this subtree.",
    testCode: "t = build_tree([4,2,7,1,3])\nassert search_bst(t, 2).val == 2\nassert search_bst(t, 4).val == 4\nassert search_bst(t, 5) is None\nassert search_bst(None, 1) is None\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Find Minimum in BST", pattern: "BST walk", skill: "go left until None",
    statement: "Given the root of a BST, return the minimum value in the tree. Do NOT traverse the entire tree — use the BST property.",
    examples: [{ input: "tree = [4,2,7,1,3]", output: "1" }, { input: "tree = [10,5,15]", output: "5" }],
    why: "The ordering invariant guarantees: the smallest value lives at the leftmost node. Every left turn reaches a smaller value. No scanning needed.",
    starterCode: "def find_min_bst(root):\n    pass",
    hints: ["If there's a left child, could that value be smaller than root? What does the BST property say?", "The minimum is at the end of the chain of left children.", "Iterate: while cur.left is not None, cur = cur.left. Return cur.val."],
    solution: "def find_min_bst(root):\n    if root is None:\n        return None\n    cur = root\n    while cur.left:\n        cur = cur.left\n    return cur.val",
    walkthrough: "The BST invariant (left < root < right) means every left step guarantees a smaller value. Walk left until you can't — you've found the minimum. If you ever go right, you'd jump to a larger value.",
    testCode: "assert find_min_bst(build_tree([4,2,7,1,3])) == 1\nassert find_min_bst(build_tree([10,5,15])) == 5\nassert find_min_bst(build_tree([5])) == 5\nassert find_min_bst(build_tree([5,None,8])) == 5\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Find Maximum in BST", pattern: "BST walk", skill: "go right until None",
    statement: "Given the root of a BST, return the maximum value in the tree. Use the BST property — do not traverse the whole tree.",
    examples: [{ input: "tree = [4,2,7,1,3]", output: "7" }, { input: "tree = [10,5,15,None,None,12,20]", output: "20" }],
    why: "Mirror of P10. Same idea, opposite direction. The ordering invariant means right = larger. Walk right to find max.",
    starterCode: "def find_max_bst(root):\n    pass",
    hints: ["If there's a right child, could that value be larger than root?", "The maximum is at the end of the chain of right children.", "while cur.right: cur = cur.right. Return cur.val."],
    solution: "def find_max_bst(root):\n    if root is None:\n        return None\n    cur = root\n    while cur.right:\n        cur = cur.right\n    return cur.val",
    walkthrough: "Symmetric to P10. Go right as long as there is a right child. Each right step guarantees a larger value by the BST property. When there's no more right, you're at the maximum.",
    testCode: "assert find_max_bst(build_tree([4,2,7,1,3])) == 7\nassert find_max_bst(build_tree([10,5,15,None,None,12,20])) == 20\nassert find_max_bst(build_tree([5])) == 5\nassert find_max_bst(build_tree([5,3])) == 5\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Range Sum in BST", pattern: "BST pruning", skill: "skip irrelevant subtrees",
    statement: "Given a BST root and [low, high], return the sum of all node values within the range. Use the BST property to skip entire subtrees.",
    examples: [{ input: "tree = [10,5,15,3,7,None,18], low = 7, high = 15", output: "32", explain: "10 + 7 + 15 = 32" }, { input: "tree = [10,5,15,3,7,13,18,1,None,6], low = 6, high = 10", output: "23", explain: "6+7+10=23" }],
    why: "P10-P11 showed you can exploit ordering to skip nodes. This is the first combination: for each node, the invariant tells you whether to include it AND whether to skip entire subtrees.",
    starterCode: "def range_sum_bst(root, low, high):\n    pass",
    hints: ["If root.val < low, the entire left subtree is below the range too. Where might in-range values be?", "If root.val > high, the entire right subtree is above the range. Only the left subtree matters.", "Three cases: too small -> skip left, recurse right. Too big -> skip right, recurse left. In range -> add, recurse both."],
    solution: "def range_sum_bst(root, low, high):\n    if root is None:\n        return 0\n    if root.val < low:\n        return range_sum_bst(root.right, low, high)\n    if root.val > high:\n        return range_sum_bst(root.left, low, high)\n    return root.val + range_sum_bst(root.left, low, high) + range_sum_bst(root.right, low, high)",
    walkthrough: "The BST invariant enables pruning: if the current node is below the range, everything in the left subtree is also below. Skip it. If above the range, skip the right subtree. Only when the node is in range do you sum it and explore both sides.",
    testCode: "t = build_tree([10,5,15,3,7,None,18])\nassert range_sum_bst(t, 7, 15) == 32\nassert range_sum_bst(t, 3, 7) == 15\nassert range_sum_bst(t, 20, 30) == 0\nt2 = build_tree([10,5,15,3,7,13,18,1,None,6])\nassert range_sum_bst(t2, 6, 10) == 23\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Closest Value in BST", pattern: "BST walk", skill: "track best during binary walk",
    statement: "Given a BST root and a float target, return the node value closest to target. Use the BST property to walk toward target, tracking the best candidate.",
    examples: [{ input: "tree = [4,2,7,1,3], target = 3.7", output: "4" }, { input: "tree = [4,2,7,1,3], target = 2.2", output: "2" }],
    why: "Each step chooses left or right based on target vs node.val — the same binary search walk as P9. But you can't stop early: the closest value might be on a path you traverse. Track the best en route.",
    starterCode: "def closest_value(root, target):\n    pass",
    hints: ["Start with closest = root.val. At each step, if the current node is closer to target, update closest.", "Which direction do you go? If target < node.val, go left. If target > node.val, go right.", "The walk is identical to P9's search, except you never return early — always track the best so far."],
    solution: "def closest_value(root, target):\n    closest = root.val\n    cur = root\n    while cur:\n        if abs(cur.val - target) < abs(closest - target):\n            closest = cur.val\n        if target < cur.val:\n            cur = cur.left\n        elif target > cur.val:\n            cur = cur.right\n        else:\n            return cur.val\n    return closest",
    walkthrough: "Walk the binary search path toward target. At each node, update the closest value if this node is nearer. The path is the same as searching — go left when target is smaller, right when bigger.",
    testCode: "assert closest_value(build_tree([4,2,7,1,3]), 3.7) == 4\nassert closest_value(build_tree([4,2,7,1,3]), 2.2) == 2\nassert closest_value(build_tree([4,2,7,1,3]), 1) == 1\nassert closest_value(build_tree([1]), 100) == 1\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 1, title: "Count Nodes in BST", pattern: "tree traversal", skill: "count left + count right + 1",
    statement: "Given the root of a BST, return the total number of nodes. This applies to ANY binary tree — the BST property is not needed here, but the recursion pattern carries forward.",
    examples: [{ input: "tree = [4,2,7,1,3]", output: "5" }, { input: "tree = []", output: "0" }],
    why: "Transitions from BST-specific navigation to general tree recursion. The pattern '1 + count(left) + count(right)' is the skeleton for every problem in Stages 2-6.",
    starterCode: "def count_nodes(root):\n    pass",
    hints: ["What does a None subtree contribute to the count?", "The count at any node = 1 (this node) + count of left subtree + count of right subtree.", "Base case: root is None -> return 0. Recursive case: return 1 + count_nodes(root.left) + count_nodes(root.right)."],
    solution: "def count_nodes(root):\n    if root is None:\n        return 0\n    return 1 + count_nodes(root.left) + count_nodes(root.right)",
    walkthrough: "The simplest recursive tree pattern: every node adds 1 and delegates the rest to children. The BST property is irrelevant — this pattern works on any binary tree. It's the mental skeleton for sum, height, and everything else.",
     testCode: "assert count_nodes(build_tree([4,2,7,1,3])) == 5\nassert count_nodes(build_tree([])) == 0\nassert count_nodes(build_tree([5])) == 1\nassert count_nodes(build_tree([5,3,8,1,4,None,9])) == 6\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Validate BST (The Trap!)", pattern: "BST validation", skill: "recognize why parent-check fails",
    statement: "Write a function that checks if a tree is a valid BST by comparing each node only with its immediate children. This is INTENTIONALLY WRONG. Watch it fail on inputs where a grandchild violates the BST property.",
    examples: [{ input: "tree = [2,1,3]", output: "True (passes correctly)" }, { input: "tree = [5,1,4,null,null,3,6]", output: "False (naive says True)", explain: "3 < 5 but is in right subtree — parent-check misses this" }],
    why: "The natural instinct — 'left child < me < right child' — is WRONG. A grandchild can break the global BST property while satisfying every local parent-child check. You must feel this failure before the range solution makes sense (Rule A3: pain before cure).",
    starterCode: "def validate_bst_naive(root):\n    pass",
    hints: ["Try: check only (left.val < root.val < right.val) at each node. Then trace on [5,1,4,null,null,3,6].", "Why does 3 end up in the wrong place? Because 3 < 5 but it's in 5's RIGHT subtree. The local check doesn't see 'grandparent'.", "The problem: each node needs to know the allowed range from ALL ancestors, not just its parent."],
    solution: "def validate_bst_naive(root):\n    if root is None:\n        return True\n    if root.left and root.left.val >= root.val:\n        return False\n    if root.right and root.right.val <= root.val:\n        return False\n    return validate_bst_naive(root.left) and validate_bst_naive(root.right)",
    walkthrough: "The naive check only enforces that LEFT child < this node < RIGHT child. But the global BST invariant says: ALL values in left subtree < this node < ALL values in right subtree. The tree [5,1,4,null,null,3,6] passes local checks (1<5>4, 3<4<6) but 3 is in the WRONG side of 5.",
    testCode: "t = build_tree([2,1,3])\nassert validate_bst_naive(t) == True\nt2 = build_tree([5,1,4,None,None,3,6])\nprint('Trap demonstrated: naive validator says', validate_bst_naive(t2), '(should be False)')\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Validate BST (Correct with Ranges)", pattern: "range propagation", skill: "pass (low, high) constraints down",
    statement: "Given the root of a binary tree, return True if it is a valid BST. Pass (low, high) ranges downward — each left child tightens high, each right child tightens low.",
    examples: [{ input: "tree = [2,1,3]", output: "True" }, { input: "tree = [5,1,4,null,null,3,6]", output: "False" }],
    why: "P15's trap showed the problem: ancestors' constraints are invisible. The fix: pass (low, high) down to each subtree. Going left, tighten the high bound to this node's value. Going right, tighten the low bound.",
    starterCode: "def validate_bst(root):\n    def dfs(node, low, high):\n        pass\n    return dfs(root, float('-inf'), float('inf'))",
    hints: ["What should the allowed range of a left child be? Its parent's low bound stays, but the high bound becomes the parent's value.", "For a right child: the low bound becomes the parent's value, the high bound stays.", "Base case: None is always valid. Otherwise, check low < node.val < high, then recurse with updated bounds."],
    solution: "def validate_bst(root):\n    def dfs(node, low, high):\n        if node is None:\n            return True\n        if node.val <= low or node.val >= high:\n            return False\n        return dfs(node.left, low, node.val) and dfs(node.right, node.val, high)\n    return dfs(root, float('-inf'), float('inf'))",
    walkthrough: "Information flows DOWN. Each node receives the valid range from its ancestors. The range narrows as you descend: left child inherits [low, parent.val], right child inherits [parent.val, high]. A node is valid if its value lies within its inherited range AND both subtrees are valid.",
    testCode: "assert validate_bst(build_tree([2,1,3])) == True\nassert validate_bst(build_tree([5,1,4,None,None,3,6])) == False\nassert validate_bst(build_tree([5,4,6,None,None,3,7])) == False\nassert validate_bst(build_tree([1,1])) == False\nassert validate_bst(None) == True\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Find Misplaced Node", pattern: "range check", skill: "first node outside its legal range",
    statement: "A BST has exactly one node whose value violates the BST property at its position. Find and return its value using the range-check pattern from P16.",
    examples: [{ input: "tree = [5,3,7,1,9,null,8]", output: "9", explain: "9 > 5 but is in left subtree" }, { input: "tree = [4,2,6,1,3,5,7]", output: "None", explain: "tree is valid" }],
    why: "Applies P16's range-check in detection mode. Instead of returning True/False, you walk until you find the node whose value doesn't fit its legal range. Same information-flow pattern, new purpose.",
    starterCode: "def find_misplaced(root):\n    def dfs(node, low, high):\n        pass\n    return dfs(root, float('-inf'), float('inf'))",
    hints: ["Use the same DFS from P16. Instead of returning False, return the offending value.", "If node.val < low or node.val > high, this node is misplaced — return node.val immediately.", "Search left subtree first (returns None if nothing found there), then right subtree."],
    solution: "def find_misplaced(root):\n    def dfs(node, low, high):\n        if node is None:\n            return None\n        if node.val < low or node.val > high:\n            return node.val\n        left_result = dfs(node.left, low, node.val)\n        if left_result is not None:\n            return left_result\n        return dfs(node.right, node.val, high)\n    return dfs(root, float('-inf'), float('inf'))",
    walkthrough: "Same DFS skeleton as P16. The one new idea: instead of returning a boolean, return the first misplaced value you encounter. Check the current node first, then left, then right. The first non-None result bubbles up as the answer.",
     testCode: "assert find_misplaced(build_tree([5,3,7,1,9,None,8])) == 9\nassert find_misplaced(build_tree([4,2,6,1,3,5,7])) is None\nassert find_misplaced(build_tree([5,1,4,None,None,3,6])) == 4\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Sorted Array to Balanced BST", pattern: "range divide", skill: "mid is root, ranges split children",
    statement: "Given a sorted array of unique integers, convert it into a height-balanced BST. Return the root.",
    examples: [{ input: "arr = [-10,-3,0,5,9]", output: "[0,-3,9,-10,null,5]" }, { input: "arr = [1,3]", output: "[3,1] or [1,null,3]" }],
    why: "The range idea in reverse: you know the ORDERED set of values. The mid element becomes the root. Left half -> left subtree (all < mid). Right half -> right subtree (all > mid). Ranges drive the structure.",
    starterCode: "def sorted_array_to_bst(nums):\n    pass",
    hints: ["Which element should be the root to keep the tree balanced?", "Pick the middle element as root. Left subarray -> left subtree. Right subarray -> right subtree.", "Recurse: build left from nums[:mid], root from nums[mid], right from nums[mid+1:]. Base case: empty array -> None."],
    solution: "def sorted_array_to_bst(nums):\n    if not nums:\n        return None\n    mid = len(nums) // 2\n    root = TreeNode(nums[mid])\n    root.left = sorted_array_to_bst(nums[:mid])\n    root.right = sorted_array_to_bst(nums[mid+1:])\n    return root",
    walkthrough: "The range defines the root: everything left of mid is smaller (left subtree), everything right is larger (right subtree). Recursively, each subarray is a range. The mid element is the root of that range.",
    testCode: "def inorder_vals(root):\n    if root is None: return []\n    return inorder_vals(root.left) + [root.val] + inorder_vals(root.right)\nt = sorted_array_to_bst([-10,-3,0,5,9])\nassert inorder_vals(t) == [-10,-3,0,5,9]\nt2 = sorted_array_to_bst([1,3])\nassert inorder_vals(t2) == [1,3]\nassert sorted_array_to_bst([]) is None\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Range Sum BST (Full)", pattern: "range pruning", skill: "skip subtrees outside range",
    statement: "Given a BST root and [low, high], return the sum of values within range. Use subtree pruning: if a node is out of range, an entire subtree is out too.",
    examples: [{ input: "tree = [10,5,15,3,7,None,18], low = 7, high = 15", output: "32", explain: "7+10+15=32" }, { input: "tree = [10,5,15,3,7,13,18,1,None,6], low = 6, high = 10", output: "23" }],
    why: "P12 introduced BST pruning. Now you understand WHY it works: the range (low, high) implicitly constrains each subtree. A node < low means the entire left subtree is also < low — the range says 'no values from that subtree can qualify.'",
    starterCode: "def range_sum_bst(root, low, high):\n    pass",
    hints: ["If root.val < low, all values in the left subtree are also < low. What's the only subtree worth searching?", "Three cases: too small -> only recurse right. Too big -> only recurse left. In range -> add value + recurse both.", "The range acts like a filter flowing down: it tells you which subtrees are irrelevant."],
    solution: "def range_sum_bst(root, low, high):\n    if root is None:\n        return 0\n    if root.val < low:\n        return range_sum_bst(root.right, low, high)\n    if root.val > high:\n        return range_sum_bst(root.left, low, high)\n    return root.val + range_sum_bst(root.left, low, high) + range_sum_bst(root.right, low, high)",
    walkthrough: "The range concept from P16 now powers pruning. When node.val < low, the range constraint says 'this entire left subtree is below low.' Skip it. When > high, skip the right subtree. Only when the node is inside the range do you need to explore both sides.",
    testCode: "t = build_tree([10,5,15,3,7,None,18])\nassert range_sum_bst(t, 7, 15) == 32\nassert range_sum_bst(t, 3, 7) == 15\nassert range_sum_bst(t, 20, 30) == 0\nt2 = build_tree([10,5,15,3,7,13,18,1,None,6])\nassert range_sum_bst(t2, 6, 10) == 23\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "All Elements in Range", pattern: "range collection", skill: "collect values within [low, high]",
    statement: "Given a BST root and [low, high], return a sorted list of all node values within the range. Use the BST property to prune subtrees.",
    examples: [{ input: "tree = [10,5,15,3,7,None,18], low = 6, high = 16", output: "[7,10,15]" }, { input: "tree = [4,2,6,1,3,5,7], low = 3, high = 5", output: "[3,4,5]" }],
    why: "P19 summed values in range — this collects them. Same pruning logic, new output shape. The patterns are accumulating: walk + range-filter + aggregate.",
    starterCode: "def elements_in_range(root, low, high):\n    result = []\n    def dfs(node):\n        pass\n    dfs(root)\n    return result",
    hints: ["Use the same pruning rules as P19: if node < low, only recurse right. If node > high, only recurse left.", "Collect INORDER to get sorted output automatically. Add node.val to result only if low <= val <= high.", "Recurse left BEFORE adding current node, then recurse right — preserves sorted order."],
    solution: "def elements_in_range(root, low, high):\n    result = []\n    def dfs(node):\n        if node is None:\n            return\n        if node.val > low:\n            dfs(node.left)\n        if low <= node.val <= high:\n            result.append(node.val)\n        if node.val < high:\n            dfs(node.right)\n    dfs(root)\n    return result",
    walkthrough: "Inorder walk with pruning. The BST property lets you skip: if node.val <= low, the left subtree is entirely out of range. If node.val >= high, skip the right subtree. The inorder order guarantees the result is sorted automatically.",
    testCode: "assert elements_in_range(build_tree([10,5,15,3,7,None,18]), 6, 16) == [7,10,15]\nassert elements_in_range(build_tree([4,2,6,1,3,5,7]), 3, 5) == [3,4,5]\nassert elements_in_range(build_tree([10,5,15,3,7,None,18]), 20, 30) == []\nassert elements_in_range(build_tree([10,5,15,3,7,None,18]), 0, 100) == [3,5,7,10,15,18]\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "BST to Greater Sum Tree", pattern: "reverse inorder", skill: "accumulate sum from right to left",
    statement: "Given a BST root, convert it into a Greater Sum Tree: each node's new value = original value + sum of all values greater than it. Use reverse inorder (right, root, left).",
    examples: [{ input: "tree = [4,1,6,0,2,5,7,null,null,null,3,null,null,null,8]", output: "[30,36,21,36,35,26,15,null,null,null,33,null,null,null,8]", explain: "each node becomes self + all greater" }, { input: "tree = [0,null,1]", output: "[1,null,1]" }],
    why: "Information flows in reverse inorder — right (larger values) first, accumulating a running sum, then root, then left. The range idea says 'values to the right are all larger' — reverse inorder visits them first.",
    starterCode: "def bst_to_gst(root):\n    total = [0]\n    def dfs(node):\n        pass\n    dfs(root)\n    return root",
    hints: ["Reverse inorder: visit right child first, then current node, then left child. Why does this order work?", "Maintain a running sum of all values seen so far. When visiting a node, add its value to the sum, then set node.val = running sum.", "Use a mutable holder (list) so the sum persists across recursive calls."],
    solution: "def bst_to_gst(root):\n    total = [0]\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.right)\n        total[0] += node.val\n        node.val = total[0]\n        dfs(node.left)\n    dfs(root)\n    return root",
    walkthrough: "Reverse inorder visits nodes from largest to smallest. By the time you process a node, you've already visited every node with a larger value. The running sum holds exactly 'sum of all greater values.'",
    testCode: "t = bst_to_gst(build_tree([4,1,6,0,2,5,7,None,None,None,3,None,None,None,8]))\ndef inorder(r):\n    if r is None: return []\n    return inorder(r.left) + [r.val] + inorder(r.right)\nassert inorder(t) == [36,36,35,33,30,26,21,15,8]\nt2 = bst_to_gst(build_tree([0,None,1]))\nassert inorder(t2) == [1,1]\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 2, title: "Kth Smallest in BST", pattern: "left count + navigate", skill: "count left subtree size, decide",
    statement: "Given a BST root, return the k-th smallest value (1-indexed). Count the left subtree size: it tells you exactly where the kth value lives — left, root, or right.",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "1" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "3" }],
    why: "Combines P14 (count nodes) with the ordering invariant. The left subtree size tells you exactly where the kth value lives. If left has c nodes: k <= c -> left; k == c+1 -> root; k > c+1 -> right.",
    starterCode: "def kth_smallest(root, k):\n    def count(node):\n        pass\n    pass",
    hints: ["If the left subtree has c nodes, what does c tell you about the position of root among all sorted values?", "Root is the (c+1)-th smallest. If k == c+1, root is answer. If k <= c, search left. If k > c+1, search right with k-(c+1).", "Write count(node) = 1 + count(left) + count(right), then use it to navigate."],
    solution: "def kth_smallest(root, k):\n    def count(node):\n        if node is None:\n            return 0\n        return 1 + count(node.left) + count(node.right)\n    cur = root\n    while cur:\n        left_count = count(cur.left)\n        if k <= left_count:\n            cur = cur.left\n        elif k == left_count + 1:\n            return cur.val\n        else:\n            k -= left_count + 1\n            cur = cur.right\n    return -1",
    walkthrough: "BST transforms 'kth smallest' into a binary search on tree structure. Count left subtree: if k fits inside it, go left. If k is exactly left_count+1, current node IS the answer. Otherwise answer is in right subtree; subtract (left_count+1) from k.",
    testCode: "assert kth_smallest(build_tree([3,1,4,None,2]), 1) == 1\nassert kth_smallest(build_tree([5,3,6,2,4,None,None,1]), 3) == 3\nassert kth_smallest(build_tree([2,1,3]), 2) == 2\nassert kth_smallest(build_tree([5]), 1) == 5\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Inorder List", pattern: "inorder traversal", skill: "visit left, root, right",
    statement: "Given a BST root, return a list of all node values in INORDER order (left, root, right). This list will be sorted — that's the property the BST invariant bought us.",
    examples: [{ input: "tree = [4,2,7,1,3]", output: "[1,2,3,4,7]" }, { input: "tree = [2,1,3]", output: "[1,2,3]" }],
    why: "All the navigation in Stages 1-2 relied on the BST invariant. Inorder traversal PROVES the invariant works: if you visit left, then root, then right, the output IS sorted. This traversal is the payoff for maintaining the BST property.",
    starterCode: "def inorder_list(root):\n    result = []\n    def dfs(node):\n        pass\n    dfs(root)\n    return result",
    hints: ["What order must children be visited for the output to be sorted? Remember: left < root < right.", "Recurse left, then add root.val to result, then recurse right.", "Base case: if node is None, just return — nothing to add."],
    solution: "def inorder_list(root):\n    result = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        result.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    return result",
    walkthrough: "Three-step recipe: (1) process left subtree, (2) add current node, (3) process right subtree. Because of the BST property (all left < root < all right), this order guarantees the output is sorted. The traversal IS the proof.",
    testCode: "assert inorder_list(build_tree([4,2,7,1,3])) == [1,2,3,4,7]\nassert inorder_list(build_tree([2,1,3])) == [1,2,3]\nassert inorder_list(None) == []\nassert inorder_list(build_tree([5])) == [5]\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Inorder Predecessor", pattern: "inorder navigation", skill: "max of left subtree",
    statement: "Given a BST root and a target value that exists in the tree, return the inorder predecessor (the value before target in sorted order). Return None if no predecessor.",
    examples: [{ input: "tree = [5,3,6,2,4,null,null,1], target = 4", output: "3" }, { input: "tree = [2,1,3], target = 1", output: "None" }],
    why: "P23 showed inorder = sorted. Predecessor of a node is the value just before it. When a node has a left child, predecessor is the MAX of left subtree. Otherwise it's the nearest ancestor where target is in the right subtree.",
    starterCode: "def inorder_predecessor(root, target):\n    pass",
    hints: ["First, where does the predecessor live relative to target? If target has a left child, go left once, then right as far as possible.", "If target has NO left child: predecessor is the nearest ancestor where the target is in its RIGHT subtree.", "Walk from root: when you go right, record current node as candidate predecessor. The last recorded before reaching target is the answer."],
    solution: "def inorder_predecessor(root, target):\n    pred = None\n    cur = root\n    while cur:\n        if target <= cur.val:\n            cur = cur.left\n        else:\n            pred = cur.val\n            cur = cur.right\n    return pred",
    walkthrough: "Walk from root toward target. Whenever you go RIGHT (target > cur.val), the current node is a candidate predecessor — it's smaller than target and everything in cur.left is even smaller. The last such node before reaching target is the answer.",
    testCode: "assert inorder_predecessor(build_tree([5,3,6,2,4,None,None,1]), 4) == 3\nassert inorder_predecessor(build_tree([2,1,3]), 1) is None\nassert inorder_predecessor(build_tree([5,3,6,2,4,None,None,1]), 3) == 2\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Inorder Successor", pattern: "inorder navigation", skill: "min of right subtree",
    statement: "Given a BST root and a target value that exists, return the inorder successor (value after target in sorted order). Return None if no successor.",
    examples: [{ input: "tree = [5,3,6,2,4,null,null,1], target = 2", output: "3" }, { input: "tree = [2,1,3], target = 3", output: "None" }],
    why: "Mirror of P24. The successor of a node in sorted order is either the MIN of its right subtree (if it has one) or the nearest ancestor where the node sits in the left subtree.",
    starterCode: "def inorder_successor(root, target):\n    pass",
    hints: ["If target has a right child: successor = min value in right subtree (go right once, then left as far as possible).", "If target has NO right child: successor is the nearest ancestor where target is in its LEFT subtree.", "Walk from root: when you go LEFT, save current as candidate. Last saved is the answer."],
    solution: "def inorder_successor(root, target):\n    succ = None\n    cur = root\n    while cur:\n        if target < cur.val:\n            succ = cur.val\n            cur = cur.left\n        else:\n            cur = cur.right\n    return succ",
    walkthrough: "Mirror of P24. Walk from root toward target. Whenever you go LEFT (target < cur.val), the current node is a candidate successor — it's larger than target. The last such node before reaching target is the answer.",
    testCode: "assert inorder_successor(build_tree([5,3,6,2,4,None,None,1]), 2) == 3\nassert inorder_successor(build_tree([2,1,3]), 3) is None\nassert inorder_successor(build_tree([5,3,6,2,4,None,None,1]), 4) == 5\nassert inorder_successor(build_tree([4,2,7,1,3]), 2) == 3\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Verify Inorder is Sorted", pattern: "inorder walk", skill: "compare with previous during traversal",
    statement: "Given a BST root, verify the BST property using inorder traversal: each visited value must be greater than the previous. Return True if valid.",
    examples: [{ input: "tree = [2,1,3]", output: "True" }, { input: "tree = [5,1,4,null,null,3,6]", output: "False" }],
    why: "Alternative validation to P16. Instead of passing ranges down, exploit: inorder of a BST IS sorted. Track the previously visited value during traversal and check it's always less than current.",
    starterCode: "def verify_bst_inorder(root):\n    prev = [float('-inf')]\n    def dfs(node):\n        pass\n    return dfs(root)",
    hints: ["During inorder traversal, each node's value must be > the previously visited node's value.", "Use a mutable container (list) to hold 'prev' so it persists across recursive calls.", "If at any point node.val <= prev, return False. Otherwise update prev and continue."],
    solution: "def verify_bst_inorder(root):\n    prev = [float('-inf')]\n    def dfs(node):\n        if node is None:\n            return True\n        if not dfs(node.left):\n            return False\n        if node.val <= prev[0]:\n            return False\n        prev[0] = node.val\n        return dfs(node.right)\n    return dfs(root)",
    walkthrough: "Instead of passing ranges DOWN (P16), pass a 'previous' value horizontally via mutable reference. Inorder visits in sorted order, so each value must be > the last. If this holds for every adjacent pair, the tree is valid. Two approaches, same truth.",
    testCode: "assert verify_bst_inorder(build_tree([2,1,3])) == True\nassert verify_bst_inorder(build_tree([5,1,4,None,None,3,6])) == False\nassert verify_bst_inorder(build_tree([5,4,6,None,None,3,7])) == False\nassert verify_bst_inorder(None) == True\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Kth Smallest via Inorder Counter", pattern: "inorder with counter", skill: "counter reaches k, stop",
    statement: "Given a BST root and k (1-indexed), return the kth smallest value. Use inorder traversal with a counter — the kth node visited IS the kth smallest.",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "1" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "3" }],
    why: "P22 solved kth-smallest by counting left subtree sizes. This solves it differently: inorder visits in sorted order, so the kth node visited IS the kth smallest. A counter tracks progress.",
    starterCode: "def kth_smallest_inorder(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        pass\n    dfs(root)\n    return result[0]",
    hints: ["Inorder visits nodes in sorted order. If you maintain a counter of nodes visited so far...", "After visiting left, increment count. If count == k, record this node's value as the result.", "Use mutable references (lists) for count and result so they cross recursion boundaries."],
    solution: "def kth_smallest_inorder(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        if node is None or result[0] is not None:\n            return\n        dfs(node.left)\n        count[0] += 1\n        if count[0] == k:\n            result[0] = node.val\n            return\n        dfs(node.right)\n    dfs(root)\n    return result[0]",
    walkthrough: "Inorder guarantee: the kth node processed IS the kth smallest value. A counter tracks how many nodes have been 'visited.' When counter hits k, capture the value. The sentinel 'result[0] is not None' shortcuts remaining recursion.",
    testCode: "assert kth_smallest_inorder(build_tree([3,1,4,None,2]), 1) == 1\nassert kth_smallest_inorder(build_tree([5,3,6,2,4,None,None,1]), 3) == 3\nassert kth_smallest_inorder(build_tree([2,1,3]), 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 3, title: "Two Sum in BST", pattern: "inorder + two pointer", skill: "sorted array, inward pointers",
    statement: "Given a BST root and a target sum, return True if two distinct values sum to target. Use inorder to get sorted list, then two-pointer scan from ends.",
    examples: [{ input: "tree = [5,3,6,2,4,null,7], target = 9", output: "True", explain: "2+7=9" }, { input: "tree = [5,3,6,2,4,null,7], target = 28", output: "False" }],
    why: "Inorder converts BST to sorted array. Two-sum on sorted array is O(n) with two pointers (left and right, moving inward based on sum vs target). Compose: inorder (P23) + two-pointer.",
    starterCode: "def two_sum_bst(root, target):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["First, get the sorted list via inorder traversal (P23).", "Use two pointers: left = 0, right = len(vals)-1. If vals[left] + vals[right] == target, return True.", "If sum < target, increment left (need larger). If sum > target, decrement right (need smaller)."],
    solution: "def two_sum_bst(root, target):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    left, right = 0, len(vals) - 1\n    while left < right:\n        s = vals[left] + vals[right]\n        if s == target:\n            return True\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\n    return False",
    walkthrough: "Phase 1 (inorder): produce sorted array — O(n) time and space. Phase 2 (two-pointer): left at start, right at end. If sum < target, left++ (increase sum). If sum > target, right-- (decrease sum). Each step eliminates one candidate.",
    testCode: "assert two_sum_bst(build_tree([5,3,6,2,4,None,7]), 9) == True\nassert two_sum_bst(build_tree([5,3,6,2,4,None,7]), 28) == False\nassert two_sum_bst(build_tree([2,1,3]), 4) == True\nassert two_sum_bst(build_tree([1]), 2) == False\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 3, title: "Minimum Difference Between Nodes", pattern: "inorder adjacent", skill: "compare consecutive inorder values",
    statement: "Given a BST root, return the minimum absolute difference between values of any two nodes. Because inorder is sorted, min diff is between adjacent values.",
    examples: [{ input: "tree = [4,2,6,1,3]", output: "1", explain: "2-1=1, 3-2=1, 4-3=1, 6-4=2 -> min=1" }, { input: "tree = [1,0,48,null,null,12,49]", output: "1", explain: "1-0=1 is smallest" }],
    why: "The sortedness of inorder means the minimum difference MUST be between two consecutive values. Track the previous value during traversal and compute the difference at each step.",
    starterCode: "def min_diff_bst(root):\n    prev = [None]\n    min_diff = [float('inf')]\n    def dfs(node):\n        pass\n    dfs(root)\n    return min_diff[0]",
    hints: ["Inorder traversal visits values in sorted order. The minimum difference must be between two adjacent values.", "Track 'prev' — the last visited node's value. At each node, compute (node.val - prev) and update min if smaller.", "Use mutable containers (list) for prev and min_diff so they survive recursive calls."],
    solution: "def min_diff_bst(root):\n    prev = [None]\n    min_diff = [float('inf')]\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        if prev[0] is not None:\n            diff = node.val - prev[0]\n            if diff < min_diff[0]:\n                min_diff[0] = diff\n        prev[0] = node.val\n        dfs(node.right)\n    dfs(root)\n    return min_diff[0]",
    walkthrough: "Inorder guarantees sorted order. For any sorted list, the smallest difference is between consecutive elements. During traversal, keep previous value. At each node, compute current - previous. Track the minimum across all adjacent pairs.",
    testCode: "assert min_diff_bst(build_tree([4,2,6,1,3])) == 1\nassert min_diff_bst(build_tree([1,0,48,None,None,12,49])) == 1\nassert min_diff_bst(build_tree([2,1,4])) == 1\nassert min_diff_bst(build_tree([5,4,7])) == 1\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Kth Smallest via Full Dump", pattern: "dump and index", skill: "collect all, return vals[k-1]",
    statement: "Given a BST root and k (1-indexed), return the kth smallest value. Dump ALL values via inorder into a list, then return vals[k-1]. Feel the waste: you collect every value even though you only need one.",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "1" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "3" }],
    why: "This works. It's correct. It's also wasteful — you traverse the ENTIRE tree and store ALL values to answer a question about the 3rd one. This pain is deliberate: you must feel the waste before the optimization in Stage 5 makes sense (Rule A3).",
    starterCode: "def kth_smallest_naive(root, k):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Dump all values into a list via inorder traversal. What property does this list have?", "The list is sorted. The kth smallest is simply vals[k-1].", "Don't try to optimize yet. The point is to write the simplest correct solution and observe its waste."],
    solution: "def kth_smallest_naive(root, k):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    return vals[k - 1]",
    walkthrough: "Inorder dump collects every value into a sorted list. Index k-1 gives the kth smallest. O(n) time, O(n) space. The waste: entire tree traversed even though answer found early. You built a 100-element array for the 3rd element. Stage 5 fixes this.",
    testCode: "assert kth_smallest_naive(build_tree([3,1,4,None,2]), 1) == 1\nassert kth_smallest_naive(build_tree([5,3,6,2,4,None,None,1]), 3) == 3\nassert kth_smallest_naive(build_tree([2,1,3]), 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Range Sum via Dump", pattern: "dump and filter", skill: "collect all, filter, sum",
    statement: "Given a BST root and [low, high], return sum of values within range. Dump ALL values via inorder, filter those in range, and sum them.",
    examples: [{ input: "tree = [10,5,15,3,7,None,18], low = 7, high = 15", output: "32" }, { input: "tree = [10,5,15,3,7,None,18], low = 3, high = 7", output: "15" }],
    why: "Works everywhere, not just BSTs. Traverse, filter, sum — ignores the BST property entirely. This shows what the BST property saved you from doing in P19.",
    starterCode: "def range_sum_naive(root, low, high):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Collect all values via any traversal (inorder, preorder — doesn't matter). Then filter by range and sum.", "Inorder gives sorted order but the result is the same sum regardless of traversal.", "Compare this to P19. Notice how the BST-aware version prunes entire subtrees — the dump version visits everything."],
    solution: "def range_sum_naive(root, low, high):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    total = 0\n    for v in vals:\n        if low <= v <= high:\n            total += v\n    return total",
    walkthrough: "Full traversal captures everything. Post-process: iterate collected values, check if each is in range, sum. O(n) time and space. Contrast with P19 which prunes subtrees using BST property — same answer, wildly different work.",
    testCode: "t = build_tree([10,5,15,3,7,None,18])\nassert range_sum_naive(t, 7, 15) == 32\nassert range_sum_naive(t, 3, 7) == 15\nassert range_sum_naive(t, 20, 30) == 0\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Inorder Successor via Dump", pattern: "dump and find next", skill: "collect all, locate target, return next",
    statement: "Given a BST root and a target value, return the inorder successor. Dump ALL values via inorder, find target, return the next value (or None if last).",
    examples: [{ input: "tree = [5,3,6,2,4,null,null,1], target = 2", output: "3" }, { input: "tree = [2,1,3], target = 3", output: "None" }],
    why: "No tree navigation needed. Dump to sorted array, scan for target, grab vals[i+1]. The waste: you traversed the whole tree to find one neighbor.",
    starterCode: "def inorder_successor_naive(root, target):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Dump all values via inorder. The list is sorted — target's successor is the value after it.", "Find target's index in the list. If it's the last element, return None. Otherwise return vals[idx+1].", "This is O(n) in both time and space. Compare with P25's O(h) approach."],
    solution: "def inorder_successor_naive(root, target):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    for i in range(len(vals)):\n        if vals[i] == target:\n            return vals[i + 1] if i + 1 < len(vals) else None\n    return None",
    walkthrough: "Inorder gives sorted list. Find target, return next element. Entire tree traversed to build this array. Compare with P25: that solution walks O(h) steps, never visiting irrelevant subtrees.",
    testCode: "assert inorder_successor_naive(build_tree([5,3,6,2,4,None,None,1]), 2) == 3\nassert inorder_successor_naive(build_tree([2,1,3]), 3) is None\nassert inorder_successor_naive(build_tree([5,3,6,2,4,None,None,1]), 4) == 5\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Two Sum via Dump", pattern: "dump + two pointer", skill: "collect all, two-pointer scan",
    statement: "Given a BST root and target sum, return True if two distinct values sum to target. Dump ALL values via inorder, then two-pointer on sorted array.",
    examples: [{ input: "tree = [5,3,6,2,4,null,7], target = 9", output: "True" }, { input: "tree = [5,3,6,2,4,null,7], target = 28", output: "False" }],
    why: "Inorder produces sorted array. Two-pointer finds the pair in O(n). Correct, but dumps the whole tree to array first. Space is O(n).",
    starterCode: "def two_sum_naive(root, target):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Phase 1: inorder -> sorted list. Phase 2: left=0, right=len-1, converge inward.", "Same as P28 but explicitly labeled naive. The waste is the full dump before search.", "All values are stored before search begins. Space is O(n)."],
    solution: "def two_sum_naive(root, target):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    left, right = 0, len(vals) - 1\n    while left < right:\n        s = vals[left] + vals[right]\n        if s == target:\n            return True\n        elif s < target:\n            left += 1\n        else:\n            right -= 1\n    return False",
    walkthrough: "Phase 1: dump all to array via inorder — O(n) time, O(n) space. Phase 2: standard two-pointer. Works but the dump phase is the waste. The BST's structure contributed nothing beyond producing a sorted list.",
    testCode: "assert two_sum_naive(build_tree([5,3,6,2,4,None,7]), 9) == True\nassert two_sum_naive(build_tree([5,3,6,2,4,None,7]), 28) == False\nassert two_sum_naive(build_tree([2,1,3]), 4) == True\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Mode via Dump", pattern: "dump + hashmap", skill: "collect all, count frequencies",
    statement: "Given a BST root (with possible duplicates), return all mode values. Dump values, count frequencies with a hashmap, return most frequent.",
    examples: [{ input: "tree = [1,null,2,2]", output: "[2]" }, { input: "tree = [0]", output: "[0]" }],
    why: "The naive approach treats the tree as a bag of values. Traverse, count, find max frequency. No BST property used. Sets up the contrast for any approach that exploits ordering.",
    starterCode: "def find_mode_naive(root):\n    freq = {}\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Traverse the entire tree. For each node, increment its count in a hashmap.", "After traversal, find the maximum frequency. Collect all values with that frequency.", "The BST property is irrelevant here — works on any binary tree."],
    solution: "def find_mode_naive(root):\n    freq = {}\n    def dfs(node):\n        if node is None:\n            return\n        freq[node.val] = freq.get(node.val, 0) + 1\n        dfs(node.left)\n        dfs(node.right)\n    dfs(root)\n    if not freq:\n        return []\n    max_f = max(freq.values())\n    return [v for v, f in freq.items() if f == max_f]",
    walkthrough: "Full traversal counts every value with a hashmap. Post-processing: find highest frequency, collect all values with that frequency. O(n) time and space. No BST structure leveraged.",
      testCode: "assert find_mode_naive(build_tree([1,None,2,None,None,2])) == [2]\nassert find_mode_naive(build_tree([0])) == [0]\nr = find_mode_naive(build_tree([2,2,3,2,None,3]))\nassert r == [2]\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 4, title: "Kth Largest via Dump", pattern: "dump and reverse index", skill: "collect all, return vals[n-k]",
    statement: "Given a BST root and k (1-indexed), return the kth largest value. Dump ALL via inorder, then return vals[-k].",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "4" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "4" }],
    why: "Kth largest is just (n-k+1)th smallest. Dump sorted, pick from end. Same waste as P30 — full traversal for a single answer.",
    starterCode: "def kth_largest_naive(root, k):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Inorder gives sorted (ascending) list. Where is the kth largest in this list?", "The kth largest is at index n - k (0-indexed), where n = len(vals).", "Same dump pattern. The waste is identical: you built the whole list for one element."],
    solution: "def kth_largest_naive(root, k):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    return vals[-k]",
    walkthrough: "Full inorder dump produces sorted list. Since ascending, kth largest is kth from end — simply vals[len(vals)-k] or Python's vals[-k]. O(n) time and space.",
    testCode: "assert kth_largest_naive(build_tree([3,1,4,None,2]), 1) == 4\nassert kth_largest_naive(build_tree([5,3,6,2,4,None,None,1]), 3) == 4\nassert kth_largest_naive(build_tree([2,1,3]), 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 4, title: "Median via Dump", pattern: "dump and find middle", skill: "collect all, return middle element(s)",
    statement: "Given a BST root, return the median. If odd nodes, return middle value. If even, return average of two middle values. Dump via inorder first.",
    examples: [{ input: "tree = [2,1,3]", output: "2" }, { input: "tree = [3,1,4,null,2]", output: "2.5", explain: "(2+3)/2 = 2.5" }],
    why: "Median = middle element(s) of sorted order. Inorder gives sorted order. Dump, pick middle. Waste capstone: 7 dump-pattern problems, each traversing the full tree. Stage 5 addresses every one.",
    starterCode: "def median_naive(root):\n    vals = []\n    def dfs(node):\n        pass\n    dfs(root)\n    pass",
    hints: ["Dump all values via inorder (sorted list). If odd length, median is the middle element.", "If even length, median is average of the two middle elements.", "Middle indices: odd n -> vals[n//2]. Even n -> (vals[n//2-1] + vals[n//2]) / 2."],
    solution: "def median_naive(root):\n    vals = []\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        vals.append(node.val)\n        dfs(node.right)\n    dfs(root)\n    n = len(vals)\n    if n % 2 == 1:\n        return vals[n // 2]\n    else:\n        return (vals[n // 2 - 1] + vals[n // 2]) / 2",
    walkthrough: "Inorder dump -> sorted list. Median: if odd (n=5), return vals[2]. If even (n=4), average vals[1] and vals[2]. The dump pattern is now automatic. Stage 5 teaches when and how to stop early.",
    testCode: "assert median_naive(build_tree([2,1,3])) == 2\nassert median_naive(build_tree([3,1,4,None,2])) == 2.5\nassert median_naive(build_tree([5])) == 5\nassert median_naive(build_tree([2,1])) == 1.5\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Kth Smallest O(h) — Early Stop", pattern: "inorder with early exit", skill: "stop traversal after k nodes",
    statement: "Given a BST root and k, return the kth smallest WITHOUT traversing the entire tree. Inorder traversal but STOP after k nodes visited. O(h+k) worst case, not O(n).",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "1" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "3" }],
    why: "P30 dumped everything. The optimization: inorder visits in sorted order, so the kth node visited IS the answer. After visiting k nodes, stop — don't traverse the rest.",
    starterCode: "def kth_smallest_optimized(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        pass\n    dfs(root)\n    return result[0]",
    hints: ["Inorder visits in sorted order. After visiting k nodes, you have the answer. How do you stop further recursion?", "Use a mutable result variable. Once result is set, every recursive call checks and returns immediately.", "After visiting left, increment count. If count == k, set result and return. Sentinels guard the rest of the traversal."],
    solution: "def kth_smallest_optimized(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        if node is None or result[0] is not None:\n            return\n        dfs(node.left)\n        count[0] += 1\n        if count[0] == k:\n            result[0] = node.val\n            return\n        dfs(node.right)\n    dfs(root)\n    return result[0]",
    walkthrough: "Inorder with sentinel: once result is set, all pending recursive calls return without further work. Each frame checks 'has answer been found?' before doing anything. Traversal stops as soon as k nodes visited, leaving most of tree unvisited.",
    testCode: "assert kth_smallest_optimized(build_tree([3,1,4,None,2]), 1) == 1\nassert kth_smallest_optimized(build_tree([5,3,6,2,4,None,None,1]), 3) == 3\nassert kth_smallest_optimized(build_tree([2,1,3]), 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Range Sum O(h) — Early Stop", pattern: "BST pruning optimized", skill: "skip subtrees, early termination",
    statement: "Given a BST root and [low, high], return sum of values in range. Use BST pruning. Compare with P31: naive dump visited every node. This skips entire subtrees.",
    examples: [{ input: "tree = [10,5,15,3,7,None,18], low = 7, high = 15", output: "32" }, { input: "tree = [10,5,15,3,7,None,18], low = 3, high = 7", output: "15" }],
    why: "BST property enables subtree pruning (P19). In naive dump (P31), you visited every node. Now: when node.val < low, entire left subtree irrelevant — skip it. Same for > high. Waste eliminated.",
    starterCode: "def range_sum_optimized(root, low, high):\n    pass",
    hints: ["Three cases: node.val < low -> only recurse right. node.val > high -> only recurse left.", "node.val in range -> add value + recurse both children.", "Pruning skips irrelevant subtrees. Worst case all in range -> O(n), but average O(h + r) where r = nodes in range."],
    solution: "def range_sum_optimized(root, low, high):\n    if root is None:\n        return 0\n    if root.val < low:\n        return range_sum_optimized(root.right, low, high)\n    if root.val > high:\n        return range_sum_optimized(root.left, low, high)\n    return root.val + range_sum_optimized(root.left, low, high) + range_sum_optimized(root.right, low, high)",
    walkthrough: "At each node, range tells which subtrees matter. Too small -> everything left also too small, one call not two. Too big -> skip right. Only in-range nodes trigger full exploration. Work proportional to nodes in range, not total nodes.",
    testCode: "t = build_tree([10,5,15,3,7,None,18])\nassert range_sum_optimized(t, 7, 15) == 32\nassert range_sum_optimized(t, 3, 7) == 15\nassert range_sum_optimized(t, 20, 30) == 0\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Inorder Successor O(h)", pattern: "iterative BST walk", skill: "descend from root, track candidate",
    statement: "Given a BST root and a target value, return inorder successor without dumping. Walk from root, tracking the best candidate. O(h) time, O(1) space.",
    examples: [{ input: "tree = [5,3,6,2,4,null,null,1], target = 2", output: "3" }, { input: "tree = [2,1,3], target = 3", output: "None" }],
    why: "P32's naive dump was O(n) space. Successor found in single walk: whenever you go LEFT (to smaller value), current node is a candidate successor. Last such node is answer.",
    starterCode: "def inorder_successor_optimized(root, target):\n    succ = None\n    cur = root\n    pass",
    hints: ["Walk from root toward target. Whenever you go LEFT, save current node as candidate successor.", "Why? Going left means target < current. Current could be the successor.", "When search reaches target, the last saved candidate is the successor."],
    solution: "def inorder_successor_optimized(root, target):\n    succ = None\n    cur = root\n    while cur:\n        if target < cur.val:\n            succ = cur.val\n            cur = cur.left\n        else:\n            cur = cur.right\n    return succ",
    walkthrough: "Walk from root. Each left turn: cur > target, so cur could be successor. Record it. When target is reached, most recently recorded succ (where you turned left toward it) is the answer. O(h) steps, constant space.",
    testCode: "assert inorder_successor_optimized(build_tree([5,3,6,2,4,None,None,1]), 2) == 3\nassert inorder_successor_optimized(build_tree([2,1,3]), 3) is None\nassert inorder_successor_optimized(build_tree([5,3,6,2,4,None,None,1]), 4) == 5\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "BST Iterator (O(h) Space)", pattern: "controlled inorder", skill: "stack-based partial traversal",
    statement: "Implement BSTIterator: init(root), next() returns next smallest value, has_next() returns True if more remain. Space must be O(h), not O(n).",
    examples: [{ input: "tree = [7,3,15,null,null,9,20]", output: "[3,7,9,15,20]", explain: "iterate: next() returns values in order" }],
    why: "Naive dump collected ALL values at once (O(n) space). Iterator amortizes work across calls. Stack simulates recursion state — only path to next node stored, at most height h.",
    starterCode: "class BSTIterator:\n    def __init__(self, root):\n        pass\n    def next(self):\n        pass\n    def has_next(self):\n        pass",
    hints: ["Push all left children of root onto stack. Stack top is always next node to return.", "next(): pop top, then push all left children of popped node's right child.", "has_next(): stack non-empty. This simulates inorder without storing whole tree."],
    solution: "class BSTIterator:\n    def __init__(self, root):\n        self.stack = []\n        self._push_left(root)\n    \n    def _push_left(self, node):\n        while node:\n            self.stack.append(node)\n            node = node.left\n    \n    def next(self):\n        node = self.stack.pop()\n        self._push_left(node.right)\n        return node.val\n    \n    def has_next(self):\n        return len(self.stack) > 0",
    walkthrough: "Stack holds 'next nodes' in inorder. Init pushes root and all left descendants — smallest at top. Each next() pops top, returns it, then pushes right child and all its left descendants. Space is O(h): stack never holds more than tree depth.",
    testCode: "t = build_tree([7,3,15,None,None,9,20])\nit = BSTIterator(t)\nvals = []\nwhile it.has_next():\n    vals.append(it.next())\nassert vals == [3,7,9,15,20]\nt2 = build_tree([5])\nit2 = BSTIterator(t2)\nassert it2.has_next()\nassert it2.next() == 5\nassert not it2.has_next()\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Delete a Node in BST", pattern: "derived case analysis", skill: "three deletion cases",
    statement: "Given BST root and a key, delete the node with value key. Return new root. Three cases: (1) leaf, (2) one child, (3) two children — replace with inorder successor (min of right).",
    examples: [{ input: "tree = [5,3,6,2,4,null,7], key = 3", output: "[5,4,6,2,null,null,7]", explain: "3 replaced by inorder successor 4" }, { input: "tree = [5,3,6,2,4,null,7], key = 0", output: "[5,3,6,2,4,null,7]", explain: "not found, unchanged" }],
    why: "Deletion is the most mechanically complex BST operation. But it DERIVES from the invariant: (1) leaf -> remove, (2) one child -> child inherits position, (3) two children -> replace with inorder successor, delete successor.",
    starterCode: "def delete_node(root, key):\n    pass",
    hints: ["First, find the node to delete using BST search (P9).", "Case 1 (leaf): return None. Case 2 (one child): return the child. Case 3 (two children): find inorder successor (min in right, P10), copy value, delete successor.", "When copying successor's value: BST is temporarily invalid (duplicate), but deleting successor's original node restores uniqueness."],
    solution: "def delete_node(root, key):\n    if root is None:\n        return None\n    if key < root.val:\n        root.left = delete_node(root.left, key)\n    elif key > root.val:\n        root.right = delete_node(root.right, key)\n    else:\n        if root.left is None:\n            return root.right\n        if root.right is None:\n            return root.left\n        succ = root.right\n        while succ.left:\n            succ = succ.left\n        root.val = succ.val\n        root.right = delete_node(root.right, succ.val)\n    return root",
    walkthrough: "Three cases derive from BST structure. Case 1 (leaf): no children, subtree becomes None. Case 2 (one child): child already satisfies BST w/rt ancestors, link to parent. Case 3 (two children): replace with inorder successor (guaranteed at most one child), recursively delete successor.",
    testCode: "def inorder_vals(root):\n    if root is None: return []\n    return inorder_vals(root.left) + [root.val] + inorder_vals(root.right)\nt = delete_node(build_tree([5,3,6,2,4,None,7]), 3)\nassert inorder_vals(t) == [2,4,5,6,7]\nt2 = delete_node(build_tree([5,3,6,2,4,None,7]), 0)\nassert inorder_vals(t2) == [2,3,4,5,6,7]\nt3 = delete_node(build_tree([5]), 5)\nassert t3 is None\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Insert and Verify BST", pattern: "insert then validate", skill: "insert, then range-check",
    statement: "Given BST root and value, insert the value, then verify the resulting tree is still a valid BST using P16's range-check. Return True if valid after insertion.",
    examples: [{ input: "tree = [4,2,7,1,3], val = 5", output: "True" }, { input: "tree = [4,2,7,1,3], val = 2", output: "False", explain: "duplicate not allowed" }],
    why: "Composes P8 (insert) with P16 (validate). After inserting, check BST property. This 'mutate then verify' pattern is a building block for self-balancing trees.",
    starterCode: "def insert_and_verify(root, val):\n    def insert(node, val):\n        pass\n    def validate(node, low, high):\n        pass\n    root = insert(root, val)\n    pass",
    hints: ["First insert using P8's algorithm.", "Then validate using P16's range-check.", "Composing two previously learned operations — no new algorithms needed."],
     solution: "def insert_and_verify(root, val):\n    duplicate = [False]\n    def insert(node, val):\n        if node is None:\n            return TreeNode(val)\n        if val == node.val:\n            duplicate[0] = True\n            return node\n        if val < node.val:\n            node.left = insert(node.left, val)\n        else:\n            node.right = insert(node.right, val)\n        return node\n    def validate(node, low, high):\n        if node is None:\n            return True\n        if node.val <= low or node.val >= high:\n            return False\n        return validate(node.left, low, node.val) and validate(node.right, node.val, high)\n    new_root = insert(root, val)\n    if duplicate[0]:\n        return False\n    return validate(new_root, float('-inf'), float('inf'))",
    walkthrough: "Two operations in sequence: insert (P8) then validate (P16). Insert either creates new node or returns None for duplicates. If insert succeeds, validate confirms BST property holds for every node. Composition: no new algorithms, sequencing of known ones.",
    testCode: "assert insert_and_verify(build_tree([4,2,7,1,3]), 5) == True\nassert insert_and_verify(build_tree([4,2,7,1,3]), 2) == False\nassert insert_and_verify(build_tree([]), 10) == True\nassert insert_and_verify(build_tree([5,3,8,1,4,None,9]), 6) == True\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 5, title: "Kth Largest O(h) — Early Stop", pattern: "reverse inorder with counter", skill: "reverse inorder, stop at k",
    statement: "Given BST root and k, return kth largest. Use reverse inorder (right, root, left) to visit descending. Stop after k nodes. O(h+k).",
    examples: [{ input: "tree = [3,1,4,null,2], k = 1", output: "4" }, { input: "tree = [5,3,6,2,4,null,null,1], k = 3", output: "4" }],
    why: "P35's naive dump collected everything. Optimization: reverse inorder visits largest->smallest. The kth node visited IS the kth largest. Stop there.",
    starterCode: "def kth_largest_optimized(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        pass\n    dfs(root)\n    return result[0]",
    hints: ["Reverse inorder: visit right first, then node, then left. This visits in descending order.", "When count hits k, record result and stop all further recursion.", "Same early-stop pattern as P37 but with reversed visit order."],
    solution: "def kth_largest_optimized(root, k):\n    count = [0]\n    result = [None]\n    def dfs(node):\n        if node is None or result[0] is not None:\n            return\n        dfs(node.right)\n        count[0] += 1\n        if count[0] == k:\n            result[0] = node.val\n            return\n        dfs(node.left)\n    dfs(root)\n    return result[0]",
    walkthrough: "Reverse inorder (right->root->left) visits largest to smallest. Counter tracks visited nodes. When count==k, current node IS kth largest. Sentinel ensures no further work. Symmetric to P37 — only visit order differs.",
    testCode: "assert kth_largest_optimized(build_tree([3,1,4,None,2]), 1) == 4\nassert kth_largest_optimized(build_tree([5,3,6,2,4,None,None,1]), 3) == 4\nassert kth_largest_optimized(build_tree([2,1,3]), 2) == 2\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Lowest Common Ancestor in BST", pattern: "BST ordering shortcut", skill: "ordering tells which subtree has both",
    statement: "Given BST root and two distinct values p,q that exist, return LCA. Exploit BST: if both < root, go left. If both > root, go right. Otherwise root is LCA.",
    examples: [{ input: "tree = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8", output: "6" }, { input: "tree = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4", output: "2" }],
    why: "Compose BST search (P9) + range reasoning (P16). BST ordering gives O(1) check: if p,q on opposite sides of root, root IS LCA. Shortcut only possible because of BST invariant.",
    starterCode: "def lowest_common_ancestor(root, p, q):\n    pass",
    hints: ["If both p and q < root.val, both in left subtree. Where must LCA be?", "If both p and q > root.val, both in right subtree.", "If one <= root.val and other >= root.val (or one equals root.val), root IS LCA — split happens here."],
    solution: "def lowest_common_ancestor(root, p, q):\n    cur = root\n    while cur:\n        if p < cur.val and q < cur.val:\n            cur = cur.left\n        elif p > cur.val and q > cur.val:\n            cur = cur.right\n        else:\n            return cur",
    walkthrough: "BST ordering makes LCA trivial. At each node: if both in left (both < cur), go left. If both in right, go right. Moment they diverge (one left, one right, or one equals cur), cur IS LCA. O(h) time, O(1) space.",
    testCode: "t = build_tree([6,2,8,0,4,7,9,None,None,3,5])\nassert lowest_common_ancestor(t, 2, 8).val == 6\nassert lowest_common_ancestor(t, 2, 4).val == 2\nassert lowest_common_ancestor(t, 0, 5).val == 2\nt2 = build_tree([2,1])\nassert lowest_common_ancestor(t2, 1, 2).val == 2\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Recover Swapped Nodes", pattern: "inorder anomaly detection", skill: "find two swapped nodes via inorder",
    statement: "A BST has exactly two nodes whose values were swapped. Recover the BST (swap them back) without changing structure. Use inorder: in correct BST, inorder is strictly increasing.",
    examples: [{ input: "tree = [1,3,null,null,2]", output: "[3,1,null,null,2]", explain: "1 and 3 swapped -> swap back" }, { input: "tree = [3,1,4,null,null,2]", output: "[2,1,4,null,null,3]", explain: "3 and 2 swapped" }],
    why: "Compose inorder (P23) + anomaly detection (like P26). Inorder of correct BST is sorted. Swapped nodes create 'drops' in inorder sequence. Find anomalies, swap back.",
    starterCode: "def recover_tree(root):\n    first = [None]\n    second = [None]\n    prev = [None]\n    def dfs(node):\n        pass\n    dfs(root)\n    first[0].val, second[0].val = second[0].val, first[0].val",
    hints: ["Do inorder traversal. Track prev. When prev.val > node.val, found a swapped pair.", "First anomaly: first = prev (the larger one). Second anomaly: second = node (the smaller one).", "If one adjacent anomaly: two swapped nodes adjacent. If two anomalies: first's prev and second's node."],
    solution: "def recover_tree(root):\n    first = [None]\n    second = [None]\n    prev = [None]\n    def dfs(node):\n        if node is None:\n            return\n        dfs(node.left)\n        if prev[0] and prev[0].val > node.val:\n            if first[0] is None:\n                first[0] = prev[0]\n            second[0] = node\n        prev[0] = node\n        dfs(node.right)\n    dfs(root)\n    first[0].val, second[0].val = second[0].val, first[0].val",
    walkthrough: "Inorder of correct BST is sorted. Two swapped nodes create 1-2 violations (prev > node). First violation: prev is the larger-out-of-place. Last violation: node is smaller-out-of-place. Swap their values. Compose: inorder walk + anomaly detection.",
    testCode: "def inorder_vals(root):\n    if root is None: return []\n    return inorder_vals(root.left) + [root.val] + inorder_vals(root.right)\nt1 = build_tree([1,3,None,None,2])\nrecover_tree(t1)\nassert inorder_vals(t1) == [1,2,3]\nt2 = build_tree([3,1,4,None,None,2])\nrecover_tree(t2)\nassert inorder_vals(t2) == [1,2,3,4]\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Serialize and Deserialize BST", pattern: "preorder with markers", skill: "encode null as sentinel",
    statement: "Design serialize: BST to string. Deserialize: string to BST. Use preorder with \"N\" for None. E.g., [2,1,3] -> \"2,1,N,N,3,N,N\".",
    examples: [{ input: "tree = [2,1,3]", output: "'2,1,N,N,3,N,N'" }, { input: "s = '2,1,N,N,3,N,N'", output: "[2,1,3]", explain: "roundtrip preserves tree" }],
    why: "Compose preorder traversal + reconstruction. Serialize: encode tree as string. Deserialize: consume string, reconstruct. Preorder preserves the root-first structure needed for reconstruction.",
    starterCode: "def serialize(root):\n    pass\n\ndef deserialize(data):\n    pass",
    hints: ["Serialize: preorder traversal. When node is None, append \"N\". Otherwise append str(node.val) and recurse left, right.", "Join collected values with commas.", "Deserialize: split by comma. Index pointer. When token == \"N\", return None. Else create TreeNode, advance index, set left/right recursively."],
    solution: "def serialize(root):\n    vals = []\n    def preorder(node):\n        if node is None:\n            vals.append(\"N\")\n            return\n        vals.append(str(node.val))\n        preorder(node.left)\n        preorder(node.right)\n    preorder(root)\n    return \",\".join(vals)\n\ndef deserialize(data):\n    if not data:\n        return None\n    tokens = data.split(\",\")\n    idx = [0]\n    def build():\n        if idx[0] >= len(tokens) or tokens[idx[0]] == \"N\":\n            idx[0] += 1\n            return None\n        node = TreeNode(int(tokens[idx[0]]))\n        idx[0] += 1\n        node.left = build()\n        node.right = build()\n        return node\n    return build()",
    walkthrough: "Serialize: preorder (root, left, right) captures structure. \"N\" markers disambiguate shapes. Deserialize: read preorder sequence. First value is root. Recursively build left until \"N\", then right. BST property encoded implicitly by preorder order.",
    testCode: "t = build_tree([2,1,3])\ns = serialize(t)\nassert s == '2,1,N,N,3,N,N'\nt2 = deserialize(s)\ndef inorder_vals(root):\n    if root is None: return []\n    return inorder_vals(root.left) + [root.val] + inorder_vals(root.right)\nassert inorder_vals(t2) == [1,2,3]\nt3 = deserialize(serialize(build_tree([5,3,8,1,4,None,9])))\nassert inorder_vals(t3) == [1,3,4,5,8,9]\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "BST from Preorder", pattern: "range-bounded reconstruction", skill: "use bound to know where subtree ends",
    statement: "Given a preorder traversal array of a BST, reconstruct and return the root. Use a bound: when next value exceeds bound, that subtree ends.",
    examples: [{ input: "preorder = [8,5,1,7,10,12]", output: "[8,5,10,1,7,null,12]" }, { input: "preorder = [1,3]", output: "[1,null,3]" }],
    why: "P46 serialized with preorder. P47 deserializes WITHOUT sentinel markers — using BST ranges instead. When next value > current bound, left subtree is complete.",
    starterCode: "def bst_from_preorder(preorder):\n    i = [0]\n    def build(bound):\n        pass\n    return build(float('inf'))",
    hints: ["Preorder: first value is root. Next values belong to left subtree if < root.val, then right subtree.", "Maintain bound parameter. If next value > bound, this subtree ends (all values in a left subtree must be < parent).", "Recurse: build left with bound=node.val. build right with original bound. Base: index exhausted or next > bound."],
    solution: "def bst_from_preorder(preorder):\n    i = [0]\n    def build(bound):\n        if i[0] == len(preorder) or preorder[i[0]] > bound:\n            return None\n        node = TreeNode(preorder[i[0]])\n        i[0] += 1\n        node.left = build(node.val)\n        node.right = build(bound)\n        return node\n    return build(float('inf'))",
    walkthrough: "Preorder: root first, then left subtree, then right subtree. The range bound tells where left subtree ends: when next value > node.val, left subtree is done. Right subtree uses original bound. Compose: preorder + range propagation.",
    testCode: "def inorder_vals(root):\n    if root is None: return []\n    return inorder_vals(root.left) + [root.val] + inorder_vals(root.right)\nt = bst_from_preorder([8,5,1,7,10,12])\nassert inorder_vals(t) == [1,5,7,8,10,12]\nt2 = bst_from_preorder([1,3])\nassert inorder_vals(t2) == [1,3]\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Trim BST", pattern: "range cut", skill: "discard out-of-range subtrees",
    statement: "Given BST root and [low, high], trim tree so all nodes in range. If node < low, discard node and left subtree; return trim of right. If > high, discard node and right; return trim of left.",
    examples: [{ input: "tree = [1,0,2], low = 1, high = 2", output: "[1,null,2]" }, { input: "tree = [3,0,4,null,2,null,null,1], low = 1, high = 3", output: "[3,2,null,1]" }],
    why: "BST property enables pruning: if node out of range, entire subtree on one side is also out. Trim recursively, reassign children. Compose: range-filter + tree mutation.",
    starterCode: "def trim_bst(root, low, high):\n    pass",
    hints: ["If root.val < low: node and left subtree too small. Return trim_bst(root.right).", "If root.val > high: node and right subtree too big. Return trim_bst(root.left).", "If in range: trim both children, reassign root.left/root.right, return root."],
    solution: "def trim_bst(root, low, high):\n    if root is None:\n        return None\n    if root.val < low:\n        return trim_bst(root.right, low, high)\n    if root.val > high:\n        return trim_bst(root.left, low, high)\n    root.left = trim_bst(root.left, low, high)\n    root.right = trim_bst(root.right, low, high)\n    return root",
    walkthrough: "BST property makes trim efficient: if < low, entire left subtree is also < low, discard everything and return trimmed right. If > high, discard and return trimmed left. If in range, recurse both children. Compose: range reasoning + pointer reassignment.",
    testCode: "t = trim_bst(build_tree([1,0,2]), 1, 2)\nassert t.val == 1\nassert t.left is None\nassert t.right.val == 2\nt2 = trim_bst(build_tree([3,0,4,None,2,None,None,1]), 1, 3)\nassert t2.val == 3\nassert t2.right is None\nassert t2.left.val == 2\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Is BST AND Balanced", pattern: "dual check", skill: "validate BST ranges + check height balance",
    statement: "Given root of binary tree, return True if tree is BOTH a valid BST AND height-balanced (|left height - right height| <= 1 for every node).",
    examples: [{ input: "tree = [2,1,3]", output: "True" }, { input: "tree = [5,1,4,null,null,3,6]", output: "False", explain: "not a BST" }],
    why: "Compose BST validation (P16) + height-balance check. DFS returns (is_valid, height). At each node: check BST ranges, check height balance, compute height. Both checks satisfied simultaneously.",
    starterCode: "def is_bst_and_balanced(root):\n    def dfs(node, low, high):\n        pass\n    return dfs(root, float('-inf'), float('inf'))[0]",
    hints: ["Helper returns (is_valid, height). Base: None returns (True, 0).", "Check BST: node.val must be in (low, high). Check balance: |left_height - right_height| <= 1.", "If either check fails, return (False, 0). Otherwise return (True, 1 + max(left_h, right_h))."],
    solution: "def is_bst_and_balanced(root):\n    def dfs(node, low, high):\n        if node is None:\n            return (True, 0)\n        if node.val <= low or node.val >= high:\n            return (False, 0)\n        left_ok, left_h = dfs(node.left, low, node.val)\n        if not left_ok:\n            return (False, 0)\n        right_ok, right_h = dfs(node.right, node.val, high)\n        if not right_ok:\n            return (False, 0)\n        if abs(left_h - right_h) > 1:\n            return (False, 0)\n        return (True, 1 + max(left_h, right_h))\n    return dfs(root, float('-inf'), float('inf'))[0]",
    walkthrough: "Compares: BST range validation (P16) + height balance check. DFS returns tuple (is_valid, subtree_height). Each node validates its range, then checks children are valid, then checks height difference <= 1. All three conditions must pass.",
    testCode: "assert is_bst_and_balanced(build_tree([2,1,3])) == True\nassert is_bst_and_balanced(build_tree([5,1,4,None,None,3,6])) == False\nassert is_bst_and_balanced(build_tree([2,1,3,None,None,4,5])) == False\nassert is_bst_and_balanced(None) == True\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Largest BST Subtree", pattern: "bottom-up BST check", skill: "return (isBST, size, min, max) per subtree",
    statement: "Given a binary tree root, return the size of the LARGEST BST subtree anywhere in the tree. A subtree must be a valid BST for all its descendants.",
    examples: [{ input: "tree = [10,5,15,1,8,null,7]", output: "3", explain: "largest BST subtree: node 5 with children 1 and 8" }, { input: "tree = [4,2,7,2,3,5,null,2,null,null,null,null,null,1]", output: "2" }],
    why: "Compose BST validation + measurement + range tracking. Each subtree returns (is_bst, size, min_val, max_val). If left and right are BSTs and root.val > left.max and < right.min, current subtree is a BST.",
    starterCode: "def largest_bst_subtree(root):\n    def dfs(node):\n        pass\n    return dfs(root)[1]",
    hints: ["Helper returns (is_bst, size, min_val, max_val). Base: None returns (True, 0, inf, -inf).", "At each node: get left/right results. Check if left is BST AND right is BST AND left.max < node.val < right.min.", "If valid BST: size = 1 + left.size + right.size. Track max size globally. Return updated range: (min(left.min, node.val), max(right.max, node.val))."],
    solution: "def largest_bst_subtree(root):\n    max_size = [0]\n    def dfs(node):\n        if node is None:\n            return (True, 0, float('inf'), float('-inf'))\n        left_bst, left_size, left_min, left_max = dfs(node.left)\n        right_bst, right_size, right_min, right_max = dfs(node.right)\n        if left_bst and right_bst and left_max < node.val < right_min:\n            size = 1 + left_size + right_size\n            max_size[0] = max(max_size[0], size)\n            return (True, size, min(left_min, node.val), max(right_max, node.val))\n        return (False, 0, 0, 0)\n    dfs(root)\n    return max_size[0]",
    walkthrough: "Compares: BST validation (P16) + subtree measurement. Each node returns 4-tuple: is_bst, bst_size, min_in_subtree, max_in_subtree. For a subtree to be BST: left & right must be BSTs, and left.max < root.val < right.min. Global max tracks largest size.",
    testCode: "assert largest_bst_subtree(build_tree([10,5,15,1,8,None,7])) == 3\nassert largest_bst_subtree(build_tree([2,1,3])) == 3\nassert largest_bst_subtree(None) == 0\nassert largest_bst_subtree(build_tree([4,2,7,2,3,5,None,2,None,None,None,None,None,1])) == 2\nprint('All tests passed!')"
  },
]

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
`
