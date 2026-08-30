import type { PdbProblem } from "./pdb"

// ── PDB C: stages 7-9 — Recursion & Control · The Cascade · The Mask ────────

export const PROBLEMS_PDB_C: PdbProblem[] = [
  // ══ STAGE 7 — Recursion & Control ══
  {
    id: 29, stage: 7, title: "One Level Short", pattern: "one-level-recursion", skill: "recursion must dive, not just dip", file: "flatten.py", bugCount: 1,
    statement: "flatten.py must flatten ARBITRARILY nested lists: [1, [2, [3, [4]]]] → [1, 2, 3, 4]. Today it flattens exactly one level and gives up.\n\nRun the tests and read the actual output for the deep case. The fix is to make the recursive call the code already implies.",
    examples: [
      { input: "flatten([1, [2, [3]]])", output: "[1, 2, 3]", explain: "every level, not just the first" },
      { input: "flatten([[1], [2]])", output: "[1, 2]", explain: "the shallow case already works" },
    ],
    why: "The buggy version inlines one level of flattening (`out += item`) — the shallow tests were green all along, which is what makes this bug sneak to production. The general fix replaces 'append the sublist' with 'flatten the sublist': recursion is the difference between handling a case and handling the shape.",
    starterCode: "def flatten(nested):\n    \"\"\"Flatten arbitrarily nested lists into one flat list, in order.\"\"\"\n    out = []\n    for item in nested:\n        if isinstance(item, list):\n            out += item\n        else:\n            out.append(item)\n    return out\n",
    hints: [
      "What does the deep test actually receive — and how deep did the flattening go?",
      "out += item pastes a sublist in wholesale. What should happen to a sublist instead?",
      "Replace out += item with out += flatten(item): the function calls itself on the sublist.",
    ],
    solution: "def flatten(nested):\n    \"\"\"Flatten arbitrarily nested lists into one flat list, in order.\"\"\"\n    out = []\n    for item in nested:\n        if isinstance(item, list):\n            out += flatten(item)\n        else:\n            out.append(item)\n    return out\n",
    walkthrough: "The deep test returns [1, 2, [3]] — one level removed, then nothing. The debugger on the inner list shows `out += item` appending the intact sublist [3]: the code dipped one level and stopped. The recursive form out += flatten(item) applies the same treatment at every depth, and the base path (a non-list) appends the leaf. Classic bug shape: the shallow case passing is precisely what hid the missing recursion.",
    testCode: "check_call('deep nesting flattens fully', lambda: flatten([1, [2, [3, [4]]]]), [1, 2, 3, 4])\ncheck_call('shallow nesting still works', lambda: flatten([[1], [2]]), [1, 2])\ncheck_call('flat input passes through', lambda: flatten([1, 2, 3]), [1, 2, 3])\ncheck_call('empty input gives empty output', lambda: flatten([]), [])\ncheck_call('empty sublists vanish', lambda: flatten([1, [], [2, []]]), [1, 2])\nfinish()",
    entry: "flatten([1, [2, [3, [4]]]])",
    pdbLoad: ["args", "n", "n", "p item", "n", "p out", "c"],
  },
  {
    id: 30, stage: 7, title: "The Wrong Identity", pattern: "identity-element", skill: "accumulators start from their identity", file: "product.py", bugCount: 1,
    statement: "product.py multiplies a list of factors; product([]) must be 1 (the empty product). Every answer comes back 0.\n\nThe accumulator starts from the wrong identity element. Step through one lap in the debugger, watch result after the first multiply, and set the identity that multiplication actually has.",
    examples: [
      { input: "product([2, 3, 4])", output: "24", explain: "2 · 3 · 4" },
      { input: "product([])", output: "1", explain: "the empty product is the multiplicative identity" },
    ],
    why: "Every accumulator has an identity: 0 for sums, 1 for products, '' for concatenation, [] for appends. Starting from the wrong identity doesn't just bias the result — for products it annihilates it. 'Everything is 0' is the signature; the debugger shows exactly which line writes the first 0.",
    starterCode: "def product(xs):\n    \"\"\"Product of all values; product([]) == 1.\"\"\"\n    result = 0\n    for x in xs:\n        result *= x\n    return result\n",
    hints: [
      "Step once in the debugger: after the first multiply, what is result — and why was it inevitable?",
      "What number leaves every product unchanged when you multiply by it?",
      "Start result at 1 — the multiplicative identity. The empty list then correctly returns 1.",
    ],
    solution: "def product(xs):\n    \"\"\"Product of all values; product([]) == 1.\"\"\"\n    result = 1\n    for x in xs:\n        result *= x\n    return result\n",
    walkthrough: "One lap in the debugger: result starts at 0, and `result *= 2` leaves it at 0 forever — 0 times anything is 0. The identity element of multiplication is 1, so that is where the accumulator must start; the empty-list case then falls out correctly (no laps, result stays 1). The suite's [5] and [] tests were doing the diagnosis for you: any single-factor test convicts the seed value.",
    testCode: "check_call('product([2, 3, 4])', lambda: product([2, 3, 4]), 24)\ncheck_call('product([5]) single factor', lambda: product([5]), 5)\ncheck_call('product([]) is the empty product', lambda: product([]), 1)\ncheck_call('product([0.5, 4, 2]) handles fractions', lambda: product([0.5, 4, 2]), 4.0)\ncheck_call('product([-2, 3]) handles signs', lambda: product([-2, 3]), -6)\nfinish()",
    entry: "product([2, 3, 4])",
    pdbLoad: ["n", "p result", "n", "p result", "n", "p result", "c"],
  },
  {
    id: 31, stage: 7, title: "One Level Too Deep", pattern: "depth-off-by-one", skill: ">= vs > at the recursion floor", file: "walk.py", bugCount: 1,
    statement: "walk.py lists a filesystem tree down to max_depth levels (the root is level 0, so max_depth=0 means the root's name only). The walker stubbornly descends one level too far at every setting.\n\nThis is the depth-limit off-by-one: the guard compares with the wrong operator. Trace walk(tree, max_depth=0) and fix the guard.",
    examples: [
      { input: "walk(tree, max_depth=0)", output: "['root']", explain: "no descent at all" },
      { input: "walk(tree, max_depth=1)", output: "['root', 'a']", explain: "one level of children" },
    ],
    why: "A depth limit expresses 'nodes exist only at depths strictly less than max_depth'. With the root at depth 0, the guard must stop when depth >= max_depth — `>` lets the depth-max level still expand its children. The tree version of this bug (max_depth off by one) is a documented favourite of debugging assessments.",
    starterCode: "def walk(tree, depth=0, max_depth=2):\n    \"\"\"Names of the tree down to max_depth levels (root is level 0).\"\"\"\n    names = [tree[\"name\"]]\n    if depth > max_depth:\n        return names\n    for child in tree.get(\"children\", []):\n        names += walk(child, depth + 1, max_depth)\n    return names\n",
    hints: [
      "With max_depth=0, walk descends into the children anyway. At what depth does the guard finally fire, and when should it?",
      "A node AT the limit may be named, but must not expand. Which comparison stops expansion AT the limit?",
      "Change depth > max_depth to depth >= max_depth.",
    ],
    solution: "def walk(tree, depth=0, max_depth=2):\n    \"\"\"Names of the tree down to max_depth levels (root is level 0).\"\"\"\n    names = [tree[\"name\"]]\n    if depth >= max_depth:\n        return names\n    for child in tree.get(\"children\", []):\n        names += walk(child, depth + 1, max_depth)\n    return names\n",
    walkthrough: "With max_depth=0 the buggy guard `depth > max_depth` fires only at depth 1 — after the root's children were already expanded. The contract says a max_depth=0 tree has NO nodes below the root, so the expansion must stop when depth EQUALS the limit: `>=`. Check the suite's settings — 0, 1, 2 — against the fixed guard: each truncates exactly one level later than the previous, as promised. Same off-by-one, same one-character fix as the classic tree version.",
    testCode: "tree = {\"name\": \"root\", \"children\": [\n    {\"name\": \"a\", \"children\": [{\"name\": \"a1\", \"children\": [{\"name\": \"a1x\", \"children\": []}]}]},\n    {\"name\": \"b\", \"children\": []},\n]}\ncheck_call('max_depth=0 names only the root', lambda: walk(tree, max_depth=0), [\"root\"])\ncheck_call('max_depth=1 stops at the children', lambda: walk(tree, max_depth=1), [\"root\", \"a\", \"b\"])\ncheck_call('max_depth=2 reaches grandchildren', lambda: walk(tree, max_depth=2), [\"root\", \"a\", \"a1\", \"b\"])\ncheck_call('default max_depth=2', lambda: walk(tree), [\"root\", \"a\", \"a1\", \"b\"])\nfinish()",
    entry: "walk({'name': 'root', 'children': [{'name': 'a', 'children': []}]}, max_depth=0)",
    pdbLoad: ["args", "n", "p depth, max_depth", "p depth > max_depth", "p depth >= max_depth", "c"],
  },
  {
    id: 32, stage: 7, title: "Return Halfway", pattern: "early-return", skill: "a return inside a loop ends the loop", file: "overload.py", bugCount: 1,
    statement: "overload.py finds the FIRST server over capacity, or -1 if every server is fine. On a fleet where server 1 is overloaded, it reports 'all fine'.\n\nThe search loop exits after its first lap no matter what. Watch the loop in the debugger, find the misplaced return, and let the loop finish its sweep.",
    examples: [
      { input: "first_over(50, [10, 90, 10])", output: "1", explain: "server 1 is over; the scan must reach it" },
      { input: "first_over(50, [10, 20])", output: "-1", explain: "none over capacity" },
    ],
    why: "A return statement inside a loop is a commitment to stop searching — placing it unconditionally after one lap turns a scan into a coin flip. The failing pattern ('works when the overload is first, fails when it is later') is the fingerprint; the debugger shows the loop body ending at return on iteration 0.",
    starterCode: "def first_over(capacity, loads):\n    \"\"\"Index of the first server over capacity, or -1 if none.\"\"\"\n    for i, load in enumerate(loads):\n        if load > capacity:\n            return i\n        return -1\n",
    hints: [
      "The over-capacity test at index 1 fails while the index-0 test passes. When does the loop stop looking?",
      "In the debugger, step the loop on [10, 90]: how many laps does it actually run?",
      "The `return -1` belongs AFTER the loop — the verdict when the sweep finished empty-handed.",
    ],
    solution: "def first_over(capacity, loads):\n    \"\"\"Index of the first server over capacity, or -1 if none.\"\"\"\n    for i, load in enumerate(loads):\n        if load > capacity:\n            return i\n    return -1\n",
    walkthrough: "The debugger shows it brutally: on [10, 90], lap one evaluates 10 > 50 (False), then hits `return -1` — the loop never takes a second lap, so the overloaded 90 is never seen. The -1 return was indented INTO the loop, making the function decide after one sample. Dedenting it places the verdict after the sweep: return i the moment a server is over; return -1 only when the loop completes. The suite's 'overload at index 1' test is exactly the case that distinguishes the two.",
    testCode: "check_call('finds overload at index 1', lambda: first_over(50, [10, 90, 10]), 1)\ncheck_call('finds overload at index 0', lambda: first_over(50, [90, 80]), 0)\ncheck_call('returns -1 when all fine', lambda: first_over(50, [10, 20, 30]), -1)\ncheck_call('returns -1 on an empty fleet', lambda: first_over(50, []), -1)\ncheck_call('first of several overloads wins', lambda: first_over(10, [20, 30]), 0)\nfinish()",
    entry: "first_over(50, [10, 90, 10])",
    pdbLoad: ["args", "n", "p i, load", "n", "c"],
  },

  // ══ STAGE 8 — The Cascade ══
  {
    id: 33, stage: 8, title: "The Weighted Lie", pattern: "missing-weights", skill: "one ignored input drags every consumer down", file: "grades.py", bugCount: 1,
    diagram: `   scores [90, 80]   weights [0.3, 0.7]

   mean:        (90 + 80) / 2        = 85   ✗ ignores weights
   weighted:    90·0.3 + 80·0.7      = 83   ✓

   passing( [90, 40], w=[0.2, 0.8], cut 60 ):
   mean → 65  → PASS   ✗     weighted → 50 → FAIL   ✓`,
    statement: "grades.py computes a course grade: weighted average of the components. CI is red in THREE places — the grade itself, a boundary case, and a pass/fail flag that depends on it. The bug report is one line: 'the weights are in the file but the grades look unweighted.'\n\nFind the single root. Do not touch the flag; it is downstream and innocent.",
    examples: [
      { input: "final_grade([90, 80], [0.3, 0.7])", output: "83.0", explain: "not 85 — the exam weighs more" },
      { input: "passing([90, 40], [0.2, 0.8], 60)", output: "False", explain: "the heavy component failed" },
    ],
    why: "The cascade drill: three red tests, one root. final_grade ignores its weights; passing() merely relays the lie downstream. Fixing the root turns every red green at once — and the discipline is to NOT patch the symptoms. The test suite is telling you the shape of the bug: failures clustered around one function's contract.",
    starterCode: "import numpy as np\n\ndef final_grade(scores, weights):\n    \"\"\"Weighted average of component scores (0-100).\"\"\"\n    return float(np.mean(scores))\n\ndef passing(scores, weights, threshold=60):\n    \"\"\"True when the final grade reaches the threshold.\"\"\"\n    return final_grade(scores, weights) >= threshold\n",
    hints: [
      "Which of the three failures is most UPSTREAM? Which functions consume another's output?",
      "final_grade receives weights. Where do they appear in its body? (Nowhere is an answer.)",
      "np.average(scores, weights=weights) — or the dot product float(np.dot(scores, weights)). Leave passing() alone.",
    ],
    solution: "import numpy as np\n\ndef final_grade(scores, weights):\n    \"\"\"Weighted average of component scores (0-100).\"\"\"\n    return float(np.average(scores, weights=weights))\n\ndef passing(scores, weights, threshold=60):\n    \"\"\"True when the final grade reaches the threshold.\"\"\"\n    return final_grade(scores, weights) >= threshold\n",
    walkthrough: "Read the failures upstream-first: final_grade is wrong on its own terms ([90,80] w=[.3,.7] → 85, the unweighted mean), and passing only fails because it grades with the wrong number. The root is visible in the body: weights is a parameter that never appears in the computation. np.average with weights restores the contract — and the pass/fail test, untouched, flips green by inheritance. Three reds, one edit. That asymmetry is the entire economics of root-cause debugging.",
    testCode: "check_call('grade weights the exam more', lambda: final_grade([90.0, 80.0], [0.3, 0.7]), 83.0)\ncheck_call('boundary case weights the 0 down', lambda: final_grade([100.0, 0.0], [0.9, 0.1]), 90.0)\ncheck_call('equal weights reduce to the mean', lambda: final_grade([70.0, 90.0], [0.5, 0.5]), 80.0)\ncheck_call('single component passes through', lambda: final_grade([70.0], [1.0]), 70.0)\ncheck_call('passing() inherits the fix: heavy fail drags below cut', lambda: passing([90.0, 40.0], [0.2, 0.8], 60), False)\ncheck_call('passing() still passes clear cases', lambda: passing([90.0, 80.0], [0.5, 0.5], 60), True)\nfinish()",
    entry: "final_grade(np.array([90., 80.]), np.array([0.3, 0.7]))",
    pdbLoad: ["args", "p scores", "p weights", "p np.mean(scores)", "p np.average(scores, weights=weights)", "c"],
  },
  {
    id: 34, stage: 8, title: "The Unnormalized Model", pattern: "missing-normalization", skill: "some greens stay green — the reds still share one root", file: "softmax.py", bugCount: 1,
    diagram: `   scores [0, 0] → exp → [1, 1]      (shifted by max — fine)
                    normalize → [0.5, 0.5]  ✓  ← the missing step

   greens: argmax preserved, values within [0,1]  (both hold pre-normalize)
   reds:   sum-to-1, known case, cross-entropy     (all need the sum)`,
    statement: "softmax.py converts class scores into probabilities. The suite fails in three places (probabilities, a known case, and a cross-entropy consumer) while two tests pass — and that split is the diagnosis.\n\nThe exponentiation is right; the step that makes exponentials sum to one never happened. One line.",
    examples: [
      { input: "softmax([0, 0])", output: "[0.5, 0.5]", explain: "a tie is half-and-half" },
      { input: "softmax([2.0, 1.0])[0]", output: "0.731", explain: "e²/(e²+e)" },
    ],
    why: "softmax without normalization returns raw exponentials: order-preserving (argmax stays green) but not probabilities. The pattern — greens that don't depend on the missing invariant, reds that all do — is how you locate a missing STEP rather than a wrong VALUE. One invariant, one line, three tests.",
    starterCode: "import numpy as np\n\ndef softmax(scores):\n    \"\"\"Class probabilities; they must sum to 1.\"\"\"\n    e = np.exp(scores - np.max(scores))\n    return e\n\ndef cross_entropy(scores, truth):\n    \"\"\"-log p[truth] under the model's own softmax.\"\"\"\n    p = softmax(scores)\n    return float(-np.log(p[truth]))\n",
    hints: [
      "Which tests pass, and what do the passing ones have in common? Which failing ones share?",
      "In the debugger: p e, then p e.sum(). What does the spec demand of that sum?",
      "Return e / e.sum() — the shift by max is already correct; only the normalization is missing.",
    ],
    solution: "import numpy as np\n\ndef softmax(scores):\n    \"\"\"Class probabilities; they must sum to 1.\"\"\"\n    e = np.exp(scores - np.max(scores))\n    return e / e.sum()\n\ndef cross_entropy(scores, truth):\n    \"\"\"-log p[truth] under the model's own softmax.\"\"\"\n    p = softmax(scores)\n    return float(-np.log(p[truth]))\n",
    walkthrough: "The greens (argmax preserved, values in [0,1]) are exactly the properties raw exponentials already have; the reds (sum to 1, the [0,0] tie, cross-entropy) are exactly the properties that require division by the total. That split IS the localization: nothing is wrong with the exponentiation — a step is missing after it. `p e.sum()` in the debugger shows 2.0 for the tie case instead of 1. Add the division and the consumer, cross_entropy, heals without being touched.",
    testCode: "check_call('probabilities sum to 1', lambda: float(np.sum(softmax(np.array([2.0, 1.0, 0.5])))), 1.0)\ncheck_call('a tie splits evenly', lambda: list(softmax(np.array([0.0, 0.0]))), [0.5, 0.5])\ncheck_call('known case matches e^2/(e^2+e)', lambda: round(float(softmax(np.array([2.0, 1.0]))[0]), 3), 0.731)\ncheck_call('argmax is preserved', lambda: int(np.argmax(softmax(np.array([0.1, 3.0, 1.0])))), 1)\ncheck_call('every probability is within [0, 1]', lambda: bool((softmax(np.array([1.0, 2.0, 3.0])) <= 1.0).all()), True)\ncheck_call('cross-entropy consumer heals', lambda: round(cross_entropy(np.array([2.0, 1.0]), 0), 3), round(-np.log(np.e ** 2 / (np.e ** 2 + np.e)), 3))\nfinish()",
    entry: "softmax(np.array([0.0, 0.0]))",
    pdbLoad: ["args", "n", "p e", "p e.sum()", "p e / e.sum()", "c"],
  },
  {
    id: 35, stage: 8, title: "The Broken Ruler", pattern: "shared-helper-cascade", skill: "a broken helper breaks every consumer at once", file: "percentiles.py", bugCount: 1,
    statement: "percentiles.py implements a nearest-rank percentile and two consumers (median, an outlier gate). CI: six reds, and every traceback ends in the same IndexError inside percentile().\n\nResist fixing the consumers. The ruler is broken; the readers are innocent. Repair the index arithmetic — nearest rank means index round((n−1)·q/100).",
    examples: [
      { input: "median([3, 1, 2])", output: "2", explain: "sorted [1,2,3], middle rank" },
      { input: "percentile([1..10], 25)", output: "3", explain: "rank round(9·0.25) = 2" },
    ],
    why: "When every failure funnels into one helper, the helper is the case. The buggy index int(len(xs) * q) mixes up 'count × percent' with 'rank by percent' — any q ≥ 1 indexes past the end. The consumers were correct the moment they called the helper; this is the sharpest form of 'fix the root, not the symptoms'.",
    starterCode: "def percentile(xs, q):\n    \"\"\"Nearest-rank q-th percentile (q in 0..100).\"\"\"\n    k = int(len(xs) * q)\n    return sorted(xs)[k]\n\ndef median(xs):\n    \"\"\"The 50th percentile.\"\"\"\n    return percentile(xs, 50)\n\ndef is_outlier(x, xs):\n    \"\"\"True when x exceeds the 95th percentile of xs.\"\"\"\n    return x > percentile(xs, 95)\n",
    hints: [
      "Every traceback ends at sorted(xs)[k] with an IndexError. What is k when q = 50 and len = 3?",
      "The rank of the q-th percentile in n points is round((n - 1) * q / 100) — check it by hand for median of 3.",
      "One line changes: k = round((len(xs) - 1) * q / 100). The consumers stay untouched.",
    ],
    solution: "def percentile(xs, q):\n    \"\"\"Nearest-rank q-th percentile (q in 0..100).\"\"\"\n    k = round((len(xs) - 1) * q / 100)\n    return sorted(xs)[k]\n\ndef median(xs):\n    \"\"\"The 50th percentile.\"\"\"\n    return percentile(xs, 50)\n\ndef is_outlier(x, xs):\n    \"\"\"True when x exceeds the 95th percentile of xs.\"\"\"\n    return x > percentile(xs, 95)\n",
    walkthrough: "Six failures, one shared frame: every traceback dies in percentile() with IndexError, because k = int(len·q) treats q as a multiplier instead of a percent — q=50 on 3 points asks for index 150. The consumers (median, is_outlier) never had a bug of their own. The nearest-rank formula round((n−1)·q/100) fixes the ruler once: median works, the 25th percentile lands on 3 for 1..10, the outlier gate calibrates, and q=0/100 map to the extremes. Count the edits: one.",
    testCode: "check_call('median of three', lambda: median([3, 1, 2]), 2)\ncheck_call('25th percentile of 1..10', lambda: percentile(list(range(1, 11)), 25), 3)\ncheck_call('0th percentile is the minimum', lambda: percentile([7.0, 3.0, 9.0], 0), 3.0)\ncheck_call('100th percentile is the maximum', lambda: percentile([7.0, 3.0, 9.0], 100), 9.0)\ncheck_call('extreme value is an outlier', lambda: is_outlier(100.0, list(map(float, range(1, 21)))), True)\ncheck_call('high-but-in-range value is not', lambda: is_outlier(19.0, list(map(float, range(1, 21)))), False)\nfinish()",
    entry: "percentile([3, 1, 2], 50)",
    pdbLoad: ["args", "p len(xs), q", "p int(len(xs) * q)", "p round((len(xs) - 1) * q / 100)", "c"],
  },
  {
    id: 36, stage: 8, title: "The Symptom Upstream", pattern: "misleading-traceback", skill: "the failure points at the consumer; the bug is upstream", file: "intake.py", bugCount: 1,
    statement: "intake.py parses sensor strings and reports the day's high. The suite fails INSIDE daily_high — but daily_high's filter is exactly what the spec asks for, and it is innocent.\n\nThe real defect is one frame upstream: parse_temperature promised None for unreadable strings ('--'), and something else is being returned instead. Read the contract, then fix the producer.",
    examples: [
      { input: "parse_temperature('--')", output: "None", explain: "unreadable means absent, not a number" },
      { input: "daily_high(['--', '21.5°C', '19.8°C'])", output: "21.5", explain: "the hole must not poison the max" },
    ],
    why: "The signature lesson of cascades: the traceback names the consumer, the contract names the producer. nan slips through a None-filter because 'not a number' is still a float — and max() with a nan FIRST in the list returns the nan. When a downstream function 'looks wrong' but matches its spec, walk up one frame and re-read the promise it was given.",
    starterCode: "def parse_temperature(raw):\n    \"\"\"'21.5°C' -> 21.5. Unreadable sensors ('--') -> None.\"\"\"\n    try:\n        return float(raw.strip().rstrip(\"°C\"))\n    except ValueError:\n        return float(\"nan\")\n\ndef daily_high(readings):\n    \"\"\"Highest valid reading of the raw sensor strings; None when none.\"\"\"\n    parsed = [parse_temperature(r) for r in readings]\n    valid = [p for p in parsed if p is not None]\n    return max(valid) if valid else None\n",
    hints: [
      "Check what parse_temperature('--') actually returns, then re-read its docstring. Do they agree?",
      "The consumer filters `is not None`. Which impostor still passes that filter, and where is it born?",
      "The except block returns the wrong 'absent' value. The spec's absent value is None.",
    ],
    solution: "def parse_temperature(raw):\n    \"\"\"'21.5°C' -> 21.5. Unreadable sensors ('--') -> None.\"\"\"\n    try:\n        return float(raw.strip().rstrip(\"°C\"))\n    except ValueError:\n        return None\n\ndef daily_high(readings):\n    \"\"\"Highest valid reading of the raw sensor strings; None when none.\"\"\"\n    parsed = [parse_temperature(r) for r in readings]\n    valid = [p for p in parsed if p is not None]\n    return max(valid) if valid else None\n",
    walkthrough: "daily_high does exactly what its spec says — filter Nones, take the max — yet it fails. Walk up one frame: parse_temperature promised None for unreadable strings, but its except returns float('nan'). The None-filter lets nan through (nan is not None), and max([nan, 21.5]) returns nan because every comparison against nan is False. One return value in the producer, three tests healed. The traceback lied about the location; the contract never does.",
    testCode: "check_call('parse a plain reading', lambda: parse_temperature('21.5°C'), 21.5)\ncheck_call('parse with padding', lambda: parse_temperature(' 19.8 °C '), 19.8)\ncheck_call('unreadable sensor parses to None', lambda: parse_temperature('--'), None)\ncheck_call('daily high skips the hole', lambda: daily_high(['--', '21.5°C', '19.8°C']), 21.5)\ncheck_call('no valid readings at all is None', lambda: daily_high(['--', '--']), None)\ncheck_call('empty day is None', lambda: daily_high([]), None)\nfinish()",
    entry: "daily_high(['--', '21.5°C', '19.8°C'])",
    pdbLoad: ["args", "p readings", "s", "args", "p raw", "r", "c"],
  },

  // ══ STAGE 9 — The Mask ══
  {
    id: 37, stage: 9, title: "Inside-Out Mask", pattern: "inverted-mask", skill: "print the mask, not the rows", file: "quality.py", bugCount: 1,
    statement: "quality.py keeps readings INSIDE a tolerance band [lo, hi] (bounds included). The function returns exactly the wrong rows — the rejects instead of the keeps.\n\nThe mask is inside-out. Print it element by element in the debugger for one small input, then invert it with the comparisons the spec states.",
    examples: [
      { input: "in_range([1, 5, 9], 2, 8)", output: "[5]", explain: "only 5 lies within [2, 8]" },
      { input: "in_range([2, 8], 2, 8)", output: "[2, 8]", explain: "bounds included" },
    ],
    why: "An inverted mask is silent: right shape, right dtype, complementary truth. The debugger move is unique to masks — print the MASK itself (booleans), align it under the values, and read which positions it selects. Then the fix writes itself from the spec's own words: 'inside, bounds included' → (x >= lo) & (x <= hi).",
    starterCode: "import numpy as np\n\ndef in_range(values, lo, hi):\n    \"\"\"Values within [lo, hi] (inclusive), in order.\"\"\"\n    values = np.asarray(values)\n    return list(values[(values < lo) | (values > hi)])\n",
    hints: [
      "For [1, 5, 9] with band [2, 8]: p values < lo, then p values > hi. Which positions does the | of those select?",
      "The current mask selects the complement of the contract. Which two comparisons describe 'inside, inclusive'?",
      "mask = (values >= lo) & (values <= hi) — note the & : a value must satisfy BOTH.",
    ],
    solution: "import numpy as np\n\ndef in_range(values, lo, hi):\n    \"\"\"Values within [lo, hi] (inclusive), in order.\"\"\"\n    values = np.asarray(values)\n    return list(values[(values >= lo) & (values <= hi)])\n",
    walkthrough: "For [1, 5, 9] in band [2, 8], the debugger prints the mask: values < lo → [T, F, F], values > hi → [F, F, T]; their | selects positions 0 and 2 — the rejects. The contract ('inside, inclusive') needs the conjunction values >= lo AND values <= hi, joined with & (elementwise) instead of |. Same shape, opposite meaning: masks must be read as boolean vectors, never inferred from the rows they happen to return.",
    testCode: "check_call('keeps only in-band values', lambda: in_range([1.0, 5.0, 9.0], 2.0, 8.0), [5.0])\ncheck_call('bounds are included', lambda: in_range([2.0, 8.0], 2.0, 8.0), [2.0, 8.0])\ncheck_call('order is preserved', lambda: in_range([5.0, 3.0, 7.0], 0.0, 10.0), [5.0, 3.0, 7.0])\ncheck_call('empty band result is a list', lambda: in_range([1.0, 2.0], 5.0, 6.0), [])\nfinish()",
    entry: "in_range(np.array([1., 5., 9.]), 2.0, 8.0)",
    pdbLoad: ["args", "p values", "p values < lo", "p values > hi", "p (values >= lo) & (values <= hi)", "c"],
  },
  {
    id: 38, stage: 9, title: "and Is Not &", pattern: "and-vs-bitwise", skill: "read 'truth value of an array is ambiguous' as a signpost", file: "anomalies.py", bugCount: 1,
    diagram: `   x = [-50, 0, 50],  mu = 0,  sigma = 10

   left  = x < mu - 3σ → [ T, F, F ]
   right = x > mu + 3σ → [ F, F, T ]
   either side → left | right → [ T, F, T ]   ✓ anomalies at 0 and 2`,
    statement: "anomalies.py flags readings more than 3σ from the mean, on either side. The run does not produce failures — it dies with ValueError: The truth value of an array with more than one element is ambiguous.\n\nThat message is a signpost: a chained `and` met an array. Combine the two side-masks the elementwise way — and mind the parentheses.",
    examples: [
      { input: "anomalies([-50, 0, 50], 0, 10)", output: "[0, 2]", explain: "both tails, 3σ out" },
      { input: "anomalies([0, 5, -5], 0, 10)", output: "[]", explain: "everything within 3σ" },
    ],
    why: "Python's `and` demands a single truth value; an array of booleans refuses to collapse to one — hence the (famous, examinable) ValueError. Elementwise logic needs & and | with parentheses around each comparison, because bitwise operators bind tighter than comparisons. The exception message is the diagnosis; the fix is operator-level.",
    starterCode: "import numpy as np\n\ndef anomalies(x, mu, sigma):\n    \"\"\"Indices more than 3 sigma away from mu, on either side.\"\"\"\n    x = np.asarray(x, dtype=float)\n    mask = x < mu - 3 * sigma and x > mu + 3 * sigma\n    return list(np.where(mask)[0])\n",
    hints: [
      "What does the ValueError literally complain about? Which operator demands a single truth value?",
      "Even for scalars, 'x < lo and x > hi' can never both hold. Which elementwise operator means 'either side'?",
      "mask = (x < mu - 3 * sigma) | (x > mu + 3 * sigma) — parentheses first, | between.",
    ],
    solution: "import numpy as np\n\ndef anomalies(x, mu, sigma):\n    \"\"\"Indices more than 3 sigma away from mu, on either side.\"\"\"\n    x = np.asarray(x, dtype=float)\n    mask = (x < mu - 3 * sigma) | (x > mu + 3 * sigma)\n    return list(np.where(mask)[0])\n",
    walkthrough: "The ValueError fires on the `and`: Python asks 'is this array true?' and an array of booleans refuses to answer for all its elements at once. The message alone points at the operator. The repair swaps in the elementwise | (either tail counts) wrapped in parentheses — without them, `x < mu - 3 * sigma | x` would parse the | before the comparison. The debugger's `p (x < mu - 3 * sigma) | (x > mu + 3 * sigma)` shows the two-tail mask the spec describes. 'Ambiguous truth value' should now read as 'you wanted & or |'.",
    testCode: "check_call('flags both tails', lambda: anomalies([-50.0, 0.0, 50.0], 0.0, 10.0), [0, 2])\ncheck_call('quiet stretch flags nothing', lambda: anomalies([0.0, 5.0, -5.0], 0.0, 10.0), [])\ncheck_call('only the low tail', lambda: anomalies([-100.0, 1.0, 2.0], 0.0, 10.0), [0])\ncheck_call('boundary at exactly 3 sigma is not flagged', lambda: anomalies([30.0, -30.0], 0.0, 10.0), [])\nfinish()",
    entry: "anomalies(np.array([-50., 0., 50.]), 0.0, 10.0)",
    pdbLoad: ["args", "p x < mu - 3 * sigma", "p x > mu + 3 * sigma", "p (x < mu - 3 * sigma) | (x > mu + 3 * sigma)", "c"],
  },
  {
    id: 39, stage: 9, title: "Where the Where Went", pattern: "where-arg-order", skill: "np.where(cond, if_true, if_false) — in that order", file: "relu.py", bugCount: 1,
    statement: "relu.py implements the rectifier: negatives become 0, positives pass through. The output is the exact mirror image — negatives kept, positives zeroed.\n\nnp.where's branch arguments are swapped. Confirm the argument order against its signature, then re-route.",
    examples: [
      { input: "relu([-1, 2, -3])", output: "[0, 2, 0]", explain: "negatives clipped, positives kept" },
      { input: "relu(2.0)", output: "2.0", explain: "positives untouched" },
    ],
    why: "np.where(cond, A, B) yields A where the condition is True and B where False — a signature worth reading once carefully, because swapped branches produce a perfectly-shaped, perfectly-wrong array. When output looks like the complement of intent, check the two value arguments before questioning the condition.",
    starterCode: "import numpy as np\n\ndef relu(x):\n    \"\"\"Rectified linear: negatives become 0, positives unchanged.\"\"\"\n    return np.where(x < 0, x, 0)\n",
    hints: [
      "For x = [-1, 2]: the condition x < 0 is [T, F]. The output should be [0, 2] — which array should sit in the True slot?",
      "np.where(cond, when_true, when_false). Which two arguments are in each other's seats?",
      "np.where(x < 0, 0, x) — zero where negative, the value where not.",
    ],
    solution: "import numpy as np\n\ndef relu(x):\n    \"\"\"Rectified linear: negatives become 0, positives unchanged.\"\"\"\n    return np.where(x < 0, 0, x)\n",
    walkthrough: "The condition is right; the routing is reversed. For [-1, 2], `x < 0` is [True, False] and the buggy call answers True→x (keeps −1) and False→0 (kills 2) — the mirror of the contract. Swapping the branch arguments puts 0 in the True slot and x in the False slot. A one-line mnemonic worth keeping: where(COND, WANT_WHEN_TRUE, WANT_WHEN_FALSE); when the output is the complement of the intent, the branches — not the condition — are usually swapped.",
    testCode: "check_call('negatives clip to zero', lambda: list(relu(np.array([-1.0, 2.0, -3.0]))), [0.0, 2.0, 0.0])\ncheck_call('positives pass through', lambda: float(relu(np.array(2.0))), 2.0)\ncheck_call('zero stays zero', lambda: float(relu(np.array(0.0))), 0.0)\ncheck_call('all-negative input zeroes out', lambda: list(relu(np.array([-0.5, -10.0]))), [0.0, 0.0])\nfinish()",
    entry: "relu(np.array([-1., 2., -3.]))",
    pdbLoad: ["args", "p x < 0", "p np.where(x < 0, x, 0)", "p np.where(x < 0, 0, x)", "c"],
  },
]
