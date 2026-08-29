import type { ICPCProblem } from "./icpc-a"

export const PROBLEMS_ICPC_C: ICPCProblem[] = [
  {
    id: 49, stage: 7, title: "Kruskal MST Cost", pattern: "sort edges + DSU", skill: "accept cheapest safe edge", difficulty: "Medium",
    statement: "Given an undirected weighted graph with n nodes and edge list (u, v, w), return the total weight of a minimum spanning tree, or -1 if the graph is disconnected.",
    examples: [
      { input: "n = 4, edges = [(0,1,1),(1,2,2),(2,3,3),(0,3,4),(0,2,5)]", output: "6", explain: "edges 1, 2, 3 form the MST" },
      { input: "n = 3, edges = [(0, 1, 1)]", output: "-1" },
    ],
    why: "Kruskal is 'sort + union-find' — two tools you already own composed into a graph algorithm. The cut/cycle exchange argument makes greedy safe here.",
    starterCode: "def kruskal_cost(n, edges):\n    pass",
    hints: [
      "Sort edges by weight ascending.",
      "Union endpoints if they are in different components; add the weight and count the edge.",
      "A spanning tree needs exactly n-1 edges — fewer means disconnected."
    ],
    solution: "def kruskal_cost(n, edges):\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    total = 0\n    used = 0\n    for u, v, w in sorted(edges, key=lambda e: e[2]):\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n            total += w\n            used += 1\n    return total if used == n - 1 else -1",
    walkthrough: "Processing edges cheap-to-dear, an edge is safe exactly when it connects two components. DSU answers that in near-O(1). Counting edges detects disconnection without a separate traversal.",
    testCode: "assert kruskal_cost(4, [(0,1,1),(1,2,2),(2,3,3),(0,3,4),(0,2,5)]) == 6\nassert kruskal_cost(3, [(0, 1, 1)]) == -1\nassert kruskal_cost(2, [(0, 1, 7)]) == 7\nassert kruskal_cost(1, []) == 0\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 7, title: "Prim MST Cost", pattern: "heap frontier growth", skill: "grow from a seed", difficulty: "Medium",
    statement: "Compute the minimum spanning tree total weight of an undirected weighted graph by Prim's algorithm: start at node 0 and repeatedly add the cheapest edge leaving the grown tree. Return the total, or -1 if some node can never be reached.",
    examples: [
      { input: "n = 4, edges = [(0,1,1),(1,2,2),(2,3,3),(0,3,4),(0,2,5)]", output: "6" },
      { input: "n = 3, edges = [(0, 1, 1)]", output: "-1" },
    ],
    why: "Prim is Dijkstra's structure with a different key (edge weight instead of path distance). Comparing the two cements when each applies.",
    starterCode: "def prim_cost(n, edges):\n    pass",
    hints: [
      "Build adjacency lists; keep a heap of (weight, node) candidates leaving the tree.",
      "Pop the cheapest node not yet in the tree; add its weight; push its outgoing edges.",
      "Count added nodes; fewer than n means disconnected."
    ],
    solution: "import heapq\n\ndef prim_cost(n, edges):\n    adj = [[] for _ in range(n)]\n    for u, v, w in edges:\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n    in_tree = [False] * n\n    heap = [(0, 0)]\n    total, added = 0, 0\n    while heap and added < n:\n        w, node = heapq.heappop(heap)\n        if in_tree[node]:\n            continue\n        in_tree[node] = True\n        total += w\n        added += 1\n        for nxt, ew in adj[node]:\n            if not in_tree[nxt]:\n                heapq.heappush(heap, (ew, nxt))\n    return total if added == n else -1",
    walkthrough: "The heap always contains the cheapest crossing edge for every frontier node. Popping a node already in the tree discards a stale offer — the same lazy-deletion move as Dijkstra.",
    testCode: "assert prim_cost(4, [(0,1,1),(1,2,2),(2,3,3),(0,3,4),(0,2,5)]) == 6\nassert prim_cost(3, [(0, 1, 1)]) == -1\nassert prim_cost(2, [(1, 0, 7)]) == 7\nassert prim_cost(1, []) == 0\nprint('All tests passed!')"
  },
  {
    id: 51, stage: 7, title: "Connected Components Count", pattern: "flood fill", skill: "BFS/DFS per unvisited seed", difficulty: "Easy",
    statement: "Given an undirected graph with n nodes (0..n-1) and an edge list, return the number of connected components.",
    examples: [
      { input: "n = 5, edges = [(0, 1), (2, 3)]", output: "3", explain: "components {0,1}, {2,3}, {4}" },
      { input: "n = 4, edges = [(0, 1), (1, 2), (2, 3)]", output: "1" },
    ],
    why: "Component counting by seeding a traversal from every unvisited node is the simplest full-graph pattern — it underlies flood fill, islands, and labeling problems.",
    starterCode: "def count_components(n, edges):\n    pass",
    hints: [
      "Build adjacency lists and a visited array.",
      "For each unvisited node, BFS/DFS its whole component and increment the counter.",
      "Isolated nodes are components of size one."
    ],
    solution: "from collections import deque\n\ndef count_components(n, edges):\n    adj = [[] for _ in range(n)]\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    seen = [False] * n\n    components = 0\n    for start in range(n):\n        if seen[start]:\n            continue\n        components += 1\n        q = deque([start])\n        seen[start] = True\n        while q:\n            node = q.popleft()\n            for nxt in adj[node]:\n                if not seen[nxt]:\n                    seen[nxt] = True\n                    q.append(nxt)\n    return components",
    walkthrough: "Every traversal colors exactly one component. The number of times you need a fresh seed is the component count — no union-find required for a one-shot query.",
    testCode: "assert count_components(5, [(0,1),(2,3)]) == 3\nassert count_components(4, [(0,1),(1,2),(2,3)]) == 1\nassert count_components(3, []) == 3\nassert count_components(2, [(0, 1), (1, 0)]) == 1\nprint('All tests passed!')"
  },
  {
    id: 52, stage: 7, title: "Strongly Connected Components", pattern: "Kosaraju two-pass", skill: "order on reverse graph", difficulty: "Hard",
    statement: "Given a directed graph with n nodes and edge list, return the number of strongly connected components. Use Kosaraju's algorithm with iterative DFS (no recursion) to survive deep graphs.",
    examples: [
      { input: "n = 5, edges = [(1,0),(0,2),(2,1),(0,3),(3,4)]", output: "3", explain: "{0,1,2}, {3}, {4}" },
      { input: "n = 3, edges = [(0, 1), (1, 2)]", output: "3" },
    ],
    why: "SCC decomposition (condensation into a DAG) is the standard preprocessing for 'which decisions are forced' problems — 2-SAT, dominance, and reachability games.",
    starterCode: "def count_scc(n, edges):\n    pass",
    hints: [
      "Pass 1: iterative DFS on G, push nodes onto a stack in finishing order.",
      "Pass 2: DFS on the reversed graph, popping nodes from the stack; each new DFS tree is one SCC.",
      "Simulate recursion with an explicit stack of (node, child-iterator) frames."
    ],
    solution: "def count_scc(n, edges):\n    adj = [[] for _ in range(n)]\n    radj = [[] for _ in range(n)]\n    for u, v in edges:\n        adj[u].append(v)\n        radj[v].append(u)\n    visited = [False] * n\n    order = []\n    for start in range(n):\n        if visited[start]:\n            continue\n        stack = [(start, iter(adj[start]))]\n        visited[start] = True\n        while stack:\n            node, it = stack[-1]\n            advanced = False\n            for nxt in it:\n                if not visited[nxt]:\n                    visited[nxt] = True\n                    stack.append((nxt, iter(adj[nxt])))\n                    advanced = True\n                    break\n            if not advanced:\n                order.append(node)\n                stack.pop()\n    comp = 0\n    assigned = [False] * n\n    for node in reversed(order):\n        if assigned[node]:\n            continue\n        comp += 1\n        stack = [node]\n        assigned[node] = True\n        while stack:\n            cur = stack.pop()\n            for nxt in radj[cur]:\n                if not assigned[nxt]:\n                    assigned[nxt] = True\n                    stack.append(nxt)\n    return comp",
    walkthrough: "Finishing order on G guarantees the stack's top belongs to a 'source' SCC of the condensation. On the reverse graph, one DFS cannot escape its SCC, so each tree is exactly one component.",
    testCode: "assert count_scc(5, [(1,0),(0,2),(2,1),(0,3),(3,4)]) == 3\nassert count_scc(3, [(0,1),(1,2)]) == 3\nassert count_scc(2, [(0,1),(1,0)]) == 1\nassert count_scc(1, []) == 1\nprint('All tests passed!')"
  },
  {
    id: 53, stage: 7, title: "Count the Bridges", pattern: "bridges via low-link", skill: "DFS tree + back-edge reach", difficulty: "Hard",
    statement: "Given an undirected graph with n nodes and an edge list (no parallel edges), count the BRIDGES: edges whose removal increases the number of connected components. n and edges up to 2×10⁵.",
    examples: [
      { input: "n = 4, edges = [[0,1],[1,2],[2,0],[2,3]]", output: "1", explain: "triangle {0,1,2} is a cycle; edge 2–3 is the only escape" },
      { input: "n = 5, edges = [[0,1],[1,2],[2,3],[3,0],[2,4]]", output: "1", explain: "cycle 0-1-2-3 hangs node 4 off node 2" },
      { input: "n = 6, edges = [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3]]", output: "0", explain: "two separate cycles, no bridges" },
    ],
    why: "Deleting each edge and flood-filling costs O(E·(V+E)) — dead at 10⁵. Every DFS you have written already computes tin (entry time) implicitly; bridges ask one sharper question of that DFS tree: a tree edge u→v is a bridge iff NOTHING in v's subtree reaches u or above — written low[v] > tin[u]. One extra low-link array turns a global question into a per-edge check.",
    starterCode: "def count_bridges(n, edges):\n    pass",
    hints: [
      "Skip the edge you arrived on (compare edge INDICES, not the parent node — that's the parallel-edge-safe habit).",
      "Back-edge v→w with w already visited: low[v] = min(low[v], tin[w]). After a child returns: low[v] = min(low[v], low[child]).",
      "Bridge test at the parent: after dfs(child) returns, if low[child] > tin[v], the edge v–child is a bridge.",
    ],
    solution: "def count_bridges(n, edges):\n    import sys\n    sys.setrecursionlimit(300000)\n    adj = [[] for _ in range(n)]\n    for i, (a, b) in enumerate(edges):\n        adj[a].append((b, i))\n        adj[b].append((a, i))\n    tin = [-1] * n\n    low = [0] * n\n    timer = 0\n    bridges = 0\n    def dfs(v, pe):\n        nonlocal timer, bridges\n        tin[v] = low[v] = timer\n        timer += 1\n        for to, eid in adj[v]:\n            if eid == pe:\n                continue\n            if tin[to] != -1:\n                if tin[to] < low[v]:\n                    low[v] = tin[to]\n            else:\n                dfs(to, eid)\n                if low[to] > tin[v]:\n                    bridges += 1\n                if low[to] < low[v]:\n                    low[v] = low[to]\n    for v in range(n):\n        if tin[v] == -1:\n            dfs(v, -1)\n    return bridges",
    walkthrough: "low[v] answers: 'how high can v's subtree climb using at most one back edge?' If even the best climb stays strictly below u (low[child] > tin[u]), the edge is the ONLY thread — cut it and the subtree falls. This is the second low-link you've met — and articulation points are the vertex-flavored sibling, a two-line twist away. Same DFS, different question.",
    testCode: "assert count_bridges(4, [[0,1],[1,2],[2,0],[2,3]]) == 1\nassert count_bridges(5, [[0,1],[1,2],[2,3],[3,0],[2,4]]) == 1\nassert count_bridges(6, [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3]]) == 0\nassert count_bridges(2, [[0,1]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 54, stage: 7, title: "Possible Bipartition", pattern: "2-coloring BFS", skill: "parity of distance", difficulty: "Medium",
    statement: "n people dislike certain pairings, given as an edge list. Split everyone into two groups so no disliked pair shares a group. Return True if such a bipartition exists.",
    examples: [
      { input: "n = 4, dislikes = [(1, 2), (1, 3), (2, 4)]", output: "True", explain: "groups {1,4} and {2,3}" },
      { input: "n = 3, dislikes = [(1, 2), (2, 3), (3, 1)]", output: "False", explain: "odd cycle" },
    ],
    why: "Bipartite = 2-colorable = no odd cycle. The BFS parity coloring is the fastest check and the base of all matching theory in ICPC graph sections.",
    starterCode: "def possible_bipartition(n, dislikes):\n    pass",
    hints: [
      "Build adjacency; color array with 0 (uncolored), 1, -1.",
      "BFS from every uncolored node, assigning the opposite color to each neighbor.",
      "A conflict (neighbor already has the same color) means no bipartition."
    ],
    solution: "from collections import deque\n\ndef possible_bipartition(n, dislikes):\n    adj = [[] for _ in range(n + 1)]\n    for a, b in dislikes:\n        adj[a].append(b)\n        adj[b].append(a)\n    color = [0] * (n + 1)\n    for start in range(1, n + 1):\n        if color[start] != 0:\n            continue\n        color[start] = 1\n        q = deque([start])\n        while q:\n            node = q.popleft()\n            for nxt in adj[node]:\n                if color[nxt] == 0:\n                    color[nxt] = -color[node]\n                    q.append(nxt)\n                elif color[nxt] == color[node]:\n                    return False\n    return True",
    walkthrough: "Along any edge the colors must flip, so color is forced to parity of BFS depth. A same-color edge found later is an odd cycle — exactly the obstruction to bipartiteness.",
    testCode: "assert possible_bipartition(4, [(1,2),(1,3),(2,4)]) == True\nassert possible_bipartition(3, [(1,2),(2,3),(3,1)]) == False\nassert possible_bipartition(1, []) == True\nassert possible_bipartition(5, [(1,2),(3,4)]) == True\nprint('All tests passed!')"
  },
  {
    id: 55, stage: 7, title: "Maximum Bipartite Matching", pattern: "Kuhn augmenting paths", skill: "reroute to free a slot", difficulty: "Hard",
    statement: "Applicants (0..n-1) each list jobs they can do (jobs numbered 0..m-1). Each job takes one applicant. Return the maximum number of applicants that can be assigned distinct jobs.",
    examples: [
      { input: "n = 3, m = 3, prefs = [[0, 1], [0], [1, 2]]", output: "3", explain: "a0->1, a1->0, a2->2" },
      { input: "n = 2, m = 1, prefs = [[0], [0]]", output: "1" },
    ],
    why: "Kuhn's algorithm is the workhorse of assignment problems (judges/tasks/rooms). The augmenting path idea — 'rearrange to admit one more' — echoes into flows.",
    starterCode: "def max_matching(n, m, prefs):\n    pass",
    hints: [
      "match_job[j] = applicant currently holding job j (or -1).",
      "try_kuhn(u, visited): for each job j of u, if j unvisited: mark, and if job free or its holder can move (recurse), assign j to u.",
      "Run try_kuhn from every applicant; count successes."
    ],
    solution: "def max_matching(n, m, prefs):\n    match_job = [-1] * m\n    def try_assign(u, visited):\n        for j in prefs[u]:\n            if visited[j]:\n                continue\n            visited[j] = True\n            if match_job[j] == -1 or try_assign(match_job[j], visited):\n                match_job[j] = u\n                return True\n        return False\n    count = 0\n    for u in range(n):\n        if try_assign(u, [False] * m):\n            count += 1\n    return count",
    walkthrough: "A new applicant either takes a free job or evicts its holder, who recursively hunts for another. Success means the matching grew by one along an alternating path — the definition of augmenting.",
    testCode: "assert max_matching(3, 3, [[0,1],[0],[1,2]]) == 3\nassert max_matching(2, 1, [[0],[0]]) == 1\nassert max_matching(2, 3, [[0,1,2],[0,1,2]]) == 2\nassert max_matching(1, 2, [[]]) == 0\nprint('All tests passed!')"
  },
  {
    id: 56, stage: 8, title: "Frog Jump Cost", pattern: "linear DP", skill: "best cost to reach i", difficulty: "Easy",
    statement: "A frog crosses stones 0..n-1; from stone i it may jump to i+1 or i+2, paying |h[i] - h[j]| energy. Return the minimum total energy to reach the last stone.",
    examples: [
      { input: "h = [10, 30, 40, 20]", output: "30", explain: "10 -> 30 -> 20 costs 20 + 10" },
      { input: "h = [10, 10]", output: "0" },
    ],
    why: "The simplest 'dp[i] depends on a bounded set of predecessors' recurrence. Every jump-game and staircase DP is this with more moves.",
    starterCode: "def frog_cost(h):\n    pass",
    hints: [
      "dp[i] = min cost to stand on stone i; dp[0] = 0.",
      "dp[i] = min(dp[i-1] + |h[i]-h[i-1]|, dp[i-2] + |h[i]-h[i-2]|) when those stones exist.",
      "Fill left to right; answer is dp[n-1]."
    ],
    solution: "def frog_cost(h):\n    n = len(h)\n    dp = [0] * n\n    for i in range(1, n):\n        best = dp[i - 1] + abs(h[i] - h[i - 1])\n        if i >= 2:\n            best = min(best, dp[i - 2] + abs(h[i] - h[i - 2]))\n        dp[i] = best\n    return dp[n - 1]",
    walkthrough: "Only the previous two stones can reach i, so the recurrence is O(1) per state. The DP array could shrink to two variables — the classic space optimization to try next.",
    testCode: "assert frog_cost([10,30,40,20]) == 30\nassert frog_cost([10, 10]) == 0\nassert frog_cost([30, 10, 60, 10, 60, 50]) == 40\nassert frog_cost([5]) == 0\nprint('All tests passed!')"
  },
  {
    id: 57, stage: 8, title: "House Robber", pattern: "take-or-skip DP", skill: "adjacent exclusion", difficulty: "Easy",
    statement: "Houses hold loot values in a row; robbing two adjacent houses triggers an alarm. Return the maximum loot obtainable.",
    examples: [
      { input: "vals = [2, 7, 9, 3, 1]", output: "12", explain: "rob 2, 9, 1" },
      { input: "vals = [2, 1, 1, 2]", output: "4", explain: "rob the two 2s" },
    ],
    why: "The two-state formulation (best ending here vs best so far) is the seed of every 'no two adjacent' constraint, including tree versions and interval scheduling.",
    starterCode: "def rob(vals):\n    pass",
    hints: [
      "Let take = best if you rob house i, skip = best if you don't.",
      "new_take = skip + vals[i]; new_skip = max(take, skip).",
      "Answer is max(take, skip) after the last house."
    ],
    solution: "def rob(vals):\n    take, skip = 0, 0\n    for x in vals:\n        take, skip = skip + x, max(take, skip)\n    return max(take, skip)",
    walkthrough: "Robbing house i forces skipping i-1, so take inherits skip. Skipping inherits the better of both previous states. Two rolling variables replace the whole DP array.",
    testCode: "assert rob([2,7,9,3,1]) == 12\nassert rob([2,1,1,2]) == 4\nassert rob([5]) == 5\nassert rob([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 58, stage: 8, title: "0/1 Knapsack", pattern: "capacity DP", skill: "item in or out", difficulty: "Medium",
    statement: "Given item weights and values, choose a subset with total weight at most W maximizing total value. Each item may be used at most once. Return the maximum value.",
    examples: [
      { input: "weights = [1, 3, 4], values = [15, 20, 30], W = 4", output: "35", explain: "items 0 and 1" },
      { input: "weights = [5], values = [10], W = 4", output: "0" },
    ],
    why: "Knapsack is the archetype of capacity-indexed DP and the base of subset-sum, partition, and count variants across every ICPC regional.",
    starterCode: "def knapsack(weights, values, W):\n    pass",
    hints: [
      "dp[w] = best value with capacity exactly <= w using items processed so far.",
      "Process items one by one; iterate w from W down to weight to prevent reuse.",
      "dp[w] = max(dp[w], dp[w - weight] + value) for w >= weight."
    ],
    solution: "def knapsack(weights, values, W):\n    dp = [0] * (W + 1)\n    for weight, value in zip(weights, values):\n        for w in range(W, weight - 1, -1):\n            dp[w] = max(dp[w], dp[w - weight] + value)\n    return dp[W]",
    walkthrough: "The descending capacity loop is the whole trick: it reads dp[w - weight] from the previous item's layer, enforcing the 0/1 (no-reuse) constraint. Ascending order would silently allow unbounded items.",
    testCode: "assert knapsack([1,3,4],[15,20,30], 4) == 35\nassert knapsack([5],[10], 4) == 0\nassert knapsack([2,2,2],[5,5,5], 6) == 15\nassert knapsack([1,2,3],[6,10,12], 5) == 22\nprint('All tests passed!')"
  },
  {
    id: 59, stage: 8, title: "Coin Change Minimum", pattern: "unbounded knapsack", skill: "last-coin decomposition", difficulty: "Medium",
    statement: "Given coin denominations (unlimited supply) and an amount, return the fewest coins summing to the amount, or -1 if impossible.",
    examples: [
      { input: "coins = [1, 2, 5], amount = 11", output: "3", explain: "5+5+1" },
      { input: "coins = [2], amount = 3", output: "-1" },
    ],
    why: "The forward capacity loop (ascending w) is exactly what makes items reusable — compare with knapsack to own both variants. Greedy fails for arbitrary coins, which is why DP is required.",
    starterCode: "def coin_change(coins, amount):\n    pass",
    hints: [
      "dp[x] = fewest coins to make x; dp[0] = 0, others INF.",
      "For each coin, for x from coin to amount: dp[x] = min(dp[x], dp[x - coin] + 1).",
      "dp[amount] still INF means impossible."
    ],
    solution: "def coin_change(coins, amount):\n    INF = float('inf')\n    dp = [0] + [INF] * amount\n    for coin in coins:\n        for x in range(coin, amount + 1):\n            if dp[x - coin] + 1 < dp[x]:\n                dp[x] = dp[x - coin] + 1\n    return dp[amount] if dp[amount] != INF else -1",
    walkthrough: "The last coin used fully determines the subproblem: dp[x] = 1 + min over coins of dp[x - coin]. Ascending x guarantees dp[x - coin] is already final for the current coin.",
    testCode: "assert coin_change([1,2,5], 11) == 3\nassert coin_change([2], 3) == -1\nassert coin_change([1], 0) == 0\nassert coin_change([1, 5, 6, 9], 11) == 2\nprint('All tests passed!')"
  },
  {
    id: 60, stage: 8, title: "Longest Increasing Subsequence", pattern: "patience sorting", skill: "binary search tails", difficulty: "Hard",
    statement: "Return the length of the longest strictly increasing subsequence of the array, in O(n log n).",
    examples: [
      { input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4", explain: "2, 3, 7, 101 (or 2,5,7,101)" },
      { input: "nums = [7, 7, 7]", output: "1" },
    ],
    why: "The tails array (smallest tail of an increasing subsequence of each length) is one of the most reused contest structures — 2D LIS, envelopes, and chain problems all reduce to it.",
    starterCode: "def lis_length(nums):\n    pass",
    hints: [
      "Maintain tails: tails[k] = smallest possible tail of an increasing subsequence of length k+1; it stays sorted.",
      "For each x, binary search (bisect_left) the first tail >= x and replace it.",
      "If x exceeds all tails, append — the LIS grows."
    ],
    solution: "from bisect import bisect_left\n\ndef lis_length(nums):\n    tails = []\n    for x in nums:\n        i = bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x\n    return len(tails)",
    walkthrough: "Replacing tails[i] with a smaller value keeps the invariant without changing current lengths, but widens future options. bisect_left enforces strict increase (equal values replace, not extend).",
    testCode: "assert lis_length([10,9,2,5,3,7,101,18]) == 4\nassert lis_length([7,7,7]) == 1\nassert lis_length([]) == 0\nassert lis_length([1, 3, 2, 4]) == 3\nprint('All tests passed!')"
  },
  {
    id: 61, stage: 8, title: "Maximum Subarray", pattern: "Kadane", skill: "extend or restart", difficulty: "Easy",
    statement: "Return the largest sum of any contiguous non-empty subarray.",
    examples: [
      { input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]", output: "6", explain: "[4, -1, 2, 1]" },
      { input: "nums = [-3, -1, -2]", output: "-1" },
    ],
    why: "Kadane's decision — extend the running block or restart at me — is the one-pass DP everyone must be able to re-derive under contest pressure.",
    starterCode: "def max_subarray(nums):\n    pass",
    hints: [
      "cur = best sum of a subarray ending exactly at index i.",
      "cur = max(x, cur + x) — a negative prefix can only hurt.",
      "Track the global max of cur over all i."
    ],
    solution: "def max_subarray(nums):\n    cur = best = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best",
    walkthrough: "If the best block ending at i-1 is negative, starting fresh at i beats extending it. One variable carries the ending-here optimum; one carries the answer.",
    testCode: "assert max_subarray([-2,1,-3,4,-1,2,1,-5,4]) == 6\nassert max_subarray([-3,-1,-2]) == -1\nassert max_subarray([5]) == 5\nassert max_subarray([1, 2, 3]) == 6\nprint('All tests passed!')"
  },
  {
    id: 62, stage: 9, title: "Grid Paths with Obstacles", pattern: "2D grid DP", skill: "accumulate from top and left", difficulty: "Medium",
    statement: "A robot walks on a grid from the top-left to the bottom-right, moving only right or down. Cells with 1 are obstacles. Return the number of distinct paths.",
    examples: [
      { input: "grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]", output: "2", explain: "around the center block" },
      { input: "grid = [[0, 1], [1, 0]]", output: "0" },
    ],
    why: "Counting paths on a grid is the entry to all 2D DPs. The in-place trick (reuse the grid as the DP table) is a standard memory saver under contest limits.",
    starterCode: "def count_paths(grid):\n    pass",
    hints: [
      "paths[i][j] = 0 if obstacle else paths[i-1][j] + paths[i][j-1].",
      "Seed the start cell with 1 (only if open).",
      "First row/column cells have exactly one way in — until blocked."
    ],
    solution: "def count_paths(grid):\n    m, n = len(grid), len(grid[0])\n    dp = [[0] * n for _ in range(m)]\n    dp[0][0] = 1 if grid[0][0] == 0 else 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == 1 or (i == 0 and j == 0):\n                continue\n            top = dp[i - 1][j] if i > 0 else 0\n            left = dp[i][j - 1] if j > 0 else 0\n            dp[i][j] = top + left\n    return dp[m - 1][n - 1]",
    walkthrough: "Every arrival at (i, j) came from above or from the left, so counts add. Obstacles zero out their cell and starve everything beyond them that relied solely on that direction.",
    testCode: "assert count_paths([[0,0,0],[0,1,0],[0,0,0]]) == 2\nassert count_paths([[0,1],[1,0]]) == 0\nassert count_paths([[0]]) == 1\nassert count_paths([[0, 0], [0, 0]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 63, stage: 9, title: "Meet in the Middle", pattern: "meet in the middle", skill: "split, enumerate, combine", difficulty: "Medium",
    statement: "Given n ≤ 30 item weights and a capacity W, choose a subset with the maximum total weight not exceeding W. Return that total.",
    examples: [
      { input: "W = 9, weights = [3, 34, 4, 12, 5, 2]", output: "9", explain: "3 + 4 + 2 = 9" },
      { input: "W = 30, weights = [3, 34, 4, 12, 5, 2]", output: "26", explain: "3 + 4 + 12 + 5 + 2 = 26" },
      { input: "W = 2³⁰−1, weights = [1, 2, 4, …, 2²⁹]", output: "2³⁰−1", explain: "take everything except the top weight — the powers of two sum exactly" },
    ],
    why: "All 2³⁰ ≈ 10⁹ subsets overflow any time limit. But the space SPLITS cleanly: enumerate 2¹⁵ sums of each half, sort one side, and for every a in the first half binary-search the largest b ≤ W − a (stage 2's move). 2 × 2¹⁵ + 15 × 2¹⁵ ≈ 10⁶ — a thousand-fold win for one split.",
    starterCode: "def best_load(w, weights):\n    pass",
    hints: [
      "Write subset_sums(vals): start with [0]; for each v append v to every existing sum (the list doubles).",
      "Sort the second half's sums. For each a in the first half, legal partners satisfy b ≤ w − a: bisect_right finds the boundary.",
      "Answer = max(a + B[i]) over all a; track the running best.",
    ],
    solution: "def best_load(w, weights):\n    import bisect\n    def subset_sums(vals):\n        sums = [0]\n        for v in vals:\n            sums += [s + v for s in sums]\n        return sums\n    h = len(weights) // 2\n    A = subset_sums(weights[:h])\n    B = sorted(subset_sums(weights[h:]))\n    ans = 0\n    for a in A:\n        if a > w:\n            continue\n        i = bisect.bisect_right(B, w - a) - 1\n        if i >= 0 and a + B[i] > ans:\n            ans = a + B[i]\n    return ans",
    walkthrough: "The art is noticing which problems split: n ≈ 30 with a 'pick a subset' shape is the signature. Half-enumeration is exponential twice — 2^(n/2) — polynomially tiny compared to 2^n. Meet-in-the-middle composes three moves you already own: subset enumeration, sorting, binary search.",
    testCode: "assert best_load(9, [3, 34, 4, 12, 5, 2]) == 9\nassert best_load(30, [3, 34, 4, 12, 5, 2]) == 26\nassert best_load(2**30 - 1, [2**i for i in range(30)]) == 2**30 - 1\nassert best_load(5, [10, 20]) == 0\nprint('All tests passed!')"
  },
  {
    id: 64, stage: 9, title: "Digit DP: Adjacent Different", pattern: "digit DP", skill: "tight flag + previous digit", difficulty: "Hard",
    statement: "Count the integers from 1 to n (inclusive) whose decimal digits are all pairwise-adjacent different — no two neighboring digits are equal. n can be large, so do not iterate the range.",
    examples: [
      { input: "n = 100", output: "90", explain: "1-9 plus 10-99 minus the nine repeats (11, 22, ...)" },
      { input: "n = 9", output: "9" },
    ],
    why: "Digit DP (position + tight + last digit) is the standard answer for 'count numbers with a digit property up to N' when N overflows any array — a recurring ICPC hard-easy.",
    starterCode: "def count_adjacent_different(n):\n    pass",
    hints: [
      "Process digits of n left to right with state (position, previous digit, tight).",
      "tight means the prefix built so far equals n's prefix — the next digit is capped by n's digit; otherwise 0..9.",
      "Count free-position branches with the standard 9 choices for the first digit and 9 (non-equal) for each later digit; add the exact tight path if it stays valid."
    ],
    solution: "def count_adjacent_different(n):\n    digits = str(n)\n    L = len(digits)\n    total = 0\n    for i in range(1, L):\n        count = 9\n        for _ in range(1, i):\n            count *= 9\n        total += count\n    prefix_ok = True\n    prev = -1\n    for idx, ch in enumerate(digits):\n        d = int(ch)\n        low = 1 if idx == 0 else 0\n        for choice in range(low, d):\n            if choice == prev:\n                continue\n            remaining = L - idx - 1\n            count = 1\n            for _ in range(remaining):\n                count *= 9\n            total += count\n        if d == prev:\n            prefix_ok = False\n            break\n        prev = d\n    if prefix_ok:\n        total += 1\n    return total",
    walkthrough: "Numbers shorter than n contribute fixed counts (9, then 9*9, ...). For n's own length, branch at the first digit that drops below n's digit, multiply the free choices for the remaining positions, and finally count n itself if its digits never repeat.",
    testCode: "assert count_adjacent_different(100) == 90\nassert count_adjacent_different(9) == 9\nassert count_adjacent_different(11) == 10\nassert count_adjacent_different(120) == 100\nprint('All tests passed!')"
  },
  {
    id: 65, stage: 9, title: "Traveling Salesman (Bitmask)", pattern: "bitmask DP", skill: "subset as a mask", difficulty: "Hard",
    statement: "Given an n x n distance matrix (n <= 15), return the length of the shortest route that starts at node 0, visits every node exactly once, and returns to node 0.",
    examples: [
      { input: "dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]", output: "80", explain: "0 -> 1 -> 3 -> 2 -> 0" },
      { input: "dist = [[0, 5],[5, 0]]", output: "10" },
    ],
    why: "Held–Karp is the canonical bitmask DP: the mask encodes the visited set, trading exponential states for correctness where greedy and heuristics fail.",
    starterCode: "def tsp(dist):\n    pass",
    hints: [
      "dp[mask][i] = shortest path starting at 0, visiting exactly the nodes in mask, ending at i.",
      "Transition: dp[mask | (1<<j)][j] = min(dp[mask][i] + dist[i][j]) over i in mask.",
      "Answer: min over i of dp[full][i] + dist[i][0]."
    ],
    solution: "def tsp(dist):\n    n = len(dist)\n    full = (1 << n) - 1\n    INF = float('inf')\n    dp = [[INF] * n for _ in range(1 << n)]\n    dp[1][0] = 0\n    for mask in range(1 << n):\n        for i in range(n):\n            cur = dp[mask][i]\n            if cur == INF or not (mask >> i) & 1:\n                continue\n            for j in range(n):\n                if (mask >> j) & 1:\n                    continue\n                nm = mask | (1 << j)\n                cand = cur + dist[i][j]\n                if cand < dp[nm][j]:\n                    dp[nm][j] = cand\n    return min(dp[full][i] + dist[i][0] for i in range(n))",
    walkthrough: "Iterating masks in increasing order guarantees submasks are final before they are extended. n bits, n end nodes: O(2^n * n^2) states-time — feasible to n ≈ 20 with tight code.",
    testCode: "assert tsp([[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]) == 80\nassert tsp([[0,5],[5,0]]) == 10\nassert tsp([[0]]) == 0\nassert tsp([[0,1,8],[1,0,2],[8,2,0]]) == 11\nprint('All tests passed!')"
  },
  {
    id: 66, stage: 9, title: "Matrix Chain Multiplication", pattern: "interval DP", skill: "split the last multiplication", difficulty: "Hard",
    statement: "Matrices A_1..A_n with dimensions given as the array dims (A_i is dims[i-1] x dims[i]). Find the minimum number of scalar multiplications to compute the product A_1 * A_2 * ... * A_n.",
    examples: [
      { input: "dims = [10, 30, 5, 60]", output: "4500", explain: "(A1*A2)*A3" },
      { input: "dims = [40, 20, 30, 10, 30]", output: "26000" },
    ],
    why: "Interval DP — 'try every split of the range' — is the template for chain multiplication, burst balloons, and parsing problems. The outer loop is interval length.",
    starterCode: "def matrix_chain(dims):\n    pass",
    hints: [
      "dp[i][j] = min multiplications to compute A_i..A_j; dp[i][i] = 0.",
      "dp[i][j] = min over k in [i, j-1] of dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j].",
      "Fill by increasing interval length, not row by row."
    ],
    solution: "def matrix_chain(dims):\n    n = len(dims) - 1\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = min(\n                dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]\n                for k in range(i, j)\n            )\n    return dp[0][n - 1]",
    walkthrough: "The last multiplication merges two finished products, so every possible split point k is tried. Length-ordered filling guarantees both halves are ready when needed.",
    testCode: "assert matrix_chain([10,30,5,60]) == 4500\nassert matrix_chain([40,20,30,10,30]) == 26000\nassert matrix_chain([5, 10]) == 0\nassert matrix_chain([1, 2, 3, 4]) == 18\nprint('All tests passed!')"
  },
  {
    id: 67, stage: 9, title: "Tree Max Independent Set", pattern: "tree DP", skill: "in/out states per node", difficulty: "Hard",
    statement: "Given a tree with n nodes (rooted at 0, edge list), return the size of the largest set of nodes with no two adjacent — the maximum independent set.",
    examples: [
      { input: "n = 5, edges = [(0, 1), (0, 2), (2, 3), (2, 4)]", output: "3", explain: "{1, 3, 4}" },
      { input: "n = 2, edges = [(0, 1)]", output: "1" },
    ],
    why: "Two states per node (taken vs not) is the base of all tree DP — vertex cover, dominating set, and tree knapsack all extend this exact skeleton.",
    starterCode: "def tree_independent_set(n, edges):\n    pass",
    hints: [
      "For each node compute (best_if_taken, best_if_skipped).",
      "Taken: 1 + sum of children's skipped values. Skipped: sum of children's max(taken, skipped).",
      "Process nodes in reverse BFS order (children first) to avoid recursion."
    ],
    solution: "from collections import deque\n\ndef tree_independent_set(n, edges):\n    children = [[] for _ in range(n)]\n    for a, b in edges:\n        children[a].append(b)\n    order, q = [], deque([0])\n    while q:\n        node = q.popleft()\n        order.append(node)\n        q.extend(children[node])\n    taken = [0] * n\n    skipped = [0] * n\n    for node in reversed(order):\n        taken[node] = 1 + sum(skipped[c] for c in children[node])\n        skipped[node] = sum(max(taken[c], skipped[c]) for c in children[node])\n    return max(taken[0], skipped[0])",
    walkthrough: "Taking a node bans its children, so their 'skipped' values are forced; skipping a node lets each child choose freely. Reverse BFS order makes the two-state accumulation recursion-free.",
    testCode: "assert tree_independent_set(5, [(0,1),(0,2),(2,3),(2,4)]) == 3\nassert tree_independent_set(2, [(0, 1)]) == 1\nassert tree_independent_set(1, []) == 1\nassert tree_independent_set(4, [(0,1),(1,2),(2,3)]) == 2\nprint('All tests passed!')"
  },
  {
    id: 68, stage: 9, title: "Sum of Distances Everywhere", pattern: "rerooting", skill: "two passes: down then up", difficulty: "Hard",
    statement: "Given a tree of n nodes as an edge list, return ans[v] = the sum of distances from v to every other node, for ALL v at once. n up to 2×10⁵ — O(n) expected.",
    examples: [
      { input: "n = 3, edges = [[0,1],[1,2]]", output: "[3, 2, 3]", explain: "from 0: 1+2 = 3; from the middle: 1+1 = 2" },
      { input: "n = 4, edges = [[0,1],[0,2],[0,3]]", output: "[3, 5, 5, 5]", explain: "center reaches everyone in 1; a leaf pays 2 for each sibling leaf" },
    ],
    why: "Running a DFS per node is O(n²) = 4×10¹⁰. Root once: pass 1 computes each subtree's size and internal distance sum (the tree-DP move from 'Tree Max Independent Set'). Pass 2 walks down the tree converting the parent's finished answer into the child's: crossing edge p–v makes sz[v] nodes get 1 closer and n − sz[v] nodes get 1 farther — ans[v] = ans[p] − sz[v] + (n − sz[v]). Two walks, every root answered.",
    starterCode: "def distance_sums(n, edges):\n    pass",
    hints: [
      "Build an order that lists parents before children (stack preorder from root 0); reuse it reversed for post-order accumulation.",
      "Pass 1 (reversed order): sz[p] += sz[v]; down[p] += down[v] + sz[v].",
      "Pass 2 (preorder): ans[0] = down[0]; ans[v] = ans[parent] − sz[v] + (n − sz[v]).",
    ],
    solution: "def distance_sums(n, edges):\n    adj = [[] for _ in range(n)]\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    sz = [1] * n\n    down = [0] * n\n    ans = [0] * n\n    parent = [-1] * n\n    order = []\n    seen = [False] * n\n    seen[0] = True\n    stack = [0]\n    while stack:\n        v = stack.pop()\n        order.append(v)\n        for c in adj[v]:\n            if not seen[c]:\n                seen[c] = True\n                parent[c] = v\n                stack.append(c)\n    for v in reversed(order):\n        if parent[v] != -1:\n            sz[parent[v]] += sz[v]\n            down[parent[v]] += down[v] + sz[v]\n    ans[0] = down[0]\n    for v in order:\n        p = parent[v]\n        if p != -1:\n            ans[v] = ans[p] - sz[v] + (n - sz[v])\n    return ans",
    walkthrough: "The rerooting insight: adjacent answers differ by a TEAR along their connecting edge. Inside v's subtree (sz[v] nodes) every distance shrinks by 1; everything else (n − sz[v] nodes) grows by 1. One subtraction, one addition — the n-root problem collapses into two linear scans. Expect this 'root it, then push answers down' shape in many tree problems.",
    testCode: "assert distance_sums(3, [[0,1],[1,2]]) == [3, 2, 3]\nassert distance_sums(4, [[0,1],[0,2],[0,3]]) == [3, 5, 5, 5]\nassert distance_sums(2, [[0,1]]) == [1, 1]\nprint('All tests passed!')"
  },
]
