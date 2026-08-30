import type { PdbProblem } from "./pdb"

// ── PDB J: stages 21-22 — The Invariant · The NumPy Depths ──────────────────

export const PROBLEMS_PDB_J: PdbProblem[] = [
  // ══ STAGE 21 — The Invariant ══
  {
    id: 82, stage: 21, title: "The Evicted Present", pattern: "lru-recency", skill: "get must refresh recency", file: "cache.py", bugCount: 1,
    statement: "cache.py is an LRU cache: capacity 2, and reading a key must count as USING it. Script: put a, put b, get a, put c — a must survive, b must be evicted. CI: 'a vanished and b is still there.'\n\nThe eviction keeps the least-recently-used entry. Does get() update any recency?",
    examples: [
      { input: "put a, put b, get a, put c", output: "get(a) == 1, get(b) == None", explain: "a was just used; b is the LRU tenant" },
      { input: "LRU(1): put x, put y", output: "get(y) == 2, get(x) == None", explain: "capacity 1 keeps the newest" },
    ],
    why: "OrderedDict's move_to_end is the only thing marking a key as recently used — put() does it, but get() in this code only reads. The eviction (popitem(last=False)) then removes the OLDEST-ORDERED entry, which after a get(a) should be b, not a. Every LRU operation that 'uses' a key must refresh its position.",
    starterCode: "from collections import OrderedDict\n\n\nclass LRU:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.data = OrderedDict()\n\n    def get(self, key):\n        if key not in self.data:\n            return None\n        return self.data[key]\n\n    def put(self, key, value):\n        if key in self.data:\n            self.data.move_to_end(key)\n        self.data[key] = value\n        if len(self.data) > self.cap:\n            self.data.popitem(last=False)\n\n\ndef demo():\n    c = LRU(2)\n    c.put(\"a\", 1)\n    c.put(\"b\", 2)\n    c.get(\"a\")\n    c.put(\"c\", 3)\n    return c.get(\"a\")\n",
    hints: [
      "p list(c.data) right before put('c') — which key does the eviction see as oldest?",
      "The script reads a before putting c. Should that read change a's position in data?",
      "Add self.data.move_to_end(key) in get() after the membership check.",
    ],
    solution: "from collections import OrderedDict\n\n\nclass LRU:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.data = OrderedDict()\n\n    def get(self, key):\n        if key not in self.data:\n            return None\n        self.data.move_to_end(key)\n        return self.data[key]\n\n    def put(self, key, value):\n        if key in self.data:\n            self.data.move_to_end(key)\n        self.data[key] = value\n        if len(self.data) > self.cap:\n            self.data.popitem(last=False)\n\n\ndef demo():\n    c = LRU(2)\n    c.put(\"a\", 1)\n    c.put(\"b\", 2)\n    c.get(\"a\")\n    c.put(\"c\", 3)\n    return c.get(\"a\")\n",
    walkthrough: "p list(c.data) before put('c') prints ['a', 'b'] — a is oldest, so the eviction throws out the key the script JUST read. The get() touched the value but never the order; LRU stands for least-RECENTLY-used, and reading is a use. move_to_end in get() makes the read refresh the lease: a survives, b — genuinely untouched — pays the rent.",
    testCode: "c = LRU(2)\nc.put(\"a\", 1)\nc.put(\"b\", 2)\nc.get(\"a\")\nc.put(\"c\", 3)\ncheck_call('a survives (get refreshes recency)', lambda: c.get(\"a\"), 1)\ncheck_call('b was evicted as the true LRU', lambda: c.get(\"b\"), None)\nd = LRU(1)\nd.put(\"x\", 1)\nd.put(\"y\", 2)\ncheck_call('capacity 1 keeps the newest', lambda: d.get(\"y\"), 2)\ncheck_call('capacity 1 dropped the old', lambda: d.get(\"x\"), None)\ne = LRU(2)\ne.put(\"k\", 9)\ne.put(\"k\", 10)\ncheck_call('put over existing keeps it fresh', lambda: e.get(\"k\"), 10)\nfinish()",
    entry: "demo()",
    pdbLoad: ["args", "n", "n", "n", "n", "n", "p list(c.data)", "c"],
  },
  {
    id: 83, stage: 21, title: "The Deaf Matcher", pattern: "pop-without-match", skill: "pop only what matches", file: "brackets.py", bugCount: 1,
    statement: "brackets.py validates (), [], {} nesting. CI: 'the string ([)] — which crosses its brackets — is accepted.'\n\nThe stack pops on every closer. Does it ever LOOK at what it pops?",
    examples: [
      { input: "balanced('([)]')", output: "False", explain: "closers must match the top opener" },
      { input: "balanced('([{}])')", output: "True", explain: "properly nested" },
    ],
    why: "A bracket matcher's contract: pop ONLY if the stack top is the matching opener — otherwise the nesting is crossed and the string is invalid. Popping unconditionally (and popping an empty stack) accepts any permutation of brackets that merely balances in count. The comparison against the popped value IS the algorithm.",
    starterCode: "def balanced(s):\n    \"\"\"True iff (), [], {} are balanced and properly nested.\"\"\"\n    pairs = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"}\n    stack = []\n    for ch in s:\n        if ch in \"([{\":\n            stack.append(ch)\n        elif ch in pairs:\n            stack.pop()\n    return not stack\n",
    hints: [
      "Trace '([)]': what is on the stack when ')' arrives? What does the code do with it?",
      "pop() removes whatever is on top. What SHOULD happen if the top is not the matching opener?",
      "Before popping: if not stack or stack[-1] != pairs[ch]: return False.",
    ],
    solution: "def balanced(s):\n    \"\"\"True iff (), [], {} are balanced and properly nested.\"\"\"\n    pairs = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"}\n    stack = []\n    for ch in s:\n        if ch in \"([{\":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack[-1] != pairs[ch]:\n                return False\n            stack.pop()\n    return not stack\n",
    walkthrough: "The transcript walks '([)]': after two pushes the stack is ['(', '[']; then ')' arrives and stack.pop() removes the '[' without a glance — the crossing goes unnoticed, and the final emptiness stamps the string VALID. The check stack[-1] != pairs[ch] (plus the empty-stack guard that also saves ')(' from an IndexError) makes the matcher listen: pop only the matching opener, reject everything else.",
    testCode: "check_call('flat pairs', lambda: balanced('()[]{}'), True)\ncheck_call('proper nesting', lambda: balanced('([{}])'), True)\ncheck_call('crossed brackets rejected', lambda: balanced('([)]'), False)\ncheck_call('unclosed opener rejected', lambda: balanced('('), False)\ntry:\n    got = balanced(')(')\n    check('closer-first rejected', got is False, f'got {got}')\nexcept IndexError:\n    check('closer-first rejected', False, 'IndexError — pop on an empty stack')\nfinish()",
    entry: "balanced('([)]')",
    pdbLoad: ["args", "n", "n", "n", "p stack", "c"],
  },
  {
    id: 84, stage: 21, title: "The Monotonic Misread", pattern: "deque-direction", skill: "the deque must slope the right way", file: "peakscan.py", bugCount: 1,
    statement: "peakscan.py reports the max of each k-sized window using a monotonic deque. CI: 'window maxima come out as minima-adjacent garbage.'\n\nThe deque should hold indices of DECREASING values, so the front is the window's max. Watch which values get popped.",
    examples: [
      { input: "window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)", output: "[3, 3, 5, 5, 6, 7]", explain: "the canonical window-max run" },
      { input: "window_max([4, 2, 12, 11], 2)", output: "[4, 12, 12]", explain: "a rising spike dominates both windows" },
    ],
    why: "The deque maintains candidates for 'current window max', so it must be decreasing: pop from the back every value <= the newcomer, making the FRONT the maximum. Popping values >= the newcomer keeps an increasing deque — the front is the minimum, and every reported 'max' is wrong. One comparison direction is the entire data structure.",
    starterCode: "from collections import deque\n\n\ndef window_max(vals, k):\n    \"\"\"Max of each k-sized window.\"\"\"\n    out = []\n    dq = deque()\n    for i, v in enumerate(vals):\n        while dq and vals[dq[-1]] >= v:\n            dq.pop()\n        dq.append(i)\n        while dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            out.append(vals[dq[0]])\n    return out\n",
    hints: [
      "p list(dq) after a few steps: are the stored values increasing or decreasing?",
      "We want dq[0] to be the window's MAX. What must be true about the values behind it?",
      "Pop from the back while vals[dq[-1]] <= v — discard anything the newcomer dominates.",
    ],
    solution: "from collections import deque\n\n\ndef window_max(vals, k):\n    \"\"\"Max of each k-sized window.\"\"\"\n    out = []\n    dq = deque()\n    for i, v in enumerate(vals):\n        while dq and vals[dq[-1]] <= v:\n            dq.pop()\n        dq.append(i)\n        while dq[0] <= i - k:\n            dq.popleft()\n        if i >= k - 1:\n            out.append(vals[dq[0]])\n    return out\n",
    walkthrough: "p list(dq) shows increasing values — the code evicts everything SMALLER-or-equal than the newcomer and keeps big old values, so the front ends up the minimum. The invariant for window maxima is the opposite: evict dominated values (<= newcomer) so the deque decreases and dq[0] is always the largest survivor in range. Flip the comparison and the canonical run [3, 3, 5, 5, 6, 7] reappears.",
    testCode: "check_call('canonical run', lambda: window_max([1, 3, -1, -3, 5, 3, 6, 7], 3), [3, 3, 5, 5, 6, 7])\ncheck_call('rising spike dominates', lambda: window_max([4, 2, 12, 11], 2), [4, 12, 12])\ncheck_call('k=1 is the identity', lambda: window_max([3, 1, 2], 1), [3, 1, 2])\ncheck_call('whole array, one window', lambda: window_max([2, 1, 3], 3), [3])\ncheck_call('single element', lambda: window_max([9], 1), [9])\nfinish()",
    entry: "window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)",
    pdbLoad: ["args", "n", "n", "n", "n", "p list(dq)", "c"],
  },
  {
    id: 85, stage: 21, title: "The Flat Copy", pattern: "shallow-copy", skill: "copies must be deep where nesting lives", file: "config.py", bugCount: 1,
    statement: "config.py hands callers an editable copy of a nested config dict. CI: 'editing the clone's db host silently rewrites the original config.'\n\nThe copy exists — but how deep does it go? The debugger can test identity.",
    examples: [
      { input: "clone['db']['host'] = 'b'", output: "cfg['db']['host'] stays 'a'", explain: "the original must be untouched" },
      { input: "clone['debug'] = True", output: "cfg['debug'] stays False", explain: "top-level keys were never the problem" },
    ],
    why: "copy.copy duplicates only the outer dict; the inner dict is the SAME object in both — p clone['db'] is cfg['db'] prints True. Mutating a shared nested object writes through to the 'original'. Where nesting lives, the copy must be deep: copy.deepcopy (or an explicit rebuild of the nested levels).",
    starterCode: "import copy\n\n\ndef clone_config(cfg):\n    \"\"\"Independent deep copy of a nested config dict.\"\"\"\n    return copy.copy(cfg)\n",
    hints: [
      "p copy.copy(cfg) is cfg — outer level looks copied. Now p copy.copy(cfg)['db'] is cfg['db'].",
      "Which objects does copy.copy duplicate, and which does it merely reference?",
      "copy.deepcopy walks the nesting and duplicates every level.",
    ],
    solution: "import copy\n\n\ndef clone_config(cfg):\n    \"\"\"Independent deep copy of a nested config dict.\"\"\"\n    return copy.deepcopy(cfg)\n",
    walkthrough: "The transcript's identity probes say it all: copy.copy(cfg) is cfg is False (the outer dict is new) but copy.copy(cfg)['db'] is cfg['db'] is True (the nested dict is shared). Mutating the clone's db therefore mutates the original's db — the 'copy' was one level thick. deepcopy duplicates every level, and the identity probe flips to False at every depth.",
    testCode: "cfg = {'debug': False, 'db': {'host': 'a', 'retries': 2}}\nclone = clone_config(cfg)\nclone['db']['host'] = 'b'\ncheck('nested edit leaves the original untouched', cfg['db']['host'] == 'a', f\"cfg.db.host is now {cfg['db']['host']!r}\")\nclone['debug'] = True\ncheck('top-level edit is independent', cfg['debug'] is False)\ncheck_call('the clone carries its own values', lambda: (clone['db']['host'], clone['debug']), ('b', True))\nfinish()",
    entry: "clone_config({'db': {'host': 'a'}})",
    pdbLoad: ["args", "p copy.copy(cfg) is cfg", "p copy.copy(cfg)['db'] is cfg['db']", "c"],
  },

  // ══ STAGE 22 — The NumPy Depths ══
  {
    id: 86, stage: 22, title: "The View That Wasn't", pattern: "slice-view-mutation", skill: "a slice is a window, not a copy", file: "features.py", bugCount: 1,
    statement: "features.py scales a matrix's first two columns into [0, 1] and returns them — while the CALLER's matrix must stay untouched. CI: 'the returned block is right, and the original matrix is wrecked.'\n\nAsk NumPy whether block owns its memory.",
    examples: [
      { input: "X = [[1, 200, 5], [2, 300, 6], [3, 600, 7]]", output: "block [[0, 0], [0.5, 0.25], [1, 1]], X unchanged", explain: "scale a copy, keep the original" },
      { input: "block.base is None", output: "False", explain: "a view still points at X's buffer" },
    ],
    why: "Basic slicing (X[:, 0:2]) returns a VIEW: a new array object sharing the original's memory. In-place ops on the view (-=, /=) write straight into X. Fancy indexing (X[:, [0, 1]]) copies — and so does .copy(). The array's .base attribute tells you whose buffer you are touching.",
    starterCode: "import numpy as np\n\n\ndef normalize_block(X):\n    \"\"\"Scale the first two columns into [0, 1] on a COPY — X must stay untouched.\"\"\"\n    block = X[:, 0:2]\n    block -= block.min(axis=0)\n    block /= block.max(axis=0)\n    return block\n",
    hints: [
      "p block.base is None — what does the answer say about who owns the memory?",
      "The in-place -= and /= write through the view into X. Where does a real copy come from?",
      "block = X[:, 0:2].copy() — or fancy-index with X[:, [0, 1]].",
    ],
    solution: "import numpy as np\n\n\ndef normalize_block(X):\n    \"\"\"Scale the first two columns into [0, 1] on a COPY — X must stay untouched.\"\"\"\n    block = X[:, 0:2].copy()\n    block -= block.min(axis=0)\n    block /= block.max(axis=0)\n    return block\n",
    walkthrough: "p block.base is None prints False — a view's base is its parent array, the fingerprint of shared memory. The subsequent -= and /= therefore rescaled the caller's columns in place. .copy() gives block its own buffer (base becomes None), and the scaling lands only in the returned array. Slices are windows; the contract demanded a duplicate.",
    testCode: "import numpy as np\nX = np.array([[1.0, 200.0, 5.0], [2.0, 300.0, 6.0], [3.0, 600.0, 7.0]])\nsaved = X.copy()\nblock = normalize_block(X)\ncheck('X stays untouched', bool(np.array_equal(X, saved)), f'X changed: {X.tolist()}')\ncheck_call('block scaled to [0, 1]', lambda: [list(np.round(row, 4)) for row in block], [[0.0, 0.0], [0.5, 0.25], [1.0, 1.0]])\nfinish()",
    entry: "normalize_block(np.array([[1.0, 200.0, 5.0], [2.0, 300.0, 6.0], [3.0, 600.0, 7.0]]))",
    pdbLoad: ["args", "n", "p block.base is None", "c"],
  },
  {
    id: 87, stage: 22, title: "The Silent Overflow", pattern: "int-overflow", skill: "dtypes have ceilings", file: "scorelog.py", bugCount: 1,
    statement: "scorelog.py keeps a running score as a cumulative sum of deltas, returned as plain Python ints. CI: 'a score crossing two billion turns NEGATIVE.'\n\nThe small scores pass; the overflow test fails. The sum was pushed through a 32-bit accumulator on purpose — watch it wrap.",
    examples: [
      { input: "running_score([100, 100, 100])", output: "[100, 200, 300]", explain: "small scores are fine" },
      { input: "running_score([2000000000, 2000000000])", output: "[2000000000, 4000000000]", explain: "4e9 needs more than int32" },
    ],
    why: "A 32-bit accumulator tops out at 2,147,483,647; the running total of two 2e9 deltas wraps modulo 2^32 into -294,967,296 — silently, because modular arithmetic is how NumPy integer accumulation behaves by contract. The input values themselves fit easily; it is the RUNNING TOTAL that outgrew the accumulator. The dtype of the accumulation must be chosen for the largest value the sum can REACH.",
    starterCode: "import numpy as np\n\n\ndef running_score(deltas):\n    \"\"\"Cumulative score as plain Python ints — no wrapping, ever.\"\"\"\n    return np.cumsum(np.array(deltas), dtype=np.int32).tolist()\n",
    hints: [
      "p np.cumsum(np.array(deltas), dtype=np.int32) — where does 2e9 + 2e9 land?",
      "The input values fit any int type. Does the dtype of the ACCUMULATION?",
      "Accumulate in np.int64 — .tolist() then returns plain unbounded Python ints.",
    ],
    solution: "import numpy as np\n\n\ndef running_score(deltas):\n    \"\"\"Cumulative score as plain Python ints — no wrapping, ever.\"\"\"\n    return np.cumsum(np.array(deltas), dtype=np.int64).tolist()\n",
    walkthrough: "The transcript prints the forced-int32 cumsum as [2000000000, -294967296]: the second partial sum (4e9) exceeded the 32-bit ceiling of 2,147,483,647 and wrapped modulo 2^32. The inputs fit any integer type — the accumulator did not, which is the distinction the dtype choice must honor. Accumulating in int64 carries the sum comfortably, and tolist() converts back to unbounded Python ints.",
    testCode: "check_call('small scores accumulate', lambda: running_score([100, 100, 100]), [100, 200, 300])\ncheck_call('two billion plus two billion', lambda: running_score([2000000000, 2000000000]), [2000000000, 4000000000])\ncheck_call('negative direction wraps too', lambda: running_score([-2000000000, -2000000000]), [-2000000000, -4000000000])\ncheck_call('empty deltas', lambda: running_score([]), [])\nfinish()",
    entry: "running_score([2000000000, 2000000000])",
    pdbLoad: ["args", "n", "p np.array(deltas)", "p np.cumsum(np.array(deltas), dtype=np.int32)", "c"],
  },
  {
    id: 88, stage: 22, title: "The Off-By-Searchsorted", pattern: "searchsorted-side", skill: "side decides where equals land", file: "bins.py", bugCount: 1,
    statement: "bins.py locates a score's bin: edges are the boundaries and a score EQUAL to a boundary belongs to the NEXT bin. CI: 'boundary scores land in the bin below.'\n\nsearchsorted has a side switch. Print both sides for a boundary score.",
    examples: [
      { input: "bin_index([10, 20, 30], 20)", output: "2", explain: "a score of 20 belongs with the >20 crowd" },
      { input: "bin_index([10, 20, 30], 25)", output: "2", explain: "strictly between boundaries" },
    ],
    why: "np.searchsorted(edges, v, side='left') returns where v would slot BEFORE existing equals; side='right' slots AFTER them. For 'equal goes to the next bin', equals must sort to the right of the boundary. The side parameter is not a detail — it is the semantics of ties.",
    starterCode: "import numpy as np\n\n\ndef bin_index(edges, score):\n    \"\"\"Which bin a score lands in: edges are the boundaries; a score equal to\n    a boundary belongs to the NEXT bin.\"\"\"\n    return int(np.searchsorted(edges, score, side=\"left\"))\n",
    hints: [
      "p np.searchsorted(edges, score, side='left') and side='right' for score 20 — differ by what?",
      "Where does side='left' put a value equal to an existing boundary? And the spec?",
      "side='right' slots equals AFTER the boundary — the next bin.",
    ],
    solution: "import numpy as np\n\n\ndef bin_index(edges, score):\n    \"\"\"Which bin a score lands in: edges are the boundaries; a score equal to\n    a boundary belongs to the NEXT bin.\"\"\"\n    return int(np.searchsorted(edges, score, side=\"right\"))\n",
    walkthrough: "The transcript prints both sides for score 20 against edges [10, 20, 30]: side='left' gives 1 (before the existing 20), side='right' gives 2 (after it). The spec's 'equal belongs to the next bin' is precisely the right-side convention — one argument restores it. Off-by-tie bugs are invisible to strictly-between tests, which is why the boundary test is the one that caught it.",
    testCode: "check_call('strictly between boundaries', lambda: bin_index([10, 20, 30], 25), 2)\ncheck_call('boundary score goes right', lambda: bin_index([10, 20, 30], 20), 2)\ncheck_call('below the first boundary', lambda: bin_index([10, 20, 30], 5), 0)\ncheck_call('above the last boundary', lambda: bin_index([10, 20, 30], 40), 3)\ncheck_call('no edges, one bin', lambda: bin_index([], 7), 0)\nfinish()",
    entry: "bin_index([10, 20, 30], 20)",
    pdbLoad: ["args", "n", "p np.searchsorted(edges, score, side='left')", "p np.searchsorted(edges, score, side='right')", "c"],
  },
  {
    id: 89, stage: 22, title: "The Unstable Order", pattern: "argsort-tie-order", skill: "reversing an ascending sort un-renders ties", file: "leaderboard.py", bugCount: 1,
    statement: "leaderboard.py ranks players by score, descending; ties must keep entry order. CI: 'players with equal scores come out in REVERSE entry order.'\n\nThe code sorts ascending and flips with [::-1]. What does the flip do to ties?",
    examples: [
      { input: "rankings([4, 9, 9, 1])", output: "[1, 2, 0, 3]", explain: "the two 9s in entry order" },
      { input: "rankings([7, 7, 7])", output: "[0, 1, 2]", explain: "all tied: entry order" },
    ],
    why: "argsort ascending puts tied values in entry order; [::-1] then reverses EVERYTHING — including the ties, which now read backwards. The fix negates the values (descending by construction) with kind='stable', so equal keys stay in original order. Reverse of a sorted order is not the same as a sorted order of a reversed key.",
    starterCode: "import numpy as np\n\n\ndef rankings(scores):\n    \"\"\"Indices sorted by score DESC; ties keep entry order.\"\"\"\n    return np.argsort(np.array(scores))[::-1].tolist()\n",
    hints: [
      "p np.argsort(np.array(scores)) for [4, 9, 9, 1] — the tied 9s are in which order BEFORE the flip?",
      "[::-1] reverses ties along with everything else. How do you sort descending WITHOUT reversing?",
      "np.argsort(-values, kind='stable') — negated keys, stable ties.",
    ],
    solution: "import numpy as np\n\n\ndef rankings(scores):\n    \"\"\"Indices sorted by score DESC; ties keep entry order.\"\"\"\n    return np.argsort(-np.array(scores), kind=\"stable\").tolist()\n",
    walkthrough: "p np.argsort(np.array(scores)) prints [3, 0, 1, 2] — ascending, with the tied 9s (indices 1, 2) in entry order. The [::-1] flip produces [2, 1, 0, 3]: the ties have been un-rendered. Negating the array makes descending the sort's own direction, and kind='stable' pins equal keys to entry order — [1, 2, 0, 3], the leaderboard the spec ordered.",
    testCode: "check_call('ties keep entry order', lambda: rankings([4, 9, 9, 1]), [1, 2, 0, 3])\ncheck_call('all tied: entry order', lambda: rankings([7, 7, 7]), [0, 1, 2])\ncheck_call('no ties, plain descending', lambda: rankings([3, 1, 2]), [0, 2, 1])\ncheck_call('single player', lambda: rankings([5]), [0])\ncheck_call('ties at the bottom', lambda: rankings([9, 1, 1, 5]), [0, 3, 1, 2])\nfinish()",
    entry: "rankings([4, 9, 9, 1])",
    pdbLoad: ["args", "n", "p np.argsort(np.array(scores))", "p np.argsort(-np.array(scores), kind='stable')", "c"],
  },
]
