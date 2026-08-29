import type { OneProblem } from "./one"

export const PROBLEMS_ONE_J: OneProblem[] = [
  {
    id: 137, stage: 24, title: "Rotting Oranges", pattern: "multi-source BFS", skill: "many starting fires, one clock", difficulty: "Medium",
    statement: "Grid cells: 2 = rotten, 1 = fresh, 0 = empty. Each minute, rot spreads from every rotten cell to 4-adjacent fresh cells. Return minutes until no fresh orange remains, or -1 if impossible.",
    examples: [
      { input: "grid = [[2, 1, 1], [1, 1, 0], [0, 1, 1]]", output: "4" },
      { input: "grid = [[2, 1, 1], [0, 1, 1], [1, 0, 1]]", output: "-1", explain: "the (2, 0) orange is sealed off" },
    ],
    why: "Single-source BFS (stage 11) measured distance from ONE start; reality often lights MANY matches at once. The fix is exactly one line of concept: seed the queue with ALL rotten cells at distance 0. Multi-source BFS computes 'distance to the nearest source' — the same idea that powers fire-spread, gradient fields, and nearest-exit routing.",
    starterCode: "def oranges_rotting(grid):\n    pass",
    hints: [
      "Seed the queue with every initially-rotten cell; count the fresh.",
      "BFS in waves: each wave is one minute — or carry (r, c, minute) in the queue and track the max minute.",
      "After the spread, fresh count > 0 means an isolated region: -1."
    ],
    solution: "from collections import deque\n\ndef oranges_rotting(grid):\n    rows, cols = len(grid), len(grid[0])\n    queue = deque()\n    fresh = 0\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c] == 2:\n                queue.append((r, c, 0))\n            elif grid[r][c] == 1:\n                fresh += 1\n    minutes = 0\n    while queue:\n        r, c, t = queue.popleft()\n        if t > minutes:\n            minutes = t\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:\n                grid[nr][nc] = 2\n                fresh -= 1\n                queue.append((nr, nc, t + 1))\n    return minutes if fresh == 0 else -1",
    walkthrough: "Every rotten cell enters at t = 0; the BFS wavefront is the rot's boundary and the timestamp IS the distance-to-nearest-source. Sinking fresh cells on visit prevents double-processing. Second example fails because (2, 0) never gains a rotten neighbor: the fresh counter stays positive, the honest -1.",
    testCode: "assert oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]) == 4\nassert oranges_rotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]]) == -1\nassert oranges_rotting([[0, 2]]) == 0\nassert oranges_rotting([[1]]) == -1\nprint('All tests passed!')"
  },
  {
    id: 138, stage: 24, title: "Pacific Atlantic", pattern: "reverse multi-source DFS", skill: "flow the question backwards", difficulty: "Medium",
    statement: "A grid of heights: rain on a cell flows to a neighbor of equal-or-LOWER height, and reaches the Pacific (top row + left column) or the Atlantic (bottom row + right column). Return all cells that drain to BOTH oceans, sorted.",
    examples: [
      { input: "heights = [[1,2,2,3,5], [3,2,3,4,4], [2,4,5,3,1], [6,7,1,4,5], [5,1,1,2,4]]", output: "[[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]" },
    ],
    why: "Checking every cell against both oceans is O(cells²). Reverse the flow: start BFS from the OCEAN borders and climb UPHILL (neighbor ≥ current) — everything reached drains to that ocean. Two traversals from the borders instead of one per cell: the same 'search backwards from the answer' inversion as multi-source BFS, one level deeper. This reframing turns an intractable per-cell question into two linear passes.",
    starterCode: "def pacific_atlantic(heights):\n    pass",
    hints: [
      "Write one helper: collect cells reachable by climbing from a given set of border starts.",
      "Pacific starts: top row + left column. Atlantic: bottom row + right column.",
      "Climb means neighbor height >= current height. Intersect the two sets; sort."
    ],
    solution: "def pacific_atlantic(heights):\n    rows, cols = len(heights), len(heights[0])\n    def collect(starts):\n        seen = set(starts)\n        stack = list(starts)\n        while stack:\n            r, c = stack.pop()\n            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n                nr, nc = r + dr, c + dc\n                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and heights[nr][nc] >= heights[r][c]:\n                    seen.add((nr, nc))\n                    stack.append((nr, nc))\n        return seen\n    pacific = collect([(0, c) for c in range(cols)] + [(r, 0) for r in range(rows)])\n    atlantic = collect([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows)])\n    return sorted(pacific & atlantic)",
    walkthrough: "Climbing from the Pacific border marks every cell with a non-increasing rain path into it — [1, 3] (height 4) qualifies via 4 → 3 → 2 → 2 → 1 downhill to the top. The intersection [0,4], [1,3], [1,4], [2,2], [3,0], [3,1], [4,0] is the ridge that drinks from both oceans. Two O(cells) traversals replace cells × 2 floods.",
    testCode: "result = pacific_atlantic([[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]])\nassert [list(cell) for cell in result] == [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]\nassert [list(c) for c in pacific_atlantic([[1]])] == [[0, 0]]\nassert [list(c) for c in pacific_atlantic([[1, 2], [4, 3]])] == [[0, 1], [1, 0], [1, 1]]\nprint('All tests passed!')"
  },
  {
    id: 139, stage: 24, title: "Graph Valid Tree", pattern: "three counting facts", skill: "a tree is n-1 edges, connected, acyclic", difficulty: "Medium",
    statement: "Given n nodes labeled 0..n-1 and an undirected edge list, return True if they form exactly one tree.",
    examples: [
      { input: "n = 5, edges = [[0, 1], [0, 2], [0, 3], [1, 4]]", output: "True" },
      { input: "n = 5, edges = [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]", output: "False", explain: "the 1-2-3-1 cycle" },
      { input: "n = 4, edges = [[0, 1], [2, 3]]", output: "False", explain: "two components" },
    ],
    why: "The elegant fact: for a simple undirected graph, ANY TWO of {connected, acyclic, n−1 edges} imply the third. So the whole check is: len(edges) == n − 1, then one connectivity test (DSU with cycle-detection on the way — stage 13's redundant edge is literally this check's engine). Recognizing when two cheap facts buy the third is combinatorial maturity.",
    starterCode: "def valid_tree(n, edges):\n    pass",
    hints: [
      "If len(edges) != n - 1, return False — covers both the cycle and disconnected cases' edge counts... almost.",
      "With n - 1 edges, run union-find: the first edge whose endpoints already share a root means a cycle.",
      "If no failed union occurred with n - 1 edges, the graph is connected AND acyclic."
    ],
    solution: "def valid_tree(n, edges):\n    if len(edges) != n - 1:\n        return False\n    parent = list(range(n))\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n    for a, b in edges:\n        ra, rb = find(a), find(b)\n        if ra == rb:\n            return False\n        parent[ra] = rb\n    return True",
    walkthrough: "n − 1 edges + acyclic ⟹ connected (a forest with c components has n − c edges; c = 1 exactly when edges = n − 1 and no cycle). The cycle check rides the unions for free. Third example: edges = 2 ≠ 3 = n − 1, rejected before any traversal — the count did all the work.",
    testCode: "assert valid_tree(5, [[0, 1], [0, 2], [0, 3], [1, 4]]) == True\nassert valid_tree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]) == False\nassert valid_tree(4, [[0, 1], [2, 3]]) == False\nassert valid_tree(1, []) == True\nprint('All tests passed!')"
  },
  {
    id: 140, stage: 24, title: "Evaluate Division", pattern: "weighted graph search", skill: "ratios multiply along paths", difficulty: "Medium",
    statement: "Equations a/b = value define ratios between variables. Answer queries x/y as a ratio, or -1.0 when unknown. Values: equations[i] = [num, den] with values[i] = num/den.",
    examples: [
      { input: "equations = [['a', 'b'], ['b', 'c']], values = [2.0, 3.0], queries = [['a', 'c'], ['b', 'a'], ['a', 'e'], ['a', 'a'], ['x', 'x']]", output: "[6.0, 0.5, -1.0, 1.0, -1.0]" },
    ],
    why: "A ratio is an EDGE WEIGHT: a→b costs 2, b→c costs 3, so a/c = product along the path = 6. Division queries become graph reachability with multiplicative accumulation — BFS/DFS carrying a running product. The modeling is the entire problem: once 'ratio = edge weight' clicks, the code is stage 11's traversal with * instead of +. (A weighted DSU also solves it — two theories, one graph.)",
    starterCode: "def calc_equations(equations, values, queries):\n    pass",
    hints: [
      "Build adjacency both ways: num → (den, value) and den → (num, 1/value).",
      "For each query, BFS from numerator carrying a running product.",
      "Query x/x on a known variable is 1.0 (path of length 0); anything touching an unknown variable is -1.0."
    ],
    solution: "from collections import deque\n\ndef calc_equations(equations, values, queries):\n    adj = {}\n    for (num, den), val in zip(equations, values):\n        adj.setdefault(num, []).append((den, val))\n        adj.setdefault(den, []).append((num, 1.0 / val))\n    def query(num, den):\n        if num not in adj or den not in adj:\n            return -1.0\n        if num == den:\n            return 1.0\n        seen = {num}\n        queue = deque([(num, 1.0)])\n        while queue:\n            var, product = queue.popleft()\n            for nb, weight in adj[var]:\n                if nb == den:\n                    return product * weight\n                if nb not in seen:\n                    seen.add(nb)\n                    queue.append((nb, product * weight))\n        return -1.0\n    return [query(a, b) for a, b in queries]",
    walkthrough: "a/c: BFS a → (b, ×2) → (c, ×3) returns 6.0. b/a: b → (a, ×0.5) = 0.5 — the reciprocal edges make every direction searchable. x/x is -1.0 because x was never declared: unknown variables fail the membership check before the self-query shortcut. BFS termination is safe: the seen set kills cycles like a/b = b/a.",
    testCode: "result = calc_equations([['a', 'b'], ['b', 'c']], [2.0, 3.0], [['a', 'c'], ['b', 'a'], ['a', 'e'], ['a', 'a'], ['x', 'x']])\nassert abs(result[0] - 6.0) < 1e-9\nassert abs(result[1] - 0.5) < 1e-9\nassert result[2] == -1.0\nassert abs(result[3] - 1.0) < 1e-9\nassert result[4] == -1.0\nprint('All tests passed!')"
  },
  {
    id: 141, stage: 24, title: "Bus Routes", pattern: "BFS on the right nodes", skill: "choose what a state is", difficulty: "Hard",
    statement: "Routes are lists of stops (buses loop forever). Return the minimum number of BUSES boarded to travel from source to target (0 if already there), or -1.",
    examples: [
      { input: "routes = [[1, 2, 7], [3, 6, 7]], source = 1, target = 6", output: "2", explain: "route [1,2,7] then switch at 7 to [3,6,7]" },
      { input: "routes = [[2], [2, 8]], source = 8, target = 2", output: "1" },
    ],
    why: "The classic modeling trap: BFS over STOPS counts steps between stops — not buses. The question's unit is a BOARDING, so the state must be a ROUTE: pre-map stop → routes through it, BFS from the source's routes, and each layer = one more bus. Choosing the node that matches the question's cost unit is the deepest modeling lesson in this ladder: the algorithm was never the hard part; the state was.",
    starterCode: "def bus_routes(routes, source, target):\n    pass",
    hints: [
      "If source == target, return 0 — no boarding needed.",
      "stop_to_routes[stop] = route indices containing that stop.",
      "BFS over routes: start from all routes containing source; from a route, every unvisited route sharing a stop is one boarding away."
    ],
    solution: "from collections import deque\n\ndef bus_routes(routes, source, target):\n    if source == target:\n        return 0\n    stop_to_routes = {}\n    for i, stops in enumerate(routes):\n        for s in stops:\n            stop_to_routes.setdefault(s, []).append(i)\n    seen_route = set()\n    seen_stop = {source}\n    queue = deque()\n    for i in stop_to_routes.get(source, []):\n        queue.append((i, 1))\n        seen_route.add(i)\n    while queue:\n        route_index, buses = queue.popleft()\n        for stop in routes[route_index]:\n            if stop == target:\n                return buses\n            if stop not in seen_stop:\n                seen_stop.add(stop)\n                for nxt in stop_to_routes.get(stop, []):\n                    if nxt not in seen_route:\n                        seen_route.add(nxt)\n                        queue.append((nxt, buses + 1))\n    return -1",
    walkthrough: "Routes are the nodes, shared stops are the edges; the stop→routes index is what makes 'transfer here' a constant-time lookup. Two seen-sets prevent the classic double-count (a route seen via a new stop, a stop seen via a new route). First example: route 0 at depth 1 → stop 7 → route 1 at depth 2 → stop 6 = target.",
    testCode: "assert bus_routes([[1, 2, 7], [3, 6, 7]], 1, 6) == 2\nassert bus_routes([[2], [2, 8]], 8, 2) == 1\nassert bus_routes([[1, 7], [3, 5]], 5, 5) == 0\nassert bus_routes([[7, 12], [4, 5, 6], [8, 9]], 7, 9) == -1\nprint('All tests passed!')"
  },
  {
    id: 142, stage: 24, title: "Reconstruct Itinerary", pattern: "Hierholzer's Euler path", skill: "use tickets greedily, unwind in reverse", difficulty: "Hard",
    statement: "Tickets are one-way flights [from, to]; reconstruct the itinerary using EVERY ticket exactly once, starting at JFK, taking the lexically smallest destination first. Return the airport sequence.",
    examples: [
      { input: "tickets = [['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']]", output: "['JFK', 'ATL', 'JFK', 'SFO', 'ATL', 'SFO']" },
    ],
    why: "This is an Euler path (use every EDGE once) — and greedy 'smallest first' fails naively because you can fly into a dead end with tickets left. Hierholzer's insight: that failure is SELF-REPAIRING. DFS greedily; when stuck at a node with no exits, record it and unwind — the post-order is the itinerary REVERSED. Dead ends get spliced into the middle by later returns. Same post-order-reversal spirit as Kosaraju (stage 13), applied to edges instead of nodes.",
    starterCode: "def find_itinerary(tickets):\n    pass",
    hints: [
      "Build adjacency with destinations sorted (pop from the end = smallest available).",
      "DFS from 'JFK': while the current airport has unused tickets, fly the smallest.",
      "When stuck, push the airport onto the route; after the DFS, reverse the route."
    ],
    solution: "def find_itinerary(tickets):\n    adj = {}\n    for src, dst in sorted(tickets, reverse=True):\n        adj.setdefault(src, []).append(dst)\n    route = []\n    def visit(airport):\n        while adj.get(airport):\n            visit(adj[airport].pop())\n        route.append(airport)\n    visit('JFK')\n    return route[::-1]",
    walkthrough: "Sorted-reverse insertion makes list.pop() hand back the smallest destination. Trace: JFK flies ATL (smallest), ATL flies JFK, JFK flies SFO, SFO flies ATL, ATL flies SFO — stuck at SFO → record. Unwinding records ATL, SFO, JFK, ATL, JFK; reversed: JFK ATL JFK SFO ATL SFO. The dead end became a middle segment — the theorem doing the debugging.",
    testCode: "assert find_itinerary([['JFK', 'SFO'], ['JFK', 'ATL'], ['SFO', 'ATL'], ['ATL', 'JFK'], ['ATL', 'SFO']]) == ['JFK', 'ATL', 'JFK', 'SFO', 'ATL', 'SFO']\nassert find_itinerary([['JFK', 'KUL'], ['JFK', 'NRT'], ['NRT', 'JFK']]) == ['JFK', 'NRT', 'JFK', 'KUL']\nassert find_itinerary([['JFK', 'B']]) == ['JFK', 'B']\nprint('All tests passed!')"
  },
  {
    id: 143, stage: 25, title: "Moving Average", pattern: "fixed-size deque", skill: "the window keeps itself", difficulty: "Easy",
    statement: "Design a stream reader: MovingAverage(size) with next(val) returning the average of the last `size` values (or all values so far). Each call must be O(1).",
    examples: [
      { input: "size = 3: next(1), next(10), next(3), next(5)", output: "1.0, 5.5, 4.666..., 6.0" },
      { input: "size = 1: next(4), next(7)", output: "4.0, 7.0" },
    ],
    why: "Stage 2's fixed-window sum, promoted to a design problem: the deque holds the window, a running sum avoids recomputation, and eviction is popleft. This is also your first amortized-design contract: every operation O(1) regardless of stream length. Design problems grade the INVARIANT, not the code.",
    starterCode: "from collections import deque\n\nclass MovingAverage:\n    def __init__(self, size):\n        pass",
    hints: [
      "Deque holds at most `size` values; a scalar holds their sum.",
      "next: append val and add to sum; if the deque overflows, popleft and subtract.",
      "Return sum / len(deque)."
    ],
    solution: "from collections import deque\n\nclass MovingAverage:\n    def __init__(self, size):\n        self.size = size\n        self.window = deque()\n        self.total = 0\n    def next(self, val):\n        self.window.append(val)\n        self.total += val\n        if len(self.window) > self.size:\n            self.total -= self.window.popleft()\n        return self.total / len(self.window)",
    walkthrough: "The invariant: window holds exactly the last min(size, seen) values and total equals their sum — both maintained in one append and at most one popleft. The fourth call evicts the 1: (10 + 3 + 5)/3 = 6.0. Note the honest division by the CURRENT length: the first calls average a partial window.",
    testCode: "m = MovingAverage(3)\nassert m.next(1) == 1.0\nassert abs(m.next(10) - 5.5) < 1e-9\nassert abs(m.next(3) - 14 / 3) < 1e-9\nassert m.next(5) == 6.0\nm2 = MovingAverage(1)\nassert m2.next(4) == 4.0\nassert m2.next(7) == 7.0\nprint('All tests passed!')"
  },
  {
    id: 144, stage: 25, title: "Insert Delete GetRandom", pattern: "dict + array swap-pop", skill: "two structures, one contract", difficulty: "Medium",
    statement: "Design a set with insert(val), remove(val), and get_random() (uniform random element) — all average O(1).",
    examples: [
      { input: "insert 1, remove 2, insert 2, remove 1, get_random, insert 2 again", output: "True, False, True, True, 2, False" },
    ],
    why: "A dict gives O(1) insert/remove but O(n) uniform random; an array gives O(1) random but O(n) remove. The composite: array holds elements, dict maps each to its array INDEX. Removal is the trick — overwrite the victim with the LAST element (dict-updating the moved element's index) and pop: swap-to-end deletion, the same move heapsort uses. Combining structures so each covers the other's weakness is THE design pattern.",
    starterCode: "import random\n\nclass RandomizedSet:\n    def __init__(self):\n        pass",
    hints: [
      "vals = []; index = {val: position}.",
      "insert: skip if in index; else append and record.",
      "remove: move the last element into the victim's slot (update its index), pop, delete the key."
    ],
    solution: "import random\n\nclass RandomizedSet:\n    def __init__(self):\n        self.vals = []\n        self.index = {}\n    def insert(self, val):\n        if val in self.index:\n            return False\n        self.index[val] = len(self.vals)\n        self.vals.append(val)\n        return True\n    def remove(self, val):\n        if val not in self.index:\n            return False\n        pos = self.index[val]\n        last = self.vals[-1]\n        self.vals[pos] = last\n        self.index[last] = pos\n        self.vals.pop()\n        del self.index[val]\n        return True\n    def get_random(self):\n        return random.choice(self.vals)",
    walkthrough: "remove(1) from [1, 2]: last (2) copies into slot 0, its index updates, pop, delete key — array stays dense, so random.choice is uniform in O(1). Removing the LAST element works too (self-copy, harmless). Every failure mode (duplicate insert, missing remove) returns False instead of throwing: the API contract is part of the design.",
    testCode: "s = RandomizedSet()\nassert s.insert(1) == True\nassert s.remove(2) == False\nassert s.insert(2) == True\nassert s.get_random() in (1, 2)\nassert s.remove(1) == True\nassert s.get_random() == 2\nassert s.insert(2) == False\nassert s.insert(3) == True\nprint('All tests passed!')"
  },
  {
    id: 145, stage: 25, title: "Add And Search Words", pattern: "trie with wildcard DFS", skill: "the dot branches", difficulty: "Medium",
    statement: "Design a word dictionary: add_word(word) and search(word), where search patterns may contain '.' matching ANY single letter. All lowercase a-z.",
    examples: [
      { input: "add 'bad', 'dad', 'mad'; search 'pad', 'bad', '.ad', 'b..'", output: "False, True, True, True" },
      { input: "search '...' after the adds", output: "True", explain: "matches bad, dad, or mad" },
    ],
    why: "Stage 16's trie stores exact prefixes; the wildcard turns search into a tiny BACKTRACK (stage 8): '.' means 'try every child'. Structure + recursion compose without ceremony — the trie prunes by prefix while the DFS explores by wildcard. Recognizing when a data structure needs a search procedure attached (rather than a lookup) is the design instinct.",
    starterCode: "class WordDictionary:\n    def __init__(self):\n        pass",
    hints: [
      "Standard trie: children dict + end flag.",
      "search: walk literal characters as usual; on '.', recurse into every child.",
      "Success = the walk consumed the whole pattern AND landed on an end flag."
    ],
    solution: "class WordDictionary:\n    def __init__(self):\n        self.children = {}\n        self.end = False\n    def add_word(self, word):\n        node = self\n        for ch in word:\n            if ch not in node.children:\n                node.children[ch] = WordDictionary()\n            node = node.children[ch]\n        node.end = True\n    def search(self, word):\n        def match(node, i):\n            if i == len(word):\n                return node.end\n            ch = word[i]\n            if ch == '.':\n                return any(match(child, i + 1) for child in node.children.values())\n            if ch not in node.children:\n                return False\n            return match(node.children[ch], i + 1)\n        return match(self, 0)",
    walkthrough: "'.ad' branches at the root into three subtrees but converges fast — literal characters after the dot prune immediately. The i == len check REQUIRES the end flag: a prefix match ('ba' against 'bad') is not a word match. Worst case is exponential in dots, but real dictionaries keep the branching factor honest.",
    testCode: "d = WordDictionary()\nd.add_word('bad')\nd.add_word('dad')\nd.add_word('mad')\nassert d.search('pad') == False\nassert d.search('bad') == True\nassert d.search('.ad') == True\nassert d.search('b..') == True\nassert d.search('...') == True\nassert d.search('....') == False\nassert d.search('ba') == False\nprint('All tests passed!')"
  },
  {
    id: 146, stage: 25, title: "Hit Counter", pattern: "sliding window over events", skill: "expire from the front", difficulty: "Medium",
    statement: "Design a hit counter: hit(timestamp) records a hit (multiple per second allowed) and get_hits(timestamp) returns hits in the past 5 minutes (300 seconds, inclusive window). Both should stay fast as the stream grows.",
    examples: [
      { input: "hit(1), hit(2), hit(3); get_hits(4); hit(300); get_hits(300); get_hits(301)", output: "3, 4, 3" },
    ],
    why: "Stage 2's window, in time rather than indices: a deque of timestamps, expire-from-the-front while older than the horizon. The design question the problem is really asking: what do you store when the SAME second can hold thousands of hits? (Pair timestamps with counts — the optimization the walkthrough discusses.) Expire-on-read keeps both operations proportional to the live window.",
    starterCode: "from collections import deque\n\nclass HitCounter:\n    def __init__(self):\n        pass",
    hints: [
      "Deque of timestamps; hit appends.",
      "get_hits(t): while the front satisfies t - front >= 300, popleft. Return the remaining length.",
      "Hits are non-decreasing in timestamp — the deque is always sorted, so expiry is safe."
    ],
    solution: "from collections import deque\n\nclass HitCounter:\n    def __init__(self):\n        self.hits = deque()\n    def hit(self, timestamp):\n        self.hits.append(timestamp)\n    def get_hits(self, timestamp):\n        while self.hits and timestamp - self.hits[0] >= 300:\n            self.hits.popleft()\n        return len(self.hits)",
    walkthrough: "get_hits(300) keeps everything with t - front < 300: hits 1, 2, 3 (299..297 ago) all survive, plus 300 → 4. At 301, hit 1 expires (301-1 = 300 ≥ 300) → 3. The monotone clock is the load-bearing assumption — out-of-order timestamps would need a different structure (bucketed counts), which is exactly the scale-up this design points at.",
    testCode: "h = HitCounter()\nh.hit(1)\nh.hit(2)\nh.hit(3)\nassert h.get_hits(4) == 3\nh.hit(300)\nassert h.get_hits(300) == 4\nassert h.get_hits(301) == 3\nassert h.get_hits(601) == 0\nprint('All tests passed!')"
  },
  {
    id: 147, stage: 25, title: "Snapshot Array", pattern: "per-key versioned history", skill: "binary search the version", difficulty: "Hard",
    statement: "Design SnapshotArray(length): set(index, val), snap() (returns snapshot id), get(index, snap_id) returns the value at that index in that snapshot. set/get must be efficient even with many snapshots.",
    examples: [
      { input: "arr = SnapshotArray(2); set(0, 5); snap(); set(0, 6); snap(); get(0, 0); get(0, 1); get(1, 0); get(1, 1)", output: "0, 5, 6, 0, 0" },
    ],
    why: "Copying the whole array per snapshot is O(n) per snap — the naive death. The design move: store per-index a history of (snap_id, value) APPENDED only when the value changes. get is then 'the last entry at or before snap_id' — a binary search (stage 4). Versioned storage + boundary search: the same shape as git internals and time-travel databases. You already own every tool; the design is choosing which to point where.",
    starterCode: "import bisect\n\nclass SnapshotArray:\n    def __init__(self, length):\n        pass",
    hints: [
      "Each index keeps a list of (snap_id, val) pairs, starting with [( -1, 0 )].",
      "set: if the index's last entry has the current snap id, overwrite it; else append.",
      "snap: increment and return the counter. get: bisect the index's snap ids for the rightmost <= snap_id."
    ],
    solution: "import bisect\n\nclass SnapshotArray:\n    def __init__(self, length):\n        self.snap_id = 0\n        self.history = [[(-1, 0)] for _ in range(length)]\n    def set(self, index, val):\n        entries = self.history[index]\n        if entries[-1][0] == self.snap_id:\n            entries[-1] = (self.snap_id, val)\n        else:\n            entries.append((self.snap_id, val))\n    def snap(self):\n        self.snap_id += 1\n        return self.snap_id - 1\n    def get(self, index, snap_id):\n        entries = self.history[index]\n        ids = [e[0] for e in entries]\n        pos = bisect.bisect_right(ids, snap_id) - 1\n        return entries[pos][1]",
    walkthrough: "get(0, 0) with history [(-1, 0), (0, 5), (1, 6)]: bisect_right for 0 lands after (0, 5) → 5. get(0, 1) → 6. get(1, *) → history [(-1, 0)] → 0. Snapshots cost O(1) (a counter tick!); sets cost O(1) amortized; gets cost O(log changes-for-that-index) — the naive design's O(n) per snap is gone because history is SPARSE: only real changes are stored.",
    testCode: "arr = SnapshotArray(2)\narr.set(0, 5)\nassert arr.snap() == 0\narr.set(0, 6)\nassert arr.snap() == 1\nassert arr.get(0, 0) == 5\nassert arr.get(0, 1) == 6\nassert arr.get(1, 0) == 0\nassert arr.get(1, 1) == 0\narr.set(0, 7)\nassert arr.get(0, 1) == 6\nassert arr.snap() == 2\nassert arr.get(0, 2) == 7\nprint('All tests passed!')"
  },
  {
    id: 148, stage: 25, title: "LFU Cache", pattern: "frequency buckets", skill: "the final design boss", difficulty: "Hard",
    statement: "Design an LFU (least frequently used) cache with capacity cap: get(key), put(key, value). Evict the least-frequently-used item; ties break to least-recently-used. Both operations O(1) average.",
    examples: [
      { input: "cap = 2: put(1,1), put(2,2), get(1), put(3,3), get(2), get(3), put(4,4), get(1), get(3), get(4)", output: "1, -1, 3, -1, 3, 4" },
    ],
    why: "The ladder's final boss is a three-way composition: the dict for O(1) lookup (LRU, problem 45), FREQUENCY BUCKETS (a dict from count → ordered dict of keys at that count) so promotion is unlink-and-relink, and a min_freq pointer that only ever moves DOWN (invalidated buckets pop off) or resets to 1 on insert. Every idea since stage 7's LRU — invariants, amortization, composite structures — is load-bearing here. Design problems do not test knowledge; they test whether your invariants survive contact with eviction.",
    starterCode: "class LFUCache:\n    def __init__(self, cap):\n        pass",
    hints: [
      "key_to_val: key -> value. buckets: freq -> {key: value} in recency order (Python dicts keep insertion order).",
      "Promote on get/put-hit: move the key from bucket f to bucket f+1 (append = most recent); if bucket f empties AND f == min_freq, min_freq += 1.",
      "Eviction: the FIRST key of buckets[min_freq]; new entries go to bucket 1 with min_freq = 1."
    ],
    solution: "class LFUCache:\n    def __init__(self, cap):\n        self.cap = cap\n        self.key_to_val = {}\n        self.buckets = {1: {}}\n        self.key_to_freq = {}\n        self.min_freq = 1\n    def _promote(self, key):\n        freq = self.key_to_freq[key]\n        val = self.buckets[freq].pop(key)\n        if not self.buckets[freq] and freq == self.min_freq:\n            self.min_freq += 1\n        self.key_to_freq[key] = freq + 1\n        self.buckets.setdefault(freq + 1, {})[key] = val\n        return val\n    def get(self, key):\n        if key not in self.key_to_val:\n            return -1\n        return self._promote(key)\n    def put(self, key, value):\n        if self.cap <= 0:\n            return\n        if key in self.key_to_val:\n            self._promote(key)\n            self.key_to_val[key] = value\n            self.buckets[self.key_to_freq[key]][key] = value\n            return\n        if len(self.key_to_val) >= self.cap:\n            evict = next(iter(self.buckets[self.min_freq]))\n            del self.buckets[self.min_freq][evict]\n            del self.key_to_val[evict]\n            del self.key_to_freq[evict]\n        self.key_to_val[key] = value\n        self.key_to_freq[key] = 1\n        self.buckets.setdefault(1, {})[key] = value\n        self.min_freq = 1",
    walkthrough: "The example: get(1) promotes 1 to freq 2; put(3,3) evicts via min_freq = 1 → bucket {2} → evicts 2 (1 is at freq 2); get(3) promotes 3 to freq 2; put(4,4) evicts from min_freq = 2's front — 1 (used earlier than 3) — the tie-break falls out of insertion order for free. min_freq's two rules (increment when its bucket empties, reset to 1 on fresh insert) are the invariants that keep eviction O(1). One hundred forty-eight problems later: this is what mastery looks like.",
    testCode: "c = LFUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nassert c.get(1) == 1\nc.put(3, 3)\nassert c.get(2) == -1\nassert c.get(3) == 3\nc.put(4, 4)\nassert c.get(1) == -1\nassert c.get(3) == 3\nassert c.get(4) == 4\nprint('All tests passed!')"
  },
]
