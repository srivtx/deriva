import type { PdbProblem } from "./pdb"

// ── PDB A: stages 0-2 — Read the Red · One-Line Lies · Watch the State ──────

export const PROBLEMS_PDB_A: PdbProblem[] = [
  // ══ STAGE 0 — Read the Red ══
  {
    id: 1, stage: 0, title: "First Red", pattern: "read-the-assert", skill: "read the failure before the code", file: "grades.py", bugCount: 1,
    statement: "CI is red on grades.py. The suite says mean() must return the plain arithmetic mean — decimals included.\n\nRun the tests. Before you touch the code: which test fails first, what was expected, what came back? The bug is one comparison symbol away.",
    examples: [
      { input: "mean([2, 3])", output: "2.5", explain: "sum 5 over 2 readings" },
      { input: "mean([1, 2, 3, 4])", output: "2.5", explain: "not 2 — decimals are part of the contract" },
    ],
    why: "Every debugging session starts the same way: at the failure, not the code. A well-written assert tells you the input, the expectation and the actual value — three facts most people guess at. Reading them first turns a hunt into a lookup.",
    starterCode: "def mean(scores):\n    \"\"\"Arithmetic mean of the scores.\"\"\"\n    return sum(scores) // len(scores)\n",
    hints: [
      "Run the tests. What does the FIRST failure claim — expected value, actual value?",
      "For mean([2, 3]) the suite expects 2.5. What does the code return, and why?",
      "// is integer (floor) division. Which division keeps the decimal?",
    ],
    solution: "def mean(scores):\n    \"\"\"Arithmetic mean of the scores.\"\"\"\n    return sum(scores) / len(scores)\n",
    walkthrough: "The failure says: mean([2, 3]) → expected 2.5, got 2.0. That is not a rounding complaint — 5 // 2 in Python is floor division, so the decimals never survive. One symbol, // → /, and the suite turns green. Notice what we did NOT do: we never read the whole file, never added a print, never guessed. The failure message contained the entire bug.",
    testCode: "check_call('mean([2, 3]) == 2.5', lambda: mean([2, 3]), 2.5)\ncheck_call('mean([1, 2, 3, 4]) == 2.5', lambda: mean([1, 2, 3, 4]), 2.5)\ncheck_call('mean([5]) == 5.0', lambda: mean([5]), 5.0)\ncheck_call('mean([-4, 4]) == 0.0', lambda: mean([-4, 4]), 0.0)\nfinish()",
    entry: "mean([2, 3])",
    pdbLoad: ["args", "p sum(scores)", "p len(scores)", "p sum(scores) / len(scores)", "c"],
  },
  {
    id: 2, stage: 0, title: "Bottom-Up", pattern: "walk-the-traceback", skill: "find the first line you own", file: "checkout.py", bugCount: 1,
    statement: "checkout.py computes a receipt from a cart of {name, qty} items. Run the tests — the whole run crashes with a KeyError.\n\nRead the traceback the way Python wrote it: bottom line first (the error), then upward to the first line that belongs to YOUR file, not the test harness. That line is the bug. Everything above it is just witnesses.",
    examples: [
      { input: "total([{'name': 'coffee', 'qty': 2}, {'name': 'mug', 'qty': 1}])", output: "19.0", explain: "2×3.5 + 1×12.0" },
      { input: "receipt(cart)", output: "'coffee: 7.00\\n...\\nTOTAL: 19.00'", explain: "per-line prices and a grand total" },
    ],
    why: "A traceback is read bottom-up: the last line names the exception, the frames above it are the journey, and the first frame inside your own file is where you can actually act. Chasing the deepest frame (here, dict lookup internals) wastes time; chasing the top frame (the test) fixes nothing.",
    starterCode: "PRICES = {\"coffee\": 3.5, \"mug\": 12.0, \"bag\": 8.0}\n\ndef price(item):\n    \"\"\"Unit price x quantity for one cart item.\"\"\"\n    return PRICES[item[\"prize\"]] * item[\"qty\"]\n\ndef total(cart):\n    \"\"\"Sum of price() over the cart.\"\"\"\n    return sum(price(item) for item in cart)\n\ndef receipt(cart):\n    \"\"\"One line per item plus a TOTAL line.\"\"\"\n    lines = [f\"{item['name']}: {price(item):.2f}\" for item in cart]\n    lines.append(f\"TOTAL: {total(cart):.2f}\")\n    return \"\\n\".join(lines)\n",
    hints: [
      "The crash is KeyError: 'prize'. At which frame does your file first appear in the traceback?",
      "What keys does a cart item actually carry? (The tests construct them.)",
      "One key in price() is misspelled. Fix that key only.",
    ],
    solution: "PRICES = {\"coffee\": 3.5, \"mug\": 12.0, \"bag\": 8.0}\n\ndef price(item):\n    \"\"\"Unit price x quantity for one cart item.\"\"\"\n    return PRICES[item[\"name\"]] * item[\"qty\"]\n\ndef total(cart):\n    \"\"\"Sum of price() over the cart.\"\"\"\n    return sum(price(item) for item in cart)\n\ndef receipt(cart):\n    \"\"\"One line per item plus a TOTAL line.\"\"\"\n    lines = [f\"{item['name']}: {price(item):.2f}\" for item in cart]\n    lines.append(f\"TOTAL: {total(cart):.2f}\")\n    return \"\\n\".join(lines)\n",
    walkthrough: "The traceback bottoms out at `KeyError: 'prize'`, and the first checkout.py frame above it is price() — specifically PRICES[item[\"prize\"]]. The cart items are built in the tests as {\"name\": ..., \"qty\": ...}; nobody ever passes a 'prize' key. One rename later the crash is gone and three tests pass. This is the whole skill: the traceback pointed at the guilty line on the first read.",
    testCode: "cart = [{\"name\": \"coffee\", \"qty\": 2}, {\"name\": \"mug\", \"qty\": 1}]\ncheck_call('total of 2 coffees + 1 mug', lambda: total(cart), 19.0)\ncheck_call('receipt ends with TOTAL line', lambda: receipt(cart).splitlines()[-1], 'TOTAL: 19.00')\ncheck_call('receipt lists each item', lambda: receipt(cart).splitlines()[0], 'coffee: 7.00')\nfinish()",
    entry: "total([{'name': 'coffee', 'qty': 2}])",
    pdbLoad: ["args", "p cart", "w", "c"],
  },
  {
    id: 3, stage: 0, title: "The Test Is the Spec", pattern: "tests-as-contract", skill: "trust the test over the prose", file: "clip.py", bugCount: 1,
    statement: "clip.py claims: 'values below lo become lo, values above hi become hi, everything else passes through.' Its docstring agrees with that. Its test suite does not agree with the code.\n\nWhen prose and tests disagree, the tests are the contract — they are what gets graded. Run them, then make the code match them, not the other way around.",
    examples: [
      { input: "clip(5, 0, 10)", output: "5", explain: "inside the range: unchanged" },
      { input: "clip(15, 0, 10)", output: "10", explain: "above hi: clamped down to hi" },
    ],
    why: "In a debugging assessment the tests are the final authority — the instructions say so explicitly. 'The docstring said so' has never made a red test green. When you find yourself arguing with a test, you have already lost; translate the test's expectation into a contract and implement exactly that.",
    starterCode: "def clip(v, lo, hi):\n    \"\"\"Clamp v into [lo, hi]: below lo -> lo, above hi -> hi.\"\"\"\n    return min(lo, max(hi, v))\n",
    hints: [
      "What does clip(5, 0, 10) return, and what should it return?",
      "max(hi, v) lifts values up to hi; min(lo, ...) then pulls everything down to lo. Is that the right order?",
      "To clamp into a range you take the max against lo first, then the min against hi. Swap the two calls.",
    ],
    solution: "def clip(v, lo, hi):\n    \"\"\"Clamp v into [lo, hi]: below lo -> lo, above hi -> hi.\"\"\"\n    return max(lo, min(hi, v))\n",
    walkthrough: "Three failures, one line. clip(5, 0, 10) returns 0 — a value inside the range got flattened. The expression min(lo, max(hi, v)) first lifts v to at least hi, then drags it down to at most lo: every interior value collapses to lo. The correct nesting is max(lo, min(hi, v)) — clamp down first, then up. The docstring was right all along; the code just never matched it. (np.clip would also pass — but the minimal fix is the swap.)",
    testCode: "check_call('clip(5, 0, 10) keeps interior', lambda: clip(5, 0, 10), 5)\ncheck_call('clip(-3, 0, 10) clamps up', lambda: clip(-3, 0, 10), 0)\ncheck_call('clip(15, 0, 10) clamps down', lambda: clip(15, 0, 10), 10)\ncheck_call('clip(0, 0, 10) keeps boundary lo', lambda: clip(0, 0, 10), 0)\ncheck_call('clip(10, 0, 10) keeps boundary hi', lambda: clip(10, 0, 10), 10)\ncheck_call('clip works elementwise on a list', lambda: [clip(v, 0, 1) for v in [-1, 0.5, 2]], [0, 0.5, 1])\nfinish()",
    entry: "clip(5, 0, 10)",
    pdbLoad: ["args", "p hi, v", "p max(hi, v)", "p min(lo, max(hi, v))", "c"],
  },
  {
    id: 4, stage: 0, title: "Count Root Causes", pattern: "one-root-many-reds", skill: "N failures ≠ N bugs", file: "dice.py", bugCount: 1,
    statement: "dice.py turns face counts into probabilities. CI reports three red tests. A beginner would fix three things. You get one look: all three failures share a single wrong expression.\n\nRun the tests, find the one line whose correction can plausibly turn all three green, and fix only that.",
    diagram: `   counts  [1, 1, 2]      probabilities must sum to 1
      │
      ├─ buggy:   n / max(n) → [0.5, 0.5, 1.0]  sums to 2  ✗
      └─ correct: n / sum(n) → [0.25, 0.25, 0.5] sums to 1 ✓`,
    examples: [
      { input: "normalize([1, 1, 2])", output: "[0.25, 0.25, 0.5]", explain: "each count over the total" },
      { input: "normalize([5, 5, 5, 5])", output: "[0.25, 0.25, 0.25, 0.25]", explain: "uniform stays uniform" },
    ],
    why: "This is the cascade lesson in miniature: several failing tests are usually echoes of one root cause. The assessment is designed that way on purpose — the grader knows candidates who fix symptoms one by one run out of time. Ask 'what single invariant, broken, would produce all of these?' before writing any fix.",
    starterCode: "import numpy as np\n\ndef normalize(counts):\n    \"\"\"Convert face counts into probabilities that sum to 1.\"\"\"\n    return counts / counts.max()\n",
    hints: [
      "What must be true of every output? Read the failing assertions, not the function name.",
      "For [1, 1, 2], the buggy version returns [0.5, 0.5, 1.0]. What single divisor would fix all three tests at once?",
      "Probabilities divide by the SUM. Dividing by the max only ever makes the largest value 1.",
    ],
    solution: "import numpy as np\n\ndef normalize(counts):\n    \"\"\"Convert face counts into probabilities that sum to 1.\"\"\"\n    return counts / counts.sum()\n",
    walkthrough: "The three failures: sums don't reach 1, a known case is wrong, uniform input doesn't flatten. All three are the same broken invariant: the divisor should make the values TOTAL 1 — that is counts.sum(), not counts.max(). Fix the one expression and every test turns green simultaneously. Time spent: one test read, one word changed. This is what triage buys you.",
    testCode: "check_call('normalize([1, 1, 2]) sums to 1', lambda: float(np.sum(normalize(np.array([1, 1, 2])))), 1.0)\ncheck_call('normalize([1, 1, 2]) values', lambda: list(np.round(normalize(np.array([1, 1, 2])), 4)), [0.25, 0.25, 0.5])\ncheck_call('normalize([2, 2, 4]) values', lambda: list(np.round(normalize(np.array([2, 2, 4])), 4)), [0.25, 0.25, 0.5])\ncheck_call('uniform input stays uniform', lambda: list(np.round(normalize(np.array([5, 5, 5, 5])), 4)), [0.25, 0.25, 0.25, 0.25])\ncheck_call('every probability within [0, 1]', lambda: bool((np.array(normalize(np.array([3, 0, 1]))) <= 1).all()), True)\nfinish()",
    entry: "normalize(np.array([1, 1, 2]))",
    pdbLoad: ["args", "p counts", "p counts.max()", "p counts.sum()", "c"],
  },

  // ══ STAGE 1 — One-Line Lies ══
  {
    id: 5, stage: 1, title: "Off by One", pattern: "off-by-one-slice", skill: "check what the loop actually sees", file: "meter.py", bugCount: 1,
    statement: "meter.py sums daily power readings. The bug report: 'every daily total looks low — by exactly the first meter reading of the day.'\n\nThat phrasing is the diagnosis. Confirm it against the loop, fix the one slice that causes it.",
    examples: [
      { input: "daily_total([10, 20, 30])", output: "60", explain: "all three readings count" },
      { input: "daily_total([5])", output: "5", explain: "a single reading is still a day" },
    ],
    why: "Off-by-one bugs announce themselves in aggregates: totals low by one element, ranges one short, loops that never see the last item. When a symptom says 'exactly the first/last X', you already know the bug is a slice or a range bound — go read it, don't re-derive the algorithm.",
    starterCode: "def daily_total(readings):\n    \"\"\"Sum of all of the day's readings.\"\"\"\n    running = 0\n    for x in readings[1:]:\n        running += x\n    return running\n",
    hints: [
      "The report says totals are low by exactly the first reading. Which expression decides where the loop starts?",
      "readings[1:] skips element 0. Was there anything upstream that already removed a header?",
      "The function receives clean data. Iterate over readings itself.",
    ],
    solution: "def daily_total(readings):\n    \"\"\"Sum of all of the day's readings.\"\"\"\n    running = 0\n    for x in readings:\n        running += x\n    return running\n",
    walkthrough: "The symptom — 'low by exactly the first reading' — predicts a loop that starts at index 1. It does: `for x in readings[1:]`. Someone copied a header-stripping slice into a function whose caller already cleaned the data. Delete the slice. The pdb panel makes it visible too: step once with n and `p x` — the first thing the loop ever sees is the second reading.",
    testCode: "check_call('daily_total([10, 20, 30])', lambda: daily_total([10, 20, 30]), 60)\ncheck_call('daily_total([5]) counts a single reading', lambda: daily_total([5]), 5)\ncheck_call('daily_total([]) is 0', lambda: daily_total([]), 0)\ncheck_call('daily_total([-2, 8, -1]) handles negatives', lambda: daily_total([-2, 8, -1]), 5)\nfinish()",
    entry: "daily_total([10, 20, 30])",
    pdbLoad: ["args", "n", "n", "p x", "n", "p x", "c"],
  },
  {
    id: 6, stage: 1, title: "Strictly Wrong", pattern: "boundary-operator", skill: "read < vs <= in the contract", file: "insert.py", bugCount: 1,
    statement: "insert.py finds where a target belongs in a sorted list. The spec says LEFTMOST: among equal values, the new one goes before them (that's bisect_left).\n\nThe suite disagrees with the code only on duplicates. Run it, then decide: should the mid comparison be < or <=?",
    examples: [
      { input: "insert_point([1, 2, 2, 3], 2)", output: "1", explain: "before the existing 2s" },
      { input: "insert_point([1, 3, 5], 4)", output: "2", explain: "between 3 and 5" },
    ],
    why: "Binary search lives or dies on one comparison. `<=` walks past equal elements (bisect_right); `<` stops before them (bisect_left). Neither is 'wrong' in general — but the spec picks one, and the tests enforce it. Off-by-boundary bugs are found by testing the boundary, not by re-reading the algorithm.",
    starterCode: "def insert_point(sorted_values, target):\n    \"\"\"Leftmost index where target could be inserted, keeping order.\"\"\"\n    lo, hi = 0, len(sorted_values)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if sorted_values[mid] <= target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo\n",
    hints: [
      "Which failing test involves duplicates? What index does the suite demand?",
      "Trace insert_point([2, 2], 2) by hand: with <=, where does lo end up?",
      "To stop BEFORE equal values, the search must treat 'mid equals target' as 'go left'. Which operator does that?",
    ],
    solution: "def insert_point(sorted_values, target):\n    \"\"\"Leftmost index where target could be inserted, keeping order.\"\"\"\n    lo, hi = 0, len(sorted_values)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if sorted_values[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo\n",
    walkthrough: "The duplicate tests fail: insert_point([1, 2, 2, 3], 2) returns 2, but leftmost is 1. With `<=`, a mid value equal to the target moves lo PAST it — that is bisect_right. The spec demands bisect_left, so equality must go left: `<` sends lo to mid+1 only when the mid value is strictly smaller. One operator, contract restored. This exact < / <= decision is on the official topic list for a reason.",
    testCode: "check_call('insert_point([1, 2, 2, 3], 2) is leftmost', lambda: insert_point([1, 2, 2, 3], 2), 1)\ncheck_call('insert_point([2, 2], 2) is 0', lambda: insert_point([2, 2], 2), 0)\ncheck_call('insert_point([], 5) is 0', lambda: insert_point([], 5), 0)\ncheck_call('insert_point([1, 3, 5], 4) is 2', lambda: insert_point([1, 3, 5], 4), 2)\ncheck_call('insert_point([1, 3, 5], 0) is 0', lambda: insert_point([1, 3, 5], 0), 0)\ncheck_call('insert_point([1, 3, 5], 9) is 3', lambda: insert_point([1, 3, 5], 9), 3)\nfinish()",
    entry: "insert_point([1, 2, 2, 3], 2)",
    pdbLoad: ["args", "n", "n", "n", "p lo, hi, mid", "n", "p lo, hi, mid", "c"],
  },
  {
    id: 7, stage: 1, title: "The Default That Lingers", pattern: "mutable-default", skill: "defaults are evaluated once", file: "logbook.py", bugCount: 1,
    statement: "logbook.py records sensor readings. The spec: with no log passed in, each call starts a FRESH log; an explicitly passed log is appended to.\n\nRun the tests — the second call remembers the first. Python evaluates default arguments once, at definition time. One edit restores the contract.",
    examples: [
      { input: "log_reading(1.2) → log_reading(3.4)", output: "[3.4]", explain: "the second call must not see the first" },
      { input: "log_reading(5, log=shared)", output: "shared == [5]", explain: "explicit logs are honoured" },
    ],
    why: "A mutable default (`=[]`, `={}`) is created ONCE when the function is defined, then shared across every call that omits it. It is one of Python's most famous footguns, it is on the assessment's topic list, and in the debugger it looks like the function 'remembers' — because it literally does.",
    starterCode: "def log_reading(value, log=[]):\n    \"\"\"Append value to log (a fresh one when omitted) and return it.\"\"\"\n    log.append(value)\n    return log\n",
    hints: [
      "When is the default list object created — at each call, or once at definition?",
      "What would log_reading.func_defaults (the .__defaults__ attribute) show after two calls?",
      "The standard repair: default to None, create the list inside the body when None arrives.",
    ],
    solution: "def log_reading(value, log=None):\n    \"\"\"Append value to log (a fresh one when omitted) and return it.\"\"\"\n    if log is None:\n        log = []\n    log.append(value)\n    return log\n",
    walkthrough: "The suite's second call returns [1.2, 3.4] — the default list survived between calls, because `=[]` was evaluated once when def ran, not at call time. The debugger proves it: `p log_reading.__defaults__` shows the very object being returned. The repair is the canonical idiom: default None, build inside. Every call that omits log now gets a brand-new list; explicit logs still work.",
    testCode: "a = log_reading(1.2)\ncheck_call('first fresh log', lambda: a, [1.2])\nb = log_reading(3.4)\ncheck_call('second call starts fresh', lambda: b, [3.4])\ncheck_call('first log untouched by second call', lambda: a, [1.2])\nshared = [9.0]\ncheck_call('explicit log is appended to', lambda: log_reading(5.0, log=shared), [9.0, 5.0])\nfinish()",
    entry: "log_reading(3.4)",
    pdbLoad: ["p log_reading.__defaults__", "args", "n", "p log", "c"],
  },
  {
    id: 8, stage: 1, title: "Half a Percent", pattern: "integer-division", skill: "watch for // where a fraction is owed", file: "quiz.py", bugCount: 1,
    statement: "quiz.py scores attempts as a percentage with one decimal (66.7, 87.5, ...). The gradebook shows '66' where '66.7' should be.\n\nOne operator is eating every fraction. Run the tests, confirm which, and return what the contract promises — including its rounding.",
    examples: [
      { input: "percent(2, 3)", output: "66.7", explain: "not 66 — the fraction is part of the score" },
      { input: "percent(7, 8)", output: "87.5", explain: "one decimal, always" },
    ],
    why: "`//` on numbers truncates toward negative infinity; a percentage built with it silently floors every score. The bug pair 'int division where float division was owed' and 'missing rounding' appears in real code constantly — and the failure message (66 vs 66.7) hands you both halves.",
    starterCode: "def percent(correct, total):\n    \"\"\"Percentage of correct answers, rounded to one decimal.\"\"\"\n    return 100 * correct // total\n",
    hints: [
      "percent(2, 3) returns 66. The suite wants 66.7. What does // do to 200/3?",
      "Which single-character change keeps the fraction?",
      "The contract says 'rounded to one decimal'. Which builtin rounds, and to how many places?",
    ],
    solution: "def percent(correct, total):\n    \"\"\"Percentage of correct answers, rounded to one decimal.\"\"\"\n    return round(100 * correct / total, 1)\n",
    walkthrough: "200 // 3 is 66 — the floor arrived before the round could. Swap // for / and 100*2/3 is 66.66…; the contract then demands round(x, 1) → 66.7. Two failures (2/3 and 7/8) vanish; the exact cases (1/2, 3/4) had been passing all along because 50 and 75 have no fractional part — a reminder that green tests don't certify an expression, they certify the cases you happened to try.",
    testCode: "check_call('percent(2, 3)', lambda: percent(2, 3), 66.7)\ncheck_call('percent(7, 8)', lambda: percent(7, 8), 87.5)\ncheck_call('percent(1, 2)', lambda: percent(1, 2), 50.0)\ncheck_call('percent(0, 5)', lambda: percent(0, 5), 0.0)\ncheck_call('percent(5, 5)', lambda: percent(5, 5), 100.0)\nfinish()",
    entry: "percent(2, 3)",
    pdbLoad: ["args", "p 100 * correct // total", "p 100 * correct / total", "p round(100 * correct / total, 1)", "c"],
  },
  {
    id: 9, stage: 1, title: "Immutable Evidence", pattern: "read-the-typeerror", skill: "let the exception name the design flaw", file: "censor.py", bugCount: 1,
    statement: "censor.py must blank out digits: mask_digits('room 404') → 'room ###'. Running the tests doesn't even produce failures — the run dies with a TypeError.\n\nRead the exception. It is not bad luck; it is Python telling you a design fact about strings. Rebuild the function around that fact.",
    examples: [
      { input: "mask_digits('room 404')", output: "'room ###'", explain: "each digit becomes #" },
      { input: "mask_digits('a1b2')", output: "'a#b#'", explain: "letters untouched" },
    ],
    why: "Strings are immutable: you cannot assign into them, and the TypeError says so verbatim. The habit being trained: when a run aborts with an exception, the fix is often not a tweak but a redesign around the constraint the exception just taught you. Read the message; it literally names the object that refused.",
    starterCode: "def mask_digits(word):\n    \"\"\"Replace every digit with '#'; leave other characters alone.\"\"\"\n    for i, ch in enumerate(word):\n        if ch.isdigit():\n            word[i] = \"#\"\n    return word\n",
    hints: [
      "What exactly does the TypeError say, and about which object?",
      "You cannot assign into a string. What mutable structure CAN hold characters and be assigned into?",
      "list('abc') gives ['a','b','c']; ''.join(chars) fuses them back. Rebuild the loop around a list.",
    ],
    solution: "def mask_digits(word):\n    \"\"\"Replace every digit with '#'; leave other characters alone.\"\"\"\n    chars = list(word)\n    for i, ch in enumerate(chars):\n        if ch.isdigit():\n            chars[i] = \"#\"\n    return \"\".join(chars)\n",
    walkthrough: "The run aborts at `word[i] = \"#\"` with TypeError: 'str' object does not support item assignment. That is the immutability lesson delivered by the interpreter itself. The redesign is mechanical: list(word) gives a mutable buffer, the loop assigns into the buffer, ''.join returns the finished string. Note the debugging discipline — we changed the approach the exception demanded, not the exception's symptom.",
    testCode: "check_call('mask_digits(\"room 404\")', lambda: mask_digits('room 404'), 'room ###')\ncheck_call('mask_digits(\"a1b2\")', lambda: mask_digits('a1b2'), 'a#b#')\ncheck_call('no digits means unchanged', lambda: mask_digits('cafe'), 'cafe')\ncheck_call('empty string stays empty', lambda: mask_digits(''), '')\nfinish()",
    entry: "mask_digits('a1b2')",
    pdbLoad: ["args", "n", "p i, ch", "p ch.isdigit()", "c"],
  },

  // ══ STAGE 2 — Watch the State ══
  {
    id: 10, stage: 2, title: "The Inverted Meter", pattern: "step-and-inspect", skill: "watch a value evolve line by line", file: "peak.py", bugCount: 1,
    statement: "peak.py builds the running maximum of a sensor stream. The output looks suspiciously like a running minimum.\n\nOpen the Debugger panel (commands are preloaded) and step through running_max([3, 9, 4, 7]) — print current and x at each step and watch which direction the comparison pushes. Then fix the one condition.",
    diagram: `   stream:  3   9   4   7
   want:    3   9   9   9     (running max)
   got:     3   3   3   3     (running min — inverted test)`,
    examples: [
      { input: "running_max([3, 9, 4, 7])", output: "[3, 9, 9, 9]", explain: "each output is the max so far" },
      { input: "running_max([9, 7, 8])", output: "[9, 9, 9]", explain: "a max never decreases" },
    ],
    why: "This drill installs the debugger habit loop: hypothesis ('the comparison is inverted'), session (step and p the two variables), verdict (current survives only when current > x — that keeps the SMALLER value). Reading the loop ten times cannot compete with watching it once.",
    starterCode: "def running_max(readings):\n    \"\"\"Highest reading seen so far, at each step.\"\"\"\n    out = []\n    current = readings[0]\n    for x in readings:\n        if current > x:\n            current = x\n        out.append(current)\n    return out\n",
    hints: [
      "In the debugger, after one step on [3, 9, 4, 7]: p current, x. Which one is bigger, and which one survived?",
      "The condition keeps current only when current > x. What does that branch do to the max?",
      "The update should fire when the NEW value beats the old: x > current.",
    ],
    solution: "def running_max(readings):\n    \"\"\"Highest reading seen so far, at each step.\"\"\"\n    out = []\n    current = readings[0]\n    for x in readings:\n        if x > current:\n            current = x\n        out.append(current)\n    return out\n",
    walkthrough: "The scripted session shows it immediately: step to the 9, `p current, x` prints 3 and 9 — yet current stays 3, because `current > x` was False and the update lives inside that branch. The branch was written to protect the smaller value: an inverted comparison. Swap it to `x > current` and the transcript re-runs to [3, 9, 9, 9]. One session, one flipped operator, zero guessing.",
    testCode: "check_call('running_max([3, 9, 4, 7])', lambda: running_max([3, 9, 4, 7]), [3, 9, 9, 9])\ncheck_call('running_max([9, 7, 8]) never decreases', lambda: running_max([9, 7, 8]), [9, 9, 9])\ncheck_call('running_max([5]) single reading', lambda: running_max([5]), [5])\ncheck_call('running_max([2, 2, 2]) flat line', lambda: running_max([2, 2, 2]), [2, 2, 2])\nfinish()",
    entry: "running_max([3, 9, 4, 7])",
    pdbLoad: ["n", "n", "n", "p current, x", "n", "p current, x", "n", "p current, x", "n", "p current, x", "c"],
  },
  {
    id: 11, stage: 2, title: "Walk the Stack", pattern: "stack-walk", skill: "use w / u / d to climb frames", file: "weather.py", bugCount: 1,
    statement: "weather.py converts Celsius highs to Fahrenheit, and every forecast is 32 degrees short of honest. The conversion helper is one formula piece away from correct.\n\nLoad the debugger, step into c_to_f(0), and use w (where), u (up) to see the caller. Confirm which part of  F = 9/5·C + 32 is missing, then fix it.",
    examples: [
      { input: "c_to_f(0)", output: "32.0", explain: "freezing point in Fahrenheit" },
      { input: "forecast([0, 37])", output: "[32.0, 98.6]", explain: "body temperature, honestly converted" },
    ],
    why: "w/u/d are how you answer 'who asked for this value, and with what?' without leaving the debugger. Bugs often live one frame up from where you are standing — a helper can be locally reasonable and globally wrong because the caller's contract includes a piece the helper never added.",
    starterCode: "def c_to_f(celsius):\n    \"\"\"Convert a Celsius temperature to Fahrenheit.\"\"\"\n    return celsius * 9 / 5\n\ndef forecast(celsius_readings):\n    \"\"\"Daily highs, in Fahrenheit, rounded to one decimal.\"\"\"\n    return [round(c_to_f(c), 1) for c in celsius_readings]\n",
    hints: [
      "c_to_f(0) returns 0.0. What single term of the Fahrenheit formula is missing?",
      "In the debugger: w shows the stack, u moves to forecast() — the frame that trusted this helper.",
      "The scale factor 9/5 is present; the offset is not. Add 32.",
    ],
    solution: "def c_to_f(celsius):\n    \"\"\"Convert a Celsius temperature to Fahrenheit.\"\"\"\n    return celsius * 9 / 5 + 32\n\ndef forecast(celsius_readings):\n    \"\"\"Daily highs, in Fahrenheit, rounded to one decimal.\"\"\"\n    return [round(c_to_f(c), 1) for c in celsius_readings]\n",
    walkthrough: "The session: c_to_f(0) steps to the return line, `p celsius * 9 / 5` prints 0.0, and `w` shows forecast() waiting one frame up — it faithfully rounded a wrong number. The helper implemented F = 9/5·C and dropped the +32 offset; every forecast inherited the missing 32 degrees. One term added, three tests green. The stack walk turned 'the forecast is wrong' into 'THIS line, missing THIS term'.",
    testCode: "check_call('c_to_f(0) is freezing', lambda: c_to_f(0), 32.0)\ncheck_call('c_to_f(100) is boiling', lambda: c_to_f(100), 212.0)\ncheck_call('c_to_f(37) is body temp', lambda: c_to_f(37), 98.6)\ncheck_call('forecast rounds to one decimal', lambda: forecast([0, 37]), [32.0, 98.6])\nfinish()",
    entry: "c_to_f(0)",
    pdbLoad: ["args", "p celsius", "p celsius * 9 / 5", "w", "u", "p __ENTRY", "d", "c"],
  },
  {
    id: 12, stage: 2, title: "The Silent Default", pattern: "silent-fallback", skill: "catch lookups that fail quietly", file: "gradebook.py", bugCount: 1,
    statement: "gradebook.py weights score components: quiz 0.3, exam 0.5, lab 0.2. A student's weighted score comes back 54.0 when the honest arithmetic says 81.0 — yet nothing crashed.\n\nThe weights table and the score dict disagree about one key's spelling, and .get's fallback hides the disagreement. Compare the two key sets in the debugger, then repair the constant.",
    examples: [
      { input: "weighted_score({'quiz': 90, 'exam': 80, 'lab': 70})", output: "81.0", explain: "27 + 40 + 14" },
      { input: "weighted_score({'exam': 80})", output: "40.0", explain: "missing components weigh zero — by design" },
    ],
    why: ".get(key, default) is designed to fail silently, which makes typo'd keys invisible: the code runs, the numbers are just quietly wrong. The debugging move is to interrogate the data — print both key sets and diff them — instead of re-reading logic that is actually fine.",
    starterCode: "WEIGHTS = {\"quizz\": 0.3, \"exam\": 0.5, \"lab\": 0.2}\n\ndef weighted_score(scores):\n    \"\"\"Weighted average; a missing component just weighs zero.\"\"\"\n    return sum(scores.get(k, 0.0) * w for k, w in WEIGHTS.items())\n",
    hints: [
      "The zero contribution is silent. Which component contributes 0.3 · score, and does its key match?",
      "In the debugger: p sorted(scores) and p sorted(WEIGHTS). What differs by two letters?",
      "Fix the WEIGHTS key — the .get fallback was correct for genuinely missing components.",
    ],
    solution: "WEIGHTS = {\"quiz\": 0.3, \"exam\": 0.5, \"lab\": 0.2}\n\ndef weighted_score(scores):\n    \"\"\"Weighted average; a missing component just weighs zero.\"\"\"\n    return sum(scores.get(k, 0.0) * w for k, w in WEIGHTS.items())\n",
    walkthrough: "`p sorted(scores)` prints ['exam', 'lab', 'quiz']; `p sorted(WEIGHTS)` prints ['exam', 'lab', 'quizz']. The typo means quiz's 90 pairs with .get('quizz', 0.0) → 0, and 27 points evaporate without a whisper. The fix is the constant, not the lookup: the fallback behaviour (missing component weighs zero) is part of the spec, proven by the {'exam': 80} test that was already green. Silent failures are found by diffing data, not by reading logic.",
    testCode: "check_call('full score computes 81', lambda: weighted_score({'quiz': 90, 'exam': 80, 'lab': 70}), 81.0)\ncheck_call('missing lab weighs zero', lambda: weighted_score({'quiz': 90, 'exam': 80}), 67.0)\ncheck_call('only exam still counts', lambda: weighted_score({'exam': 80}), 40.0)\ncheck_call('empty scores give 0', lambda: weighted_score({}), 0.0)\nfinish()",
    entry: "weighted_score({'quiz': 90, 'exam': 80, 'lab': 70})",
    pdbLoad: ["args", "p sorted(scores)", "p sorted(WEIGHTS)", "p scores.keys() - WEIGHTS.keys()", "c"],
  },
  {
    id: 13, stage: 2, title: "Index or Count?", pattern: "enumerate-index", skill: "watch the loop counter start", file: "pace.py", bugCount: 1,
    statement: "pace.py prints the running average of split times: after k readings, the average of those k. The run dies instantly with a ZeroDivisionError — before any averaging happened.\n\nStep through in the debugger (n, then p i, total) and watch the loop counter's first value. One arithmetic repair ends the crash and the drift.",
    examples: [
      { input: "running_avg([10, 20, 30])", output: "[10.0, 15.0, 20.0]", explain: "averages of 1, 2, then 3 readings" },
      { input: "running_avg([4])", output: "[4.0]", explain: "one reading, one average" },
    ],
    why: "enumerate hands you indices starting at 0; counts start at 1. Dividing by the index instead of the count is the classic off-by-one that crashes on entry (0 division) or, in luckier variants, drifts silently. Watching `i` in the debugger for one lap is worth ten minutes of squinting.",
    starterCode: "def running_avg(times):\n    \"\"\"After k readings, the average of those k readings.\"\"\"\n    out = []\n    total = 0\n    for i, t in enumerate(times):\n        total += t\n        out.append(total / i)\n    return out\n",
    hints: [
      "The first iteration crashes. What is i on the first iteration of enumerate?",
      "After k readings you have seen k values — but enumerate counted from 0. How do you turn index i into count k?",
      "Divide by i + 1: the first reading is the average of one reading.",
    ],
    solution: "def running_avg(times):\n    \"\"\"After k readings, the average of those k readings.\"\"\"\n    out = []\n    total = 0\n    for i, t in enumerate(times):\n        total += t\n        out.append(total / (i + 1))\n    return out\n",
    walkthrough: "The debugger session settles it in two commands: n lands on the divide, `p i, total` prints 0 and 10 — index zero, one reading seen. total / i is 10 / 0; the count is i + 1. After the fix, stepping three laps shows the sequence 10, 15, 20 building exactly as the spec draws it. ZeroDivisionError on iteration one is almost always an index-vs-count confusion, and it is visible the moment you print the counter.",
    testCode: "check_call('running_avg([10, 20, 30])', lambda: running_avg([10, 20, 30]), [10.0, 15.0, 20.0])\ncheck_call('running_avg([4]) single split', lambda: running_avg([4]), [4.0])\ncheck_call('running_avg([2, 2, 2, 2]) stays flat', lambda: running_avg([2, 2, 2, 2]), [2.0, 2.0, 2.0, 2.0])\ncheck_call('running_avg([1, 2]) grows', lambda: running_avg([1, 2]), [1.0, 1.5])\nfinish()",
    entry: "running_avg([10, 20, 30])",
    pdbLoad: ["n", "n", "n", "p i, total", "c"],
  },
]
