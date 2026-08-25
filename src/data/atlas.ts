// Algorithm Atlas — deterministic step traces for watch-mode visualizations.

export type AtlasStep = {
  desc: string
  line: number
  values?: number[]
  compare?: number[]
  swap?: number[]
  settled?: number[]
  pointers?: { label: string; index: number }[]
  window?: [number, number]
  aux?: { label: string; value: string | number }[]
  visited?: number[]
  frontier?: number[]
  current?: number
  activeEdge?: [number, number]
  dist?: (number | null)[]
  stackItems?: string[]
  highlight?: number
}

export type AtlasViz = "array" | "graph" | "stack"

export type AtlasAlgorithm = {
  slug: string
  title: string
  family: string
  glyph: string
  blurb: string
  complexity: string
  viz: AtlasViz
  code: string
  steps: AtlasStep[]
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)

function bubbleSortSteps(input: number[]): AtlasStep[] {
  const a = [...input]
  const n = a.length
  const steps: AtlasStep[] = []
  const push = (step: Omit<AtlasStep, "values">) => steps.push({ ...step, values: [...a] })
  push({ desc: `Start: [${a.join(", ")}]. Each pass bubbles the largest remaining value to the end.`, line: 1 })
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      push({ desc: `Compare a[${j}]=${a[j]} with a[${j + 1}]=${a[j + 1]}.`, line: 5, compare: [j, j + 1], settled: range(n - i, n) })
      if (a[j] > a[j + 1]) {
        const x = a[j]
        const y = a[j + 1]
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        push({ desc: `${x} > ${y} — out of order, swap.`, line: 6, swap: [j, j + 1], settled: range(n - i, n) })
      }
    }
    push({ desc: `Pass ${i + 1} complete — a[${n - 1 - i}]=${a[n - 1 - i]} is locked in place.`, line: 3, settled: range(n - 1 - i, n) })
  }
  push({ desc: `Sorted: [${a.join(", ")}].`, line: 7, settled: range(0, n) })
  return steps
}

function mergeSortSteps(input: number[]): AtlasStep[] {
  const a = [...input]
  const n = a.length
  const steps: AtlasStep[] = []
  const push = (step: Omit<AtlasStep, "values">) => steps.push({ ...step, values: [...a] })
  push({ desc: `Start: [${a.join(", ")}]. Bottom-up merge sort — merge runs of width 1, then 2, then 4…`, line: 1 })
  let width = 1
  while (width < n) {
    for (let lo = 0; lo < n - width; lo += 2 * width) {
      const mid = lo + width
      const hi = Math.min(lo + 2 * width, n)
      const merged = a.slice(lo, mid).concat(a.slice(mid, hi)).sort((x, y) => x - y)
      a.splice(lo, hi - lo, ...merged)
      push({ desc: `Merge [${lo}..${mid}) with [${mid}..${hi}) → [${merged.join(", ")}].`, line: 8, compare: range(lo, hi) })
    }
    width *= 2
    if (width < n) push({ desc: `Run width doubles to ${width}.`, line: 9 })
  }
  push({ desc: `Sorted: [${a.join(", ")}].`, line: 10, settled: range(0, n) })
  return steps
}

function binarySearchSteps(): AtlasStep[] {
  const a = [1, 3, 5, 7, 9, 11, 13]
  const target = 11
  const steps: AtlasStep[] = []
  let lo = 0
  let hi = a.length - 1
  const base = (extra: Omit<AtlasStep, "values">): AtlasStep => ({
    ...extra,
    values: a,
    aux: [{ label: "target", value: target }],
  })
  steps.push(base({ desc: `Search for ${target} in [${a.join(", ")}]. lo=0, hi=${hi}.`, line: 2, pointers: [{ label: "lo", index: lo }, { label: "hi", index: hi }] }))
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    steps.push(base({ desc: `mid = (${lo}+${hi})/2 = ${mid}. a[mid] = ${a[mid]}.`, line: 4, pointers: [{ label: "lo", index: lo }, { label: "mid", index: mid }, { label: "hi", index: hi }], compare: [mid] }))
    if (a[mid] === target) {
      steps.push(base({ desc: `a[${mid}] = ${a[mid]} = target — found at index ${mid}.`, line: 6, settled: [mid], pointers: [{ label: "mid", index: mid }] }))
      return steps
    }
    if (a[mid] < target) {
      steps.push(base({ desc: `${a[mid]} < ${target} — the answer lives right of mid. lo = ${mid + 1}.`, line: 8, pointers: [{ label: "lo", index: mid + 1 }, { label: "hi", index: hi }] }))
      lo = mid + 1
    } else {
      steps.push(base({ desc: `${a[mid]} > ${target} — the answer lives left of mid. hi = ${mid - 1}.`, line: 10, pointers: [{ label: "lo", index: lo }, { label: "hi", index: mid - 1 }] }))
      hi = mid - 1
    }
  }
  steps.push(base({ desc: "lo passed hi — not present. Return -1.", line: 11 }))
  return steps
}

