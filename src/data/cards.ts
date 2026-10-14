// 36 Core Algorithmic & System Thinking Moves — The Pattern Reflex Deck
// Conforms to Deriva curriculum laws (docs/03): one thinking-move per card,
// invariants over templates, naive waste revealed before the leap.

export type CardTopic =
  | "trees"
  | "pointers"
  | "arrays"
  | "stack"
  | "search"
  | "graphs"
  | "dp"
  | "heaps"
  | "bits"
  | "intervals"

export interface PatternCard {
  id: string
  title: string
  topic: CardTopic
  difficulty: "Easy" | "Medium" | "Hard"
  prompt: string
  options: [string, string, string]
  correctOption: 0 | 1 | 2
  moveName: string
  invariant: string
  naiveWaste: string
  cue: string
  practiceLink?: string
}

export const TOPIC_LABELS: Record<CardTopic, { label: string; glyph: string }> = {
  trees: { label: "Trees", glyph: "🌲" },
  pointers: { label: "Two Pointers", glyph: "⇄" },
  arrays: { label: "Prefix & Arrays", glyph: "▦" },
  stack: { label: "Monotonic Stack", glyph: "▤" },
  search: { label: "Binary Search", glyph: "⌕" },
  graphs: { label: "Graphs & BFS", glyph: "☊" },
  dp: { label: "Dynamic Programming", glyph: "∿" },
  heaps: { label: "Heaps & Priority", glyph: "▲" },
  bits: { label: "Bit Manipulation", glyph: "⊛" },
  intervals: { label: "Intervals", glyph: "◫" },
}

