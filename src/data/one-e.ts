import type { OneProblem } from "./one"

export const PROBLEMS_ONE_E: OneProblem[] = [
  {
    id: 69, stage: 12, title: "Dijkstra Basics", pattern: "Dijkstra with a heap", skill: "greedy on settled distances", difficulty: "Medium",
    statement: "Given a weighted directed graph as adj = {node: [(neighbor, weight), ...]} and a source, return {node: shortest_distance} for every node reachable from the source.",
    examples: [
      { input: "adj = {0: [(1, 4), (2, 1)], 2: [(1, 2)], 1: [(3, 5)], 3: []}, src = 0", output: "{0: 0, 1: 3, 2: 1, 3: 8}", explain: "0->2->1 beats 0->1" },
      { input: "adj = {0: [(1, 1)]}, src = 0", output: "{0: 0, 1: 1}" },
    ],
    why: "BFS (stage 11) computed first-visit distances because every edge cost 1. Dijkstra generalizes exactly one thing: instead of FIFO order, always settle the closest unsettled node — provably safe when weights are non-negative. The heap replaces the queue; everything else is the same traversal you already own.",
    starterCode: "import heapq\n\ndef dijkstra(adj, src):\n    pass",
    hints: [
      "Push (distance, node); pop the smallest — the first time you pop a node, its distance is final.",
      "Skip stale entries (popped distance worse than recorded).",
      "Relax: if dist + w improves the neighbor's recorded distance, update and push."
    ],
    solution: "import heapq\n\ndef dijkstra(adj, src):\n    dist = {src: 0}\n    heap = [(0, src)]\n    while heap:\n        d, node = heapq.heappop(heap)\n        if d > dist.get(node, float('inf')):\n            continue\n        for nb, w in adj.get(node, []):\n            nd = d + w\n            if nd < dist.get(nb, float('inf')):\n                dist[nb] = nd\n                heapq.heappush(heap, (nd, nb))\n    return dist",
    walkthrough: "The greedy proof: when a node pops with distance d, no other path can be shorter — every alternative would have to pass through a frontier node already >= d. The stale-entry check is the lazy-deletion idiom: instead of decrease-key, push duplicates and skip the old ones. O((V+E) log V).",
    testCode: "assert dijkstra({0: [(1, 4), (2, 1)], 2: [(1, 2)], 1: [(3, 5)], 3: []}, 0) == {0: 0, 1: 3, 2: 1, 3: 8}\nassert dijkstra({0: [(1, 1)]}, 0) == {0: 0, 1: 1}\nassert dijkstra({}, 7) == {7: 0}\nassert dijkstra({0: [(1, 2)], 1: [(0, 2)]}, 0) == {0: 0, 1: 2}\nprint('All tests passed!')"
  },
  {
    id: 70, stage: 12, title: "Cheapest Flights", pattern: "Bellman-Ford, layered", skill: "relaxation beats greedy here", difficulty: "Medium",
    statement: "n cities, flights as [from, to, price]. Find the cheapest price from src to dst using at most k intermediate stops (at most k + 1 edges), or -1.",
    examples: [
      { input: "n = 4, flights = [[0, 1, 100], [1, 3, 600], [1, 2, 100], [2, 3, 200]], src = 0, dst = 3, k = 1", output: "700", explain: "0->1->3 costs 700; 0->1->2->3 has 2 stops" },
      { input: "same, k = 0", output: "-1" },
    ],
    why: "Dijkstra fails here: the globally cheapest path to a city may use too many stops, and a pricier partial path may be the only one that satisfies the limit — state must include the edge count. Bellman-Ford in layers relaxes ALL edges k + 1 times, so after round i you hold the best costs using at most i edges. When the greedy's order-independence proof breaks (negative edges, resource limits), relaxation is the fallback.",
    starterCode: "def cheapest_flights(n, flights, src, dst, k):\n    pass",
    hints: [
      "cost[] holds best-known prices; run k + 1 rounds.",
      "Each round, compute from a snapshot: new[to] = min(new[to], old[from] + price) — the snapshot is what bounds edges per round.",
      "Answer is cost[dst] or -1."
    ],
    solution: "def cheapest_flights(n, flights, src, dst, k):\n    cost = [float('inf')] * n\n    cost[src] = 0\n    for _ in range(k + 1):\n        snapshot = cost[:]\n        for f, t, price in flights:\n            if snapshot[f] + price < cost[t]:\n                cost[t] = snapshot[f] + price\n    return cost[dst] if cost[dst] != float('inf') else -1",
    walkthrough: "The snapshot separates rounds: updates within a round cannot chain, so round i's costs use at most i edges exactly. k + 1 rounds, O(k·E) — slow per round but immune to the greedy failure mode. With k = 0 only one-edge flights count: dst 3 needs 2 edges, so -1.",
    testCode: "assert cheapest_flights(4, [[0, 1, 100], [1, 3, 600], [1, 2, 100], [2, 3, 200]], 0, 3, 1) == 700\nassert cheapest_flights(4, [[0, 1, 100], [1, 3, 600], [1, 2, 100], [2, 3, 200]], 0, 3, 0) == -1\nassert cheapest_flights(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1) == 200\nassert cheapest_flights(2, [[0, 1, 50]], 1, 0, 5) == -1\nprint('All tests passed!')"
  },
  {
    id: 71, stage: 12, title: "Zero One BFS", pattern: "deque with weight 0/1", skill: "0-edges jump the queue", difficulty: "Medium",
    statement: "Graph edges have weight 0 or 1. Return the shortest distance from src to every node — without Dijkstra, using one deque.",
    examples: [
      { input: "n = 5, edges = [(0, 1, 0), (1, 2, 1), (0, 3, 1), (3, 2, 0), (2, 4, 1)], src = 0", output: "{0: 0, 1: 0, 2: 1, 3: 1, 4: 2}" },
      { input: "n = 2, edges = [(0, 1, 1)], src = 0", output: "{0: 0, 1: 1}" },
    ],
    why: "Between BFS (all weights 1) and Dijkstra (any weights) sits a sweet spot: 0/1 weights. A deque does what a heap did — 0-weight edges push FRONT (same effective distance, must be processed first), 1-weight edges push BACK. When your edge weights take few distinct values, the data structure can often be downgraded from heap to deque.",
    starterCode: "from collections import deque\n\ndef zero_one_bfs(n, edges, src):\n    pass",
    hints: [
      "Build the adjacency with weights; dist[src] = 0; deque starts with src.",
      "Popping node u with distance d: for edge (v, w): candidate d + w.",
      "If it improves dist[v]: update, and appendleft if w == 0 else append."
    ],
    solution: "from collections import deque\n\ndef zero_one_bfs(n, edges, src):\n    adj = {i: [] for i in range(n)}\n    for u, v, w in edges:\n        adj[u].append((v, w))\n        adj[v].append((u, w))\n    dist = {src: 0}\n    dq = deque([src])\n    while dq:\n        u = dq.popleft()\n        du = dist[u]\n        for v, w in adj[u]:\n            nd = du + w\n            if nd < dist.get(v, float('inf')):\n                dist[v] = nd\n                if w == 0:\n                    dq.appendleft(v)\n                else:\n                    dq.append(v)\n    return dist",
    walkthrough: "The deque stays 'sorted by distance' with at most two distinct values — that is the invariant that makes popping correct. Appending a 0-edge node to the front preserves it. Undirected here means both directions added; a node may be improved twice, which the dist check handles.",
    testCode: "assert zero_one_bfs(5, [(0, 1, 0), (1, 2, 1), (0, 3, 1), (3, 2, 0), (2, 4, 1)], 0) == {0: 0, 1: 0, 2: 1, 3: 1, 4: 2}\nassert zero_one_bfs(2, [(0, 1, 1)], 0) == {0: 0, 1: 1}\nassert zero_one_bfs(3, [], 0) == {0: 0}\nprint('All tests passed!')"
  },
  {
    id: 72, stage: 12, title: "All Pairs Small", pattern: "Floyd-Warshall", skill: "allow intermediates one by one", difficulty: "Medium",
    statement: "Given n nodes and weighted edges, compute the shortest distance between EVERY pair. Missing edges are infinite. Return the full n×n distance matrix.",
    examples: [
      { input: "n = 3, edges = [(0, 1, 4), (1, 2, 1), (0, 2, 9)]", output: "d[0][2] = 5 (0->1->2), d[0][1] = 4, d[1][0] = 4, d[0][0] = 0" },
      { input: "n = 2, edges = [(0, 1, 3)]", output: "d[1][0] = 3 (undirected), d[0][0] = d[1][1] = 0" },
    ],
    why: "Three lines of loop that encode a deep induction: after allowing intermediate nodes from {0..k}, d[i][j] is optimal among paths restricted to those intermediates. k = n means everything. It is the densest cost-per-line algorithm in this ladder — and the natural 'just give me everything' baseline for small n.",
    starterCode: "def all_pairs(n, edges):\n    pass",
    hints: [
      "d[i][j] = 0 for i == j, edge weight for direct edges, else infinity. Undirected: set both directions.",
      "Triple loop: for k, then for i, then for j: d[i][j] = min(d[i][j], d[i][k] + d[k][j]).",
      "k must be the OUTERMOST loop — the induction depends on the order."
    ],
    solution: "def all_pairs(n, edges):\n    INF = float('inf')\n    d = [[INF] * n for _ in range(n)]\n    for i in range(n):\n        d[i][i] = 0\n    for u, v, w in edges:\n        if w < d[u][v]:\n            d[u][v] = w\n            d[v][u] = w\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if d[i][k] + d[k][j] < d[i][j]:\n                    d[i][j] = d[i][k] + d[k][j]\n    return d",
    walkthrough: "Each k pass certifies: 'all best paths that may route through nodes 0..k are now exact'. The check d[i][k] + d[k][j] improves d[i][j] with already-computed values — that is the induction step. O(n³) time, O(n²) space; unbeatable for dense small graphs and for detecting negative cycles (d[i][i] < 0).",
    testCode: "d = all_pairs(3, [(0, 1, 4), (1, 2, 1), (0, 2, 9)])\nassert d[0][2] == 5 and d[0][1] == 4 and d[1][0] == 4 and d[0][0] == 0\nd2 = all_pairs(2, [(0, 1, 3)])\nassert d2[1][0] == 3 and d2[0][0] == 0 and d2[1][1] == 0\nprint('All tests passed!')"
  },
  {
    id: 73, stage: 12, title: "Minimum Effort Path", pattern: "minimize the max along the path", skill: "binary search meets BFS, again", difficulty: "Hard",
    statement: "Walk a grid from top-left to bottom-right moving 4-directionally. The effort of a path is the maximum absolute height difference between consecutive cells. Minimize the effort.",
    examples: [
      { input: "grid = [[1, 2, 2], [3, 8, 2], [5, 3, 5]]", output: "2", explain: "1->2->2->2->5 has max step 3... the best path 1->2->2->2->3->5 caps at 2" },
      { input: "grid = [[1, 2, 3], [3, 8, 4], [5, 3, 5]]", output: "1" },
    ],
    why: "The path metric is a MAX, not a sum — Dijkstra adapts (relax with max(d, w)), but the cleaner lesson: feasibility is monotone (effort e is enough iff e-labeled cells connect the corners), so stage 4's binary-search-on-answer fuses with stage 11's BFS. Two ladders of this course meeting at one problem — that is what mastery looks like.",
    starterCode: "def min_effort(grid):\n    pass",
    hints: [
      "feasible(e): BFS from (0, 0) over cells reachable using only steps with |diff| <= e.",
      "Binary search e in [0, 10^6]; first feasible e wins.",
      "Alternatively Dijkstra where dist = max effort so far and relaxation takes the max."
    ],
    solution: "from collections import deque\n\ndef min_effort(grid):\n    rows, cols = len(grid), len(grid[0])\n    def feasible(limit):\n        seen = {(0, 0)}\n        dq = deque([(0, 0)])\n        while dq:\n            r, c = dq.popleft()\n            if (r, c) == (rows - 1, cols - 1):\n                return True\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and abs(grid[nr][nc] - grid[r][c]) <= limit:\n                    seen.add((nr, nc))\n                    dq.append((nr, nc))\n        return False\n    lo, hi = 0, 10 ** 6\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if feasible(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "feasible(e) is monotone: if e suffices, any larger e does too. Binary search makes ~log(max) BFS calls, each O(cells). The Dijkstra-variant (relaxation takes max instead of +) gives the same answer in one pass — the binary-search form is shown because it reuses two toolboxes you already built.",
    testCode: "assert min_effort([[1, 2, 2], [3, 8, 2], [5, 3, 5]]) == 2\nassert min_effort([[1, 2, 3], [3, 8, 4], [5, 3, 5]]) == 1\nassert min_effort([[1, 2, 1, 1, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 2, 1, 2, 1], [1, 1, 1, 2, 1]]) == 0\nassert min_effort([[4]]) == 0\nprint('All tests passed!')"
  },
  {
    id: 74, stage: 13, title: "Count Components", pattern: "union-find", skill: "merge sets, count survivors", difficulty: "Medium",
    statement: "n nodes, undirected edges. Return the number of connected components — with union-find (path compression + union by size), not BFS.",
    examples: [
      { input: "n = 5, edges = [[0, 1], [1, 2], [3, 4]]", output: "2" },
      { input: "n = 5, edges = []", output: "5" },
    ],
    why: "Union-find is the third way to answer 'how connected is this graph' (after BFS flood and DFS flood), and the only one that supports ONLINE merging — edges can arrive one at a time with a component count after each. Near-O(1) per operation via two one-line heuristics. It also previews stage 16's segment tree: augmenting structure so queries stay cheap.",
    starterCode: "def count_components(n, edges):\n    pass",
    hints: [
      "parent[i] = i to start; find(x) walks to the root, compressing the path.",
      "union links the smaller-size root under the larger; on a successful (different-root) merge, decrement the component count.",
      "Answer: n minus the number of successful unions."
    ],
    solution: "def count_components(n, edges):\n    parent = list(range(n))\n    size = [1] * n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    count = n\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            if size[ra] < size[rb]:\n                ra, rb = rb, ra\n            parent[rb] = ra\n            size[ra] += size[rb]\n            count -= 1\n    return count",
    walkthrough: "Path compression (`parent[x] = parent[parent[x]]`) flattens trees as a side effect of searching; union by size keeps them shallow. Together: amortized near-constant per op. The count starts at n and each successful union merges two components — no traversal ever needed.",
    testCode: "assert count_components(5, [[0, 1], [1, 2], [3, 4]]) == 2\nassert count_components(5, []) == 5\nassert count_components(4, [[0, 1], [1, 2], [2, 3]]) == 1\nassert count_components(1, []) == 1\nprint('All tests passed!')"
  },
  {
    id: 75, stage: 13, title: "Redundant Edge", pattern: "cycle detection via DSU", skill: "the union that fails is the answer", difficulty: "Medium",
    statement: "A tree of n nodes gained one extra edge. Return that redundant edge (the first one whose endpoints are already connected).",
    examples: [
      { input: "edges = [[1, 2], [1, 3], [2, 3]]", output: "[2, 3]" },
      { input: "edges = [[1, 2], [2, 3], [3, 4], [1, 4]]", output: "[1, 4]" },
    ],
    why: "Union-find turns 'are these connected?' into one find-pair call. The whole problem is the observation that a tree edge never joins two nodes already in the same component — so the first failed union IS the redundant edge. DSU's payoff problem: no graph traversal, no cycle hunt, three lines over the edge list.",
    starterCode: "def redundant_edge(edges):\n    pass",
    hints: [
      "Number nodes 1..n — size parent as n + 1 and ignore index 0.",
      "For each edge: find both roots; equal roots means this edge closes a cycle.",
      "Otherwise union and continue."
    ],
    solution: "def redundant_edge(edges):\n    n = max((max(a, b) for a, b in edges), default=0)\n    parent = list(range(n + 1))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return [a, b]\n        parent[ra] = rb\n    return []",
    walkthrough: "Edges processed in order, so the first same-root pair is by construction the added edge (n - 1 earlier edges built a spanning tree). The absence of any traversal or visited-set is the lesson: DSU answers connectivity questions directly from the union log.",
    testCode: "assert redundant_edge([[1, 2], [1, 3], [2, 3]]) == [2, 3]\nassert redundant_edge([[1, 2], [2, 3], [3, 4], [1, 4]]) == [1, 4]\nassert redundant_edge([[1, 2], [2, 3]]) == []\nprint('All tests passed!')"
  },
  {
    id: 76, stage: 13, title: "Accounts Merge", pattern: "DSU over entities", skill: "union the right things", difficulty: "Hard",
    statement: "Accounts are (name, [email1, email2, ...]). Emails belonging to the same person (same account, or any email shared across accounts) merge into one account: sorted unique emails, with the person's name. Return all merged accounts, sorted by first email.",
    examples: [
      { input: "accounts = [('J', ['a@x', 'b@x']), ('J', ['c@x']), ('J', ['b@x', 'c@x'])]", output: "[['J', 'a@x', 'b@x', 'c@x']]" },
      { input: "accounts = [('A', ['x@x']), ('B', ['y@x'])]", output: "[['A', 'x@x'], ['B', 'y@x']]" },
    ],
    why: "The hard part is modeling: emails are nodes, 'appears together in an account' is an edge, name is payload. Once each email is unioned with its account-mates, components ARE people. Choosing what to union — rather than how — is the actual skill; the DSU code is stock problem 74.",
    starterCode: "def merge_accounts(accounts):\n    pass",
    hints: [
      "email -> root email via DSU: for each account, union every email with the account's first email.",
      "Group by root: root -> set of member emails.",
      "Rebuild: name from any member's account (names match within a component), sorted emails."
    ],
    solution: "def merge_accounts(accounts):\n    parent = {}\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    def union(a, b):\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n    owner = {}\n    for name, emails in accounts:\n        for e in emails:\n            parent.setdefault(e, e)\n            owner[e] = name\n        for e in emails[1:]:\n            union(emails[0], e)\n    groups = {}\n    for e in parent:\n        groups.setdefault(find(e), []).append(e)\n    out = []\n    for root, emails in groups.items():\n        out.append([owner[root]] + sorted(emails))\n    return sorted(out)",
    walkthrough: "Unioning every email to its account's first email makes 'same account' transitive with 'shared email' — both collapse into one component. Grouping by root email reconstructs people; sorted output keeps the result deterministic. Model first, data structure second: the theme of every 'hard' labeled problem in this stage.",
    testCode: "assert merge_accounts([('J', ['a@x', 'b@x']), ('J', ['c@x']), ('J', ['b@x', 'c@x'])]) == [['J', 'a@x', 'b@x', 'c@x']]\nassert merge_accounts([('A', ['x@x']), ('B', ['y@x'])]) == [['A', 'x@x'], ['B', 'y@x']]\nassert merge_accounts([('A', ['m@x', 'z@x', 'a@x'])]) == [['A', 'a@x', 'm@x', 'z@x']]\nprint('All tests passed!')"
  },
  {
    id: 77, stage: 13, title: "MST Cost", pattern: "Kruskal's algorithm", skill: "sort edges, grow the forest", difficulty: "Hard",
    statement: "Return the total weight of a minimum spanning tree of a connected weighted undirected graph (n nodes, edge list [u, v, w]). Use Kruskal: sort by weight, take edges whose endpoints are in different components.",
    examples: [
      { input: "n = 4, edges = [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4], [0, 2, 5]]", output: "6", explain: "edges 1, 2, 3" },
      { input: "n = 3, edges = [[0, 1, 5], [1, 2, 5], [0, 2, 5]]", output: "10" },
    ],
    why: "Kruskal is DSU's flagship application, and the greedy proof is the cut property: the lightest edge crossing any cut is safe, and sorted order processes cuts in exactly that order. Greedy correctness here is a theorem, not a heuristic — compare with problem 20's exchange argument and see the family resemblance.",
    starterCode: "def mst_cost(n, edges):\n    pass",
    hints: [
      "Sort edges by weight ascending.",
      "DSU over 0..n-1; for each edge, if roots differ, union and add the weight.",
      "Stop after n - 1 accepted edges (or run out)."
    ],
    solution: "def mst_cost(n, edges):\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    total = 0\n    taken = 0\n    for u, v, w in sorted(edges, key=lambda e: e[2]):\n        ru, rv = find(u), find(v)\n        if ru != rv:\n            parent[ru] = rv\n            total += w\n            taken += 1\n            if taken == n - 1:\n                break\n    return total",
    walkthrough: "The sort does the thinking; DSU does the bookkeeping. When an edge's endpoints already share a root, adding it would close a cycle — skip. n - 1 accepted edges means every node connected: the tree is minimal by the cut property, cost O(E log E).",
    testCode: "assert mst_cost(4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [0, 3, 4], [0, 2, 5]]) == 6\nassert mst_cost(3, [[0, 1, 5], [1, 2, 5], [0, 2, 5]]) == 10\nassert mst_cost(2, [[0, 1, 7]]) == 7\nprint('All tests passed!')"
  },
  {
    id: 78, stage: 13, title: "Bridges", pattern: "DFS low-link", skill: "entry time vs lowest reach", difficulty: "Hard",
    statement: "Return the number of bridges in an undirected graph — edges whose removal disconnects part of the graph.",
    examples: [
      { input: "n = 5, edges = [[0, 1], [1, 2], [2, 0], [3, 4]]", output: "1", explain: "only 3-4 is a bridge" },
      { input: "n = 4, edges = [[0, 1], [1, 2], [2, 3]]", output: "3" },
    ],
    why: "Deleting edges and re-testing is O(E·(V+E)) — dead at scale. One DFS computes both tin (entry time) and low (lowest entry reachable without using the edge back to your parent); a tree edge u→v is a bridge iff low[v] > tin[u]. Two arrays turn a global structural question into a per-edge test — the low-link idea that later powers SCCs and biconnection.",
    starterCode: "def count_bridges(n, edges):\n    pass",
    hints: [
      "Build the adjacency list; DFS with timer: tin[node] = low[node] = next tick.",
      "For each neighbor: unvisited → recurse, then low[node] = min(low[node], low[child]); if low[child] > tin[node], the edge is a bridge.",
      "Back-neighbor (not the parent): low[node] = min(low[node], tin[neighbor])."
    ],
    solution: "def count_bridges(n, edges):\n    adj = {i: [] for i in range(n)}\n    for a, b in edges:\n        adj[a].append(b)\n        adj[b].append(a)\n    tin = {}\n    low = {}\n    timer = [0]\n    count = 0\n    def dfs(node, parent):\n        nonlocal count\n        tin[node] = low[node] = timer[0]\n        timer[0] += 1\n        for nb in adj[node]:\n            if nb == parent:\n                continue\n            if nb in tin:\n                low[node] = min(low[node], tin[nb])\n            else:\n                dfs(nb, node)\n                low[node] = min(low[node], low[nb])\n                if low[nb] > tin[node]:\n                    count += 1\n    for node in range(n):\n        if node not in tin:\n            dfs(node, -1)\n    return count",
    walkthrough: "low[v] answers 'without my parent edge, how high can my subtree reach?' If the answer is strictly below u's entry time, the edge u-v is the subtree's only lifeline: a bridge. The outer loop covers disconnected graphs — each component gets its own DFS with a fresh clock. Parallel edges break the parent-skip convention, so the convention (as here) assumes none. One pass, O(V + E), versus E full graph scans.",
    testCode: "assert count_bridges(5, [[0, 1], [1, 2], [2, 0], [3, 4]]) == 1\nassert count_bridges(4, [[0, 1], [1, 2], [2, 3]]) == 3\nassert count_bridges(4, [[0, 1], [1, 2], [2, 0], [2, 3]]) == 1\nassert count_bridges(2, [[0, 1]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 79, stage: 13, title: "Strong Components", pattern: "Kosaraju's two passes", skill: "order, then reversed order", difficulty: "Hard",
    statement: "Count the strongly connected components of a directed graph — maximal groups where every node reaches every other.",
    examples: [
      { input: "n = 5, edges = [(1, 0), (0, 2), (2, 1), (0, 3), (3, 4)]", output: "3", explain: "{0, 1, 2}, {3}, {4}" },
      { input: "n = 4, edges = [(0, 1), (1, 0), (2, 3)]", output: "3" },
    ],
    why: "SCC = collapse the cycles. Kosaraju's two-pass is the clearest statement of the idea: DFS pass one records finish order (a 'when did it die' stamp), pass two on the REVERSED graph in decreasing finish order peels one SCC at a time. Reversal preserves components but destroys cross-component shortcuts — that is the whole trick, and it is two of your DFSes glued together.",
    starterCode: "def count_scc(n, edges):\n    pass",
    hints: [
      "Pass 1: DFS every node on G, pushing onto a stack when the DFS completes (post-order).",
      "Build the reversed graph.",
      "Pass 2: pop the stack; each unvisited node starts a new SCC — DFS mark its whole component, count += 1."
    ],
    solution: "def count_scc(n, edges):\n    adj = {i: [] for i in range(n)}\n    radj = {i: [] for i in range(n)}\n    for u, v in edges:\n        adj[u].append(v)\n        radj[v].append(u)\n    visited = set()\n    order = []\n    def dfs1(u):\n        visited.add(u)\n        for v in adj[u]:\n            if v not in visited:\n                dfs1(v)\n        order.append(u)\n    for i in range(n):\n        if i not in visited:\n            dfs1(i)\n    visited2 = set()\n    count = 0\n    def dfs2(u):\n        visited2.add(u)\n        for v in radj[u]:\n            if v not in visited2:\n                dfs2(v)\n    for u in reversed(order):\n        if u not in visited2:\n            count += 1\n            dfs2(u)\n    return count",
    walkthrough: "Finish order has the Condensation Lemma's guarantee: the first-visited node of a source SCC finishes last, so reverse-graph DFS from it cannot leak into other SCCs. Each pop either starts a fresh component or lands inside the current one. Two linear passes — component structure without any clever data structure.",
    testCode: "assert count_scc(5, [(1, 0), (0, 2), (2, 1), (0, 3), (3, 4)]) == 3\nassert count_scc(4, [(0, 1), (1, 0), (2, 3)]) == 3\nassert count_scc(3, []) == 3\nassert count_scc(3, [(0, 1), (1, 2), (2, 0)]) == 1\nprint('All tests passed!')"
  },
  {
    id: 80, stage: 14, title: "Climb Stairs", pattern: "DP, 1-D recurrence", skill: "define the state, derive the recurrence", difficulty: "Easy",
    statement: "You climb n stairs taking 1 or 2 steps at a time. Return the number of distinct ways to reach the top.",
    examples: [
      { input: "n = 3", output: "3", explain: "1+1+1, 1+2, 2+1" },
      { input: "n = 5", output: "8" },
    ],
    why: "The founding DP: ways(n) = ways(n-1) + ways(n-2) — the last move was 1 or 2, and the two cases partition everything. The lesson is not Fibonacci; it is the ritual: define the state, justify the partition, prove no double counting. Every DP in the next two stages is this ritual with richer states.",
    starterCode: "def climb(n):\n    pass",
    hints: [
      "ways(0) = 1 (stand still), ways(1) = 1.",
      "The final step is a 1 (from n-1) or a 2 (from n-2) — those are the only options and they do not overlap.",
      "Iterate upward keeping two variables."
    ],
    solution: "def climb(n):\n    a, b = 1, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a",
    walkthrough: "The two-variable roll is the space-optimized DP table: only the last two states are ever read. Trace n = 3: (1,1) -> (1,2) -> (2,3) -> (3,5) — a is ways(i). The partition argument (last move 1 or 2, mutually exclusive, jointly exhaustive) is the part worth memorizing.",
    testCode: "assert climb(3) == 3\nassert climb(5) == 8\nassert climb(1) == 1\nassert climb(0) == 1\nprint('All tests passed!')"
  },
  {
    id: 81, stage: 14, title: "House Robber", pattern: "DP with a skip decision", skill: "take it or leave it", difficulty: "Medium",
    statement: "Houses hold loot; robbing two adjacent houses triggers the alarm. Return the maximum loot.",
    examples: [
      { input: "loot = [2, 7, 9, 3, 1]", output: "12", explain: "houses 0, 2, 4" },
      { input: "loot = [2, 1, 1, 2]", output: "4", explain: "houses 0 and 3" },
    ],
    why: "Climb-stairs with values attached: best(i) = max(best(i-1) [skip i], best(i-2) + loot[i] [rob i]). The 'leave it' branch is what makes DP robust — the recurrence enumerates decisions, not answers. This decision-per-step frame extends to knapsack, stock problems, and everything else in stage 15.",
    starterCode: "def rob(loot):\n    pass",
    hints: [
      "best(i) = max over the two choices at house i.",
      "Negative loot is impossible here, but the recurrence should not assume it.",
      "Two rolling variables: prev2, prev1."
    ],
    solution: "def rob(loot):\n    prev2 = 0\n    prev1 = 0\n    for x in loot:\n        prev2, prev1 = prev1, max(prev1, prev2 + x)\n    return prev1",
    walkthrough: "max(prev1, prev2 + x) is the whole algorithm: skip (stay at prev1) or rob (prev2 + x). Note 'rob i' uses prev2, not prev1 — adjacency handled by the state definition, never by an if. O(n) time, O(1) space, and the take-or-skip template transfers directly to knapsack.",
    testCode: "assert rob([2, 7, 9, 3, 1]) == 12\nassert rob([2, 1, 1, 2]) == 4\nassert rob([1, 2, 3, 1]) == 4\nassert rob([5]) == 5\nassert rob([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 82, stage: 14, title: "Coin Change", pattern: "DP, unbounded choices", skill: "minimize over decisions", difficulty: "Medium",
    statement: "Given coin denominations (unlimited supply) and an amount, return the fewest coins that sum exactly to amount — or -1 if impossible.",
    examples: [
      { input: "coins = [1, 2, 5], amount = 11", output: "3", explain: "5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" },
    ],
    why: "The greedy 'always take the biggest coin' fails (coins [1, 3, 4], amount 6: greedy 4+1+1 = 3 coins, optimal 3+3 = 2). DP wins because it tries every final coin: best(a) = 1 + min(best(a - c) for c in coins). Greedy works when local choice provably preserves optimality; DP works always. Knowing which regime you are in is the judgment being trained.",
    starterCode: "def coin_change(coins, amount):\n    pass",
    hints: [
      "best[0] = 0; best[a] = infinity for a > 0 initially.",
      "For each a from 1 to amount: best[a] = 1 + min over coins c <= a of best[a - c].",
      "Infinity stays untouched if no coin fits — return -1 in that case."
    ],
    solution: "def coin_change(coins, amount):\n    INF = float('inf')\n    best = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and best[a - c] + 1 < best[a]:\n                best[a] = best[a - c] + 1\n    return best[amount] if best[amount] != INF else -1",
    walkthrough: "The table solves every sub-amount once, bottom-up; the recurrence's min enumerates the last-coin decision. Compare against stage 8's combination sum (backtracking): same choices, but only the COUNT is asked, so memoization collapses the exponential tree to a table. 'Optimal count only' is DP's home turf.",
    testCode: "assert coin_change([1, 2, 5], 11) == 3\nassert coin_change([2], 3) == -1\nassert coin_change([1], 0) == 0\nassert coin_change([1, 3, 4], 6) == 2\nassert coin_change([5, 7], 12) == 2\nassert coin_change([5, 7], 11) == -1\nprint('All tests passed!')"
  },
  {
    id: 83, stage: 14, title: "Word Break", pattern: "DP over prefixes", skill: "cut points as states", difficulty: "Medium",
    statement: "Return True if the string can be split into a sequence of dictionary words (words reusable).",
    examples: [
      { input: "s = 'leetcode', words = ['leet', 'code']", output: "True" },
      { input: "s = 'catsandog', words = ['cats', 'dog', 'sand', 'and', 'cat']", output: "False" },
    ],
    why: "State = 'prefix of length i is breakable'. The recurrence looks at every last word: breakable(i) = any(j < i, breakable(j) and s[j:i] in dict). This is problem 50's partition tree with only feasibility asked — backtracking became a table. Watching the same problem cross from exponential to linear is the best advertisement for DP there is.",
    starterCode: "def word_break(s, words):\n    pass",
    hints: [
      "ok[0] = True (empty prefix).",
      "For i from 1 to len(s): ok[i] = any(ok[j] and s[j:i] in wordset for j in range(i)).",
      "wordset = set(words) makes the lookup O(1); substring slicing is the inner cost."
    ],
    solution: "def word_break(s, words):\n    wordset = set(words)\n    ok = [False] * (len(s) + 1)\n    ok[0] = True\n    for i in range(1, len(s) + 1):\n        for j in range(i):\n            if ok[j] and s[j:i] in wordset:\n                ok[i] = True\n                break\n    return ok[len(s)]",
    walkthrough: "Each position i is reachable iff some earlier breakable position j is followed by a dictionary word. The left-to-right fill means ok[j] is final before it is read — the classic bottom-up guarantee. Worst case O(n²) substring checks, versus the partition tree's exponential blowup on adversarial input.",
    testCode: "assert word_break('leetcode', ['leet', 'code']) == True\nassert word_break('applepenapple', ['apple', 'pen']) == True\nassert word_break('catsandog', ['cats', 'dog', 'sand', 'and', 'cat']) == False\nassert word_break('', ['a']) == True\nprint('All tests passed!')"
  },
  {
    id: 84, stage: 14, title: "Decode Ways", pattern: "DP with edge cases", skill: "the recurrence is easy, the zeros are not", difficulty: "Medium",
    statement: "'A' = 1, 'B' = 2, ..., 'Z' = 26. Count how many ways a digit string can be decoded. Leading zeros are invalid: '06' decodes 0 ways.",
    examples: [
      { input: "s = '12'", output: "2", explain: "'AB' or 'L'" },
      { input: "s = '226'", output: "3" },
      { input: "s = '06'", output: "0" },
    ],
    why: "Climb-stairs (take 1 or 2 digits) with validity rules — and the difficulty lives entirely in the edge cases: '0' pairs only as '10'/'20', never alone. DP teaches recurrences; maturity is handling the boundary states that recurrences quietly assume away. Test-driven enumeration ('06', '10', '100', '2101') is the craft being taught.",
    starterCode: "def decode_ways(s):\n    pass",
    hints: [
      "ways[i] = ways to decode the first i chars; ways[0] = 1.",
      "One-digit step: s[i-1] != '0' adds ways[i-1].",
      "Two-digit step: 10 <= int(s[i-2:i]) <= 26 adds ways[i-2]. A '0' can only ride inside 10 or 20."
    ],
    solution: "def decode_ways(s):\n    if not s or s[0] == '0':\n        return 0\n    prev2 = 1\n    prev1 = 1\n    for i in range(1, len(s)):\n        cur = 0\n        if s[i] != '0':\n            cur += prev1\n        two = int(s[i - 1:i + 1])\n        if 10 <= two <= 26:\n            cur += prev2\n        if cur == 0:\n            return 0\n        prev2, prev1 = prev1, cur\n    return prev1",
    walkthrough: "Each position gets its count from the valid single-step and pair-step predecessors; a '0' contributes only through the pair branch, and an early return kills strings like '30' the moment they become undecodable. Compare '226' (3) and '206' (1: '20','6') and '606' (0) — the recurrence is identical, the digit rules do all the differentiating.",
    testCode: "assert decode_ways('12') == 2\nassert decode_ways('226') == 3\nassert decode_ways('06') == 0\nassert decode_ways('11106') == 2\nassert decode_ways('10') == 1\nassert decode_ways('100') == 0\nprint('All tests passed!')"
  },
  {
    id: 85, stage: 14, title: "Longest Increasing Subsequence", pattern: "DP with quadratic scan", skill: "end-here states", difficulty: "Hard",
    statement: "Return the length of the longest strictly increasing subsequence (elements keep their order, gaps allowed).",
    examples: [
      { input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4", explain: "2, 3, 7, 101" },
      { input: "nums = [0, 1, 0, 3, 2, 3]", output: "4" },
    ],
    why: "The state 'best ending exactly at i' is the standard cure for 'subsequence' vagueness: lis(i) = 1 + max(lis(j)) over j < i with nums[j] < nums[i]. O(n²) — and the walkthrough points at the O(n log n) patience upgrade that returns in stage 16. Most 'Hard' labels dissolve once the end-here state is written down.",
    starterCode: "def length_of_lis(nums):\n    pass",
    hints: [
      "dp[i] = length of the longest increasing subsequence ENDING at index i; every dp[i] starts at 1.",
      "For each i, scan all j < i: if nums[j] < nums[i], candidate dp[j] + 1.",
      "Answer = max over the whole dp array — the best subsequence can end anywhere."
    ],
    solution: "def length_of_lis(nums):\n    if not nums:\n        return 0\n    dp = [1] * len(nums)\n    for i in range(len(nums)):\n        for j in range(i):\n            if nums[j] < nums[i] and dp[j] + 1 > dp[i]:\n                dp[i] = dp[j] + 1\n    best = 0\n    for x in dp:\n        if x > best:\n            best = x\n    return best",
    walkthrough: "'Ending at i' anchors the otherwise-slippery state: extending is only legal from a smaller predecessor, and dp[j] is final when read (i sweeps right of j). [0, 1, 0, 3, 2, 3]: dp = [1, 2, 1, 3, 3, 4] — the second 0 correctly resets its own chain. The answer is the max, not the last entry.",
    testCode: "assert length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]) == 4\nassert length_of_lis([0, 1, 0, 3, 2, 3]) == 4\nassert length_of_lis([7, 7, 7, 7]) == 1\nassert length_of_lis([]) == 0\nassert length_of_lis([1, 2, 3, 4, 5]) == 5\nprint('All tests passed!')"
  },
]