function twoPointersSteps(): AtlasStep[] {
  const a = [2, 3, 6, 8, 11]
  const target = 14
  const steps: AtlasStep[] = []
  let lo = 0
  let hi = a.length - 1
  const base = (extra: Omit<AtlasStep, "values">): AtlasStep => ({ ...extra, values: a, aux: [{ label: "target", value: target }] })
  steps.push(base({ desc: `Sorted array, find a pair summing to ${target}. lo at start, hi at end.`, line: 2, pointers: [{ label: "lo", index: lo }, { label: "hi", index: hi }] }))
  while (lo < hi) {
    const sum = a[lo] + a[hi]
    steps.push(base({ desc: `a[${lo}] + a[${hi}] = ${a[lo]} + ${a[hi]} = ${sum}.`, line: 4, pointers: [{ label: "lo", index: lo }, { label: "hi", index: hi }], compare: [lo, hi], aux: [{ label: "target", value: target }, { label: "sum", value: sum }] }))
    if (sum === target) {
      steps.push(base({ desc: `${sum} = ${target} — answer: (${lo}, ${hi}).`, line: 6, settled: [lo, hi], pointers: [{ label: "lo", index: lo }, { label: "hi", index: hi }] }))
      return steps
    }
    if (sum < target) {
      steps.push(base({ desc: `${sum} < ${target} — only moving lo up can grow the sum.`, line: 8, pointers: [{ label: "lo", index: lo + 1 }, { label: "hi", index: hi }] }))
      lo += 1
    } else {
      steps.push(base({ desc: `${sum} > ${target} — only moving hi down can shrink the sum.`, line: 10, pointers: [{ label: "lo", index: lo }, { label: "hi", index: hi - 1 }] }))
      hi -= 1
    }
  }
  steps.push(base({ desc: "Pointers crossed — no pair exists.", line: 11 }))
  return steps
}

function slidingWindowSteps(): AtlasStep[] {
  const a = [2, 1, 5, 1, 3, 2]
  const k = 3
  const steps: AtlasStep[] = []
  let window = a.slice(0, k).reduce((x, y) => x + y, 0)
  let best = window
  const base = (extra: Omit<AtlasStep, "values">): AtlasStep => ({ ...extra, values: a })
  steps.push(base({ desc: `First window [0..${k - 1}) sums to ${window}.`, line: 2, window: [0, k - 1], aux: [{ label: "window", value: window }, { label: "best", value: best }] }))
  for (let right = k; right < a.length; right++) {
    const leaving = a[right - k]
    const entering = a[right]
    window += entering - leaving
    best = Math.max(best, window)
    steps.push(base({
      desc: `Slide right to ${right}: +${entering} in, −${leaving} out → window sum ${window}. Best so far: ${best}.`,
      line: 5,
      window: [right - k + 1, right],
      compare: [right],
      aux: [{ label: "window", value: window }, { label: "best", value: best }],
    }))
  }
  steps.push(base({ desc: `Maximum fixed-window sum is ${best}.`, line: 7, window: [0, a.length - 1], settled: range(0, a.length) }))
  return steps
}

function kadaneSteps(): AtlasStep[] {
  const a = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
  const steps: AtlasStep[] = []
  let cur = a[0]
  let best = a[0]
  const base = (extra: Omit<AtlasStep, "values">): AtlasStep => ({ ...extra, values: a })
  steps.push(base({ desc: `cur = best = ${a[0]} (the first element).`, line: 2, compare: [0], aux: [{ label: "cur", value: cur }, { label: "best", value: best }] }))
  for (let i = 1; i < a.length; i++) {
    const extend = cur + a[i]
    cur = Math.max(a[i], extend)
    best = Math.max(best, cur)
    steps.push(base({
      desc: `At ${a[i]}: extend → ${extend}, restart → ${a[i]}. cur = ${cur}, best = ${best}.`,
      line: 4,
      compare: [i],
      aux: [{ label: "cur", value: cur }, { label: "best", value: best }],
    }))
  }
  steps.push(base({ desc: `Maximum subarray sum is ${best}.`, line: 6, settled: [3, 4, 5, 6] }))
  return steps
}