export const PATTERN_CARDS: PatternCard[] = [
  // 1. Trees
  {
    id: "tree-diameter",
    title: "Diameter of Binary Tree",
    topic: "trees",
    difficulty: "Easy",
    prompt: "You need the longest path between any two nodes in a binary tree. The path might not cross the root.",
    options: [
      "Level-order BFS from the deepest leaf node found",
      "Post-order DFS returning (diameter, height) upward in one pass",
      "Store all parent pointers in a hash map, then run Floyd-Warshall"
    ],
    correctOption: 1,
    moveName: "Returning Tuples",
    invariant: "At every node, the longest path bending through it is left_height + right_height. Returning height upward lets the parent decide without re-measuring.",
    naiveWaste: "Calling height(node) repeatedly inside an outer DFS visits subtrees O(n²) times. Tuples collapse it to O(n).",
    cue: "Whenever a global metric depends on subtree measurements from both children.",
    practiceLink: "/practice?topic=trees&problem=4"
  },
  {
    id: "tree-lca",
    title: "Lowest Common Ancestor (No Parents)",
    topic: "trees",
    difficulty: "Medium",
    prompt: "Given two nodes p and q in a tree without parent pointers, find their lowest shared ancestor.",
    options: [
      "Top-down search from root: if p and q fall into separate subtrees, current node is the split",
      "Record in-order traversal and take the middle element between p and q",
      "Generate all paths from root to leaves and compare paths using two pointers"
    ],
    correctOption: 0,
    moveName: "Subtree Split Invariant",
    invariant: "If left subtree has p and right has q, root is the LCA. If only one child reports a hit, the LCA is in that child.",
    naiveWaste: "Rebuilding node-to-root path arrays takes O(n) auxiliary space. A single bottom-up bubble finds the fork in O(1) extra space.",
    cue: "Whenever you need the convergence point of two recursive signals.",
    practiceLink: "/practice?topic=trees&problem=8"
  },
  {
    id: "tree-balanced",
    title: "Balanced Binary Tree Check",
    topic: "trees",
    difficulty: "Easy",
    prompt: "Determine if a binary tree is height-balanced (for every node, left and right subtree heights differ by at most 1).",
    options: [
      "Calculate total node count and compare to 2^h - 1",
      "Post-order traversal returning -1 immediately as a poison pill when unbalanced",
      "Sort node levels using BFS and check if last two levels are full"
    ],
    correctOption: 1,
    moveName: "Poison Pill Early Exit",
    invariant: "If any subtree is unbalanced, the entire tree is unbalanced. Return -1 to short-circuit the recursion instantly.",
    naiveWaste: "Calling depth(left) and depth(right) at every node computes heights top-down in O(n²). Bottom-up exit takes O(n).",
    cue: "When verifying a local constraint that invalidates the whole structure globally.",
    practiceLink: "/practice?topic=trees&problem=3"
  },
  {
    id: "tree-max-path-sum",
    title: "Maximum Path Sum (Any to Any)",
    topic: "trees",
    difficulty: "Hard",
    prompt: "Find the maximum path sum between any two nodes. Values can be negative.",
    options: [
      "Dijkstra algorithm treating tree edges as directed weights",
      "DFS returning max single-arm contribution max(0, val + max(left, right)), updating global best with left + right + val",
      "Convert tree to an adjacency matrix and compute all-pairs shortest paths"
    ],
    correctOption: 1,
    moveName: "Branching vs Unilateral Gain",
    invariant: "A path can bend through only ONE highest node. A recursive call can only pass ONE straight branch up to its caller.",
    naiveWaste: "Computing path sums for every pair of nodes requires O(n²) path walks. Decomposing into unilateral gain vs apex bend is O(n).",
    cue: "When an optimum path can curve once at an apex but cannot branch upward.",
    practiceLink: "/practice?topic=trees&problem=10"
  },

  // 2. Two Pointers
  {
    id: "pointer-cycle",
    title: "Linked List Cycle Detection",
    topic: "pointers",
    difficulty: "Easy",
    prompt: "Detect if a linked list contains a cycle using O(1) memory.",
    options: [
      "Fast and slow pointers moving at 2x and 1x speeds — they must collide if a loop exists",
      "Reverse the linked list; if you return to the head, there is a cycle",
      "Hash node values into a Bloom filter"
    ],
    correctOption: 0,
    moveName: "Floyd's Tortoise & Hare",
    invariant: "Inside a cycle of length C, the distance between slow and fast decreases by 1 on every step until collision.",
    naiveWaste: "Storing visited pointers in a HashSet uses O(n) memory. Differential speeds bound space to O(1).",
    cue: "Any cyclic directed graph where outdegree = 1 and space is strictly bounded to O(1).",
    practiceLink: "/practice?topic=linked-lists&problem=4"
  },
  {
    id: "pointer-water",
    title: "Container With Most Water",
    topic: "pointers",
    difficulty: "Medium",
    prompt: "Given heights array, find two lines that together with the x-axis forms a container holding the maximum water.",
    options: [
      "Sort the heights and pair the two largest elements",
      "Start pointers at both ends; always advance the pointer pointing to the shorter line inward",
      "Compute the convex hull of the points"
    ],
    correctOption: 1,
    moveName: "Elimination Frontier",
    invariant: "Width shrinks with every step. Moving the taller line can NEVER increase area (capped by shorter). Only moving the shorter line has a chance to improve.",
    naiveWaste: "Checking all pairs is O(n²). The shorter line is provably dead for all inner combinations — eliminating it makes it O(n).",
    cue: "When one bound of a min(a, b) * distance formula caps every partner in an interval.",
    practiceLink: "/practice?topic=intervals&problem=1"
  },
  {
    id: "pointer-dutch",
    title: "Dutch National Flag (Sort 0s, 1s, 2s)",
    topic: "pointers",
    difficulty: "Medium",
    prompt: "Sort an array of 0s, 1s, and 2s in-place in a single pass.",
    options: [
      "Count occurrences of 0, 1, 2 and overwrite the array in a second pass",
      "3 pointers (low, mid, high): [0..low-1] is 0s, [low..mid-1] is 1s, [high+1..n-1] is 2s",
      "Quicksort with random pivot selection"
    ],
    correctOption: 1,
    moveName: "Tri-Partition Invariant",
    invariant: "Every element in [mid..high] is unclassified. Swapping with low moves a 0 into settled zone; swapping with high shrinks the unsettled tail.",
    naiveWaste: "Counting requires two passes. 3-way partition segments the world into 3 invariant zones in a single physical pass.",
    cue: "Partitioning an array into exactly three categories in-place.",
    practiceLink: "/practice?topic=backtracking&problem=2"
  },
  {
    id: "pointer-duplicate",
    title: "Find Duplicate in [1, n] Array (O(1) Space)",
    topic: "pointers",
    difficulty: "Medium",
    prompt: "Array of n+1 integers in range [1, n] with exactly one duplicate. Find it without modifying array and using O(1) space.",
    options: [
      "Sort array in O(n log n) and check adjacent elements",
      "Treat index -> value as a functional directed graph (i -> nums[i]) and find cycle entry",
      "Sum the elements and subtract n*(n+1)//2"
    ],
    correctOption: 1,
    moveName: "Array As Functional Graph",
    invariant: "Since every value is in [1, n], nums[i] is a valid index. Duplicate values mean two nodes point to the same node (cycle entry).",
    naiveWaste: "Modifying the array (negation marking) breaks read-only contracts. Cycle entry detection is non-destructive O(n) time, O(1) space.",
    cue: "Array of size n+1 with values 1..n treated as pointer hops.",
    practiceLink: "/practice?topic=linked-lists&problem=5"
  },

  // 3. Arrays & Prefix State
  {
    id: "prefix-sum-k",
    title: "Subarray Sum Equals K",
    topic: "arrays",
    difficulty: "Medium",
    prompt: "Find total number of continuous subarrays whose sum equals k. Array can contain negative numbers.",
    options: [
      "Sliding window expanding right and contracting left whenever window sum exceeds k",
      "Prefix sum frequency map: count occurrences of (current_prefix - k)",
      "Sort prefix sums and use binary search"
    ],
    correctOption: 1,
    moveName: "Prefix Difference Invariant",
    invariant: "sum(i..j) = prefix[j] - prefix[i-1]. If prefix[j] - prefix[i-1] = k, then prefix[i-1] = prefix[j] - k.",
    naiveWaste: "Sliding window fails because negative numbers destroy monotonicity. Hash map tracks all valid prefix histories in O(n).",
    cue: "Subarray sum target when elements can be NEGATIVE (destroys sliding window).",
    practiceLink: "/practice?topic=intervals&problem=3"
  },
  {
    id: "prefix-equal-01",
    title: "Contiguous Array with Equal 0s and 1s",
    topic: "arrays",
    difficulty: "Medium",
    prompt: "Find the maximum length of a contiguous subarray with an equal number of 0s and 1s.",
    options: [
      "Transform 0 to -1, then find the two farthest indices sharing the same prefix sum",
      "Two pointers shrinking from edges checking counts",
      "Bitwise XOR of all elements in sliding window"
    ],
    correctOption: 0,
    moveName: "State Mapping Transform",
    invariant: "If 0 is replaced by -1, an equal subarray has sum 0. Two matching prefix sums mean the slice between them sums to zero.",
    naiveWaste: "Checking every subarray takes O(n²). Storing the first seen index of each prefix sum yields max length in O(n).",
    cue: "Balancing two discrete items in a contiguous slice.",
    practiceLink: "/practice?topic=intervals&problem=4"
  },
  {
    id: "prefix-product",
    title: "Product of Array Except Self",
    topic: "arrays",
    difficulty: "Medium",
    prompt: "Compute output array where out[i] is product of all elements except nums[i], without using division in O(n).",
    options: [
      "Logarithmic transform: sum log(x) and take exponent",
      "Two-pass prefix and suffix products: out[i] = prefix[i-1] * suffix[i+1]",
      "Segment tree range product query"
    ],
    correctOption: 1,
    moveName: "Prefix & Suffix Decomposition",
    invariant: "Everything except i is cleanly partitioned into: (elements to left of i) × (elements to right of i).",
    naiveWaste: "Recomputing products for every index takes O(n²). Accumulating left prefix on forward pass and right suffix on reverse pass takes O(n).",
    cue: "Excluding exactly one element without division.",
    practiceLink: "/practice?topic=intervals&problem=2"
  },

  // 4. Monotonic Stack
  {
    id: "stack-next-greater",
    title: "Next Greater Element",
    topic: "stack",
    difficulty: "Medium",
    prompt: "For each element in an array, find the first element to its right that is strictly greater.",
    options: [
      "Sort the array with original indices using mergesort",
      "Monotonic decreasing stack: pop smaller elements when a larger element arrives",
      "Build a balanced binary search tree of suffixes"
    ],
    correctOption: 1,
    moveName: "Monotonic Stack Elimination",
    invariant: "Any smaller element seen earlier can NEVER be the next greater element for future numbers. The current number claims and retires them.",
    naiveWaste: "Scanning right from each index takes O(n²). Each element is pushed and popped at most once, running in strictly O(n).",
    cue: "First element to the left or right satisfying a comparison condition.",
    practiceLink: "/practice?topic=heap&problem=1"
  },
  {
    id: "stack-histogram",
    title: "Largest Rectangle in Histogram",
    topic: "stack",
    difficulty: "Hard",
    prompt: "Find the area of the largest rectangle that fits inside a histogram bar chart.",
    options: [
      "Divide and conquer: find minimum height bar and recurse on left and right",
      "Monotonic increasing stack: when a shorter bar arrives, it bounds the right edge of taller bars",
      "Dynamic programming with dp[i][j] storing minimum height between i and j"
    ],
    correctOption: 1,
    moveName: "Left & Right Boundary Resolution",
    invariant: "A bar's height can extend left until the first shorter bar, and right until the first shorter bar. A monotonic stack reveals both simultaneously.",
    naiveWaste: "Testing all (i, j) width pairs takes O(n²). Stack resolves every bar's maximum expansion in O(n).",
    cue: "Finding how far a value can expand horizontally before hitting smaller bounds.",
    practiceLink: "/practice?topic=heap&problem=2"
  },
  {
    id: "stack-rainwater",
    title: "Trapping Rain Water",
    topic: "stack",
    difficulty: "Hard",
    prompt: "Given n non-negative integers representing elevation map where width of each bar is 1, compute how much water it can trap.",
    options: [
      "Two pointers from left & right tracking left_max and right_max",
      "Breadth-first flood fill from the sky",
      "Prefix XOR of elevation peaks"
    ],
    correctOption: 0,
    moveName: "Bottleneck Minimum Invariant",
    invariant: "Water trapped above bar i is max(0, min(max_left, max_right) - height[i]). If left_max < right_max, left_max is the true bottleneck.",
    naiveWaste: "Finding left and right maximums from each bar naively takes O(n²). Two pointers eliminate the scan in O(1) space.",
    cue: "Bounded basin volume capped by the shorter of two surrounding walls.",
    practiceLink: "/practice?topic=intervals&problem=5"
  },

  // 5. Binary Search
  {
    id: "search-monotonic",
    title: "Binary Search on Answer Space",
    topic: "search",
    difficulty: "Medium",
    prompt: "Ship packages within D days. Find the minimum ship weight capacity that can succeed.",
    options: [
      "Simulate every integer capacity from max(weights) to sum(weights)",
      "Binary search over [max(weights), sum(weights)]: if capacity C succeeds, all >C succeed",
      "Dynamic programming partition of weights into D subsets"
    ],
    correctOption: 1,
    moveName: "Predicate Monotonicity",
    invariant: "If capacity K can deliver all packages in D days, any capacity > K can also succeed. Feasibility is a monotonic step function: F F F T T T.",
    naiveWaste: "Linear search over capacity range is slow. Monotonic predicate allows binary search to eliminate half the answer space each step.",
    cue: "Find the MINIMUM or MAXIMUM X such that a condition holds, where success is monotonic.",
    practiceLink: "/practice?topic=math&problem=2"
  },
  {
    id: "search-rotated",
    title: "Search in Rotated Sorted Array",
    topic: "search",
    difficulty: "Medium",
    prompt: "A sorted array was rotated at an unknown pivot. Search for a target in O(log n).",
    options: [
      "Find pivot with linear scan, then binary search on the appropriate half",
      "At any mid, at least ONE half ([left..mid] or [mid..right]) is strictly sorted. Check if target lies in the sorted half",
      "Randomized quickselect"
    ],
    correctOption: 1,
    moveName: "Half-Sorted Invariant",
    invariant: "A rotated sorted array cut in half ALWAYS leaves at least one normally sorted half. You can test bounds on the sorted half in O(1).",
    naiveWaste: "Two passes (find pivot, then search) can be combined into one single pass by checking `nums[left] <= nums[mid]`.",
    cue: "A partitioned or shifted space where one half remains orderly.",
    practiceLink: "/practice?topic=math&problem=3"
  },

  // 6. Sliding Window
  {
    id: "window-k-distinct",
    title: "Longest Substring with at Most K Distinct",
    topic: "arrays",
    difficulty: "Medium",
    prompt: "Find the length of the longest substring containing at most k distinct characters.",
    options: [
      "Generate all substrings and check set(sub) size",
      "Sliding window: expand right until distinct > k; then shrink left until distinct <= k",
      "Trie storing all prefixes of length up to k"
    ],
    correctOption: 1,
    moveName: "Expand & Shrink Invariant",
    invariant: "Both left and right pointers only move rightward. Distinct count is maintained incrementally with a frequency hash.",
    naiveWaste: "Checking every substring is O(n³). Each character enters the window once and leaves once: O(n) total amortized.",
    cue: "Contiguous slice where valid condition is monotonic with respect to window growth.",
    practiceLink: "/practice?topic=intervals&problem=6"
  },
  {
    id: "window-min-substring",
    title: "Minimum Window Substring",
    topic: "arrays",
    difficulty: "Hard",
    prompt: "Find the shortest substring in s that contains all characters of string t in their required frequencies.",
    options: [
      "Expand right to satisfy all required counts; then contract left to minimize length while preserving validity",
      "Compute all permutations of string t and search with KMP",
      "Dynamic programming with state (index, matched_mask)"
    ],
    correctOption: 0,
    moveName: "Satisfy Then Minimize",
    invariant: "Only contract when the window is FULLY VALID. As soon as contracting drops a needed character, resume expanding.",
    naiveWaste: "Checking every substring against target frequencies takes O(n² * alphabet). Sliding window visits each character twice.",
    cue: "Shortest contiguous slice covering a multi-element frequency requirement.",
    practiceLink: "/practice?topic=intervals&problem=7"
  },

  // 7. Graphs & BFS
  {
    id: "graph-bfs-unweighted",
    title: "Shortest Path in Unweighted Graph",
    topic: "graphs",
    difficulty: "Medium",
    prompt: "Find the minimum number of step transformations from start word to target word, changing one letter at a time (Word Ladder).",
    options: [
      "DFS exploring all branches, keeping track of min length to avoid infinite recursion",
      "Queue-based BFS level by level: the FIRST time target is reached is guaranteed shortest",
      "A* search with Hamming distance heuristic"
    ],
    correctOption: 1,
    moveName: "Concentric Layer Invariant",
    invariant: "In unweighted graphs, BFS visits all nodes at distance d before any node at distance d+1. The first arrival is the global minimum.",
    naiveWaste: "DFS must explore all paths because an early path might not be shortest. BFS stops on the very first hit.",
    cue: "Fewest steps / shortest path in an unweighted transition graph.",
    practiceLink: "/practice?topic=graphs&problem=1"
  },
  {
    id: "graph-topological",
    title: "Course Schedule (Dependency Ordering)",
    topic: "graphs",
    difficulty: "Medium",
    prompt: "Given prerequisites pairs [a, b], determine if it's possible to finish all courses (detect directed cycle).",
    options: [
      "Compute all pairwise distances with Floyd-Warshall",
      "Kahn's Algorithm: calculate in-degrees, queue nodes with in-degree 0, peel them off and decrement neighbors",
      "Sort courses by number of prerequisites ascending"
    ],
    correctOption: 1,
    moveName: "Indegree Zero Peeling",
    invariant: "A node with in-degree 0 has no unmet dependencies and can run immediately. If nodes remain after peeling, a cycle trapped them.",
    naiveWaste: "DFS cycle detection requires maintaining 3-state coloring (visiting, visited, unvisited). Kahn's is intuitive queue elimination.",
    cue: "Ordering tasks under prerequisite constraints or finding directed cycles.",
    practiceLink: "/practice?topic=graphs&problem=4"
  },
  {
    id: "graph-union-find",
    title: "Redundant Connection (Cycle in Undirected)",
    topic: "graphs",
    difficulty: "Medium",
    prompt: "Given an undirected graph that started as a tree with one extra edge added. Find the edge that formed the cycle.",
    options: [
      "Run BFS from every single node",
      "Union-Find: for each edge (u, v), if find(u) == find(v), they were already connected (cycle edge)",
      "Topological sort"
    ],
    correctOption: 1,
    moveName: "Disjoint Set Equivalence",
    invariant: "In a tree, every pair of nodes has exactly ONE path. If an edge connects two nodes already in the same set, that edge creates a cycle.",
    naiveWaste: "Running DFS for every edge to check connectivity takes O(V * E). Union-Find with path compression checks in near O(1) α(n).",
    cue: "Dynamic connectivity, component counts, or cycle detection as edges arrive.",
    practiceLink: "/practice?topic=advanced-graphs&problem=1"
  },

  // 8. Dynamic Programming
  {
    id: "dp-house-robber",
    title: "House Robber (Adjacent Exclusion)",
    topic: "dp",
    difficulty: "Easy",
    prompt: "Rob houses along a street to maximize money, but cannot rob two adjacent houses.",
    options: [
      "Greedy: sort houses by money and take largest non-adjacent",
      "State transition: rob(i) = max(rob(i-1), rob(i-2) + nums[i]) keeping only last two states",
      "Branch and bound search with alpha-beta pruning"
    ],
    correctOption: 1,
    moveName: "Two-State Memory Reduction",
    invariant: "At house i, you either skip it (keep previous best) or rob it (take i-2 best + current). Only the previous two values matter.",
    naiveWaste: "Storing full array dp[n] wastes O(n) space. State only depends on t-1 and t-2, reducible to O(1) space.",
    cue: "Decisions where taking item i locks out item i-1.",
    practiceLink: "/practice?topic=dp&problem=1"
  },
  {
    id: "dp-coin-change",
    title: "Coin Change (Unbounded Minimum)",
    topic: "dp",
    difficulty: "Medium",
    prompt: "Find fewest number of coins needed to make up a given amount, or -1 if impossible.",
    options: [
      "Greedy: always choose the largest coin denomination first",
      "Bottom-up DP: dp[a] = 1 + min(dp[a - coin] for coin in coins if a >= coin)",
      "Recursive DFS trying every coin without memoization"
    ],
    correctOption: 1,
    moveName: "Optimal Substructure Across Choices",
    invariant: "The optimal coins for amount A is 1 plus the minimum coins needed for (A - c) across all available coins c.",
    naiveWaste: "Greedy fails on canonical cases like coins [1, 3, 4] for amount 6 (Greedy chooses 4+1+1=3, optimal is 3+3=2). DP verifies all transitions.",
    cue: "Fewest units to assemble a target where greedy choices can lead to dead ends.",
    practiceLink: "/practice?topic=dp&problem=3"
  },
  {
    id: "dp-buy-sell-cooldown",
    title: "Best Time to Buy & Sell Stock with Cooldown",
    topic: "dp",
    difficulty: "Medium",
    prompt: "Maximize profit with unlimited transactions, but after selling, you must cooldown for 1 day before buying again.",
    options: [
      "Greedy: sell whenever price goes up",
      "Finite State Machine DP with 3 states: Hold, Sold (cooldown), and Rest",
      "Divide and conquer splitting price array in half"
    ],
    correctOption: 1,
    moveName: "State Machine DP",
    invariant: "Hold = max(Hold, Rest - price); Sold = Hold + price; Rest = max(Rest, Sold_prev). Transitions are a clean directed state graph.",
    naiveWaste: "Trying all combinations takes O(2ⁿ). Modeling state transitions over 3 discrete registers takes O(n) time and O(1) space.",
    cue: "Multi-action problems with restrictions (cooldowns, transaction fees, state locks).",
    practiceLink: "/practice?topic=dp&problem=5"
  },

  // 9. Heaps
  {
    id: "heap-running-median",
    title: "Find Running Median in Stream",
    topic: "heaps",
    difficulty: "Hard",
    prompt: "Continuously insert numbers from a stream and report the median in O(1) time.",
    options: [
      "Maintain a sorted array with binary search insertion",
      "Dual Heaps: max-heap for lower half, min-heap for upper half, balanced within size difference <= 1",
      "Segment tree tracking frequency counts"
    ],
    correctOption: 1,
    moveName: "Dual-Heap Frontier Balancing",
    invariant: "Max-heap holds smaller half; min-heap holds larger half. The median is either the root of the larger heap or the average of both roots.",
    naiveWaste: "Inserting into sorted array takes O(n) shift time. Dual heaps support O(log n) insert and O(1) median query.",
    cue: "Tracking a percentile or median in a dynamically growing stream.",
    practiceLink: "/practice?topic=heap&problem=3"
  },
  {
    id: "heap-k-merge",
    title: "Merge K Sorted Lists",
    topic: "heaps",
    difficulty: "Hard",
    prompt: "Merge k sorted linked lists into one sorted list in O(N log k) time.",
    options: [
      "Combine all into one list and run quicksort in O(N log N)",
      "Min-heap holding current head node of each list (size k); pop min and push its next node",
      "Merge lists sequentially one by one in O(k * N)"
    ],
    correctOption: 1,
    moveName: "K-Way Tournament Frontier",
    invariant: "At any point, the global next smallest element MUST be among the k current front runners. A heap of size k finds it in O(log k).",
    naiveWaste: "Pairwise linear merge takes O(k * N). A min-heap maintains only the active frontier in O(N log k).",
    cue: "Merging or selecting the next minimum across k sorted input streams.",
    practiceLink: "/practice?topic=heap&problem=4"
  },

  // 10. Bits & Math
  {
    id: "bit-single-number",
    title: "Single Number (All Others Appear Twice)",
    topic: "bits",
    difficulty: "Easy",
    prompt: "Given array where every element appears twice except for one. Find that single element in O(n) time and O(1) memory.",
    options: [
      "XOR all numbers together: identical pairs cancel out to 0 (a ^ a = 0)",
      "Hash map counting frequencies",
      "Sort array and check pairs"
    ],
    correctOption: 0,
    moveName: "XOR Involution & Self-Inverse",
    invariant: "XOR is commutative and self-inverse: a ^ a = 0, and a ^ 0 = a. All duplicate pairs annihilate, leaving only the lone element.",
    naiveWaste: "Hash map takes O(n) memory. Sorting takes O(n log n). XOR is O(n) time and zero auxiliary space.",
    cue: "Finding an odd-count item when all other items appear in even multiples.",
    practiceLink: "/practice?topic=bit-manipulation&problem=1"
  },
  {
    id: "bit-drop-lowest",
    title: "Count Set Bits (Hamming Weight)",
    topic: "bits",
    difficulty: "Easy",
    prompt: "Count the number of '1' bits in an integer in time proportional only to the number of set bits.",
    options: [
      "Loop 32 times checking (n >> i) & 1",
      "Repeatedly clear the lowest set bit using n = n & (n - 1)",
      "Lookup table for all 4 billion integers"
    ],
    correctOption: 1,
    moveName: "Brian Kernighan's Bit Clear",
    invariant: "Subtracting 1 flips all bits after the lowest 1 (and the lowest 1 itself). n & (n - 1) zeroes out exactly the lowest set bit.",
    naiveWaste: "Checking all 32 bits loops even when n has only one set bit. n & (n - 1) loops exactly as many times as there are 1s.",
    cue: "Bit operations involving the lowest set bit or power of two checks.",
    practiceLink: "/practice?topic=bit-manipulation&problem=2"
  },
  {
    id: "bit-meet-middle",
    title: "Meet in the Middle",
    topic: "search",
    difficulty: "Hard",
    prompt: "Given array of n numbers (n ≤ 40), find subset sum closest to target. 2⁴⁰ is 1 trillion (too large for brute force).",
    options: [
      "Split array into two halves of size n/2 (2²⁰ ≈ 10⁶), generate all subset sums for each, and binary search across halves",
      "Full backtracking on all n elements",
      "Dynamic programming table of size n * target"
    ],
    correctOption: 0,
    moveName: "Exponential Exponent Halving",
    invariant: "2⁴⁰ operations is impossible, but 2 × 2²⁰ is only 2 million operations. Splitting the problem in half allows logarithmic cross-matching.",
    naiveWaste: "Brute force checks 2ⁿ states. Splitting halves turns O(2ⁿ) into O(2^(n/2) * n).",
    cue: "Exponential search where n is ~30 to 40 (too big for 2ⁿ, but 2^(n/2) fits in seconds).",
    practiceLink: "/practice?topic=math&problem=4"
  },

  // 11. Intervals
  {
    id: "interval-merge",
    title: "Merge Overlapping Intervals",
    topic: "intervals",
    difficulty: "Medium",
    prompt: "Given a collection of intervals, merge all overlapping intervals.",
    options: [
      "Sort intervals by start time; if current interval start <= previous end, merge by updating end = max(prev.end, cur.end)",
      "Compare every pair of intervals in O(n²)",
      "Interval tree with segment markers"
    ],
    correctOption: 0,
    moveName: "Start-Time Sorting Invariant",
    invariant: "Once sorted by start time, an interval can only overlap with its immediate predecessor in the merged list.",
    naiveWaste: "Without sorting, any interval could overlap with any other, requiring O(n²) all-pairs scans. Sorting fixes the search to the last merged item.",
    cue: "Collapsing or resolving overlapping time slots or segments.",
    practiceLink: "/practice?topic=intervals&problem=1"
  },
  {
    id: "interval-non-overlapping",
    title: "Non-Overlapping Intervals (Min Removals)",
    topic: "intervals",
    difficulty: "Medium",
    prompt: "Find minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
    options: [
      "Greedy: sort by END time; always pick the interval that finishes EARLIEST to leave maximum room for future intervals",
      "Dynamic programming tracking all subset choices",
      "Sort by length and remove the longest intervals first"
    ],
    correctOption: 0,
    moveName: "Greedy Earliest Finish Time",
    invariant: "Finishing earlier can NEVER disadvantage future choices. The earliest ending interval is provably part of an optimal non-overlapping set.",
    naiveWaste: "DP on intervals is O(n²). Sorting by end time makes the greedy choice globally optimal in O(n log n).",
    cue: "Interval scheduling: maximizing events or minimizing removals.",
    practiceLink: "/practice?topic=intervals&problem=2"
  }
]
