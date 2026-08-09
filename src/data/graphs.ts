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

export const STAGES_GRAPHS = [
  { id: 0, name: "Arbitrary-Structure Reflex", desc: "no root, cycles" },
  { id: 1, name: "Representation", desc: "adjacency list vs matrix" },
  { id: 2, name: "The Two Walks", desc: "DFS/BFS" },
  { id: 3, name: "Components", desc: "islands, counting" },
  { id: 4, name: "Naive", desc: "repeated traversal" },
  { id: 5, name: "Optimization", desc: "one pass" },
  { id: 6, name: "Mastery", desc: "topo sort, clone" },
]

export const PROBLEMS_GRAPHS: Problem[] = [
  // ═══════════════════════════════════════════════════════════════
  // STAGE 0 — Arbitrary-Structure Reflex (6 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1, stage: 0, title: "Is It a Tree?", pattern: "graph structure", skill: "edge-count rule",
    statement: "Given an adjacency list dict representing an undirected graph, return True if the structure has exactly edges = nodes - 1 (a necessary condition for a tree).",
    examples: [
      { input: "graph = {0: [1], 1: [0, 2], 2: [1]}", output: "True", explain: "3 nodes, 2 edges → tree shape" },
      { input: "graph = {0: [1, 2], 1: [0, 2], 2: [0, 1]}", output: "False", explain: "3 nodes, 3 edges → has cycle" },
    ],
    why: "First structural property: in a tree, edges = nodes - 1. More edges than this means cycles exist. Installs the nodes-vs-edges mental model.",
    starterCode: "def is_tree_by_edges(graph):\n    pass",
    hints: [
      "Count the number of nodes: len(graph).",
      "Count total edges in undirected graph: sum of all degrees divided by 2 (each edge appears twice).",
      "A tree has exactly edges = nodes - 1."
    ],
    solution: "def is_tree_by_edges(graph):\n    nodes = len(graph)\n    if nodes == 0:\n        return True\n    total_degree = sum(len(neighbors) for neighbors in graph.values())\n    edges = total_degree // 2\n    return edges == nodes - 1",
    walkthrough: "Count nodes. Sum all neighbor list lengths (total degree). Each undirected edge contributes 2 to the degree sum. Divide by 2 for edge count. Tree condition: edges == nodes - 1.",
    testCode: "g1 = {0: [1], 1: [0, 2], 2: [1]}\nassert is_tree_by_edges(g1) == True\ng2 = {0: [1, 2], 1: [0, 2], 2: [0, 1]}\nassert is_tree_by_edges(g2) == False\ng3 = {0: []}\nassert is_tree_by_edges(g3) == True\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Count Surplus Edges", pattern: "graph structure", skill: "edges - nodes + 1",
    statement: "Given a connected undirected adjacency list, return the minimum number of edges to remove to make it a tree. This equals edges - (nodes - 1), the number of cycle-creating surplus edges.",
    examples: [
      { input: "graph = {0: [1,2], 1: [0,2], 2: [0,1]}", output: "1", explain: "3 nodes, 3 edges. Tree needs 2 edges. Remove 1." },
      { input: "graph = {0: [1,2,3], 1: [0], 2: [0], 3: [0]}", output: "0", explain: "4 nodes, 3 edges. Already a tree." },
    ],
    why: "Every extra edge beyond n-1 creates a cycle. Counting surplus edges = quantifying how 'cyclic' the graph is. Bridges the tree→graph mental gap.",
    starterCode: "def surplus_edges(graph):\n    pass",
    hints: [
      "Count nodes (len of dict). Count edges (sum of neighbor list lengths // 2).",
      "A tree needs n-1 edges.",
      "Surplus = edges - (nodes - 1)."
    ],
    solution: "def surplus_edges(graph):\n    if not graph:\n        return 0\n    nodes = len(graph)\n    degree_sum = sum(len(v) for v in graph.values())\n    edges = degree_sum // 2\n    return edges - (nodes - 1)",
    walkthrough: "Same counting pattern as P1. Every surplus edge corresponds to at least one cycle. Surplus = edges - (n-1) = how many edges to cut to kill all cycles.",
    testCode: "g1 = {0: [1,2], 1: [0,2], 2: [0,1]}\nassert surplus_edges(g1) == 1\ng2 = {0: [1,2,3], 1: [0], 2: [0], 3: [0]}\nassert surplus_edges(g2) == 0\ng3 = {0: [1,2,3], 1: [0,2], 2: [0,1,3], 3: [0,2]}\nassert surplus_edges(g3) == 2\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "DFS Without Visited (The Loop)", pattern: "cycle trap", skill: "why visited exists",
    statement: "Given a small undirected adjacency list with a cycle, write a recursive DFS that counts how many function calls it makes before hitting a depth limit of 15. Do NOT use a visited set. Observe the blow-up from the cycle.",
    examples: [
      { input: "graph = {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}", output: "(large number)", explain: "cycle causes revisits, depth-limit stops infinite loop" },
    ],
    why: "Without visited, DFS on a graph with cycles revisits nodes endlessly. A depth limit exposes the re-visitation count. This IS why the visited set exists — contrast with P4.",
    starterCode: "def dfs_no_visited(graph, node, depth):\n    pass",
    hints: [
      "Base case: if depth >= 15, return 1 (count this call and stop).",
      "Recursively call dfs on each neighbor with depth + 1.",
      "Sum the counts from all recursive calls + 1 for this call."
    ],
    solution: "def dfs_no_visited(graph, node, depth):\n    if depth >= 15:\n        return 1\n    total = 1\n    for nei in graph.get(node, []):\n        total += dfs_no_visited(graph, nei, depth + 1)\n    return total",
    walkthrough: "Without visited, recursion bounces back and forth across edges. Each neighbor call triggers more calls. The depth limit is our circuit breaker. The return count explodes because revisits multiply exponentially.",
    testCode: "g = {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}\ncount = dfs_no_visited(g, 0, 0)\nassert count > 200, f'Expected large count, got {count}'\ng2 = {0: [1], 1: [0]}\ncount2 = dfs_no_visited(g2, 0, 0)\nassert count2 > 20\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "DFS With Visited Set", pattern: "visited set", skill: "each node seen once",
    statement: "Implement DFS on the same graph as P3, but WITH a visited set. Each node is visited at most once. Return the list of nodes in visit order.",
    examples: [
      { input: "graph = {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}", output: "[0, 1, 2, 3]" },
    ],
    why: "The visited set transforms a cyclic graph traversal from infinite explosion to O(V+E). One set solved the entire problem. This is the single most important data structure in graph algorithms.",
    starterCode: "def dfs_with_visited(graph, start):\n    visited = set()\n    order = []\n    pass",
    hints: [
      "Mark the current node as visited immediately.",
      "Add current node to order list.",
      "Only recurse on neighbors NOT in visited set."
    ],
    solution: "def dfs_with_visited(graph, start):\n    visited = set()\n    order = []\n    def dfs(node):\n        visited.add(node)\n        order.append(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs(nei)\n    dfs(start)\n    return order",
    walkthrough: "The visited set is the gate. Before recursing on a neighbor, check if it's already been seen. This prevents all revisits. Each node enters the recursion exactly once. Compare with P3 — same graph, totally different behavior.",
    testCode: "g = {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}\norder = dfs_with_visited(g, 0)\nassert len(set(order)) == len(order), 'No duplicates'\nassert set(order) == {0, 1, 2, 3}\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Direct Connection Check", pattern: "edge lookup", skill: "neighbor list membership",
    statement: "Given an undirected adjacency list and two nodes a and b, return True if there is a direct edge between them.",
    examples: [
      { input: "graph={0:[1,2], 1:[0], 2:[0]}, a=0, b=2", output: "True" },
      { input: "graph={0:[1,2], 1:[0], 2:[0]}, a=1, b=2", output: "False" },
    ],
    why: "In an adjacency list, edge existence is O(degree) — check if b appears in graph[a]. In an adjacency matrix (P9), it's O(1). The representation determines the cost.",
    starterCode: "def has_edge(graph, a, b):\n    pass",
    hints: [
      "Look at graph[a] — the list of neighbors of a.",
      "Check if b is in that list.",
      "Handle cases where a or b aren't in the graph."
    ],
    solution: "def has_edge(graph, a, b):\n    if a not in graph or b not in graph:\n        return False\n    return b in graph[a]",
    walkthrough: "Simple list lookup. In an adjacency list, checking an edge is O(degree(a)). For low-degree graphs (most real graphs), this is fast. For dense graphs, an adjacency matrix would be faster.",
    testCode: "g = {0: [1, 2], 1: [0], 2: [0]}\nassert has_edge(g, 0, 2) == True\nassert has_edge(g, 1, 2) == False\nassert has_edge(g, 3, 0) == False\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Highest Degree Node", pattern: "graph property", skill: "degree computation",
    statement: "Given an undirected adjacency list, return the node with the highest degree (most neighbors). If multiple are tied, return the smallest node number.",
    examples: [
      { input: "graph = {0: [1,2,3], 1: [0], 2: [0,4], 3: [0], 4: [2]}", output: "0", explain: "node 0 has 3 neighbors" },
    ],
    why: "Degree is the fundamental local property. Computing it from an adjacency list is O(1) per node. Understanding degrees is prerequisite to Euler paths (P50), topo sort (P43), and many other algorithms.",
    starterCode: "def highest_degree(graph):\n    pass",
    hints: [
      "Iterate over graph.items() to get (node, neighbors).",
      "Track max_degree and best_node. Compare len(neighbors).",
      "On tie, keep the smaller node number."
    ],
    solution: "def highest_degree(graph):\n    best_node = -1\n    max_deg = -1\n    for node, neighbors in graph.items():\n        deg = len(neighbors)\n        if deg > max_deg or (deg == max_deg and node < best_node):\n            max_deg = deg\n            best_node = node\n    return best_node",
    walkthrough: "Scan every node, count neighbors. Track the maximum. On ties, compare node numbers. Degree is just len(neighbors) in an adjacency list.",
    testCode: "g = {0: [1,2,3], 1: [0], 2: [0,4], 3: [0], 4: [2]}\nassert highest_degree(g) == 0\ng2 = {0: [1], 1: [0,2,3], 2: [1], 3: [1]}\nassert highest_degree(g2) == 1\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 1 — Representation (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 7, stage: 1, title: "Edges → Adjacency List", pattern: "representation", skill: "build dict from edge list",
    statement: "Given n (0 to n-1) and a list of directed edges [[from, to], ...], build and return an adjacency list dict. Every node (0..n-1) should appear as a key, even if it has no outgoing edges.",
    examples: [
      { input: "n=4, edges=[[0,1],[0,2],[1,3],[2,3]]", output: "{0:[1,2], 1:[3], 2:[3], 3:[]}" },
    ],
    why: "The fundamental construction pattern. Every graph algorithm starts with building the adjacency list. For the rest of the curriculum, graphs are assumed to be in this form.",
    starterCode: "def build_adj_list(n, edges):\n    pass",
    hints: [
      "Initialize graph with all n nodes mapped to empty lists.",
      "For each [u, v] in edges: append v to graph[u].",
      "The graph must have entries even for nodes with no outgoing edges."
    ],
    solution: "def build_adj_list(n, edges):\n    graph = {i: [] for i in range(n)}\n    for u, v in edges:\n        graph[u].append(v)\n    return graph",
    walkthrough: "Create dict with all nodes. Iterate through edges, appending destination to source's list. Directed edges only add to graph[u], not graph[v]. Every node gets an entry — even isolated ones.",
    testCode: "g = build_adj_list(4, [[0,1],[0,2],[1,3],[2,3]])\nassert g == {0: [1,2], 1: [3], 2: [3], 3: []}\ng2 = build_adj_list(3, [[0,1]])\nassert g2 == {0: [1], 1: [], 2: []}\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Edges → Adjacency Matrix", pattern: "representation", skill: "build 2D matrix",
    statement: "Given n and a list of directed edges, build and return an n×n adjacency matrix (2D list) where matrix[i][j] = 1 if edge i→j exists, else 0.",
    examples: [
      { input: "n=3, edges=[[0,1],[1,2],[0,2]]", output: "[[0,1,1],[0,0,1],[0,0,0]]" },
    ],
    why: "Contrasts with P7. Same input, different output. The matrix enables O(1) edge checks (P9) but costs O(n²) space. Understanding the space/cost tradeoff is the core of graph representation.",
    starterCode: "def build_adj_matrix(n, edges):\n    pass",
    hints: [
      "Create n×n grid of zeros: [[0]*n for _ in range(n)].",
      "For each [u, v] in edges: set matrix[u][v] = 1.",
      "The matrix is indexed as matrix[row][col] = matrix[from][to]."
    ],
    solution: "def build_adj_matrix(n, edges):\n    matrix = [[0] * n for _ in range(n)]\n    for u, v in edges:\n        matrix[u][v] = 1\n    return matrix",
    walkthrough: "Create n×n zeros. For each edge, set the cell at [u][v] to 1. For undirected graphs, you'd also set [v][u] = 1. The matrix is dense even for sparse graphs — this is the space tradeoff.",
    testCode: "m = build_adj_matrix(3, [[0,1],[1,2],[0,2]])\nassert m == [[0,1,1],[0,0,1],[0,0,0]]\nm2 = build_adj_matrix(2, [])\nassert m2 == [[0,0],[0,0]]\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Edge Check O(1)", pattern: "representation", skill: "matrix lookup",
    statement: "Given an adjacency matrix (2D list) and two nodes i, j, return 1 if edge i→j exists, else 0. This is a single indexing operation.",
    examples: [
      { input: "matrix=[[0,1,0],[0,0,1],[1,0,0]], i=0, j=1", output: "1" },
      { input: "matrix=[[0,1,0],[0,0,1],[1,0,0]], i=1, j=0", output: "0" },
    ],
    why: "The matrix's superpower: O(1) edge existence check. In an adjacency list, this takes O(degree). The tradeoff: O(n²) space for O(1) queries.",
    starterCode: "def edge_in_matrix(matrix, i, j):\n    pass",
    hints: [
      "One line: matrix[i][j].",
      "No loops, no search — just direct indexing.",
      "This is the entire advantage of adjacency matrices."
    ],
    solution: "def edge_in_matrix(matrix, i, j):\n    if 0 <= i < len(matrix) and 0 <= j < len(matrix[0]):\n        return matrix[i][j]\n    return 0",
    walkthrough: "matrix[i][j] — one array access. Compare with P5 where we had to search a list. For dense graphs with frequent edge queries, matrix wins. For sparse graphs with traversal-heavy algorithms, adjacency list wins.",
    testCode: "m = [[0,1,0],[0,0,1],[1,0,0]]\nassert edge_in_matrix(m, 0, 1) == 1\nassert edge_in_matrix(m, 1, 0) == 0\nassert edge_in_matrix(m, 0, 0) == 0\nassert edge_in_matrix(m, 5, 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "List All Neighbors", pattern: "representation", skill: "neighbor list retrieval",
    statement: "Given an adjacency list graph and a node id, return the list of that node's outgoing neighbors. If the node doesn't exist in the graph, return an empty list.",
    examples: [
      { input: "graph={0:[1,3], 1:[2], 2:[], 3:[1]}, node=0", output: "[1, 3]" },
      { input: "graph={0:[1,3], 1:[2], 2:[], 3:[1]}, node=5", output: "[]" },
    ],
    why: "The adjacency list's superpower: O(1) to list all neighbors. In a matrix, this takes O(n). For traversal (DFS/BFS), listing neighbors is the dominant operation — that's why adjacency list is the default representation.",
    starterCode: "def neighbors(graph, node):\n    pass",
    hints: [
      "Use graph.get(node, []) — returns empty list for missing nodes.",
      "This is why adjacency list is fast for traversal.",
      "Contrast: matrix would require scanning an entire row."
    ],
    solution: "def neighbors(graph, node):\n    return graph.get(node, [])",
    walkthrough: "One dict lookup. graph.get(node, []) safely returns [] for non-existent nodes. This O(1) neighbor listing is why DFS/BFS use adjacency lists.",
    testCode: "g = {0: [1, 3], 1: [2], 2: [], 3: [1]}\nassert neighbors(g, 0) == [1, 3]\nassert neighbors(g, 5) == []\nassert neighbors(g, 2) == []\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Grid Neighbors (4-directional)", pattern: "representation", skill: "grid as implicit graph",
    statement: "Given a 2D grid (list of lists) and a cell (r, c), return a list of (nr, nc) tuples for all valid 4-directional neighbors (up, down, left, right). Exclude out-of-bounds positions.",
    examples: [
      { input: "grid=[[1,2],[3,4]], r=0, c=0", output: "[(0,1),(1,0)]", explain: "right and down only" },
      { input: "grid=[[1,2],[3,4]], r=1, c=1", output: "[(0,1),(1,0)]", explain: "up and left only" },
    ],
    why: "A grid IS a graph — each cell is a node, edges connect to orthogonal neighbors. Understanding this implicit graph unlocks all island problems in Stage 3.",
    starterCode: "def grid_neighbors_4(grid, r, c):\n    pass",
    hints: [
      "Define 4 directions as (dr, dc): [(-1,0),(1,0),(0,-1),(0,1)].",
      "For each direction, check if nr in [0, rows) and nc in [0, cols).",
      "Only add valid positions."
    ],
    solution: "def grid_neighbors_4(grid, r, c):\n    rows, cols = len(grid), len(grid[0])\n    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]\n    result = []\n    for dr, dc in dirs:\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < rows and 0 <= nc < cols:\n            result.append((nr, nc))\n    return result",
    walkthrough: "Grid traversal pattern: define direction vectors, compute new positions, validate bounds. This is the neighbor-generation function that drives grid DFS/BFS (islands, flood fill, etc.).",
    testCode: "g = [[1,2],[3,4]]\nassert set(grid_neighbors_4(g, 0, 0)) == {(0,1),(1,0)}\nassert set(grid_neighbors_4(g, 1, 1)) == {(0,1),(1,0)}\nassert len(grid_neighbors_4(g, 0, 1)) == 2\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Grid Neighbors (8-directional)", pattern: "representation", skill: "diagonal neighbors",
    statement: "Same as P11 but include diagonal neighbors: up-left, up-right, down-left, down-right. Return all 8 valid directional positions.",
    examples: [
      { input: "grid=[[1,2],[3,4]], r=0, c=0", output: "3 neighbors", explain: "right, down, down-right" },
    ],
    why: "Some problems (minesweeper, connected regions with diagonals) need 8-way connectivity. Same skeleton as P11 — just more directions. Teaches that neighbor generation is parameterized by direction set.",
    starterCode: "def grid_neighbors_8(grid, r, c):\n    pass",
    hints: [
      "Extend dirs to 8: all combinations of (-1,0,1) except (0,0).",
      "Same bounds check as P11.",
      "8 directions = 4 orthogonal + 4 diagonal."
    ],
    solution: "def grid_neighbors_8(grid, r, c):\n    rows, cols = len(grid), len(grid[0])\n    dirs = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]\n    result = []\n    for dr, dc in dirs:\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < rows and 0 <= nc < cols:\n            result.append((nr, nc))\n    return result",
    walkthrough: "Same pattern, 8 directions instead of 4. The code is identical except the dirs list. This parameterization — 'which directions are edges' — is the core of grid-as-graph modeling.",
    testCode: "g = [[1,2],[3,4]]\nassert len(grid_neighbors_8(g, 0, 0)) == 3\nassert len(grid_neighbors_8(g, 1, 1)) == 3\nassert len(grid_neighbors_8(g, 0, 1)) == 3\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Adjacency List → Edge List", pattern: "representation", skill: "reverse construction",
    statement: "Given an undirected adjacency list, convert it back to an edge list. Each edge should appear exactly once as a sorted tuple (min_node, max_node). Return edges sorted.",
    examples: [
      { input: "graph={0:[1,3],1:[0,2],2:[1],3:[0]}", output: "[(0,1),(0,3),(1,2)]" },
    ],
    why: "Reverses P7. Given a graph, extract edges. Teaches that adjacency list and edge list are losslessly interconvertible. The sorted-tuple trick deduplicates undirected edges.",
    starterCode: "def adj_list_to_edges(graph):\n    pass",
    hints: [
      "For each node u, for each neighbor v: create edge as (min(u,v), max(u,v)).",
      "Use a set to deduplicate — undirected edges appear twice in adjacency list.",
      "Sort before returning."
    ],
    solution: "def adj_list_to_edges(graph):\n    edge_set = set()\n    for u in graph:\n        for v in graph[u]:\n            edge_set.add((min(u, v), max(u, v)))\n    return sorted(edge_set)",
    walkthrough: "Each undirected edge appears as u→v in graph[u] AND v→u in graph[v]. Using (min, max) normalizes both to the same tuple. A set deduplicates.",
    testCode: "g = {0: [1, 3], 1: [0, 2], 2: [1], 3: [0]}\nassert adj_list_to_edges(g) == [(0,1),(0,3),(1,2)]\ng2 = {0: [1], 1: [0]}\nassert adj_list_to_edges(g2) == [(0,1)]\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 2 — The Two Walks (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 14, stage: 2, title: "DFS on Graph (Recursive)", pattern: "traversal", skill: "recursive depth-first order",
    statement: "Given a directed adjacency list and a start node, traverse using recursive DFS and return the preorder (visit order) of nodes. Only visit each node once.",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[4],4:[]}, start=0", output: "[0, 1, 3, 4, 2]" },
    ],
    why: "THE traversal. DFS on graphs is identical in skeleton to tree DFS — only difference: the visited set. If you can write tree DFS, you can write graph DFS.",
    starterCode: "def dfs(graph, start):\n    visited = set()\n    order = []\n    pass",
    hints: [
      "Mark current node visited, add to order.",
      "For each neighbor: if not visited, recurse.",
      "Return order list."
    ],
    solution: "def dfs(graph, start):\n    visited = set()\n    order = []\n    def dfs_visit(node):\n        visited.add(node)\n        order.append(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs_visit(nei)\n    dfs_visit(start)\n    return order",
    walkthrough: "Identical to tree DFS except: (1) the visited set check before recursing, (2) graph.get(node, []) for safety. The order is depth-first — follow one branch to its end before backtracking.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: [4], 4: []}\nassert dfs(g, 0) == [0, 1, 3, 4, 2]\ng2 = {0: [1, 2], 1: [], 2: []}\nassert dfs(g2, 0) == [0, 1, 2]\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "BFS on Graph (Iterative Queue)", pattern: "traversal", skill: "iterative breadth-first order",
    statement: "Given a directed adjacency list and a start node, traverse using iterative BFS (a queue) and return the visit order of nodes.",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[4],4:[]}, start=0", output: "[0, 1, 2, 3, 4]", explain: "level by level" },
    ],
    why: "Second traversal. BFS uses a queue instead of recursion (stack). The visit order is level-by-level. Together with P14, these two orderings are the basis of all graph algorithms.",
    starterCode: "def bfs(graph, start):\n    pass",
    hints: [
      "Use a queue (Python list with pop(0) or collections.deque) starting with [start].",
      "Mark visited when enqueuing (NOT when dequeuing) to prevent duplicates.",
      "While queue: pop front, add to order, enqueue unvisited neighbors."
    ],
    solution: "def bfs(graph, start):\n    visited = set()\n    order = []\n    queue = [start]\n    visited.add(start)\n    while queue:\n        node = queue.pop(0)\n        order.append(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                visited.add(nei)\n                queue.append(nei)\n    return order",
    walkthrough: "Queue drives BFS. Mark visited on ENQUEUE (if you mark on dequeue, two parallel paths can enqueue the same node twice). Pop front, visit, enqueue unvisited neighbors. Result: level-order.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: [4], 4: []}\nassert bfs(g, 0) == [0, 1, 2, 3, 4]\ng2 = {0: [2, 1], 1: [3], 2: [3], 3: []}\nassert bfs(g2, 0) == [0, 2, 1, 3]\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "DFS vs BFS Same Skeleton", pattern: "traversal", skill: "stack vs queue as only difference",
    statement: "Implement a generic traversal function that takes a parameter 'mode' (either 'dfs' or 'bfs'). The only difference: DFS uses a stack (pop from end), BFS uses a queue (pop from front). Return the visit order.",
    examples: [
      { input: "graph={0:[2,1],1:[3],2:[],3:[]}, start=0, mode='dfs'", output: "[0, 1, 3, 2]", explain: "stack pops last-added first" },
      { input: "graph={0:[2,1],1:[3],2:[],3:[]}, start=0, mode='bfs'", output: "[0, 2, 1, 3]", explain: "queue pops first-added first" },
    ],
    why: "DFS and BFS are the SAME algorithm with ONE difference: the container (stack vs queue). Everything else — visited set, enqueue logic, traversal loop — is identical. This is the deepest insight in graph traversal.",
    starterCode: "def traversal(graph, start, mode):\n    pass",
    hints: [
      "Initialize container = [start], visited = {start}, order = [].",
      "While container: pop based on mode (pop() for DFS, pop(0) for BFS).",
      "The rest is identical: add to order, enqueue unvisited neighbors."
    ],
    solution: "def traversal(graph, start, mode):\n    visited = set()\n    order = []\n    container = [start]\n    visited.add(start)\n    while container:\n        if mode == 'dfs':\n            node = container.pop()\n        else:\n            node = container.pop(0)\n        order.append(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                visited.add(nei)\n                container.append(nei)\n    return order",
    walkthrough: "The only line that changes: pop() for DFS (stack — LIFO) vs pop(0) for BFS (queue — FIFO). The entire algorithm skeleton is identical. Container semantics determine traversal order.",
    testCode: "g = {0: [2,1], 1: [3], 2: [], 3: []}\nr1 = traversal(g, 0, 'dfs')\nr2 = traversal(g, 0, 'bfs')\nassert len(r1) == 4 and len(r2) == 4\nassert set(r1) == set(r2)\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "BFS Level Order", pattern: "traversal", skill: "tracking distance from start",
    statement: "Run BFS from a start node and return a list of lists where each sublist contains nodes at that level (distance from start). Level 0 = [start], Level 1 = neighbors, etc.",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[4],4:[]}, start=0", output: "[[0],[1,2],[3],[4]]" },
    ],
    why: "BFS naturally discovers nodes in layers. Tracking which layer each node belongs to is the foundation of shortest-path (P18) and all distance-based graph algorithms.",
    starterCode: "def bfs_levels(graph, start):\n    pass",
    hints: [
      "Use queue of (node, level) tuples. Start with (start, 0).",
      "Maintain a result list. Extend result if level >= len(levels).",
      "For each neighbor: enqueue with level+1."
    ],
    solution: "def bfs_levels(graph, start):\n    visited = set()\n    levels = []\n    queue = [(start, 0)]\n    visited.add(start)\n    while queue:\n        node, level = queue.pop(0)\n        if level >= len(levels):\n            levels.append([])\n        levels[level].append(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                visited.add(nei)\n                queue.append((nei, level + 1))\n    return levels",
    walkthrough: "Each queue entry carries (node, distance). On dequeue, append to the corresponding level list. Enqueue neighbors with distance+1. Because BFS processes in level order, levels fill correctly.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: [4], 4: []}\nassert bfs_levels(g, 0) == [[0],[1,2],[3],[4]]\ng2 = {0: [1, 2], 1: [], 2: [3], 3: []}\nassert bfs_levels(g2, 0) == [[0],[1,2],[3]]\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Shortest Path (BFS)", pattern: "traversal", skill: "unweighted shortest path",
    statement: "Given an unweighted undirected graph (adjacency list) and two nodes start and target, return the shortest path length (number of edges). If no path exists, return -1.",
    examples: [
      { input: "graph={0:[1,2],1:[0,3],2:[0],3:[1,4],4:[3]}, start=0, target=4", output: "3", explain: "0→1→3→4 = 3 edges" },
      { input: "same graph, start=0, target=5", output: "-1" },
    ],
    why: "BFS finds shortest paths in unweighted graphs. Proof: BFS visits nodes in order of distance. The first time target is seen, it's via the shortest path. This is why BFS is preferred over DFS for distance problems.",
    starterCode: "def shortest_path(graph, start, target):\n    pass",
    hints: [
      "Use BFS: queue of (node, distance). Start with (start, 0).",
      "When you dequeue target, return the distance immediately.",
      "If queue empties without finding target, return -1."
    ],
    solution: "def shortest_path(graph, start, target):\n    if start == target:\n        return 0\n    visited = set()\n    queue = [(start, 0)]\n    visited.add(start)\n    while queue:\n        node, dist = queue.pop(0)\n        for nei in graph.get(node, []):\n            if nei == target:\n                return dist + 1\n            if nei not in visited:\n                visited.add(nei)\n                queue.append((nei, dist + 1))\n    return -1",
    walkthrough: "Standard BFS, but check if a neighbor IS the target before enqueueing. Return dist+1 immediately. Because BFS explores in distance order, the first discovery is the shortest path.",
     testCode: "g = {0: [1,2], 1: [0,3], 2: [0], 3: [1,4], 4: [3]}\nassert shortest_path(g, 0, 4) == 3\nassert shortest_path(g, 0, 0) == 0\nassert shortest_path(g, 0, 5) == -1\nassert shortest_path(g, 2, 4) == 4\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "DFS Path Finding", pattern: "traversal", skill: "backtrack to build a path",
    statement: "Given an undirected graph and start/target nodes, return ANY path from start to target as a list of nodes. If no path exists, return an empty list. Use DFS.",
    examples: [
      { input: "graph={0:[1,2],1:[0,3],2:[0],3:[1,4],4:[3]}, start=0, target=4", output: "[0, 1, 3, 4]" },
    ],
    why: "DFS can find a path (not necessarily shortest) by maintaining the current path during recursion. When target is found, return the path immediately. This backtracking pattern is used in maze solving and topological sort.",
    starterCode: "def dfs_path(graph, start, target):\n    pass",
    hints: [
      "Use DFS that returns a path when target found.",
      "At target: return [node].",
      "Recurse on neighbors. If neighbor finds target, prepend current node: [node] + result."
    ],
    solution: "def dfs_path(graph, start, target):\n    visited = set()\n    def dfs(node):\n        if node == target:\n            return [node]\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                result = dfs(nei)\n                if result:\n                    return [node] + result\n        return []\n    return dfs(start)",
    walkthrough: "DFS returns a path when target found. At each node: check if this IS the target. If so, return [node]. Otherwise, recurse on neighbors. If a neighbor finds target, prepend current node and return. This builds the path bottom-up.",
    testCode: "g = {0: [1,2], 1: [0,3], 2: [0], 3: [1,4], 4: [3]}\np = dfs_path(g, 0, 4)\nassert p[0] == 0 and p[-1] == 4\nassert all(g.get(p[i]) and p[i+1] in g[p[i]] for i in range(len(p)-1))\nassert dfs_path(g, 0, 99) == []\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Count Reachable Nodes", pattern: "traversal", skill: "reachability count",
    statement: "Given a directed graph and a start node, return the number of nodes reachable from start (including start itself).",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[],4:[5],5:[]}, start=0", output: "4", explain: "0 can reach 0,1,2,3" },
    ],
    why: "Simplest aggregation on top of traversal: count visited nodes. The visited set contains all reachable nodes — just return its size. Building block for component counting (P39).",
    starterCode: "def reachable_count(graph, start):\n    pass",
    hints: [
      "Run DFS or BFS from start with a visited set.",
      "After traversal, return len(visited).",
      "The visited set IS the set of reachable nodes."
    ],
    solution: "def reachable_count(graph, start):\n    visited = set()\n    def dfs(node):\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs(nei)\n    dfs(start)\n    return len(visited)",
    walkthrough: "Standard DFS. The visited set accumulates all reachable nodes. Return its length. This is the simplest aggregation on a traversal — count what was discovered.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: [], 4: [5], 5: []}\nassert reachable_count(g, 0) == 4\nassert reachable_count(g, 3) == 1\nassert reachable_count(g, 4) == 2\nprint('All tests passed!')"
  },
  // ═══════════════════════════════════════════════════════════════
  // STAGE 3 — Components (7 problems, grid-based)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 21, stage: 3, title: "Number of Islands", pattern: "connected components", skill: "grid DFS flood fill",
    statement: "Given an m×n 2D binary grid where 1 = land and 0 = water, return the number of islands. An island is a group of 1's connected 4-directionally.",
    examples: [
      { input: "grid=[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]", output: "3" },
      { input: "grid=[[1,0,1],[0,1,0],[1,0,1]]", output: "5" },
    ],
    why: "THE canonical graph component problem. Each land cell triggers a DFS that marks the entire island. The number of DFS triggers = number of islands. This flood-fill pattern powers all grid problems (P21-P27).",
    starterCode: "def num_islands(grid):\n    pass",
    hints: [
      "Scan every cell. When you find a '1', increment count and run DFS to flood the entire island.",
      "Inside DFS: mark cell as visited (set to '0'). Recurse to 4-directional neighbors that are '1'.",
      "Return the count of DFS triggers."
    ],
    solution: "def num_islands(grid):\n    rows, cols = len(grid), len(grid[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == 0:\n            return\n        grid[r][c] = 0\n        dfs(r + 1, c)\n        dfs(r - 1, c)\n        dfs(r, c + 1)\n        dfs(r, c - 1)\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 1:\n                count += 1\n                dfs(r, c)\n    return count",
    walkthrough: "Scan grid. On finding land (1), increment count and flood it (DFS marks all connected land as 0). Each DFS call floods exactly one island. The number of DFS triggers = number of islands. O(mn).",
    testCode: "g1 = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]\nassert num_islands([r[:] for r in g1]) == 3\ng2 = [[1,0,1],[0,1,0],[1,0,1]]\nassert num_islands([r[:] for r in g2]) == 5\ng3 = [[0,0,0]]\nassert num_islands(g3) == 0\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 3, title: "Max Area of Island", pattern: "connected components", skill: "DFS that returns count",
    statement: "Given a binary grid (1=land, 0=water), return the maximum area of an island. Area = number of cells in the island. If no islands, return 0.",
    examples: [
      { input: "grid=[[0,1,0],[0,1,1],[0,0,0]]", output: "3", explain: "island of 3 connected 1's" },
    ],
    why: "Same skeleton as P21 but DFS RETURNS the area instead of just flooding. The returned value aggregates upward. Composes P21 (flood fill) with the 1+left+right pattern from trees.",
    starterCode: "def max_area_of_island(grid):\n    pass",
    hints: [
      "When you find a '1', run DFS that returns the count of cells flooded.",
      "DFS returns 1 + sum of recursive calls on 4 neighbors.",
      "Track max across all DFS calls."
    ],
    solution: "def max_area_of_island(grid):\n    rows, cols = len(grid), len(grid[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == 0:\n            return 0\n        grid[r][c] = 0\n        return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1)\n    max_area = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 1:\n                max_area = max(max_area, dfs(r, c))\n    return max_area",
    walkthrough: "Same scan, same flood. Difference: DFS returns the count of cells it just flooded (1 + sum of recursive calls). Track max across all triggers. The 1+left+right pattern from trees appears here as 1+up+down+left+right.",
    testCode: "g1 = [[0,1,0],[0,1,1],[0,0,0]]\nassert max_area_of_island([r[:] for r in g1]) == 3\ng2 = [[1,1],[1,1]]\nassert max_area_of_island(g2) == 4\ng3 = [[0,0]]\nassert max_area_of_island(g3) == 0\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Perimeter of Island", pattern: "connected components", skill: "boundary counting",
    statement: "Given a binary grid with exactly one island (no lakes), return its perimeter. Each land cell contributes 4 minus the number of adjacent land cells.",
    examples: [
      { input: "grid=[[0,1,0],[1,1,1],[0,1,0]]", output: "12" },
      { input: "grid=[[1]]", output: "4" },
    ],
    why: "Perimeter = counting exposed edges. Each land cell's contribution is determined by its 4 neighbors. A local computation over the grid — no DFS needed. But the principle generalizes to any component.",
    starterCode: "def island_perimeter(grid):\n    pass",
    hints: [
      "For each land cell, check 4 neighbors. If neighbor is water or out of bounds, add 1 to perimeter.",
      "Alternatively: each land cell contributes 4 minus count(land_neighbors).",
      "Sum across all land cells."
    ],
    solution: "def island_perimeter(grid):\n    rows, cols = len(grid), len(grid[0])\n    perimeter = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 1:\n                for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:\n                    nr, nc = r + dr, c + dc\n                    if nr < 0 or nr >= rows or nc < 0 or nc >= cols or grid[nr][nc] == 0:\n                        perimeter += 1\n    return perimeter",
    walkthrough: "For each land cell, check 4 sides. Each side that faces water or grid boundary = 1 unit of perimeter. Sum all cells. No DFS needed because problem guarantees one island — but the pattern generalizes.",
    testCode: "g1 = [[0,1,0],[1,1,1],[0,1,0]]\nassert island_perimeter(g1) == 12\ng2 = [[1]]\nassert island_perimeter(g2) == 4\ng3 = [[1,0]]\nassert island_perimeter(g3) == 4\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Flood Fill", pattern: "connected components", skill: "fill connected region with new color",
    statement: "Given an m×n grid of integers (each value is a color), a starting cell (sr, sc), and a new color. Change the starting cell and all 4-directionally connected cells of the same original color to the new color.",
    examples: [
      { input: "image=[[1,1,1],[1,1,0],[1,0,1]], sr=1, sc=1, newColor=2", output: "[[2,2,2],[2,2,0],[2,0,1]]" },
    ],
    why: "THE classic DFS/BFS application — the paint bucket tool. Same flood as P21, but condition is 'same as original color'. The boundary check: out of bounds OR cell != original_color.",
    starterCode: "def flood_fill(image, sr, sc, new_color):\n    pass",
    hints: [
      "If image[sr][sc] is already new_color, return immediately (avoid infinite loop).",
      "DFS: if out of bounds OR cell != original_color, return.",
      "Set cell to new_color, recurse 4-directionally."
    ],
    solution: "def flood_fill(image, sr, sc, new_color):\n    original = image[sr][sc]\n    if original == new_color:\n        return image\n    rows, cols = len(image), len(image[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or image[r][c] != original:\n            return\n        image[r][c] = new_color\n        dfs(r+1, c)\n        dfs(r-1, c)\n        dfs(r, c+1)\n        dfs(r, c-1)\n    dfs(sr, sc)\n    return image",
    walkthrough: "Same DFS flood pattern. Boundary: out of bounds OR not original color. Crucial guard: if original == new_color, no-op to prevent infinite recursion. The DFS replaces colors in-place.",
    testCode: "im = [[1,1,1],[1,1,0],[1,0,1]]\nr = flood_fill([r[:] for r in im], 1, 1, 2)\nassert r == [[2,2,2],[2,2,0],[2,0,1]]\nim2 = [[0,0,0],[0,0,0]]\nr2 = flood_fill([r[:] for r in im2], 0, 0, 0)\nassert r2 == [[0,0,0],[0,0,0]]\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Number of Closed Islands", pattern: "connected components", skill: "border-touching filter",
    statement: "Given a binary grid (0=land, 1=water), return the number of 'closed' islands. A closed island is a group of 0's completely surrounded by 1's (does NOT touch the grid border).",
    examples: [
      { input: "grid=[[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]]", output: "1", explain: "center island surrounded by 1's" },
      { input: "grid=[[0,0,1,0],[1,0,1,1],[0,1,0,1],[1,0,1,0]]", output: "2" },
    ],
    why: "Two-pass pattern adds a filter to P21. First, flood all border-connected land (they're not closed). Then count remaining islands. The two-pass pattern (eliminate, then count) is a recurring graph technique.",
    starterCode: "def closed_islands(grid):\n    pass",
    hints: [
      "First pass: flood-fill all 0's that touch the grid border (turn them to 1's).",
      "Second pass: standard island count (P21) on remaining 0's.",
      "Border cells: r == 0 or r == rows-1 or c == 0 or c == cols-1."
    ],
    solution: "def closed_islands(grid):\n    rows, cols = len(grid), len(grid[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != 0:\n            return\n        grid[r][c] = 1\n        dfs(r+1, c)\n        dfs(r-1, c)\n        dfs(r, c+1)\n        dfs(r, c-1)\n    for r in range(rows):\n        for c in range(cols):\n            if (r == 0 or r == rows-1 or c == 0 or c == cols-1) and grid[r][c] == 0:\n                dfs(r, c)\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 0:\n                count += 1\n                dfs(r, c)\n    return count",
    walkthrough: "Two passes. First: flood all border-touching 0's to 1's (they can't be closed). Second: standard island count on remaining 0's. The first pass eliminates open islands; the second counts closed ones. O(mn).",
     testCode: "g1 = [[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,1,1,1]]\nassert closed_islands([r[:] for r in g1]) == 1\ng2 = [[0,0,1,0],[1,0,1,1],[0,1,0,1],[1,0,1,0]]\nassert closed_islands([r[:] for r in g2]) == 1\ng3 = [[0,0,0],[0,0,0],[0,0,0]]\nassert closed_islands(g3) == 0\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Count Sub-Islands", pattern: "connected components", skill: "two-grid intersection",
    statement: "Given two binary grids grid1 and grid2 of the same size (1=land), an island in grid2 is a sub-island if EVERY cell in that island is also land in grid1. Return the number of sub-islands in grid2.",
    examples: [
      { input: "grid1=[[1,1,1],[1,0,1],[1,1,1]], grid2=[[1,1,1],[0,1,0],[1,1,1]]", output: "1", explain: "grid2 center cell is water in grid1" },
    ],
    why: "Two-grid problem. Flood in grid2 but check grid1 at each step. If any cell in grid2's island is water in grid1, the entire island is disqualified. Extends P21 with a cross-grid condition.",
    starterCode: "def count_sub_islands(grid1, grid2):\n    pass",
    hints: [
      "DFS on grid2: flood land cells, but at each cell check if grid1[r][c] is also land.",
      "If any cell in the current island fails the grid1 check, mark the island as invalid.",
      "Accumulate validity across all DFS calls using AND."
    ],
    solution: "def count_sub_islands(grid1, grid2):\n    rows, cols = len(grid1), len(grid1[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or grid2[r][c] != 1:\n            return True\n        grid2[r][c] = 0\n        valid = (grid1[r][c] == 1)\n        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:\n            valid = dfs(r+dr, c+dc) and valid\n        return valid\n    count = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid2[r][c] == 1:\n                if dfs(r, c):\n                    count += 1\n    return count",
    walkthrough: "DFS on grid2. At each cell, check if grid1 is also land. AND all results together — one failure cascades through `valid = dfs(...) and valid`. If entire island passes, count it.",
     testCode: "g1 = [[1,1,1],[1,0,1],[1,1,1]]\ng2 = [[1,1,1],[0,1,0],[1,1,1]]\nassert count_sub_islands([r[:] for r in g1], [r[:] for r in g2]) == 0\ng1b = [[1,0,1],[0,1,0],[1,0,1]]\ng2b = [[1,1,1],[1,1,1],[1,1,1]]\nassert count_sub_islands([r[:] for r in g1b], [r[:] for r in g2b]) == 0\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Surrounded Regions", pattern: "connected components", skill: "border-flood + flip",
    statement: "Given an m×n board of 'X' and 'O', flip all 'O's that are fully surrounded by 'X's (not connected to the border) to 'X'. A 4-directionally connected region of 'O's is surrounded if none of its cells touch the border. LeetCode 130.",
    examples: [
      { input: "board=[['X','X','X'],['X','O','X'],['X','X','X']]", output: "all X" },
      { input: "board=[['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']]", output: "capture surrounded O's" },
    ],
    why: "Same two-pass pattern as P25 but with in-place mutation. First mark border-connected O's as safe (temp value 'T'). Then flip remaining O's (surrounded) to X. Restore T back to O.",
    starterCode: "def solve(board):\n    pass",
    hints: [
      "First pass: DFS from border 'O's, mark them as 'T' (temporary safe marker).",
      "Second pass: scan board, flip remaining 'O's to 'X', flip 'T's back to 'O'.",
      "This avoids needing a separate visited data structure."
    ],
    solution: "def solve(board):\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c):\n        if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != 'O':\n            return\n        board[r][c] = 'T'\n        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:\n            dfs(r+dr, c+dc)\n    for r in range(rows):\n        for c in range(cols):\n            if (r == 0 or r == rows-1 or c == 0 or c == cols-1) and board[r][c] == 'O':\n                dfs(r, c)\n    for r in range(rows):\n        for c in range(cols):\n            if board[r][c] == 'O':\n                board[r][c] = 'X'\n            elif board[r][c] == 'T':\n                board[r][c] = 'O'\n    return board",
    walkthrough: "Two-phase flood: (1) mark border-connected O's as T, (2) flip O→X (surrounded) and T→O (safe). The temp value trick is ubiquitous in in-place grid manipulation.",
    testCode: "b1 = [['X','X','X'],['X','O','X'],['X','X','X']]\nr1 = solve([r[:] for r in b1])\nassert all(cell == 'X' for row in r1 for cell in row)\nb2 = [['X','X','X','X'],['X','O','O','X'],['X','X','O','X'],['X','O','X','X']]\nr2 = solve([r[:] for r in b2])\nassert r2[3][1] == 'O'\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 4 — Naive (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 28, stage: 4, title: "Has Path (Fresh DFS per Query)", pattern: "naive", skill: "re-run traversal per input",
    statement: "Given a directed graph and a list of queries [[start, target], ...], for each query run a FRESH DFS from start to determine if a path exists. Return a list of booleans. This is O(Q × (V+E)).",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[]}, queries=[[0,3],[2,3],[1,0]]", output: "[True, False, False]" },
    ],
    why: "Running fresh DFS for every query is wasteful when queries share the same graph. If we precomputed components (P35), each query would be O(1). This is the waste that Stage 5 optimizes.",
    starterCode: "def has_path_naive(graph, queries):\n    pass",
    hints: [
      "For each query, run DFS/BFS from start looking for target.",
      "Use a fresh visited set for each query.",
      "Return True if target is found in the traversal."
    ],
    solution: "def has_path_naive(graph, queries):\n    def dfs(node, target, visited):\n        if node == target:\n            return True\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                if dfs(nei, target, visited):\n                    return True\n        return False\n    result = []\n    for start, target in queries:\n        result.append(dfs(start, target, set()))\n    return result",
    walkthrough: "For each query, launch a fresh DFS with a new visited set. If the graph has many queries, this is wasteful — the same reachability info is recomputed. The optimization (P38) precomputes connected components.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: []}\nq = [[0,3],[2,3],[1,0]]\nassert has_path_naive(g, q) == [True, False, False]\nassert has_path_naive(g, [[0,0]]) == [True]\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 4, title: "Count Components via Repeated DFS", pattern: "naive", skill: "scan + trigger pattern",
    statement: "Count connected components in an undirected graph by scanning ALL nodes, starting DFS from each unvisited one. This IS O(V+E) — the 'naive' is a setup for understanding that this scan-trigger pattern IS optimal.",
    examples: [
      { input: "graph={0:[1],1:[0],2:[3],3:[2],4:[]}", output: "3", explain: "components: {0,1}, {2,3}, {4}" },
    ],
    why: "The standard component-counting approach is O(V+E). The pattern of 'scan all nodes, trigger DFS on unvisited ones' is the REUSABLE SKELETON. Stage 5 builds on this with optimizations.",
    starterCode: "def count_components(graph):\n    pass",
    hints: [
      "Maintain a visited set. Iterate through all nodes in graph.",
      "When you find an unvisited node, start DFS/BFS, increment count.",
      "The DFS marks all nodes in that component as visited."
    ],
    solution: "def count_components(graph):\n    visited = set()\n    count = 0\n    def dfs(node):\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs(nei)\n    for node in graph:\n        if node not in visited:\n            count += 1\n            dfs(node)\n    return count",
    walkthrough: "Scan all nodes. For each unvisited node, trigger DFS and increment count. The DFS marks the entire component. Each node/edge processed exactly once: O(V+E).",
    testCode: "g = {0: [1], 1: [0], 2: [3], 3: [2], 4: []}\nassert count_components(g) == 3\ng2 = {0: [1, 2], 1: [0], 2: [0]}\nassert count_components(g2) == 1\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Find Cycle in Undirected Graph", pattern: "naive", skill: "parent-tracking DFS",
    statement: "Given an undirected graph, return True if the graph contains ANY cycle. Use DFS with parent tracking: a back edge to an already-visited node that is NOT the parent means a cycle.",
    examples: [
      { input: "graph={0:[1,2],1:[0,2],2:[0,1]}", output: "True" },
      { input: "graph={0:[1],1:[0,2],2:[1]}", output: "False" },
    ],
    why: "Cycle detection via DFS with parent tracking. The naive approach scans all nodes and runs DFS per component. For directed graphs, Stage 5 uses tri-color (P36) which is a refinement of this idea.",
    starterCode: "def has_cycle_undirected(graph):\n    pass",
    hints: [
      "DFS takes (node, parent). For each neighbor: if neighbor == parent, skip it.",
      "If neighbor is in visited (but not parent): CYCLE FOUND.",
      "Iterate through all nodes, DFS from each unvisited node."
    ],
    solution: "def has_cycle_undirected(graph):\n    visited = set()\n    def dfs(node, parent):\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei == parent:\n                continue\n            if nei in visited or dfs(nei, node):\n                return True\n        return False\n    for node in graph:\n        if node not in visited:\n            if dfs(node, -1):\n                return True\n    return False",
    walkthrough: "DFS with parent parameter. A back edge is a neighbor that's already visited but NOT the parent — this means a cycle. The loop over all nodes handles disconnected graphs. O(V+E) for undirected graphs.",
    testCode: "g1 = {0: [1,2], 1: [0,2], 2: [0,1]}\nassert has_cycle_undirected(g1) == True\ng2 = {0: [1], 1: [0,2], 2: [1]}\nassert has_cycle_undirected(g2) == False\ng3 = {0: []}\nassert has_cycle_undirected(g3) == False\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "All Paths Source→Target (Exponential)", pattern: "naive", skill: "exhaustive DFS backtracking",
    statement: "Given a DAG (directed acyclic graph) and source/target nodes, return ALL possible paths from source to target. Each path is a list of nodes. Path count can be exponential — this problem demonstrates inherent cost.",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[3],3:[]}, source=0, target=3", output: "[[0,1,3],[0,2,3]]" },
    ],
    why: "Exhaustive path enumeration is inherently exponential — there's no optimization to remove. Not all problems can be optimized. This teaches when to recognize intrinsic complexity and accept it.",
    starterCode: "def all_paths(graph, source, target):\n    pass",
    hints: [
      "Use DFS with backtracking. Maintain a current_path list.",
      "At target: append a COPY of current_path to result (path[:]).",
      "Backtrack: append node before recursion, pop after recursion."
    ],
    solution: "def all_paths(graph, source, target):\n    result = []\n    def dfs(node, path):\n        path.append(node)\n        if node == target:\n            result.append(path[:])\n        else:\n            for nei in graph.get(node, []):\n                dfs(nei, path)\n        path.pop()\n    dfs(source, [])\n    return result",
    walkthrough: "Classic backtracking DFS. Push current node onto path. If this is the target, save a COPY of the path (critical — path continues mutating). Otherwise recurse on neighbors. Pop on backtrack.",
    testCode: "g = {0: [1,2], 1: [3], 2: [3], 3: []}\nr = all_paths(g, 0, 3)\nassert sorted([tuple(p) for p in r]) == [(0,1,3),(0,2,3)]\ng2 = {0: [1], 1: []}\nassert all_paths(g2, 0, 1) == [[0,1]]\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "All Reachable Pairs", pattern: "naive", skill: "DFS from every node",
    statement: "Given a directed graph, return a set of ALL (source, dest) pairs such that dest is reachable from source. Run DFS from every node. This is O(V × (V+E)).",
    examples: [
      { input: "graph={0:[1],1:[2],2:[]}", output: "{(0,0),(0,1),(0,2),(1,1),(1,2),(2,2)}" },
    ],
    why: "Running DFS from every node to compute the transitive closure is O(V × (V+E)). There are better algorithms for all-pairs (Floyd-Warshall), but this brute force is the clearest approach for understanding reachability.",
    starterCode: "def all_reachable_pairs(graph):\n    pass",
    hints: [
      "For each node as source, run DFS to collect all reachable nodes.",
      "Add (source, dest) pairs to a result set.",
      "Return the set of all pairs."
    ],
    solution: "def all_reachable_pairs(graph):\n    pairs = set()\n    for start in graph:\n        visited = set()\n        def dfs(node):\n            visited.add(node)\n            pairs.add((start, node))\n            for nei in graph.get(node, []):\n                if nei not in visited:\n                    dfs(nei)\n        dfs(start)\n    return pairs",
    walkthrough: "For each source node, run DFS. Every node discovered during that DFS is reachable from the source. Add (source, discovered) pairs. O(V × (V+E)) — each DFS explores up to the entire graph for each source.",
    testCode: "g = {0: [1], 1: [2], 2: []}\nr = all_reachable_pairs(g)\nassert r == {(0,0),(0,1),(0,2),(1,1),(1,2),(2,2)}\ng2 = {0: [1], 1: []}\nassert all_reachable_pairs(g2) == {(0,0),(0,1),(1,1)}\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "All-Pairs Distances", pattern: "naive", skill: "BFS from every node",
    statement: "Given an unweighted graph, compute the shortest distance between every pair of nodes. Run BFS from each node as source. Return a dict of dicts: dist[start][dest] = distance, or -1 if unreachable.",
    examples: [
      { input: "graph={0:[1],1:[0,2],2:[1]}", output: "dist[0][2]=2, dist[1][0]=1, dist[0][0]=0" },
    ],
    why: "BFS from every source gives all-pairs distances in O(V × (V+E)). Each BFS re-explores the entire graph independently. No shared computation between runs — the same waste that more advanced algorithms eliminate.",
    starterCode: "def all_pairs_distance(graph):\n    pass",
    hints: [
      "For each source, run BFS tracking distance.",
      "Store results in a nested dict.",
      "Unreachable nodes get distance -1."
    ],
    solution: "def all_pairs_distance(graph):\n    result = {}\n    for start in graph:\n        dist = {}\n        visited = set()\n        queue = [(start, 0)]\n        visited.add(start)\n        while queue:\n            node, d = queue.pop(0)\n            dist[node] = d\n            for nei in graph.get(node, []):\n                if nei not in visited:\n                    visited.add(nei)\n                    queue.append((nei, d + 1))\n        for node in graph:\n            if node not in dist:\n                dist[node] = -1\n        result[start] = dist\n    return result",
    walkthrough: "Run BFS from every node. Each BFS produces distances from that source. Merge into nested dict. Unreachable nodes (not in BFS visited) get -1. O(V × (V+E)).",
    testCode: "g = {0: [1], 1: [0,2], 2: [1]}\nd = all_pairs_distance(g)\nassert d[0][2] == 2\nassert d[1][0] == 1\nassert d[0][0] == 0\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Color Graph via Repeated DFS", pattern: "naive", skill: "check bipartite per component",
    statement: "Check if an undirected graph is bipartite (can be colored with 2 colors so no adjacent nodes share a color). Scan all nodes and start DFS from each unvisited node with alternating colors.",
    examples: [
      { input: "graph={0:[1,3],1:[0,2],2:[1,3],3:[0,2]}", output: "True", explain: "even cycle → bipartite" },
      { input: "graph={0:[1,2],1:[0,2],2:[0,1]}", output: "False", explain: "triangle → not bipartite" },
    ],
    why: "Bipartite check via DFS with coloring. Same scan-trigger pattern. If a neighbor already has the SAME color → conflict → not bipartite. This IS O(V+E) — Stage 5 uses BFS coloring as an alternative.",
    starterCode: "def is_bipartite(graph):\n    pass",
    hints: [
      "Maintain a color dict: -1 = uncolored, 0 and 1 are colors.",
      "DFS assigns the OPPOSITE color (1 - current_color) to each neighbor.",
      "If a neighbor already has the SAME color: NOT bipartite."
    ],
    solution: "def is_bipartite(graph):\n    color = {}\n    def dfs(node, c):\n        color[node] = c\n        for nei in graph.get(node, []):\n            if nei in color:\n                if color[nei] == c:\n                    return False\n            else:\n                if not dfs(nei, 1 - c):\n                    return False\n        return True\n    for node in graph:\n        if node not in color:\n            if not dfs(node, 0):\n                return False\n    return True",
    walkthrough: "DFS assigns colors 0 or 1. Neighbors must get opposite color (1-c). If a neighbor already has the same color → conflict → not bipartite. Scan all nodes for disconnected components. O(V+E).",
    testCode: "g1 = {0: [1,3], 1: [0,2], 2: [1,3], 3: [0,2]}\nassert is_bipartite(g1) == True\ng2 = {0: [1,2], 1: [0,2], 2: [0,1]}\nassert is_bipartite(g2) == False\ng3 = {0: []}\nassert is_bipartite(g3) == True\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 5 — Optimization (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 35, stage: 5, title: "Component Labeling (One Pass)", pattern: "optimization", skill: "assign component IDs during DFS",
    statement: "Given an undirected graph, assign each node a component ID (integer starting from 0). Nodes in the same connected component share the same ID. Return a dict mapping node→component_id.",
    examples: [
      { input: "graph={0:[1],1:[0],2:[3],3:[2],4:[]}", output: "{0:0,1:0,2:1,3:1,4:2}" },
    ],
    why: "Instead of just counting components (P29), LABEL each node with its component ID. This single pass produces a map that enables O(1) connectivity queries — no more running DFS per query (optimizes P28).",
    starterCode: "def label_components(graph):\n    pass",
    hints: [
      "Scan nodes. When unvisited node found: DFS flood, assigning current component_id to each node visited.",
      "Use visited set. Track component_id counter.",
      "Return dict: node → component_id."
    ],
    solution: "def label_components(graph):\n    visited = set()\n    labels = {}\n    comp_id = 0\n    def dfs(node):\n        visited.add(node)\n        labels[node] = comp_id\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs(nei)\n    for node in graph:\n        if node not in visited:\n            dfs(node)\n            comp_id += 1\n    return labels",
    walkthrough: "One sweep. DFS floods each component and stamps every node with the current component ID. After this, checking if two nodes are connected is O(1): labels[a] == labels[b]. This is the optimization P28 needed.",
    testCode: "g = {0: [1], 1: [0], 2: [3], 3: [2], 4: []}\nl = label_components(g)\nassert l == {0: 0, 1: 0, 2: 1, 3: 1, 4: 2}\nassert l[0] == l[1]\nassert l[0] != l[2]\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 5, title: "Cycle Detection (Tri-Color)", pattern: "optimization", skill: "white/gray/black DFS",
    statement: "Given a DIRECTED graph, return True if it contains a cycle. Use the tri-color method: WHITE (0) = unvisited, GRAY (1) = in current recursion stack, BLACK (2) = fully processed. A back edge to a GRAY node means a cycle.",
    examples: [
      { input: "graph={0:[1],1:[2],2:[0]}", output: "True", explain: "0→1→2→0 cycle" },
      { input: "graph={0:[1,2],1:[3],2:[3],3:[]}", output: "False" },
    ],
    why: "The tri-color method is the standard cycle detection in directed graphs. P30 handled undirected with parent tracking. Directed cycles need state tracking because a cross-edge to a finished (BLACK) node is NOT a cycle.",
    starterCode: "def has_cycle_directed(graph):\n    pass",
    hints: [
      "Use 3 states: 0=unvisited, 1=in-progress (gray), 2=done (black).",
      "DFS: mark node as 1 (gray). Recurse on neighbors.",
      "If neighbor is 1 (gray) → cycle found. After recursing all neighbors, mark as 2 (black)."
    ],
    solution: "def has_cycle_directed(graph):\n    WHITE, GRAY, BLACK = 0, 1, 2\n    state = {node: WHITE for node in graph}\n    def dfs(node):\n        state[node] = GRAY\n        for nei in graph.get(node, []):\n            if state[nei] == GRAY:\n                return True\n            if state[nei] == WHITE and dfs(nei):\n                return True\n        state[node] = BLACK\n        return False\n    for node in graph:\n        if state[node] == WHITE:\n            if dfs(node):\n                return True\n    return False",
    walkthrough: "Three colors. Gray = currently on the recursion stack. If we encounter a gray neighbor, we've found a back edge → cycle. Black nodes are fully explored and safe. This state management enables O(V+E) directed cycle detection.",
    testCode: "g1 = {0: [1], 1: [2], 2: [0]}\nassert has_cycle_directed(g1) == True\ng2 = {0: [1,2], 1: [3], 2: [3], 3: []}\nassert has_cycle_directed(g2) == False\ng3 = {0: [1], 1: []}\nassert has_cycle_directed(g3) == False\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Is Graph Bipartite (One Pass)", pattern: "optimization", skill: "BFS color 0/1 in single pass",
    statement: "Given an undirected graph, return True if it is bipartite. Use a single BFS that triggers on each unvisited component, assigning colors 0 or 1. LeetCode 785.",
    examples: [
      { input: "graph={0:[1,3],1:[0,2],2:[1,3],3:[0,2]}", output: "True", explain: "even cycle = bipartite" },
      { input: "graph={0:[1,2,3],1:[0,2],2:[0,1,3],3:[0,2]}", output: "False", explain: "odd cycles" },
    ],
    why: "BFS-based bipartite check. Each component colored independently; first conflict causes immediate failure. The queue-based approach eliminates recursion depth concerns. Complements the DFS version (P34).",
    starterCode: "def is_bipartite_bfs(graph):\n    pass",
    hints: [
      "Initialize color dict. For each uncolored node: color it 0 and run BFS.",
      "Each neighbor must get opposite color (1 - current).",
      "If neighbor already colored with same color → not bipartite."
    ],
    solution: "def is_bipartite_bfs(graph):\n    color = {}\n    for node in graph:\n        if node not in color:\n            color[node] = 0\n            queue = [node]\n            while queue:\n                cur = queue.pop(0)\n                for nei in graph.get(cur, []):\n                    if nei in color:\n                        if color[nei] == color[cur]:\n                            return False\n                    else:\n                        color[nei] = 1 - color[cur]\n                        queue.append(nei)\n    return True",
    walkthrough: "BFS coloring. Each component starts with color 0. Neighbors get opposite color. Conflict = same color neighbor → not bipartite. Early exit on first conflict. O(V+E).",
    testCode: "g1 = {0: [1,3], 1: [0,2], 2: [1,3], 3: [0,2]}\nassert is_bipartite_bfs(g1) == True\ng2 = {0: [1,2,3], 1: [0,2], 2: [0,1,3], 3: [0,2]}\nassert is_bipartite_bfs(g2) == False\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Path Exists O(V+E)", pattern: "optimization", skill: "single DFS for reachability",
    statement: "Given a directed graph and start/target nodes, return True if a path exists. Do this in O(V+E) using a SINGLE traversal. Contrast with P28 which ran fresh DFS per query.",
    examples: [
      { input: "graph={0:[1,2],1:[3],2:[],3:[]}, start=0, target=3", output: "True" },
      { input: "graph={0:[1],1:[2],2:[]}, start=0, target=5", output: "False" },
    ],
    why: "ONE traversal, O(V+E). For a single path existence query, DFS/BFS is optimal. The optimization for MULTIPLE queries comes from P35 (component labeling for O(1) queries).",
    starterCode: "def path_exists(graph, start, target):\n    pass",
    hints: [
      "Standard DFS or BFS with visited set.",
      "Return True as soon as target is found.",
      "If traversal ends without finding target: return False."
    ],
    solution: "def path_exists(graph, start, target):\n    if start == target:\n        return True\n    visited = set()\n    def dfs(node):\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei == target:\n                return True\n            if nei not in visited:\n                if dfs(nei):\n                    return True\n        return False\n    return dfs(start)",
    walkthrough: "One DFS, O(V+E). Each node and edge processed at most once. For multiple queries, component labeling (P35) is better. But for a single query, this is optimal.",
    testCode: "g = {0: [1,2], 1: [3], 2: [], 3: []}\nassert path_exists(g, 0, 3) == True\nassert path_exists(g, 2, 3) == False\nassert path_exists(g, 0, 0) == True\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Count Components O(V+E)", pattern: "optimization", skill: "single-pass component count",
    statement: "Count connected components in an undirected graph in O(V+E). Same as P29 but reframed as the OPTIMIZED version: each node and edge is processed exactly once.",
    examples: [
      { input: "graph={0:[1],1:[0],2:[3],3:[2],4:[]}", output: "3" },
    ],
    why: "P29 counted components by scanning. This IS O(V+E). The 'optimization' label emphasizes that each node/edge is processed ONCE — the visited set prevents reprocessing. The scan-trigger pattern is already optimal.",
    starterCode: "def count_components(graph):\n    pass",
    hints: [
      "Scan all nodes. Trigger DFS/BFS on each unvisited node.",
      "Visited set ensures each node processed once.",
      "Count DFS triggers = component count."
    ],
    solution: "def count_components(graph):\n    visited = set()\n    count = 0\n    for node in graph:\n        if node not in visited:\n            count += 1\n            stack = [node]\n            visited.add(node)\n            while stack:\n                cur = stack.pop()\n                for nei in graph.get(cur, []):\n                    if nei not in visited:\n                        visited.add(nei)\n                        stack.append(nei)\n    return count",
    walkthrough: "Iterative DFS/stack version. Each node entered into stack exactly once (guarded by visited). Each edge examined twice (undirected). Total: O(V+E).",
    testCode: "g = {0: [1], 1: [0], 2: [3], 3: [2], 4: []}\nassert count_components(g) == 3\ng2 = {0: [1,2], 1: [0], 2: [0]}\nassert count_components(g2) == 1\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Connected Components Lists", pattern: "optimization", skill: "collect nodes per component",
    statement: "Given an undirected graph, return a list of sets, where each set contains the nodes of one connected component. Order of components doesn't matter.",
    examples: [
      { input: "graph={0:[1],1:[0],2:[3],3:[2],4:[]}", output: "[{0,1},{2,3},{4}]" },
    ],
    why: "Extends P39 from counting to COLLECTING. Same one-pass scan-trigger pattern, but instead of incrementing count, append the current component's node set to the result list.",
    starterCode: "def connected_components(graph):\n    pass",
    hints: [
      "Scan nodes. For each unvisited: start DFS, collect all visited nodes in this run into a set.",
      "Append that set to result.",
      "Use stack/DFS or queue/BFS to traverse the component."
    ],
    solution: "def connected_components(graph):\n    visited = set()\n    result = []\n    for node in graph:\n        if node not in visited:\n            comp = set()\n            stack = [node]\n            visited.add(node)\n            while stack:\n                cur = stack.pop()\n                comp.add(cur)\n                for nei in graph.get(cur, []):\n                    if nei not in visited:\n                        visited.add(nei)\n                        stack.append(nei)\n            result.append(comp)\n    return result",
    walkthrough: "Same scan-trigger DFS pattern. This time, collect every node visited during the DFS into a component set. Append the set to result. O(V+E).",
    testCode: "g = {0: [1], 1: [0], 2: [3], 3: [2], 4: []}\ncomps = connected_components(g)\nassert {frozenset(c) for c in comps} == {frozenset({0,1}), frozenset({2,3}), frozenset({4})}\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Strongly Connected Components (Kosaraju)", pattern: "optimization", skill: "two-pass DFS for SCC",
    statement: "Given a directed graph, return the number of Strongly Connected Components (SCCs). An SCC is a maximal set where every node can reach every other node. Use Kosaraju: (1) DFS forward recording finish order, (2) DFS backward on reversed graph in reverse finish order.",
    examples: [
      { input: "graph={0:[1],1:[2],2:[0,3],3:[4],4:[]}", output: "3", explain: "SCCs: {0,1,2}, {3}, {4}" },
    ],
    why: "SCC is the optimization of connected components for DIRECTED graphs. Two-pass: forward DFS for ordering, then reverse DFS to discover components. Bridges to topological sort (P43) — both use post-order and graph reversal.",
    starterCode: "def scc_count(graph):\n    pass",
    hints: [
      "First pass: DFS on original graph, record nodes in finish order (append after recursing neighbors).",
      "Build reverse graph (edges flipped).",
      "Second pass: DFS on reverse graph, processing nodes in reverse finish order. Each DFS tree = one SCC."
    ],
    solution: "def scc_count(graph):\n    visited = set()\n    finish_order = []\n    def dfs1(node):\n        visited.add(node)\n        for nei in graph.get(node, []):\n            if nei not in visited:\n                dfs1(nei)\n        finish_order.append(node)\n    for node in graph:\n        if node not in visited:\n            dfs1(node)\n    rev = {node: [] for node in graph}\n    for u in graph:\n        for v in graph[u]:\n            rev[v].append(u)\n    visited.clear()\n    count = 0\n    while finish_order:\n        node = finish_order.pop()\n        if node not in visited:\n            count += 1\n            stack = [node]\n            visited.add(node)\n            while stack:\n                cur = stack.pop()\n                for nei in rev.get(cur, []):\n                    if nei not in visited:\n                        visited.add(nei)\n                        stack.append(nei)\n    return count",
    walkthrough: "Kosaraju: (1) forward DFS records nodes in post-order (finish times). (2) reverse graph. (3) process nodes in reverse post-order on reversed graph. Each DFS tree in step 3 is one SCC. O(V+E).",
    testCode: "g = {0: [1], 1: [2], 2: [0,3], 3: [4], 4: []}\nassert scc_count(g) == 3\ng2 = {0: [1], 1: [2], 2: [0]}\nassert scc_count(g2) == 1\ng3 = {0: [1], 1: []}\nassert scc_count(g3) == 2\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 6 — Mastery (9 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 42, stage: 6, title: "Clone Graph", pattern: "mastery", skill: "DFS/BFS + old→new node map",
    statement: "Given a reference to a node in a connected undirected graph (each node has a val and neighbors list), return a DEEP COPY of the entire graph. Use a hash map to track old→new node mappings. LeetCode 133.",
    examples: [
      { input: "graph with adjacency {0:[1,2],1:[0,2],2:[0,1]}", output: "a deep copy with same structure" },
    ],
    why: "Clone = traverse + create duplicates + wire pointers. The old→new mapping ensures each original node maps to exactly one copy. DFS/BFS both work; the map prevents infinite recursion.",
    starterCode: "class Node:\n    def __init__(self, val=0, neighbors=None):\n        self.val = val\n        self.neighbors = neighbors if neighbors else []\n\ndef clone_graph(node):\n    pass",
    hints: [
      "If node is None, return None. Use a dict: old_node → new_node.",
      "DFS: for each neighbor, if not cloned, recurse. Then append cloned neighbor to new node's neighbors list.",
      "The map prevents infinite recursion and ensures each old node maps to exactly one new node."
    ],
    solution: "def clone_graph(node):\n    if node is None:\n        return None\n    old_to_new = {}\n    def dfs(old):\n        if old in old_to_new:\n            return old_to_new[old]\n        copy = Node(old.val)\n        old_to_new[old] = copy\n        for nei in old.neighbors:\n            copy.neighbors.append(dfs(nei))\n        return copy\n    return dfs(node)",
    walkthrough: "DFS creates a new Node. Before recursing on neighbors, check the map — if already cloned, return the existing copy. This prevents double-cloning and infinite loops. The map IS the optimization that makes O(V+E) possible.",
    testCode: "class Node:\n    def __init__(self, val=0, neighbors=None):\n        self.val = val\n        self.neighbors = neighbors if neighbors is not None else []\n\nclass H:\n    @staticmethod\n    def build(adj):\n        nodes = {k: Node(k) for k in adj}\n        for k in adj:\n            for nei in adj[k]:\n                nodes[k].neighbors.append(nodes[nei])\n        return nodes[0] if nodes else None\n    @staticmethod\n    def adj(node):\n        if node is None: return {}\n        adj_map, vis, q = {}, set(), [node]\n        vis.add(node)\n        while q:\n            cur = q.pop(0)\n            adj_map[cur.val] = sorted([n.val for n in cur.neighbors])\n            for nei in cur.neighbors:\n                if nei not in vis:\n                    vis.add(nei)\n                    q.append(nei)\n        return adj_map\n\ng1 = H.build({0: [1,2], 1: [0,2], 2: [0,1]})\nc1 = clone_graph(g1)\nassert H.adj(c1) == {0: [1,2], 1: [0,2], 2: [0,1]}\nassert c1 is not g1\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 6, title: "Topological Sort (Kahn's Algorithm)", pattern: "mastery", skill: "indegree + queue",
    statement: "Given a DAG with n nodes (0 to n-1) and a list of directed edges [[from, to], ...], return a topological ordering using Kahn's algorithm. If the graph has a cycle, return an empty list.",
    examples: [
      { input: "n=4, edges=[[1,0],[2,0],[3,1],[3,2]]", output: "[0,1,2,3] or [0,2,1,3]", explain: "multiple valid orders" },
    ],
    why: "Kahn's: compute indegree, queue nodes with indegree 0, process them (decrement neighbors' indegree, enqueue when 0). If all n nodes processed: valid order. If not: cycle exists.",
    starterCode: "def topo_sort_kahn(n, edges):\n    pass",
    hints: [
      "Build adjacency list and indegree array. indegree = number of incoming edges.",
      "Queue all nodes with indegree 0. While queue: pop, append to result, decrement neighbors' indegree.",
      "If neighbor's indegree becomes 0: enqueue it. Return result if len(result) == n, else []."
    ],
    solution: "def topo_sort_kahn(n, edges):\n    adj = {i: [] for i in range(n)}\n    indegree = {i: 0 for i in range(n)}\n    for u, v in edges:\n        adj[u].append(v)\n        indegree[v] += 1\n    queue = [i for i in range(n) if indegree[i] == 0]\n    result = []\n    while queue:\n        node = queue.pop(0)\n        result.append(node)\n        for nei in adj[node]:\n            indegree[nei] -= 1\n            if indegree[nei] == 0:\n                queue.append(nei)\n    return result if len(result) == n else []",
    walkthrough: "Kahn's: nodes with no incoming edges can be placed first. Remove them, update indegree of their neighbors. Repeat. If we process all n nodes: valid topo order. If not: cycle exists. O(V+E).",
     testCode: "r = topo_sort_kahn(4, [[1,0],[2,0],[3,1],[3,2]])\nassert r in [[3,1,2,0],[3,2,1,0]], f'Got {r}'\nr2 = topo_sort_kahn(3, [[0,1],[1,2],[2,0]])\nassert r2 == []\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Topological Sort (DFS Post-Order)", pattern: "mastery", skill: "DFS finish time",
    statement: "Same as P43 but use DFS post-order: run DFS, add nodes to a list AFTER recursing on all neighbors. Reverse this list to get the topological order. If cycle detected (back edge to GRAY node), return empty list.",
    examples: [
      { input: "n=4, edges=[[1,0],[2,0],[3,1],[3,2]]", output: "[3,1,2,0] or [3,2,1,0]", explain: "post-order reversed" },
    ],
    why: "DFS post-order: a node is finished only after all descendants. Reversing the finish order gives topological order. Composes P36 (tri-color) + post-order collection.",
    starterCode: "def topo_sort_dfs(n, edges):\n    pass",
    hints: [
      "Build adjacency list. Use tri-color state (WHITE/GRAY/BLACK) for cycle detection.",
      "DFS: mark GRAY, recurse on neighbors, on finish mark BLACK and append to postorder list.",
      "If cycle detected (GRAY neighbor): return []. Otherwise: reverse postorder list."
    ],
    solution: "def topo_sort_dfs(n, edges):\n    adj = {i: [] for i in range(n)}\n    for u, v in edges:\n        adj[u].append(v)\n    WHITE, GRAY, BLACK = 0, 1, 2\n    state = {i: WHITE for i in range(n)}\n    order = []\n    def dfs(node):\n        state[node] = GRAY\n        for nei in adj[node]:\n            if state[nei] == GRAY:\n                return False\n            if state[nei] == WHITE and not dfs(nei):\n                return False\n        state[node] = BLACK\n        order.append(node)\n        return True\n    for i in range(n):\n        if state[i] == WHITE:\n            if not dfs(i):\n                return []\n    order.reverse()\n    return order",
    walkthrough: "DFS with tri-color. When node finishes (BLACK), append to list. After all DFS, reverse the list. The reverse of finish times = topological order. Cycle detection checks for GRAY neighbors.",
    testCode: "r = topo_sort_dfs(4, [[1,0],[2,0],[3,1],[3,2]])\nassert r in [[3,1,2,0],[3,2,1,0]], f'Got {r}'\nassert topo_sort_dfs(3, [[0,1],[1,2],[2,0]]) == []\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Course Schedule I (Cycle Detection)", pattern: "mastery", skill: "prerequisite graph = cycle check",
    statement: "There are numCourses (0 to n-1) and prerequisites[i] = [a, b] means take b before a. Return True if you can finish all courses (no cycle in the directed graph). LeetCode 207.",
    examples: [
      { input: "n=2, prereqs=[[1,0]]", output: "True", explain: "take 0 then 1" },
      { input: "n=2, prereqs=[[1,0],[0,1]]", output: "False", explain: "cycle: 0 needs 1, 1 needs 0" },
    ],
    why: "Directly applies P36 (tri-color cycle detection) to a real problem. Prerequisites form a directed graph. Can finish all courses ⇔ no cycle. The graph abstraction is the solution.",
    starterCode: "def can_finish(n, prerequisites):\n    pass",
    hints: [
      "Build adjacency list: for each [a,b], edge b→a (b is prerequisite, a depends on b).",
      "Use tri-color DFS (WHITE/GRAY/BLACK) to detect cycle.",
      "If a cycle exists anywhere: return False."
    ],
    solution: "def can_finish(n, prerequisites):\n    adj = {i: [] for i in range(n)}\n    for a, b in prerequisites:\n        adj[b].append(a)\n    WHITE, GRAY, BLACK = 0, 1, 2\n    state = {i: WHITE for i in range(n)}\n    def dfs(node):\n        state[node] = GRAY\n        for nei in adj[node]:\n            if state[nei] == GRAY:\n                return False\n            if state[nei] == WHITE and not dfs(nei):\n                return False\n        state[node] = BLACK\n        return True\n    for i in range(n):\n        if state[i] == WHITE:\n            if not dfs(i):\n                return False\n    return True",
    walkthrough: "Model courses as nodes, prerequisites as directed edges b→a. Detect cycle using tri-color DFS (P36). If any cycle exists, courses cannot be completed. O(V+E).",
    testCode: "assert can_finish(2, [[1,0]]) == True\nassert can_finish(2, [[1,0],[0,1]]) == False\nassert can_finish(3, [[0,1],[1,2]]) == True\nassert can_finish(4, [[0,1],[1,2],[2,3],[3,0]]) == False\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Course Schedule II (Topo Order)", pattern: "mastery", skill: "Kahn's returns course order",
    statement: "Same as P45 but return the ORDER in which to take the courses as a list. If impossible due to a cycle, return an empty list. This is LeetCode 210.",
    examples: [
      { input: "n=4, prereqs=[[1,0],[2,0],[3,1],[3,2]]", output: "[0,1,2,3] or [0,2,1,3]" },
      { input: "n=2, prereqs=[[1,0],[0,1]]", output: "[]" },
    ],
    why: "Course Schedule II = topological sort on the prerequisite graph. Applies P43 (Kahn's) directly. The topo order IS a valid course-taking order. Cycle → impossible → empty list.",
    starterCode: "def find_order(n, prerequisites):\n    pass",
    hints: [
      "Build adjacency list: edge b→a (take b before a).",
      "Use Kahn's algorithm: indegree queue, process nodes, return order.",
      "If len(order) != n: cycle exists, return []."
    ],
    solution: "def find_order(n, prerequisites):\n    adj = {i: [] for i in range(n)}\n    indegree = {i: 0 for i in range(n)}\n    for a, b in prerequisites:\n        adj[b].append(a)\n        indegree[a] += 1\n    queue = [i for i in range(n) if indegree[i] == 0]\n    order = []\n    while queue:\n        node = queue.pop(0)\n        order.append(node)\n        for nei in adj[node]:\n            indegree[nei] -= 1\n            if indegree[nei] == 0:\n                queue.append(nei)\n    return order if len(order) == n else []",
    walkthrough: "Kahn's algorithm on the prerequisite graph. Build adj with b→a edges. Process nodes with indegree 0. If order contains all n nodes: valid course sequence. Otherwise: cycle detected. O(V+E).",
    testCode: "r = find_order(4, [[1,0],[2,0],[3,1],[3,2]])\nassert r in [[0,1,2,3],[0,2,1,3]], f'Got {r}'\nassert find_order(2, [[1,0],[0,1]]) == []\nassert find_order(1, []) == [0]\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Word Ladder", pattern: "mastery", skill: "BFS on implicit graph between words",
    statement: "Given beginWord, endWord, and wordList, return the length of the shortest transformation sequence from beginWord to endWord. Each step changes exactly one letter, and every intermediate word must be in wordList. LeetCode 127.",
    examples: [
      { input: 'begin="hit", end="cog", wordList=["hot","dot","dog","lot","log","cog"]', output: "5", explain: "hit→hot→dot→dog→cog (5 words)" },
    ],
    why: "The graph is IMPLICIT — nodes are words, edges connect words differing by one letter. Build the graph on-the-fly or precompute patterns. BFS finds the shortest transformation. This is BFS on state space (P15) applied to word mutation.",
    starterCode: "def word_ladder(begin, end, word_list):\n    pass",
    hints: [
      "Add beginWord to word list if not present. Build pattern dict: 'h*t' → ['hit','hot']. etc.",
      "BFS from beginWord: at each word, generate all patterns and enqueue neighbor words.",
      "Track distance. Return distance when endWord is reached. If BFS exhausts: return 0."
    ],
    solution: "def word_ladder(begin, end, word_list):\n    words = set(word_list)\n    if end not in words:\n        return 0\n    words.add(begin)\n    patterns = {}\n    for w in words:\n        for i in range(len(w)):\n            key = w[:i] + '*' + w[i+1:]\n            if key not in patterns:\n                patterns[key] = []\n            patterns[key].append(w)\n    visited = set()\n    queue = [(begin, 1)]\n    visited.add(begin)\n    while queue:\n        word, dist = queue.pop(0)\n        if word == end:\n            return dist\n        for i in range(len(word)):\n            key = word[:i] + '*' + word[i+1:]\n            for nei in patterns.get(key, []):\n                if nei not in visited:\n                    visited.add(nei)\n                    queue.append((nei, dist + 1))\n    return 0",
    walkthrough: "Pattern-based graph construction: for each word, create pattern 'h*t' for each position. Words sharing a pattern are neighbors (differ by 1 letter). BFS from beginWord finds shortest path. O(M² × N) where M=word length, N=words.",
    testCode: "wl = ['hot','dot','dog','lot','log','cog']\nassert word_ladder('hit', 'cog', wl) == 5\nassert word_ladder('hit', 'cog', ['hot','dot','dog','lot','log']) == 0\nassert word_ladder('a', 'c', ['a','b','c']) == 2\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Open the Lock", pattern: "mastery", skill: "BFS on state space graph",
    statement: "Given a 4-digit lock starting at '0000', target code, and deadends list (codes that stop the wheels), return the minimum number of turns to reach the target. Each turn rotates one wheel by +1 or -1 (0→9 and 9→0). LeetCode 752.",
    examples: [
      { input: 'deadends=["0201","0101","0102","1212","2002"], target="0202"', output: "6", explain: "0000→1000→1100→1200→1201→1202→0202" },
      { input: 'deadends=["8888"], target="0009"', output: "1" },
    ],
    why: "BFS on a state space. Nodes are lock codes (0000-9999, 10⁴ states). Edges are wheel rotations (+1/-1 per wheel). BFS finds shortest path from '0000'. This is BFS applied to an implicit graph where nodes are generated on-the-fly.",
    starterCode: "def open_lock(deadends, target):\n    pass",
    hints: [
      "Start BFS from '0000'. Track visited (including deadends as visited).",
      "At each state, generate 8 neighbors (4 wheels × 2 directions).",
      "Return distance when target reached. If '0000' is a deadend: return -1."
    ],
    solution: "def open_lock(deadends, target):\n    dead = set(deadends)\n    if '0000' in dead:\n        return -1\n    if target == '0000':\n        return 0\n    visited = set(['0000'])\n    queue = [('0000', 0)]\n    while queue:\n        state, dist = queue.pop(0)\n        for i in range(4):\n            digit = int(state[i])\n            for d in [-1, 1]:\n                nd = (digit + d) % 10\n                nxt = state[:i] + str(nd) + state[i+1:]\n                if nxt == target:\n                    return dist + 1\n                if nxt not in visited and nxt not in dead:\n                    visited.add(nxt)\n                    queue.append((nxt, dist + 1))\n    return -1",
    walkthrough: "Each state 'ABCD' has 8 neighbors (each wheel +1 or -1, modulo 10). BFS from '0000'. Deadends are pre-marked as visited so they're never explored. Shortest path found when target is reached. 10⁴ possible states — manageable.",
    testCode: "d1 = ['0201','0101','0102','1212','2002']\nassert open_lock(d1, '0202') == 6\nd2 = ['8888']\nassert open_lock(d2, '0009') == 1\nassert open_lock(['0000'], '8888') == -1\nassert open_lock([], '0000') == 0\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "All Paths Source→Target (DAG)", pattern: "mastery", skill: "DFS in DAG with path collection",
    statement: "Given a DAG with n nodes (0 to n-1), return all possible paths from node 0 to node n-1. The graph is given as an adjacency list. Return paths as list of lists. LeetCode 797.",
    examples: [
      { input: "graph=[[1,2],[3],[3],[]]", output: "[[0,1,3],[0,2,3]]" },
    ],
    why: "DAG version of P31. Since there are no cycles, DFS without visited (just the current path) is safe and simpler. Each node can appear in multiple paths; visited is per-path, not global.",
    starterCode: "def all_paths_dag(graph):\n    pass",
    hints: [
      "DFS from node 0 with current path list. Target is n-1.",
      "At target: save a copy of the current path.",
      "No visited set needed — DAG guarantees no cycles. But path is backtracked."
    ],
    solution: "def all_paths_dag(graph):\n    n = len(graph)\n    result = []\n    def dfs(node, path):\n        path.append(node)\n        if node == n - 1:\n            result.append(path[:])\n        else:\n            for nei in graph[node]:\n                dfs(nei, path)\n        path.pop()\n    dfs(0, [])\n    return result",
    walkthrough: "Classic backtracking DFS on a DAG. No visited set — cycles don't exist. Each path is built via append/pop. At target (n-1), save a copy. Simpler than P31 because DAG structure eliminates infinite-loop concerns.",
    testCode: "g = [[1,2],[3],[3],[]]\nr = all_paths_dag(g)\nassert sorted([tuple(p) for p in r]) == [(0,1,3),(0,2,3)]\ng2 = [[1],[]]\nassert all_paths_dag(g2) == [[0,1]]\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Reconstruct Itinerary", pattern: "mastery", skill: "Euler path via Hierholzer's algorithm",
    statement: "Given list of [from, to] airline tickets, reconstruct the itinerary starting from 'JFK'. Use all tickets exactly once. If multiple valid, take the lexicographically smallest path. LeetCode 332. Use Hierholzer's: DFS on sorted adjacency, building path in reverse.",
    examples: [
      { input: "tickets=[['MUC','LHR'],['JFK','MUC'],['SFO','SJC'],['LHR','SFO']]", output: "['JFK','MUC','LHR','SFO','SJC']" },
      { input: "tickets=[['JFK','SFO'],['JFK','ATL'],['SFO','ATL'],['ATL','JFK'],['ATL','SFO']]", output: "['JFK','ATL','JFK','SFO','ATL','SFO']" },
    ],
    why: "Euler path in a directed graph. Hierholzer's: DFS from start, greedily consuming edges. When stuck (no outgoing edges left), add node to result stack. Reverse the result. This is graph traversal + edge consumption — a new dimension of graph mastery.",
    starterCode: "def find_itinerary(tickets):\n    pass",
    hints: [
      "Build adjacency list sorted in REVERSE lexicographic order (so pop() takes smallest).",
      "DFS from 'JFK': while node has outgoing edges, pop the last one and recurse.",
      "After exhausting edges, append node to result. Return reversed result."
    ],
    solution: "def find_itinerary(tickets):\n    from collections import defaultdict\n    graph = defaultdict(list)\n    for src, dst in sorted(tickets, reverse=True):\n        graph[src].append(dst)\n    result = []\n    def dfs(airport):\n        while graph[airport]:\n            dfs(graph[airport].pop())\n        result.append(airport)\n    dfs('JFK')\n    return result[::-1]",
    walkthrough: "Hierholzer's algorithm: sort tickets reverse-lexicographically so pop() from end gives smallest first. DFS greedily consumes edges. When node has no outgoing edges, add to result. Reverse result for the path. O(E log E) for sorting.",
    testCode: "t1 = [['MUC','LHR'],['JFK','MUC'],['SFO','SJC'],['LHR','SFO']]\nr1 = find_itinerary(t1)\nassert r1 == ['JFK','MUC','LHR','SFO','SJC'], f'Got {r1}'\nt2 = [['JFK','SFO'],['JFK','ATL'],['SFO','ATL'],['ATL','JFK'],['ATL','SFO']]\nr2 = find_itinerary(t2)\nassert r2 == ['JFK','ATL','JFK','SFO','ATL','SFO'], f'Got {r2}'\nprint('All tests passed!')"
  },
]