const GRAPH_NODES = [
  { x: 12, y: 31 },
  { x: 36, y: 10 },
  { x: 36, y: 52 },
  { x: 60, y: 31 },
  { x: 82, y: 12 },
  { x: 82, y: 50 },
]
const GRAPH_EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]]
const GRAPH_ADJ: number[][] = [[1, 2], [3], [3], [4], [5], []]

function bfsSteps(): AtlasStep[] {
  const steps: AtlasStep[] = []
  const dist: (number | null)[] = Array(6).fill(null)
  dist[0] = 0
  let queue = [0]
  const visited: number[] = [0]
  const base = (extra: Omit<AtlasStep, "dist" | "visited" | "frontier">): AtlasStep => ({ ...extra, dist: [...dist], visited: [...visited], frontier: [...queue] })
  steps.push(base({ desc: "Start at node 0 — distance 0. Queue: [0].", line: 4, current: 0 }))
  while (queue.length) {
    const node = queue.shift() as number
    steps.push(base({ desc: `Dequeue ${node} (dist ${dist[node]}). Check its neighbors.`, line: 6, current: node }))
    for (const nxt of GRAPH_ADJ[node]) {
      if (dist[nxt] == null) {
        dist[nxt] = (dist[node] as number) + 1
        queue.push(nxt)
        visited.push(nxt)
        steps.push(base({ desc: `Discover ${nxt} via edge ${node}–${nxt}: dist ${dist[nxt]}. Queue: [${queue.join(", ")}].`, line: 9, current: node, activeEdge: [node, nxt] }))
      } else {
        steps.push(base({ desc: `${nxt} already has a distance — BFS never revisits.`, line: 8, current: node, activeEdge: [node, nxt] }))
      }
    }
  }
  steps.push(base({ desc: `Queue empty. Shortest distances from 0: [${dist.map(d => d ?? "∞").join(", ")}].`, line: 11, current: undefined }))
  return steps
}

function dfsSteps(): AtlasStep[] {
  const steps: AtlasStep[] = []
  const seen = new Set<number>([0])
  let stack = [0]
  const visited: number[] = [0]
  const base = (extra: Omit<AtlasStep, "visited" | "stackItems">): AtlasStep => ({ ...extra, visited: [...visited], stackItems: stack.map(n => `node ${n}`) })
  steps.push(base({ desc: "Start at node 0. Stack: [0].", line: 3, current: 0 }))
  while (stack.length) {
    const node = stack.pop() as number
    steps.push(base({ desc: `Pop ${node} — explore deeply before going wide.`, line: 5, current: node }))
    for (const nxt of [...GRAPH_ADJ[node]].reverse()) {
      if (!seen.has(nxt)) {
        seen.add(nxt)
        visited.push(nxt)
        stack.push(nxt)
        steps.push(base({ desc: `First time seeing ${nxt} — mark and push. Stack: [${stack.join(", ")}].`, line: 9, current: node, activeEdge: [node, nxt] }))
      }
    }
  }
  steps.push(base({ desc: `Stack empty. Reachable: [${visited.join(", ")}].`, line: 10 }))
  return steps
}

const DIJKSTRA_EDGES: [number, number, number][] = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 3, 8], [3, 4, 3]]
const DIJKSTRA_ADJ: { to: number; w: number }[][] = [[{ to: 1, w: 4 }, { to: 2, w: 1 }], [{ to: 3, w: 5 }], [{ to: 1, w: 2 }, { to: 3, w: 8 }], [{ to: 4, w: 3 }], []]

