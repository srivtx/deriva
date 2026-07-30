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

export const STAGES_ADVANCED_GRAPHS = [
  { id: 0, name: "Weighted Reflex", desc: "BFS layers break" },
  { id: 1, name: "Greedy Frontier", desc: "Dijkstra" },
  { id: 2, name: "Union-Find", desc: "dynamic connectivity" },
  { id: 3, name: "Spanning Trees", desc: "cheapest skeleton" },
  { id: 4, name: "Naive", desc: "DFS all paths" },
  { id: 5, name: "Optimization II", desc: "Bellman-Ford" },
  { id: 6, name: "Mastery", desc: "compose" },
]

export const PROBLEMS_ADVANCED_GRAPHS: Problem[] = [
  // ── STAGE 0: Weighted Reflex ──
  {
    id: 1, stage: 0, title: "BFS on Weighted Graph Fails", pattern: "BFS short-circuit on weighted edges", skill: "demonstrate BFS gives wrong answer when edges have weights",
    statement: "Given a weighted graph (adjacency list with weights), run BFS from source to target and compare with the true shortest path. Show that BFS path may be longer than the true shortest.",
    examples: [
      { input: "graph: 0->1(1), 0->2(4), 1->2(1); source=0, target=2", output: "BFS path=2 edges, weight=5; true shortest=1->2, weight=2", explain: "BFS finds 0-1-2 with 2 edges; but 0-1-2 cost 2 < 4" },
    ],
    why: "BFS works on UNWEIGHTED graphs because all edges cost 1. When edges have weights, a path with more edges can be cheaper. The BFS layer argument ('first time you see a node is shortest') dies because layers are false in weighted graphs.",
    starterCode: "def bfs_vs_true(graph, source, target):\n    from collections import deque\n    pass",
    hints: [
      "Run standard BFS: queue, visited set. Record the BFS path length (edges) and the weight sum along that BFS path.",
      "Compute true shortest path (try all paths via DFS or, later, Dijkstra). Compare BFS weight with true shortest.",
      "The BFS 'first visited = shortest' assumption fails when edge weights differ."
    ],
    solution: "def bfs_vs_true(graph, source, target):\n    from collections import deque\n    n = len(graph)\n    visited = [False] * n\n    parent = [-1] * n\n    queue = deque([source])\n    visited[source] = True\n    while queue:\n        node = queue.popleft()\n        if node == target:\n            break\n        for neighbor, weight in graph[node]:\n            if not visited[neighbor]:\n                visited[neighbor] = True\n                parent[neighbor] = node\n                queue.append(neighbor)\n    bfs_path = []\n    cur = target\n    while cur != -1:\n        bfs_path.append(cur)\n        cur = parent[cur]\n    bfs_path.reverse()\n    bfs_weight = 0\n    for i in range(len(bfs_path) - 1):\n        u, v = bfs_path[i], bfs_path[i+1]\n        for nb, w in graph[u]:\n            if nb == v:\n                bfs_weight += w\n                break\n    return bfs_path, bfs_weight",
    walkthrough: "BFS on weighted graph: first discovery doesn't mean shortest path. 0→2 directly costs 4, but 0→1→2 costs 1+1=2. BFS discovers 2 via 0→2 first (or via 0→1→2 first, depending on adjacency order), but whichever it discovers first, it labels 'done.' In truth, the 2-edge path (1+1) is cheaper than the 1-edge path (4).",
    testCode: "graph = [[(1,1),(2,4)],[(0,1),(2,1)],[(0,4),(1,1)]]\npath, weight = bfs_vs_true(graph, 0, 2)\nprint(f'BFS path: {path}, weight: {weight}')\nassert len(path) >= 2\nprint('BFS on weighted graphs can be misleading.')\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Why BFS Layer Argument Died", pattern: "BFS invariant counterexample", skill: "articulate: BFS guarantees fewest EDGES, not lowest WEIGHT",
    statement: "Explain in code: BFS discovers nodes in order of edge count from source. With weights, a node with fewer edges might have HIGHER total cost than one with more edges. Write code to find a counterexample where BFS path weight > true shortest weight.",
    examples: [
      { input: "graph: 0->1(10), 0->2(1), 2->1(1); source=0, target=1", output: "True (BFS may give weight 10, true=2)" },
    ],
    why: "The BFS invariant is 'shortest in edges.' When weights differ, 'fewest edges' ≠ 'lowest cost.' This is the conceptual break that opens the door for Dijkstra.",
    starterCode: "def counterexample_bfs_weighted(graph):\n    pass",
    hints: [
      "Construct a graph where BFS finds a 1-edge path costing 10, but a 2-edge path costs 1+1=2.",
      "BFS picks the 1-edge path because it discovers the target first. But weight 2 < 10.",
      "Print both paths and their weights to demo the failure."
    ],
    solution: "def counterexample_bfs_weighted(graph):\n    from collections import deque\n    source, target = 0, 1\n    visited = [False] * 3\n    parent = [-1] * 3\n    queue = deque([source])\n    visited[source] = True\n    while queue:\n        node = queue.popleft()\n        for nb, w in graph[node]:\n            if not visited[nb]:\n                visited[nb] = True\n                parent[nb] = node\n                queue.append(nb)\n    bfs_weight = 0\n    cur = target\n    bfs_path = []\n    while cur != -1:\n        bfs_path.append(cur)\n        cur = parent[cur]\n    bfs_path.reverse()\n    for i in range(len(bfs_path)-1):\n        u,v = bfs_path[i], bfs_path[i+1]\n        for nb,w in graph[u]:\n            if nb==v: bfs_weight += w\n    return bfs_path, bfs_weight",
    walkthrough: "Graph: 0→1(10), 0→2(1), 2→1(1). BFS from 0 discovers 1 via direct edge (1 edge, weight 10). True shortest: 0→2→1 (2 edges, weight 2). BFS finds the wrong path because it treats all edges as equal-cost.",
    testCode: "graph = [[(1,10),(2,1)],[(0,10),(2,1)],[(0,1),(1,1)]]\npath, cost = counterexample_bfs_weighted(graph)\nprint(f'BFS finds path {path} with cost {cost}')\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Edge Relaxation Intuition", pattern: "relaxation step", skill: "if dist[u] + w(u,v) < dist[v], update dist[v]",
    statement: "Given a source and weighted graph, implement the RELAXATION step: for an edge (u,v,w), if distance[u] + w < distance[v], set distance[v] = distance[u] + w. Print distances after relaxing ALL edges once.",
    examples: [
      { input: "graph: 0->1(5), 0->2(2), 1->2(-1); source=0", output: "after one relaxation round: dist[0]=0, dist[1]=5, dist[2]=min(2,5-1)=2" },
    ],
    why: "Relaxation is the atomic operation of weighted shortest paths. Every algorithm (Dijkstra, Bellman-Ford) is just a disciplined schedule for which edges to relax when.",
    starterCode: "def relax_all_edges(graph, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    pass",
    hints: [
      "Initialize dist[source]=0, others=inf. Iterate over every edge: for each (u,v,w) in graph[u], if dist[u] + w < dist[v], dist[v] = dist[u] + w.",
      "Do this for ALL edges exactly once. This may not give final shortest distances — but it illustrates the operation.",
      "Relaxation 'relaxes' a tight bound: dist[v] represents best known distance so far."
    ],
    solution: "def relax_all_edges(graph, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    for u in range(n):\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n    return dist",
    walkthrough: "One pass: for each edge u→v with weight w, if dist[u] + w improves dist[v], update. This single pass only propagates information by one edge — after one pass, each node knows about paths of at most 1 edge. More passes (Bellman-Ford) propagate further.",
    testCode: "graph = [[(1,5),(2,2)],[(2,-1)],[]]\nassert relax_all_edges(graph, 3, 0) == [0, 5, 2]\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Short Path Is Not Shortest", pattern: "greedy path vs optimal path", skill: "find a graph where the shortest-edge-first walk leads to a suboptimal total",
    statement: "Construct a graph where taking the cheapest outgoing edge at each step leads to a longer total path than a different sequence. Show both paths and weights.",
    examples: [
      { input: "graph: 0->1(1), 0->2(3), 1->3(100), 2->3(1); source=0, target=3", output: "greedy: 0->1->3 cost=101; optimal: 0->2->3 cost=4" },
    ],
    why: "The 'always take the cheapest next edge' local greed fails for weighted graphs. This is why Dijkstra maintains a priority queue of distances — it processes the globally closest node, not the locally cheapest edge.",
    starterCode: "def greedy_cheapest_edge(graph, source, target):\n    pass",
    hints: [
      "Greedy: from current node, pick the neighbor with smallest edge weight. Continue until target or stuck.",
      "Contrast with true shortest via exhaustive search.",
      "Graph: 0→1(1), 0→2(3), 1→3(100), 2→3(1). Greedy picks 0→1 (cheap), then stuck with 100. Optimal: 0→2→3 costs 4."
    ],
    solution: "def greedy_cheapest_edge(graph, source, target):\n    cur = source\n    path = [cur]\n    cost = 0\n    visited = set()\n    while cur != target:\n        if cur in visited:\n            return path, cost\n        visited.add(cur)\n        best = None\n        for nb, w in graph[cur]:\n            if best is None or w < best[1]:\n                best = (nb, w)\n        if best is None:\n            break\n        cur, w = best\n        cost += w\n        path.append(cur)\n    return path, cost",
    walkthrough: "Greedy cheapest-edge walk: at each node, take the lowest-weight edge. Graph: 0→1(1), 0→2(3), 1→3(100), 2→3(1). Greedy: 0→1→3 = 101. Optimal: 0→2→3 = 4. Local cheapest != global cheapest. Dijkstra fixes this by picking the node with smallest distance-so-far, not smallest edge.",
    testCode: "graph = [[(1,1),(2,3)],[(3,100)],[(3,1)],[]]\npath, cost = greedy_cheapest_edge(graph, 0, 3)\nprint(f'Greedy path: {path}, cost: {cost}')\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Need Cost-Aware Order", pattern: "why priority queue is essential", skill: "prove: processing nodes in order of distance (not discovery) guarantees shortest paths",
    statement: "Demonstrate: if you process nodes in arbitrary order, relaxation may need to be repeated up to V-1 times. But if you process nodes in order of INCREASING distance (Dijkstra), each node is settled exactly once.",
    examples: [
      { input: "graph: 0->1(4), 0->2(1), 2->1(1); source=0", output: "order [0,2,1] (distance order) settles each node once. Arbitrary order needs multiple passes." },
    ],
    why: "The central insight of Dijkstra: if you always process the unvisited node with smallest TENTATIVE distance, that distance is FINAL — because any other path would go through a node with >= current smallest distance + non-negative edges.",
    starterCode: "def demonstrate_order_matters(graph, n, source):\n    pass",
    hints: [
      "Try relaxing edges in node order 0,1,2,... (arbitrary). After one pass, distances may be wrong. Need a second pass.",
      "Now try processing in order of increasing tentative distance (priority queue). Each node settled once.",
      "The difference: arbitrary order may propagate through a long path later, requiring revisits."
    ],
    solution: "def demonstrate_order_matters(graph, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    for _ in range(n - 1):\n        for u in range(n):\n            for v, w in graph[u]:\n                if dist[u] + w < dist[v]:\n                    dist[v] = dist[u] + w\n        settled = [d for d in dist if d < float('inf')]\n    return dist",
    walkthrough: "Arbitrary order relax pass: after one iteration, 0→1(4) sets dist[1]=4, but 0→2→1 should be 2. One more pass propagates the 0→2→1 improvement. Multiple passes needed. Dijkstra's insight: process nodes by distance — then each node is settled exactly once (no future passes needed).",
    testCode: "graph = [[(1,4),(2,1)],[],[(1,1)]]\nresult = demonstrate_order_matters(graph, 3, 0)\nassert result == [0, 2, 1]\nprint('All tests passed!')"
  },

  {
    id: 6, stage: 0, title: "0-1 BFS with Deque", pattern: "deque-based BFS for 0/1 weights", skill: "use deque: push to front for weight-0 edges, push to back for weight-1 edges",
    statement: "Given a graph where all edge weights are either 0 or 1, find shortest distances from source. Use 0-1 BFS: maintain a deque; when relaxing an edge of weight 0, push to front; weight 1, push to back. This simulates Dijkstra in O(V+E) — no heap needed.",
    examples: [
      { input: "graph: 0->1(1),0->2(0),2->1(0); source=0", output: "[0,0,0]", explain: "0→2 (cost 0)→1 (cost 0) = distance 0" },
      { input: "graph: 0->1(1),1->2(0); source=0", output: "[0,1,1]" },
    ],
    why: "When edge weights are only 0 or 1, Dijkstra's heap is overkill. A deque gives O(1) amortized operations: weight-0 edges go to the front (same level), weight-1 to the back. This is BFS's generalization to two weight classes.",
    starterCode: "def bfs_01(graph, n, source):\n    from collections import deque\n    dist = [float('inf')] * n\n    dist[source] = 0\n    dq = deque([source])\n    pass",
    hints: [
      "While dq: pop left (node). For each neighbor: new_dist = dist[node] + weight.",
      "If new_dist < dist[neighbor]: update. If weight == 0, appendleft(neighbor). If weight == 1, append(neighbor).",
      "This works because deque maintains non-decreasing distance order — same invariant as Dijkstra's heap."
    ],
    solution: "def bfs_01(graph, n, source):\n    from collections import deque\n    dist = [float('inf')] * n\n    dist[source] = 0\n    dq = deque([source])\n    while dq:\n        u = dq.popleft()\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                if w == 0:\n                    dq.appendleft(v)\n                else:\n                    dq.append(v)\n    return dist",
    walkthrough: "Deque maintains nodes sorted by distance (non-decreasing). Pop from left (min distance). For each neighbor: if weight=0 and distance improves, push to front — same level. If weight=1, push to back — next level. This preserves the Dijkstra invariant without a log factor. O(V+E).",
    testCode: "g = [[(1,1),(2,0)],[(0,1),(2,0)],[(0,0),(1,0)]]\nassert bfs_01(g, 3, 0) == [0, 0, 0]\ng2 = [[(1,1)],[(2,0)],[]]\nassert bfs_01(g2, 3, 0) == [0, 1, 1]\nprint('All tests passed!')",
  },
  {
    id: 7, stage: 0, title: "Multi-Source BFS", pattern: "initialize queue with all sources", skill: "push all source nodes into queue with dist=0; BFS propagates from all sources simultaneously",
    statement: "Given an unweighted graph and a list of source nodes, find shortest distance from ANY source to every other node. Push ALL sources into queue initially with distance 0. Run BFS. Return distances.",
    examples: [
      { input: "graph: 0-1,1-2,2-3; sources=[0,3]", output: "[0,1,1,0]", explain: "distance from sources 0 and 3" },
      { input: "graph: star 0 with 1,2,3; sources=[1,2]", output: "[1,0,0,1]" },
    ],
    why: "Multi-source BFS is the simplest extension of BFS. Instead of one source, push all sources initially with dist=0. BFS naturally propagates outward from all sources, finding the closest source for each node. This is the foundation for problems like 'walls and gates' or 'rotting oranges.'",
    starterCode: "def multi_source_bfs(graph, n, sources):\n    from collections import deque\n    dist = [float('inf')] * n\n    queue = deque()\n    for s in sources:\n        pass\n    pass",
    hints: [
      "For each source s: dist[s]=0, queue.append(s). Run standard BFS.",
      "While queue: pop node, for each neighbor: if dist[node]+1 < dist[neighbor], update and push.",
      "The BFS frontier expands simultaneously from all sources. First source to reach a node 'claims' it."
    ],
    solution: "def multi_source_bfs(graph, n, sources):\n    from collections import deque\n    dist = [float('inf')] * n\n    queue = deque()\n    for s in sources:\n        dist[s] = 0\n        queue.append(s)\n    while queue:\n        u = queue.popleft()\n        for v, _ in graph[u]:\n            if dist[u] + 1 < dist[v]:\n                dist[v] = dist[u] + 1\n                queue.append(v)\n    return dist",
    walkthrough: "Initialize queue with all sources (dist=0). Standard BFS: the frontier expands from all sources. Since BFS processes in order of distance, each node gets its nearest source's distance. O(V+E). Same as single-source BFS but with multiple starting nodes — the invariant holds because all initial nodes have dist=0.",
    testCode: "g = [[(1,1)],[(0,1),(2,1)],[(1,1),(3,1)],[(2,1)]]\nassert multi_source_bfs(g, 4, [0, 3]) == [0, 1, 1, 0]\ng2 = [[(1,1),(2,1),(3,1)],[(0,1)],[(0,1)],[(0,1)]]\nassert multi_source_bfs(g2, 4, [1, 2]) == [1, 0, 0, 1]\nprint('All tests passed!')",
  },
  // ── STAGE 1: Greedy Frontier ──
  {
    id: 8, stage: 1, title: "Dijkstra — Shortest Path from Source", pattern: "priority queue frontier expansion", skill: "always expand the node with smallest tentative distance",
    statement: "Given a weighted directed graph (non-negative weights) and source, return shortest distance to ALL nodes. Use min-heap: push (distance, node); when popped, if > known distance, skip; else relax all neighbors.",
    examples: [
      { input: "graph: 0->1(4),0->2(1),2->1(2),1->3(1),2->3(5); source=0", output: "[0,3,1,4]", explain: "0->2(1)->1(3)->3(4)" },
      { input: "graph: single node", output: "[0]" },
    ],
    why: "Dijkstra is the foundational weighted shortest-path algorithm. The heap maintains the 'greedy frontier': always process the node with smallest known distance. Once processed, its distance is final (proof in Stage 2 of Greedy).",
    starterCode: "def dijkstra(graph, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    pass",
    hints: [
      "Push (0, source). While heap: pop (d, u). If d > dist[u], this is a stale entry — skip.",
      "For each neighbor v with weight w: if dist[u] + w < dist[v], update and push (dist[v], v).",
      "When heap empties, dist array holds shortest distances from source to all nodes."
    ],
    solution: "def dijkstra(graph, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(heap, (dist[v], v))\n    return dist",
    walkthrough: "Min-heap keyed by distance. Pop closest unprocessed node (min distance). For each neighbor: if going through current node is shorter, update distance and push to heap. Stale entries (d > dist[u]) are skipped — they were pushed before a better path was found. O((V+E) log V).",
    testCode: "graph = [[(1,4),(2,1)],[(3,1)],[(1,2),(3,5)],[]]\nassert dijkstra(graph, 4, 0) == [0,3,1,4]\nassert dijkstra([[]], 1, 0) == [0]\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Dijkstra — Path Reconstruction", pattern: "parent tracking during Dijkstra", skill: "store predecessor when relaxing; reconstruct path backward from target",
    statement: "Extend Dijkstra to also return the shortest PATH (list of nodes) from source to target. Maintain parent[] array: when relaxing an edge, set parent[v] = u.",
    examples: [
      { input: "graph: 0->1(4),0->2(1),2->1(2),1->3(1),2->3(5); source=0, target=3", output: "path=[0,2,1,3],cost=4" },
    ],
    why: "Path reconstruction is the natural extension of Dijkstra — store who introduced each node to the frontier. Backtrack from target to source using parent pointers, then reverse.",
    starterCode: "def dijkstra_path(graph, n, source, target):\n    import heapq\n    dist = [float('inf')] * n\n    parent = [-1] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    pass",
    hints: [
      "Maintain parent array. When relaxing (v via u): if dist[u] + w < dist[v], set parent[v] = u.",
      "After Dijkstra finishes: if dist[target] == inf, no path. Else: backtrack from target using parent array.",
      "Build path by following parent until -1 (source). Reverse for source→target order."
    ],
    solution: "def dijkstra_path(graph, n, source, target):\n    import heapq\n    dist = [float('inf')] * n\n    parent = [-1] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        if u == target:\n            break\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                parent[v] = u\n                heapq.heappush(heap, (dist[v], v))\n    if dist[target] == float('inf'):\n        return [], -1\n    path = []\n    cur = target\n    while cur != -1:\n        path.append(cur)\n        cur = parent[cur]\n    return path[::-1], dist[target]",
    walkthrough: "Same Dijkstra loop. When relaxing edge u→v, set parent[v]=u. After heap empties (or target reached), backtrack from target following parent pointers to source. Reverse for correct order. Early exit at target saves work.",
    testCode: "graph = [[(1,4),(2,1)],[(3,1)],[(1,2),(3,5)],[]]\npath, cost = dijkstra_path(graph, 4, 0, 3)\nassert path == [0,2,1,3]\nassert cost == 4\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Dijkstra Variants — Max/Product", pattern: "Dijkstra with different aggregation", skill: "max capacity path (modify relaxation: max(min(cur, w), dist[v])) instead of sum",
    statement: "Find the path from source to target that maximizes the minimum edge weight along the path (bottleneck path). Modify Dijkstra: dist[v] = max(dist[v], min(dist[u], w)).",
    examples: [
      { input: "graph: 0->1(5),0->2(3),1->2(1),2->3(4); source=0, target=3", output: "3", explain: "0->2->3, bottleneck=min(3,4)=3" },
    ],
    why: "Dijkstra is a template. Change the relaxation formula, and you solve a different problem. Max-min path: dist[v] = max(dist[v], min(dist[u], edge_weight)). Same algorithm structure, different semiring.",
    starterCode: "def max_bottleneck_path(graph, n, source, target):\n    import heapq\n    dist = [0] * n\n    dist[source] = float('inf')\n    heap = [(-float('inf'), source)]\n    pass",
    hints: [
      "Initialize dist[source]=inf (to pass min check). Use max-heap (negate values for min-heap).",
      "For each neighbor v with weight w: new_bottleneck = min(dist[u], w). If new_bottleneck > dist[v], update.",
      "dist[v] = bottleneck value (max min-weight along path to v). Return dist[target]."
    ],
    solution: "def max_bottleneck_path(graph, n, source, target):\n    import heapq\n    dist = [0] * n\n    dist[source] = float('inf')\n    heap = [(-float('inf'), source)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        cur = -d\n        if cur < dist[u]:\n            continue\n        for v, w in graph[u]:\n            bottle = min(dist[u], w)\n            if bottle > dist[v]:\n                dist[v] = bottle\n                heapq.heappush(heap, (-bottle, v))\n    return dist[target]",
    walkthrough: "Use max-heap (negate values). dist[v] = max bottleneck found so far. At each step, process the node with highest bottleneck. For neighbors: min(current_bottleneck, edge_weight) gives the path's bottleneck. Update if larger than known. Equivalent to Prim's on 'capacity.'",
    testCode: "graph = [[(1,5),(2,3)],[(2,1)],[(3,4)],[]]\nassert max_bottleneck_path(graph, 4, 0, 3) == 3\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Shortest Path with Obstacles (Grid Dijkstra)", pattern: "Dijkstra on 2D grid", skill: "treat each cell as node; edges to 4 neighbors with weight 1",
    statement: "Given a grid with 0 (empty) and 1 (obstacle), find length of shortest path from top-left to bottom-right. Moves: up/down/left/right. Dijkstra with uniform weight = BFS on unweighted grid, but Dijkstra generalizes with variable costs.",
    examples: [
      { input: "grid = [[0,0,0],[0,1,0],[0,0,0]]", output: "4", explain: "right-right-down-down" },
      { input: "grid = [[0,1],[1,0]]", output: "-1", explain: "no path" },
    ],
    why: "Grid = implicit graph. Each cell is a node, edges connect to 4 neighbors. With unit weights, Dijkstra = BFS. But if cells had traversal costs (1,2,3...), Dijkstra handles it. This bridges grids and graphs.",
    starterCode: "def shortest_path_grid(grid):\n    import heapq\n    rows, cols = len(grid), len(grid[0])\n    dist = [[float('inf')]*cols for _ in range(rows)]\n    dist[0][0] = 0\n    heap = [(0,0,0)]\n    pass",
    hints: [
      "Push (0, 0, 0) for (dist, row, col). Pop closest. For each of 4 directions: if in bounds, not obstacle, dist + 1 < existing, update and push.",
      "Return dist[rows-1][cols-1] if < inf else -1.",
      "For general costs, replace +1 with cell_cost."
    ],
    solution: "def shortest_path_grid(grid):\n    import heapq\n    rows, cols = len(grid), len(grid[0])\n    dist = [[float('inf')]*cols for _ in range(rows)]\n    dist[0][0] = 0\n    heap = [(0,0,0)]\n    dirs = [(1,0),(-1,0),(0,1),(0,-1)]\n    while heap:\n        d, r, c = heapq.heappop(heap)\n        if d > dist[r][c]:\n            continue\n        for dr, dc in dirs:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:\n                nd = d + 1\n                if nd < dist[nr][nc]:\n                    dist[nr][nc] = nd\n                    heapq.heappush(heap, (nd, nr, nc))\n    res = dist[rows-1][cols-1]\n    return res if res < float('inf') else -1",
    walkthrough: "Treat grid cells as nodes. Dijkstra (with unit weights = BFS) finds shortest path. For variable costs: replace +1 with cell cost. Grid Dijkstra = V=rows*cols, E=4V. O(V log V).",
    testCode: "grid1 = [[0,0,0],[0,1,0],[0,0,0]]\nassert shortest_path_grid(grid1) == 4\ngrid2 = [[0,1],[1,0]]\nassert shortest_path_grid(grid2) == -1\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Cheapest Flights Within K Stops (BFS Limited)", pattern: "BFS with stop limit on weighted graph", skill: "BFS (not Dijkstra) with max k stops; track cost per level",
    statement: "Given flights (src,dst,price) and at most k stops (intermediate cities), find cheapest price from src to dst. Use BFS with k+1 levels: for each level, compute cheapest cost to each node using that many steps. Relax across levels.",
    examples: [
      { input: "n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1", output: "700", explain: "0->1->3: 100+600=700" },
      { input: "n=3, flights=[[0,1,100],[1,2,100],[0,2,500]], src=0, dst=2, k=1", output: "200", explain: "0->1->2: 100+100=200" },
    ],
    why: "The stop-count constraint breaks Dijkstra's 'settle once' property — a longer path with more stops may be cheaper. BFS by level counts stops; each level propagates costs to the next. This is Bellman-Ford in BFS clothing.",
    starterCode: "def cheapest_flights(n, flights, src, dst, k):\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u,v,w in flights:\n        graph[u].append((v,w))\n    costs = [float('inf')] * n\n    costs[src] = 0\n    pass",
    hints: [
      "Run BFS for k+1 iterations (k stops = k+1 edges). For each level: copy current costs, relax all edges.",
      "Use a temp copy of costs for the level to avoid using updated costs within the same level.",
      "After k+1 levels, costs[dst] is the answer. Return -1 if inf."
    ],
    solution: "def cheapest_flights(n, flights, src, dst, k):\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u,v,w in flights:\n        graph[u].append((v,w))\n    costs = [float('inf')] * n\n    costs[src] = 0\n    for _ in range(k + 1):\n        temp = costs[:]\n        for u in range(n):\n            if costs[u] == float('inf'):\n                continue\n            for v, w in graph[u]:\n                if costs[u] + w < temp[v]:\n                    temp[v] = costs[u] + w\n        costs = temp\n    return costs[dst] if costs[dst] < float('inf') else -1",
    walkthrough: "BFS by levels (stops). For each level (0 to k): copy current costs, then iterate all edges. For each edge u→v: if costs[u] + w < temp[v], update temp. The copy prevents using same-level improvements for subsequent edges. This is Bellman-Ford with stop limit. O(k*E).",
    testCode: "flights = [[0,1,100],[1,2,100],[0,2,500]]\nassert cheapest_flights(3, flights, 0, 2, 1) == 200\nflights2 = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]\nassert cheapest_flights(4, flights2, 0, 3, 1) == 700\nprint('All tests passed!')"
  },

  {
    id: 13, stage: 1, title: "Number of Shortest Paths", pattern: "Dijkstra with path counting", skill: "maintain ways[v] alongside dist[v]; when equal distance found, add ways",
    statement: "Given a weighted undirected graph (non-negative edges), find the NUMBER of distinct shortest paths from source to each node. Init: ways[source]=1. When relaxing: if dist[u]+w < dist[v], ways[v]=ways[u]. If dist[u]+w == dist[v], ways[v]+=ways[u].",
    examples: [
      { input: "graph: 0-1(1),0-2(1),1-2(1),1-3(1),2-3(1); source=0", output: "ways to 3 = 2 (0->1->3 and 0->2->3)" },
    ],
    why: "Counting shortest paths is Dijkstra's natural extension. When two paths have the SAME distance to a node, both are shortest. The count aggregates. This teaches that Dijkstra's state can carry more than just distance — it works for any value that propagates along shortest paths.",
    starterCode: "def count_shortest_paths(graph, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    ways = [0] * n\n    dist[source] = 0\n    ways[source] = 1\n    heap = [(0, source)]\n    pass",
    hints: [
      "Standard Dijkstra loop. When popping (d,u): if d > dist[u], skip.",
      "For each neighbor v with weight w: if dist[u]+w < dist[v], dist[v]=dist[u]+w, ways[v]=ways[u], push.",
      "If dist[u]+w == dist[v], ways[v] += ways[u] (don't push — already in heap with correct distance)."
    ],
    solution: "def count_shortest_paths(graph, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    ways = [0] * n\n    dist[source] = 0\n    ways[source] = 1\n    heap = [(0, source)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                ways[v] = ways[u]\n                heapq.heappush(heap, (dist[v], v))\n            elif dist[u] + w == dist[v]:\n                ways[v] += ways[u]\n    return dist, ways",
    walkthrough: "Standard Dijkstra + counting. ways[source]=1 (one way to be at source). When a SHORTER path is found: reset ways[v] = ways[u] (all shortest paths to u extend to v). When an EQUAL-length path is found: add ways[u] to ways[v]. Note: for undirected graphs, ways can be large — this is why the module is omitted.",
    testCode: "g = [[(1,1),(2,1)],[(0,1),(2,1),(3,1)],[(0,1),(1,1),(3,1)],[(1,1),(2,1)]]\ndist, ways = count_shortest_paths(g, 4, 0)\nassert ways[3] == 2\nprint('All tests passed!')",
  },
  {
    id: 14, stage: 1, title: "Shortest Path with Node Wait Times", pattern: "Dijkstra with per-node delay", skill: "add node cost to edge relaxation: dist[v] = min(dist[v], dist[u] + w + wait[v])",
    statement: "Given a graph where each node has a wait_time (you must wait that many units before leaving). Source has no wait. Find shortest TIME to each node. Relaxation: if dist[u] + w + wait[v] < dist[v], update. wait[source] = 0.",
    examples: [
      { input: "graph: 0->1(2),1->2(3); wait=[0,5,0]; source=0", output: "dist[2]=2+5+3=10", explain: "arrive at 1 at time 2, wait 5, leave at 7, arrive at 2 at time 10" },
    ],
    why: "Node weights (wait times, tolls, processing delays) are common in real systems. They generalize edge weights: a node cost is just added after arriving. Same Dijkstra template, modified relaxation formula.",
    starterCode: "def shortest_with_node_wait(graph, wait, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    pass",
    hints: [
      "Dijkstra as usual. Pop (d,u). For each neighbor v: new_dist = dist[u] + w + wait[v].",
      "If new_dist < dist[v], update and push. wait[source] is treated as 0 (no wait at start).",
      "Note: wait is added when you ARRIVE at v — before leaving. So the cost to reach v includes its wait."
    ],
    solution: "def shortest_with_node_wait(graph, wait, n, source):\n    import heapq\n    dist = [float('inf')] * n\n    dist[source] = 0\n    heap = [(0, source)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        for v, w in graph[u]:\n            new_dist = dist[u] + w + wait[v]\n            if new_dist < dist[v]:\n                dist[v] = new_dist\n                heapq.heappush(heap, (dist[v], v))\n    return dist",
    walkthrough: "Same Dijkstra loop. The relaxation: dist[v] considers not just edge weight w but also the time spent waiting at v. This is equivalent to transforming node weights into edge weights: each incoming edge to v gains +wait[v]. Dijkstra's correctness is preserved because wait[v] >= 0 (non-negative). O((V+E) log V).",
    testCode: "g = [[(1,2)],[(2,3)],[]]\nwait = [0, 5, 0]\nassert shortest_with_node_wait(g, wait, 3, 0) == [0, 2, 10]\nprint('All tests passed!')",
  },
  // ── STAGE 2: Union-Find ──
  {
    id: 15, stage: 2, title: "Union-Find — Naive Relabeling", pattern: "naive DSU with O(n) union", skill: "union by relabeling all elements in one set to the label of the other",
    statement: "Implement DSU with find O(1) and union O(n). Each set has a label. Union: relabel all elements with label of set A to label of set B. Find: return element's label.",
    examples: [
      { input: "operations: union(0,1), union(1,2), find(0)==find(2)", output: "True (same set)" },
    ],
    why: "The naive approach: each element stores its set label. Union scans ALL elements to relabel. O(n) per union, O(1) find. This works for small n but degrades. Motivation for the tree-based approach.",
    starterCode: "class DSU_Naive:\n    def __init__(self, n):\n        self.label = list(range(n))\n    def find(self, x):\n        pass\n    def union(self, x, y):\n        pass",
    hints: [
      "find(x): return label[x] (O(1)). union(x, y): if same label, return. Else, target = label[y], old = label[x], for all i: if label[i]==old, label[i]=target.",
      "This is O(n) per union because we scan all elements.",
      "Next evolution: use a linked structure to avoid scanning."
    ],
    solution: "class DSU_Naive:\n    def __init__(self, n):\n        self.label = list(range(n))\n    def find(self, x):\n        return self.label[x]\n    def union(self, x, y):\n        if self.label[x] == self.label[y]:\n            return\n        old = self.label[x]\n        target = self.label[y]\n        for i in range(len(self.label)):\n            if self.label[i] == old:\n                self.label[i] = target",
    walkthrough: "Each element has a label number. Union(A,B): change all elements with label[A] to label[B]. O(n) per union because we iterate over every element. n unions = O(n²). Not scalable. The insight: we need to avoid scanning all elements — use a tree where we only change the root pointer.",
    testCode: "dsu = DSU_Naive(5)\ndsu.union(0, 1)\ndsu.union(1, 2)\nassert dsu.find(0) == dsu.find(2)\nassert dsu.find(3) != dsu.find(0)\ndsu.union(3, 4)\nassert dsu.find(3) == dsu.find(4)\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Quick Find", pattern: "quick find DSU", skill: "root array: find O(1), union O(n)",
    statement: "Implement Quick Find: root[i] = the set representative of element i. Find: return root[i]. Union(x,y): set root of all elements with root[x] to root[y].",
    examples: [
      { input: "elements 0..4, union(0,1), union(1,2), find(0), find(2)", output: "same root value" },
    ],
    why: "Quick Find = naive DSU with root array. find is O(1), union is O(n). The name 'Quick Find' emphasizes that find is fast. Quick Union (P13) will make union fast at the cost of find.",
    starterCode: "class QuickFind:\n    def __init__(self, n):\n        self.root = list(range(n))\n    def find(self, x):\n        pass\n    def union(self, x, y):\n        pass",
    hints: [
      "find: return root[x]. union: rx=root[x], ry=root[y]; if rx==ry, return. Scan all i: if root[i]==rx, root[i]=ry.",
      "Same as naive but uses 'root' terminology — the set representative.",
      "O(1) find, O(n) union. Compare with Quick Union next."
    ],
    solution: "class QuickFind:\n    def __init__(self, n):\n        self.root = list(range(n))\n    def find(self, x):\n        return self.root[x]\n    def union(self, x, y):\n        rx = self.root[x]\n        ry = self.root[y]\n        if rx == ry:\n            return\n        for i in range(len(self.root)):\n            if self.root[i] == rx:\n                self.root[i] = ry",
    walkthrough: "root[i] directly stores the set ID. find = O(1). union must scan all n elements to relabel — O(n). For m operations, worst case O(mn). The tradeoff: fast find, slow union — the opposite of what we'll achieve with path compression.",
    testCode: "qf = QuickFind(5)\nqf.union(0, 1)\nassert qf.find(0) == qf.find(1)\nqf.union(1, 2)\nassert qf.find(0) == qf.find(2)\nassert qf.find(3) != qf.find(0)\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Quick Union", pattern: "tree-based union", skill: "parent pointers; union by attaching root to root",
    statement: "Implement Quick Union: parent[i] points to parent. Root = find climbs to tree root. Union: attach root of one tree to root of the other. Find: O(tree-height), Union: O(find).",
    examples: [
      { input: "elements 0..4, union(0,1), union(1,2)", output: "0,1,2 in same set" },
    ],
    why: "Quick Union flips the tradeoff: find becomes O(height) (climb to root), union becomes O(find) (just change one pointer). This is more efficient than Quick Find for most sequences.",
    starterCode: "class QuickUnion:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        pass\n    def union(self, x, y):\n        pass",
    hints: [
      "find: while parent[x] != x: x = parent[x]; return x. This climbs to the root.",
      "union: root_x = find(x), root_y = find(y); if different, parent[root_x] = root_y (or vice versa).",
      "Problem: trees can become deep (linear). Worst case O(n) find. Solution: union by rank (P15)."
    ],
    solution: "class QuickUnion:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        while self.parent[x] != x:\n            x = self.parent[x]\n        return x\n    def union(self, x, y):\n        rx = self.find(x)\n        ry = self.find(y)\n        if rx != ry:\n            self.parent[rx] = ry",
    walkthrough: "parent array forms a forest. find climbs to root (parent[x]==x). union sets one root's parent to the other root — O(find). Without balancing, trees can become chains (O(n) find). Path compression + union by rank solve this.",
    testCode: "qu = QuickUnion(5)\nqu.union(0, 1)\nassert qu.find(0) == qu.find(1)\nqu.union(1, 2)\nassert qu.find(0) == qu.find(2)\nassert qu.find(3) != qu.find(1)\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Path Compression", pattern: "shorten tree during find", skill: "during find, redirect every node on path to point directly to root",
    statement: "Add path compression to Quick Union. During find(x), after finding root, set parent of all nodes along the path to root. This flattens the tree over time.",
    examples: [
      { input: "chain: 0->1->2->3->4. find(0) with path compression", output: "all nodes now point directly to 4" },
    ],
    why: "Path compression amortizes find to nearly O(1). During find(x), every node on the path from x to root gets redirected straight to root. Future finds through these nodes are O(1).",
    starterCode: "class DSU_PathComp:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        pass\n    def union(self, x, y):\n        pass",
    hints: [
      "If parent[x] != x: parent[x] = find(parent[x]). Return parent[x].",
      "This recursively compresses the path — each node on the path gets redirected to root.",
      "Union remains the same: attach roots."
    ],
    solution: "class DSU_PathComp:\n    def __init__(self, n):\n        self.parent = list(range(n))\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])\n        return self.parent[x]\n    def union(self, x, y):\n        rx = self.find(x)\n        ry = self.find(y)\n        if rx != ry:\n            self.parent[rx] = ry",
    walkthrough: "Recursive find with compression: if parent[x] != x, recursively find root, then set parent[x] = root. This redirects the entire path to root. After compression, the tree depth is at most 1 (all nodes point directly to root). Amortized time ~O(α(n)) — inverse Ackermann, essentially constant.",
    testCode: "dsu = DSU_PathComp(5)\ndsu.parent = [1,2,3,4,4]\nroot = dsu.find(0)\nassert root == 4\nassert dsu.parent[0] == 4\nassert dsu.parent[1] == 4\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Union by Rank", pattern: "attach smaller tree under larger", skill: "maintain rank = tree height estimate; always attach shorter root to taller root",
    statement: "Add union by rank to DSU. rank[root] ≈ height of tree. When unioning, attach the root with smaller rank under the root with larger rank. If ranks equal, arbitrarily attach and increment the new root's rank.",
    examples: [
      { input: "union of two trees, ranks 2 and 1", output: "tree with rank 1 attached under rank 2; rank remains 2" },
    ],
    why: "Union by rank keeps trees shallow — worst-case depth O(log n). Combined with path compression, this gives the inverse Ackermann amortized bound.",
    starterCode: "class DSU:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n    def find(self, x):\n        pass\n    def union(self, x, y):\n        pass",
    hints: [
      "find with path compression (recursive). union: get roots rx, ry. If rx == ry, return.",
      "If rank[rx] < rank[ry]: parent[rx] = ry. elif rank[rx] > rank[ry]: parent[ry] = rx. else: parent[rx] = ry, rank[ry] += 1.",
      "Rank only increases when two equal-rank trees are merged."
    ],
    solution: "class DSU:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n    def find(self, x):\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])\n        return self.parent[x]\n    def union(self, x, y):\n        rx = self.find(x)\n        ry = self.find(y)\n        if rx == ry:\n            return\n        if self.rank[rx] < self.rank[ry]:\n            self.parent[rx] = ry\n        elif self.rank[rx] > self.rank[ry]:\n            self.parent[ry] = rx\n        else:\n            self.parent[rx] = ry\n            self.rank[ry] += 1",
    walkthrough: "Rank approximates tree height. Always attach the shorter tree under the taller — this keeps the overall height from growing unnecessarily. Only when two equal-height trees merge does rank increase by 1. Path compression + union by rank = inverse Ackermann amortized time.",
    testCode: "dsu = DSU(6)\ndsu.union(0, 1)\nassert dsu.find(0) == dsu.find(1)\ndsu.union(1, 2)\ndsu.union(3, 4)\ndsu.union(4, 5)\ndsu.union(0, 3)\nassert dsu.find(0) == dsu.find(5)\nassert dsu.find(2) == dsu.find(4)\nprint('All tests passed!')"
  },

  {
    id: 20, stage: 2, title: "Count Connected Components (Static)", pattern: "DSU to count components", skill: "after all unions, count distinct roots; each root = one component",
    statement: "Given n nodes and a list of undirected edges, return the number of connected components. Build DSU, union all edges, then count nodes where find(i) == i (i is its own root).",
    examples: [
      { input: "n=5, edges=[[0,1],[1,2],[3,4]]", output: "2", explain: "components: {0,1,2} and {3,4}" },
      { input: "n=4, edges=[[0,1],[2,3],[1,2]]", output: "1" },
    ],
    why: "Counting connected components is the most common DSU application. After all unions, the number of roots (nodes where parent[i]==i) equals the number of connected components. This composes the DSU from Stage 2 with a simple counting step.",
    starterCode: "def count_components(n, edges):\n    parent = list(range(n))\n    rank = [0] * n\n    def find(x):\n        pass\n    def union(x, y):\n        pass\n    pass",
    hints: [
      "Implement find with path compression and union by rank (reuse DSU from P15).",
      "Union all edges. Then iterate 0..n-1: count nodes where find(i) == i.",
      "Each root represents one connected component."
    ],
    solution: "def count_components(n, edges):\n    parent = list(range(n))\n    rank = [0] * n\n    def find(x):\n        if parent[x] != x:\n            parent[x] = find(parent[x])\n        return parent[x]\n    def union(x, y):\n        rx, ry = find(x), find(y)\n        if rx == ry:\n            return\n        if rank[rx] < rank[ry]:\n            parent[rx] = ry\n        elif rank[rx] > rank[ry]:\n            parent[ry] = rx\n        else:\n            parent[rx] = ry\n            rank[ry] += 1\n    for u, v in edges:\n        union(u, v)\n    return sum(1 for i in range(n) if find(i) == i)",
    walkthrough: "Build DSU. Union all edges. The number of components = number of distinct roots. Since path compression may not have compressed all nodes, call find(i) (not parent[i]==i) to get the true root. This is O(E * α(n) + n).",
    testCode: "assert count_components(5, [[0,1],[1,2],[3,4]]) == 2\nassert count_components(4, [[0,1],[2,3],[1,2]]) == 1\nassert count_components(3, []) == 3\nprint('All tests passed!')",
  },
  {
    id: 21, stage: 2, title: "Redundant Connection", pattern: "first edge creating a cycle", skill: "process edges; the first edge whose endpoints are already connected is the redundant one",
    statement: "Given a tree with one extra edge added (n nodes, n edges), find the redundant edge that can be removed to make it a tree again. Process edges in order; the first edge that connects two already-connected nodes creates the cycle — return it.",
    examples: [
      { input: "edges=[[1,2],[1,3],[2,3]]", output: "[2,3]", explain: "edge [2,3] creates cycle 1-2-3-1" },
      { input: "edges=[[1,2],[2,3],[3,4],[1,4],[1,5]]", output: "[1,4]" },
    ],
    why: "Redundant connection = the first edge where find(u) == find(v) — the endpoints are already in the same component. Adding it creates a cycle. DSU makes this O(E * α(n)). This is the canonical DSU 'cycle detection' problem.",
    starterCode: "def find_redundant_connection(edges):\n    n = len(edges)\n    parent = list(range(n + 1))\n    rank = [0] * (n + 1)\n    pass",
    hints: [
      "Iterate edges. For each (u,v): if find(u) == find(v), this edge is redundant — return it.",
      "Otherwise, union(u,v) and continue.",
      "DSU with 1-indexed nodes: parent size n+1."
    ],
    solution: "def find_redundant_connection(edges):\n    n = len(edges)\n    parent = list(range(n + 1))\n    rank = [0] * (n + 1)\n    def find(x):\n        if parent[x] != x:\n            parent[x] = find(parent[x])\n        return parent[x]\n    def union(x, y):\n        rx, ry = find(x), find(y)\n        if rx == ry:\n            return False\n        if rank[rx] < rank[ry]:\n            parent[rx] = ry\n        elif rank[rx] > rank[ry]:\n            parent[ry] = rx\n        else:\n            parent[rx] = ry\n            rank[ry] += 1\n        return True\n    for u, v in edges:\n        if not union(u, v):\n            return [u, v]\n    return []",
    walkthrough: "For n nodes and n edges (a tree + 1 extra), exactly one edge creates a cycle. DSU tracks connectivity. The first edge where find(u)==find(v) is the answer. Return it. O(n * α(n)). If multiple redundant edges may exist (though not in this problem definition), return the last one.",
    testCode: "assert find_redundant_connection([[1,2],[1,3],[2,3]]) == [2, 3]\nassert find_redundant_connection([[1,2],[2,3],[3,4],[1,4],[1,5]]) == [1, 4]\nprint('All tests passed!')",
  },
  // ── STAGE 3: Spanning Trees ──
  {
    id: 22, stage: 3, title: "Kruskal's MST", pattern: "sort edges + union-find", skill: "sort all edges by weight; add edge if endpoints in different sets (no cycle)",
    statement: "Find MST of an undirected weighted graph. Kruskal: sort all edges by weight ascending. For each edge (u,v,w), if find(u) != find(v), add to MST and union(u,v). Stop when MST has V-1 edges.",
    examples: [
      { input: "V=4, edges=[[0,1,1],[0,2,3],[1,2,2],[1,3,4],[2,3,5]]", output: "6", explain: "edges: (0,1,1)+(1,2,2)+(1,3,4)=7? No: (0,1,1)+(1,2,2)+(0,2,3) forms cycle. MST: [0,1,1],[1,2,2],[1,3,4]=7" },
    ],
    why: "Kruskal composes sorting + union-find. The greedy insight: the cheapest edge that doesn't create a cycle is safe to add. Sorting by weight ensures we always consider the cheapest remaining edge.",
    starterCode: "def kruskal(n, edges):\n    edges.sort(key=lambda x: x[2])\n    dsu = DSU(n)\n    mst_weight = 0\n    mst_edges = []\n    pass",
    hints: [
      "Sort edges by weight ascending. Initialize DSU with n nodes.",
      "For each (u,v,w): if find(u) != find(v), add w to mst_weight, union(u,v), append to mst_edges.",
      "Stop when mst_edges reaches n-1. If not enough, graph is disconnected."
    ],
    solution: "def kruskal(n, edges):\n    edges.sort(key=lambda x: x[2])\n    parent = list(range(n))\n    rank = [0] * n\n    def find(x):\n        if parent[x] != x:\n            parent[x] = find(parent[x])\n        return parent[x]\n    def union(x, y):\n        rx, ry = find(x), find(y)\n        if rx == ry: return\n        if rank[rx] < rank[ry]: parent[rx] = ry\n        elif rank[rx] > rank[ry]: parent[ry] = rx\n        else: parent[rx] = ry; rank[ry] += 1\n    mst_weight = 0\n    mst_edges = []\n    for u, v, w in edges:\n        if find(u) != find(v):\n            union(u, v)\n            mst_weight += w\n            mst_edges.append((u,v,w))\n            if len(mst_edges) == n - 1:\n                break\n    return mst_weight, mst_edges",
    walkthrough: "Sort edges O(E log E). Process edges: each edge adds to MST if it connects two different components (no cycle). Union them. Stop at V-1 edges. Proof: the cheapest edge crossing a cut is always in some MST. Kruskal's correctness follows from the cut property.",
    testCode: "edges = [[0,1,1],[0,2,3],[1,2,2],[1,3,4],[2,3,5]]\nweight, mst = kruskal(4, edges)\nassert weight == 7\nassert len(mst) == 3\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Prim's MST", pattern: "Dijkstra-like frontier expansion", skill: "start from any node; grow tree by always adding the cheapest edge that connects a new node",
    statement: "Find MST using Prim's algorithm. Start at node 0. Maintain min-heap of edges crossing the cut (tree vs rest). At each step, pick the cheapest edge connecting a new node to the tree.",
    examples: [
      { input: "V=4, same edges as Kruskal", output: "7 (same MST weight)" },
    ],
    why: "Prim's is Dijkstra's twin — same heap structure, different relaxation: instead of dist[u]+w, the edge weight itself is the key. Grows the tree node by node rather than edge by edge.",
    starterCode: "def prims(n, graph):\n    import heapq\n    visited = [False] * n\n    heap = [(0, 0, -1)]\n    mst_weight = 0\n    pass",
    hints: [
      "Maintain visited set for nodes in MST. Push (0, 0, -1) for (weight, node, parent).",
      "While heap: pop (w, u, p). If visited[u], skip. Mark visited, add w to mst_weight.",
      "For each neighbor (v, weight) of u: if not visited[v], push (weight, v, u) to heap."
    ],
    solution: "def prims(n, graph):\n    import heapq\n    visited = [False] * n\n    heap = [(0, 0, -1)]\n    mst_weight = 0\n    while heap:\n        w, u, parent = heapq.heappop(heap)\n        if visited[u]:\n            continue\n        visited[u] = True\n        mst_weight += w\n        for v, weight in graph[u]:\n            if not visited[v]:\n                heapq.heappush(heap, (weight, v, u))\n    return mst_weight",
    walkthrough: "Start at node 0 with weight 0. Heap stores crossing edges. Pop cheapest edge: if the destination is already in MST, skip (edge would create a cycle). Otherwise, add it and push all edges from the new node to unvisited neighbors. Grows a single connected tree. Same proof via cut property.",
    testCode: "graph = [[(1,1),(2,3)],[(0,1),(2,2),(3,4)],[(0,3),(1,2),(3,5)],[(1,4),(2,5)]]\nassert prims(4, graph) == 7\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Min Cost to Connect All Points", pattern: "MST on complete graph (Manhattan distance)", skill: "treat points as nodes; edge weight = Manhattan distance; run Prim/Kruskal",
    statement: "Given points (xi, yi), cost to connect two points = |x1-x2| + |y1-y2|. Find minimum cost to connect all points (make them in one component). This is MST on the complete graph of points.",
    examples: [
      { input: "points = [[0,0],[2,2],[3,10],[5,2],[7,0]]", output: "20" },
      { input: "points = [[3,12],[-2,5],[-4,1]]", output: "18" },
    ],
    why: "Every pair of points has an edge. The complete graph has O(n²) edges. MST picks the n-1 cheapest that connect everything. Prim's with lazy edge generation is more efficient here (no need to sort all O(n²) edges).",
    starterCode: "def min_cost_connect_points(points):\n    import heapq\n    n = len(points)\n    visited = [False] * n\n    heap = [(0, 0)]\n    total = 0\n    pass",
    hints: [
      "Prim's: push (0,0). Pop closest unvisited point. Mark visited, add cost to total.",
      "For each unvisited j: compute manhattan distance = abs(xi-xj) + abs(yi-yj). Push (dist, j).",
      "Continue until n points are in MST. O(n²) for generating all edges lazily."
    ],
    solution: "def min_cost_connect_points(points):\n    import heapq\n    n = len(points)\n    visited = [False] * n\n    heap = [(0, 0)]\n    total = 0\n    edges_used = 0\n    while edges_used < n:\n        cost, i = heapq.heappop(heap)\n        if visited[i]:\n            continue\n        visited[i] = True\n        total += cost\n        edges_used += 1\n        for j in range(n):\n            if not visited[j]:\n                dist = abs(points[i][0] - points[j][0]) + abs(points[i][1] - points[j][1])\n                heapq.heappush(heap, (dist, j))\n    return total",
    walkthrough: "Prim's on complete graph. At each step, the heap holds distances from visited nodes to unvisited ones. Pop the closest unvisited node. Generate and push distances to ALL unvisited nodes — lazy generation. Each node visited once = n iterations. Total cost and edge count tracked. O(n² log n).",
    testCode: "assert min_cost_connect_points([[0,0],[2,2],[3,10],[5,2],[7,0]]) == 20\nassert min_cost_connect_points([[3,12],[-2,5],[-4,1]]) == 18\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Cheapest Cable (Connecting Cities)", pattern: "MST with given edges", skill: "find MST weight on sparse graph of cables between cities",
    statement: "Given n cities and cables[i]=[u,v,cost], find minimum total cost of cables to connect all cities. If not possible, return -1. This is MST weight.",
    examples: [
      { input: "n=4, cables=[[1,0,1],[2,1,2],[3,2,3],[3,0,4]]", output: "6", explain: "MST edges: 0-1(1), 1-2(2), 2-3(3) = 6" },
      { input: "n=3, cables=[[0,1,1]]", output: "-1", explain: "can't connect all 3" },
    ],
    why: "Cities are nodes, cables are edges. The constraint 'connect all cities with minimum cost' is exactly MST. Kruskal or Prim depending on density. Check connectedness at end.",
    starterCode: "def min_cable_cost(n, cables):\n    cables.sort(key=lambda x: x[2])\n    parent = list(range(n))\n    rank = [0] * n\n    pass",
    hints: [
      "Use Kruskal (sort edges by cost). DSU to track components.",
      "Add edges that connect different components. Count edges added. If < n-1, not all cities connected.",
      "Return total cost or -1 if disconnected."
    ],
    solution: "def min_cable_cost(n, cables):\n    cables.sort(key=lambda x: x[2])\n    parent = list(range(n))\n    rank = [0] * n\n    def find(x):\n        if parent[x] != x:\n            parent[x] = find(parent[x])\n        return parent[x]\n    def union(x, y):\n        rx, ry = find(x), find(y)\n        if rx == ry: return False\n        if rank[rx] < rank[ry]: parent[rx] = ry\n        elif rank[rx] > rank[ry]: parent[ry] = rx\n        else: parent[rx] = ry; rank[ry] += 1\n        return True\n    total = 0\n    edges_used = 0\n    for u, v, w in cables:\n        if union(u, v):\n            total += w\n            edges_used += 1\n            if edges_used == n - 1:\n                break\n    return total if edges_used == n - 1 else -1",
    walkthrough: "Standard Kruskal: sort edges by cost, union-find to avoid cycles. If after processing all edges we haven't picked n-1 edges, the graph is disconnected — return -1. MST weight is the minimum cost to connect all cities.",
    testCode: "assert min_cable_cost(4, [[1,0,1],[2,1,2],[3,2,3],[3,0,4]]) == 6\nassert min_cable_cost(3, [[0,1,1]]) == -1\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "MST Weight with Both Prim and Kruskal", pattern: "verify equivalence of two MST algorithms", skill: "run both algorithms, compare weights on same graph",
    statement: "Given a connected undirected weighted graph, compute MST weight using both Prim and Kruskal. Verify they give the same result. Return the weight.",
    examples: [
      { input: "any connected graph", output: "same MST weight from both algorithms" },
    ],
    why: "Both Prim and Kruskal produce an MST. The total weight is the same (MST is unique in weight, though the edge set may differ). Verifying equivalence builds trust in both algorithms.",
    starterCode: "def verify_mst_equivalent(n, graph, edges_list):\n    pass",
    hints: [
      "Run Kruskal on the edge list. Run Prim on the adjacency list graph.",
      "Both should return the same total weight for a connected graph.",
      "If they differ, there's a bug. Compare and return True/False."
    ],
    solution: "def verify_mst_equivalent(n, graph, edges_list):\n    def kruskal_weight():\n        edges = sorted(edges_list, key=lambda x: x[2])\n        parent = list(range(n))\n        rank = [0] * n\n        def find(x):\n            if parent[x] != x: parent[x] = find(parent[x])\n            return parent[x]\n        def union(x,y):\n            rx,ry=find(x),find(y)\n            if rx==ry: return False\n            if rank[rx]<rank[ry]: parent[rx]=ry\n            elif rank[rx]>rank[ry]: parent[ry]=rx\n            else: parent[rx]=ry; rank[ry]+=1\n            return True\n        w = 0\n        for u,v,c in edges:\n            if union(u,v): w+=c\n        return w\n    import heapq\n    visited = [False]*n\n    heap = [(0,0)]\n    pw = 0\n    while heap:\n        w,u=heapq.heappop(heap)\n        if visited[u]: continue\n        visited[u]=True; pw+=w\n        for v,c in graph[u]:\n            if not visited[v]: heap.append((c,v))\n    return kruskal_weight() == pw",
    walkthrough: "Run both algorithms on the same graph. Kruskal sorts edges, uses DSU. Prim uses heap. Despite different execution orders, the total MST weight is identical. Any input where they differ reveals a bug in one implementation.",
    testCode: "graph = [[(1,1),(2,3)],[(0,1),(2,2),(3,4)],[(0,3),(1,2),(3,5)],[(1,4),(2,5)]]\nedges = [[0,1,1],[0,2,3],[1,2,2],[1,3,4],[2,3,5]]\nassert verify_mst_equivalent(4, graph, edges) == True\nprint('All tests passed!')"
  },

  {
    id: 27, stage: 3, title: "Topological Sort — Kahn's Algorithm", pattern: "BFS on indegree", skill: "compute indegree; enqueue nodes with indegree 0; process, decrement neighbors' indegree",
    statement: "Given a directed graph (no cycles — a DAG), return a topological ordering. Kahn's algorithm: compute indegree of each node. Push all nodes with indegree=0 into queue. While queue: pop node, append to result, for each neighbor decrement indegree; if indegree becomes 0, enqueue.",
    examples: [
      { input: "edges=[[5,0],[5,2],[4,0],[4,1],[2,3],[3,1]]; n=6", output: "[4,5,0,2,3,1] (or similar valid order)" },
      { input: "edges=[[0,1],[1,2]]; n=3", output: "[0,1,2]" },
    ],
    why: "Topological sort orders nodes so all edges go forward. Kahn's algorithm uses BFS on indegree — nodes with no prerequisites are 'ready.' It's the standard tool for dependency resolution, scheduling, and prerequisite chains.",
    starterCode: "def topological_sort_kahn(graph, n):\n    from collections import deque\n    indegree = [0] * n\n    for u in range(n):\n        for v, _ in graph[u]:\n            indegree[v] += 1\n    queue = deque()\n    pass",
    hints: [
      "Build indegree array. Enqueue all nodes with indegree == 0.",
      "While queue: pop node, add to result. For each neighbor: indegree--; if indegree == 0, enqueue.",
      "If len(result) < n, there's a cycle — topological sort is impossible."
    ],
    solution: "def topological_sort_kahn(graph, n):\n    from collections import deque\n    indegree = [0] * n\n    for u in range(n):\n        for v, _ in graph[u]:\n            indegree[v] += 1\n    queue = deque()\n    for i in range(n):\n        if indegree[i] == 0:\n            queue.append(i)\n    result = []\n    while queue:\n        u = queue.popleft()\n        result.append(u)\n        for v, _ in graph[u]:\n            indegree[v] -= 1\n            if indegree[v] == 0:\n                queue.append(v)\n    return result if len(result) == n else []",
    walkthrough: "Kahn's = BFS on indegree. Nodes with indegree 0 have no prerequisites — they're ready. Process them, decrement their neighbors' indegree (one prerequisite removed). When a neighbor's indegree hits 0, it's now ready. If result doesn't include all n nodes, there's a cycle. O(V+E).",
    testCode: "g = [[],[],[(3,1)],[(1,1)],[(0,1),(1,1)],[(0,1),(2,1)]]\norder = topological_sort_kahn(g, 6)\nassert len(order) == 6\nassert order.index(5) < order.index(0)\nassert order.index(2) < order.index(3)\nprint('All tests passed!')",
  },
  {
    id: 28, stage: 3, title: "Longest Path in DAG", pattern: "topological order + DP relaxation", skill: "topo-sort, then relax edges in topological order: dist[v] = max(dist[v], dist[u] + w)",
    statement: "Given a weighted DAG and source, find the longest path distances from source to all nodes. Topological sort, then process nodes in order: for each edge u→v with weight w, dist[v] = max(dist[v], dist[u] + w). Initialize dist[source]=0, others=-inf.",
    examples: [
      { input: "edges: 0->1(3),0->2(2),1->3(4),2->3(2); source=0", output: "[0,3,2,7]", explain: "longest to 3: 0->1->3 = 7" },
    ],
    why: "Longest path in a DAG uses the SAME skeleton as shortest path but with max instead of min, and -inf initialization. Processing in topological order guarantees that when we process u, dist[u] is already final (no back edges). This doesn't work on graphs with cycles.",
    starterCode: "def longest_path_dag(graph, n, source):\n    from collections import deque\n    indegree = [0] * n\n    pass",
    hints: [
      "Topological sort (Kahn's). Initialize dist[source]=0, others=-inf.",
      "Process nodes in topological order. For each edge (u,v,w): dist[v] = max(dist[v], dist[u] + w).",
      "Relaxation is 'if dist[u] + w > dist[v]' — the max analog of shortest path relaxation."
    ],
    solution: "def longest_path_dag(graph, n, source):\n    from collections import deque\n    indegree = [0] * n\n    for u in range(n):\n        for v, _ in graph[u]:\n            indegree[v] += 1\n    queue = deque([i for i in range(n) if indegree[i] == 0])\n    dist = [float('-inf')] * n\n    dist[source] = 0\n    order = []\n    while queue:\n        u = queue.popleft()\n        order.append(u)\n        for v, _ in graph[u]:\n            indegree[v] -= 1\n            if indegree[v] == 0:\n                queue.append(v)\n    for u in order:\n        if dist[u] == float('-inf'):\n            continue\n        for v, w in graph[u]:\n            if dist[u] + w > dist[v]:\n                dist[v] = dist[u] + w\n    return dist",
    walkthrough: "Topological order ensures all incoming edges to a node are processed before the node itself. Process nodes in that order: relax each outgoing edge with MAX (instead of MIN). Initialize source=0, others=-inf (instead of +inf). This is the dual of shortest path in a DAG. O(V+E).",
    testCode: "g = [[(1,3),(2,2)],[(3,4)],[(3,2)],[]]\nassert longest_path_dag(g, 4, 0) == [0, 3, 2, 7]\nprint('All tests passed!')",
  },
  // ── STAGE 4: Naive ──
  {
    id: 29, stage: 4, title: "All Paths DFS — Exponential Enumeration", pattern: "DFS all simple paths", skill: "enumerate every simple path from source to target via backtracking",
    statement: "Given a directed unweighted graph, enumerate ALL simple paths (no repeated nodes) from source to target. How many are there in a complete graph of 4 nodes?",
    examples: [
      { input: "graph: 0->1,1->2,2->3,0->2,1->3; source=0, target=3", output: "enumerate all 3 paths: [0,1,2,3], [0,1,3], [0,2,3]" },
    ],
    why: "Enumerating all paths is the naive baseline for shortest path — you can compute any path metric (shortest, longest, cheapest) by enumerating all. But the number of paths is exponential, making this impractical.",
    starterCode: "def all_paths_dfs(graph, source, target):\n    result = []\n    def dfs(node, path, visited):\n        pass\n    dfs(source, [source], {source})\n    return result",
    hints: [
      "DFS with backtracking: maintain current path and visited set.",
      "At node == target: append path[:] to result. Recurse to all unvisited neighbors.",
      "Backtrack: remove node from path and visited after recursion returns."
    ],
    solution: "def all_paths_dfs(graph, source, target):\n    result = []\n    def dfs(node, path, visited):\n        if node == target:\n            result.append(path[:])\n            return\n        for neighbor, _ in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                path.append(neighbor)\n                dfs(neighbor, path, visited)\n                path.pop()\n                visited.remove(neighbor)\n    dfs(source, [source], {source})\n    return result",
    walkthrough: "Backtracking DFS enumerates every simple path. State: current path, visited set. When target reached, record path. Number of simple paths in a graph is O(V!) in the worst case. This is the naive 'try everything' approach — gives exact answers but doesn't scale.",
    testCode: "graph = [[(1,1),(2,1)],[(2,1),(3,1)],[(3,1)],[]]\npaths = all_paths_dfs(graph, 0, 3)\nassert [0,1,2,3] in paths\nassert [0,1,3] in paths\nassert [0,2,3] in paths\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Min Cost Path — Exhaustive Enumeration", pattern: "enumerate all paths, compute min cost", skill: "DFS all paths with cost tracking; return minimum cost path",
    statement: "Given weighted directed graph, find min-cost path from source to target by enumerating ALL simple paths and tracking costs. Return (min_cost, min_path).",
    examples: [
      { input: "graph: 0->1(3),0->2(1),2->1(1); source=0,target=1", output: "cost=2, path=[0,2,1]" },
    ],
    why: "Exhaustive enumeration finds the true optimum (by definition) — it's correct but exponential. This is the 'brute force' that Dijkstra replaces.",
    starterCode: "def min_cost_exhaustive(graph, source, target):\n    min_cost = [float('inf')]\n    min_path = [[]]\n    def dfs(node, cost, path, visited):\n        pass\n    dfs(source, 0, [source], {source})\n    return min_cost[0], min_path[0]",
    hints: [
      "DFS: at each step, accumulate cost. At target, compare with global min_cost.",
      "Pruning: if current cost >= min_cost[0], don't bother continuing (branch and bound).",
      "For correctness, don't prune — prove the naive solution finds the optimum."
    ],
    solution: "def min_cost_exhaustive(graph, source, target):\n    min_cost = [float('inf')]\n    min_path = [[]]\n    def dfs(node, cost, path, visited):\n        if node == target:\n            if cost < min_cost[0]:\n                min_cost[0] = cost\n                min_path[0] = path[:]\n            return\n        for neighbor, weight in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                path.append(neighbor)\n                dfs(neighbor, cost + weight, path, visited)\n                path.pop()\n                visited.remove(neighbor)\n    dfs(source, 0, [source], {source})\n    return min_cost[0], min_path[0]",
    walkthrough: "DFS enumerates every simple path, tracking cost. At target, update global min. This is correct (exhaustive) but O(V!) in the worst case. Pruning (branch and bound) can help, but worst case is exponential. This is what Dijkstra does in O((V+E) log V).",
    testCode: "graph = [[(1,3),(2,1)],[],[(1,1)]]\ncost, path = min_cost_exhaustive(graph, 0, 1)\nassert cost == 2\nassert path == [0,2,1]\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Cheapest Path via Enumerate (Weighted)", pattern: "DFS with cost accumulation", skill: "given weighted edges, enumerate all paths, track cheapest to each node",
    statement: "Given weighted graph, find cheapest cost from source to ALL nodes by enumerating all paths. Compare with Dijkstra's output to verify correctness.",
    examples: [
      { input: "small graph with 4 nodes", output: "distances matching Dijkstra" },
    ],
    why: "Enumerate all paths = guarantee correct answer. Compare naive result with Dijkstra to build confidence. Only feasible for tiny graphs (n <= 10).",
    starterCode: "def cheapest_exhaustive_all(graph, n, source):\n    best = [float('inf')] * n\n    def dfs(node, cost, visited):\n        pass\n    dfs(source, 0, {source})\n    return best",
    hints: [
      "DFS from source. At each node, update best[node] = min(best[node], cost).",
      "Recurse to all unvisited neighbors with cost + weight.",
      "If cost >= best[node], prune (can't improve this node)."
    ],
    solution: "def cheapest_exhaustive_all(graph, n, source):\n    best = [float('inf')] * n\n    best[source] = 0\n    def dfs(node, cost, visited):\n        for neighbor, weight in graph[node]:\n            if neighbor not in visited:\n                new_cost = cost + weight\n                if new_cost < best[neighbor]:\n                    best[neighbor] = new_cost\n                visited.add(neighbor)\n                dfs(neighbor, new_cost, visited)\n                visited.remove(neighbor)\n    dfs(source, 0, {source})\n    return best",
    walkthrough: "Exhaustive DFS from source. At each node, update best known cost. Explore all simple paths. For small n (n <= 10), this is fast enough. Compare result with Dijkstra — they should match. The exponential cost makes this impractical for large graphs, motivating Dijkstra.",
    testCode: "graph = [[(1,5),(2,2)],[(3,1)],[(1,1),(3,5)],[]]\nresult = cheapest_exhaustive_all(graph, 4, 0)\nassert result == [0, 3, 2, 4]\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "TSP Small via Exhaustive Enumeration", pattern: "permute all visit orders", skill: "enumerate all n! permutations; track min tour cost",
    statement: "Given a complete graph (n cities, distance matrix), find the minimum tour cost visiting all cities exactly once and returning to start (TSP). Enumerate all (n-1)! permutations.",
    examples: [
      { input: "dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]", output: "80", explain: "tour 0->1->3->2->0: 10+25+30+15=80" },
    ],
    why: "TSP is the canonical NP-hard problem. Naive enumeration (all permutations) is O(n!). For n <= 10, this is feasible and gives the correct answer. DP (Held-Karp) brings it to O(n² 2^n).",
    starterCode: "def tsp_naive(dist):\n    import itertools\n    n = len(dist)\n    min_cost = float('inf')\n    cities = list(range(1, n))\n    pass",
    hints: [
      "Generate all permutations of cities 1..n-1 (start at 0, return to 0).",
      "For each permutation: cost = dist[0][perm[0]] + sum(dist[perm[i]][perm[i+1]]) + dist[perm[-1]][0].",
      "Track min cost. O((n-1)!). Works for n <= 10."
    ],
    solution: "def tsp_naive(dist):\n    import itertools\n    n = len(dist)\n    min_cost = float('inf')\n    cities = list(range(1, n))\n    for perm in itertools.permutations(cities):\n        cost = dist[0][perm[0]]\n        for i in range(len(perm) - 1):\n            cost += dist[perm[i]][perm[i+1]]\n        cost += dist[perm[-1]][0]\n        min_cost = min(min_cost, cost)\n    return min_cost",
    walkthrough: "Enumerate all (n-1)! orderings of the n-1 cities (starting and ending at city 0). For each: cost = start→first + intermediate edges + last→start. Track minimum. O(n! * n). For n=10, 9! ≈ 362K — feasible. Beyond that, need DP or heuristics.",
    testCode: "dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]\nassert tsp_naive(dist) == 80\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Traveling Salesman — Held-Karp Motivation", pattern: "enumerate subsets + last node DP", skill: "show that TSP can be improved from O(n!) to O(n² 2^n) using DP on subsets",
    statement: "Implement TSP with DP over subsets: dp[mask][i] = min cost to start from 0, visit exactly cities in mask, and end at city i. This reduces to O(n² 2^n).",
    examples: [
      { input: "dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]", output: "80" },
    ],
    why: "The DP approach (Held-Karp) is still exponential but MUCH better than n!. dp[mask][last] avoids recomputing subproblems — each subset is computed once. For n=10, 2¹⁰ × 10 = 10K states vs 3.6M permutations.",
    starterCode: "def tsp_dp(dist):\n    n = len(dist)\n    dp = [[float('inf')] * n for _ in range(1 << n)]\n    dp[1][0] = 0\n    pass",
    hints: [
      "dp[mask][i]: mask bitmask of visited cities (including 0), currently at i. dp[1][0] = 0.",
      "For each mask and last city i: for each unvisited j not in mask, dp[mask|(1<<j)][j] = min(dp[mask][i] + dist[i][j]).",
      "Answer: min(dp[(1<<n)-1][i] + dist[i][0] for all i) — all cities visited, return to 0."
    ],
    solution: "def tsp_dp(dist):\n    n = len(dist)\n    ALL = (1 << n) - 1\n    dp = [[float('inf')] * n for _ in range(1 << n)]\n    dp[1][0] = 0\n    for mask in range(1 << n):\n        for i in range(n):\n            if not (mask & (1 << i)) or dp[mask][i] == float('inf'):\n                continue\n            for j in range(n):\n                if mask & (1 << j):\n                    continue\n                new_mask = mask | (1 << j)\n                dp[new_mask][j] = min(dp[new_mask][j], dp[mask][i] + dist[i][j])\n    return min(dp[ALL][i] + dist[i][0] for i in range(n))",
    walkthrough: "dp[mask][i] = min cost to visit mask (as bitmask) ending at city i. Start: mask={0}, i=0, cost=0. Build: add city j to mask, cost = existing + dist[i][j]. Finally: tour from last city back to 0. O(2^n * n²). For n=20, 2^20 * 400 ≈ 400M — borderline but far better than 20!",
    testCode: "dist = [[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]\nassert tsp_dp(dist) == 80\nprint('All tests passed!')"
  },

  {
    id: 34, stage: 4, title: "All Pairs Shortest via BFS from Each Node", pattern: "repeat BFS V times", skill: "run BFS from each node as source; collect all-pairs distances. O(V*(V+E)).",
    statement: "Given an unweighted directed graph, compute the shortest distances between ALL pairs of nodes. For each source s (0..n-1), run BFS and collect distances. Return an n×n matrix where dist[i][j] = shortest distance from i to j.",
    examples: [
      { input: "graph: 0->1,1->2,2->0; n=3", output: "dist: [[0,1,2],[2,0,1],[1,2,0]]" },
    ],
    why: "Naive all-pairs: run single-source BFS from each node. Correct (BFS finds shortest on unweighted) but O(V*(V+E)). For weighted graphs, this generalizes to running Dijkstra from each node. Floyd-Warshall (Stage 5) achieves the same in O(V³) with simpler code.",
    starterCode: "def all_pairs_bfs(graph, n):\n    from collections import deque\n    dist = [[float('inf')] * n for _ in range(n)]\n    pass",
    hints: [
      "For each source s: run BFS. dist[s][s] = 0. Queue = [s]. While queue: pop, for each neighbor, if dist[s][neighbor] > dist[s][u]+1, update.",
      "Return n×n matrix. Unreachable pairs stay inf.",
      "For weighted graphs, replace BFS with Dijkstra per source: O(V*(V+E)log V) total."
    ],
    solution: "def all_pairs_bfs(graph, n):\n    from collections import deque\n    dist = [[float('inf')] * n for _ in range(n)]\n    for s in range(n):\n        dist[s][s] = 0\n        queue = deque([s])\n        while queue:\n            u = queue.popleft()\n            for v, _ in graph[u]:\n                if dist[s][u] + 1 < dist[s][v]:\n                    dist[s][v] = dist[s][u] + 1\n                    queue.append(v)\n    return dist",
    walkthrough: "For each source s, run BFS. dist[s][s] = 0. BFS propagates distances. Since graph is unweighted, first visit = shortest. After V BFS runs, matrix is complete. O(V*(V+E)) — fine for small graphs. For dense weighted graphs, Floyd-Warshall (O(V³)) is simpler and handles negative edges without cycles.",
    testCode: "g = [[(1,1)],[(2,1)],[(0,1)]]\nd = all_pairs_bfs(g, 3)\nassert d[0][0] == 0\nassert d[0][2] == 2\nassert d[2][0] == 1\nprint('All tests passed!')",
  },
  {
    id: 35, stage: 4, title: "Count Reachable Nodes via DFS from Each Source", pattern: "DFS from each node, count reachable", skill: "run DFS from each node, track visited; count reachable. O(V*(V+E)).",
    statement: "Given a directed graph, for each node i, count how many nodes are reachable from i (including itself). Naive: run DFS from each node. Return list of counts.",
    examples: [
      { input: "graph: 0->1,0->2,1->2; n=3", output: "[3,1,1]", explain: "node 0 reaches {0,1,2}; node 1 reaches {1}; node 2 reaches {2}" },
    ],
    why: "Reachability is the unweighted all-pairs problem. Naive DFS-from-each-node is O(V*(V+E)). For transitive closure (which nodes can reach which), Floyd-Warshall provides a simpler O(V³) solution — using boolean matrix OR instead of min.",
    starterCode: "def reachable_counts(graph, n):\n    counts = [0] * n\n    def dfs(node, visited):\n        pass\n    pass",
    hints: [
      "For each source i: visited set = {i}. DFS from i: for each neighbor, if not visited, add and recurse.",
      "After DFS, counts[i] = len(visited).",
      "For large graphs, Floyd-Warshall with boolean OR computes all-pairs reachability in O(V³)."
    ],
    solution: "def reachable_counts(graph, n):\n    counts = [0] * n\n    for i in range(n):\n        visited = set()\n        def dfs(node):\n            visited.add(node)\n            for v, _ in graph[node]:\n                if v not in visited:\n                    dfs(v)\n        dfs(i)\n        counts[i] = len(visited)\n    return counts",
    walkthrough: "DFS from each node. Track visited set. The size of visited = reachable count. For dense graphs, O(V*(V+E)) ≈ O(V³). Floyd-Warshall solves this more elegantly: reachable[i][j] = reachable[i][j] OR (reachable[i][k] AND reachable[k][j]).",
    testCode: "g = [[(1,1),(2,1)],[(2,1)],[]]\nassert reachable_counts(g, 3) == [3, 1, 1]\nprint('All tests passed!')",
  },
  // ── STAGE 5: Optimization II ──
  {
    id: 36, stage: 5, title: "Bellman-Ford for Negative Weights", pattern: "relax all edges V-1 times", skill: "each pass propagates distances one edge further. After V-1 passes, distances are final (if no negative cycles).",
    statement: "Given a weighted directed graph (may have negative edges, no negative cycles), find shortest distances from source. Bellman-Ford: relax ALL edges V-1 times. Each pass extends shortest paths by one edge.",
    examples: [
      { input: "edges: 0->1(5),0->2(4),1->3(3),2->1(-2),3->2(2); source=0", output: "[0,2,4,5]" },
    ],
    why: "Dijkstra fails with negative edges (greedy frontier assumption breaks). Bellman-Ford doesn't assume non-negative weights — it just repeatedly relaxes all edges. V-1 passes guarantee correctness (no path has > V-1 edges).",
    starterCode: "def bellman_ford(edges, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    pass",
    hints: [
      "Repeat V-1 times: for each edge (u,v,w), if dist[u] + w < dist[v], dist[v] = dist[u] + w.",
      "Edges can be processed in any order — the repeated passes handle propagation.",
      "After V-1 passes, distances are correct IF no negative cycles. Run one more pass to detect negative cycles."
    ],
    solution: "def bellman_ford(edges, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n    return dist",
    walkthrough: "Initialize dist[source]=0. For V-1 iterations, relax every edge: if dist[u] + w < dist[v], update. After pass 1, all 1-edge paths correct. After pass 2, all 2-edge paths correct. After V-1 passes, all paths (max V-1 edges) are correct. O(V*E). Handles negative edges but NOT negative cycles.",
    testCode: "edges = [(0,1,5),(0,2,4),(1,3,3),(2,1,-2),(3,2,2)]\nassert bellman_ford(edges, 4, 0) == [0,2,4,5]\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Detect Negative Cycle", pattern: "V-th iteration of Bellman-Ford", skill: "after V-1 passes, run one more pass. If any distance decreases, negative cycle exists.",
    statement: "Extend Bellman-Ford to detect negative cycles. After V-1 relaxation passes, run one MORE pass. If ANY distance decreases, there is a negative cycle reachable from source.",
    examples: [
      { input: "edges: 0->1(1),1->2(-1),2->0(-1); n=3, source=0", output: "True (negative cycle: 0→1→2→0 = -1)" },
      { input: "edges: 0->1(1),1->2(2),2->0(3); n=3, source=0", output: "False (no negative cycle)" },
    ],
    why: "If shortest paths can always be improved (V-th pass changes something), there's a cycle whose total weight is negative. Walking around it reduces distance without bound.",
    starterCode: "def has_negative_cycle(edges, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    pass",
    hints: [
      "Run V-1 passes (standard Bellman-Ford). Then run one more pass.",
      "In the V-th pass, if any dist[u] + w < dist[v] occurs, there's a negative cycle reachable from source.",
      "Return True if any update happens in V-th pass, False otherwise."
    ],
    solution: "def has_negative_cycle(edges, n, source):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n    for u, v, w in edges:\n        if dist[u] + w < dist[v]:\n            return True\n    return False",
    walkthrough: "V-1 passes settle distances assuming no negative cycles. A V-th pass tests: is there still a 'shorter' path? If yes, some cycle has net negative weight — walking it reduces distance infinitely. O(V*E) for V passes.",
    testCode: "assert has_negative_cycle([(0,1,1),(1,2,-1),(2,0,-1)], 3, 0) == True\nassert has_negative_cycle([(0,1,1),(1,2,2),(2,0,3)], 3, 0) == False\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Shortest Path with Limited Edges", pattern: "Bellman-Ford with edge limit", skill: "limit to k passes; after k passes, distances reflect paths with at most k edges",
    statement: "Given graph and integer k, find shortest distances from source using AT MOST k edges. Bellman-Ford with k passes (instead of V-1). This is the generalization of cheapest-flights problem.",
    examples: [
      { input: "edges: 0->1(1),1->2(1),0->2(5); source=0, k=1", output: "dist[2]=5 (via direct edge), not 2 (which needs 2 edges)" },
    ],
    why: "Each Bellman-Ford pass extends paths by one edge. With k passes, paths are limited to k edges. This naturally solves problems with hop/stop constraints.",
    starterCode: "def shortest_path_k_edges(edges, n, source, k):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    pass",
    hints: [
      "Run exactly k iterations. In each: make a copy of dist, then relax all edges against the copy.",
      "Using a copy prevents using results from the same pass for subsequent edges in the same pass.",
      "After k passes, distances reflect paths with ≤ k edges."
    ],
    solution: "def shortest_path_k_edges(edges, n, source, k):\n    dist = [float('inf')] * n\n    dist[source] = 0\n    for _ in range(k):\n        temp = dist[:]\n        for u, v, w in edges:\n            if dist[u] + w < temp[v]:\n                temp[v] = dist[u] + w\n        dist = temp\n    return dist",
    walkthrough: "Bellman-Ford with copy-per-pass (instead of in-place). The copy ensures that within one pass, edge relaxations don't cascade — each pass's new distances are based on the PREVIOUS pass. This limits path length to k edges exactly. O(k*E).",
    testCode: "edges = [(0,1,1),(1,2,1),(0,2,5)]\nresult = shortest_path_k_edges(edges, 3, 0, 1)\nassert result[2] == 5\nresult2 = shortest_path_k_edges(edges, 3, 0, 2)\nassert result2[2] == 2\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Shortest Path in Graph with Negatives (No Negative Cycles)", pattern: "Bellman-Ford on graph with negative weights", skill: "use Bellman-Ford when negative edges exist Di but no negative cycles",
    statement: "Given a directed graph with negative edge weights (but no negative cycles, verified), compute shortest path from source to all nodes using Bellman-Ford. Then reconstruct path to target.",
    examples: [
      { input: "edges with negative weights, source=0, target=3", output: "shortest distances and path" },
    ],
    why: "Real-world problems (financial arbitrage, energy-cost optimization) often have negative edges. Bellman-Ford handles them. Dijkstra cannot — negative edges break the 'settled node' guarantee.",
    starterCode: "def shortest_with_negatives(edges, n, source, target):\n    dist = [float('inf')] * n\n    parent = [-1] * n\n    dist[source] = 0\n    pass",
    hints: [
      "Run Bellman-Ford (V-1 passes) with parent tracking. After each relaxation, set parent[v]=u.",
      "After V-1 passes, verify no negative cycle (one extra pass). If detected, raise error.",
      "Reconstruct path from target using parent pointers. Return (dist[target], path)."
    ],
    solution: "def shortest_with_negatives(edges, n, source, target):\n    dist = [float('inf')] * n\n    parent = [-1] * n\n    dist[source] = 0\n    for _ in range(n - 1):\n        for u, v, w in edges:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                parent[v] = u\n    for u, v, w in edges:\n        if dist[u] + w < dist[v]:\n            return None, []\n    path = []\n    cur = target\n    while cur != -1:\n        path.append(cur)\n        cur = parent[cur]\n    return dist[target], path[::-1]",
    walkthrough: "Bellman-Ford with parent tracking. After V-1 passes, check for negative cycles. If none, reconstruct path. This is the most general single-source shortest path algorithm (handles any weights, any edge direction, as long as no negative cycles).",
    testCode: "edges = [(0,1,4),(0,2,1),(2,1,-3),(1,3,2)]\ncost, path = shortest_with_negatives(edges, 4, 0, 3)\nassert cost == 3\nassert path == [0,2,1,3]\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Network Delay Time", pattern: "Dijkstra for max distance", skill: "run Dijkstra from source; answer = max distance to any node",
    statement: "Given n nodes and directed weighted edges (signal travel times), signal starts at node k. How long until all nodes receive it? Run Dijkstra from k; return max distance. If any node unreachable, return -1.",
    examples: [
      { input: "times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2", output: "2", explain: "2->1(1),2->3(1),3->4(2) — max=2" },
      { input: "times=[[1,2,1]], n=2, k=2", output: "-1", explain: "any unreachable from k" },
    ],
    why: "Network delay = max of all shortest path distances from source. Dijkstra computes all distances. If any is inf, signal can't reach that node. Return max otherwise.",
    starterCode: "def network_delay_time(times, n, k):\n    import heapq\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u, v, w in times:\n        graph[u-1].append((v-1, w))\n    pass",
    hints: [
      "Build adjacency list (convert 1-indexed to 0-indexed). Run Dijkstra from k-1.",
      "After Dijkstra: if any dist[i] == inf, return -1.",
      "Answer: max(dist) because we want the time when ALL nodes have received the signal."
    ],
    solution: "def network_delay_time(times, n, k):\n    import heapq\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u, v, w in times:\n        graph[u-1].append((v-1, w))\n    dist = [float('inf')] * n\n    dist[k-1] = 0\n    heap = [(0, k-1)]\n    while heap:\n        d, u = heapq.heappop(heap)\n        if d > dist[u]:\n            continue\n        for v, w in graph[u]:\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                heapq.heappush(heap, (dist[v], v))\n    max_dist = max(dist)\n    return max_dist if max_dist < float('inf') else -1",
    walkthrough: "Dijkstra from source k-1. After completion, check all reachable (dist != inf). The max distance is the time the last node receives the signal. If any node unreachable, return -1. O((V+E) log V).",
    testCode: "assert network_delay_time([[2,1,1],[2,3,1],[3,4,1]], 4, 2) == 2\nassert network_delay_time([[1,2,1]], 2, 2) == -1\nassert network_delay_time([[1,2,1],[2,3,2],[1,3,4]], 3, 1) == 3\nprint('All tests passed!')"
  },

  {
    id: 41, stage: 5, title: "Transitive Closure (Floyd-Warshall Boolean)", pattern: "Floyd-Warshall with OR/AND", skill: "reachable[i][j] = reachable[i][j] or (reachable[i][k] and reachable[k][j])",
    statement: "Given a directed graph, compute transitive closure: reachable[i][j] = True if there exists a path from i to j. Use Floyd-Warshall: for each intermediate k, for each pair (i,j), reachable[i][j] |= reachable[i][k] and reachable[k][j].",
    examples: [
      { input: "graph: 0->1,1->2,2->0; n=3", output: "all True (every node reachable from every other)" },
      { input: "graph: 0->1,1->2; n=3", output: "reachable[0][2]=True, but reachable[2][0]=False" },
    ],
    why: "Transitive closure = all-pairs reachability. Floyd-Warshall generalizes: replace min(+,+) with OR(AND,AND) and inf with False. The same triple-nested loop structure works for ANY closed semiring. This reveals Floyd-Warshall as a template, not just a shortest-path algorithm.",
    starterCode: "def transitive_closure(graph, n):\n    reach = [[False] * n for _ in range(n)]\n    for i in range(n):\n        reach[i][i] = True\n        for v, _ in graph[i]:\n            reach[i][v] = True\n    pass",
    hints: [
      "Initialize: direct edges = True. reach[i][i] = True (node reaches itself).",
      "Triple loop: for k, i, j: reach[i][j] |= reach[i][k] and reach[k][j].",
      "This is Floyd-Warshall where AND replaces + and OR replaces min. O(V³)."
    ],
    solution: "def transitive_closure(graph, n):\n    reach = [[False] * n for _ in range(n)]\n    for i in range(n):\n        reach[i][i] = True\n        for v, _ in graph[i]:\n            reach[i][v] = True\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if reach[i][k] and reach[k][j]:\n                    reach[i][j] = True\n    return reach",
    walkthrough: "Initialize reachability with direct edges and self-loops. Triple loop: if i can reach k and k can reach j, then i can reach j. After processing all intermediate nodes k, reach[i][j] is true iff a path exists. O(V³). This is the explicit semiring version of Floyd-Warshall.",
    testCode: "g = [[(1,1)],[(2,1)],[(0,1)]]\nreach = transitive_closure(g, 3)\nassert all(reach[i][j] for i in range(3) for j in range(3))\ng2 = [[(1,1)],[(2,1)],[]]\nreach2 = transitive_closure(g2, 3)\nassert reach2[0][2] == True\nassert reach2[2][0] == False\nprint('All tests passed!')",
  },
  {
    id: 42, stage: 5, title: "Find the City — Within Threshold Distance", pattern: "Floyd-Warshall + count reachable within threshold", skill: "compute all-pairs shortest; for each city, count reachable cities within threshold; return city with min count",
    statement: "Given n cities and weighted undirected edges, find the city with the smallest number of reachable cities within distance threshold. If tie, return the city with the largest index. Use Floyd-Warshall for all-pairs distances.",
    examples: [
      { input: "n=4, edges=[[0,1,3],[1,2,1],[2,3,1],[0,3,4]], threshold=4", output: "3", explain: "city 3 reaches {2,3,0} within 4 (3 cities). city 0 reaches {0,1,2} (3). Tie → larger index=3." },
    ],
    why: "Floyd-Warshall application. All-pairs shortest, then for each city count neighbors within threshold. Combine Floyd-Warshall + simple counting. The tiebreaker (largest index) is a LeetCode classic (Find the City With the Smallest Number of Neighbors).",
    starterCode: "def find_the_city(n, edges, threshold):\n    dist = [[float('inf')] * n for _ in range(n)]\n    for i in range(n):\n        dist[i][i] = 0\n    for u, v, w in edges:\n        dist[u][v] = dist[v][u] = w\n    pass",
    hints: [
      "Floyd-Warshall: for k, i, j: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).",
      "For each city i: count cities j where dist[i][j] <= threshold and i != j.",
      "Return city with minimum count; tie → larger index."
    ],
    solution: "def find_the_city(n, edges, threshold):\n    dist = [[float('inf')] * n for _ in range(n)]\n    for i in range(n):\n        dist[i][i] = 0\n    for u, v, w in edges:\n        dist[u][v] = dist[v][u] = w\n    for k in range(n):\n        for i in range(n):\n            for j in range(n):\n                if dist[i][k] + dist[k][j] < dist[i][j]:\n                    dist[i][j] = dist[i][k] + dist[k][j]\n    best_city = 0\n    min_count = n\n    for i in range(n):\n        count = sum(1 for j in range(n) if i != j and dist[i][j] <= threshold)\n        if count <= min_count:\n            min_count = count\n            best_city = i\n    return best_city",
    walkthrough: "Floyd-Warshall O(n³). After computing all distances: for each city i, count neighbors within threshold. Track minimum count; on tie, update to larger index (since we iterate 0..n-1, <= handles ties correctly). O(n³ + n²).",
    testCode: "edges = [[0,1,3],[1,2,1],[2,3,1],[0,3,4]]\nassert find_the_city(4, edges, 4) == 3\nedges2 = [[0,1,2],[0,2,1],[1,2,1],[2,3,1]]\nassert find_the_city(4, edges2, 2) == 3\nprint('All tests passed!')",
  },
  // ── STAGE 6: Mastery ──
  {
    id: 43, stage: 6, title: "Swim in Rising Water (Binary Search + BFS)", pattern: "binary search on water level + BFS connectivity", skill: "check if path exists at given water level; binary search for minimum level",
    statement: "Given an n×n grid where grid[r][c] = elevation; water rises by one unit per time. You can swim to cells where water level <= time. Find min time to go from (0,0) to (n-1,n-1). Binary search time, BFS for reachability.",
    examples: [
      { input: "grid = [[0,2],[1,3]]", output: "3" },
      { input: "grid = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]", output: "16" },
    ],
    why: "Compose: binary search (BST topic) + BFS connectivity check (Graph basics). Binary search over the water level. For each level, BFS to check if a path exists. Time is monotonic: if path exists at level t, it exists at t+1.",
    starterCode: "def swim_in_water(grid):\n    from collections import deque\n    n = len(grid)\n    def can_reach(t):\n        pass\n    pass",
    hints: [
      "Binary search on [grid[0][0], n*n-1]. Check can_reach(t): BFS from (0,0), only cells with elevation <= t are passable.",
      "If (n-1,n-1) reachable at time t, try smaller time. Else try larger.",
      "grid[0][0] is the min starting water level."
    ],
    solution: "def swim_in_water(grid):\n    from collections import deque\n    n = len(grid)\n    def can_reach(t):\n        if grid[0][0] > t:\n            return False\n        visited = [[False]*n for _ in range(n)]\n        q = deque([(0,0)])\n        visited[0][0] = True\n        dirs = [(1,0),(-1,0),(0,1),(0,-1)]\n        while q:\n            r,c = q.popleft()\n            if r==n-1 and c==n-1:\n                return True\n            for dr,dc in dirs:\n                nr,nc = r+dr,c+dc\n                if 0<=nr<n and 0<=nc<n and not visited[nr][nc] and grid[nr][nc]<=t:\n                    visited[nr][nc]=True\n                    q.append((nr,nc))\n        return False\n    lo,hi = grid[0][0], n*n-1\n    while lo < hi:\n        mid = (lo+hi)//2\n        if can_reach(mid):\n            hi = mid\n        else:\n            lo = mid+1\n    return lo",
    walkthrough: "Binary search on water level t. can_reach(t): BFS from (0,0) to (n-1,n-1) where grid[r][c] <= t. The condition is monotonic — if reachable at t, reachable at t+1. Binary search finds minimum t. Compose: binary search (BST Stage 0) + BFS (Graphs). O(n² log n).",
    testCode: "assert swim_in_water([[0,2],[1,3]]) == 3\ngrid2 = [[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]\nassert swim_in_water(grid2) == 16\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Path with Minimum Effort (Dijkstra Variant)", pattern: "Dijkstra on max-edge-difference", skill: "Dijkstra where cost is max(|h1-h2|) seen so far (not sum)",
    statement: "Given heights grid, effort from (r1,c1) to (r2,c2) = |h[r1][c1] - h[r2][c2]|. Path effort = MAX difference on path. Find min effort from (0,0) to (n-1,n-1). Use Dijkstra: dist = min max-difference to cell.",
    examples: [
      { input: "heights = [[1,2,2],[3,8,2],[5,3,5]]", output: "2", explain: "1->2->2->2->5 with max diff 2" },
      { input: "heights = [[1,2,3],[3,8,4],[5,3,5]]", output: "1" },
    ],
    why: "Dijkstra template (Stage 1) with different relaxation: dist[v] = min(dist[v], max(dist[u], edge_cost)). This is the 'minimax path' — same as bottleneck path (P8) but with max instead of min.",
    starterCode: "def minimum_effort(heights):\n    import heapq\n    rows, cols = len(heights), len(heights[0])\n    dist = [[float('inf')]*cols for _ in range(rows)]\n    dist[0][0] = 0\n    heap = [(0,0,0)]\n    pass",
    hints: [
      "Use Dijkstra. dist[r][c] = min max-difference on any path to (r,c).",
      "Relaxation: for neighbor (nr,nc), new_effort = max(dist[r][c], abs(h[r][c] - h[nr][nc])). If new_effort < dist[nr][nc], update.",
      "Return dist[rows-1][cols-1]."
    ],
    solution: "def minimum_effort(heights):\n    import heapq\n    rows, cols = len(heights), len(heights[0])\n    dist = [[float('inf')]*cols for _ in range(rows)]\n    dist[0][0] = 0\n    heap = [(0,0,0)]\n    dirs = [(1,0),(-1,0),(0,1),(0,-1)]\n    while heap:\n        d, r, c = heapq.heappop(heap)\n        if d > dist[r][c]:\n            continue\n        if r == rows-1 and c == cols-1:\n            return d\n        for dr, dc in dirs:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols:\n                new_effort = max(d, abs(heights[r][c] - heights[nr][nc]))\n                if new_effort < dist[nr][nc]:\n                    dist[nr][nc] = new_effort\n                    heapq.heappush(heap, (new_effort, nr, nc))\n    return dist[rows-1][cols-1]",
    walkthrough: "Dijkstra on a graph where edge weight = |height difference|. Path cost = MAX edge weight on the path (not sum). Relaxation: dist[v] = min(dist[v], max(dist[u], edge_weight)). This generalizes bottleneck paths. Compose: Dijkstra template + custom cost aggregation.",
    testCode: "assert minimum_effort([[1,2,2],[3,8,2],[5,3,5]]) == 2\nassert minimum_effort([[1,2,3],[3,8,4],[5,3,5]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Cheapest Flights — Bellman-Ford with K Stops", pattern: "Bellman-Ford limited passes", skill: "use Bellman-Ford with k+1 passes (BFS levels) for stop-constrained shortest path",
    statement: "Given flights and max k stops, find cheapest price or -1. Use Bellman-Ford with k+1 passes (each pass = one more stop). Same as P10 but now you've seen the theory.",
    examples: [
      { input: "n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], src=0, dst=3, k=1", output: "700" },
    ],
    why: "Cheapest flights = Bellman-Ford with limited passes. Each pass represents one more stop (one more edge in the path). This connects Stage 1's BFS approach to the theoretical Bellman-Ford framework.",
    starterCode: "def cheapest_flights_bf(n, flights, src, dst, k):\n    costs = [float('inf')] * n\n    costs[src] = 0\n    pass",
    hints: [
      "Run k+1 iterations of Bellman-Ford (copy costs per iteration to limit path length).",
      "For each iteration: copy costs. For each edge u,v,w: if costs[u] + w < temp[v], temp[v] = costs[u] + w.",
      "After k+1 iterations: return costs[dst] if < inf else -1."
    ],
    solution: "def cheapest_flights_bf(n, flights, src, dst, k):\n    costs = [float('inf')] * n\n    costs[src] = 0\n    for _ in range(k + 1):\n        temp = costs[:]\n        for u, v, w in flights:\n            if costs[u] + w < temp[v]:\n                temp[v] = costs[u] + w\n        costs = temp\n    return costs[dst] if costs[dst] < float('inf') else -1",
    walkthrough: "Bellman-Ford with k+1 passes (exactly P28). Copy costs per pass to prevent cascade within one pass. Each pass extends paths by one edge = one flight. After k+1 passes, costs[dst] is cheapest with at most k stops (k+1 flights). O(k*E).",
    testCode: "flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]\nassert cheapest_flights_bf(4, flights, 0, 3, 1) == 700\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Find Critical and Pseudo-Critical Edges in MST", pattern: "MST with edge bypass", skill: "an edge is critical if removing it increases MST weight",
    statement: "Given weighted undirected graph, find (1) critical edges (appears in ALL MSTs), (2) pseudo-critical edges (appears in SOME MST but not all). Strategy: run Kruskal without the edge — if weight increases, it's critical. If same weight but edge was used in a different MST, pseudo-critical.",
    examples: [
      { input: "n=5, edges=[[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]", output: "[[0,1,2,3,4,5,6]]", explain: "critical=[0,1,2,3], pseudo-critical=[4,5,6]" },
    ],
    why: "Compose MST (Stage 3) + edge classification. Remove an edge, recompute MST — this tests its necessity. Force-include an edge, recompute MST — tests its compatibility. Each check runs Kruskal O(E log E).",
    starterCode: "def find_critical_pseudo_critical(n, edges):\n    def mst_weight(skip_edge, force_edge):\n        pass\n    pass",
    hints: [
      "Write mst_weight(skip_edge=-1, force_edge=-1): run Kruskal, skip the given edge, force-include the given edge.",
      "For each edge i: compute weight without it (skip=i). If weight > reference_mst (computed normally) OR graph becomes disconnected, edge i is critical.",
      "Pseudo-critical: NOT critical, but there exists an MST that includes it. Force include it, compute MST weight. If same as reference, pseudo-critical."
    ],
    solution: "def find_critical_pseudo_critical(n, edges):\n    def kruskal_weight(skip=-1, force=-1):\n        parent = list(range(n))\n        rank = [0]*n\n        def find(x):\n            if parent[x]!=x: parent[x]=find(parent[x])\n            return parent[x]\n        def union(x,y):\n            rx,ry=find(x),find(y)\n            if rx==ry: return False\n            if rank[rx]<rank[ry]: parent[rx]=ry\n            elif rank[rx]>rank[ry]: parent[ry]=rx\n            else: parent[rx]=ry; rank[ry]+=1\n            return True\n        w = 0\n        if force!=-1:\n            u,v,ew = edges[force]\n            union(u,v); w+=ew\n        for i,(u,v,ew) in enumerate(edges):\n            if i==skip: continue\n            if union(u,v): w+=ew\n        root=find(0)\n        if any(find(i)!=root for i in range(n)): return float('inf')\n        return w\n    ref = kruskal_weight()\n    critical=[]\n    pseudo=[]\n    for i in range(len(edges)):\n        if kruskal_weight(skip=i) > ref:\n            critical.append(i)\n        elif kruskal_weight(force=i) == ref:\n            pseudo.append(i)\n    return [critical, pseudo]",
    walkthrough: "Reference MST weight computed normally. Critical: removing the edge makes MST weight increase or graph disconnected. Pseudo-critical: NOT critical, but forcing it into MST still yields same total weight. Each check runs Kruskal — O(E² log E). Compose: MST (Kruskal) + parameterized runs.",
    testCode: "edges = [[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]\nc, p = find_critical_pseudo_critical(5, edges)\nassert len(c) == 3\nassert len(p) == 2\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Reconstruct Itinerary", pattern: "Eulerian path via DFS + greedy lexical order", skill: "find Eulerian path in directed graph; sort destinations, DFS, build path in reverse",
    statement: "Given tickets [from, to] reconstruct itinerary (all tickets exactly once), starting from 'JFK'. If multiple valid, return lexical smallest. Use Hierholzer's algorithm: build graph, sort destinations, DFS, push node after all edges explored.",
    examples: [
      { input: "tickets=[['MUC','LHR'],['JFK','MUC'],['SFO','SJC'],['LHR','SFO']]", output: "['JFK','MUC','LHR','SFO','SJC']" },
      { input: "tickets=[['JFK','SFO'],['JFK','ATL'],['SFO','ATL'],['ATL','JFK'],['ATL','SFO']]", output: "['JFK','ATL','JFK','SFO','ATL','SFO']" },
    ],
    why: "Eulerian path problem in a directed graph. Each ticket is an edge; use each exactly once. Hierholzer's: build graph, sort destinations descending for min-lex (pop from end), DFS. Append node after all its edges are exhausted. Reverse result.",
    starterCode: "def find_itinerary(tickets):\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u, v in sorted(tickets, reverse=True):\n        graph[u].append(v)\n    route = []\n    def dfs(airport):\n        pass\n    dfs('JFK')\n    return route[::-1]",
    hints: [
      "Build adjacency list; for each from, sort destinations in REVERSE lexical order (so pop() gives smallest).",
      "DFS: while graph[node] is not empty, pop the last destination and recurse. After the while loop, append node to route.",
      "Reverse route at end. This is Hierholzer's algorithm for Eulerian path."
    ],
    solution: "def find_itinerary(tickets):\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for u, v in sorted(tickets, reverse=True):\n        graph[u].append(v)\n    route = []\n    def dfs(airport):\n        while graph[airport]:\n            dfs(graph[airport].pop())\n        route.append(airport)\n    dfs('JFK')\n    return route[::-1]",
    walkthrough: "Graph: each from→to as edge. Sort destinations in reverse lexical so pop() picks smallest first. DFS from 'JFK': exhaust all edges from a node before appending it. The result reversed is the Eulerian path. This is Hierholzer's algorithm — exactly O(E) for the DFS traversal.",
    testCode: "t1 = [['MUC','LHR'],['JFK','MUC'],['SFO','SJC'],['LHR','SFO']]\nassert find_itinerary(t1) == ['JFK','MUC','LHR','SFO','SJC']\nt2 = [['JFK','SFO'],['JFK','ATL'],['SFO','ATL'],['ATL','JFK'],['ATL','SFO']]\nassert find_itinerary(t2) == ['JFK','ATL','JFK','SFO','ATL','SFO']\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Strongly Connected Components — Kosaraju", pattern: "two-pass DFS", skill: "first pass: DFS and push to stack on finish. Second pass: DFS on reversed graph in stack pop order. Each DFS tree = one SCC.",
    statement: "Given a directed graph, find all strongly connected components (SCCs). Kosaraju's algorithm: (1) DFS on original graph, push nodes to stack on finish. (2) Reverse all edges. (3) Pop from stack: DFS on reversed graph; each DFS tree is one SCC.",
    examples: [
      { input: "graph: 0→1,1→2,2→0,2→3,3→4,4→3; n=5", output: "SCCs: [{0,1,2}, {3,4}]" },
      { input: "graph: 0→1,1→2,2→3; n=4", output: "SCCs: [{0},{1},{2},{3}] (no cycles)" },
    ],
    why: "SCCs are fundamental components of directed graphs — within an SCC, every node reaches every other. Kosaraju uses two DFS passes: first to get a 'finishing order,' second on the reversed graph to extract components. Elegant proof: a sink SCC in the original is a source SCC in the reversed graph.",
    starterCode: "def kosaraju_scc(graph, n):\n    stack = []\n    visited = [False] * n\n    def dfs1(u):\n        pass\n    reversed_g = [[] for _ in range(n)]\n    pass",
    hints: [
      "First DFS: visited[u]=True, recurse all neighbors, then stack.append(u) — push AFTER recursion (postorder).",
      "Reverse graph: for each u→v, add reversed_g[v]←u. Second DFS: pop from stack; if not visited2, DFS on reversed graph.",
      "Each second DFS tree = one SCC. Collect components as lists."
    ],
    solution: "def kosaraju_scc(graph, n):\n    visited = [False] * n\n    stack = []\n    def dfs1(u):\n        visited[u] = True\n        for v, _ in graph[u]:\n            if not visited[v]:\n                dfs1(v)\n        stack.append(u)\n    for i in range(n):\n        if not visited[i]:\n            dfs1(i)\n    reversed_g = [[] for _ in range(n)]\n    for u in range(n):\n        for v, _ in graph[u]:\n            reversed_g[v].append((u, 1))\n    visited2 = [False] * n\n    components = []\n    def dfs2(u, comp):\n        visited2[u] = True\n        comp.append(u)\n        for v, _ in reversed_g[u]:\n            if not visited2[v]:\n                dfs2(v, comp)\n    while stack:\n        u = stack.pop()\n        if not visited2[u]:\n            comp = []\n            dfs2(u, comp)\n            components.append(comp)\n    return components",
    walkthrough: "Kosaraju: 1st DFS on original graph pushes nodes to stack in finish order (postorder). 2nd DFS on reversed graph processes nodes in reverse finish order (pop from stack). Each DFS tree in the second pass = one SCC. Why: edges between SCCs go one way in the original, so in the reversed graph, sink SCCs become sources and are discovered first. O(V+E).",
    testCode: "g = [[(1,1)],[(2,1)],[(0,1),(3,1)],[(4,1)],[(3,1)]]\ncomps = kosaraju_scc(g, 5)\nassert len(comps) == 2\nsizes = sorted([len(c) for c in comps])\nassert sizes == [2, 3]\nprint('All tests passed!')",
  },
  {
    id: 49, stage: 6, title: "Find Bridges (Critical Connections)", pattern: "Tarjan's bridge-finding with discovery/low", skill: "DFS with disc[u] (discovery time) and low[u] (lowest discovery reachable without using back-edge); edge (u,v) is bridge if low[v] > disc[u]",
    statement: "Given an undirected connected graph, find all bridges (edges whose removal disconnects the graph). Tarjan's algorithm: DFS, track discovery time and 'low' value. For edge (parent→child): if low[child] > disc[parent], it's a bridge.",
    examples: [
      { input: "graph: 0-1,1-2,2-0,1-3; n=4", output: "[[1,3]]", explain: "edge 1-3 is the only bridge" },
      { input: "graph: 0-1,1-2,2-3; n=4", output: "[[0,1],[1,2],[2,3]] — all edges are bridges" },
    ],
    why: "Bridges = critical edges. Tarjan's one-pass DFS with discovery/low times finds them in O(V+E). Compose: DFS traversal (graph basics) + time tracking + parent awareness. The core insight: low[v] > disc[u] means v (and its descendants) cannot reach u or above without the edge (u,v).",
    starterCode: "def find_bridges(graph, n):\n    disc = [-1] * n\n    low = [-1] * n\n    time = [0]\n    bridges = []\n    def dfs(u, parent):\n        pass\n    dfs(0, -1)\n    return bridges",
    hints: [
      "Assign disc[u]=low[u]=time++. For each neighbor v: if v==parent, skip. If disc[v]==-1 (not visited): dfs(v,u); then low[u]=min(low[u],low[v]); if low[v] > disc[u], (u,v) is a bridge.",
      "If disc[v] != -1 (back edge): low[u] = min(low[u], disc[v]) — not low[v].",
      "low[u] = lowest discovery time reachable from u's subtree using at most one back edge."
    ],
    solution: "def find_bridges(graph, n):\n    disc = [-1] * n\n    low = [-1] * n\n    time = [0]\n    bridges = []\n    def dfs(u, parent):\n        disc[u] = low[u] = time[0]\n        time[0] += 1\n        for v, _ in graph[u]:\n            if v == parent:\n                continue\n            if disc[v] == -1:\n                dfs(v, u)\n                low[u] = min(low[u], low[v])\n                if low[v] > disc[u]:\n                    bridges.append([u, v])\n            else:\n                low[u] = min(low[u], disc[v])\n    dfs(0, -1)\n    return bridges",
    walkthrough: "DFS assigns discovery times. low[u] = min discovery time reachable from u (or its descendants) without going back through the same edge. When we return from child v: if low[v] > disc[u], the edge (u,v) is a bridge — v can't reach u or above without it. For back edges: low[u] = min(low[u], disc[v]). O(V+E).",
    testCode: "g = [[(1,1),(2,1)],[(0,1),(2,1),(3,1)],[(0,1),(1,1)],[(1,1)]]\nbridges = find_bridges(g, 4)\nassert [1,3] in bridges or [3,1] in bridges\ng2 = [[(1,1)],[(0,1),(2,1)],[(1,1),(3,1)],[(2,1)]]\nbridges2 = find_bridges(g2, 4)\nassert len(bridges2) == 3\nprint('All tests passed!')",
  },
  {
    id: 50, stage: 6, title: "Maximum Bipartite Matching (DFS Augmenting Path)", pattern: "alternating DFS for matching", skill: "try to find augmenting path from each left node; if found, increase matching. Use matchR[] and visited per DFS.",
    statement: "Given a bipartite graph (left set size m, right set size n) as adjacency list from left nodes, find maximum matching size. For each left node, DFS to find augmenting path: try to match to an unassigned right node or reassign a matched left node.",
    examples: [
      { input: "left=[[0],[0,1],[1,2],[2]]", output: "3", explain: "maximum matched pairs = 3" },
      { input: "left=[[0],[0,1]]", output: "2" },
    ],
    why: "Maximum bipartite matching is a fundamental graph optimization. The DFS augmenting path algorithm (Kuhn's/Hungarian for unweighted) builds the matching greedily, then improves it via alternating paths. Compose: DFS (graph basics) + matching state + recursion. Foundation for assignment problems.",
    starterCode: "def max_bipartite_matching(adj, m, n):\n    matchR = [-1] * n\n    def dfs(u, visited):\n        pass\n    result = 0\n    pass",
    hints: [
      "For each left node i (0..m-1): visited = [False]*n. If dfs(i, visited) returns True, result++.",
      "dfs(u, visited): for each right node v in adj[u]: if not visited[v]: visited[v]=True; if matchR[v]==-1 or dfs(matchR[v], visited): matchR[v]=u; return True.",
      "Return False if no augmenting path found. matchR[v] stores which left node is currently matched to right node v."
    ],
    solution: "def max_bipartite_matching(adj, m, n):\n    matchR = [-1] * n\n    def dfs(u, visited):\n        for v in adj[u]:\n            if not visited[v]:\n                visited[v] = True\n                if matchR[v] == -1 or dfs(matchR[v], visited):\n                    matchR[v] = u\n                    return True\n        return False\n    result = 0\n    for i in range(m):\n        visited = [False] * n\n        if dfs(i, visited):\n            result += 1\n    return result",
    walkthrough: "For each left node, try to find an augmenting path: an alternating path that starts at an unmatched left node and ends at an unmatched right node. DFS explores right neighbors; if a right node is free, match. If occupied, try to reassign its matched left node recursively. Each successful DFS increases matching by 1. O(m * E) — can be improved to O(sqrt(V) * E) with Hopcroft-Karp.",
    testCode: "adj = [[0],[0,1],[1,2],[2]]\nassert max_bipartite_matching(adj, 4, 3) == 3\nadj2 = [[0],[0,1]]\nassert max_bipartite_matching(adj2, 2, 2) == 2\nprint('All tests passed!')",
  },
]
