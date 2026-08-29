import type { ICPCProblem } from "./icpc-a"

export const PROBLEMS_ICPC_B: ICPCProblem[] = [
  {
    id: 27, stage: 4, title: "Next Greater Element", pattern: "monotonic stack", skill: "pop when outgrown", difficulty: "Medium",
    statement: "Given an array, return for each element the value of the next element to its right that is strictly greater, or -1 if none exists.",
    examples: [
      { input: "nums = [2, 1, 2, 4, 3]", output: "[4, 2, 4, -1, -1]" },
      { input: "nums = [5, 4, 3]", output: "[-1, -1, -1]" },
    ],
    why: "The monotonic stack answers 'next greater/smaller' in O(n) and reappears in histograms, spans, and stock problems — a core ICPC idiom.",
    starterCode: "def next_greater(nums):\n    pass",
    hints: [
      "Keep a stack of indices whose next greater is still unknown; keep it decreasing by value.",
      "When nums[i] beats stack top values, pop them — nums[i] is their answer.",
      "Everything left on the stack at the end has no next greater."
    ],
    solution: "def next_greater(nums):\n    out = [-1] * len(nums)\n    stack = []\n    for i, x in enumerate(nums):\n        while stack and nums[stack[-1]] < x:\n            out[stack.pop()] = x\n        stack.append(i)\n    return out",
    walkthrough: "Indices wait on the stack in decreasing value order. A bigger arrival resolves all smaller waiters at once; each index is pushed and popped once — O(n) total.",
    testCode: "assert next_greater([2,1,2,4,3]) == [4, 2, 4, -1, -1]\nassert next_greater([5,4,3]) == [-1, -1, -1]\nassert next_greater([1, 2]) == [2, -1]\nassert next_greater([]) == []\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 4, title: "Sliding Window Maximum", pattern: "monotonic deque", skill: "front is always the max", difficulty: "Hard",
    statement: "Given an array and window size k, return the maximum of every contiguous window of size k, in order.",
    examples: [
      { input: "nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3", output: "[3, 3, 5, 5, 6, 7]" },
      { input: "nums = [9, 8, 7], k = 2", output: "[9, 8]" },
    ],
    why: "The monotonic deque is the O(n) answer to all sliding-window extremum problems — a guaranteed ICPC template when a naive O(nk) scan would TLE.",
    starterCode: "def window_max(nums, k):\n    pass",
    hints: [
      "Store indices in a deque whose values decrease front to back.",
      "Before pushing i, pop from the back every index with a value <= nums[i] — they can never be a max again.",
      "Pop from the front when it falls out of the window (index <= i - k); the front is the window max."
    ],
    solution: "from collections import deque\n\ndef window_max(nums, k):\n    dq = deque()\n    out = []\n    for i, x in enumerate(nums):\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()\n        dq.append(i)\n        if dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out",
    walkthrough: "The deque holds candidates in decreasing order: any smaller elder dies when a bigger value arrives, and the oldest survivor is evicted by window age. Each index enters and leaves once.",
    testCode: "assert window_max([1,3,-1,-3,5,3,6,7], 3) == [3, 3, 5, 5, 6, 7]\nassert window_max([9,8,7], 2) == [9, 8]\nassert window_max([4], 1) == [4]\nassert window_max([2, 2, 2], 3) == [2]\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 4, title: "Min Stack", pattern: "augmented structure", skill: "mirror the state", difficulty: "Medium",
    statement: "Design a MinStack supporting push, pop, top, and get_min — all in O(1). Implement it as a class; get_min must always reflect the current stack contents.",
    examples: [
      { input: "push(5), push(2), push(7): top() = 7, get_min() = 2; pop(): get_min() = 2; pop(): get_min() = 5", output: "7 2 2 5" },
      { input: "push(3), get_min()", output: "3" },
    ],
    why: "Augmenting a structure with a parallel summary (min, max, count) is how contestants answer 'now support X in O(1)' follow-ups in almost every problem set.",
    starterCode: "class MinStack:\n    def __init__(self):\n        pass\n    def push(self, x):\n        pass\n    def pop(self):\n        pass\n    def top(self):\n        pass\n    def get_min(self):\n        pass",
    hints: [
      "Keep a second stack of minimums parallel to the data stack.",
      "Push onto the min stack the smaller of x and the current min.",
      "Pop both stacks together; the min stack top is always the answer."
    ],
    solution: "class MinStack:\n    def __init__(self):\n        self.data = []\n        self.mins = []\n    def push(self, x):\n        self.data.append(x)\n        self.mins.append(x if not self.mins else min(self.mins[-1], x))\n    def pop(self):\n        self.data.pop()\n        self.mins.pop()\n    def top(self):\n        return self.data[-1]\n    def get_min(self):\n        return self.mins[-1]",
    walkthrough: "mins[i] records the minimum of data[0..i]. Every mutation touches both stacks in lockstep, so the invariant survives pops and the minimum is read, not searched.",
    testCode: "s = MinStack()\ns.push(5); s.push(2); s.push(7)\nassert s.top() == 7 and s.get_min() == 2\ns.pop()\nassert s.get_min() == 2\ns.pop()\nassert s.get_min() == 5\ns.push(1)\nassert s.get_min() == 1\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Friend Circles", pattern: "union-find", skill: "count components", difficulty: "Medium",
    statement: "n students sit in a circle; matrix M has M[i][j] = 1 if students i and j are direct friends (friendship is mutual). A friend circle is a chain of direct or indirect friendships. Return the number of circles.",
    examples: [
      { input: "M = [[1,1,0],[1,1,0],[0,0,1]]", output: "2" },
      { input: "M = [[1,0,0],[0,1,0],[0,0,1]]", output: "3" },
    ],
    why: "Union-find with path compression is near-constant per operation and is the default connectivity tool when the graph never needs to be traversed explicitly.",
    starterCode: "def friend_circles(M):\n    pass",
    hints: [
      "Start with n components; union(i, j) for every M[i][j] == 1 with j > i.",
      "Implement find with path compression and union by attaching one root to the other.",
      "The answer is the number of distinct roots at the end."
    ],
    solution: "def friend_circles(M):\n    n = len(M)\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    components = n\n    for i in range(n):\n        for j in range(i + 1, n):\n            if M[i][j] == 1:\n                ri, rj = find(i), find(j)\n                if ri != rj:\n                    parent[ri] = rj\n                    components -= 1\n    return components",
    walkthrough: "Each successful union merges two roots into one, so the component counter drops by one. Path compression (grandparent jump) keeps find trees flat.",
    testCode: "assert friend_circles([[1,1,0],[1,1,0],[0,0,1]]) == 2\nassert friend_circles([[1,0,0],[0,1,0],[0,0,1]]) == 3\nassert friend_circles([[1]]) == 1\nassert friend_circles([[1,1],[1,1]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Redundant Connection", pattern: "union-find cycle detection", skill: "first edge closing a cycle", difficulty: "Medium",
    statement: "A tree with n nodes gained one extra edge, so exactly one cycle exists. Given the edge list (1-indexed nodes), return the edge that, if removed, leaves a tree — that is, the last edge whose two endpoints were already connected when processed.",
    examples: [
      { input: "edges = [[1, 2], [1, 3], [2, 3]]", output: "[2, 3]" },
      { input: "edges = [[1, 4], [3, 4], [1, 3], [1, 2]]", output: "[3, 4]" },
    ],
    why: "DSU answers connectivity queries without building adjacency lists — perfect when edges stream in one at a time and you need 'already connected?' checks.",
    starterCode: "def redundant_edge(edges):\n    pass",
    hints: [
      "Process edges in order with DSU over nodes 1..n.",
      "If find(u) == find(v) before unioning, this edge closes the cycle.",
      "Return that edge immediately."
    ],
    solution: "def redundant_edge(edges):\n    parent = {}\n    def find(x):\n        while parent.setdefault(x, x) != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    for u, v in edges:\n        ru, rv = find(u), find(v)\n        if ru == rv:\n            return [u, v]\n        parent[ru] = rv\n    return []",
    walkthrough: "A tree edge always joins two different components. The first edge that fails that test is the redundant one — DSU detects it at the exact moment it appears.",
    testCode: "assert redundant_edge([[1,2],[1,3],[2,3]]) == [2, 3]\nassert redundant_edge([[1,4],[3,4],[1,3],[1,2]]) == [1, 3]\nassert redundant_edge([[1, 2], [2, 3], [3, 4]]) == []\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Gas Station Circuit", pattern: "greedy window reset", skill: "local deficit kills the prefix", difficulty: "Medium",
    statement: "On a circular route, gas[i] is fuel gained at station i and cost[i] is fuel spent driving to the next station. Return the starting station index from which the full circuit is possible, or -1. Exactly one valid index exists when the total gas covers the total cost.",
    examples: [
      { input: "gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]", output: "3" },
      { input: "gas = [2, 3, 4], cost = [3, 4, 3]", output: "-1" },
    ],
    why: "The 'if a window fails, restart after it' greedy is a contest reflex: total feasibility plus local deficit reasoning gives a one-pass answer.",
    starterCode: "def gas_station(gas, cost):\n    pass",
    hints: [
      "Let diff[i] = gas[i] - cost[i]; the circuit exists iff total diff >= 0.",
      "Walk once accumulating tank; when tank < 0, no start in the walked window works — restart at i+1 with tank 0.",
      "The surviving start after the pass is the answer (if total >= 0)."
    ],
    solution: "def gas_station(gas, cost):\n    total, tank, start = 0, 0, 0\n    for i in range(len(gas)):\n        step = gas[i] - cost[i]\n        total += step\n        tank += step\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return start if total >= 0 else -1",
    walkthrough: "A negative tank means every start inside the failed window also fails (each would hit the same deficit). Only a start past the failure point can work, so reset there — one pass, no simulation of every start.",
    testCode: "assert gas_station([1,2,3,4,5], [3,4,5,1,2]) == 3\nassert gas_station([2,3,4], [3,4,3]) == -1\nassert gas_station([5], [4]) == 0\nassert gas_station([3, 1, 1], [1, 2, 2]) == 0\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Segment Tree: Any Fold, Both Halves", pattern: "segment tree", skill: "recursive halving", difficulty: "Hard",
    statement: "Given an array, process operations: ('set', i, v) assigns arr[i] = v; ('min', l, r) returns min(arr[l..r]) inclusive. n and ops up to 2×10⁵.",
    examples: [
      { input: "arr = [2, 6, 1, 8, 3], ops = [('min',1,3), ('set',2,9), ('min',1,3), ('min',0,4)]", output: "[1, 6, 2]", explain: "min([6,1,8])=1; after set → [2,6,9,8,3]: min([6,9,8])=6; whole = 2" },
    ],
    why: "Fenwick owns updating prefix sums, but 'min over a range' has no subtraction — Fenwick is structurally impossible for it. The segment tree halves the array recursively: each node stores the fold of its interval, any range decomposes into ≤ 2·log n canonical nodes, and a point-set re-merges one root-to-leaf path. Same O(log n) — any associative fold.",
    starterCode: "def segtree_min(arr, ops):\n    pass",
    hints: [
      "Iterative layout: leaves at tree[size + i], node k has children 2k and 2k+1; build by filling k from size−1 down to 1.",
      "Query [l, r]: move to l += size, r += size + 1 (half-open). While l < r: if l is a right child, take it and step in; if r marks a right boundary, step left and take it; then halve both.",
      "Set: write the leaf, then walk k //= 2 upward re-merging min of the two children.",
    ],
    solution: "def segtree_min(arr, ops):\n    n = len(arr)\n    size = 1\n    while size < n:\n        size *= 2\n    INF = float('inf')\n    tree = [INF] * (2 * size)\n    tree[size:size + n] = arr\n    for k in range(size - 1, 0, -1):\n        tree[k] = min(tree[2 * k], tree[2 * k + 1])\n    out = []\n    for op in ops:\n        if op[0] == 'set':\n            _, i, v = op\n            k = size + i\n            tree[k] = v\n            k //= 2\n            while k:\n                tree[k] = min(tree[2 * k], tree[2 * k + 1])\n                k //= 2\n        else:\n            _, l, r = op\n            res = INF\n            l += size\n            r += size + 1\n            while l < r:\n                if l & 1:\n                    res = min(res, tree[l])\n                    l += 1\n                if r & 1:\n                    r -= 1\n                    res = min(res, tree[r])\n                l //= 2\n                r //= 2\n            out.append(res)\n    return out",
    walkthrough: "The bottom-up build makes each node the fold of its two children — one pass, O(n). A query reads at most two nodes per level: each level, at most one left boundary climbs into a sibling and at most one right boundary does the same. Compare the sparse table from stage 3: sparse wins on query speed, loses on updates — this is the general-purpose trade.",
    testCode: "assert segtree_min([2,6,1,8,3], [('min',1,3),('set',2,9),('min',1,3),('min',0,4)]) == [1, 6, 2]\nassert segtree_min([7], [('min',0,0),('set',0,2),('min',0,0)]) == [7, 2]\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Lazy Propagation", pattern: "lazy segment tree", skill: "defer the work", difficulty: "Hard",
    statement: "Start with n zeros. Process operations: ('add', l, r, v) adds v to every element of arr[l..r]; ('sum', l, r) returns the range sum. n and ops up to 10⁵.",
    examples: [
      { input: "n = 5, ops = [('add',0,2,5), ('sum',0,4), ('add',1,3,2), ('sum',1,3), ('sum',0,4)]", output: "[15, 16, 21]", explain: "[5,5,5,0,0] → 15; then [5,7,7,2,0]: sum(1,3)=16, total 21" },
    ],
    why: "A range add through the point-set tree touches up to n leaves — O(n log n) per operation. The difference array (stage 3) whispered the answer: mark the range, resolve later. Lazy propagation does exactly that inside the tree: a fully covered node takes the tag (sum += v × length) and STOPS; children learn the truth only when someone actually descends. O(log n) for everything.",
    starterCode: "def lazy_tree(n, ops):\n    pass",
    hints: [
      "Each node keeps sum over its interval plus tag = value owed to BOTH children, not yet applied.",
      "Before descending into children (query or update), push: apply the tag to both children (sum += tag × their length, tag += tag), then clear it.",
      "A fully covered node: update applies the tag and returns immediately; query returns the node's sum — neither touches anything below.",
    ],
    solution: "def lazy_tree(n, ops):\n    size = 1\n    while size < n:\n        size *= 2\n    sm = [0] * (2 * size)\n    tag = [0] * (2 * size)\n    def push(k, lo, hi):\n        if tag[k]:\n            mid = (lo + hi) // 2\n            sm[2*k] += tag[k] * (mid - lo + 1)\n            tag[2*k] += tag[k]\n            sm[2*k+1] += tag[k] * (hi - mid)\n            tag[2*k+1] += tag[k]\n            tag[k] = 0\n    def update(k, lo, hi, l, r, v):\n        if r < lo or hi < l:\n            return\n        if l <= lo and hi <= r:\n            sm[k] += v * (hi - lo + 1)\n            tag[k] += v\n            return\n        push(k, lo, hi)\n        mid = (lo + hi) // 2\n        update(2*k, lo, mid, l, r, v)\n        update(2*k+1, mid+1, hi, l, r, v)\n        sm[k] = sm[2*k] + sm[2*k+1]\n    def query(k, lo, hi, l, r):\n        if r < lo or hi < l:\n            return 0\n        if l <= lo and hi <= r:\n            return sm[k]\n        push(k, lo, hi)\n        mid = (lo + hi) // 2\n        return query(2*k, lo, mid, l, r) + query(2*k+1, mid+1, hi, l, r)\n    out = []\n    for op in ops:\n        if op[0] == 'add':\n            update(1, 0, size - 1, op[1], op[2], op[3])\n        else:\n            out.append(query(1, 0, size - 1, op[1], op[2]))\n    return out",
    walkthrough: "Read the tag as debt: 'everything below me still owes +v'. A covered node books the whole payment at once (sum += v × length) and forwards the debt only when pushed. Each update or query visits O(log n) nodes and pushes O(log n) tags. Notice the family tree: difference array → Fenwick → segment tree → lazy — each one defers a little more.",
    testCode: "assert lazy_tree(5, [('add',0,2,5),('sum',0,4),('add',1,3,2),('sum',1,3),('sum',0,4)]) == [15, 16, 21]\nassert lazy_tree(4, [('add',0,3,1),('sum',2,2),('add',2,3,4),('sum',0,3)]) == [1, 12]\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 5, title: "Running Median", pattern: "two heaps", skill: "balance halves", difficulty: "Hard",
    statement: "Design a MedianFinder class: add_num(x) inserts an integer; find_median() returns the median of all inserted numbers so far. Both operations should be efficient (O(log n) insert, O(1) query).",
    examples: [
      { input: "add 1, add 2 -> find_median() = 1.5; add 3 -> find_median() = 2", output: "1.5 2" },
      { input: "add 5 -> find_median() = 5", output: "5" },
    ],
    why: "Splitting a stream around its median with a max-heap and a min-heap is the canonical online-order-statistics structure in ICPC-style contests.",
    starterCode: "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        pass\n    def add_num(self, x):\n        pass\n    def find_median(self):\n        pass",
    hints: [
      "Keep a max-heap `low` (store negatives) for the smaller half and a min-heap `high` for the larger half.",
      "Invariant: len(low) == len(high) or len(low) == len(high) + 1, and every low element <= every high element.",
      "Push to one heap, rebalance by moving its top to the other; median is low's top, or the average of both tops."
    ],
    solution: "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        self.low = []\n        self.high = []\n    def add_num(self, x):\n        heapq.heappush(self.low, -x)\n        heapq.heappush(self.high, -heapq.heappop(self.low))\n        if len(self.high) > len(self.low):\n            heapq.heappush(self.low, -heapq.heappop(self.high))\n    def find_median(self):\n        if len(self.low) > len(self.high):\n            return float(-self.low[0])\n        return (-self.low[0] + self.high[0]) / 2",
    walkthrough: "Every insertion passes through both heaps, which guarantees the ordering invariant without comparisons. The median is then just the balanced boundary read from the two tops.",
    testCode: "m = MedianFinder()\nm.add_num(1); m.add_num(2)\nassert m.find_median() == 1.5\nm.add_num(3)\nassert m.find_median() == 2.0\nm.add_num(5); m.add_num(4)\nassert m.find_median() == 3.0\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 5, title: "Merge K Sorted Lists", pattern: "k-way merge with heap", skill: "heap of heads", difficulty: "Medium",
    statement: "Given k sorted lists of integers, return one sorted list containing all their elements. Aim for better than concatenating and sorting.",
    examples: [
      { input: "lists = [[1, 4, 5], [1, 3, 4], [2, 6]]", output: "[1, 1, 2, 3, 4, 4, 5, 6]" },
      { input: "lists = [[], [0]]", output: "[0]" },
    ],
    why: "The heap-of-heads merge is the backbone of external sorting and streaming problems: only the current front of each source is ever a candidate.",
    starterCode: "def merge_k_lists(lists):\n    pass",
    hints: [
      "Push (first value, list index, element index) of every non-empty list into a heap.",
      "Pop the smallest; append it; push the next element from that same list.",
      "The heap always holds exactly one candidate per unfinished list."
    ],
    solution: "import heapq\n\ndef merge_k_lists(lists):\n    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]\n    heapq.heapify(heap)\n    out = []\n    while heap:\n        value, i, j = heapq.heappop(heap)\n        out.append(value)\n        if j + 1 < len(lists[i]):\n            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))\n    return out",
    walkthrough: "Each pop emits the global minimum because every other candidate is a front of its list and therefore >= it. Pushing the successor keeps the candidate set complete. O(N log k).",
    testCode: "assert merge_k_lists([[1,4,5],[1,3,4],[2,6]]) == [1, 1, 2, 3, 4, 4, 5, 6]\nassert merge_k_lists([[], [0]]) == [0]\nassert merge_k_lists([]) == []\nassert merge_k_lists([[2], [1]]) == [1, 2]\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Tree Diameter", pattern: "double BFS", skill: "farthest from farthest", difficulty: "Medium",
    statement: "Given an unweighted tree with n nodes (edges list), return the number of edges on its longest path — the diameter.",
    examples: [
      { input: "n = 5, edges = [(0,1),(1,2),(2,3),(1,4)]", output: "3", explain: "path 3-2-1-4" },
      { input: "n = 2, edges = [(0, 1)]", output: "1" },
    ],
    why: "Two-BFS diameter is the classic tree trick: BFS from any node finds some endpoint of the diameter; BFS from that endpoint finds the diameter itself.",
    starterCode: "def tree_diameter(n, edges):\n    pass",
    hints: [
      "Build an adjacency list; BFS returns (farthest node, distance).",
      "First BFS from node 0 to find endpoint u; second BFS from u to find the farthest distance.",
      "BFS with a visited set and a queue of (node, dist)."
    ],
    solution: "from collections import deque\n\ndef tree_diameter(n, edges):\n    adj = [[] for _ in range(n)]\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    def bfs(src):\n        dist = [-1] * n\n        dist[src] = 0\n        q = deque([src])\n        far, fd = src, 0\n        while q:\n            node = q.popleft()\n            for nxt in adj[node]:\n                if dist[nxt] == -1:\n                    dist[nxt] = dist[node] + 1\n                    if dist[nxt] > fd:\n                        far, fd = nxt, dist[nxt]\n                    q.append(nxt)\n        return far, fd\n    u, _ = bfs(0)\n    _, diameter = bfs(u)\n    return diameter",
    walkthrough: "In a tree, the farthest node from anywhere lies on some diameter. So BFS twice: the second run's depth is the diameter. O(n) with no DP table.",
    testCode: "assert tree_diameter(5, [(0,1),(1,2),(2,3),(1,4)]) == 3\nassert tree_diameter(2, [(0, 1)]) == 1\nassert tree_diameter(1, []) == 0\nassert tree_diameter(6, [(0,1),(0,2),(2,3),(3,4),(4,5)]) == 5\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Subtree Sizes", pattern: "iterative DFS post-order", skill: "process children before parent", difficulty: "Medium",
    statement: "Given a tree rooted at node 0 (n nodes, edge list), return a list where entry i is the size of the subtree rooted at i.",
    examples: [
      { input: "n = 4, edges = [(0, 1), (0, 2), (2, 3)]", output: "[4, 1, 2, 1]" },
      { input: "n = 2, edges = [(0, 1)]", output: "[2, 1]" },
    ],
    why: "Recursion depth limits make iterative post-order an essential contest skill. The two-phase pattern (order pass, accumulate pass) generalizes to all tree DP.",
    starterCode: "def subtree_sizes(n, edges):\n    pass",
    hints: [
      "Build children lists from the parent structure via BFS from node 0.",
      "Get nodes in reverse BFS order — children always appear before parents there.",
      "size[node] = 1 + sum of sizes of its children, accumulated in that reverse order."
    ],
    solution: "from collections import deque\n\ndef subtree_sizes(n, edges):\n    children = [[] for _ in range(n)]\n    for a, b in edges:\n        children[a].append(b)\n    order, q = [], deque([0])\n    while q:\n        node = q.popleft()\n        order.append(node)\n        q.extend(children[node])\n    size = [1] * n\n    for node in reversed(order):\n        for child in children[node]:\n            size[node] += size[child]\n    return size",
    walkthrough: "Reverse BFS order guarantees every child is finalized before its parent is processed, so a single accumulation pass replaces explicit recursion — no stack depth issues.",
    testCode: "assert subtree_sizes(4, [(0,1),(0,2),(2,3)]) == [4, 1, 2, 1]\nassert subtree_sizes(2, [(0, 1)]) == [2, 1]\nassert subtree_sizes(1, []) == [1]\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Deepest Level Sum", pattern: "level BFS", skill: "process one layer at a time", difficulty: "Easy",
    statement: "A binary tree is given in level order as a list where None marks a missing child (the list may end after the last real node). Return the sum of the deepest level that contains at least one node.",
    examples: [
      { input: "tree = [1, 7, 0, 7, -8, None, None]", output: "-1", explain: "levels sum to 1, 7, -1 — the deepest is [7, -8]" },
    ],
    why: "Level-by-level BFS is the standard tree traversal in contests; slicing work per layer lets you answer 'deepest/level k/width' questions directly.",
    starterCode: "def deepest_level_sum(tree):\n    pass",
    hints: [
      "Children of index i sit at 2*i + 1 and 2*i + 2, but only if within bounds and not None.",
      "Build levels: current level indices, then collect their children indices with real values.",
      "Keep the last level's value sum."
    ],
    solution: "def deepest_level_sum(tree):\n    def value(i):\n        return tree[i] if 0 <= i < len(tree) and tree[i] is not None else None\n    level = [0] if value(0) is not None else []\n    best = 0\n    while level:\n        best = sum(tree[i] for i in level)\n        nxt = []\n        for i in level:\n            for child in (2 * i + 1, 2 * i + 2):\n                if value(child) is not None:\n                    nxt.append(child)\n        level = nxt\n    return best",
    walkthrough: "Walk the array like a heap: each level's children form the next level. Summing before advancing means the last computed sum belongs to the deepest non-empty level.",
    testCode: "assert deepest_level_sum([1,7,0,7,-8,None,None]) == -1\nassert deepest_level_sum([5]) == 5\nassert deepest_level_sum([1, 2, 3, 4]) == 4\nassert deepest_level_sum([2, 1, 3, None, 9]) == 9\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "LCA via Binary Lifting", pattern: "binary lifting", skill: "jump in powers of two", difficulty: "Hard",
    statement: "Given a tree rooted at 0 with n nodes and a list of queries (u, v), return the lowest common ancestor of each pair. Preprocess in O(n log n) and answer each query in O(log n).",
    examples: [
      { input: "n = 6, edges = [(0,1),(0,2),(2,3),(2,4),(3,5)], queries = [(5, 4), (1, 4), (3, 5)]", output: "[2, 0, 3]" },
      { input: "n = 2, edges = [(0, 1)], queries = [(0, 1), (1, 1)]", output: "[0, 1]" },
    ],
    why: "Binary lifting is the standard LCA structure when many queries hit one static tree — a fixture in ICPC regionals. The jump table is also reused for k-th ancestor queries.",
    starterCode: "def lca_queries(n, edges, queries):\n    pass",
    hints: [
      "Compute depth and immediate parent by BFS from the root; build up[k][v] = 2^k-th ancestor.",
      "To query: lift the deeper node level-by-level (highest bit first) until depths match.",
      "If nodes differ, lift both while up[k][u] != up[k][v]; the LCA is up[0][u]."
    ],
    solution: "from collections import deque\n\ndef lca_queries(n, edges, queries):\n    LOG = max(1, n.bit_length())\n    children = [[] for _ in range(n)]\n    for a, b in edges:\n        children[a].append(b)\n    depth = [0] * n\n    parent = [0] * n\n    q = deque([0])\n    while q:\n        node = q.popleft()\n        for c in children[node]:\n            depth[c] = depth[node] + 1\n            parent[c] = node\n            q.append(c)\n    up = [parent[:]]\n    for k in range(1, LOG):\n        prev = up[-1]\n        up.append([prev[prev[v]] for v in range(n)])\n    def lift(v, d):\n        for k in range(LOG - 1, -1, -1):\n            if d >= (1 << k):\n                v = up[k][v]\n                d -= 1 << k\n        return v\n    def lca(u, v):\n        if depth[u] < depth[v]:\n            u, v = v, u\n        u = lift(u, depth[u] - depth[v])\n        if u == v:\n            return u\n        for k in range(LOG - 1, -1, -1):\n            if up[k][u] != up[k][v]:\n                u, v = up[k][u], up[k][v]\n        return parent[u]\n    return [lca(u, v) for u, v in queries]",
    walkthrough: "The jump table stores 2^k-th ancestors so any depth can be covered in O(log n) hops. Equalize depths, then lift both nodes under their common ancestor without ever landing on it.",
    testCode: "assert lca_queries(6, [(0,1),(0,2),(2,3),(2,4),(3,5)], [(5,4),(1,4),(3,5)]) == [2, 0, 3]\nassert lca_queries(2, [(0,1)], [(0,1),(1,1)]) == [0, 1]\nassert lca_queries(4, [(0,1),(1,2),(2,3)], [(3, 1)]) == [1]\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Euler Tour: The Tree Becomes an Array", pattern: "euler tour + BIT", skill: "flatten subtree to a range", difficulty: "Hard",
    statement: "Given a tree of n nodes rooted at 0 with values on each node, process operations: ('set', v, x) assigns the node's value; ('sub', v) returns the sum of values in v's whole subtree. n and ops up to 2×10⁵.",
    examples: [
      { input: "edges = [[0,1],[0,2],[1,3]], values = [5,2,3,4], ops = [('sub',0), ('sub',1), ('set',3,10), ('sub',1), ('sub',0)]", output: "[14, 6, 12, 20]", explain: "whole tree = 5+2+3+4 = 14; subtree of 1 = {1,3} = 6; after set: 2+10 = 12, total 20" },
    ],
    why: "Walking each subtree per query is O(n) each — 4×10¹⁰ total. One DFS timestamp (tin on entry, tout after the last child) makes every subtree a CONTIGUOUS slice [tin[v], tout[v]] of an array. Then stage 3's Fenwick tree finishes the job: point-update at tin[v], range-sum over the slice. Two known moves, zero new magic.",
    starterCode: "def subtree_sums(n, edges, values, ops):\n    pass",
    hints: [
      "Iterative DFS: on entry set tin[v] = timer++; after the last child returns, tout[v] = timer − 1. Push a (v, done) frame to catch the exit.",
      "Subtree of v = positions tin[v] .. tout[v] exactly — every child's interval nests inside.",
      "('set', v, x) is a Fenwick add of (x − cur[v]) at tin[v]. ('sub', v) = pref(tout[v]) − pref(tin[v] − 1).",
    ],
    solution: "def subtree_sums(n, edges, values, ops):\n    adj = [[] for _ in range(n)]\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    tin = [0] * n\n    tout = [0] * n\n    timer = 0\n    stack = [(0, -1, False)]\n    while stack:\n        v, par, done = stack.pop()\n        if done:\n            tout[v] = timer - 1\n            continue\n        tin[v] = timer\n        timer += 1\n        stack.append((v, par, True))\n        for c in adj[v]:\n            if c != par:\n                stack.append((c, v, False))\n    tree = [0] * (n + 1)\n    def bitadd(i, d):\n        i += 1\n        while i <= n:\n            tree[i] += d\n            i += i & -i\n    def bitpref(i):\n        i += 1\n        s = 0\n        while i > 0:\n            s += tree[i]\n            i -= i & -i\n        return s\n    for v, val in enumerate(values):\n        bitadd(tin[v], val)\n    cur = values[:]\n    out = []\n    for op in ops:\n        if op[0] == 'set':\n            _, v, x = op\n            bitadd(tin[v], x - cur[v])\n            cur[v] = x\n        else:\n            _, v = op\n            out.append(bitpref(tout[v]) - bitpref(tin[v] - 1))\n    return out",
    walkthrough: "DFS visits every subtree as one unbroken time window — that is the whole trick. Once tree problems become array problems, every stage-3 tool applies unchanged (sums here; swap in a segment tree for min). Recognizing 'flatten, then reuse' is worth more than any single new structure.",
    testCode: "assert subtree_sums(4, [[0,1],[0,2],[1,3]], [5,2,3,4], [('sub',0),('sub',1),('set',3,10),('sub',1),('sub',0)]) == [14, 6, 12, 20]\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 6, title: "Maze Shortest Path", pattern: "BFS on grid", skill: "uniform cost = BFS", difficulty: "Easy",
    statement: "A maze is a grid of 0s (open) and 1s (walls). You may move up, down, left, or right. Given the grid, start cell, and end cell, return the minimum number of moves or -1 if unreachable.",
    examples: [
      { input: "grid = [[0,0,1],[0,1,0],[0,0,0]], start = (0,0), end = (2,2)", output: "4" },
      { input: "grid = [[0, 1], [1, 0]], start = (0,0), end = (1,1)", output: "-1" },
    ],
    why: "BFS explores in waves of equal cost, so the first arrival is optimal — the foundational shortest-path fact every ICPC solution leans on.",
    starterCode: "def maze_steps(grid, start, end):\n    pass",
    hints: [
      "BFS from start with a visited set; store distance in the queue entries.",
      "Expand the four neighbors; skip walls and visited cells.",
      "The first time you pop or reach the end, its distance is final."
    ],
    solution: "from collections import deque\n\ndef maze_steps(grid, start, end):\n    rows, cols = len(grid), len(grid[0])\n    if grid[start[0]][start[1]] == 1 or grid[end[0]][end[1]] == 1:\n        return -1\n    dist = {start: 0}\n    q = deque([start])\n    while q:\n        r, c = q.popleft()\n        if (r, c) == end:\n            return dist[(r, c)]\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0 and (nr, nc) not in dist:\n                dist[(nr, nc)] = dist[(r, c)] + 1\n                q.append((nr, nc))\n    return -1",
    walkthrough: "All edges cost 1, so BFS layers are distance layers. Marking visited on enqueue keeps each cell processed once; the target's distance is final when first reached.",
    testCode: "assert maze_steps([[0,0,1],[0,1,0],[0,0,0]], (0,0), (2,2)) == 4\nassert maze_steps([[0,1],[1,0]], (0,0), (1,1)) == -1\nassert maze_steps([[0]], (0,0), (0,0)) == 0\nassert maze_steps([[0,0],[0,0]], (0,0), (1,1)) == 2\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 6, title: "Network Delay Time", pattern: "Dijkstra with heap", skill: "greedy closest frontier", difficulty: "Hard",
    statement: "A network has n nodes (1..n) and directed weighted edges times = (u, v, w). A signal leaves node k. Return the time until every node has received it, or -1 if some node never will.",
    examples: [
      { input: "n = 4, times = [(2,1,1),(2,3,1),(3,4,1)], k = 2", output: "2" },
      { input: "n = 2, times = [(1, 2, 1)], k = 2", output: "-1" },
    ],
    why: "Dijkstra is the default non-negative shortest-path tool. The lazy-deletion heap pattern here is exactly what you will reuse for grids with weights and state-space search.",
    starterCode: "def network_delay(n, times, k):\n    pass",
    hints: [
      "Build adjacency lists; push (0, k) into a min-heap of (distance, node).",
      "Pop the closest unfinalized node; skip if already finalized (lazy deletion).",
      "Answer is the max finalized distance; some node unreached means -1."
    ],
    solution: "import heapq\n\ndef network_delay(n, times, k):\n    adj = [[] for _ in range(n + 1)]\n    for u, v, w in times:\n        adj[u].append((v, w))\n    best = {}\n    heap = [(0, k)]\n    while heap:\n        d, node = heapq.heappop(heap)\n        if node in best:\n            continue\n        best[node] = d\n        for nxt, w in adj[node]:\n            if nxt not in best:\n                heapq.heappush(heap, (d + w, nxt))\n    return max(best.values()) if len(best) == n else -1",
    walkthrough: "When a node first pops, its distance is final because any other route would pass through an already-finalized (hence not-closer) node. Stale heap entries are skipped on sight.",
    testCode: "assert network_delay(4, [(2,1,1),(2,3,1),(3,4,1)], 2) == 2\nassert network_delay(2, [(1,2,1)], 2) == -1\nassert network_delay(1, [], 1) == 0\nassert network_delay(3, [(1,2,5),(2,3,5),(1,3,2)], 1) == 5\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Break One Wall", pattern: "expanded graph BFS", skill: "nodes as (cell, state)", difficulty: "Medium",
    statement: "You walk a grid from the top-left to the bottom-right, moving up/down/left/right. '#' cells are walls. You may break AT MOST ONE wall during the whole walk. Return the fewest steps, or -1 if impossible. Grid up to 500×500.",
    examples: [
      { input: "grid = ['.#.', '.#.', '.#.']", output: "4", explain: "break (1,1): right, right, down, down" },
      { input: "grid = ['...', '###', '...']", output: "4", explain: "every route crosses the middle row, so exactly one wall must be broken" },
      { input: "grid = ['...', '...', '...']", output: "4", explain: "no break needed — Manhattan distance" },
    ],
    why: "Plain BFS (this stage's opener) fails: it marks cells visited, but the best route through a cell depends on whether you still hold the break. The fix is not a new algorithm — it is a bigger graph. A node becomes (row, col, broken?): the wall edge from broken=0 lands in the same cell with broken=1. BFS on the expanded graph just works, because every edge still costs 1.",
    starterCode: "def least_steps(grid):\n    pass",
    hints: [
      "State = (r, c, used) where used is 0 or 1. Keep the distance dictionary keyed by all three.",
      "Stepping into '#': allowed only from used=0, landing in used=1. Stepping into '.': same used.",
      "BFS pops in layer order, so the first time you pop the end cell — in either state — that distance is the answer.",
    ],
    solution: "def least_steps(grid):\n    from collections import deque\n    R, C = len(grid), len(grid[0])\n    dist = {(0, 0, 0): 0}\n    q = deque([(0, 0, 0)])\n    while q:\n        r, c, b = q.popleft()\n        if (r, c) == (R - 1, C - 1):\n            return dist[(r, c, b)]\n        for dr, dc in ((1,0), (-1,0), (0,1), (0,-1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < R and 0 <= nc < C:\n                nb = b\n                if grid[nr][nc] == '#':\n                    if b:\n                        continue\n                    nb = 1\n                key = (nr, nc, nb)\n                if key not in dist:\n                    dist[key] = dist[(r, c, b)] + 1\n                    q.append(key)\n    return -1",
    walkthrough: "When a shortest-path problem looks blocked, ask: 'what single fact about my journey changes what I may do next?' — that fact joins the state. Here it is the unused break. The graph doubles (2·R·C nodes) but stays unweighted, so BFS layer order still guarantees first-pop-is-optimal. With edge weights, the same expanded graph runs Dijkstra unchanged — the state design is the reusable idea.",
    testCode: "assert least_steps(['.#.', '.#.', '.#.']) == 4\nassert least_steps(['...', '###', '...']) == 4\nassert least_steps(['...', '...', '...']) == 4\nassert least_steps(['..', '..']) == 2\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Negative Cycle Detection", pattern: "Bellman-Ford", skill: "relax V times", difficulty: "Hard",
    statement: "Given a directed graph with possibly negative weights as edges (u, v, w) over n nodes, return True if it contains a negative cycle (anywhere in the graph), else False.",
    examples: [
      { input: "n = 3, edges = [(0,1,2),(1,2,-1),(2,0,-2)]", output: "True" },
      { input: "n = 3, edges = [(0, 1, 1), (1, 2, 1)]", output: "False" },
    ],
    why: "Bellman-Ford is the only standard single-source algorithm that tolerates negative weights, and its V-th round test is the definition of negative cycles.",
    starterCode: "def has_negative_cycle(n, edges):\n    pass",
    hints: [
      "Initialize dist[0] = 0 and everything else to infinity (detects cycles reachable from 0).",
      "To catch any cycle regardless of reachability, run the V rounds on all edges with dist[v] > dist[u] + w relaxation.",
      "If any edge still relaxes in the n-th round, a negative cycle exists."
    ],
    solution: "def has_negative_cycle(n, edges):\n    INF = float('inf')\n    dist = [0] * n\n    for round in range(n):\n        changed = False\n        for u, v, w in edges:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                changed = True\n        if not changed:\n            return False\n    return True",
    walkthrough: "Shortest simple paths settle within n-1 rounds. Starting all distances at 0 makes every node a virtual source, so any negative cycle — reachable or not — keeps relaxing forever and trips the n-th round.",
    testCode: "assert has_negative_cycle(3, [(0,1,2),(1,2,-1),(2,0,-2)]) == True\nassert has_negative_cycle(3, [(0,1,1),(1,2,1)]) == False\nassert has_negative_cycle(2, [(0, 1, -3), (1, 0, 2)]) == True\nassert has_negative_cycle(1, []) == False\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "All-Pairs Shortest Paths", pattern: "Floyd-Warshall", skill: "allow each vertex as intermediate", difficulty: "Medium",
    statement: "Given n nodes and directed weighted edges, return the shortest distance from node s to node t, or -1 if t is unreachable from s. Compute all pairs with Floyd-Warshall.",
    examples: [
      { input: "n = 4, edges = [(0,1,2),(1,2,3),(0,2,8)], s = 0, t = 2", output: "5" },
      { input: "n = 3, edges = [(0, 1, 1)], s = 0, t = 2", output: "-1" },
    ],
    why: "Floyd-Warshall is three nested loops and handles negative edges (without negative cycles). Its 'via vertex k' induction is the cleanest DP statement in graph algorithms.",
    starterCode: "def shortest_with_floyd(n, edges, s, t):\n    pass",
    hints: [
      "Initialize dist[i][i] = 0, dist[u][v] = w for edges, everything else INF.",
      "For each k in order, relax dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).",
      "INF + INF overflows conceptually but not in Python — still, guard with an if dist[i][k] < INF style check or accept large numbers."
    ],
    solution: "def shortest_with_floyd(n, edges, s, t):\n    INF = float('inf')\n    dist = [[INF] * n for _ in range(n)]\n    for i in range(n):\n        dist[i][i] = 0\n    for u, v, w in edges:\n        dist[u][v] = min(dist[u][v], w)\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if dist[i][k] + dist[k][j] < dist[i][j]:\n                    dist[i][j] = dist[i][k] + dist[k][j]\n    return dist[s][t] if dist[s][t] < INF else -1",
    walkthrough: "After allowing intermediate set {0..k-1}, dist[i][j] is exact. Each k extends the allowed set by one vertex; three loops, no priority queue, O(n^3).",
    testCode: "assert shortest_with_floyd(4, [(0,1,2),(1,2,3),(0,2,8)], 0, 2) == 5\nassert shortest_with_floyd(3, [(0,1,1)], 0, 2) == -1\nassert shortest_with_floyd(2, [(0,1,4),(1,0,1)], 1, 0) == 1\nassert shortest_with_floyd(1, [], 0, 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Course Order", pattern: "Kahn topological sort", skill: "peel zero in-degree", difficulty: "Medium",
    statement: "There are numCourses courses labeled 0..numCourses-1 and prerequisite pairs (a, b) meaning b must come before a. Return any valid ordering taking all courses, or [] if impossible.",
    examples: [
      { input: "numCourses = 4, prereq = [(1, 0), (2, 0), (3, 1), (3, 2)]", output: "[0, 1, 2, 3]" },
      { input: "numCourses = 2, prereq = [(0, 1), (1, 0)]", output: "[]" },
    ],
    why: "Kahn's algorithm is BFS on the in-degree frontier. It also detects cycles for free (leftover nodes) and produces the order as a side effect — two answers, one traversal.",
    starterCode: "def course_order(num_courses, prereq):\n    pass",
    hints: [
      "Build adjacency (b -> a) and in-degree counts.",
      "Start a queue with all in-degree-0 nodes; pop one, append to order, decrement its neighbors' in-degrees.",
      "Any neighbor reaching in-degree 0 joins the queue; order complete iff its length == numCourses."
    ],
    solution: "from collections import deque\n\ndef course_order(num_courses, prereq):\n    adj = [[] for _ in range(num_courses)]\n    indeg = [0] * num_courses\n    for a, b in prereq:\n        adj[b].append(a)\n        indeg[a] += 1\n    q = deque(i for i in range(num_courses) if indeg[i] == 0)\n    order = []\n    while q:\n        node = q.popleft()\n        order.append(node)\n        for nxt in adj[node]:\n            indeg[nxt] -= 1\n            if indeg[nxt] == 0:\n                q.append(nxt)\n    return order if len(order) == num_courses else []",
    walkthrough: "A node with no unmet prerequisites is safe to output now. Emitting it cancels one requirement for each dependent. If a cycle exists, its members never reach in-degree 0 and the order comes up short.",
    testCode: "assert course_order(4, [(1,0),(2,0),(3,1),(3,2)]) == [0, 1, 2, 3]\nassert course_order(2, [(0,1),(1,0)]) == []\nassert course_order(1, []) == [0]\nassert course_order(3, [(0, 2)]) == [1, 2, 0]\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "0-1 BFS", pattern: "deque shortest path", skill: "zero edges stay at front", difficulty: "Hard",
    statement: "A graph has n nodes and edges of weight 0 or 1. Given the source 0, return the shortest distance from 0 to every node (-1 if unreachable). Use 0-1 BFS, not Dijkstra.",
    examples: [
      { input: "n = 5, edges = [(0,1,1),(0,2,0),(2,1,0),(1,3,1),(2,4,1)]", output: "[0, 0, 0, 1, 1]", explain: "0->2 (0), 2->1 (0), then one 1-edge to 3 and to 4" },
      { input: "n = 2, edges = [(0, 1, 1)]", output: "[0, 1]" },
    ],
    why: "When weights are only 0/1, the deque replaces the heap: zero-edges never create a 'closer than current front' node, so pushing front/back keeps the deque monotone.",
    starterCode: "def zero_one_bfs(n, edges):\n    pass",
    hints: [
      "Use a deque of nodes; dist[0] = 0, others INF.",
      "Relaxing with weight 0 pushes the neighbor to the front; weight 1 pushes to the back.",
      "Skip stale pops (popped distance > recorded distance)."
    ],
    solution: "from collections import deque\n\ndef zero_one_bfs(n, edges):\n    adj = [[] for _ in range(n)]\n    for u, v, w in edges:\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n    dist = [-1] * n\n    dist[0] = 0\n    dq = deque([0])\n    while dq:\n        node = dq.popleft()\n        for nxt, w in adj[node]:\n            nd = dist[node] + w\n            if dist[nxt] == -1 or nd < dist[nxt]:\n                dist[nxt] = nd\n                if w == 0:\n                    dq.appendleft(nxt)\n                else:\n                    dq.append(nxt)\n    return dist",
    walkthrough: "The deque holds at most two distinct distance values, front <= back. Zero-cost edges preserve the current layer (front), unit edges open the next layer (back) — Dijkstra's order without the log factor.",
    testCode: "assert zero_one_bfs(5, [(0,1,1),(0,2,0),(2,1,0),(1,3,1),(2,4,1)]) == [0, 0, 0, 1, 1]\nassert zero_one_bfs(2, [(0,1,1)]) == [0, 1]\nassert zero_one_bfs(3, [(0,1,0),(1,2,0)]) == [0, 0, 0]\nassert zero_one_bfs(1, []) == [0]\nprint('All tests passed!')"
  }
]