function dijkstraSteps(): AtlasStep[] {
  const steps: AtlasStep[] = []
  const best: (number | null)[] = Array(5).fill(null)
  const settled: number[] = []
  let heap: { d: number; node: number }[] = [{ d: 0, node: 0 }]
  const base = (extra: Omit<AtlasStep, "dist" | "visited" | "frontier">): AtlasStep => ({ ...extra, dist: [...best], visited: [...settled], frontier: heap.map(h => h.node) })
  steps.push(base({ desc: "Start at node 0. Heap: [(0, node 0)].", line: 4, current: 0 }))
  while (heap.length) {
    heap = [...heap].sort((a, b) => a.d - b.d || a.node - b.node)
    const { d, node } = heap.shift() as { d: number; node: number }
    if (best[node] != null) {
      steps.push(base({ desc: `Pop (${d}, node ${node}) — already finalized. Lazy deletion skips it.`, line: 7, current: node }))
      continue
    }
    best[node] = d
    settled.push(node)
    steps.push(base({ desc: `Pop (${d}, node ${node}) — first pop is final. Distance ${d} locked.`, line: 8, current: node }))
    for (const { to, w } of DIJKSTRA_ADJ[node]) {
      if (best[to] == null) {
        heap.push({ d: d + w, node: to })
        steps.push(base({ desc: `Relax edge ${node}→${to} (w=${w}): candidate distance ${d + w}. Heap: [${[...heap].sort((a, b) => a.d - b.d).map(h => `(${h.d},${h.node})`).join(", ")}].`, line: 11, current: node, activeEdge: [node, to] }))
      }
    }
  }
  steps.push(base({ desc: `Heap empty. Shortest paths from 0: [${best.map(d => d ?? "∞").join(", ")}].`, line: 12 }))
  return steps
}

function callStackSteps(): AtlasStep[] {
  const steps: AtlasStep[] = []
  const push = (items: string[], desc: string, line: number, highlight?: number) =>
    steps.push({ stackItems: [...items], desc, line, highlight: highlight ?? items.length - 1 })
  push(["main()"], "main() starts — frame 1 sits at the bottom of the stack.", 6, 0)
  push(["main()", "countdown(3)"], "main calls countdown(3) — a new frame stacks on top.", 6)
  push(["main()", "countdown(3)", "countdown(2)"], "countdown(3) calls countdown(2). Nothing returns yet.", 5)
  push(["main()", "countdown(3)", "countdown(2)", "countdown(1)"], "Deeper again — countdown(1). The stack remembers exactly where to resume.", 5)
  push(["main()", "countdown(3)", "countdown(2)", "countdown(1)", "countdown(0)"], "countdown(0) hits the base case — recursion stops going down.", 3)
  push(["main()", "countdown(3)", "countdown(2)", "countdown(1)"], "countdown(0) returns 'done' — its frame pops. Control resumes in countdown(1).", 4)
  push(["main()", "countdown(3)", "countdown(2)"], "countdown(1) finishes and pops.", 4)
  push(["main()", "countdown(3)"], "countdown(2) finishes and pops.", 4)
  push(["main()"], "countdown(3) pops — the unwinding is just returns in reverse order.", 4)
  push([], "main() returns. Empty stack — the call tree was depth, not breadth.", 6)
  return steps
}

