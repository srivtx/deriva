export type Cheatsheet = {
  id: string
  title: string
  family: string
  when: string
  complexity: string
  code: string
  practiceTopic: string
}

export const CHEATSHEETS: Cheatsheet[] = [
  {
    id: "binary-search",
    title: "Binary Search on the Answer",
    family: "Search",
    when: "The predicate is monotone: feasible up to some boundary, infeasible after it. Maximize or minimize a threshold.",
    complexity: "O(log range) feasibility checks",
    practiceTopic: "trees",
    code: `def search_max(lo, hi, feasible):
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if feasible(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo

def search_min(lo, hi, feasible):
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`,
  },
  {
    id: "two-pointers",
    title: "Two Pointers (opposite ends)",
    family: "Sweep",
    when: "Sorted input, pair/triple with a target property. Each step permanently discards one candidate.",
    complexity: "O(n) after O(n log n) sort",
    practiceTopic: "intervals",
    code: `def pair_with_sum(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        s = nums[lo] + nums[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1
        else:
            hi -= 1
    return -1, -1`,
  },
  {
    id: "sliding-window",
    title: "Sliding Window (variable)",
    family: "Sweep",
    when: "Longest/shortest contiguous subarray with a constraint. Window validity is monotone as it grows.",
    complexity: "O(n) — each index enters and leaves once",
    practiceTopic: "intervals",
    code: `def longest_window(nums, ok):
    left = 0
    best = 0
    for right, value in enumerate(nums):
        # add nums[right] to window state here
        while not ok():
            # remove nums[left] from window state
            left += 1
        best = max(best, right - left + 1)
    return best`,
  },
  {
    id: "prefix-sums",
    title: "Prefix Sums & Difference Arrays",
    family: "Precompute",
    when: "Many range-sum queries, or add a constant to whole ranges then read final values.",
    complexity: "O(n) build, O(1) query/update",
    practiceTopic: "trees",
    code: `def build_prefix(nums):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    return prefix

def range_sum(prefix, l, r):          # inclusive
    return prefix[r + 1] - prefix[l]

def apply_ranges(n, ranges):          # ranges: (l, r, delta), inclusive
    delta = [0] * (n + 1)
    for l, r, d in ranges:
        delta[l] += d
        delta[r + 1] -= d
    out, running = [], 0
    for i in range(n):
        running += delta[i]
        out.append(running)
    return out`,
  },
  {
    id: "dsu",
    title: "Union-Find (DSU)",
    family: "Structures",
    when: "Dynamic connectivity: merge components, query 'same component?', detect cycles, Kruskal.",
    complexity: "O(α(n)) ≈ constant per op",
    practiceTopic: "graphs",
    code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n
    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.components -= 1
        return True`,
  },
  {
    id: "bfs-dfs",
    title: "BFS / DFS Traversal",
    family: "Graphs",
    when: "BFS: unweighted shortest path, level order. DFS: reachability, components, tree DP.",
    complexity: "O(V + E)",
    practiceTopic: "graphs",
    code: `from collections import deque

def bfs(adj, src):
    dist = {src: 0}
    q = deque([src])
    while q:
        node = q.popleft()
        for nxt in adj[node]:
            if nxt not in dist:
                dist[nxt] = dist[node] + 1
                q.append(nxt)
    return dist

def dfs_iterative(adj, src):
    seen = {src}
    stack = [src]
    while stack:
        node = stack.pop()
        for nxt in adj[node]:
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return seen`,
  },
  {
    id: "dijkstra",
    title: "Dijkstra (lazy heap)",
    family: "Graphs",
    when: "Single-source shortest path, non-negative weights.",
    complexity: "O(E log V)",
    practiceTopic: "advanced-graphs",
    code: `import heapq

def dijkstra(adj, src, n):     # adj[u] = list of (v, w)
    best = {}
    heap = [(0, src)]
    while heap:
        d, node = heapq.heappop(heap)
        if node in best:
            continue
        best[node] = d
        for nxt, w in adj[node]:
            if nxt not in best:
                heapq.heappush(heap, (d + w, nxt))
    return best`,
  },
  {
    id: "topo-sort",
    title: "Topological Sort (Kahn)",
    family: "Graphs",
    when: "Order tasks with prerequisites; detect cycles on directed graphs; DP on DAG.",
    complexity: "O(V + E)",
    practiceTopic: "graphs",
    code: `from collections import deque

def topo_order(n, edges):      # edges: (before, after)
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in adj[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return order if len(order) == n else []`,
  },
  {
    id: "backtracking",
    title: "Backtracking Template",
    family: "Search",
    when: "Enumerate combinations/permutations/subsets with pruning.",
    complexity: "output-sensitive, prune early",
    practiceTopic: "backtracking",
    code: `def backtrack(path, choices):
    if is_goal(path):
        results.append(path[:])
        return
    for choice in choices:
        if not valid(path, choice):
            continue
        path.append(choice)          # choose
        backtrack(path, next_choices(choices, choice))
        path.pop()                   # unchoose

results = []
backtrack([], all_choices)`,
  },
  {
    id: "kmp",
    title: "KMP Prefix Function",
    family: "Strings",
    when: "Pattern search without re-scanning text; period/border problems.",
    complexity: "O(n + m)",
    practiceTopic: "trie",
    code: `def prefix_function(s):
    pi = [0] * len(s)
    for i in range(1, len(s)):
        k = pi[i - 1]
        while k > 0 and s[i] != s[k]:
            k = pi[k - 1]
        if s[i] == s[k]:
            k += 1
        pi[i] = k
    return pi

def count_occurrences(p, t):
    pi = prefix_function(p)
    k, count = 0, 0
    for c in t:
        while k > 0 and c != p[k]:
            k = pi[k - 1]
        if c == p[k]:
            k += 1
        if k == len(p):
            count += 1
            k = pi[k - 1]
    return count`,
  },
]