export const ATLAS_ALGORITHMS: AtlasAlgorithm[] = [
  {
    slug: "bubble-sort",
    title: "Bubble Sort",
    family: "Sorting",
    glyph: "◍",
    blurb: "The naive sort every optimization is measured against. Watch out-of-order pairs swap and the sorted tail grow.",
    complexity: "O(n²) comparisons, O(1) space",
    viz: "array",
    code: "def bubble_sort(a):\n    n = len(a)\n    for i in range(n - 1):\n        for j in range(n - 1 - i):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n    return a",
    steps: bubbleSortSteps([5, 1, 4, 2, 8]),
  },
  {
    slug: "merge-sort",
    title: "Merge Sort",
    family: "Sorting",
    glyph: "⋈",
    blurb: "Divide to width-1 runs, then merge upward. The moment two sorted runs fuse into one is the whole algorithm.",
    complexity: "O(n log n) time, O(n) space",
    viz: "array",
    code: "def merge_sort(a):\n    width = 1\n    while width < len(a):\n        for lo in range(0, len(a) - width, 2 * width):\n            mid, hi = lo + width, min(lo + 2 * width, len(a))\n            merged = sorted(a[lo:hi])\n            a[lo:hi] = merged\n        width *= 2\n    return a",
    steps: mergeSortSteps([5, 2, 9, 1, 7, 3]),
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    family: "Search",
    glyph: "⌖",
    blurb: "One comparison kills half the world. Watch lo and hi squeeze the answer into a corner.",
    complexity: "O(log n)",
    viz: "array",
    code: "def binary_search(a, target):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == target:\n            return mid\n        if a[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
    steps: binarySearchSteps(),
  },
  {
    slug: "two-pointers",
    title: "Two Pointers",
    family: "Search",
    glyph: "⇥⇤",
    blurb: "Sorted order lets each step permanently discard one candidate — the exchange argument in motion.",
    complexity: "O(n) after sorting",
    viz: "array",
    code: "def pair_with_sum(a, target):\n    lo, hi = 0, len(a) - 1\n    while lo < hi:\n        s = a[lo] + a[hi]\n        if s == target:\n            return lo, hi\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1\n    return -1, -1",
    steps: twoPointersSteps(),
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    family: "Sweep",
    glyph: "▭",
    blurb: "Enter one, leave one — the window sum updates in O(1) instead of rescanning the whole range.",
    complexity: "O(n)",
    viz: "array",
    code: "def max_window(a, k):\n    window = sum(a[:k])\n    best = window\n    for right in range(k, len(a)):\n        window += a[right] - a[right - k]\n        best = max(best, window)\n    return best",
    steps: slidingWindowSteps(),
  },
  {
    slug: "kadane",
    title: "Kadane's Algorithm",
    family: "Sweep",
    glyph: "∿",
    blurb: "At every element: extend the running block or restart from here. One greedy decision, one pass.",
    complexity: "O(n) time, O(1) space",
    viz: "array",
    code: "def max_subarray(a):\n    cur = best = a[0]\n    for x in a[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    return best",
    steps: kadaneSteps(),
  },
  {
    slug: "bfs",
    title: "Breadth-First Search",
    family: "Graphs",
    glyph: "◎",
    blurb: "A queue explores in distance layers — that is why the first arrival is always the shortest path.",
    complexity: "O(V + E)",
    viz: "graph",
    code: "from collections import deque\n\ndef bfs(adj, src):\n    dist = {src: 0}\n    q = deque([src])\n    while q:\n        node = q.popleft()\n        for nxt in adj[node]:\n            if nxt not in dist:\n                dist[nxt] = dist[node] + 1\n                q.append(nxt)\n    return dist",
    steps: bfsSteps(),
  },
  {
    slug: "dfs",
    title: "Depth-First Search",
    family: "Graphs",
    glyph: "↴",
    blurb: "A stack dives as deep as possible before backing up — watch it hug one branch, then unwind.",
    complexity: "O(V + E)",
    viz: "graph",
    code: "def dfs(adj, src):\n    seen = {src}\n    stack = [src]\n    while stack:\n        node = stack.pop()\n        for nxt in reversed(adj[node]):\n            if nxt not in seen:\n                seen.add(nxt)\n                stack.append(nxt)\n    return seen",
    steps: dfsSteps(),
  },
  {
    slug: "dijkstra",
    title: "Dijkstra",
    family: "Graphs",
    glyph: "✳",
    blurb: "Always settle the closest unfinalized node. The lazy-deletion heap makes greedy safe on weights.",
    complexity: "O(E log V)",
    viz: "graph",
    code: "import heapq\n\ndef dijkstra(adj, src, n):\n    best = {}\n    heap = [(0, src)]\n    while heap:\n        d, node = heapq.heappop(heap)\n        if node in best:\n            continue\n        best[node] = d\n        for nxt, w in adj[node]:\n            if nxt not in best:\n                heapq.heappush(heap, (d + w, nxt))\n    return best",
    steps: dijkstraSteps(),
  },
  {
    slug: "call-stack",
    title: "The Call Stack",
    family: "Structures",
    glyph: "▤",
    blurb: "Recursion is the stack, not the function. Watch frames stack up, then unwind in exact reverse.",
    complexity: "depth-proportional memory",
    viz: "stack",
    code: "def countdown(n):\n    if n == 0:\n        return 'done'\n    print(n)\n    return countdown(n - 1)\n\ncountdown(3)",
    steps: callStackSteps(),
  },
]

export const ATLAS_GRAPH = { nodes: GRAPH_NODES, edges: GRAPH_EDGES, dijkstraEdges: DIJKSTRA_EDGES }

export function getAtlasAlgorithm(slug: string): AtlasAlgorithm | undefined {
  return ATLAS_ALGORITHMS.find(algorithm => algorithm.slug === slug)
}
